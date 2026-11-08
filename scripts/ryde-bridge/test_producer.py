"""Offline crypto/transition tests: no app control and no Ryde traffic."""
import importlib
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import urlencode,parse_qs
import time
import base64
import hashlib
import uuid
from cryptography.hazmat.primitives.asymmetric import ec,utils
from cryptography.hazmat.primitives import hashes
from mitmproxy.http import Request,Response,HTTPFlow
from mitmproxy.connection import Client,Server
from bridge_crypto import jwk,thumbprint,encrypt_envelope,decrypt_envelope
from native_protocol import LOGIN,MAP,ROTATE,b64u

class ProducerTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        root=Path(self.tmp.name);(root/'results').mkdir();(root/'id-key').write_bytes(b'k'*32)
        self.env=patch.dict(os.environ,RYDE_PRODUCER_ROOT=str(root));self.env.start();self.addCleanup(self.env.stop)
        import producer_addon
        self.module=importlib.reload(producer_addon)
        self.app=ec.generate_private_key(ec.SECP256R1());self.signer=ec.generate_private_key(ec.SECP256R1());self.token='test-token'
        self.producer=self.module.Producer();self.root=root
        self.producer.response(self.flow(LOGIN,reply={'status':200,'token':self.token,'rotateAfterSeconds':259200}))
        self.rotate(self.app)
    def flow(self,path,fields=None,reply=None):
        fields={'token':self.token,**(fields or {})}
        header=b64u(json.dumps({'alg':'ES256','jwk':jwk(self.signer)}).encode())
        claims=b64u(json.dumps({'htm':'POST','htu':'https://api.ryde.vip'+path,'ath':b64u(hashlib.sha256(self.token.encode()).digest()),'iat':time.time(),'jti':uuid.uuid4().hex}).encode())
        sig=self.signer.sign((header+'.'+claims).encode(),ec.ECDSA(hashes.SHA256()));r,s=utils.decode_dss_signature(sig)
        proof=header+'.'+claims+'.'+b64u(r.to_bytes(32,'big')+s.to_bytes(32,'big'))
        f=HTTPFlow(Client(peername=('127.0.0.1',1),sockname=('127.0.0.1',2)),Server(address=('api.ryde.vip',443)))
        f.request=Request.make('POST','https://api.ryde.vip'+path,urlencode(fields),{'Authorization':'DPoP '+self.token,'DPoP':proof})
        f.response=Response.make(200,json.dumps(reply or {'status':200,'rotateAfterSeconds':259200}).encode());return f
    def rotate(self,app):
        f=self.flow(ROTATE,{'encJwk':json.dumps(jwk(app)),'ekt':thumbprint(app)})
        proof=f.request.headers['DPoP'];self.producer.request(f);self.producer.response(f)
        self.assertEqual(f.request.headers['DPoP'],proof);return f
    def job(self):
        q={'version':1,'id':uuid.uuid4().hex,'cityId':43,'latitude':59.744,'longitude':10.205,'radius':1,'expiresAt':time.time()+60}
        (self.root/'job.json').write_text(json.dumps(q));return q
    def map(self,app=None,rows=None,status=200,ekt=None):
        app=app or self.app
        f=self.flow(MAP,{'ekt':ekt or thumbprint(app),'cityId':'0','iotLa':'47','iotLo':'8','nearRadius':'10'})
        proof=f.request.headers['DPoP'];self.producer.request(f)
        payload={'scooters':rows or [],'ebikes':[{'should':'never export'}]}
        f.response=Response.make(200,json.dumps({'status':status,'key':json.dumps(encrypt_envelope(self.producer.key.public_key(),json.dumps(payload).encode()))}).encode())
        self.producer.response(f);self.assertEqual(f.request.headers['DPoP'],proof);return f
    def test_restart_retains_key_and_matches_cached_bridge_identifier(self):
        q=self.job();key=thumbprint(self.producer.key)
        self.producer=self.module.Producer();self.assertEqual(thumbprint(self.producer.key),key)
        f=self.map(ekt=key,rows=[{'memberByString':'123456789012345','coordinate':{'latitude':59.744,'longitude':10.205}}])
        result=json.loads((self.root/'results'/f"{q['id']}.json").read_text())
        self.assertEqual(len(result['scooters']),1);self.assertNotIn('123456789012345',json.dumps(result))
        self.assertEqual(json.loads(decrypt_envelope(self.app,json.loads(json.loads(f.response.content)['key'])))['scooters'][0]['memberByString'],'123456789012345')
        self.assertEqual((self.root/'session/recovery.json').stat().st_mode&0o077,0)

    def test_warm_disarm_blocks_new_claims_and_waits_for_every_live_native_flow(self):
        job=self.job();flow=self.flow(MAP,{'ekt':thumbprint(self.app)})
        self.producer.request(flow)
        self.assertIn(flow.id,self.producer.native_jobs)
        command={'id':job['id'],'nonce':'a'*32,'expiresAt':time.time()+5}
        (self.root/'warm-disarm.json').write_text(json.dumps(command))
        # Expiring the public pending deadline must not permit quitting a real live flow.
        self.producer.pending_deadline=0
        self.producer.warm_control()
        self.assertFalse((self.root/'job.json').exists())
        self.assertFalse(json.loads((self.root/'warm-disarm-ack.json').read_text())['safeToQuit'])
        other=self.flow(MAP,{'ekt':thumbprint(self.app)});self.producer.request(other)
        self.assertNotIn('producerJob',other.metadata)
        flow.response=Response.make(200,json.dumps({'status':200,'key':json.dumps(encrypt_envelope(self.producer.key.public_key(),b'{"scooters":[]}'))}).encode())
        self.producer.response(flow);self.producer.warm_control()
        self.assertTrue(json.loads((self.root/'warm-disarm-ack.json').read_text())['safeToQuit'])
        self.assertFalse(self.producer.paused)
        (self.root/'job.json').write_text(json.dumps(job))
        self.producer.warm_control()
        self.assertTrue((self.root/'job.json').exists())

    def test_invalid_warm_control_never_disarms_a_job(self):
        self.job()
        for value in [[],{}, {'id':'a'*32,'nonce':'b'*32,'expiresAt':time.time()-1}]:
            (self.root/'warm-disarm.json').write_text(json.dumps(value));self.producer.warm_control()
            self.assertTrue((self.root/'job.json').exists())

    def test_warm_fallback_waits_for_native_key_renewal(self):
        job=self.job()
        next_app=ec.generate_private_key(ec.SECP256R1())
        flow=self.flow(ROTATE,{'encJwk':json.dumps(jwk(next_app)),'ekt':thumbprint(next_app)})
        self.producer.request(flow)
        (self.root/'warm-disarm.json').write_text(json.dumps({'id':job['id'],'nonce':'a'*32,'expiresAt':time.time()+5}))
        self.producer.warm_control()
        self.assertFalse(json.loads((self.root/'warm-disarm-ack.json').read_text())['safeToQuit'])
        self.producer.response(flow);self.producer.warm_control()
        self.assertTrue(json.loads((self.root/'warm-disarm-ack.json').read_text())['safeToQuit'])

    def test_failed_renewal_keeps_fallback_closed_for_unresolved_recipient(self):
        job=self.job();next_app=ec.generate_private_key(ec.SECP256R1())
        flow=self.flow(ROTATE,{'encJwk':json.dumps(jwk(next_app)),'ekt':thumbprint(next_app)})
        self.producer.request(flow);self.producer.error(flow)
        (self.root/'warm-disarm.json').write_text(json.dumps({'id':job['id'],'nonce':'a'*32,'expiresAt':time.time()+5}))
        self.producer.warm_control()
        self.assertFalse(self.producer.native_renewals)
        self.assertFalse(json.loads((self.root/'warm-disarm-ack.json').read_text())['safeToQuit'])

    def test_transport_error_hook_remains_callable_and_retires_its_native_job(self):
        job=self.job();flow=self.flow(MAP,{'ekt':thumbprint(self.app)})
        self.producer.request(flow);self.producer.error(flow)
        result=json.loads((self.root/'results'/f"{job['id']}.json").read_text())
        self.assertEqual(result['error'],'TransportError')
        self.assertFalse(self.producer.native_jobs)
        self.assertIsNone(self.producer.pending)
        self.assertTrue(json.loads((self.root/'session/status.json').read_text())['paused'])
    def test_abandoned_request_expires_and_late_reply_preserves_new_pending_job(self):
        first=self.job()
        a=self.flow(MAP,{'ekt':thumbprint(self.app)})
        self.producer.request(a)
        self.producer.pending_deadline=time.time()-1
        second=self.job()
        b=self.flow(MAP,{'ekt':thumbprint(self.app)})
        self.producer.request(b)
        self.assertEqual(self.producer.pending,second['id'])
        for flow in [a,b]:
            flow.response=Response.make(200,json.dumps({'status':200,'key':json.dumps(encrypt_envelope(self.producer.key.public_key(),b'{"scooters":[]}'))}).encode())
        self.producer.response(a)
        self.assertEqual(self.producer.pending,second['id'])
        self.producer.response(b);self.assertIsNone(self.producer.pending)

    def test_nearly_identical_duplicate_rows_are_collapsed_without_losing_saturation_count(self):
        job=self.job()
        rows=[{'memberByString':'123456789012345','coordinate':{'latitude':59.744,'longitude':10.205}},
              {'memberByString':'123456789012345','coordinate':{'latitude':59.74402,'longitude':10.205}}]
        self.map(rows=rows)
        result=json.loads((self.root/'results'/f"{job['id']}.json").read_text())
        self.assertEqual(len(result['scooters']),1);self.assertEqual(result['returnedCount'],2)
        self.assertFalse(self.producer.paused)

    def test_renewal_and_stop_restore_new_app_key(self):
        next_app=ec.generate_private_key(ec.SECP256R1());self.rotate(next_app)
        self.assertTrue(self.producer.bound);self.assertFalse(self.producer.restored)
        (self.root/'stop.json').write_text('{}')
        restored=ec.generate_private_key(ec.SECP256R1());self.rotate(restored)
        self.assertTrue(self.producer.restored)
        f=self.flow(MAP,{'ekt':thumbprint(restored)})
        self.producer.request(f);f.response=Response.make(200,json.dumps({'status':200,'key':json.dumps(encrypt_envelope(restored.public_key(),b'{}'))}).encode());self.producer.response(f)
        self.assertTrue(self.producer.restore_verified);self.assertTrue((self.root/'stopped.json').exists())
    def test_restart_after_restoration_acceptance_verifies_the_native_map(self):
        (self.root/'stop.json').write_text('{}')
        native=ec.generate_private_key(ec.SECP256R1());self.rotate(native)
        self.producer=self.module.Producer();self.assertTrue(self.producer.restored)
        f=self.flow(MAP,{'ekt':thumbprint(native)})
        self.producer.request(f)
        f.response=Response.make(200,json.dumps({'status':200,'key':json.dumps(encrypt_envelope(native.public_key(),b'{}'))}).encode())
        self.producer.response(f);self.assertTrue(self.producer.restore_verified)

    def test_fresh_login_after_verified_restoration_archives_the_old_private_key(self):
        self.producer.restore_verified=True;self.producer.stage='complete';self.producer.status()
        self.producer=self.module.Producer();self.assertEqual(self.producer.stage,'native-restored')
        self.producer.response(self.flow(LOGIN,reply={'status':200,'token':self.token,'rotateAfterSeconds':259200}))
        self.assertEqual(self.producer.stage,'awaiting-first-rotation')
        self.assertEqual(len(list(self.root.glob('session-archive-*'))),1)
        self.rotate(self.app);self.assertTrue(self.producer.bound)

    def test_rejection_holds_queue_but_does_not_block_restoration(self):
        q=self.job();self.map(status=429)
        self.assertTrue(self.producer.paused);self.producer=self.module.Producer();self.assertTrue(self.producer.paused)
        (self.root/'stop.json').write_text('{}');self.rotate(ec.generate_private_key(ec.SECP256R1()))
        self.assertTrue(self.producer.restored)
    def test_unknown_native_recipient_detects_direct_rotation_and_requires_signin(self):
        native=ec.generate_private_key(ec.SECP256R1());f=self.flow(MAP,{'ekt':thumbprint(native)})
        self.producer.request(f);f.response=Response.make(200,json.dumps({'status':200,'key':json.dumps(encrypt_envelope(native.public_key(),b'{}'))}).encode());self.producer.response(f)
        self.assertEqual(self.producer.stage,'needs-sign-in');self.assertFalse(self.producer.bound)

    def test_a_refused_connection_is_kept_for_the_worker_without_holding_the_session(self):
        f=self.flow('/appRyde/getAppKeyInfo')
        f.response=Response.make(403,b'<html><head><title>403 Forbidden</title></head></html>',{'server':'awselb/2.0','content-type':'text/html'})
        self.producer.response(f)
        refused=json.loads((self.root/'upstream-refused.json').read_text())
        self.assertEqual(set(refused),{'at','httpStatus'});self.assertEqual(refused['httpStatus'],403)
        self.assertAlmostEqual(refused['at'],time.time(),delta=5);self.assertFalse(self.producer.paused)
        (self.root/'upstream-refused.json').unlink()
        self.producer.response(self.flow('/appRyde/getUserInfo'))
        self.assertFalse((self.root/'upstream-refused.json').exists())

if __name__=='__main__':unittest.main()
