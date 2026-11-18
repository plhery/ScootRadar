import { describe,expect,it } from 'vitest';
import { checkRydeReference,scanRydeArea,withRydeAppCollectors,collectRydeArea,type RydeArea } from './rydeApp';
import type { RydeQuery } from './rydeBridge';
const area:RydeArea={id:'test',city:'Test',cityId:43,country:'NO',bounds:{south:59.74,north:59.741,west:10.2,east:10.201},
  rings:[[[59.74,10.2],[59.74,10.201],[59.741,10.201],[59.741,10.2]]],geometryEvidence:'fixture',coverageEvidence:'fixture',coverageValidated:false,uptimeEvidence:'',uptimeValidated:false,saturationCount:2,cellM:1000};
const api=(scooters:{id:string;lat:number;lng:number}[])=>({query:async(q:RydeQuery)=>({version:1 as const,id:'a'.repeat(32),query:{...q,version:1 as const,id:'a'.repeat(32),expiresAt:200},observedAt:100,coverage:'unknown' as const,scooters})});
describe('Ryde coverage gates',()=>{
  it('retains parent observations and marks a saturated budget-limited scan incomplete',async()=>{
    let n=0;const client={query:async(q:RydeQuery)=>api(n++===0?[{id:'a',lat:59.7405,lng:10.2005},{id:'b',lat:59.7406,lng:10.2006}]:[]).query(q)};
    const scan=await scanRydeArea(area,client,{requests:2,milliseconds:1000,depth:2},()=>100000);
    expect(scan.observations).toHaveLength(2);expect(scan.observedAt).toBe(100000);expect(scan.complete).toBe(false);expect(scan.unfinished).toBeGreaterThan(0);
  });
  it('does not certify an empty/unsaturated view without independently validated coverage',async()=>{
    const scan=await scanRydeArea(area,api([]));expect(scan.complete).toBe(false);
    await expect(collectRydeArea(area,api([]))).rejects.toThrow('review');
  });
  it('is disabled by default and rejects an unreviewed rollout',()=>{
    expect(withRydeAppCollectors([],undefined,'test',[area])).toEqual([]);
    expect(()=>withRydeAppCollectors([],{query:async()=>{throw 0;}} as never,'test',[area])).toThrow('Unreviewed');
  });
});

it('classifies staged Ryde feeds as slow app maps without parking collection',async()=>{
  const {isAppMapFeed,collectsParking}=await import('../src/lib/regionalScooterSystems');
  expect(isAppMapFeed({id:'norway:ryde_app_drammen'})).toBe(true);
  expect(collectsParking({id:'norway:ryde_app_drammen',source:'norway'})).toBe(false);
});

it('skips gaps outside disconnected operating rings',async()=>{
  let calls=0;
  const scattered={...area,bounds:{...area.bounds,east:10.301},rings:[area.rings[0],area.rings[0].map(([lat,lng])=>[lat,lng+.1] as [number,number])]};
  const scan=await scanRydeArea(scattered,{query:async q=>{calls++;return api([]).query(q);}});
  expect(calls).toBe(2);expect(scan.unfinished).toBe(0);
});

it('quarters a saturated cell down to about 12 m, as racks by a station need',async()=>{
  // Ryde answers the nearest 100 within the radius. 150 scooters stand 4 m apart in a 48 m square, as at
  // Linköping's station: a 97 m circle (three quarters) still returns 100, a 12 m one (six) about 30.
  const station={...area,bounds:{south:59.74,north:59.749,west:10.2,east:10.2179},
    rings:[[[59.74,10.2],[59.74,10.2179],[59.749,10.2179],[59.749,10.2]] as [number,number][]],coverageValidated:true,saturationCount:100};
  const racks=Array.from({length:150},(_,i)=>({id:`r${i}`,lat:59.7431+Math.floor(i/12)*4/111_195,lng:10.2061+(i%12)*4/(111_195*Math.cos(59.744*Math.PI/180))}));
  const metres=(a:{lat:number;lng:number},b:{lat:number;lng:number})=>Math.hypot((a.lat-b.lat)*111_195,(a.lng-b.lng)*111_195*Math.cos(a.lat*Math.PI/180));
  let reads=0;
  const ryde={query:async(q:RydeQuery)=>{reads++;const here={lat:q.latitude,lng:q.longitude};
    return api(racks.filter(r=>metres(r,here)<=q.radius*1000).sort((a,b)=>metres(a,here)-metres(b,here)).slice(0,100)).query(q);}};
  const shallow=await scanRydeArea(station,ryde,{requests:80,milliseconds:60_000,depth:3});
  expect(shallow.complete).toBe(false);expect(shallow.unfinished).toBeGreaterThan(0);
  reads=0;
  const scan=await scanRydeArea(station,ryde);
  expect(scan.complete).toBe(true);expect(scan.unfinished).toBe(0);expect(scan.observations).toHaveLength(150);
  expect(reads).toBeLessThanOrEqual(80);
});

it('publishes positive partial observations without claiming any completed area',async()=>{
  const {withinCollection}=await import('./sweeps');
  const progress:{vehicles:number;bounds:number}[]=[];
  const approved={...area,coverageValidated:true,uptimeValidated:true,uptimeEvidence:'fixture'};
  await withinCollection({urgent:()=>true,focus:()=>undefined,progress:(vehicles,bounds)=>{progress.push({vehicles:vehicles.length,bounds:bounds.length});}},
    ()=>collectRydeArea(approved,api([{id:'a',lat:59.7405,lng:10.2005}])));
  expect(progress).toEqual([{vehicles:1,bounds:0}]);
});

it('requires the independent overnight acceptance even after coverage review',async()=>{
  const covered={...area,coverageValidated:true};
  await expect(collectRydeArea(covered,api([]))).rejects.toThrow('uptime');
});

it('distinguishes intentionally filtered reference points from missing in-area scooters',()=>{
  const inside={id:'in',lat:59.7405,lng:10.2005},outside={id:'out',lat:59.75,lng:10.3};
  expect(checkRydeReference(area,[inside,outside],[inside,outside],[inside])).toEqual({
    stationaryReference:2,stationaryEligible:1,stationaryOutside:1,stationaryMissing:1,stationaryMissingEligible:0,
  });
  expect(checkRydeReference(area,[inside,outside],[inside,outside],[]).stationaryMissingEligible).toBe(1);
});

it('enables only catalogued groups through an explicit production pilot and leaves public feeds alone',async()=>{
  const {independentCollectableFeeds}=await import('../src/lib/scooterFeeds');
  const {REGIONAL_SCOOTER_SYSTEMS}=await import('../src/lib/regionalScooterSystems');
  const feeds=independentCollectableFeeds();
  const groups=REGIONAL_SCOOTER_SYSTEMS.filter(s=>s.rydeAppArea);
  // A visitor has opened the first group's city within the week: its groups are swept every day, the others every three.
  const opened=groups[0].rydeAppArea!;
  const wrapped=withRydeAppCollectors(feeds,api([]) as never,'*',undefined,REGIONAL_SCOOTER_SYSTEMS,true,id=>id===opened);
  expect(wrapped).toHaveLength(feeds.length);
  const DAY=24*60*60_000,midnight=Date.now()-Date.now()%DAY;
  const zones={NO:'Europe/Oslo',SE:'Europe/Stockholm',FI:'Europe/Helsinki',DE:'Europe/Berlin'} as Record<string,string>;
  const hour=(at:number,timeZone:string)=>Number(new Intl.DateTimeFormat('en-GB',{timeZone,hour:'2-digit',hourCycle:'h23'}).format(at));
  expect(new Set(groups.map(s=>s.rydeAppArea)).size).toBe(64);
  for(const system of groups){
    const feed=wrapped.find(f=>f.id.endsWith(':'+system.id))!;
    expect(feed.paced).toBe(true);expect(feed.keepsIdleTurns).toBe(true);expect(feed.worker).toBeDefined();
    expect(feed.idleIntervalMs).toBe(3*DAY);
    const daily=feed.idleSooner!();
    expect(daily?.intervalMs).toBe(system.rydeAppArea===opened?DAY:undefined);
    // Both turns fall between 08:00 and 21:00 in its town.
    for(const at of [feed.idlePhase!*3*DAY,...daily?[daily.phase*DAY]:[]]){
      const local=hour(midnight+at%DAY,zones[system.country]);
      expect(local).toBeGreaterThanOrEqual(8);expect(local).toBeLessThan(21);
    }
    // A sweep by night is not made again in the morning: Ryde's map shows the same by night.
    expect(feed.nightEnds).toBeUndefined();
    expect(feed.lastSeenMaxAgeMs).toBe(3*60*60_000);
    expect(system.rydeMapTiles!.length).toBeLessThanOrEqual(2);
  }
  for(let i=0;i<feeds.length;i++)if(!feeds[i].id.includes(':ryde_app_'))expect(wrapped[i]).toBe(feeds[i]);
});

it('collects only planned views, filters public coverage, and retains raw saturation after deduplication',async()=>{
  const inside={id:'a',lat:59.7405,lng:10.2005};
  const pilot={...area,tiles:[area.bounds],excludeBounds:[area.bounds]};
  expect((await collectRydeArea(pilot,api([inside]),true)).vehicles).toEqual([]);
  let calls=0;
  const scan=await scanRydeArea({...area,tiles:[area.bounds]}, {query:async q=>{
    calls++;return {...await api([inside]).query(q),returnedCount:2};
  }},{requests:1,milliseconds:1000,depth:2});
  expect(calls).toBe(1);expect(scan.unfinished).toBe(4);expect(scan.complete).toBe(false);
  expect((await collectRydeArea({...area,tiles:[area.bounds]},api([inside]),true)).vehicles).toHaveLength(1);
  expect(area.coverageValidated).toBe(false);expect(area.uptimeValidated).toBe(false);
});

it('loads a dedicated private runtime manifest and rejects a readable or malformed one',async()=>{
  const {mkdtempSync,writeFileSync,chmodSync,rmSync}=await import('node:fs');
  const {tmpdir}=await import('node:os');const {join}=await import('node:path');
  const {loadRydeRuntimeConfig}=await import('./rydeApp');
  const dir=mkdtempSync(join(tmpdir(),'ryde-config-')),path=join(dir,'bridge.json');
  try{
    expect(loadRydeRuntimeConfig(path)).toBeUndefined();
    const config={version:1,token:'a'.repeat(64),areas:'*',productionPilot:true};
    writeFileSync(path,JSON.stringify(config),{mode:0o600});
    expect(loadRydeRuntimeConfig(path)).toMatchObject(config);
    chmodSync(path,0o644);expect(()=>loadRydeRuntimeConfig(path)).toThrow('private');
    chmodSync(path,0o600);writeFileSync(path,JSON.stringify({...config,token:'short'}));
    expect(()=>loadRydeRuntimeConfig(path)).toThrow('Invalid');
  }finally{rmSync(dir,{recursive:true,force:true});}
});

it('gives a scan time for its reads at the pace a busy shared worker answers them (SCOOTRADAR-CACHE-66)',async()=>{
  // Central Turku on 4 November 2026: a read about every 26 seconds, some 34 needed.
  let clock=0;
  const tiles=Array.from({length:34},(_,i)=>({south:59.74,north:59.741,west:10.2+i*0.00002,east:10.2+(i+1)*0.00002}));
  const slow={query:async(q:RydeQuery)=>{clock+=26_000;return api([]).query(q);}};
  const scan=await scanRydeArea({...area,coverageValidated:true,tiles},slow,undefined,()=>clock);
  expect(scan.requests).toBe(34);expect(scan.unfinished).toBe(0);expect(scan.complete).toBe(true);
});
