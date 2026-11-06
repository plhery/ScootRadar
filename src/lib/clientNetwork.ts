/**
 * The network a visitor is told apart by, for the rate limits and the cache's count of visitors: an
 * IPv4 address as it is, an IPv6 one as its /64, the network a home or a phone is given. Every address
 * of a /64 is the same host's to use, so a client changing addresses within it stays one visitor.
 * An IPv4 address written in IPv6 (::ffff:192.0.2.1) is the IPv4 address. Anything else is returned as it is.
 */
export function clientNetwork(address: string): string {
  const ip = address.trim().toLowerCase();
  if (!ip.includes(':')) return ip;
  const mapped = /^(?:0{0,4}:){0,4}:?(?:0{0,4}:)?ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(ip);
  if (mapped) return mapped[1];
  const halves = ip.split('::');
  if (halves.length > 2) return ip;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return ip;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail];
  if (groups.length !== 8 || groups.some(group => !/^[0-9a-f]{1,4}$/.test(group))) return ip;
  return `${groups.slice(0, 4).map(group => group.replace(/^0+(?=.)/, '')).join(':')}::`;
}
