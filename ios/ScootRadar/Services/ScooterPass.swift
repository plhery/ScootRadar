import CryptoKit
import DeviceCheck
import Foundation

/// App Attest as the pass needs it: the device's, or a fake in tests.
protocol AppAttestService: Sendable {
    /// False on the Simulator and some devices: the app then never asks for a pass.
    var isSupported: Bool { get }
    func generateKey() async throws -> String
    func attestKey(_ keyId: String, clientDataHash: Data) async throws -> Data
    func generateAssertion(_ keyId: String, clientDataHash: Data) async throws -> Data
}

/// The device's App Attest. Development-signed builds use Apple's development environment, TestFlight and the App
/// Store its production one, and the server accepts both: no entitlement names one.
struct DeviceAppAttest: AppAttestService {
    var isSupported: Bool { DCAppAttestService.shared.isSupported }

    func generateKey() async throws -> String {
        try await DCAppAttestService.shared.generateKey()
    }

    func attestKey(_ keyId: String, clientDataHash: Data) async throws -> Data {
        try await DCAppAttestService.shared.attestKey(keyId, clientDataHash: clientDataHash)
    }

    func generateAssertion(_ keyId: String, clientDataHash: Data) async throws -> Data {
        try await DCAppAttestService.shared.generateAssertion(keyId, clientDataHash: clientDataHash)
    }
}

/// The pass that tells the server a request for scooters comes from this app, not from a script, so that the cache
/// collects feeds for it: App Attest proves here what Turnstile proves for the web map (src/lib/mapPass.ts). Nothing
/// is enforced yet, so all of it is best effort: a failed ask leaves the app without a pass, served as before, and
/// the scooters never wait on one.
actor ScooterPassProvider {
    static let shared = ScooterPassProvider()
    /// From the start of one ask to the next, as on the web (MAP_PASS_RETRY_MS): a pass lasts a day.
    static let askSpacing: TimeInterval = 10 * 60

    // In the settings: the pass is an expiry and a signature, no identifier, and the key's private half never
    // leaves the Secure Enclave; its identifier and the server's signed copy of its public half are kept beside.
    private static let passKey = "server-pass-v1"
    private static let passExpiresAtKey = "server-pass-expires-at-v1"
    private static let keyIdKey = "app-attest-key-id-v1"
    private static let keyKey = "app-attest-key-v1"

    private let baseURL: URL
    private let session: any ScooterNetworkSession
    private let appAttest: any AppAttestService
    private let defaults: UserDefaults
    private let now: @Sendable () -> Date
    private var lastAskAt: Date?
    private var asking: Task<Void, Never>?

    init(
        baseURL: URL = ScooterAPI.productionBaseURL,
        session: any ScooterNetworkSession = ScooterAPI.privateSession,
        appAttest: any AppAttestService = DeviceAppAttest(),
        defaults: UserDefaults = .standard,
        now: @escaping @Sendable () -> Date = Date.init
    ) {
        self.baseURL = baseURL
        self.session = session
        self.appAttest = appAttest
        self.defaults = defaults
        self.now = now
    }

    /// The pass to send with a request for scooters, until it expires; then it is forgotten.
    func current() -> String? {
        guard let pass = defaults.string(forKey: Self.passKey) else { return nil }
        if now().timeIntervalSince1970 < defaults.double(forKey: Self.passExpiresAtKey) { return pass }
        defaults.removeObject(forKey: Self.passKey)
        defaults.removeObject(forKey: Self.passExpiresAtKey)
        return nil
    }

    /// The server saw no valid pass: one is asked for aside, unless an ask is under way or one started less than
    /// ten minutes ago. It returns at once.
    func askIfDue() {
        guard appAttest.isSupported, asking == nil else { return }
        let start = now()
        // A clock set back since the last ask doesn't hold the next one off.
        if let lastAskAt, start >= lastAskAt, start < lastAskAt.addingTimeInterval(Self.askSpacing) { return }
        lastAskAt = start
        asking = Task {
            await ask()
            asking = nil
        }
    }

    /// Returns once the ask under way, if any, is over.
    func settled() async {
        await asking?.value
    }

    private func ask() async {
        guard let challenge = await challenge() else { return }
        let clientDataHash = Data(SHA256.hash(data: Data(challenge.utf8)))
        if let keyId = defaults.string(forKey: Self.keyIdKey), let key = defaults.string(forKey: Self.keyKey) {
            await sendAssertion(keyId: keyId, key: key, challenge: challenge, clientDataHash: clientDataHash)
        } else {
            await sendAttestation(challenge: challenge, clientDataHash: clientDataHash)
        }
    }

    /// The first ask: a key of this install's own, attested by Apple, which the server checks and signs a copy of.
    private func sendAttestation(challenge: String, clientDataHash: Data) async {
        // A key made but not attested, as when Apple's service was out of reach, is attested on the next ask, as
        // Apple asks.
        let keyId: String
        if let made = defaults.string(forKey: Self.keyIdKey) {
            keyId = made
        } else {
            guard let made = try? await appAttest.generateKey() else { return }
            defaults.set(made, forKey: Self.keyIdKey)
            keyId = made
        }
        let attestation: Data
        do {
            attestation = try await appAttest.attestKey(keyId, clientDataHash: clientDataHash)
        } catch let error as DCError where error.code == .invalidKey {
            // Attested already, or rejected: the next ask makes a new one.
            forgetKey()
            return
        } catch {
            return
        }
        switch await post(PassRequest(
            challenge: challenge, keyId: keyId, attestation: attestation.base64EncodedString()
        )) {
        case let .issued(issued):
            if let key = issued.key, !key.isEmpty { defaults.set(key, forKey: Self.keyKey) } else { forgetKey() }
            hold(issued)
        case .refused, .failed:
            // An attested key can't be attested again: one the server didn't take is no use.
            forgetKey()
        }
    }

    /// The asks after: the attested key signs the challenge.
    private func sendAssertion(keyId: String, key: String, challenge: String, clientDataHash: Data) async {
        let assertion: Data
        do {
            assertion = try await appAttest.generateAssertion(keyId, clientDataHash: clientDataHash)
        } catch let error as DCError where error.code == .invalidKey {
            // As after a backup restored onto another iPhone: the next ask attests a new key.
            forgetKey()
            return
        } catch {
            return
        }
        switch await post(PassRequest(
            challenge: challenge, keyId: keyId, key: key, assertion: assertion.base64EncodedString()
        )) {
        case let .issued(issued): hold(issued)
        case .refused: forgetKey()
        case .failed: break
        }
    }

    private func forgetKey() {
        defaults.removeObject(forKey: Self.keyIdKey)
        defaults.removeObject(forKey: Self.keyKey)
    }

    private func hold(_ issued: Issued) {
        // Sent as a header: printable ASCII without spaces, as the server writes it.
        guard !issued.pass.isEmpty, issued.pass.utf8.allSatisfy({ (0x21 ... 0x7E).contains($0) }),
              issued.expiresAt > now().timeIntervalSince1970 else { return }
        defaults.set(issued.pass, forKey: Self.passKey)
        defaults.set(issued.expiresAt, forKey: Self.passExpiresAtKey)
    }

    /// A challenge of the server's, for this network, valid for five minutes.
    private func challenge() async -> String? {
        var request = URLRequest(url: baseURL.appending(path: "api/pass/challenge"))
        request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        guard let answer = try? await session.scooterData(for: request),
              (answer.1 as? HTTPURLResponse)?.statusCode == 200,
              let challenge = try? JSONDecoder().decode(Challenge.self, from: answer.0).challenge,
              !challenge.isEmpty else { return nil }
        return challenge
    }

    private func post(_ body: PassRequest) async -> Answer {
        var request = URLRequest(url: baseURL.appending(path: "api/pass"))
        request.httpMethod = "POST"
        request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        let encoder = JSONEncoder()
        encoder.outputFormatting = .withoutEscapingSlashes
        request.httpBody = try? encoder.encode(body)
        guard let answer = try? await session.scooterData(for: request),
              let response = answer.1 as? HTTPURLResponse else { return .failed }
        if response.statusCode == 403 { return .refused }
        guard response.statusCode == 200, var issued = try? JSONDecoder().decode(Issued.self, from: answer.0) else {
            return .failed
        }
        // The expiry is the server's time, and this device's clock may be wrong: it is moved by as much.
        issued.expiresAt += ScooterAPI.clockOffset(
            dateHeader: response.value(forHTTPHeaderField: "Date"), receivedAt: now()
        )
        return .issued(issued)
    }

    private struct Challenge: Decodable {
        let challenge: String
    }

    private struct PassRequest: Encodable {
        let platform = "ios"
        let challenge: String
        let keyId: String
        var key: String?
        var attestation: String?
        var assertion: String?
    }

    private struct Issued: Decodable {
        let pass: String
        /// Seconds since 1970.
        var expiresAt: TimeInterval
        /// The server's signed copy of the key, given for an attestation.
        let key: String?
    }

    private enum Answer {
        case issued(Issued)
        /// 403: the server refused the attestation or the assertion.
        case refused
        case failed
    }
}
