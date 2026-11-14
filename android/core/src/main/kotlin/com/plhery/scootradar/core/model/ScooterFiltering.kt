package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import java.text.BreakIterator
import java.time.Instant
import java.util.Locale
import kotlin.math.roundToInt

// ios/ScootRadar/Models/ScooterFiltering.swift.

data class VisibleScooterSummary(
    val count: Int,
    val providerCounts: Map<ScooterProvider, Int>,
    /** Scooters in the viewport before the range and provider filters. */
    val unfilteredCount: Int,
    /** Providers with a scooter in the viewport before those filters. */
    val unfilteredProviders: Set<ScooterProvider>,
)

object ScooterFiltering {
    /**
     * A minimum range in metres (0 for Any) keeps a scooter whose feed gives a range at least as long; one whose feed
     * gives only its battery when that battery times how far a full battery takes its app's scooters at the least
     * ([batteryRanges], by provider id, else 10 km) reaches it, in whole numbers as the server judges it: battery ×
     * full ≥ minimum × 100, so 6 km needs 53% of a Lime whose full battery is 11.5 km; and hides one that gives neither.
     */
    fun passesRange(scooter: Scooter, minimumRange: Int, batteryRanges: Map<String, Int> = emptyMap()): Boolean {
        if (minimumRange <= 0) return true
        scooter.rangeMeters?.let { return it >= minimumRange }
        val battery = scooter.battery ?: return false
        return battery.toLong() * ScooterRangeFilter.fullBattery(scooter.provider, batteryRanges) >= minimumRange.toLong() * 100
    }

    fun mapScooters(
        from: List<Scooter>,
        minimumRange: Int = 0,
        batteryRanges: Map<String, Int> = emptyMap(),
        enabledProviders: Set<ScooterProvider>,
    ): List<Scooter> {
        val allProvidersEnabled = enabledProviders == ScooterProvider.entries.toSet()
        return from.filter { scooter ->
            passesRange(scooter, minimumRange, batteryRanges) &&
                (allProvidersEnabled || scooter.providerInfo?.let { it in enabledProviders } == true)
        }
    }

    fun visibleSummary(
        vehicles: List<Scooter>,
        viewport: GeoBounds,
        minimumRange: Int = 0,
        batteryRanges: Map<String, Int> = emptyMap(),
        enabledProviders: Set<ScooterProvider>,
    ): VisibleScooterSummary {
        var visibleCount = 0
        var unfilteredCount = 0
        val unfilteredProviders = LinkedHashSet<ScooterProvider>()
        val providerCounts = LinkedHashMap<ScooterProvider, Int>()

        val allProvidersEnabled = enabledProviders == ScooterProvider.entries.toSet()
        for (scooter in vehicles) {
            if (!viewport.contains(scooter.latitude, scooter.longitude)) continue
            unfilteredCount += 1
            scooter.providerInfo?.let { unfilteredProviders += it }
            if (!passesRange(scooter, minimumRange, batteryRanges)) continue

            scooter.providerInfo?.let { providerCounts[it] = (providerCounts[it] ?: 0) + 1 }
            if (allProvidersEnabled || scooter.providerInfo?.let { it in enabledProviders } == true) {
                visibleCount += 1
            }
        }

        return VisibleScooterSummary(
            count = visibleCount,
            providerCounts = providerCounts,
            unfilteredCount = unfilteredCount,
            unfilteredProviders = unfilteredProviders,
        )
    }

    /**
     * The filter sheet's primary button: "Show 1 scooter", "Show 2'000 scooters". Nothing to show has its own
     * sentence, because French counts it in the singular: "Afficher 0 trottinette".
     */
    fun showResultsTitle(count: Int): String {
        if (count == 1) return localized("Show 1 scooter")
        if (count == 0) return localized("Show 0 scooters")
        return stringFormat(localized("Show %lld scooters"), count.toLong(), locale = ScooterLanguage.launchLocale())
    }
}

/**
 * The filters' only minimum, a range on a slider: whole kilometres up to 30, or whole miles up to 20 where lengths are
 * in miles, the region's or chosen in Settings. The minimum is kept in metres and read in whole steps of the unit
 * shown, so that "3 mi+" is 4 828 m, not the 5 000 m of "5 km+" it was set as before. A scooter whose feed gives only
 * its battery is judged by how far its battery takes it at the least (ScooterFiltering.passesRange).
 */
object ScooterRangeFilter {
    enum class Unit(
        val length: ScooterLengthUnit,
        /** A step of the slider, in metres. */
        val step: Double,
        /** The slider's last step: 30 km, or 20 mi. */
        val maximumSteps: Int,
    ) {
        Kilometres(ScooterLengthUnit.Kilometers, 1_000.0, 30),
        Miles(ScooterLengthUnit.Miles, 1_609.344, 20),
        ;

        companion object {
            /** The unit of the slider where lengths are written by the locale. */
            fun of(locale: Locale): Unit =
                if (locale.measurementSystem == ScooterMeasurementSystem.Metric) Kilometres else Miles
        }
    }

    /** The minimum of a step in metres, rounded to the metre: 3 mi is 4 828 m. */
    fun metres(steps: Int, unit: Unit): Int = (steps.coerceIn(0, unit.maximumSteps) * unit.step).roundToInt()

    /** The whole step nearest to a minimum in metres, within the slider. */
    fun steps(metres: Int, unit: Unit): Int = (metres / unit.step).roundToInt().coerceIn(0, unit.maximumSteps)

    /** A minimum as the slider reads it: the nearest whole step of the unit, no further than its last. */
    fun snapped(metres: Int, unit: Unit): Int = metres(steps(metres, unit), unit)

    /** "5 km" or "3 mi": the minimum in whole steps of its unit, never in metres, feet or yards. */
    fun distance(metres: Int, locale: Locale = ScooterLanguage.current.locale): String {
        val unit = Unit.of(locale)
        return Scooter.formattedWhole(steps(metres, unit), unit.length, locale)
    }

    /** Beside the heading: "Any", or "5 km+". */
    fun label(metres: Int, locale: Locale = ScooterLanguage.current.locale): String =
        if (steps(metres, Unit.of(locale)) == 0) localized("Any") else distance(metres, locale) + "+"

    /** What TalkBack reads as the slider's value: "Any", or "5 km or more". */
    fun spokenValue(metres: Int, locale: Locale = ScooterLanguage.current.locale): String {
        if (steps(metres, Unit.of(locale)) == 0) return localized("Any")
        return stringFormat(localized("%@ or more"), distance(metres, locale))
    }

    /** How far a full battery takes an app's scooters at the least where an answer names no figure for it, in metres. */
    const val DEFAULT_FULL_BATTERY: Int = 10_000

    /**
     * How far a full battery takes the scooters of [provider] (an id, "lime") that report only a battery, at the least,
     * in metres: the latest answer's figure ([batteryRanges]), or else 10 km.
     */
    fun fullBattery(provider: String, batteryRanges: Map<String, Int>): Int =
        batteryRanges[provider]?.takeIf { it > 0 } ?: DEFAULT_FULL_BATTERY

    /**
     * The battery in percent a scooter that reports only its battery needs to reach [minimumRange] metres, where a full
     * battery takes it [fullBattery] metres: rounded up, 53 for 6 km on a Lime's 11.5 km. Over 100 where even a full
     * battery may not reach it.
     */
    fun batteryNeeded(minimumRange: Int, fullBattery: Int): Long {
        val needed = minimumRange.toLong() * 100
        val full = fullBattery.coerceAtLeast(1).toLong()
        return (needed + full - 1) / full
    }

    /**
     * The paragraph under the slider while a minimum is set, null for Any: for the apps switched on with scooters in
     * view that report only a battery ([batteryRanges]' keys), the battery each needs, the apps of one battery
     * together and the lowest first, "Scooters that only report a battery need at least 9% (Voi), 21% (Bolt) and 53%
     * (Lime)."; then those whose full battery may not reach the minimum, whose are all hidden; and last that scooters
     * that give neither are hidden. Apps are named in the filters' order, the catalogue's.
     */
    fun help(
        minimumRange: Int,
        batteryRanges: Map<String, Int>,
        enabledProviders: Set<ScooterProvider>,
        locale: Locale = ScooterLanguage.current.locale,
    ): String? {
        if (minimumRange <= 0) return null
        val apps = ScooterProvider.entries.filter { it in enabledProviders && it.rawValue in batteryRanges }
        val needs = apps.associateWith { batteryNeeded(minimumRange, fullBattery(it.rawValue, batteryRanges)) }
        fun names(providers: List<ScooterProvider>) = ScooterListFormat.and(providers.map { it.displayName }, locale)

        val sentences = mutableListOf<String>()
        val groups = apps.filter { needs.getValue(it) <= 100 }.groupBy { needs.getValue(it) }.toSortedMap()
        if (groups.isNotEmpty()) {
            val items = groups.map { (percent, providers) ->
                stringFormat(localized("%1\$lld%% (%2\$@)"), percent, names(providers), locale = locale)
            }
            sentences += stringFormat(
                localized("Scooters that only report a battery need at least %@."),
                ScooterListFormat.and(items, locale),
                locale = locale,
            )
        }
        val hidden = apps.filter { needs.getValue(it) > 100 }
        if (hidden.isNotEmpty()) {
            sentences += stringFormat(
                localized("Scooters from %1\$@ that only report a battery are hidden, as a full battery may not reach %2\$@."),
                names(hidden),
                distance(minimumRange, locale),
                locale = locale,
            )
        }
        sentences += localized("Scooters without range or battery info are hidden while a minimum is set.")
        return sentences.joinToString(" ")
    }
}

/** One provider in the dock chips or in the filter sheet's provider list. */
data class ScooterProviderEntry(
    val provider: ScooterProvider,
    /** Scooters in view that pass the range filter, whether or not the provider is shown. */
    val count: Int,
    /** Included by the provider filter: the check in the filter sheet. */
    val isEnabled: Boolean,
    /** Highlighted in the dock, which only happens while a provider filter is active. */
    val isSelected: Boolean,
    /**
     * A feed of the provider failed and the map holds none of its scooters in view: dashed and never
     * selected, with a warning icon in the dock and "Not sharing data right now" in the filter sheet.
     */
    val isDown: Boolean,
    /**
     * Its scooters drawn faded in view where they were last seen, counted apart: how many, when, and whether new
     * positions are on their way (a spinner). Null without any.
     */
    val faded: ScooterFadedCount? = null,
) {
    val id: String get() = provider.id

    /** "Bird: not sharing data right now", the accessibility label of a down chip. */
    val downLabel: String get() = stringFormat(localized("%@: not sharing data right now"), provider.displayName)

    /** The faded ones' number, greyed, where the provider has none counted in view; null otherwise. */
    val fadedInPlaceOfCount: ScooterFadedCount? get() = if (count == 0) faded else null
}

/** A provider's scooters drawn faded in view where they were last seen, which the chips and the list count apart. */
data class ScooterFadedCount(
    /** In view, past the range filter, whether or not the provider is shown. */
    val count: Int,
    /** When the oldest of them were seen, on this device's clock. */
    val seenAt: Instant,
    /** New positions of the provider's are on their way. */
    val updating: Boolean,
) {
    /** "last seen 14:02", or "last seen Fri 14:02" on another day: under the provider's name in the list. */
    fun seenLine(now: Instant = Instant.now()): String =
        stringFormat(localized("last seen %@"), ScooterDockStatus.seenTime(seenAt, now = now))

    /**
     * What TalkBack reads after the chip's or row's own label: "44 faded, last seen at 14:02, updating.", its words in
     * the form the count takes in the language shown, "1 sbiadito, visto l’ultima volta alle 14:02." in Italian, where
     * one faded scooter was read in the plural (fresh-eyes review of 14 November 2026, S8; the iPhone's 89c1a12f).
     */
    fun accessibilityLabel(now: Instant = Instant.now()): String {
        val time = ScooterDockStatus.seenTime(seenAt, now = now)
        return if (updating) {
            localizedCounting("%lld faded, last seen at %@, updating.", count.toLong(), time)
        } else {
            localizedCounting("%lld faded, last seen at %@.", count.toLong(), time)
        }
    }

    companion object {
        /** "updating…", under the provider's name in the list while new positions are on their way. */
        val updatingLine: String get() = localized("updating…")
    }
}

/** Why the filters leave nothing on the map, for the "hidden by your filters" card. */
data class ScooterFilterSummary(
    /**
     * Scooters here before filtering; null when the response cannot tell, because the server already
     * filtered by range or cut the list short.
     */
    val hiddenCount: Int?,
    /** The providers the map is limited to; empty when every provider is shown. */
    val providers: List<ScooterProvider>,
    /** The minimum range in metres, a whole step of the unit shown; null for Any. */
    val minimumRange: Int? = null,
) {
    val title: String
        get() {
            if (hiddenCount == null || hiddenCount <= 0) return localized("No scooters match your filters here")
            if (hiddenCount == 1) return localized("1 scooter hidden by your filters")
            return stringFormat(
                localized("%lld scooters hidden by your filters"),
                hiddenCount.toLong(),
                locale = ScooterLanguage.current.locale,
            )
        }

    /** "Lime only" and "range 5 km or more", whichever apply. */
    val parts: List<String>
        get() {
            val parts = mutableListOf<String>()
            if (providers.isNotEmpty()) {
                parts += stringFormat(
                    localized("%@ only"),
                    ScooterListFormat.and(providers.map { it.displayName }, ScooterLanguage.current.locale),
                )
            }
            if (minimumRange != null) {
                parts += stringFormat(localized("range %@ or more"), ScooterRangeFilter.distance(minimumRange))
            }
            return parts
        }

    /** "Lime only · range 5 km or more" */
    val body: String
        get() {
            val line = parts.joinToString(" · ")
            if (line.isEmpty()) return line
            // The range part starts in lower case because it usually follows the providers.
            val locale = ScooterLanguage.launchLocale()
            val first = BreakIterator.getCharacterInstance(locale).apply { setText(line) }.next()
            return line.substring(0, first).uppercase(locale) + line.substring(first)
        }

    /** "Show all 26", or "Show all" when the count is unknown. The button resets the filters. */
    val showAllTitle: String
        get() {
            if (hiddenCount == null || hiddenCount <= 0) return localized("Show all")
            return stringFormat(localized("Show all %lld"), hiddenCount.toLong(), locale = ScooterLanguage.launchLocale())
        }
}
