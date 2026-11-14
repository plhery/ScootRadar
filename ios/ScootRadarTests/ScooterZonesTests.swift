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

    func testAnAnswerSaysWhetherSomeFeedsZonesCouldNotBeReadAndAnOlderServersSaysTheyAllWere() throws {
        let unreadable = #"{"zones":[],"meta":{"generatedAt":"2026-11-08T10:00:00.000Z","pending":false,"unavailable":true,"truncated":false}}"#
        XCTAssertTrue(try JSONDecoder().decode(ScooterZoneResponse.self, from: Data(unreadable.utf8)).unavailable)
        // A server of before 8 November 2026 says nothing of it.
        let older = #"{"zones":[],"meta":{"generatedAt":"2026-11-08T10:00:00.000Z","pending":false,"truncated":true}}"#
        let response = try JSONDecoder().decode(ScooterZoneResponse.self, from: Data(older.utf8))
        XCTAssertFalse(response.unavailable)
        XCTAssertTrue(response.truncated)
    }

    @MainActor
    func testTheLegendSaysThereAreNoneOnlyWhereAllTheAreasZonesAreKnownAndToZoomInWhereSomeWereLeftOut() {
        XCTAssertEqual(ZoneLegend(state: .shown, count: 0).note(hasRules: false), String(localized: "No zones published here"))
        // Unknown rules are not no rules.
        let failed = ZoneLegend(state: .failed, count: 0)
        XCTAssertEqual(failed.note(hasRules: false), String(localized: "Zones unavailable right now"))
        XCTAssertEqual(failed.kinds(besideNote: true), [])
        // Those that came are drawn, and named, while the rest are on their way.
        let loading = ZoneLegend(state: .loading, count: 0)
        XCTAssertNil(loading.note(hasRules: false))
        XCTAssertEqual(loading.kinds(besideNote: false), ScooterZoneKind.operatorKinds)
        // Those drawn are named still, beside the note.
        let partial = ZoneLegend(state: .partial, count: 3, slowSpeeds: speeds(10))
        XCTAssertEqual(partial.note(hasRules: false), String(localized: "Zoom in to see the zones"))
        XCTAssertEqual(partial.kinds(besideNote: true), ScooterZoneKind.operatorKinds)
        XCTAssertEqual(partial.kindSpeeds(besideNote: true).known, 10 ... 10)
    }

    /// One feed's zones unreadable, the others' drawn: the legend says the zones are unavailable, and names the
    /// kinds of those drawn beside it, as where some were left out (week review, finding 3.3).
    @MainActor
    func testTheKindsOfTheZonesDrawnAreNamedBesideTheNoteWhereAFeedsCouldNotBeRead() {
        let failed = ZoneLegend(state: .failed, count: 3, slowSpeeds: speeds(5))
        XCTAssertEqual(failed.note(hasRules: false), String(localized: "Zones unavailable right now"))
        XCTAssertEqual(failed.kinds(besideNote: true), ScooterZoneKind.operatorKinds)
        XCTAssertEqual(failed.kindSpeeds(besideNote: true).known, 5 ... 5)
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

extension ScooterZonesTests {
    func testTheLegendsSpeedsAreTheLeastAndGreatestUnlessAZoneHasNone() {
        XCTAssertNil(ScooterZoneSpeeds().known)
        XCTAssertEqual(speeds(6).known, 6 ... 6)
        XCTAssertEqual(speeds(12, 6, 15).known, 6 ... 15)
        // One zone without a speed, and "Slow" says none.
        XCTAssertNil(speeds(6, nil, 15).known)
        XCTAssertNil(speeds(.nan).known)
        let ring = [GeoPoint(latitude: 47.37, longitude: 8.54), GeoPoint(latitude: 47.38, longitude: 8.54), GeoPoint(latitude: 47.38, longitude: 8.55)]
        let zones = [
            ScooterZone(id: "lime:slow", provider: "lime", kind: .slow, maxSpeedKph: 10, polygons: [[ring]]),
            ScooterZone(id: "lime:0", provider: "lime", kind: .noRide, maxSpeedKph: nil, polygons: [[ring]]),
            ScooterZone(id: "bird:slow", provider: "bird", kind: .slow, maxSpeedKph: 20, polygons: [[ring]])
        ]
        XCTAssertEqual(ScooterZoneSpeeds(slowZonesOf: zones).known, 10 ... 20)
        let without = ScooterZone(id: "voi:slow", provider: "voi", kind: .slow, maxSpeedKph: nil, polygons: [[ring]])
        XCTAssertNil(ScooterZoneSpeeds(slowZonesOf: zones + [without]).known)
        XCTAssertEqual(ScooterZoneSpeeds(slowZonesOf: zones.filter { $0.kind == .noRide }), ScooterZoneSpeeds())
    }
}

/// The speeds of zones, in km/h, as the legend sums them up.
private func speeds(_ kph: Double?...) -> ScooterZoneSpeeds {
    var speeds = ScooterZoneSpeeds()
    for speed in kph { speeds.add(speed) }
    return speeds
}

/// ICU's spaces, before a unit in French, as plain ones.
private func plainSpaces(_ text: String) -> String {
    text.replacingOccurrences(of: "\u{00A0}", with: " ").replacingOccurrences(of: "\u{202F}", with: " ")
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

    func testARingThatGoesRoundAHoleAndBackLeavesTheHoleOpen() throws {
        // A city's zone with a hole is one ring (data/city-zones.json, as some of Västerås's): round its outline, then
        // from its first corner round the hole the other way and back.
        let outline = Array(square(47.37, 8.54, size: 0.003)[0].dropLast())
        let hole = Array(square(47.371, 8.541)[0].dropLast().reversed())
        let ring = [outline[0]] + hole + [hole[0], outline[0]] + outline.dropFirst()
        let overlay = ScooterZoneOverlay(zones: [zone("city:0", .noParking, [ring])], isDark: false)
        let shape = try XCTUnwrap(overlay.shapes.first)
        XCTAssertEqual(overlay.shapes.count, 1)
        assertExtent(shape, [47.37, 8.54, 47.373, 8.543])
        XCTAssertTrue(covers(shape, in: overlay, 47.3705, 8.5405))
        XCTAssertTrue(covers(shape, in: overlay, 47.3725, 8.5425))
        XCTAssertFalse(covers(shape, in: overlay, 47.3715, 8.5415))
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

    func testZonesAreOnUntilTurnedOffAndTheChoiceIsKept() {
        let defaults = isolatedDefaults()
        let model = makeModel(api: ZoneStubAPI(), defaults: defaults)
        XCTAssertTrue(model.showsZones)

        model.showsZones = false
        XCTAssertEqual(model.zoneState, .off)

        XCTAssertFalse(makeModel(api: ZoneStubAPI(), defaults: defaults).showsZones)
    }

    func testTheZonesOfTheMapsAreaAreDrawnForTheProvidersShown() async throws {
        let api = ZoneStubAPI()
        let model = makeModel(api: api)
        model.showsZones = false
        model.updateViewport(zurich, zoom: 16)
        XCTAssertEqual(model.zoneState, .off)
        let none = await waitUntil { await api.zoneAreas().isEmpty }
        XCTAssertTrue(none, "Nothing is asked for while the zones are off")

        model.showsZones = true

        let shown = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .shown }
        XCTAssertTrue(shown)
        let asked = await api.zoneAreas()
        XCTAssertEqual(asked, [ScooterZoneArea(covering: GeoBounds(south: 47.361, west: 8.521, north: 47.399, east: 8.559))])
        XCTAssertEqual(operatorZones(model).map(\.id), ["lime:0", "bird:0"])

        model.showProviders([.lime])
        XCTAssertEqual(operatorZones(model).map(\.id), ["lime:0"])
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
        XCTAssertEqual(operatorZones(model).count, 2)
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
        XCTAssertEqual(operatorZones(model).count, 2, "Zürich's stay drawn until Bern's come")
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
        XCTAssertTrue(operatorZones(model).isEmpty)

        await api.setFailure(nil)
        model.showsZones = false
        XCTAssertEqual(model.zoneState, .off)
        model.showsZones = true
        let shown = await waitUntil { await api.zoneAreas().count == 2 && model.zoneState == .shown }
        XCTAssertTrue(shown, "Turned on again, the zones are asked for again")
        model.showsZones = false
        XCTAssertTrue(operatorZones(model).isEmpty)
    }

    func testAFailedAnswerIsAskedForAgainWithTheScootersSoTheZonesComeBackWithThem() async throws {
        let api = ZoneStubAPI()
        await api.setFailure(.offline)
        let model = makeModel(api: api)
        model.showsZones = true
        model.updateViewport(zurich, zoom: 16)
        let failed = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .failed }
        XCTAssertTrue(failed)

        // Still within the area, the failure no longer stands once the network is back.
        await api.setFailure(nil)
        model.retryLoad()
        let shown = await waitUntil { await api.zoneAreas().count == 2 && model.zoneState == .shown }
        XCTAssertTrue(shown, "A refresh asks for the zones again with the scooters")
        XCTAssertEqual(operatorZones(model).count, 2)

        // A whole answer at hand is not asked for again.
        model.refresh()
        try await Task.sleep(for: .milliseconds(400))
        let areas = await api.zoneAreas()
        XCTAssertEqual(areas.count, 2)
    }

    func testACitysRulesAreDrawnFromZoom14WithTheZonesOffAndDimmerOutsideTheirHours() {
        let hongdae = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 37.5545, longitude: 126.9245),
            span: MKCoordinateSpan(latitudeDelta: 0.008, longitudeDelta: 0.008)
        )
        // Noon in Seoul, then 23:00.
        var now = Date(timeIntervalSince1970: 1_792_983_600)
        let model = makeModel(api: ZoneStubAPI(), now: { now })
        model.showsZones = false
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

    /// A map paused while nobody touches it draws a city's rule outside its hours once they end, without asking for
    /// anything: the timer that redrew the rules stopped with the refreshes, and Hongdae's red road was drawn in force
    /// past 23:00 (fresh-eyes review of 14 November 2026, iPhone finding 4; the Android review's S5).
    func testAPausedMapDrawsACitysRuleOutsideItsHoursOnceTheyEndWithoutAskingForAnything() async throws {
        let (model, api, clock) = await hongdaeAt22(rulesCheck: 0.1)
        // Nobody touches the map: at 22:31 its refreshes pause.
        clock.now = seoulNoon.addingTimeInterval(10 * 3600 + 31 * 60)
        let paused = await waitUntil { model.isPausedForIdle }
        XCTAssertTrue(paused)
        let asked = await api.scootersAsked()

        // 23:01: the red road's hours are over.
        clock.now = seoulNoon.addingTimeInterval(11 * 3600 + 60)
        let redrawn = await waitUntil { model.mapRuleZones.map(\.inForce) == [false] }
        XCTAssertTrue(redrawn, "Hongdae's rule still drawn in force at 23:01")
        XCTAssertTrue(model.isPausedForIdle)
        let askedSince = await api.scootersAsked()
        XCTAssertEqual(askedSince, asked)
    }

    /// A touch on the paused map, or coming back to the app, draws the cities' rules as they are at once, where they
    /// waited for the timer's next tick, up to a minute (fresh-eyes review of 14 November 2026, iPhone finding 4).
    func testATouchOnThePausedMapOrComingBackToTheAppDrawsACitysRulesAsTheyAreAtOnce() async throws {
        // Paused at 22:31, its rules not looked at again before the touch at 23:01.
        let (touched, _, touchedClock) = await hongdaeAt22(rulesCheck: 3600)
        touchedClock.now = seoulNoon.addingTimeInterval(10 * 3600 + 31 * 60)
        let paused = await waitUntil { touched.isPausedForIdle }
        XCTAssertTrue(paused)
        touchedClock.now = seoulNoon.addingTimeInterval(11 * 3600 + 60)
        touched.noteInteraction()
        XCTAssertEqual(touched.mapRuleZones.map(\.inForce), [false], "touched at 23:01")

        // In the background from 22:00, back at 23:05.
        let (away, _, awayClock) = await hongdaeAt22(rulesCheck: 3600)
        away.becameInactive()
        awayClock.now = seoulNoon.addingTimeInterval(11 * 3600 + 5 * 60)
        away.becameActive()
        XCTAssertEqual(away.mapRuleZones.map(\.inForce), [false], "back at 23:05")
    }

    /// Noon in Seoul. Hongdae's red road holds from 12:00 to 23:00 there.
    private let seoulNoon = Date(timeIntervalSince1970: 1_792_983_600)

    /// A map loaded on Hongdae at 22:00 in Seoul, with the zones off and its red road drawn in force. Its refresh
    /// timer comes round every tenth of a second on the test's clock; paused, it looks at the rules every `rulesCheck`.
    /// The cities' zone index it asks for has none, as one at hand asks for nothing more.
    private func hongdaeAt22(rulesCheck: TimeInterval) async -> (ScooterMapModel, ZoneStubAPI, ZoneTestClock) {
        let hongdae = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 37.5545, longitude: 126.9245),
            span: MKCoordinateSpan(latitudeDelta: 0.008, longitudeDelta: 0.008)
        )
        let clock = ZoneTestClock(now: seoulNoon.addingTimeInterval(10 * 3600))
        let api = ZoneStubAPI(cityIndex: Data(#"{"format":1,"cities":[]}"#.utf8))
        let model = makeModel(
            api: api, refreshPolicy: ScooterRefreshPolicy(defaultRefreshAfter: 0.1, minimumAttemptGap: 0.1, pausedRulesCheck: rulesCheck),
            now: { clock.now }
        )
        model.showsZones = false
        model.updateViewport(hongdae, zoom: 16)
        model.refresh()
        let loaded = await waitUntil { await api.scootersAsked() == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        XCTAssertEqual(model.mapRuleZones.map(\.rule.id), ["seoul-hongdae-red-road"])
        XCTAssertEqual(model.mapRuleZones.map(\.inForce), [true])
        return (model, api, clock)
    }

    func testACitysZonesAreDrawnFromZoom14WithTheZonesOffAndTheSameOnesOverAShortPan() {
        let porto = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 41.147, longitude: -8.611),
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        )
        let model = makeModel(api: ZoneStubAPI())
        model.showsZones = false
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

    func testTheLegendSaysTheLimitsOfTheOperatorsSlowZonesDrawn() async {
        // Lime's at 15 km/h and Bird's at 20: "Slow: 15–20 km/h", then Lime's alone, and none where one has no limit.
        let porto = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 41.147, longitude: -8.611),
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        )
        let ring = [
            GeoPoint(latitude: 47.37, longitude: 8.54), GeoPoint(latitude: 47.38, longitude: 8.54),
            GeoPoint(latitude: 47.38, longitude: 8.55), GeoPoint(latitude: 47.37, longitude: 8.54)
        ]
        let slow = { (provider: String, kph: Double?) in
            ScooterZone(id: "\(provider):slow", provider: provider, kind: .slow, maxSpeedKph: kph, polygons: [[ring]])
        }
        let api = ZoneStubAPI(more: [slow("lime", 15), slow("bird", 20)])
        let model = makeModel(api: api)
        model.showsZones = true
        model.updateViewport(porto, zoom: 16)
        let shown = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .shown }
        XCTAssertTrue(shown)

        XCTAssertEqual(model.mapOperatorSlowSpeeds.known, 15 ... 20)
        model.showProviders([.lime])
        XCTAssertEqual(model.mapOperatorSlowSpeeds.known, 15 ... 15)

        let without = ZoneStubAPI(more: [slow("lime", 15), slow("bird", nil)])
        let other = makeModel(api: without)
        other.showsZones = true
        other.updateViewport(porto, zoom: 16)
        let otherShown = await waitUntil { await without.zoneAreas().count == 1 && other.zoneState == .shown }
        XCTAssertTrue(otherShown)
        XCTAssertNil(other.mapOperatorSlowSpeeds.known)
    }

    func testAnAreaWhoseZonesCouldNotBeReadSaysTheyAreUnavailableNotThatItHasNone() async throws {
        let api = ZoneStubAPI()
        await api.setAnswer(unavailable: true)
        let model = makeModel(api: api)
        model.showsZones = true
        model.updateViewport(zurich, zoom: 16)
        let failed = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .failed }
        XCTAssertTrue(failed)
        // Those read are drawn, and the area is not said to have no others.
        XCTAssertEqual(operatorZones(model).map(\.id), ["lime:0", "bird:0"])
        let legend = ZoneLegend(state: model.zoneState, count: model.mapOperatorZoneCount)
        XCTAssertEqual(legend.note(hasRules: false), String(localized: "Zones unavailable right now"))
        // With the kinds of those drawn.
        XCTAssertEqual(legend.kinds(besideNote: true), ScooterZoneKind.operatorKinds)

        // The next refresh of the scooters asks again, once the server has tried the feed again.
        await api.setAnswer()
        model.refresh()
        let shown = await waitUntil { await api.zoneAreas().count == 2 && model.zoneState == .shown }
        XCTAssertTrue(shown)
        XCTAssertEqual(operatorZones(model).count, 2)
    }

    func testAnAnswerWithZonesThatCouldNotBeReadIsNotKeptForTheMapToComeBackTo() async throws {
        let api = ZoneStubAPI()
        await api.setAnswer(unavailable: true)
        let model = makeModel(api: api)
        model.showsZones = true
        model.updateViewport(zurich, zoom: 16)
        let failed = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .failed }
        XCTAssertTrue(failed)

        await api.setAnswer()
        var bern = zurich
        bern.center = CLLocationCoordinate2D(latitude: 46.948, longitude: 7.4474)
        model.updateViewport(bern, zoom: 16)
        let second = await waitUntil { await api.zoneAreas().count == 2 && model.zoneState == .shown }
        XCTAssertTrue(second)

        // Back in Zürich, its zones are asked for again, not said unavailable from memory.
        model.updateViewport(zurich, zoom: 16)
        XCTAssertEqual(model.zoneState, .loading)
        let third = await waitUntil { await api.zoneAreas().count == 3 && model.zoneState == .shown }
        XCTAssertTrue(third)
    }

    func testZonesStillOnTheirWayAreLoadingWithThoseThatCameDrawnUntilTheRestCome() async throws {
        let api = ZoneStubAPI()
        await api.setAnswer(pending: true)
        let model = makeModel(api: api, zonePendingRetry: .milliseconds(300))
        model.showsZones = true
        model.updateViewport(zurich, zoom: 16)
        let drawn = await waitUntil { await api.zoneAreas().count == 1 && model.mapOperatorZoneCount == 2 }
        XCTAssertTrue(drawn)
        // What came is drawn meanwhile; that there are no others is not known yet.
        XCTAssertEqual(model.zoneState, .loading)

        await api.setAnswer()
        let shown = await waitUntil { model.zoneState == .shown }
        XCTAssertTrue(shown)
        let areas = await api.zoneAreas()
        XCTAssertGreaterThanOrEqual(areas.count, 2)
        XCTAssertEqual(model.mapOperatorZoneCount, 2)
    }

    func testZonesStillOnTheirWayAfterTheLastTryAreSaidUnavailableAndAskedForAgainWithTheScooters() async throws {
        let api = ZoneStubAPI()
        await api.setAnswer(pending: true)
        let model = makeModel(api: api, zonePendingRetry: .milliseconds(10))
        model.showsZones = true
        model.updateViewport(zurich, zoom: 16)
        // The first answer and three more tries.
        let failed = await waitUntil { await api.zoneAreas().count == 4 && model.zoneState == .failed }
        XCTAssertTrue(failed)
        XCTAssertEqual(model.mapOperatorZoneCount, 2, "Those that came stay drawn")
        try await Task.sleep(for: .milliseconds(100))
        let tries = await api.zoneAreas()
        XCTAssertEqual(tries.count, 4)

        await api.setAnswer()
        model.refresh()
        let shown = await waitUntil { await api.zoneAreas().count == 5 && model.zoneState == .shown }
        XCTAssertTrue(shown)
    }

    /// Zones that cannot be had are asked for again with the next three refreshes of the scooters, as the web asks
    /// for an unreadable feed's three more times, then not until the map comes to the area anew (week review,
    /// choice 15).
    func testZonesThatCannotBeHadAreAskedForAgainThreeTimesThenWhenTheMapComesBack() async throws {
        let api = ZoneStubAPI()
        await api.setAnswer(unavailable: true)
        let model = makeModel(api: api)
        model.showsZones = true
        model.updateViewport(zurich, zoom: 16)
        let failed = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .failed }
        XCTAssertTrue(failed)
        for count in 2 ... 4 {
            model.refresh()
            let asked = await waitUntil { await api.zoneAreas().count == count }
            XCTAssertTrue(asked, "Refresh \(count - 1)")
            // Its answer in.
            try await Task.sleep(for: .milliseconds(100))
            XCTAssertEqual(model.zoneState, .failed)
        }
        model.refresh()
        try await Task.sleep(for: .milliseconds(300))
        var areas = await api.zoneAreas()
        XCTAssertEqual(areas.count, 4)
        XCTAssertEqual(model.zoneState, .failed)
        XCTAssertEqual(model.mapOperatorZoneCount, 2, "Those that came stay drawn")

        // Away and back, the area is asked for anew, and again with the next refresh.
        var bern = zurich
        bern.center = CLLocationCoordinate2D(latitude: 46.948, longitude: 7.4474)
        model.updateViewport(bern, zoom: 16)
        let away = await waitUntil { await api.zoneAreas().count == 5 }
        XCTAssertTrue(away)
        model.updateViewport(zurich, zoom: 16)
        let back = await waitUntil { await api.zoneAreas().count == 6 }
        XCTAssertTrue(back)
        try await Task.sleep(for: .milliseconds(100))
        await api.setAnswer()
        model.refresh()
        let shown = await waitUntil { await api.zoneAreas().count == 7 && model.zoneState == .shown }
        XCTAssertTrue(shown)
        areas = await api.zoneAreas()
        XCTAssertEqual(areas[6], areas[0])
    }

    func testAnAnswerWithZonesLeftOutAsksToZoomInBesideTheKindsAndStillDoesFromMemory() async throws {
        let api = ZoneStubAPI()
        await api.setAnswer(truncated: true)
        let model = makeModel(api: api)
        model.showsZones = true
        model.updateViewport(zurich, zoom: 16)
        let partial = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .partial }
        XCTAssertTrue(partial)
        XCTAssertEqual(model.mapOperatorZoneCount, 2)

        // Further out and back, the answer at hand still says so.
        model.updateViewport(MKCoordinateRegion(center: zurich.center, span: MKCoordinateSpan(latitudeDelta: 0.08, longitudeDelta: 0.08)), zoom: 13)
        XCTAssertEqual(model.zoneState, .zoomIn)
        model.updateViewport(zurich, zoom: 16)
        XCTAssertEqual(model.zoneState, .partial)

        await api.setAnswer()
        var bern = zurich
        bern.center = CLLocationCoordinate2D(latitude: 46.948, longitude: 7.4474)
        model.updateViewport(bern, zoom: 16)
        let second = await waitUntil { await api.zoneAreas().count == 2 && model.zoneState == .shown }
        XCTAssertTrue(second)

        // Back in Zürich, the answer of a moment ago serves, and still says some were left out.
        model.updateViewport(zurich, zoom: 16)
        XCTAssertEqual(model.zoneState, .partial)
        XCTAssertEqual(model.mapOperatorZoneCount, 2)
        try await Task.sleep(for: .milliseconds(400))
        let areas = await api.zoneAreas()
        XCTAssertEqual(areas.count, 2)
    }

    func testAnAnswerWithZonesLeftOutServesItsOwnAreaAloneSoThatZoomingInAsksForTheRest() async throws {
        let api = ZoneStubAPI()
        await api.setAnswer(truncated: true)
        let model = makeModel(api: api)
        model.showsZones = true
        model.updateViewport(zurich, zoom: 16)
        let partial = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .partial }
        XCTAssertTrue(partial)

        // Within the same area, the answer stands.
        var nearby = zurich
        nearby.center.longitude += 0.003
        model.updateViewport(nearby, zoom: 16)
        XCTAssertEqual(model.zoneState, .partial)
        try await Task.sleep(for: .milliseconds(400))
        var areas = await api.zoneAreas()
        XCTAssertEqual(areas.count, 1)

        // Zoomed in, the smaller area within it is asked for, those drawn staying meanwhile.
        await api.setAnswer()
        model.updateViewport(MKCoordinateRegion(center: zurich.center, span: MKCoordinateSpan(latitudeDelta: 0.004, longitudeDelta: 0.004)), zoom: 17)
        XCTAssertEqual(model.zoneState, .loading)
        XCTAssertEqual(model.mapOperatorZoneCount, 2)
        let shown = await waitUntil { await api.zoneAreas().count == 2 && model.zoneState == .shown }
        XCTAssertTrue(shown)
        areas = await api.zoneAreas()
        XCTAssertTrue(areas[0].contains(areas[1]) && areas[0] != areas[1])

        // Back out, the answer of a moment ago serves its own area.
        model.updateViewport(zurich, zoom: 16)
        XCTAssertEqual(model.zoneState, .partial)
        try await Task.sleep(for: .milliseconds(400))
        areas = await api.zoneAreas()
        XCTAssertEqual(areas.count, 2)
    }

    /// Back on the area answered for before another area's zones come, the view's own are drawn and the legend is not
    /// left loading: that request goes, where its answer was drawn over the view until the map next moved, and the
    /// view's no-ride and no-parking zones went (Android review of 14 November 2026, S1).
    func testComingBackBeforeAnotherAreasZonesComeKeepsTheViewsOwn() async throws {
        let api = ZoneStubAPI()
        let model = makeModel(api: api)
        model.showsZones = true
        model.updateViewport(zurich, zoom: 16)
        let first = await waitUntil { await api.zoneAreas().count == 1 && model.zoneState == .shown }
        XCTAssertTrue(first)

        // The map rests on Bern, whose zones are asked for and are slow to come...
        let ring = [
            GeoPoint(latitude: 47.37, longitude: 8.54), GeoPoint(latitude: 47.38, longitude: 8.54),
            GeoPoint(latitude: 47.38, longitude: 8.55), GeoPoint(latitude: 47.37, longitude: 8.54)
        ]
        await api.setMore([ScooterZone(id: "lime:bern", provider: "lime", kind: .noParking, maxSpeedKph: nil, polygons: [[ring]])])
        await api.hold()
        var bern = zurich
        bern.center = CLLocationCoordinate2D(latitude: 46.948, longitude: 7.4474)
        model.updateViewport(bern, zoom: 16)
        XCTAssertEqual(model.zoneState, .loading)
        let asked = await waitUntil { await api.zoneAreas().count == 2 }
        XCTAssertTrue(asked)

        // ...and the rider is back in Zürich before they come.
        model.updateViewport(zurich, zoom: 16)
        XCTAssertEqual(model.zoneState, .shown)
        await api.release()
        try await Task.sleep(for: .milliseconds(300))
        XCTAssertEqual(model.zoneState, .shown)
        XCTAssertEqual(operatorZones(model).map(\.id), ["lime:0", "bird:0"])
        let areas = await api.zoneAreas()
        XCTAssertEqual(areas.count, 2, "Zürich's answer at hand serves it")
    }

    /// Back on an area whose answer said some of its zones were still on their way, before another area's zones come,
    /// the view's area is asked for again: the other area's request had taken the place of its next try, and the
    /// legend stayed loading without the rest of its zones until the map left the area (fresh-eyes review of
    /// 14 November 2026, iPhone finding 2). The cities' zones follow the map meanwhile.
    func testComingBackToZonesStillOnTheirWayBeforeAnotherAreasComeAsksForTheRest() async throws {
        let api = ZoneStubAPI()
        await api.setAnswer(pending: true)
        let model = makeModel(api: api, zonePendingRetry: .milliseconds(400))
        model.showsZones = true
        model.updateViewport(zurich, zoom: 16)
        let first = await waitUntil { await api.zoneAreas().count == 1 && model.mapOperatorZoneCount == 2 }
        XCTAssertTrue(first)
        XCTAssertEqual(model.zoneState, .loading)
        let zurichRules = model.mapRuleZones.map(\.rule.id)
        XCTAssertFalse(zurichRules.isEmpty)

        // Before Zürich's next try the map rests on Bern, whose zones are slow to come; every answer is whole now.
        await api.setAnswer()
        await api.hold()
        var bern = zurich
        bern.center = CLLocationCoordinate2D(latitude: 46.948, longitude: 7.4474)
        model.updateViewport(bern, zoom: 16)
        let asked = await waitUntil { await api.zoneAreas().count == 2 }
        XCTAssertTrue(asked)
        XCTAssertNotEqual(model.mapRuleZones.map(\.rule.id), zurichRules)

        // Back in Zürich before they come: Zürich's rules are drawn, and the rest of its zones asked for.
        model.updateViewport(zurich, zoom: 16)
        XCTAssertEqual(model.mapRuleZones.map(\.rule.id), zurichRules)
        await api.release()
        let shown = await waitUntil { await api.zoneAreas().count == 3 && model.zoneState == .shown }
        let areas = await api.zoneAreas()
        XCTAssertTrue(shown, "the legend \(model.zoneState), \(areas.count) areas asked for")
        XCTAssertEqual(areas.last, areas.first, "Zürich asked for again")
        XCTAssertEqual(operatorZones(model).map(\.id), ["lime:0", "bird:0"])
        XCTAssertEqual(model.mapRuleZones.map(\.rule.id), zurichRules)
    }

    /// Zoomed in while the wide area's answer is on its way, the view waits for it, as it serves any area within its
    /// own; one with zones left out serves its own alone, and the close view's area is asked for once it comes, rather
    /// than "Zoom in to see the zones" staying at street level (week review, finding 5.1).
    func testZoomingInWhileAnAnswerWithZonesLeftOutIsOnItsWayAsksForTheCloseViewsOwnOnceItComes() async throws {
        let api = ZoneStubAPI()
        await api.setAnswer(truncated: true)
        await api.hold()
        let model = makeModel(api: api)
        model.showsZones = true
        let wide = MKCoordinateRegion(center: zurich.center, span: MKCoordinateSpan(latitudeDelta: 0.03, longitudeDelta: 0.03))
        model.updateViewport(wide, zoom: 14)
        let asked = await waitUntil { await api.zoneAreas().count == 1 }
        XCTAssertTrue(asked)

        let close = MKCoordinateRegion(center: zurich.center, span: MKCoordinateSpan(latitudeDelta: 0.004, longitudeDelta: 0.004))
        model.updateViewport(close, zoom: 17)
        await api.setAnswer()
        await api.release()
        let shown = await waitUntil { await api.zoneAreas().count == 2 && model.zoneState == .shown }
        XCTAssertTrue(shown)
        let areas = await api.zoneAreas()
        XCTAssertTrue(areas[0].contains(areas[1]) && areas[0] != areas[1])
    }

    private func makeModel(
        api: any ScooterAPIClient,
        defaults: UserDefaults? = nil,
        zonePendingRetry: Duration = ScooterMapModel.zonePendingRetry,
        refreshPolicy: ScooterRefreshPolicy = .standard,
        now: @escaping () -> Date = Date.init
    ) -> ScooterMapModel {
        ScooterMapModel(
            api: api, locationManager: CLLocationManager(), defaults: defaults ?? isolatedDefaults(),
            zonePendingRetry: zonePendingRetry, refreshPolicy: refreshPolicy, now: now
        )
    }

    /// The operators' zones drawn, without the city's: Zürich's own are drawn there too.
    private func operatorZones(_ model: ScooterMapModel) -> [ScooterZone] {
        model.mapZones.filter { $0.provider != "city" }
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

/// Lime's no riding and Bird's no parking, and `more` after them.
private actor ZoneStubAPI: ScooterAPIClient {
    private var failure: ScooterAPIError?
    private var areas: [ScooterZoneArea] = []
    private var more: [ScooterZone]
    /// What the answers say besides their zones: some still on their way, unreadable, or left out.
    private var pending = false
    private var unavailable = false
    private var truncated = false
    private var held = false
    private var waiting: [CheckedContinuation<Void, Never>] = []
    /// The cities' zone index it gives, or none: asked for, it fails.
    private let cityIndex: Data?
    private var scooterRequests = 0

    init(more: [ScooterZone] = [], cityIndex: Data? = nil) {
        self.more = more
        self.cityIndex = cityIndex
    }

    func scooters(bounds: GeoBounds, zoom: Int, minimumRange: Int) async throws -> ScooterResponse {
        scooterRequests += 1
        return ScooterResponse(vehicles: [])
    }

    func cityZoneFile(_ name: String) async throws -> Data {
        guard let cityIndex, name == CityZoneIndex.fileName else { throw ScooterAPIError.httpStatus(404) }
        return cityIndex
    }

    func scootersAsked() -> Int { scooterRequests }

    func zones(in area: ScooterZoneArea) async throws -> ScooterZoneResponse {
        areas.append(area)
        let (pending, unavailable, truncated, more) = (pending, unavailable, truncated, more)
        if held { await withCheckedContinuation { waiting.append($0) } }
        if let failure { throw failure }
        let ring = [
            GeoPoint(latitude: 47.37, longitude: 8.54), GeoPoint(latitude: 47.38, longitude: 8.54),
            GeoPoint(latitude: 47.38, longitude: 8.55), GeoPoint(latitude: 47.37, longitude: 8.54)
        ]
        return ScooterZoneResponse(zones: [
            ScooterZone(id: "lime:0", provider: "lime", kind: .noRide, maxSpeedKph: nil, polygons: [[ring]]),
            ScooterZone(id: "bird:0", provider: "bird", kind: .noParking, maxSpeedKph: nil, polygons: [[ring]])
        ] + more, pending: pending, unavailable: unavailable, truncated: truncated)
    }

    func zoneAreas() -> [ScooterZoneArea] { areas }

    /// Held, the answers wait until released, each as it was set when it was asked for.
    func hold() { held = true }

    func release() {
        held = false
        waiting.forEach { $0.resume() }
        waiting = []
    }

    func setAnswer(pending: Bool = false, unavailable: Bool = false, truncated: Bool = false) {
        self.pending = pending
        self.unavailable = unavailable
        self.truncated = truncated
    }

    /// The zones after Lime's and Bird's in the answers asked for from now on.
    func setMore(_ zones: [ScooterZone]) {
        more = zones
    }

    func setFailure(_ failure: ScooterAPIError?) {
        self.failure = failure
    }
}

/// A clock the test sets.
private final class ZoneTestClock {
    var now: Date

    init(now: Date) {
        self.now = now
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
        XCTAssertEqual(CityRuleZone.shown(over: daechi, zoom: 16, at: seoulNoon).map(\.rule.authority), ["Gangnam-gu, lines © OpenStreetMap"])
        for rule in CityRuleZone.all {
            XCTAssertEqual(rule.source.scheme, "https")
            XCTAssertFalse(rule.polygons.isEmpty)
        }
    }

    func testEveryStreetCreditsOpenStreetMapInTheLegend() {
        // Seoul's and Antalya's streets are traced on OpenStreetMap's roads, the user's exception for this layer only
        // (1 November 2026), and the Apple map credits no OpenStreetMap, so the legend line does.
        XCTAssertEqual(CityRuleZone.all.filter { $0.id.hasPrefix("seoul-") }.count, 3)
        for street in CityRuleZone.all {
            XCTAssertTrue(street.authority.hasSuffix(", lines © OpenStreetMap"), street.authority)
        }
    }

    func testAntalyasBoulevardIsShownAtAllHoursSinceSeptember2025CreditedToUKOME() throws {
        // Trendy Lara, in Kundu, where its lines end; the boulevard runs on west into Güzeloba, where riding is allowed.
        let kundu = GeoBounds(south: 36.862, west: 30.915, north: 36.868, east: 30.925)
        let guzeloba = GeoBounds(south: 36.85, west: 30.83, north: 36.86, east: 30.855)
        // 2 November 2026, 02:30 in Antalya (UTC+3).
        let night = Date(timeIntervalSince1970: 1_793_575_800)
        let shown = CityRuleZone.shown(over: kundu, zoom: 15, at: night)
        XCTAssertEqual(shown.map(\.rule.id), ["antalya-yasar-sobutay-bulvari"])
        XCTAssertEqual(shown.map(\.inForce), [true])
        let boulevard = try XCTUnwrap(shown.first?.rule)
        XCTAssertEqual(boulevard.authority, "Antalya UKOME, lines © OpenStreetMap")
        XCTAssertEqual(boulevard.timeZone, "Europe/Istanbul")
        XCTAssertTrue(boulevard.hours.isEmpty)
        XCTAssertEqual(boulevard.kind, .noRide)
        // 29 September 2025, noon in Antalya: the day before UKOME's first decision.
        XCTAssertFalse(boulevard.inForce(at: Date(timeIntervalSince1970: 1_759_136_400)))
        XCTAssertTrue(CityRuleZone.shown(over: guzeloba, zoom: 15, at: night).isEmpty)
        XCTAssertTrue(CityRuleZone.shown(over: kundu, zoom: 13, at: night).isEmpty)
    }

    func testChicagosTrailsAreShownAtAllHoursCreditedToCDOTAndOnlyWhereTheyRun() throws {
        // Where the Riverwalk ends at Lake Shore Drive, the Lakefront Trail crosses the river on the Navy Pier Flyover.
        let riverMouth = GeoBounds(south: 41.885, west: -87.618, north: 41.892, east: -87.609)
        // 2 November 2026, 02:30 in Chicago (UTC-6).
        let night = Date(timeIntervalSince1970: 1_793_608_200)
        let shown = CityRuleZone.shown(over: riverMouth, zoom: 15, at: night).filter { $0.rule.id.hasPrefix("chicago-") }
        XCTAssertEqual(shown.map(\.rule.id).sorted(), ["chicago-lakefront-trail", "chicago-riverwalk"])
        XCTAssertEqual(shown.map(\.inForce), [true, true])
        for zone in shown.map(\.rule) {
            XCTAssertEqual(zone.authority, "Chicago DOT, lines © OpenStreetMap")
            XCTAssertEqual(zone.timeZone, "America/Chicago")
            XCTAssertTrue(zone.firstDay.isEmpty && zone.hours.isEmpty, zone.id)
            // 15 June 2019: no first day, so always.
            XCTAssertTrue(zone.inForce(at: Date(timeIntervalSince1970: 1_560_600_000)), zone.id)
        }
        // Damen Avenue, under The 606; State Street in the Loop, inside the lakefront trail's bounds but 0.9 km from it.
        let damen = GeoBounds(south: 41.912, west: -87.68, north: 41.916, east: -87.675)
        XCTAssertEqual(CityRuleZone.shown(over: damen, zoom: 15, at: night).map(\.rule.id), ["chicago-606-bloomingdale-trail"])
        let loop = GeoBounds(south: 41.878, west: -87.629, north: 41.882, east: -87.627)
        let trail = try XCTUnwrap(CityRuleZone.all.first { $0.id == "chicago-lakefront-trail" })
        XCTAssertTrue(trail.bounds.intersects(loop))
        XCTAssertFalse(trail.reaches(loop))
        XCTAssertTrue(CityRuleZone.shown(over: loop, zoom: 16, at: night).filter { $0.rule.id.hasPrefix("chicago-") }.isEmpty)
    }

    func testEdmontonsWhyteAvenueIsShownFrom112To97StreetAtAllHoursCreditedToTheCity() throws {
        // 2 November 2026, 02:30 in Edmonton (UTC-6: Alberta keeps that clock from 1 November 2026).
        let night = Date(timeIntervalSince1970: 1_793_608_200)
        // 104 Street, in Old Strathcona; 82 Avenue goes on west of 112 Street and east of 97 Street, open to riding.
        let gateway = GeoBounds(south: 53.517, west: -113.499, north: 53.519, east: -113.496)
        let shown = CityRuleZone.shown(over: gateway, zoom: 16, at: night)
        XCTAssertEqual(shown.map(\.rule.id), ["edmonton-whyte-avenue"])
        XCTAssertEqual(shown.map(\.inForce), [true])
        let whyte = try XCTUnwrap(shown.first?.rule)
        XCTAssertEqual(whyte.authority, "City of Edmonton, lines © OpenStreetMap")
        XCTAssertEqual(whyte.timeZone, "America/Edmonton")
        XCTAssertTrue(whyte.firstDay.isEmpty && whyte.hours.isEmpty)
        let west = GeoBounds(south: 53.515, west: -113.525, north: 53.519, east: -113.5225)
        let east = GeoBounds(south: 53.517, west: -113.4785, north: 53.519, east: -113.477)
        XCTAssertTrue(CityRuleZone.shown(over: west, zoom: 16, at: night).filter { $0.rule.id.hasPrefix("edmonton-") }.isEmpty)
        XCTAssertTrue(CityRuleZone.shown(over: east, zoom: 16, at: night).filter { $0.rule.id.hasPrefix("edmonton-") }.isEmpty)
    }

    func testTampasRiverwalkBayshoreAnd7thAvenueAreShownAtAllHoursCreditedToTheCity() throws {
        // 2 November 2026, 03:30 in Tampa (UTC-5).
        let night = Date(timeIntervalSince1970: 1_793_608_200)
        // The City's hubs and racks are shown too; only its three streets are its riding rules.
        let streets: Set = ["tampa-riverwalk", "tampa-bayshore-boulevard", "tampa-7th-avenue-ybor-city"]
        func ids(_ view: GeoBounds) -> [String] {
            CityRuleZone.shown(over: view, zoom: 16, at: night).map(\.rule.id).filter(streets.contains)
        }
        // The Riverwalk just north of Curtis Hixon Park; Morgan Street, a few blocks inland, has no rule.
        let park = CityRuleZone.shown(over: GeoBounds(south: 27.95, west: -82.4655, north: 27.952, east: -82.4635), zoom: 16, at: night)
            .filter { streets.contains($0.rule.id) }
        XCTAssertEqual(park.map(\.rule.id), ["tampa-riverwalk"])
        XCTAssertEqual(park.map(\.inForce), [true])
        let riverwalk = try XCTUnwrap(park.first?.rule)
        XCTAssertEqual(riverwalk.authority, "City of Tampa, lines © OpenStreetMap")
        XCTAssertEqual(riverwalk.timeZone, "America/New_York")
        XCTAssertTrue(riverwalk.firstDay.isEmpty && riverwalk.hours.isEmpty)
        XCTAssertEqual(ids(GeoBounds(south: 27.949, west: -82.4565, north: 27.951, east: -82.4545)), [])
        // Bayshore Boulevard by the bay; none inside MacDill Air Force Base.
        XCTAssertEqual(ids(GeoBounds(south: 27.919, west: -82.4915, north: 27.921, east: -82.4885)), ["tampa-bayshore-boulevard"])
        XCTAssertEqual(ids(GeoBounds(south: 27.858, west: -82.49, north: 27.862, east: -82.486)), [])
        // 7th Avenue at 15th Street, in Ybor City; it runs on east of 22nd Street, open to riding.
        XCTAssertEqual(ids(GeoBounds(south: 27.959, west: -82.444, north: 27.9615, east: -82.441)), ["tampa-7th-avenue-ybor-city"])
        XCTAssertEqual(ids(GeoBounds(south: 27.959, west: -82.432, north: 27.9615, east: -82.429)), [])
    }

    func testFourOfBrightonAndHovesNoGoPlacesAreShownAtAllHoursCreditedToTheCouncil() throws {
        // 2 November 2026, 03:30 in Brighton (UTC+0).
        let night = Date(timeIntervalSince1970: 1_793_590_200)
        let streets: Set = ["brighton-cranbourne-street", "brighton-kensington-gardens", "brighton-undercliff-walk", "hove-promenade"]
        func ids(_ view: GeoBounds) -> [String] {
            CityRuleZone.shown(over: view, zoom: 16, at: night).map(\.rule.id).filter(streets.contains)
        }
        // Kensington Gardens, in the North Laine.
        let laine = CityRuleZone.shown(over: GeoBounds(south: 50.8258, west: -0.1392, north: 50.8266, east: -0.1384), zoom: 17, at: night)
            .filter { streets.contains($0.rule.id) }
        XCTAssertEqual(laine.map(\.rule.id), ["brighton-kensington-gardens"])
        XCTAssertEqual(laine.map(\.inForce), [true])
        let lane = try XCTUnwrap(laine.first?.rule)
        XCTAssertEqual(lane.authority, "Brighton & Hove City Council, lines © OpenStreetMap")
        XCTAssertEqual(lane.timeZone, "Europe/London")
        XCTAssertTrue(lane.firstDay.isEmpty && lane.hours.isEmpty)
        XCTAssertEqual(ids(GeoBounds(south: 50.8229, west: -0.1448, north: 50.8236, east: -0.1436)), ["brighton-cranbourne-street"])
        // The Undercliff Walk below Rottingdean; Hove Promenade east of Hove Lagoon, but not its stretch by Hove Lawns,
        // which OpenStreetMap doesn't name.
        XCTAssertEqual(ids(GeoBounds(south: 50.8025, west: -0.0595, north: 50.8035, east: -0.0575)), ["brighton-undercliff-walk"])
        XCTAssertEqual(ids(GeoBounds(south: 50.825, west: -0.1885, north: 50.826, east: -0.1865)), ["hove-promenade"])
        XCTAssertEqual(ids(GeoBounds(south: 50.8228, west: -0.1665, north: 50.8245, east: -0.1645)), [])
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

    func testTheStreetsAndAreasAreAllAndForbidRidingOrSlowIt() {
        // Which they are is data/'s, which Android's CatalogParityTest holds to this catalog: here, what each is, a
        // street, its lines, or an area, one ring, where riding is forbidden or slow.
        XCTAssertFalse(CityRuleZone.all.isEmpty)
        XCTAssertTrue(CityRuleZone.all.allSatisfy { $0.kind == .noRide || $0.kind == .slow })
        XCTAssertTrue(CityRuleZone.all.allSatisfy { !$0.lines.isEmpty || ($0.polygons.count == 1 && $0.polygons[0].count == 1 && $0.polygons[0][0].count >= 3) })
        XCTAssertTrue(CityRuleZone.cityZones.allSatisfy { $0.lines.isEmpty })
        XCTAssertEqual(CityRuleZone.onMap.map(\.id), (CityRuleZone.all + CityRuleZone.cityZones).map(\.id))
        XCTAssertEqual(Set(CityRuleZone.onMap.map(\.id)).count, CityRuleZone.onMap.count)
    }

    func testTheCatalogCarriesTheSpeedEachCitySetsToTheMapsZones() throws {
        // The legend's "Slow: 6 km/h": Linköping's 6, Warsaw's 12 and Calgary's 15 from data/rule-zones.json, and
        // none where the city gives none, as on Gävle's Drottninggatan.
        let rule = { (id: String) in try XCTUnwrap(CityRuleZone.all.first { $0.id == id }, id) }
        XCTAssertEqual(try rule("linkoping-stora-torget").maxSpeedKph, 6)
        XCTAssertEqual(try rule("warsaw-chmielna").maxSpeedKph, 12)
        XCTAssertEqual(try rule("calgary-8-avenue-sw-downtown").maxSpeedKph, 15)
        XCTAssertNil(try rule("gavle-drottninggatan").maxSpeedKph)
        XCTAssertTrue(CityRuleZone.all.filter { $0.maxSpeedKph != nil }.allSatisfy { $0.kind == .slow })
        XCTAssertTrue(CityRuleZone.cityZones.allSatisfy { $0.maxSpeedKph == nil })
        XCTAssertEqual(CityRuleZone.Shown(rule: try rule("linkoping-stora-torget"), inForce: true).mapZone.maxSpeedKph, 6)
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

    func testTheCitiesZonesAreReadWholeFromTheFileInTheApp() throws {
        // They come from CityZones.generated.json in the app, not Swift literals: every zone in it, in its order, with
        // its ring point for point, and a city's names once, as in a downloaded file.
        let url = try XCTUnwrap(Bundle.main.url(forResource: "CityZones.generated", withExtension: "json"))
        let file = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: url)) as? [String: Any])
        let cities = try XCTUnwrap(file["cities"] as? [[String: Any]])
        let zones = cities.flatMap { ($0["zones"] as? [[String: Any]]) ?? [] }
        XCTAssertGreaterThan(cities.count, 10)
        XCTAssertEqual(CityRuleZone.cityZones.map(\.id), zones.compactMap { $0["id"] as? String })
        XCTAssertEqual(
            CityRuleZone.cityZones.map { $0.polygons.first?.first?.flatMap { [$0.latitude, $0.longitude] } ?? [] },
            zones.map { ($0["ring"] as? [Double]) ?? [] }
        )

        let data = Data("""
        {"cities": [{"id": "porto", "authority": "Porto", "timeZone": "Europe/Lisbon", "source": "https://example.com/porto", \
        "zones": [{"id": "porto-parking-1", "kind": "parking", "ring": [41.15, -8.61, 41.1501, -8.6098, 41.1502, -8.61]}, \
        {"id": "porto-later-2", "kind": "later", "ring": [41.15, -8.61, 41.1501, -8.6098, 41.1502, -8.61]}, \
        {"id": "porto-parking-3", "kind": "parking", "ring": [41.15, -8.61, 41.1501, -8.6098]}]}]}
        """.utf8)
        let porto = try CityZoneFile.builtIn(from: data)
        XCTAssertEqual(porto.map(\.id), ["porto-parking-1"])
        XCTAssertEqual(porto.first?.authority, "Porto")
        XCTAssertEqual(porto.first?.timeZone, "Europe/Lisbon")
        XCTAssertEqual(porto.first?.source.absoluteString, "https://example.com/porto")
        XCTAssertEqual(porto.first?.polygons.first?.first?.count, 3)
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

    func testASlowStreetIsABandOfItsKindAndAnAreaHoldsFromItsFirstDayWithinItsHours() throws {
        // As Warsaw's 12 km/h streets and its Old Town, where riding is forbidden from 22 May 2026, traced on OpenStreetMap.
        let source = try XCTUnwrap(URL(string: "https://example.com"))
        let street = CityRuleZone(
            id: "test-slow-street", authority: "Test, lines © OpenStreetMap", timeZone: "Europe/Warsaw", kind: .slow,
            firstDay: "", hours: [], source: source,
            lines: [[GeoPoint(latitude: 52.23, longitude: 21.0), GeoPoint(latitude: 52.23, longitude: 21.003)]]
        )
        XCTAssertEqual(CityRuleZone.Shown(rule: street, inForce: true).mapZone.kind, .slow)
        XCTAssertFalse(street.polygons.isEmpty)
        let ring = [
            GeoPoint(latitude: 52.249, longitude: 21.01), GeoPoint(latitude: 52.249, longitude: 21.014),
            GeoPoint(latitude: 52.251, longitude: 21.014), GeoPoint(latitude: 52.251, longitude: 21.01)
        ]
        let area = CityRuleZone(
            id: "test-no-ride-area", authority: "Test, lines © OpenStreetMap", timeZone: "Europe/Warsaw", kind: .noRide,
            firstDay: "2026-05-22", hours: [.init(fromMinute: 22 * 60, untilMinute: 6 * 60)], source: source, ring: ring
        )
        XCTAssertTrue(area.lines.isEmpty)
        XCTAssertEqual(area.polygons, [[ring]])
        XCTAssertEqual(CityRuleZone.Shown(rule: area, inForce: true).mapZone.kind, .noRide)
        // Warsaw is UTC+2 in May: 23:00 the night before its first day, and of that day; then noon.
        let date = { (text: String) in try XCTUnwrap(ISO8601DateFormatter().date(from: text)) }
        XCTAssertFalse(area.inForce(at: try date("2026-05-21T21:00:00Z")))
        XCTAssertTrue(area.inForce(at: try date("2026-05-22T21:00:00Z")))
        XCTAssertFalse(area.inForce(at: try date("2026-05-23T10:00:00Z")))
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
        // The catalog's own, as the app reads them: each over its own place, among its city's. Among all of them, as
        // shown(over:) reads each, the time grew with the square of their number: 106 s on CI for 19,268 (1 Nov 2026).
        let cities = Dictionary(grouping: CityRuleZone.onMap, by: \.authority)
        for zone in CityRuleZone.cityZones {
            let city = cities[zone.authority] ?? []
            XCTAssertTrue(CityRuleZone.shown(over: zone.bounds, zoom: 14, at: seoulNoon, among: city).contains { $0.rule == zone }, zone.id)
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
    func testTheLegendNamesEachKindOnceTheStrongestFirstAndCreditsEachCityOnce() throws {
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
        let shown = rules.map { CityRuleZone.Shown(rule: $0, inForce: true) }

        // The zones off: the cities' kinds, each once, and Hongdae's street a line of its own for its hours.
        let legend = ZoneLegend(state: .off, count: 0, rules: shown)
        XCTAssertEqual(legend.kinds(besideNote: false), [.noRide, .noParking, .slow, .parking])
        let lines = legend.ruleLines
        XCTAssertEqual(lines.map(\.kind), [.noRide])
        // Its swatch hatched the other way, as the map draws it.
        XCTAssertEqual(lines.map(\.timed), [true])
        // "No riding 12:00–23:00", in the user's format.
        XCTAssertTrue(lines[0].text.hasPrefix("\(ScooterZoneKind.noRide.label) "), lines[0].text)
        XCTAssertTrue(lines[0].text.contains("–"), lines[0].text)
        XCTAssertFalse(lines[0].text.contains("Seoul"), lines[0].text)
        // Who sets them, once each, the strongest rule's first, linked to where they say so.
        let credit = try XCTUnwrap(legend.credit)
        XCTAssertEqual(String(credit.characters), "Bergen kommune · Seoul, lines © OpenStreetMap · Porto")
        XCTAssertEqual(credit.runs.compactMap { $0.link }, [bergen[0].source, hongdae.source, porto.source])

        // The zones on: the operators' kinds and the cities' together, still each once.
        let on = ZoneLegend(state: .shown, count: 12, rules: shown)
        XCTAssertEqual(on.kinds(besideNote: false), [.noRide, .noParking, .slow, .parking])
        // Further out, the note stands for the operators' kinds, and the cities' are still named.
        let zoomIn = ZoneLegend(state: .zoomIn, count: 0, rules: [CityRuleZone.Shown(rule: porto, inForce: true)])
        XCTAssertNotNil(zoomIn.note(hasRules: true))
        XCTAssertEqual(zoomIn.kinds(besideNote: true), [.parking])
        // No city: no credit.
        XCTAssertNil(ZoneLegend(state: .shown, count: 12).credit)
    }

    /// A slow street of Warsaw's, at `kph` where the city gives a speed, within `hours` where it has some.
    private func warsaw(_ id: String, _ kph: Double?, hours: [CityRuleZone.Hours] = []) throws -> CityRuleZone {
        CityRuleZone(
            id: "warsaw-\(id)", authority: "Warszawa", timeZone: "Europe/Warsaw", kind: .slow, maxSpeedKph: kph,
            firstDay: "", hours: hours, source: try XCTUnwrap(URL(string: "https://example.com/warsaw")),
            lines: [[GeoPoint(latitude: 52.23, longitude: 21.0), GeoPoint(latitude: 52.23, longitude: 21.003)]]
        )
    }

    @MainActor
    func testSlowSaysTheLimitOfTheSlowZonesItCounts() throws {
        defer { ScooterLanguage.current = .atLaunch }
        ScooterLanguage.current = .en
        let swiss = Locale(identifier: "en_CH")
        // One speed: Linköping's 6 km/h, and 6.4 rounded to the same.
        XCTAssertEqual(ZoneLegend.label(of: .slow, speeds: speeds(6), locale: swiss), "Slow: 6 km/h")
        XCTAssertEqual(ZoneLegend.label(of: .slow, speeds: speeds(6, 6.4), locale: swiss), "Slow: 6 km/h")
        // Several: from the least to the greatest.
        XCTAssertEqual(ZoneLegend.label(of: .slow, speeds: speeds(12, 6, 15), locale: swiss), "Slow: 6–15 km/h")
        // One zone without a speed, or none at all: plain "Slow".
        XCTAssertEqual(ZoneLegend.label(of: .slow, speeds: speeds(6, nil, 15), locale: swiss), "Slow")
        XCTAssertEqual(ZoneLegend.label(of: .slow, speeds: ScooterZoneSpeeds(), locale: swiss), "Slow")
        // Only slow says a speed.
        XCTAssertEqual(ZoneLegend.label(of: .noRide, speeds: speeds(6), locale: swiss), "No riding")

        // The operators' slow zones while their kinds are named, and the cities' at all hours.
        let city = [CityRuleZone.Shown(rule: try warsaw("chmielna", 12), inForce: true)]
        XCTAssertEqual(ZoneLegend(state: .shown, count: 3, slowSpeeds: speeds(10), rules: city).kindSpeeds(besideNote: false).known, 10 ... 12)
        // The note stands for the operators' kinds: the city's alone.
        XCTAssertEqual(ZoneLegend(state: .zoomIn, count: 0, slowSpeeds: speeds(10), rules: city).kindSpeeds(besideNote: true).known, 12 ... 12)
        XCTAssertEqual(ZoneLegend(state: .off, count: 0, slowSpeeds: speeds(10), rules: city).kindSpeeds(besideNote: false).known, 12 ... 12)
        // A city's street without a speed among them: plain "Slow".
        let without = city + [CityRuleZone.Shown(rule: try warsaw("zgoda", nil), inForce: true)]
        XCTAssertNil(ZoneLegend(state: .shown, count: 3, slowSpeeds: speeds(10), rules: without).kindSpeeds(besideNote: false).known)
        // A city's rule with a line of its own, timed or not now, says its speed there, not among the kinds.
        let apart = [
            CityRuleZone.Shown(rule: try warsaw("zlota", 15, hours: [.init(fromMinute: 22 * 60, untilMinute: 6 * 60)]), inForce: true),
            CityRuleZone.Shown(rule: try warsaw("bracka", 20), inForce: false)
        ]
        XCTAssertEqual(ZoneLegend(state: .shown, count: 3, slowSpeeds: speeds(10), rules: apart).kindSpeeds(besideNote: false).known, 10 ... 10)
    }

    @MainActor
    func testSlowSaysMilesPerHourWhereTheRegionMeasuresInMiles() {
        // Rounded down once converted, unless within a tenth of the next whole one: 12.87 km/h is 8 mph (7.997),
        // 6 km/h 3 (3.73), 25 km/h 15 (15.53), 20 km/h 12 (12.43) and 15.9 km/h 9 (9.88).
        let us = Locale(identifier: "en_US")
        let gb = Locale(identifier: "en_GB")
        XCTAssertEqual(ZoneLegend.speedText(12.87 ... 16.09, locale: us), "8–10 mph")
        XCTAssertEqual(ZoneLegend.speedText(6 ... 6, locale: us), "3 mph")
        XCTAssertEqual(ZoneLegend.speedText(25 ... 25, locale: us), "15 mph")
        XCTAssertEqual(ZoneLegend.speedText(20 ... 20, locale: us), "12 mph")
        XCTAssertEqual(ZoneLegend.speedText(6 ... 25, locale: us), "3–15 mph")
        XCTAssertEqual(ZoneLegend.speedText(15.9 ... 15.9, locale: gb), "9 mph")
        // A UK 10 mph zone is 10 mph however it is written: Dott's 16 km/h (9.94 mph), Bolt's 16.1 (10.004) and 16.09
        // (9.998), said once where the legend counts several.
        XCTAssertEqual(ZoneLegend.speedText(16 ... 16, locale: gb), "10 mph")
        XCTAssertEqual(ZoneLegend.speedText(16.1 ... 16.1, locale: gb), "10 mph")
        XCTAssertEqual(ZoneLegend.speedText(16.09 ... 16.09, locale: gb), "10 mph")
        XCTAssertEqual(ZoneLegend.speedText(16 ... 16.1, locale: gb), "10 mph")
        // Kilometres are rounded to the nearest, as before.
        XCTAssertEqual(ZoneLegend.speedText(6 ... 15, locale: Locale(identifier: "en_CH")), "6–15 km/h")
        XCTAssertEqual(ZoneLegend.speedText(6.4 ... 15.6, locale: Locale(identifier: "en_CH")), "6–16 km/h")
        // French writes a narrow space before the unit.
        XCTAssertEqual(plainSpaces(ZoneLegend.speedText(6 ... 6, locale: Locale(identifier: "fr_US"))), "3 mi/h")
    }

    @MainActor
    func testATimedSlowRuleSaysItsSpeedOnItsLine() throws {
        defer { ScooterLanguage.current = .atLaunch }
        ScooterLanguage.current = .en
        let night: [CityRuleZone.Hours] = [.init(fromMinute: 22 * 60, untilMinute: 6 * 60)]
        let legend = ZoneLegend(state: .shown, count: 0, rules: [
            CityRuleZone.Shown(rule: try warsaw("zlota", 12, hours: night), inForce: true),
            CityRuleZone.Shown(rule: try warsaw("bracka", 15, hours: night), inForce: true),
            CityRuleZone.Shown(rule: try warsaw("zgoda", nil, hours: [.init(fromMinute: 7 * 60, untilMinute: 9 * 60)]), inForce: true),
            CityRuleZone.Shown(rule: try warsaw("chmielna", 12), inForce: false)
        ])
        let lines = legend.ruleLines
        XCTAssertEqual(lines.map(\.timed), [true, true, false])
        guard lines.count == 3 else { return }
        // "Slow: 12–15 km/h 22:00–06:00", in the user's units and format.
        let both = ZoneLegend.label(of: .slow, speeds: speeds(12, 15))
        XCTAssertEqual(both, "Slow: \(ZoneLegend.speedText(12 ... 15))")
        XCTAssertTrue(lines[0].text.hasPrefix("\(both) "), lines[0].text)
        XCTAssertTrue(lines[0].text.dropFirst(both.count).contains("–"), lines[0].text)
        // Without a speed: "Slow 07:00–09:00".
        XCTAssertTrue(lines[1].text.hasPrefix("Slow "), lines[1].text)
        XCTAssertFalse(lines[1].text.hasPrefix("Slow:"), lines[1].text)
        // Not now: "Slow: 12 km/h (not now)".
        XCTAssertEqual(lines[2].text, "Slow: \(ZoneLegend.speedText(12 ... 12)) (not now)")
    }

    @MainActor
    func testSlowSaysItsSpeedInEveryLanguage() {
        defer { ScooterLanguage.current = .atLaunch }
        let said: [ScooterLanguage: String] = [
            .en: "Slow: 6–15 km/h", .de: "Langsam: 6–15 km/h", .fr: "Vitesse réduite : 6–15 km/h",
            .it: "Velocità ridotta: 6–15 km/h", .nl: "Langzaam: 6–15 km/u", .nb: "Lav fart: 6–15 km/t",
            .pt: "Velocidade reduzida: 6–15 km/h", .es: "Velocidad reducida: 6–15 km/h", .`is`: "Hægur akstur: 6–15 km/klst."
        ]
        XCTAssertEqual(Set(said.keys), Set(ScooterLanguage.allCases))
        for (language, label) in said {
            ScooterLanguage.current = language
            let swiss = Locale(identifier: "\(language.rawValue)_CH")
            XCTAssertEqual(plainSpaces(ZoneLegend.label(of: .slow, speeds: speeds(6, 15), locale: swiss)), label, language.rawValue)
        }
    }

    @MainActor
    func testAStreetOutsideItsHoursHasALineSayingSo() throws {
        let hongdae = try XCTUnwrap(CityRuleZone.all.first { $0.id == "seoul-hongdae-red-road" })
        let legend = ZoneLegend(state: .shown, count: 12, rules: [CityRuleZone.Shown(rule: hongdae, inForce: false)])
        XCTAssertEqual(legend.kinds(besideNote: false), ScooterZoneKind.operatorKinds)
        let line = try XCTUnwrap(legend.ruleLines.first)
        XCTAssertFalse(line.inForce)
        XCTAssertTrue(line.text.hasSuffix(" (\(String(localized: "not now")))"), line.text)
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

    func testAStreetWithHoursIsDrawnApartFromNoRidingAtAllHoursToBeHatchedTheOtherWay() throws {
        let rule = try XCTUnwrap(CityRuleZone.all.first { $0.id == "seoul-hongdae-red-road" })
        let ring = rule.polygons[0][0]
        let street = CityRuleZone.Shown(rule: rule, inForce: true).mapZone
        XCTAssertTrue(street.timed)
        let overlay = ScooterZoneOverlay(zones: [
            street,
            ScooterZone(id: "lime:0", provider: "lime", kind: .noRide, maxSpeedKph: nil, polygons: [[ring]])
        ], isDark: false)
        XCTAssertEqual(Set(overlay.shapes.map(\.timed)), [false, true])
        XCTAssertTrue(overlay.shapes.allSatisfy { $0.kind == .noRide && $0.strength == 1 })
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
