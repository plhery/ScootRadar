import Foundation

protocol ScooterAPIClient: Sendable {
    func scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) async throws -> ScooterResponse
    /// The operators' zones that reach into the area.
    func zones(in area: ScooterZoneArea) async throws -> ScooterZoneResponse
    /// A file of the cities' zones the app downloads, under /zones/v1/: the index, or a city's
    /// (docs/city-zone-downloads.md).
    func cityZoneFile(_ name: String) async throws -> Data
}

extension ScooterAPIClient {
    /// A client that knows no zones has none to give.
    func zones(in area: ScooterZoneArea) async throws -> ScooterZoneResponse {
        ScooterZoneResponse(zones: [], pending: false, truncated: false)
    }

    /// Nor any city's to download.
    func cityZoneFile(_ name: String) async throws -> Data {
        throw ScooterAPIError.httpStatus(404)
    }
}

protocol ScooterNetworkSession: Sendable {
    func scooterData(for request: URLRequest) async throws -> (Data, URLResponse)
}

extension URLSession: ScooterNetworkSession {
    func scooterData(for request: URLRequest) async throws -> (Data, URLResponse) {
        try await data(for: request)
    }
}

actor ScooterAPI: ScooterAPIClient {
    static let productionBaseURL = URL(string: "https://scootradar.com")!

    /// The session for the app's own server. A request for scooters carries the
    /// bounds of the map, which give away the rider's position or the place
    /// searched, and the answers may be cached: this session keeps nothing on
    /// disk, as the privacy notice promises.
    static let privateSession: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.urlCache = nil
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        return URLSession(configuration: configuration)
    }()

    private let baseURL: URL
    // Ephemeral per-client map identity. Nothing is persisted or used for analytics.
    private let viewID = UUID().uuidString.lowercased()
    private var viewSequence = 0
    let session: any ScooterNetworkSession

    init(
        baseURL: URL = productionBaseURL,
        session: any ScooterNetworkSession = privateSession
    ) {
        self.baseURL = baseURL
        self.session = session
    }

    func scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) async throws -> ScooterResponse {
        viewSequence += 1
        let view = "\(viewID).\(viewSequence)"
        let (data, httpResponse) = try await get("api/scooters", query: [
            URLQueryItem(name: "south", value: String(format: "%.5f", bounds.south)),
            URLQueryItem(name: "west", value: String(format: "%.5f", bounds.west)),
            URLQueryItem(name: "north", value: String(format: "%.5f", bounds.north)),
            URLQueryItem(name: "east", value: String(format: "%.5f", bounds.east)),
            URLQueryItem(name: "zoom", value: String(zoom)),
            URLQueryItem(name: "minBattery", value: String(minimumBattery))
        ], view: view)
        // The server's times are compared with this device's clock, which may be wrong.
        let clockOffset = Self.clockOffset(
            dateHeader: httpResponse.value(forHTTPHeaderField: "Date"),
            receivedAt: Date()
        )

        do {
            var scooters = try JSONDecoder().decode(ScooterAPIResponsePayload.self, from: data).model
            scooters.clockOffset = clockOffset
            return scooters
        } catch {
            throw ScooterAPIError.invalidData(error)
        }
    }

    func zones(in area: ScooterZoneArea) async throws -> ScooterZoneResponse {
        let (data, _) = try await get("api/zones", query: area.queryItems)
        do {
            return try JSONDecoder().decode(ScooterZoneResponse.self, from: data)
        } catch {
            throw ScooterAPIError.invalidData(error)
        }
    }

    /// A static file of the website: the same for everyone, it asks with no coordinates.
    func cityZoneFile(_ name: String) async throws -> Data {
        try await get("zones/v1/\(name)", query: []).0
    }

    /// A connection lost on the way (networkConnectionLost) is most often one kept alive that the server or a change
    /// of network closed, under a phone still online: it is asked again at once, on a new one, as Android's client does
    /// (OkHttp's retryOnConnectionFailure). Lost twice, the phone is taken to be offline, as it is with no network.
    private static func fetch(_ request: URLRequest, from session: any ScooterNetworkSession) async throws -> (Data, URLResponse) {
        do {
            return try await session.scooterData(for: request)
        } catch let error as URLError where error.code == .networkConnectionLost {
            return try await session.scooterData(for: request)
        }
    }

    /// A GET to the app's server, with what went wrong told apart as the dock reports it.
    private func get(_ path: String, query: [URLQueryItem], view: String? = nil) async throws -> (Data, HTTPURLResponse) {
        var components = URLComponents(
            url: baseURL.appending(path: path),
            resolvingAgainstBaseURL: false
        )!
        components.queryItems = query.isEmpty ? nil : query

        guard let url = components.url else {
            throw ScooterAPIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let view { request.setValue(view, forHTTPHeaderField: "X-Scooter-View") }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await Self.fetch(request, from: session)
        } catch is CancellationError {
            throw CancellationError()
        } catch let error as URLError {
            switch error.code {
            case .cancelled:
                throw CancellationError()
            case .notConnectedToInternet,
                 .networkConnectionLost,
                 .dataNotAllowed,
                 .internationalRoamingOff:
                throw ScooterAPIError.offline
            case .timedOut:
                throw ScooterAPIError.timedOut
            default:
                throw ScooterAPIError.network(error)
            }
        } catch {
            throw ScooterAPIError.network(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw ScooterAPIError.invalidResponse
        }
        guard (200 ... 299).contains(httpResponse.statusCode) else {
            throw ScooterAPIError.httpStatus(httpResponse.statusCode)
        }
        return (data, httpResponse)
    }

    /// How far the clock of this device is ahead of the server's (negative when
    /// it is behind), from the Date header of a response and the moment it
    /// arrived; 0 without a readable header, as on the web. The header counts
    /// whole seconds and the response took a moment to arrive, so a right clock
    /// gives a second or two, not 0.
    static func clockOffset(dateHeader: String?, receivedAt: Date) -> TimeInterval {
        guard let dateHeader else { return 0 }
        // "Mon, 12 Oct 2026 10:00:00 GMT"
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "GMT")
        formatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss zzz"
        guard let sentAt = formatter.date(from: dateHeader) else { return 0 }
        return receivedAt.timeIntervalSince(sentAt)
    }
}

/// Why loading scooters failed. Web and iOS show the same sentence for each reason.
enum ScooterLoadFailure: String, CaseIterable, Equatable, Sendable {
    case offline
    case timeout
    /// HTTP 429.
    case busy
    /// HTTP 5xx.
    case unavailable
    case failed

    init(_ error: any Error) {
        self = (error as? ScooterAPIError)?.loadFailure ?? .failed
    }

    var message: String {
        switch self {
        case .offline: String(localized: "You’re offline. Check your connection.")
        case .timeout: String(localized: "ScootRadar took too long to respond.")
        case .busy: String(localized: "ScootRadar is busy right now. Try again in a moment.")
        case .unavailable: String(localized: "ScootRadar is having trouble. Try again in a moment.")
        case .failed: String(localized: "Couldn’t load scooters.")
        }
    }
}

enum ScooterAPIError: Error {
    case invalidURL
    case offline
    case timedOut
    case invalidResponse
    case httpStatus(Int)
    case invalidData(Error)
    case network(Error)

    var loadFailure: ScooterLoadFailure {
        switch self {
        case .offline: .offline
        case .timedOut: .timeout
        case .httpStatus(429): .busy
        case let .httpStatus(statusCode) where (500 ... 599).contains(statusCode): .unavailable
        default: .failed
        }
    }
}
