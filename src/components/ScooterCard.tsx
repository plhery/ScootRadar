'use client';

import type { CSSProperties, ReactNode } from 'react';
import { track } from '@/lib/analytics';
import { batteryLevel } from '@/lib/battery';
import { selectionFeedback } from '@/lib/feedback';
import { useI18n } from '@/lib/i18n';
import { providerInkColor, providerSurfaceColor } from '@/lib/providerColor';
import { browserRentalLink } from '@/lib/rentalLinks';
import { RIDE_DURATIONS, formatRidePrice, ridePriceQuote } from '@/lib/ridePrice';
import { PROVIDERS, type Vehicle } from '@/lib/types';
import { useRideDuration } from '@/lib/useRideDuration';
import {
  distanceParts,
  formatDistance,
  walkingDirectionsUrl,
  walkingMinutes,
  type WalkEstimate,
} from '@/lib/walking';
import Icon from './Icon';

export interface SelectedVehicle {
  vehicle: Vehicle;
  /** Null without an origin: neither your location nor a searched place. */
  walk: WalkEstimate | null;
}

interface ScooterCardProps {
  selection: SelectedVehicle;
  onClose: () => void;
  /** Starts locating, from the line that stands in for the walking time. */
  onLocate: () => void;
  /** The location is on its way: the line says so instead of offering to locate again. */
  locating?: boolean;
}

type FigureKind = 'walk' | 'distance' | 'price' | 'battery' | 'range';

/**
 * The figures of a card, at most three. With a place to walk from: the walk,
 * the distance, and the price (or else the battery, or else the range).
 * Without one: what is known of the scooter itself.
 */
export function cardFigures({ walk, battery, range, price }: Record<'walk' | 'battery' | 'range' | 'price', boolean>): FigureKind[] {
  if (walk) return ['walk', 'distance', ...(price ? ['price' as const] : battery ? ['battery' as const] : range ? ['range' as const] : [])];
  return [...(battery ? ['battery' as const] : []), ...(range ? ['range' as const] : []), ...(price ? ['price' as const] : [])];
}

/**
 * A number set large with its unit, and under it what it measures. A screen
 * reader gets `spoken` in place of the three parts; a figure without it is
 * said by the one before.
 */
function Figure({ value, unit, label, spoken, tone, children }: {
  value: string;
  unit?: string;
  label: string;
  spoken?: string;
  tone?: 'low' | 'critical';
  children?: ReactNode;
}) {
  return (
    <div
      className={`card-figure${tone ? ` card-figure-${tone}` : ''}${children ? ' card-figure-choice' : ''}`}
      aria-hidden={spoken ? undefined : true}
    >
      {spoken && <span className="sr-only">{spoken}</span>}
      <strong aria-hidden="true">
        {value}
        {unit && <small>{unit}</small>}
      </strong>
      <span className="card-figure-label" aria-hidden="true">{label}</span>
      {children}
    </div>
  );
}

/** What the dock shows for the selected scooter: who runs it, how far it is, what a ride costs. */
export default function ScooterCard({ selection, onClose, onLocate, locating = false }: ScooterCardProps) {
  const i18n = useI18n();
  const { locale, t, formatNumber } = i18n;
  const [duration, setDuration] = useRideDuration();
  const { vehicle, walk } = selection;
  const provider = PROVIDERS[vehicle.provider];
  const name = provider?.name ?? vehicle.provider;
  const rentalLink = browserRentalLink(
    vehicle,
    typeof navigator === 'undefined' ? '' : navigator.userAgent,
    typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints
  );
  const quote = vehicle.pricing ? ridePriceQuote(vehicle.pricing, duration) : null;
  const { battery, range_m: range } = vehicle;
  const figures = cardFigures({ walk: walk !== null, battery: battery !== null, range: range !== null, price: quote !== null });

  // What is not among the figures is said in a line under the name.
  const batteryFact = battery !== null && !figures.includes('battery') ? formatNumber(battery) : null;
  const rangeFact = range !== null && !figures.includes('range') ? formatDistance(range, i18n) : null;
  const facts = batteryFact !== null && rangeFact !== null
    ? t('card.facts.both', { battery: batteryFact, range: rangeFact })
    : batteryFact !== null
      ? t('card.facts.battery', { battery: batteryFact })
      : rangeFact !== null ? t('card.facts.range', { range: rangeFact }) : null;
  const level = battery === null ? 'good' : batteryLevel(battery);
  const tone = level === 'good' ? undefined : level;

  const money = (minorUnits: number) => quote ? formatRidePrice(minorUnits, quote.currency, locale) : '';
  const note = quote
    ? quote.unlockFeeMinorUnits > 0
      ? t('card.note.price', { unlock: money(quote.unlockFeeMinorUnits), minute: money(quote.minuteFeeMinorUnits) })
      : t('card.note.noUnlock', { minute: money(quote.minuteFeeMinorUnits) })
    : t('card.priceInApp', { name });

  const figure = (kind: FigureKind) => {
    if (kind === 'walk' && walk) {
      const minutes = formatNumber(walkingMinutes(walk.distanceM));
      return (
        <Figure
          key={kind}
          value={minutes}
          unit={t('card.minutesUnit')}
          label={walk.place ? t('card.figure.walkFrom', { place: walk.place }) : t('card.figure.walk')}
          spoken={t(walk.place ? 'card.walkFrom' : 'card.walk', {
            minutes,
            distance: formatDistance(walk.distanceM, i18n),
            ...(walk.place ? { place: walk.place } : {}),
          })}
        />
      );
    }
    if (kind === 'distance' && walk) {
      const distance = distanceParts(walk.distanceM, formatNumber);
      return <Figure key={kind} value={distance.value} unit={distance.unit} label={t('card.figure.distance')} />;
    }
    if (kind === 'battery' && battery !== null) {
      return (
        <Figure
          key={kind}
          value={formatNumber(battery)}
          unit="%"
          label={t('card.figure.battery')}
          spoken={`${t('card.battery')} ${formatNumber(battery)}%`}
          tone={tone}
        />
      );
    }
    if (kind === 'range' && range !== null) {
      const distance = distanceParts(range, formatNumber);
      return (
        <Figure
          key={kind}
          value={distance.value}
          unit={distance.unit}
          label={t('card.figure.range')}
          spoken={`${t('card.range')} ${formatDistance(range, i18n)}`}
        />
      );
    }
    if (kind === 'price' && quote) {
      return (
        <Figure
          key={kind}
          value={formatNumber(quote.totalMinorUnits / 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          label={t('card.figure.price', { currency: quote.currency.toUpperCase(), minutes: formatNumber(duration) })}
          spoken={t('card.price', {
            price: money(quote.totalMinorUnits),
            minutes: formatNumber(duration),
          })}
        >
          {/* A native select over the figure: the system's own picker on a phone, a menu on a desktop. */}
          <Icon name="upDown" size={12} strokeWidth={2.4} />
          <select
            aria-label={t('card.priceAria', { minutes: formatNumber(duration) })}
            value={duration}
            onChange={(event) => {
              selectionFeedback();
              setDuration(Number(event.target.value));
            }}
          >
            {RIDE_DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {t('card.duration', { minutes: formatNumber(minutes) })}
              </option>
            ))}
          </select>
        </Figure>
      );
    }
    return null;
  };

  return (
    <div
      className="dock-card scooter-card"
      style={{
        '--provider-color': providerSurfaceColor(vehicle.provider, '#8e8e93'),
        '--provider-ink': providerInkColor(vehicle.provider),
      } as CSSProperties}
    >
      <div className="card-head">
        <span className="card-symbol" aria-hidden="true">{provider?.initial ?? '?'}</span>
        <div className="card-title">
          <h2>{name}</h2>
          {walk ? (
            facts && <p className={tone && batteryFact !== null ? `card-facts-${tone}` : undefined}>{facts}</p>
          ) : locating ? (
            <p className="card-locating">
              <span className="mini-spinner" aria-hidden="true" />
              {t('bar.locating')}
            </p>
          ) : (
            <button
              type="button"
              className="card-link"
              onClick={(event) => {
                selectionFeedback();
                // The link leaves while the location is on its way; the focus stays with the card.
                event.currentTarget.closest<HTMLElement>('[tabindex="-1"]')?.focus({ preventScroll: true });
                onLocate();
              }}
            >
              {t('card.noOrigin')}
            </button>
          )}
        </div>
        <button
          type="button"
          className="card-close"
          onClick={() => {
            selectionFeedback();
            onClose();
          }}
          aria-label={t('card.close')}
        >
          <Icon name="close" size={17} />
        </button>
      </div>

      {figures.length > 0 && <div className="card-figures">{figures.map(figure)}</div>}
      <p className="card-note">{note}</p>

      <div className="card-actions">
        {rentalLink && (
          <a
            className="card-action-primary"
            href={rentalLink}
            target="_blank"
            rel="noreferrer"
            onClick={() => { track('rental_open', { provider: vehicle.provider }); selectionFeedback(); }}
          >
            <Icon name="scooter" size={18} />
            {t('card.openIn', { name })}
          </a>
        )}
        <a
          href={walkingDirectionsUrl(vehicle.lat, vehicle.lng)}
          target="_blank"
          rel="noreferrer"
          onClick={() => { track('directions_open', { provider: vehicle.provider, target: 'vehicle' }); selectionFeedback(); }}
        >
          <Icon name="walk" size={18} />
          {t('card.directions')}
        </a>
      </div>
    </div>
  );
}
