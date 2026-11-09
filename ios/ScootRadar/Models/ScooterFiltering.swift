import Foundation

struct VisibleScooterSummary: Equatable {
    let count: Int
    let providerCounts: [ScooterProvider: Int]
    /// Scooters in the viewport before the battery, range and provider filters.
    let unfilteredCount: Int
    /// Providers with a scooter in the viewport before those filters.
    let unfilteredProviders: Set<ScooterProvider>
}

enum ScooterFiltering {
    static func passesBattery(_ scooter: Scooter, minimumBattery: Double) -> Bool {
        minimumBattery == 0 || (scooter.battery.map(Double.init) ?? -1) >= minimumBattery
    }

    /// A minimum range in metres hides the scooters whose feed gives no range, as a minimum battery
    /// hides those without a battery.
    static func passesRange(_ scooter: Scooter, minimumRange: Int) -> Bool {
        minimumRange == 0 || (scooter.rangeMeters ?? -1) >= minimumRange
    }

    static func mapScooters(
        from vehicles: [Scooter],
        minimumBattery: Double,
        minimumRange: Int = 0,
        enabledProviders: Set<ScooterProvider>
    ) -> [Scooter] {
        let allProvidersEnabled = enabledProviders == Set(ScooterProvider.allCases)
        return vehicles.filter { scooter in
            passesBattery(scooter, minimumBattery: minimumBattery) &&
                passesRange(scooter, minimumRange: minimumRange) &&
                (allProvidersEnabled || scooter.providerInfo.map(enabledProviders.contains) == true)
        }
    }

    static func visibleSummary(
        for vehicles: [Scooter],
        viewport: GeoBounds,
        minimumBattery: Double,
        minimumRange: Int = 0,
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
            guard passesBattery(scooter, minimumBattery: minimumBattery),
                  passesRange(scooter, minimumRange: minimumRange) else { continue }

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

/// A minimum range, on a slider under the battery presets: whole kilometres up to 30, or whole miles up to
/// 20 where lengths are in miles, the region's or chosen in Settings. Operators that give no battery, as
/// Lime and Voi in Stuttgart, give a range, and others the other way round, so the two minimums never hold
/// together: choosing one sets the other to Any. The minimum is kept in metres and read in whole steps of
/// the unit shown, so that "3 mi+" is 4 828 m, not the 5 000 m of "5 km+" it was set as before.
enum ScooterRangeFilter {
    enum Unit: Sendable {
        case kilometres
        case miles

        /// The unit of the slider where lengths are written by the locale.
        init(locale: Locale) {
            self = locale.measurementSystem == .metric ? .kilometres : .miles
        }

        var length: UnitLength { self == .miles ? .miles : .kilometers }

        /// A step of the slider, in metres.
        var step: Double { self == .miles ? 1_609.344 : 1_000 }

        /// The slider's last step: 30 km, or 20 mi.
        var maximumSteps: Int { self == .miles ? 20 : 30 }
    }

    /// The minimum of a step in metres, rounded to the metre: 3 mi is 4 828 m.
    static func metres(steps: Int, unit: Unit) -> Int {
        Int((Double(min(unit.maximumSteps, max(0, steps))) * unit.step).rounded())
    }

    /// The whole step nearest to a minimum in metres, within the slider.
    static func steps(metres: Int, unit: Unit) -> Int {
        min(unit.maximumSteps, max(0, Int((Double(metres) / unit.step).rounded())))
    }

    /// A minimum as the slider reads it: the nearest whole step of the unit, no further than its last.
    static func snapped(_ metres: Int, unit: Unit) -> Int {
        self.metres(steps: steps(metres: metres, unit: unit), unit: unit)
    }

    /// "5 km" or "3 mi": the minimum in whole steps of its unit, never in metres, feet or yards.
    static func distance(metres: Int, locale: Locale = ScooterLanguage.current.locale) -> String {
        let unit = Unit(locale: locale)
        return Scooter.formattedWhole(steps(metres: metres, unit: unit), of: unit.length, locale: locale)
    }

    /// Beside the heading: "Any", or "5 km+" as the battery presets write "30%+".
    static func label(metres: Int, locale: Locale = ScooterLanguage.current.locale) -> String {
        metres == 0 ? String(localized: "Any") : distance(metres: metres, locale: locale) + "+"
    }

    /// What VoiceOver reads as the slider's value: "Any", or "5 km or more".
    static func spokenValue(metres: Int, locale: Locale = ScooterLanguage.current.locale) -> String {
        metres == 0
            ? String(localized: "Any")
            : String(format: String(localized: "%@ or more"), distance(metres: metres, locale: locale))
    }
}

/// One provider in the dock chips or in the filter sheet's provider list.
struct ScooterProviderEntry: Identifiable, Equatable, Sendable {
    let provider: ScooterProvider
    /// Scooters in view that pass the battery and range filters, whether or not the provider is shown.
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
    /// because the server already filtered by battery or range or cut the list short.
    let hiddenCount: Int?
    /// The providers the map is limited to; empty when every provider is shown.
    let providers: [ScooterProvider]
    /// The minimum battery in percent; nil for Any.
    let minimumBattery: Int?
    /// The minimum range in metres, a whole step of the unit shown; nil for Any.
    var minimumRange: Int? = nil

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

    /// "Lime only" and "battery 60% or more" or "range 5 km or more", whichever apply.
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
        if let minimumRange {
            parts.append(String(
                format: String(localized: "range %@ or more"),
                ScooterRangeFilter.distance(metres: minimumRange)
            ))
        }
        return parts
    }

    /// "Lime only · battery 60% or more"
    var body: String {
        let line = parts.joined(separator: " · ")
        // The battery and range parts start in lower case because they usually follow the providers.
        return line.prefix(1).localizedUppercase + line.dropFirst()
    }

    /// "Show all 26", or "Show all" when the count is unknown. The button resets the filters.
    var showAllTitle: String {
        guard let hiddenCount, hiddenCount > 0 else { return String(localized: "Show all") }
        return String(format: String(localized: "Show all %lld"), locale: .current, Int64(hiddenCount))
    }
}
