/** Local integration exercise: real broker + native Mac worker; no production publishing. */
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import catalog from '../../data/ryde-bridge-areas.json';
import { RydeBroker, type RydeQuery, type RydeResult } from '../../server/rydeBridge';
import { checkRydeReference, scanRydeArea, type RydeArea } from '../../server/rydeApp';
import { createSnapshotServer } from '../../server/snapshotServer';

const root=join(homedir(),'.local/share/scootradar/ryde-bridge');
const directory=join(root,'producer','validation-'+new Date().toISOString().replace(/[^0-9tz]/gi,''));
await mkdir(directory,{mode:0o700});
const token=randomBytes(32).toString('hex');
const broker=new RydeBroker(token,Date.now,5000);
const server=createSnapshotServer({snapshot:()=>undefined,rydeBridge:broker});
await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
const address=server.address() as {port:number};
const configPath=join(directory,'local-worker.json');
await writeFile(configPath,JSON.stringify({url:`http://127.0.0.1:${address.port}`,token}),{mode:0o600});
const child=spawn('/usr/bin/python3',['-c',`
import fcntl,json,time,sys
from pathlib import Path
sys.path.insert(0,sys.argv[1])
from worker import ROOT,call,query,validate_job
lock=(ROOT/'producer/worker.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
config=json.loads(Path(sys.argv[2]).read_text())
while True:
    job=call(config,'GET','/internal/ryde/job')
    if not job:
        time.sleep(.25);continue
    validate_job(job)
    result=query(job)
    call(config,'POST','/internal/ryde/result',result)
`,root,configPath],{stdio:['ignore','ignore','pipe']});
let childFailure='';child.stderr.on('data',chunk=>{childFailure+=String(chunk).slice(0,2000);});
child.on('exit',code=>{if(code && code!==0)broker.close();});
const history: {query:RydeQuery;observedAt:number;count:number;seconds:number}[]=[];
const api={query:async(q:RydeQuery):Promise<RydeResult>=>{
  const began=Date.now();const result=await broker.query(q);
  history.push({query:q,observedAt:result.observedAt,count:result.scooters.length,seconds:(Date.now()-began)/1000});
  await writeFile(join(directory,'progress.json'),JSON.stringify({history,at:Date.now()},null,2),{mode:0o600});
  console.log(JSON.stringify({query:history.length,cityId:q.cityId,radius:q.radius,count:result.scooters.length,seconds:history.at(-1)!.seconds}));
  return result;
}};
try {
  const central={cityId:43,latitude:59.744,longitude:10.205,radius:10};
  const before=await api.query(central);
  const area={...catalog.areas.find(a=>a.id==='drammen'),cellM:Number(process.env.RYDE_VALIDATION_CELL_M??1500)} as RydeArea;
  const requests=Number(process.env.RYDE_VALIDATION_REQUESTS??80);
  if(!Number.isSafeInteger(requests)||requests<1||requests>120)throw new Error('Invalid validation budget');
  const scan=await scanRydeArea(area,api,{requests,milliseconds:10*60_000,depth:3});
  const after=await api.query(central);
  const reference=checkRydeReference(area,before.scooters,after.scooters,scan.observations);
  const summary={at:Date.now(),directory,cellM:area.cellM,requests:scan.requests,unfinished:scan.unfinished,complete:scan.complete,
    scooters:scan.observations.length,oldestObservedAt:scan.observedAt,referenceBefore:before.scooters.length,
    referenceAfter:after.scooters.length,...reference,
    broker:broker.stats,history};
  await writeFile(join(directory,'scan.json'),JSON.stringify(scan),{mode:0o600});
  await writeFile(join(directory,'summary.json'),JSON.stringify(summary,null,2),{mode:0o600});
  console.log(JSON.stringify({...summary,history:undefined}));
} catch(error) {
  if(childFailure)await writeFile(join(directory,'worker-error.txt'),childFailure,{mode:0o600});
  console.error(JSON.stringify({error:error instanceof Error?error.message:'unknown',workerFailed:!!childFailure,directory}));
  process.exitCode=1;
} finally {
  broker.close();child.kill();await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(configPath,{force:true});
}
