/** Maximum age of individual scooter positions, measured from the source timestamp. */
export const VEHICLE_MAX_AGE_MS = 15 * 60_000;

/**
 * How old an app map's last positions may be to stand, faded, where its scooters were last seen
 * while it is collected again: its idle interval, two hours at most, and the sweep's time.
 */
export const LAST_SEEN_MAX_AGE_MS = 3 * 60 * 60_000;

/** Parking availability expires independently of scooter positions. */
export const PARKING_MAX_AGE_MS = 5 * 60_000;
