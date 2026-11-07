package com.plhery.scootradar.map

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.github.takahirom.roborazzi.captureRoboImage
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.ui.theme.Look
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.drawWindowAgain
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.screenshotOptions
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

// MAP-270: the callout MapKit shows over the searched place's pin once it is tapped, with the place's title.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class PinCalloutTest {
    @get:Rule
    val compose = createComposeRule()

    /**
     * Its arrow on the top of the pin, the bubble over it; it follows the pin as the map moves, inside the map as far
     * as its arrow stays under its straight edge, and out of it with the pin, as MapKit's callout hangs from its pin.
     */
    @Test
    fun itPointsAtThePinAndFollowsIt() {
        var anchor by mutableStateOf(ScreenPoint(150.0, 200.0))
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                Box(Modifier.size(300.dp, 400.dp)) {
                    PinCallout("Bahnhofplatz", anchor = { anchor }, dark = false)
                }
            }
        }
        compose.onNodeWithText("Bahnhofplatz").assertExists()
        val bubble = compose.onNodeWithTag(CALLOUT_TAG).getBoundsInRoot()
        // Centred over the pin, 2 above it, the arrow 10 tall between.
        assertEquals(150f, (bubble.left + bubble.right).value / 2, 1f)
        assertEquals(200f - 2 - 10 + 1, bubble.bottom.value, 1f)

        // Near the map's side it keeps 8 inside.
        anchor = ScreenPoint(30.0, 200.0)
        compose.waitForIdle()
        assertEquals(8f, compose.onNodeWithTag(CALLOUT_TAG).getBoundsInRoot().left.value, 0.5f)
        // At the side, only as far as the arrow, 10 either side of the pin, stays clear of the 12 corner.
        anchor = ScreenPoint(4.0, 200.0)
        compose.waitForIdle()
        assertEquals(4f - 10 - 12, compose.onNodeWithTag(CALLOUT_TAG).getBoundsInRoot().left.value, 0.5f)
        // The pin out of the map, either side, the bubble goes with it.
        anchor = ScreenPoint(-150.0, 200.0)
        compose.waitForIdle()
        val leftOut = compose.onNodeWithTag(CALLOUT_TAG).getBoundsInRoot()
        assertEquals(-150f - 10 - 12, leftOut.left.value, 0.5f)
        assertTrue("$leftOut", leftOut.right.value < 0)
        anchor = ScreenPoint(450.0, 200.0)
        compose.waitForIdle()
        val rightOut = compose.onNodeWithTag(CALLOUT_TAG).getBoundsInRoot()
        assertEquals(450f + 10 + 12, rightOut.right.value, 0.5f)
        assertTrue("$rightOut", rightOut.left.value > 300)
    }

    /**
     * A faded scooter's tip hangs over its dot, as the pin's callout does, unless it would reach within 8 of the top
     * of the room over the dot, under the status bar or the chrome: then it goes under the dot, its arrow pointing up
     * at the dot's foot, as the iPhone's does (ScooterMapView.placeFadedTip).
     */
    @Test
    fun aFadedScootersTipGoesUnderItsDotWithoutRoomOverIt() {
        var anchor by mutableStateOf(ScreenPoint(150.0, 300.0))
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                Box(Modifier.size(300.dp, 400.dp)) {
                    PinCallout(
                        "Lime · last seen 14:02",
                        anchor = { anchor },
                        dark = false,
                        subtitle = "May have moved since",
                        below = { CalloutBelow(ScreenPoint(anchor.x, anchor.y + 10), ceiling = 100.0) },
                    )
                }
            }
        }
        compose.onNodeWithText("May have moved since").assertExists()
        val over = compose.onNodeWithTag(CALLOUT_TAG).getBoundsInRoot()
        // Room over it: over the dot, 2 above it, the arrow 10 tall between.
        assertEquals(300f - 2 - 10 + 1, over.bottom.value, 1f)
        val height = (over.bottom - over.top).value
        assertTrue("two lines: $over", height > 40)
        // Its top within 8 of the room's: under the dot, 2 under its foot, the arrow between, centred on it still.
        anchor = ScreenPoint(150.0, 100.0 + 8 + 2 + 10 - 1 + height - 2)
        compose.waitForIdle()
        val under = compose.onNodeWithTag(CALLOUT_TAG).getBoundsInRoot()
        assertEquals(anchor.y.toFloat() + 10 + 2 + 10 - 1, under.top.value, 1f)
        assertEquals(150f, (under.left + under.right).value / 2, 1f)
        assertEquals(height, (under.bottom - under.top).value, 0.5f)
        // Off the top of the map, under it too, inside the map's sides as over it.
        anchor = ScreenPoint(40.0, 30.0)
        compose.waitForIdle()
        val corner = compose.onNodeWithTag(CALLOUT_TAG).getBoundsInRoot()
        assertEquals(30f + 10 + 2 + 10 - 1, corner.top.value, 1f)
        assertEquals(8f, corner.left.value, 0.5f)
    }

    /** The pin's callout hangs over the pin wherever it is, however near the top of the map. */
    @Test
    fun thePinsCalloutStaysOverThePin() {
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                Box(Modifier.size(300.dp, 400.dp)) {
                    PinCallout("Bahnhofplatz", anchor = { ScreenPoint(150.0, 20.0) }, dark = false)
                }
            }
        }
        assertEquals(20f - 2 - 10 + 1, compose.onNodeWithTag(CALLOUT_TAG).getBoundsInRoot().bottom.value, 1f)
    }

    /** The rule, in pixels: over what it points at, or under it given a place there and no room over it. */
    @Test
    fun aCalloutGoesUnderWhatItPointsAtOnlyWhenItIsToldWhereAndHasNoRoomOverIt() {
        fun place(x: Int = 150, tip: Int = 200, tipBelow: Int? = null, ceiling: Int? = null) = CalloutPlacement.place(
            x = x,
            tip = tip,
            tipBelow = tipBelow,
            ceiling = ceiling,
            bubble = IntSize(200, 60),
            arrow = IntSize(20, 10),
            width = 300,
            margin = 8,
            corner = 12,
        )
        // The arrow's tip at the tip, the bubble over the arrow, a pixel into it, so that no seam shows.
        assertEquals(CalloutPlacement.Placed(IntOffset(50, 131), IntOffset(140, 190), isBelow = false), place())
        // Without a place under it, over it however high.
        assertEquals(-49, place(tip = 20).bubble.y)
        assertFalse(place(tip = 20, ceiling = 100).isBelow)
        // With room to the ceiling and 8 more, over it; a pixel less, under it, the arrow's tip at its place there,
        // the bubble under the arrow, a pixel into it.
        assertFalse(place(tipBelow = 220, ceiling = 123).isBelow)
        assertEquals(CalloutPlacement.Placed(IntOffset(50, 229), IntOffset(140, 220), isBelow = true), place(tipBelow = 220, ceiling = 124))
        // Inside the map's sides, under it as over it.
        assertEquals(8, place(x = 30).bubble.x)
        assertEquals(8, place(x = 30, tipBelow = 220, ceiling = 500).bubble.x)
        assertEquals(20, place(x = 30, tipBelow = 220, ceiling = 500).arrow.x)
    }

    /** A long title on one line, cut short inside the map. */
    @Test
    fun aLongTitleIsCutShort() {
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                Box(Modifier.size(300.dp, 400.dp)) {
                    PinCallout("Bahnhofplatz, Bern, Bern-Mittelland, Bern, Schweiz", anchor = { ScreenPoint(150.0, 200.0) }, dark = false)
                }
            }
        }
        val bubble = compose.onNodeWithTag(CALLOUT_TAG).getBoundsInRoot()
        assertTrue("$bubble", bubble.left.value >= 8 - 0.5 && bubble.right.value <= 292 + 0.5)
        assertTrue("one line: $bubble", (bubble.bottom - bubble.top).value < 50)
    }
}

/** The callout over a pin, light and dark, at font scale 1.0 and 2.0. */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class PinCalloutScreenshotTest(private val look: Look) {
    @get:Rule
    val compose = createComposeRule()

    @After
    fun tearDown() {
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    @Test
    fun bahnhofplatz() {
        useFontScale(look.fontScale)
        compose.setContent {
            ScootTheme(dark = look.dark, reduceMotion = true) {
                Box(Modifier.testTag(FRAME).size(300.dp, 140.dp).background(ground(look.dark))) {
                    PinCallout("Bahnhofplatz", anchor = { ScreenPoint(150.0, 130.0) }, dark = look.dark)
                }
            }
        }
        compose.waitForIdle()
        compose.drawWindowAgain()
        compose.onNodeWithTag(FRAME).captureRoboImage("src/test/screenshots/callout/bahnhofplatz_${look.suffix}.png", roborazziOptions = screenshotOptions)
    }

    companion object {
        private const val FRAME = "frame"

        /** The calm ground's land, day and night (src/lib/quietGround.ts). */
        private fun ground(dark: Boolean) = if (dark) Color(0xFF0B0E14) else Color(0xFFEEF0F4)

        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun parameters(): List<Array<Any>> = Look.entries.map { arrayOf(it) }
    }
}
