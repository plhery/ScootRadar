// Announced maintenance of the server behind the scooter data (Netcup, through the Cloudflare Tunnel), as the
// edge guard in front of the other sites reads it (delivery-tracker's ops/cloudflare/edge/worker.js): the same
// values, and of those in force the one that ends last, hard if any is. Unlike there, a key that cannot be read
// leaves the other's announcement in force, where the guard then reads none. The announcement is a JSON value in the
// account's MAINTENANCE KV namespace, shared by every site, under `all` (the server, e.g. a reboot) and the site's
// own key, here `scootradar`:
//
//   {"since": "2026-11-18T22:00:00Z", "backAround": "2026-11-18T22:20:00Z", "mode": "soft"}
//
// `mode` "hard" turns the requests away from the server from `since`; "soft", the default, only words the
// notice. `on: false` switches it off; one nobody switched off ends `ends`, or three hours after `backAround`, and
// one with neither stays until switched off, as the edge guard's does: it gives no time to count from, `since` being
// when the work starts, not how long it lasts.
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
/**
 * An announcement nobody switched off ends this long after the `backAround` it gave, so a forgotten one can't linger
 * past it. One that gave neither `backAround` nor `ends` has no end but `on: false` (current), as the edge guard's: the
 * comment said until 24 November 2026 that none could linger (week review of 24 November 2026).
 */
const ANNOUNCEMENT_GRACE_MS = 3 * 60 * 60_000;

let announcement: { values: unknown[]; readAt: number } = { values: [], readAt: -Infinity };

/** Forgets the announcement read, for tests. */
export function forgetAnnouncement() {
  announcement = { values: [], readAt: -Infinity };
}

/** The announcement in force, or null. Never throws: a KV failure means nothing is announced. */
export async function readAnnouncement(env: MaintenanceEnvironment, now = Date.now()): Promise<Announcement | null> {
  if (!env.MAINTENANCE) return null;
  if (now - announcement.readAt >= ANNOUNCEMENT_TTL_MS) {
    const namespace = env.MAINTENANCE;
    const reads = await Promise.allSettled(['all', MAINTENANCE_KEY].map(async key => namespace.get(key, 'json')));
    const values = reads.map(read => read.status === 'fulfilled' ? read.value : null);
    announcement = { values, readAt: now };
  }
  return pickAnnouncement(announcement.values, now);
}

/** Of the announcements given, the one in force that ends last. */
export function pickAnnouncement(values: unknown[], now = Date.now()): Announcement | null {
  const applicable = values.map(value => current(normalize(value), now)).filter((value): value is Announcement => value !== null)
    .sort((a, b) => (Date.parse(b.backAround ?? '') || 0) - (Date.parse(a.backAround ?? '') || 0));
  const latest = applicable[0];
  return latest ? { ...latest, mode: applicable.some(value => value.mode === 'hard') ? 'hard' : 'soft' } : null;
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
