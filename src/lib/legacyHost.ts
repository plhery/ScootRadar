import { MAP_PATH } from '@/lib/mapAddress';

const LEGACY_HOSTS = new Set(['zurich-scooter.plhery.com', 'swiss-scooters.plhery.com']);
const CANONICAL_HOST = 'scooters.plhery.com';

export function legacyHostRedirect(request: Request): Response | null {
  const source = new URL(request.url);
  // Service-worker updates must stay on their original origin. The legacy
  // worker migrates installed web apps that would otherwise keep a cached shell.
  if (
    !LEGACY_HOSTS.has(source.hostname) ||
    source.pathname.startsWith('/api/') ||
    source.pathname === '/sw.js'
  ) {
    return null;
  }

  source.hostname = CANONICAL_HOST;
  source.protocol = 'https:';
  source.port = '';
  // These hosts only ever had the map at their root.
  if (source.pathname === '/') source.pathname = MAP_PATH;
  return Response.redirect(source, 308);
}
