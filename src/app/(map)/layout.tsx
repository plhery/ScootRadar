import Analytics from "@/components/Analytics";
import type { Metadata, Viewport } from "next";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { RELEASE_META } from "@/lib/errorReportsConfig";
import { FIRST_PAINT_THEME_SCRIPT } from "@/lib/firstPaintTheme";
import { formatLocale } from "@/lib/formatLocale";
import { I18nProvider } from "@/lib/i18n";
import { ROTATE_PANES_STYLE, ROTATE_PANES_STYLE_ID } from "@/lib/mapRotation";
import { MAP_SHARE_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import { display, geistSans, text } from "../fonts";
import "../globals.css";

// The map is one address in every language; what a search engine reads of it is in English, and
// its description fits the 160 characters a search engine shows.
const TITLE = `Live e-scooter map: Lime, Bolt, Bird, Voi, Dott | ${SITE_NAME}`;
const DESCRIPTION =
  "Every e-scooter near you on a live map: Lime, Bolt, Bird, Voi, Dott, Hopp, Pony, PubliBike and Zeus, with battery, walking time and price. Free, no account.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/map" },
  openGraph: {
    type: "website",
    url: "/map",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_CH",
    images: [MAP_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [MAP_SHARE_IMAGE],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={formatLocale("en")} suppressHydrationWarning>
      <head>
        {/* Before the map's script, which adds no style of its own once this is here. */}
        <style id={ROTATE_PANES_STYLE_ID}>{ROTATE_PANES_STYLE}</style>
        {/* The commit the page is built from, as Workers Builds names it, for its error reports. */}
        {process.env.WORKERS_CI_COMMIT_SHA && <meta name={RELEASE_META} content={process.env.WORKERS_CI_COMMIT_SHA} />}
      </head>
      <body className={`${geistSans.variable} ${display.variable} ${text.variable}`}>
        <I18nProvider>{children}</I18nProvider>
        {/* Right after the page it applies to, and before anything is painted: a
            chosen Light or Dark. The same text in every response, so the service
            worker sees the same page; the Worker adds the nonce of the response. */}
        <script dangerouslySetInnerHTML={{ __html: FIRST_PAINT_THEME_SCRIPT }} />
        <ServiceWorkerRegistration />
        <Analytics />
      </body>
    </html>
  );
}
