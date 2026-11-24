import { describe, expect, it } from 'vitest';
import { clientNetwork } from '@/lib/clientNetwork';
import { readBanLine } from '@/lib/scooterBanLines';
import { bannedAnswer, parseScooterBans, scooterBans } from '@/lib/scooterBans';
import { NOT_OURS_MESSAGE } from '@/lib/scooterClient';

const NOW = Date.parse('2026-11-21T12:00:00Z');
const BANS = [
  '# Mainz and Wiesbaden, November 2026',
  '203.0.113.7 2026-12-21 bare Mozilla/5.0',
  '2001:db8:1:2:: 2026-12-21T12:30:00Z',
  '',
  '198.51.100.1 2026-11-20 ended yesterday',
  '198.51.100.2',
  '198.51.100.3 next-month',
  'not-an-address 2026-12-21',
].join('\n');

describe('the scooter bans', () => {
  const bans = parseScooterBans(BANS);

  it('bans an IPv4 address until the start of its day, UTC', () => {
    expect(bans.until('203.0.113.7', NOW)).toBe(Date.parse('2026-12-21T00:00:00Z'));
    expect(bans.until('203.0.113.8', NOW)).toBeNull();
  });

  it('bans every address of an IPv6 /64, until the time given', () => {
    expect(bans.until('2001:db8:1:2:a:b:c:d', NOW)).toBe(Date.parse('2026-12-21T12:30:00Z'));
    expect(bans.until('2001:DB8:1:2::1', NOW)).not.toBeNull();
    expect(bans.until('2001:db8:1:3::1', NOW)).toBeNull();
  });

  it('ends a ban by itself', () => {
    expect(bans.until('203.0.113.7', Date.parse('2026-12-21T00:00:00Z'))).toBeNull();
    expect(bans.until('198.51.100.1', NOW)).toBeNull();
  });

  it('bans nothing for a comment, a line without a date, a date it cannot read or no address', () => {
    for (const address of ['198.51.100.2', '198.51.100.3', 'not-an-address', '#']) {
      expect(bans.until(address, NOW)).toBeNull();
    }
    expect(parseScooterBans(undefined).until('203.0.113.7', NOW)).toBeNull();
  });

  it('reads a network written with its prefix, and an end with an offset, as the day\'s check counts them', () => {
    // Written as the docs show it, then as CIDR, and an end with an offset: until 24 November 2026 the Worker skipped
    // the last two, which the check counted in force (week review of 24 November 2026, W3).
    const now = Date.parse('2026-11-24T12:00:00Z');
    const written = parseScooterBans(['2001:db8:1:2:: 2026-12-21', '2001:db8:5:6::/64 2026-12-21',
      '203.0.113.7 2026-12-21T12:00:00+01:00', '198.51.100.9/32 2026-12-21T12:00Z'].join('\n'));
    expect(written.until('2001:db8:1:2::99', now)).toBe(Date.parse('2026-12-21T00:00:00Z'));
    expect(written.until('2001:db8:5:6::99', now)).toBe(Date.parse('2026-12-21T00:00:00Z'));
    expect(written.until('203.0.113.7', now)).toBe(Date.parse('2026-12-21T11:00:00Z'));
    expect(written.until('198.51.100.9', now)).toBe(Date.parse('2026-12-21T12:00:00Z'));
    expect(readBanLine('2001:db8:5:6::/64 2026-12-21 a note', clientNetwork)).toEqual({ network: '2001:db8:5:6::', ends: Date.parse('2026-12-21T00:00:00Z') });
  });

  it('bans nothing for a network it cannot ban as written, and tells the check so', () => {
    // Wider or narrower than an IPv4 address or an IPv6 /64, the prefix of the other kind, no address, or an end
    // Date.parse would not read as ISO 8601.
    const lines = ['2001:db8:1::/48 2026-12-21', '2001:db8:1:2::1/128 2026-12-21', '203.0.113.0/24 2026-12-21',
      '203.0.113.7/64 2026-12-21', '2001:db8:1:2::/32 2026-12-21', '999.0.113.7 2026-12-21', '/64 2026-12-21',
      '2001:db8:1:2::/64/64 2026-12-21', '203.0.113.7 2026-12-21T12:00:00+0100', '203.0.113.7 21.12.2026', '203.0.113.7'];
    for (const line of lines) expect(readBanLine(line, clientNetwork)).toEqual({ unread: true });
    const bans = parseScooterBans(lines.join('\n'));
    for (const address of ['2001:db8:1::1', '2001:db8:1:2::1', '203.0.113.7', '203.0.113.9']) expect(bans.until(address, NOW)).toBeNull();
    expect([readBanLine('', clientNetwork), readBanLine('  # 203.0.113.7 2026-12-21', clientNetwork)]).toEqual([null, null]);
  });

  it('keeps the latest end of a network named twice', () => {
    const twice = parseScooterBans('203.0.113.7 2026-12-21\r\n203.0.113.7 2026-11-30');
    expect(twice.until('203.0.113.7', NOW)).toBe(Date.parse('2026-12-21T00:00:00Z'));
  });

  it('reads the secret again only when it changes', () => {
    expect(scooterBans(BANS)).toBe(scooterBans(BANS));
    expect(scooterBans('203.0.113.9 2026-12-21').until('203.0.113.7', NOW)).toBeNull();
  });
});

describe("the Worker's answer to a banned network", () => {
  const env = { SCOOTER_BANS: BANS };
  const request = (path: string, address?: string) => new Request(`https://scootradar.com${path}`,
    { headers: address ? { 'cf-connecting-ip': address } : {} });

  it('refuses it the API, 403, not stored', async () => {
    for (const path of ['/api/scooters?bbox=8,47,9,48', '/api/zones/zurich', '/api/geocode', '/api/pass']) {
      const answer = bannedAnswer(request(path, '2001:db8:1:2::99'), env, NOW);
      expect(answer?.status).toBe(403);
      expect(answer?.headers.get('Cache-Control')).toBe('private, no-store');
      expect(await answer?.json()).toEqual({ error: NOT_OURS_MESSAGE });
    }
  });

  it('serves it the pages, and serves anyone else, or anyone once the ban is over', () => {
    expect(bannedAnswer(request('/map', '203.0.113.7'), env, NOW)).toBeNull();
    expect(bannedAnswer(request('/api/scooters', '203.0.113.8'), env, NOW)).toBeNull();
    expect(bannedAnswer(request('/api/scooters'), env, NOW)).toBeNull();
    expect(bannedAnswer(request('/api/scooters', '203.0.113.7'), {}, NOW)).toBeNull();
    expect(bannedAnswer(request('/api/scooters', '203.0.113.7'), env, Date.parse('2026-12-21T00:00:00Z'))).toBeNull();
  });
});
