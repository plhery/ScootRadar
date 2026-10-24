import type { UpstreamAuth } from './clientCredentialsToken';

// The floor for a process that never says how many feeds it collects, such as a web worker.
const DEFAULT_MAX_ENTRIES = 2048;
/**
 * A feed reads up to nine documents: discovery, vehicle types, vehicle status, pricing plans,
 * system regions, and for parking station information, station status, geofencing zones and
 * their vehicle types.
 */
export const UPSTREAM_DOCUMENTS_PER_FEED = 9;

/** Room for every document of `feeds` feeds, with a fifth spare for URLs that change. */
export function upstreamCacheEntriesFor(feeds: number): number {
  return Math.ceil(feeds * UPSTREAM_DOCUMENTS_PER_FEED * 1.2);
}
const DEFAULT_ERROR_RETRY_SECONDS = 15;

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class UpstreamHttpError extends Error {
  /** `code`: the error an operator names in the body, as Dott's {"error":"Forbidden: ERR_REGION_OFFLINE"}. */
  constructor(readonly status: number, readonly host: string, readonly code?: string) {
    super(`GBFS request failed with HTTP ${status}${code ? ` (${code})` : ''}`);
    this.name = 'UpstreamHttpError';
  }
}

function safeUpstreamTarget(value: string): { host: string; path: string } {
  try {
    const url = new URL(value);
    return { host: url.host, path: url.pathname };
  } catch {
    return { host: 'invalid-url', path: '/' };
  }
}

/**
 * What a failed request comes down to, without its message, which may hold the URL:
 * Node's code for a network error ("fetch failed" or "terminated", whose cause
 * says ECONNRESET, UND_ERR_SOCKET, UND_ERR_CONNECT_TIMEOUT…), when it has one.
 */
function errorCode(error: unknown): { errorCode?: string } {
  const cause = error instanceof Error ? (error.cause as { code?: unknown } | undefined) : undefined;
  const code = cause?.code ?? (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && /^[A-Z][A-Z0-9_]{1,40}$/.test(code) ? { errorCode: code } : {};
}

/**
 * Whether the operator closed the connection halfway through the body. sharedmobility.ch does so
 * with Voi's Swiss vehicles on some weekday mornings: about three in four from 06:40 to 10:00
 * on 22 October 2026, with the others going through in between, so a second request at once
 * often gets the document the first lost.
 */
function cutOff(error: unknown): boolean {
  const { errorCode: code } = errorCode(error);
  return code === 'UND_ERR_SOCKET' || code === 'ECONNRESET';
}

interface CacheEntry {
  fetchedAt: number;
  freshUntil: number;
  staleUntil: number;
  retryAfter: number;
  hasValue: boolean;
  value?: unknown;
  pending?: Promise<CachedJson<unknown>>;
}

export interface CachedJson<T> {
  data: T;
  stale: boolean;
  fetchedAt: number;
}

export interface UpstreamJsonOptions {
  validate?: (value: unknown) => void;
  headers: Record<string, string>;
  /** The token of a host that wants one, sent as each request's Authorization header. */
  auth?: UpstreamAuth;
  freshSeconds: number;
  staleIfErrorSeconds: number;
  timeoutMs: number;
  /**
   * A document fetched longer ago than this is fetched again, though still fresh: a feed's
   * pricing plans when a scooter names a plan they don't list. It keeps its usual freshness after.
   */
  maxAgeSeconds?: number;
}

interface UpstreamJsonCacheOptions {
  fetcher?: Fetcher;
  maxEntries?: number;
  errorRetrySeconds?: number;
  now?: () => number;
}

export class UpstreamJsonCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly hostIntervals = new Map<string, number>();
  private readonly nextRequests = new Map<string, number>();
  private readonly fetcher: Fetcher;
  private maxEntries: number;
  private readonly errorRetryMs: number;
  private readonly now: () => number;
  /**
   * Requests sent to operators since the start, by kind: `status` documents are
   * kept for a minute or less, `metadata` for longer.
   */
  readonly requests = { status: 0, metadata: 0 };
  /** Documents dropped to make room while they could still be served. */
  evictions = 0;

  constructor(options: UpstreamJsonCacheOptions = {}) {
    this.fetcher = options.fetcher ?? ((input, init) => globalThis.fetch(input, init));
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.errorRetryMs = (options.errorRetrySeconds ?? DEFAULT_ERROR_RETRY_SECONDS) * 1000;
    this.now = options.now ?? (() => Date.now());
  }

  async fetch<T>(url: string, options: UpstreamJsonOptions): Promise<CachedJson<T>> {
    const now = this.now();
    let entry = this.entries.get(url);
    // Least recently used first out: the Map's order is the order of last use, so the
    // hourly metadata every collection reads stays while documents nobody asks for go.
    if (entry) this.touch(url, entry);

    const young = options.maxAgeSeconds === undefined || now - (entry?.fetchedAt ?? 0) < options.maxAgeSeconds * 1000;
    if (entry?.hasValue && entry.freshUntil > now && young) {
      return { data: entry.value as T, stale: false, fetchedAt: entry.fetchedAt };
    }
    if (entry?.hasValue && entry.staleUntil > now && entry.retryAfter > now) {
      return { data: entry.value as T, stale: true, fetchedAt: entry.fetchedAt };
    }
    if (entry?.pending) {
      return entry.pending as Promise<CachedJson<T>>;
    }

    this.removeExpiredEntries(now);
    entry = this.entries.get(url) ?? this.createEntry(url);

    const request = this.fetchFresh<T>(url, entry, options);
    entry.pending = request as Promise<CachedJson<unknown>>;

    try {
      return await request;
    } finally {
      if (entry.pending === request) entry.pending = undefined;
    }
  }

  /** Grows the cache to hold at least `entries` documents; it never shrinks. */
  reserve(entries: number): void {
    this.maxEntries = Math.max(this.maxEntries, Math.ceil(entries));
  }

  get size(): number { return this.entries.size; }
  get capacity(): number { return this.maxEntries; }

  /** Collector pacing prevents large country catalogs from bursting upstream quotas. */
  paceHost(hostname: string, intervalMs: number): void {
    this.hostIntervals.set(hostname, Math.max(0, intervalMs));
  }

  clear(): void {
    this.entries.clear();
    this.nextRequests.clear();
  }

  private async waitForHost(url: string): Promise<void> {
    const host = new URL(url).hostname;
    const interval = this.hostIntervals.get(host) ?? 0;
    if (!interval) return;
    const now = this.now();
    const start = Math.max(now, this.nextRequests.get(host) ?? 0);
    this.nextRequests.set(host, start + interval);
    if (start > now) await new Promise(resolve => setTimeout(resolve, start - now));
  }

  private async fetchFresh<T>(
    url: string,
    entry: CacheEntry,
    options: UpstreamJsonOptions
  ): Promise<CachedJson<T>> {
    // Whether the operator answered, and the request failed reading or checking what it sent.
    let answered = false;
    try {
      let data: T;
      // A body cut off is asked for once more at once (cutOff); a second cut falls back as any failure.
      // So is a request whose token the host refuses, with a new token; a second 401 is a failure.
      let cutRetried = false;
      let renewed = false;
      for (;;) {
        if (this.hostIntervals.size) await this.waitForHost(url);
        answered = false;
        const authorization = options.auth ? await options.auth.authorization() : undefined;
        this.requests[options.freshSeconds <= 60 ? 'status' : 'metadata']++;
        const response = await this.fetcher(url, {
          headers: authorization ? { ...options.headers, Authorization: authorization } : options.headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(options.timeoutMs),
        });
        answered = true;
        if (response.status === 401 && authorization && !renewed) {
          await response.body?.cancel();
          options.auth?.renew(authorization);
          renewed = true;
          console.warn(JSON.stringify({ event: 'upstream_token_refused', ...safeUpstreamTarget(url) }));
          continue;
        }
        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new UpstreamHttpError(response.status, new URL(url).hostname, /\bERR_[A-Z_]+\b/.exec(body)?.[0]);
        }
        try {
          data = await response.json() as T;
          break;
        } catch (error) {
          if (cutRetried || !cutOff(error)) throw error;
          cutRetried = true;
          console.warn(JSON.stringify({ event: 'upstream_body_retry', ...safeUpstreamTarget(url), ...errorCode(error) }));
        }
      }
      options.validate?.(data);
      const completedAt = this.now();
      entry.fetchedAt = completedAt;
      entry.value = data;
      entry.hasValue = true;
      entry.freshUntil = completedAt + options.freshSeconds * 1000;
      entry.staleUntil = entry.freshUntil + options.staleIfErrorSeconds * 1000;
      entry.retryAfter = 0;
      return { data, stale: false, fetchedAt: completedAt };
    } catch (error) {
      const failedAt = this.now();
      if (entry.hasValue && entry.staleUntil > failedAt) {
        entry.retryAfter = failedAt + this.errorRetryMs;
        console.warn(JSON.stringify({
          event: 'upstream_stale_fallback',
          ...safeUpstreamTarget(url),
          ...(error instanceof UpstreamHttpError
            ? { httpStatus: error.status }
            : { errorType: error instanceof Error ? error.name : 'UnknownError', ...errorCode(error),
                stage: answered ? 'body' : 'request' }),
        }));
        return { data: entry.value as T, stale: true, fetchedAt: entry.fetchedAt };
      }

      this.entries.delete(url);
      throw error;
    }
  }

  private touch(url: string, entry: CacheEntry): void {
    this.entries.delete(url);
    this.entries.set(url, entry);
  }

  private createEntry(url: string): CacheEntry {
    while (this.entries.size >= this.maxEntries) {
      const leastRecentKey = this.entries.keys().next().value;
      if (leastRecentKey === undefined) break;
      this.entries.delete(leastRecentKey);
      this.evictions++;
    }

    const entry: CacheEntry = {
      fetchedAt: 0,
      freshUntil: 0,
      staleUntil: 0,
      retryAfter: 0,
      hasValue: false,
    };
    this.entries.set(url, entry);
    return entry;
  }

  private removeExpiredEntries(now: number): void {
    for (const [key, entry] of this.entries) {
      if (!entry.pending && (!entry.hasValue || entry.staleUntil <= now)) {
        this.entries.delete(key);
      }
    }
  }
}

export const upstreamJsonCache = new UpstreamJsonCache();
