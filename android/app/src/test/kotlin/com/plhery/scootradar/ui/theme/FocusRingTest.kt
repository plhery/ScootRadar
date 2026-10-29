package com.plhery.scootradar.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.InputModeManager
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.assertIsNotFocused
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.click
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.dock.DockActionButton
import com.plhery.scootradar.ui.dock.plainButton
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.math.abs

// UI-251: a hardware keyboard reaches each control with Tab, and iPadOS rings the one it is on in the app's tint.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w400dp-h400dp-mdpi")
@OptIn(ExperimentalTestApi::class)
class FocusRingTest {
    @get:Rule
    val compose = createComposeRule()

    /** A plain button, white on white, shows nothing until a keyboard reaches it, then a ring in the tint along its edge. */
    @Test
    fun aPlainButtonIsRingedInTheTintOnceAKeyboardReachesIt() {
        show(dark = false) {
            Box(Modifier.offset(30.dp, 30.dp).size(40.dp).testTag(BUTTON).plainButton {}.background(Color.White))
        }
        assertColor(Color.White, at = 31 to 50)

        reachWithKeyboard()
        // The ring is 3 points wide, just inside the button's edge: round, as the button is square.
        assertColor(ScootColors.Light.accent, at = 31 to 50)
        assertColor(ScootColors.Light.accent, at = 50 to 31)
        assertColor(Color.White, at = 35 to 50)
        // The corner a square ring would have, outside the round one.
        assertColor(Color.White, at = 31 to 31)
    }

    /** A finger never rings a button: clickables take focus from a keyboard only. */
    @Test
    fun aFingerLeavesTheButtonUnringed() {
        var taps = 0
        show(dark = false) {
            Box(Modifier.offset(30.dp, 30.dp).size(40.dp).testTag(BUTTON).plainButton { taps++ }.background(Color.White))
        }
        compose.onNodeWithTag(BUTTON).performTouchInput { click(center) }
        compose.waitForIdle()
        assertEquals(1, taps)
        compose.onNodeWithTag(BUTTON).assertIsNotFocused()
        assertColor(Color.White, at = 31 to 50)
    }

    /** The dock's action buttons clip to their shape, and their ring, inside it, is whole: in the dark's tint too. */
    @Test
    fun aDockActionButtonIsRingedInsideItsClip() {
        show(dark = true) {
            DockActionButton(prominent = false, onClick = {}, modifier = Modifier.offset(30.dp, 30.dp).width(200.dp).height(80.dp).testTag(BUTTON)) {
                Text("Filters")
            }
        }
        val fill = color(at = 31 to 70)
        reachWithKeyboard()
        assertColor(ScootColors.Dark.accent, at = 31 to 70)
        assertColor(fill, at = 36 to 70)
    }

    private lateinit var inputMode: InputModeManager

    private fun show(dark: Boolean, content: @androidx.compose.runtime.Composable () -> Unit) {
        compose.setContent {
            inputMode = LocalInputModeManager.current
            ScootTheme(dark = dark) {
                Box(Modifier.size(300.dp).background(Color.White).testTag(GROUND)) { content() }
            }
        }
    }

    /**
     * The button focused as Tab focuses it: a hardware key puts the window in keyboard mode, in which a clickable takes
     * the focus, as it doesn't under a finger.
     */
    private fun reachWithKeyboard() {
        compose.runOnUiThread { inputMode.requestInputMode(InputMode.Keyboard) }
        compose.onNodeWithTag(BUTTON).requestFocus()
        compose.onNodeWithTag(BUTTON).assertIsFocused()
    }

    /** The ground's pixel at [at] is [expected], once the window has drawn it: within a second, as HoverTest waits. */
    private fun assertColor(expected: Color, at: Pair<Int, Int>) {
        runCatching { compose.waitUntil(timeoutMillis = 1_000) { close(color(at), expected) } }
        val actual = color(at)
        assertEquals("$actual at $at", true, close(actual, expected))
    }

    private fun close(a: Color, b: Color): Boolean =
        abs(a.red - b.red) * 255 <= 2 && abs(a.green - b.green) * 255 <= 2 && abs(a.blue - b.blue) * 255 <= 2

    /** The ground's pixel at [at], in pixels from its top left, with the window drawn again first. */
    private fun color(at: Pair<Int, Int>): Color {
        val view = (compose.onRoot().fetchSemanticsNode().root as ViewRootForTest).view
        compose.runOnUiThread {
            view.rootView.invalidate()
            view.invalidate()
        }
        compose.waitForIdle()
        return compose.onNodeWithTag(GROUND).captureToImage().toPixelMap()[at.first, at.second]
    }

    private companion object {
        const val GROUND = "ground"
        const val BUTTON = "button"
    }
}
