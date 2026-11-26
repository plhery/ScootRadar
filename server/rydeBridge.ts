import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { haversineM } from '../src/lib/geo';
import type { WorkerSilenceCause } from './errorReporting';
import { currentCollection } from './sweeps';

export interface RydeQuery { cityId: number; latitude: number; longitude: number; radius: number }
export interface RydeJob extends RydeQuery { version: 1; id: string; expiresAt: number }
export interface RydeObservation { id: string; lat: number; lng: number }
export interface RydeResult {
  version: 1; id: string; query: RydeJob; observedAt: number; coverage: 'unknown'; scooters: RydeObservation[]; returnedCount?: number;
}
/**
 * A hold the worker put itself in, as it last said (POST /internal/ryde/status), with when the cache
 * heard it (`receivedAt`, ms on the cache's clock). `until` and `at` are epoch seconds on the Mac's clock.
 */
export interface RydeWorkerStatus { state: 'held'; reason: string; until: number | null; detail: string | null; at: number; receivedAt: number }
interface Entry { job: RydeJob; key: string; urgent: () => boolean; leasedUntil: number; owner?: object; promise: Promise<RydeResult>;
  resolve(value: RydeResult): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> }
const validNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
export function validateRydeQuery(q: RydeQuery): void {
  if (!Number.isSafeInteger(q.cityId) || q.cityId <= 0 || !validNumber(q.latitude) || Math.abs(q.latitude) > 85 ||
    !validNumber(q.longitude) || Math.abs(q.longitude) > 180 || !validNumber(q.radius) || q.radius <= 0 || q.radius > 50) {
    throw new Error('Invalid Ryde query');
  }
}
// Within what a Date can hold, so a status always makes an ISO time for Sentry.
const epochSeconds = (n: unknown): n is number => validNumber(n) && n >= 0 && n <= 8.64e12;
const STATUS_KEYS = ['version', 'state', 'reason', 'until', 'detail', 'at'];
const sameQuery = (a: RydeJob, b: RydeJob) =>
  ['version', 'id', 'expiresAt', 'cityId', 'latitude', 'longitude', 'radius'].every(k => a[k as keyof RydeJob] === b[k as keyof RydeJob]);

/**
 * How long the worker may go without asking for a job before the broker counts it gone. It asks
 * every few seconds between reads, a read takes two minutes at most, and it waits a minute at most
 * when the cache does not answer; it holds off for 15 minutes or more once Ryde refuses it.
 */
export const RYDE_WORKER_SILENT_MS = 10 * 60_000;
/**
 * The worker says it is holding itself off when it starts and about once a minute while it does: a
 * word older than this means it has stopped saying so (the Mac asleep, say), and the gauge says no hold.
 */
const RYDE_WORKER_HELD_MS = 3 * 60_000;
/**
 * How recent the worker's word must be for Sentry to give it as the cause of a silence, reported once
 * the silence has lasted RYDE_WORKER_SILENT_MS. Leasing clears the word, so any the broker holds came
 * during the silence; this leaves out one from a worker that went on to say nothing at all.
 */
const RYDE_WORKER_STATUS_RECENT_MS = 15 * 60_000;
// What each hold the worker reports means, for Sentry's title. A reason not listed is given as it is.
const HOLD_CAUSES = new Map([
  ['AppFailing', 'Ryde opened but brought no map'],
  ['RydeRefused', 'Ryde refused it'],
  ['LaunchFailed', 'Ryde could not be opened on the Mac'],
  ['DatacenterBudget', 'the datacenter pool\'s hourly budget is spent'],
  // On 26 November 2026 at 16:54 CET the kernel killed the Mac's WindowServer for a full Mach port table,
  // which ended the user's session: it keeps a port for each process the bridge launched (worker.py).
  ['WindowServerPorts', 'the Mac\'s WindowServer is close to its Mach port limit'],
  ['AbnormalExits', 'Ryde or its map helper kept exiting abnormally on the Mac'],
]);
// A person waiting on the map gets a short burst of turns, while routine scans
// retain one in four contested turns. This changes order, never request pacing.
const MAX_URGENT_TURNS = 3;

/** One account, one outstanding native read. All city collectors share this broker. */
export class RydeBroker {
  private entries: Entry[] = [];
  private completed = new Map<string, string>();
  private urgentTurns = 0;
  private nextAt = 0;
  private readonly hash: Buffer;
  private readonly startedAt: number;
  private status?: RydeWorkerStatus;
  readonly stats = { queued: 0, completed: 0, expired: 0, failed: 0, cancelled: 0, rejected: 0, lastWorkerAt: 0 };
  constructor(token: string, private readonly now = Date.now, private readonly intervalMs = 5_000,
    private readonly deadlineMs = 120_000, private readonly maxQueue = 64) {
    if (token.length < 32) throw new Error('RYDE_BRIDGE_TOKEN must have at least 32 characters');
    this.hash = createHash('sha256').update(`Bearer ${token}`).digest();
    this.startedAt = now();
  }
  private restoredSilence?: number;
  /**
   * Goes on with a silence saved before a restart, from when it began, until the worker asks: a
   * paused worker stays paused across a deploy, and counting from the restart reported its groups
   * one by one for ten minutes, then the silence again (SCOOTRADAR-CACHE-66).
   */
  restoreSilence(since: number) { if (since < this.startedAt) this.restoredSilence = since; }
  /**
   * Since when no worker has asked for a job, counting from the broker's start or a silence it
   * restored, once that has lasted RYDE_WORKER_SILENT_MS: undefined while one asks.
   */
  silentSince(now = this.now()): number | undefined {
    const since = Math.max(this.stats.lastWorkerAt, this.restoredSilence ?? this.startedAt);
    return now - since >= RYDE_WORKER_SILENT_MS ? since : undefined;
  }
  /**
   * Why the worker stopped asking for jobs, for Sentry (reportWorkerSilent): the hold it said it was
   * in within RYDE_WORKER_STATUS_RECENT_MS, or no word from the Mac (off, asleep, offline, or the worker
   * not running). On 17 November 2026 it held itself off as AppFailing from 02:33 to 20:48 CET, as macOS
   * refused to launch Ryde, and Sentry said only that it had stopped asking for jobs (SCOOTRADAR-CACHE-68).
   */
  silenceCause(now = this.now()): WorkerSilenceCause {
    const status = this.status && now - this.status.receivedAt <= RYDE_WORKER_STATUS_RECENT_MS ? this.status : undefined;
    if (!status) return { reason: 'NoWord', phrase: 'no word from the Mac', until: null, detail: null, receivedAt: null };
    return { reason: status.reason, phrase: HOLD_CAUSES.get(status.reason) ?? status.reason,
      until: status.until === null ? null : status.until * 1000, detail: status.detail, receivedAt: status.receivedAt };
  }
  query(q: RydeQuery, urgent?: boolean, owner?: object): Promise<RydeResult> {
    validateRydeQuery(q);
    const collection = currentCollection();
    // A view can become watched while its native request is already queued.
    const priority = () => urgent ?? collection?.urgent() ?? false;
    const key = JSON.stringify([q.cityId, q.latitude, q.longitude, q.radius]);
    const existing = this.entries.find(e => e.key === key);
    if (existing) {
      if (existing.owner !== owner) existing.owner = undefined;
      const previous = existing.urgent;
      existing.urgent = () => previous() || priority();
      return existing.promise;
    }
    if (this.entries.length >= this.maxQueue) return Promise.reject(new Error('Ryde queue is full'));
    let resolve!: Entry['resolve'], reject!: Entry['reject'];
    const promise = new Promise<RydeResult>((yes, no) => { resolve = yes; reject = no; });
    const job: RydeJob = { ...q, version: 1, id: randomBytes(16).toString('hex'), expiresAt: (this.now() + this.deadlineMs) / 1000 };
    const timer = setTimeout(() => this.fail(job.id, 'Ryde worker deadline exceeded',true), this.deadlineMs);
    timer.unref?.();
    this.entries.push({ job, key, urgent: priority, leasedUntil: 0, owner, promise, resolve, reject, timer });
    this.stats.queued++;
    return promise;
  }
  /** Only the sole owner can withdraw a job, and never after the app has leased it. */
  cancelQueued(q: RydeQuery, owner: object): boolean {
    const key = JSON.stringify([q.cityId, q.latitude, q.longitude, q.radius]);
    const entry = this.entries.find(e => e.key === key && e.owner === owner && e.leasedUntil === 0);
    if (!entry) return false;
    this.entries = this.entries.filter(e => e !== entry);
    clearTimeout(entry.timer);
    this.stats.cancelled++;
    entry.reject(new Error('Ryde view superseded'));
    return true;
  }
  private fail(id: string, reason: string, expired=false) {
    const entry = this.entries.find(e => e.job.id === id);
    if (!entry) return;
    this.entries = this.entries.filter(e => e !== entry); clearTimeout(entry.timer);
    if(expired)this.stats.expired++;else this.stats.failed++; entry.reject(new Error(reason));
  }
  lease(): RydeJob | null {
    const now = this.now(); this.stats.lastWorkerAt = now; this.status = undefined;
    for (const e of [...this.entries]) if (e.job.expiresAt * 1000 <= now) this.fail(e.job.id, 'Ryde job expired',true);
    const running = this.entries.find(e => e.leasedUntil > 0);
    if (running) {
      if (running.leasedUntil > now) return null;
      running.leasedUntil = now + 50_000; return running.job;
    }
    if (now < this.nextAt) return null;
    const routine = this.entries.find(e => !e.urgent());
    const entry = (routine && this.urgentTurns >= MAX_URGENT_TURNS ? routine : this.entries.find(e => e.urgent())) ?? this.entries[0];
    if (!entry) return null;
    this.urgentTurns = entry.urgent() && routine ? this.urgentTurns + 1 : 0;
    entry.leasedUntil = now + 50_000; this.nextAt = now + this.intervalMs;
    return entry.job;
  }
  accept(input: unknown): void {
    const result = input as RydeResult | null;
    if (!result || result.version !== 1 || !/^[a-f0-9]{32}$/.test(result.id)) throw new Error('Invalid Ryde result');
    // Bound to the exact submission, including after acknowledgement loss.
    const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    if (this.completed.get(result.id) === fingerprint) return;
    const entry = this.entries.find(e => e.job.id === result.id);
    if((input as {error?:unknown}).error==='worker_failed'){
      const failed=input as {id:string;query:RydeJob};
      if(!entry || !entry.leasedUntil || entry.job.expiresAt*1000<=this.now() || !failed.query || !sameQuery(entry.job,failed.query) ||
        Object.keys(failed.query).some(k=>!['version','id','expiresAt','cityId','latitude','longitude','radius'].includes(k)) ||
        Object.keys(failed).some(k=>!['version','id','query','error'].includes(k)))throw new Error('Invalid Ryde worker failure');
      this.completed.set(result.id,fingerprint);
      if(this.completed.size>256)this.completed.delete(this.completed.keys().next().value!);
      this.fail(result.id,'Ryde worker could not complete the map request');return;
    }
    if (!entry || !entry.leasedUntil || entry.job.expiresAt * 1000 <= this.now() || !result.query || !sameQuery(entry.job, result.query) ||
      !validNumber(result.observedAt) || result.observedAt * 1000 > this.now() + 5_000 ||
      result.observedAt * 1000 < entry.job.expiresAt * 1000 - this.deadlineMs || result.coverage !== 'unknown' ||
      Object.keys(result.query).some(k => !['version','id','expiresAt','cityId','latitude','longitude','radius'].includes(k)) ||
      !Array.isArray(result.scooters) || result.scooters.length > 10000 || Object.keys(result).some(k => !['version','id','query','observedAt','coverage','scooters','returnedCount'].includes(k))) {
      throw new Error('Mismatched, expired or invalid Ryde result');
    }
    if(result.returnedCount !== undefined && (!Number.isSafeInteger(result.returnedCount) || result.returnedCount<result.scooters.length || result.returnedCount>10000))throw new Error('Invalid Ryde raw count');
    const ids = new Set<string>();
    for (const row of result.scooters) {
      if (!row || !/^[a-f0-9]{32}$/.test(row.id) || ids.has(row.id) || !validNumber(row.lat) || Math.abs(row.lat) > 85 ||
        !validNumber(row.lng) || Math.abs(row.lng) > 180 || Object.keys(row).some(k => !['id','lat','lng'].includes(k)) ||
        haversineM(entry.job.latitude,entry.job.longitude,row.lat,row.lng) > entry.job.radius*1000+25) throw new Error('Invalid Ryde observation');
      ids.add(row.id);
    }
    this.entries = this.entries.filter(e => e !== entry); clearTimeout(entry.timer);
    this.completed.set(result.id, fingerprint);
    if (this.completed.size > 256) this.completed.delete(this.completed.keys().next().value!);
    this.stats.completed++; entry.resolve(result);
  }
  /**
   * The worker saying it holds itself off (POST /internal/ryde/status). It is no request for a job:
   * the silence goes on and is reported as before, with this as its cause (silenceCause).
   */
  acceptStatus(input: unknown): void {
    const status = input as Record<string, unknown> | null;
    if (!status || typeof status !== 'object' || Array.isArray(status) || status.version !== 1 || status.state !== 'held' ||
      typeof status.reason !== 'string' || !/^[A-Za-z]{1,40}$/.test(status.reason) ||
      !(status.until === undefined || status.until === null || epochSeconds(status.until)) ||
      !(status.detail === undefined || status.detail === null || typeof status.detail === 'string' && [...status.detail].length <= 300) ||
      !epochSeconds(status.at) || Object.keys(status).some(k => !STATUS_KEYS.includes(k))) throw new Error('Invalid Ryde worker status');
    this.status = { state: 'held', reason: status.reason, until: (status.until as number | null | undefined) ?? null,
      detail: (status.detail as string | null | undefined) ?? null, at: status.at, receivedAt: this.now() };
  }
  async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    response.setHeader('Cache-Control', 'private, no-store'); response.setHeader('Content-Type', 'application/json');
    if (!timingSafeEqual(this.hash, createHash('sha256').update(request.headers.authorization ?? '').digest())) {
      response.writeHead(401); response.end('{}'); return;
    }
    const path = (request.url ?? '').split('?')[0];
    if (path === '/internal/ryde/job' && request.method === 'GET') { response.end(JSON.stringify(this.lease())); return; }
    const status = path === '/internal/ryde/status';
    if ((path !== '/internal/ryde/result' && !status) || request.method !== 'POST') { response.writeHead(404); response.end('{}'); return; }
    try {
      let size = 0; const chunks: Buffer[] = [];
      for await (const chunk of request) {
        size += chunk.length;
        if (size > (status ? 4 * 1024 : 2 * 1024 * 1024)) { response.writeHead(413); response.end('{}'); return; }
        chunks.push(Buffer.from(chunk));
      }
      const body: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (status) this.acceptStatus(body); else this.accept(body);
      response.writeHead(204); response.end();
    } catch { if (!status) this.stats.rejected++; response.writeHead(400); response.end('{}'); }
  }
  metrics(): string {
    return `scootradar_ryde_bridge_jobs_total{outcome="queued"} ${this.stats.queued}\n` +
      `scootradar_ryde_bridge_jobs_total{outcome="completed"} ${this.stats.completed}\n` +
      `scootradar_ryde_bridge_jobs_total{outcome="expired"} ${this.stats.expired}\n` +
      `scootradar_ryde_bridge_jobs_total{outcome="failed"} ${this.stats.failed}\n` +
      `scootradar_ryde_bridge_jobs_total{outcome="cancelled"} ${this.stats.cancelled}\n` +
      `scootradar_ryde_bridge_results_rejected_total ${this.stats.rejected}\n` +
      `scootradar_ryde_bridge_pending_jobs ${this.entries.length}\n` +
      `scootradar_ryde_bridge_worker_last_seen_seconds ${this.stats.lastWorkerAt ? this.stats.lastWorkerAt / 1000 : 0}\n` +
      (this.status && this.now() - this.status.receivedAt < RYDE_WORKER_HELD_MS
        ? `scootradar_ryde_bridge_worker_held{reason="${this.status.reason}"} 1\n` : '');
  }
  close() { for (const e of [...this.entries]) this.fail(e.job.id, 'Ryde broker stopped'); }
}
