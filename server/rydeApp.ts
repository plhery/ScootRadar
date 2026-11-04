import catalog from '../data/ryde-bridge-areas.json';
import { boundsContainPoint, polygonContainsPoint } from '../src/lib/geo';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { APP_MAP_IDLE_INTERVAL_MS } from './appMapCadence';
import { takeNearest } from './sweeps';
import { RydeBroker, type RydeObservation } from './rydeBridge';

export interface RydeArea {
  id: string; cityId: number; country: 'NO' | 'SE' | 'FI' | 'DE'; city: string;
  bounds: MapBounds; rings: [number, number][][];
  geometryEvidence: string; coverageEvidence: string; coverageValidated: boolean;
  saturationCount: number; cellM: number;
}
interface Cell { bounds: MapBounds; depth: number }
export interface RydeScan {
  observations: (RydeObservation & { observedAt: number })[]; observedAt: number;
  requests: number; unfinished: number; complete: boolean;
}
/** Overlapping circles cover each cell geometrically. Selection completeness is a separate rollout gate. */
export async function scanRydeArea(area: RydeArea, api: Pick<RydeBroker, 'query'>,
  limits = { requests: 80, milliseconds: 10 * 60_000, depth: 3 }, now = Date.now): Promise<RydeScan> {
  if (!Number.isSafeInteger(area.saturationCount) || area.saturationCount < 1 || area.cellM < 250 || area.cellM > 5000 ||
    !area.rings.length || ![area.bounds.south,area.bounds.north,area.bounds.west,area.bounds.east].every(Number.isFinite) ||
    area.bounds.south >= area.bounds.north || area.bounds.west >= area.bounds.east) throw new Error('Invalid Ryde area');
  const began = now(), queue: Cell[] = [], found = new Map<string, RydeObservation & { observedAt: number }>();
  const dy = area.cellM / 111_195, dx = dy / Math.cos((area.bounds.south + area.bounds.north) / 2 * Math.PI / 180);
  for (let south = area.bounds.south; south < area.bounds.north; south += dy) {
    for (let west = area.bounds.west; west < area.bounds.east; west += dx) {
      if (queue.length >= 500) throw new Error('Ryde area needs smaller independently refreshed groups');
      queue.push({ bounds: { south, west, north: Math.min(south+dy,area.bounds.north), east: Math.min(west+dx,area.bounds.east) }, depth:0 });
    }
  }
  let requests=0, unresolved=0;
  while (queue.length && requests < limits.requests && now()-began < limits.milliseconds) {
    const cell=takeNearest(queue,c=>c.bounds)!;
    const {south,north,west,east}=cell.bounds, latitude=(south+north)/2, longitude=(west+east)/2;
    const radius=Math.hypot((north-south)*111_195,(east-west)*111_195*Math.cos(latitude*Math.PI/180))/2000*1.1;
    const result=await api.query({cityId:area.cityId,latitude,longitude,radius}); requests++;
    if (result.query.cityId !== area.cityId || result.query.latitude !== latitude || result.query.longitude !== longitude || result.query.radius !== radius) {
      throw new Error('Ryde response query mismatch');
    }
    for (const row of result.scooters) {
      if (!boundsContainPoint(area.bounds,row.lat,row.lng) || !area.rings.some(r=>polygonContainsPoint(r,row.lat,row.lng))) continue;
      const at=result.observedAt*1000;
      if ((found.get(row.id)?.observedAt ?? 0) <= at) found.set(row.id,{...row,observedAt:at});
    }
    if (result.scooters.length >= area.saturationCount) {
      if (cell.depth >= limits.depth) { unresolved++; continue; }
      for (const [a,b] of [[south,latitude],[latitude,north]]) for (const [c,d] of [[west,longitude],[longitude,east]]) {
        queue.push({bounds:{south:a,north:b,west:c,east:d},depth:cell.depth+1});
      }
    }
    // No swept bounds are reported: a geometric query doesn't certify all vehicles within it.
  }
  const observations=[...found.values()];
  return {observations,observedAt:observations.length ? Math.min(...observations.map(r=>r.observedAt)) : began,
    requests,unfinished:queue.length+unresolved,complete:area.coverageValidated && queue.length+unresolved===0};
}

export function rydeVehicles(scan: RydeScan): Vehicle[] {
  return scan.observations.map(row=>({provider:'ryde',vehicle_id:`ryde-app:${row.id}`,lat:row.lat,lng:row.lng,
    battery:null,range_m:null,distance_m:null,deep_link:null,
    rental_uris:{ios:'https://new-web-platform.ryde.vip/app/ios.html',android:'https://new-web-platform.ryde.vip/app/android.html',web:null}}));
}
export async function collectRydeArea(area: RydeArea, api: Pick<RydeBroker,'query'>): Promise<SourceVehicles> {
  if (!area.geometryEvidence || !area.coverageEvidence || !area.coverageValidated) throw new Error('Ryde coverage has not passed review');
  const scan=await scanRydeArea(area,api);
  if (!scan.complete) throw new Error('Ryde scan is incomplete; preserve previous observations');
  // The oldest retained observation sets the feed's age. Partial views never delete an old snapshot.
  return {vehicles:rydeVehicles(scan),observedAt:scan.observedAt,stale:false};
}
export function withRydeAppCollectors(feeds: CollectableScooterFeed[], broker: RydeBroker | undefined,
  enabled = process.env.RYDE_BRIDGE_AREAS ?? '', areas = catalog.areas as RydeArea[]): CollectableScooterFeed[] {
  if (!broker || !enabled) return feeds;
  const selected=new Set(enabled.split(','));
  const sources={NO:'norway',SE:'sweden',FI:'finland',DE:'germany'} as const;
  const additions: CollectableScooterFeed[]=areas.filter(area=>selected.has(area.id)).map(area=>{
    if (!area.geometryEvidence || !area.coverageEvidence || !area.coverageValidated) throw new Error('Unreviewed Ryde area enabled');
    if (feeds.some(f=>f.provider==='ryde' && f.coverage.some(b=>b.south<=area.bounds.north && b.north>=area.bounds.south && b.west<=area.bounds.east && b.east>=area.bounds.west))) {
      throw new Error('Ryde bridge would overlap existing coverage');
    }
    return {id:`${sources[area.country]}:ryde_app_${area.id}`,source:sources[area.country],provider:'ryde',coverage:[area.bounds],
      host:'api.ryde.vip',paced:true,idleIntervalMs:APP_MAP_IDLE_INTERVAL_MS,collect:()=>collectRydeArea(area,broker)};
  });
  for (const id of selected) if (!areas.some(a=>a.id===id)) throw new Error(`Unknown reviewed Ryde area: ${id}`);
  return [...feeds,...additions];
}
