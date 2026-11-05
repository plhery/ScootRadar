"""Fresh native requests only. Uses the already installed, scoped bridge protocol."""
import hashlib
import math
import json
import os
import time
from pathlib import Path
from urllib.parse import urlencode, parse_qsl, urlsplit
from cryptography.hazmat.primitives import serialization
from native_protocol import LOGIN, READS, BridgeTrial, MAP, ROTATE, origin_path, private_json, verified_form, success
from bridge_crypto import decrypt_envelope, thumbprint, public_key

ROOT = Path(os.environ['RYDE_PRODUCER_ROOT'])
FENCES = {'/appRyde/getCityFences', '/appRyde/getFencesInfo'}
READS.update(FENCES)
# Ryde's load balancer refusing the app's connection, whatever it asked.
REFUSED = {403, 429}

class Producer(BridgeTrial):
    def status(self, phase=None):
        if getattr(self, '_initializing', False): return
        super().status(phase)
        public=json.loads((self.directory/'status.json').read_text())
        public.pop('expiresAt',None);public['lifetime']='supervised'
        public['pendingJob']=getattr(self,'pending',None);public['pendingUntil']=getattr(self,'pending_deadline',0);public['paused']=getattr(self,'paused',False)
        private_json(self.directory/'status.json',public,replace=True)
        state = json.loads((self.directory/'bridge-state.json').read_text())
        state['paused'] = getattr(self, 'paused', False)
        state['pendingPublic'] = getattr(self, 'pending_public', None)
        temp = self.directory/'recovery.tmp'
        with os.fdopen(os.open(temp, os.O_CREAT|os.O_TRUNC|os.O_WRONLY, 0o600), 'w') as handle:
            json.dump(state, handle); handle.flush(); os.fsync(handle.fileno())
        if (self.directory/'bridge-private.pem').exists():
            with (self.directory/'bridge-private.pem').open('rb') as handle: os.fsync(handle.fileno())
        temp.replace(self.directory/'recovery.json')
        fd=os.open(self.directory, os.O_RDONLY)
        try: os.fsync(fd)
        finally: os.close(fd)

    def event(self, name, **details):
        self.events = self.events[-99:]
        super().event(name, **details)

    def __init__(self):
        saved = None
        try: saved = json.loads((ROOT/'session'/'recovery.json').read_text())
        except FileNotFoundError: pass
        self._initializing = True
        super().__init__(ROOT/'session')
        self._initializing = False
        self.map_requested = True
        self.pending = None
        self.pending_deadline = 0
        self.pending_public = saved.get('pendingPublic') if saved else None
        self.paused = bool(saved and saved.get('paused'))
        if saved and saved.get('bindingSent') and not saved.get('restoreVerified'):
            self.key = serialization.load_pem_private_key((self.directory/'bridge-private.pem').read_bytes(), password=None)
            self.token_hash = saved['tokenHash']; self.app_public = saved['appPublic']
            self.bound = True; self.binding_sent = True; self.stage = 'bridge-active'
            self.restore_public = saved.get('restorePublic')
            if saved.get('restored'):
                self.restored=True;self.stage='awaiting-restored-map'
            self.event('recovered-session')
        elif saved and saved.get('restoreVerified'):
            self.stage='native-restored';self.restore_verified=True;self.restored=True
            self.restore_public=saved.get('restorePublic');self.status()
        elif saved and saved.get('stage') == 'needs-sign-in':
            self.stage='needs-sign-in';self.status()
        elif saved and saved.get('stage') == 'awaiting-first-rotation':
            self.token_hash = saved['tokenHash']; self.stage = 'awaiting-first-rotation'; self.status()

    async def running(self):
        # Ready means addon recovery is complete, not merely that Popen returned.
        self.status()
        private_json(ROOT/'proxy-ready.json', {'pid':os.getpid(),'at':time.time()}, replace=True)

    def request(self, flow):
        path = origin_path(flow)
        if path in {MAP, ROTATE}:
            fields=dict(parse_qsl((flow.request.content or b'').decode()))
            self.event('native-read',path=path,tokenMatches=hashlib.sha256(fields.get('token','').encode()).hexdigest()==self.token_hash,
                appKeyMatches=bool(self.app_public and fields.get('ekt')==thumbprint(public_key(self.app_public))),bridgeKeyMatches=bool(self.key and fields.get('ekt')==thumbprint(self.key)),fields=sorted(fields))
        if path in FENCES:
            target={'cityId':43,'latitude':59.744,'longitude':10.205}
            try:
                job=json.loads((ROOT/'job.json').read_text())
                if job.get('expiresAt',0)>time.time(): target=job
            except FileNotFoundError: pass
            fields=dict(parse_qsl((flow.request.content or b'').decode()))
            self.event('native-fence-request',path=path,fields=sorted(fields))
            if hashlib.sha256(fields.get('token','').encode()).hexdigest()==self.token_hash:
                if 'cityId' in fields: fields['cityId']=str(target['cityId'])
                if 'userCityId' in fields: fields['userCityId']=str(target['cityId'])
                if 'gpsLa' in fields: fields['gpsLa']=str(target['latitude'])
                if 'gpsLo' in fields: fields['gpsLo']=str(target['longitude'])
                fields.pop('mapVersion',None) # request complete geometry, not a cached delta
                flow.request.content=urlencode(fields).encode()
            flow.metadata['fenceCityId']=fields.get('cityId',fields.get('userCityId'))
        if path == MAP: flow.metadata['nativeRecipient'] = fields.get('ekt')
        renewal = path == ROTATE and self.bound and self.stage == 'bridge-active' and not (ROOT/'stop.json').exists()
        if renewal:
            # The native app supplies both the fresh proof and next app-owned recipient.
            fields = verified_form(flow, self.token_hash)
            proposed = json.loads(fields['encJwk'])
            if fields['ekt'] != thumbprint(public_key(proposed)): raise ValueError('rotation recipient')
            self.pending_public = proposed
            fields['encJwk'] = json.dumps(__import__('bridge_crypto').jwk(self.key), separators=(',', ':'))
            fields['ekt'] = thumbprint(self.key)
            self.status() # record next app recipient before sending renewal
            flow.request.content = urlencode(fields).encode()
            flow.metadata['producerRenew'] = True
            return
        if path==MAP and self.pending_public and self.key:
            fields=verified_form(flow,self.token_hash)
            if fields.get('ekt') in {thumbprint(public_key(self.pending_public)),thumbprint(self.key)}:
                self.app_public=self.pending_public;self.pending_public=None;self.status()
        if path==MAP and self.restore_public and (ROOT/'stop.json').exists() and not self.restored:
            fields=verified_form(flow,self.token_hash)
            if fields.get('ekt')==thumbprint(public_key(self.restore_public)):
                self.restored=True;self.stage='awaiting-restored-map';self.status()
        if path in READS and self.bound and not self.restored and self.key:
            fields=verified_form(flow,self.token_hash)
            if fields.get('ekt')==thumbprint(self.key):
                # Native persistence can retain the server-returned bridge identifier.
                # Its encryption private key is still app-owned; restore the original
                # identifier for the base translator's validated app recipient check.
                fields['ekt']=thumbprint(public_key(self.app_public))
                flow.request.content=urlencode(fields).encode()
        super().request(flow)
        # Disable the experimental hard-coded first Drammen query.
        flow.metadata.pop('drammenRequest', None)
        if self.pending and time.time() >= self.pending_deadline:
            self.event('abandoned-native-request-expired')
            self.pending=None
        if path != MAP or flow.metadata.get('bridgeAction') != 'translate' or self.pending or self.paused or (ROOT/'stop.json').exists(): return
        try: job = json.loads((ROOT/'job.json').read_text())
        except FileNotFoundError: return
        if job['expiresAt'] <= time.time() or (ROOT/'results'/f"{job['id']}.json").exists(): return
        fields = verified_form(flow, self.token_hash)
        fields.update(cityId=str(job['cityId']), iotLa=str(job['latitude']), iotLo=str(job['longitude']), nearRadius=str(job['radius']))
        flow.request.content = urlencode(fields).encode()
        flow.metadata['producerJob'] = job
        self.pending = job['id']
        self.pending_deadline=min(job['expiresAt'],time.time()+30)
        self.event('job-assigned',jobId=job['id'],flowId=flow.id)

    def error(self, flow):
        job=flow.metadata.get('producerJob')
        self.event('native-flow-error',flowId=flow.id,jobId=job.get('id') if job else None)
        if job:
            private_json(ROOT/'results'/f"{job['id']}.json",{'version':1,'id':job['id'],'error':'TransportError'},replace=True)
            if self.pending==job['id']: self.pending=None
            self.paused=True;self.event('native-transport-failed')

    def note_refusal(self, flow):
        """Kept for the worker, which then leaves Ryde alone instead of relaunching the app every minute
        (worker.refused_after). From 01:07 UTC on 5 November 2026 Ryde's load balancer answered every
        request from the Mac with 403, and the app stopped on its network error."""
        if flow.response is None or flow.response.status_code not in REFUSED: return
        if urlsplit(flow.request.url).hostname!='api.ryde.vip': return
        private_json(ROOT/'upstream-refused.json',{'at':time.time(),'httpStatus':flow.response.status_code},replace=True)
        self.event('upstream-refused',httpStatus=flow.response.status_code,path=urlsplit(flow.request.url).path[:80])

    def response(self, flow):
        self.note_refusal(flow)
        if origin_path(flow)==LOGIN and self.stage in {'needs-sign-in','native-restored'}:
            reply=json.loads(flow.response.content)
            if success(flow,reply):
                # The previous native session was independently verified app-owned.
                # Keep its private recovery material in an archive, never overwrite it.
                self.directory.rename(ROOT/('session-archive-'+str(time.time_ns())))
                self.directory.mkdir(mode=0o700)
                self.stage='awaiting-login';self.key=None;self.app_public=None;self.restore_public=None
                self.bound=False;self.binding_sent=False;self.restored=False;self.restore_verified=False
                self.done=False;self.paused=False;self.token_hash=None
                self.pending=None;self.pending_deadline=0;self.pending_public=None
        if origin_path(flow) == MAP:
            try:
                summary=json.loads(flow.response.content)
                self.event('native-map-response',httpStatus=flow.response.status_code,appStatus=summary.get('status'),action=flow.metadata.get('bridgeAction'),flowId=flow.id,jobId=(flow.metadata.get('producerJob') or {}).get('id'),bridgeRecipient=bool(self.key and isinstance(summary.get('key'),str) and json.loads(summary['key']).get('ekt')==thumbprint(self.key)))
            except (ValueError,AttributeError): pass
        if origin_path(flow)==MAP and self.bound and not flow.metadata.get('bridgeAction'):
            try:
                reply=json.loads(flow.response.content); envelope=json.loads(reply.get('key','{}'))
                native=flow.metadata.get('nativeRecipient')
                if success(flow,reply) and native and envelope.get('ekt')==native and native!=thumbprint(self.key):
                    self.bound=False;self.binding_sent=False;self.paused=True;self.stage='needs-sign-in'
                    self.event('native-session-recovered-outside-proxy')
            except (ValueError,TypeError): pass
        if flow.metadata.get('producerRenew'):
            reply = json.loads(flow.response.content)
            if not success(flow, reply):
                self.pending_public=None;self.paused = True; self.event('renewal-rejected'); return
            self.app_public=self.pending_public;self.pending_public=None
            reply['rotateAfterSeconds'] = 120
            flow.response.content = json.dumps(reply, separators=(',', ':')).encode()
            self.event('native-renewal-accepted'); return
        job = flow.metadata.get('producerJob')
        if job:
            result = {'version':1, 'id':job['id'], 'query':job, 'observedAt':time.time(), 'coverage':'unknown'}
            try:
                reply = json.loads(flow.response.content)
                if not success(flow, reply): raise ValueError('upstream rejected')
                payload = json.loads(decrypt_envelope(self.key, json.loads(reply['key'])))
                rows = payload['scooters']
                if not isinstance(rows, list) or len(rows)>10000: raise ValueError('invalid scooter array')
                id_key = (ROOT/'id-key').read_bytes()
                scooters=[]; seen={}
                for row in rows:
                    identity=row['memberByString']; coord=row['coordinate']
                    lat=coord['latitude']; lng=coord['longitude']
                    import math
                    if not isinstance(identity,str) or not identity.isdigit() or not 1<=len(identity)<=32: raise ValueError('identity')
                    if type(lat) not in (int,float) or type(lng) not in (int,float) or not math.isfinite(lat+lng) or abs(lat)>85 or abs(lng)>180: raise ValueError('position')
                    if identity in seen:
                        old=seen[identity]
                        metres=math.hypot((lat-old[0])*111195,(lng-old[1])*111195*math.cos(math.radians(lat)))
                        if metres>5:raise ValueError('duplicate conflicting position')
                        continue
                    seen[identity]=(lat,lng)
                    import hmac
                    scooters.append({'id':hmac.new(id_key,identity.encode(),hashlib.sha256).hexdigest()[:32], 'lat':lat,'lng':lng})
                result['scooters']=scooters;result['returnedCount']=len(rows)
                if len(rows)>len(scooters):self.event('duplicate-map-rows-collapsed',count=len(rows)-len(scooters))
            except Exception as error:
                result['error']=type(error).__name__;result['reason']=str(error)[:160]; self.paused='payload' not in locals()
                if 'payload' in locals() and (ROOT/'capture-parser-error').exists():
                    private_json(ROOT/'parser-error-map.json',{'cityId':job['cityId'],'payload':payload},replace=True)
                    (ROOT/'capture-parser-error').unlink()
            private_json(ROOT/'results'/f"{job['id']}.json", result, replace=True)
            if self.pending==job['id']: self.pending=None
            self.status()
        if origin_path(flow) in FENCES and flow.response:
            try:
                reply=json.loads(flow.response.content)
                if success(flow, reply):
                    if self.key and isinstance(reply.get('key'),str):
                        envelope=json.loads(reply['key'])
                        if envelope.get('ekt')==thumbprint(self.key): reply['decrypted']=json.loads(decrypt_envelope(self.key,envelope))
                    # Only metadata response, never request headers, token or proof.
                    reply.pop('token',None)
                    captured={'path':origin_path(flow),'at':time.time(),'reply':reply}
                    private_json(ROOT/('native-'+origin_path(flow).rsplit('/',1)[1]+'.json'),captured,replace=True)
                    city=flow.metadata.get('fenceCityId')
                    if city and str(city).isdigit():
                        directory=ROOT/'city-metadata';directory.mkdir(mode=0o700,exist_ok=True)
                        private_json(directory/(str(city)+'-'+origin_path(flow).rsplit('/',1)[1]+'.json'),captured,replace=True)
            except (ValueError,TypeError): self.event('fence-response-unreadable')
        super().response(flow)
        if flow.metadata.get('bridgeAction') == 'bind' and self.bound:
            reply=json.loads(flow.response.content); reply['rotateAfterSeconds']=120
            flow.response.content=json.dumps(reply,separators=(',', ':')).encode()
        if flow.metadata.get('bridgeAction')=='bind' and self.binding_rejected:
            self.done=False;self.binding_sent=False;self.paused=True;self.stage='needs-sign-in';self.status()
        if self.done and self.restore_verified: private_json(ROOT/'stopped.json', {'restored':True,'at':time.time()}, replace=True)

addons=[Producer()]
