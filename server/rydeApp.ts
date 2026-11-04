import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import catalog from '../data/ryde-bridge-areas.json';
import { boundsContainPoint, polygonContainsPoint } from '../src/lib/geo';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { APP_MAP_IDLE_INTERVAL_MS } from './appMapCadence';
import { ringsMeetBounds } from './nearestSweep';
import { currentCollection, takeNearest } from './sweeps';
import { RydeBroker, type RydeObservation } from './rydeBridge';

export interface RydeArea {
  id: string; cityId: number; country: 'NO' | 'SE' | 'FI' | 'DE'; city: string;
  bounds: MapBounds; rings: [number, number][][];
  geometryEvidence: string; coverageEvidence: string; coverageValidated: boolean;
  uptimeEvidence: string; uptimeValidated: boolean;
  saturationCount: number; cellM: number;
  tiles?: MapBounds[]; productionPilot?: boolean; geometryKind?: string; excludeBounds?: MapBounds[];
}
interface Cell { bounds: MapBounds; depth: number }
export interface RydeScan {
  observations: (RydeObservation & { observedAt: number })[]; observedAt: number;
  requests: number; unfinished: number; complete: boolean;
}
/** Overlapping circles cover each cell geometrically. Selection completeness is a separate rollout gate. */
export async function scanRydeArea(area: RydeArea, api: Pick<RydeBroker, 'query'>,
  limits = { requests: 80, milliseconds: 10 * 60_000, depth: 3 }, now = Date.now, onProgress?: (scan: RydeScan) => void): Promise<RydeScan> {
  if (!Number.isSafeInteger(area.saturationCount) || area.saturationCount < 1 || area.cellM < 250 || area.cellM > 5000 ||
    !area.rings.length || ![area.bounds.south,area.bounds.north,area.bounds.west,area.bounds.east].every(Number.isFinite) ||
    area.bounds.south >= area.bounds.north || area.bounds.west >= area.bounds.east) throw new Error('Invalid Ryde area');
  const began = now(), queue: Cell[] = [], found = new Map<string, RydeObservation & { observedAt: number }>();
  const dy = area.cellM / 111_195, dx = dy / Math.cos((area.bounds.south + area.bounds.north) / 2 * Math.PI / 180);
  if(!area.tiles && Math.ceil((area.bounds.north-area.bounds.south)/dy)*Math.ceil((area.bounds.east-area.bounds.west)/dx)>2000) throw new Error('Ryde area needs smaller refresh groups');
  if(area.tiles)queue.push(...area.tiles.map(bounds=>({bounds,depth:0})));
  else for (let south = area.bounds.south; south < area.bounds.north; south += dy) {
    for (let west = area.bounds.west; west < area.bounds.east; west += dx) {
      if (queue.length >= 500) throw new Error('Ryde area needs smaller independently refreshed groups');
      const bounds={south,west,north:Math.min(south+dy,area.bounds.north),east:Math.min(west+dx,area.bounds.east)};
      if (ringsMeetBounds(area.rings,bounds)) queue.push({bounds,depth:0});
    }
  }
  if(!queue.length)throw new Error('Ryde bounds do not meet the operating rings');
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
      if (area.excludeBounds?.some(b=>boundsContainPoint(b,row.lat,row.lng)) || !boundsContainPoint(area.bounds,row.lat,row.lng) || (area.tiles && !area.tiles.some(b=>boundsContainPoint(b,row.lat,row.lng))) || !area.rings.some(r=>polygonContainsPoint(r,row.lat,row.lng))) continue;
      const at=result.observedAt*1000;
      if ((found.get(row.id)?.observedAt ?? 0) <= at) found.set(row.id,{...row,observedAt:at});
    }
    if ((result.returnedCount ?? result.scooters.length) >= area.saturationCount) {
      if (cell.depth >= limits.depth) unresolved++;
      else for (const [a,b] of [[south,latitude],[latitude,north]]) for (const [c,d] of [[west,longitude],[longitude,east]]) {
        const bounds={south:a,north:b,west:c,east:d};
        if(ringsMeetBounds(area.rings,bounds)) queue.push({bounds,depth:cell.depth+1});
      }
    }
    // Publish positive observations without certifying absence anywhere.
    const observations=[...found.values()];
    onProgress?.({observations,observedAt:observations.reduce((at,row)=>Math.min(at,row.observedAt),now()),requests,unfinished:queue.length+unresolved,complete:false});
  }
  const observations=[...found.values()];
  return {observations,observedAt:observations.length ? Math.min(...observations.map(r=>r.observedAt)) : began,
    requests,unfinished:queue.length+unresolved,complete:area.coverageValidated && queue.length+unresolved===0};
}

/** Compare like-for-like: reference scooters outside the published area are filtered intentionally. */
export function checkRydeReference(area: RydeArea, before: readonly RydeObservation[], after: readonly RydeObservation[],
  observations: readonly RydeObservation[]) {
  const last=new Map(after.map(row=>[row.id,row]));
  const stable=before.filter(row=>{
    const next=last.get(row.id);
    return next && Math.abs(row.lat-next.lat)<.00001 && Math.abs(row.lng-next.lng)<.00001;
  });
  const eligible=(row: RydeObservation)=>boundsContainPoint(area.bounds,row.lat,row.lng) &&
    area.rings.some(ring=>polygonContainsPoint(ring,row.lat,row.lng));
  const found=new Set(observations.map(row=>row.id));
  const missing=stable.filter(row=>!found.has(row.id));
  return {stationaryReference:stable.length,stationaryEligible:stable.filter(eligible).length,
    stationaryOutside:stable.filter(row=>!eligible(row)).length,stationaryMissing:missing.length,
    stationaryMissingEligible:missing.filter(eligible).length};
}

export function rydeVehicles(scan: RydeScan): Vehicle[] {
  return scan.observations.map(row=>({provider:'ryde',vehicle_id:`ryde-app:${row.id}`,lat:row.lat,lng:row.lng,
    battery:null,range_m:null,distance_m:null,deep_link:null,
    rental_uris:{ios:'https://new-web-platform.ryde.vip/app/ios.html',android:'https://new-web-platform.ryde.vip/app/android.html',web:null}}));
}
export async function collectRydeArea(area: RydeArea, api: Pick<RydeBroker,'query'>, productionPilot=false): Promise<SourceVehicles> {
  if (!area.geometryEvidence || (!productionPilot && (!area.coverageEvidence || !area.coverageValidated || !area.uptimeValidated || !area.uptimeEvidence))) throw new Error('Ryde coverage and uptime have not passed review');
  const collecting=productionPilot?{...area,coverageValidated:true}:area;
  const scan=await scanRydeArea(collecting,api,undefined,Date.now,partial=>currentCollection()?.progress(rydeVehicles(partial),[]));
  if (!scan.complete) throw new Error('Ryde scan is incomplete; preserve previous observations');
  // The oldest retained observation sets the feed's age. Partial views never delete an old snapshot.
  return {vehicles:rydeVehicles(scan),observedAt:scan.observedAt,stale:false};
}
export interface RydeRuntimeConfig { token: string; areas: string; productionPilot: boolean }
export function loadRydeRuntimeConfig(path=process.env.RYDE_BRIDGE_CONFIG_PATH ?? join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'),'ryde-bridge.json')): RydeRuntimeConfig | undefined {
  if(process.env.RYDE_BRIDGE_TOKEN)return {token:process.env.RYDE_BRIDGE_TOKEN,areas:process.env.RYDE_BRIDGE_AREAS ?? '',productionPilot:false};
  let stat;
  try{stat=statSync(path);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return undefined;throw error;}
  if(!stat.isFile() || stat.size>4096 || (stat.mode&0o077))throw new Error('Ryde bridge config must be a private 0600 file');
  const config=JSON.parse(readFileSync(path,'utf8'));
  if(config.version!==1 || typeof config.token!=='string' || config.token.length<32 || typeof config.areas!=='string' || typeof config.productionPilot!=='boolean')throw new Error('Invalid Ryde bridge config');
  return config;
}

export function withRydeAppCollectors(feeds: CollectableScooterFeed[], broker: RydeBroker | undefined,
  enabled = process.env.RYDE_BRIDGE_AREAS ?? '', areas = catalog.areas as unknown as RydeArea[],
  systems: readonly RegionalScooterSystem[] = [], productionPilot=false): CollectableScooterFeed[] {
  if(!broker || !enabled)return feeds;
  const selected=new Set(enabled.split(',')),byArea=new Map(areas.map(a=>[a.id,a]));
  if(!selected.has('*'))for(const id of selected)if(!byArea.has(id))throw new Error(`Unknown reviewed Ryde area: ${id}`);
  for(const area of areas.filter(a=>selected.has('*') || selected.has(a.id))){
    if(!area.geometryEvidence || (!productionPilot && (!area.coverageValidated || !area.coverageEvidence || !area.uptimeValidated || !area.uptimeEvidence)))throw new Error('Unreviewed Ryde area enabled');
  }
  const regions=new Map(systems.filter(s=>s.rydeAppArea).map(s=>[`${({NO:'norway',SE:'sweden',FI:'finland',DE:'germany'} as Record<string,string>)[s.country]}:${s.id}`,s]));
  // The account queue reserves idle turns. Its actual cost determines the idle cadence.
  const views=systems.reduce((n,s)=>n+(s.rydeMapTiles?.length ?? 0),0);
  const idleIntervalMs=Math.max(APP_MAP_IDLE_INTERVAL_MS,Math.ceil(views*6_000*2/60_000)*60_000);
  return feeds.map(feed=>{
    const system=regions.get(feed.id);if(!system || (!selected.has('*') && !selected.has(system.rydeAppArea!)))return feed;
    const area=byArea.get(system.rydeAppArea!);if(!area)throw new Error('Missing Ryde market geometry');
    const excludeBounds=systems.filter(s=>s.country===area.country && s.provider==='ryde' && !s.rydeAppArea).flatMap(s=>s.areas?.map(a=>a.bounds) ?? [s.bounds]);
    return {...feed,paced:true,keepsIdleTurns:true,idleIntervalMs,watchMs:2*60_000,
      collect:()=>collectRydeArea({...area,tiles:system.rydeMapTiles,excludeBounds},broker,productionPilot)};
  });
}
