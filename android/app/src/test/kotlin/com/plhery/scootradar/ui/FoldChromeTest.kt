package com.plhery.scootradar.ui

import android.content.Context
import android.graphics.Rect
import android.provider.Settings
import androidx.compose.animation.core.TargetBasedAnimation
import androidx.compose.animation.core.VectorConverter
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.LayoutDirection
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.window.layout.FoldingFeature
import androidx.window.testing.layout.FoldingFeature
import androidx.window.testing.layout.TestWindowLayoutInfo
import androidx.window.testing.layout.WindowLayoutInfoPublisherRule
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.theme.animation
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone
import kotlin.math.abs

// UI-116 to UI-119, UI-194 and UI-003: the fold WindowManager gives the screen, as ScooterMapScreen.swift's body hands
// ScooterFold's chromeTop to the dock, its panelWidth to the panel and the fold to the map.

/**
 * The chrome of a partly open foldable keeps clear of its fold: standing like a laptop the dock's chrome lies on the
 * flat half under the fold, and open like a book the panel stops at it; the map is told where it is. The fold
 * is given as WindowManager gives it, at one point to the pixel.
 */
@RunWith(AndroidJUnit4::class)
class FoldChromeTest {
    private val compose = createComposeRule()
    private val hinge = WindowLayoutInfoPublisherRule()

    @get:Rule
    val rules: RuleChain = RuleChain.outerRule(hinge).around(compose)

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale
    private val resolver = ApplicationProvider.getApplicationContext<Context>().contentResolver
    private val animatorScale = Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
    private lateinit var frames: MapChromeFrames

    @Before
    fun setUp() {
        val swiss = Locale.forLanguageTag("en-CH")
        Locale.setDefault(swiss)
        ScooterLanguage.launchLocale = { swiss }
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
        Settings.Global.putFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, animatorScale)
    }

    /** T245's window: an iPhone Duo upright, with its dock, standing like a laptop. */
    @Test
    @Config(qualifiers = "w669dp-h951dp-mdpi")
    fun standingLikeALaptopTheDockLiesUnderTheFold() {
        show()
        assertEquals(ScooterChromeLayout.Dock, frames.layout)
        val searchBar = frames.top!!
        val bottom = listOfNotNull(frames.locateButton, frames.dock)
        val fold = ScreenRect(0.0, 465.0, 669.0, 20.0)

        fold(FoldingFeature(Rect(0, 0, 669, 951), center = 475, size = 20, state = FoldingFeature.State.HALF_OPENED))
        assertEquals(fold, frames.chrome.fold)
        // The search bar is 8 points under the fold, as it is under the top of the safe area; the locate button and
        // the dock stay where they were, at the bottom of the half lying flat.
        assertEquals(fold.maxY + 8, frames.top!!.minY, 0.5)
        val folded = listOfNotNull(frames.locateButton, frames.dock)
        assertEquals(2, bottom.size)
        assertEquals("$bottom, $folded", bottom.size, folded.size)
        bottom.zip(folded).forEach { (before, after) ->
            assertEquals(before.minY, after.minY, 0.5)
            assertEquals(before.height, after.height, 0.5)
            assertTrue(after.minY >= fold.maxY)
        }

        // Laid flat, the fold is gone and the search bar back at the top.
        fold(FoldingFeature(Rect(0, 0, 669, 951), center = 475, size = 20, state = FoldingFeature.State.FLAT))
        assertNull(frames.chrome.fold)
        assertEquals(searchBar.minY, frames.top!!.minY, 0.5)
    }

    /** Open like a book, the panel inset 16 points stops at a fold that its 380 would cross, on either side. */
    @Test
    @Config(qualifiers = "w951dp-h669dp-mdpi")
    fun openLikeABookThePanelStopsAtTheFold() {
        show()
        assertEquals(ScooterChromeLayout.Panel, frames.layout)
        assertEquals(380.0, frames.panel!!.width, 0.5)

        fold(FoldingFeature(Rect(0, 0, 951, 669), center = 400, size = 20, orientation = FoldingFeature.Orientation.VERTICAL))
        assertEquals(ScreenRect(390.0, 0.0, 20.0, 669.0), frames.chrome.fold)
        assertEquals(374.0, frames.panel!!.width, 0.5)
        assertEquals(390.0, frames.panel!!.maxX, 0.5)

        // A fold across leaves the panel as it is, and the layout too (UI-119).
        fold(FoldingFeature(Rect(0, 0, 951, 669), center = 334, size = 20))
        assertEquals(ScooterChromeLayout.Panel, frames.layout)
        assertEquals(380.0, frames.panel!!.width, 0.5)
    }

    @Test
    @Config(qualifiers = "w951dp-h669dp-mdpi")
    fun rightToLeftThePanelStopsAtTheFoldOnItsSide() {
        show(LayoutDirection.Rtl)
        fold(FoldingFeature(Rect(0, 0, 951, 669), center = 551, size = 20, orientation = FoldingFeature.Orientation.VERTICAL))
        assertEquals(374.0, frames.panel!!.width, 0.5)
        assertEquals(561.0, frames.panel!!.minX, 0.5)
    }

    /**
     * UI-194: standing like a laptop, the search bar goes down under the fold on ScooterMapScreen.swift:255's
     * `.snappy(duration: 0.28)`, and the map is told where it goes as it starts (finding 4): the iPhone's
     * onGeometryChange (ScooterMapScreen.swift:243-247) reads the layout, which the spring doesn't move, as only the
     * views that draw apply an animation to their frames (geometryGroup()'s documentation).
     */
    @Test
    @Config(qualifiers = "w669dp-h951dp-mdpi")
    fun standingLikeALaptopTheSearchBarGoesUnderTheFoldOnASnappySpring() {
        show()
        val start = frames.top!!.minY
        val (moved, told) = slide(LAPTOP)
        // The bar is measured once the stack is laid out, a frame or two after the spring starts.
        val spring = TargetBasedAnimation(
            IosMotion.snappy(duration = 0.28).animation<Float>(), Float.VectorConverter, start.toFloat(), UNDER_THE_FOLD.toFloat(),
        )
        val expected = { frame: Int -> spring.getValueFromNanos(maxOf(0, frame) * 16 * 1_000_000L).toDouble() }
        val misses = (0..3).associateWith { late -> moved.indices.maxOf { abs(moved[it] - expected(it - late)) } }
        assertTrue("$moved, misses by $misses", misses.values.min() < 1.0)
        val midway = moved.indices.filter { moved[it] > start + 1 && moved[it] < UNDER_THE_FOLD - 1 }
        assertTrue("$moved", midway.size >= 5)
        assertEquals(UNDER_THE_FOLD, moved.last(), 0.5)
        // The map's frame is where the bar goes from the frame it starts to move, and stays there.
        val first = moved.indexOfFirst { it > start + 0.5 }
        assertTrue("$moved, told $told", told.drop(first).all { abs(it - UNDER_THE_FOLD) < 0.5 })
    }

    /**
     * UI-194: laid flat again, the search bar goes back up on the same spring, and the map is told it is at the top
     * from the frame it starts back: the iPhone's `.padding(.top, 8 + chromeTop)` lays the stack out there at once,
     * which onGeometryChange reads, while the spring only draws it on its way.
     */
    @Test
    @Config(qualifiers = "w669dp-h951dp-mdpi")
    fun laidFlatTheMapIsToldTheSearchBarIsBackAtTheTopAsItStartsBack() {
        show()
        val start = frames.top!!.minY
        fold(LAPTOP)
        assertEquals(UNDER_THE_FOLD, frames.top!!.minY, 0.5)
        val (moved, told) = slide(FLAT)
        val midway = moved.indices.filter { moved[it] > start + 1 && moved[it] < UNDER_THE_FOLD - 1 }
        assertTrue("$moved", midway.size >= 5)
        assertEquals(start, moved.last(), 0.5)
        val first = moved.indexOfFirst { it < UNDER_THE_FOLD - 0.5 }
        assertTrue("$moved", first in 0..3)
        assertTrue("$moved, told $told", told.drop(first).all { abs(it - start) < 0.5 })
    }

    /**
     * UI-194: under Reduce Motion, where the iPhone's animation is nil, the search bar goes under the fold at once, and
     * the map is told so: its frame was left at the top, where the bar had been, as nothing drew the stack again.
     */
    @Test
    @Config(qualifiers = "w669dp-h951dp-mdpi")
    fun underReduceMotionTheSearchBarGoesUnderTheFoldAtOnce() {
        // Android's Remove animations, which ScootTheme reads as Reduce Motion.
        Settings.Global.putFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 0f)
        show()
        val start = frames.top!!.minY
        val (moved, told) = slide(LAPTOP)
        assertTrue("$moved", moved.none { it > start + 1 && it < UNDER_THE_FOLD - 1 })
        assertTrue("$moved", moved.drop(3).all { abs(it - UNDER_THE_FOLD) < 0.5 })
        assertTrue("$told", told.drop(3).all { abs(it - UNDER_THE_FOLD) < 0.5 })
    }

    /**
     * Frame by frame, 40 of them, from when WindowManager tells the screen of [feature]: where the search bar's top is
     * drawn, and the top of the frame the map is told.
     */
    private fun slide(feature: FoldingFeature): Pair<List<Double>, List<Double>> {
        // The island's top from the stack's, at rest.
        val inset = barTop() - frames.top!!.minY
        compose.mainClock.autoAdvance = false
        compose.runOnIdle { hinge.overrideWindowLayoutInfo(TestWindowLayoutInfo(listOf(feature))) }
        val tops = List(40) {
            compose.mainClock.advanceTimeByFrame()
            compose.waitForIdle()
            barTop() - inset to frames.top!!.minY
        }
        compose.mainClock.autoAdvance = true
        return tops.unzip()
    }

    /** The search bar's top as it is drawn. */
    private fun barTop(): Double =
        compose.onNodeWithTag(SEARCH_ISLAND_TAG).fetchSemanticsNode().boundsInRoot.top.toDouble() / compose.density.density

    /** The screen on the list of providers, with the map's stand-in reading the chrome's frames. */
    private fun show(direction: LayoutDirection = LayoutDirection.Ltr) {
        val clock = TestClock()
        val model = DockState.Summary.make(controllers, clock)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }, LocalLayoutDirection provides direction) {
                ScooterMapScreen(controller = model, map = { frames = LocalMapChrome.current!! }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
    }

    /** The hinge as WindowManager tells it, once the screen listens, and the screen at rest after it. */
    private fun fold(feature: FoldingFeature) {
        compose.runOnIdle { hinge.overrideWindowLayoutInfo(TestWindowLayoutInfo(listOf(feature))) }
        compose.waitForIdle()
    }

    private companion object {
        /** T245's iPhone Duo standing like a laptop, its 20-point fold across from 465 to 485. */
        val LAPTOP = FoldingFeature(Rect(0, 0, 669, 951), center = 475, size = 20, state = FoldingFeature.State.HALF_OPENED)

        /** The same Duo laid flat: its fold no longer counts. */
        val FLAT = FoldingFeature(Rect(0, 0, 669, 951), center = 475, size = 20, state = FoldingFeature.State.FLAT)

        /** The search bar's top under that fold: 8 points under it. */
        const val UNDER_THE_FOLD = 485.0 + 8
    }
}
