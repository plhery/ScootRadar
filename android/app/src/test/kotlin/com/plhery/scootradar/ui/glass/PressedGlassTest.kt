package com.plhery.scootradar.ui.glass

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.dock.glassButton
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

// UI-211: a glass control swells to 1.04 under the finger, on the press spring, and back as the finger lifts.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w400dp-h400dp-mdpi")
class PressedGlassTest {
    @get:Rule
    val compose = createComposeRule()

    @Test
    fun aGlassButtonSwellsWhileHeldAndComesBack() {
        show(reduceMotion = false)
        assertEquals(100f, width(), 0.01f)

        compose.onNodeWithTag(BUTTON).performTouchInput { down(center) }
        compose.waitForIdle()
        assertEquals(104f, width(), 0.01f)

        compose.onNodeWithTag(BUTTON).performTouchInput { up() }
        compose.waitForIdle()
        assertEquals(100f, width(), 0.01f)
    }

    /** 80 ms in, about halfway through its spring, it is between its two sizes: it grows on the spring, not at once. */
    @Test
    fun theSwellRunsOnTheSpring() {
        show(reduceMotion = false)
        compose.mainClock.autoAdvance = false
        compose.onNodeWithTag(BUTTON).performTouchInput { down(center) }
        compose.mainClock.advanceTimeBy(80)
        val midway = width()
        assertTrue("$midway wide 80 ms in", midway > 100.5f && midway < 103.5f)
        compose.mainClock.advanceTimeBy(1_000)
        assertEquals(104f, width(), 0.01f)
        compose.mainClock.autoAdvance = true
    }

    /** With Reduce Motion it doesn't grow: it only lights up. */
    @Test
    fun withReduceMotionItStaysItsSize() {
        show(reduceMotion = true)
        compose.onNodeWithTag(BUTTON).performTouchInput { down(center) }
        compose.waitForIdle()
        assertEquals(100f, width(), 0.01f)
    }

    private fun show(reduceMotion: Boolean) {
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = reduceMotion, increasedContrast = false) {
                Box(
                    Modifier
                        .offset(100.dp, 100.dp)
                        .glassButton(CapsuleShape, glass = Modifier.background(Color.White, CapsuleShape)) {}
                        .testTag(BUTTON)
                        .size(100.dp, 40.dp),
                )
            }
        }
        compose.waitForIdle()
    }

    /** The button's width on the screen, scale included. */
    private fun width(): Float = compose.onNodeWithTag(BUTTON).fetchSemanticsNode().boundsInRoot.width

    private companion object {
        const val BUTTON = "button"
    }
}
