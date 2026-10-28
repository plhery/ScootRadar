import Foundation
import UIKit

/// What a zone forbids a scooter: riding in it at all, ending a ride in it,
/// or going fast (src/lib/zones.ts); or, where a city sets it, where a ride
/// is to end (CityRuleZone).
enum ScooterZoneKind: String, CaseIterable, Sendable {
    case noRide
    case noParking
    case slow
    case parking

    /// The kinds of the operators' zones, as their legend names them: no
    /// operator publishes where to park.
    static let operatorKinds: [ScooterZoneKind] = [.noRide, .noParking, .slow]

    /// The fills are laid down in this order, the strongest rule on top, as on the web.
    static let belowFirst: [ScooterZoneKind] = [.parking, .slow, .noParking, .noRide]

    var label: String {
        switch self {
        case .noRide: String(localized: "No riding")
        case .noParking: String(localized: "No parking")
        case .slow: String(localized: "Slow")
        case .parking: String(localized: "Parking")
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
    /// How strongly it is drawn: a city's rule outside its hours is dimmer (CityRuleZone).
    var strength: Double = 1
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
        // A kind added later is left out, and parking, which only cities set and the
        // operators' legend does not name, as is a ring with too few points.
        zones = try container.decode([Payload].self, forKey: .zones).compactMap { payload in
            guard let kind = ScooterZoneKind(rawValue: payload.kind), ScooterZoneKind.operatorKinds.contains(kind) else {
                return nil
            }
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
/// without their colours. No riding is hatched too. A city's parking places,
/// some only a few metres across, are filled more strongly still than no
/// parking, in green, so that they show.
enum ScooterZoneLook {
    struct Edge: Sendable {
        let width: CGFloat
        /// Dash and gap lengths in points; empty for a solid edge.
        let dashes: [CGFloat]
        let roundCaps: Bool
    }

    static let edgeOpacity: CGFloat = 0.9
    /// How far, in points, no parking's and slow zones' edges keep from no
    /// riding's edge, and out of its zones (ZONE_EDGE_CLEARANCE).
    static let edgeClearance: CGFloat = 3
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
        case .parking: 0.25
        }
    }

    static func edge(_ kind: ScooterZoneKind) -> Edge {
        switch kind {
        case .noRide: Edge(width: 1.5, dashes: [], roundCaps: false)
        case .noParking: Edge(width: 1.5, dashes: [6, 4], roundCaps: false)
        case .slow: Edge(width: 2, dashes: [0.1, 4], roundCaps: true)
        case .parking: Edge(width: 1.5, dashes: [], roundCaps: false)
        }
    }

    /// The web's colours: edges of 3:1 at least on the land, the parks and
    /// the streets of the light map, lighter on a dark map and on satellite.
    static func color(_ kind: ScooterZoneKind, isDark: Bool) -> UIColor {
        switch (kind, isDark) {
        case (.noRide, false): UIColor(red: 0.851, green: 0.176, blue: 0.125, alpha: 1)
        case (.noParking, false): UIColor(red: 0.753, green: 0.337, blue: 0, alpha: 1)
        case (.slow, false): UIColor(red: 0.243, green: 0.388, blue: 0.867, alpha: 1)
        case (.parking, false): UIColor(red: 0.102, green: 0.498, blue: 0.216, alpha: 1)
        case (.noRide, true): UIColor(red: 1, green: 0.412, blue: 0.38, alpha: 1)
        case (.noParking, true): UIColor(red: 1, green: 0.702, blue: 0.251, alpha: 1)
        case (.slow, true): UIColor(red: 0.486, green: 0.612, blue: 1, alpha: 1)
        case (.parking, true): UIColor(red: 0.298, green: 0.851, blue: 0.482, alpha: 1)
        }
    }
}

/// A street where a city or its police forbids riding, from data/rule-zones.json, or a zone a
/// city sets for shared scooters, from data/city-zones.json, as on the web (src/lib/ruleZones.ts):
/// Seoul's kickboard-free streets, and Bergen's and Porto's zones, credited to the city. Unlike
/// the operators' zones they are the law, so the map draws them from zoom 14 whether or not the
/// zones are on, each as its kind's zones are and dimmer outside its hours, and the legend gives
/// their kind, their hours and who sets them, linked to where they say so. CityRuleZone.all,
/// Seoul's streets, and CityRuleZone.cityZones are generated.
struct CityRuleZone: Equatable, Sendable, Identifiable {
    struct Hours: Equatable, Sendable {
        /// Local minutes since midnight; hours past midnight start after they end.
        let fromMinute: Int
        let untilMinute: Int

        func holds(atMinute local: Int) -> Bool {
            fromMinute <= untilMinute
                ? local >= fromMinute && local < untilMinute
                : local >= fromMinute || local < untilMinute
        }
    }

    /// A rule over the map, with whether it holds now.
    struct Shown: Equatable, Sendable {
        let rule: CityRuleZone
        let inForce: Bool

        /// As the map draws it: a zone of its kind, dimmer outside its hours.
        var mapZone: ScooterZone {
            ScooterZone(
                id: "rule:\(rule.id)", provider: "city", kind: rule.kind, maxSpeedKph: nil, polygons: rule.polygons,
                strength: inForce ? 1 : CityRuleZone.dimmed
            )
        }
    }

    /// Seoul's streets and the cities' zones, put together once, as the map shows them.
    static let onMap: [CityRuleZone] = all + cityZones
    /// How wide a street's band is drawn: the street and its pavements, so that it shows from zoom 14.
    static let bandWidthMeters = 14.0
    /// How strongly a rule is drawn outside its hours, of how strongly within them.
    static let dimmed = 0.35
    /// The corners of the disc each bend and end of a band is rounded with.
    private static let roundCorners = 12

    let id: String
    /// Who sets it, as the legend names them: "Seoul", "Gangnam-gu", "Bergen kommune".
    let authority: String
    let timeZone: String
    /// What it asks of a scooter: no riding, on Seoul's streets.
    let kind: ScooterZoneKind
    /// The local day it starts, "YYYY-MM-DD"; empty for a city's zone, which has always held.
    let firstDay: String
    /// Every day; all day when empty.
    let hours: [Hours]
    /// Where they say so.
    let source: URL
    /// A street's centrelines; none for a city's zone.
    let lines: [[GeoPoint]]
    let bounds: GeoBounds
    /// As the map draws it. A street is the pieces of its band, a disc at each corner and a strip
    /// along each piece, which the zones' overlay merges into one shape; a city's zone is its ring.
    let polygons: [[[GeoPoint]]]

    /// One of Seoul's streets, where riding is forbidden.
    init(id: String, authority: String, timeZone: String, firstDay: String, hours: [Hours], source: URL, lines: [[GeoPoint]]) {
        self.id = id
        self.authority = authority
        self.timeZone = timeZone
        kind = .noRide
        self.firstDay = firstDay
        self.hours = hours
        self.source = source
        self.lines = lines
        bounds = Self.bounds(of: lines.flatMap { $0 })
        polygons = Self.band(of: lines, widthMeters: Self.bandWidthMeters)
    }

    /// One of a city's zones: one ring, which holds all day, every day.
    init(id: String, authority: String, timeZone: String, kind: ScooterZoneKind, source: URL, ring: [GeoPoint]) {
        self.id = id
        self.authority = authority
        self.timeZone = timeZone
        self.kind = kind
        firstDay = ""
        hours = []
        self.source = source
        lines = []
        bounds = Self.bounds(of: ring)
        polygons = [[ring]]
    }

    private static func bounds(of points: [GeoPoint]) -> GeoBounds {
        GeoBounds(
            south: points.map(\.latitude).min() ?? 0, west: points.map(\.longitude).min() ?? 0,
            north: points.map(\.latitude).max() ?? 0, east: points.map(\.longitude).max() ?? 0
        )
    }

    /// Whether it holds at that instant: from its first day there, within its hours.
    func inForce(at date: Date) -> Bool {
        // A city's zone holds at any time: hundreds may be in view, and need no clock read.
        if firstDay.isEmpty && hours.isEmpty { return true }
        guard let zone = TimeZone(identifier: timeZone) else { return false }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = zone
        let clock = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        let day = String(format: "%04d-%02d-%02d", clock.year ?? 0, clock.month ?? 0, clock.day ?? 0)
        guard day >= firstDay else { return false }
        let local = (clock.hour ?? 0) * 60 + (clock.minute ?? 0)
        return hours.isEmpty || hours.contains { $0.holds(atMinute: local) }
    }

    /// The rules over the view, from zoom 14 in, each with whether it holds at that instant.
    static func shown(over view: GeoBounds, zoom: Int, at date: Date, among rules: [CityRuleZone] = onMap) -> [Shown] {
        guard zoom >= ScooterZoneArea.minimumZoom else { return [] }
        return rules.compactMap { $0.bounds.intersects(view) ? Shown(rule: $0, inForce: $0.inForce(at: date)) : nil }
    }

    /// bandPolygons in src/lib/ruleZones.ts.
    static func band(of lines: [[GeoPoint]], widthMeters: Double) -> [[[GeoPoint]]] {
        let metersPerDegreeLatitude = 110_540.0
        let half = widthMeters / 2
        return lines.flatMap { line -> [[[GeoPoint]]] in
            guard let first = line.first else { return [] }
            let metersPerDegreeLongitude = 111_320 * cos(first.latitude * .pi / 180)
            let discs = line.map { point in
                [(0...roundCorners).map { index in
                    let angle = Double(index % roundCorners) / Double(roundCorners) * 2 * .pi
                    return GeoPoint(
                        latitude: point.latitude + half * sin(angle) / metersPerDegreeLatitude,
                        longitude: point.longitude + half * cos(angle) / metersPerDegreeLongitude
                    )
                }]
            }
            let strips = zip(line, line.dropFirst()).compactMap { start, end -> [[GeoPoint]]? in
                let dx = (end.longitude - start.longitude) * metersPerDegreeLongitude
                let dy = (end.latitude - start.latitude) * metersPerDegreeLatitude
                let length = (dx * dx + dy * dy).squareRoot()
                guard length > 0 else { return nil }
                // Half the width across the piece, in degrees.
                let across = (latitude: dx / length * half / metersPerDegreeLatitude, longitude: -dy / length * half / metersPerDegreeLongitude)
                let corner = { (point: GeoPoint, side: Double) in
                    GeoPoint(latitude: point.latitude + side * across.latitude, longitude: point.longitude + side * across.longitude)
                }
                return [[corner(start, 1), corner(end, 1), corner(end, -1), corner(start, -1), corner(start, 1)]]
            }
            return discs + strips
        }
    }
}
