/**
 * A line of the Worker secret SCOOTER_BANS read (scooterBans.ts): the network it bans and when the ban ends. It takes
 * no import, the client's network given (clientNetwork), so that the day's check (scripts/check-scrapers.mjs), which
 * Node runs without the app's paths, reads the list kept on this machine as the Worker reads it. Until 24 November
 * 2026 the check read it apart and counted in force lines the Worker skipped, a /64 written as
 * `2001:db8:1:2::/64` or an end with an offset, `2026-12-21T12:00:00+01:00`: those networks were not banned while the
 * check said they were (week review of 24 November 2026, W3).
 *
 * A network is written as an IPv4 address, or with `/32`; or as an IPv6 address, any of its /64, or with `/64`:
 * the Worker tells visitors apart by the IPv4 address and the IPv6 /64 (clientNetwork), so it can ban nothing wider
 * or narrower. Its end is a UTC date, the start of that day, or a time in ISO 8601, `Z` or with an offset:
 *
 *     203.0.113.7 2026-12-21 bare Mozilla/5.0, Mainz and Wiesbaden
 *     203.0.113.7/32 2026-12-21T12:00:00Z
 *     2001:db8:1:2:: 2026-12-21T12:00Z
 *     2001:db8:1:2::/64 2026-12-21T13:00:00+01:00
 */
export type BanLine =
  /** A ban: the network as clientNetwork gives it, and when its ban ends, in milliseconds since the epoch. */
  | { network: string; ends: number }
  /** A line written as a ban that bans nothing: a network or an end not of the forms above, or no end. */
  | { unread: true }
  /** A blank line, or a note (#). */
  | null;

const END = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
// An IPv6 /64 as clientNetwork gives it, which it does only of an address it could read.
const IPV6_NETWORK = /^([0-9a-f]{1,4}:){4}:$/;

export function readBanLine(line: string, clientNetwork: (address: string) => string): BanLine {
  const [written, end] = line.trim().split(/\s+/);
  if (!written || written.startsWith('#')) return null;
  const [address, prefix, ...rest] = written.split('/');
  const network = clientNetwork(address);
  const v4 = IPV4.exec(network);
  const read = rest.length === 0 && (v4
    ? v4.slice(1).every(octet => Number(octet) <= 255) && (prefix === undefined || (prefix === '32' && !address.includes(':')))
    : IPV6_NETWORK.test(network) && (prefix === undefined || prefix === '64'));
  if (!read || !end || !END.test(end)) return { unread: true };
  const ends = Date.parse(end.length === 10 ? `${end}T00:00:00Z` : end);
  return Number.isFinite(ends) ? { network, ends } : { unread: true };
}
