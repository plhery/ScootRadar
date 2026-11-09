package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import java.text.BreakIterator
import java.time.Instant
import java.util.Locale

// ios/ScootRadar/Models/ScooterFiltering.swift.

data class VisibleScooterSummary(
    val count: Int,
    val providerCounts: Map<ScooterProvider, Int>,
    /** Scooters in the viewport before the battery and provider filters. */
    val unfilteredCount: Int,
    /** Providers with a scooter in the viewport before those filters. */
    val unfilteredProviders: Set<ScooterProvider>,
)

object ScooterFiltering {
    /**
     * A minimum hides the scooters with less battery and those with none known, a scooter whose feed gives only its
     * range being judged by the battery the server estimated from it, as the server filters them.
     */
    fun passesBattery(scooter: Scooter, minimumBattery: Double): Boolean =
        minimumBattery == 0.0 || (scooter.filteredBattery?.toDouble() ?: -1.0) >= minimumBattery

    fun mapScooters(
        from: List<Scooter>,
        minimumBattery: Double,
        enabledProviders: Set<ScooterProvider>,
    ): List<Scooter> {
        val allProvidersEnabled = enabledProviders == ScooterProvider.entries.toSet()
        return from.filter { scooter ->
            passesBattery(scooter, minimumBattery) &&
                (allProvidersEnabled || scooter.providerInfo?.let { it in enabledProviders } == true)
        }
    }

    fun visibleSummary(
        vehicles: List<Scooter>,
        viewport: GeoBounds,
        minimumBattery: Double,
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
            if (!passesBattery(scooter, minimumBattery)) continue

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

object ScooterBatteryFilter {
    /** The only minimums offered: Any, 30%+, 60%+ and 80%+. */
    val presets: List<Int> = listOf(0, 30, 60, 80)

    /** Stored values that are not a preset snap down (45 → 30, 95 → 80). */
    fun snapped(value: Int): Int = presets.lastOrNull { it <= value } ?: 0

    fun label(preset: Int): String = if (preset == 0) localized("Any") else "$preset%+"
}

/**
 * How far a battery level usually takes the scooters chosen in view, in metres, as src/lib/battery.ts works it out
 * (batteryReach): from each app's usual range on a full battery, the answer's fullRanges, and its scooters in view.
 */
data class ScooterBatteryReach(
    /** The shortest and the longest of their apps'. */
    val low: Double,
    val high: Double,
    /** Their apps' weighed by their scooters in view. */
    val mean: Double,
) {
    /**
     * "22 km", or "12–80 km" where the longest is over a quarter longer than the shortest: in whole kilometres, or
     * whole miles where lengths are in miles, never 0 (formatBatteryReach).
     */
    fun formatted(locale: Locale = ScooterLanguage.current.locale): String {
        val metric = locale.measurementSystem == ScooterMeasurementSystem.Metric
        val unit = if (metric) ScooterLengthUnit.Kilometers else ScooterLengthUnit.Miles
        val length = if (metric) 1_000.0 else 1_609.344
        // Halves go up, as Math.round takes them on the web.
        fun whole(meters: Double): Int = maxOf(1.0, (meters / length).roundedAwayFromZero()).toInt()
        val low = whole(low)
        val high = whole(high)
        if (high * 4 <= low * 5) return Scooter.formattedWhole(whole(mean), unit, locale)
        return low.formatted(locale) + "–" + Scooter.formattedWhole(high, unit, locale)
    }

    companion object {
        /**
         * How far [level]% usually takes the scooters in view of the apps switched on, from each app's usual range on
         * a full battery and its scooters in view ([counts]). An app with under a tenth of them is left out unless it
         * has the most, so a handful of another app's at the edge of the view doesn't stretch the line. Null when no
         * app switched on in view has a full range.
         */
        fun <K> of(level: Int, fullRanges: Map<K, Int>, counts: Map<K, Int>, enabled: (K) -> Boolean): ScooterBatteryReach? {
            val apps = fullRanges.mapNotNull { (provider, meters) ->
                val count = counts[provider] ?: 0
                if (meters > 0 && enabled(provider) && count > 0) meters.toDouble() to count.toLong() else null
            }
            if (apps.isEmpty()) return null
            val total = apps.sumOf { it.second }
            val most = apps.maxOf { it.second }
            val kept = apps.filter { (_, count) -> count * 10 >= total || count == most }
            val scale = level / 100.0
            val weight = kept.sumOf { it.second }
            return ScooterBatteryReach(
                low = kept.minOf { it.first } * scale,
                high = kept.maxOf { it.first } * scale,
                mean = kept.sumOf { (meters, count) -> meters * count } / weight * scale,
            )
        }

        /**
         * The line under the battery presets: how far the minimum chosen, or a full battery for Any, usually takes the
         * scooters in view of the apps switched on, "60% usually allows about 22 km.", counted as the filters' provider
         * rows count them, whatever the apps switched on. Null where no such app has a full range ([fullRanges], by
         * provider id).
         */
        fun line(
            minimumBattery: Int,
            fullRanges: Map<String, Int>,
            entries: List<ScooterProviderEntry>,
            locale: Locale = ScooterLanguage.current.locale,
        ): String? {
            val level = ScooterBatteryFilter.snapped(minimumBattery).takeIf { it > 0 } ?: 100
            val byID = entries.associateBy { it.provider.rawValue }
            val reach = of(
                level,
                fullRanges,
                counts = byID.mapValues { it.value.count },
                enabled = { byID[it]?.isEnabled == true },
            ) ?: return null
            return stringFormat(localized("%1\$lld%% usually allows about %2\$@."), level.toLong(), reach.formatted(locale))
        }
    }
}

/** One provider in the dock chips or in the filter sheet's provider list. */
data class ScooterProviderEntry(
    val provider: ScooterProvider,
    /** Scooters in view that pass the battery filter, whether or not the provider is shown. */
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
    /** In view, past the battery filter, whether or not the provider is shown. */
    val count: Int,
    /** When the oldest of them were seen, on this device's clock. */
    val seenAt: Instant,
    /** New positions of the provider's are on their way. */
    val updating: Boolean,
) {
    /** "last seen 14:02", or "last seen Fri 14:02" on another day: under the provider's name in the list. */
    fun seenLine(now: Instant = Instant.now()): String =
        stringFormat(localized("last seen %@"), ScooterDockStatus.seenTime(seenAt, now = now))

    /** What TalkBack reads after the chip's or row's own label: "44 faded, last seen at 14:02, updating." */
    fun accessibilityLabel(now: Instant = Instant.now()): String {
        val time = ScooterDockStatus.seenTime(seenAt, now = now)
        return if (updating) {
            stringFormat(localized("%1\$lld faded, last seen at %2\$@, updating."), count.toLong(), time, locale = ScooterLanguage.current.locale)
        } else {
            stringFormat(localized("%1\$lld faded, last seen at %2\$@."), count.toLong(), time, locale = ScooterLanguage.current.locale)
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
     * filtered by battery or cut the list short.
     */
    val hiddenCount: Int?,
    /** The providers the map is limited to; empty when every provider is shown. */
    val providers: List<ScooterProvider>,
    /** The minimum battery in percent; null for Any. */
    val minimumBattery: Int?,
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

    /** "Lime only" and "battery 60% or more", whichever apply. */
    val parts: List<String>
        get() {
            val parts = mutableListOf<String>()
            if (providers.isNotEmpty()) {
                parts += stringFormat(
                    localized("%@ only"),
                    ScooterListFormat.and(providers.map { it.displayName }, ScooterLanguage.current.locale),
                )
            }
            if (minimumBattery != null) {
                parts += stringFormat(localized("battery %lld%% or more"), minimumBattery.toLong())
            }
            return parts
        }

    /** "Lime only · battery 60% or more" */
    val body: String
        get() {
            val line = parts.joinToString(" · ")
            if (line.isEmpty()) return line
            // The battery part starts in lower case because it usually follows the providers.
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
