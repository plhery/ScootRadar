import { beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetAnnouncement, maintenanceJson, maintenanceStatus, pickAnnouncement, readAnnouncement } from './maintenance';

const NOW = Date.parse('2026-11-18T22:05:00Z');
const namespace = (values: Record<string, unknown>) => ({ get: vi.fn(async (key: string) => values[key] ?? null) });

beforeEach(() => forgetAnnouncement());

describe('announced maintenance', () => {
  it('announces nothing without the namespace', async () => {
    expect(await readAnnouncement({}, NOW)).toBeNull();
    expect(maintenanceStatus(null)).toEqual({ planned: false, mode: null, since: null, backAround: null });
  });

  it('reads the server’s key and ScootRadar’s, and takes the one that ends last', async () => {
    const kv = namespace({ all: { backAround: '2026-11-18T22:20:00Z' }, scootradar: { backAround: '2026-11-18T23:00:00+01:00', mode: 'hard' } });
    expect(await readAnnouncement({ MAINTENANCE: kv }, NOW)).toEqual({ since: null, backAround: '2026-11-18T22:20:00.000Z', mode: 'soft', ends: null });
    expect(kv.get.mock.calls).toEqual([['all', 'json'], ['scootradar', 'json']]);
    expect(pickAnnouncement([{ backAround: '2026-11-18T22:20:00Z' }, { backAround: '2026-11-18T22:30:00Z', mode: 'hard' }], NOW))
      .toMatchObject({ backAround: '2026-11-18T22:30:00.000Z', mode: 'hard' });
  });

  it('keeps what it read for half a minute', async () => {
    const kv = namespace({ all: { backAround: '2026-11-18T22:20:00Z' } });
    await readAnnouncement({ MAINTENANCE: kv }, NOW);
    kv.get.mockResolvedValue({ on: false });
    expect(await readAnnouncement({ MAINTENANCE: kv }, NOW + 29_000)).not.toBeNull();
    expect(await readAnnouncement({ MAINTENANCE: kv }, NOW + 30_000)).toBeNull();
    expect(kv.get).toHaveBeenCalledTimes(4);
  });

  it('ignores what is switched off, not an object, or over', () => {
    expect(pickAnnouncement([{ on: false, backAround: '2026-11-18T22:20:00Z' }, 'soon', null, 3], NOW)).toBeNull();
    // Three hours after the time it gave, unless it says when it ends.
    expect(pickAnnouncement([{ backAround: '2026-11-18T19:05:01Z' }], NOW)).not.toBeNull();
    expect(pickAnnouncement([{ backAround: '2026-11-18T19:05:00Z' }], NOW)).toBeNull();
    expect(pickAnnouncement([{ backAround: '2026-11-18T19:00:00Z', ends: '2026-11-18T22:06:00Z' }], NOW)).not.toBeNull();
    // Without a time, until switched off; an unreadable time is none.
    expect(pickAnnouncement([{ backAround: 'later' }], NOW)).toEqual({ since: null, backAround: null, mode: 'soft', ends: null });
  });

  it('turns a hard switch on only from its start', () => {
    const hard = { since: '2026-11-18T22:10:00Z', backAround: '2026-11-18T22:30:00Z', mode: 'hard' };
    expect(pickAnnouncement([hard], NOW)?.mode).toBe('soft');
    expect(pickAnnouncement([hard], Date.parse('2026-11-18T22:10:00Z'))?.mode).toBe('hard');
  });

  it('announces nothing when the namespace fails', async () => {
    const kv = { get: vi.fn(async () => { throw new Error('KV unavailable'); }) };
    expect(await readAnnouncement({ MAINTENANCE: kv }, NOW)).toBeNull();
  });

  it('answers /maintenance.json for anyone, never kept', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const response = await maintenanceJson({ MAINTENANCE: namespace({ all: { since: '2026-11-18T22:00:00Z', backAround: '2026-11-18T22:20:00Z' } }) });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(await response.json()).toEqual({ planned: true, mode: 'soft', since: '2026-11-18T22:00:00.000Z', backAround: '2026-11-18T22:20:00.000Z' });
    forgetAnnouncement();
    expect(await (await maintenanceJson({})).json()).toEqual({ planned: false, mode: null, since: null, backAround: null });
  });
});
