'use client';

import type { PathOptions } from 'leaflet';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import type { RuleKind, RuleZoneShape } from '@/lib/ruleZones';
import { formatWallTime } from '@/lib/uiText';
import type { ZoneDataState } from '@/lib/useZoneData';
import type { ZoneKind } from '@/lib/zones';

/**
 * How each kind of zone is drawn: how strongly it is filled (the stronger the rule, the
 * stronger the fill) and its edge, solid, dashed or dotted. Each kind's zones are merged
 * into one shape (zoneShapes.ts) and filled at once, so that the same rule of five
 * operators over a street looks like one. Parking is only ever a city's (ruleZones.ts). The
 * colours, and no riding's hatching, are the appearance's (map.css).
 */
export const ZONE_STYLES: Record<RuleKind, { fillOpacity: number; edge: PathOptions }> = {
  noRide: { fillOpacity: 0.4, edge: { opacity: 0.9, weight: 1.5 } },
  noParking: { fillOpacity: 0.16, edge: { opacity: 0.9, weight: 1.5, dashArray: '6 4' } },
  slow: { fillOpacity: 0.12, edge: { opacity: 0.9, weight: 2, dashArray: '0.1 4', lineCap: 'round' } },
  parking: { fillOpacity: 0.25, edge: { opacity: 0.9, weight: 1.5 } },
};

/** How far, in pixels, no parking's and slow zones' edges keep from no riding's edge, and out of its zones. */
export const ZONE_EDGE_CLEARANCE = 3;

const LABELS: Record<RuleKind, TranslationKey> = {
  noRide: 'zones.noRide',
  noParking: 'zones.noParking',
  slow: 'zones.slow',
  parking: 'zones.parking',
};

/** The operators' kinds, the strongest rule first. */
const KINDS: ZoneKind[] = ['noRide', 'noParking', 'slow'];
/** A city's, in the same order, parking last. */
const RULE_KINDS: RuleKind[] = [...KINDS, 'parking'];

const NOTES: Partial<Record<ZoneDataState, TranslationKey>> = {
  zoomIn: 'zones.zoomIn',
  failed: 'zones.failed',
};

/**
 * What the colours of the zones mean, while they are on; or why none are drawn. The zones a
 * city sets, and the streets it forbids riding on (ruleZones.ts), have lines of their own, on
 * or off, one for each rule: its hours, and who sets it, linked to where they say so.
 */
export default function ZoneLegend({ state, count, rules = [] }: {
  state: ZoneDataState;
  count: number;
  rules?: RuleZoneShape[];
}) {
  const { t, locale, region } = useI18n();
  const lines = new Map<string, { zone: RuleZoneShape; hours: string }>();
  for (const zone of rules) {
    const hours = zone.hours?.map(({ from, until }) =>
      `${formatWallTime(from, locale, region)}–${formatWallTime(until, locale, region)}`).join(', ') ?? '';
    const key = `${zone.rule} ${zone.authority} ${hours} ${zone.inForce}`;
    if (!lines.has(key)) lines.set(key, { zone, hours });
  }
  const ruleLines = [...lines].sort(([, a], [, b]) => RULE_KINDS.indexOf(a.zone.rule) - RULE_KINDS.indexOf(b.zone.rule));
  if (state === 'off' && !lines.size) return null;
  const note = state === 'off' ? null
    : NOTES[state] ?? (state === 'shown' && count === 0 && !lines.size ? 'zones.none' : null);
  const kinds = state === 'off' || (state === 'shown' && count === 0) ? [] : KINDS;
  return (
    <div className="zone-legend glass" role="group" aria-label={t('zones.label')}>
      {note ? <span className="zone-legend-note">{t(note)}</span> : kinds.map(kind => (
        <span key={kind} className="zone-legend-item">
          <span className={`zone-swatch zone-swatch-${kind}`} aria-hidden="true" />
          {t(LABELS[kind])}
        </span>
      ))}
      {ruleLines.map(([key, { zone, hours }]) => (
        <span key={key} className="zone-legend-item zone-legend-rule" data-in-force={zone.inForce}>
          <span className={`zone-swatch zone-swatch-${zone.rule}`} aria-hidden="true" />
          <span>
            {t(LABELS[zone.rule])}{hours && ` ${hours}`}
            {' · '}
            <a href={zone.source.url} target="_blank" rel="noopener noreferrer" title={zone.source.title}>{zone.authority}</a>
            {!zone.inForce && ` (${t('zones.ruleNotNow')})`}
          </span>
        </span>
      ))}
    </div>
  );
}
