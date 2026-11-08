"""Validated native-proof and response-key translation. No direct API transport."""
import asyncio, base64, hashlib, json, os, time
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, utils
from mitmproxy import ctx
from bridge_crypto import encrypt_envelope, decrypt_envelope, public_key, jwk, thumbprint
def b64u(value): return base64.urlsafe_b64encode(value).decode().rstrip("=")
def unb64(value): return base64.urlsafe_b64decode(value+"="*((4-len(value)%4)%4))

LOGIN='/appRyde/userLoginByApple'
ROTATE='/appRyde/rotateSessionKey'
MAP='/appRyde/getNearScootersNew'
READS={MAP,'/appRyde/getVippsInfo','/appRyde/getAppKeyInfo','/appRyde/getEarthInfo','/appRyde/getCity','/appRyde/getUserUseNow'}
MAX_REQUEST=64*1024
MAX_RESPONSE=4*1024*1024


def origin_path(flow):
    u=urlsplit(flow.request.url)
    if (u.scheme=='https' and u.hostname=='api.ryde.vip' and u.port in (None,443)
        and not u.username and not u.password and not u.query and flow.request.method=='POST'):
        return u.path


def private_json(path, value, replace=False):
    target=path.with_suffix('.tmp') if replace else path
    flags=os.O_WRONLY|os.O_CREAT|(os.O_TRUNC if replace else os.O_EXCL)
    with os.fdopen(os.open(target,flags,0o600),'w') as f:json.dump(value,f,indent=2)
    target.chmod(0o600)
    if replace:target.replace(path)


def success(flow,reply):
    return (flow.response.status_code==200 and isinstance(reply,dict)
            and type(reply.get('status')) is int and reply['status']==200
            and not reply.get('needRegister'))


def verified_form(flow, token_hash):
    raw=flow.request.raw_content or b''
    if not 0<len(raw)<=MAX_REQUEST:raise ValueError('request size')
    pairs=parse_qsl(raw.decode('utf-8'),keep_blank_values=True)
    fields=dict(pairs)
    if len(fields)!=len(pairs):raise ValueError('duplicate form field')
    token=fields.get('token','')
    if not token or hashlib.sha256(token.encode()).hexdigest()!=token_hash:raise ValueError('session mismatch')
    if flow.request.headers.get('Authorization')!='DPoP '+token:raise ValueError('authorization mismatch')
    proof=flow.request.headers.get('DPoP','')
    if fields.get('dpopProof',proof)!=proof:raise ValueError('proof mismatch')
    parts=proof.split('.')
    if len(parts)!=3:raise ValueError('proof shape')
    header=json.loads(unb64(parts[0]));claims=json.loads(unb64(parts[1]));sig=unb64(parts[2])
    if header.get('alg')!='ES256' or len(sig)!=64:raise ValueError('proof algorithm')
    if (claims.get('htm')!='POST' or claims.get('htu')!=flow.request.url
        or claims.get('ath')!=b64u(hashlib.sha256(token.encode()).digest())
        or abs(time.time()-claims.get('iat',0))>90 or not claims.get('jti')):raise ValueError('proof claims')
    public_key(header['jwk']).verify(utils.encode_dss_signature(int.from_bytes(sig[:32],'big'),int.from_bytes(sig[32:],'big')),
                                   (parts[0]+'.'+parts[1]).encode(),ec.ECDSA(hashes.SHA256()))
    return fields


class BridgeTrial:
    def __init__(self,directory=None):
        self.directory=Path(directory or os.environ['RYDE_CAPTURE_DIR'])
        self.directory.mkdir(mode=0o700,parents=True,exist_ok=True)
        self.duration=max(1,min(900,int(os.environ.get('RYDE_TRIAL_SECONDS','300'))));self.started=time.time();self.stage='awaiting-login';self.token_hash=None
        self.key=None;self.app_public=None;self.restore_public=None
        self.bound=False;self.binding_sent=False;self.binding_rejected=False;self.restored=False;self.restore_verified=False;self.done=False;self.map_requested=False;self.map_saved=False
        self.tls_failures=0;self.last_error=None;self.events=[];self.login_interval=None
        self.status()

    def event(self,name,**details):
        self.events.append({'at':time.time(),'event':name,**details});self.status()

    def status(self,phase=None):
        public={'phase':phase or ('captured' if self.done else 'listening'),'startedAt':self.started,
                'expiresAt':self.started+self.duration,'captures':int(self.done),'tlsFailures':self.tls_failures,
                'trialVersion':2,'bridgeStage':self.stage,'bridgeKeyAccepted':self.bound,'nativeRestorationServerAccepted':self.restored,'nativeBindingRestored':self.restore_verified,
                'drammenMapCaptured':self.map_saved,'recoveryMayBeRequired':self.binding_sent and not self.binding_rejected and not self.restore_verified,
                'lastError':self.last_error,'events':self.events}
        private_json(self.directory/'status.json',public,replace=True)
        private_json(self.directory/'bridge-state.json',{'stage':self.stage,'tokenHash':self.token_hash,
            'appPublic':self.app_public,'bridgePublic':jwk(self.key) if self.key else None,
            'restorePublic':self.restore_public,'bound':self.bound,'bindingSent':self.binding_sent,'restored':self.restored,'restoreVerified':self.restore_verified},replace=True)

    async def running(self):
        self.status()
        async def expire():
            await asyncio.sleep(self.duration);self.status('expired');ctx.master.shutdown()
        asyncio.create_task(expire())

    def request(self,flow):
        path=origin_path(flow)
        if path not in READS|{ROTATE} or self.token_hash is None or self.done:return
        try:
            fields=verified_form(flow,self.token_hash)
            if path==ROTATE:
                proposed=json.loads(fields['encJwk']);public=public_key(proposed)
                if set(proposed)!={'kty','crv','x','y'} or fields.get('ekt')!=thumbprint(public):
                    raise ValueError('native rotation key shape or identifier mismatch')
                if self.stage=='awaiting-first-rotation':
                    self.key=ec.generate_private_key(ec.SECP256R1());self.app_public=proposed
                    pem=self.key.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.PKCS8,serialization.NoEncryption())
                    with os.fdopen(os.open(self.directory/'bridge-private.pem',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as f:f.write(pem)
                    fields['encJwk']=json.dumps(jwk(self.key),separators=(',',':'));fields['ekt']=thumbprint(self.key)
                    self.stage='binding';self.binding_sent=True;self.status() # Persist the recovery key before sending its public key.
                    flow.request.content=urlencode(fields).encode();flow.metadata['bridgeAction']='bind'
                elif self.bound and not self.restored and self.stage=='bridge-active':
                    self.restore_public=proposed;self.stage='restoring'
                    flow.metadata['bridgeAction']='restore';self.event('native-restoration-request')
                return
            if self.bound and not self.restored and self.stage in {'bridge-active','restoring'}:
                if fields.get('ekt')!=thumbprint(public_key(self.app_public)):return
                fields['ekt']=thumbprint(self.key)
                flow.metadata['bridgeAction']='translate'
                flow.metadata['appRecipient']=self.app_public
                flow.request.content=urlencode(fields).encode()
            elif self.restored and path in READS:
                restored_id=thumbprint(public_key(self.restore_public))
                previous_id=thumbprint(public_key(self.app_public))
                old_role=('restored' if fields.get('ekt')==restored_id else
                          'original-app' if fields.get('ekt')==previous_id else
                          'bridge' if fields.get('ekt')==thumbprint(self.key) else 'unknown')
                if old_role in {'original-app','bridge'}:
                    # A body prepared before the rotation can retain its old identifier.
                    # DPoP binds the URL/method/token, not this form field.
                    fields['ekt']=restored_id
                    flow.request.content=urlencode(fields).encode()
                flow.metadata['bridgeAction']='verify-restored' if path==MAP else 'observe-restored-read'
                self.event('post-restoration-request',path=path,originalKeyRole=old_role,
                           identifierUpdated=old_role in {'original-app','bridge'})
        except Exception as e:
            self.last_error='request validation: '+type(e).__name__
            self.event('request-left-unchanged',path=path,error=self.last_error)

    def translate(self,value,recipient,found):
        if isinstance(value,dict):return {k:self.translate(v,recipient,found) for k,v in value.items()}
        if isinstance(value,list):return [self.translate(v,recipient,found) for v in value]
        if isinstance(value,str) and value.startswith('{'):
            try:envelope=json.loads(value)
            except ValueError:return value
            if isinstance(envelope,dict) and envelope.get('alg')=='ECDH-ES+A256GCM' and envelope.get('ekt')==thumbprint(self.key):
                plaintext=decrypt_envelope(self.key,envelope)
                found.append(plaintext)
                return json.dumps(encrypt_envelope(recipient,plaintext),separators=(',',':'))
        return value

    def response(self,flow):
        path=origin_path(flow)
        if flow.response is None or path not in READS|{ROTATE,LOGIN}:return
        raw=flow.response.content or b''
        action=flow.metadata.get('bridgeAction')
        if len(raw)>MAX_RESPONSE:
            self.last_error='response exceeded size bound';self.status()
            if action=='translate':flow.kill()
            return
        try:reply=json.loads(raw)
        except (ValueError,UnicodeError):
            if action=='translate':
                self.last_error='non-JSON bridge response';self.status();flow.kill()
            return
        if path==LOGIN and self.stage=='awaiting-login' and success(flow,reply):
            token=reply.get('token')
            if not isinstance(token,str) or not token:return
            self.token_hash=hashlib.sha256(token.encode()).hexdigest()
            self.login_interval=reply.get('rotateAfterSeconds');reply['rotateAfterSeconds']=1
            flow.response.content=json.dumps(reply,separators=(',',':')).encode()
            self.stage='awaiting-first-rotation';self.event('login-interval-shortened',seconds=1)
        elif action=='bind':
            if success(flow,reply):
                self.bound=True;self.stage='bridge-active';reply['rotateAfterSeconds']=5
                flow.response.content=json.dumps(reply,separators=(',',':')).encode()
                self.event('bridge-key-accepted',nativeRotationDueAfterSeconds=5)
            else:
                self.stage='bind-rejected';self.done=True
                app_status=reply.get('status') if isinstance(reply,dict) else None
                self.binding_rejected=type(app_status) is int and app_status>=400
                self.event('bridge-key-rejected',httpStatus=flow.response.status_code,appStatus=app_status)
        elif action=='restore':
            if success(flow,reply):
                self.restored=True;self.stage='awaiting-restored-map'
                self.event('native-key-restored',normalIntervalSeconds=reply.get('rotateAfterSeconds'))
            else:
                self.stage='bridge-active';self.last_error='native restoration rejected'
                self.event('restoration-rejected',httpStatus=flow.response.status_code,appStatus=reply.get('status') if isinstance(reply,dict) else None)
        elif action=='translate':
            try:
                found=[];translated=self.translate(reply,flow.metadata['appRecipient'],found)
                if found:flow.response.content=json.dumps(translated,separators=(',',':')).encode()
            except Exception as e:
                self.last_error='response translation: '+type(e).__name__
                self.event('translation-failed',path=path,error=self.last_error)
                flow.kill() # Do not hand an undecryptable bridge envelope to the app.
        elif action in {'verify-restored','observe-restored-read'}:
            app_status=reply.get('status') if isinstance(reply,dict) else None
            self.event('post-restoration-response',path=path,httpStatus=flow.response.status_code,
                       appStatus=app_status if type(app_status) is int else None)
            if action!='verify-restored' or not success(flow,reply):return
            try:envelope=json.loads(reply.get('key',''))
            except (ValueError,TypeError):return
            role=('restored' if envelope.get('ekt')==thumbprint(public_key(self.restore_public)) else
                  'bridge' if envelope.get('ekt')==thumbprint(self.key) else 'other')
            self.event('post-restoration-envelope',keyRole=role)
            if envelope.get('alg')=='ECDH-ES+A256GCM' and role=='restored':
                self.stage='complete';self.done=True;self.restore_verified=True
                self.event('restored-map-verified')

    def tls_failed_client(self,data):
        address=getattr(data.context.server,'address',None)
        if address and address[0]=='api.ryde.vip':
            self.tls_failures+=1;self.status('client-tls-failed')
