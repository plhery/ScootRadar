package com.plhery.scootradar.ui.dock

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dock
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.util.Locale
import kotlin.math.abs

/**
 * The card's height as what the dock shows changes. The iPhone animates the dock by its kind alone,
 * `.animation(.snappy(duration: 0.28, extraBounce: 0.06), value: content.kind)` (ScooterControls.swift:200), so a
 * summary that gains its status row is its new height in the frame it changes, and a card of another kind springs to
 * its height (UI-202).
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w411dp-h891dp-mdpi")
class DockHeightTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter("s1", "lime"))))

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

    /** Near a scooter, its line leads the summary, and a failed refresh puts the status and Try again under it. */
    @Test
    fun aRefreshThatFailsMakesTheSummaryItsNewHeightAtOnce() {
        val model = shown(near = GeoPoint(47.3779, 8.5417))
        val film = filmOf {
            api.setFailure(ScooterAPIError.Offline())
            model.retryLoad()
            assertTrue(controllers.waitUntil { api.calls == 2 && model.loadIssue.value != null && !model.isLoading.value })
        }
        assertTrue("the status row makes the card taller: $film", film.after > film.before + 5)
        assertEquals("the card's heights from the first frame", List(film.frames.size) { film.after }, film.frames)
    }

    @Test
    fun aScootersCardSpringsToItsHeightFromTheSummary() {
        val model = shown()
        val film = filmOf {
            model.selectScooter("lime:s1")
            assertTrue(controllers.waitUntil { model.dock is ScooterDockContent.Scooter })
        }
        assertTrue("the scooter's card is taller: $film", film.after > film.before + 5)
        val between = film.frames.count { it > film.before && it < film.after - 1 }
        assertTrue("frames between the heights, of $film", between >= 3)
    }

    /**
     * Closed as it opens, the card springs back from where it is to the summary's height, as the iPhone's snappy,
     * interrupted, goes on from where it is: the summary that comes back is of the kind the change began from, but the
     * change under way is one of kind.
     */
    @Test
    fun aScootersCardClosedAsItOpensSpringsBackToTheSummary() {
        val model = shown()
        compose.mainClock.advanceTimeBy(2_000)
        val summary = height()
        model.selectScooter("lime:s1")
        assertTrue(controllers.waitUntil { model.dock is ScooterDockContent.Scooter })
        val opening = frames(6)
        model.clearSelection()
        assertTrue(controllers.waitUntil { model.dock is ScooterDockContent.Summary })
        val closing = frames(30)
        assertTrue("part way open: $opening", opening.last() > summary + 20)
        assertEquals("closed: $closing", summary, closing.last())
        val steps = (listOf(opening.last()) + closing).zipWithNext { a, b -> abs(b - a) }
        assertTrue("no jump from $opening to $closing", steps.all { it <= 30 })
        assertTrue("springing back over frames: $closing", closing.count { it > summary + 2 } >= 8)
    }

    private fun frames(count: Int): List<Int> {
        Snapshot.sendApplyNotifications()
        return List(count) {
            compose.mainClock.advanceTimeByFrame()
            height()
        }
    }

    /** Heights of the dock's card in pixels: before a change, in each of the 20 frames after, and settled. */
    private data class Film(val before: Int, val frames: List<Int>, val after: Int)

    private fun shown(near: GeoPoint? = null): ScooterMapController {
        val model = controllers.make(api)
        near?.let(model::setUserLocation)
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value })
        compose.mainClock.autoAdvance = false
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = false) {
                Box(Modifier.fillMaxWidth()) { ScooterControlDock(model) }
            }
        }
        compose.mainClock.advanceTimeByFrame()
        return model
    }

    private fun filmOf(change: () -> Unit): Film {
        compose.mainClock.advanceTimeBy(2_000)
        val before = height()
        change()
        // Recomposition sees the change in the next frame, as the app's own changes are seen.
        Snapshot.sendApplyNotifications()
        val frames = List(20) {
            compose.mainClock.advanceTimeByFrame()
            height()
        }
        compose.mainClock.advanceTimeBy(2_000)
        return Film(before, frames, height())
    }

    private fun height() = compose.onNodeWithTag(DOCK_TAG).fetchSemanticsNode().size.height
}
