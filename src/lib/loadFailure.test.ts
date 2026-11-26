import { describe, expect, it } from 'vitest';
import { classifyLoadFailure, failureReasonKey, failureSurface, maintenanceNotice, retryAfterMs, retryGapMs } from '@/lib/loadFailure';

describe('classifyLoadFailure', () => {
  it('reads an HTTP error status', () => {
    expect(classifyLoadFailure({ status: 429 })).toBe('busy');
    expect(classifyLoadFailure({ status: 428 })).toBe('unverified');
    expect(classifyLoadFailure({ status: 500 })).toBe('unavailable');
    expect(classifyLoadFailure({ status: 503 })).toBe('unavailable');
    expect(classifyLoadFailure({ status: 599 })).toBe('unavailable');
    expect(classifyLoadFailure({ status: 400 })).toBe('failed');
    expect(classifyLoadFailure({ status: 404 })).toBe('failed');
    expect(classifyLoadFailure({ status: 600 })).toBe('failed');
  });

  it('trusts the answer of the server over the connection state', () => {
    expect(classifyLoadFailure({ status: 503, online: false })).toBe('unavailable');
    expect(classifyLoadFailure({ status: 429, timedOut: true })).toBe('busy');
  });

  it('tells a request that never got an answer apart by connection and deadline', () => {
    expect(classifyLoadFailure({ online: false })).toBe('offline');
    expect(classifyLoadFailure({ online: false, timedOut: true })).toBe('offline');
    expect(classifyLoadFailure({ online: true, timedOut: true })).toBe('timeout');
    expect(classifyLoadFailure({ timedOut: true })).toBe('timeout');
    expect(classifyLoadFailure({ online: true })).toBe('failed');
    expect(classifyLoadFailure({})).toBe('failed');
  });
});

describe('failureReasonKey', () => {
  it('has one sentence per reason', () => {
    expect(failureReasonKey('offline')).toBe('fail.offline');
    expect(failureReasonKey('timeout')).toBe('fail.timeout');
    expect(failureReasonKey('busy')).toBe('fail.busy');
    expect(failureReasonKey('unavailable')).toBe('fail.unavailable');
    expect(failureReasonKey('unverified')).toBe('fail.unverified');
    expect(failureReasonKey('failed')).toBe('fail.generic');
  });
});

describe('failureSurface', () => {
  it('shows nothing while nothing is wrong', () => {
    expect(failureSurface({ failure: null, hasData: true, outOfDate: false })).toBeNull();
    expect(failureSurface({ failure: null, hasData: false, outOfDate: false })).toBeNull();
  });

  it('uses the banner for a failed first load', () => {
    expect(failureSurface({ failure: 'offline', hasData: false, outOfDate: false })).toBe('banner');
  });

  it('uses the dock status line while the data on screen is still valid', () => {
    expect(failureSurface({ failure: 'timeout', hasData: true, outOfDate: false })).toBe('status');
  });

  it('uses the card once the data was removed', () => {
    expect(failureSurface({ failure: 'offline', hasData: false, outOfDate: true })).toBe('card');
  });
});

describe('the server down for maintenance', () => {
  it('is maintenance only where the answer said the server is down', () => {
    expect(classifyLoadFailure({ status: 503, originDown: true })).toBe('maintenance');
    expect(classifyLoadFailure({ status: 503 })).toBe('unavailable');
    expect(classifyLoadFailure({ status: 429, originDown: true })).toBe('busy');
    expect(failureReasonKey('maintenance')).toBe('maint.down');
  });

  it('has its own notice, never the banner, the status line or the card', () => {
    for (const [hasData, outOfDate] of [[false, false], [true, false], [false, true]]) {
      expect(failureSurface({ failure: 'maintenance', hasData, outOfDate })).toBeNull();
    }
  });

  it('says what is shown, and when it should be back where that was announced', () => {
    const at = Date.parse('2026-11-18T22:02:00Z');
    const back = Date.parse('2026-11-18T22:20:00Z');
    const now = at + 60_000;
    expect(maintenanceNotice({ maintenance: null, hasData: true, lastUpdated: at, now })).toBeNull();
    expect(maintenanceNotice({ maintenance: { backAround: null }, hasData: true, lastUpdated: at, now }))
      .toEqual([{ key: 'maint.paused', time: at }]);
    expect(maintenanceNotice({ maintenance: { backAround: back }, hasData: false, lastUpdated: at, now }))
      .toEqual([{ key: 'maint.down' }, { key: 'maint.backAround', time: back }]);
  });

  it('says it is running late once the announced time has passed, and names no time already gone', () => {
    const at = Date.parse('2026-11-18T22:02:00Z');
    const back = Date.parse('2026-11-18T22:20:00Z');
    expect(maintenanceNotice({ maintenance: { backAround: back }, hasData: true, lastUpdated: at, now: back - 1 }))
      .toEqual([{ key: 'maint.paused', time: at }, { key: 'maint.backAround', time: back }]);
    for (const now of [back, back + 60_000, back + 3 * 3_600_000]) {
      expect(maintenanceNotice({ maintenance: { backAround: back }, hasData: true, lastUpdated: at, now }))
        .toEqual([{ key: 'maint.paused', time: at }, { key: 'maint.late' }]);
      expect(maintenanceNotice({ maintenance: { backAround: back }, hasData: false, lastUpdated: null, now }))
        .toEqual([{ key: 'maint.down' }, { key: 'maint.late' }]);
    }
  });

  it('waits as long as Retry-After says, ten seconds at least and five minutes at most', () => {
    expect(retryAfterMs('30')).toBe(30_000);
    expect(retryAfterMs(' 120 ')).toBe(120_000);
    expect(retryAfterMs('86400')).toBe(300_000);
    for (const value of [null, '', 'soon', '-5', '1.5', 'Wed, 21 Oct 2026 07:28:00 GMT']) expect(retryAfterMs(value)).toBe(0);
    expect(retryGapMs(0)).toBe(10_000);
    expect(retryGapMs()).toBe(10_000);
    expect(retryGapMs(30_000)).toBe(30_000);
  });
});
