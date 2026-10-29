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
