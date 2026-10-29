package com.plhery.scootradar.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.InputModeManager
import androidx.compose.ui.input.key.Key
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
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.dock.DockActionButton
import com.plhery.scootradar.ui.dock.focusableControl
import com.plhery.scootradar.ui.dock.glassButton
import com.plhery.scootradar.ui.dock.plainButton
import com.plhery.scootradar.ui.settings.FormRow
import com.plhery.scootradar.ui.settings.FormSection
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
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

    /** On the tint, where a ring in the tint couldn't be seen, the prominent button's ring is white, as its label is. */
    @Test
    fun aProminentButtonIsRingedInWhite() {
        show(dark = false) {
            DockActionButton(prominent = true, onClick = {}, modifier = Modifier.offset(30.dp, 30.dp).width(200.dp).height(80.dp).testTag(BUTTON)) {
                Text("Open in Lime")
            }
        }
        reachWithKeyboard()
        assertColor(Color.White, at = 31 to 70)
        assertColor(ScootColors.Light.cardActionFill, at = 36 to 70)
    }

    /**
     * A glass button pressed from the keyboard swells to 1.04 under its ring, which swells with it and stays on its
     * edge (UI-211), and comes back as the key is let go.
     */
    @Test
    fun aPressedGlassButtonsRingSwellsWithIt() {
        show(dark = false) {
            Box(Modifier.offset(50.dp, 50.dp).testTag(BUTTON).glassButton(CircleShape, glass = Modifier.background(Color.White, CircleShape)) {}.size(100.dp))
        }
        reachWithKeyboard()
        // At rest the ring runs 3 points in from the edge at 50; outside it, the ground.
        assertColor(ScootColors.Light.accent, at = 51 to 100)
        assertColor(Color.White, at = 49 to 100)

        compose.onNodeWithTag(BUTTON).performKeyInput { keyDown(Key.Enter) }
        // Swollen to 104 points across, its edge at 48: the ring is on it, over the point outside it at rest.
        assertColor(ScootColors.Light.accent, at = 49 to 100)

        compose.onNodeWithTag(BUTTON).performKeyInput { keyUp(Key.Enter) }
        assertColor(Color.White, at = 49 to 100)
        assertColor(ScootColors.Light.accent, at = 51 to 100)
    }

    /** A control that takes its own touches, as the panel's grabber does, is ringed too. */
    @Test
    fun aFocusableControlIsRinged() {
        show(dark = false) {
            Box(Modifier.offset(30.dp, 30.dp).size(40.dp).testTag(BUTTON).focusableControl {}.background(Color.White))
        }
        reachWithKeyboard()
        assertColor(ScootColors.Light.accent, at = 31 to 50)
    }

    /**
     * A section's first row is ringed round its top corners as the section rounds them, inside its clip: a ring
     * cornered as a lone row would be is cut there.
     */
    @Test
    fun aSectionsFirstRowIsRingedRoundTheSectionsCorner() {
        show(dark = false) {
            FormSection(
                rows = listOf<@androidx.compose.runtime.Composable () -> Unit>(
                    { FormRow(Modifier.testTag(BUTTON), onClick = {}) { Text("Language") } },
                    { FormRow(onClick = {}) { Text("Appearance") } },
                ),
            )
        }
        reachWithKeyboard()
        // The section stands 16 in from the ground's sides and 20 below its top.
        assertColor(ScootColors.Light.accent, at = 150 to 21)
        val diagonal = (0..24).map { color(at = 16 + it to 20 + it) }
        assertTrue(diagonal.toString(), diagonal.any { close(it, ScootColors.Light.accent, within = 24) })
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

    private fun close(a: Color, b: Color, within: Int = 2): Boolean =
        abs(a.red - b.red) * 255 <= within && abs(a.green - b.green) * 255 <= within && abs(a.blue - b.blue) * 255 <= within

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
