// The iPhone app on the App Store, and the site's links to it. Each place a
// link sits is a campaign of its own (App Store Connect's campaign links), so
// App Analytics counts what each one brings. The app is the deployment's
// APP_STORE_ID (src/lib/siteSettings.ts): without one the site shows no iPhone
// app, no button, no QR code and no Smart App Banner.

import { SITE } from './site';

/** The app's Apple ID, or '' where the site has no iPhone app. */
export const APP_STORE_ID = SITE.APP_STORE_ID;

/** Whether the site shows an iPhone app at all. */
export const APP_STORE_ON = APP_STORE_ID !== '';

/** The app's page on the App Store, without a campaign. */
export const APP_STORE_PAGE = `https://apps.apple.com/app/id${APP_STORE_ID}`;

/** The token of the account that publishes the app, the same in every campaign link and public in each. */
const PROVIDER_TOKEN = SITE.APP_STORE_PROVIDER_TOKEN;

/** Where a link to the App Store sits, each in at most the 30 characters App Store Connect allows. */
export const APP_STORE_CAMPAIGNS = [
  // The button on the landing page's first screen, and the one at its end.
  'web-hero',
  'web-closing',
  // The QR code beside the first, on a wide screen.
  'web-qr',
  // The map on an iPhone: Settings › About, and the help to turn location back on.
  'web-map-settings',
  'web-map-location',
  // Safari's Smart App Banner, on every page.
  'web-banner',
] as const;
export type AppStoreCampaign = (typeof APP_STORE_CAMPAIGNS)[number];

/** The app's page on the App Store, from this place on the site. */
export function appStoreUrl(campaign: AppStoreCampaign): string {
  if (!PROVIDER_TOKEN) return APP_STORE_PAGE;
  return `https://apps.apple.com/app/apple-store/id${APP_STORE_ID}?pt=${PROVIDER_TOKEN}&ct=${campaign}&mt=8`;
}

/** The name of the tag Safari's Smart App Banner reads. */
export const SMART_APP_BANNER = 'apple-itunes-app';

/**
 * What the Smart App Banner on a page reads: the app, and the address of the
 * page, which the app opens on when it is installed (ios: ScooterMapLink). The
 * tag's fields are parted by commas, so those of the address are escaped. The
 * page is built with its own address; the Worker writes in the one it was asked
 * for, with the link's parameters, and the service worker does the same for the
 * map it keeps (components/SmartAppBanner.tsx).
 */
export function smartAppBanner(page: string | URL): string {
  const address = new URL(page);
  address.hash = '';
  const banner = `app-id=${APP_STORE_ID}, app-argument=${address.href.replaceAll(',', '%2C')}`;
  return PROVIDER_TOKEN ? `${banner}, affiliate-data=pt=${PROVIDER_TOKEN}&ct=web-banner` : banner;
}

/**
 * An iPhone, in whichever browser: the app is for the iPhone alone. An iPad
 * names itself, or asks for desktop sites as a Mac, and is left out.
 */
export function isIPhone(userAgent: string): boolean {
  return /\biPhone\b/.test(userAgent);
}
