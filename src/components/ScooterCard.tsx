'use client';

import type { CSSProperties, ReactNode } from 'react';
import { track } from '@/lib/analytics';
import { batteryLevel } from '@/lib/battery';
import { selectionFeedback } from '@/lib/feedback';
import { useI18n } from '@/lib/i18n';
import { providerInkColor, providerSurfaceColor } from '@/lib/providerColor';
import type { ActiveCurfew } from '@/lib/rentalCurfews';
import { operatorAppLink, rentalLinkForPlatform, rentalPlatform } from '@/lib/rentalLinks';
import { RIDE_DURATIONS, currencyFractionDigits, formatListedDay, formatRidePrice, ridePriceQuote } from '@/lib/ridePrice';
import { PROVIDERS, type Vehicle } from '@/lib/types';
import { formatUiText } from '@/lib/uiText';
import { useRideDuration } from '@/lib/useRideDuration';
import { distanceParts, formatDistance, walkingMinutes, type WalkEstimate } from '@/lib/walking';
import Icon from './Icon';
import { WalkButton, WalkStatus, type CardWalk } from './WalkAction';

export interface SelectedVehicle {
  vehicle: Vehicle;
  /** Null without an origin: neither your location nor a searched place. */
  walk: WalkEstimate | null;
  /** The night ban of the city the scooter is in, while it holds. */
  curfew?: ActiveCurfew | null;
}

interface ScooterCardProps {
  selection: SelectedVehicle;
  onClose: () => void;
  /** Starts locating, from the line that stands in for the walking time. */
  onLocate: () => void;
  /** The location is on its way: the line says so instead of offering to locate again. */
  locating?: boolean;
  /** Directions, and the way it draws on the map. */
  walk: CardWalk;
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
export default function ScooterCard({ selection, onClose, onLocate, locating = false, walk: cardWalk }: ScooterCardProps) {
  const i18n = useI18n();
  const { locale, region, t, formatNumber } = i18n;
  const [duration, setDuration] = useRideDuration();
  const { vehicle, walk } = selection;
  // Taken by someone while you walked to it: nothing is left to do with it.
  const gone = cardWalk.view?.phase === 'gone';
  const provider = PROVIDERS[vehicle.provider];
  const name = provider?.name ?? vehicle.provider;
  const platform = typeof navigator === 'undefined' ? 'web' : rentalPlatform(navigator.userAgent, navigator.maxTouchPoints);
  const scooterLink = rentalLinkForPlatform(vehicle, platform);
  // Lime's, Bird's and PubliBike's feeds link no scooter, nor do Voi's, Dott's and Bolt's rider maps: a phone
  // opens their app instead, or its store page.
  const appLink = scooterLink ? null : operatorAppLink(vehicle.provider, platform);
  const rentalLink = scooterLink ?? appLink;
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

  const money = (minorUnits: number) => quote ? formatRidePrice(minorUnits, quote.currency, locale, region) : '';
  // Where tax is added, as in North America, the prices say so.
  const taxed = (text: string) => quote?.plusTax ? t('card.plusTax', { text }) : text;
  // Where the operator gives a range a minute, its lowest, "from".
  const tariff = quote
    ? taxed(quote.unlockFeeMinorUnits > 0
      ? t(quote.minuteFeeFrom ? 'card.note.priceFrom' : 'card.note.price', { unlock: money(quote.unlockFeeMinorUnits), minute: money(quote.minuteFeeMinorUnits) })
      : t(quote.minuteFeeFrom ? 'card.note.noUnlockFrom' : 'card.note.noUnlock', { minute: money(quote.minuteFeeMinorUnits) }))
    : null;
  // A price copied from the operator's price list, not its feed, says when it was read there.
  const note = tariff === null
    ? t('card.priceInApp', { name })
    : quote?.listedOn
      ? t('card.note.listed', { text: tariff, date: formatListedDay(quote.listedOn, locale, region) })
      : tariff;

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
      const distance = distanceParts(walk.distanceM, i18n);
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
      const distance = distanceParts(range, i18n);
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
      // "4.50" for francs, "1'032" for forints: the label beside it names the currency.
      const digits = currencyFractionDigits(quote.currency);
      return (
        <Figure
          key={kind}
          value={formatNumber(quote.totalMinorUnits / 100, { minimumFractionDigits: digits, maximumFractionDigits: digits })}
          label={t('card.figure.price', { currency: quote.currency.toUpperCase(), minutes: formatNumber(duration) })}
          spoken={t(quote.minuteFeeFrom ? 'card.priceFrom' : 'card.price', {
            price: taxed(money(quote.totalMinorUnits)),
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
      {selection.curfew && (
        <p className="card-note card-curfew">
          <Icon name="moon" size={13} strokeWidth={2.2} />
          <span>{formatUiText({ key: 'card.curfew', values: { city: selection.curfew.city }, time: selection.curfew.until, timeZone: selection.curfew.timeZone }, i18n)}</span>
        </p>
      )}

      {!gone && (
        <div className="card-actions">
          {rentalLink && (
            <a
              className="card-action-primary"
              href={rentalLink}
              target="_blank"
              rel="noreferrer"
              onClick={() => { track('rental_open', { provider: vehicle.provider, ...(appLink && { result: 'app' }) }); selectionFeedback(); }}
            >
              <Icon name="scooter" size={18} />
              {t('card.openIn', { name })}
            </a>
          )}
          <WalkButton walk={cardWalk} lat={vehicle.lat} lng={vehicle.lng} provider={vehicle.provider} target="vehicle" />
        </div>
      )}
      <WalkStatus view={cardWalk.view} />
    </div>
  );
}
