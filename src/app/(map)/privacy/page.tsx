import AnalyticsPreference from '@/components/AnalyticsPreference';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import SmartAppBanner from '@/components/SmartAppBanner';
import { SENTRY_BROWSER_DSN } from '@/lib/errorReportsConfig';
import { ANALYTICS_SERVICE_HOST, CONTACT_EMAIL, MAP_SHARE_IMAGE, SITE_NAME } from '@/lib/site';

const TITLE = `Privacy — ${SITE_NAME}`;
const DESCRIPTION = `How ${SITE_NAME} handles location, search, and service data.`;

// A shared link names this page, not the map: the layout's openGraph and twitter are the map's,
// and a page that sets either replaces the whole of it.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  openGraph: {
    type: 'website',
    url: '/privacy',
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_CH',
    images: [MAP_SHARE_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [MAP_SHARE_IMAGE],
  },
};

// This page is light whatever the appearance of the app.
export const viewport: Viewport = {
  themeColor: '#f5f4f1',
};

export default function PrivacyPage() {
  return (
    // In English whatever language the map is shown in, which the layout sets on the whole document.
    <main className="legal-page" lang="en">
      <SmartAppBanner page="/privacy" />
      <article className="legal-content">
        <Link className="legal-back" href="/map">← Back to {SITE_NAME}</Link>
        <h1>Privacy</h1>
        <p>Last updated: 25 November 2026</p>

        <h2>Overview</h2>
        <p>
          {SITE_NAME} has no user accounts or advertising. It does not intentionally retain your precise location or address
          searches, except the last place you chose in the search, which stays on your device (see Local storage below).
        </p>

        <h2>Location and map requests</h2>
        <p>
          If you grant location permission, your browser or device provides your position to the
          app. Your position is used on the device to focus the map and calculate distances, and in
          the iOS and Android apps to tell day from night for their Automatic appearance. The
          {' '}{SITE_NAME} API receives the visible map bounds needed to find vehicles, but no
          separate user-location coordinate, except for a walking route (see below). These
          values are not stored by the application, except in an error report when a request
          fails (see below).
        </p>
        <p>
          On the website and in the Android app, the map is drawn on your device from OpenStreetMap
          data, in tiles requested directly from OpenFreeMap. It receives standard network information
          such as your IP address and the requested tile coordinates, and from the website its origin.
          In the iOS app, the map comes from Apple Maps: your device requests the map data directly
          from Apple, under Apple&apos;s privacy policy.
        </p>

        <h2>Walking routes</h2>
        <p>
          When you press Directions on the website or in the Android app, the start of the walk (your location, or the
          place you searched for) and the scooter or parking bay are sent through the {SITE_NAME}{' '}
          API, in the request body, to the Valhalla routing service run by FOSSGIS e.V. in Germany,
          which keeps route requests in its server log. {SITE_NAME} does not send your IP address
          with them, and neither logs nor stores them. While the route is on the map, it is asked
          for again from where you are if you leave it, or if the scooter moves. In the iOS app,
          walking routes come from Apple Maps.
        </p>

        <h2>Address search</h2>
        <p>
          Address search text is sent through the {SITE_NAME} API, with the language the app is
          shown in, to Geoapify, a search service on OpenStreetMap and other open data run by a
          company in Cyprus on servers in the European Union. When the map shows a city or less,
          the centre of the map, rounded to about a kilometre, is sent with it so that places
          nearby come first; when you follow your location, that centre is near you. When you
          type an address followed by a city in the {SITE_NAME} catalogue, that city&apos;s centre
          is sent instead. Without a centre, the country of your device&apos;s time zone, such as
          &ldquo;US&rdquo;, worked out on the device, is sent so that places in that country come
          first. Geoapify generally keeps the data of a successful request for no
          longer than 24 hours. When Geoapify cannot answer or finds nothing, the same is
          also sent to Photon, a search service on OpenStreetMap data run by komoot in
          Germany. {SITE_NAME} does not send your IP address with them. Cities in the {SITE_NAME}{' '}
          catalogue are found without contacting either; their names are still sent to
          Geoapify, to find other towns of the same name. The current app sends search text in
          the request body, and instructs browsers and intermediary caches not to store the
          request or response.
        </p>

        <h2>Mobility data</h2>
        <p>
          Live vehicle data comes from the public data feeds that mobility providers and public
          authorities publish, such as the Open data platform mobility Switzerland. {SITE_NAME}{' '}
          filters that data to the visible map area and does not build a history of vehicle
          movements.
        </p>

        <h2>Usage analytics</h2>
        <p>
          The public website and the iOS and Android apps send page or screen views and actions to our
          self-hosted Umami service{ANALYTICS_SERVICE_HOST && ` at ${ANALYTICS_SERVICE_HOST}`}. These include which page of the website
          you view, a guide for example, and whether you open the map from it; searches (only
          result counts), filters, map selections, directions and rental button taps, settings
          changes, generic error outcomes and, from the website, reports of its own errors (see Error reports below).
          Events distinguish web, installed web app, iOS and Android usage.
          Rental taps do not tell us whether you actually rented a vehicle.
        </p>
        <p>
          With the first page you open, the website also sends where the visit came from: the
          website that linked to it, by its domain alone (google.com, for example), and the
          campaign tags of the link, such as utm_source=chatgpt.com, so we know which sites and
          apps bring visitors.
        </p>
        <p>
          Analytics never includes address text, precise coordinates, vehicle identifiers,
          the page of another website you came from, other parts of the addresses you open,
          or advertising identifiers. Umami processes your IP address and user agent
          to derive approximate location, device information, and short-lived session statistics.
          It does not store raw IP addresses. We use no analytics cookies or persistent user IDs,
          and do not record your screen or replay sessions.
        </p>
        <p>
          Usage analytics is on by default. You can turn it off below, or in the iOS and Android apps under
          Settings › About › Privacy.
          The website also respects Do Not Track and Global Privacy Control. This browser
          preference is saved locally and does not affect the setting in the apps.
        </p>
        <p><AnalyticsPreference /></p>

        <h2>Local storage and service worker</h2>
        <p>
          Appearance, map style, language, units, filters, whether the map shows ride and parking zones,
          the ride length you choose for price
          estimates and, in the iOS and Android apps, the ride passes you enter are stored locally on your
          device, as is the fact that this device has found
          your location before (a yes or no, never the position) and, in the Android app, the fact that you refused
          it your location, until you allow it. The website also keeps what you did with its invitation to install the
          Android app: until when it is hidden, whether you asked not to see it again, and whether you followed its
          link to Google Play (while the app was in a test, until 25 November 2026, the steps of the test you
          followed and whether it thanked you, which it replaces the next time it saves). For its rating prompt each of the iOS
          and Android apps also keeps the number of days you used it and when it last asked (up to
          version 1.4.0 of the iOS app and 1.3.0 of the Android app, also the time you last tapped
          &ldquo;Open in&rdquo;, which later versions delete). Precise map origins are not persisted, except
          the last place you chose in the search: it stays on your device (in the iOS and Android apps,
          outside their backups) so that the search can offer it again, until you choose another place
          or remove it with its &times;.
          The iOS and Android apps keep on your device the ride and parking zones of the cities they download
          them for, such as Berlin, fetched from {SITE_NAME}&apos;s website the first time the map
          shows the city close up: the request names the city, not a position, and the zones are
          kept until the app or the system clears its cache. A
          service worker caches the application shell and static assets for faster and offline
          launches. You can remove this data through your browser
          or by deleting the app.
        </p>

        <h2>Infrastructure logs</h2>
        <p>
          Cloudflare processes requests to host and protect the service. Persisted Worker invocation
          logs are disabled so full request URLs containing coordinates or searches are not stored
          in the application&apos;s log stream. Cloudflare may still process limited network and security
          metadata under its own policies. Application error logs contain event names and error
          messages, not precise locations or search text.
        </p>

        <h2>Protection against scraping</h2>
        <p>
          Whenever the map on the website holds no pass, a few seconds after it shows its scooters, Cloudflare
          Turnstile checks in the background that your browser is not a script: on your first visit, once the pass
          has expired after 24 hours, from another network, after you clear your cookies, or when we change the key
          that signs passes. While the map stays open without one, as after a check that did not pass, Turnstile
          checks again at most every 10 minutes, or every 30 seconds once the map needs the pass to show scooters.
          You see nothing: its script and its invisible frame come from
          challenges.cloudflare.com and read signals of your browser and device, under
          the <a href="https://www.cloudflare.com/turnstile-privacy-policy/">Cloudflare Turnstile Privacy Addendum</a>.
          Once it has passed, the website sets a cookie for 24 hours, <code>__Host-scootradar-pass</code>, which holds
          when it expires and a signature of that time and of your network (your IP address, or its first half for
          IPv6), and no identifier, so that the map&apos;s requests keep the scooters up to date. Without it, the
          map shows scooters for its network&apos;s first few requests of the day, then asks Turnstile at once and
          shows them again once it has passed.
        </p>
        <p>
          The iOS and Android apps do not use Turnstile: they get the same pass, held on your device until it expires
          and sent with their requests for scooters, by proving in the background that they are {SITE_NAME}&apos;s own
          apps, when the server says they have none, at most once every 10 minutes. The iOS app uses Apple&apos;s App
          Attest: it makes a key in your device&apos;s Secure Enclave, which Apple certifies the first time, and signs
          the server&apos;s challenge with it. The Android app from Google Play uses Google&apos;s Play Integrity API,
          through Google Play services, which tells whether it is the copy Google Play distributes on a device that
          passes Google&apos;s integrity checks. <a href="https://www.apple.com/legal/privacy/">Apple</a> and{' '}
          <a href="https://policies.google.com/privacy">Google</a> process your device&apos;s signals under their own
          policies. The server checks the proof and keeps nothing of it: the iOS app sends its key&apos;s identifier,
          the same each time on your device, which the server neither stores nor logs; the iOS app keeps the
          identifier and the server&apos;s signed copy of the key on your device until you delete the app. The Android
          app built for F-Droid does not use Play Integrity. The apps work without a pass.
        </p>
        <p>
          To tell a map&apos;s requests from a script&apos;s, the server counts each visitor&apos;s requests for
          scooters under a hash of their IP address (or its first half for IPv6), salted afresh each time the server
          starts: by quarter hour, with the time of the first of them, so that a short look is told from a steady
          stream, and by day the quarter hours in which they kept the scooters up to date. A hash is kept for its
          quarter hour or its day, then only the counts; no IP address is stored. It also counts each
          address&apos;s (or IPv6 first half&apos;s) requests for scooters of the day and hour under a keyed hash of it
          and that day or hour, with a key only the server holds, kept across a restart until the day ends, so that an
          address making more than a map does is answered with the scooters already held. One day&apos;s hashes cannot
          be linked to the next&apos;s. The website tells the server whether a request for scooters came from a page of
          {' '}{SITE_NAME}, another site or none, never the page itself; the server only counts them.
        </p>
        <p>
          An IP address (or IPv6 first half) found collecting the scooters with a script can be refused the
          website&apos;s API for a set time, usually 30 days. It is kept, with when that ends and a note of why, in the
          website&apos;s settings at Cloudflare and on our own computer, only until then.
        </p>

        <h2>Error reports</h2>
        <p>
          When the server fails to answer a map request, an error report is sent to Sentry, in the
          United States, so we can reproduce the failure. It holds the request URL, with the visible
          map bounds, zoom level and filters, and the state of the server at the time. It never
          includes your IP address, request headers or search text. Sentry keeps these reports for
          up to 90 days.
        </p>
        <p>
          When the website&apos;s own scripts fail in your browser while usage analytics is on, the
          website sends Umami a report of the error, which Umami handles as it does the analytics above.
          It holds the error&apos;s name and message, its stack (where in the website&apos;s scripts it
          happened), the page by the same address analytics counts it under (/map, for example), the
          version of the website, the language of your browser and whether you use the website or the
          installed web app. Before it is sent, the addresses in it lose their query and fragment,
          where the map keeps its position, and it loses any email address, number with three decimals
          or more (as a coordinate), quoted text with a space in it (as a search) and anything shaped
          like a key or a long number. At most five reports are sent each time you load the website,
          and none for an error of a browser extension, of another website&apos;s script or of the
          network.
        </p>
        {SENTRY_BROWSER_DSN && (
          <p>
            The website sends these reports to Sentry too, with your browser&apos;s user agent (the
            name and version of your browser and system) and what happened on the page before the
            error: the pages of the website you opened and its requests to the {SITE_NAME} API, each by
            its path alone and with the status of its answer. Unlike the analytics, they are sent
            whether usage analytics is on or off and whatever your Do Not Track and Global Privacy
            Control settings, as the server&apos;s reports are: they hold no identifier, and they are how
            we learn that the website fails in a browser like yours. Sentry receives your IP address
            with each report, as any server you connect to does, and is told not to store it. Sentry
            keeps these reports for up to 90 days.
          </p>
        )}

        <h2>Your choices</h2>
        <p>
          You can withdraw location permission at any time in your browser or device settings, and
          turn off usage analytics as described above; the map works without either. Nothing
          {' '}{SITE_NAME} keeps is linked to an account or to you. To ask about an error report or have
          it deleted before its 90 days are up, write to us with the time and the place on the
          map, and we will delete it.
        </p>

        <h2 id="contact">Contact and third parties</h2>
        <p>
          {CONTACT_EMAIL && <>Questions and requests can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.{' '}</>}
          Third-party services have their own privacy policies: {' '}
          <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare</a>, {' '}
          <a href="https://openfreemap.org/privacy/">OpenFreeMap</a>, {' '}
          <a href="https://www.fossgis.de/datenschutzerkl%C3%A4rung">FOSSGIS</a>, {' '}
          <a href="https://www.apple.com/legal/privacy/">Apple</a>, {' '}
          <a href="https://sentry.io/privacy/">Sentry</a>, {' '}
          <a href="https://www.geoapify.com/privacy-policy/">Geoapify</a>, and {' '}
          <a href="https://www.komoot.com/privacy">komoot</a>.
        </p>
      </article>
    </main>
  );
}
