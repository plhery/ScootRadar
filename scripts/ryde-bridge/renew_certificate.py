"""Renew the bridge's Ryde-only TLS certificate in place, without stopping collection.

The first certificate (3 November 2026) was issued for 30 days, and the supervisor stops collection seven
days before expiry to hand Ryde its own key back (producer_runner.py). This issues a new self-signed leaf
like it (RSA 2048, SHA-256, api.ryde.vip only, not a CA, server authentication only) for DAYS, trusts it
as setup.py trusted the first (SSL, api.ryde.vip and the Ryde app only, nothing wider), swaps it under the
running bridge, and removes the old one only once a map has come through the new one. Any failure before
that puts the old certificate back and removes the new one's trust.

Run as the Mac user, from the repository, with the bridge's mitmproxy Python (it has cryptography):

  ~/.cache/scootradar/rider-auth/ryde/iphone-capture/venv/bin/python3 \\
    scripts/ryde-bridge/renew_certificate.py --password-file FILE

FILE holds the administrator password on one line; it goes to sudo's standard input only. macOS may also
ask on screen to confirm a trust change, so stay at the Mac until the script reports `renewed`.
"""
import argparse
import datetime
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time
import uuid
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import ExtendedKeyUsageOID, NameOID

ROOT = Path(os.environ.get('RYDE_TRANSPORT_ROOT', Path.home()/'.local/share/scootradar/ryde-bridge'))
KEYCHAIN = '/Library/Keychains/System.keychain'
HOST = 'api.ryde.vip'
AGENT = 'com.scootradar.ryde-bridge'
# A year, within every limit Apple sets: 825 days for any TLS certificate, and 398 for those of the
# certificate authorities macOS ships, which a certificate the user trusts is not.
DAYS = 397
VERIFY_SECONDS = 600


def issue(days=DAYS, now=None):
    """A new leaf, its label (the name `security` shows), and its certificate and key as PEM."""
    now = now or datetime.datetime.now(datetime.timezone.utc)
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    label = 'ScootRadar Ryde bridge '+uuid.uuid4().hex[:8]
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, label)])
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now-datetime.timedelta(minutes=5)).not_valid_after(now+datetime.timedelta(days=days))
        .add_extension(x509.SubjectAlternativeName([x509.DNSName(HOST)]), critical=False)
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .add_extension(x509.ExtendedKeyUsage([ExtendedKeyUsageOID.SERVER_AUTH]), critical=False)
        .sign(key, hashes.SHA256()))
    key_pem = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
    return label, cert, cert.public_bytes(serialization.Encoding.PEM), key_pem


def renewed_config(config, label, cert):
    expires = cert.not_valid_after_utc
    return {**config, 'certificateLabel': label, 'sha1': cert.fingerprint(hashes.SHA1()).hex().upper(),
            'certificateExpiresAt': expires.isoformat(), 'certificateExpiresTimestamp': expires.timestamp()}


def scoped_trust(dump, label, app_binary):
    """Whether `security dump-trust-settings -d` trusts `label` for exactly SSL, api.ryde.vip and the app."""
    blocks = re.split(r'^Cert \d+: ', dump, flags=re.M)[1:]
    block = next((b for b in blocks if b.split('\n', 1)[0].strip() == label), None)
    if block is None: return False
    flat = re.sub(r'[ \t]+', ' ', block)
    return ('Number of trust settings : 1' in flat and 'Policy OID : SSL' in flat
            and f'Policy String : {HOST}' in flat and 'Application : '+str(Path(app_binary).parent) in flat)


def say(phase, **details):
    print(json.dumps({'phase': phase, 'at': time.time(), **details}), flush=True)


def private(path, data):
    temp = path.with_suffix(path.suffix+'.tmp')
    with os.fdopen(os.open(temp, os.O_WRONLY|os.O_CREAT|os.O_TRUNC, 0o600), 'wb') as handle:
        handle.write(data); handle.flush(); os.fsync(handle.fileno())
    temp.replace(path)


def sudo(password, *command):
    result = subprocess.run(['/usr/bin/sudo', '-S', '-p', '', '--', *command], input=password+'\n',
                            capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(f'{Path(command[0]).name} {command[1]} failed ({result.returncode}): {result.stderr.strip()[:300]}')
    return result.stdout


def admin_trust():
    return subprocess.run(['/usr/bin/security', 'dump-trust-settings', '-d'], capture_output=True, text=True).stdout


def restart_proxy():
    uid = str(os.getuid()); agent = Path.home()/'Library/LaunchAgents'/(AGENT+'.plist')
    subprocess.run(['launchctl', 'bootout', f'gui/{uid}/{AGENT}'], check=True, capture_output=True)
    for _ in range(20):
        if subprocess.run(['launchctl', 'bootstrap', f'gui/{uid}', str(agent)], capture_output=True).returncode == 0: return
        time.sleep(.25)
    raise RuntimeError('The bridge LaunchAgent did not restart; inspect supervisor.log')


def read(path, default=None):
    try: return json.loads(path.read_text())
    except (FileNotFoundError, ValueError): return default


def map_through_new_certificate(root, since, timeout=VERIFY_SECONDS):
    """A map written with no error by the proxy restarted after `since`; False on a TLS refusal or timeout."""
    deadline = time.time()+timeout; base = root/'producer'
    while time.time() < deadline:
        ready = read(base/'proxy-ready.json', {}) or {}; transport = read(root/'transport-status.json', {}) or {}
        if ready.get('pid') and ready.get('pid') == transport.get('proxyPid') and ready.get('at', 0) >= since:
            # The restarted proxy counts from zero the TLS handshakes Ryde refused (native_protocol.py).
            status = read(base/'session/status.json', {}) or {}
            if status.get('startedAt', 0) >= since and status.get('tlsFailures', 0): return False
            for path in (base/'results').glob('*.json'):
                if path.stat().st_mtime >= ready['at'] and 'error' not in (read(path, {'error': 'unreadable'}) or {}): return True
        time.sleep(2)
    return False


def renew(root, password, days=DAYS, verify=map_through_new_certificate, restart=restart_proxy, sudo=sudo, trust_dump=None):
    config = json.loads((root/'config.json').read_text())
    if (root/'producer/stop.json').exists(): raise SystemExit('Collection is stopped for a restoration; renew after it')
    status = read(root/'producer/session/status.json', {}) or {}
    if status.get('bridgeStage') != 'bridge-active' or status.get('paused'):
        raise SystemExit('The bridge is not collecting, so a map could not confirm the new certificate')
    label, cert, cert_pem, key_pem = issue(days)
    work = root/'renewal'/time.strftime('%Y%m%dT%H%M%S'); work.mkdir(mode=0o700, parents=True)
    private(work/'leaf-cert.pem', cert_pem)
    for name in ('leaf.pem', 'leaf-cert.pem', 'config.json'): shutil.copy2(root/name, work/('previous-'+name))
    say('issued', label=label, expiresAt=cert.not_valid_after_utc.isoformat())

    def untrust_new():
        try:
            sudo(password, '/usr/bin/security', 'remove-trusted-cert', '-d', str(work/'leaf-cert.pem'))
            sudo(password, '/usr/bin/security', 'delete-certificate', '-Z', renewed_config(config, label, cert)['sha1'], KEYCHAIN)
        except RuntimeError as error: say('new-trust-not-removed', error=str(error))

    say('awaiting-trust-install', note='macOS may ask you to confirm on screen')
    try:
        sudo(password, '/usr/bin/security', 'add-trusted-cert', '-d', '-r', 'trustRoot', '-p', 'ssl', '-a', config['appBinary'],
             '-s', HOST, '-k', KEYCHAIN, str(work/'leaf-cert.pem'))
        dump = (trust_dump or admin_trust)()
        if not scoped_trust(dump, label, config['appBinary']):
            raise RuntimeError('The new trust is not limited to SSL, api.ryde.vip and the Ryde app')
    except RuntimeError:
        untrust_new(); raise
    say('trusted', scope='SSL, api.ryde.vip and the Ryde app only')

    since = time.time()
    private(root/'leaf.pem', cert_pem+key_pem); private(root/'leaf-cert.pem', cert_pem)
    private(root/'config.json', (json.dumps(renewed_config(config, label, cert), indent=1)+'\n').encode())
    served = False
    try:
        restart(); say('swapped', note='waiting for a Ryde map through the new certificate')
        served = verify(root, since)
    finally:
        # Also on an error or an interrupt: the old certificate is still trusted, so put it back.
        if not served:
            for name in ('leaf.pem', 'leaf-cert.pem', 'config.json'): shutil.copy2(work/('previous-'+name), root/name)
            restart(); untrust_new(); say('rolled-back')
    if not served: raise SystemExit('No map came through the new certificate; the old one is back')
    say('verified')
    try:
        sudo(password, '/usr/bin/security', 'remove-trusted-cert', '-d', str(work/'previous-leaf-cert.pem'))
        sudo(password, '/usr/bin/security', 'delete-certificate', '-Z', config['sha1'], KEYCHAIN)
        say('old-removed', label=config['certificateLabel'])
    except RuntimeError as error:
        # Harmless: the old certificate is no longer served, and it expires on its own.
        say('old-not-removed', label=config['certificateLabel'], error=str(error))
    say('renewed', label=label, expiresAt=cert.not_valid_after_utc.isoformat())


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--password-file', required=True)
    parser.add_argument('--days', type=int, default=DAYS); args = parser.parse_args()
    if os.geteuid() == 0: raise SystemExit('Run as the Mac user; only the trust changes use sudo')
    if not 1 <= args.days <= 397: raise SystemExit('Choose 1 to 397 days')
    password = Path(args.password_file).read_text().rstrip('\r\n')
    renew(ROOT, password, args.days)


if __name__ == '__main__': main()
