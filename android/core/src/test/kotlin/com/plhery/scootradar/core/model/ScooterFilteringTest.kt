package com.plhery.scootradar.core.model

import org.junit.Assert.assertEquals
import org.junit.Test

// ios/ScootRadarTests/ScooterFilteringTests.swift.
class ScooterFilteringTest {
    // Filter presets and the filtered-out summary.

    @Test
    fun batteryFilterOffersFourPresetsAndSnapsOtherValuesDown() {
        assertEquals(listOf(0, 30, 60, 80), ScooterBatteryFilter.presets)

        val examples = listOf(0 to 0, 29 to 0, 30 to 30, 45 to 30, 60 to 60, 79 to 60, 80 to 80, 95 to 80, 100 to 80, -10 to 0)
        for ((value, preset) in examples) {
            assertEquals("$value", preset, ScooterBatteryFilter.snapped(value))
        }
        assertEquals(localized("Any"), ScooterBatteryFilter.label(0))
        assertEquals("60%+", ScooterBatteryFilter.label(60))
    }
}
