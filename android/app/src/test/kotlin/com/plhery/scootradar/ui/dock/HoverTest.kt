package com.plhery.scootradar.ui.dock

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performMouseInput
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.drawWindowAgain
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.math.abs

// UI-233: iPadOS's pointer highlights the button it is over. A mouse's or a trackpad's pointer dims the app's own
// controls, through Compose's hover interaction, half as far as the finger does.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w400dp-h400dp-mdpi")
@OptIn(ExperimentalTestApi::class)
class HoverTest {
    @get:Rule
    val compose = createComposeRule()

    /**
     * A black plain button on white: 0.7 under the pointer, where the finger takes it to 0.4, and back as the pointer
     * moves off it.
     */
    @Test
    fun aPlainButtonDimsUnderThePointerHalfAsFarAsUnderTheFinger() {
        compose.setContent {
            Box(Modifier.size(100.dp).background(Color.White).testTag("ground")) {
                Box(Modifier.size(40.dp).testTag("button").plainButton {}.background(Color.Black))
            }
        }
        assertRed(0f)
        compose.onNodeWithTag("button").performMouseInput { enter(center) }
        // 30% of the white through it.
        assertRed(77f)
        compose.onNodeWithTag("ground").performMouseInput { moveTo(Offset(80f, 80f)) }
        assertRed(0f)
    }

    /** The panel's grabber has no button of its own: its handle dims as under the finger, but less. */
    @Test
    fun thePanelsGrabberDimsUnderThePointer() {
        compose.setContent {
            ScootTheme(dark = false) {
                Box(Modifier.size(100.dp).background(Color.White).testTag("ground")) {
                    PanelGrabber(isFolded = false, setFolded = {}, modifier = Modifier.width(100.dp))
                }
            }
        }
        settle { red(at = 50 to 22) < 255 }
        val handle = red(at = 50 to 22)
        assertTrue("$handle", handle < 255)
        compose.onNodeWithTag(PANEL_GRABBER_TAG).performMouseInput { enter(center) }
        // 0.7 of it over the white behind it, where the finger leaves 0.4.
        assertRed(255 - (255 - handle) * 0.7f, tolerance = 1.5f, at = 50 to 22)
    }

    /**
     * The red of the ground's pixel at [at] is [expected], within [tolerance], once the window has drawn it: within a
     * second, as Robolectric can draw a frame after the one asked for.
     */
    private fun assertRed(expected: Float, tolerance: Float = 1f, at: Pair<Int, Int> = 20 to 20) {
        settle { abs(red(at) - expected) <= tolerance }
        assertEquals(expected, red(at).toFloat(), tolerance)
    }

    /** Waits up to a second for [drawn], and leaves it to the assertion after to say what it found if it never is. */
    private fun settle(drawn: () -> Boolean) {
        runCatching { compose.waitUntil(timeoutMillis = 1_000, condition = drawn) }
    }

    /**
     * The red of the ground's pixel at [at], in pixels from its top left, with the window drawn again first: Robolectric
     * can capture a frame from before, as `putFramesOnSurfaces` says.
     */
    private fun red(at: Pair<Int, Int> = 20 to 20): Int {
        compose.drawWindowAgain()
        val pixels = compose.onNodeWithTag("ground").captureToImage().toPixelMap()
        return Math.round(pixels[at.first, at.second].red * 255)
    }
}
