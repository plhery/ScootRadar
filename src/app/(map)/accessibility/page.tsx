import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { SMART_APP_BANNER, smartAppBanner } from '@/lib/appStore';
import { MAP_SHARE_IMAGE, SITE_NAME, SITE_URL } from '@/lib/site';

const TITLE = 'Accessibility — ScootRadar';
const DESCRIPTION =
  'Which accessibility features the ScootRadar app for iPhone and iPad supports, what comes next, and its known gaps, with what to do meanwhile.';

// A shared link names this page, not the map: the layout's openGraph and twitter are the map's,
// and a page that sets either replaces the whole of it.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/accessibility' },
  openGraph: {
    type: 'website',
    url: '/accessibility',
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
  other: { [SMART_APP_BANNER]: smartAppBanner(new URL('/accessibility', SITE_URL)) },
};

// Light whatever the appearance of the app, as the privacy notice is.
export const viewport: Viewport = {
  themeColor: '#f5f4f1',
};

/**
 * The App Store's Accessibility URL: what the app on the App Store, for iPhone and iPad, does
 * for each accessibility feature, by Apple's names for them. "Works today" lists exactly the
 * features declared in App Store Connect; change the two together.
 */
export default function AccessibilityPage() {
  return (
    <main className="legal-page">
      <article className="legal-content">
        <Link className="legal-back" href="/map">← Back to ScootRadar</Link>
        <h1>Accessibility</h1>
        <p>This page is about the ScootRadar app on the App Store, for iPhone and iPad.</p>

        <h2>Works today</h2>
        <p>The App Store lists two accessibility features for ScootRadar, on iPhone and iPad:</p>
        <ul>
          <li>
            <strong>Dark Interface:</strong> Settings › Appearance › Dark keeps the whole app dark,
            and so does System when the device is in Dark Mode. The default, Automatic, follows the
            sun: light by day, dark at night.
          </li>
          <li>
            <strong>Reduced Motion:</strong> with Reduce Motion on, the map goes straight to its new
            place without zooming or sliding there: when you tap a cluster, pick a scooter, show the
            walk to it or go back to where you are.
          </li>
        </ul>

        <h2>In the next update</h2>
        <p>These fixes are built, but not released yet. They come with the version after 1.3.0.</p>
        <ul>
          <li>
            <strong>Voice Control:</strong> the search bar, the nearest-scooter button, the price and
            the battery presets answer to the words they show.
          </li>
          <li>
            <strong>Larger Text:</strong> at twice the standard text size and above, the zone legend
            stays between the search bar and the scooter&apos;s card, and scrolls when it doesn&apos;t
            fit, so the card stays on the screen. In Filters, providers&apos; names no longer break
            inside a word. On the map, the names and walking times grow with the text size up to
            twice their size, and the counts grow as far as their circles allow. A name with no room
            to show whole is left out rather than cut off.
          </li>
          <li>
            <strong>Icons:</strong> icons grow with the text size.
          </li>
          <li>
            <strong>Sufficient Contrast:</strong> on a provider&apos;s colour, the selected
            scooter&apos;s name, the initials on the dots and on the card, and the parking
            &ldquo;P&rdquo; are written in white or near black, whichever reads better, at least 4.5
            to 1. The small grey text in Settings is darker.
          </li>
          <li>
            <strong>Differentiate Without Color Alone:</strong> the chosen tile in Settings shows a
            checkmark.
          </li>
        </ul>

        <h2>Still working on</h2>
        <ul>
          <li>
            <strong>VoiceOver and Voice Control:</strong> testing on a device, keeping VoiceOver on
            the search while it is open, and describing the map&apos;s zones to someone who
            can&apos;t see them.
          </li>
        </ul>

        <h2>Known gaps</h2>
        <p>
          We are keeping the map&apos;s look as it is, so these two stay for now. Here is what you can
          do meanwhile.
        </p>
        <ul>
          <li>
            <strong>Differentiate Without Color Alone:</strong> some providers&apos; dots differ only
            by colour. Lime&apos;s and Bolt&apos;s are both green, for example. Tap a dot and its card
            names the provider. Zoomed in to the street, the scooters nearest you show the
            provider&apos;s name and the minutes&apos; walk beside them. In Filters, you can turn off
            the providers you don&apos;t use.
          </li>
          <li>
            <strong>Sufficient Contrast:</strong> on the light map, the dots stand out from the map
            less than Apple asks. They stand out more on the dark map: choose Settings › Appearance ›
            Dark. On the dark map, though, the red edge of a zone where riding is forbidden stands
            out less than Apple asks; on the light map it stands out enough. The system&apos;s
            Increase Contrast setting doesn&apos;t change the dots or the zones.
          </li>
        </ul>

        <h2 id="contact">Report a problem</h2>
        <p>
          Write to <a href="mailto:hello@scootradar.com">hello@scootradar.com</a>. Tell us which
          device and which screen, and the feature you use, such as VoiceOver or Larger Text.
        </p>

        <p>Last updated 6 November 2026</p>
      </article>
    </main>
  );
}
