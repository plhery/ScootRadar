import { MAP_PATH } from '@/lib/mapAddress';
import { SITE_URL } from '@/lib/site';

const CANONICAL_HOST = new URL(SITE_URL).hostname;
// The addresses the app had before, where web apps were installed and native
// ones still call the API.
const LEGACY_HOSTS = new Set(['zurich-scooter.plhery.com', 'swiss-scooters.plhery.com', 'scooters.plhery.com']);
// These only ever had the map at their root.
const MAP_AT_ROOT = new Set(['zurich-scooter.plhery.com', 'swiss-scooters.plhery.com']);
// Another name for the site, with nothing of its own.
const ALIAS_HOSTS = new Set([`www.${CANONICAL_HOST}`]);

type EdgeRequest = Request & { cf?: { tlsVersion?: string } };

// Cloudflare says a request came over plain HTTP with an empty TLS version. The
// URL alone cannot tell: the local preview presents its requests as
// http://scootradar.com, and gives them a TLS version.
function plainHttp(request: EdgeRequest): boolean {
  return request.cf?.tlsVersion === '';
}

export function legacyHostRedirect(request: EdgeRequest): Response | null {
  const source = new URL(request.url);
  const { hostname } = source;
  if (LEGACY_HOSTS.has(hostname)) {
    // Service-worker updates must stay on their original origin. The legacy
    // worker migrates installed web apps that would otherwise keep a cached shell.
    if (source.pathname.startsWith('/api/') || source.pathname === '/sw.js') return null;
  } else if (!ALIAS_HOSTS.has(hostname) && !(hostname === CANONICAL_HOST && plainHttp(request))) {
    return null;
  }

  source.hostname = CANONICAL_HOST;
  source.protocol = 'https:';
  source.port = '';
  if (MAP_AT_ROOT.has(hostname) && source.pathname === '/') source.pathname = MAP_PATH;
  return Response.redirect(source, 308);
}
