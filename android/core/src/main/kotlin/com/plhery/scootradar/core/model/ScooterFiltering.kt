package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import java.text.BreakIterator

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
    fun passesBattery(scooter: Scooter, minimumBattery: Double): Boolean =
        minimumBattery == 0.0 || (scooter.battery?.toDouble() ?: -1.0) >= minimumBattery

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
) {
    val id: String get() = provider.id

    /** "Bird: not sharing data right now", the accessibility label of a down chip. */
    val downLabel: String get() = stringFormat(localized("%@: not sharing data right now"), provider.displayName)
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
