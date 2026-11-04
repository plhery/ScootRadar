"""Bounded local pilot: samples only; never publishes a production feed."""
import argparse
import json
from pathlib import Path
import time
import uuid
import fcntl
import subprocess
import os
from worker import ROOT, query, save, wait_interval


def main():
    p=argparse.ArgumentParser();p.add_argument('--hours',type=float,default=12);p.add_argument('--interval',type=int,default=900)
    args=p.parse_args()
    if not 0<args.hours<=24 or args.interval<120:raise SystemExit('Pilot bounds: <=24 h, >=120 s spacing')
    base=ROOT/'producer';lock=(base/'worker.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    started=time.time();end=started+args.hours*3600
    last_event_at=started
    targets=[(43,59.744,10.205),(32,57.70787,11.97344),(43,59.744,10.205)]
    turns=0
    while time.time()<end:
        if (base/'stop.json').exists():
            save(base/'shadow-status.json',{'at':time.time(),'state':'stopped','observations':turns});return
        city,lat,lng=targets[turns%len(targets)];began=time.time()
        job={'version':1,'id':uuid.uuid4().hex,'cityId':city,'latitude':lat,'longitude':lng,'radius':10,'expiresAt':time.time()+60}
        try:
            result=query(job)
            resources={}
            try:
                lifecycle=json.loads(subprocess.check_output([str(ROOT/'ryde-lifecycle'),'status'],text=True))
                transport=json.loads((ROOT/'transport-status.json').read_text())
                groups={'app':lifecycle['pids'],'proxy':[transport['proxyPid']],'supervisor':[transport['pid']],'worker':[os.getpid()]}
                for name,pids in groups.items():
                    raw=subprocess.check_output(['/bin/ps','-o','rss=','-p',','.join(map(str,pids))],text=True)
                    resources[name]=sum(int(v) for v in raw.split())
            except (OSError,ValueError,subprocess.CalledProcessError):pass
            status=json.loads((base/'session/status.json').read_text())
            renewals=sum(e['event']=='native-renewal-accepted' and e['at']>last_event_at for e in status['events'])
            last_event_at=time.time()
            event={'at':time.time(),'rssKiB':resources,'nativeRenewals':renewals,'startedAt':started,'endsAt':end,'state':'observed','cityId':city,'scooters':len(result['scooters']),'seconds':time.time()-began,'coverage':'unknown'}
        except Exception as error:
            event={'at':time.time(),'state':'stopped' if (base/'stop.json').exists() else 'held','reason':type(error).__name__}
            save(base/'shadow-status.json',event)
            # Operator intervention is needed; don't keep relaunching after a failed test.
            raise SystemExit('Shadow pilot held; inspect private session status')
        with (base/'shadow.jsonl').open('a') as f:f.write(json.dumps(event)+'\n')
        save(base/'shadow-status.json',event);turns+=1
        wait_interval(min(args.interval,max(0,end-time.time())),base/'stop.json')
    save(base/'shadow-status.json',{'at':time.time(),'state':'completed','observations':turns})

if __name__=='__main__':main()
