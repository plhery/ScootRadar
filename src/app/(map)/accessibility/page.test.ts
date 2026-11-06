import { expect, it } from 'vitest';
import { metadata } from './page';

it('is shared as the accessibility page, not as the map', () => {
  expect(metadata.openGraph?.url).toBe('/accessibility');
  expect(metadata.openGraph?.title).toBe(metadata.title);
  expect(metadata.openGraph?.description).toBe(metadata.description);
  expect(metadata.twitter?.title).toBe(metadata.title);
  expect(metadata.twitter?.description).toBe(metadata.description);
});

it('says in its description that it lists the known gaps, in the 160 characters a search engine shows', () => {
  expect(String(metadata.description)).toContain('known gaps');
  expect(String(metadata.description).length).toBeLessThanOrEqual(160);
});
