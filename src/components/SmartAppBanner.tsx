'use client';

import { useState } from 'react';
import { SMART_APP_BANNER, smartAppBanner } from '@/lib/appStore';
import { SITE_URL } from '@/lib/site';

/** The path of the page a banner's tag opens the app on. */
function openedPath(content: string): string | undefined {
  const argument = content.match(/app-argument=([^,]*)/)?.[1];
  return argument && URL.canParse(argument) ? new URL(argument).pathname : undefined;
}

/**
 * Safari's Smart App Banner on the page at `page`, a path of the site, for the iPhone app to open on.
 * The page is built with its own address, and the Worker (worker.ts), or the service worker for the
 * map it keeps (public/sw.js), writes in the link it was opened with. React keeps the document's
 * <meta> only when it renders the same content, and otherwise adds its own after it: two tags naming
 * two places, the first left on every page opened from there. So the page the document is takes up
 * the tag it came with, and a page opened after has its own address.
 */
export default function SmartAppBanner({ page }: Readonly<{ page: string }>) {
  const [content] = useState(() => {
    const own = smartAppBanner(new URL(page, SITE_URL));
    if (typeof document === 'undefined') return own;
    const sent = document.querySelector<HTMLMetaElement>(`meta[name="${SMART_APP_BANNER}"]`)?.content;
    return sent && openedPath(sent) === new URL(page, SITE_URL).pathname ? sent : own;
  });
  return <meta name={SMART_APP_BANNER} content={content} />;
}
