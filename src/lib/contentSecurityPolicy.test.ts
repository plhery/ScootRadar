import { describe, expect, it } from 'vitest';
import {
  API_CONTENT_SECURITY_POLICY,
  documentContentSecurityPolicy,
  SERVICE_WORKER_CONTENT_SECURITY_POLICY,
} from '@/lib/contentSecurityPolicy';
import { SENTRY_BROWSER_DSN } from '@/lib/errorReportsConfig';

function directive(policy: string, name: string): string {
  return policy
    .split(';')
    .map(value => value.trim())
    .find(value => value.startsWith(`${name} `)) ?? '';
}

describe('documentContentSecurityPolicy', () => {
  it('uses a strict nonce-based production script policy', () => {
    const csp = documentContentSecurityPolicy({ nonce: 'test-nonce', development: false });

    // Turnstile's host, for the map pass, counts only in browsers without 'strict-dynamic'.
    expect(directive(csp, 'script-src')).toBe(
      "script-src 'self' 'nonce-test-nonce' 'strict-dynamic' https://challenges.cloudflare.com"
    );
    expect(directive(csp, 'script-src')).not.toContain("'unsafe-inline'");
    expect(directive(csp, 'script-src')).not.toContain("'unsafe-eval'");
    expect(directive(csp, 'script-src-attr')).toBe("script-src-attr 'none'");
    expect(directive(csp, 'style-src-elem')).toBe(
      "style-src-elem 'self' 'nonce-test-nonce'"
    );
    // The app's own API, the map's vector tiles and the analytics.
    expect(directive(csp, 'connect-src')).toBe("connect-src 'self' https://tiles.openfreemap.org https://u.plhery.com");
    expect(directive(csp, 'worker-src')).toBe("worker-src 'self'");
    // The map is drawn by the page: no picture comes from another site.
    expect(directive(csp, 'img-src')).toBe("img-src 'self' data:");
    // Turnstile's frame alone, which gives the map its pass.
    expect(directive(csp, 'frame-src')).toBe('frame-src https://challenges.cloudflare.com');
    expect(directive(csp, 'base-uri')).toBe("base-uri 'none'");
    expect(csp).toContain('upgrade-insecure-requests;');
  });

  it('adds only the development capabilities required by Next.js', () => {
    const csp = documentContentSecurityPolicy({ nonce: 'dev-nonce', development: true });

    expect(directive(csp, 'script-src')).toContain("'unsafe-eval'");
    expect(directive(csp, 'script-src')).not.toContain("'unsafe-inline'");
    expect(directive(csp, 'connect-src')).toBe("connect-src 'self' https://tiles.openfreemap.org ws: wss:");
    expect(directive(csp, 'worker-src')).toBe("worker-src 'self' blob:");
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('lets the page reach Sentry only once the website has a Sentry project', () => {
    // SENTRY_BROWSER_DSN is empty until then: no Sentry host at all.
    expect(SENTRY_BROWSER_DSN).toBe('');
    expect(documentContentSecurityPolicy({ nonce: 'n', development: false })).not.toMatch(/sentry/i);

    const dsn = 'https://0123456789abcdef@o4509.ingest.de.sentry.io/4510';
    expect(directive(documentContentSecurityPolicy({ nonce: 'n', development: false, sentryDsn: dsn }), 'connect-src')).toBe(
      "connect-src 'self' https://tiles.openfreemap.org https://u.plhery.com https://o4509.ingest.de.sentry.io"
    );
    // The page sends no report while it is developed, nor to an address that is no DSN.
    expect(documentContentSecurityPolicy({ nonce: 'n', development: true, sentryDsn: dsn })).not.toMatch(/sentry/i);
    for (const notADsn of ['http://key@o1.ingest.sentry.io/2', 'https://o1.ingest.sentry.io/2', 'https://key@o1.ingest.sentry.io/', 'sentry']) {
      expect(documentContentSecurityPolicy({ nonce: 'n', development: false, sentryDsn: notADsn }), notADsn).not.toMatch(/sentry/i);
    }
  });

  it('can preserve the production policy on a local HTTP origin', () => {
    const csp = documentContentSecurityPolicy({
      nonce: 'local-production-nonce',
      development: false,
      upgradeInsecureRequests: false,
    });

    expect(directive(csp, 'script-src')).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain('upgrade-insecure-requests');
  });
});

describe('non-document policies', () => {
  it('denies all active API response content', () => {
    expect(API_CONTENT_SECURITY_POLICY).toBe(
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; sandbox;"
    );
  });

  it('allows the service worker to fetch only from its own origin', () => {
    expect(directive(SERVICE_WORKER_CONTENT_SECURITY_POLICY, 'default-src')).toBe(
      "default-src 'none'"
    );
    expect(directive(SERVICE_WORKER_CONTENT_SECURITY_POLICY, 'script-src')).toBe(
      "script-src 'self'"
    );
    expect(directive(SERVICE_WORKER_CONTENT_SECURITY_POLICY, 'connect-src')).toBe(
      "connect-src 'self'"
    );
    expect(directive(SERVICE_WORKER_CONTENT_SECURITY_POLICY, 'worker-src')).toBe(
      "worker-src 'none'"
    );
  });
});
