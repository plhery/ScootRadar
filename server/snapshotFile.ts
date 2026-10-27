import { createWriteStream } from 'node:fs';
import { open, readFile, writeFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import type { MobilitySnapshot } from '../src/lib/scooterSnapshots';
import type { FeedStateEntry } from './feedStateLog';

// The snapshot is saved as one JSON document, so that any version of the cache can read it, but
// written a feed at a time, one feed to a line, and read back the same way:
//
//   {"version":1,"updatedAt":…,"overview":{…},"feeds":[
//   {…the first feed…},
//   {…the last feed…}
//   ]}
//
// Saved whole, a snapshot of 150,000 vehicles is a string of some 70 million characters,
// twice that in bytes, as one name outside Latin-1 (Київ) makes all of it two-byte, then a
// buffer as long again; read back whole, the same again before it is parsed. A feed at a time,
// the most the cache holds besides the snapshot is the largest feed.

const FEEDS_START = ',"feeds":[';
const FEEDS_END = ']}';

function isSnapshot(value: unknown): value is MobilitySnapshot {
  const snapshot = value as MobilitySnapshot | null;
  return snapshot?.version === 1 && Array.isArray(snapshot.feeds) && Array.isArray(snapshot.overview?.cities);
}

/** Writes the snapshot to the path, a feed at a time. */
export async function writeSnapshot(path: string, snapshot: MobilitySnapshot): Promise<void> {
  const { feeds, ...rest } = snapshot;
  // Each line is written once the file has taken the one before.
  await pipeline(function* lines() {
    // JSON.stringify never writes a line break of its own: one inside a name is written \n.
    yield `${JSON.stringify(rest).slice(0, -1)}${FEEDS_START}\n`;
    // A sweep under way is not kept: a restart ends it.
    for (const [index, feed] of feeds.entries()) {
      yield `${JSON.stringify(feed.sweep ? { ...feed, sweep: undefined } : feed)}${index < feeds.length - 1 ? ',' : ''}\n`;
    }
    yield `${FEEDS_END}\n`;
  }, createWriteStream(path));
}

/**
 * Reads a snapshot writeSnapshot wrote, a feed at a time, or one saved whole by an earlier
 * version: null if it is of another version, which the cache leaves to be replaced. Rejects a
 * file cut short or not JSON.
 */
export async function readSnapshot(path: string): Promise<MobilitySnapshot | null> {
  const file = await open(path);
  let head: Omit<MobilitySnapshot, 'feeds'> | undefined;
  let whole: unknown;
  const feeds: MobilitySnapshot['feeds'] = [];
  let ended = false;
  try {
    for await (const line of file.readLines({ encoding: 'utf8' })) {
      if (ended || whole !== undefined) {
        if (line) throw new Error('Snapshot file continues after its end');
      } else if (!head) {
        if (line.endsWith(FEEDS_START)) head = JSON.parse(`${line.slice(0, -FEEDS_START.length)}}`);
        // Saved whole, by a version before this one.
        else whole = JSON.parse(line);
      } else if (line === FEEDS_END) {
        ended = true;
      } else {
        feeds.push(JSON.parse(line.endsWith(',') ? line.slice(0, -1) : line));
      }
    }
  } finally {
    await file.close().catch(() => {});
  }
  if (whole !== undefined) return isSnapshot(whole) ? whole : null;
  if (!head || !ended) throw new Error('Snapshot file is cut short');
  const snapshot = { ...head, feeds };
  return isSnapshot(snapshot) ? snapshot : null;
}

// The feed states (createFeedStateLog) are saved beside the snapshot, with it, as one JSON document
// small enough to write whole:
//
//   {"version":1,"savedAt":…,"feeds":{"norway:dott_no_trondheim":{"state":"expired","since":…,"change":{…}},…}}

/**
 * How soon after they were saved the feed states are restored: a deploy stops the cache for a
 * minute or two, and they are saved every minute and on shutdown. A feed collected on time expires
 * ten minutes or more after its next collection is due (30 minutes after the last for one collected
 * every 20), so a shorter outage expires none on its own. After a longer one, feeds that were ok
 * would expire for the outage alone, and Sentry would hear of each not collected again within
 * minutes of the restart: the cache starts as it did before it restored them, each feed's first
 * state its baseline.
 */
export const FEED_STATES_MAX_AGE_MS = 10 * 60_000;

const FEED_STATES = new Set(['ok', 'failing', 'expired', 'warming']);

function isFeedStateEntry(value: unknown): value is FeedStateEntry {
  const entry = value as Partial<FeedStateEntry> | null;
  return typeof entry?.state === 'string' && FEED_STATES.has(entry.state) && Number.isFinite(entry.since) &&
    (entry.change === undefined || entry.change?.event === 'snapshot_feed_state');
}

/** Writes the feed states, saved at `savedAt`, to the path. */
export async function writeFeedStates(path: string, feeds: Readonly<Record<string, FeedStateEntry>>, savedAt: number): Promise<void> {
  await writeFile(path, `${JSON.stringify({ version: 1, savedAt, feeds })}\n`);
}

/**
 * Reads the feed states writeFeedStates wrote, with how long before `now`: none if saved
 * FEED_STATES_MAX_AGE_MS or more before, and null if of another version. An entry of another shape
 * is left out. Rejects a file cut short or not JSON.
 */
export async function readFeedStates(path: string, now: number): Promise<{ ageMs: number; feeds: Record<string, FeedStateEntry> } | null> {
  const saved = JSON.parse(await readFile(path, 'utf8')) as { version?: unknown; savedAt?: unknown; feeds?: unknown } | null;
  if (saved?.version !== 1 || typeof saved.savedAt !== 'number' || !saved.feeds || typeof saved.feeds !== 'object') return null;
  const ageMs = now - saved.savedAt;
  return { ageMs, feeds: ageMs < FEED_STATES_MAX_AGE_MS
    ? Object.fromEntries(Object.entries(saved.feeds).filter(([, entry]) => isFeedStateEntry(entry))) : {} };
}
