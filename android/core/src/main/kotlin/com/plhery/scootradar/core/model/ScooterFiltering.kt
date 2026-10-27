package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider

// ScooterBatteryFilter, ScooterProviderEntry and ScooterFilterSummary from ios/ScootRadar/Models/ScooterFiltering.swift;
// the rest of that file is not here yet.

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

/** Why the filters leave nothing on the map, for the "hidden by your filters" card. Its sentences come with the rest of the file. */
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
)
