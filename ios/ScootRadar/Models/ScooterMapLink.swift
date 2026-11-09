import Foundation

/// A link to the map on scootradar.com that iOS opened in the app rather than
/// in Safari (universal links: public/.well-known/apple-app-site-association).
/// It reads what the web map reads from a link (src/lib/clientParams.ts): the
/// place to open on and the battery filter. The appearance and map style in a
/// link are the website's own and are left out.
struct ScooterMapLink: Equatable, Sendable {
    static let hosts: Set<String> = ["scootradar.com", "www.scootradar.com"]
    /// What a link to the map can carry, as on the web: the map at "/" before
    /// the landing page took its place is a link to the map with one of them.
    static let parameters = ["origin", "minBattery", "theme", "map", "tile"]

    /// The place the map opens on: a city's centre on the site's own links.
    let origin: GeoPoint?
    /// A battery preset, or nil to keep the rider's own.
    let minimumBattery: Int?

    init(origin: GeoPoint? = nil, minimumBattery: Int? = nil) {
        self.origin = origin
        self.minimumBattery = minimumBattery
    }

    /// Nil for anything but a link to the map on the site.
    init?(url: URL) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              components.scheme?.lowercased() == "https",
              let host = components.host?.lowercased(),
              Self.hosts.contains(host) else { return nil }

        let items = components.queryItems ?? []
        func value(_ name: String) -> String? {
            items.first { $0.name == name }?.value
        }

        switch components.path {
        case "/map", "/map/":
            break
        case "", "/":
            guard Self.parameters.contains(where: { value($0) != nil }) else { return nil }
        default:
            return nil
        }

        self.init(
            origin: value("origin").flatMap(Self.coordinate),
            minimumBattery: value("minBattery").flatMap(Self.battery)
        )
    }

    /// "47.3769,8.5417" as the web reads it: two finite numbers in range.
    static func coordinate(_ text: String) -> GeoPoint? {
        let parts = text.split(separator: ",", omittingEmptySubsequences: false)
            .map { $0.trimmingCharacters(in: .whitespaces) }
        guard parts.count == 2,
              let latitude = Double(parts[0]), let longitude = Double(parts[1]),
              latitude.isFinite, longitude.isFinite,
              (-90 ... 90).contains(latitude), (-180 ... 180).contains(longitude) else { return nil }
        return GeoPoint(latitude: latitude, longitude: longitude)
    }

    /// Links from the slider era hold any multiple of five; they snap down to a preset.
    static func battery(_ text: String) -> Int? {
        guard let value = Double(text.trimmingCharacters(in: .whitespaces)), value.isFinite else { return nil }
        return ScooterBatteryFilter.snapped(Int(min(100, max(0, value))))
    }
}

extension ScooterCityCatalog {
    /// The city whose centre a link names. The site writes the centre as
    /// JavaScript prints the number, so a hair's difference is allowed.
    static func city(linkedAt point: GeoPoint) -> ScooterCity? {
        cities
            .filter {
                abs($0.center.latitude - point.latitude) < 0.000_5 &&
                    abs($0.center.longitude - point.longitude) < 0.000_5
            }
            .min {
                abs($0.center.latitude - point.latitude) + abs($0.center.longitude - point.longitude) <
                    abs($1.center.latitude - point.latitude) + abs($1.center.longitude - point.longitude)
            }
    }
}
