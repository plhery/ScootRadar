import { useSyncExternalStore } from 'react';
import { isIPhone } from './appStore';

// The browser does not change under a page.
const subscribe = () => () => {};

/** An iPhone, where the map leads to the iPhone app. False on the server and until the page has hydrated. */
export function useIPhone(): boolean {
  return useSyncExternalStore(subscribe, () => isIPhone(navigator.userAgent), () => false);
}
