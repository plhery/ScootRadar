import { clientNetwork } from '@/lib/clientNetwork';
import { readBanLine } from '@/lib/scooterBanLines';
import { NOT_OURS_MESSAGE } from '@/lib/scooterClient';

/**
 * Networks refused the API for a while, as a scraper's (docs/OBSERVABILITY.md, "Scraping"): the Worker secret
 * SCOOTER_BANS, one ban a line, the network and the UTC date or time it ends, then anything said of it:
 *
 *     203.0.113.7 2026-12-21 bare Mozilla/5.0, Mainz and Wiesbaden
 *     2001:db8:1:2:: 2026-12-21T12:00:00Z
 *
 * A network is an IPv4 address or an IPv6 /64, as clientNetwork makes them out; any address of the /64 names it, and
 * `/32` and `/64` may be written. The forms read are in scooterBanLines.ts, which the day's check reads the list with
 * too. A ban ends by itself; a line that cannot be read, or a blank one, or one starting with #, bans nothing.
 * Addresses are personal data: they are kept there, never in this repository.
 */
export interface ScooterBans {
  /** When the ban of this network ends, in milliseconds since the epoch, or null when it is not banned at `now`. */
  until(network: string, now?: number): number | null;
}

export function parseScooterBans(text: string | undefined): ScooterBans {
  const bans = new Map<string, number>();
  for (const line of (text ?? '').split(/\r?\n/)) {
    const ban = readBanLine(line, clientNetwork);
    if (!ban || 'unread' in ban) continue;
    bans.set(ban.network, Math.max(ban.ends, bans.get(ban.network) ?? -Infinity));
  }
  return {
    until(network, now = Date.now()) {
      const ends = bans.get(clientNetwork(network));
      return ends !== undefined && ends > now ? ends : null;
    },
  };
}

let parsed: { text: string | undefined; bans: ScooterBans } | null = null;

/** The bans of the secret, read once for each value it takes. */
export function scooterBans(text: string | undefined): ScooterBans {
  if (!parsed || parsed.text !== text) parsed = { text, bans: parseScooterBans(text) };
  return parsed.bans;
}

/**
 * The Worker's answer to a request of the API (`/api/…`) from a banned network: 403, as to a script it refuses
 * (scooterProxy.ts), which the request cannot tell apart; null for any other. The pages are still served.
 */
export function bannedAnswer(request: Request, env: { SCOOTER_BANS?: string }, now = Date.now()): Response | null {
  if (!env.SCOOTER_BANS || !new URL(request.url).pathname.startsWith('/api/')) return null;
  const address = request.headers.get('cf-connecting-ip');
  if (!address || scooterBans(env.SCOOTER_BANS).until(address, now) === null) return null;
  return Response.json({ error: NOT_OURS_MESSAGE }, { status: 403, headers: { 'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } });
}
