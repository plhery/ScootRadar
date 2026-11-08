'use client';

import type { PathOptions } from 'leaflet';
import { Fragment } from 'react';
import { formatLocale } from '@/lib/formatLocale';
import { useI18n, type AppLocale, type TranslationKey } from '@/lib/i18n';
import type { RuleKind, RuleZoneShape } from '@/lib/ruleZones';
import { formatWallTime } from '@/lib/uiText';
import type { ZoneDataState } from '@/lib/useZoneData';
import { measurementSystem } from '@/lib/walking';
import type { MapZone, ZoneKind } from '@/lib/zones';

/**
 * How each kind of zone is drawn: how strongly it is filled (the stronger the rule, the
 * stronger the fill) and its edge, solid, dashed or dotted. Each kind's zones are merged
 * into one shape (zoneShapes.ts) and filled at once, so that the same rule of five
 * operators, or of an operator and the city, over a street looks like one. Parking is only
 * ever a city's (ruleZones.ts), and so is an area where scooters park only in racks or
 * marked places: a whole town centre, so barely
 * filled, within an edge of dashes and dots. So is the pavement a scooter may ride on, a line
 * rather than an area: its edge is the line
 * itself, a few pixels wide at every zoom, and it has no fill. The colours, and no riding's
 * hatching, are the appearance's (map.css).
 */
export const ZONE_STYLES: Record<RuleKind, { fillOpacity: number; edge: PathOptions }> = {
  noRide: { fillOpacity: 0.4, edge: { opacity: 0.9, weight: 1.5 } },
  noParking: { fillOpacity: 0.16, edge: { opacity: 0.9, weight: 1.5, dashArray: '6 4' } },
  slow: { fillOpacity: 0.12, edge: { opacity: 0.9, weight: 2, dashArray: '0.1 4', lineCap: 'round' } },
  parking: { fillOpacity: 0.25, edge: { opacity: 0.9, weight: 1.5 } },
  racksOnly: { fillOpacity: 0.06, edge: { opacity: 0.9, weight: 2, dashArray: '10 4 1 4', lineCap: 'round' } },
  pavement: { fillOpacity: 0, edge: { opacity: 0.85, weight: 3, lineCap: 'round', lineJoin: 'round' } },
};

/** How far, in pixels, no parking's and slow zones' edges keep from no riding's edge, and out of its zones. */
export const ZONE_EDGE_CLEARANCE = 3;

const LABELS: Record<RuleKind, TranslationKey> = {
  noRide: 'zones.noRide',
  noParking: 'zones.noParking',
  slow: 'zones.slow',
  parking: 'zones.parking',
  racksOnly: 'zones.racksOnly',
  pavement: 'zones.pavement',
};

/** The operators' kinds, the strongest rule first. */
const KINDS: ZoneKind[] = ['noRide', 'noParking', 'slow'];
/**
 * A city's, in the same order, then where scooters may park, where they may park only in racks or
 * marked places, and where they may ride on the pavement.
 */
const RULE_KINDS: RuleKind[] = [...KINDS, 'parking', 'racksOnly', 'pavement'];

const NOTES: Partial<Record<ZoneDataState, TranslationKey>> = {
  zoomIn: 'zones.zoomIn',
  // Some zones were left out of the area's answer: those drawn are named, and zoomed in, all are.
  partial: 'zones.zoomIn',
  failed: 'zones.failed',
};

const KM_PER_MILE = 1.609344;

/**
 * The limits of the slow zones a line of the legend counts, given in km/h, as it says them: "6 km/h", or from the
 * least to the greatest, "6–15 km/h"; in mph where the region measures distances in miles, as walking.ts does, each
 * rounded to a whole number once converted (16.09 km/h is "10 mph"). Null where one of them has none, or none is
 * counted: the line then says "Slow" alone.
 */
export function formatSpeedLimits(speedsKph: readonly (number | undefined)[], locale: AppLocale, region?: string): string | null {
  const miles = measurementSystem(region) !== 'metric';
  let least = Infinity;
  let greatest = -Infinity;
  for (const speed of speedsKph) {
    if (typeof speed !== 'number' || !Number.isFinite(speed)) return null;
    const value = Math.round(miles ? speed / KM_PER_MILE : speed);
    least = Math.min(least, value);
    greatest = Math.max(greatest, value);
  }
  if (!speedsKph.length) return null;
  const tag = formatLocale(locale, region);
  const withUnit = new Intl.NumberFormat(tag, {
    style: 'unit',
    unit: miles ? 'mile-per-hour' : 'kilometer-per-hour',
    unitDisplay: 'short',
    maximumFractionDigits: 0,
  }).format(greatest);
  return least === greatest ? withUnit : `${new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(least)}–${withUnit}`;
}

/**
 * What the colours of the zones mean, while they are on; or why none are drawn. Each kind is named
 * once, the strongest rule first, whether the operators or a city (ruleZones.ts) set it: a city's
 * rule has a line of its own only where its hours set it apart, its swatch hatched the other way
 * as the map draws it, or where its first day is still to come; dimmer while it does not hold. Slow
 * names the limit of the slow zones it counts where each has one, "Slow: 6 km/h", and so does a city's
 * slow line. Who sets the cities' rules is credited once each, small, at the foot, linked to where they
 * say so.
 */
export default function ZoneLegend({ state, zones, rules = [] }: {
  state: ZoneDataState;
  /** The operators' zones drawn. */
  zones: readonly Pick<MapZone, 'kind' | 'maxSpeedKph'>[];
  rules?: RuleZoneShape[];
}) {
  const { t, locale, region } = useI18n();
  if (state === 'off' && !rules.length) return null;
  const count = zones.length;
  const note = state === 'off' ? null
    : NOTES[state] ?? (state === 'shown' && count === 0 && !rules.length ? 'zones.none' : null);
  const kinds = new Set<RuleKind>((note && state !== 'partial') || state === 'off' || (state === 'shown' && count === 0) ? [] : KINDS);
  // The limits "Slow" names: the operators' slow zones' while their kinds are named, and those of the cities'
  // slow rules that hold at all hours; a city's line names its own.
  const slowSpeeds = kinds.has('slow') ? zones.flatMap(zone => zone.kind === 'slow' ? [zone.maxSpeedKph] : []) : [];
  const lines = new Map<string, { zone: RuleZoneShape; hours: string; speeds: (number | undefined)[] }>();
  const credits = new Map<string, RuleZoneShape>();
  for (const zone of [...rules].sort((a, b) => RULE_KINDS.indexOf(a.rule) - RULE_KINDS.indexOf(b.rule))) {
    if (!credits.has(zone.authority)) credits.set(zone.authority, zone);
    const hours = zone.hours?.map(({ from, until }) =>
      `${formatWallTime(from, locale, region)}–${formatWallTime(until, locale, region)}`).join(', ') ?? '';
    let speeds = slowSpeeds;
    if (hours || !zone.inForce) {
      const key = `${zone.rule} ${hours} ${zone.inForce}`;
      const line = lines.get(key) ?? { zone, hours, speeds: [] };
      lines.set(key, line);
      speeds = line.speeds;
    } else {
      kinds.add(zone.rule);
    }
    if (zone.rule === 'slow') speeds.push(zone.maxSpeedKph);
  }
  // "Slow: 6 km/h" where each slow zone counted has a limit, else the kind's name: the text screen readers read too.
  const label = (kind: RuleKind, speeds: readonly (number | undefined)[]) => {
    const speed = kind === 'slow' ? formatSpeedLimits(speeds, locale, region) : null;
    return speed ? t('zones.slowSpeed', { speed }) : t(LABELS[kind]);
  };
  return (
    <div className="zone-legend glass" role="group" aria-label={t('zones.label')}>
      {note && <span className="zone-legend-note">{t(note)}</span>}
      {RULE_KINDS.filter(kind => kinds.has(kind)).map(kind => (
        <span key={kind} className="zone-legend-item">
          <span className={`zone-swatch zone-swatch-${kind}`} aria-hidden="true" />
          {label(kind, slowSpeeds)}
        </span>
      ))}
      {[...lines].map(([key, { zone, hours, speeds }]) => (
        <span key={key} className="zone-legend-item zone-legend-rule" data-in-force={zone.inForce}>
          <span className={`zone-swatch zone-swatch-${zone.rule}${hours ? ' zone-swatch-timed' : ''}`} aria-hidden="true" />
          <span>
            {label(zone.rule, speeds)}{hours && ` ${hours}`}
            {!zone.inForce && ` (${t('zones.ruleNotNow')})`}
          </span>
        </span>
      ))}
      {credits.size > 0 && (
        <span className="zone-legend-credit">
          {[...credits.values()].map((zone, index) => (
            <Fragment key={zone.authority}>
              {index > 0 && ' · '}
              <a href={zone.source.url} target="_blank" rel="noopener noreferrer" title={zone.source.title}>{zone.authority}</a>
            </Fragment>
          ))}
        </span>
      )}
    </div>
  );
}
