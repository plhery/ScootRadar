import catalog from '../../data/listed-prices.json';
import { boundsContainPoint } from '@/lib/geo';
import { WEEKDAYS, localClock } from '@/lib/rentalCurfews';
import type { MapBounds, RidePricing, Vehicle } from '@/lib/types';

// Prices for the systems whose feeds publish none, such as Lime's, Bird's and
// Spin's, copied by hand from each operator's public price list into
// data/listed-prices.json. Their scooters get their town's price with the day
// it was checked, which the card shows. An entry is dropped once it is
// staleAfterDays old; the weekly catalog check (scripts/check-listed-prices.mjs)
// asks for a recheck well before. An entry for some days of the week goes before
// the feed's own price on those days, which a feed can't vary by day.

export interface ListedPrice {
  /** The systems this price is for, by catalog id: "lime_us_chicago". */
  systems: string[];
  /** Where a system's towns charge differently: the part of it this price is for. */
  bounds?: MapBounds;
  /**
   * The days this price is for, where the operator charges differently on them and its feed gives
   * the same price every day: Beryl's Brighton feed gives its weekday 20p at weekends too. On those
   * days it goes before the feed's price.
   */
  days?: (typeof WEEKDAYS)[number][];
  /** The zone whose days those are, "Europe/London"; given with days. */
  timeZone?: string;
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

type ListedPriceLookup = (
  systemId: string, lat: number, lng: number, now: number, feedPricing?: RidePricing
) => RidePricing | undefined;

/**
 * Looks up a scooter's price among those entries, leaving out any older than staleAfterDays: its
 * listed price for the day, else the feed's, else its listed price for every day.
 */
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
  return (systemId, lat, lng, now, feedPricing) => {
    const here = bySystem.get(systemId)?.filter(({ entry }) => !entry.bounds || boundsContainPoint(entry.bounds, lat, lng)) ?? [];
    const today = here.find(({ entry }) => entry.days?.includes(WEEKDAYS[localClock(now, entry.timeZone ?? 'UTC').weekday]));
    const match = today ?? (feedPricing ? undefined : here.find(({ entry }) => !entry.days));
    if (!match) return feedPricing;
    return listedPriceAge(match.entry, now) <= staleAfterDays ? match.pricing : feedPricing;
  };
}

/** The price for a scooter of that system at that point, given the feed's, as listedPriceLookup says. */
export const listedPricing = listedPriceLookup(LISTED_PRICES, STALE_AFTER_DAYS);

/**
 * The system a listed price names for a system: itself, or for one of a Lime market's refresh
 * groups, "lime_gb_app_birmingham_003" (limeGrid.ts), the market, "lime_gb_app_birmingham".
 */
export function listedPriceSystem(system: { id: string; limeMapTiles?: unknown }): string {
  return system.limeMapTiles ? system.id.replace(/_\d{3}$/, '') : system.id;
}

const LISTED_SYSTEMS = new Set(LISTED_PRICES.flatMap(entry => entry.systems));

/**
 * A collection's scooters with their system's listed price, where they have none: the app maps,
 * Voi's, Lime's, Dott's or Bolt's, carry no price, so their scooters get the one the operator or
 * the city publishes, as a feed's do in scooterFeeds.ts.
 */
export function withListedPricing(system: { id: string; limeMapTiles?: unknown }, vehicles: Vehicle[], now: number): Vehicle[] {
  const id = listedPriceSystem(system);
  if (!LISTED_SYSTEMS.has(id)) return vehicles;
  return vehicles.map(vehicle => {
    if (vehicle.pricing) return vehicle;
    const pricing = listedPricing(id, vehicle.lat, vehicle.lng, now);
    return pricing ? { ...vehicle, pricing } : vehicle;
  });
}
