import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import { APP_STORE_QR } from '@/generated/appStoreQr';
import { APP_STORE_CAMPAIGNS, appStoreUrl, isIPhone, smartAppBanner } from '@/lib/appStore';

describe('the links to the App Store', () => {
  it('are campaign links, one campaign for each place on the site', () => {
    expect(appStoreUrl('web-hero')).toBe('https://apps.apple.com/app/apple-store/id6823614854?pt=129628155&ct=web-hero&mt=8');
    for (const campaign of APP_STORE_CAMPAIGNS) {
      const url = new URL(appStoreUrl(campaign));
      expect(url.searchParams.get('ct')).toBe(campaign);
      expect(url.searchParams.get('pt')).toBe('129628155');
      // What App Store Connect allows a campaign.
      expect(campaign.length).toBeLessThanOrEqual(30);
    }
    expect(new Set(APP_STORE_CAMPAIGNS).size).toBe(APP_STORE_CAMPAIGNS.length);
  });

  it('show only on an iPhone, in any of its browsers', () => {
    for (const userAgent of [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.41 Mobile/15E148 Safari/604.1',
    ]) expect(isIPhone(userAgent), userAgent).toBe(true);
    for (const userAgent of [
      'Mozilla/5.0 (iPad; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
      // An iPad asking for desktop sites, and a Mac.
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
      'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    ]) expect(isIPhone(userAgent), userAgent).toBe(false);
  });
});

describe('the Smart App Banner', () => {
  const content = (argument: string) =>
    `app-id=6823614854, app-argument=${argument}, affiliate-data=pt=129628155&ct=web-banner`;

  it('names the app, the page it is on and its campaign', () => {
    expect(smartAppBanner('https://scootradar.com/')).toBe(content('https://scootradar.com/'));
    expect(smartAppBanner(new URL('/de/guides/e-trottinett-zuerich', 'https://scootradar.com')))
      .toBe(content('https://scootradar.com/de/guides/e-trottinett-zuerich'));
  });

  it('hands the app the link to the map, without a comma that would end the field', () => {
    // The app reads the escaped comma as the web does: ios/ScootRadarTests/ScooterMapLinkTests.swift.
    expect(smartAppBanner('https://scootradar.com/map?origin=47.37,8.54&minBattery=60#here'))
      .toBe(content('https://scootradar.com/map?origin=47.37%2C8.54&minBattery=60'));
    expect(smartAppBanner('https://scootradar.com/map')).toBe(content('https://scootradar.com/map'));
  });
});

describe('the QR code beside the App Store button', () => {
  /** The code as a camera sees it: its dark modules black on white, four pixels each, in a quiet zone four modules wide. */
  function photographed(scale = 4, quiet = 4) {
    const side = (APP_STORE_QR.size + 2 * quiet) * scale;
    const pixels = new Uint8ClampedArray(side * side * 4).fill(255);
    for (const [, x, y, width] of APP_STORE_QR.path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\3z/g)) {
      for (let column = Number(x); column < Number(x) + Number(width); column++) {
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const index = (((Number(y) + quiet) * scale + dy) * side + (column + quiet) * scale + dx) * 4;
            pixels.fill(0, index, index + 3);
          }
        }
      }
    }
    return { pixels, side };
  }

  it('reads as the App Store link with its own campaign', () => {
    // A path of nothing but runs, each in its row.
    expect(APP_STORE_QR.path.replace(/M\d+ \d+h(\d+)v1h-\1z/g, '')).toBe('');
    const { pixels, side } = photographed();
    expect(jsQR(pixels, side, side)?.data).toBe(appStoreUrl('web-qr'));
    expect(APP_STORE_QR.url).toBe(appStoreUrl('web-qr'));
  });
});
