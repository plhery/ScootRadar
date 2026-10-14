import Analytics from "@/components/Analytics";
import type { Metadata, Viewport } from "next";
import { Geist, Red_Hat_Display, Red_Hat_Text } from "next/font/google";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { FIRST_PAINT_THEME_SCRIPT } from "@/lib/firstPaintTheme";
import { formatLocale } from "@/lib/formatLocale";
import { I18nProvider } from "@/lib/i18n";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// The typefaces of the landing page: Display for figures and titles, Text for
// what is read, on the map's own names as well.
const display = Red_Hat_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const text = Red_Hat_Text({
  variable: "--font-text",
  subsets: ["latin"],
  display: "swap",
});

// The map is one address in every language; what a search engine reads of it is in English.
const TITLE = "Live e-scooter map: Lime, Bolt, Bird, Voi, Dott | ScootRadar";
const DESCRIPTION =
  "Every shared e-scooter near you on a live map: Lime, Bolt, Bird, Voi, Dott, Hopp, Pony, PubliBike and Zeus, with battery, walking time and price. Free, no account.";
// The picture of the English landing page, scripts/generate-share-images.mjs.
const SHARE_IMAGE = {
  url: "/share/en.png",
  width: 1200,
  height: 630,
  alt: "Every e-scooter on one map: the app at night by Zürich main station, beside the initials of nine providers.",
};

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
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [SHARE_IMAGE],
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
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
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
