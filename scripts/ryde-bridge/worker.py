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
import signal
import sqlite3
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
WARM_WAIT=8
# Where the App Store installs Ryde. config.json's appBinary is where macOS unpacks the iPhone app
# to run it, under /var/folders, and a restart of the Mac empties that folder: opening it then
# fails, and the worker held itself off as AppFailing from the restart of 12 November 2026 at
# 21:28 CET until Ryde was opened by hand from here, which unpacked it again at the same place.
INSTALLED_APP=Path('/Applications/Ryde.app')
# The launchd job RunningBoard submits to run Ryde, under the same label at every launch. On
# 17 November 2026 at 02:33 CET RunningBoard took a launch's pid for a ShipIt updater's that had
# held it before ("Two equal instances have unequal identities"), so when that Ryde quit it never
# asked launchd to remove the job. launchd then refused every launch with error 37, "Operation
# already in progress", and the worker held itself off as AppFailing until the job was removed by
# hand at 20:48.
RYDE_LAUNCH_JOB=re.compile(r'application\.com\.ryde\.NewRyde\.[0-9.]+')
# A launch that fails on the Mac (the helper could not quit or open Ryde, or the proxy was not ready)
# never reached Ryde. The worker takes no job meanwhile and tries a launch again every LAUNCH_RETRY,
# taking jobs once one opens. Counted as app failures, the failed launches of 17 November 2026 held it
# off for 18 hours, the last holds 4 hours long.
LAUNCH_RETRY=60
# A warm read that leaves the desktop other than it found it pauses warm reads for WARM_PAUSE, and
# WARM_FAILURES_BEFORE_OFF in a row turn them off until the operator turns them on again. A single
# one on 14 November 2026 at 10:27 turned them off, and every read till 17 November relaunched Ryde.
WARM_PAUSE=3600
WARM_FAILURES_BEFORE_OFF=3
# WindowServer keeps about one Mach port for good for each process that connects to it and exits: each
# launch of Ryde Map Control (1.1 measured), and each Ryde cycle with its view services (5 to 8). On
# 26 November 2026 at 16:54 CET, after 7.8 days and 305,834 ports, the kernel killed WindowServer for a
# full port table and the user's session ended. The worker then launched Map Control 1,500 times an hour
# by day, three or four times a read, and Ryde 200 to 320 times. It now reads WindowServer's count every
# WINDOWSERVER_CHECK_EVERY and launches nothing at WINDOWSERVER_PORTS_STOP or more, until a logout or a
# restart of the Mac starts a new WindowServer with a few thousand.
WINDOWSERVER_PORTS_STOP=200_000
WINDOWSERVER_CHECK_EVERY=60
WINDOWSERVER_PORTS_LIMIT=305_834
# Ryde's or Map Control's crash reports, and quits or opens of Ryde that failed: ABNORMAL_EXITS of them
# within ABNORMAL_WINDOW hold the worker off for ABNORMAL_HOLD, longer than the 10 minutes of silence after
# which the cache tells Sentry (RYDE_WORKER_SILENT_MS).
ABNORMAL_EXITS=3
ABNORMAL_WINDOW=60
ABNORMAL_HOLD=15*60
CRASH_REPORTS=Path.home()/'Library/Logs/DiagnosticReports'
# Map Control stays running (serve) and answers each command within MAP_CONTROL_REPLY seconds; one that does
# not is stopped, and it is started at most once every MAP_CONTROL_RESTART, so a helper that keeps dying costs
# WindowServer a port every 10 minutes, not one a read. One that cannot be stopped is not asked again for
# MAP_CONTROL_RESTART, rather than waited on for each command. In the meantime reads are cold. A refresh takes
# up to about 7 seconds (RydeMapControl.swift), and one stopped before its answer may have left Ryde in front:
# it pauses warm reads as a bad restoration does.
MAP_CONTROL_REPLY=15
MAP_CONTROL_RESTART=600
map_control_unstoppable=0.0 # when a silent Map Control last could not be stopped
abnormal=[] # (at, what): the abnormal exits serve's guard counts
# While held, the worker tells the cache why once a minute, so its report of the silence says.
STATUS_EVERY=60
# Results the cache has had for a day are deleted, and the lifecycle journal is rotated at
# JOURNAL_LIMIT with one previous file: on 17 November 2026 results/ held 90,934 files, 532 MB.
RESULTS_KEPT=86400
JOURNAL_LIMIT=8*1024*1024

def remove_stale_launch_jobs():
    """Removes the launchd jobs for Ryde that run no process, returning their labels."""
    removed=[]
    try:
        listed=subprocess.run(['/bin/launchctl','list'],check=True,capture_output=True,text=True,timeout=5).stdout
        for fields in (line.split('\t') for line in listed.splitlines()):
            if len(fields)==3 and fields[0]=='-' and RYDE_LAUNCH_JOB.fullmatch(fields[2]):
                subprocess.run(['/bin/launchctl','remove',fields[2]],check=True,capture_output=True,timeout=5)
                removed.append(fields[2])
    except (subprocess.SubprocessError,OSError):pass
    return removed

class JobDeadline(Exception):
    """Queued work ran out of time; this is not evidence that Ryde failed."""

class LaunchFailed(RuntimeError):
    """Ryde could not be quit or opened on the Mac, or the proxy was not ready: Ryde was not contacted."""

def why(error):
    """What a failed helper command said (RydeLifecycle.swift's fail), else the exception's own words."""
    said=(getattr(error,'stderr',None) or '').strip() if isinstance(getattr(error,'stderr',None),str) else ''
    return (type(error).__name__+': '+(said or str(error)))[:300]

def journal(path,value):
    """Appends a line, rotating the file at JOURNAL_LIMIT with one previous file."""
    try:
        if path.stat().st_size>JOURNAL_LIMIT:path.replace(path.with_name(path.stem+'.previous'+path.suffix))
    except FileNotFoundError:pass
    with path.open('a') as handle:handle.write(json.dumps(value)+'\n')

def prune(base,now=None):
    """Deletes results the cache has had for RESULTS_KEPT, and map-control replies older than an hour."""
    now=time.time() if now is None else now
    for directory,kept in [(base/'results',RESULTS_KEPT),(base/'map-control-results',3600)]:
        try:entries=list(os.scandir(directory))
        except FileNotFoundError:continue
        for entry in entries:
            try:
                if entry.name.endswith('.json') and entry.is_file() and entry.stat().st_mtime<now-kept:os.unlink(entry.path)
            except FileNotFoundError:pass

def note_warm_restoration(base,details):
    """Pauses warm reads after one that left the desktop other than it found it, and turns them off
    after WARM_FAILURES_BEFORE_OFF in a row; a clean one clears the count."""
    failed=(not details.get('stayedMinimized') or
        (not details.get('userInterrupted') and (not details.get('focusRestored') or not details.get('cursorPreserved'))))
    path=base/'warm-control.json'
    try:control=json.loads(path.read_text())
    except (FileNotFoundError,ValueError):return
    if not isinstance(control,dict):return
    failures=control.get('restorationFailures') if type(control.get('restorationFailures')) is int else 0
    if not failed:
        if failures:control.pop('restorationFailures');save(path,control)
        return
    failures+=1
    control.update(restorationFailures=failures,lastRestorationFailure={'at':time.time(),
        **{k:details.get(k) for k in ['stayedMinimized','userInterrupted','focusRestored','cursorPreserved']}})
    if failures>=WARM_FAILURES_BEFORE_OFF:
        control.update(enabled=False,reason=f'desktop restoration failed {failures} times in a row',at=time.time())
    else:control['pausedUntil']=time.time()+WARM_PAUSE
    save(path,control)

def warm_helper(root):
    return root/'Ryde Map Control.app/Contents/MacOS/RydeMapControl'

def note_abnormal(what):
    abnormal.append((time.time(),what));del abnormal[:-20]

def map_control_running(base):
    """Whether the resident Map Control holds its lock (RydeMapControl.swift's holdServeLock), read
    without a process: a probe that takes the lock shared gives it back at once."""
    try:descriptor=os.open(base/'map-control.lock',os.O_RDONLY)
    except FileNotFoundError:return False
    try:
        fcntl.flock(descriptor,fcntl.LOCK_SH|fcntl.LOCK_NB)
        fcntl.flock(descriptor,fcntl.LOCK_UN)
        return False
    except BlockingIOError:return True
    finally:os.close(descriptor)

def map_control_pid(base):
    """The resident Map Control's pid, if that process is Map Control's, else None."""
    try:
        pid=json.loads((base/'map-control-ready.json').read_text())['pid']
        if type(pid) is not int or pid<=1:return None
        name=subprocess.run(['/bin/ps','-p',str(pid),'-o','comm='],capture_output=True,text=True,timeout=5).stdout.strip()
        return pid if name.endswith('/RydeMapControl') else None
    except (FileNotFoundError,ValueError,KeyError,TypeError,subprocess.SubprocessError,OSError):return None

def stop_map_control(base):
    """Stops a resident Map Control that did not answer: asked to quit, then killed after 2 seconds."""
    pid=map_control_pid(base)
    if pid is None:return
    for signal_number in [signal.SIGTERM,signal.SIGKILL]:
        try:os.kill(pid,signal_number)
        except ProcessLookupError:return
        until=time.time()+2
        while time.time()<until:
            if not map_control_running(base):return
            time.sleep(.05)

def start_map_control(root):
    """Starts the resident Map Control (serve) through LaunchServices, so it runs under its own Accessibility
    permission (run as the worker's child, it would be the worker's), at most once every MAP_CONTROL_RESTART."""
    base=root/'producer'
    try:last=float(json.loads((base/'map-control-started.json').read_text())['at'])
    except (FileNotFoundError,ValueError,KeyError,TypeError):last=0
    if 0<=time.time()-last<MAP_CONTROL_RESTART:return False
    save(base/'map-control-started.json',{'at':time.time()})
    serving=False
    try:
        subprocess.run(['/usr/bin/open','-n','-g',str(root/'Ryde Map Control.app'),'--args','serve'],
            check=True,capture_output=True,text=True,timeout=10)
        until=time.time()+5
        while not (serving:=map_control_running(base)) and time.time()<until:time.sleep(.1)
    except (subprocess.SubprocessError,OSError):pass
    journal(base/'map-control.jsonl',{'at':time.time(),'action':'start','answer':'serving' if serving else 'not-serving'})
    return serving

def run_map_control(root,action):
    """One command for the resident Map Control, started if it is not running: its reply, or ValueError."""
    global map_control_unstoppable
    if action not in {'status','refresh','prepare'}:raise ValueError('Unsupported map control action')
    base=root/'producer';nonce=uuid.uuid4().hex
    path=base/'map-control-results'/f'{nonce}.json';answer='no-reply';minimizing={}
    try:
        if 0<=time.time()-map_control_unstoppable<MAP_CONTROL_RESTART:
            answer='unstoppable';raise ValueError('Map Control gave no reply and could not be stopped')
        if not map_control_running(base) and not start_map_control(root):
            answer='not-running';raise ValueError('Map Control is not running')
        save(base/'map-control-request.json',{'id':nonce,'action':action,'expiresAt':time.time()+12})
        until=time.time()+MAP_CONTROL_REPLY
        while True:
            try:value=json.loads(path.read_text());break
            except (FileNotFoundError,ValueError):
                if time.time()>=until:
                    stop_map_control(base)
                    if map_control_running(base):map_control_unstoppable=time.time()
                    if action=='refresh':note_warm_restoration(base,{})
                    raise ValueError('Map Control gave no reply') from None
                time.sleep(.02)
        if not isinstance(value,dict):raise ValueError('Invalid map control result')
        answer=str(value.get('error','ok'))[:40]
        minimizing={k:value[k] for k in ['minimizedBy','minimizeSet','minimizePress','minimized','hidden'] if type(value.get(k)) in (str,int,bool)}
        if 'error' in value:raise ValueError('Map control unavailable: '+str(value['error']))
        return value
    finally:
        path.unlink(missing_ok=True)
        # A resident started later must not answer this request again.
        (base/'map-control-request.json').unlink(missing_ok=True)
        # Why it declined, which the reply deleted above no longer says (26 November 2026).
        journal(base/'map-control.jsonl',{'at':time.time(),'action':action,'answer':answer,**minimizing})

def warm_enabled(root):
    try:
        value=json.loads((root/'producer/warm-control.json').read_text())
        return value.get('enabled') is True and value.get('mode')=='minimized-idle'
    except (FileNotFoundError,ValueError,AttributeError):return False

def warm_available(root):
    base=root/'producer'
    if not warm_enabled(root) or not warm_helper(root).exists():return False
    def observed(eligible,reason,state=None):
        save(base/'last-warm-admission.json',{'at':time.time(),'eligible':eligible,'reason':reason,
            'helper':{k:state.get(k) for k in ['trusted','singleInstance','idleEligible','minimizedRefresh','locked']} if state else None})
        return eligible
    try:
        value=json.loads((base/'warm-control.json').read_text())
        if float(value.get('pausedUntil',0))>time.time():return observed(False,'operator-paused')
        if not egress.warm_ready(base):return observed(False,'route-lease-or-budget')
        state=run_map_control(root,'status')
        eligible=all(state.get(k) is True for k in ['trusted','singleInstance','idleEligible','minimizedRefresh']) and state.get('locked') is False
        return observed(eligible,'ready' if eligible else 'desktop-or-permission',state)
    except (subprocess.SubprocessError,ValueError,TypeError,OSError,AttributeError):return observed(False,'helper-unavailable')

def prepare_warm(root):
    """After a cold read is published, minimize the home map for the next read, without activation."""
    if not warm_enabled(root) or not warm_helper(root).exists():return
    try:run_map_control(root,'prepare')
    except (subprocess.SubprocessError,OSError,ValueError):pass # Never invalidate a submitted map.

def windowserver_ports():
    """WindowServer's pid and how many Mach ports it holds (top), or None if they cannot be read."""
    try:
        pid=subprocess.run(['/usr/bin/pgrep','-x','WindowServer'],check=True,capture_output=True,text=True,timeout=5).stdout.split()[0]
        listed=subprocess.run(['/usr/bin/top','-l','1','-pid',pid,'-stats','pid,ports'],check=True,capture_output=True,text=True,timeout=15).stdout
        for fields in (line.split() for line in listed.splitlines()):
            if len(fields)==2 and fields[0]==pid:return int(pid),int(fields[1].rstrip('+-'))
    except (subprocess.SubprocessError,OSError,ValueError,IndexError):pass
    return None

def new_crash_reports(seen,since):
    """Ryde's and Map Control's crash reports written after `since` and not in `seen`, which takes them."""
    found=[]
    try:entries=list(os.scandir(CRASH_REPORTS))
    except OSError:return found
    for entry in entries:
        if entry.name.startswith(('Ryde-','RydeMapControl-')) and entry.name not in seen:
            try:
                if entry.stat().st_mtime>since:seen.add(entry.name);found.append(entry.name)
            except OSError:pass
    return found

def cold_fallback_ready(job,root,end):
    """The proxy acknowledges disarming on its native-hook event loop, never during a live job."""
    base=root/'producer';nonce=uuid.uuid4().hex
    save(base/'warm-disarm.json',{'id':job['id'],'nonce':nonce,'expiresAt':time.time()+5})
    until=min(end,time.time()+3)
    while time.time()<until:
        if (base/'results'/f"{job['id']}.json").exists():return False
        try:
            ack=json.loads((base/'warm-disarm-ack.json').read_text())
            if ack.get('id')==job['id'] and ack.get('nonce')==nonce and ack.get('safeToQuit') is True:return True
        except (FileNotFoundError,ValueError):pass
        time.sleep(.1)
    return False

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
    else: raise LaunchFailed('Recovered proxy is not ready; Ryde was not relaunched')
    def lifecycle_event(phase,**details):
        try:
            observed=subprocess.run([str(helper),'status'],check=True,capture_output=True,text=True,timeout=5)
            value={'at':time.time(),'phase':phase,**json.loads(observed.stdout),**details}
        except (subprocess.TimeoutExpired,subprocess.CalledProcessError,ValueError) as error:
            # Diagnostics must not invalidate an otherwise successful native map.
            value={'at':time.time(),'phase':phase,'statusUnavailable':type(error).__name__,**details}
        journal(root/'producer/lifecycle.jsonl',value)
    def run(*command,timeout):
        return subprocess.run([str(helper),*command],check=True,capture_output=True,text=True,timeout=timeout)
    lifecycle_event('before-quit')
    try:
        try:
            run('quit',timeout=12)
        except (subprocess.CalledProcessError,subprocess.TimeoutExpired) as error:
            # A helper that hangs past its own 10 seconds is as stuck as one that gives up: on 27 Nov
            # Ryde's "closed for the season" alert held quit itself, three times, and the feed stopped.
            if isinstance(error,subprocess.CalledProcessError) and error.returncode!=1:raise
            lifecycle_event('graceful-quit-stuck',**({'error':why(error)} if isinstance(error,subprocess.TimeoutExpired) else {}))
            # Never kill a live native map/rotation, even after its public job deadline.
            # A new control nonce is acknowledged on the proxy's native-hook loop.
            if not cold_fallback_ready({'id':uuid.uuid4().hex},root,time.time()+3):
                raise LaunchFailed('Ryde quit stalled; native activity prevents forced recovery') from error
            lifecycle_event('before-forced-quit')
            run('force-quit',timeout=5)
            lifecycle_event('after-forced-quit')
    except (subprocess.CalledProcessError,subprocess.TimeoutExpired) as error:
        lifecycle_event('quit-failed',error=why(error));note_abnormal('Ryde did not quit')
        raise LaunchFailed(why(error)) from error
    lifecycle_event('after-quit')
    egress.begin_cycle(root/'producer')
    if after_quit is not None: after_quit()
    # The lifecycle helper waits for confirmed process termination before returning.
    # Routing and job arming above finish synchronously, so no additional fixed pause is needed.
    unpacked=Path(config['appBinary']).parent
    app=str(unpacked if unpacked.exists() else INSTALLED_APP)
    try:
        try:
            run('open',app,timeout=15)
        except subprocess.CalledProcessError as error:
            # Ryde has quit above, so a launchd job of its with no process is one left behind.
            if not remove_stale_launch_jobs():raise
            lifecycle_event('stale-launch-job-removed',error=why(error))
            run('open',app,timeout=15)
    except subprocess.TimeoutExpired:
        # LaunchServices can start Ryde before its completion callback returns.
        # Wait for the authenticated native response; don't kill/reopen it again.
        lifecycle_event('open-callback-late')
        return
    except subprocess.CalledProcessError as error:
        lifecycle_event('open-failed',error=why(error));note_abnormal('Ryde did not open')
        raise LaunchFailed(why(error)) from error
    lifecycle_event('after-open')

def validate_job(job):
    if not isinstance(job,dict) or job.get('version')!=1 or not re.fullmatch('[a-f0-9]{32}',str(job.get('id',''))): raise ValueError('Invalid broker job')
    if set(job)!={'version','id','expiresAt','cityId','latitude','longitude','radius'}: raise ValueError('Unexpected broker fields')
    if type(job['cityId']) is not int or job['cityId']<=0: raise ValueError('Invalid city')
    for name,limit in [('latitude',85),('longitude',180),('radius',50)]:
        value=job[name]
        if type(value) not in (int,float) or not math.isfinite(value) or abs(value)>limit or (name=='radius' and value<=0): raise ValueError('Invalid query geography')
    if type(job['expiresAt']) not in (int,float) or not math.isfinite(job['expiresAt']) or job['expiresAt']>time.time()+180: raise ValueError('Invalid broker deadline')
    if job['expiresAt']<=time.time():raise JobDeadline('Broker job already expired')

def query(job, root=ROOT, timeout=60):
    validate_job(job)
    if job['expiresAt']<time.time()+20:raise JobDeadline('Too little time remains for a native request')
    base=root/'producer'
    state=json.loads((base/'session/status.json').read_text())
    if state['bridgeStage'] not in {'bridge-active','awaiting-first-rotation'}: raise RuntimeError('Ryde bridge needs a completed operator sign-in')
    if state.get('paused') and state.get('pauseReason')=='transport':
        # Recovery never edits session/key files. The proxy clears this legacy hold
        # only after decrypting and translating a fresh successful native map.
        relaunch(root)
        try:run_map_control(root,'prepare')
        except (subprocess.SubprocessError,OSError,ValueError):pass
        until=min(time.time()+30,job['expiresAt'])
        while time.time()<until:
            state=json.loads((base/'session/status.json').read_text())
            if not state.get('paused'):break
            time.sleep(.25)
    if state.get('paused'): raise RuntimeError('Ryde bridge held after an upstream failure')
    end=min(time.time()+timeout,job['expiresAt'])
    path=base/'results'/f"{job['id']}.json"
    warm=warm_available(root)
    if warm:
        save(base/'job.json',job)
        try:
            details=run_map_control(root,'refresh')
            if not details.get('dispatched'):raise ValueError('Warm trigger unavailable')
            note_warm_restoration(base,details)
            save(base/'last-trigger.json',{'mode':'warm','at':time.time(),'trigger':details.get('trigger'),
                'pid':details.get('pid'),'focusRestored':details.get('focusRestored'),
                'cursorPreserved':details.get('cursorPreserved'),'stayedMinimized':details.get('stayedMinimized'),
                'userInterrupted':details.get('userInterrupted')})
        except (subprocess.SubprocessError,ValueError,OSError):
            # Even an interrupted helper may have activated the app. Disarm through the proxy
            # before quitting; an in-flight native request is allowed to finish normally.
            if cold_fallback_ready(job,root,end):warm=False
        fallback_at=time.time()+WARM_WAIT
    if not warm:
        # Arm after termination: a spontaneous request just before quit must not claim
        # the next job and be cancelled by that very quit.
        # Not prepared here: Ryde has just been opened without its window yet, and Map Control declined
        # (exit 4) after nearly every open. serve prepares it once the map is published.
        relaunch(root,lambda:save(base/'job.json',job))
        save(base/'last-trigger.json',{'mode':'restart','at':time.time()})
    retry_at=time.time()+30;retried=False;fallback_checked=not warm
    while time.time()<end:
        status=json.loads((base/'session/status.json').read_text())
        if status['bridgeStage']=='needs-sign-in': raise RuntimeError('Ryde bridge needs operator sign-in')
        if status.get('paused'): raise RuntimeError('Ryde bridge held after an upstream failure')
        if path.exists():
            result=json.loads(path.read_text())
            if 'error' in result: raise RuntimeError('Native map rejected or invalid; inspect local status')
            return result
        if warm and not fallback_checked and time.time()>=fallback_at:
            fallback_checked=True
            if cold_fallback_ready(job,root,end):
                relaunch(root,lambda:save(base/'job.json',job));warm=False;retry_at=time.time()+30
                save(base/'last-trigger.json',{'mode':'restart-fallback','at':time.time()})
        if not warm and not retried and time.time()>=retry_at and (not status.get('pendingJob') or status.get('pendingUntil',0)<=time.time()):
            # A client-cancelled request may never produce a response/error hook.
            # Retrigger once only when no live job is in flight; never retry a denial.
            retried=True;relaunch(root,lambda:save(base/'job.json',job))
        time.sleep(.25)
    if job['expiresAt']<=time.time():raise JobDeadline('Broker deadline elapsed during native request')
    raise TimeoutError('No fresh native map within worker timeout')

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

def tell_broker(config, value):
    """While held, tells the cache why (RydeBroker's status), so its report of the silence says. Best effort:
    a cache that does not answer, or does not know the route yet, changes nothing here."""
    body={'version':1,'state':'held','reason':value['reason'],'until':value.get('until'),'at':value['at']}
    if value.get('detail'):body['detail']=value['detail'][:300]
    try: broker(config,'POST','/internal/ryde/status',body)
    except BrokerError: pass

def serve(config, base):
    """Takes the broker's jobs until an operator stop."""
    stop=base/'stop.json'
    started=last_trigger=time.time()
    hold_until=0;holds=0;failures=0;retry=BROKER_RETRY;reason=None;detail=None;launch_failed=False;pruned=0
    # Waits that are not about Ryde (LaunchFailed, DatacenterBudget) keep their own deadline: a refusal
    # counts only once later than hold_until.
    wait_until=0;wait_reason=None;wait_detail=None
    # The guards against what the bridge's launches cost the Mac (WINDOWSERVER_PORTS_STOP, ABNORMAL_EXITS).
    ports_checked=0;crash_reports=set()
    def guard():
        nonlocal ports_checked,wait_until,wait_reason,wait_detail
        if time.time()-ports_checked>=WINDOWSERVER_CHECK_EVERY:
            ports_checked=time.time();seen=windowserver_ports()
            if seen:
                save(base/'windowserver.json',{'at':ports_checked,'pid':seen[0],'ports':seen[1]})
                if seen[1]>=WINDOWSERVER_PORTS_STOP:
                    wait_until=ports_checked+WINDOWSERVER_CHECK_EVERY;wait_reason='WindowServerPorts'
                    wait_detail=(f'WindowServer holds {seen[1]} Mach ports and macOS ends the session at about '
                        f'{WINDOWSERVER_PORTS_LIMIT}: log out and back in, or restart the Mac, to reset it')
                    return True
        for name in new_crash_reports(crash_reports,started):note_abnormal('crash report '+name)
        # Within ABNORMAL_WINDOW of each other, not of now: a failed read is followed by a minute's wait.
        for first in range(len(abnormal)-ABNORMAL_EXITS+1):
            burst=abnormal[first:first+ABNORMAL_EXITS]
            if burst[-1][0]-burst[0][0]<=ABNORMAL_WINDOW:
                abnormal.clear()
                wait_until=time.time()+ABNORMAL_HOLD;wait_reason='AbnormalExits'
                wait_detail=f'{ABNORMAL_EXITS} within {ABNORMAL_WINDOW} s: '+'; '.join(what for _,what in burst)
                return True
        return False
    def held(reason,until,detail=None,tell=True):
        value={'state':'held','reason':reason,'until':until,'at':time.time()}
        if detail:value['detail']=detail
        save(base/'worker-status.json',value)
        if tell:tell_broker(config,value)
    while not stop.exists():
        if time.time()-pruned>=3600:
            prune(base);pruned=time.time()
        # A refusal counts once its hold is over: one launch's several refused requests are one refusal.
        refused=refused_after(base,max(hold_until,started))
        if refused:
            holds+=1;failures=0;hold_until=refused+hold_for(holds);reason='RydeRefused';detail=None;launch_failed=False
        if time.time()<hold_until:
            held(reason,hold_until,detail)
            wait_interval(min(STATUS_EVERY,hold_until-time.time()),stop);continue
        if time.time()<wait_until:
            held(wait_reason,wait_until,wait_detail)
            wait_interval(min(STATUS_EVERY,wait_until-time.time()),stop);continue
        if guard():continue
        try:
            if launch_failed:
                # Ryde could not be opened: try again with no job, and take jobs once it opens.
                relaunch();launch_failed=False;last_trigger=time.time()
            available=egress.available_at(base)
            if available>time.time():
                wait_until=available;wait_reason='DatacenterBudget';wait_detail=None;continue
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
                # A warm read leaves Ryde minimized on its map, ready for the next one.
                try:trigger=json.loads((base/'last-trigger.json').read_text())
                except (FileNotFoundError,ValueError):trigger={}
                if not (isinstance(trigger,dict) and trigger.get('mode')=='warm' and trigger.get('stayedMinimized') is True):
                    prepare_warm(base.parent)
                last_trigger=time.time();failures=0;holds=0
            elif time.time()-last_trigger>90:
                relaunch();last_trigger=time.time() # allow due native key renewals
            save(base/'worker-status.json',{'state':'ready','at':time.time()})
            wait_interval(0 if job else 2,stop)
        except JobDeadline:
            # Reject stale backlog promptly. A short broker deadline must not
            # accumulate app failures or force a healthy worker into a long hold.
            save(base/'worker-status.json',{'state':'ready','reason':'BrokerJobExpired','at':time.time()})
            wait_interval(0,stop)
        except LaunchFailed as error:
            # Not counted as an app failure: Ryde was not contacted.
            launch_failed=True;wait_until=time.time()+LAUNCH_RETRY;wait_reason='LaunchFailed';wait_detail=why(error)
        except egress.EgressWait as error:
            # The pool's hourly budget ran out between the readiness check and the launch.
            wait_until=error.until;wait_reason='DatacenterBudget';wait_detail=None
        except sqlite3.OperationalError:
            # Local accounting contention is neither an app failure nor an upstream denial.
            # Keep routing closed and retry promptly without killing the worker.
            held('DatacenterAccounting',time.time()+BROKER_RETRY,tell=False)
            wait_interval(BROKER_RETRY,stop)
        except BrokerError as error:
            save(base/'worker-status.json',{'state':'held','reason':'BrokerError','detail':str(error),'at':time.time()})
            wait_interval(retry,stop);retry=min(retry*2,BROKER_RETRY_MAX)
        except Exception as error:
            failures+=1;detail=why(error)
            if failures>=FAILURES_BEFORE_HOLD:
                holds+=1;failures=0;hold_until=time.time()+hold_for(holds);reason='AppFailing'
            save(base/'worker-status.json',{'state':'held','reason':type(error).__name__,'detail':detail,'at':time.time()})
            wait_interval(60,stop)

def status_report(root=ROOT, now=None):
    """The bridge at a glance, for the operator (--status): read only, and never takes the worker lock."""
    now=time.time() if now is None else now;base=root/'producer';lines=[]
    def read(path):
        try:return json.loads(path.read_text())
        except (FileNotFoundError,ValueError):return None
    def when(at):
        if not at:return 'never'
        moment=time.strftime('%d %b %H:%M:%S',time.localtime(at));seconds=int(at-now)
        span=abs(seconds);text=f'{span//86400}d {span%86400//3600}h' if span>=86400 else f'{span//3600}h {span%3600//60}m' if span>=3600 else f'{span//60}m {span%60}s'
        return f'{moment} (just now)' if span<5 else f'{moment} ({"in "+text if seconds>=0 else text+" ago"})'
    def line(name,text):lines.append(f'{name:<14}{text}')
    try:listed=subprocess.run(['/bin/launchctl','list'],capture_output=True,text=True,timeout=5).stdout
    except (subprocess.SubprocessError,OSError):listed=''
    jobs={fields[2]:fields[0] for fields in (l.split('\t') for l in listed.splitlines()) if len(fields)==3}
    worker=read(base/'worker-status.json') or {}
    pid=jobs.get('com.scootradar.ryde-worker')
    state=worker.get('state','unknown')+(': '+worker['reason'] if worker.get('reason') else '')
    if worker.get('until'):state+=' until '+when(worker['until'])
    line('Worker',('not loaded' if pid is None else 'not running' if pid=='-' else f'pid {pid}')+', '+state)
    if worker.get('detail'):line('',worker['detail'])
    count=0;latest=0
    try:
        for entry in os.scandir(base/'results'):
            at=entry.stat().st_mtime;latest=max(latest,at);count+=at>now-3600
    except FileNotFoundError:pass
    line('Maps',f'{count} in the last hour, last {when(latest)}')
    launches=0;last=None
    try:
        with (base/'lifecycle.jsonl').open('rb') as handle:
            handle.seek(max(0,handle.seek(0,2)-2_000_000));handle.readline()
            for raw in handle:
                try:event=json.loads(raw)
                except ValueError:continue
                launches+=event.get('phase')=='after-open' and event.get('at',0)>now-3600;last=event
    except FileNotFoundError:pass
    ryde=[label for label in jobs if RYDE_LAUNCH_JOB.fullmatch(label)]
    running=[jobs[label] for label in ryde if jobs[label]!='-']
    text=f'running (pid {", ".join(running)})' if running else 'not running'
    if len(ryde)>len(running):text+=f'; {len(ryde)-len(running)} launchd job(s) left with no process'
    line('Ryde',f'{text}; {launches} launches in the last hour')
    if last:line('',f'last lifecycle event: {last.get("phase")} {when(last.get("at"))}'+(f' ({last["error"]})' if last.get('error') else ''))
    session=read(base/'session/status.json') or {}
    line('Session',f'{session.get("bridgeStage","unknown")}'+(f', paused: {session.get("pauseReason") or "yes"}' if session.get('paused') else '')
        +(f', last error: {session["lastError"]}' if session.get('lastError') else ''))
    ready=read(base/'proxy-ready.json') or {};transport=read(root/'transport-status.json') or {}
    proxy=transport.get('proxyPid')
    try:os.kill(proxy,0);alive=True
    except (TypeError,ProcessLookupError,PermissionError):alive=False
    line('Proxy',f'pid {proxy}, '+('running' if alive else 'not running')+(', ready' if ready.get('pid')==proxy else ', not ready')+f', mode {transport.get("mode")}')
    try:
        pool=egress.Pool(base)
        try:
            snap=pool.snapshot(now);rolling=snap['rollingHour']
            full=sum(1 for n in rolling.values() if n+egress.LAUNCH_RESERVE>200)
            text=f'{sum(rolling.values())} calls in the last hour over {snap["gatewayCount"]} IPs (200 each); {full} without room for a launch'
            if snap['holdUntil']>now:text+=f'; refusal hold until {when(snap["holdUntil"])}'
            cooling=[u for u in snap['transportCooldowns'].values() if u>now]
            if cooling:text+=f'; {len(cooling)} cooling'
            line('Egress',text)
        finally:pool.close()
    except (OSError,ValueError,sqlite3.Error) as error:line('Egress',f'unavailable ({type(error).__name__})')
    control=read(base/'warm-control.json') or {}
    if control.get('enabled') is not True:text='off'+(f' ({control["reason"]})' if control.get('reason') else '')
    elif float(control.get('pausedUntil',0))>now:text='paused until '+when(float(control['pausedUntil']))
    else:text='on'
    if control.get('restorationFailures'):text+=f'; {control["restorationFailures"]} restoration failure(s) in a row'
    trigger=read(base/'last-trigger.json') or {}
    line('Warm reads',text+(f'; last trigger {trigger.get("mode")} {when(trigger.get("at"))}' if trigger else ''))
    answers={};starts=0
    try:
        with (base/'map-control.jsonl').open('rb') as handle:
            if handle.seek(max(0,handle.seek(0,2)-1_000_000)):handle.readline()
            for raw in handle:
                try:event=json.loads(raw)
                except ValueError:continue
                if not isinstance(event,dict) or not isinstance(event.get('at'),(int,float)) or event['at']<=now-3600:continue
                if event.get('action')=='start':starts+=1
                else:answers[event.get('answer')]=answers.get(event.get('answer'),0)+1
    except FileNotFoundError:pass
    ready=read(base/'map-control-ready.json')
    if not isinstance(ready,dict):ready={}
    text=(f'serving since {when(ready.get("startedAt"))} (pid {ready.get("pid")})' if map_control_running(base) else 'not running')
    if answers:text+=f'; {sum(answers.values())} answers in the last hour ('+', '.join(
        f'{n} {answer}' for answer,n in sorted(answers.items(),key=lambda item:-item[1]))+')'
    if starts:text+=f'; started {starts} time(s) in the last hour'
    if answers or starts or ready:line('Map Control',text)
    ports=read(base/'windowserver.json')
    if ports:line('WindowServer',f'{ports.get("ports")} Mach ports {when(ports.get("at"))} (pid {ports.get("pid")}); the worker '
        f'launches nothing from {WINDOWSERVER_PORTS_STOP}, and macOS ends the session at about {WINDOWSERVER_PORTS_LIMIT}')
    config=read(root/'config.json') or {}
    expires=config.get('certificateExpiresTimestamp')
    if expires:line('Certificate',f'expires {when(expires)}; collection stops for its renewal {when(expires-7*86400)}')
    if (base/'stop.json').exists():line('Stop','requested: the worker takes no jobs')
    return '\n'.join(lines)

def main():
    p=argparse.ArgumentParser();p.add_argument('--once',action='store_true');p.add_argument('--stop',action='store_true');p.add_argument('--arm',action='store_true');p.add_argument('--status',action='store_true')
    p.add_argument('--city',type=int,default=43);p.add_argument('--lat',type=float,default=59.744);p.add_argument('--lng',type=float,default=10.205);p.add_argument('--radius',type=float,default=10)
    args=p.parse_args();base=ROOT/'producer'
    if args.status:print(status_report());return
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
