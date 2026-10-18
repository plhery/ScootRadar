import catalog from '../../data/listed-prices.json';
import { boundsContainPoint } from '@/lib/geo';
import type { MapBounds, RidePricing } from '@/lib/types';

// Prices for the systems whose feeds publish none, such as Lime's, Bird's and
// Spin's, copied by hand from each operator's public price list into
// data/listed-prices.json. Their scooters get their town's price with the day
// it was checked, which the card shows. An entry is dropped once it is
// staleAfterDays old; the weekly catalog check (scripts/check-listed-prices.mjs)
// asks for a recheck well before.

export interface ListedPrice {
  /** The systems this price is for, by catalog id: "lime_us_chicago". */
  systems: string[];
  /** Where a system's towns charge differently: the part of it this price is for. */
  bounds?: MapBounds;
  currency: string;
  unlock_fee_minor_units: number;
  minute_fee_minor_units: number;
  /** The operator gives a range a minute, and minute_fee_minor_units is its lowest: "from". */
  minute_fee_from?: boolean;
  /** Tax comes on top, as in the US and Canada. */
  plus_tax: boolean;
  /** Whose page the price is from: the operator's, or the city's where the operator publishes none. */
  source: 'operator' | 'city';
  url: string;
  /** The page's words, as read on the day checked. */
  quote: string;
  /** "YYYY-MM-DD", the day the price was last read at url. */
  checked: string;
}

export const LISTED_PRICES = catalog.prices as ListedPrice[];
export const RECHECK_AFTER_DAYS = catalog.recheckAfterDays;
export const STALE_AFTER_DAYS = catalog.staleAfterDays;
const DAY_MS = 86_400_000;

/** Whole days since the price was checked. */
export function listedPriceAge(entry: Pick<ListedPrice, 'checked'>, now: number): number {
  return Math.floor((now - Date.parse(`${entry.checked}T00:00:00Z`)) / DAY_MS);
}

type ListedPriceLookup = (systemId: string, lat: number, lng: number, now: number) => RidePricing | undefined;

/** Looks up a scooter's listed price among those entries, leaving out any older than staleAfterDays. */
export function listedPriceLookup(entries: ListedPrice[], staleAfterDays: number): ListedPriceLookup {
  const bySystem = new Map<string, { entry: ListedPrice; pricing: RidePricing }[]>();
  for (const entry of entries) {
    const pricing: RidePricing = {
      currency: entry.currency,
      unlock_fee_minor_units: entry.unlock_fee_minor_units,
      minute_fee_minor_units: entry.minute_fee_minor_units,
      ...(entry.minute_fee_from ? { minute_fee_from: true } : {}),
      ...(entry.plus_tax ? { plus_tax: true } : {}),
      listed_on: entry.checked,
    };
    for (const system of entry.systems) {
      const prices = bySystem.get(system) ?? [];
      // A price for part of a system goes before the system's own.
      prices.splice(entry.bounds ? 0 : prices.length, 0, { entry, pricing });
      bySystem.set(system, prices);
    }
  }
  return (systemId, lat, lng, now) => {
    const match = bySystem.get(systemId)?.find(({ entry }) => !entry.bounds || boundsContainPoint(entry.bounds, lat, lng));
    return match && listedPriceAge(match.entry, now) <= staleAfterDays ? match.pricing : undefined;
  };
}

/** The listed price for a scooter of that system at that point, unless it is too old to show. */
export const listedPricing = listedPriceLookup(LISTED_PRICES, STALE_AFTER_DAYS);
