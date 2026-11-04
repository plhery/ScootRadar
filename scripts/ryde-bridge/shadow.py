"""Bounded local pilot: samples only; never publishes a production feed."""
import argparse
import json
from pathlib import Path
import time
import uuid
import fcntl
from worker import ROOT, query, save


def main():
    p=argparse.ArgumentParser();p.add_argument('--hours',type=float,default=12);p.add_argument('--interval',type=int,default=900)
    args=p.parse_args()
    if not 0<args.hours<=24 or args.interval<120:raise SystemExit('Pilot bounds: <=24 h, >=120 s spacing')
    base=ROOT/'producer';lock=(base/'worker.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    end=time.time()+args.hours*3600
    targets=[(43,59.744,10.205),(32,57.70787,11.97344),(43,59.744,10.205)]
    turns=0
    while time.time()<end:
        city,lat,lng=targets[turns%len(targets)];began=time.time()
        job={'version':1,'id':uuid.uuid4().hex,'cityId':city,'latitude':lat,'longitude':lng,'radius':10,'expiresAt':time.time()+60}
        try:
            result=query(job)
            event={'at':time.time(),'state':'observed','cityId':city,'scooters':len(result['scooters']),'seconds':time.time()-began,'coverage':'unknown'}
        except Exception as error:
            event={'at':time.time(),'state':'held','reason':type(error).__name__}
            save(base/'shadow-status.json',event)
            # Operator intervention is needed; don't keep relaunching after a failed test.
            raise SystemExit('Shadow pilot held; inspect private session status')
        with (base/'shadow.jsonl').open('a') as f:f.write(json.dumps(event)+'\n')
        save(base/'shadow-status.json',event);turns+=1
        time.sleep(min(args.interval,max(0,end-time.time())))
    save(base/'shadow-status.json',{'at':time.time(),'state':'completed','observations':turns})

if __name__=='__main__':main()
