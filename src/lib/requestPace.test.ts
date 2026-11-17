// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { PACE_WINDOW_MS, noteRequest, paceOpensAt, recentRequests, refusedForMs } from '@/lib/requestPace';

const NOW = Date.parse('2026-11-17T12:00:00.000Z');
const retryAfter = (value?: string) => ({ headers: new Headers(value === undefined ? {} : { 'Retry-After': value }) });

beforeEach(() => localStorage.clear());

describe('paceOpensAt', () => {
  it('is now while fewer requests than the pace were sent in the last minute', () => {
    expect(paceOpensAt([], NOW, 3)).toBe(NOW);
    expect(paceOpensAt([NOW - 5_000, NOW - 1_000], NOW, 3)).toBe(NOW);
    // Older than a minute, or dated after now by a clock set back: not counted.
    expect(paceOpensAt([NOW - 61_000, NOW - 60_000, NOW - 2_000, NOW - 1_000, NOW + 5_000], NOW, 3)).toBe(NOW);
  });

  it('is when enough of them are a minute old', () => {
    expect(paceOpensAt([NOW - 50_000, NOW - 30_000, NOW - 10_000], NOW, 3)).toBe(NOW + 10_000);
    expect(paceOpensAt([NOW - 10_000, NOW - 50_000, NOW - 30_000, NOW - 20_000], NOW, 3)).toBe(NOW + 30_000);
  });
});

describe('refusedForMs', () => {
  it('is the Retry-After, a minute without a usable one, five minutes at most', () => {
    expect(refusedForMs(retryAfter('60'))).toBe(60_000);
    expect(refusedForMs(retryAfter('7'))).toBe(7_000);
    expect(refusedForMs(retryAfter())).toBe(60_000);
    expect(refusedForMs(retryAfter('Wed, 21 Oct 2026 07:28:00 GMT'))).toBe(60_000);
    expect(refusedForMs(retryAfter('0'))).toBe(60_000);
    expect(refusedForMs(retryAfter('86400'))).toBe(300_000);
  });
});

describe('the requests of the last minute', () => {
  it('are kept for every tab of this browser, and no longer than the minute', () => {
    noteRequest(NOW - PACE_WINDOW_MS - 1);
    noteRequest(NOW - 30_000);
    noteRequest(NOW);
    expect(recentRequests(NOW)).toEqual([NOW - 30_000, NOW]);
    expect(JSON.parse(localStorage.getItem('scooters-requests')!)).toEqual([NOW - 30_000, NOW]);
  });

  it('are none where what is stored is not theirs', () => {
    localStorage.setItem('scooters-requests', '{"a":1}');
    expect(recentRequests(NOW)).toEqual([]);
    localStorage.setItem('scooters-requests', 'not json');
    expect(recentRequests(NOW)).toEqual([]);
    noteRequest(NOW);
    expect(recentRequests(NOW)).toEqual([NOW]);
  });
});
