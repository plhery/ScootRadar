package com.plhery.scootradar.ui

import android.graphics.Rect
import android.view.View
import android.view.WindowInsetsController
import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

// UI-126: the search bar beside the buttons of a desktop window's caption bar, as ScooterMapScreen.swift's
// `.containerCornerOffset(.leading, sizeToFit: true)` moves and narrows the iPad's beside its window's buttons, in the
// frame it had, which onGeometryChange hands the map.

/**
 * In a window whose caption bar the map runs under, the search bar keeps to the top beside the caption's app chip and
 * buttons, narrowed on the side of each; where it can't, or Android doesn't say where they are, it goes under the
 * caption. The caption is given as Android gives a desktop window's, dispatched to the window's root view, at one
 * point to the pixel.
 */
@RunWith(AndroidJUnit4::class)
class WindowCaptionTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale
    private lateinit var frames: MapChromeFrames
    private lateinit var view: View

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

    /** A desktop window of a tablet across, with the panel: the bar keeps to the top, past the app's chip. */
    @Test
    @Config(qualifiers = "w960dp-h600dp-mdpi")
    fun thePanelsSearchBarKeepsToTheTopBesideTheAppsChip() {
        val model = show()
        assertEquals(ScooterChromeLayout.Panel, frames.layout)
        assertEquals(ScreenRect(16.0, 16.0, 380.0, bar().height), bar())

        caption(48, listOf(Rect(0, 0, 150, 48), Rect(790, 0, 960, 48)))
        // 8 past the chip, and the panel's card under the bar at the top, as without a caption.
        assertEquals(ScreenRect(158.0, 16.0, 238.0, bar().height), bar())
        assertEquals(16.0, frames.panel!!.minY, 0.5)
        // Its touches are its own, not the caption's to drag the window with.
        assertTrue(view.systemGestureExclusionRects.toString(), view.systemGestureExclusionRects.any { it == bar().pixels })

        // The map shows through the caption, its buttons dark over a light map and light over a dark one.
        assertTrue(appearance() and WindowInsetsController.APPEARANCE_TRANSPARENT_CAPTION_BAR_BACKGROUND != 0)
        assertTrue(appearance() and WindowInsetsController.APPEARANCE_LIGHT_CAPTION_BARS != 0)
        compose.runOnIdle { model.setAppearance(ScooterAppearance.Dark) }
        compose.waitForIdle()
        assertTrue(appearance() and WindowInsetsController.APPEARANCE_TRANSPARENT_CAPTION_BAR_BACKGROUND != 0)
        assertEquals(0, appearance() and WindowInsetsController.APPEARANCE_LIGHT_CAPTION_BARS)
    }

    /** Right to left the panel is at the right, and its bar stops short of the window's buttons. */
    @Test
    @Config(qualifiers = "w960dp-h600dp-mdpi")
    fun rightToLeftThePanelsSearchBarStopsShortOfTheButtons() {
        show(LayoutDirection.Rtl)
        caption(48, listOf(Rect(0, 0, 150, 48), Rect(790, 0, 960, 48)))
        assertEquals(ScreenRect(564.0, 16.0, 218.0, bar().height), bar())
    }

    /** Where Android doesn't say where the buttons are, the bar is under the caption, as wide as it was. */
    @Test
    @Config(qualifiers = "w960dp-h600dp-mdpi")
    fun withoutItsButtonsTheCaptionPushesTheSearchBarDown() {
        show()
        caption(48, emptyList())
        assertEquals(ScreenRect(16.0, 64.0, 380.0, bar().height), bar())
        assertEquals(64.0, frames.panel!!.minY, 0.5)
        assertTrue(view.systemGestureExclusionRects.isEmpty())
    }

    /** A narrower window, with the dock: the bar, 560 at most, narrows between the chip and the buttons. */
    @Test
    @Config(qualifiers = "w600dp-h900dp-mdpi")
    fun theDocksSearchBarNarrowsBetweenTheChipAndTheButtons() {
        show()
        assertEquals(ScooterChromeLayout.Dock, frames.layout)
        assertEquals(ScreenRect(20.0, 8.0, 560.0, bar().height), bar())

        caption(48, listOf(Rect(0, 0, 150, 48), Rect(430, 0, 600, 48)))
        assertEquals(ScreenRect(158.0, 8.0, 264.0, bar().height), bar())
        // The map keeps its names and taps off the bar's whole width without the buttons, as the iPad's stack lays out
        // the frame the bar had (containerCornerOffset(_:sizeToFit:) moves and sizes only its content).
        val top = frames.top!!
        assertEquals("$top", 20.0, top.x, 0.5)
        assertEquals("$top", 560.0, top.width, 0.5)
        assertEquals("$top", 8.0, top.y, 0.5)
        assertEquals("$top", bar().height, top.height, 0.5)
    }

    /**
     * A screen 40 in from the window's left: the map's top is the bar's whole width without the buttons where the
     * screen has it, in the window's points, as every frame the map is handed is.
     */
    @Test
    @Config(qualifiers = "w640dp-h900dp-mdpi")
    fun theMapsTopBesideTheButtonsIsInTheWindowWhereverTheScreenIs() {
        show(start = 40.dp)
        assertEquals(ScooterChromeLayout.Dock, frames.layout)
        assertEquals(ScreenRect(60.0, 8.0, 560.0, bar().height), bar())

        caption(48, listOf(Rect(40, 0, 190, 48), Rect(470, 0, 640, 48)))
        assertEquals(ScreenRect(198.0, 8.0, 264.0, bar().height), bar())
        val top = frames.top!!
        assertEquals("$top", 60.0, top.x, 0.5)
        assertEquals("$top", 560.0, top.width, 0.5)
        assertEquals("$top", 8.0, top.y, 0.5)
        assertEquals("$top", bar().height, top.height, 0.5)
    }

    /** Too narrow beside them, it goes under the caption, the width it had. */
    @Test
    @Config(qualifiers = "w400dp-h800dp-mdpi")
    fun tooNarrowBesideTheButtonsTheSearchBarGoesUnderTheCaption() {
        show()
        caption(48, listOf(Rect(0, 0, 150, 48), Rect(230, 0, 400, 48)))
        assertEquals(ScreenRect(12.0, 56.0, 376.0, bar().height), bar())
        assertTrue(view.systemGestureExclusionRects.isEmpty())
    }

    @Test
    fun aBarMovesInPastTheButtonsOnItsSidesWithinReach() {
        val bar = ScreenRect(20.0, 8.0, 560.0, 60.0)
        // One on the left, one 6 short of the bar's right, and one under the bar's height, which is left be.
        val buttons = listOf(ScreenRect(0.0, 0.0, 150.0, 48.0), ScreenRect(586.0, 0.0, 14.0, 48.0), ScreenRect(300.0, 70.0, 40.0, 40.0))
        assertEquals(ScreenRect(158.0, 8.0, 420.0, 60.0), besideCaption(bar, buttons))
        // Narrower than the bar may be, and without buttons, it isn't beside them.
        assertNull(besideCaption(bar, buttons, narrowest = 421.0))
        assertNull(besideCaption(bar, emptyList()))
    }

    /**
     * The screen on the list of providers, light, with the map's stand-in reading the chrome's frames; [start] in from
     * the window's leading edge.
     */
    private fun show(direction: LayoutDirection = LayoutDirection.Ltr, start: Dp = 0.dp): ScooterMapController {
        val clock = TestClock()
        val model = DockState.Summary.make(controllers, clock)
        model.setAppearance(ScooterAppearance.Light)
        // Edge to edge, as MainActivity is: the window's insets reach the screen.
        compose.runOnUiThread { WindowCompat.setDecorFitsSystemWindows(compose.activity.window, false) }
        compose.setContent {
            view = LocalView.current
            CompositionLocalProvider(LocalClock provides { clock.now }, LocalLayoutDirection provides direction) {
                Box(Modifier.padding(start = start)) {
                    ScooterMapScreen(controller = model, map = { frames = LocalMapChrome.current!! }, glassBlurs = false)
                }
            }
        }
        compose.waitForIdle()
        return model
    }

    /** A caption bar [height] high with its [buttons], the app's chip among them, as Android gives them. */
    private fun caption(height: Int, buttons: List<Rect>) {
        compose.runOnIdle {
            val insets = WindowInsetsCompat.Builder()
                .setInsets(WindowInsetsCompat.Type.captionBar(), Insets.of(0, height, 0, 0))
                .setBoundingRects(WindowInsetsCompat.Type.captionBar(), buttons)
                .build()
            ViewCompat.dispatchApplyWindowInsets(view.rootView, insets)
        }
        compose.waitForIdle()
    }

    /** The search bar's glass, whose tag is inside its 10 of room at either side. */
    private fun bar(): ScreenRect {
        val bounds = compose.onNodeWithTag(SEARCH_ISLAND_TAG).getBoundsInRoot()
        return ScreenRect(
            bounds.left.value - 10.0,
            bounds.top.value.toDouble(),
            bounds.right.value - bounds.left.value + 20.0,
            (bounds.bottom - bounds.top).value.toDouble(),
        )
    }

    private val ScreenRect.pixels: Rect get() = Rect(minX.toInt(), minY.toInt(), maxX.toInt(), maxY.toInt())

    private fun appearance(): Int = compose.activity.window.insetsController!!.systemBarsAppearance
}
