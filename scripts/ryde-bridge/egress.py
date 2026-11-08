"""Private datacenter pool and durable, rolling-hour Ryde HTTP accounting."""
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import sqlite3
import time

WINDOW = 3600
LAUNCH_RESERVE = 50  # observed cold launch: 39 calls; every actual call is also checked
TRANSPORT_COOLDOWN = 15 * 60
FAILED_STARTUP_SECONDS = 25


class EgressWait(RuntimeError):
    def __init__(self, until):
        super().__init__('Datacenter request budget is unavailable')
        self.until = until


class Pool:
    def __init__(self, base):
        self.base = Path(base)
        path = self.base/'egress-config.json'
        if path.stat().st_mode & 0o077:
            raise ValueError('Datacenter config must be private')
        config = json.loads(path.read_text())
        if config.get('version') != 1 or config.get('maxRequestsPerHour') != 200:
            raise ValueError('Datacenter config requires version 1 and 200 HTTP/hour/IP')
        self.gateways = {}
        self.addresses = {}
        for row in config['gateways']:
            host = str(ipaddress.ip_address(row['host']))
            port = row['port']
            if type(port) is not int or not 1 <= port <= 65535:
                raise ValueError('Invalid datacenter port')
            if not all(isinstance(row.get(k), str) and row[k] and not any(c in row[k] for c in '\r\n') for k in ['username', 'password']):
                raise ValueError('Invalid datacenter authentication')
            if ':' in row['username']:
                raise ValueError('Invalid datacenter username')
            identity = hashlib.sha256(host.encode()).hexdigest()[:16]
            if identity in self.gateways:
                raise ValueError('Duplicate datacenter IP')
            self.gateways[identity] = dict(row, host=host)
            self.addresses[(host, port)] = identity
        if not 1 <= len(self.gateways) <= 100:
            raise ValueError('A bounded datacenter pool is required')
        dbpath = self.base/'egress.sqlite3'
        fd = os.open(dbpath, os.O_CREAT | os.O_RDWR, 0o600)
        os.close(fd)
        if dbpath.stat().st_mode & 0o077:
            raise ValueError('Datacenter accounting must be private')
        self.db = sqlite3.connect(dbpath, timeout=5, isolation_level=None)
        self.db.executescript('''
            PRAGMA journal_mode=WAL;
            PRAGMA synchronous=FULL;
            CREATE TABLE IF NOT EXISTS requests (
                id TEXT PRIMARY KEY, gateway TEXT NOT NULL, at REAL NOT NULL,
                status INTEGER, request_bytes INTEGER NOT NULL DEFAULT 0,
                response_bytes INTEGER NOT NULL DEFAULT 0);
            CREATE INDEX IF NOT EXISTS requests_gateway_at ON requests(gateway,at);
            CREATE INDEX IF NOT EXISTS requests_at ON requests(at);
            CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        ''')

    def close(self):
        self.db.close()

    def _get(self, key, default=None):
        row = self.db.execute('SELECT value FROM state WHERE key=?', (key,)).fetchone()
        return json.loads(row[0]) if row else default

    def _set(self, key, value):
        self.db.execute('INSERT OR REPLACE INTO state VALUES (?,?)', (key, json.dumps(value)))

    def _now(self, now):
        # A clock correction must never make already charged requests disappear.
        now = max(time.time() if now is None else now, self._get('clock', 0))
        self._set('clock', now)
        return now

    def _counts(self, now):
        # The gateway-first index makes GROUP BY cheap but scans the entire retained day.
        # Bound this hot query to the rolling hour before grouping its results.
        return dict(self.db.execute('SELECT gateway,count(*) FROM requests INDEXED BY requests_at WHERE at>? GROUP BY gateway', (now-WINDOW,)))

    def _available(self, now):
        hold = self._get('holdUntil', 0)
        if hold > now:
            raise EgressWait(hold)
        counts = self._counts(now)
        cooling = self._get('transportCooldowns', {})
        choices = [k for k in self.gateways if counts.get(k, 0)+LAUNCH_RESERVE <= 200 and cooling.get(k, 0) <= now]
        if choices:
            return min(choices, key=lambda k: (counts.get(k, 0), k))
        # A minute of conservatism avoids relaunching at every single expiry.
        oldest = self.db.execute('SELECT min(at) FROM requests WHERE at>?', (now-WINDOW,)).fetchone()[0]
        next_budget = (oldest or now)+WINDOW+60
        raise EgressWait(min([next_budget]+[until for until in cooling.values() if until > now]))

    def _cool_failed_startup(self, now):
        """Called after the app quits. No HTTP response is a transport failure, never a Ryde denial.

        A failed gateway charges only a few startup calls, so least-used selection otherwise picks
        it repeatedly ahead of healthy gateways whose successful launches cost about 35 calls.
        Require two settled failures, enough time for startup, and no HTTP response of any kind.
        Client cancellations during a working launch must not cool a healthy route.
        """
        active = self._get('active', {})
        # Existing active cycles predate startedAt; their lease was always exactly 150 seconds.
        began = active.get('startedAt', active['until']-150 if 'until' in active else None)
        if began is None or active.get('transportFailed') or now-began < FAILED_STARTUP_SECONDS:
            return
        failed, answered = self.db.execute('''SELECT coalesce(sum(status=0),0),
            coalesce(sum(status>0),0) FROM requests WHERE gateway=? AND at>=?''',
            (active.get('gateway'), began)).fetchone()
        if failed < 2 or answered:
            return
        cooling = {key: until for key, until in self._get('transportCooldowns', {}).items() if until > now}
        cooling[active['gateway']] = now+TRANSPORT_COOLDOWN
        self._set('transportCooldowns', cooling)
        self._set('active', dict(active, transportFailed=True))
        self._set('lastTransportCooldown', {'at': now, 'gateway': active['gateway'],
                  'failedRequests': failed, 'until': now+TRANSPORT_COOLDOWN})

    def available_at(self, now=None):
        # This is only a readiness hint. Actual selection and charging still acquire the
        # write lock and recheck the budget; polling must not compete with proxy writes.
        self.db.execute('BEGIN')
        try:
            now = max(time.time() if now is None else now, self._get('clock', 0))
            self._available(now)
            return now
        except EgressWait as error:
            return error.until
        finally:
            self.db.commit()

    def begin_cycle(self, now=None):
        """Called only after the native app has quit, before its next launch."""
        self.db.execute('BEGIN IMMEDIATE')
        try:
            now = self._now(now)
            self._cool_failed_startup(now)
            identity = self._available(now)
            self._set('active', {'gateway': identity, 'startedAt': now, 'until': now+150})
            self.db.execute('DELETE FROM requests WHERE at<?', (now-86400,))
            self.db.commit()
            return identity
        except EgressWait:
            # Preserve route health even if every route is unavailable. Otherwise a single
            # broken route would be selected afresh by the next process after each failure.
            self.db.commit()
            raise
        except Exception:
            self.db.rollback()
            raise

    def warm_ready(self, now=None):
        """Reuse only the currently pinned cycle, with time/headroom for a bounded warm read."""
        self.db.execute('BEGIN')
        try:
            now=max(time.time() if now is None else now,self._get('clock',0))
            active=self._get('active',{});key=active.get('gateway')
            if self._get('holdUntil',0)>now or key not in self.gateways or active.get('until',0)<now+30:
                return False
            count=self.db.execute('SELECT count(*) FROM requests WHERE gateway=? AND at>?',(key,now-WINDOW)).fetchone()[0]
            return count+LAUNCH_RESERVE<=200
        finally:self.db.commit()

    def charge(self, request_id, request_bytes, now=None):
        """Commit before forwarding, including failed requests. Never change IP mid-cycle."""
        self.db.execute('BEGIN IMMEDIATE')
        try:
            now = self._now(now)
            if self._get('holdUntil', 0) > now:
                raise EgressWait(self._get('holdUntil'))
            active = self._get('active', {})
            identity = active.get('gateway')
            if identity not in self.gateways or active.get('until', 0) <= now:
                raise EgressWait(now+60)
            count = self.db.execute('SELECT count(*) FROM requests WHERE gateway=? AND at>?',
                                    (identity, now-WINDOW)).fetchone()[0]
            if count >= 200:
                raise EgressWait(now+WINDOW)
            self.db.execute('INSERT INTO requests(id,gateway,at,request_bytes) VALUES(?,?,?,?)',
                            (request_id, identity, now, request_bytes))
            self.db.commit()
            return identity, self.gateways[identity]
        except Exception:
            self.db.rollback()
            raise

    def settle(self, request_id, status, response_bytes, now=None):
        self.db.execute('BEGIN IMMEDIATE')
        try:
            now = self._now(now)
            self.db.execute('UPDATE requests SET status=?,response_bytes=? WHERE id=?', (status, response_bytes, request_id))
            if status in {403, 429}:
                # A real upstream refusal pauses the whole pool, not just this address.
                self._set('holdUntil', max(self._get('holdUntil', 0), now+900))
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def snapshot(self, now=None):
        now = max(time.time() if now is None else now, self._get('clock', 0))
        rows = self.db.execute('SELECT gateway,count(*),sum(request_bytes),sum(response_bytes),sum(status IN (403,429)) FROM requests GROUP BY gateway').fetchall()
        return {'at': now, 'gatewayCount': len(self.gateways), 'maxRequestsPerHour': 200,
                'holdUntil': self._get('holdUntil', 0), 'active': self._get('active'),
                'transportCooldowns': self._get('transportCooldowns', {}),
                'lastTransportCooldown': self._get('lastTransportCooldown'),
                'rollingHour': self._counts(now),
                'lastDay': [{'gateway': r[0], 'requests': r[1], 'requestBytes': r[2],
                             'responseBytes': r[3], 'refusals': r[4] or 0} for r in rows]}


def configured(base):
    base = Path(base)
    if (base/'egress-config.json').exists(): return True
    try: return bool(json.loads((base.parent/'config.json').read_text()).get('datacenterEgressRequired'))
    except FileNotFoundError: return False


def begin_cycle(base):
    if configured(base):
        pool = Pool(base)
        try: pool.begin_cycle()
        finally: pool.close()


def available_at(base):
    if not configured(base): return time.time()
    pool = Pool(base)
    try: return pool.available_at()
    finally: pool.close()


def warm_ready(base):
    if not configured(base):return False
    pool=Pool(base)
    try:return pool.warm_ready()
    finally:pool.close()


if __name__ == '__main__':
    pool = Pool(Path.home()/'.local/share/scootradar/ryde-bridge/producer')
    try: print(json.dumps(pool.snapshot(), indent=2))
    finally: pool.close()
