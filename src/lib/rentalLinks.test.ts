import { describe, expect, it } from 'vitest';
import type { Vehicle } from '@/lib/types';
import {
  browserRentalLink,
  legacyRentalLink,
  normalizeRentalUris,
  operatorAppLink,
  rentalLinkForPlatform,
  rentalPlatform,
  safeRentalUri,
} from '@/lib/rentalLinks';

function vehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    provider: 'dott',
    lat: 47.3769,
    lng: 8.5417,
    battery: 80,
    range_m: 10_000,
    vehicle_id: 'dott:1',
    deep_link: null,
    distance_m: null,
    ...overrides,
  };
}

describe('rental links', () => {
  it('preserves a trusted universal fallback for every platform', () => {
    const link = 'https://app.hopp.bike/launch/vehicle-1?direct';

    const rentalUris = normalizeRentalUris('hopp', undefined, link);

    expect(rentalUris).toEqual({ ios: link, android: link, web: link });
    expect(legacyRentalLink(rentalUris)).toBe(link);
  });

  it('rejects script URLs, cross-provider schemes, spoofed hosts, and credentials', () => {
    expect(safeRentalUri('lime', 'javascript:alert(1)')).toBeNull();
    expect(safeRentalUri('lime', 'bolt://action/rent')).toBeNull();
    expect(safeRentalUri('hopp', 'https://app.hopp.bike.example.com/launch/1')).toBeNull();
    expect(safeRentalUri('hopp', 'https://user@app.hopp.bike/launch/1')).toBeNull();
  });

  it('leaves out the IMEI that names a Ryde scooter past its rotating id', () => {
    expect(normalizeRentalUris('ryde', {
      ios: 'https://new-web-platform.ryde.vip/app/ios.html?deviceIMEI=860000000000001',
      android: 'https://new-web-platform.ryde.vip/app/android.html?deviceIMEI=860000000000001',
    })).toEqual({
      ios: 'https://new-web-platform.ryde.vip/app/ios.html',
      android: 'https://new-web-platform.ryde.vip/app/android.html',
      web: null,
    });
  });

  it('keeps the link to each Ride Mobility scooter, on its own host only', () => {
    const link = 'https://ridemobility.app.link/475216';
    expect(normalizeRentalUris('ride_mobility', { ios: link, android: link, web: 'https://ridemobility.app.link/' }))
      .toEqual({ ios: link, android: link, web: 'https://ridemobility.app.link/' });
    // Hoppy runs on the same platform, and Ryde sounds the same: neither takes the other's links.
    expect(safeRentalUri('ride_mobility', 'https://ride-hoppy.app.link/400202')).toBeNull();
    expect(safeRentalUri('ryde', link)).toBeNull();
  });

  it('keeps the link to each Yoio scooter, on its own host only', () => {
    const link = 'https://rideyoio.app.link/1072';
    expect(normalizeRentalUris('yoio', { ios: link, android: link, web: 'https://rideyoio.app.link/' }))
      .toEqual({ ios: link, android: link, web: 'https://rideyoio.app.link/' });
    // The other operators on ATOM Mobility don't take Yoio's links, nor Yoio theirs.
    expect(safeRentalUri('yoio', 'https://ridemobility.app.link/475216')).toBeNull();
    expect(safeRentalUri('ride_mobility', link)).toBeNull();
  });

  it('keeps the link to each Elerent scooter, on its own host only', () => {
    const link = 'https://elerent.app.link/CAT0059';
    expect(normalizeRentalUris('elerent', { ios: link, android: link, web: 'https://elerent.app.link/' }))
      .toEqual({ ios: link, android: link, web: 'https://elerent.app.link/' });
    expect(safeRentalUri('elerent', 'https://ride-hoppy.app.link/600332')).toBeNull();
    expect(safeRentalUri('hoppy', link)).toBeNull();
  });

  it('keeps the link to each 3electra scooter, on its own host only', () => {
    const link = 'https://zelectra.app.link/Z3106';
    expect(normalizeRentalUris('zelectra', { ios: link, android: link, web: 'https://zelectra.app.link/' }))
      .toEqual({ ios: link, android: link, web: 'https://zelectra.app.link/' });
    expect(safeRentalUri('zelectra', 'https://elerent.app.link/CAT0059')).toBeNull();
    expect(safeRentalUri('elerent', link)).toBeNull();
  });

  it('keeps the link to each SAHAM scooter, which ends in the number on it, on its own host only', () => {
    const link = 'https://ride-saham.app.link/0131';
    expect(normalizeRentalUris('saham', { ios: link, android: link, web: 'https://ride-saham.app.link/' }))
      .toEqual({ ios: link, android: link, web: 'https://ride-saham.app.link/' });
    expect(safeRentalUri('saham', 'https://ride-hoppy.app.link/600332')).toBeNull();
    expect(safeRentalUri('hoppy', link)).toBeNull();
  });

  it('keeps Flamingo\'s two links to each scooter, which differ by phone, and gives the web neither', () => {
    const id = '8bee7d68e6cd88526d26554ab337e57d89cc0ea5316f5c71802205230b2ebcee';
    const rentalUris = normalizeRentalUris('flamingo', {
      ios: `https://ride.flamingoscooters.com/vehicle/${id}`,
      android: `https://ride.flamingoscooters.com/v/${id}`,
    });
    expect(rentalUris).toEqual({
      ios: `https://ride.flamingoscooters.com/vehicle/${id}`,
      android: `https://ride.flamingoscooters.com/v/${id}`,
      web: null,
    });
    expect(legacyRentalLink(rentalUris)).toBeNull();
    expect(safeRentalUri('flamingo', `https://ride.flamingoscooters.com.example.com/v/${id}`)).toBeNull();
    expect(safeRentalUri('jolt', `https://ride.flamingoscooters.com/v/${id}`)).toBeNull();
  });

  it('keeps the link to each JOLT scooter, on its own host only', () => {
    const link = 'https://joltscooters.co.nz/vehicle/79f33e40-ee98-4909-b815-d3e35795bd5d';
    const rentalUris = normalizeRentalUris('jolt', { ios: link, android: link });
    expect(rentalUris).toEqual({ ios: link, android: link, web: null });
    expect(legacyRentalLink(rentalUris)).toBe(link);
    expect(safeRentalUri('flamingo', link)).toBeNull();
  });

  it('keeps the link to each Veo scooter, which names it by its number, on Veo\'s Adjust host only', () => {
    const link = 'https://gmjc.adj.st/?adj_t=5vyf0nr&number=10103344';
    expect(normalizeRentalUris('veo', { ios: link, android: link })).toEqual({ ios: link, android: link, web: null });
    // Voi's Adjust host is another app's.
    expect(safeRentalUri('veo', 'https://lqfa.adj.st/open?vehicle=1')).toBeNull();
    expect(safeRentalUri('voi', link)).toBeNull();
  });

  it('keeps Lyft\'s one link per city, which opens its code scanner', () => {
    for (const link of ['https://chi.lft.to/lastmile_qr_scan', 'https://lyft.biketownpdx.com/lastmile_qr_scan']) {
      expect(normalizeRentalUris('lyft', { ios: link, android: link })).toEqual({ ios: link, android: link, web: null });
    }
    expect(safeRentalUri('lyft', 'https://lft.to.example.com/lastmile_qr_scan')).toBeNull();
  });

  it('opens Hopp, Bolt\'s app in Washington, DC, on the scooter, and not Bolt\'s European app', () => {
    const link = 'bolt-hopp://action/rentalsSelectVehicleByRotatedUuid?rotated_uuid=8d8f81ed-a45a-4ad8-b33c-1a5ad04c5965';
    expect(normalizeRentalUris('bolt_hopp', { ios: link, android: link })).toEqual({ ios: link, android: link, web: null });
    expect(safeRentalUri('bolt', link)).toBeNull();
    expect(safeRentalUri('bolt_hopp', 'bolt://action/rentalsSelectVehicleByRotatedUuid?rotated_uuid=1')).toBeNull();
    // The Icelandic Hopp is another company, with other links.
    expect(safeRentalUri('hopp', link)).toBeNull();
  });

  it('never opens the charger sign-up that Bird and Spin give as their app\'s address, in any country', () => {
    for (const provider of ['bird', 'spin']) {
      for (const link of ['bird://charger-onboarding', 'bird://Charger-Onboarding?source=gbfs']) {
        expect(safeRentalUri(provider, link)).toBeNull();
        expect(normalizeRentalUris(provider, { ios: link, android: link }, link)).toEqual({ ios: null, android: null, web: null });
      }
    }
    // Bird's other links still open its app.
    expect(safeRentalUri('bird', 'bird://scooter/ABC123')).toBe('bird://scooter/ABC123');
  });

  it('selects only the link intended for the current mobile platform', () => {
    const ios = 'https://go.ridedott.com/vehicles/1?platform=ios';
    const android = 'https://go.ridedott.com/vehicles/1?platform=android';
    const scooter = vehicle({
      rental_uris: { ios, android, web: null },
    });

    expect(rentalLinkForPlatform(scooter, 'ios')).toBe(ios);
    expect(rentalLinkForPlatform(scooter, 'android')).toBe(android);
    expect(rentalLinkForPlatform(scooter, 'web')).toBeNull();
  });

  it('does not offer a custom app scheme to desktop browsers', () => {
    const scooter = vehicle({
      provider: 'bolt',
      deep_link: 'bolt://action/rentalsSelectVehicleByRotatedUuid?rotated_uuid=1',
      rental_uris: {
        ios: 'bolt://action/rentalsSelectVehicleByRotatedUuid?rotated_uuid=1',
        android: 'bolt://action/rentalsSelectVehicleByRotatedUuid?rotated_uuid=1',
        web: null,
      },
    });

    expect(rentalLinkForPlatform(scooter, 'web')).toBeNull();
    expect(rentalLinkForPlatform(scooter, 'ios')).toContain('bolt://');
  });

  it('detects Android, iOS, iPadOS, and desktop clients', () => {
    expect(rentalPlatform('Mozilla/5.0 (Linux; Android 16)')).toBe('android');
    expect(rentalPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 26_0)')).toBe('ios');
    expect(rentalPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 5)).toBe('ios');
    expect(rentalPlatform('Mozilla/5.0 (X11; Linux x86_64)')).toBe('web');
  });

  it('uses browser detection before selecting a link', () => {
    const scooter = vehicle({
      rental_uris: {
        ios: 'https://go.ridedott.com/vehicles/1?platform=ios',
        android: 'https://go.ridedott.com/vehicles/1?platform=android',
        web: null,
      },
    });

    expect(browserRentalLink(scooter, 'Mozilla/5.0 (Linux; Android 16)')).toContain(
      'platform=android'
    );
  });

  it('opens Lime’s, Bird’s, PubliBike’s and Spin’s apps on phones, where their feeds link no scooter', () => {
    expect(operatorAppLink('lime', 'ios')).toBe('https://lime.bike/');
    expect(operatorAppLink('lime', 'android')).toBe('https://lime.bike/');
    expect(operatorAppLink('bird', 'ios')).toBe('https://ride.bird.co/');
    expect(operatorAppLink('publibike', 'android')).toBe('https://app.publibike.ch/');
    // Spin's app claims no link, so its site opens, as the user chose on 23 October 2026.
    expect(operatorAppLink('spin', 'ios')).toBe('https://www.spin.app/');
    // A computer has no app to open, and other operators' feeds link their scooters.
    expect(operatorAppLink('bird', 'web')).toBeNull();
    expect(operatorAppLink('dott', 'ios')).toBeNull();
    expect(operatorAppLink('unknown', 'android')).toBeNull();
  });

  it('keeps each operator’s app link among the links allowed for that operator', () => {
    for (const provider of ['lime', 'bird', 'publibike', 'spin']) {
      const link = operatorAppLink(provider, 'ios');
      expect(safeRentalUri(provider, link, { httpsOnly: true })).toBe(link);
    }
  });
});
