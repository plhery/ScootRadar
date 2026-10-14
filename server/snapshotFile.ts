import { createWriteStream } from 'node:fs';
import { open } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import type { MobilitySnapshot } from '../src/lib/scooterSnapshots';

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
    for (const [index, feed] of feeds.entries()) yield `${JSON.stringify(feed)}${index < feeds.length - 1 ? ',' : ''}\n`;
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
