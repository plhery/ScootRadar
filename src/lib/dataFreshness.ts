/** Maximum age of individual scooter positions, measured from the source timestamp. */
export const VEHICLE_MAX_AGE_MS = 15 * 60_000;

/**
 * How old a slow feed's last positions may be to stand, faded, where its scooters were last seen
 * while it is collected again: an app map's idle interval, two hours, and the sweep's time. The
 * cache gives a feed collected less often its own (lastSeenMaxAgeMs in server/scooter-cache.ts):
 * Lime's, swept every three days where nobody looks, three days.
 */
export const LAST_SEEN_MAX_AGE_MS = 3 * 60 * 60_000;

/** Parking availability expires independently of scooter positions. */
export const PARKING_MAX_AGE_MS = 5 * 60_000;
