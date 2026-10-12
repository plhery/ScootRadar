import { describe, expect, it } from 'vitest';
import { decodePolyline6, parseValhallaWalk, valhallaWalkRequest } from '@/lib/valhalla';

// Encoded with the Google polyline algorithm at six decimals.
const GOOGLE_EXAMPLE = '_izlhA~rlgdF_{geC~ywl@_kwzCn`{nI';
const ZURICH_LEG = 'g_tjyAg_jhOo}@??w|A';
const ZURICH_LEG_POINTS = [[47.3769, 8.5417], [47.3779, 8.5417], [47.3779, 8.5432]];
const NEXT_LEG = 'w}ujyA_}lhO_q@_q@';
const NEXT_LEG_POINTS = [[47.3779, 8.5432], [47.3787, 8.544]];
// One point at a latitude of 95.
const OFF_THE_EARTH = '_{ietD_qxeO';

const trip = (legs: unknown[], summary: Record<string, unknown> = { length: 0.3456 }) => ({ trip: { summary, legs } });

describe('decodePolyline6', () => {
  it('decodes the points of the Google example at six decimals', () => {
    expect(decodePolyline6(GOOGLE_EXAMPLE)).toEqual([[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]);
  });

  it('decodes a way through Zürich', () => {
    expect(decodePolyline6(ZURICH_LEG)).toEqual(ZURICH_LEG_POINTS);
    expect(decodePolyline6('')).toEqual([]);
  });

  it('refuses a line cut short', () => {
    expect(() => decodePolyline6(ZURICH_LEG.slice(0, 7))).toThrow('Truncated polyline');
    expect(() => decodePolyline6(ZURICH_LEG.slice(0, 5))).toThrow('Truncated polyline');
  });
});

describe('valhallaWalkRequest', () => {
  it('asks for a walk without ferries and without directions, latitude first', () => {
    expect(valhallaWalkRequest([47.3779, 8.5403], [47.3667, 8.545])).toEqual({
      locations: [{ lat: 47.3779, lon: 8.5403 }, { lat: 47.3667, lon: 8.545 }],
      costing: 'pedestrian',
      costing_options: { pedestrian: { use_ferry: 0 } },
      directions_type: 'none',
      units: 'kilometers',
    });
  });
});

describe('parseValhallaWalk', () => {
  it('joins the legs of the way and gives its length in metres', () => {
    expect(parseValhallaWalk(trip([{ shape: ZURICH_LEG }, { shape: NEXT_LEG }]))).toEqual({
      path: [...ZURICH_LEG_POINTS, ...NEXT_LEG_POINTS],
      distanceM: 346,
    });
  });

  it('turns down a way that takes a ferry', () => {
    expect(parseValhallaWalk(trip([{ shape: ZURICH_LEG }], { length: 2.4, has_ferry: true }))).toBe('no_route');
    expect(parseValhallaWalk(trip([{ shape: ZURICH_LEG }], { length: 2.4, has_ferry: false }))).toMatchObject({ distanceM: 2400 });
  });

  it.each([154, 170, 171, 442, 443])('says there is no way on foot for error %i', errorCode => {
    expect(parseValhallaWalk({ error_code: errorCode, error: 'No path could be found for input', status_code: 400 })).toBe('no_route');
  });

  it.each([
    ['nothing', null],
    ['text', 'Bad gateway'],
    ['another error', { error_code: 100, error: 'Failed to parse json request' }],
    ['an error code in text', { error_code: '442' }],
    ['no trip', {}],
    ['no summary', { trip: { legs: [{ shape: ZURICH_LEG }] } }],
    ['a length in text', trip([{ shape: ZURICH_LEG }], { length: '0.3' })],
    ['no legs', trip([])],
    ['legs that are not a list', { trip: { summary: { length: 0.3 }, legs: { shape: ZURICH_LEG } } }],
    ['a leg without a shape', trip([{ shape: ZURICH_LEG }, {}])],
    ['a shape cut short', trip([{ shape: ZURICH_LEG.slice(0, 7) }])],
    ['an empty shape', trip([{ shape: '' }])],
    ['a point off the earth', trip([{ shape: OFF_THE_EARTH }])],
  ])('makes nothing of %s', (_label, body) => {
    expect(parseValhallaWalk(body)).toBeNull();
  });
});
