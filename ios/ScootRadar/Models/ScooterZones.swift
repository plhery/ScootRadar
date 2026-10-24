import Foundation
import UIKit

/// What a zone forbids a scooter: riding in it at all, ending a ride in it,
/// or going fast (src/lib/zones.ts).
enum ScooterZoneKind: String, CaseIterable, Sendable {
    case noRide
    case noParking
    case slow

    /// The fills are laid down in this order, the strongest rule on top, as on the web.
    static let belowFirst: [ScooterZoneKind] = [.slow, .noParking, .noRide]

    var label: String {
        switch self {
        case .noRide: String(localized: "No riding")
        case .noParking: String(localized: "No parking")
        case .slow: String(localized: "Slow")
        }
    }
}

/// One of the zones an operator publishes (GBFS geofencing_zones), as the
/// server keeps it: simplified, and only those a scooter must mind now.
struct ScooterZone: Equatable, Sendable, Identifiable {
    let id: String
    let provider: String
    let kind: ScooterZoneKind
    /// A slow zone's limit.
    let maxSpeedKph: Double?
    /// Polygons, each its outer ring and then its holes.
    let polygons: [[[GeoPoint]]]
}

struct ScooterZoneResponse: Equatable, Sendable {
    var zones: [ScooterZone]
    /// Some feeds' zones are still on their way: ask again in a few seconds.
    var pending: Bool
    /// Zones were left out to keep the answer small.
    var truncated: Bool
}

extension ScooterZoneResponse: Decodable {
    private enum CodingKeys: String, CodingKey { case zones, meta }
    private struct Meta: Decodable {
        let pending: Bool?
        let truncated: Bool?
    }
    /// A zone as it comes, with a kind this version may not know.
    private struct Payload: Decodable {
        let id: String
        let provider: String
        let kind: String
        let maxSpeedKph: Double?
        let polygons: [[[[Double]]]]
    }

    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let meta = try container.decodeIfPresent(Meta.self, forKey: .meta)
        pending = meta?.pending ?? false
        truncated = meta?.truncated ?? false
        // A kind added later is left out, as is a ring with too few points.
        zones = try container.decode([Payload].self, forKey: .zones).compactMap { payload in
            guard let kind = ScooterZoneKind(rawValue: payload.kind) else { return nil }
            let polygons = payload.polygons.compactMap { polygon -> [[GeoPoint]]? in
                let rings = polygon.map { ring in
                    ring.compactMap { point in
                        point.count >= 2 ? GeoPoint(latitude: point[0], longitude: point[1]) : nil
                    }
                }
                guard let outer = rings.first, outer.count >= 4 else { return nil }
                return [outer] + rings.dropFirst().filter { $0.count >= 4 }
            }
            guard !polygons.isEmpty else { return nil }
            return ScooterZone(
                id: payload.id,
                provider: payload.provider,
                kind: kind,
                maxSpeedKph: payload.maxSpeedKph,
                polygons: polygons
            )
        }
    }
}

/// The area zones are asked for: the map's, rounded out to a grid of 1/50°
/// (about 2 km), as the web asks (src/lib/useZoneData.ts), so that views near
/// each other ask the same address and one answer serves them.
struct ScooterZoneArea: Hashable, Sendable {
    /// Zones are drawn from this zoom in: further out they would cover the
    /// scooters, and weigh too much (ZONES_MIN_ZOOM).
    static let minimumZoom = 14
    /// The widest area, in degrees each way, the server answers for (ZONES_MAX_SPAN_DEGREES).
    static let maximumSpan = 1.0
    static let grid = 50.0

    /// The edges in fiftieths of a degree.
    let south: Int
    let west: Int
    let north: Int
    let east: Int

    /// Nil for an area the server would not answer for: one across the 180°
    /// line, where no operator publishes zones, or one too wide.
    init?(covering bounds: GeoBounds) {
        guard !bounds.crossesDateLine else { return nil }
        south = Int((bounds.south * Self.grid).rounded(.down))
        west = Int((bounds.west * Self.grid).rounded(.down))
        north = Int((bounds.north * Self.grid).rounded(.up))
        east = Int((bounds.east * Self.grid).rounded(.up))
        guard Double(north - south) / Self.grid <= Self.maximumSpan,
              Double(east - west) / Self.grid <= Self.maximumSpan else { return nil }
    }

    func contains(_ other: ScooterZoneArea) -> Bool {
        south <= other.south && west <= other.west && north >= other.north && east >= other.east
    }

    /// As the web writes them, "47.36" or "8.5", so both apps ask the same
    /// address. The answer is the same at every zoom, so the zoom is the least.
    var queryItems: [URLQueryItem] {
        [
            URLQueryItem(name: "south", value: Self.degrees(south)),
            URLQueryItem(name: "west", value: Self.degrees(west)),
            URLQueryItem(name: "north", value: Self.degrees(north)),
            URLQueryItem(name: "east", value: Self.degrees(east)),
            URLQueryItem(name: "zoom", value: String(Self.minimumZoom))
        ]
    }

    /// A multiple of 1/50° as JavaScript prints it: at most two decimals, none trailing.
    static func degrees(_ fiftieths: Int) -> String {
        let hundredths = abs(fiftieths) * 2
        let sign = fiftieths < 0 ? "-" : ""
        let whole = hundredths / 100
        let fraction = hundredths % 100
        if fraction == 0 { return "\(sign)\(whole)" }
        if fraction % 10 == 0 { return "\(sign)\(whole).\(fraction / 10)" }
        return "\(sign)\(whole).\(fraction < 10 ? "0" : "")\(fraction)"
    }
}

/// What the zones' legend says while they are turned on.
enum ScooterZoneState: Equatable, Sendable {
    case off
    case zoomIn
    case loading
    case shown
    case failed
}

/// How each kind of zone is drawn, as on the web (ZoneLegend.tsx, map.css):
/// how strongly it is filled, the stronger the rule the stronger the fill,
/// and its edge, solid, dashed or dotted, so that the kinds tell apart
/// without their colours. No riding is hatched too.
enum ScooterZoneLook {
    struct Edge: Sendable {
        let width: CGFloat
        /// Dash and gap lengths in points; empty for a solid edge.
        let dashes: [CGFloat]
        let roundCaps: Bool
    }

    static let edgeOpacity: CGFloat = 0.9
    /// No riding's hatching: lines this far apart and this wide, on a ground
    /// of this opacity, as the web's pattern draws it.
    static let hatchSpacing: CGFloat = 8
    static let hatchWidth: CGFloat = 2
    static let hatchGroundOpacity: CGFloat = 0.4

    /// The opacity of the whole of a kind's fills.
    static func fillOpacity(_ kind: ScooterZoneKind) -> CGFloat {
        switch kind {
        case .noRide: 0.4
        case .noParking: 0.16
        case .slow: 0.12
        }
    }

    static func edge(_ kind: ScooterZoneKind) -> Edge {
        switch kind {
        case .noRide: Edge(width: 1.5, dashes: [], roundCaps: false)
        case .noParking: Edge(width: 1.5, dashes: [6, 4], roundCaps: false)
        case .slow: Edge(width: 2, dashes: [0.1, 4], roundCaps: true)
        }
    }

    /// The web's colours: edges of 3:1 at least on the land, the parks and
    /// the streets of the light map, lighter on a dark map and on satellite.
    static func color(_ kind: ScooterZoneKind, isDark: Bool) -> UIColor {
        switch (kind, isDark) {
        case (.noRide, false): UIColor(red: 0.851, green: 0.176, blue: 0.125, alpha: 1)
        case (.noParking, false): UIColor(red: 0.753, green: 0.337, blue: 0, alpha: 1)
        case (.slow, false): UIColor(red: 0.243, green: 0.388, blue: 0.867, alpha: 1)
        case (.noRide, true): UIColor(red: 1, green: 0.412, blue: 0.38, alpha: 1)
        case (.noParking, true): UIColor(red: 1, green: 0.702, blue: 0.251, alpha: 1)
        case (.slow, true): UIColor(red: 0.486, green: 0.612, blue: 1, alpha: 1)
        }
    }
}
