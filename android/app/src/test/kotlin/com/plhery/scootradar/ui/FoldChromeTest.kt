package com.plhery.scootradar.ui

import android.graphics.Rect
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.LayoutDirection
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.window.layout.FoldingFeature
import androidx.window.testing.layout.FoldingFeature
import androidx.window.testing.layout.TestWindowLayoutInfo
import androidx.window.testing.layout.WindowLayoutInfoPublisherRule
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.ui.dock.DockState
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

// UI-116 to UI-119 and UI-003: the fold WindowManager gives the screen, as ScooterMapScreen.swift's body hands
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
    }

    /** T245's window: an iPhone Duo upright, with its dock, standing like a laptop. */
    @Test
    @Config(qualifiers = "w669dp-h951dp-mdpi")
    fun standingLikeALaptopTheDockLiesUnderTheFold() {
        show()
        assertEquals(ScooterChromeLayout.Dock, frames.layout)
        val searchBar = frames.top!!
        val fold = ScreenRect(0.0, 465.0, 669.0, 20.0)

        fold(FoldingFeature(Rect(0, 0, 669, 951), center = 475, size = 20, state = FoldingFeature.State.HALF_OPENED))
        assertEquals(fold, frames.chrome.fold)
        // The search bar is 8 points under the fold, as it is under the top of the safe area, and the bottom's
        // chrome under it too.
        assertEquals(fold.maxY + 8, frames.top!!.minY, 0.5)
        assertTrue(
            "${frames.locateButton}, ${frames.dock}",
            listOfNotNull(frames.locateButton, frames.dock).all { it.minY >= fold.maxY },
        )

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
}
