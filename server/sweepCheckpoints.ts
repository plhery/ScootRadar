import { readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Disc, NearestProgress, SweepLimits } from './nearestSweep';
import { saveAtomically } from './snapshotFile';

/**
 * How recently a sweep's checkpoint must have been saved for the next sweep of its area to resume it.
 * A deploy hands one over within about three minutes, the new cache's start hold and a reply's pace;
 * one older was left by a cache stopped long before, and the sweep starts again.
 */
export const CHECKPOINT_MAX_AGE_MS = 10 * 60_000;
/** An area's sweep under way, as saved after each of its replies: where it stood, and the scooters it had found. */
export interface SweepCheckpoint<T> extends NearestProgress { system: string; scooters: T[]; savedAt: number }

const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const savedDisc = (value: unknown): value is Disc => {
  const entry = object(value);
  return finite(entry?.lat) && finite(entry.lng) && finite(entry.r) && entry.r >= 0;
};

/**
 * Each area's sweep under way for one map (Bird's, RideMovi's), saved after each reply, from which the
 * area's next sweep goes on (sweepNearestArea's resume). A deploy stops the sweeps under way, and
 * they started again from nothing: on 9 November 2026 deploys at 23:43 and 23:57 UTC stopped
 * Scottsdale's Bird sweep of 28 requests partway twice, and it ended on the third try, 58 minutes
 * late (SCOOTRADAR-CACHE-6B). RideMovi's Köln sweep took 49 minutes on 22 November 2026, when deploys
 * came about every 40.
 *
 * They are saved among the temporary files beside the snapshot, as `tmp/<map>-sweep.<area>.tmp`, which
 * the host's backup skips (/etc/coolify-backup/excludes.txt on netcup: `*-scooter-snapshots/_data/tmp/*.tmp`,
 * whose star stops at a slash): each goes when its sweep ends, and one vanishing while restic read it
 * would fail the backup, as a temporary snapshot did on 19 October 2026 (scooter-cache.ts).
 *
 * A deploy's new cache reads an area's when it starts the area's sweep, not when it starts itself:
 * the old cache goes on sweeping, and saving, for about 90 seconds after. The reads wait out the
 * map client's start hold, as its first request does, by when the old cache has stopped and saved
 * its last.
 */
export class SweepCheckpoints<T> {
  readonly directory: string;
  private readonly map: string;
  private readonly scooter: (value: unknown) => value is T;
  private readonly readFrom: number;
  constructor(options: { map: string; scooter: (value: unknown) => value is T; directory?: string; startHoldMs?: number }) {
    this.map = options.map;
    this.scooter = options.scooter;
    this.directory = options.directory ?? join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'tmp');
    this.readFrom = Date.now() + (options.startHoldMs ?? 0);
  }

  /** Named .tmp in the folder itself, as the backup's exclusion matches (`_data/tmp/*.tmp`), not in a folder of its own. */
  path(system: string) { return join(this.directory, `${this.map}-sweep.${system}.tmp`); }

  /** The area's sweep stopped partway, if saved recently and started within the limits: none if unreadable. */
  async resumable(system: string, limits: SweepLimits): Promise<SweepCheckpoint<T> | undefined> {
    const wait = this.readFrom - Date.now();
    if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
    let saved: Record<string, unknown> | undefined;
    try { saved = object(JSON.parse(await readFile(this.path(system), 'utf8'))); } catch { return undefined; }
    const { startedAt, requests, discs, scooters, savedAt } = saved ?? {}, now = Date.now();
    if (saved?.system !== system || !finite(startedAt) || !finite(savedAt) || typeof requests !== 'number' || !Number.isInteger(requests) ||
      requests < 0 || !Array.isArray(discs) || !discs.every(savedDisc) || !Array.isArray(scooters) || !scooters.every(this.scooter)) return undefined;
    if (now - savedAt > CHECKPOINT_MAX_AGE_MS || savedAt > now || startedAt > savedAt || now - startedAt >= limits.milliseconds) return undefined;
    return { system, startedAt, requests, discs, scooters, savedAt };
  }

  /**
   * Saves the area's sweep after each reply, each save once the one before is done, until it ends, and
   * then removes it, whether the sweep succeeded or failed: a reply still under way then is not saved.
   * A save that fails is told once and the sweep goes on.
   */
  track(system: string): { save(progress: NearestProgress, scooters: T[]): void; end(): Promise<void> } {
    let saving = Promise.resolve(), ended = false, told = false;
    return {
      save: ({ startedAt, requests, discs }, scooters) => {
        if (ended) return;
        const write = (path: string) => writeFile(path, JSON.stringify({ system, startedAt, requests, discs, scooters, savedAt: Date.now() }));
        saving = saving.then(() => saveAtomically(this.path(system), this.directory, `${this.map}-sweep.${system}`, write)).catch(error => {
          if (!told) console.warn(JSON.stringify({ event: `${this.map}_checkpoint_failed`, system, error: error instanceof Error ? error.message : String(error) }));
          told = true;
        });
      },
      end: async () => {
        ended = true;
        await saving;
        await rm(this.path(system), { force: true }).catch(() => undefined);
      },
    };
  }
}
