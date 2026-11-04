"""Read current native maps/geometry for reviewed official city candidates. No publishing."""
import argparse
import fcntl
import json
import math
from pathlib import Path
import re
import time
import unicodedata
import uuid
from worker import ROOT,query,save


def ring(value):
    if not isinstance(value,str) or not value.strip():return None
    points=[]
    for pair in value.split(';'):
        if not pair.strip():continue
        xy=[float(v.strip()) for v in pair.split(',')]
        if len(xy)!=2 or not all(math.isfinite(v) for v in xy) or abs(xy[0])>85 or abs(xy[1])>180:raise ValueError('Invalid ring')
        points.append(xy)
    return points if len(points)>=3 else None

def area_from_metadata(candidate, reply, count, previous=None):
    city=reply.get('city',{})
    if reply.get('status')!=200 or str(city.get('cityId'))!=str(candidate['cityId']):raise ValueError('City metadata identity mismatch')
    rings=[]
    base=ring(city.get('cityRange'))
    if base:rings.append(base)
    for fence in reply.get('fences',[]):
        if fence.get('fenceType')==4 and str(fence.get('cityId'))==str(candidate['cityId']):
            parsed=ring(fence.get('fenceArea'))
            if parsed:rings.append(parsed)
    kind='operating-rings'
    if not rings:
        fallback=ring(city.get('cityDefinitionZone'))
        if not fallback:raise ValueError('No collection envelope')
        rings=[fallback];kind='city-selection-envelope'
    all_points=[p for r in rings for p in r]
    bounds={'south':min(p[0] for p in all_points),'north':max(p[0] for p in all_points),
            'west':min(p[1] for p in all_points),'east':max(p[1] for p in all_points)}
    lat,lng=candidate['center']
    if not bounds['south']-.5<=lat<=bounds['north']+.5 or not bounds['west']-1<=lng<=bounds['east']+1:raise ValueError('Geometry remote from reviewed city')
    slug=re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',candidate['city']).encode('ascii','ignore').decode().lower()).strip('-')
    return {**(previous or {}),'id':(previous or {}).get('id',candidate['country'].lower()+'-'+slug),
        'cityId':candidate['cityId'],'country':candidate['country'],'city':candidate['city'],'center':candidate['center'],
        'providerCity':city.get('cityName'),'bounds':bounds,'rings':rings,'geometryKind':kind,
        'geometryEvidence':'Native getCityFences, verified cityId, 4 November 2026; '+kind,
        'coverageEvidence':(previous or {}).get('coverageEvidence','Production pilot: coverage checked during bounded collection'),
        'coverageValidated':(previous or {}).get('coverageValidated',False),'uptimeValidated':False,'uptimeEvidence':'',
        'productionPilot':True,'saturationCount':300 if count>=300 else 100 if count>=100 or count<16 else count,
        'cellM':1000 if kind=='operating-rings' else 2500,'initialScooters':count}


def main():
    p=argparse.ArgumentParser();p.add_argument('--candidates',required=True);p.add_argument('--output',required=True);p.add_argument('--all',action='store_true');p.add_argument('--resume',action='store_true');args=p.parse_args()
    base=ROOT/'producer';lock=(base/'worker.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    candidates=json.loads(Path(args.candidates).read_text())['cities'];output=Path(args.output)
    catalog=json.loads(output.read_text());areas={a['cityId']:a for a in catalog['areas']};results=[]
    selected=[c for c in candidates if args.all or not c['existingScootRadarFeeds']]
    if args.resume:selected=[c for c in selected if not areas.get(c['cityId'],{}).get('productionPilot')]
    for i,city in enumerate(selected):
        began=time.time();job={'version':1,'id':uuid.uuid4().hex,'cityId':city['cityId'],'latitude':city['center'][0],
            'longitude':city['center'][1],'radius':10,'expiresAt':time.time()+120}
        try:
            observed=query(job);count=len(observed['scooters'])
            path=base/'city-metadata'/f"{city['cityId']}-getCityFences.json"
            end=time.time()+8
            while time.time()<end:
                if path.exists():
                    metadata=json.loads(path.read_text())
                    if metadata['at']>=began:break
                time.sleep(.25)
            else:raise ValueError('No fresh native city metadata')
            areas[city['cityId']]=area_from_metadata(city,metadata['reply'],count,areas.get(city['cityId']))
            catalog['areas']=list(areas.values());catalog['productionPilotApproved']=True
            save(output,catalog)
            result={'cityId':city['cityId'],'city':city['city'],'state':'ready','scooters':count,'geometryKind':areas[city['cityId']]['geometryKind']}
        except Exception as error:
            result={'cityId':city['cityId'],'city':city['city'],'state':'failed','reason':type(error).__name__}
            # An auth/upstream rejection holds the account. Never hammer the remaining cities.
            status=json.loads((base/'session/status.json').read_text())
            if status.get('paused') or status['bridgeStage']=='needs-sign-in':
                results.append(result);save(base/'city-bootstrap-status.json',{'results':results,'held':True});raise
        results.append(result);save(base/'city-bootstrap-status.json',{'results':results,'held':False,'planned':len(selected)})
        print(json.dumps({'completed':i+1,'total':len(selected),**result}),flush=True)
        time.sleep(max(0,5-(time.time()-began)))

if __name__=='__main__':main()
