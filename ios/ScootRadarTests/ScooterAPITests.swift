import Foundation
import MapKit
import Synchronization
import XCTest
@testable import ScootRadar

final class ScooterAPITests: XCTestCase {
    func testParkingIsDecodedSeparatelyFromVehiclesAndLegacyResponsesStillWork() async throws {
        let data = Data(#"{"vehicles":[],"clusters":[],"providers":{},"parking":[{"id":"dott:bay","provider":"dott","name":"Place test","lat":45.75,"lng":4.85,"mandatory":true}],"meta":{"partial":false,"stale":false,"failedSources":[],"sources":{},"generatedAt":"2026-09-08T12:00:00Z","truncated":false,"totalVehicles":0,"mode":"vehicles","zoom":16,"parkingStatus":"fresh"}}"#.utf8)
        let response = try await makeAPI(responseStatus: 200, data: data).scooters(bounds: bounds, zoom: 16, minimumBattery: 0)
        XCTAssertEqual(response.parking.count, 1)
        XCTAssertTrue(response.parking[0].mandatory)
        XCTAssertEqual(response.parking[0].coordinate.latitude, 45.75)
        XCTAssertEqual(response.meta?.parkingStatus, "fresh")
        XCTAssertTrue(response.vehicles.isEmpty)
        let legacy = try await makeAPI(responseStatus: 200, data: emptyResponseData).scooters(bounds: bounds, zoom: 16, minimumBattery: 0)
        XCTAssertTrue(legacy.parking.isEmpty)
    }

    func testSuccessfulResponseIsDecoded() async throws {
        let api = makeAPI(responseStatus: 200, data: emptyResponseData)

        let response = try await api.scooters(bounds: bounds, zoom: 16, minimumBattery: 0)

        XCTAssertTrue(response.vehicles.isEmpty)
    }

    func testRequestSendsBoundsZoomAndFilterWithoutASeparateUserLocation() async throws {
        let session = StubNetworkSession(mode: .response(
            statusCode: 200,
            data: emptyResponseData
        ))
        let api = ScooterAPI(baseURL: ScooterAPI.productionBaseURL, session: session)

        _ = try await api.scooters(bounds: bounds, zoom: 12, minimumBattery: 55)

        let request = await session.lastRequest
        let components = URLComponents(
            url: try XCTUnwrap(request?.url),
            resolvingAgainstBaseURL: false
        )
        let names = Set(components?.queryItems?.map(\.name) ?? [])
        XCTAssertEqual(names, Set(["south", "west", "north", "east", "zoom", "minBattery"]))
        let values = Dictionary(uniqueKeysWithValues: components?.queryItems?.compactMap { item in
            item.value.map { (item.name, $0) }
        } ?? [])
        XCTAssertEqual(values["zoom"], "12")
        XCTAssertEqual(values["minBattery"], "55")
    }

    func testAViewAcrossTheDateLineIsAskedForWithItsWestGreaterThanItsEast() async throws {
        let session = StubNetworkSession(mode: .response(statusCode: 200, data: emptyResponseData))
        let api = ScooterAPI(baseURL: ScooterAPI.productionBaseURL, session: session)
        let view = GeoBounds(region: MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: -36.52, longitude: -178.6),
            span: MKCoordinateSpan(latitudeDelta: 21.08, longitudeDelta: 43)
        ))

        _ = try await api.scooters(bounds: view, zoom: 6, minimumBattery: 0)

        let request = await session.lastRequest
        let components = URLComponents(url: try XCTUnwrap(request?.url), resolvingAgainstBaseURL: false)
        let values = Dictionary(uniqueKeysWithValues: components?.queryItems?.compactMap { item in
            item.value.map { (item.name, $0) }
        } ?? [])
        XCTAssertEqual(values["west"], "159.90000")
        XCTAssertEqual(values["east"], "-157.10000")
    }

    func testRequestsToTheServerLeaveNothingOnDisk() async throws {
        // Left to themselves, both clients use a session without a URL cache:
        // the bounds in a request are the rider's position after Near me.
        let scooterSession = await ScooterAPI().session as? URLSession
        let addressSession = await AddressSearchAPI().session as? URLSession
        for session in [scooterSession, addressSession] {
            let session = try XCTUnwrap(session)
            XCTAssertFalse(session === URLSession.shared)
            XCTAssertNil(session.configuration.urlCache)
            XCTAssertEqual(session.configuration.requestCachePolicy, .reloadIgnoringLocalCacheData)
        }
    }

    func testResponseHealthMetadataIsDecoded() async throws {
        let data = Data(#"{"vehicles":[],"clusters":[],"providers":{},"meta":{"partial":true,"stale":true,"failedSources":["national"],"sources":{"national":"failed","hopp":"fresh"},"generatedAt":"2026-08-05T12:00:00.000Z","truncated":true,"totalVehicles":6200,"mode":"vehicles","zoom":null}}"#.utf8)
        let api = makeAPI(responseStatus: 200, data: data)

        let response = try await api.scooters(bounds: bounds, zoom: 16, minimumBattery: 0)

        XCTAssertTrue(response.meta?.partial == true)
        XCTAssertTrue(response.meta?.stale == true)
        XCTAssertEqual(response.meta?.failedSources, ["national"])
        XCTAssertTrue(response.meta?.truncated == true)
        XCTAssertEqual(response.meta?.totalVehicles, 6_200)
    }

    func testHTTPStatusIsPreserved() async {
        let api = makeAPI(responseStatus: 503)

        do {
            _ = try await api.scooters(bounds: bounds, zoom: 16, minimumBattery: 0)
            XCTFail("Expected an HTTP status error")
        } catch let error as ScooterAPIError {
            guard case .httpStatus(503) = error else {
                return XCTFail("Expected HTTP 503, got \(error)")
            }
            XCTAssertEqual(error.loadFailure, .unavailable)
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    func testOfflineErrorIsToldApart() async {
        let api = makeAPI(urlError: .notConnectedToInternet)

        do {
            _ = try await api.scooters(bounds: bounds, zoom: 16, minimumBattery: 0)
            XCTFail("Expected an offline error")
        } catch let error as ScooterAPIError {
            guard case .offline = error else {
                return XCTFail("Expected offline, got \(error)")
            }
            XCTAssertEqual(error.loadFailure, .offline)
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    func testTimeoutIsToldApart() async {
        let api = makeAPI(urlError: .timedOut)

        do {
            _ = try await api.scooters(bounds: bounds, zoom: 16, minimumBattery: 0)
            XCTFail("Expected a timeout error")
        } catch let error as ScooterAPIError {
            guard case .timedOut = error else {
                return XCTFail("Expected timedOut, got \(error)")
            }
            XCTAssertEqual(error.loadFailure, .timeout)
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    func testInvalidJSONIsToldApart() async {
        let api = makeAPI(responseStatus: 200, data: Data("{}".utf8))

        do {
            _ = try await api.scooters(bounds: bounds, zoom: 16, minimumBattery: 0)
            XCTFail("Expected a decoding error")
        } catch let error as ScooterAPIError {
            guard case .invalidData = error else {
                return XCTFail("Expected invalidData, got \(error)")
            }
            XCTAssertEqual(error.loadFailure, .failed)
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    func testLoadFailureReasonIsDerivedFromTheAPIError() async {
        let expectations: [(ScooterAPIError, ScooterLoadFailure)] = [
            (.offline, .offline),
            (.timedOut, .timeout),
            (.httpStatus(429), .busy),
            (.httpStatus(500), .unavailable),
            (.httpStatus(503), .unavailable),
            (.httpStatus(599), .unavailable),
            (.httpStatus(404), .failed),
            (.invalidURL, .failed),
            (.invalidResponse, .failed),
            (.invalidData(URLError(.cannotParseResponse)), .failed),
            (.network(URLError(.cannotFindHost)), .failed)
        ]
        for (error, failure) in expectations {
            XCTAssertEqual(error.loadFailure, failure, "\(error)")
            XCTAssertEqual(ScooterLoadFailure(error), failure, "\(error)")
        }
        XCTAssertEqual(ScooterLoadFailure(URLError(.badURL)), .failed)
        XCTAssertEqual(Set(ScooterLoadFailure.allCases.map(\.message)).count, 5)

        // The reason survives the trip through the real client.
        for (api, failure) in [
            (makeAPI(urlError: .notConnectedToInternet), ScooterLoadFailure.offline),
            (makeAPI(urlError: .networkConnectionLost), .offline),
            (makeAPI(urlError: .timedOut), .timeout),
            (makeAPI(responseStatus: 429), .busy),
            (makeAPI(responseStatus: 502), .unavailable),
            (makeAPI(responseStatus: 200, data: Data("{}".utf8)), .failed)
        ] {
            do {
                _ = try await api.scooters(bounds: bounds, zoom: 16, minimumBattery: 0)
                XCTFail("Expected a \(failure) failure")
            } catch {
                XCTAssertEqual(ScooterLoadFailure(error), failure)
            }
        }
    }

    func testTheClockOffsetComesFromTheDateHeaderOfTheResponse() async throws {
        let sentAt = try XCTUnwrap(ISO8601DateFormatter().date(from: "2026-10-12T10:00:00Z"))
        let header = "Mon, 12 Oct 2026 10:00:00 GMT"
        // Twenty minutes fast, twenty minutes slow, and right.
        XCTAssertEqual(ScooterAPI.clockOffset(dateHeader: header, receivedAt: sentAt.addingTimeInterval(1_200)), 1_200)
        XCTAssertEqual(ScooterAPI.clockOffset(dateHeader: header, receivedAt: sentAt.addingTimeInterval(-1_200)), -1_200)
        XCTAssertEqual(ScooterAPI.clockOffset(dateHeader: header, receivedAt: sentAt), 0)
        // Without a header that can be read, nothing is moved.
        XCTAssertEqual(ScooterAPI.clockOffset(dateHeader: nil, receivedAt: sentAt), 0)
        XCTAssertEqual(ScooterAPI.clockOffset(dateHeader: "yesterday", receivedAt: sentAt), 0)

        // The client reads it from the response it received: the server's clock
        // says twenty minutes less than this one.
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "GMT")
        formatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss 'GMT'"
        let session = StubNetworkSession(
            mode: .response(statusCode: 200, data: emptyResponseData),
            headers: ["Date": formatter.string(from: Date().addingTimeInterval(-1_200))]
        )
        let fast = try await ScooterAPI(session: session).scooters(bounds: bounds, zoom: 16, minimumBattery: 0)
        XCTAssertEqual(fast.clockOffset, 1_200, accuracy: 5)
        let withoutHeader = try await makeAPI(responseStatus: 200, data: emptyResponseData)
            .scooters(bounds: bounds, zoom: 16, minimumBattery: 0)
        XCTAssertEqual(withoutHeader.clockOffset, 0)
    }

    private var origin: GeoPoint {
        GeoPoint(latitude: 47.3769, longitude: 8.5417)
    }

    private var bounds: GeoBounds {
        GeoBounds(region: MKCoordinateRegion(
            center: origin.coordinate,
            latitudinalMeters: 1_000,
            longitudinalMeters: 1_000
        ))
    }

    private var emptyResponseData: Data {
        Data(#"{"vehicles":[],"clusters":[],"providers":{},"meta":{"partial":false,"stale":false,"failedSources":[],"sources":{"national":"fresh","hopp":"fresh"},"generatedAt":"2026-08-05T12:00:00.000Z","truncated":false,"totalVehicles":0,"mode":"vehicles","zoom":null}}"#.utf8)
    }

    private func makeAPI(responseStatus: Int, data: Data = Data()) -> ScooterAPI {
        ScooterAPI(
            baseURL: ScooterAPI.productionBaseURL,
            session: StubNetworkSession(mode: .response(statusCode: responseStatus, data: data))
        )
    }

    private func makeAPI(urlError: URLError.Code) -> ScooterAPI {
        ScooterAPI(
            baseURL: ScooterAPI.productionBaseURL,
            session: StubNetworkSession(mode: .urlError(urlError))
        )
    }
}

final class AddressSearchAPITests: XCTestCase {
    func testSwissGeocoderResponseIsDecodedAndRequestIsLocalized() async throws {
        let data = Data(#"[{"lat":47.3762772,"lng":8.5280816,"display_name":"114, Ankerstrasse, Zurich, Switzerland"}]"#.utf8)
        let session = StubAddressSearchSession(data: data)
        let api = AddressSearchAPI(
            baseURL: URL(string: "https://example.com")!,
            session: session,
            homeCountry: nil
        )

        let results = try await api.search(query: "Ankerstrasse 114", language: "de", near: nil)

        XCTAssertEqual(results, [AddressSearchResult(
            latitude: 47.3762772,
            longitude: 8.5280816,
            displayName: "114, Ankerstrasse, Zurich, Switzerland"
        )])

        let request = await session.lastRequest
        let components = URLComponents(url: try XCTUnwrap(request?.url), resolvingAgainstBaseURL: false)
        XCTAssertEqual(components?.path, "/api/geocode")
        XCTAssertNil(components?.query)
        XCTAssertEqual(request?.httpMethod, "POST")
        XCTAssertEqual(request?.cachePolicy, .reloadIgnoringLocalCacheData)
        XCTAssertEqual(request?.value(forHTTPHeaderField: "Content-Type"), "application/json")
        let body = try XCTUnwrap(request?.httpBody)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: String])
        XCTAssertEqual(json, ["q": "Ankerstrasse 114", "lang": "de"])
    }

    func testTheMapCentreIsSentWhenThereIsOne() async throws {
        let session = StubAddressSearchSession(data: Data("[]".utf8))
        let api = AddressSearchAPI(baseURL: URL(string: "https://example.com")!, session: session, homeCountry: "FR")

        _ = try await api.search(query: "Rue de Rivoli 10", language: "fr", near: GeoPoint(latitude: 48.86, longitude: 2.35))

        let request = await session.lastRequest
        let body = try XCTUnwrap(request?.httpBody)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        XCTAssertEqual(json["q"] as? String, "Rue de Rivoli 10")
        XCTAssertEqual(json["lang"] as? String, "fr")
        XCTAssertEqual(json["near"] as? [Double], [48.86, 2.35])
        // The centre says more than the time zone's country, which then stays on the iPhone.
        XCTAssertNil(json["country"])
    }

    func testTheTimeZoneCountryIsSentWithoutACentre() async throws {
        let session = StubAddressSearchSession(data: Data("[]".utf8))
        let api = AddressSearchAPI(baseURL: URL(string: "https://example.com")!, session: session, homeCountry: "US")

        _ = try await api.search(query: "Congress Ave", language: "en", near: nil)

        let request = await session.lastRequest
        let body = try XCTUnwrap(request?.httpBody)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: String])
        XCTAssertEqual(json, ["q": "Congress Ave", "lang": "en", "country": "US"])
        XCTAssertEqual(ScooterStartPlace.country(forTimeZone: "America/Chicago"), "US")
        XCTAssertEqual(ScooterStartPlace.country(forTimeZone: "America/Montreal"), "CA")
        XCTAssertNil(ScooterStartPlace.country(forTimeZone: "UTC"))
    }

    func testTooManySearchesAreToldApartFromOtherFailures() async {
        let expectations: [(Int, [String: String], AddressSearchAPIError)] = [
            (429, ["Retry-After": "60"], .rateLimited(retryAfter: .seconds(60))),
            (429, [:], .rateLimited(retryAfter: nil)),
            (429, ["Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT"], .rateLimited(retryAfter: nil)),
            (503, ["Retry-After": "30"], .invalidResponse)
        ]
        for (statusCode, headers, expected) in expectations {
            let api = AddressSearchAPI(
                baseURL: URL(string: "https://example.com")!,
                session: StubAddressSearchSession(data: Data(), statusCode: statusCode, headers: headers)
            )
            do {
                _ = try await api.search(query: "Bahnhofstrasse", language: "de", near: nil)
                XCTFail("Expected an error for \(statusCode)")
            } catch {
                XCTAssertEqual(error as? AddressSearchAPIError, expected, "\(statusCode) \(headers)")
            }
        }
    }

    func testTitleSubtitleAndCoverageAreDecodedWhenTheAPISendsThem() throws {
        let data = Data(#"""
        [
          {"lat": 47.3695, "lng": 8.5389, "display_name": "Paradeplatz 2 8001 Zürich",
           "title": "Paradeplatz 2", "subtitle": "8001 Zürich", "covered": true},
          {"lat": 46.7741, "lng": 8.1558, "display_name": "Paradeplatz (OW) - Lungern",
           "title": "Paradeplatz", "subtitle": "Lungern OW", "covered": false},
          {"lat": 47.3782, "lng": 8.5402, "display_name": "Zürich HB",
           "title": "Zürich HB", "subtitle": "", "covered": true}
        ]
        """#.utf8)

        let results = try JSONDecoder().decode([AddressSearchResult].self, from: data)

        XCTAssertEqual(results.map(\.title), ["Paradeplatz 2", "Paradeplatz", "Zürich HB"])
        XCTAssertEqual(results.map(\.subtitle), ["8001 Zürich", "Lungern OW", ""])
        XCTAssertEqual(results.map(\.isCovered), [true, false, true])
        XCTAssertEqual(results[1].displayName, "Paradeplatz (OW) - Lungern")
        XCTAssertEqual(results[1].destination, MapDestination(
            title: "Paradeplatz",
            subtitle: "Lungern OW",
            point: GeoPoint(latitude: 46.7741, longitude: 8.1558)
        ))
        // A chosen place keeps the search's answer about scooter data.
        XCTAssertEqual(results.map(\.destination.isCovered), [true, false, true])
        XCTAssertEqual(Set(results.map(\.id)).count, 3)
    }

    func testOlderResponsesFallBackToLabelSplittingAndBundledCoverage() throws {
        let data = Data(#"""
        [
          {"lat": 47.3695, "lng": 8.5389, "display_name": "Paradeplatz 2 8001 Zürich"},
          {"lat": 46.7741, "lng": 8.1558, "display_name": "Lungern", "title": "", "covered": null},
          {"lat": 47.3762772, "lng": 8.5280816, "display_name": "114, Ankerstrasse, Zurich, Switzerland",
           "title": 12, "subtitle": "ignored without a title"}
        ]
        """#.utf8)

        let results = try JSONDecoder().decode([AddressSearchResult].self, from: data)

        XCTAssertEqual(results.map(\.title), ["Paradeplatz 2", "Lungern", "Ankerstrasse 114"])
        XCTAssertEqual(results.map(\.subtitle), ["8001 Zürich", "", "Zurich, Switzerland"])
        // Without `covered`, the service areas bundled with the app decide.
        XCTAssertEqual(results.map(\.isCovered), [true, false, true])

        let examples: [(String, String, String)] = [
            ("Bahnhofstrasse 1 8001 Zürich", "Bahnhofstrasse 1", "8001 Zürich"),
            ("Rue du Rhône 10 1204 Genève", "Rue du Rhône 10", "1204 Genève"),
            ("Via Nassa 5, 6900 Lugano", "Via Nassa 5", "6900 Lugano"),
            ("114, Ankerstrasse, Zurich, Switzerland", "Ankerstrasse 114", "Zurich, Switzerland"),
            ("Zürich HB", "Zürich HB", ""),
            ("8001 Zürich", "8001 Zürich", ""),
            ("  Bahnhofstrasse 1, CH-8001 Zürich  ", "Bahnhofstrasse 1", "CH-8001 Zürich")
        ]
        for (label, title, subtitle) in examples {
            let lines = AddressSearchResult.lines(fromDisplayName: label)
            XCTAssertEqual(lines.title, title, label)
            XCTAssertEqual(lines.subtitle, subtitle, label)

            // A search result without its own title shows the same two lines.
            let result = AddressSearchResult(latitude: 47.3769, longitude: 8.5417, displayName: label)
            XCTAssertEqual(result.title, title, label)
            XCTAssertEqual(result.subtitle, subtitle, label)
        }
    }
}

@MainActor
final class AddressSearchModelTests: XCTestCase {
    private let zurich = AddressSearchResult(
        latitude: 47.3690, longitude: 8.5390, displayName: "Paradeplatz (ZH) - Zürich",
        title: "Paradeplatz", subtitle: "Zürich ZH", isCovered: true
    )
    private let lungern = AddressSearchResult(
        latitude: 46.7741, longitude: 8.1558, displayName: "Paradeplatz (OW) - Lungern",
        title: "Paradeplatz", subtitle: "Lungern OW", isCovered: false
    )

    func testSearchStartsAtTwoCharactersAndReturnChoosesTheFirstPlace() async {
        let api = StubAddressSearchClient(answers: [.places([zurich, lungern])])
        let model = SwissAddressSearchModel(api: api, debounce: .zero)
        XCTAssertEqual(model.status, .idle)
        XCTAssertNil(model.firstResult)

        // One character keeps the suggestions on screen and asks nothing.
        model.query = "P"
        XCTAssertEqual(model.status, .idle)

        model.query = " Paradeplatz "
        XCTAssertEqual(model.status, .searching)
        let found = await waitUntil { model.status != .searching }
        XCTAssertTrue(found)
        XCTAssertEqual(model.status, .results([zurich, lungern]))
        XCTAssertEqual(model.firstResult, zurich)
        let queries = await api.queries
        XCTAssertEqual(queries, ["Paradeplatz"])

        // The chosen place carries its two lines and whether it has scooter data.
        let unserved = model.select(lungern)
        XCTAssertEqual(unserved.title, "Paradeplatz")
        XCTAssertEqual(unserved.subtitle, "Lungern OW")
        XCTAssertFalse(unserved.isCovered)
        XCTAssertTrue(model.select(zurich).isCovered)
    }

    func testNothingFoundAndAFailedSearchAreToldApartAndTryAgainSearchesAgain() async {
        let api = StubAddressSearchClient(answers: [.places([]), .failure, .places([zurich])])
        let model = SwissAddressSearchModel(api: api, debounce: .zero)

        model.query = "Xyzzy"
        var settled = await waitUntil { model.status != .searching }
        XCTAssertTrue(settled)
        XCTAssertEqual(model.status, .noResults)
        XCTAssertNil(model.firstResult)

        model.query = "Zürich"
        settled = await waitUntil { model.status != .searching }
        XCTAssertTrue(settled)
        XCTAssertEqual(model.status, .failed)

        // Try again repeats the search for the text in the field.
        model.retry()
        XCTAssertEqual(model.status, .searching)
        settled = await waitUntil { model.status != .searching }
        XCTAssertTrue(settled)
        XCTAssertEqual(model.status, .results([zurich]))
        let queries = await api.queries
        XCTAssertEqual(queries, ["Xyzzy", "Zürich", "Zürich"])
    }

    func testASearchRefusedAsOneTooManyWaitsAsLongAsTheServerAsks() async {
        // The server asks for three seconds; the pause for a refusal that names none is far shorter.
        let clock = TestSearchClock()
        let api = RateLimitedAddressSearchClient(retryAfter: .seconds(3), places: [zurich], clock: clock)
        let model = SwissAddressSearchModel(
            api: api, debounce: .zero, rateLimitPause: .milliseconds(20), clock: clock
        )

        model.query = "Paradeplatz"
        let waiting = await waitUntil { clock.waits == 1 }
        XCTAssertTrue(waiting)

        // "Searching…" stays up through the wait; "Try again" never shows.
        XCTAssertEqual(model.status, .searching)
        clock.advance(by: .seconds(3) - .milliseconds(1))
        XCTAssertEqual(clock.waits, 1)
        XCTAssertEqual(model.status, .searching)
        var queries = await api.queries
        XCTAssertEqual(queries, ["Paradeplatz"])

        clock.advance(by: .milliseconds(1))
        let settled = await waitUntil { model.status != .searching }
        XCTAssertTrue(settled)
        XCTAssertEqual(model.status, .results([zurich]))
        // Asked once, then again once the server allowed it, and not before.
        queries = await api.queries
        XCTAssertEqual(queries, ["Paradeplatz", "Paradeplatz"])
        let refusals = await api.refusals
        XCTAssertEqual(refusals, 1)
    }

    func testTextTypedDuringTheWaitIsAskedForOnlyOnceTheServerAllowsIt() async {
        let clock = TestSearchClock()
        let api = RateLimitedAddressSearchClient(retryAfter: .seconds(1), places: [zurich], clock: clock)
        let model = SwissAddressSearchModel(
            api: api, debounce: .zero, rateLimitPause: .milliseconds(20), clock: clock
        )

        // Refused, the search waits for the moment the server named.
        model.query = "Par"
        var settled = await waitUntil { clock.waits == 1 }
        XCTAssertTrue(settled)

        // Typing on asks nothing while the server refuses searches, and "Searching…" stays up.
        // Each text cancels the previous one's wait and starts its own.
        model.query = "Para"
        settled = await waitUntil { clock.waits == 1 }
        XCTAssertTrue(settled)
        model.query = "Parade"
        settled = await waitUntil { clock.waits == 1 }
        XCTAssertTrue(settled)
        var queries = await api.queries
        XCTAssertEqual(queries, ["Par"])
        XCTAssertEqual(model.status, .searching)

        // Once it allows them again, only the latest text is asked for.
        clock.advance(by: .seconds(1))
        settled = await waitUntil { model.status != .searching }
        XCTAssertTrue(settled)
        XCTAssertEqual(model.status, .results([zurich]))
        queries = await api.queries
        XCTAssertEqual(queries, ["Par", "Parade"])
        let refusals = await api.refusals
        XCTAssertEqual(refusals, 1)
    }

    func testClearingTheFieldBringsTheSuggestionsBackAndDropsALateAnswer() async {
        let api = StubAddressSearchClient(answers: [.places([zurich])], delay: .milliseconds(60))
        let model = SwissAddressSearchModel(api: api, debounce: .zero)

        model.query = "Paradeplatz"
        XCTAssertEqual(model.status, .searching)
        model.clear()
        XCTAssertEqual(model.query, "")
        XCTAssertEqual(model.status, .idle)

        // The answer to the cleared text arrives later and changes nothing.
        try? await Task.sleep(for: .milliseconds(150))
        XCTAssertEqual(model.status, .idle)
    }

    func testEverySearchAsksForPlacesInTheLanguageOnScreen() async {
        let api = StubAddressSearchClient(answers: [.failure, .places([zurich]), .places([lungern])])
        let model = SwissAddressSearchModel(api: api, debounce: .zero, language: "fr")

        model.query = "Paradeplatz"
        var settled = await waitUntil { model.status != .searching }
        XCTAssertTrue(settled)
        model.retry()
        settled = await waitUntil { model.status != .searching }
        XCTAssertTrue(settled)
        model.query = "Lungern"
        settled = await waitUntil { model.status != .searching }
        XCTAssertTrue(settled)

        // The first search, the one after "Try again" and the next text all carry it.
        let languages = await api.languages
        XCTAssertEqual(languages, ["fr", "fr", "fr"])
    }

    func testEverySearchSendsTheMapCentreItIsGiven() async {
        let api = StubAddressSearchClient(answers: [.places([zurich]), .places([zurich])])
        let model = SwissAddressSearchModel(api: api, debounce: .zero)

        model.query = "Paradeplatz"
        var settled = await waitUntil { model.status != .searching }
        XCTAssertTrue(settled)

        model.near = GeoPoint(latitude: 47.37, longitude: 8.54)
        model.query = "Bahnhofstrasse 1"
        settled = await waitUntil { model.status != .searching }
        XCTAssertTrue(settled)

        let nears = await api.nears
        XCTAssertEqual(nears, [nil, GeoPoint(latitude: 47.37, longitude: 8.54)])
    }

    func testSearchLanguageIsTheOneTheAppIsShownIn() async {
        XCTAssertEqual(ScooterLanguage(localizations: ["de"]), .de)
        XCTAssertEqual(ScooterLanguage(localizations: ["fr", "en"]), .fr)
        XCTAssertEqual(ScooterLanguage(localizations: ["it-CH"]), .it)
        XCTAssertEqual(ScooterLanguage(localizations: ["en-GB"]), .en)
        XCTAssertEqual(ScooterLanguage(localizations: ["nl-BE"]), .nl)
        XCTAssertEqual(ScooterLanguage(localizations: ["nb"]), .nb)
        XCTAssertEqual(ScooterLanguage(localizations: ["pt-PT"]), .pt)
        XCTAssertEqual(ScooterLanguage(localizations: ["es"]), .es)
        XCTAssertEqual(ScooterLanguage(localizations: ["is"]), .is)
        // Anything the app is not translated into is shown, and searched, in English.
        XCTAssertEqual(ScooterLanguage(localizations: ["sv"]), .en)
        XCTAssertEqual(ScooterLanguage(localizations: ["Base"]), .en)
        XCTAssertEqual(ScooterLanguage(localizations: []), .en)

        // Left to itself, the model sends the language this run of the app is shown in.
        let shownIn = Bundle.main.preferredLocalizations.first ?? ""
        XCTAssertTrue(["en", "de", "fr", "it", "nl", "nb", "pt", "es", "is"].contains(shownIn), shownIn)
        let api = StubAddressSearchClient(answers: [.places([zurich]), .places([zurich])])
        let model = SwissAddressSearchModel(api: api, debounce: .zero)
        model.query = "Paradeplatz"
        var settled = await waitUntil { model.status != .searching }
        XCTAssertTrue(settled)

        // And the one chosen in Settings from then on.
        let other: ScooterLanguage = shownIn == "it" ? .fr : .it
        ScooterLanguage.current = other
        defer { ScooterLanguage.current = .atLaunch }
        model.query = "Bellevue"
        settled = await waitUntil { model.status != .searching }
        XCTAssertTrue(settled)
        let languages = await api.languages
        XCTAssertEqual(languages, [shownIn, other.rawValue])
    }

    /// Up to about ten seconds: CI's simulator can stall for seconds (one of these
    /// tests took 17 s there on 20 Oct), and a wait that ends in time costs nothing.
    private func waitUntil(_ condition: () async -> Bool) async -> Bool {
        for _ in 0 ..< 1000 {
            if await condition() { return true }
            try? await Task.sleep(for: .milliseconds(10))
        }
        return await condition()
    }
}

private actor StubAddressSearchClient: AddressSearchAPIClient {
    enum Answer: Sendable {
        case places([AddressSearchResult])
        case failure
    }

    private var answers: [Answer]
    private let delay: Duration
    private(set) var queries: [String] = []
    private(set) var languages: [String] = []
    private(set) var nears: [GeoPoint?] = []

    init(answers: [Answer], delay: Duration = .zero) {
        self.answers = answers
        self.delay = delay
    }

    func search(query: String, language: String, near: GeoPoint?) async throws -> [AddressSearchResult] {
        queries.append(query)
        languages.append(language)
        nears.append(near)
        let answer = answers.isEmpty ? Answer.places([]) : answers.removeFirst()
        try await Task.sleep(for: delay)
        switch answer {
        case let .places(places): return places
        case .failure: throw URLError(.notConnectedToInternet)
        }
    }
}

/// Refuses searches as too many, as the server does, until the time its first
/// refusal named has passed, and answers every search from then on.
private actor RateLimitedAddressSearchClient: AddressSearchAPIClient {
    private let retryAfter: Duration
    private let places: [AddressSearchResult]
    private let clock: TestSearchClock
    private var allowedFrom: ContinuousClock.Instant?
    private(set) var queries: [String] = []
    private(set) var refusals = 0

    init(retryAfter: Duration, places: [AddressSearchResult], clock: TestSearchClock) {
        self.retryAfter = retryAfter
        self.places = places
        self.clock = clock
    }

    func search(query: String, language: String, near: GeoPoint?) async throws -> [AddressSearchResult] {
        queries.append(query)
        let now = clock.now
        let allowedFrom = allowedFrom ?? now + retryAfter
        self.allowedFrom = allowedFrom
        guard now >= allowedFrom else {
            refusals += 1
            throw AddressSearchAPIError.rateLimited(retryAfter: retryAfter)
        }
        return places
    }
}

/// Stands still until a test moves it. A wait for a moment it has reached ends
/// at once; any other ends when `advance(by:)` reaches its moment, or as soon as
/// its task is cancelled.
private final class TestSearchClock: SearchClock {
    private struct Wait {
        let deadline: ContinuousClock.Instant
        let continuation: CheckedContinuation<Void, any Error>
    }

    private struct State {
        var now = ContinuousClock.now
        var nextWait = 0
        var waits: [Int: Wait] = [:]
    }

    private let state = Mutex(State())

    var now: ContinuousClock.Instant {
        state.withLock { $0.now }
    }

    /// The waits that have not ended yet.
    var waits: Int {
        state.withLock { $0.waits.count }
    }

    func sleep(until deadline: ContinuousClock.Instant, tolerance: Duration?) async throws {
        let id = state.withLock { state in
            state.nextWait += 1
            return state.nextWait
        }
        try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, any Error>) in
                state.withLock { state in
                    if Task.isCancelled {
                        continuation.resume(throwing: CancellationError())
                    } else if deadline <= state.now {
                        continuation.resume()
                    } else {
                        state.waits[id] = Wait(deadline: deadline, continuation: continuation)
                    }
                }
            }
        } onCancel: {
            state.withLock { $0.waits.removeValue(forKey: id) }?
                .continuation.resume(throwing: CancellationError())
        }
    }

    func advance(by duration: Duration) {
        let ended = state.withLock { state in
            state.now += duration
            let ended = state.waits.filter { $0.value.deadline <= state.now }
            for id in ended.keys {
                state.waits[id] = nil
            }
            return Array(ended.values)
        }
        for wait in ended {
            wait.continuation.resume()
        }
    }
}

private actor StubNetworkSession: ScooterNetworkSession {
    enum Mode: Sendable {
        case response(statusCode: Int, data: Data)
        case urlError(URLError.Code)
    }

    let mode: Mode
    let headers: [String: String]
    private(set) var lastRequest: URLRequest?

    init(mode: Mode, headers: [String: String] = [:]) {
        self.mode = mode
        self.headers = headers
    }

    func scooterData(for request: URLRequest) async throws -> (Data, URLResponse) {
        lastRequest = request
        switch mode {
        case let .response(statusCode, data):
            let response = HTTPURLResponse(
                url: request.url!,
                statusCode: statusCode,
                httpVersion: "HTTP/1.1",
                headerFields: headers.merging(["Content-Type": "application/json"]) { given, _ in given }
            )!
            return (data, response)
        case let .urlError(code):
            throw URLError(code)
        }
    }
}

private actor StubAddressSearchSession: AddressSearchNetworkSession {
    let data: Data
    let statusCode: Int
    let headers: [String: String]
    private(set) var lastRequest: URLRequest?

    init(data: Data, statusCode: Int = 200, headers: [String: String] = [:]) {
        self.data = data
        self.statusCode = statusCode
        self.headers = headers
    }

    func addressData(for request: URLRequest) async throws -> (Data, URLResponse) {
        lastRequest = request
        return (
            data,
            HTTPURLResponse(
                url: request.url!,
                statusCode: statusCode,
                httpVersion: "HTTP/1.1",
                headerFields: headers.merging(["Content-Type": "application/json"]) { given, _ in given }
            )!
        )
    }
}

@MainActor
final class ScooterAnalyticsTests: XCTestCase {
    func testPayloadExcludesSensitiveValuesAndPersistentIdentity() {
        let payload = ScooterAnalytics.payload("rental_open", provider: "lime", value: 10,
            result: "47.123,8.456", target: "private address", screen: "/?lat=47.123")
        XCTAssertEqual(payload["url"] as? String, "/")
        XCTAssertEqual(payload["referrer"] as? String, "")
        XCTAssertEqual(payload["tag"] as? String, "ios")
        XCTAssertNil(payload["id"])
        let data = payload["data"] as? [String: Any]
        XCTAssertEqual(data?["provider"] as? String, "lime")
        XCTAssertEqual(data?["platform"] as? String, "ios")
        XCTAssertNil(data?["result"])
        XCTAssertNil(data?["target"])
    }

    func testScreenViewDoesNotBecomeNamedEvent() {
        let payload = ScooterAnalytics.payload(nil, screen: "/settings")
        XCTAssertEqual(payload["url"] as? String, "/settings")
        XCTAssertNil(payload["name"])
        XCTAssertNil(payload["data"])
    }

    func testUserAgentIsAWebViewsWithoutTheAppsName() {
        let userAgent = ScooterAnalytics.userAgent(systemVersion: "26.0.1")
        XCTAssertEqual(userAgent, "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148")
        XCTAssertFalse(userAgent.localizedCaseInsensitiveContains("radar"))
    }

    func testPayloadGoesToTheAppsOwnWebsite() {
        XCTAssertEqual(ScooterAnalytics.payload(nil)["website"] as? String, "72c49567-e00d-4a92-bfaf-d1ae7b083fd8")
    }
}
