import datetime
import json
from pathlib import Path
import tempfile
import time
import unittest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.x509.oid import ExtendedKeyUsageOID
import renew_certificate as renewal

APP = '/var/folders/x/X/UUID/d/Wrapper/Ryde.app/Ryde'

def dump(label, policy='SSL', host='api.ryde.vip', app='/var/folders/x/X/UUID/d/Wrapper/Ryde.app', settings=1):
    return (f'Number of trusted certs = 2\nCert 0: ScootRadar Ryde bridge f3635c5c\n   Number of trust settings : 1\n'
            f'   Trust Setting 0:\n      Policy OID            : SSL\n      Application           : {app}\n'
            f'      Policy String         : api.ryde.vip\nCert 1: {label}\n   Number of trust settings : {settings}\n'
            f'   Trust Setting 0:\n      Policy OID            : {policy}\n      Application           : {app}\n'
            f'      Policy String         : {host}\n')


class Bridge:
    """A bridge directory with the first certificate, and recorded sudo and restart calls."""
    def __init__(self, test):
        self.root = Path(tempfile.mkdtemp()); test.addCleanup(lambda: __import__('shutil').rmtree(self.root))
        (self.root/'producer/session').mkdir(parents=True)
        self.label, self.cert, cert_pem, key_pem = renewal.issue(30)
        self.config = renewal.renewed_config({'appBinary': APP, 'service': 'Ethernet', 'persistentTransportApproved': True},
                                             self.label, self.cert)
        (self.root/'leaf.pem').write_bytes(cert_pem+key_pem); (self.root/'leaf-cert.pem').write_bytes(cert_pem)
        (self.root/'config.json').write_text(json.dumps(self.config, indent=1))
        (self.root/'producer/session/status.json').write_text(json.dumps({'bridgeStage': 'bridge-active', 'paused': False}))
        self.calls = []; self.restarts = 0

    def sudo(self, password, *command):
        assert password == 'secret'; self.calls.append(command[1:3]); return ''

    def restart(self): self.restarts += 1

    def files(self): return {name: (self.root/name).read_bytes() for name in ('leaf.pem', 'leaf-cert.pem', 'config.json')}


class RenewCertificateTest(unittest.TestCase):
    def test_the_new_certificate_is_a_year_long_ryde_only_leaf(self):
        now = datetime.datetime(2026, 11, 21, 18, tzinfo=datetime.timezone.utc)
        label, cert, cert_pem, key_pem = renewal.issue(now=now)
        self.assertRegex(label, r'^ScootRadar Ryde bridge [0-9a-f]{8}$')
        self.assertEqual(cert.subject, cert.issuer)
        self.assertEqual(cert.not_valid_after_utc-now, datetime.timedelta(days=397))
        self.assertEqual(now-cert.not_valid_before_utc, datetime.timedelta(minutes=5))
        self.assertEqual(cert.extensions.get_extension_for_class(x509.SubjectAlternativeName).value.get_values_for_type(x509.DNSName), ['api.ryde.vip'])
        constraints = cert.extensions.get_extension_for_class(x509.BasicConstraints)
        self.assertTrue(constraints.critical); self.assertFalse(constraints.value.ca)
        self.assertEqual(list(cert.extensions.get_extension_for_class(x509.ExtendedKeyUsage).value), [ExtendedKeyUsageOID.SERVER_AUTH])
        self.assertEqual(cert.public_key().key_size, 2048); self.assertIsInstance(cert.signature_hash_algorithm, hashes.SHA256)
        key = serialization.load_pem_private_key(key_pem, None)
        self.assertEqual(key.public_key().public_numbers(), cert.public_key().public_numbers())

    def test_config_takes_the_new_label_fingerprint_and_expiry(self):
        label, cert, _, _ = renewal.issue()
        config = renewal.renewed_config({'appBinary': APP, 'sha1': 'OLD', 'certificateLabel': 'old'}, label, cert)
        self.assertEqual(config['appBinary'], APP); self.assertEqual(config['certificateLabel'], label)
        self.assertRegex(config['sha1'], r'^[0-9A-F]{40}$')
        self.assertEqual(config['certificateExpiresTimestamp'], cert.not_valid_after_utc.timestamp())
        self.assertEqual(datetime.datetime.fromisoformat(config['certificateExpiresAt']), cert.not_valid_after_utc)

    def test_trust_counts_only_when_limited_to_ssl_the_host_and_the_app(self):
        label = 'ScootRadar Ryde bridge 0123abcd'
        self.assertTrue(renewal.scoped_trust(dump(label), label, APP))
        self.assertFalse(renewal.scoped_trust(dump(label), 'ScootRadar Ryde bridge 99999999', APP))
        self.assertFalse(renewal.scoped_trust(dump(label, policy='Basic X509'), label, APP))
        self.assertFalse(renewal.scoped_trust(dump(label, host='example.com'), label, APP))
        self.assertFalse(renewal.scoped_trust(dump(label, app='/Applications/Safari.app'), label, APP))
        self.assertFalse(renewal.scoped_trust(dump(label, settings=2), label, APP))
        # The first certificate's block, trusted as it should be, does not stand for the new one.
        self.assertFalse(renewal.scoped_trust(dump(label).split('Cert 1:')[0], label, APP))

    def test_renewal_swaps_the_certificate_and_removes_the_old_one_after_a_map(self):
        bridge = Bridge(self); seen = {}
        def verify(root, since):
            seen['config'] = json.loads((root/'config.json').read_text()); seen['leaf'] = (root/'leaf.pem').read_bytes(); return True
        renewal.renew(bridge.root, 'secret', verify=verify, restart=bridge.restart, sudo=bridge.sudo,
                      trust_dump=lambda: dump(label_of(bridge)))
        config = json.loads((bridge.root/'config.json').read_text())
        self.assertEqual(seen['config'], config); self.assertNotEqual(config['sha1'], bridge.config['sha1'])
        self.assertGreater(config['certificateExpiresTimestamp'], time.time()+396*86400)
        cert = x509.load_pem_x509_certificate((bridge.root/'leaf-cert.pem').read_bytes())
        self.assertEqual(cert.fingerprint(hashes.SHA1()).hex().upper(), config['sha1'])
        self.assertTrue(seen['leaf'].startswith((bridge.root/'leaf-cert.pem').read_bytes()) and b'PRIVATE KEY' in seen['leaf'])
        self.assertEqual(bridge.restarts, 1)
        self.assertEqual(bridge.calls, [('add-trusted-cert', '-d'), ('remove-trusted-cert', '-d'), ('delete-certificate', '-Z')])
        self.assertEqual(oct((bridge.root/'leaf.pem').stat().st_mode & 0o777), '0o600')
        self.assertEqual(oct((bridge.root/'config.json').stat().st_mode & 0o777), '0o600')

    def test_no_map_through_the_new_certificate_puts_the_old_one_back(self):
        bridge = Bridge(self); before = bridge.files()
        with self.assertRaisesRegex(SystemExit, 'old one is back'):
            renewal.renew(bridge.root, 'secret', verify=lambda root, since: False, restart=bridge.restart, sudo=bridge.sudo,
                          trust_dump=lambda: dump(label_of(bridge)))
        self.assertEqual(bridge.files(), before); self.assertEqual(bridge.restarts, 2)
        self.assertEqual(bridge.calls, [('add-trusted-cert', '-d'), ('remove-trusted-cert', '-d'), ('delete-certificate', '-Z')])

    def test_an_interrupt_while_waiting_also_puts_the_old_one_back(self):
        bridge = Bridge(self); before = bridge.files()
        def verify(root, since): raise KeyboardInterrupt
        with self.assertRaises(KeyboardInterrupt):
            renewal.renew(bridge.root, 'secret', verify=verify, restart=bridge.restart, sudo=bridge.sudo,
                          trust_dump=lambda: dump(label_of(bridge)))
        self.assertEqual(bridge.files(), before); self.assertEqual(bridge.restarts, 2)

    def test_trust_wider_than_ryde_is_removed_before_anything_is_swapped(self):
        bridge = Bridge(self); before = bridge.files()
        with self.assertRaisesRegex(RuntimeError, 'not limited'):
            renewal.renew(bridge.root, 'secret', verify=lambda root, since: True, restart=bridge.restart, sudo=bridge.sudo,
                          trust_dump=lambda: dump(label_of(bridge), host='*'))
        self.assertEqual(bridge.files(), before); self.assertEqual(bridge.restarts, 0)
        self.assertEqual(bridge.calls, [('add-trusted-cert', '-d'), ('remove-trusted-cert', '-d'), ('delete-certificate', '-Z')])

    def test_renewal_waits_for_a_collecting_bridge(self):
        bridge = Bridge(self)
        (bridge.root/'producer/session/status.json').write_text(json.dumps({'bridgeStage': 'bridge-active', 'paused': True}))
        with self.assertRaisesRegex(SystemExit, 'not collecting'):
            renewal.renew(bridge.root, 'secret', sudo=bridge.sudo, restart=bridge.restart)
        (bridge.root/'producer/session/status.json').write_text(json.dumps({'bridgeStage': 'bridge-active', 'paused': False}))
        (bridge.root/'producer/stop.json').write_text('{}')
        with self.assertRaisesRegex(SystemExit, 'restoration'):
            renewal.renew(bridge.root, 'secret', sudo=bridge.sudo, restart=bridge.restart)
        self.assertEqual(bridge.calls, []); self.assertFalse((bridge.root/'renewal').exists())


class MapThroughNewCertificateTest(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp()); self.addCleanup(lambda: __import__('shutil').rmtree(self.root))
        (self.root/'producer/session').mkdir(parents=True); (self.root/'producer/results').mkdir()
        self.since = time.time()-1
        (self.root/'producer/proxy-ready.json').write_text(json.dumps({'pid': 7, 'at': self.since+0.5}))
        (self.root/'transport-status.json').write_text(json.dumps({'proxyPid': 7}))
        self.status({'startedAt': self.since+0.5, 'tlsFailures': 0})

    def status(self, value): (self.root/'producer/session/status.json').write_text(json.dumps(value))

    def test_a_new_map_from_the_restarted_proxy_confirms_it(self):
        (self.root/'producer/results/a.json').write_text(json.dumps({'id': 'a', 'scooters': []}))
        self.assertTrue(renewal.map_through_new_certificate(self.root, self.since, timeout=1))

    def test_a_failed_job_or_an_older_map_does_not(self):
        (self.root/'producer/results/a.json').write_text(json.dumps({'id': 'a', 'error': 'TransportError'}))
        old = self.root/'producer/results/b.json'; old.write_text(json.dumps({'id': 'b'}))
        import os; os.utime(old, (self.since-60, self.since-60))
        self.assertFalse(renewal.map_through_new_certificate(self.root, self.since, timeout=.1))

    def test_a_map_written_before_the_restarted_proxy_was_ready_does_not(self):
        (self.root/'producer/results/a.json').write_text(json.dumps({'id': 'a'}))
        (self.root/'producer/proxy-ready.json').write_text(json.dumps({'pid': 7, 'at': time.time()+5}))
        self.assertFalse(renewal.map_through_new_certificate(self.root, self.since, timeout=.1))

    def test_a_refused_handshake_fails_at_once(self):
        self.status({'startedAt': self.since+0.5, 'tlsFailures': 1})
        (self.root/'producer/results/a.json').write_text(json.dumps({'id': 'a'}))
        self.assertFalse(renewal.map_through_new_certificate(self.root, self.since, timeout=5))

    def test_the_old_proxy_and_its_refusals_do_not_count(self):
        (self.root/'producer/results/a.json').write_text(json.dumps({'id': 'a'}))
        (self.root/'transport-status.json').write_text(json.dumps({'proxyPid': 8}))
        self.assertFalse(renewal.map_through_new_certificate(self.root, self.since, timeout=.1))
        (self.root/'transport-status.json').write_text(json.dumps({'proxyPid': 7}))
        self.status({'startedAt': self.since-60, 'tlsFailures': 3})
        self.assertTrue(renewal.map_through_new_certificate(self.root, self.since, timeout=1))


def label_of(bridge):
    """The label of the certificate the renewal is installing, read from its work directory."""
    path = next(bridge.root.glob('renewal/*/leaf-cert.pem'))
    return x509.load_pem_x509_certificate(path.read_bytes()).subject.rfc4514_string().removeprefix('CN=')


if __name__ == '__main__': unittest.main()
