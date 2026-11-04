"""Supervise the existing scoped PAC transport and recoverable producer addon."""
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import threading
import time
import http.server
os.umask(0o077)
ROOT=Path(os.environ.get('RYDE_TRANSPORT_ROOT',Path.home()/'.local/share/scootradar/ryde-bridge'))
sys.path.insert(0,str(ROOT))
import runner as transport
PRODUCER=ROOT/'producer'
# Never let an app-owned request bypass a bound bridge during a proxy restart.
transport.PAC=transport.PAC.replace(b'PROXY 127.0.0.1:8897; DIRECT', b'PROXY 127.0.0.1:8897')

def main():
    if os.geteuid()==0: raise SystemExit('Run as the signed-in Mac user')
    PRODUCER.mkdir(mode=0o700,exist_ok=True)
    (PRODUCER/'results').mkdir(mode=0o700,exist_ok=True)
    if not (PRODUCER/'id-key').exists():
        fd=os.open(PRODUCER/'id-key',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'wb') as handle: handle.write(os.urandom(32))
    server=http.server.ThreadingHTTPServer(('127.0.0.1',8898),transport.Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    stop=threading.Event()
    signal.signal(signal.SIGTERM,lambda *_:stop.set())
    signal.signal(signal.SIGINT,lambda *_:stop.set())
    process=None
    try:
        while not stop.is_set():
            now=time.time()
            if transport.CONFIG['certificateExpiresTimestamp']-now < 7*86400 and not (PRODUCER/'stop.json').exists():
                transport.save(PRODUCER/'stop.json',{'at':now,'reason':'certificate renewal due; restore native ownership'})
            if process is None or process.poll() is not None:
                if transport.CONFIG['certificateExpiresTimestamp']-now<900:
                    transport.save(ROOT/'transport-status.json',{'mode':'certificate-expiring','at':now});stop.wait(1);continue
                command=[transport.CONFIG['mitmdump'],'--listen-host','127.0.0.1','--listen-port','8897',
                    '--allow-hosts',r'^api\.ryde\.vip(:443)?$','--certs','api.ryde.vip='+str(ROOT/'leaf.pem'),
                    '--set','confdir='+str(ROOT/'mitm-conf'),'--set','flow_detail=0','--set','termlog_verbosity=warn']
                if not (PRODUCER/'stopped.json').exists(): command+=['-s',str(ROOT/'producer_addon.py')]
                env=dict(os.environ,RYDE_PRODUCER_ROOT=str(PRODUCER),PYTHONPATH=str(ROOT)+os.pathsep+str(Path.home()/'.local/share/scootradar/ryde-login'))
                with (PRODUCER/'proxy.log').open('a') as log:
                    process=subprocess.Popen(command,env=env,stdin=subprocess.DEVNULL,stdout=log,stderr=log)
                transport.save(ROOT/'transport-status.json',{'mode':'producer' if not (PRODUCER/'stopped.json').exists() else 'idle',
                    'pid':os.getpid(),'proxyPid':process.pid,'at':now,'certificateExpiresAt':transport.CONFIG['certificateExpiresAt']})
            if (PRODUCER/'stopped.json').exists() and '-s' in command:
                transport.stop(process);process=None
            stop.wait(1)
    finally:
        transport.stop(process);server.shutdown()

if __name__=='__main__':main()
