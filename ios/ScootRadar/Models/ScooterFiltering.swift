import Foundation

struct VisibleScooterSummary: Equatable {
    let count: Int
    let providerCounts: [ScooterProvider: Int]
    /// Scooters in the viewport before the battery and provider filters.
    let unfilteredCount: Int
    /// Providers with a scooter in the viewport before those filters.
    let unfilteredProviders: Set<ScooterProvider>
}

enum ScooterFiltering {
    /// A scooter whose feed gives a range and no battery is judged by the battery the server estimates
    /// from it, as the server judges it in the groups it counts.
    static func passesBattery(_ scooter: Scooter, minimumBattery: Double) -> Bool {
        minimumBattery == 0 || (scooter.filterBattery.map(Double.init) ?? -1) >= minimumBattery
    }

    static func mapScooters(
        from vehicles: [Scooter],
        minimumBattery: Double,
        enabledProviders: Set<ScooterProvider>
    ) -> [Scooter] {
        let allProvidersEnabled = enabledProviders == Set(ScooterProvider.allCases)
        return vehicles.filter { scooter in
            passesBattery(scooter, minimumBattery: minimumBattery) &&
                (allProvidersEnabled || scooter.providerInfo.map(enabledProviders.contains) == true)
        }
    }

    static func visibleSummary(
        for vehicles: [Scooter],
        viewport: GeoBounds,
        minimumBattery: Double,
        enabledProviders: Set<ScooterProvider>
    ) -> VisibleScooterSummary {
        var visibleCount = 0
        var unfilteredCount = 0
        var unfilteredProviders = Set<ScooterProvider>()
        var providerCounts: [ScooterProvider: Int] = [:]
        providerCounts.reserveCapacity(ScooterProvider.allCases.count)

        let allProvidersEnabled = enabledProviders == Set(ScooterProvider.allCases)
        for scooter in vehicles {
            guard viewport.contains(latitude: scooter.latitude, longitude: scooter.longitude) else { continue }
            unfilteredCount += 1
            if let provider = scooter.providerInfo { unfilteredProviders.insert(provider) }
            guard passesBattery(scooter, minimumBattery: minimumBattery) else { continue }

            if let provider = scooter.providerInfo {
                providerCounts[provider, default: 0] += 1
            }
            if allProvidersEnabled || scooter.providerInfo.map(enabledProviders.contains) == true {
                visibleCount += 1
            }
        }

        return VisibleScooterSummary(
            count: visibleCount,
            providerCounts: providerCounts,
            unfilteredCount: unfilteredCount,
            unfilteredProviders: unfilteredProviders
        )
    }

    /// The filter sheet's primary button: "Show 1 scooter", "Show 2'000 scooters".
    /// Nothing to show has its own sentence, because French counts it in the
    /// singular: "Afficher 0 trottinette".
    static func showResultsTitle(count: Int) -> String {
        if count == 1 { return String(localized: "Show 1 scooter") }
        if count == 0 { return String(localized: "Show 0 scooters") }
        return String(format: String(localized: "Show %lld scooters"), locale: .current, Int64(count))
    }
}

enum ScooterBatteryFilter {
    /// The only minimums offered: Any, 30%+, 60%+ and 80%+.
    static let presets = [0, 30, 60, 80]

    /// Stored values that are not a preset snap down (45 → 30, 95 → 80).
    static func snapped(_ value: Int) -> Int {
        presets.last { $0 <= value } ?? 0
    }

    static func label(for preset: Int) -> String {
        preset == 0 ? String(localized: "Any") : "\(preset)%+"
    }
}

/// How far a battery level usually takes the scooters chosen in view, in metres, from each app's usual range on
/// a full battery (the answer's fullRanges) and its scooters in view: the line under the battery presets. The
/// website works it out the same way (src/lib/battery.ts, batteryReach and formatBatteryReach).
struct ScooterBatteryReach: Equatable, Sendable {
    /// The shortest and the longest of their apps'.
    let low: Double
    let high: Double
    /// Their apps' weighed by their scooters in view.
    let mean: Double

    /// How far `level`% usually takes the scooters in view of the apps switched on. An app with under a tenth
    /// of them is left out unless it has the most, so that a handful of another app's at the edge of the view
    /// does not stretch the line. Nil when no app switched on in view has a full range.
    init?(
        level: Int,
        fullRanges: [ScooterProvider: Int],
        counts: [ScooterProvider: Int],
        enabled: (ScooterProvider) -> Bool
    ) {
        var apps: [(metres: Double, count: Int)] = []
        for (provider, metres) in fullRanges {
            let count = counts[provider, default: 0]
            if metres > 0, count > 0, enabled(provider) { apps.append((Double(metres), count)) }
        }
        guard let most = apps.map(\.count).max() else { return nil }
        let total = apps.reduce(0) { $0 + $1.count }
        let kept = apps.filter { $0.count * 10 >= total || $0.count == most }
        let scale = Double(level) / 100
        let weight = kept.reduce(0) { $0 + $1.count }
        low = (kept.map(\.metres).min() ?? 0) * scale
        high = (kept.map(\.metres).max() ?? 0) * scale
        mean = kept.reduce(0) { $0 + $1.metres * Double($1.count) } / Double(weight) * scale
    }

    /// "22 km", one length where the longest is at most a quarter longer than the shortest, or else
    /// "12–80 km": in whole kilometres, or whole miles where lengths are in miles, never 0.
    func formatted(locale: Locale = ScooterLanguage.current.locale) -> String {
        let metric = locale.measurementSystem == .metric
        let unit: UnitLength = metric ? .kilometers : .miles
        let step = metric ? 1_000 : 1_609.344
        // Halves go up, as Math.round does on the web.
        func whole(_ metres: Double) -> Int { max(1, Int((metres / step).rounded())) }
        let low = whole(self.low)
        let high = whole(self.high)
        if high * 4 <= low * 5 { return Scooter.formattedWhole(whole(mean), of: unit, locale: locale) }
        return low.formatted(.number.locale(locale)) + "–" + Scooter.formattedWhole(high, of: unit, locale: locale)
    }

    /// Under the battery presets: "60% usually allows about 22 km.", or for Any how far a full battery takes
    /// them, "100% usually allows about 12–80 km.". Nil when no app switched on in view has a full range.
    static func line(
        minimumBattery: Int,
        fullRanges: [ScooterProvider: Int],
        counts: [ScooterProvider: Int],
        enabled: (ScooterProvider) -> Bool,
        locale: Locale = ScooterLanguage.current.locale
    ) -> String? {
        let preset = ScooterBatteryFilter.snapped(minimumBattery)
        let level = preset > 0 ? preset : 100
        guard let reach = ScooterBatteryReach(level: level, fullRanges: fullRanges, counts: counts, enabled: enabled)
        else { return nil }
        return String(
            format: String(localized: "%1$lld%% usually allows about %2$@."),
            locale: locale,
            Int64(level),
            reach.formatted(locale: locale)
        )
    }

    /// What the Filters say under the battery presets, and VoiceOver reads after them: the line, followed
    /// while a minimum is set by the sentence that scooters without battery info are hidden. Nil for neither.
    static func help(line: String?, minimumBattery: Int) -> String? {
        let hidden = minimumBattery > 0
            ? String(localized: "Scooters without battery info are hidden while a minimum is set.")
            : nil
        let sentences = [line, hidden].compactMap { $0 }
        return sentences.isEmpty ? nil : sentences.joined(separator: " ")
    }
}

/// One provider in the dock chips or in the filter sheet's provider list.
struct ScooterProviderEntry: Identifiable, Equatable, Sendable {
    let provider: ScooterProvider
    /// Scooters in view that pass the battery filter, whether or not the provider is shown.
    let count: Int
    /// Included by the provider filter: the check in the filter sheet.
    let isEnabled: Bool
    /// Highlighted in the dock, which only happens while a provider filter is active.
    let isSelected: Bool
    /// A feed of the provider failed and the map holds none of its scooters in view:
    /// dashed and never selected, with a warning icon in the dock and
    /// "Not sharing data right now" in the filter sheet.
    let isDown: Bool
    /// Its scooters drawn faded in view where they were last seen, counted apart; nil without any.
    var faded: Faded? = nil

    var id: String { provider.id }

    /// How many of a provider's scooters stand faded in view, before the provider filter and after
    /// the battery's, when they were seen, and whether new positions of its are on their way.
    struct Faded: Equatable, Sendable {
        let count: Int
        let seenAt: Date
        let updating: Bool

        /// None of the provider's own counted, the number the chip shows instead, greyed.
        static func shown(count: Int, faded: Faded?) -> Faded? {
            count == 0 ? faded : nil
        }

        /// Under the provider's name in the panel's list: "updating…", or "last seen 14:02".
        var note: String {
            updating
                ? String(localized: "updating…")
                : String(format: String(localized: "last seen %@"), ScooterDockStatus.seenTime(seenAt))
        }

        /// What VoiceOver adds to the chip: "44 faded, last seen at 14:02, updating."
        var accessibilityText: String {
            String(
                format: updating
                    ? String(localized: "%1$lld faded, last seen at %2$@, updating.")
                    : String(localized: "%1$lld faded, last seen at %2$@."),
                locale: ScooterLanguage.current.locale,
                Int64(count),
                ScooterDockStatus.seenTime(seenAt)
            )
        }
    }

    /// "Bird: not sharing data right now", the accessibility label of a down chip.
    var downLabel: String {
        String(format: String(localized: "%@: not sharing data right now"), provider.name)
    }
}

/// Why the filters leave nothing on the map, for the "hidden by your filters" card.
struct ScooterFilterSummary: Equatable, Sendable {
    /// Scooters here before filtering; nil when the response cannot tell,
    /// because the server already filtered by battery or cut the list short.
    let hiddenCount: Int?
    /// The providers the map is limited to; empty when every provider is shown.
    let providers: [ScooterProvider]
    /// The minimum battery in percent; nil for Any.
    let minimumBattery: Int?

    var title: String {
        guard let hiddenCount, hiddenCount > 0 else {
            return String(localized: "No scooters match your filters here")
        }
        if hiddenCount == 1 { return String(localized: "1 scooter hidden by your filters") }
        return String(
            format: String(localized: "%lld scooters hidden by your filters"),
            locale: ScooterLanguage.current.locale,
            Int64(hiddenCount)
        )
    }

    /// "Lime only" and "battery 60% or more", whichever apply.
    var parts: [String] {
        var parts: [String] = []
        if !providers.isEmpty {
            parts.append(String(
                format: String(localized: "%@ only"),
                providers.map(\.name).formatted(.list(type: .and).locale(ScooterLanguage.current.locale))
            ))
        }
        if let minimumBattery {
            parts.append(String(
                format: String(localized: "battery %lld%% or more"),
                Int64(minimumBattery)
            ))
        }
        return parts
    }

    /// "Lime only · battery 60% or more"
    var body: String {
        let line = parts.joined(separator: " · ")
        // The battery part starts in lower case because it usually follows the providers.
        return line.prefix(1).localizedUppercase + line.dropFirst()
    }

    /// "Show all 26", or "Show all" when the count is unknown. The button resets the filters.
    var showAllTitle: String {
        guard let hiddenCount, hiddenCount > 0 else { return String(localized: "Show all") }
        return String(format: String(localized: "Show all %lld"), locale: .current, Int64(hiddenCount))
    }
}
