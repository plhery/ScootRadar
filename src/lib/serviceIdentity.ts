// How the site names itself to the services it asks: the feeds, the map's address search, the walking
// routes. The deployment's SITE_NAME, SITE_URL and CONTACT_EMAIL (src/lib/siteSettings.ts), which the
// build writes in for the website and the cache reads from its environment (DEPLOY.md), so a copy is
// never taken for scootradar.com by the operators it asks.

import { siteSettings } from './siteSettings';

const SETTINGS = siteSettings({
  SITE_URL: process.env.SITE_URL,
  SITE_NAME: process.env.SITE_NAME,
  CONTACT_EMAIL: process.env.CONTACT_EMAIL,
});

/** What the site calls itself: ScootRadar. */
export const SERVICE_NAME = SETTINGS.SITE_NAME;

/** The name in a client's terms, lower case with hyphens: scootradar. */
export const SERVICE_CLIENT = SETTINGS.SITE_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'scooter-map';

const host = new URL(SETTINGS.SITE_URL).host;

/** scootradar/2.0 (scootradar.com) */
export const SERVICE_USER_AGENT = `${SERVICE_CLIENT}/2.0 (${host})`;

/** The same with the contact, for a service that asks to be able to write: scootradar/2.0 (scootradar.com; hello@scootradar.com). */
export const SERVICE_USER_AGENT_WITH_CONTACT = SETTINGS.CONTACT_EMAIL
  ? `${SERVICE_CLIENT}/2.0 (${host}; ${SETTINGS.CONTACT_EMAIL})`
  : SERVICE_USER_AGENT;

/** The address a service can write to, or '' where the deployment names none. */
export const SERVICE_CONTACT = SETTINGS.CONTACT_EMAIL;

/** The site's origin: https://scootradar.com. */
export const SERVICE_ORIGIN = SETTINGS.SITE_URL;

/** The site's own address, for a service that asks for the page a request is for. */
export const SERVICE_REFERER = `${SETTINGS.SITE_URL}/`;
