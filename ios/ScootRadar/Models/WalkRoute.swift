import CoreLocation
import Foundation

extension GeoPoint {
    /// The distance to another point, as Core Location measures it.
    func distance(to other: GeoPoint) -> CLLocationDistance {
        CLLocation(latitude: latitude, longitude: longitude)
            .distance(from: CLLocation(latitude: other.latitude, longitude: other.longitude))
    }
}

/// The walking path drawn on the map, from the rider or the searched place to
/// a scooter or a bay: MapKit's route, joined to both ends by a short straight
/// piece where it stops short of them. Lengths are measured on a flat map in
/// metres around the start, which is exact enough for walks of ten kilometres.
struct WalkRoute: Equatable, Sendable {
    /// Further than this in a straight line is not a walk: Apple Maps opens instead.
    static let longestWalk: CLLocationDistance = 10_000
    /// Within this of the scooter or the bay, in a straight line, the rider is there.
    static let arrivalDistance: CLLocationDistance = 20
    /// Further from the path than this, or than one and a half times the
    /// accuracy of the location, the rider has left it.
    static let offRouteDistance: CLLocationDistance = 40
    static let offRouteAccuracyFactor = 1.5
    /// A scooter that moved further than this from the end of the path gets a new path.
    static let targetMoveDistance: CLLocationDistance = 25
    /// A new path is asked for at most this often, and this many times a walk.
    static let rerouteInterval: TimeInterval = 15
    static let maximumReroutes = 10
    /// MapKit's path is joined to the rider and to the scooter when it begins
    /// or ends further from them than this.
    static let connectorDistance: CLLocationDistance = 2
    /// How far back along the path a new location may be placed: a path that
    /// passes the same street twice does not send the rider back to the first time.
    static let backtrackDistance: CLLocationDistance = 30
    /// A vehicle of the same provider this close to a scooter that vanished
    /// from the data is that scooter under a new id.
    static let rebindDistance: CLLocationDistance = 15
    /// Of two places on the path about as near, the earlier one: a metre for
    /// every twenty ahead of the rider. A path that comes back beside itself
    /// does not make the rider jump to its end.
    private static let aheadPenalty = 0.05

    /// Where a location lies on the path.
    struct Position: Equatable, Sendable {
        /// How far along the path, from its start.
        let along: CLLocationDistance
        /// How far the location is from the path.
        let offset: CLLocationDistance
        /// The nearest place on the path.
        let point: GeoPoint
        /// The piece of the path it is on: from `points[segment]` to `points[segment + 1]`.
        let segment: Int
    }

    let points: [GeoPoint]
    /// From the start of the path to each of its points, in metres.
    let distances: [CLLocationDistance]
    private let frame: LocalFrame
    private let planar: [SIMD2<Double>]

    init(points: [GeoPoint]) {
        // A single point is a path of no length, which still has two ends.
        let points = points.count == 1 ? points + points : points
        self.points = points
        frame = LocalFrame(reference: points.first ?? GeoPoint(latitude: 0, longitude: 0))
        planar = points.map(frame.project)
        var walked: CLLocationDistance = 0
        var distances: [CLLocationDistance] = []
        distances.reserveCapacity(planar.count)
        for index in planar.indices {
            if index > 0 { walked += Self.length(planar[index] - planar[index - 1]) }
            distances.append(walked)
        }
        self.distances = distances
    }

    /// MapKit's path, joined to where the walk starts and to the scooter or
    /// the bay where it stops more than two metres short of them: the trail
    /// then visibly leaves the rider and reaches the dot.
    init(origin: GeoPoint, path: [GeoPoint], target: GeoPoint) {
        var points = path
        if let first = points.first, origin.distance(to: first) <= Self.connectorDistance {
            // MapKit's own start is close enough.
        } else {
            points.insert(origin, at: 0)
        }
        if let last = points.last, last.distance(to: target) > Self.connectorDistance {
            points.append(target)
        }
        self.init(points: points)
    }

    /// The whole length of the path, connectors included.
    var length: CLLocationDistance { distances.last ?? 0 }

    var start: GeoPoint? { points.first }
    var end: GeoPoint? { points.last }

    /// What is left of the path from a place along it.
    func remainingDistance(from along: CLLocationDistance) -> CLLocationDistance {
        max(0, length - along)
    }

    /// The path still to walk: from the place on it, through the points after it.
    func remainingPath(from position: Position) -> [GeoPoint] {
        guard position.segment + 1 < points.count else { return [position.point] }
        return [position.point] + points[(position.segment + 1)...]
    }

    /// Where a location lies on the path, searched from the rider's progress
    /// on: never more than thirty metres back from it, and, of two places
    /// about as near, the earlier one. Nil for a path without points.
    func position(of location: GeoPoint, after progress: CLLocationDistance = 0) -> Position? {
        guard points.count >= 2 else { return nil }
        let target = frame.project(location)
        let earliest = progress - Self.backtrackDistance
        var best: (score: Double, position: Position)?
        for segment in 0 ..< points.count - 1 where distances[segment + 1] >= earliest {
            let start = planar[segment]
            let direction = planar[segment + 1] - start
            let segmentLength = distances[segment + 1] - distances[segment]
            let squared = (direction * direction).sum()
            var share = squared > 0 ? ((target - start) * direction).sum() / squared : 0
            share = min(1, max(0, share))
            // The piece that holds the earliest place allowed starts there.
            if segmentLength > 0, distances[segment] + share * segmentLength < earliest {
                share = min(1, (earliest - distances[segment]) / segmentLength)
            }
            let nearest = start + direction * share
            let offset = Self.length(target - nearest)
            let along = distances[segment] + share * segmentLength
            let score = offset + Self.aheadPenalty * max(0, along - progress)
            if let current = best, current.score <= score { continue }
            best = (score, Position(along: along, offset: offset, point: frame.unproject(nearest), segment: segment))
        }
        return best?.position
    }

    /// Whether a location this far from the path has left it.
    static func isOffRoute(_ offset: CLLocationDistance, accuracy: CLLocationAccuracy) -> Bool {
        offset > max(offRouteDistance, offRouteAccuracyFactor * max(0, accuracy))
    }

    /// Whether the rider is at the scooter or the bay.
    static func hasArrived(_ location: GeoPoint, at target: GeoPoint) -> Bool {
        location.distance(to: target) <= arrivalDistance
    }

    /// Whether the way from one point to the other is a walk at all.
    static func isWalk(from origin: GeoPoint, to target: GeoPoint) -> Bool {
        origin.distance(to: target) <= longestWalk
    }

    private static func length(_ vector: SIMD2<Double>) -> Double {
        (vector * vector).sum().squareRoot()
    }

    /// Metres east and north of a reference point.
    private struct LocalFrame: Equatable, Sendable {
        static let metresPerDegreeLatitude = 6_371_008.8 * Double.pi / 180
        let reference: GeoPoint
        let metresPerDegreeLongitude: Double

        init(reference: GeoPoint) {
            self.reference = reference
            metresPerDegreeLongitude = Self.metresPerDegreeLatitude * max(0.01, cos(reference.latitude * .pi / 180))
        }

        func project(_ point: GeoPoint) -> SIMD2<Double> {
            SIMD2(
                (point.longitude - reference.longitude) * metresPerDegreeLongitude,
                (point.latitude - reference.latitude) * Self.metresPerDegreeLatitude
            )
        }

        func unproject(_ point: SIMD2<Double>) -> GeoPoint {
            GeoPoint(
                latitude: reference.latitude + point.y / Self.metresPerDegreeLatitude,
                longitude: reference.longitude + point.x / metresPerDegreeLongitude
            )
        }
    }
}

/// What a walk leads to: the scooter or the bay whose card asked for it.
enum ScooterWalkTarget: Equatable, Sendable {
    case scooter(Scooter)
    case parking(ScooterParking)

    var id: String {
        switch self {
        case let .scooter(scooter): scooter.id
        case let .parking(parking): parking.id
        }
    }

    var point: GeoPoint {
        switch self {
        case let .scooter(scooter): GeoPoint(latitude: scooter.latitude, longitude: scooter.longitude)
        case let .parking(parking): GeoPoint(latitude: parking.latitude, longitude: parking.longitude)
        }
    }

    var provider: String {
        switch self {
        case let .scooter(scooter): scooter.provider
        case let .parking(parking): parking.provider
        }
    }

    /// The target analytics name, as the web sends it.
    var analyticsTarget: String {
        switch self {
        case .scooter: "vehicle"
        case .parking: "parking"
        }
    }

    /// The same scooter or bay, whatever has changed about it since.
    func isSame(as other: ScooterWalkTarget) -> Bool {
        switch (self, other) {
        case let (.scooter(first), .scooter(second)): first.id == second.id
        case let (.parking(first), .parking(second)): first.id == second.id
        default: false
        }
    }
}

/// Where a walk starts: the searched place, or the rider wherever they are.
enum ScooterWalkOrigin: Equatable, Sendable {
    case place(MapDestination)
    case rider
}

/// Why a walk has no path.
enum ScooterWalkFailure: Equatable, Sendable {
    /// There was nothing to walk from: the rider could not be located.
    case noLocation
    /// MapKit found no way on foot, or could not be asked.
    case noRoute
}

/// Where a walk stands. Without a walk the card simply offers Directions.
enum ScooterWalkPhase: Equatable, Sendable {
    /// Waiting for the first location to walk from.
    case locating
    /// The path is being found.
    case finding
    /// The path is on the map.
    case shown
    /// No path: the card offers Apple Maps instead.
    case failed(ScooterWalkFailure)
    /// The rider is at the scooter or the bay.
    case arrived
    /// The scooter left the data while it was walked to: someone may have taken it.
    case gone
}

/// What the Directions button of a card is.
enum ScooterDirectionsControl: Equatable, Sendable {
    /// Directions: draws the walking path.
    case directions
    /// A spinner in place of the icon while the rider is located or the path found.
    case finding
    /// Hide route, while the path is on the map.
    case hideRoute
    /// Open in Maps, when no path was found.
    case openInMaps
    /// No button: the scooter is gone.
    case none
}

/// The line a card shows about its walk.
enum ScooterWalkNote: Equatable, Sendable {
    case noLocation
    case noRoute
    case arrived
    case gone

    var text: String {
        switch self {
        case .noLocation: String(localized: "Couldn’t find your location.")
        case .noRoute: String(localized: "Couldn’t find a walking route.")
        case .arrived: String(localized: "You’re there.")
        case .gone: String(localized: "No longer on the map. Someone may have taken it.")
        }
    }

    var systemImage: String {
        switch self {
        case .noLocation: "location.slash"
        case .noRoute: "exclamationmark.triangle"
        case .arrived: "checkmark.circle.fill"
        case .gone: "questionmark.circle"
        }
    }
}

/// What the map draws of a walk: the path, how much of it is behind the rider,
/// and whether it is a path just found, which the camera fits and which then
/// draws itself from the start to the scooter.
struct WalkTrail: Equatable, Sendable {
    /// A new value means a new path; the same value, the same path walked further.
    let revision: Int
    let points: [GeoPoint]
    /// The share of the path already walked, which the trail no longer shows.
    let walked: Double
    let reveals: Bool
}

/// What VoiceOver is told about the walk. Each one is new, even with the same words.
struct ScooterWalkAnnouncement: Equatable, Sendable {
    let text: String
    let serial: Int
}

/// The walk to the selected scooter or bay, from a tap on Directions until it
/// is hidden, the card closes or another scooter or bay is chosen.
struct ScooterWalk: Equatable, Sendable {
    var target: ScooterWalkTarget
    var phase: ScooterWalkPhase
    /// Nil while the rider is still being located.
    var origin: ScooterWalkOrigin?
    var route: WalkRoute?
    /// How far along the route the rider is.
    var progress: CLLocationDistance = 0
    /// Counts the routes put on the map.
    var routeRevision = 0
    /// The route on the map was found from a new start: the camera fits it
    /// and it draws itself. A route found again on the way only swaps in.
    var reveals = false
    /// New paths asked for on the way, and when the last path was asked for.
    var reroutes = 0
    var lastRequestAt: Date?

    init(target: ScooterWalkTarget, phase: ScooterWalkPhase, origin: ScooterWalkOrigin? = nil) {
        self.target = target
        self.phase = phase
        self.origin = origin
    }

    /// Locating, finding or showing the path. The scooter or the bay stays
    /// selected and on the map wherever the map goes, and a tap on the empty
    /// map leaves the card open.
    var isUnderway: Bool {
        switch phase {
        case .locating, .finding, .shown: true
        case .failed, .arrived, .gone: false
        }
    }

    /// The walk keeps the card open: while under way, and once the scooter is
    /// gone, until the rider closes it.
    var holdsCard: Bool {
        isUnderway || phase == .gone
    }

    /// The scooter drawn on the map whatever the filters and the data leave out.
    var heldScooter: Scooter? {
        guard isUnderway, case let .scooter(scooter) = target else { return nil }
        return scooter
    }

    /// The bay drawn on the map whatever the zoom and the data leave out.
    var heldParking: ScooterParking? {
        guard isUnderway, case let .parking(parking) = target else { return nil }
        return parking
    }

    /// What is left to walk along the route, while it is on the map.
    var remainingDistance: CLLocationDistance? {
        guard phase == .shown, let route else { return nil }
        return route.remainingDistance(from: progress)
    }

    var trail: WalkTrail? {
        guard phase == .shown, let route else { return nil }
        return WalkTrail(
            revision: routeRevision,
            points: route.points,
            walked: route.length > 0 ? min(1, max(0, progress / route.length)) : 0,
            reveals: reveals
        )
    }

    var control: ScooterDirectionsControl {
        switch phase {
        case .locating, .finding: .finding
        case .shown: .hideRoute
        case .failed: .openInMaps
        case .arrived: .directions
        case .gone: .none
        }
    }

    var note: ScooterWalkNote? {
        switch phase {
        case .failed(.noLocation): .noLocation
        case .failed(.noRoute): .noRoute
        case .arrived: .arrived
        case .gone: .gone
        case .locating, .finding, .shown: nil
        }
    }
}
