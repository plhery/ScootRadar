import CoreLocation
import MapKit

/// Where the map opens when it may not use the iPhone's location: the covered
/// city nearest the main place of the iPhone's time zone, framed as a city
/// total frames it when tapped, as on the web (src/lib/startPlace.ts). The
/// zone says roughly where the rider is without asking anyone, and nothing
/// leaves the iPhone. A zone the table does not know, such as UTC, or with no
/// covered city near, opens on Switzerland, as before.
/// scripts/generate-time-zones.mjs makes the table, TimeZones.generated.swift.
enum ScooterStartPlace {
    /// How far across a border a zone may open when its own country has no
    /// covered city: Europe/Monaco on Nice.
    static let neighbourReachMeters: CLLocationDistance = 150_000

    /// The covered city nearest the zone's main place in the zone's country
    /// (Europe/Berlin opens on Berlin, America/Chicago on the US city nearest
    /// Chicago), or within 150 km of it when the country has none.
    static func city(
        forTimeZone identifier: String,
        in cities: [ScooterCity] = ScooterCityCatalog.cities
    ) -> ScooterCity? {
        guard let zone = zone(identifier) else { return nil }
        let origin = CLLocation(latitude: zone.point.latitude, longitude: zone.point.longitude)
        let distances = cities.map { city in
            (city, origin.distance(from: CLLocation(latitude: city.center.latitude, longitude: city.center.longitude)))
        }
        if let home = distances.filter({ $0.0.countryCode == zone.countryCode }).min(by: { $0.1 < $1.1 }) {
            return home.0
        }
        guard let neighbour = distances.min(by: { $0.1 < $1.1 }), neighbour.1 <= neighbourReachMeters else {
            return nil
        }
        return neighbour.0
    }

    /// The country of a time zone, "US" for America/Chicago, which the address
    /// search sends instead of a map centre so that its places come first; nil
    /// for a zone the table does not know, such as UTC.
    static func country(forTimeZone identifier: String) -> String? {
        zone(identifier)?.countryCode
    }

    private static func zone(_ identifier: String) -> ScooterTimeZonePlace? {
        ScooterTimeZones.places[identifier]
            ?? ScooterTimeZones.aliases[identifier].flatMap { ScooterTimeZones.places[$0] }
    }

    /// The zoom asked for at a city's tapped span on an iPhone, until the map reports its own.
    static let cityZoom = 12

    /// Where the map opens: the start city at the span of a tapped city total,
    /// or all of Switzerland.
    static func start(
        forTimeZone identifier: String,
        in cities: [ScooterCity] = ScooterCityCatalog.cities
    ) -> ScooterMapStart {
        guard let city = city(forTimeZone: identifier, in: cities) else { return .switzerland }
        let span = MapFocusRequest.city(city.center, token: 0)
        return ScooterMapStart(
            region: MKCoordinateRegion(
                center: city.center.coordinate,
                latitudinalMeters: span.latitudinalMeters,
                longitudinalMeters: span.longitudinalMeters
            ),
            zoom: cityZoom
        )
    }
}

/// The region the map opens on and the zoom scooters are asked for until the
/// map reports its own.
struct ScooterMapStart: Sendable {
    let region: MKCoordinateRegion
    let zoom: Int

    var center: GeoPoint {
        GeoPoint(latitude: region.center.latitude, longitude: region.center.longitude)
    }

    static let switzerlandCenter = GeoPoint(latitude: 46.8182, longitude: 8.2275)

    /// All of Switzerland, where every rider opened before.
    static let switzerland = ScooterMapStart(
        region: MKCoordinateRegion(
            center: switzerlandCenter.coordinate,
            latitudinalMeters: 300_000,
            longitudinalMeters: 500_000
        ),
        zoom: 8
    )
}
