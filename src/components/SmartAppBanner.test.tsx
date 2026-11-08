// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it } from 'vitest';
import SmartAppBanner from '@/components/SmartAppBanner';
import { smartAppBanner } from '@/lib/appStore';

const tags = () => [...document.querySelectorAll<HTMLMetaElement>('meta[name="apple-itunes-app"]')].map(tag => tag.content);
// The map as the Worker sends it when opened from a link to a place.
const sent = smartAppBanner('https://scootradar.com/map?origin=47.3769,8.5417');
let root: Root | undefined;

/** The page as it starts in the browser: React takes up the document it was sent, with `banner` in its head. */
async function arrive(page: ReactNode, banner?: string) {
  if (banner) {
    const tag = document.createElement('meta');
    tag.name = 'apple-itunes-app';
    tag.content = banner;
    document.head.appendChild(tag);
  }
  const body = document.body.appendChild(document.createElement('div'));
  await act(async () => { root = hydrateRoot(body, page); });
}

const open = (page: ReactNode) => act(async () => { root!.render(page); });

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.head.replaceChildren();
  document.body.replaceChildren();
});

it('takes up the tag the page came with, which opens the app on the link, and adds none', async () => {
  await arrive(<SmartAppBanner page="/map" />, sent);
  expect(tags()).toEqual([sent]);
});

it('gives a page opened after it its own address, and leaves the link of the first one nowhere', async () => {
  await arrive(<SmartAppBanner key="/map" page="/map" />, sent);
  await open(<SmartAppBanner key="/privacy" page="/privacy" />);
  expect(tags()).toEqual([smartAppBanner('https://scootradar.com/privacy')]);
  await open(<SmartAppBanner key="/map" page="/map" />);
  expect(tags()).toEqual([smartAppBanner('https://scootradar.com/map')]);
});

it('names its own address on a page that came without the tag', async () => {
  await arrive(<SmartAppBanner page="/de" />);
  expect(tags()).toEqual([smartAppBanner('https://scootradar.com/de')]);
});
