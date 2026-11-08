"""Offline pacing, restart, refusal and proxy-authentication boundary tests."""
import importlib
import json
import os
from pathlib import Path
import tempfile
import unittest
import concurrent.futures
from unittest.mock import patch
from egress import Pool, EgressWait


class PoolTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name)
        self.config = {'version': 1, 'maxRequestsPerHour': 200, 'gateways': [
            {'host': '192.0.2.1', 'port': 8000, 'username': 'test', 'password': 'synthetic'},
            {'host': '192.0.2.2', 'port': 8000, 'username': 'other', 'password': 'synthetic2'}]}
        self.write_config()
        self.pool = Pool(self.base); self.addCleanup(lambda: self.pool.close())

    def write_config(self):
        p = self.base/'egress-config.json'; p.write_text(json.dumps(self.config)); p.chmod(0o600)

    def test_counts_every_attempt_before_forwarding_and_persists(self):
        key = self.pool.begin_cycle(1000)
        for n in range(200): self.assertEqual(self.pool.charge(str(n), 10, 1001)[0], key)
        with self.assertRaises(EgressWait): self.pool.charge('excess', 10, 1002)
        with self.assertRaises(EgressWait): self.pool.charge('excess-after-clock-correction', 10, 999)
        second = Pool(self.base)
        try:
            self.assertEqual(second.snapshot(1002)['rollingHour'][key], 200)
            with self.assertRaises(EgressWait): second.charge('after-restart', 10, 1002)
            other = second.begin_cycle(1003)
            self.assertNotEqual(other, key)
            self.assertEqual(second.charge('other-IP', 10, 1004)[0], other)
        finally: second.close()

    def test_pins_one_ip_for_all_startup_calls_and_expires_idle_access(self):
        key = self.pool.begin_cycle(1000)
        for n in range(39): self.assertEqual(self.pool.charge(str(n), 0, 1001)[0], key)
        with self.assertRaises(EgressWait): self.pool.charge('idle-app', 0, 1151)
        self.assertNotEqual(self.pool.begin_cycle(1152), key)

    def test_retains_launch_headroom_and_uses_a_rolling_not_fixed_hour(self):
        self.config['gateways'] = self.config['gateways'][:1]; self.write_config()
        single = Pool(self.base)
        try:
            key = single.begin_cycle(3590)
            for n in range(151): single.charge(str(n), 0, 3591)
            with self.assertRaises(EgressWait): single.begin_cycle(3601)
            self.assertGreater(single.available_at(3601), 7190)
            single.begin_cycle(7192)
            self.assertEqual(single.snapshot(7192)['rollingHour'].get(key, 0), 0)
        finally: single.close()

    def test_actual_refusal_pauses_all_egresses_and_survives_restart(self):
        self.pool.begin_cycle(1000); self.pool.charge('refused', 100, 1001)
        self.pool.settle('refused', 403, 118, 1002)
        with self.assertRaises(EgressWait): self.pool.begin_cycle(1003)
        second = Pool(self.base)
        try:
            self.assertEqual(second.available_at(1100), 1902)
            with self.assertRaises(EgressWait): second.charge('late-startup', 10, 1100)
            second.begin_cycle(1903)
        finally: second.close()

    def test_failed_and_unsettled_requests_still_consume_budget(self):
        key = self.pool.begin_cycle(1000)
        self.pool.charge('lost', 10, 1001); self.pool.charge('failed', 10, 1002)
        self.pool.settle('failed', 0, 0, 1003)
        self.assertEqual(self.pool.snapshot(1004)['rollingHour'][key], 2)

    def test_readiness_does_not_wait_for_a_concurrent_writer(self):
        self.pool.begin_cycle(1000)
        writer = Pool(self.base)
        try:
            writer.db.execute('BEGIN IMMEDIATE')
            self.pool.db.execute('PRAGMA busy_timeout=0')
            self.assertEqual(self.pool.available_at(1001), 1001)
            # The real charge still fails closed while another writer owns accounting.
            import sqlite3
            with self.assertRaises(sqlite3.OperationalError): self.pool.charge('busy', 10, 1001)
        finally:
            writer.db.rollback(); writer.close()
        self.assertEqual(sum(self.pool.snapshot(1002)['rollingHour'].values()), 0)

    def test_old_retained_requests_do_not_make_hot_budget_checks_scan_the_day(self):
        key = self.pool.begin_cycle(10000)
        self.pool.db.executemany('INSERT INTO requests(id,gateway,at) VALUES(?,?,?)',
                                ((str(n), key, 5000) for n in range(20000)))
        self.pool.charge('recent', 10, 10001)
        # Bound SQLite work, rather than relying on a machine-specific elapsed time.
        # Scanning the retained rows exceeds this allowance even if all are in memory.
        def budget():
            steps = [0]
            def progress():
                steps[0] += 100
                return steps[0] > 5000
            self.pool.db.set_progress_handler(progress, 100)
        try:
            budget(); self.assertEqual(self.pool.available_at(10002), 10002)
            budget(); self.pool.charge('another', 10, 10002)
        finally: self.pool.db.set_progress_handler(None, 0)
        self.assertEqual(self.pool.snapshot(10003)['rollingHour'][key], 2)

    def test_failed_startup_does_not_trap_least_used_selection_on_one_gateway(self):
        bad = self.pool.begin_cycle(1000)
        other = next(key for key in self.pool.gateways if key != bad)
        # The healthy address is busier; without transport health, each launch chooses bad again.
        for n in range(40):
            self.pool.db.execute('INSERT INTO requests(id,gateway,at,status) VALUES (?,?,?,?)',
                                 ('healthy-'+str(n), other, 1000, 200))
        for n in range(2):
            self.pool.charge('failed-'+str(n), 10, 1001)
            self.pool.settle('failed-'+str(n), 0, 0, 1005)
        # Installing this fix must also assess the cycle saved by the previous worker build.
        active = self.pool._get('active'); del active['startedAt']; self.pool._set('active', active)
        self.assertEqual(self.pool.begin_cycle(1031), other)
        # Restarting either process preserves the temporary route health and the actual charges.
        second = Pool(self.base)
        try:
            self.assertEqual(second.begin_cycle(1062), other)
            self.assertEqual(second.snapshot(1062)['rollingHour'][bad], 2)
            self.assertEqual(second.begin_cycle(1932), bad)
        finally: second.close()

    def test_a_working_launchs_cancelled_requests_do_not_cool_its_gateway(self):
        key = self.pool.begin_cycle(1000)
        for n, status in enumerate([0, 0, 200]):
            self.pool.charge(str(n), 10, 1001)
            self.pool.settle(str(n), status, 0, 1002)
        self.pool.begin_cycle(1031)
        self.assertNotIn(key, self.pool._get('transportCooldowns', {}))

    def test_unauthorized_app_response_is_not_a_transport_failure(self):
        key = self.pool.begin_cycle(1000)
        for n, status in enumerate([0, 0, 401]):
            self.pool.charge(str(n), 10, 1001)
            self.pool.settle(str(n), status, 0, 1002)
        self.pool.begin_cycle(1031)
        self.assertNotIn(key, self.pool._get('transportCooldowns', {}))

    def test_transport_health_never_bypasses_a_pool_wide_refusal(self):
        self.pool.begin_cycle(1000)
        for n, status in enumerate([0, 0, 429]):
            self.pool.charge(str(n), 10, 1001)
            self.pool.settle(str(n), status, 0, 1002)
        with self.assertRaises(EgressWait): self.pool.begin_cycle(1031)

    def test_all_transport_routes_cooling_wait_without_spending_more_requests(self):
        self.config['gateways'] = self.config['gateways'][:1]; self.write_config()
        single = Pool(self.base)
        try:
            single.begin_cycle(1000)
            for n in range(2):
                single.charge(str(n), 10, 1001); single.settle(str(n), 0, 0, 1002)
            with self.assertRaises(EgressWait): single.begin_cycle(1031)
            # The failed begin must retain the health result, not roll it back.
            self.assertGreater(single.available_at(1032), 1032)
            single.begin_cycle(1932)
            self.assertEqual(sum(single.snapshot(1932)['rollingHour'].values()), 2)
        finally: single.close()

    def test_concurrent_clients_cannot_exceed_the_same_ip_budget(self):
        key = self.pool.begin_cycle(1000)
        def send(prefix):
            client = Pool(self.base)
            accepted = 0
            try:
                for n in range(150):
                    try: client.charge(prefix+str(n), 0, 1001); accepted += 1
                    except EgressWait: pass
                return accepted
            finally: client.close()
        with concurrent.futures.ThreadPoolExecutor(2) as executor:
            results = list(executor.map(send, ['one-', 'two-']))
        self.assertEqual(sum(results), 200)
        self.assertEqual(self.pool.snapshot(1002)['rollingHour'][key], 200)

    def test_required_route_never_reverts_to_direct_when_config_is_missing(self):
        from egress import configured
        base = self.base/'producer'; base.mkdir()
        (self.base/'config.json').write_text(json.dumps({'datacenterEgressRequired': True}))
        self.assertTrue(configured(base))
        with self.assertRaises(FileNotFoundError): Pool(base)

    def test_duplicate_addresses_cannot_multiply_budget(self):
        self.config['gateways'][1]['host'] = self.config['gateways'][0]['host']; self.write_config()
        with self.assertRaisesRegex(ValueError, 'Duplicate'): Pool(self.base)

    def test_public_config_and_higher_limits_are_rejected(self):
        (self.base/'egress-config.json').chmod(0o644)
        with self.assertRaisesRegex(ValueError, 'private'): Pool(self.base)
        self.config['maxRequestsPerHour'] = 201; self.write_config()
        with self.assertRaisesRegex(ValueError, '200'): Pool(self.base)


class RoutingTests(unittest.TestCase):
    write_config = PoolTests.write_config

    def setUp(self):
        PoolTests.setUp(self)
        self.env = patch.dict(os.environ, RYDE_PRODUCER_ROOT=str(self.base)); self.env.start(); self.addCleanup(self.env.stop)
        import egress_addon
        egress_addon.addons[0].done()
        self.module = importlib.reload(egress_addon)
        self.addon = self.module.addons[0]; self.addCleanup(self.addon.done)

    def flow(self, url='https://api.ryde.vip/appRyde/getTimeService'):
        from mitmproxy.http import HTTPFlow, Request
        from mitmproxy.connection import Client, Server
        f = HTTPFlow(Client(peername=('127.0.0.1', 1), sockname=('127.0.0.1', 2)), Server(address=('api.ryde.vip', 443)))
        f.request = Request.make('GET', url, headers={'Proxy-Authorization': 'must-not-reach-origin'})
        return f

    def test_replaces_open_connection_on_another_route_and_authenticates_only_connect(self):
        from mitmproxy.connection import ConnectionState, Server
        self.pool.begin_cycle()
        f = self.flow(); old = f.server_conn; old.state = ConnectionState.OPEN
        self.addon.requestheaders(f)
        self.assertIsNot(f.server_conn, old)
        self.assertIsNone(f.response)
        self.assertNotIn('Proxy-Authorization', f.request.headers)
        via = f.server_conn.via
        self.assertEqual(via[0], 'http')
        connect = self.flow(); connect.request.method = 'CONNECT'; connect.server_conn = Server(address=via[1])
        self.addon.http_connect_upstream(connect)
        self.assertTrue(connect.request.headers['Proxy-Authorization'].startswith('Basic '))
        self.assertNotIn('Proxy-Authorization', f.request.headers)

    def test_unarmed_or_wrong_destination_requests_never_go_upstream(self):
        f = self.flow(); self.addon.requestheaders(f)
        self.assertTrue(f.metadata['egressDenied']); self.assertEqual(f.response.status_code, 503)
        self.pool.begin_cycle()
        f = self.flow('https://unrelated.test/'); self.addon.requestheaders(f)
        self.assertTrue(f.metadata['egressDenied'])
        self.assertEqual(sum(self.pool.snapshot()['rollingHour'].values()), 0)

    def test_failed_accounting_denies_instead_of_falling_back(self):
        self.pool.begin_cycle()
        with patch.object(self.addon.pool, 'charge', side_effect=OSError('private failure')):
            f = self.flow(); self.addon.requestheaders(f)
        self.assertTrue(f.metadata['egressDenied'])
        self.assertNotIn(b'private failure', f.response.content)

    def test_only_counters_and_paths_are_recorded(self):
        from mitmproxy.http import Response
        self.pool.begin_cycle()
        f = self.flow(); self.addon.requestheaders(f)
        f.response = Response.make(200, b'private payload', {'Secret': 'private header'})
        self.addon.response(f)
        log = (self.base/'egress-requests.jsonl').read_text()
        for secret in ['private payload', 'private header', 'synthetic', '192.0.2.']:
            self.assertNotIn(secret, log)


if __name__ == '__main__': unittest.main()
