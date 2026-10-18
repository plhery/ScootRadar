'use client';

import type { PathOptions } from 'leaflet';
import type { CSSProperties } from 'react';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import type { ZoneDataState } from '@/lib/useZoneData';
import type { ZoneKind } from '@/lib/zones';

const ZONE_COLORS: Record<ZoneKind, string> = { noRide: '#d92d20', noParking: '#e88a00', slow: '#3e63dd' };

/**
 * How each kind of zone is drawn: its colour, how strongly it is filled (the stronger
 * the rule, the stronger the fill) and its edge. The fill is the whole kind's at once,
 * so that the same rule of five operators over a street looks like one.
 */
export const ZONE_STYLES: Record<ZoneKind, { color: string; fillOpacity: number; edge: PathOptions }> = {
  noRide: { color: ZONE_COLORS.noRide, fillOpacity: 0.22, edge: { color: ZONE_COLORS.noRide, opacity: 0.75, weight: 1.5 } },
  noParking: { color: ZONE_COLORS.noParking, fillOpacity: 0.16, edge: { color: ZONE_COLORS.noParking, opacity: 0.7, weight: 1, dashArray: '5 4' } },
  slow: { color: ZONE_COLORS.slow, fillOpacity: 0.12, edge: { color: ZONE_COLORS.slow, opacity: 0.65, weight: 1, dashArray: '2 4' } },
};

const KINDS: { kind: ZoneKind; label: TranslationKey }[] = [
  { kind: 'noRide', label: 'zones.noRide' },
  { kind: 'noParking', label: 'zones.noParking' },
  { kind: 'slow', label: 'zones.slow' },
];

const NOTES: Partial<Record<ZoneDataState, TranslationKey>> = {
  zoomIn: 'zones.zoomIn',
  failed: 'zones.failed',
};

/** What the colours of the zones mean, while they are on; or why none are drawn. */
export default function ZoneLegend({ state, count }: { state: ZoneDataState; count: number }) {
  const { t } = useI18n();
  if (state === 'off') return null;
  const note = NOTES[state] ?? (state === 'shown' && count === 0 ? 'zones.none' : null);
  return (
    <div className="zone-legend glass" role="group" aria-label={t('zones.label')}>
      {note ? <span className="zone-legend-note">{t(note)}</span> : KINDS.map(({ kind, label }) => (
        <span key={kind} className="zone-legend-item">
          <span className={`zone-swatch zone-swatch-${kind}`} style={{ '--zone-color': ZONE_COLORS[kind] } as CSSProperties} aria-hidden="true" />
          {t(label)}
        </span>
      ))}
    </div>
  );
}
