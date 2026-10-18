'use client';

import type { PathOptions } from 'leaflet';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import type { ZoneDataState } from '@/lib/useZoneData';
import type { ZoneKind } from '@/lib/zones';

/**
 * How each kind of zone is drawn: how strongly it is filled (the stronger the rule, the
 * stronger the fill) and its edge, solid, dashed or dotted. The fill is the whole kind's
 * at once, so that the same rule of five operators over a street looks like one. The
 * colours, and no riding's hatching, are the appearance's (map.css).
 */
export const ZONE_STYLES: Record<ZoneKind, { fillOpacity: number; edge: PathOptions }> = {
  noRide: { fillOpacity: 0.4, edge: { opacity: 0.9, weight: 1.5 } },
  noParking: { fillOpacity: 0.16, edge: { opacity: 0.9, weight: 1.5, dashArray: '6 4' } },
  slow: { fillOpacity: 0.12, edge: { opacity: 0.9, weight: 2, dashArray: '0.1 4', lineCap: 'round' } },
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
          <span className={`zone-swatch zone-swatch-${kind}`} aria-hidden="true" />
          {t(label)}
        </span>
      ))}
    </div>
  );
}
