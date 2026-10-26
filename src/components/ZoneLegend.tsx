'use client';

import type { PathOptions } from 'leaflet';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import type { RuleZoneShape } from '@/lib/ruleZones';
import { formatWallTime } from '@/lib/uiText';
import type { ZoneDataState } from '@/lib/useZoneData';
import type { ZoneKind } from '@/lib/zones';

/**
 * How each kind of zone is drawn: how strongly it is filled (the stronger the rule, the
 * stronger the fill) and its edge, solid, dashed or dotted. Each kind's zones are merged
 * into one shape (zoneShapes.ts) and filled at once, so that the same rule of five
 * operators over a street looks like one. The colours, and no riding's hatching, are the
 * appearance's (map.css).
 */
export const ZONE_STYLES: Record<ZoneKind, { fillOpacity: number; edge: PathOptions }> = {
  noRide: { fillOpacity: 0.4, edge: { opacity: 0.9, weight: 1.5 } },
  noParking: { fillOpacity: 0.16, edge: { opacity: 0.9, weight: 1.5, dashArray: '6 4' } },
  slow: { fillOpacity: 0.12, edge: { opacity: 0.9, weight: 2, dashArray: '0.1 4', lineCap: 'round' } },
};

/** How far, in pixels, no parking's and slow zones' edges keep from no riding's edge, and out of its zones. */
export const ZONE_EDGE_CLEARANCE = 3;

const KINDS: { kind: ZoneKind; label: TranslationKey }[] = [
  { kind: 'noRide', label: 'zones.noRide' },
  { kind: 'noParking', label: 'zones.noParking' },
  { kind: 'slow', label: 'zones.slow' },
];

const NOTES: Partial<Record<ZoneDataState, TranslationKey>> = {
  zoomIn: 'zones.zoomIn',
  failed: 'zones.failed',
};

/**
 * What the colours of the zones mean, while they are on; or why none are drawn. A street a
 * city forbids riding on (ruleZones.ts) has a line of its own, on or off: its hours, and who
 * forbids it, linked to where they say so.
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
    const key = `${zone.authority} ${hours} ${zone.inForce}`;
    if (!lines.has(key)) lines.set(key, { zone, hours });
  }
  if (state === 'off' && !lines.size) return null;
  const note = state === 'off' ? null
    : NOTES[state] ?? (state === 'shown' && count === 0 && !lines.size ? 'zones.none' : null);
  const kinds = state === 'off' || (state === 'shown' && count === 0) ? [] : KINDS;
  return (
    <div className="zone-legend glass" role="group" aria-label={t('zones.label')}>
      {note ? <span className="zone-legend-note">{t(note)}</span> : kinds.map(({ kind, label }) => (
        <span key={kind} className="zone-legend-item">
          <span className={`zone-swatch zone-swatch-${kind}`} aria-hidden="true" />
          {t(label)}
        </span>
      ))}
      {[...lines].map(([key, { zone, hours }]) => (
        <span key={key} className="zone-legend-item zone-legend-rule" data-in-force={zone.inForce}>
          <span className={`zone-swatch zone-swatch-${zone.rule}`} aria-hidden="true" />
          <span>
            {t('zones.noRide')} {hours}
            {' · '}
            <a href={zone.source.url} target="_blank" rel="noopener noreferrer" title={zone.source.title}>{zone.authority}</a>
            {!zone.inForce && ` (${t('zones.ruleNotNow')})`}
          </span>
        </span>
      ))}
    </div>
  );
}
