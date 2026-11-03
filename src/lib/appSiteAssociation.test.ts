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

// The Android app's side of the same links (App Links): the verified intent filter in
// android/app/src/main/AndroidManifest.xml and android/core/src/main/kotlin/com/plhery/scootradar/core/model/ScooterMapLink.kt.
// Android claims "/" whole; the app hands a "/" without an origin on to the browser, as the association leaves it on the web.
describe('the Android app’s links', () => {
  const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  const kotlin = readFileSync('android/core/src/main/kotlin/com/plhery/scootradar/core/model/ScooterMapLink.kt', 'utf8');
  const filter = /<intent-filter android:autoVerify="true">([\s\S]*?)<\/intent-filter>/.exec(manifest)?.[1] ?? '';
  const claimed = (attribute: string) =>
    [...filter.matchAll(new RegExp(`android:${attribute}="([^"]+)"`, 'g'))].map(match => match[1]);
  const listed = (pattern: RegExp) => pattern.exec(kotlin)?.[1].match(/"[^"]+"/g)?.map(name => JSON.parse(name));

  it('claims the paths the association opens, on the hosts the app reads', () => {
    // One verified filter, and whole paths: a prefix or a pattern would take the pages of the site too.
    expect(manifest.match(/android:autoVerify="true"/g)).toHaveLength(1);
    expect(filter).not.toMatch(/android:path\w+=/);
    expect(claimed('scheme')).toEqual(['https']);
    expect(claimed('path').sort())
      .toEqual(components.filter(component => !component.exclude).map(component => component['/']).sort());
    // www besides, unlike the iPhone's entitlement: it opens the app only once www serves assetlinks.json itself.
    expect(claimed('host').sort()).toEqual(listed(/val hosts: Set<String> = setOf\(([^)]+)\)/)?.sort());
    expect(claimed('host')).toContain('scootradar.com');
  });

  it('matches what the app reads from a link', () => {
    expect(listed(/val parameters: List<String> = listOf\(([^)]+)\)/)).toEqual([...CLIENT_PARAMETERS]);
  });

  // The site's side, which verifies the filter: Play App Signing's certificate (Play Console › App signing), the one
  // every copy from Google Play is signed with. The application id can never change once the app is on Play.
  it('is verified by the site for the app Gradle builds, signed by Google Play', () => {
    const links = JSON.parse(readFileSync('public/.well-known/assetlinks.json', 'utf8')) as {
      relation: string[];
      target: { namespace: string; package_name: string; sha256_cert_fingerprints: string[] };
    }[];
    const gradle = readFileSync('android/app/build.gradle.kts', 'utf8');
    expect(links).toHaveLength(1);
    expect(links[0].relation).toEqual(['delegate_permission/common.handle_all_urls']);
    expect(links[0].target.namespace).toBe('android_app');
    expect(links[0].target.package_name).toBe(/applicationId = "([^"]+)"/.exec(gradle)?.[1]);
    expect(links[0].target.sha256_cert_fingerprints).toEqual([
      '2B:7A:F8:0C:CC:BC:0D:07:BA:DB:DD:7A:74:27:4B:20:A8:B6:DD:BB:93:D1:82:1E:33:0F:45:D9:6F:95:DB:6E',
    ]);
    expect(readFileSync('public/_headers', 'utf8')).toMatch(/\/\.well-known\/assetlinks\.json\n {2}Content-Type: application\/json/);
  });
});
