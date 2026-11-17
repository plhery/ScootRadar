// Announced maintenance of the server behind the scooter data (Netcup, through the Cloudflare Tunnel), as the
// edge guard in front of the other sites reads it (delivery-tracker's ops/cloudflare/edge/worker.js): the same
// values, the same logic. The announcement is a JSON value in the account's MAINTENANCE KV namespace, shared by
// every site, under `all` (the server, e.g. a reboot) and the site's own key, here `scootradar`:
//
//   {"since": "2026-11-18T22:00:00Z", "backAround": "2026-11-18T22:20:00Z", "mode": "soft"}
//
// `mode` "hard" turns the requests away from the server from `since`; "soft", the default, only words the
// notice. `on: false` switches it off; one nobody switched off ends `ends`, or three hours after `backAround`.
// Without the binding, nothing is announced and the rest works (DEPLOY.md, "Maintenance").

/** The KV namespace, as far as it is read here. */
export interface MaintenanceNamespace {
  get(key: string, type: 'json'): Promise<unknown>;
}

export interface MaintenanceEnvironment {
  MAINTENANCE?: MaintenanceNamespace;
}

export interface Announcement {
  since: string | null;
  backAround: string | null;
  mode: 'hard' | 'soft';
  ends: string | null;
}

/** What `/maintenance.json` says, and the `maintenance` of a 503 while the server is down. */
export interface MaintenanceStatus {
  planned: boolean;
  mode: 'hard' | 'soft' | null;
  since: string | null;
  backAround: string | null;
}

/** ScootRadar's own key, beside `all`. */
export const MAINTENANCE_KEY = 'scootradar';
/** How long an isolate keeps the announcement it read. KV itself caches it for up to a minute. */
const ANNOUNCEMENT_TTL_MS = 30_000;
/** An announcement nobody switched off ends this long after the time it gave, so a forgotten one can't linger. */
const ANNOUNCEMENT_GRACE_MS = 3 * 60 * 60_000;

let announcement: { value: Announcement | null; readAt: number } = { value: null, readAt: -Infinity };

/** Forgets the announcement read, for tests. */
export function forgetAnnouncement() {
  announcement = { value: null, readAt: -Infinity };
}

/** The announcement in force, or null. Never throws: a KV failure means nothing is announced. */
export async function readAnnouncement(env: MaintenanceEnvironment, now = Date.now()): Promise<Announcement | null> {
  if (!env.MAINTENANCE) return null;
  if (now - announcement.readAt < ANNOUNCEMENT_TTL_MS) return current(announcement.value, now);
  let value: Announcement | null = null;
  try {
    const [all, own] = await Promise.all([env.MAINTENANCE.get('all', 'json'), env.MAINTENANCE.get(MAINTENANCE_KEY, 'json')]);
    value = pickAnnouncement([all, own], now);
  } catch {
    value = null;
  }
  announcement = { value, readAt: now };
  return current(value, now);
}

/** Of the announcements given, the one in force that ends last. */
export function pickAnnouncement(values: unknown[], now = Date.now()): Announcement | null {
  return values.map(value => current(normalize(value), now)).filter((value): value is Announcement => value !== null)
    .sort((a, b) => (Date.parse(b.backAround ?? '') || 0) - (Date.parse(a.backAround ?? '') || 0))[0] ?? null;
}

function normalize(value: unknown): Announcement | null {
  if (!value || typeof value !== 'object') return null;
  const given = value as Record<string, unknown>;
  if (given.on === false) return null;
  const time = (text: unknown) => typeof text === 'string' && !Number.isNaN(Date.parse(text)) ? new Date(text).toISOString() : null;
  return {
    since: time(given.since),
    backAround: time(given.backAround),
    // `hard` turns the server away before it is down, e.g. while its database is upgraded.
    mode: given.mode === 'hard' ? 'hard' : 'soft',
    ends: time(given.ends),
  };
}

function current(value: Announcement | null, now: number): Announcement | null {
  if (!value) return null;
  const end = value.ends ? Date.parse(value.ends) : value.backAround ? Date.parse(value.backAround) + ANNOUNCEMENT_GRACE_MS : Infinity;
  const start = value.since ? Date.parse(value.since) : -Infinity;
  // A hard switch applies from its start; a soft one only words the notice, so it applies at once.
  if (value.mode === 'hard' && now < start) return { ...value, mode: 'soft' };
  return now < end ? value : null;
}

/** What `/maintenance.json` and the 503s say: whether maintenance was announced, and until when. */
export function maintenanceStatus(found: Announcement | null): MaintenanceStatus {
  return {
    planned: Boolean(found),
    mode: found?.mode ?? null,
    since: found?.since ?? null,
    backAround: found?.backAround ?? null,
  };
}

/** `/maintenance.json`, answered by the Worker alone, whatever the server's state. */
export async function maintenanceJson(env: MaintenanceEnvironment): Promise<Response> {
  return Response.json(maintenanceStatus(await readAnnouncement(env)), { headers: {
    'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' } });
}
