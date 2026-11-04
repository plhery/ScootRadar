"""Install source into an already authorized scoped transport; never changes trust."""
import argparse
import json
import os
from pathlib import Path
import plistlib
import shutil
import subprocess
import sys

FILES=['producer_addon.py','producer_runner.py','native_protocol.py','bridge_crypto.py','worker.py','shadow.py']

def main():
    p=argparse.ArgumentParser();p.add_argument('--restart',action='store_true');p.add_argument('--shadow-hours',type=float);args=p.parse_args()
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
    print('Producer installed. No certificate, account credential or proxy setting changed.')

if __name__=='__main__':main()
