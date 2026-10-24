import Foundation
import UIKit

/// First-party Umami events. No advertising IDs, coordinates, addresses, or vehicle IDs.
@MainActor
final class ScooterAnalytics {
    static let shared = ScooterAnalytics()
    static let disabledKey = "analytics-disabled"
    // "ScootRadar iOS" in Umami, apart from the website's "ScootRadar" (docs/analytics.md).
    static let website = "72c49567-e00d-4a92-bfaf-d1ae7b083fd8"
    static let endpoint = URL(string: "https://u.plhery.com/api/send")!
    private var cache: String?
    private var disabledByServer = false
    private var pending = 0
    private var previous: Task<Void, Never>?
    private let session: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpShouldSetCookies = false
        configuration.urlCache = nil
        configuration.timeoutIntervalForRequest = 5
        configuration.timeoutIntervalForResource = 5
        return URLSession(configuration: configuration)
    }()

    private var enabled: Bool {
        guard !UserDefaults.standard.bool(forKey: Self.disabledKey), !disabledByServer,
              ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] == nil,
              ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"] != "1" else { return false }
        #if targetEnvironment(simulator)
        return ProcessInfo.processInfo.arguments.contains("-analytics-smoke-test")
        #else
        return true
        #endif
    }

    static func payload(_ name: String?, provider: String? = nil, value: Int? = nil,
                        result: String? = nil, target: String? = nil, screen: String = "/") -> [String: Any] {
        var payload: [String: Any] = [
            "website": website, "hostname": "scootradar.com",
            "url": ["/", "/filters", "/settings"].contains(screen) ? screen : "/",
            "title": "ScootRadar", "referrer": "", "tag": "ios",
            "language": ScooterLanguage.current.locale.identifier.replacingOccurrences(of: "_", with: "-")
        ]
        if let name {
            var data: [String: Any] = ["platform": "ios"]
            for (key, entry) in [("provider", provider), ("result", result), ("target", target)] {
                if let entry, entry.range(of: "^[a-zA-Z0-9_-]{1,40}$", options: .regularExpression) != nil {
                    data[key] = entry
                }
            }
            if let value { data["value"] = value }
            payload["name"] = name
            payload["data"] = data
        }
        return payload
    }

    /// An iPhone web view's own user agent, without the app's name: Umami drops a bare app's as a bot,
    /// and from isbot 5.2 (Umami 3.4) any with "radar" in it, so "ScootRadar/1.0" lost every event.
    static func userAgent(systemVersion: String) -> String {
        let os = systemVersion.replacingOccurrences(of: ".", with: "_")
        return "Mozilla/5.0 (iPhone; CPU iPhone OS \(os) like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
    }

    func track(_ name: String? = nil, provider: String? = nil, value: Int? = nil,
               result: String? = nil, target: String? = nil, screen: String = "/") {
        guard enabled, pending < 30 else { return }
        let payload = Self.payload(name, provider: provider, value: value, result: result, target: target, screen: screen)
        guard let body = try? JSONSerialization.data(withJSONObject: ["type": "event", "payload": payload]) else { return }
        pending += 1
        let predecessor = previous
        previous = Task { [self] in
            await predecessor?.value
            defer { pending -= 1 }
            guard enabled else { return }
            var request = URLRequest(url: Self.endpoint)
            request.httpMethod = "POST"
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue(Self.userAgent(systemVersion: UIDevice.current.systemVersion), forHTTPHeaderField: "User-Agent")
            if let cache { request.setValue(cache, forHTTPHeaderField: "x-umami-cache") }
            do {
                let (data, response) = try await session.data(for: request)
                guard let response = response as? HTTPURLResponse, (200..<300).contains(response.statusCode),
                      let result = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }
                cache = result["cache"] as? String
                disabledByServer = result["disabled"] as? Bool == true
            } catch { /* Best effort: never block a rider or retain an offline history. */ }
        }
    }
}
