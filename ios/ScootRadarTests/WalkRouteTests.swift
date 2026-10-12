import CoreLocation
import MapKit
import XCTest
@testable import ScootRadar

final class WalkRouteTests: XCTestCase {
    private let start = GeoPoint(latitude: 47.3769, longitude: 8.5417)

    // MARK: Connectors

    func testAPathThatStopsShortIsJoinedToTheRiderAndTheScooter() {
        let target = point(east: 300, north: 0)
        let path = [point(east: 0, north: 20), point(east: 300, north: 20)]

        let route = WalkRoute(origin: start, path: path, target: target)

        XCTAssertEqual(route.points.count, 4)
        XCTAssertEqual(route.start, start)
        XCTAssertEqual(route.end, target)
        XCTAssertEqual(route.length, 340, accuracy: 1)
    }

    func testAPathWithinTwoMetresOfBothEndsGetsNoConnector() {
        let target = point(east: 300, north: 0)
        let path = [point(east: 1, north: 1), point(east: 299, north: 1)]

        let route = WalkRoute(origin: start, path: path, target: target)

        XCTAssertEqual(route.points, path)
    }

    func testAnEmptyPathIsTheStraightLine() {
        let target = point(east: 0, north: 150)

        let route = WalkRoute(origin: start, path: [], target: target)

        XCTAssertEqual(route.points, [start, target])
        XCTAssertEqual(route.length, start.distance(to: target), accuracy: 1)
    }

    func testASinglePointIsAPathOfNoLength() {
        let route = WalkRoute(points: [start])

        XCTAssertEqual(route.points.count, 2)
        XCTAssertEqual(route.length, 0)
        XCTAssertEqual(route.position(of: point(east: 10, north: 0))?.along, 0)
    }

    // MARK: Lengths

    func testLengthsAddUpAlongThePathAsCoreLocationMeasuresThem() {
        let corner = point(east: 400, north: 0)
        let end = point(east: 400, north: 300)
        let route = WalkRoute(points: [start, corner, end])

        XCTAssertEqual(route.distances[0], 0)
        XCTAssertEqual(route.distances[1], start.distance(to: corner), accuracy: 2)
        XCTAssertEqual(route.length, start.distance(to: corner) + corner.distance(to: end), accuracy: 3)
        XCTAssertEqual(route.remainingDistance(from: 100), route.length - 100, accuracy: 0.001)
        XCTAssertEqual(route.remainingDistance(from: 10_000), 0)
    }

    // MARK: Progress

    func testALocationBesideThePathIsPlacedOnIt() throws {
        let route = WalkRoute(points: [start, point(east: 200, north: 0)])

        let position = try XCTUnwrap(route.position(of: point(east: 80, north: 12)))

        XCTAssertEqual(position.along, 80, accuracy: 0.5)
        XCTAssertEqual(position.offset, 12, accuracy: 0.5)
        XCTAssertEqual(position.segment, 0)
        XCTAssertEqual(position.point.distance(to: point(east: 80, north: 0)), 0, accuracy: 0.5)
    }

    func testAPathThatComesBackBesideItselfKeepsTheRiderWhereTheyAre() throws {
        // Out along a street and back on the other side of it, 20 m away.
        let route = WalkRoute(points: [
            start, point(east: 200, north: 0), point(east: 200, north: 20), point(east: 0, north: 20)
        ])
        let nearTheStart = point(east: 2, north: 9)

        let atFirst = try XCTUnwrap(route.position(of: nearTheStart, after: 0))
        XCTAssertLessThan(atFirst.along, 10)

        // Once on the way back, the same spot is the end of the walk.
        let onTheWayBack = try XCTUnwrap(route.position(of: nearTheStart, after: 380))
        XCTAssertGreaterThan(onTheWayBack.along, 400)
    }

    func testALocationIsNeverPlacedMoreThanThirtyMetresBack() throws {
        let route = WalkRoute(points: [start, point(east: 300, north: 0)])

        let slightlyBack = try XCTUnwrap(route.position(of: point(east: 80, north: 0), after: 100))
        XCTAssertEqual(slightlyBack.along, 80, accuracy: 0.5)

        let farBack = try XCTUnwrap(route.position(of: point(east: 20, north: 0), after: 100))
        XCTAssertEqual(farBack.along, 70, accuracy: 0.5)
        XCTAssertEqual(farBack.offset, 50, accuracy: 0.5)
    }

    func testLeavingThePathDependsOnHowPreciseTheLocationIs() {
        XCTAssertFalse(WalkRoute.isOffRoute(40, accuracy: 5))
        XCTAssertTrue(WalkRoute.isOffRoute(41, accuracy: 5))
        // A location good to 40 m may lie 60 m from the path.
        XCTAssertFalse(WalkRoute.isOffRoute(59, accuracy: 40))
        XCTAssertTrue(WalkRoute.isOffRoute(61, accuracy: 40))
        XCTAssertTrue(WalkRoute.isOffRoute(41, accuracy: -1))
    }

    func testTheRiderIsThereWithinTwentyMetres() {
        XCTAssertTrue(WalkRoute.hasArrived(point(east: 19, north: 0), at: start))
        XCTAssertFalse(WalkRoute.hasArrived(point(east: 21, north: 0), at: start))
    }

    func testAWalkIsTenKilometresAtMost() {
        XCTAssertTrue(WalkRoute.isWalk(from: start, to: point(east: 0, north: 9_900)))
        XCTAssertFalse(WalkRoute.isWalk(from: start, to: point(east: 0, north: 10_100)))
    }

    // MARK: Walk

    func testTheButtonAndTheLineFollowTheWalk() {
        let scooter = Scooter(
            provider: "lime", latitude: start.latitude, longitude: start.longitude, battery: 80,
            rangeMeters: nil, vehicleID: "s1", deepLink: nil, rentalURIs: nil, distanceMeters: 0
        )
        var walk = ScooterWalk(target: .scooter(scooter), phase: .locating)
        XCTAssertEqual(walk.control, .finding)
        XCTAssertNil(walk.trail)
        XCTAssertEqual(walk.heldScooter, scooter)

        walk.phase = .shown
        walk.origin = .rider
        walk.route = WalkRoute(points: [point(east: -200, north: 0), start])
        walk.progress = 50
        XCTAssertEqual(walk.control, .hideRoute)
        XCTAssertEqual(walk.remainingDistance ?? 0, 150, accuracy: 0.5)
        XCTAssertEqual(walk.trail?.walked ?? 0, 0.25, accuracy: 0.01)

        walk.phase = .failed(.noRoute)
        XCTAssertEqual(walk.control, .openInMaps)
        XCTAssertEqual(walk.note, .noRoute)
        XCTAssertNil(walk.trail)
        XCTAssertNil(walk.heldScooter)

        walk.phase = .arrived
        XCTAssertEqual(walk.control, .directions)
        XCTAssertEqual(walk.note, .arrived)

        walk.phase = .gone
        XCTAssertEqual(walk.control, ScooterDirectionsControl.none)
        XCTAssertEqual(walk.note, .gone)
        XCTAssertTrue(walk.holdsCard)
        XCTAssertFalse(walk.isUnderway)
    }

    // MARK: Look

    func testTheTrailDrawsItselfQuicklyAtFirstAndSettles() {
        XCTAssertEqual(WalkTrailLook.easeOut(0), 0)
        XCTAssertEqual(WalkTrailLook.easeOut(1), 1)
        XCTAssertEqual(WalkTrailLook.easeOut(0.5), 0.875, accuracy: 0.0001)
        XCTAssertEqual(WalkTrailLook.easeOut(2), 1)
        var previous = -1.0
        for step in 0 ... 20 {
            let value = WalkTrailLook.easeOut(Double(step) / 20)
            XCTAssertGreaterThan(value, previous)
            previous = value
        }
    }

    func testTheCasingIsTheGroundOfTheMap() {
        XCTAssertEqual(WalkTrailLook.casingColor(isDark: false), .white)
        XCTAssertEqual(WalkTrailLook.casingColor(isDark: true), ScooterMapLook.darkGround)
        XCTAssertEqual(WalkTrailLook.dotColor, ScooterMapLook.selectionRing)
        XCTAssertEqual(WalkTrailLook.dotSpacing, 11)
        XCTAssertGreaterThan(WalkTrailLook.casingWidth, WalkTrailLook.dotWidth)
    }

    func testTheDotsAreSpacedAlongTheRouteFromItsStart() {
        let points = [MKMapPoint(x: 0, y: 0), MKMapPoint(x: 10, y: 0), MKMapPoint(x: 10, y: 10)]

        let dots = WalkTrailLook.dots(along: points, spacing: 5)

        XCTAssertEqual(dots.map(\.x), [0, 5, 10, 10, 10])
        XCTAssertEqual(dots.map(\.y), [0, 0, 0, 5, 10])
    }

    func testTheDotsStayInPlaceAsTheTrailDrawsItselfAndIsWalked() {
        let points = [MKMapPoint(x: 0, y: 0), MKMapPoint(x: 100, y: 0)]

        XCTAssertEqual(WalkTrailLook.dots(along: points, spacing: 10, to: 0.5).map(\.x), [0, 10, 20, 30, 40, 50])
        XCTAssertEqual(WalkTrailLook.dots(along: points, spacing: 10, from: 0.25).map(\.x), [30, 40, 50, 60, 70, 80, 90, 100])
        XCTAssertTrue(WalkTrailLook.dots(along: points, spacing: 10, to: 0).isEmpty)
        XCTAssertTrue(WalkTrailLook.dots(along: points, spacing: 0).isEmpty)
        XCTAssertTrue(WalkTrailLook.dots(along: [points[0]], spacing: 10).isEmpty)
    }

    func testALongRouteSeenUpCloseHasItsDotsFurtherApart() {
        let points = [MKMapPoint(x: 0, y: 0), MKMapPoint(x: 1_000_000, y: 0)]

        let dots = WalkTrailLook.dots(along: points, spacing: 1)

        XCTAssertLessThanOrEqual(dots.count, WalkTrailLook.maximumDots + 1)
        XCTAssertEqual(dots.last?.x ?? 0, 1_000_000, accuracy: 0.001)
    }

    // MARK: Camera

    func testTheRouteIsFittedInTheVisiblePartOfTheMap() throws {
        let size = CGSize(width: 400, height: 800)
        let visible = CGRect(x: 0, y: 100, width: 400, height: 400)
        let points = [MKMapPoint(x: 1_000, y: 2_000), MKMapPoint(x: 2_000, y: 2_200)]

        let rect = try XCTUnwrap(ScooterMapCameraPolicy.rect(
            fitting: points, heading: 0, size: size, visible: visible, minimumScale: 0.1
        ))

        // 1 000 map points across 400 points.
        XCTAssertEqual(rect.size.width, 1_000, accuracy: 0.001)
        XCTAssertEqual(rect.size.height, 2_000, accuracy: 0.001)
        // The middle of the route is the middle of the visible part, which is
        // 100 points above the middle of the map.
        XCTAssertEqual(rect.midX, 1_500, accuracy: 0.001)
        XCTAssertEqual(rect.midY, 2_100 + 100 * 2.5, accuracy: 0.001)
    }

    func testAMapTurnedSidewaysFitsTheRouteAcrossItsHeight() throws {
        let size = CGSize(width: 400, height: 800)
        let visible = CGRect(origin: .zero, size: size)
        // West to east: on a map turned to face east, from bottom to top.
        let points = [MKMapPoint(x: 0, y: 0), MKMapPoint(x: 1_600, y: 0)]

        let rect = try XCTUnwrap(ScooterMapCameraPolicy.rect(
            fitting: points, heading: 90, size: size, visible: visible, minimumScale: 0.1
        ))

        XCTAssertEqual(rect.size.width, 400 * 2, accuracy: 0.001)
        XCTAssertEqual(rect.midX, 800, accuracy: 0.001)
        XCTAssertEqual(rect.midY, 0, accuracy: 0.001)
    }

    func testAShortRouteIsShownNoCloserThanStreetLevel() throws {
        let size = CGSize(width: 400, height: 800)
        let points = [MKMapPoint(x: 0, y: 0), MKMapPoint(x: 10, y: 0)]

        let rect = try XCTUnwrap(ScooterMapCameraPolicy.rect(
            fitting: points, heading: 0, size: size, visible: CGRect(origin: .zero, size: size), minimumScale: 3
        ))

        XCTAssertEqual(rect.size.width, 1_200, accuracy: 0.001)
        XCTAssertNil(ScooterMapCameraPolicy.rect(
            fitting: [], heading: 0, size: size, visible: CGRect(origin: .zero, size: size), minimumScale: 3
        ))
    }

    private func point(east: CLLocationDistance, north: CLLocationDistance) -> GeoPoint {
        let metresPerDegree = 6_371_008.8 * Double.pi / 180
        return GeoPoint(
            latitude: start.latitude + north / metresPerDegree,
            longitude: start.longitude + east / (metresPerDegree * cos(start.latitude * .pi / 180))
        )
    }
}
