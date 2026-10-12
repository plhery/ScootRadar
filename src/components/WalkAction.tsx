'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics';
import { selectionFeedback } from '@/lib/feedback';
import { useI18n } from '@/lib/i18n';
import { formatDistance, walkingDirectionsUrl, walkingMinutes } from '@/lib/walking';
import type { WalkView } from '@/lib/walkState';
import Icon from './Icon';

/** The walk as a card shows it: Directions draws the way on the map. */
export interface CardWalk {
  /** The walk to this card's scooter or bay; null while there is none. */
  view: WalkView | null;
  /** Too far to walk: Directions opens a maps app instead. */
  tooFar: boolean;
  onStart: () => void;
  onHide: () => void;
}

interface WalkActionProps {
  walk: CardWalk;
  lat: number;
  lng: number;
  provider: string;
  target: 'vehicle' | 'parking';
  primary?: boolean;
}

/**
 * Directions on a card: it draws the way, and once the way is on the map it
 * takes it away again. While it is found it turns; where none can be found,
 * or the walk is too long, it opens Google Maps instead, as it used to.
 */
export function WalkButton({ walk, lat, lng, provider, target, primary = false }: WalkActionProps) {
  const { t } = useI18n();
  const phase = walk.view?.phase ?? null;
  const className = primary ? 'card-action-primary' : undefined;

  if (phase === 'gone') return null;
  if (walk.tooFar || phase === 'failed') {
    return (
      <a
        className={className}
        href={walkingDirectionsUrl(lat, lng)}
        target="_blank"
        rel="noreferrer"
        onClick={() => { track('directions_open', { provider, target, result: 'maps' }); selectionFeedback(); }}
      >
        <Icon name="directions" size={18} />
        {phase === 'failed' ? t('card.openIn', { name: 'Google Maps' }) : t('card.directions')}
      </a>
    );
  }

  const busy = phase === 'locating' || phase === 'finding';
  const shown = phase === 'shown';
  return (
    <button
      type="button"
      className={[className, 'walk-action', shown && 'walk-action-shown'].filter(Boolean).join(' ')}
      aria-busy={busy}
      onClick={() => {
        // Pressed again while the way is found: it is on its way already.
        if (busy) return;
        selectionFeedback();
        if (shown) {
          walk.onHide();
          return;
        }
        track('directions_open', { provider, target, result: 'route' });
        walk.onStart();
      }}
    >
      {busy ? <span className="mini-spinner walk-action-spinner" aria-hidden="true" /> : <Icon name={shown ? 'close' : 'directions'} size={18} />}
      {shown ? t('route.hide') : t('card.directions')}
    </button>
  );
}

/**
 * What became of the walk, under the actions of the card. Always on the page,
 * so that a screen reader says what comes to stand in it: that the way is
 * being found, that it is shown and how long it is, that none was found, that
 * you are there, or that the scooter is gone.
 */
export function WalkStatus({ view }: { view: WalkView | null }) {
  const i18n = useI18n();
  const { t, formatNumber } = i18n;
  // The way is announced once as it is shown, not again with every step taken.
  const [shown, setShown] = useState<{ id: number; text: string } | null>(null);
  if (view?.routeId != null && view.remainingM !== null && shown?.id !== view.routeId) {
    setShown({
      id: view.routeId,
      text: t('route.shown', {
        minutes: formatNumber(walkingMinutes(view.remainingM)),
        distance: formatDistance(view.remainingM, i18n),
      }),
    });
  }

  const phase = view?.phase ?? null;
  let content = null;
  if (phase === 'locating' || phase === 'finding') {
    content = <span className="sr-only">{t('route.finding')}</span>;
  } else if (phase === 'shown' && shown) {
    content = <span className="sr-only">{shown.text}</span>;
  } else if (phase === 'failed') {
    content = (
      <p className="walk-status walk-status-warning">
        <Icon name="warning" size={14} strokeWidth={2.2} />
        <span>{t(view?.failure === 'location' ? 'loc.notFound' : view?.failure === 'unavailable' ? 'route.unavailable' : 'route.failed')}</span>
      </p>
    );
  } else if (phase === 'arrived') {
    content = (
      <p className="walk-status walk-status-arrived">
        <Icon name="check" size={15} strokeWidth={2.4} />
        <span>{t('route.arrived')}</span>
      </p>
    );
  } else if (phase === 'gone') {
    content = (
      <p className="walk-status walk-status-warning walk-status-gone">
        <Icon name="warning" size={14} strokeWidth={2.2} />
        <span>{t('route.gone')}</span>
      </p>
    );
  }
  return <div role="status" className="walk-status-region">{content}</div>;
}
