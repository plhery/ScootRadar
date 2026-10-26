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
        XCTAssertEqual(response.zones.map(\.id), ["lime:0", "bird:3"])
        XCTAssertEqual(response.zones.map(\.kind), [.noRide, .slow])
        XCTAssertEqual(response.zones[0].polygons[0].count, 2, "The outer ring and its hole")
        XCTAssertEqual(response.zones[0].polygons[0][0][1], GeoPoint(latitude: 47.38, longitude: 8.54))
        XCTAssertEqual(response.zones[1].maxSpeedKph, 15)
    }

    func testEveryLanguageNamesTheZones() throws {
        let keys = [
            "Ride and parking zones", "Zones", "No riding", "No parking", "Slow",
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
            XCTAssertFalse(rule.band.isEmpty)
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

    func testARuleOutsideItsHoursIsDrawnApartAndDimmer() throws {
        let rule = try XCTUnwrap(CityRuleZone.all.first { $0.id == "seoul-hongdae-red-road" })
        let ring = rule.band[0][0]
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
