import catalog from '../../data/rental-curfews.json';
import type { RentalCurfew } from '@/lib/rentalCurfews';

/**
 * The cities that ban renting at night, from data/rental-curfews.json (194 KB with their boundaries): kept out of
 * rentalCurfews.ts, so that the map page loads them once it is up (useRuleCatalogs.ts) and the cache reads them
 * (feedCurfews.ts).
 */
export const RENTAL_CURFEWS = catalog.curfews as unknown as RentalCurfew[];
