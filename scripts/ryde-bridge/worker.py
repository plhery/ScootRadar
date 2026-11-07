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
import http.client
import uuid
import math
import re
import egress

ROOT=Path.home()/'.local/share/scootradar/ryde-bridge'
# Once Ryde refuses the app, or the app fails to bring a map FAILURES_BEFORE_HOLD times in a row, the
# worker leaves Ryde alone for HOLD, doubling up to HOLD_MAX while it goes on. From 01:07 UTC on
# 5 November 2026 Ryde's load balancer answered every request from the Mac with 403, the app stopped
# on "Please check your network connection", and the worker relaunched it every minute or so until
# it was paused at 02:41.
HOLD=15*60
HOLD_MAX=4*3600
FAILURES_BEFORE_HOLD=3
# The cache not answering, as while a deploy replaces its container: asked again after BROKER_RETRY,
# doubling up to BROKER_RETRY_MAX. A flat minute's wait after each failure left the worker idle for
# two minutes after each deploy.
BROKER_RETRY=5
BROKER_RETRY_MAX=60

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
                if egress.configured(root/'producer'):
                    route=json.loads((root/'producer/egress-ready.json').read_text())
                    if route['pid']!=ready['pid']:time.sleep(.25);continue
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
    egress.begin_cycle(root/'producer')
    if after_quit is not None: after_quit()
    # The lifecycle helper waits for confirmed process termination before returning.
    # Routing and job arming above finish synchronously, so no additional fixed pause is needed.
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
        headers={'Authorization':'Bearer '+config['token'],'Content-Type':'application/json',
                 'User-Agent':'ScootRadar-Ryde-Worker/1.0'},method=method)
    # No redirects: never forward worker credentials to a different endpoint.
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*args): return None
    with urllib.request.build_opener(NoRedirect()).open(request,timeout=15) as response:
        raw=response.read(4*1024*1024+1)
        if len(raw)>4*1024*1024: raise ValueError('Oversized broker reply')
        return json.loads(raw) if raw else None

class BrokerError(Exception):
    """The cache did not take a request: unreachable, as while a deploy replaces its container, or refusing
    it. Nothing to do with Ryde or the app, so it never holds the worker off Ryde."""
    def __init__(self, detail, code=None):
        super().__init__(detail);self.code=code

def broker(config, method, path, value=None):
    try: return call(config,method,path,value)
    except urllib.error.HTTPError as error: raise BrokerError(f'HTTP {error.code}',error.code) from error
    except (OSError,ValueError,http.client.HTTPException) as error: raise BrokerError(type(error).__name__) from error

def submit(config, result):
    """Hand the broker a result. It answers 400 for a job it no longer holds, one that expired or was leased
    before a deploy restarted the cache: the next job is asked for at once, not after a held minute."""
    try: broker(config,'POST','/internal/ryde/result',result)
    except BrokerError as error:
        if error.code!=400: raise

def hold_for(holds):
    """How long the worker leaves Ryde alone the `holds`-th time in a row: HOLD, doubling up to HOLD_MAX."""
    return min(HOLD*2**(holds-1),HOLD_MAX)

def refused_after(base, since):
    """When the producer last saw Ryde refuse the app (producer_addon.note_refusal), if after `since`."""
    try: at=json.loads((base/'upstream-refused.json').read_text())['at']
    except (FileNotFoundError,ValueError,KeyError,TypeError): return None
    return at if type(at) in (int,float) and at>since else None

def serve(config, base):
    """Takes the broker's jobs until an operator stop."""
    stop=base/'stop.json'
    started=last_trigger=time.time()
    hold_until=0;holds=0;failures=0;retry=BROKER_RETRY;reason=None
    while not stop.exists():
        # A refusal counts once its hold is over: one launch's several refused requests are one refusal.
        refused=refused_after(base,max(hold_until,started))
        if refused:
            holds+=1;failures=0;hold_until=refused+hold_for(holds);reason='RydeRefused'
        if time.time()<hold_until:
            save(base/'worker-status.json',{'state':'held','reason':reason,'until':hold_until,'at':time.time()})
            wait_interval(hold_until-time.time(),stop);continue
        available=egress.available_at(base)
        if available>time.time():
            save(base/'worker-status.json',{'state':'held','reason':'DatacenterBudget','until':available,'at':time.time()})
            wait_interval(available-time.time(),stop);continue
        try:
            job=broker(config,'GET','/internal/ryde/job')
            retry=BROKER_RETRY
            if job:
                validate_job(job)
                # Result remains private on disk, so a rejected submission can be retried without a new Ryde request.
                path=base/'results'/f"{job['id']}.json"
                try:
                    result=json.loads(path.read_text()) if path.exists() else query(job)
                    if 'error' in result:raise RuntimeError('Cached native map failed')
                except Exception:
                    submit(config,{'version':1,'id':job['id'],'query':job,'error':'worker_failed'})
                    raise
                submit(config,result)
                last_trigger=time.time();failures=0;holds=0
            elif time.time()-last_trigger>90:
                relaunch();last_trigger=time.time() # allow due native key renewals
            save(base/'worker-status.json',{'state':'ready','at':time.time()})
            wait_interval(0 if job else 2,stop)
        except BrokerError as error:
            save(base/'worker-status.json',{'state':'held','reason':'BrokerError','detail':str(error),'at':time.time()})
            wait_interval(retry,stop);retry=min(retry*2,BROKER_RETRY_MAX)
        except Exception as error:
            failures+=1
            if failures>=FAILURES_BEFORE_HOLD:
                holds+=1;failures=0;hold_until=time.time()+hold_for(holds);reason='AppFailing'
            save(base/'worker-status.json',{'state':'held','reason':type(error).__name__,'at':time.time()})
            wait_interval(60,stop)

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
    serve(config,base)

if __name__=='__main__': main()
