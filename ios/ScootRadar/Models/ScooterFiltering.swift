import Foundation

struct VisibleScooterSummary: Equatable {
    let count: Int
    let providerCounts: [ScooterProvider: Int]
    /// Scooters in the viewport before the range and provider filters.
    let unfilteredCount: Int
    /// Providers with a scooter in the viewport before those filters.
    let unfilteredProviders: Set<ScooterProvider>
}

enum ScooterFiltering {
    /// The range filter's rule, the server's, the website's and the Android app's too (issue #12): with a
    /// minimum in metres, a scooter whose feed gives a range needs that far; one that reports only its battery
    /// is judged pessimistically, by its battery times how far a full battery takes its app's scooters at the
    /// least (ScooterRangeFilter.fullRange), in whole numbers, so 6 km needs 53% of a Lime; one with neither
    /// is hidden.
    static func passesRange(_ scooter: Scooter, minimumRange: Int, batteryRanges: [String: Int] = [:]) -> Bool {
        guard minimumRange > 0 else { return true }
        if let range = scooter.rangeMeters { return range >= minimumRange }
        guard let battery = scooter.battery else { return false }
        let (reach, overflow) = battery.multipliedReportingOverflow(
            by: ScooterRangeFilter.fullRange(of: scooter.provider, in: batteryRanges)
        )
        return overflow ? battery > 0 : reach >= minimumRange * 100
    }

    static func mapScooters(
        from vehicles: [Scooter],
        minimumRange: Int = 0,
        batteryRanges: [String: Int] = [:],
        enabledProviders: Set<ScooterProvider>
    ) -> [Scooter] {
        let allProvidersEnabled = enabledProviders == Set(ScooterProvider.allCases)
        return vehicles.filter { scooter in
            passesRange(scooter, minimumRange: minimumRange, batteryRanges: batteryRanges) &&
                (allProvidersEnabled || scooter.providerInfo.map(enabledProviders.contains) == true)
        }
    }

    static func visibleSummary(
        for vehicles: [Scooter],
        viewport: GeoBounds,
        minimumRange: Int = 0,
        batteryRanges: [String: Int] = [:],
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
            guard passesRange(scooter, minimumRange: minimumRange, batteryRanges: batteryRanges) else { continue }

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

/// The filters' only minimum, a range on a slider: whole kilometres up to 30, or whole miles up to 20 where
/// lengths are in miles, the region's or chosen in Settings › Units. Some apps give a range and no battery, as
/// Lime and Voi in Stuttgart, others a battery and no range, as Bolt, Lime and Voi in Berlin: those are judged
/// by their battery (ScooterFiltering.passesRange). The minimum is kept in metres and read in whole steps of
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

    /// Beside the heading: "Any", or "5 km+".
    static func label(metres: Int, locale: Locale = ScooterLanguage.current.locale) -> String {
        metres == 0 ? String(localized: "Any") : distance(metres: metres, locale: locale) + "+"
    }

    /// What VoiceOver reads as the slider's value: "Any", or "5 km or more".
    static func spokenValue(metres: Int, locale: Locale = ScooterLanguage.current.locale) -> String {
        metres == 0
            ? String(localized: "Any")
            : String(format: String(localized: "%@ or more"), distance(metres: metres, locale: locale))
    }

    /// How far a full battery takes an app's scooters at the least, in metres, for those that report a battery
    /// and no range: the latest answer's figure (batteryRanges), or else 10 km, as the server's own
    /// (data/battery-full-ranges.json, defaultMeters).
    static let defaultFullRange = 10_000

    static func fullRange(of provider: String, in batteryRanges: [String: Int]) -> Int {
        batteryRanges[provider] ?? defaultFullRange
    }

    /// The battery in percent a scooter that reports only its battery needs for a minimum, rounded up: 53 for a
    /// Lime, whose full battery takes it 11.5 km, at 6 km. Over 100 where even a full battery may not reach it.
    static func batteryNeeded(minimumRange: Int, fullRange: Int) -> Int {
        guard fullRange > 0 else { return .max }
        return (minimumRange * 100 + fullRange - 1) / fullRange
    }

    /// Under the slider while a minimum is set, one paragraph that VoiceOver reads after it: the battery the
    /// scooters that report only their battery need, app by app in ascending order, "Scooters that only report
    /// a battery need at least 9% (Voi), 21% (Bolt) and 53% (Lime).", then the apps whose such scooters are all
    /// hidden as even a full battery may not take them so far, and last that scooters with neither are hidden.
    /// The apps are those switched on that the latest answer gives a figure for (batteryRanges: those with such
    /// scooters in view), in the filters' order. Nil for Any.
    static func help(
        metres: Int,
        batteryRanges: [String: Int],
        enabledProviders: Set<ScooterProvider>,
        locale: Locale = ScooterLanguage.current.locale
    ) -> String? {
        guard metres > 0 else { return nil }
        func list(_ items: [String]) -> String {
            items.formatted(.list(type: .and).locale(locale))
        }
        let apps = ScooterProvider.allCases.compactMap { provider -> (provider: ScooterProvider, percent: Int)? in
            guard enabledProviders.contains(provider), let full = batteryRanges[provider.rawValue] else { return nil }
            return (provider, batteryNeeded(minimumRange: metres, fullRange: full))
        }
        var sentences: [String] = []

        // Grouping keeps the filters' order within each percent.
        let needed = Dictionary(grouping: apps.filter { $0.percent <= 100 }, by: \.percent)
        if !needed.isEmpty {
            let items = needed.keys.sorted().map { percent in
                String(
                    format: String(localized: "%1$lld%% (%2$@)"),
                    locale: locale,
                    Int64(percent),
                    list(needed[percent, default: []].map(\.provider.name))
                )
            }
            sentences.append(String(
                format: String(localized: "Scooters that only report a battery need at least %@."),
                list(items)
            ))
        }

        let hidden = apps.filter { $0.percent > 100 }.map(\.provider.name)
        if !hidden.isEmpty {
            let sentence = String(localized: "Scooters from %1$@ that only report a battery are hidden, as a full battery may not reach %2$@.")
            sentences.append(String(
                format: sentence,
                list(hidden),
                distance(metres: metres, locale: locale)
            ))
        }

        sentences.append(String(localized: "Scooters without range or battery info are hidden while a minimum is set."))
        return sentences.joined(separator: " ")
    }
}

/// One provider in the dock chips or in the filter sheet's provider list.
struct ScooterProviderEntry: Identifiable, Equatable, Sendable {
    let provider: ScooterProvider
    /// Scooters in view that pass the range filter, whether or not the provider is shown.
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
    /// the range's, when they were seen, and whether new positions of its are on their way.
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

        /// What VoiceOver adds to the chip: "44 faded, last seen at 14:02, updating.", its words in the form the count
        /// takes in the language ("1 sbiadito, visto…", "2 sbiaditi, visti…").
        var accessibilityText: String {
            let time = ScooterDockStatus.seenTime(seenAt)
            return updating
                ? String(localizedCounting: "\(count) faded, last seen at \(time), updating.")
                : String(localizedCounting: "\(count) faded, last seen at \(time).")
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
    /// because the server already filtered by range or cut the list short.
    let hiddenCount: Int?
    /// The providers the map is limited to; empty when every provider is shown.
    let providers: [ScooterProvider]
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

    /// "Lime only" and "range 5 km or more", whichever apply.
    var parts: [String] {
        var parts: [String] = []
        if !providers.isEmpty {
            parts.append(String(
                format: String(localized: "%@ only"),
                providers.map(\.name).formatted(.list(type: .and).locale(ScooterLanguage.current.locale))
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

    /// "Lime only · range 5 km or more"
    var body: String {
        let line = parts.joined(separator: " · ")
        // The range part starts in lower case because it usually follows the providers.
        return line.prefix(1).localizedUppercase + line.dropFirst()
    }

    /// "Show all 26", or "Show all" when the count is unknown. The button resets the filters.
    var showAllTitle: String {
        guard let hiddenCount, hiddenCount > 0 else { return String(localized: "Show all") }
        return String(format: String(localized: "Show all %lld"), locale: .current, Int64(hiddenCount))
    }
}
