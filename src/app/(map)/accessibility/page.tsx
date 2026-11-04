import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { SMART_APP_BANNER, smartAppBanner } from '@/lib/appStore';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Accessibility — ScootRadar',
  description: 'Which accessibility features the ScootRadar app for iPhone and iPad supports, and what is still being worked on.',
  alternates: { canonical: '/accessibility' },
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
        </ul>

        <h2>Still working on</h2>
        <ul>
          <li>
            <strong>VoiceOver and Voice Control:</strong> testing on a device, keeping VoiceOver on
            the search while it is open, and describing the map&apos;s zones to someone who
            can&apos;t see them.
          </li>
          <li>
            <strong>Differentiate Without Color Alone:</strong> on the map, some providers&apos; dots
            differ only by colour.
          </li>
          <li>
            <strong>Sufficient Contrast:</strong> the pills on the map, the parking &ldquo;P&rdquo; and
            the dots in light mode.
          </li>
        </ul>

        <h2 id="contact">Report a problem</h2>
        <p>
          Write to <a href="mailto:hello@scootradar.com">hello@scootradar.com</a>. Tell us which
          device and which screen, and the feature you use, such as VoiceOver or Larger Text.
        </p>

        <p>Last updated 4 November 2026</p>
      </article>
    </main>
  );
}
