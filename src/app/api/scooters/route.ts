import { NextRequest, NextResponse } from 'next/server';
import {
  fetchScooters,
  ScooterFeedsUnavailableError,
} from '@/lib/scooterFeeds';
import { rateLimitAllows } from '@/lib/rateLimit';
import { parseScooterQuery } from '@/lib/scooterQuery';
import { scooterResponse, scooterResponseHeaders } from '@/lib/scooterResponse';
import { skippedSources } from '@/lib/scooterSources';

export async function GET(request: NextRequest) {
  if (!await rateLimitAllows(request, 'SCOOTER_API_RATE_LIMITER')) {
    return NextResponse.json(
      { error: 'Too many scooter requests. Please try again shortly.' },
      {
        status: 429,
        headers: {
          'Cache-Control': 'private, no-store',
          'Retry-After': '60',
        },
      }
    );
  }

  const parsed = parseScooterQuery(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  try {
    const result = await fetchScooters(parsed.query);
    const body = scooterResponse(result, parsed.zoom);
    return NextResponse.json(body, { headers: scooterResponseHeaders(body) });
  } catch (error) {
    if (error instanceof ScooterFeedsUnavailableError) {
      // As the cache answers: no scooters, and the failed feeds named, so the map
      // says who is not sharing data rather than that it could not refresh.
      const sources = skippedSources();
      for (const id of error.failedSources) {
        const source = id.split(':')[0];
        if (source in sources) sources[source as keyof typeof sources] = 'failed';
      }
      const body = scooterResponse({
        vehicles: [],
        meta: { partial: true, stale: false, failedSources: error.failedSources, sources },
      }, parsed.zoom);
      return NextResponse.json(body, { headers: scooterResponseHeaders(body) });
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ event: 'scooter_api_failure', message }));
    return NextResponse.json(
      { error: 'The scooter service encountered an unexpected error.' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}
