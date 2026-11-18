import CryptoKit
import DeviceCheck
import Foundation
import Synchronization
import XCTest
@testable import ScootRadar

final class ScooterPassTests: XCTestCase {
    func testAnAnswerWithoutAPassStartsOneAskAndNoOtherWithinTenMinutes() async throws {
        let test = PassTest()
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()
        var challenges = await test.session.requests(to: "/api/pass/challenge").count
        XCTAssertEqual(challenges, 1)

        // Still without a pass five minutes later, and a second before ten: no new ask.
        test.clock.advance(5 * 60)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        test.clock.advance(5 * 60 - 1)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()
        challenges = await test.session.requests(to: "/api/pass/challenge").count
        XCTAssertEqual(challenges, 1)

        // Ten minutes after the first started, the next.
        test.clock.advance(1)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()
        challenges = await test.session.requests(to: "/api/pass/challenge").count
        XCTAssertEqual(challenges, 2)

        // An answer that doesn't say so asks for nothing.
        await test.session.setScooterHeaders([:])
        test.clock.advance(20 * 60)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()
        challenges = await test.session.requests(to: "/api/pass/challenge").count
        XCTAssertEqual(challenges, 2)
    }

    func testTheFirstAskAttestsANewKeyOverTheChallengeAndSendsItsAttestation() async throws {
        let test = PassTest()
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()

        let challenges = await test.session.challenges
        let challenge = try XCTUnwrap(challenges.first)
        let generated = await test.attest.generated
        let attested = await test.attest.attested
        XCTAssertEqual(generated, ["key+id/1="])
        XCTAssertEqual(attested.map { $0.keyId }, ["key+id/1="])
        // What App Attest signs is the SHA-256 of the challenge's UTF-8 bytes, which the server hashes again.
        XCTAssertEqual(attested.first?.clientDataHash, Data(SHA256.hash(data: Data(challenge.utf8))))

        let posts = await test.session.requests(to: "/api/pass")
        let post = try XCTUnwrap(posts.first)
        XCTAssertEqual(post.httpMethod, "POST")
        XCTAssertEqual(post.url?.absoluteString, "https://scootradar.com/api/pass")
        XCTAssertEqual(post.value(forHTTPHeaderField: "Content-Type"), "application/json")
        let body = try XCTUnwrap(JSONSerialization.jsonObject(with: try XCTUnwrap(post.httpBody)) as? [String: String])
        // The key's identifier as App Attest gave it, the attestation in standard base64.
        XCTAssertEqual(body, ["platform": "ios", "challenge": challenge, "keyId": "key+id/1=", "attestation": "+/+/"])

        // The pass goes with the next request for scooters.
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        let scooters = await test.session.requests(to: "/api/scooters").last
        XCTAssertEqual(scooters?.value(forHTTPHeaderField: "X-Scooter-Pass"), "pass-1")
    }

    func testALaterAskAssertsWithTheKeyKept() async throws {
        let test = PassTest()
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()

        // A pass from another network is no use here: the server says so again.
        test.clock.advance(10 * 60)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()

        let generated = await test.attest.generated
        let attested = await test.attest.attested
        let asserted = await test.attest.asserted
        XCTAssertEqual(generated.count, 1)
        XCTAssertEqual(attested.count, 1)
        let challenges = await test.session.challenges
        let challenge = try XCTUnwrap(challenges.last)
        XCTAssertEqual(challenges.count, 2)
        XCTAssertEqual(asserted.map { $0.keyId }, ["key+id/1="])
        XCTAssertEqual(asserted.first?.clientDataHash, Data(SHA256.hash(data: Data(challenge.utf8))))

        let posts = await test.session.requests(to: "/api/pass")
        let post = try XCTUnwrap(posts.last)
        let body = try XCTUnwrap(JSONSerialization.jsonObject(with: try XCTUnwrap(post.httpBody)) as? [String: String])
        // The server's signed copy of the key, and the assertion in standard base64.
        XCTAssertEqual(body, ["platform": "ios", "challenge": challenge, "keyId": "key+id/1=", "key": "signed-key", "assertion": "+/8="])

        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        let scooters = await test.session.requests(to: "/api/scooters").last
        XCTAssertEqual(scooters?.value(forHTTPHeaderField: "X-Scooter-Pass"), "pass-2")
    }

    func testAnAssertionRefusedForgetsTheKeyAndTheNextAskAttestsANewOne() async throws {
        let test = PassTest()
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()

        await test.session.setPassStatus(403)
        test.clock.advance(10 * 60)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()
        var asserted = await test.attest.asserted
        XCTAssertEqual(asserted.count, 1)

        await test.session.setPassStatus(200)
        test.clock.advance(10 * 60)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()
        asserted = await test.attest.asserted
        let attested = await test.attest.attested
        XCTAssertEqual(asserted.count, 1)
        XCTAssertEqual(attested.map { $0.keyId }, ["key+id/1=", "key+id/2="])
    }

    func testAKeyAppAttestNoLongerKnowsIsForgotten() async throws {
        // As after a backup restored onto another iPhone.
        let test = PassTest()
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()

        await test.attest.setAssertionError(DCError(.invalidKey))
        test.clock.advance(10 * 60)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()
        let posts = await test.session.requests(to: "/api/pass").count
        XCTAssertEqual(posts, 1, "Nothing to send without an assertion")

        test.clock.advance(10 * 60)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()
        let attested = await test.attest.attested
        XCTAssertEqual(attested.map { $0.keyId }, ["key+id/1=", "key+id/2="])
    }

    func testAKeyAttestedButNotTakenByTheServerIsForgottenAndOneNotAttestedIsKept() async throws {
        let test = PassTest()
        // Apple's service out of reach: the key made is attested on the next ask, as Apple asks.
        await test.attest.setAttestationError(DCError(.serverUnavailable))
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()

        // Attested, then the server unavailable: that key can't be attested again.
        await test.attest.setAttestationError(nil)
        await test.session.setPassStatus(503)
        test.clock.advance(10 * 60)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()

        await test.session.setPassStatus(200)
        test.clock.advance(10 * 60)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()
        let attested = await test.attest.attested
        XCTAssertEqual(attested.map { $0.keyId }, ["key+id/1=", "key+id/1=", "key+id/2="])
        let asserted = await test.attest.asserted
        XCTAssertTrue(asserted.isEmpty)
    }

    func testAPassHeldIsSentWithRequestsForScootersOnlyUntilItExpiresAcrossLaunches() async throws {
        let test = PassTest(expiresIn: 3_600)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()
        await test.session.setScooterHeaders([:])

        // Relaunched: the pass kept is sent, with no ask.
        let clock = test.clock
        let relaunched = ScooterPassProvider(
            session: test.session, appAttest: test.attest, defaults: test.defaults, now: { clock.now }
        )
        let api = ScooterAPI(session: test.session, pass: relaunched)
        _ = try await api.scooters(bounds: bounds, zoom: 16)
        var scooters = await test.session.requests(to: "/api/scooters").last
        XCTAssertEqual(scooters?.value(forHTTPHeaderField: "X-Scooter-Pass"), "pass-1")

        // Zones and the cities' files are the same for everyone.
        let area = try XCTUnwrap(ScooterZoneArea(covering: GeoBounds(south: 47.361, west: 8.521, north: 47.399, east: 8.559)))
        _ = try await api.zones(in: area)
        _ = try await api.cityZoneFile("index.json")
        let zones = await test.session.requests(to: "/api/zones").last
        let file = await test.session.requests(to: "/zones/v1/index.json").last
        XCTAssertNotNil(zones)
        XCTAssertNotNil(file)
        XCTAssertNil(zones?.value(forHTTPHeaderField: "X-Scooter-Pass"))
        XCTAssertNil(file?.value(forHTTPHeaderField: "X-Scooter-Pass"))

        // Expired, it is no longer sent, nor kept.
        test.clock.advance(3_600)
        _ = try await api.scooters(bounds: bounds, zoom: 16)
        scooters = await test.session.requests(to: "/api/scooters").last
        XCTAssertNil(scooters?.value(forHTTPHeaderField: "X-Scooter-Pass"))
        let kept = await ScooterPassProvider(defaults: test.defaults, now: { clock.now }).current()
        XCTAssertNil(kept)
        let challenges = await test.session.requests(to: "/api/pass/challenge").count
        XCTAssertEqual(challenges, 1)
    }

    func testTheExpiryIsMovedByHowFarThisClockIsFromTheServers() async throws {
        // This device is a day ahead: the pass of a day would otherwise never be sent.
        let test = PassTest(expiresIn: 3_600)
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "GMT")
        formatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss 'GMT'"
        await test.session.setPassHeaders(["Date": formatter.string(from: test.clock.now)])
        test.clock.advance(86_400)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()
        // The hour the server gave is counted on this clock.
        test.clock.advance(3_590)
        let held = await test.pass.current()
        XCTAssertEqual(held, "pass-1")
        test.clock.advance(20)
        let expired = await test.pass.current()
        XCTAssertNil(expired)
    }

    func testAnUnsupportedServiceDoesNothing() async throws {
        let test = PassTest(supported: false)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()
        let paths = await test.session.requests.compactMap(\.url?.path)
        XCTAssertEqual(paths, ["/api/scooters"])
        let generated = await test.attest.generated
        XCTAssertTrue(generated.isEmpty)
        let scooters = await test.session.requests.first
        XCTAssertNil(scooters?.value(forHTTPHeaderField: "X-Scooter-Pass"))
    }

    func testTheScootersNeverWaitForTheAskNorFailWithIt() async throws {
        let test = PassTest()
        // The challenge waits until the scooters are there, and one ask runs at a time, ten minutes or not.
        await test.session.holdChallenges()
        let first = try await test.api.scooters(bounds: bounds, zoom: 16)
        XCTAssertTrue(first.vehicles.isEmpty)
        test.clock.advance(11 * 60)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.session.setChallengeStatus(503)
        await test.session.releaseChallenges()
        await test.pass.settled()
        var challenges = await test.session.requests(to: "/api/pass/challenge").count
        XCTAssertEqual(challenges, 1)
        var generated = await test.attest.generated
        XCTAssertTrue(generated.isEmpty)

        // Each failing in turn: the scooters come all the same, without a pass.
        await test.session.setChallengeStatus(200)
        for failure in [Failure.generateKey, .attestKey, .pass(429), .pass(400), .network] {
            switch failure {
            case .generateKey: await test.attest.setKeyError(DCError(.featureUnsupported))
            case .attestKey: await test.attest.setAttestationError(DCError(.unknownSystemFailure))
            case let .pass(status): await test.session.setPassStatus(status)
            case .network: await test.session.setPassError(URLError(.notConnectedToInternet))
            }
            test.clock.advance(10 * 60)
            let response = try await test.api.scooters(bounds: bounds, zoom: 16)
            XCTAssertTrue(response.vehicles.isEmpty)
            await test.pass.settled()
            let held = await test.pass.current()
            XCTAssertNil(held, "\(failure)")
            await test.attest.setKeyError(nil)
            await test.attest.setAttestationError(nil)
        }
        challenges = await test.session.requests(to: "/api/pass/challenge").count
        XCTAssertEqual(challenges, 6)
        generated = await test.attest.generated
        XCTAssertEqual(generated.count, 3, "A key not attested is kept for the next ask; one attested, not")
    }

    func testAPassThatCannotBeAHeaderIsNotKept() async throws {
        let test = PassTest()
        await test.session.setPassBody(#"{"pass":"pass\nnext","expiresAt":1795000000,"key":"signed-key"}"#)
        _ = try await test.api.scooters(bounds: bounds, zoom: 16)
        await test.pass.settled()
        let held = await test.pass.current()
        XCTAssertNil(held)
    }

    private enum Failure: CustomStringConvertible {
        case generateKey, attestKey, pass(Int), network

        var description: String {
            switch self {
            case .generateKey: "generateKey"
            case .attestKey: "attestKey"
            case let .pass(status): "pass \(status)"
            case .network: "network"
            }
        }
    }

    private var bounds: GeoBounds {
        GeoBounds(south: 47.37, west: 8.53, north: 47.38, east: 8.55)
    }
}

/// A provider and a client over one fake server and App Attest, with a clock of their own and settings of their own.
private struct PassTest {
    let clock: TestClock
    let session: PassNetworkSession
    let attest: FakeAppAttest
    let suiteName = "ScooterPassTests.\(UUID().uuidString)"
    let pass: ScooterPassProvider
    let api: ScooterAPI

    /// The settings, as a launch reads them: an instance of its own, as UserDefaults can't be shared between actors.
    var defaults: UserDefaults { UserDefaults(suiteName: suiteName)! }

    init(supported: Bool = true, expiresIn: TimeInterval = 100_000) {
        UserDefaults(suiteName: suiteName)!.removePersistentDomain(forName: suiteName)
        let clock = TestClock(Date(timeIntervalSince1970: 1_794_900_000))
        self.clock = clock
        // The server's passes expire `expiresIn` after the clock's start.
        session = PassNetworkSession(expiresAt: clock.now.timeIntervalSince1970 + expiresIn)
        attest = FakeAppAttest(isSupported: supported)
        pass = ScooterPassProvider(
            session: session, appAttest: attest, defaults: UserDefaults(suiteName: suiteName)!, now: { clock.now }
        )
        api = ScooterAPI(session: session, pass: pass)
    }
}

private final class TestClock: Sendable {
    private let date: Mutex<Date>

    init(_ date: Date) {
        self.date = Mutex(date)
    }

    var now: Date { date.withLock { $0 } }

    func advance(_ seconds: TimeInterval) {
        date.withLock { $0 += seconds }
    }
}

private actor FakeAppAttest: AppAttestService {
    nonisolated let isSupported: Bool
    private(set) var generated: [String] = []
    private(set) var attested: [(keyId: String, clientDataHash: Data)] = []
    private(set) var asserted: [(keyId: String, clientDataHash: Data)] = []
    private var keyError: (any Error)?
    private var attestationError: (any Error)?
    private var assertionError: (any Error)?

    init(isSupported: Bool) {
        self.isSupported = isSupported
    }

    func setKeyError(_ error: (any Error)?) { keyError = error }
    func setAttestationError(_ error: (any Error)?) { attestationError = error }
    func setAssertionError(_ error: (any Error)?) { assertionError = error }

    func generateKey() async throws -> String {
        if let keyError { throw keyError }
        let keyId = "key+id/\(generated.count + 1)="
        generated.append(keyId)
        return keyId
    }

    func attestKey(_ keyId: String, clientDataHash: Data) async throws -> Data {
        attested.append((keyId, clientDataHash))
        if let attestationError { throw attestationError }
        // Standard base64 "+/+/", "-_-_" in base64url.
        return Data([0xFB, 0xFF, 0xBF])
    }

    func generateAssertion(_ keyId: String, clientDataHash: Data) async throws -> Data {
        if let assertionError { throw assertionError }
        asserted.append((keyId, clientDataHash))
        // "+/8=" in standard base64.
        return Data([0xFB, 0xFF])
    }
}

/// The server: scooters, zones and files, a challenge per ask and a pass per proof.
private actor PassNetworkSession: ScooterNetworkSession {
    private(set) var requests: [URLRequest] = []
    private(set) var challenges: [String] = []
    private var scooterHeaders = ["X-Scooter-Pass": "none"]
    private var challengeStatus = 200
    private var passStatus = 200
    private var passHeaders: [String: String] = [:]
    private var passError: (any Error)?
    private var passBody: String?
    private var holdsChallenges = false
    private var held: [CheckedContinuation<Void, Never>] = []
    private var passes = 0
    private let expiresAt: TimeInterval

    init(expiresAt: TimeInterval) {
        self.expiresAt = expiresAt
    }

    func requests(to path: String) -> [URLRequest] {
        requests.filter { $0.url?.path == path }
    }

    func setScooterHeaders(_ headers: [String: String]) { scooterHeaders = headers }
    func setChallengeStatus(_ status: Int) { challengeStatus = status }
    func setPassStatus(_ status: Int) { passStatus = status; passError = nil }
    func setPassHeaders(_ headers: [String: String]) { passHeaders = headers }
    func setPassError(_ error: any Error) { passError = error }
    func setPassBody(_ body: String) { passBody = body }
    func holdChallenges() { holdsChallenges = true }

    func releaseChallenges() {
        holdsChallenges = false
        for wait in held { wait.resume() }
        held = []
    }

    func scooterData(for request: URLRequest) async throws -> (Data, URLResponse) {
        requests.append(request)
        let url = try XCTUnwrap(request.url)
        switch url.path {
        case "/api/scooters":
            return answer(url, 200, emptyScooters, headers: scooterHeaders)
        case "/api/zones":
            return answer(url, 200, #"{"zones":[],"meta":{"generatedAt":"2026-11-18T10:00:00.000Z","pending":false,"truncated":false}}"#)
        case "/api/pass/challenge":
            if holdsChallenges { await withCheckedContinuation { held.append($0) } }
            guard challengeStatus == 200 else { return answer(url, challengeStatus, #"{"error":"No."}"#) }
            // 64 base64url characters, as the server's.
            let challenge = "challenge-\(challenges.count + 1)-".padding(toLength: 64, withPad: "a_-Z", startingAt: 0)
            challenges.append(challenge)
            return answer(url, 200, #"{"challenge":"\#(challenge)"}"#)
        case "/api/pass":
            if let passError { throw passError }
            guard passStatus == 200 else { return answer(url, passStatus, #"{"error":"No."}"#) }
            passes += 1
            let body = passBody ?? #"{"pass":"pass-\#(passes)","expiresAt":\#(Int(expiresAt)),"key":"signed-key"}"#
            return answer(url, 200, body, headers: passHeaders)
        default:
            return answer(url, 200, "{}")
        }
    }

    private func answer(_ url: URL, _ status: Int, _ body: String, headers: [String: String] = [:]) -> (Data, URLResponse) {
        let response = HTTPURLResponse(
            url: url, statusCode: status, httpVersion: "HTTP/1.1",
            headerFields: headers.merging(["Content-Type": "application/json"]) { given, _ in given }
        )!
        return (Data(body.utf8), response)
    }

    private let emptyScooters = #"{"vehicles":[],"clusters":[],"providers":{},"meta":{"partial":false,"stale":false,"failedSources":[],"sources":{},"generatedAt":"2026-11-18T12:00:00.000Z","truncated":false,"totalVehicles":0,"mode":"vehicles","zoom":16}}"#
}
