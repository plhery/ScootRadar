import MapKit
import XCTest
@testable import ScootRadar

final class GeoBoundsTests: XCTestCase {
    func testRegionConversionAndContainment() {
        let region = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417),
            span: MKCoordinateSpan(latitudeDelta: 0.02, longitudeDelta: 0.04)
        )
        let bounds = GeoBounds(region: region)

        XCTAssertEqual(bounds.south, 47.3669, accuracy: 0.000_001)
        XCTAssertEqual(bounds.north, 47.3869, accuracy: 0.000_001)
        XCTAssertEqual(bounds.west, 8.5217, accuracy: 0.000_001)
        XCTAssertEqual(bounds.east, 8.5617, accuracy: 0.000_001)
        XCTAssertTrue(bounds.contains(latitude: 47.3769, longitude: 8.5417))
        XCTAssertFalse(bounds.contains(latitude: 47.4, longitude: 8.5417))
    }

    func testExpandedBoundsContainOriginalBounds() {
        let original = GeoBounds(region: MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417),
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        ))

        XCTAssertTrue(original.expanded(by: 0.25).contains(original))
    }

    func testExpansionClampsWorldCoordinates() {
        let world = GeoBounds(region: MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 0, longitude: 0),
            span: MKCoordinateSpan(latitudeDelta: 180, longitudeDelta: 360)
        )).expanded(by: 1)

        XCTAssertEqual(world.south, -90)
        XCTAssertEqual(world.north, 90)
        XCTAssertEqual(world.west, -180)
        XCTAssertEqual(world.east, 180)
    }

    // New Zealand lies just west of 180°: Auckland west of the line, the Chatham Islands east of it.
    private let auckland = GeoPoint(latitude: -36.8485, longitude: 174.7633)
    private let chatham = GeoPoint(latitude: -43.95, longitude: -176.56)

    private func region(longitude: Double, span: Double) -> MKCoordinateRegion {
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: -36.52, longitude: longitude),
            span: MKCoordinateSpan(latitudeDelta: 21.08, longitudeDelta: span)
        )
    }

    func testAViewPastTheLineEastwardsCrossesIt() {
        // Centred on 181.4°E, which MapKit calls -178.6°.
        let bounds = GeoBounds(region: region(longitude: -178.6, span: 43))

        XCTAssertTrue(bounds.crossesDateLine)
        XCTAssertEqual(bounds.west, 159.9, accuracy: 0.000_001)
        XCTAssertEqual(bounds.east, -157.1, accuracy: 0.000_001)
        XCTAssertEqual(bounds.longitudeSpan, 43, accuracy: 0.000_001)
        XCTAssertTrue(bounds.contains(auckland))
        XCTAssertTrue(bounds.contains(chatham))
        XCTAssertTrue(bounds.contains(latitude: -40, longitude: 180))
        XCTAssertTrue(bounds.contains(latitude: -40, longitude: -180))
        XCTAssertFalse(bounds.contains(latitude: -36.8, longitude: 150))
        XCTAssertFalse(bounds.contains(latitude: -36.8, longitude: -150))
        XCTAssertFalse(bounds.contains(latitude: -20, longitude: 174.7))
    }

    func testAViewPastTheLineWestwardsCrossesIt() {
        // Centred on Tauranga, reaching past 180° on the right.
        let bounds = GeoBounds(region: region(longitude: 176.17, span: 20))

        XCTAssertTrue(bounds.crossesDateLine)
        XCTAssertEqual(bounds.west, 166.17, accuracy: 0.000_001)
        XCTAssertEqual(bounds.east, -173.83, accuracy: 0.000_001)
        XCTAssertTrue(bounds.contains(auckland))
        XCTAssertTrue(bounds.contains(chatham))
        XCTAssertEqual(bounds.center.longitude, 176.17, accuracy: 0.000_001)
    }

    func testAViewWiderThanTheWorldIsAllOfIt() {
        let bounds = GeoBounds(region: region(longitude: -178.6, span: 400))

        XCTAssertFalse(bounds.crossesDateLine)
        XCTAssertEqual(bounds.west, -180)
        XCTAssertEqual(bounds.east, 180)
        XCTAssertTrue(bounds.contains(auckland))
        XCTAssertTrue(bounds.contains(chatham))
    }

    func testAnEdgeExactlyOnTheLineStaysOnTheSideOfTheView() {
        let east = GeoBounds(region: region(longitude: -165, span: 30))
        XCTAssertFalse(east.crossesDateLine)
        XCTAssertEqual(east.west, -180)
        XCTAssertEqual(east.east, -150)

        let west = GeoBounds(region: region(longitude: 165, span: 30))
        XCTAssertFalse(west.crossesDateLine)
        XCTAssertEqual(west.west, 150)
        XCTAssertEqual(west.east, 180)
        XCTAssertTrue(west.contains(latitude: -36.52, longitude: 180))
        XCTAssertFalse(west.contains(latitude: -36.52, longitude: -179.9))

        // Centred on the line itself.
        let across = GeoBounds(region: region(longitude: 180, span: 20))
        XCTAssertTrue(across.crossesDateLine)
        XCTAssertEqual(across.west, 170)
        XCTAssertEqual(across.east, -170, accuracy: 0.000_001)
        XCTAssertEqual(GeoBounds(region: region(longitude: -180, span: 20)), across)
    }

    func testBoxesAcrossTheLineMeetAndHoldBoxesOnEitherSide() {
        let view = GeoBounds(region: region(longitude: -178.6, span: 43))
        let tauranga = GeoBounds(south: -37.8, west: 176.0, north: -37.5, east: 176.4)
        let islands = GeoBounds(south: -44.4, west: -177, north: -43.6, east: -176.1)
        let hawaii = GeoBounds(south: 18.9, west: -160.3, north: 22.3, east: -154.8)

        XCTAssertTrue(view.intersects(tauranga))
        XCTAssertTrue(tauranga.intersects(view))
        XCTAssertTrue(view.intersects(islands))
        XCTAssertFalse(view.intersects(hawaii))
        XCTAssertTrue(view.contains(tauranga))
        XCTAssertTrue(view.contains(islands))
        XCTAssertTrue(view.contains(GeoBounds(south: -40, west: 170, north: -38, east: -170)))
        XCTAssertFalse(view.contains(GeoBounds(south: -40, west: 150, north: -38, east: -170)))
        // Only the whole world holds a box across the line without crossing it.
        XCTAssertTrue(GeoBounds(south: -90, west: -180, north: 90, east: 180).contains(view))
        XCTAssertFalse(GeoBounds(south: -90, west: -179, north: 90, east: 179).contains(view))
    }

    func testPaddingReachesAcrossTheLineAndRoundTheWorld() {
        let westOfTheLine = GeoBounds(south: -40, west: 170, north: -36, east: 179).expanded(by: 0.25)
        XCTAssertTrue(westOfTheLine.crossesDateLine)
        XCTAssertEqual(westOfTheLine.west, 167.75, accuracy: 0.000_001)
        XCTAssertEqual(westOfTheLine.east, -178.75, accuracy: 0.000_001)

        let view = GeoBounds(region: region(longitude: -178.6, span: 43))
        let padded = view.expanded(by: 0.25)
        XCTAssertTrue(padded.contains(view))
        XCTAssertEqual(padded.longitudeSpan, 64.5, accuracy: 0.000_001)

        let round = GeoBounds(south: -10, west: -170, north: 10, east: 170).expanded(by: 0.25)
        XCTAssertEqual(round.west, -180)
        XCTAssertEqual(round.east, 180)
    }

    func testTheMiddleOfAViewAcrossTheLineIsOnTheLine() {
        let view = GeoBounds(region: region(longitude: -178.6, span: 43))
        XCTAssertEqual(view.center.longitude, -178.6, accuracy: 0.000_001)
        XCTAssertEqual(view.center.latitude, -36.52, accuracy: 0.000_001)
        XCTAssertEqual(GeoBounds(south: 47, west: 8, north: 48, east: 9).center.longitude, 8.5)
    }

    @MainActor
    func testMapKitDrawsBothSidesOfTheLineOnScreen() {
        // The markers stand where MapKit puts their coordinates: on screen, on either side of 180°.
        let mapView = MKMapView(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        mapView.setRegion(region(longitude: -178.6, span: 20), animated: false)
        let west = mapView.convert(auckland.coordinate, toPointTo: mapView)
        let east = mapView.convert(chatham.coordinate, toPointTo: mapView)
        XCTAssertTrue(mapView.bounds.contains(west), "\(west)")
        XCTAssertTrue(mapView.bounds.contains(east), "\(east)")
        XCTAssertLessThan(west.x, east.x)
        XCTAssertTrue(GeoBounds(region: mapView.region).crossesDateLine)
    }
}
