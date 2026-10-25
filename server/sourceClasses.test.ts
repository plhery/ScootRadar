import { describe, expect, it } from 'vitest';
import { REGIONAL_SCOOTER_SYSTEMS, isAppMapSystem, regionalSource, type RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import { iosHiddenSourceClasses, sourceClass } from './sourceClasses';

const idOf = (system: RegionalScooterSystem) => `${regionalSource(system)}:${system.id}`;
const hostOf = (system: RegionalScooterSystem) => new URL(system.discoveryUrl).hostname;
const first = (test: (system: RegionalScooterSystem) => boolean) => idOf(REGIONAL_SCOOTER_SYSTEMS.find(test)!);

describe('source classes', () => {
  it('classes the Swiss feeds by their platform', () => {
    expect(sourceClass('national:bolt_winterthur')).toBe('licensed');
    expect(sourceClass('hopp:hopp_zug')).toBe('public');
    expect(sourceClass('publibike')).toBe('rider-app');
    expect(sourceClass('publibike-stations')).toBe('rider-app');
  });

  it('tells a Dott app region from a Dott GBFS feed', () => {
    expect(sourceClass(first(system => system.provider === 'dott' && Boolean(system.dottAppRegion)))).toBe('rider-app');
    expect(sourceClass('germany:dott_de_bielefeld')).toBe('rider-app');
    expect(sourceClass(first(system => hostOf(system) === 'gbfs.api.ridedott.com'))).toBe('restricted');
    expect(sourceClass('france:dott_fr_lyon')).toBe('restricted');
  });

  it('counts every app map as a rider app, whatever its host', () => {
    const maps = REGIONAL_SCOOTER_SYSTEMS.filter(isAppMapSystem);
    expect(maps.length).toBeGreaterThan(0);
    expect(new Set(maps.map(system => sourceClass(idOf(system))))).toEqual(new Set(['rider-app']));
    // Voi's GBFS feeds share api.voiapp.io with its app zones.
    expect(sourceClass(first(system => hostOf(system) === 'api.voiapp.io' && !isAppMapSystem(system)))).toBe('public');
    expect(sourceClass(first(system => Boolean(system.voiAppZone)))).toBe('rider-app');
    expect(sourceClass(first(system => Boolean(system.limeAppMap)))).toBe('rider-app');
  });

  it('licenses the Lime and Pony feeds the French and Belgian access points publish', () => {
    for (const id of ['france:lime_fr_lille', 'france:lime_fr_marseille', 'france:lime_fr_paris_west', 'france:pony_fr_beauvais',
      'france:pony_fr_evry', 'france:pony_fr_la_roche_sur_yon', 'belgium:pony_be_charleroi']) expect(sourceClass(id), id).toBe('licensed');
    expect(sourceClass(first(system => hostOf(system) === 'data.lime.bike' && regionalSource(system) !== 'france'))).toBe('restricted');
    expect(sourceClass('france:pony_fr_angers')).toBe('public');
    expect(sourceClass('france:naolib_fr_nantes')).toBe('public');
  });

  it('classes the other GBFS feeds by their host', () => {
    const byHost = (host: string) => sourceClass(first(system => hostOf(system) === host && !isAppMapSystem(system)));
    for (const host of ['api.entur.io', 'www.mobilitaetsdaten.nrw', 'api.mobidata-bw.de', 'mds.bolt.eu', 'mds.bird.co', 'gbfs.spin.pm',
      'beryl-gbfs-production.web.app', 'data.rideflamingo.com']) expect(byHost(host), host).toBe('licensed');
    for (const host of ['api.hopp.bike', 'hoppy.rideatom.com', 'cluster-prod.veoride.com', 'gbfs.lyft.com', 'prod-api.joltscooters.co.nz',
      'zeus.city', 'proxy.transport.data.gouv.fr', 'gbfs.getapony.com']) expect(byHost(host), host).toBe('public');
  });

  it('hides a feed no rule names, as the most restricted', () => {
    expect(sourceClass('france:newcomer_fr_paris')).toBe('rider-app');
    expect(sourceClass('elsewhere')).toBe('rider-app');
  });
});

describe('IOS_HIDDEN_SOURCE_CLASSES', () => {
  it('hides nothing unset or empty', () => {
    expect(iosHiddenSourceClasses(undefined).size).toBe(0);
    expect(iosHiddenSourceClasses('').size).toBe(0);
    expect(iosHiddenSourceClasses(' , ').size).toBe(0);
  });

  it('reads a comma-separated list of the classes that can be hidden', () => {
    expect(iosHiddenSourceClasses('rider-app, restricted')).toEqual(new Set(['rider-app', 'restricted']));
    expect(iosHiddenSourceClasses('Public,rider-app,public')).toEqual(new Set(['public', 'rider-app']));
  });

  it('refuses to hide licensed sources, or a class it does not know', () => {
    expect(() => iosHiddenSourceClasses('rider-app,licensed')).toThrow('IOS_HIDDEN_SOURCE_CLASSES: "licensed"');
    expect(() => iosHiddenSourceClasses('rider_app')).toThrow('IOS_HIDDEN_SOURCE_CLASSES');
    expect(() => iosHiddenSourceClasses('all')).toThrow('IOS_HIDDEN_SOURCE_CLASSES');
  });
});
