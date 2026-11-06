"""Install source into an already authorized scoped transport; never changes trust."""
import argparse
import json
import os
from pathlib import Path
import plistlib
import shutil
import subprocess
import sys

FILES=['producer_addon.py','producer_runner.py','native_protocol.py','bridge_crypto.py','worker.py','shadow.py','egress.py','egress_addon.py']

def main():
    p=argparse.ArgumentParser();p.add_argument('--restart',action='store_true');p.add_argument('--shadow-hours',type=float);p.add_argument('--worker',action='store_true');args=p.parse_args()
    if args.worker and args.shadow_hours is not None:raise SystemExit('Choose production or shadow mode')
    os.umask(0o077)
    if args.shadow_hours is not None and not 0<args.shadow_hours<=24:raise SystemExit('Shadow duration must be 0–24 h')
    root=Path.home()/'.local/share/scootradar/ryde-bridge'
    config=json.loads((root/'config.json').read_text())
    if not config.get('persistentTransportApproved'): raise SystemExit('Install the authorized scoped transport first')
    state=json.loads((root/'transport-status.json').read_text())
    if state.get('mode') not in {'idle','producer'}: raise SystemExit('Finish any active experiment first')
    for name in FILES: shutil.copyfile(Path(__file__).parent/name,root/name)
    subprocess.run(['swiftc',str(Path(__file__).parent/'RydeLifecycle.swift'),'-o',str(root/'ryde-lifecycle')],check=True)
    agent=Path.home()/'Library/LaunchAgents/com.scootradar.ryde-bridge.plist'
    value=plistlib.loads(agent.read_bytes());value['ProgramArguments']=['/usr/bin/python3',str(root/'producer_runner.py')]
    temp=agent.with_suffix('.tmp');temp.write_bytes(plistlib.dumps(value));temp.replace(agent)
    if args.restart:
        uid=str(os.getuid()); subprocess.run(['launchctl','bootout','gui/'+uid+'/com.scootradar.ryde-bridge'],check=True)
        import time
        for attempt in range(20):
            result=subprocess.run(['launchctl','bootstrap','gui/'+uid,str(agent)],capture_output=True)
            if result.returncode==0: break
            time.sleep(.25)
        else: raise SystemExit('LaunchAgent did not restart; inspect supervisor.log')
    if args.shadow_hours is not None:
        import fcntl
        lock=(root/'producer/worker.lock').open('a')
        try: fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:raise SystemExit('Finish the active worker/validation before starting the shadow pilot')
        state=json.loads((root/'producer/session/status.json').read_text())
        if state['bridgeStage']!='bridge-active' or state.get('paused'):raise SystemExit('Verify the live bridge before starting a pilot')
        label='com.scootradar.ryde-shadow'
        target=Path.home()/('Library/LaunchAgents/'+label+'.plist')
        value={'Label':label,'ProgramArguments':['/usr/bin/python3',str(root/'shadow.py'),'--hours',str(args.shadow_hours),'--interval','120'],
            'RunAtLoad':True,'KeepAlive':False,'ProcessType':'Background','WorkingDirectory':str(root),
            'StandardOutPath':str(root/'producer/shadow.log'),'StandardErrorPath':str(root/'producer/shadow.log')}
        target.write_bytes(plistlib.dumps(value))
        subprocess.run(['launchctl','bootout','gui/'+str(os.getuid())+'/'+label],capture_output=True)
        fcntl.flock(lock,fcntl.LOCK_UN)
        subprocess.run(['launchctl','bootstrap','gui/'+str(os.getuid()),str(target)],check=True)
        print('Bounded shadow pilot started; results stay private and no feed is published.')
    if args.worker:
        import fcntl
        lock=(root/'producer/worker.lock').open('a')
        try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:raise SystemExit('Finish the active validation before starting the production worker')
        state=json.loads((root/'producer/session/status.json').read_text())
        if state['bridgeStage']!='bridge-active' or state.get('paused'):raise SystemExit('Recover the bridge before starting the worker')
        private=root/'producer/worker-config.json'
        if private.stat().st_mode&0o077:raise SystemExit('Worker config must be 0600')
        worker_config=json.loads(private.read_text())
        if not worker_config['url'].startswith('https://') or len(worker_config['token'])<32:raise SystemExit('Private HTTPS worker config required')
        label='com.scootradar.ryde-worker';uid='gui/'+str(os.getuid())
        subprocess.run(['launchctl','bootout',uid+'/com.scootradar.ryde-shadow'],capture_output=True)
        (Path.home()/'Library/LaunchAgents/com.scootradar.ryde-shadow.plist').unlink(missing_ok=True)
        target=Path.home()/('Library/LaunchAgents/'+label+'.plist')
        value={'Label':label,'ProgramArguments':['/usr/bin/python3',str(root/'worker.py')],
            'RunAtLoad':True,'KeepAlive':True,'ThrottleInterval':30,'ProcessType':'Background','WorkingDirectory':str(root),
            'StandardOutPath':str(root/'producer/worker.log'),'StandardErrorPath':str(root/'producer/worker.log')}
        target.write_bytes(plistlib.dumps(value))
        subprocess.run(['launchctl','bootout',uid+'/'+label],capture_output=True)
        # An operator pause may have left a persistent launchd disabled override.
        # --worker is an explicit resume, so enable this agent before bootstrapping it.
        subprocess.run(['launchctl','enable',uid+'/'+label],check=True)
        fcntl.flock(lock,fcntl.LOCK_UN)
        subprocess.run(['launchctl','bootstrap',uid,str(target)],check=True)
        print('Production worker started under normal-user launchd.')
    print('Producer installed. No certificate, account credential or proxy setting changed.')

if __name__=='__main__':main()
