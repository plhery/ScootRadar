package com.plhery.scootradar.ui.dock

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dock
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import java.util.Locale

/**
 * LOG-063 (ScooterControls.swift:271, 371, 390): the dock's status is read again every 30 seconds, as
 * `TimelineView(.periodic(from: .now, by: 30))` reads it, so that "Live" turns into "Updated 3 min ago" with no
 * other change on the screen: under the count, beside the nearest scooter once it is no longer live, and in a
 * folded panel's line. The clock moves 200 s at once; the screen sees it only when its ticker reads it.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class DockTickerTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val clock = TestClock()
    private val locale = Locale.getDefault()

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    private val live = localized("Live")
    private val aged = stringFormat(localized("Updated %lld min ago"), 3L)

    /** The folded line's brief age. */
    private val agedBriefly = stringFormat(localized("%lld min ago"), 3L)

    /** Zürich's scooters loaded at the clock's time, from the rider's place if given one. */
    private fun loaded(rider: GeoPoint? = null): ScooterMapController {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = listOf(
                    scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421),
                    scooter(id = "b", provider = "voi", latitude = 47.3765, longitude = 8.5430),
                ),
            ),
        )
        val model = controllers.make(api, clock)
        rider?.let(model::setUserLocation)
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value })
        assertTrue("${model.dock}", model.dock is ScooterDockContent.Summary)
        return model
    }

    private fun show(content: @Composable () -> Unit) {
        compose.mainClock.autoAdvance = false
        compose.setContent { CompositionLocalProvider(LocalClock provides { clock.now }, content = content) }
        compose.mainClock.advanceTimeByFrame()
    }

    private fun shows(text: String): Boolean =
        compose.onAllNodesWithText(text, substring = true, useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty()

    /** The clock moves 200 s; the screen tells the time it read last until its 30 s are up. */
    private fun ageThroughThirtySeconds(before: Boolean, aged: String = this.aged) {
        clock.advance(200.0)
        compose.mainClock.advanceTimeBy(29_000)
        assertEquals("$live after 29 s", before, shows(live))
        assertTrue("nothing aged after 29 s", !shows(aged))
        compose.mainClock.advanceTimeBy(1_100)
        assertTrue("$aged after 30 s", shows(aged))
        assertTrue("no $live after 30 s", !shows(live))
    }

    @Test
    fun theCountsStatusIsReadAgainEveryThirtySeconds() {
        val model = loaded()
        show { ScooterControlDock(model) }
        assertTrue(live, shows(live))
        ageThroughThirtySeconds(before = true)
    }

    @Test
    fun theNearestScootersStatusShowsOnceItIsOld() {
        // Beside the nearest scooter "Live" is left out; the age is said once the ticker reads it.
        val model = loaded(rider = GeoPoint(47.3779, 8.5417))
        show { ScooterControlDock(model) }
        assertTrue("the nearest scooter: ${model.dock}", (model.dock as ScooterDockContent.Summary).summary.lead != null)
        assertTrue("no $live beside the nearest scooter", !shows(live))
        ageThroughThirtySeconds(before = false)
    }

    @Test
    fun theFoldedPanelsLineIsReadAgainEveryThirtySeconds() {
        val model = loaded()
        show { FoldedPanelLine(model) }
        assertTrue(live, shows(live))
        ageThroughThirtySeconds(before = true, aged = agedBriefly)
    }
}
