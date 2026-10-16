import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CLIENT_PARAMETERS } from '@/lib/clientParams';
import { MAP_PATH, mapAt } from '@/lib/mapAddress';

// The file that lets iOS open links to the map in the app (universal links),
// and the app's side of it: ios/ScootRadar/ScootRadar.entitlements and
// ios/ScootRadar/Models/ScooterMapLink.swift.
type Component = { '/': string; '?'?: Record<string, string>; exclude?: boolean };

const association = JSON.parse(readFileSync('public/.well-known/apple-app-site-association', 'utf8')) as {
  applinks: { details: { appIDs: string[]; components: Component[] }[] };
};
const project = readFileSync('ios/ScootRadar.xcodeproj/project.pbxproj', 'utf8');
const components = association.applinks.details.flatMap(detail => detail.components);

// Enough of Apple's matching for these components: whole paths and required query items.
function opensInApp(address: string): boolean {
  const url = new URL(address, 'https://scootradar.com');
  return components.some(component =>
    !component.exclude &&
    component['/'] === url.pathname &&
    Object.keys(component['?'] ?? {}).every(name => (url.searchParams.get(name) ?? '') !== ''),
  );
}

describe('apple-app-site-association', () => {
  it('names the app as the Xcode project builds it', () => {
    const teams = new Set([...project.matchAll(/DEVELOPMENT_TEAM = (\w+);/g)].map(match => match[1]));
    const bundle = /PRODUCT_BUNDLE_IDENTIFIER = (com\.plhery\.scootradar);/.exec(project)?.[1];
    expect(teams.size).toBe(1);
    expect(association.applinks.details.map(detail => detail.appIDs)).toEqual([[`${[...teams][0]}.${bundle}`]]);
  });

  it('is claimed by the app for the canonical host only', () => {
    const entitlements = readFileSync('ios/ScootRadar/ScootRadar.entitlements', 'utf8');
    expect([...entitlements.matchAll(/<string>(applinks:[^<]+)<\/string>/g)].map(match => match[1]))
      .toEqual(['applinks:scootradar.com']);
    expect(project).toContain('CODE_SIGN_ENTITLEMENTS = ScootRadar/ScootRadar.entitlements;');
  });

  it('opens the links to the map in the app and leaves the pages of the site in the browser', () => {
    expect(opensInApp(MAP_PATH)).toBe(true);
    expect(opensInApp(mapAt([47.3769, 8.5417]))).toBe(true);
    expect(opensInApp('/?origin=47.3769,8.5417')).toBe(true);
    for (const page of ['/', '/de', '/guides', '/privacy', '/api/scooters', '/?ref=newsletter']) {
      expect(opensInApp(page), page).toBe(false);
    }
  });

  it('matches what the app reads from a link', () => {
    const swift = readFileSync('ios/ScootRadar/Models/ScooterMapLink.swift', 'utf8');
    const parameters = /static let parameters = \[([^\]]+)\]/.exec(swift)?.[1].match(/"[^"]+"/g)?.map(name => JSON.parse(name));
    expect(parameters).toEqual([...CLIENT_PARAMETERS]);
    expect(swift).toContain('"scootradar.com"');
  });
});
