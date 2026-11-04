"""Outbound worker. Native credentials never leave this Mac. No direct Ryde API calls."""
import argparse
import fcntl
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.request
import urllib.error
import uuid
import math
import re

ROOT=Path.home()/'.local/share/scootradar/ryde-bridge'

def save(path, value):
    temp=path.with_suffix('.tmp')
    with os.fdopen(os.open(temp,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600),'w') as f:
        json.dump(value,f);f.flush();os.fsync(f.fileno())
    temp.replace(path)

def wait_interval(seconds, stop_path):
    """Back off without making an operator stop wait for the entire idle interval."""
    deadline=time.monotonic()+seconds
    while not stop_path.exists():
        remaining=deadline-time.monotonic()
        if remaining<=0:return False
        time.sleep(min(1,remaining))
    return True

def relaunch(root=ROOT, after_quit=None):
    config=json.loads((root/'config.json').read_text())
    helper=root/'ryde-lifecycle'
    deadline=time.time()+20
    while time.time()<deadline:
        try:
            ready=json.loads((root/'producer/proxy-ready.json').read_text())
            transport=json.loads((root/'transport-status.json').read_text())
            if ready['pid']==transport['proxyPid']:
                os.kill(ready['pid'],0);break
        except (FileNotFoundError,ProcessLookupError): pass
        time.sleep(.25)
    else: raise RuntimeError('Recovered proxy is not ready; Ryde was not relaunched')
    def lifecycle_event(phase):
        try:
            observed=subprocess.run([str(helper),'status'],check=True,capture_output=True,text=True,timeout=5)
            value={'at':time.time(),'phase':phase,**json.loads(observed.stdout)}
        except (subprocess.TimeoutExpired,subprocess.CalledProcessError,ValueError) as error:
            # Diagnostics must not invalidate an otherwise successful native map.
            value={'at':time.time(),'phase':phase,'statusUnavailable':type(error).__name__}
        with (root/'producer/lifecycle.jsonl').open('a') as handle: handle.write(json.dumps(value)+'\n')
    lifecycle_event('before-quit')
    subprocess.run([str(helper),'quit'],check=True,timeout=12)
    lifecycle_event('after-quit')
    if after_quit is not None: after_quit()
    time.sleep(2)
    try:
        subprocess.run([str(helper),'open',str(Path(config['appBinary']).parent)],check=True,timeout=15)
    except subprocess.TimeoutExpired:
        # LaunchServices can start Ryde before its completion callback returns.
        # Wait for the authenticated native response; don't kill/reopen it again.
        lifecycle_event('open-callback-late')
        return
    lifecycle_event('after-open')

def validate_job(job):
    if not isinstance(job,dict) or job.get('version')!=1 or not re.fullmatch('[a-f0-9]{32}',str(job.get('id',''))): raise ValueError('Invalid broker job')
    if set(job)!={'version','id','expiresAt','cityId','latitude','longitude','radius'}: raise ValueError('Unexpected broker fields')
    if type(job['cityId']) is not int or job['cityId']<=0: raise ValueError('Invalid city')
    for name,limit in [('latitude',85),('longitude',180),('radius',50)]:
        value=job[name]
        if type(value) not in (int,float) or not math.isfinite(value) or abs(value)>limit or (name=='radius' and value<=0): raise ValueError('Invalid query geography')
    if type(job['expiresAt']) not in (int,float) or not time.time()<job['expiresAt']<=time.time()+180: raise ValueError('Expired or excessive broker deadline')

def query(job, root=ROOT, timeout=60):
    validate_job(job)
    base=root/'producer'
    state=json.loads((base/'session/status.json').read_text())
    if state['bridgeStage'] not in {'bridge-active','awaiting-first-rotation'}: raise RuntimeError('Ryde bridge needs a completed operator sign-in')
    if state.get('paused'): raise RuntimeError('Ryde bridge held after an upstream failure')
    # Arm after termination: a spontaneous request just before quit could otherwise
    # consume the job and be cancelled by that very quit.
    relaunch(root,lambda:save(base/'job.json',job))
    end=min(time.time()+timeout,job['expiresAt'])
    path=base/'results'/f"{job['id']}.json"
    retry_at=time.time()+30;retried=False
    while time.time()<end:
        status=json.loads((base/'session/status.json').read_text())
        if status['bridgeStage']=='needs-sign-in': raise RuntimeError('Ryde bridge needs operator sign-in')
        if status.get('paused'): raise RuntimeError('Ryde bridge held after an upstream failure')
        if path.exists():
            result=json.loads(path.read_text())
            if 'error' in result: raise RuntimeError('Native map rejected or invalid; inspect local status')
            return result
        if not retried and time.time()>=retry_at and (not status.get('pendingJob') or status.get('pendingUntil',0)<=time.time()):
            # A client-cancelled request may never produce a response/error hook.
            # Retrigger once only when no live job is in flight; never retry a denial.
            retried=True;relaunch(root,lambda:save(base/'job.json',job))
        time.sleep(.25)
    raise TimeoutError('No fresh native map within job deadline')

def call(config, method, path, value=None):
    request=urllib.request.Request(config['url'].rstrip('/')+path,
        data=json.dumps(value).encode() if value is not None else None,
        headers={'Authorization':'Bearer '+config['token'],'Content-Type':'application/json'},method=method)
    # No redirects: never forward worker credentials to a different endpoint.
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*args): return None
    with urllib.request.build_opener(NoRedirect()).open(request,timeout=15) as response:
        raw=response.read(4*1024*1024+1)
        if len(raw)>4*1024*1024: raise ValueError('Oversized broker reply')
        return json.loads(raw) if raw else None

def main():
    p=argparse.ArgumentParser();p.add_argument('--once',action='store_true');p.add_argument('--stop',action='store_true');p.add_argument('--arm',action='store_true')
    p.add_argument('--city',type=int,default=43);p.add_argument('--lat',type=float,default=59.744);p.add_argument('--lng',type=float,default=10.205);p.add_argument('--radius',type=float,default=10)
    args=p.parse_args();base=ROOT/'producer'
    lock=(base/'worker.lock').open('a')
    if args.stop: save(base/'stop.json',{'at':time.time()})
    until=time.time()+50 if args.stop else time.time()
    while True:
        try: fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB);break
        except BlockingIOError:
            if time.time()>=until: raise SystemExit('Worker busy; stop requested, wait for its active job to finish')
            time.sleep(.25)
    if args.arm:
        state=json.loads((base/'session/status.json').read_text())
        if state.get('recoveryMayBeRequired'): raise SystemExit('Recover the outstanding binding before arming')
        (base/'stopped.json').unlink(missing_ok=True)
        (base/'stop.json').unlink(missing_ok=True)
        print('Armed. Restart the producer LaunchAgent, then complete one Apple sign-in.');return
    if args.stop:
        state=json.loads((base/'session/status.json').read_text())
        if state['bridgeStage']=='needs-sign-in' and not state.get('recoveryMayBeRequired'):
            save(base/'stopped.json',{'at':time.time(),'nativeKeyConfirmed':True,'reason':'working native session observed after direct rotation'})
            print('Native session already verified; transport is returning to idle');return
        save(base/'stop.json',{'at':time.time()})
        for _ in range(12):
            if (base/'stopped.json').exists(): print('App-owned key restoration verified');return
            relaunch();time.sleep(15)
        raise SystemExit('Restoration still pending; transport retained for recovery')
    if args.once:
        job={'version':1,'id':uuid.uuid4().hex,'cityId':args.city,'latitude':args.lat,'longitude':args.lng,'radius':args.radius,'expiresAt':time.time()+120}
        r=query(job);print(json.dumps({'id':r['id'],'scooters':len(r['scooters']),'observedAt':r['observedAt'],'coverage':r['coverage']}));return
    config_path=base/'worker-config.json'
    if config_path.stat().st_mode & 0o077: raise SystemExit('Worker config must be 0600')
    config=json.loads(config_path.read_text())
    if not config['url'].startswith('https://') or len(config['token'])<32: raise SystemExit('HTTPS and a dedicated token required')
    last_trigger=time.time()
    while True:
        if (base/'stop.json').exists(): return
        try:
            job=call(config,'GET','/internal/ryde/job')
            if job:
                validate_job(job)
                # Result remains private on disk, so a rejected submission can be retried without a new Ryde request.
                path=base/'results'/f"{job['id']}.json"
                try:
                    result=json.loads(path.read_text()) if path.exists() else query(job)
                    if 'error' in result:raise RuntimeError('Cached native map failed')
                except Exception:
                    call(config,'POST','/internal/ryde/result',{'version':1,'id':job['id'],'query':job,'error':'worker_failed'})
                    raise
                call(config,'POST','/internal/ryde/result',result)
                last_trigger=time.time()
            elif time.time()-last_trigger>90:
                relaunch();last_trigger=time.time() # allow due native key renewals
            save(base/'worker-status.json',{'state':'ready','at':time.time()})
            wait_interval(0 if job else 2,base/'stop.json')
        except Exception as error:
            save(base/'worker-status.json',{'state':'held','reason':type(error).__name__,'at':time.time()})
            wait_interval(60,base/'stop.json')

if __name__=='__main__': main()
