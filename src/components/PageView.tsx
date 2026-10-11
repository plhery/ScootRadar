'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics';

/** Counts a view of a page that is not the app: nothing is opened or installed here. */
export default function PageView() {
  const pathname = usePathname();
  useEffect(() => {
    track();
  }, [pathname]);
  return null;
}
