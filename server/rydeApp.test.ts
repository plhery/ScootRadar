import { describe,expect,it } from 'vitest';
import { scanRydeArea,withRydeAppCollectors,collectRydeArea,type RydeArea } from './rydeApp';
import type { RydeQuery } from './rydeBridge';
const area:RydeArea={id:'test',city:'Test',cityId:43,country:'NO',bounds:{south:59.74,north:59.741,west:10.2,east:10.201},
  rings:[[[59.74,10.2],[59.74,10.201],[59.741,10.201],[59.741,10.2]]],geometryEvidence:'fixture',coverageEvidence:'fixture',coverageValidated:false,saturationCount:2,cellM:1000};
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

it('publishes positive partial observations without claiming any completed area',async()=>{
  const {withinCollection}=await import('./sweeps');
  const progress:{vehicles:number;bounds:number}[]=[];
  const approved={...area,coverageValidated:true};
  await withinCollection({urgent:()=>true,focus:()=>undefined,progress:(vehicles,bounds)=>{progress.push({vehicles:vehicles.length,bounds:bounds.length});}},
    ()=>collectRydeArea(approved,api([{id:'a',lat:59.7405,lng:10.2005}])));
  expect(progress).toEqual([{vehicles:1,bounds:0}]);
});
