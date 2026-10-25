import { REGIONAL_SCOOTER_SYSTEMS, isAppMapSystem, regionalSource, type RegionalScooterSystem } from '../src/lib/regionalScooterSystems';

/**
 * What a source's terms say of showing its scooters: licensed, under a licence or data terms
 * that allow it; public, published openly with no licence; restricted, under terms that limit
 * redistribution; rider-app, read from an operator's rider app.
 */
export type SourceClass = 'licensed' | 'public' | 'restricted' | 'rider-app';
/** The classes the iPhone app can be kept from showing; licensed sources are always shown. */
const HIDEABLE: readonly SourceClass[] = ['rider-app', 'restricted', 'public'];

// Entur's NLOD 2.0, the licences of NRW.Mobidrom and MobiData BW, Bolt's GBFS licence, Bird's data
// licence, which Spin's feeds link too, Beryl's licence and Flamingo's CC BY 4.0 (DATA_SOURCES.md).
const LICENSED_HOSTS = new Set(['api.entur.io', 'www.mobilitaetsdaten.nrw', 'api.mobidata-bw.de', 'mds.bolt.eu', 'mds.bird.co',
  'gbfs.spin.pm', 'beryl-gbfs-production.web.app', 'data.rideflamingo.com']);
// Dott's API terms restrict distribution; Lime's GBFS terms allow display only where local law requires it.
const RESTRICTED_HOSTS = new Set(['gbfs.api.ridedott.com', 'data.lime.bike']);
// Feeds of those hosts that the French and Belgian access points, transport.data.gouv.fr and
// transportdata.be, publish under the Licence Ouverte 2.0 or as open under attribution.
const LICENSED_FEEDS = new Set(['france:lime_fr_lille', 'france:lime_fr_marseille', 'france:lime_fr_paris_west',
  'france:pony_fr_beauvais', 'france:pony_fr_evry', 'france:pony_fr_la_roche_sur_yon', 'belgium:pony_be_charleroi']);

function systemClass(id: string, system: RegionalScooterSystem): SourceClass {
  if (isAppMapSystem(system)) return 'rider-app';
  if (LICENSED_FEEDS.has(id)) return 'licensed';
  const host = new URL(system.discoveryUrl).hostname;
  return LICENSED_HOSTS.has(host) ? 'licensed' : RESTRICTED_HOSTS.has(host) ? 'restricted' : 'public';
}

const SYSTEM_CLASSES = new Map(REGIONAL_SCOOTER_SYSTEMS.map(system => {
  const id = `${regionalSource(system)}:${system.id}`;
  return [id, systemClass(id, system)];
}));

export function sourceClass(feedId: string): SourceClass {
  // Switzerland's federal platform, opentransportdata.swiss.
  if (feedId.startsWith('national:')) return 'licensed';
  if (feedId.startsWith('hopp:')) return 'public';
  // The endpoints of PubliBike's app.
  if (feedId === 'publibike' || feedId === 'publibike-stations') return 'rider-app';
  // A feed no rule names counts as the most restricted, so a new source is never shown by mistake.
  return SYSTEM_CLASSES.get(feedId) ?? 'rider-app';
}

/**
 * `IOS_HIDDEN_SOURCE_CLASSES`: the classes the iPhone app is not shown, comma-separated, of
 * rider-app, restricted and public. Unset or empty, it is shown every source, as the website is.
 */
export function iosHiddenSourceClasses(value = ''): ReadonlySet<SourceClass> {
  const hidden = new Set<SourceClass>();
  for (const token of value.split(',').map(part => part.trim().toLowerCase()).filter(Boolean)) {
    const found = HIDEABLE.find(name => name === token);
    if (!found) throw new Error(`IOS_HIDDEN_SOURCE_CLASSES: "${token}" is not one of ${HIDEABLE.join(', ')}`);
    hidden.add(found);
  }
  return hidden;
}
