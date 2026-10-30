import AnalyticsPreference from '@/components/AnalyticsPreference';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { SMART_APP_BANNER, smartAppBanner } from '@/lib/appStore';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy — ScootRadar',
  description: 'How ScootRadar handles location, search, and service data.',
  alternates: { canonical: '/privacy' },
  other: { [SMART_APP_BANNER]: smartAppBanner(new URL('/privacy', SITE_URL)) },
};

// This page is light whatever the appearance of the app.
export const viewport: Viewport = {
  themeColor: '#f5f4f1',
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <article className="legal-content">
        <Link className="legal-back" href="/map">← Back to ScootRadar</Link>
        <h1>Privacy</h1>
        <p>Last updated: 30 October 2026</p>

        <h2>Overview</h2>
        <p>
          ScootRadar has no user accounts or advertising. It does not intentionally retain your precise location or address searches.
        </p>

        <h2>Location and map requests</h2>
        <p>
          If you grant location permission, your browser or device provides your position to the
          app. Your position is used on the device to focus the map and calculate distances, and in
          the iOS app to tell day from night for its Automatic appearance. The
          ScootRadar API receives the visible map bounds needed to find vehicles, but no
          separate user-location coordinate, except for a walking route (see below). These
          values are not stored by the application, except in an error report when a request
          fails (see below).
        </p>
        <p>
          On the website, the map is drawn on your device from OpenStreetMap data, in tiles requested
          directly from OpenFreeMap. It receives standard network information such as your IP address,
          the website origin and the requested tile coordinates. In the iOS app, the map comes from
          Apple Maps: your device requests the map data directly from Apple, under Apple&apos;s
          privacy policy.
        </p>

        <h2>Walking routes</h2>
        <p>
          When you press Directions on the website, the start of the walk (your location, or the
          place you searched for) and the scooter or parking bay are sent through the ScootRadar
          API, in the request body, to the Valhalla routing service run by FOSSGIS e.V. in Germany,
          which keeps route requests in its server log. ScootRadar does not send your IP address
          with them, and neither logs nor stores them. While the route is on the map, it is asked
          for again from where you are if you leave it, or if the scooter moves. In the iOS app,
          walking routes come from Apple Maps.
        </p>

        <h2>Address search</h2>
        <p>
          Address search text is sent through the ScootRadar API, with the language the app is
          shown in, to Geoapify, a search service on OpenStreetMap and other open data run by a
          company in Cyprus on servers in the European Union. When the map shows a city or less,
          the centre of the map, rounded to about a kilometre, is sent with it so that places
          nearby come first; when you follow your location, that centre is near you. When you
          type an address followed by a city in the ScootRadar catalogue, that city&apos;s centre
          is sent instead. Without a centre, the country of your device&apos;s time zone, such as
          &ldquo;US&rdquo;, worked out on the device, is sent so that places in that country come
          first. Geoapify generally keeps the data of a successful request for no
          longer than 24 hours. When Geoapify cannot answer or finds nothing, the same is
          also sent to Photon, a search service on OpenStreetMap data run by komoot in
          Germany. ScootRadar does not send your IP address with them. Cities in the ScootRadar
          catalogue are found without contacting either; their names are still sent to
          Geoapify, to find other towns of the same name. The current app sends search text in
          the request body, and instructs browsers and intermediary caches not to store the
          request or response.
        </p>

        <h2>Mobility data</h2>
        <p>
          Live vehicle data comes from the public data feeds that mobility providers and public
          authorities publish, such as the Open data platform mobility Switzerland. ScootRadar
          filters that data to the visible map area and does not build a history of vehicle
          movements.
        </p>

        <h2>Usage analytics</h2>
        <p>
          The public website and iOS app send page or screen views and actions to our
          self-hosted Umami service at u.plhery.com. These include which page of the website
          you view, a guide for example, and whether you open the map from it; searches (only
          result counts), filters, map selections, directions and rental button taps, settings
          changes, and generic error outcomes. Events distinguish web, installed web app, and iOS usage.
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
          Usage analytics is on by default. You can turn it off below, or in the iOS app under
          Settings › About › Privacy.
          The website also respects Do Not Track and Global Privacy Control. This browser
          preference is saved locally and does not affect your iOS setting.
        </p>
        <p><AnalyticsPreference /></p>

        <h2>Local storage and service worker</h2>
        <p>
          Appearance, map style, language, filters, the ride length you choose for price
          estimates and, in the iOS app, the ride passes you enter are stored locally on your
          device, as is the fact that this device has found
          your location before (a yes or no, never the position). For its rating prompt the iOS
          app also keeps the number of days you used it, the time you last tapped
          &ldquo;Open in&rdquo; and when it last asked. Precise map origins are not persisted, and
          the places you choose in the search are kept in memory only, until you close the app.
          The iOS app keeps on your device the ride and parking zones of the cities it downloads
          them for, such as Berlin, fetched from ScootRadar&apos;s website the first time the map
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

        <h2>Error reports</h2>
        <p>
          When the server fails to answer a map request, an error report is sent to Sentry, in the
          United States, so we can reproduce the failure. It holds the request URL, with the visible
          map bounds, zoom level and filters, and the state of the server at the time. It never
          includes your IP address, request headers or search text. Sentry keeps these reports for
          up to 90 days.
        </p>

        <h2>Your choices</h2>
        <p>
          You can withdraw location permission at any time in your browser or device settings, and
          turn off usage analytics as described above; the map works without either. Nothing
          ScootRadar keeps is linked to an account or to you. To ask about an error report or have
          it deleted before its 90 days are up, write to us with the time and the place on the
          map, and we will delete it.
        </p>

        <h2 id="contact">Contact and third parties</h2>
        <p>
          Questions and requests can be sent to <a href="mailto:hello@scootradar.com">hello@scootradar.com</a>.
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
