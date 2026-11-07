import { afterEach, describe, expect, it, vi } from 'vitest';
import { RYDE_WORKER_SILENT_MS, RydeBroker, type RydeJob } from './rydeBridge';
import { withinCollection } from './sweeps';
const brokers: RydeBroker[]=[];
const broker=(...args: ConstructorParameters<typeof RydeBroker>)=>{const b=new RydeBroker(...args);brokers.push(b);return b;};
const q={cityId:43,latitude:59.744,longitude:10.205,radius:1};
afterEach(()=>{for(const b of brokers) b.close();brokers.length=0;vi.useRealTimers();});
describe('Ryde account broker',()=>{
  it('promotes a queued idle read when someone starts watching its collection',async()=>{
    const b=broker('x'.repeat(32),()=>100000,0);
    const routine=b.query({...q,cityId:6},false);
    let watched=false;
    const focused=withinCollection({urgent:()=>watched,focus:()=>undefined,progress:()=>{}},()=>b.query(q));
    watched=true;
    const first=b.lease()!;expect(first.cityId).toBe(43);
    b.accept({version:1,id:first.id,query:first,coverage:'unknown',observedAt:100,scooters:[]});
    const next=b.lease()!;expect(next.cityId).toBe(6);
    b.accept({version:1,id:next.id,query:next,coverage:'unknown',observedAt:100,scooters:[]});
    await Promise.all([focused,routine]);
  });
  it('coalesces refreshes and serializes native reads, with exact result binding and idempotent acknowledgements',async()=>{
    let now=100000;const b=broker('a'.repeat(32),()=>now,0);
    const a=b.query(q), duplicate=b.query(q);expect(a).toBe(duplicate);
    const other=b.query({...q,cityId:32});const job=b.lease()!;expect(b.lease()).toBeNull();
    const result={version:1,id:job.id,query:job,coverage:'unknown',observedAt:now/1000,scooters:[{id:'b'.repeat(32),lat:q.latitude,lng:q.longitude}]};
    expect(()=>b.accept({...result,query:{...job,cityId:6}})).toThrow();
    expect(()=>b.accept({...result,scooters:[{...result.scooters[0],token:'private'}]})).toThrow();
    b.accept(result);b.accept(result);expect((await a).scooters).toHaveLength(1);
    const next=b.lease()!;expect(next.cityId).toBe(32);now++;
    b.accept({...result,id:next.id,query:next,observedAt:now/1000,scooters:[]});await other;
    expect(b.stats.completed).toBe(2);
  });
  it('expires jobs and rejects late results without freshening the previous snapshot',async()=>{
    vi.useFakeTimers();const b=broker('x'.repeat(32),Date.now,0,1000);
    const promise=b.query(q);const rejection=expect(promise).rejects.toThrow('deadline');const job=b.lease()!;
    await vi.advanceTimersByTimeAsync(1001);await rejection;
    expect(()=>b.accept({version:1,id:job.id,query:job,coverage:'unknown',observedAt:Date.now()/1000,scooters:[]})).toThrow();
  });
  it('releases a lost lease using the same job instead of generating another request',async()=>{
    let now=100000;const b=broker('x'.repeat(32),()=>now,0);
    const p=b.query(q);p.catch(()=>{});const job=b.lease();now+=50001;expect(b.lease()).toEqual(job);
  });
  it('lets three visible reads proceed before a routine turn without starving background scans',async()=>{
    const b=broker('x'.repeat(32),()=>100000,0);const promises=[];
    promises.push(b.query({...q,cityId:6},false));
    for(let n=1;n<=4;n++) promises.push(b.query({...q,radius:n},true));
    const order=[];
    for(let n=0;n<5;n++){const job=b.lease()!;order.push(job.cityId);b.accept({version:1,id:job.id,query:job,coverage:'unknown',observedAt:100,scooters:[]});}
    expect(order).toEqual([43,43,43,6,43]);await Promise.all(promises);
  });
  it('preserves spacing and the active native lease while prioritizing visible reads',async()=>{
    let now=100000;const b=broker('x'.repeat(32),()=>now,5000);
    const promises=[b.query({...q,cityId:6},false),b.query(q,true),b.query({...q,radius:2},true)];
    const first=b.lease()!;
    expect(first.cityId).toBe(43);now+=2000;expect(b.lease()).toBeNull();
    b.accept({version:1,id:first.id,query:first,coverage:'unknown',observedAt:now/1000,scooters:[]});
    expect(b.lease()).toBeNull();now+=3000;
    const second=b.lease()!;expect(second.cityId).toBe(43);
    b.accept({version:1,id:second.id,query:second,coverage:'unknown',observedAt:now/1000,scooters:[]});
    now+=5000;const routine=b.lease()!;expect(routine.cityId).toBe(6);
    b.accept({version:1,id:routine.id,query:routine,coverage:'unknown',observedAt:now/1000,scooters:[]});
    await Promise.all(promises);
  });
});

it('counts the worker gone once it has not asked for a job for ten minutes, from the broker\'s start or its last request',()=>{
  let now=1_000_000;const b=broker('x'.repeat(32),()=>now,0);
  now+=RYDE_WORKER_SILENT_MS-1;expect(b.silentSince()).toBeUndefined();
  now++;expect(b.silentSince()).toBe(1_000_000);
  b.lease();const asked=now;expect(b.silentSince()).toBeUndefined();
  now+=RYDE_WORKER_SILENT_MS;expect(b.silentSince()).toBe(asked);
});

it('goes on with a silence saved before a restart until the worker asks, and not with one after its start',()=>{
  let now=Date.UTC(2026,10,5,7);const b=broker('x'.repeat(32),()=>now,0);
  const paused=now-4*3600_000;b.restoreSilence(paused);
  expect(b.silentSince()).toBe(paused);
  now+=60_000;b.lease();expect(b.silentSince()).toBeUndefined();
  const c=broker('x'.repeat(32),()=>now,0);c.restoreSilence(now+1);
  expect(c.silentSince()).toBeUndefined();
  now+=RYDE_WORKER_SILENT_MS;expect(c.silentSince()).toBe(now-RYDE_WORKER_SILENT_MS);
});

describe('worker HTTP boundary',()=>{
  it('requires its own token and accepts one normalized result through the snapshot server',async()=>{
    const {createSnapshotServer}=await import('./snapshotServer');
    const b=broker('worker-token-'.repeat(4),()=>100000,0);
    const server=createSnapshotServer({snapshot:()=>undefined,token:'public-api-token',rydeBridge:b});
    await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
    try {
      const address=server.address() as {port:number};const url=`http://127.0.0.1:${address.port}`;
      const unauthorized=await fetch(url+'/internal/ryde/job',{headers:{Authorization:'Bearer public-api-token'}});
      expect(unauthorized.status).toBe(401);
      const p=b.query(q);
      const response=await fetch(url+'/internal/ryde/job',{headers:{Authorization:'Bearer '+'worker-token-'.repeat(4)}});
      const job=await response.json() as RydeJob;
      const submitted=await fetch(url+'/internal/ryde/result',{method:'POST',headers:{Authorization:'Bearer '+'worker-token-'.repeat(4)},body:JSON.stringify({version:1,id:job.id,query:job,observedAt:100,coverage:'unknown',scooters:[]})});
      expect(submitted.status).toBe(204);await p;
    } finally {await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
  });
});

it('a failed city job releases the account queue immediately',async()=>{
  const b=broker('x'.repeat(32),()=>100000,0);
  const one=b.query(q);const rejected=expect(one).rejects.toThrow('could not complete');
  const two=b.query({...q,cityId:32});two.catch(()=>{});
  const job=b.lease()!;b.accept({version:1,id:job.id,query:job,error:'worker_failed'});
  await rejected;expect(b.lease()!.cityId).toBe(32);expect(b.stats.failed).toBe(1);
});
