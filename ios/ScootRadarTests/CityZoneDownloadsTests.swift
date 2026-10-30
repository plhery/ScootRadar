import CoreLocation
import MapKit
import XCTest
@testable import ScootRadar

@MainActor
final class CityZoneDownloadsTests: XCTestCase {
    /// Round Berlin's Tiergarten, at zoom 16 on a phone.
    private let tiergarten = GeoBounds(south: 52.51, west: 13.34, north: 52.52, east: 13.37)
    private let zurich = GeoBounds(south: 47.36, west: 8.53, north: 47.38, east: 8.55)
    private let source = "https://www.berlin.de/sen/uvk/verkehr/verkehrsplanung/fuss-und-radverkehr/"
    private var directory: URL!
    private var now = Date(timeIntervalSince1970: 1_793_000_000)

    override func setUp() async throws {
        directory = FileManager.default.temporaryDirectory.appending(path: "CityZoneDownloadsTests-\(UUID().uuidString)")
    }

    override func tearDown() async throws {
        try? FileManager.default.removeItem(at: directory)
    }

    private var cache: CityZoneCache { CityZoneCache(directory: directory) }

    // MARK: - The files

    func testTheIndexListsTheCitiesItCanReadAndNoneOfAnotherFormat() throws {
        let file = Self.file(id: "berlin", zones: [Self.zone])
        let index = try CityZoneIndex(data: index([
            entry("berlin", file: file),
            #"{"id":"hamburg","place":"Hamburg"}"#,
            entry("lille", file: file, source: "http://example.com")
        ]))
        XCTAssertEqual(index.cities.map(\.id), ["berlin"])
        let berlin = try XCTUnwrap(index.cities.first)
        XCTAssertEqual(berlin.place, "Berlin")
        XCTAssertEqual(berlin.authority, "Land Berlin, DL-DE Zero")
        XCTAssertEqual(berlin.timeZone, "Europe/Berlin")
        XCTAssertEqual(berlin.source.absoluteString, source)
        XCTAssertEqual(berlin.bounds, GeoBounds(south: 52.5, west: 13.3, north: 52.6, east: 13.5))
        XCTAssertEqual(berlin.sha256, CityZoneFile.digest(file))
        XCTAssertEqual(berlin.fileName, "berlin.json")

        XCTAssertThrowsError(try CityZoneIndex(data: Data(#"{"format":2,"cities":[]}"#.utf8))) { error in
            XCTAssertEqual(error as? CityZoneDownloadError, .format)
        }
    }

    func testACitysFileIsItsZonesEachOneRingCreditedToTheCityLeavingOutKindsAddedLater() throws {
        let berlin = try XCTUnwrap(CityZoneIndex(data: index([entry("berlin", file: Data())])).cities.first)
        let file = Data("""
        {"id":"berlin","zones":[
        {"id":"berlin-no-parking-1","kind":"noParking","ring":[52.511,13.35,52.512,13.35,52.512,13.351]},
        {"id":"berlin-racks-only-2","kind":"racksOnly","ring":[52.511,13.35,52.512,13.35,52.512,13.351]},
        {"id":"berlin-parking-3","kind":"parking","ring":[52.511,13.35,52.512]}
        ]}
        """.utf8)
        let zones = try CityZoneFile.zones(of: berlin, from: file)
        XCTAssertEqual(zones.map(\.id), ["berlin-no-parking-1"])
        let zone = try XCTUnwrap(zones.first)
        XCTAssertEqual(zone.kind, .noParking)
        XCTAssertEqual(zone.authority, "Land Berlin, DL-DE Zero")
        XCTAssertEqual(zone.source.absoluteString, source)
        XCTAssertEqual(zone.polygons, [[[
            GeoPoint(latitude: 52.511, longitude: 13.35), GeoPoint(latitude: 52.512, longitude: 13.35),
            GeoPoint(latitude: 52.512, longitude: 13.351)
        ]]])
        XCTAssertTrue(zone.inForce(at: now))

        XCTAssertThrowsError(try CityZoneFile.zones(of: berlin, from: Self.file(id: "hamburg", zones: [Self.zone])))
    }

    func testTheFilesAreTheWebsitesAskedForWithNothingOfWhereTheRiderIs() async throws {
        let session = FileNetworkSession(statusCode: 200)
        let api = ScooterAPI(baseURL: try XCTUnwrap(URL(string: "https://scootradar.com")), session: session)
        let data = try await api.cityZoneFile("berlin.json")
        XCTAssertEqual(data, Data("{}".utf8))
        let url = await session.lastRequest?.url
        XCTAssertEqual(url?.absoluteString, "https://scootradar.com/zones/v1/berlin.json")

        let missing = ScooterAPI(baseURL: try XCTUnwrap(URL(string: "https://scootradar.com")), session: FileNetworkSession(statusCode: 404))
        do {
            _ = try await missing.cityZoneFile("index.json")
            XCTFail("A 404 is no file")
        } catch let error as ScooterAPIError {
            guard case .httpStatus(404) = error else { return XCTFail("\(error)") }
        }
    }

    // MARK: - Downloading

    func testAViewOverACityAsksForTheIndexThenItsFileAndDrawsItsZones() async throws {
        let file = Self.file(id: "berlin", zones: [Self.zone])
        let api = DownloadStubAPI(files: ["index.json": index([entry("berlin", file: file)]), "berlin.json": file])
        let downloads = makeDownloads(api: api)

        downloads.request(over: zurich)
        let indexed = await waitUntil { downloads.cities.first?.sha256 != nil }
        XCTAssertTrue(indexed, "The index is asked for from the first view, wherever it is")
        XCTAssertTrue(downloads.shown(over: zurich).notices.isEmpty)

        downloads.request(over: tiergarten)
        let drawn = await waitUntil { downloads.shown(over: self.tiergarten).zones.count == 1 }
        XCTAssertTrue(drawn)
        XCTAssertEqual(downloads.shown(over: tiergarten).zones.map(\.id), ["berlin-no-parking-1"])
        XCTAssertTrue(downloads.shown(over: tiergarten).notices.isEmpty)
        let asked = await api.asked()
        XCTAssertEqual(asked, ["index.json", "berlin.json"])

        // Kept on the device, the index confirmed now.
        XCTAssertEqual(cache.read("berlin.json")?.data, file)
        XCTAssertEqual(cache.read("index.json")?.savedAt, now)
        // Asked for again only after 6 hours.
        downloads.request(over: tiergarten)
        now += CityZoneDownloads.indexRefresh
        downloads.request(over: tiergarten)
        let again = await waitUntil { await api.asked().count == 3 }
        XCTAssertTrue(again)
        let last = await api.asked().last
        XCTAssertEqual(last, "index.json")
    }

    func testWhileTheFileIsOnItsWayTheCitysZonesAreLoadingAndWhenItFailsUnavailableAndAskedForAgainLater() async throws {
        let file = Self.file(id: "berlin", zones: [Self.zone])
        let api = DownloadStubAPI(files: ["index.json": index([entry("berlin", file: file)])])
        let downloads = makeDownloads(api: api)
        var changes = 0
        downloads.onChange = { changes += 1 }

        downloads.request(over: tiergarten)
        XCTAssertEqual(downloads.shown(over: tiergarten).notices.map(\.state), [.loading], "Before the first index, the built-in list")
        let failed = await waitUntil { downloads.shown(over: self.tiergarten).notices.map(\.state) == [.unavailable] }
        XCTAssertTrue(failed, "berlin.json answers 404")
        XCTAssertTrue(downloads.shown(over: tiergarten).zones.isEmpty)
        XCTAssertEqual(changes, 2, "The index came, then the file failed")

        // Not asked for again at once, still unavailable while it is asked for again.
        downloads.request(over: tiergarten)
        var asked = await api.asked()
        XCTAssertEqual(asked, ["index.json", "berlin.json"])
        await api.set("berlin.json", file)
        now += CityZoneDownloads.retryAfter
        downloads.request(over: tiergarten)
        XCTAssertEqual(downloads.shown(over: tiergarten).notices.map(\.state), [.unavailable])
        let drawn = await waitUntil { downloads.shown(over: self.tiergarten).zones.count == 1 }
        XCTAssertTrue(drawn)
        XCTAssertTrue(downloads.shown(over: tiergarten).notices.isEmpty)
        asked = await api.asked()
        XCTAssertEqual(asked, ["index.json", "berlin.json", "berlin.json"])
    }

    func testBeforeAnyIndexAViewOverABuiltInDownloadCitySaysItsZonesAreUnavailableOnceTheIndexFails() async throws {
        let api = DownloadStubAPI(files: [:])
        let downloads = makeDownloads(api: api)

        downloads.request(over: tiergarten)
        XCTAssertEqual(downloads.shown(over: tiergarten).notices.map(\.state), [.loading])
        let failed = await waitUntil { downloads.shown(over: self.tiergarten).notices.map(\.state) == [.unavailable] }
        XCTAssertTrue(failed)
        XCTAssertEqual(downloads.shown(over: tiergarten).notices.first?.city.place, "Berlin")
        XCTAssertTrue(downloads.shown(over: zurich).notices.isEmpty)
    }

    func testAFileThatIsNotTheIndexsIsNotDrawnAndTheIndexIsAskedForAgainAtOnce() async throws {
        let old = Self.file(id: "berlin", zones: [Self.zone])
        let new = Self.file(id: "berlin", zones: [Self.zone, Self.otherZone])
        // The index of one deploy, the file of the next; then the next's index.
        let api = DownloadStubAPI(files: ["berlin.json": new])
        await api.queue("index.json", [index([entry("berlin", file: old)]), index([entry("berlin", file: new)])])
        let downloads = makeDownloads(api: api)

        downloads.request(over: tiergarten)
        let drawn = await waitUntil { downloads.shown(over: self.tiergarten).zones.count == 2 }
        XCTAssertTrue(drawn, "The new index is asked for at once, and the file of its version with it")
        let asked = await api.asked()
        XCTAssertEqual(asked, ["index.json", "berlin.json", "index.json", "berlin.json"])
        XCTAssertEqual(cache.read("berlin.json")?.data, new)
    }

    func testANewVersionIsNotDrawnUntilItHasComeAndAnOldOneNeverInItsPlace() async throws {
        let old = Self.file(id: "berlin", zones: [Self.zone])
        let new = Self.file(id: "berlin", zones: [Self.zone, Self.otherZone])
        let api = DownloadStubAPI(files: ["index.json": index([entry("berlin", file: old)]), "berlin.json": old])
        let downloads = makeDownloads(api: api)
        downloads.request(over: tiergarten)
        let drawn = await waitUntil { downloads.shown(over: self.tiergarten).zones.count == 1 }
        XCTAssertTrue(drawn)

        // A new version is published, and the new file fails to come.
        await api.set("index.json", index([entry("berlin", file: new)]))
        await api.remove("berlin.json")
        now += CityZoneDownloads.indexRefresh
        downloads.request(over: tiergarten)
        let failed = await waitUntil { downloads.shown(over: self.tiergarten).notices.map(\.state) == [.unavailable] }
        XCTAssertTrue(failed)
        XCTAssertTrue(downloads.shown(over: tiergarten).zones.isEmpty, "The old version is not drawn")
    }

    func testOfflineTheFilesKeptAreDrawnForAWeekAfterTheIndexWasLastConfirmed() async throws {
        let file = Self.file(id: "berlin", zones: [Self.zone])
        let online = DownloadStubAPI(files: ["index.json": index([entry("berlin", file: file)]), "berlin.json": file])
        let first = makeDownloads(api: online)
        first.request(over: tiergarten)
        let drawn = await waitUntil { first.shown(over: self.tiergarten).zones.count == 1 }
        XCTAssertTrue(drawn)

        // The app opened again, offline, a day later: the files kept serve.
        now += 24 * 3600
        let offline = DownloadStubAPI(files: [:])
        let second = makeDownloads(api: offline)
        second.request(over: tiergarten)
        let kept = await waitUntil { second.shown(over: self.tiergarten).zones.count == 1 }
        XCTAssertTrue(kept)
        let asked = await offline.asked()
        XCTAssertEqual(asked, ["index.json"], "The index was due, and failed; the file was read from the device")

        // A week after the index was confirmed, not any more.
        now += CityZoneDownloads.indexLifetime
        let third = makeDownloads(api: offline)
        third.request(over: tiergarten)
        let unavailable = await waitUntil { third.shown(over: self.tiergarten).notices.map(\.state) == [.unavailable] }
        XCTAssertTrue(unavailable)
        XCTAssertTrue(third.shown(over: tiergarten).zones.isEmpty)
    }

    func testACityBuiltIntoTheAppIsDrawnFromTheCatalogAndLeftAsideInTheIndex() async throws {
        let file = Self.file(id: "berlin", zones: [Self.zone])
        let api = DownloadStubAPI(files: ["index.json": index([entry("berlin", file: file)]), "berlin.json": file])
        let downloads = makeDownloads(api: api, builtInCities: ["berlin"])
        downloads.request(over: tiergarten)
        let indexed = await waitUntil { await api.asked() == ["index.json"] }
        XCTAssertTrue(indexed)
        downloads.request(over: tiergarten)
        XCTAssertTrue(downloads.cities.isEmpty)
        XCTAssertEqual(downloads.shown(over: tiergarten).zones, [])
        XCTAssertEqual(downloads.shown(over: tiergarten).notices, [])
    }

    func testANewIndexLetsGoOfTheFilesOfCitiesItNoLongerLists() async throws {
        let file = Self.file(id: "berlin", zones: [Self.zone])
        cache.write("hamburg.json", Data("{}".utf8), at: now)
        let api = DownloadStubAPI(files: ["index.json": index([entry("berlin", file: file)]), "berlin.json": file])
        let downloads = makeDownloads(api: api)
        downloads.request(over: tiergarten)
        let drawn = await waitUntil { downloads.shown(over: self.tiergarten).zones.count == 1 }
        XCTAssertTrue(drawn)
        let kept = try FileManager.default.contentsOfDirectory(atPath: directory.path).sorted()
        XCTAssertEqual(kept, ["berlin.json", "index.json"])
    }

    // MARK: - The map

    func testTheMapDrawsADownloadedCitysZonesFromZoom14AndSaysWhileTheyAreNot() async throws {
        let file = Self.file(id: "berlin", zones: [Self.zone])
        let api = DownloadStubAPI(files: ["index.json": index([entry("berlin", file: file)])])
        let model = ScooterMapModel(
            api: api, locationManager: CLLocationManager(), defaults: isolatedDefaults(), now: { self.now },
            cityZoneCache: cache
        )
        model.showsZones = false
        let region = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 52.5145, longitude: 13.355),
            span: MKCoordinateSpan(latitudeDelta: 0.006, longitudeDelta: 0.01)
        )
        model.updateViewport(region, zoom: 16)
        let failed = await waitUntil { model.mapZoneNotices.map(\.state) == [.unavailable] }
        XCTAssertTrue(failed)
        XCTAssertTrue(model.mapZones.isEmpty)
        let notice = try XCTUnwrap(model.mapZoneNotices.first)
        XCTAssertEqual(ZoneLegend.text(of: notice), String(format: String(localized: "%@’s zones unavailable right now"), "Berlin"))
        // Never "No zones published here" over a city whose zones are not drawn.
        XCTAssertNil(ZoneLegend(state: .shown, count: 0, rules: [], notices: model.mapZoneNotices).note(hasLines: false))
        XCTAssertEqual(ZoneLegend(state: .shown, count: 0).note(hasLines: false), String(localized: "No zones published here"))

        await api.set("berlin.json", file)
        now += CityZoneDownloads.retryAfter
        model.autoRefreshIfNeeded()
        let drawn = await waitUntil { model.mapZones.map(\.id) == ["rule:berlin-no-parking-1"] }
        XCTAssertTrue(drawn)
        XCTAssertTrue(model.mapZoneNotices.isEmpty)
        XCTAssertEqual(model.mapRuleZones.map(\.rule.authority), ["Land Berlin, DL-DE Zero"])

        model.updateViewport(MKCoordinateRegion(center: region.center, span: MKCoordinateSpan(latitudeDelta: 0.08, longitudeDelta: 0.1)), zoom: 13)
        XCTAssertTrue(model.mapZones.isEmpty)
        XCTAssertTrue(model.mapZoneNotices.isEmpty)
    }

    // MARK: - Helpers

    private static let zone = #"{"id":"berlin-no-parking-1","kind":"noParking","ring":[52.511,13.35,52.512,13.35,52.512,13.351]}"#
    private static let otherZone = #"{"id":"berlin-parking-2","kind":"parking","ring":[52.513,13.36,52.5131,13.36,52.5131,13.3601]}"#

    private static func file(id: String, zones: [String]) -> Data {
        Data("{\"id\":\"\(id)\",\"zones\":[\n\(zones.joined(separator: ",\n"))\n]}\n".utf8)
    }

    private func entry(_ id: String, file: Data, source: String? = nil) -> String {
        """
        {"id":"\(id)","place":"\(id.capitalized)","authority":"Land Berlin, DL-DE Zero","timeZone":"Europe/Berlin",\
        "source":{"title":"Berlin","url":"\(source ?? self.source)"},\
        "bounds":{"south":52.5,"west":13.3,"north":52.6,"east":13.5},"zones":1,"bytes":\(file.count),\
        "sha256":"\(CityZoneFile.digest(file))"}
        """
    }

    private func index(_ entries: [String]) -> Data {
        Data("{\"format\":1,\"cities\":[\n\(entries.joined(separator: ",\n"))\n]}\n".utf8)
    }

    private func makeDownloads(api: any ScooterAPIClient, builtInCities: Set<String> = []) -> CityZoneDownloads {
        let berlin = CityZoneDownload(
            id: "berlin", place: "Berlin", authority: "Land Berlin, DL-DE Zero", timeZone: "Europe/Berlin",
            source: URL(string: source)!, bounds: GeoBounds(south: 52.5, west: 13.3, north: 52.6, east: 13.5)
        )
        return CityZoneDownloads(api: api, cache: cache, now: { self.now }, builtIn: [berlin], builtInCities: builtInCities)
    }

    private func isolatedDefaults() -> UserDefaults {
        let suiteName = "ScootRadarTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        return defaults
    }

    private func waitUntil(attempts: Int = 300, condition: @escaping () async -> Bool) async -> Bool {
        for _ in 0 ..< attempts {
            if await condition() { return true }
            try? await Task.sleep(for: .milliseconds(10))
        }
        return false
    }
}

private actor FileNetworkSession: ScooterNetworkSession {
    let statusCode: Int
    private(set) var lastRequest: URLRequest?

    init(statusCode: Int) {
        self.statusCode = statusCode
    }

    func scooterData(for request: URLRequest) async throws -> (Data, URLResponse) {
        lastRequest = request
        let response = HTTPURLResponse(url: request.url!, statusCode: statusCode, httpVersion: "HTTP/1.1", headerFields: nil)!
        return (Data("{}".utf8), response)
    }
}

/// The website's files under /zones/v1/, by name; a name it has not is a 404.
private actor DownloadStubAPI: ScooterAPIClient {
    private var files: [String: Data]
    /// Answers given in turn, the last one again and again.
    private var queued: [String: [Data]] = [:]
    private var names: [String] = []

    init(files: [String: Data]) {
        self.files = files
    }

    func scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) async throws -> ScooterResponse {
        ScooterResponse(vehicles: [])
    }

    func cityZoneFile(_ name: String) async throws -> Data {
        names.append(name)
        if let answers = queued[name], let first = answers.first {
            if answers.count > 1 { queued[name] = Array(answers.dropFirst()) }
            return first
        }
        guard let data = files[name] else { throw ScooterAPIError.httpStatus(404) }
        return data
    }

    func queue(_ name: String, _ answers: [Data]) {
        queued[name] = answers
    }

    func asked() -> [String] { names }

    func set(_ name: String, _ data: Data) {
        files[name] = data
    }

    func remove(_ name: String) {
        files[name] = nil
    }
}
