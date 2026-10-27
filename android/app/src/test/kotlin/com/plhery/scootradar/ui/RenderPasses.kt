package com.plhery.scootradar.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.requiredWidth
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.Assert.assertTrue
import java.time.Instant

// The render passes of ios/ScootRadarTests/ScooterMapModelTests.swift and ScooterWalkTests.swift (assertRenders),
// and ImageRenderer's height, which the tests of the dock, the panel and the top of the map share.

/** Dynamic Type's sizes as font scales: each size's body text over the 17 points of Large (ui.md UI-134). */
enum class DynamicTypeSize(bodyPoints: Float) {
    XSmall(14f),
    Small(15f),
    Medium(16f),
    Large(17f),
    XLarge(19f),
    XXLarge(21f),
    XXXLarge(23f),
    Accessibility1(28f),
    Accessibility2(33f),
    Accessibility3(40f),
    Accessibility4(47f),
    Accessibility5(53f),
    ;

    val fontScale: Float = bodyPoints / 17f
}

/** One way a view is drawn: dark or light, at a text size, in a width. */
data class RenderPass(val dark: Boolean, val size: DynamicTypeSize, val width: Dp)

/**
 * Light at the standard text size, dark with very large text, and a narrow phone at the largest size before the
 * layouts for very large text take over; then at both ends of the widths an iPad gives it, in a window narrower
 * than any phone and on a wide one.
 */
val renderPasses = listOf(
    RenderPass(dark = false, DynamicTypeSize.Large, 390.dp),
    RenderPass(dark = true, DynamicTypeSize.Accessibility3, 390.dp),
    RenderPass(dark = false, DynamicTypeSize.XXXLarge, 375.dp),
    RenderPass(dark = false, DynamicTypeSize.Large, 320.dp),
    RenderPass(dark = true, DynamicTypeSize.Accessibility3, 320.dp),
    RenderPass(dark = false, DynamicTypeSize.Large, 466.dp),
    RenderPass(dark = true, DynamicTypeSize.Accessibility3, 466.dp),
)

/**
 * Draws views one at a time, each anew, as ImageRenderer does: in the theme, at a pass's appearance, text size and
 * width, and as tall as it wants to be. [clock] is the time the views read.
 */
class Renderer(private val compose: ComposeContentTestRule, private val clock: () -> Instant = Instant::now) {
    private var shown: (@Composable () -> Unit)? by mutableStateOf(null)
    private var pass by mutableStateOf(renderPasses.first())
    private var drawing by mutableIntStateOf(0)
    private var started = false

    /** The height of `content` drawn in `pass`, in pixels; 0 if it drew nothing. */
    fun height(pass: RenderPass, content: @Composable () -> Unit): Int {
        if (!started) {
            started = true
            compose.setContent { Drawn() }
        }
        this.pass = pass
        shown = content
        drawing += 1
        compose.waitForIdle()
        return compose.onNodeWithTag(TAG, useUnmergedTree = true).fetchSemanticsNode().size.height
    }

    /** assertRenders: `content` has some height in each of the passes. */
    fun assertRenders(name: String, content: @Composable () -> Unit) {
        for (pass in renderPasses) {
            assertTrue("$name, $pass", height(pass, content) > 0)
        }
    }

    @Composable
    private fun Drawn() {
        val density = LocalDensity.current.density
        CompositionLocalProvider(
            LocalDensity provides Density(density, pass.size.fontScale),
            LocalClock provides clock,
        ) {
            ScootTheme(dark = pass.dark, reduceMotion = true) {
                Box(Modifier.wrapContentSize(Alignment.TopStart, unbounded = true).requiredWidth(pass.width).testTag(TAG)) {
                    // A new drawing each time, with nothing remembered from the last.
                    key(drawing) { shown?.invoke() }
                }
            }
        }
    }

    private companion object {
        const val TAG = "rendered"
    }
}
