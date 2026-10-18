import { NextRequest, NextResponse } from 'next/server';
import { coverageIntersects } from '@/lib/feedCoverage';
import { rateLimitAllows } from '@/lib/rateLimit';
import { discoverCollectableFeeds } from '@/lib/scooterFeeds';
import { parseScooterQuery } from '@/lib/scooterQuery';
import { fetchFeedZones } from '@/lib/zoneFeeds';
import { zoneQueryError, zoneResponse } from '@/lib/zones';

// Where the cache serves the map (worker.ts), it answers this too; here the feeds are read
// directly, as /api/scooters does without it, for development.
export async function GET(request: NextRequest) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!await rateLimitAllows(request, 'SCOOTER_API_RATE_LIMITER')) {
    return NextResponse.json({ error: 'Too many scooter requests. Please try again shortly.' },
      { status: 429, headers: { ...headers, 'Retry-After': '60' } });
  }
  const parsed = parseScooterQuery(request.nextUrl.searchParams);
  const error = parsed.ok ? zoneQueryError(parsed.zoom, parsed.query.bounds) : parsed.error;
  if (!parsed.ok || error) return NextResponse.json({ error }, { status: 400, headers });
  const { query } = parsed;
  if (query.outsideCoverage) return NextResponse.json(zoneResponse([], query.bounds, false), { headers });
  try {
    const feeds = (await discoverCollectableFeeds()).filter(feed => feed.zoneSource &&
      (!query.providers || query.providers.has(feed.provider)) && coverageIntersects(feed.coverage, query.bounds));
    const zones = await Promise.allSettled(feeds.map(feed => fetchFeedZones(feed.id, feed.provider, feed.zoneSource!)));
    return NextResponse.json(zoneResponse(zones.flatMap(result => result.status === 'fulfilled' ? result.value : []),
      query.bounds, false), { headers });
  } catch (failure) {
    console.error(JSON.stringify({ event: 'zones_api_failure', message: failure instanceof Error ? failure.message : String(failure) }));
    return NextResponse.json({ error: 'Zones are temporarily unavailable.' }, { status: 503, headers: { ...headers, 'Retry-After': '30' } });
  }
}
