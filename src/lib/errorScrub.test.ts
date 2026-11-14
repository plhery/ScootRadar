import { describe, expect, it } from 'vitest';
import { extensionStack, ignoredError, scrubAddress, scrubText } from './errorScrub';

const scripts = 'https://scootradar.com/_next/static/chunks';

describe('what an error report may say', () => {
  it('drops an address\'s query and fragment, and the ids and numbers of its path', () => {
    expect(scrubAddress('https://scootradar.com/map?origin=47.3769,8.5417&zoom=16#walk')).toBe('https://scootradar.com/map');
    expect(scrubAddress('/api/scooters?bbox=8.53,47.36,8.55,47.38')).toBe('/api/scooters');
    expect(scrubAddress('https://tiles.openfreemap.org/planet/20251112_001001_pt/14/8580/5735.pbf'))
      .toBe('https://tiles.openfreemap.org/planet/:id/14/:id/:id');
    expect(scrubAddress('/guides/e-scooters-bristol')).toBe('/guides/e-scooters-bristol');
    expect(scrubAddress('https://jo:secret@example.test/a')).toBe('https://example.test/a');
  });

  it('keeps the names of the site\'s scripts, by which their source maps are found', () => {
    expect(scrubAddress(`${scripts}/0a1b2c3d4e5f6789.js?v=2`)).toBe(`${scripts}/0a1b2c3d4e5f6789.js`);
    const stack = `TypeError: x is undefined\n    at render (${scripts}/0a1b2c3d4e5f6789.js:1:20345)\n    at Ab@${scripts}/app/(map)/map/page-4f3e2d1c.js:2:301`;
    expect(scrubText(stack)).toBe(stack);
  });

  it('filters coordinates: numbers with three decimals or more', () => {
    expect(scrubText('Invalid LatLng object: (47.3769, -8.54169)')).toBe('Invalid LatLng object: ([Filtered], [Filtered])');
    expect(scrubText('No route from 47.376912,8.541694')).toBe('No route from [Filtered],[Filtered]');
    expect(scrubText('lat=-33.86882 lng=151.209296')).toBe('lat=[Filtered] lng=[Filtered]');
    // Fewer decimals are no position to speak of, and a version or a stack's line and column none at all.
    expect(scrubText('zoom 15.5 of 1.12')).toBe('zoom 15.5 of 1.12');
  });

  it('filters quoted text with a space in it, or long, as a search can be, and keeps a quoted name', () => {
    expect(scrubText('No place found for "Bahnhofstrasse 1, Zürich"')).toBe('No place found for "[Filtered]"');
    expect(scrubText("'Rue de Rivoli' is not a valid selector")).toBe("'[Filtered]' is not a valid selector");
    expect(scrubText(`Unknown city “Saint Gallen” or ‘La Chaux-de-Fonds’ or «Genève centre»`))
      .toBe('Unknown city “[Filtered]” or ‘[Filtered]’ or «[Filtered]»');
    expect(scrubText(`No answer for '${'Kurfürstendamm'.repeat(3)}'`)).toBe("No answer for '[Filtered]'");
    expect(scrubText("Cannot read properties of undefined (reading 'map')"))
      .toBe("Cannot read properties of undefined (reading 'map')");
    expect(scrubText("Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node."))
      .toBe("Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.");
    // An apostrophe within a word starts no quote.
    expect(scrubText("Can't find variable: L, nor 'x'")).toBe("Can't find variable: L, nor 'x'");
  });

  it('filters email addresses, keys and long numbers, and the queries of addresses in the text', () => {
    expect(scrubText('Unknown owner jo@example.test')).toBe('Unknown owner [Filtered]');
    expect(scrubText('Bad key Q2xhdWRlLWtleS1mb3ItdGVzdHMtb25seS1hYmNkZWY')).toBe('Bad key [Filtered]');
    expect(scrubText('Bad key abcdefghijklmnopqrstuvwx1')).toBe('Bad key [Filtered]');
    expect(scrubText('Scooter 4718293746 is gone')).toBe('Scooter [Filtered] is gone');
    expect(scrubText('Cannot fetch "/api/zones?lat=47.3769&lng=8.5417"')).toBe('Cannot fetch "/api/zones"');
    expect(scrubText('Failed at https://scootradar.com/map?origin=47.3769,8.5417#x again'))
      .toBe('Failed at https://scootradar.com/map again');
    expect(scrubText('Failed at https://jo@example.test:secret@scootradar.com/map')).not.toMatch(/jo@|secret/);
  });
});

describe('which errors are not the page\'s', () => {
  it('knows the noise of networks, cancelled requests, scripts that did not arrive and resizes', () => {
    for (const [name, message] of [['TypeError', 'Failed to fetch'], ['TypeError', 'Load failed'], ['TypeError', 'cancelled'],
      ['TypeError', 'annulé'], ['AbortError', 'The user aborted a request.'], ['TimeoutError', 'signal timed out'],
      ['ChunkLoadError', 'Loading chunk 42 failed.'], ['TypeError', 'Failed to fetch dynamically imported module: x'],
      ['Error', 'ResizeObserver loop completed with undelivered notifications.'],
      ['TypeError', 'NetworkError when attempting to fetch resource.']]) {
      expect(ignoredError(name, message), message).toBe(true);
    }
    for (const [name, message] of [['TypeError', 'x is not a function'], ['TypeError', "Cannot read properties of undefined (reading 'id')"],
      ['Error', 'Minified React error #418']]) {
      expect(ignoredError(name, message), message).toBe(false);
    }
  });

  it('knows a stack that runs through a browser extension, in each browser', () => {
    for (const frame of ['    at chrome-extension://abcdef/content.js:1:1', 'inject@moz-extension://1234/inject.js:2:3',
      'f@safari-web-extension://ABCD/script.js:4:5', '    at webkit-masked-url://hidden/:1:2']) {
      expect(extensionStack(`TypeError: x\n    at render (${scripts}/a.js:1:2)\n${frame}`), frame).toBe(true);
    }
    expect(extensionStack(`TypeError: x\n    at render (${scripts}/a.js:1:2)`)).toBe(false);
  });
});
