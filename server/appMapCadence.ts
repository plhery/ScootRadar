/**
 * How often an app map with long sweeps (Alpaca, BinBin, GCOO, ATOM, Whoosh, Skyss's), or DART's, a whole fleet in
 * one read, is collected while nobody looks at it; Lime's many markets are every three days (LIME_IDLE_INTERVAL_MS). While a request
 * has a slow one collected again, its last positions stand faded where its scooters were last seen
 * (showsLastSeen), and its sweep starts where the map looks, so a long interval leaves no empty
 * map, and it spares the operator's servers.
 */
export const APP_MAP_IDLE_INTERVAL_MS = 2 * 60 * 60_000;
