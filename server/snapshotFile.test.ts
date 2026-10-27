import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FeedSnapshot, MobilitySnapshot } from '../src/lib/scooterSnapshots';
import type { FeedStateEntry } from './feedStateLog';
import { FEED_STATES_MAX_AGE_MS, readFeedStates, readSnapshot, writeFeedStates, writeSnapshot } from './snapshotFile';

const feed = (id: string, name = 'Lyon'): FeedSnapshot => ({
  id, source: 'france', provider: 'dott', coverage: [{ south: 45.7, west: 4.8, north: 45.8, east: 4.9 }],
  vehicles: [{ provider: 'dott', lat: 45.76, lng: 4.85, battery: 80, range_m: 20_000, vehicle_id: `${id}:1`, deep_link: null,
    rental_uris: { ios: 'https://go.ridedott.com/vehicles/1?platform=ios', android: null, web: null }, distance_m: null }],
  parking: { locations: [{ id: 'p1', provider: 'dott', name, lat: 45.76, lng: 4.85, mandatory: false }], stale: false } as FeedSnapshot['parking'],
  observedAt: 1_000, attemptedAt: 2_000, collectedAt: 2_000, stale: false, failed: false, skipped: false,
});
const snapshot = (feeds: FeedSnapshot[]): MobilitySnapshot => ({ version: 1, updatedAt: 3_000, feeds,
  overview: { generatedAt: 3_000, feedIds: feeds.map(({ id }) => id),
    cities: [{ id: 'ua:Київ', city: 'Київ', lat: 50.45, lng: 30.52, batteries: { dott: [1, 2] }, sources: {}, failedSources: [] }] },
} as unknown as MobilitySnapshot);

let directory: string;
beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'scootradar-snapshot-')); });
afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

describe('the saved snapshot', () => {
  it('is written a feed to a line and read back as it was', async () => {
    const path = join(directory, 'scooters.json');
    // A line break or a name outside Latin-1 inside a feed stays inside its line.
    const saved = snapshot([feed('fr:a'), feed('fr:b', 'Rue de la\nRépublique'), feed('ua:c', 'Хрещатик')]);
    await writeSnapshot(path, saved);
    const text = await readFile(path, 'utf8');
    expect(text.split('\n')).toHaveLength(6);
    expect(text.split('\n')[1]).toBe(`${JSON.stringify(saved.feeds[0])},`);
    expect(await readSnapshot(path)).toEqual(saved);
  });

  it('leaves out a sweep under way, which a restart ends', async () => {
    const path = join(directory, 'scooters.json');
    const sweeping = { ...feed('fr:a'), sweep: { startedAt: 2_500, vehicles: [], swept: [] } };
    await writeSnapshot(path, snapshot([sweeping]));
    expect(await readSnapshot(path)).toEqual(snapshot([feed('fr:a')]));
  });

  it('stays one JSON document, which the versions before this one read whole', async () => {
    const path = join(directory, 'scooters.json');
    const saved = snapshot([feed('fr:a'), feed('fr:b')]);
    await writeSnapshot(path, saved);
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(saved);
    await writeSnapshot(path, snapshot([]));
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(snapshot([]));
    expect(await readSnapshot(path)).toEqual(snapshot([]));
  });

  it('is read when an earlier version saved it whole', async () => {
    const path = join(directory, 'scooters.json');
    const saved = snapshot([feed('fr:a'), feed('fr:b')]);
    await writeFile(path, JSON.stringify(saved));
    expect(await readSnapshot(path)).toEqual(saved);
  });

  it('is left to be replaced when of another version, and refused when cut short or not JSON', async () => {
    const path = join(directory, 'scooters.json');
    await writeFile(path, JSON.stringify({ ...snapshot([]), version: 2 }));
    expect(await readSnapshot(path)).toBeNull();
    await writeSnapshot(path, snapshot([feed('fr:a'), feed('fr:b')]));
    const lines = (await readFile(path, 'utf8')).split('\n');
    await writeFile(path, lines.slice(0, 2).join('\n'));
    await expect(readSnapshot(path)).rejects.toThrow('cut short');
    await writeFile(path, `${lines.slice(0, 2).join('\n')}\n{"id":`);
    await expect(readSnapshot(path)).rejects.toThrow(SyntaxError);
    await writeFile(path, `${lines.join('\n')}{}\n`);
    await expect(readSnapshot(path)).rejects.toThrow('continues after its end');
    await expect(readSnapshot(join(directory, 'missing.json'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('fails when the file cannot be written', async () => {
    await expect(writeSnapshot(join(directory, 'missing', 'scooters.json'), snapshot([feed('fr:a')])))
      .rejects.toMatchObject({ code: 'ENOENT' });
  });
});

describe('the saved feed states', () => {
  const now = 1_800_000_000_000;
  const states = {
    'norway:dott_no_trondheim': { state: 'expired', since: now - 3600_000, change: { event: 'snapshot_feed_state',
      feed: 'norway:dott_no_trondheim', state: 'expired', previous: 'ok', secondsInPrevious: 900, observationAgeSeconds: 960,
      attemptAgeSeconds: 0 } },
    'national:dott_zurich': { state: 'ok', since: now - 60_000 },
    'sweden:qick_se_orebro': { state: 'warming', since: now - 30_000 },
  } satisfies Record<string, FeedStateEntry>;

  it('are read back as they were, with their age', async () => {
    const path = join(directory, 'feed-states.json');
    await writeFeedStates(path, states, now - 90_000);
    expect(await readFeedStates(path, now)).toEqual({ ageMs: 90_000, feeds: states });
  });

  it('are not restored once 10 minutes old, as after an outage', async () => {
    const path = join(directory, 'feed-states.json');
    await writeFeedStates(path, states, now - FEED_STATES_MAX_AGE_MS);
    expect(await readFeedStates(path, now)).toEqual({ ageMs: FEED_STATES_MAX_AGE_MS, feeds: {} });
  });

  it('are refused when missing, cut short or not JSON, left when of another version, and keep only entries of their shape', async () => {
    const path = join(directory, 'feed-states.json');
    await expect(readFeedStates(path, now)).rejects.toMatchObject({ code: 'ENOENT' });
    await writeFeedStates(path, states, now);
    await writeFile(path, (await readFile(path, 'utf8')).slice(0, 60));
    await expect(readFeedStates(path, now)).rejects.toThrow(SyntaxError);
    await writeFile(path, 'not JSON');
    await expect(readFeedStates(path, now)).rejects.toThrow(SyntaxError);
    await writeFile(path, JSON.stringify({ version: 2, savedAt: now, feeds: states }));
    expect(await readFeedStates(path, now)).toBeNull();
    await writeFile(path, JSON.stringify({ version: 1, feeds: states }));
    expect(await readFeedStates(path, now)).toBeNull();
    await writeFile(path, JSON.stringify({ version: 1, savedAt: now, feeds: { ...states, 'fr:a': { state: 'lost', since: now },
      'fr:b': { state: 'ok' }, 'fr:c': { state: 'expired', since: now, change: 'expired' }, 'fr:d': null } }));
    expect(await readFeedStates(path, now)).toEqual({ ageMs: 0, feeds: states });
  });
});
