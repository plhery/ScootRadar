package com.plhery.scootradar.core.model

// ScooterBatteryFilter from ios/ScootRadar/Models/ScooterFiltering.swift; the rest of that file is not here yet.

object ScooterBatteryFilter {
    /** The only minimums offered: Any, 30%+, 60%+ and 80%+. */
    val presets: List<Int> = listOf(0, 30, 60, 80)

    /** Stored values that are not a preset snap down (45 → 30, 95 → 80). */
    fun snapped(value: Int): Int = presets.lastOrNull { it <= value } ?: 0

    fun label(preset: Int): String = if (preset == 0) localized("Any") else "$preset%+"
}
