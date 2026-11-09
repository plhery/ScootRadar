import { describe, expect, it } from 'vitest';
import {
  parseClientParams,
  parseStoredClientParams,
  serializeClientParams,
  startingClientParams,
} from '@/lib/clientParams';

const parse = (query: string) => parseClientParams(new URLSearchParams(query));

describe('client params', () => {
  it('parses valid URL settings', () => {
    expect(parseClientParams(new URLSearchParams({
      origin: '47.3769,8.5417',
      minBattery: '30',
      theme: 'dark',
      map: 'detailed',
    }))).toEqual({
      origin: [47.3769, 8.5417],
      minBattery: 30,
      theme: 'dark',
      map: 'detailed',
    });
  });

  it('rejects out-of-range coordinates and malformed values', () => {
    expect(parseClientParams(new URLSearchParams({
      origin: '999,999',
      minBattery: 'abc',
      theme: 'sepia',
      map: 'satellite',
      tile: 'sepia',
    }))).toEqual({
      origin: null,
      minBattery: undefined,
      theme: undefined,
      map: undefined,
    });
  });

  it('leaves everything undefined when the URL says nothing', () => {
    expect(parse('')).toEqual({ origin: null, minBattery: undefined, theme: undefined, map: undefined });
    expect(parse('minBattery=')).toMatchObject({ minBattery: undefined });
  });

  it('snaps battery values down to the presets', () => {
    expect(parse('minBattery=0').minBattery).toBe(0);
    expect(parse('minBattery=60').minBattery).toBe(60);
    expect(parse('minBattery=45').minBattery).toBe(30);
    expect(parse('minBattery=95').minBattery).toBe(80);
    expect(parse('minBattery=103').minBattery).toBe(80);
    expect(parse('minBattery=25').minBattery).toBe(0);
    expect(parse('minBattery=-2').minBattery).toBe(0);
  });

  it('reads a range minimum in whole metres, and nothing else', () => {
    expect(parse('minRange=5000').minRange).toBe(5000);
    expect(parse('minRange=4828').minRange).toBe(4828);
    expect(parse('minRange=0').minRange).toBe(0);
    // Far beyond the slider: the map shows it at the slider's end.
    expect(parse('minRange=250000').minRange).toBe(250_000);
    for (const wrong of ['', ' ', '-5000', '5000.5', '5e3', '5km', 'abc', '1e400', '99999999999999999999']) {
      expect(parse(`minRange=${encodeURIComponent(wrong)}`).minRange, wrong).toBeUndefined();
    }
    expect(parse('').minRange).toBeUndefined();
  });

  it('keeps the battery minimum of a link that sets both, as the filters set one or the other', () => {
    expect(parse('minBattery=30&minRange=5000')).toMatchObject({ minBattery: 30, minRange: 0 });
    // A battery of any level leaves the range as it is.
    expect(parse('minBattery=0&minRange=5000')).toMatchObject({ minBattery: 0, minRange: 5000 });
    expect(parse('minBattery=abc&minRange=5000')).toMatchObject({ minBattery: undefined, minRange: 5000 });
  });

  it('accepts each theme and map style by name', () => {
    expect(parse('theme=light')).toMatchObject({ theme: 'light', map: undefined });
    expect(parse('theme=auto')).toMatchObject({ theme: 'auto' });
    expect(parse('map=calm')).toMatchObject({ theme: undefined, map: 'calm' });
  });

  it('reads the old tile setting', () => {
    expect(parse('tile=dark')).toMatchObject({ theme: 'dark', map: undefined });
    expect(parse('tile=osm')).toMatchObject({ theme: undefined, map: 'detailed' });
    expect(parse('tile=light')).toMatchObject({ theme: undefined, map: undefined });
  });

  it('prefers the new settings over the old one', () => {
    expect(parse('tile=dark&theme=light')).toMatchObject({ theme: 'light', map: undefined });
    expect(parse('tile=osm&map=calm')).toMatchObject({ theme: undefined, map: 'calm' });
    expect(parse('tile=osm&theme=dark')).toMatchObject({ theme: 'dark', map: 'detailed' });
  });

  it('accepts only recognized string values from storage', () => {
    expect(parseStoredClientParams(JSON.stringify({
      origin: '47.4,8.5',
      minBattery: '60',
      theme: 'dark',
      map: 'detailed',
      extra: 'ignored',
    }))).toEqual({
      origin: null,
      minBattery: 60,
      theme: 'dark',
      map: 'detailed',
    });
    expect(parseStoredClientParams(JSON.stringify({ minBattery: 60, theme: ['dark'] }))).toBeNull();
    expect(parseStoredClientParams('["47.4,8.5"]')).toBeNull();
    expect(parseStoredClientParams('{bad json')).toBeNull();
    expect(parseStoredClientParams(null)).toBeNull();
  });

  it('restores settings stored by earlier releases', () => {
    expect(parseStoredClientParams(JSON.stringify({ minBattery: '50', tile: 'osm' })))
      .toEqual({ origin: null, minBattery: 30, theme: undefined, map: 'detailed' });
    expect(parseStoredClientParams(JSON.stringify({ tile: 'dark' })))
      .toEqual({ origin: null, minBattery: undefined, theme: 'dark', map: undefined });
    // The old default says nothing the new defaults do not.
    expect(parseStoredClientParams(JSON.stringify({ tile: 'light' }))).toBeNull();
  });

  it('starts from the settings saved, where a link sets none of them', () => {
    const saved = parseStoredClientParams(JSON.stringify({ minBattery: '60', theme: 'dark', zones: '0' }));
    // A shared place: the place is the link's, the settings stay those of this device.
    expect(startingClientParams(parse('origin=47.3769,8.5417'), saved))
      .toEqual({ origin: [47.3769, 8.5417], minBattery: 60, theme: 'dark', map: undefined, zones: false });
    // A campaign's tag, or anything else the map does not read, sets nothing.
    expect(startingClientParams(parse('utm_source=newsletter&utm_medium=email'), saved))
      .toEqual({ origin: null, minBattery: 60, theme: 'dark', map: undefined, zones: false });
    expect(startingClientParams(parse(''), saved)).toEqual({ ...saved, origin: null });
    expect(startingClientParams(parse('theme=neon'), saved)).toMatchObject({ theme: 'dark' });
  });

  it('changes only the settings a link sets', () => {
    const saved = parseStoredClientParams(JSON.stringify({ minBattery: '60', theme: 'dark', zones: '0' }));
    expect(startingClientParams(parse('map=detailed'), saved))
      .toEqual({ origin: null, minBattery: 60, theme: 'dark', map: 'detailed', zones: false });
    // Even back to what nothing chosen means.
    expect(startingClientParams(parse('theme=auto&zones=1&minBattery=0'), saved))
      .toEqual({ origin: null, minBattery: 0, theme: 'auto', map: undefined, zones: true });
    // Nothing saved: the link's alone.
    expect(startingClientParams(parse('tile=dark&minBattery=45'), null))
      .toEqual({ origin: null, minBattery: 30, theme: 'dark', map: undefined, zones: undefined });
  });

  it('clears the minimum saved where a link sets the other one, and keeps it where the link sets none', () => {
    const range = parseStoredClientParams(JSON.stringify({ minRange: '8000' }));
    const battery = parseStoredClientParams(JSON.stringify({ minBattery: '60' }));
    expect(range).toMatchObject({ minRange: 8000 });
    expect(startingClientParams(parse('minBattery=30'), range)).toMatchObject({ minBattery: 30, minRange: 0 });
    expect(startingClientParams(parse('minRange=5000'), battery)).toMatchObject({ minBattery: 0, minRange: 5000 });
    expect(startingClientParams(parse('minBattery=0'), range)).toMatchObject({ minBattery: 0, minRange: 8000 });
    expect(startingClientParams(parse('theme=dark'), range)).toMatchObject({ minBattery: undefined, minRange: 8000 });
    expect(startingClientParams(parse('minRange=0'), battery)).toMatchObject({ minBattery: 60, minRange: 0 });
  });

  it('serializes only non-default settings', () => {
    expect(serializeClientParams({ minBattery: 0, theme: 'auto', map: 'calm' }).toString()).toBe('');
    expect(serializeClientParams({ minBattery: 60, theme: 'dark', map: 'detailed' }).toString())
      .toBe('minBattery=60&theme=dark&map=detailed');
    expect(serializeClientParams({ minBattery: 0, theme: 'light', map: 'calm' }).toString()).toBe('theme=light');
    expect(serializeClientParams({ minBattery: 0, minRange: 4828, theme: 'auto', map: 'calm' }).toString()).toBe('minRange=4828');
    expect(serializeClientParams({ minBattery: 0, minRange: 0, theme: 'auto', map: 'calm' }).toString()).toBe('');
  });

  it('keeps the zones layer in the URL only while it is off', () => {
    expect(parse('zones=0').zones).toBe(false);
    // Links from when the zones were off unless turned on.
    expect(parse('zones=1').zones).toBe(true);
    expect(parse('zones=no').zones).toBeUndefined();
    expect(serializeClientParams({ minBattery: 0, theme: 'auto', map: 'calm', zones: false }).toString()).toBe('zones=0');
    expect(serializeClientParams({ minBattery: 0, theme: 'auto', map: 'calm', zones: true }).toString()).toBe('');
    expect(parseStoredClientParams(JSON.stringify({ zones: '0' }))).toMatchObject({ zones: false });
    expect(parseStoredClientParams(JSON.stringify({ zones: '1' }))).toMatchObject({ zones: true });
  });

  it('never writes the old tile setting or an origin', () => {
    const written = serializeClientParams({ minBattery: 30, theme: 'dark', map: 'detailed' });
    expect(written.has('tile')).toBe(false);
    expect(written.has('origin')).toBe(false);
  });

  it('reads back what it wrote', () => {
    for (const settings of [
      { minBattery: 0, theme: 'auto', map: 'calm' },
      { minBattery: 30, theme: 'light', map: 'detailed' },
      { minBattery: 80, theme: 'dark', map: 'calm' },
      { minBattery: 0, minRange: 12_000, theme: 'auto', map: 'calm' },
    ] as const) {
      const parsed = parseClientParams(serializeClientParams(settings));
      expect({
        minBattery: parsed.minBattery ?? 0,
        ...'minRange' in settings ? { minRange: parsed.minRange } : {},
        theme: parsed.theme ?? 'auto',
        map: parsed.map ?? 'calm',
      }).toEqual(settings);
    }
  });
});
