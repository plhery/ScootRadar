import CoreLocation
import Foundation
import MapKit
import SwiftUI
import UIKit

struct Scooter: Identifiable, Hashable, Sendable {
    let provider: String
    let latitude: Double
    let longitude: Double
    let battery: Int?
    let rangeMeters: Int?
    let vehicleID: String?
    let deepLink: String?
    let rentalURIs: ScooterRentalURIs?
    let distanceMeters: Double?
    let pricing: ScooterRidePricing?

    init(
        provider: String,
        latitude: Double,
        longitude: Double,
        battery: Int?,
        rangeMeters: Int?,
        vehicleID: String?,
        deepLink: String?,
        rentalURIs: ScooterRentalURIs?,
        distanceMeters: Double?,
        pricing: ScooterRidePricing? = nil
    ) {
        self.provider = provider
        self.latitude = latitude
        self.longitude = longitude
        self.battery = battery
        self.rangeMeters = rangeMeters
        self.vehicleID = vehicleID
        self.deepLink = deepLink
        self.rentalURIs = rentalURIs
        self.distanceMeters = distanceMeters
        self.pricing = pricing
    }

    var id: String {
        if let vehicleID {
            return "\(provider):\(vehicleID)"
        }
        return "\(provider):\(latitude):\(longitude)"
    }

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    var providerInfo: ScooterProvider? {
        ScooterProvider(rawValue: provider)
    }

    func distance(from origin: GeoPoint) -> CLLocationDistance {
        CLLocation(
            latitude: origin.latitude,
            longitude: origin.longitude
        ).distance(
            from: CLLocation(latitude: latitude, longitude: longitude)
        )
    }

    func formattedDistance(from origin: GeoPoint) -> String {
        Self.formattedLength(meters: distance(from: origin))
    }

    var formattedRange: String? {
        guard let rangeMeters else { return nil }
        return Self.formattedLength(meters: Double(rangeMeters))
    }

    var rentalURL: URL? {
        rentalURLs.first
    }

    /// The safe links to the scooter, in the order they are tried.
    var rentalURLs: [URL] {
        ScooterRentalLinkPolicy.rentalURLs(
            provider: provider,
            rentalURIs: rentalURIs,
            legacyLink: deepLink
        )
    }

    /// Opens the scooter in its provider's app. A link in the app's own scheme
    /// opens nothing when the app is not installed, so the next link, the
    /// provider's web page, is tried then. Returns the link that opened.
    @MainActor
    @discardableResult
    func openRental(
        using open: @MainActor (URL) async -> Bool = { await UIApplication.shared.open($0) }
    ) async -> URL? {
        for url in rentalURLs where await open(url) {
            return url
        }
        return nil
    }

    /// The operator's app, where the feed links no scooter: Lime's and Bird's never do.
    var operatorApp: ScooterProvider.OperatorApp? {
        rentalURLs.isEmpty ? providerInfo?.app : nil
    }

    /// Opens the operator's app on its universal link, which opens only an installed app;
    /// without the app, its App Store page opens instead. Nothing asks iOS which apps are
    /// installed. Returns the link that opened.
    @MainActor
    @discardableResult
    func openOperatorApp(
        using open: @MainActor (URL, _ appOnly: Bool) async -> Bool = { url, appOnly in
            await UIApplication.shared.open(url, options: appOnly ? [.universalLinksOnly: true] : [:])
        }
    ) async -> URL? {
        guard let app = operatorApp else { return nil }
        if await open(app.link, true) { return app.link }
        return await open(app.appStore, false) ? app.appStore : nil
    }

    /// "320 m" below a kilometre; "1.4 km" and "24 km" from there, as on the
    /// web. The system's rounding for roads would say "300 m" for the same scooter.
    /// Where the region measures in miles, as in the US and the UK, the system
    /// writes it as it does on its own roads: "1,000 ft" or "350 yd" under half a
    /// mile, "1.9 mi" from there. src/lib/walking.ts rounds the same way.
    static func formattedLength(meters: Double, locale: Locale = ScooterLanguage.current.locale) -> String {
        let formatted: String
        if locale.measurementSystem == .metric {
            let length = meters < 1_000
                ? Measurement(value: meters.rounded(), unit: UnitLength.meters)
                : Measurement(value: meters / 1_000, unit: UnitLength.kilometers)
            formatted = length.formatted(.measurement(
                width: .abbreviated,
                usage: .asProvided,
                // Halves go up, as the web rounds them: 1 250 m is "1.3 km".
                numberFormatStyle: .number
                    .precision(.fractionLength(0 ... 1))
                    .rounded(rule: .toNearestOrAwayFromZero)
            ).locale(locale))
        } else {
            formatted = Measurement(value: meters, unit: UnitLength.meters)
                .formatted(.measurement(width: .abbreviated, usage: .road).locale(locale))
        }
        // A line never breaks between the number and its unit.
        return formatted.replacingOccurrences(of: " ", with: "\u{00A0}")
    }

    /// The same length with its number and its unit apart, for a figure whose
    /// unit is set smaller than its number.
    static func lengthParts(
        meters: Double,
        locale: Locale = ScooterLanguage.current.locale
    ) -> (value: String, unit: String?) {
        let length = formattedLength(meters: meters, locale: locale)
        let parts = length.split(separator: "\u{00A0}", maxSplits: 1)
        guard parts.count == 2 else { return (length, nil) }
        return (String(parts[0]), String(parts[1]))
    }
}

enum ScooterBatteryLevel: Equatable, Sendable {
    case good
    case low
    case critical

    /// Good from 50%, low from 20% to 49%, critical under 20%, as on the web.
    init(percent: Int) {
        if percent >= 50 {
            self = .good
        } else if percent >= 20 {
            self = .low
        } else {
            self = .critical
        }
    }
}

extension Scooter {
    var batteryLevel: ScooterBatteryLevel? {
        battery.map(ScooterBatteryLevel.init(percent:))
    }
}

struct ScooterRentalURIs: Hashable, Sendable {
    let ios: String?
    let android: String?
    let web: String?
}

struct ScooterRidePricing: Hashable, Sendable {
    let currency: String
    let unlockFeeMinorUnits: Int
    let minuteFeeMinorUnits: Int
    /// Tax is added to these prices, as US and Canadian operators charge sales tax on top.
    var plusTax = false
    /// "2026-10-18": the feed publishes no price, and this one was copied from the operator's
    /// price list, where it was last checked that day.
    var listedOn: String?

    /// "CHF 1.00 to unlock", or "USD 1.00 to unlock + tax" where tax is added.
    func taxed(_ text: String) -> String {
        plusTax ? String(format: String(localized: "%@ + tax"), text) : text
    }

    /// The tariff, followed by when it was checked where it was copied from a price list.
    func listed(_ text: String) -> String {
        guard let day = listedOn.flatMap({ RidePriceFormatter.listedDay($0) }) else { return text }
        return String(format: String(localized: "%1$@ · published price, checked %2$@"), text, day)
    }
}

struct ProviderRidePass: Codable, Hashable, Sendable {
    var enabled: Bool
    var freeUnlock: Bool
    var freeMinutes: Int
    var expiryDate: Date?

    init(
        enabled: Bool = false,
        freeUnlock: Bool = false,
        freeMinutes: Int = 0,
        expiryDate: Date? = nil
    ) {
        self.enabled = enabled
        self.freeUnlock = freeUnlock
        self.freeMinutes = max(0, freeMinutes)
        self.expiryDate = expiryDate
    }

    func isActive(on date: Date = .now, calendar: Calendar = .current) -> Bool {
        guard enabled else { return false }
        guard let expiryDate else { return true }

        let expiryDay = calendar.startOfDay(for: expiryDate)
        guard let firstMomentAfterExpiryDay = calendar.date(
            byAdding: .day,
            value: 1,
            to: expiryDay
        ) else { return false }

        return date < firstMomentAfterExpiryDay
    }
}

enum RideEstimateDuration {
    static let allowedMinutes = [5, 10, 15, 20, 30]
    static let defaultMinutes = 10

    static func normalized(_ minutes: Int) -> Int {
        allowedMinutes.contains(minutes) ? minutes : defaultMinutes
    }
}

struct RidePriceQuote: Hashable, Sendable {
    let currency: String
    let durationMinutes: Int
    let grossMinorUnits: Int
    let totalMinorUnits: Int
    let chargedUnlockFeeMinorUnits: Int
    let billedMinutes: Int
    let freeMinutesApplied: Int
    let passApplied: Bool
    /// Tax is added to the estimate.
    var plusTax = false
}

enum RidePriceEstimator {
    static func quote(
        pricing: ScooterRidePricing,
        durationMinutes: Int,
        pass: ProviderRidePass? = nil,
        now: Date = .now,
        calendar: Calendar = .current
    ) -> RidePriceQuote {
        let durationMinutes = max(0, durationMinutes)
        let unlockFee = max(0, pricing.unlockFeeMinorUnits)
        let minuteFee = max(0, pricing.minuteFeeMinorUnits)
        let grossMinorUnits = totalMinorUnits(
            unlockFee: unlockFee,
            minuteFee: minuteFee,
            billedMinutes: durationMinutes
        )

        let activePass = pass.flatMap { candidate in
            candidate.isActive(on: now, calendar: calendar) ? candidate : nil
        }
        let billedMinutes = max(0, durationMinutes - max(0, activePass?.freeMinutes ?? 0))
        let chargedUnlockFee = activePass?.freeUnlock == true ? 0 : unlockFee
        let totalMinorUnits = totalMinorUnits(
            unlockFee: chargedUnlockFee,
            minuteFee: minuteFee,
            billedMinutes: billedMinutes
        )

        return RidePriceQuote(
            currency: pricing.currency,
            durationMinutes: durationMinutes,
            grossMinorUnits: grossMinorUnits,
            totalMinorUnits: totalMinorUnits,
            chargedUnlockFeeMinorUnits: chargedUnlockFee,
            billedMinutes: billedMinutes,
            freeMinutesApplied: durationMinutes - billedMinutes,
            passApplied: totalMinorUnits < grossMinorUnits,
            plusTax: pricing.plusTax
        )
    }

    private static func totalMinorUnits(
        unlockFee: Int,
        minuteFee: Int,
        billedMinutes: Int
    ) -> Int {
        let (minuteTotal, multiplicationOverflowed) = minuteFee.multipliedReportingOverflow(
            by: billedMinutes
        )
        guard !multiplicationOverflowed else { return Int.max }

        let (total, additionOverflowed) = unlockFee.addingReportingOverflow(minuteTotal)
        return additionOverflowed ? Int.max : total
    }
}

enum ScooterRentalLinkPolicy {
    private struct ProviderPolicy {
        let schemes: Set<String>
        let httpsHosts: Set<String>
    }

    private static let policies: [String: ProviderPolicy] = [
        "bolt": ProviderPolicy(
            schemes: ["bolt"],
            httpsHosts: ["bolt.eu", "bolt.com"]
        ),
        "bird": ProviderPolicy(
            schemes: ["bird"],
            httpsHosts: ["bird.co", "birdapp.com", "birdapp.app.link"]
        ),
        "dott": ProviderPolicy(
            schemes: ["dott", "ridedott"],
            httpsHosts: ["ridedott.com"]
        ),
        "hopp": ProviderPolicy(
            schemes: ["hopp"],
            httpsHosts: ["hopp.bike"]
        ),
        "lime": ProviderPolicy(
            schemes: ["lime", "limebike"],
            httpsHosts: ["li.me", "lime.bike", "limebike.com"]
        ),
        "voi": ProviderPolicy(
            schemes: ["voiapp"],
            httpsHosts: ["voi.com", "voiscooters.com", "lqfa.adj.st"]
        ),
        "pony": ProviderPolicy(
            schemes: ["co.ponybikes.mercury", "co.ponybikes.venus"],
            httpsHosts: ["getapony.com"]
        ),
        "zeus": ProviderPolicy(
            schemes: [],
            httpsHosts: ["zeus.city", "ridezeus.app.link"]
        ),
        "beryl": ProviderPolicy(
            schemes: ["beryl-basis"],
            httpsHosts: ["beryl.app", "beryl.cc"]
        ),
        "ryde": ProviderPolicy(
            schemes: ["rydelink", "ryde-linking"],
            httpsHosts: ["ryde.vip"]
        ),
        "hoppy": ProviderPolicy(
            schemes: [],
            httpsHosts: ["ride-hoppy.app.link", "behoppy.eu"]
        ),
        "ride_mobility": ProviderPolicy(
            schemes: [],
            httpsHosts: ["ridemobility.app.link", "ridemobility.eu"]
        ),
        "yoio": ProviderPolicy(
            schemes: [],
            httpsHosts: ["rideyoio.app.link", "yoio.app"]
        ),
        "elerent": ProviderPolicy(
            schemes: [],
            httpsHosts: ["elerent.app.link", "elerent.com"]
        ),
        "zelectra": ProviderPolicy(
            schemes: [],
            httpsHosts: ["zelectra.app.link", "3electra.com.ua"]
        ),
        "spin": ProviderPolicy(
            schemes: [],
            httpsHosts: ["spin.app", "spin.pm"]
        ),
        "veo": ProviderPolicy(
            schemes: [],
            httpsHosts: ["gmjc.adj.st", "veoride.com"]
        ),
        "lyft": ProviderPolicy(
            schemes: [],
            httpsHosts: ["lft.to", "lyft.com", "biketownpdx.com"]
        ),
        // Bolt runs its scooters in Washington, DC as Hopp, in an app of that name.
        "bolt_hopp": ProviderPolicy(
            schemes: ["bolt-hopp"],
            httpsHosts: ["gethopp.com"]
        ),
        // SAHAM, in Riyadh, is on ATOM Mobility: its links end in the number on the scooter.
        "saham": ProviderPolicy(
            schemes: [],
            httpsHosts: ["ride-saham.app.link", "sahamofficial.com"]
        ),
        // Flamingo, in New Zealand, links each scooter on ride.flamingoscooters.com.
        "flamingo": ProviderPolicy(
            schemes: [],
            httpsHosts: ["flamingoscooters.com"]
        ),
        // JOLT, in New Plymouth and Rolleston, links each scooter by a uuid on its own site.
        "jolt": ProviderPolicy(
            schemes: [],
            httpsHosts: ["joltscooters.co.nz"]
        ),
        "publibike": ProviderPolicy(
            schemes: ["publibike", "velospot"],
            httpsHosts: ["publibike.ch", "velospot.info"]
        )
    ]

    /// Links that open an operator's app elsewhere than on a scooter, as rentalLinks.ts has them.
    private static let notRentalLinks: [(scheme: String, host: String)] = [("bird", "charger-onboarding")]

    static func rentalURL(
        provider: String,
        rentalURIs: ScooterRentalURIs?,
        legacyLink: String?
    ) -> URL? {
        rentalURLs(provider: provider, rentalURIs: rentalURIs, legacyLink: legacyLink).first
    }

    /// The iOS link, the web link and the legacy one, without the unsafe ones
    /// and without repeats.
    static func rentalURLs(
        provider: String,
        rentalURIs: ScooterRentalURIs?,
        legacyLink: String?
    ) -> [URL] {
        var urls: [URL] = []
        for candidate in [rentalURIs?.ios, rentalURIs?.web, legacyLink] {
            if let url = safeURL(provider: provider, value: candidate), !urls.contains(url) {
                urls.append(url)
            }
        }
        return urls
    }

    static func safeURL(provider: String, value: String?) -> URL? {
        guard let value else { return nil }
        let candidate = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !candidate.isEmpty,
              candidate.utf8.count <= 2_048,
              !candidate.unicodeScalars.contains(where: CharacterSet.controlCharacters.contains),
              let policy = policies[provider],
              let components = URLComponents(string: candidate),
              components.user == nil,
              components.password == nil,
              let scheme = components.scheme?.lowercased() else { return nil }

        // Bird's and Spin's feeds give bird://charger-onboarding as their app's address: the
        // sign-up for people who charge scooters, never a rental, whatever the country.
        if notRentalLinks.contains(where: { $0.scheme == scheme && $0.host == components.host?.lowercased() }) {
            return nil
        }
        if scheme == "https" {
            guard components.port == nil,
                  let hostname = components.host?.lowercased(),
                  policy.httpsHosts.contains(where: { allowedHost in
                      hostname == allowedHost || hostname.hasSuffix(".\(allowedHost)")
                  }) else { return nil }
        } else if !policy.schemes.contains(scheme) {
            return nil
        }

        return components.url
    }
}

struct ScooterCluster: Identifiable, Hashable, Sendable {
    let id: String
    let latitude: Double
    let longitude: Double
    let count: Int
    let providers: [String: Int]
    var city: String? = nil
    /// Where the cities of a group lie, for a total that stands for several.
    var bounds: GeoBounds? = nil

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    func filtered(to enabledProviders: Set<ScooterProvider>) -> ScooterCluster? {
        let filteredProviders = providers.filter { providerID, _ in
            ScooterProvider(rawValue: providerID).map(enabledProviders.contains) == true
        }
        let filteredCount = filteredProviders.values.reduce(0, +)
        guard filteredCount > 0 else { return nil }
        return ScooterCluster(
            id: id,
            latitude: latitude,
            longitude: longitude,
            count: filteredCount,
            providers: filteredProviders,
            city: city,
            bounds: bounds
        )
    }
}

/// Zoomed out, a country, a state or province, or neighbouring cities are drawn as one total.
enum ScooterCityGrouping {
    /// Further out than this, where a phone shows more than France, a country is one total.
    static let countryTotalsBelowZoom = 5.0
    /// Down to this zoom, a country whose totals are its states' or provinces' (data/countries.json)
    /// shows one per region; further out, where the whole United States is a couple of hundred
    /// points wide, one for the country again.
    static let regionTotalsFromZoom = 3.0
    /// Centres closer than this, in points, would draw the totals over one another.
    static let spacing = 60.0
    /// Named in a group's label; the rest are left to zooming in.
    static let namedCities = 3
    /// Where a country's total stands: inland and about the middle of the country, from data/countries.json.
    static let countryAnchors = ScooterCountryCatalog.anchors

    /// Zoomed out to a continent, one total per country, never two countries in one, or per state or
    /// province where the country's totals are its regions'; closer, one per city or cluster of
    /// neighbouring cities. Countries are named by countryName, regions in the language.
    static func group(
        _ cities: [ScooterCluster],
        zoomLevel: Double,
        language: ScooterLanguage = .en,
        regions: [String: [String: ScooterRegion]] = ScooterCountryCatalog.regionTotals,
        countryName: (String) -> String = { $0.uppercased() }
    ) -> [ScooterCluster] {
        zoomLevel < countryTotalsBelowZoom
            ? countryTotals(
                cities, regions: zoomLevel >= regionTotalsFromZoom ? regions : [:], language: language,
                countryName: countryName
            ).sorted(by: byCount)
            : spacedApart(cities, zoomLevel: zoomLevel)
    }

    /// "city:fr:Paris" is in France, and "city:us:or:Portland", whose id names its state, in the United States.
    static func country(of city: ScooterCluster) -> String? {
        let parts = city.id.split(separator: ":", maxSplits: 2)
        guard parts.count == 3, parts[0] == "city", parts[1].count == 2 else { return nil }
        return String(parts[1])
    }

    private static func byCount(_ lhs: ScooterCluster, _ rhs: ScooterCluster) -> Bool {
        lhs.count != rhs.count ? lhs.count > rhs.count : lhs.id < rhs.id
    }

    /// "city:us:or:Portland" is in Oregon, "or", where the regions name the United States' states.
    static func region(of city: ScooterCluster, in regions: [String: [String: ScooterRegion]]) -> (code: String, region: ScooterRegion)? {
        let parts = city.id.split(separator: ":", maxSplits: 3)
        guard parts.count == 4, parts[0] == "city", let region = regions[String(parts[1])]?[String(parts[2])] else { return nil }
        return (String(parts[2]), region)
    }

    private static func countryTotals(
        _ cities: [ScooterCluster],
        regions: [String: [String: ScooterRegion]],
        language: ScooterLanguage,
        countryName: (String) -> String
    ) -> [ScooterCluster] {
        var groups: [String: (name: String, anchor: (latitude: Double, longitude: Double)?, members: [ScooterCluster])] = [:]
        var totals: [ScooterCluster] = []
        for city in cities {
            guard let country = country(of: city) else {
                totals.append(city)
                continue
            }
            if let (code, region) = region(of: city, in: regions) {
                let id = "region:\(country):\(code)"
                groups[id, default: (
                    name: region.names[language.rawValue] ?? region.name,
                    anchor: (latitude: region.latitude, longitude: region.longitude), members: []
                )].members.append(city)
            } else {
                groups["country:\(country)", default: (name: countryName(country), anchor: countryAnchors[country], members: [])]
                    .members.append(city)
            }
        }
        for (id, group) in groups {
            let anchor = group.anchor ?? (group.members[0].latitude, group.members[0].longitude)
            totals.append(combined(
                group.members, id: id, latitude: anchor.latitude, longitude: anchor.longitude, name: group.name
            ))
        }
        return totals
    }

    /// The total with the most scooters takes in its neighbours on screen and stays
    /// where it is, so a group sits on a real city and keeps its place while the map is panned.
    private static func spacedApart(_ totals: [ScooterCluster], zoomLevel: Double) -> [ScooterCluster] {
        let ordered = totals.sorted(by: byCount)
            .map { (total: $0, point: worldPoint(latitude: $0.latitude, longitude: $0.longitude, zoomLevel: zoomLevel)) }
        var taken = Set<String>()
        var groups: [ScooterCluster] = []
        for head in ordered where !taken.contains(head.total.id) {
            let members = ordered.filter { other in
                !taken.contains(other.total.id) &&
                    hypot(other.point.x - head.point.x, other.point.y - head.point.y) < spacing
            }.map(\.total)
            for member in members { taken.insert(member.id) }
            guard members.count > 1 else {
                groups.append(head.total)
                continue
            }
            let names = members.compactMap(\.city)
            groups.append(combined(
                members, id: "group:\(head.total.id)", latitude: head.total.latitude, longitude: head.total.longitude,
                name: names.count > namedCities
                    ? names.prefix(namedCities).joined(separator: ", ") + "…"
                    : names.joined(separator: ", ")
            ))
        }
        return groups
    }

    private static func combined(
        _ members: [ScooterCluster], id: String, latitude: Double, longitude: Double, name: String
    ) -> ScooterCluster {
        var providers: [String: Int] = [:]
        for member in members {
            providers.merge(member.providers, uniquingKeysWith: +)
        }
        return ScooterCluster(
            id: id,
            latitude: latitude,
            longitude: longitude,
            count: members.reduce(0) { $0 + $1.count },
            providers: providers,
            city: name,
            bounds: GeoBounds(
                south: members.map { $0.bounds?.south ?? $0.latitude }.min()!,
                west: members.map { $0.bounds?.west ?? $0.longitude }.min()!,
                north: members.map { $0.bounds?.north ?? $0.latitude }.max()!,
                east: members.map { $0.bounds?.east ?? $0.longitude }.max()!
            )
        )
    }

    /// Web Mercator, in points of a 256-point tile.
    private static func worldPoint(latitude: Double, longitude: Double, zoomLevel: Double) -> CGPoint {
        let worldSize = 256 * pow(2, zoomLevel)
        let sinLatitude = sin(min(85.05112878, max(-85.05112878, latitude)) * .pi / 180)
        return CGPoint(
            x: (longitude + 180) / 360 * worldSize,
            y: (0.5 - log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * .pi)) * worldSize
        )
    }
}

enum ScooterClusteringPolicy {
    static let maximumClusterZoom = 15
    static let maximumOverviewZoom = 10

    static func shouldCluster(at zoomLevel: Double) -> Bool {
        zoomLevel <= Double(maximumClusterZoom)
    }

    static func shouldCluster(at apiZoom: Int) -> Bool {
        apiZoom <= maximumClusterZoom
    }

    static func apiZoom(for zoomLevel: Double) -> Int {
        guard zoomLevel.isFinite else { return 0 }
        return min(22, max(0, Int(ceil(zoomLevel))))
    }

    static func representationsMatch(_ lhs: Int, _ rhs: Int) -> Bool {
        if lhs <= maximumOverviewZoom, rhs <= maximumOverviewZoom { return true }
        if !shouldCluster(at: lhs), !shouldCluster(at: rhs) {
            return true
        }
        return lhs == rhs
    }
}

struct ScooterParking: Identifiable, Equatable, Sendable {
    let id: String
    let provider: String
    let name: String
    let latitude: Double
    let longitude: Double
    let mandatory: Bool

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    var providerInfo: ScooterProvider? {
        ScooterProvider(rawValue: provider)
    }

    var providerName: String {
        providerInfo?.name ?? provider.capitalized
    }

    /// "Dott parking bay", the title of the bay card in the dock.
    var bayTitle: String {
        String(format: String(localized: "%@ parking bay"), providerName)
    }

    /// The card's notice: a warning when parking in a bay is mandatory, neutral otherwise.
    var notice: String {
        mandatory ? String(localized: "You must park in a bay in this zone.")
            : String(localized: "Designated scooter parking.")
    }

    /// "Check the Dott app before you end your ride."
    var footnote: String {
        String(format: String(localized: "Check the %@ app before you end your ride."), providerName)
    }
}

struct ScooterResponse: Sendable {
    let vehicles: [Scooter]
    let clusters: [ScooterCluster]
    let providers: [String: Int]
    let meta: ScooterResponseMetadata?
    let parking: [ScooterParking]
    /// How far the clock of this device is ahead of the server's (negative when
    /// it is behind), from the response's Date header. 0 without the header.
    var clockOffset: TimeInterval

    init(
        vehicles: [Scooter],
        clusters: [ScooterCluster] = [],
        providers: [String: Int] = [:],
        meta: ScooterResponseMetadata? = nil,
        parking: [ScooterParking] = [],
        clockOffset: TimeInterval = 0
    ) {
        self.vehicles = vehicles
        self.clusters = clusters
        self.providers = providers
        self.meta = meta
        self.parking = parking
        self.clockOffset = clockOffset
    }
}

struct ScooterResponseMetadata: Sendable {
    let partial: Bool
    let stale: Bool
    let failedSources: [String]
    let sources: [String: String]
    let generatedAt: String?
    let truncated: Bool
    let totalVehicles: Int?
    let mode: String?
    let zoom: Int?
    let overview: Bool
    let refreshAfterSeconds: Int?
    /// The server is collecting feeds of this answer again: ask once more after `refreshAfterSeconds`.
    let refreshing: Bool
    let parkingStatus: String?
    let expiresAt: String?
    let parkingExpiresAt: String?

    init(
        partial: Bool,
        stale: Bool = false,
        failedSources: [String],
        sources: [String: String] = [:],
        generatedAt: String? = nil,
        truncated: Bool = false,
        totalVehicles: Int? = nil,
        mode: String? = nil,
        zoom: Int? = nil,
        overview: Bool = false,
        refreshAfterSeconds: Int? = nil,
        refreshing: Bool = false,
        parkingStatus: String? = nil,
        expiresAt: String? = nil,
        parkingExpiresAt: String? = nil
    ) {
        self.partial = partial
        self.stale = stale
        self.failedSources = failedSources
        self.sources = sources
        self.generatedAt = generatedAt
        self.truncated = truncated
        self.totalVehicles = totalVehicles
        self.mode = mode
        self.zoom = zoom
        self.overview = overview
        self.refreshAfterSeconds = refreshAfterSeconds
        self.refreshing = refreshing
        self.parkingStatus = parkingStatus
        self.expiresAt = expiresAt
        self.parkingExpiresAt = parkingExpiresAt
    }
}

extension ScooterVehiclePayload {
    var model: Scooter {
        Scooter(
            provider: provider,
            latitude: latitude,
            longitude: longitude,
            battery: battery,
            rangeMeters: rangeMeters,
            vehicleID: vehicleID,
            deepLink: deepLink,
            rentalURIs: rentalURIs.map {
                ScooterRentalURIs(ios: $0.ios, android: $0.android, web: $0.web)
            },
            distanceMeters: distanceMeters,
            pricing: pricing.flatMap { payload in
                let currency = payload.currency.uppercased()
                guard currency.utf8.count == 3,
                      currency.utf8.allSatisfy({ $0 >= 65 && $0 <= 90 }),
                      payload.unlockFeeMinorUnits >= 0,
                      payload.minuteFeeMinorUnits >= 0 else { return nil }
                return ScooterRidePricing(
                    currency: currency,
                    unlockFeeMinorUnits: payload.unlockFeeMinorUnits,
                    minuteFeeMinorUnits: payload.minuteFeeMinorUnits,
                    plusTax: payload.plusTax == true,
                    listedOn: payload.listedOn.flatMap { $0.wholeMatch(of: /\d{4}-\d{2}-\d{2}/) == nil ? nil : $0 }
                )
            }
        )
    }
}

extension ScooterClusterPayload {
    var model: ScooterCluster {
        ScooterCluster(
            id: id,
            latitude: latitude,
            longitude: longitude,
            count: count,
            providers: providers,
            city: city
        )
    }
}

extension ScooterResponseMetadataPayload {
    var model: ScooterResponseMetadata {
        ScooterResponseMetadata(
            partial: partial,
            stale: stale,
            failedSources: failedSources,
            sources: sources.mapValues(\.rawValue),
            generatedAt: generatedAt,
            truncated: truncated,
            totalVehicles: totalVehicles,
            mode: mode.rawValue,
            zoom: zoom,
            overview: overview ?? false,
            refreshAfterSeconds: refreshAfterSeconds,
            refreshing: refreshing ?? false,
            parkingStatus: parkingStatus?.rawValue,
            expiresAt: expiresAt,
            parkingExpiresAt: parkingExpiresAt
        )
    }
}

extension ScooterAPIResponsePayload {
    var model: ScooterResponse {
        ScooterResponse(
            vehicles: vehicles.map(\.model),
            clusters: clusters.map(\.model),
            providers: providers,
            meta: meta.model,
            parking: (parking ?? []).map { ScooterParking(id: $0.id, provider: $0.provider,
                name: $0.name, latitude: $0.lat, longitude: $0.lng, mandatory: $0.mandatory) }
        )
    }
}

/// Light, dark, or whichever of the two the iPhone is in.
enum ScooterAppearance: String, CaseIterable, Identifiable, Sendable {
    case automatic
    case light
    case dark

    var id: String { rawValue }

    var label: String {
        switch self {
        case .automatic: String(localized: "Automatic")
        case .light: String(localized: "Light")
        case .dark: String(localized: "Dark")
        }
    }

    /// Unspecified leaves the choice to the iPhone.
    var interfaceStyle: UIUserInterfaceStyle {
        switch self {
        case .automatic: .unspecified
        case .light: .light
        case .dark: .dark
        }
    }
}

enum AppleMapStyle: String, CaseIterable, Identifiable, Sendable {
    case standard
    case quiet
    case satellite

    var id: String { rawValue }

    var label: String {
        switch self {
        case .standard: String(localized: "Standard")
        case .quiet: String(localized: "Quiet")
        case .satellite: String(localized: "Satellite")
        }
    }

    /// The ground under the dots. Quiet is flat and muted, without points of
    /// interest or traffic, so nothing on it competes with the scooters.
    var configuration: MKMapConfiguration {
        switch self {
        case .standard:
            let configuration = MKStandardMapConfiguration(elevationStyle: .flat, emphasisStyle: .default)
            configuration.pointOfInterestFilter = Self.landmarks
            return configuration
        case .quiet:
            let configuration = MKStandardMapConfiguration(elevationStyle: .flat, emphasisStyle: .muted)
            configuration.pointOfInterestFilter = .excludingAll
            configuration.showsTraffic = false
            return configuration
        case .satellite:
            let configuration = MKHybridMapConfiguration(elevationStyle: .flat)
            configuration.pointOfInterestFilter = Self.landmarks
            return configuration
        }
    }

    private static var landmarks: MKPointOfInterestFilter {
        MKPointOfInterestFilter(including: [.publicTransport, .landmark])
    }
}

struct GeoPoint: Equatable, Sendable {
    let latitude: Double
    let longitude: Double

    init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }

    init(_ coordinate: CLLocationCoordinate2D) {
        self.init(latitude: coordinate.latitude, longitude: coordinate.longitude)
    }

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

/// A box of the map, like `MapBounds` in src/lib/types.ts. A west greater than
/// the east crosses the 180° line, as in GeoJSON: the box runs from its west to
/// 180° and on from -180° to its east, as a view of New Zealand and the Chatham
/// Islands does. A box from -180 to 180 goes all the way round.
struct GeoBounds: Hashable, Sendable {
    let south: Double
    let west: Double
    let north: Double
    let east: Double

    /// The region MapKit shows. Its centre is between -180° and 180° and its
    /// edges may run past them: such a view crosses the line, and one wider
    /// than the world is all of it.
    init(region: MKCoordinateRegion) {
        let halfLatitude = region.span.latitudeDelta / 2
        let halfLongitude = region.span.longitudeDelta / 2
        south = max(-90, region.center.latitude - halfLatitude)
        north = min(90, region.center.latitude + halfLatitude)
        let longitudes = Self.longitudes(
            west: region.center.longitude - halfLongitude,
            east: region.center.longitude + halfLongitude
        )
        west = longitudes.west
        east = longitudes.east
    }

    init(south: Double, west: Double, north: Double, east: Double) {
        self.south = south
        self.west = west
        self.north = north
        self.east = east
    }

    /// Longitudes that run from west to east past ±180°, brought back between them.
    private static func longitudes(west: Double, east: Double) -> (west: Double, east: Double) {
        if east - west >= 360 { return (-180, 180) }
        var wrappedWest = wrapped(west)
        var wrappedEast = wrapped(east)
        // An edge on the line itself is on the side of the rest of the box.
        if wrappedWest == 180 && wrappedEast < 180 { wrappedWest = -180 }
        if wrappedEast == -180 && wrappedWest > -180 { wrappedEast = 180 }
        return (wrappedWest, wrappedEast)
    }

    /// The longitude in -180...180; one already there is kept as it is, 180 included.
    static func wrapped(_ longitude: Double) -> Double {
        if longitude >= -180 && longitude <= 180 { return longitude }
        let turned = (longitude + 180).truncatingRemainder(dividingBy: 360)
        return (turned < 0 ? turned + 360 : turned) - 180
    }

    /// Whether the box runs across the 180° line.
    var crossesDateLine: Bool { west > east }

    /// How many degrees of longitude the box spans, 360 at most.
    var longitudeSpan: Double { crossesDateLine ? east - west + 360 : east - west }

    /// The box's longitudes as one or two ranges that keep to -180...180.
    private var longitudeRanges: [ClosedRange<Double>] {
        crossesDateLine ? [min(west, 180)...180, -180...max(east, -180)] : [west...east]
    }

    func intersects(_ other: GeoBounds) -> Bool {
        guard south <= other.north && north >= other.south else { return false }
        // Both cross the line, so both hold it.
        if crossesDateLine && other.crossesDateLine { return true }
        return longitudeRanges.contains { range in other.longitudeRanges.contains { range.overlaps($0) } }
    }

    func contains(_ other: GeoBounds) -> Bool {
        guard other.south >= south && other.north <= north else { return false }
        if longitudeSpan >= 360 { return true }
        // Within one of this box's ranges: across the line only if this box crosses it too.
        if other.crossesDateLine {
            return crossesDateLine && other.west >= west && other.east <= east
        }
        return longitudeRanges.contains { $0.contains(other.west) && $0.contains(other.east) }
    }

    func contains(latitude: Double, longitude: Double) -> Bool {
        guard latitude >= south && latitude <= north else { return false }
        return crossesDateLine
            ? longitude >= west || longitude <= east
            : longitude >= west && longitude <= east
    }

    func contains(_ point: GeoPoint) -> Bool {
        contains(latitude: point.latitude, longitude: point.longitude)
    }

    /// The middle of the box, on the right side of the 180° line.
    var center: GeoPoint {
        GeoPoint(
            latitude: (south + north) / 2,
            longitude: crossesDateLine ? Self.wrapped(west + longitudeSpan / 2) : (west + east) / 2
        )
    }

    /// Larger by the ratio of its size on each side; one that would go round the world is all of it.
    func expanded(by ratio: Double) -> GeoBounds {
        let latitudePadding = (north - south) * ratio
        let longitudePadding = longitudeSpan * ratio
        let round = longitudeSpan + 2 * longitudePadding >= 360
        return GeoBounds(
            south: max(-90, south - latitudePadding),
            west: round ? -180 : Self.wrapped(west - longitudePadding),
            north: min(90, north + latitudePadding),
            east: round ? 180 : Self.wrapped(east + longitudePadding)
        )
    }
}

/// A city's ban on renting shared scooters at night, like src/lib/rentalCurfews.ts.
/// Some operators still list their scooters as available then, so the dock and
/// the card say why they can't be rented. `all` is generated from
/// data/rental-curfews.json.
struct RentalCurfew: Sendable {
    /// One window of the ban. A night belongs to the evening it starts on: a
    /// window that starts before noon is the early hours after that evening.
    struct Night: Sendable {
        /// Calendar weekdays of those evenings, 1 for Sunday; every evening when nil.
        let evenings: Set<Int>?
        /// Local minutes since midnight; a window past midnight starts after it ends.
        let fromMinute: Int
        let untilMinute: Int

        /// Whether it holds at that wall-clock time, on that weekday.
        func holds(atMinute local: Int, weekday: Int) -> Bool {
            let evening: Int
            if fromMinute > untilMinute {
                guard local >= fromMinute || local < untilMinute else { return false }
                evening = local >= fromMinute ? weekday : weekday - 1
            } else {
                guard local >= fromMinute, local < untilMinute else { return false }
                evening = fromMinute >= 12 * 60 ? weekday : weekday - 1
            }
            return evenings?.contains((evening + 6) % 7 + 1) ?? true
        }
    }

    let city: String
    let timeZone: String
    let nights: [Night]
    /// The municipality's boundary, one ring a piece.
    let areas: [[GeoPoint]]

    struct Active: Equatable, Hashable, Sendable {
        let city: String
        /// When renting is allowed again.
        let until: Date
        /// The city's time zone, whose clock that time is told by.
        let timeZone: TimeZone
    }

    /// The ban in force at that point and instant, if any.
    static func active(at point: GeoPoint, on date: Date, among curfews: [RentalCurfew] = all) -> Active? {
        for curfew in curfews where curfew.contains(point) {
            guard let zone = TimeZone(identifier: curfew.timeZone) else { continue }
            var calendar = Calendar(identifier: .gregorian)
            calendar.timeZone = zone
            let clock = calendar.dateComponents([.weekday, .hour, .minute], from: date)
            let local = (clock.hour ?? 0) * 60 + (clock.minute ?? 0)
            // The calendar finds the end across a change of the clocks.
            guard let night = curfew.nights.first(where: { $0.holds(atMinute: local, weekday: clock.weekday ?? 1) }),
                  let until = calendar.nextDate(
                    after: date,
                    matching: DateComponents(hour: night.untilMinute / 60, minute: night.untilMinute % 60, second: 0),
                    matchingPolicy: .nextTime
                  ) else { continue }
            return Active(city: curfew.city, until: until, timeZone: zone)
        }
        return nil
    }

    /// Ray casting, as polygonContainsPoint on the web.
    func contains(_ point: GeoPoint) -> Bool {
        areas.contains { area in
            var inside = false
            var previous = area.count - 1
            for index in area.indices {
                let a = area[index], b = area[previous]
                if (a.latitude > point.latitude) != (b.latitude > point.latitude),
                   point.longitude < (b.longitude - a.longitude) * (point.latitude - a.latitude) / (b.latitude - a.latitude) + a.longitude {
                    inside.toggle()
                }
                previous = index
            }
            return inside
        }
    }
}

/// The part of the year a city has no scooters, as Montréal each winter, like
/// src/lib/seasonalPauses.ts. Its operators may list nothing or stop answering
/// then, so the dock says when the scooters are back. ScooterCity.pauses is
/// generated from the catalogs' `seasonal` windows.
struct ScooterSeasonalPause: Equatable, Sendable {
    /// Local "MM-DD": the first day without scooters.
    let from: String
    /// Local "MM-DD": the first day they are back.
    let until: String
    /// The IANA time zone the dates are in.
    let timeZone: String

    struct Active: Equatable, Hashable, Sendable {
        let city: String
        /// The month the scooters come back, 1 for January.
        let month: Int
    }

    /// The local date in the pause's zone, "MM-DD".
    private func localDate(_ date: Date) -> String? {
        guard let zone = TimeZone(identifier: timeZone) else { return nil }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = zone
        let day = calendar.dateComponents([.month, .day], from: date)
        guard let month = day.month, let dayOfMonth = day.day else { return nil }
        return String(format: "%02d-%02d", month, dayOfMonth)
    }

    /// Whether it holds on that date. A window from "11-16" until "04-15" spans the new year.
    func holds(on date: Date) -> Bool {
        guard let today = localDate(date) else { return false }
        return from < until ? today >= from && today < until : today >= from || today < until
    }

    private static let daysBeforeMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

    private static func dayOfYear(_ date: String) -> Int {
        let month = Int(date.prefix(2)) ?? 1
        return daysBeforeMonth[min(max(month - 1, 0), 11)] + (Int(date.suffix(2)) ?? 1)
    }

    /// Days from that date to the first day back.
    private func daysLeft(on date: Date) -> Int {
        guard let today = localDate(date) else { return 365 }
        return (Self.dayOfYear(until) - Self.dayOfYear(today) + 365) % 365
    }

    /// The month the scooters come back when every one of the pauses holds: the
    /// soonest of their ends. Nil when one does not hold, or there are none.
    static func returnMonth(_ pauses: [ScooterSeasonalPause], on date: Date) -> Int? {
        guard !pauses.isEmpty, pauses.allSatisfy({ $0.holds(on: date) }),
              let soonest = pauses.min(by: { $0.daysLeft(on: date) < $1.daysLeft(on: date) }) else { return nil }
        return Int(soonest.until.prefix(2))
    }

    /// The city at that point whose scooters are away for the season. Nil outside
    /// every city, or where one of the cities around the point has scooters now.
    static func active(at point: GeoPoint, on date: Date, among cities: [ScooterCity] = ScooterCityCatalog.cities) -> Active? {
        var found: Active?
        for city in cities where city.bounds.contains(point) {
            guard let month = returnMonth(city.pauses, on: date) else { return nil }
            if found == nil { found = Active(city: city.name, month: month) }
        }
        return found
    }

    /// The month's name in the app's language, as it stands in a sentence: "April", "avril".
    static func monthName(_ month: Int, locale: Locale = ScooterLanguage.current.locale) -> String {
        let formatter = DateFormatter()
        formatter.locale = locale
        let names = formatter.standaloneMonthSymbols ?? []
        return names.indices.contains(month - 1) ? names[month - 1] : String(month)
    }
}

struct MapFocusRequest: Equatable, Sendable {
    let point: GeoPoint
    let token: Int
    let latitudinalMeters: CLLocationDistance
    let longitudinalMeters: CLLocationDistance

    init(
        point: GeoPoint,
        token: Int,
        latitudinalMeters: CLLocationDistance = 850,
        longitudinalMeters: CLLocationDistance = 850
    ) {
        self.point = point
        self.token = token
        self.latitudinalMeters = latitudinalMeters
        self.longitudinalMeters = longitudinalMeters
    }
}

extension MapFocusRequest {
    /// The span the map zooms to when a city total is tapped: 0.08° by 0.12°.
    static func city(_ point: GeoPoint, token: Int) -> MapFocusRequest {
        let metersPerDegree = 111_320.0
        return MapFocusRequest(
            point: point,
            token: token,
            latitudinalMeters: 0.08 * metersPerDegree,
            longitudinalMeters: 0.12 * metersPerDegree * cos(point.latitude * .pi / 180)
        )
    }
}

struct MapDestination: Equatable, Identifiable, Sendable {
    enum Kind: Equatable, Sendable {
        case address
        /// A covered city: the map shows the whole city rather than one street.
        case city
    }

    let title: String
    /// The second line of a recent place; may be empty.
    let subtitle: String
    let point: GeoPoint
    let kind: Kind
    /// False when no operator serves the place: nothing may promise scooters there.
    let isCovered: Bool

    init(
        title: String,
        subtitle: String = "",
        point: GeoPoint,
        kind: Kind = .address,
        isCovered: Bool? = nil
    ) {
        self.title = title
        self.subtitle = subtitle
        self.point = point
        self.kind = kind
        // Without the search's own answer the bundled service areas decide.
        self.isCovered = isCovered ?? ScooterCityCatalog.contains(point)
    }

    var id: String { "\(title)|\(point.latitude)|\(point.longitude)" }
}

extension ScooterCityCatalog {
    /// The city whose centre the point is. The address search answers a typed
    /// city name with that centre; addresses, stations and places lie elsewhere.
    static func city(centredAt point: GeoPoint) -> ScooterCity? {
        cities.first {
            abs($0.center.latitude - point.latitude) < 0.000_001 &&
                abs($0.center.longitude - point.longitude) < 0.000_001
        }
    }
}

extension ScooterCity {
    /// The country in the user's language, such as "Germany".
    var countryName: String {
        ScooterLanguage.current.locale.localizedString(forRegionCode: countryCode) ?? countryCode
    }

    /// The city as a place to search from.
    var destination: MapDestination {
        MapDestination(title: name, subtitle: countryName, point: center, kind: .city, isCovered: true)
    }
}

extension ScooterCityDistance {
    /// Whole kilometres such as "61 km", as on the web; whole miles such as
    /// "38 mi" where the region measures in miles.
    var formattedDistance: String {
        formattedDistance(locale: ScooterLanguage.current.locale)
    }

    func formattedDistance(locale: Locale) -> String {
        let length = locale.measurementSystem == .metric
            ? Measurement(value: max(1, (distanceMeters / 1_000).rounded()), unit: UnitLength.kilometers)
            : Measurement(value: max(1, (distanceMeters / 1_609.344).rounded()), unit: UnitLength.miles)
        return length.formatted(.measurement(
            width: .abbreviated,
            usage: .asProvided,
            numberFormatStyle: .number.precision(.fractionLength(0))
        ).locale(locale))
        // A line never breaks between the number and its unit.
        .replacingOccurrences(of: " ", with: "\u{00A0}")
    }

    /// "Bern · 61 km", the label of a closest-city chip.
    var label: String {
        String(format: String(localized: "%1$@ · %2$@"), city.name, formattedDistance)
    }
}

/// The query of a refreshing response whose quick follow-up was already granted.
struct ScooterFollowUpQuery: Equatable, Sendable {
    let bounds: GeoBounds
    let zoom: Int
    let minimumBattery: Int
}

/// When scooter data is refreshed automatically. Web and iOS follow the same rules.
struct ScooterRefreshPolicy: Equatable, Sendable {
    /// The interval when a response names none.
    var defaultRefreshAfter: TimeInterval = 60
    /// Refresh this long before the data expires.
    var expiryLead: TimeInterval = 5
    /// Automatic requests leave at least this long after the previous one finished.
    var minimumAttemptGap: TimeInterval = 10
    /// The shortest gap before the one follow-up a refreshing response asks for.
    var followUpGap: TimeInterval = 2

    static let standard = ScooterRefreshPolicy()

    /// When the data is due for a refresh, before the gap between requests is
    /// applied: at the server's interval or shortly before the data expires,
    /// whichever comes first. Without a successful load it is always due.
    /// `attemptGap` replaces `minimumAttemptGap` for a quick follow-up.
    func refreshDue(
        lastSuccess: Date?,
        refreshAfter: TimeInterval,
        expiresAt: Date?,
        attemptGap: TimeInterval? = nil
    ) -> Date {
        guard let lastSuccess else { return .distantPast }
        let interval = lastSuccess.addingTimeInterval(max(attemptGap ?? minimumAttemptGap, refreshAfter))
        guard let expiresAt else { return interval }
        return min(interval, expiresAt.addingTimeInterval(-expiryLead))
    }

    /// When the next automatic request may start. `lastAttempt` is when the
    /// previous request finished, whatever its outcome.
    func nextAttempt(
        lastSuccess: Date?,
        refreshAfter: TimeInterval,
        expiresAt: Date?,
        lastAttempt: Date?,
        attemptGap: TimeInterval? = nil
    ) -> Date {
        let due = refreshDue(lastSuccess: lastSuccess, refreshAfter: refreshAfter, expiresAt: expiresAt, attemptGap: attemptGap)
        guard let lastAttempt else { return due }
        return max(due, lastAttempt.addingTimeInterval(attemptGap ?? minimumAttemptGap))
    }
}

/// What went wrong with loading scooters, and what is still on the map.
enum ScooterLoadIssue: Equatable, Sendable {
    /// Nothing has loaded yet and the load failed: the banner under the search bar.
    case firstLoadFailed(ScooterLoadFailure)
    /// The last refresh failed and the data from `showing` is still on the map,
    /// unchanged: the warning status line and the Try again pill in the dock.
    case refreshFailed(ScooterLoadFailure, showing: Date)
    /// The data expired and the refresh after that failed, so the map was cleared:
    /// the out-of-date card in the dock.
    case outOfDate(ScooterLoadFailure, lastUpdate: Date)

    var failure: ScooterLoadFailure {
        switch self {
        case let .firstLoadFailed(failure),
             let .refreshFailed(failure, _),
             let .outOfDate(failure, _):
            failure
        }
    }
}

/// Which providers are not sharing data for the area on screen.
struct ScooterProviderHealth: Equatable, Sendable {
    /// Providers that show nothing where they should: a feed of theirs failed, they
    /// operate in the viewport and none of their scooters is in view. In catalogue order.
    let downProviders: [ScooterProvider]
    /// A failed source belongs to no known provider, such as "city-overview".
    let hasUnknownFailures: Bool

    static let healthy = ScooterProviderHealth(downProviders: [], hasUnknownFailures: false)

    init(downProviders: [ScooterProvider], hasUnknownFailures: Bool) {
        self.downProviders = downProviders
        self.hasUnknownFailures = hasUnknownFailures
    }

    /// `inView` holds the providers with a scooter in view in the loaded data, before
    /// the rider's own filters. One failed city feed does not make a provider down
    /// while its scooters from other feeds are on the map.
    init(failedSources: [String], operating: [ScooterProvider], inView: Set<ScooterProvider>) {
        var failed = Set<ScooterProvider>()
        var hasUnknownFailures = false
        for source in failedSources {
            if let provider = Self.provider(forSource: source) {
                failed.insert(provider)
            } else {
                hasUnknownFailures = true
            }
        }
        let operating = Set(operating)
        downProviders = ScooterProvider.allCases.filter {
            failed.contains($0) && operating.contains($0) && !inView.contains($0)
        }
        self.hasUnknownFailures = hasUnknownFailures
    }

    /// The provider behind an entry of `failedSources`. An id can carry its
    /// source in front ("national:lime_zurich", "france:dott_fr_lyon",
    /// "hopp:hopp_ch_basel"), so the source goes before the system id is matched.
    static func provider(forSource source: String) -> ScooterProvider? {
        let systemID = source.firstIndex(of: ":").map { source[source.index(after: $0)...] } ?? source[...]
        return ScooterProvider.provider(forSystemID: String(systemID))
    }
}

/// What the dock shows; `ScooterMapModel.dock` picks the one that applies.
enum ScooterDockContent: Equatable, Sendable {
    /// Only the scooter card: no count, no chips.
    case scooter(Scooter)
    /// Only the parking bay card.
    case parking(ScooterParking)
    /// The out-of-date card with a Refresh button, instead of count and chips.
    case outOfDate(ScooterLoadFailure, lastUpdate: Date)
    /// The answer for this view is on its way: "Finding scooters…" instead of
    /// a count. The chips are empty until something has loaded.
    case finding(chips: [ScooterProviderEntry])
    /// Nothing has loaded and the load failed: "Waiting for scooter data", no count, no chips.
    case waiting
    /// No provider operates here: the three closest covered cities.
    case outsideCoverage([ScooterCityDistance])
    /// There are scooters here, all of them hidden by the filters.
    case filtersHideEverything(ScooterFilterSummary)
    /// Count, status line, notices and chips.
    case summary(ScooterDockSummary)
}

struct ScooterDockSummary: Equatable, Sendable {
    let count: Int
    let countContext: ScooterCountContext
    /// When the data on the map was observed.
    let lastUpdated: Date
    /// Set while the last refresh failed and the earlier data is still shown.
    let refreshFailure: ScooterLoadFailure?
    /// City totals instead of single scooters.
    let isOverview: Bool
    /// The server answered with data it could not renew.
    let isDelayed: Bool
    /// One calm line each, under the status.
    let notices: [ScooterDockNotice]
    let hint: ScooterDockHint?
    /// Providers after the "All" chip, in display order.
    let chips: [ScooterProviderEntry]
    /// The nearest scooter in view, which takes the place of the count while
    /// the rider or the searched place is on the map and no scooter is grouped.
    var lead: ScooterDockLead? = nil

    /// "scooters nearby" or "scooters on this map"; the view renders the number.
    var countLabel: String { countContext.label(for: count) }

    /// The Try again pill at the right of the dock header.
    var showsTryAgain: Bool { refreshFailure != nil }

    /// The status line. It changes as the data ages, so ask again over time.
    func status(at now: Date = .now) -> ScooterDockStatus {
        if let refreshFailure {
            return refreshFailure == .offline
                ? .offline(showing: lastUpdated)
                : .refreshFailed(showing: lastUpdated)
        }
        // Delayed data says so at every zoom, city totals included.
        if isDelayed { return .delayed(showing: lastUpdated) }
        if isOverview { return .cityTotals }

        let age = max(0, now.timeIntervalSince(lastUpdated))
        if age < ScooterDockStatus.liveWindow { return .live }
        if age < 3_600 { return .updatedMinutesAgo(Int(age / 60)) }
        return .updatedAt(lastUpdated)
    }
}

/// Which form of a counted word a number takes.
enum ScooterPlural {
    /// The language the app's strings are in: "en", "de", "fr", "it", "nl", "nb",
    /// "pt", "es" or "is".
    static var language: String {
        ScooterLanguage.current.rawValue
    }

    /// One takes the singular. In French nothing does as well: "0 trottinette";
    /// in Icelandic, any count ending in 1 but not in 11: "21 rafskúta".
    static func isSingular(_ count: Int, language: String = ScooterPlural.language) -> Bool {
        switch language {
        case "fr": (0 ... 1).contains(count)
        case "is": count % 10 == 1 && count % 100 != 11
        default: count == 1
        }
    }
}

/// What the card shown where there is no scooter data says the app covers, as
/// the web app does: "ScootRadar covers 186 cities in 17 countries."
enum ScooterCoverageSummary {
    /// Each noun takes the form Localizable.stringsdict gives its count in the
    /// language shown: "21 stað í 21 landi" but "22 staði í 22 löndum" in Icelandic.
    static func text(
        cities: Int = ScooterCityCatalog.cityCount,
        countries: Int = ScooterCityCatalog.countryCount
    ) -> String {
        String(localizedCounting: "ScootRadar covers \(cities) cities in \(countries) countries.")
    }
}

enum ScooterCountContext: Equatable, Sendable {
    /// Your location or the chosen place is on screen.
    case nearby
    case onThisMap

    func label(for count: Int, language: String = ScooterPlural.language) -> String {
        switch (self, ScooterPlural.isSingular(count, language: language)) {
        case (.nearby, true): String(localized: "scooter nearby")
        case (.nearby, false): String(localized: "scooters nearby")
        case (.onThisMap, true): String(localized: "scooter on this map")
        case (.onThisMap, false): String(localized: "scooters on this map")
        }
    }
}

enum ScooterDockStatus: Equatable, Sendable {
    case refreshFailed(showing: Date)
    case offline(showing: Date)
    case cityTotals
    case delayed(showing: Date)
    case live
    case updatedMinutesAgo(Int)
    case updatedAt(Date)

    /// Data younger than this reads "Live".
    static let liveWindow: TimeInterval = 90

    /// Failed refreshes use the warning style.
    var isWarning: Bool {
        switch self {
        case .refreshFailed, .offline: true
        default: false
        }
    }

    /// The green dot in front of "Live".
    var isLive: Bool { self == .live }

    var text: String {
        switch self {
        case let .refreshFailed(date):
            String(format: String(localized: "Couldn’t refresh · showing %@"), Self.clockTime(date))
        case let .offline(date):
            String(format: String(localized: "You’re offline · showing %@"), Self.clockTime(date))
        case .cityTotals:
            String(localized: "City totals · refreshed hourly")
        case let .delayed(date):
            String(format: String(localized: "Data delayed · showing %@"), Self.clockTime(date))
        case .live:
            String(localized: "Live")
        case let .updatedMinutesAgo(minutes):
            String(format: String(localized: "Updated %lld min ago"), Int64(minutes))
        case let .updatedAt(date):
            String(format: String(localized: "Updated %@"), Self.clockTime(date))
        }
    }

    /// "14:02", the time of day in the user's format. For a place in another
    /// time zone, given, the time by the place's clock, named after it where the
    /// iPhone's clock reads otherwise: Oslo's night ban ends at "05:00 GMT+2"
    /// seen from New York, as on the web (formatClockTime in src/lib/uiText.ts).
    static func clockTime(_ date: Date, in zone: TimeZone? = nil) -> String {
        let locale = ScooterLanguage.current.locale
        guard let zone, zone.secondsFromGMT(for: date) != TimeZone.current.secondsFromGMT(for: date) else {
            return date.formatted(Date.FormatStyle(date: .omitted, time: .shortened, locale: locale))
        }
        return date.formatted(
            Date.FormatStyle(locale: locale, timeZone: zone).hour().minute().timeZone(.specificName(.short))
        )
    }

    /// The body of the out-of-date card: "Last update 14:02. You’re offline. Check your connection."
    static func outOfDateBody(_ failure: ScooterLoadFailure, lastUpdate: Date) -> String {
        "\(String(format: String(localized: "Last update %@."), clockTime(lastUpdate))) \(failure.message)"
    }
}

enum ScooterDockNotice: Hashable, Identifiable, Sendable {
    /// The city in view bans renting at night: a moon rather than a warning.
    case curfew(RentalCurfew.Active)
    /// The city in view has no scooters this part of the year: a calendar.
    case season(ScooterSeasonalPause.Active)
    /// Named providers, in catalogue order; never empty.
    case providersDown([ScooterProvider])
    /// Only sources that belong to no known provider failed.
    case someProvidersDown
    case truncated(shown: Int, total: Int)
    case parkingUnavailable
    case parkingOutOfDate

    var id: Self { self }

    var systemImage: String {
        switch self {
        case .curfew: "moon.fill"
        case .season: "calendar"
        default: "exclamationmark.triangle"
        }
    }

    /// A ban or a season is the city's rule, not trouble with the data.
    var isCalm: Bool {
        switch self {
        case .curfew, .season: true
        default: false
        }
    }

    var text: String {
        switch self {
        case let .curfew(curfew):
            String(
                format: String(localized: "Night ban in %1$@: no scooter rentals until %2$@"),
                curfew.city,
                ScooterDockStatus.clockTime(curfew.until, in: curfew.timeZone)
            )
        case let .season(season):
            String(
                format: String(localized: "Off season in %1$@: scooters are back in %2$@"),
                season.city,
                ScooterSeasonalPause.monthName(season.month)
            )
        case let .providersDown(providers) where providers.count == 1:
            String(format: String(localized: "%@ isn’t sharing data right now."), providers[0].name)
        case let .providersDown(providers) where providers.count == 2:
            String(
                format: String(localized: "%1$@ and %2$@ aren’t sharing data right now."),
                providers[0].name,
                providers[1].name
            )
        case let .providersDown(providers):
            String(
                format: String(localized: "%lld providers aren’t sharing data right now."),
                Int64(providers.count)
            )
        case .someProvidersDown:
            String(localized: "Some providers aren’t sharing data right now.")
        case let .truncated(shown, total):
            String(
                format: String(localized: "Showing %1$@ of %2$@ — zoom in to see all"),
                shown.formatted(.number.locale(ScooterLanguage.current.locale)),
                total.formatted(.number.locale(ScooterLanguage.current.locale))
            )
        case .parkingUnavailable:
            String(localized: "Parking bays unavailable right now")
        case .parkingOutOfDate:
            String(localized: "Parking bays may be out of date")
        }
    }

    /// A night ban first, as some operators keep listing their scooters through
    /// it, then the season, providers down, truncation and parking.
    static func notices(
        curfew: RentalCurfew.Active? = nil,
        season: ScooterSeasonalPause.Active? = nil,
        health: ScooterProviderHealth,
        metadata: ScooterResponseMetadata,
        shownCount: Int
    ) -> [ScooterDockNotice] {
        var notices: [ScooterDockNotice] = []
        if let curfew {
            notices.append(.curfew(curfew))
        }
        if let season {
            notices.append(.season(season))
        }
        if !health.downProviders.isEmpty {
            notices.append(.providersDown(health.downProviders))
        } else if health.hasUnknownFailures {
            notices.append(.someProvidersDown)
        }
        if metadata.truncated {
            notices.append(.truncated(shown: shownCount, total: metadata.totalVehicles ?? shownCount))
        }
        if metadata.parkingStatus == "failed" || metadata.parkingStatus == "partial" {
            notices.append(.parkingUnavailable)
        } else if metadata.parkingStatus == "stale" {
            notices.append(.parkingOutOfDate)
        }
        return notices
    }
}

enum ScooterDockHint: Equatable, Sendable {
    /// City totals are on screen: "Tap a city to see its scooters."
    case tapCity
    /// A covered area with no scooters: "No scooters here right now. Zoom out or move the map."
    case emptyArea

    var text: String {
        switch self {
        case .tapCity: String(localized: "Tap a city to see its scooters.")
        case .emptyArea: String(localized: "No scooters here right now. Zoom out or move the map.")
        }
    }
}

/// The dismissible card under the search bar when locating did not work.
enum ScooterLocationIssue: Equatable, Sendable {
    /// Refused: "Location is off", with Open Settings and Search a place.
    case denied
    /// Restricted on this device: Search a place only.
    case restricted
    /// No position in time: Try again.
    case notFound

    var title: String? {
        self == .denied ? String(localized: "Location is off") : nil
    }

    var message: String {
        switch self {
        case .denied: String(localized: "Turn it on in Settings, or search a place instead.")
        case .restricted: String(localized: "Location is restricted on this device. Search a place instead.")
        case .notFound: String(localized: "Couldn’t find your location.")
        }
    }

    var canOpenSettings: Bool { self == .denied }
    var canSearchPlace: Bool { self != .notFound }
    var canRetry: Bool { self == .notFound }
}

/// What the collapsed search bar shows.
enum ScooterSearchBarState: Equatable, Sendable {
    /// No place chosen: search icon and "Search city or address". Also once
    /// you are located: the dot on the map says where you are.
    case empty
    /// A searched place: its title / "Scooters near this place", with a clear
    /// button. A place no operator serves gets the neutral second line instead.
    case place(MapDestination)
    /// A spinner and "Finding your location…".
    case locating

    var title: String {
        switch self {
        case .empty: String(localized: "Search city or address")
        case let .place(destination): destination.title
        case .locating: String(localized: "Finding your location…")
        }
    }

    /// The second line; nil when there is only one.
    var subtitle: String? {
        switch self {
        case let .place(destination):
            // "Scooters near this place" would be untrue where there is no scooter data.
            destination.isCovered
                ? String(localized: "Scooters near this place")
                : String(localized: "Tap to search a city or address")
        case .empty, .locating:
            nil
        }
    }

    var accessibilityLabel: String {
        switch self {
        case let .place(destination) where destination.isCovered:
            String(format: String(localized: "Showing scooters near %@. Search another place."), destination.title.isolated)
        case let .place(destination):
            // No scooters to announce: the place, then the same neutral line as on screen.
            "\(destination.title.isolated). \(String(localized: "Tap to search a city or address"))"
        case .empty, .locating:
            title
        }
    }
}
