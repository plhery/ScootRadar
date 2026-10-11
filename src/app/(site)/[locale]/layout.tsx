import PageView from '@/components/PageView';
import type { Metadata, Viewport } from 'next';
import { Red_Hat_Display, Red_Hat_Text } from 'next/font/google';
import { notFound } from 'next/navigation';
import { LANDING_LOCALES, isLandingLocale } from '@/lib/landingCopy';
import '../landing.css';

// One family in two cuts: Display for the headlines and the figures, Text for
// everything that is read. Both are variable, so every weight is one file.
const display = Red_Hat_Display({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});

const text = Red_Hat_Text({
  variable: '--font-text',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://scooters.plhery.com'),
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
};

// The page is dark whatever the appearance of the system: it is the map at night.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#090b10',
  colorScheme: 'dark',
};

// Every page is served as it was built (open-next.config.ts): the four
// languages exist, and nothing else under this layout does.
export const dynamicParams = false;

export function generateStaticParams() {
  return LANDING_LOCALES.map(locale => ({ locale }));
}

// A root layout of its own, beside the one of the app: the page has its own
// language in the document, and none of the app's styles, scripts or service worker.
export default async function LandingLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLandingLocale(locale)) notFound();

  return (
    <html lang={locale} className={`${display.variable} ${text.variable}`}>
      <body>
        {children}
        <PageView />
      </body>
    </html>
  );
}
