package com.plhery.scootradar.baselineprofile

// Android's own (X-AD30): the journeys the app's Baseline Profile is recorded from, on the nonMinifiedRelease build,
// by :app:generateReleaseBaselineProfile. Each runs until the classes and methods it uses are the same three times
// running.

import androidx.benchmark.macro.junit4.BaselineProfileRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BaselineProfileGenerator {
    @get:Rule
    val rule = BaselineProfileRule()

    /** A cold start to the map's first markers: the startup profile too, which lays out the dex for it. */
    @Test
    fun launchToTheFirstMarkers() = rule.collect(packageName = PACKAGE, includeInStartupProfile = true) {
        pressHome()
        startActivityAndWait()
        waitForMarkers()
    }

    /** Then a scooter's card, and the search opened and asked for a place. */
    @Test
    fun aScooterCardAndTheSearch() = rule.collect(packageName = PACKAGE) {
        pressHome()
        startActivityAndWait()
        waitForMarkers()
        openScooterCard()
        openSearch()
    }
}
