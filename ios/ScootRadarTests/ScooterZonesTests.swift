import CoreLocation
import MapKit
import XCTest
@testable import ScootRadar

final class ScooterZonesTests: XCTestCase {
    func testTheAreaIsTheMapsRoundedOutToAFiftiethOfADegree() throws {
        let area = try XCTUnwrap(ScooterZoneArea(covering: GeoBounds(south: 47.3694, west: 8.5342, north: 47.3844, east: 8.5492)))
        XCTAssertEqual(area, ScooterZoneArea(covering: GeoBounds(south: 47.361, west: 8.521, north: 47.399, east: 8.559)))
        XCTAssertEqual(
            area.queryItems.map { "\($0.name)=\($0.value ?? "")" },
            ["south=47.36", "west=8.52", "north=47.4", "east=8.56", "zoom=14"]
        )
        XCTAssertTrue(area.contains(try XCTUnwrap(ScooterZoneArea(covering: GeoBounds(south: 47.37, west: 8.53, north: 47.38, east: 8.55)))))
        XCTAssertFalse(area.contains(try XCTUnwrap(ScooterZoneArea(covering: GeoBounds(south: 47.37, west: 8.53, north: 47.41, east: 8.55)))))
    }

    func testDegreesAreWrittenAsTheWebWritesThem() {
        XCTAssertEqual(ScooterZoneArea.degrees(2368), "47.36")
        XCTAssertEqual(ScooterZoneArea.degrees(2370), "47.4")
        XCTAssertEqual(ScooterZoneArea.degrees(2350), "47")
        XCTAssertEqual(ScooterZoneArea.degrees(1), "0.02")
        XCTAssertEqual(ScooterZoneArea.degrees(0), "0")
        XCTAssertEqual(ScooterZoneArea.degrees(-1), "-0.02")
        XCTAssertEqual(ScooterZoneArea.degrees(-5), "-0.1")
        XCTAssertEqual(ScooterZoneArea.degrees(-6170), "-123.4")
    }

    func testNoAreaIsAskedForAcrossTheDateLineOrWiderThanTheServerAnswers() {
        XCTAssertNil(ScooterZoneArea(covering: GeoBounds(south: -17.9, west: 179.9, north: -17.8, east: -179.9)))
        XCTAssertNil(ScooterZoneArea(covering: GeoBounds(south: 47, west: 8, north: 48.5, east: 8.5)))
    }

    func testZonesAreAskedForAndReadWithoutKindsOrRingsThisVersionCannotDraw() async throws {
        let body = #"""
        {"zones":[
          {"id":"lime:0","provider":"lime","kind":"noRide","polygons":[[[[47.37,8.54],[47.38,8.54],[47.38,8.55],[47.37,8.54]],[[47.371,8.541],[47.372,8.541],[47.372,8.542],[47.371,8.541]]]]},
          {"id":"bird:3","provider":"bird","kind":"slow","maxSpeedKph":15,"polygons":[[[[47.37,8.54],[47.38,8.54],[47.38,8.55],[47.37,8.54]]]]},
          {"id":"voi:1","provider":"voi","kind":"parkingRequired","polygons":[[[[47.37,8.54],[47.38,8.54],[47.38,8.55],[47.37,8.54]]]]},
          {"id":"voi:3","provider":"voi","kind":"parking","polygons":[[[[47.37,8.54],[47.38,8.54],[47.38,8.55],[47.37,8.54]]]]},
          {"id":"dott:2","provider":"dott","kind":"noParking","polygons":[[[[47.37,8.54],[47.38,8.54],[47.37,8.54]]]]}
        ],"meta":{"generatedAt":"2026-10-24T10:00:00.000Z","pending":true,"truncated":false}}
        """#
        let session = ZoneNetworkSession(data: Data(body.utf8))
        let api = ScooterAPI(baseURL: ScooterAPI.productionBaseURL, session: session)
        let area = try XCTUnwrap(ScooterZoneArea(covering: GeoBounds(south: 47.361, west: 8.521, north: 47.399, east: 8.559)))

        let response = try await api.zones(in: area)

        let request = await session.lastRequest
        let url = try XCTUnwrap(request?.url)
        XCTAssertEqual(url.absoluteString, "https://scootradar.com/api/zones?south=47.36&west=8.52&north=47.4&east=8.56&zoom=14")
        XCTAssertTrue(response.pending)
        XCTAssertFalse(response.truncated)
        XCTAssertEqual(response.zones.map(\.id), ["lime:0", "bird:3"], "Parking is only a city's, which the operators' legend does not name")
        XCTAssertEqual(response.zones.map(\.kind), [.noRide, .slow])
        XCTAssertEqual(response.zones[0].polygons[0].count, 2, "The outer ring and its hole")
        XCTAssertEqual(response.zones[0].polygons[0][0][1], GeoPoint(latitude: 47.38, longitude: 8.54))
        XCTAssertEqual(response.zones[1].maxSpeedKph, 15)
    }

    func testEveryLanguageNamesTheZones() throws {
        let keys = [
            "Ride and parking zones", "Zones", "No riding", "No parking", "Slow", "Parking",
            "Zoom in to see the zones", "No zones published here", "Zones unavailable right now", "not now"
        ]
        for language in ["de", "fr", "it", "nl", "nb", "pt", "es", "is"] {
            let strings = try XCTUnwrap(Bundle.main.path(forResource: language, ofType: "lproj").flatMap(Bundle.init(path:)))
            for key in keys {
                let text = strings.localizedString(forKey: key, value: "missing", table: nil)
                XCTAssertNotEqual(text, "missing", "\(language): \(key)")
            }
        }
        let german = try XCTUnwrap(Bundle.main.path(forResource: "de", ofType: "lproj").flatMap(Bundle.init(path:)))
        XCTAssertEqual(german.localizedString(forKey: "No riding", value: nil, table: nil), "Fahrverbot")
    }

    func testTheOperatorsLegendLeavesOutParkingWhichOnlyCitiesSet() {
        XCTAssertEqual(ScooterZoneKind.operatorKinds, [.noRide, .noParking, .slow])
        // The cities' lines in the legend go in this order, the strongest rule first,
        XCTAssertEqual(ScooterZoneKind.allCases, [.noRide, .noParking, .slow, .parking])
        // and their fills are laid down the other way, parking at the bottom.
        XCTAssertEqual(ScooterZoneKind.belowFirst, [.parking, .slow, .noParking, .noRide])
    }

    func testParkingIsAPlainGreenFillWithinASolidEdge() {
        XCTAssertEqual(ScooterZoneLook.fillOpacity(.parking), 0.25)
        let edge = ScooterZoneLook.edge(.parking)
        XCTAssertEqual(edge.width, 1.5)
        XCTAssertTrue(edge.dashes.isEmpty)
        XCTAssertEqual(hex(ScooterZoneLook.color(.parking, isDark: false)), "#1a7f37")
        XCTAssertEqual(hex(ScooterZoneLook.color(.parking, isDark: true)), "#4cd97b")
    }

    private func hex(_ color: UIColor) -> String {
        var red: CGFloat = 0, green: CGFloat = 0, blue: CGFloat = 0, alpha: CGFloat = 0
        color.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
        return String(format: "#%02x%02x%02x", Int((red * 255).rounded()), Int((green * 255).rounded()), Int((blue * 255).rounded()))
    }
}

final class ScooterZoneOverlayTests: XCTestCase {
    func testTheSameRuleOfSeveralOperatorsIsOneShapeWithinOneEdge() throws {
        let overlay = ScooterZoneOverlay(zones: [
            zone("lime:0", .noParking, square(47.37, 8.54)),
            // The same street, a little further east, and the very same square again.
            zone("voi:0", .noParking, square(47.37, 8.5405)),
            zone("bird:0", .noParking, square(47.37, 8.54))
        ], isDark: false)
        XCTAssertEqual(overlay.shapes.map(\.kind), [.noParking])
        assertExtent(try XCTUnwrap(overlay.shapes.first), [47.37, 8.54, 47.371, 8.5415])
    }

    func testEachKindIsKeptItsOwnZonesApartApartAndHolesOpen() throws {
        let frame = [
            square(47.37, 8.54, size: 0.003)[0],
            [
                GeoPoint(latitude: 47.371, longitude: 8.541), GeoPoint(latitude: 47.372, longitude: 8.541),
                GeoPoint(latitude: 47.372, longitude: 8.542), GeoPoint(latitude: 47.371, longitude: 8.542),
                GeoPoint(latitude: 47.371, longitude: 8.541)
            ]
        ]
        let overlay = ScooterZoneOverlay(zones: [
            zone("dott:0", .noRide, square(47.37, 8.54)),
            zone("bolt:0", .noParking, square(47.37, 8.54)),
            zone("bolt:1", .slow, square(47.37, 8.54), square(47.38, 8.55)),
            zone("voi:0", .noRide, frame)
        ], isDark: false)
        XCTAssertEqual(overlay.shapes.map(\.kind), [.noRide, .noParking, .slow, .slow])
        // Dott's square lies within the frame of Voi's, whose hole stays open.
        let noRide = overlay.shapes[0]
        assertExtent(noRide, [47.37, 8.54, 47.373, 8.543])
        XCTAssertTrue(covers(noRide, in: overlay, 47.3705, 8.5405))
        XCTAssertTrue(covers(noRide, in: overlay, 47.3725, 8.5425))
        XCTAssertFalse(covers(noRide, in: overlay, 47.3715, 8.5415))
    }

    func testACitysParkingPlacesAreMergedApartFromNoParking() throws {
        let overlay = ScooterZoneOverlay(zones: [
            zone("city:0", .parking, square(47.37, 8.54)),
            zone("lime:0", .noParking, square(47.37, 8.54)),
            zone("city:1", .parking, square(47.37, 8.5405))
        ], isDark: false)
        XCTAssertEqual(overlay.shapes.map(\.kind), [.noParking, .parking])
        assertExtent(overlay.shapes[1], [47.37, 8.54, 47.371, 8.5415])
    }

    func testOnlyTheZonesHandedInAreMergedSoOneProviderShownShowsItsOwn() throws {
        let zones = [zone("lime:0", .noRide, square(47.37, 8.54)), zone("voi:0", .noRide, square(47.37, 8.5405))]
        assertExtent(try XCTUnwrap(ScooterZoneOverlay(zones: zones, isDark: false).shapes.first), [47.37, 8.54, 47.371, 8.5415])
        let lime = ScooterZoneOverlay(zones: zones.filter { $0.provider == "lime" }, isDark: false)
        assertExtent(try XCTUnwrap(lime.shapes.first), [47.37, 8.54, 47.371, 8.541])
        XCTAssertTrue(ScooterZoneOverlay(zones: [], isDark: false).shapes.isEmpty)
    }

    /// A square of about 110 m by 110 m in Zürich, from its south-west corner.
    private func square(_ south: Double, _ west: Double, size: Double = 0.001) -> [[GeoPoint]] {
        [[
            GeoPoint(latitude: south, longitude: west), GeoPoint(latitude: south, longitude: west + size),
            GeoPoint(latitude: south + size, longitude: west + size), GeoPoint(latitude: south + size, longitude: west),
            GeoPoint(latitude: south, longitude: west)
        ]]
    }

    private func zone(_ id: String, _ kind: ScooterZoneKind, _ polygons: [[GeoPoint]]...) -> ScooterZone {
        ScooterZone(id: id, provider: String(id.prefix { $0 != ":" }), kind: kind, maxSpeedKph: nil, polygons: polygons)
    }

    /// South, west, north and east, to the centimetre or so.
    private func assertExtent(_ shape: ScooterZoneOverlay.Shape, _ expected: [Double], line: UInt = #line) {
        let southWest = MKMapPoint(x: shape.bounds.minX, y: shape.bounds.maxY).coordinate
        let northEast = MKMapPoint(x: shape.bounds.maxX, y: shape.bounds.minY).coordinate
        let extent = [southWest.latitude, southWest.longitude, northEast.latitude, northEast.longitude]
        for (value, wanted) in zip(extent, expected) {
            XCTAssertEqual(value, wanted, accuracy: 1e-7, "\(extent)", line: line)
        }
    }

    private func covers(_ shape: ScooterZoneOverlay.Shape, in overlay: ScooterZoneOverlay, _ latitude: Double, _ longitude: Double) -> Bool {
        let point = MKMapPoint(CLLocationCoordinate2D(latitude: latitude, longitude: longitude))
        let corner = overlay.boundingMapRect.origin
        return shape.path.contains(CGPoint(x: point.x - corner.x, y: point.y - corner.y), using: .evenOdd)
    }
}

@MainActor
final class ScooterZonesModelTests: XCTestCase {
    private let zurich = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417),
        span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
    )

    func testZonesAreOffUntilTurnedOnAndTheChoiceIsKept() {
        let defaults = isolatedDefaults()
        let model = makeModel(api: ZoneStubAPI(), defaults: defaults)
        XCTAssertFalse(model.showsZones)
        XCTAssertEqual(model.zoneState, .off)

        model.showsZones = true

        XCTAssertTrue(makeModel(api: ZoneStubAPI(), defaults: defaults).showsZones)
    }

    func testTheZonesOfTheMapsAreaAreDrawnForTheProvidersShown() async throws {
        let api = ZoneStubAPI()
        let model = makeModel(api: api)
        model.updateViewport(zurich, zoom: 16)
        XCTAssertEqual(model.zoneState, .off)
        let none = await waitUntil { await api.zoneAreas().isEmpty }
        XCTAssertTrue(none, "Nothing is asked for while the zones are off")

        model.showsZones = true

        let shown = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .shown }
        XCTAssertTrue(shown)
        let asked = await api.zoneAreas()
        XCTAssertEqual(asked, [ScooterZoneArea(covering: GeoBounds(south: 47.361, west: 8.521, north: 47.399, east: 8.559))])
        XCTAssertEqual(model.mapZones.map(\.id), ["lime:0", "bird:0"])

        model.showProviders([.lime])
        XCTAssertEqual(model.mapZones.map(\.id), ["lime:0"])
    }

    func testZonesAreNotAskedForFurtherOutThanZoom14AndComeBackWithoutAskingAgain() async throws {
        let api = ZoneStubAPI()
        let model = makeModel(api: api)
        model.showsZones = true
        model.updateViewport(zurich, zoom: 16)
        let shown = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .shown }
        XCTAssertTrue(shown)
        let revision = model.mapZonesRevision

        model.updateViewport(MKCoordinateRegion(center: zurich.center, span: MKCoordinateSpan(latitudeDelta: 0.08, longitudeDelta: 0.08)), zoom: 13)
        XCTAssertEqual(model.zoneState, .zoomIn)
        XCTAssertTrue(model.mapZones.isEmpty)
        XCTAssertGreaterThan(model.mapZonesRevision, revision)

        model.updateViewport(zurich, zoom: 16)
        XCTAssertEqual(model.zoneState, .shown)
        XCTAssertEqual(model.mapZones.count, 2)
        try await Task.sleep(for: .milliseconds(400))
        let areas = await api.zoneAreas()
        XCTAssertEqual(areas.count, 1)
    }

    func testANearbyViewIsServedByTheAnswerAtHandAndAnotherAreaIsAskedFor() async throws {
        let api = ZoneStubAPI()
        let model = makeModel(api: api)
        model.showsZones = true
        model.updateViewport(zurich, zoom: 16)
        let first = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .shown }
        XCTAssertTrue(first)

        // A few hundred metres on, within the area answered for.
        var nearby = zurich
        nearby.center.longitude += 0.003
        model.updateViewport(nearby, zoom: 16)
        XCTAssertEqual(model.zoneState, .shown)

        var bern = zurich
        bern.center = CLLocationCoordinate2D(latitude: 46.948, longitude: 7.4474)
        model.updateViewport(bern, zoom: 16)
        XCTAssertEqual(model.zoneState, .loading)
        XCTAssertEqual(model.mapZones.count, 2, "Zürich's stay drawn until Bern's come")
        let second = await waitUntil { await api.zoneAreas().count == 2 && model.zoneState == .shown }
        XCTAssertTrue(second)

        // Back in Zürich, the answer of a moment ago serves.
        model.updateViewport(zurich, zoom: 16)
        XCTAssertEqual(model.zoneState, .shown)
        try await Task.sleep(for: .milliseconds(400))
        let areas = await api.zoneAreas()
        XCTAssertEqual(areas.count, 2)
    }

    func testAFailureIsToldAndTurningTheZonesOffTakesThemAway() async throws {
        let api = ZoneStubAPI()
        await api.setFailure(.httpStatus(503))
        let model = makeModel(api: api)
        model.showsZones = true
        model.updateViewport(zurich, zoom: 16)
        let failed = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .failed }
        XCTAssertTrue(failed)
        XCTAssertTrue(model.mapZones.isEmpty)

        await api.setFailure(nil)
        model.showsZones = false
        XCTAssertEqual(model.zoneState, .off)
        model.showsZones = true
        let shown = await waitUntil { await api.zoneAreas().count == 2 && model.zoneState == .shown }
        XCTAssertTrue(shown, "Turned on again, the zones are asked for again")
        model.showsZones = false
        XCTAssertTrue(model.mapZones.isEmpty)
    }

    func testACitysRulesAreDrawnFromZoom14WithTheZonesOffAndDimmerOutsideTheirHours() {
        let hongdae = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 37.5545, longitude: 126.9245),
            span: MKCoordinateSpan(latitudeDelta: 0.008, longitudeDelta: 0.008)
        )
        // Noon in Seoul, then 23:00.
        var now = Date(timeIntervalSince1970: 1_792_983_600)
        let model = makeModel(api: ZoneStubAPI(), now: { now })
        model.updateViewport(hongdae, zoom: 16)

        XCTAssertEqual(model.zoneState, .off)
        XCTAssertEqual(model.mapRuleZones.map(\.rule.id), ["seoul-hongdae-red-road"])
        XCTAssertEqual(model.mapZones.map(\.id), ["rule:seoul-hongdae-red-road"])
        XCTAssertEqual(model.mapZones.map(\.strength), [1])
        let revision = model.mapZonesRevision

        now = now.addingTimeInterval(11 * 3600)
        model.autoRefreshIfNeeded()
        XCTAssertEqual(model.mapRuleZones.map(\.inForce), [false])
        XCTAssertEqual(model.mapZones.map(\.strength), [CityRuleZone.dimmed])
        XCTAssertGreaterThan(model.mapZonesRevision, revision)

        model.updateViewport(MKCoordinateRegion(center: hongdae.center, span: MKCoordinateSpan(latitudeDelta: 0.08, longitudeDelta: 0.08)), zoom: 13)
        XCTAssertTrue(model.mapRuleZones.isEmpty)
        XCTAssertTrue(model.mapZones.isEmpty)
    }

    func testACitysZonesAreDrawnFromZoom14WithTheZonesOffAndTheSameOnesOverAShortPan() {
        let porto = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 41.147, longitude: -8.611),
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        )
        let model = makeModel(api: ZoneStubAPI())
        model.updateViewport(porto, zoom: 16)

        XCTAssertEqual(model.zoneState, .off)
        XCTAssertFalse(model.mapRuleZones.isEmpty)
        XCTAssertTrue(model.mapRuleZones.allSatisfy { $0.rule.kind == .parking && $0.rule.authority == "Porto" && $0.inForce })
        XCTAssertTrue(model.mapZones.allSatisfy { $0.provider == "city" && $0.kind == .parking && $0.strength == 1 })
        XCTAssertTrue(Set(model.mapRuleZones.map { "rule:\($0.rule.id)" }).isSubset(of: model.mapZones.map(\.id)))
        XCTAssertEqual(model.mapOperatorZoneCount, 0)
        let revision = model.mapZonesRevision
        let inView = model.mapRuleZones

        // A third of the map on, other places are in view and the same are drawn.
        var nearby = porto
        nearby.center.longitude += 0.0033
        model.updateViewport(nearby, zoom: 16)
        XCTAssertNotEqual(model.mapRuleZones, inView)
        XCTAssertEqual(model.mapZonesRevision, revision)
        XCTAssertTrue(Set(model.mapRuleZones.map { "rule:\($0.rule.id)" }).isSubset(of: model.mapZones.map(\.id)))

        // Past the half of the map around it, they are picked again.
        nearby.center.longitude += 0.01
        model.updateViewport(nearby, zoom: 16)
        XCTAssertGreaterThan(model.mapZonesRevision, revision)
        XCTAssertTrue(Set(model.mapRuleZones.map { "rule:\($0.rule.id)" }).isSubset(of: model.mapZones.map(\.id)))

        model.updateViewport(MKCoordinateRegion(center: porto.center, span: MKCoordinateSpan(latitudeDelta: 0.08, longitudeDelta: 0.08)), zoom: 13)
        XCTAssertTrue(model.mapRuleZones.isEmpty)
        XCTAssertTrue(model.mapZones.isEmpty)
    }

    func testTheLegendCountsTheOperatorsZonesApartFromTheCitys() async {
        let porto = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 41.147, longitude: -8.611),
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        )
        let api = ZoneStubAPI()
        let model = makeModel(api: api)
        model.showsZones = true
        model.updateViewport(porto, zoom: 16)
        let shown = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .shown }
        XCTAssertTrue(shown)

        XCTAssertEqual(model.mapOperatorZoneCount, 2)
        XCTAssertEqual(model.mapZones.filter { $0.provider != "city" }.map(\.id), ["lime:0", "bird:0"])
        XCTAssertFalse(model.mapRuleZones.isEmpty)
        model.showProviders([.lime])
        XCTAssertEqual(model.mapOperatorZoneCount, 1)
    }

    private func makeModel(api: any ScooterAPIClient, defaults: UserDefaults? = nil, now: @escaping () -> Date = Date.init) -> ScooterMapModel {
        ScooterMapModel(api: api, locationManager: CLLocationManager(), defaults: defaults ?? isolatedDefaults(), now: now)
    }

    private func isolatedDefaults() -> UserDefaults {
        let suiteName = "ScootRadarTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        return defaults
    }

    /// Asks the stub first, so that the wait queues behind the request it waits for.
    private func waitUntil(attempts: Int = 200, condition: @escaping () async -> Bool) async -> Bool {
        for _ in 0 ..< attempts {
            if await condition() { return true }
            try? await Task.sleep(for: .milliseconds(10))
        }
        return false
    }
}

private actor ZoneStubAPI: ScooterAPIClient {
    private var failure: ScooterAPIError?
    private var areas: [ScooterZoneArea] = []

    func scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) async throws -> ScooterResponse {
        ScooterResponse(vehicles: [])
    }

    func zones(in area: ScooterZoneArea) async throws -> ScooterZoneResponse {
        areas.append(area)
        if let failure { throw failure }
        let ring = [
            GeoPoint(latitude: 47.37, longitude: 8.54), GeoPoint(latitude: 47.38, longitude: 8.54),
            GeoPoint(latitude: 47.38, longitude: 8.55), GeoPoint(latitude: 47.37, longitude: 8.54)
        ]
        return ScooterZoneResponse(zones: [
            ScooterZone(id: "lime:0", provider: "lime", kind: .noRide, maxSpeedKph: nil, polygons: [[ring]]),
            ScooterZone(id: "bird:0", provider: "bird", kind: .noParking, maxSpeedKph: nil, polygons: [[ring]])
        ], pending: false, truncated: false)
    }

    func zoneAreas() -> [ScooterZoneArea] { areas }

    func setFailure(_ failure: ScooterAPIError?) {
        self.failure = failure
    }
}

private actor ZoneNetworkSession: ScooterNetworkSession {
    let data: Data
    private(set) var lastRequest: URLRequest?

    init(data: Data) {
        self.data = data
    }

    func scooterData(for request: URLRequest) async throws -> (Data, URLResponse) {
        lastRequest = request
        let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: nil)!
        return (data, response)
    }
}

final class CityRuleZoneTests: XCTestCase {
    // Seoul is UTC+9 all year: noon there on 26 October 2026.
    private let seoulNoon = Date(timeIntervalSince1970: 1_792_983_600)
    private let hongdae = GeoBounds(south: 37.55, west: 126.918, north: 37.558, east: 126.93)
    private let daechi = GeoBounds(south: 37.493, west: 127.05, north: 37.5, east: 127.058)

    func testARuleHoldsWithinItsHoursByThePlacesClockFromItsFirstDay() throws {
        let rule = try XCTUnwrap(CityRuleZone.all.first { $0.id == "seoul-daechi-academy-street" })
        XCTAssertTrue(rule.inForce(at: seoulNoon))
        XCTAssertTrue(rule.inForce(at: seoulNoon.addingTimeInterval(11 * 3600 - 60)))
        XCTAssertFalse(rule.inForce(at: seoulNoon.addingTimeInterval(11 * 3600)))
        XCTAssertFalse(rule.inForce(at: seoulNoon.addingTimeInterval(-60)))
        // 29 September, 23:59 in Seoul: the day before it started.
        XCTAssertFalse(rule.inForce(at: Date(timeIntervalSince1970: 1_790_693_940)))
        XCTAssertTrue(rule.inForce(at: Date(timeIntervalSince1970: 1_790_694_000 + 12 * 3600)))
    }

    func testHoursPastMidnightHoldUntilTheyEnd() {
        let night = CityRuleZone.Hours(fromMinute: 22 * 60, untilMinute: 6 * 60)
        XCTAssertTrue(night.holds(atMinute: 23 * 60))
        XCTAssertTrue(night.holds(atMinute: 5 * 60))
        XCTAssertFalse(night.holds(atMinute: 12 * 60))
    }

    func testTheRulesOverTheViewAreShownFromZoom14() {
        let shown = CityRuleZone.shown(over: hongdae, zoom: 15, at: seoulNoon)
        XCTAssertEqual(shown.map(\.rule.id), ["seoul-hongdae-red-road"])
        XCTAssertEqual(shown.map(\.inForce), [true])
        XCTAssertTrue(CityRuleZone.shown(over: hongdae, zoom: 13, at: seoulNoon).isEmpty)
        XCTAssertEqual(CityRuleZone.shown(over: daechi, zoom: 16, at: seoulNoon).map(\.rule.authority), ["Gangnam-gu"])
        for rule in CityRuleZone.all {
            XCTAssertEqual(rule.source.scheme, "https")
            XCTAssertFalse(rule.polygons.isEmpty)
        }
    }

    func testAStreetsBandReachesHalfItsWidthEitherSideOfItsLine() {
        // About 200 m east, then 100 m north.
        let line = [
            GeoPoint(latitude: 37.5, longitude: 127), GeoPoint(latitude: 37.5, longitude: 127.00226),
            GeoPoint(latitude: 37.5009, longitude: 127.00226)
        ]
        let band = CityRuleZone.band(of: [line], widthMeters: 14)
        let covers = { (latitude: Double, longitude: Double) in
            band.contains { Self.ring($0[0], contains: GeoPoint(latitude: latitude, longitude: longitude)) }
        }
        XCTAssertTrue(covers(37.5 + 5 / 110_540, 127.001))
        XCTAssertFalse(covers(37.5 + 9 / 110_540, 127.001))
        XCTAssertTrue(covers(37.50045, 127.00226))
    }

    func testSeoulsStreetsAloneAreAllAndForbidRiding() {
        // Which streets they are is data/'s, which Android's CatalogParityTest holds to this catalog: here, what each is.
        XCTAssertFalse(CityRuleZone.all.isEmpty)
        XCTAssertTrue(CityRuleZone.all.allSatisfy { $0.kind == .noRide && !$0.lines.isEmpty })
        XCTAssertTrue(CityRuleZone.cityZones.allSatisfy { $0.lines.isEmpty })
        XCTAssertEqual(CityRuleZone.onMap.map(\.id), (CityRuleZone.all + CityRuleZone.cityZones).map(\.id))
        XCTAssertEqual(Set(CityRuleZone.onMap.map(\.id)).count, CityRuleZone.onMap.count)
    }

    func testBergensAndPortosZonesAreThereByKind() {
        // Which cities have zones, of which kinds and how many, is data/'s, read again from the cities, and Android's
        // CatalogParityTest holds it to this catalog: here, what holds of every city's. Each zone is its city's, which
        // names it and its rules once, and none is in two places.
        let cities = Dictionary(grouping: CityRuleZone.cityZones) { String($0.id.prefix { $0 != "-" }) }
        for (city, zones) in cities {
            XCTAssertTrue(zones.allSatisfy { $0.id.hasPrefix("\(city)-") }, city)
            XCTAssertEqual(Set(zones.map { [$0.authority, $0.timeZone, $0.source.absoluteString] }).count, 1, city)
        }
        XCTAssertEqual(Set(CityRuleZone.cityZones.map(\.id)).count, CityRuleZone.cityZones.count)
    }

    func testACitysZoneIsOneRingWithinItsBoundsThatAlwaysHolds() throws {
        for zone in CityRuleZone.cityZones {
            XCTAssertTrue(zone.lines.isEmpty && zone.hours.isEmpty && zone.firstDay.isEmpty, zone.id)
            XCTAssertEqual(zone.polygons.map(\.count), [1], zone.id)
            let ring = try XCTUnwrap(zone.polygons.first?.first)
            XCTAssertGreaterThanOrEqual(ring.count, 3, zone.id)
            XCTAssertTrue(ring.allSatisfy { zone.bounds.contains($0) }, zone.id)
            XCTAssertEqual(zone.source.scheme, "https")
            XCTAssertNotNil(TimeZone(identifier: zone.timeZone), zone.id)
            XCTAssertTrue(zone.inForce(at: seoulNoon), zone.id)
        }

        let ring = [
            GeoPoint(latitude: 41.15, longitude: -8.61), GeoPoint(latitude: 41.1501, longitude: -8.6098),
            GeoPoint(latitude: 41.1499, longitude: -8.6099)
        ]
        let zone = CityRuleZone(
            id: "porto-parking-test", authority: "Porto", timeZone: "Europe/Lisbon", kind: .parking,
            source: try XCTUnwrap(URL(string: "https://example.com")), ring: ring
        )
        XCTAssertEqual(zone.bounds, GeoBounds(south: 41.1499, west: -8.61, north: 41.1501, east: -8.6098))
        XCTAssertEqual(zone.polygons, [[ring]])
        // At any hour, from the first day there was.
        for date in [Date(timeIntervalSince1970: 0), seoulNoon, seoulNoon.addingTimeInterval(11 * 3600)] {
            XCTAssertTrue(zone.inForce(at: date))
        }
        let drawn = CityRuleZone.Shown(rule: zone, inForce: true).mapZone
        XCTAssertEqual(drawn.id, "rule:porto-parking-test")
        XCTAssertEqual(drawn.provider, "city")
        XCTAssertEqual(drawn.kind, .parking)
        XCTAssertEqual(drawn.polygons, [[ring]])
        XCTAssertEqual(drawn.strength, 1)
    }

    func testACitysZonesAreShownFromZoom14() throws {
        let zones = try bergensAndPortosZones()
        let porto = GeoBounds(south: 41.14, west: -8.62, north: 41.16, east: -8.6)
        let shown = CityRuleZone.shown(over: porto, zoom: 14, at: seoulNoon, among: zones)
        XCTAssertEqual(shown.map(\.rule.id), ["porto-parking-1abcfc08"])
        XCTAssertTrue(shown.allSatisfy { $0.rule.authority == "Porto" && $0.rule.kind == .parking && $0.inForce })
        XCTAssertTrue(CityRuleZone.shown(over: porto, zoom: 13, at: seoulNoon, among: zones).isEmpty)
        let bergen = GeoBounds(south: 60.372, west: 5.305, north: 60.412, east: 5.343)
        XCTAssertEqual(
            Set(CityRuleZone.shown(over: bergen, zoom: 14, at: seoulNoon, among: zones).map(\.rule.kind)),
            Set(ScooterZoneKind.allCases)
        )
        // The catalog's own, as the app reads them: each over its own place.
        for zone in CityRuleZone.cityZones {
            XCTAssertTrue(CityRuleZone.shown(over: zone.bounds, zoom: 14, at: seoulNoon).contains { $0.rule == zone }, zone.id)
        }
    }

    /// Bergen's zones, one of each kind in the view of its centre above, and four corners of two of Porto's discs, one in
    /// its view and one far off, as data/ had them on 29 October 2026: data/ is read again from the cities, so the tests
    /// make them.
    private func bergensAndPortosZones() throws -> [CityRuleZone] {
        let bergen = "https://www.bergen.kommune.no/innbyggerhjelpen/vann-vei-og-trafikk/vei-transport-og-parkering/sykkel/elsparkesykler-i-bergen"
        let porto = "https://echoboomer.pt/policia-municipal-porto-multou-trotinetes-mal-estacionadas"
        return [
            try cityZone("bergen-no-ride-173", "Bergen kommune", "Europe/Oslo", .noRide, source: bergen,
                         ring: [60.406298, 5.329251, 60.406236, 5.329943, 60.405699, 5.329686, 60.405785, 5.328995]),
            try cityZone("bergen-no-parking-42", "Bergen kommune", "Europe/Oslo", .noParking, source: bergen,
                         ring: [60.375404, 5.334097, 60.375545, 5.333442, 60.375618, 5.333514, 60.375477, 5.334164]),
            try cityZone("bergen-slow-6", "Bergen kommune", "Europe/Oslo", .slow, source: bergen,
                         ring: [60.393893, 5.317572, 60.393747, 5.317297, 60.394023, 5.316497, 60.394219, 5.316875]),
            try cityZone("bergen-parking-61", "Bergen kommune", "Europe/Oslo", .parking, source: bergen,
                         ring: [60.388009, 5.331895, 60.38795, 5.331834, 60.387962, 5.331793]),
            try cityZone("porto-parking-1abcfc08", "Porto", "Europe/Lisbon", .parking, source: porto,
                         ring: [41.144129, -8.609594, 41.144174, -8.609654, 41.144129, -8.609714, 41.144084, -8.609654]),
            try cityZone("porto-parking-0e66c7e0", "Porto", "Europe/Lisbon", .parking, source: porto,
                         ring: [41.172801, -8.646859, 41.172846, -8.646918, 41.172801, -8.646978, 41.172755, -8.646918])
        ]
    }

    /// A city's zone of one ring, its corners given latitude first.
    private func cityZone(
        _ id: String, _ authority: String, _ timeZone: String, _ kind: ScooterZoneKind, source: String, ring: [Double]
    ) throws -> CityRuleZone {
        CityRuleZone(
            id: id, authority: authority, timeZone: timeZone, kind: kind, source: try XCTUnwrap(URL(string: source)),
            ring: stride(from: 0, to: ring.count, by: 2).map { GeoPoint(latitude: ring[$0], longitude: ring[$0 + 1]) }
        )
    }

    @MainActor
    func testTheLegendHasALineForEachKindAndWhoSetsItTheStrongestRuleFirst() throws {
        let hongdae = try XCTUnwrap(CityRuleZone.all.first { $0.id == "seoul-hongdae-red-road" })
        // Porto's and Bergen's zones, made here as data/ changes them: where they are is not the legend's.
        let ring = [60.39, 5.32, 60.3901, 5.32, 60.3901, 5.3201]
        let porto = try cityZone("porto-parking-1", "Porto", "Europe/Lisbon", .parking, source: "https://example.com/porto", ring: ring)
        let bergen = try [ScooterZoneKind.parking, .parking, .slow, .noRide, .noParking].enumerated().map { index, kind in
            try cityZone("bergen-\(index)", "Bergen kommune", "Europe/Oslo", kind, source: "https://example.com/bergen", ring: ring)
        }
        let first = { (kind: ScooterZoneKind) in try XCTUnwrap(bergen.first { $0.kind == kind }) }
        let rules = [porto] + bergen.filter { $0.kind == .parking }.prefix(2)
            + [try first(.slow), try first(.noRide), try first(.noParking), hongdae]
        let legend = ZoneLegend(state: .off, count: 0, rules: rules.map { CityRuleZone.Shown(rule: $0, inForce: true) })

        let lines = legend.ruleLines
        XCTAssertEqual(lines.map(\.kind), [.noRide, .noRide, .noParking, .slow, .parking, .parking])
        let texts = lines.map { String($0.text.characters) }
        XCTAssertEqual(texts[0], "\(ScooterZoneKind.noRide.label) · Bergen kommune")
        // "No riding 12:00–23:00 · Seoul", in the user's format.
        XCTAssertTrue(texts[1].hasPrefix("\(ScooterZoneKind.noRide.label) "), texts[1])
        XCTAssertTrue(texts[1].contains("–"), texts[1])
        XCTAssertTrue(texts[1].hasSuffix(" · Seoul"), texts[1])
        XCTAssertEqual(texts[2], "\(ScooterZoneKind.noParking.label) · Bergen kommune")
        XCTAssertEqual(texts[3], "\(ScooterZoneKind.slow.label) · Bergen kommune")
        XCTAssertEqual(texts[4], "\(ScooterZoneKind.parking.label) · Porto")
        XCTAssertEqual(texts[5], "\(ScooterZoneKind.parking.label) · Bergen kommune")
        // Who sets it, linked to where they say so.
        XCTAssertEqual(lines[4].text.runs.compactMap { $0.link }, [porto.source])
        XCTAssertEqual(lines[5].text.runs.compactMap { $0.link }, [bergen[0].source])
    }

    func testARuleOutsideItsHoursIsDrawnApartAndDimmer() throws {
        let rule = try XCTUnwrap(CityRuleZone.all.first { $0.id == "seoul-hongdae-red-road" })
        let ring = rule.polygons[0][0]
        let overlay = ScooterZoneOverlay(zones: [
            CityRuleZone.Shown(rule: rule, inForce: false).mapZone,
            ScooterZone(id: "lime:0", provider: "lime", kind: .noRide, maxSpeedKph: nil, polygons: [[ring]])
        ], isDark: false)
        XCTAssertEqual(Set(overlay.shapes.map(\.strength)), [CityRuleZone.dimmed, 1])
        XCTAssertTrue(overlay.shapes.allSatisfy { $0.kind == .noRide })
    }

    /// Ray casting.
    private static func ring(_ ring: [GeoPoint], contains point: GeoPoint) -> Bool {
        var inside = false
        var previous = ring[ring.count - 1]
        for corner in ring {
            if (corner.latitude > point.latitude) != (previous.latitude > point.latitude),
               point.longitude < (previous.longitude - corner.longitude) * (point.latitude - corner.latitude)
                / (previous.latitude - corner.latitude) + corner.longitude {
                inside.toggle()
            }
            previous = corner
        }
        return inside
    }
}
