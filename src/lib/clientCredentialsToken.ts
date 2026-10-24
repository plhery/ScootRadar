type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/** What a host that wants a token gets in each request's Authorization header (UpstreamJsonCache). */
export interface UpstreamAuth {
  authorization(): Promise<string>;
  /** Forgets `rejected`, a header the host answered 401 to, so the next request gets a new token. */
  renew(rejected: string): void;
}

/** A token that could not be had; its message names the status, never the credential or the reply. */
export class UpstreamTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpstreamTokenError';
  }
}

interface ClientCredentialsOptions {
  tokenUrl: string;
  /** Read at each request for a token, so a client set after start (or missing) is seen. */
  credentials: () => { clientId?: string; clientSecret?: string };
  fetcher?: Fetcher;
  now?: () => number;
  /** A token this close to its expiry is renewed before use. */
  renewBeforeSeconds?: number;
  timeoutMs?: number;
}

/**
 * An OAuth 2.0 client credentials token, kept in memory for every request to its host and renewed
 * shortly before it expires, or at once when the host refuses it. Requests that need one while
 * it is being renewed wait for the same renewal.
 */
export class ClientCredentialsToken implements UpstreamAuth {
  private token?: { header: string; expiresAt: number };
  private pending?: Promise<string>;
  private readonly fetcher: Fetcher;
  private readonly now: () => number;
  /** Tokens received since the start. */
  issued = 0;

  constructor(private readonly options: ClientCredentialsOptions) {
    this.fetcher = options.fetcher ?? ((input, init) => globalThis.fetch(input, init));
    this.now = options.now ?? (() => Date.now());
  }

  authorization(): Promise<string> {
    const renewBeforeMs = (this.options.renewBeforeSeconds ?? 120) * 1000;
    if (this.token && this.now() < this.token.expiresAt - renewBeforeMs) return Promise.resolve(this.token.header);
    this.pending ??= this.request().finally(() => { this.pending = undefined; });
    return this.pending;
  }

  renew(rejected: string): void {
    if (this.token?.header === rejected) this.token = undefined;
  }

  private async request(): Promise<string> {
    const { clientId, clientSecret } = this.options.credentials();
    const host = new URL(this.options.tokenUrl).host;
    if (!clientId || !clientSecret) throw new UpstreamTokenError(`No client credentials for ${host}`);
    const requestedAt = this.now();
    const response = await this.fetcher(this.options.tokenUrl, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'scootradar/2.0 (scootradar.com)' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
      cache: 'no-store',
      signal: AbortSignal.timeout(this.options.timeoutMs ?? 15_000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new UpstreamTokenError(`Token request to ${host} failed with HTTP ${response.status}`);
    }
    const body = await response.json().catch(() => undefined) as { access_token?: unknown; expires_in?: unknown } | undefined;
    if (typeof body?.access_token !== 'string' || !body.access_token) {
      throw new UpstreamTokenError(`Token reply from ${host} holds no access token`);
    }
    // Without a lifetime, the token is used five minutes and then renewed.
    const lifetime = typeof body.expires_in === 'number' && body.expires_in > 0 ? body.expires_in : 300;
    this.token = { header: `Bearer ${body.access_token}`, expiresAt: requestedAt + lifetime * 1000 };
    this.issued++;
    return this.token.header;
  }
}
