'use client';

import type { PathOptions } from 'leaflet';
import { Fragment } from 'react';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import type { RuleKind, RuleZoneShape } from '@/lib/ruleZones';
import { formatWallTime } from '@/lib/uiText';
import type { ZoneDataState } from '@/lib/useZoneData';
import type { ZoneKind } from '@/lib/zones';

/**
 * How each kind of zone is drawn: how strongly it is filled (the stronger the rule, the
 * stronger the fill) and its edge, solid, dashed or dotted. Each kind's zones are merged
 * into one shape (zoneShapes.ts) and filled at once, so that the same rule of five
 * operators over a street looks like one. Parking is only ever a city's (ruleZones.ts), and so
 * is an area where scooters park only in racks or marked places: a whole town centre, so barely
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
  failed: 'zones.failed',
};

/**
 * What the colours of the zones mean, while they are on; or why none are drawn. Each kind is named
 * once, the strongest rule first, whether the operators or a city (ruleZones.ts) set it: a city's
 * rule has a line of its own only where its hours set it apart, its swatch hatched the other way
 * as the map draws it, or where its first day is still to come; dimmer while it does not hold. Who
 * sets the cities' rules is credited once each, small, at the foot, linked to where they say so.
 */
export default function ZoneLegend({ state, count, rules = [] }: {
  state: ZoneDataState;
  count: number;
  rules?: RuleZoneShape[];
}) {
  const { t, locale, region } = useI18n();
  if (state === 'off' && !rules.length) return null;
  const note = state === 'off' ? null
    : NOTES[state] ?? (state === 'shown' && count === 0 && !rules.length ? 'zones.none' : null);
  const kinds = new Set<RuleKind>(note || state === 'off' || (state === 'shown' && count === 0) ? [] : KINDS);
  const lines = new Map<string, { zone: RuleZoneShape; hours: string }>();
  const credits = new Map<string, RuleZoneShape>();
  for (const zone of [...rules].sort((a, b) => RULE_KINDS.indexOf(a.rule) - RULE_KINDS.indexOf(b.rule))) {
    if (!credits.has(zone.authority)) credits.set(zone.authority, zone);
    const hours = zone.hours?.map(({ from, until }) =>
      `${formatWallTime(from, locale, region)}–${formatWallTime(until, locale, region)}`).join(', ') ?? '';
    if (!hours && zone.inForce) {
      kinds.add(zone.rule);
      continue;
    }
    const key = `${zone.rule} ${hours} ${zone.inForce}`;
    if (!lines.has(key)) lines.set(key, { zone, hours });
  }
  return (
    <div className="zone-legend glass" role="group" aria-label={t('zones.label')}>
      {note && <span className="zone-legend-note">{t(note)}</span>}
      {RULE_KINDS.filter(kind => kinds.has(kind)).map(kind => (
        <span key={kind} className="zone-legend-item">
          <span className={`zone-swatch zone-swatch-${kind}`} aria-hidden="true" />
          {t(LABELS[kind])}
        </span>
      ))}
      {[...lines].map(([key, { zone, hours }]) => (
        <span key={key} className="zone-legend-item zone-legend-rule" data-in-force={zone.inForce}>
          <span className={`zone-swatch zone-swatch-${zone.rule}${hours ? ' zone-swatch-timed' : ''}`} aria-hidden="true" />
          <span>
            {t(LABELS[zone.rule])}{hours && ` ${hours}`}
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
