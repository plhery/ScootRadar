package com.plhery.scootradar.ui.dock

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.Modifier
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.putFramesOnSurfaces
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

// UI-207: ScooterControls.swift's ProgressView, which turns under Reduce Motion as UIKit's activity indicator does.

/**
 * The spinner goes round once a second under Android's Remove animations, which the app reads as Reduce Motion: on
 * the Tablet with animations removed it stood still, an animation that the scale of 0 stopped. Its brightest spoke
 * goes round clockwise, as UIKit's does.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w200dp-h200dp-mdpi")
class SpinnerTest {
    /** Remove animations: the scale Compose's animations read from the system, at 0. */
    @get:Rule
    val compose = createComposeRule(effectContext = object : MotionDurationScale {
        override val scaleFactor = 0f
    })

    @Test
    fun underRemoveAnimationsTheSpinnerGoesRoundOnceASecond() {
        show()
        // An eighth of a second at a time, a turn and a step: a spoke ahead at each.
        val looks = List(10) {
            compose.mainClock.advanceTimeBy(125)
            compose.waitForIdle()
            look()
        }
        val letters = looks.map { 'A' + looks.distinct().indexOf(it) }.joinToString("")
        assertTrue(letters, looks.zipWithNext().all { (a, b) -> a != b })
        // Eight looks in a second, each its own: not round twice a second, which shows four.
        assertEquals(letters, 8, looks.take(8).distinct().size)
        // Eight steps on, a second later, the spinner is as it was.
        assertEquals(looks[0], looks[8])
        assertEquals(looks[1], looks[9])
    }

    /**
     * The brightest spoke goes one spoke clockwise each eighth of a second, as UIKit's activity indicator turns. Drawn at
     * four pixels to the point, so that each spoke's shade is read clear of its neighbours'.
     */
    @Test
    @Config(qualifiers = "w200dp-h200dp-xxxhdpi")
    fun theBrightestSpokeGoesRoundClockwiseASpokeAnEighthOfASecond() {
        show()
        val heads = List(10) {
            compose.mainClock.advanceTimeBy(125)
            compose.waitForIdle()
            brightestSpoke()
        }
        // How many spokes on, clockwise, from one look to the next.
        val steps = heads.zipWithNext { a, b -> (b - a + SPOKES) % SPOKES }
        assertTrue("the brightest spoke at $heads, clockwise steps $steps", steps.all { it == 1 })
    }

    /** The spinner, black on white, on its first frame, the clock then left to the test. */
    private fun show() {
        compose.mainClock.autoAdvance = false
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                Box(Modifier.background(Color.White).testTag("spinner")) {
                    Spinner(color = Color.Black)
                }
            }
        }
        compose.mainClock.advanceTimeByFrame()
    }

    /** The spinner's pixels, its frame put where the capture takes it first. */
    private fun pixels(): PixelMap {
        compose.putFramesOnSurfaces()
        return compose.onNodeWithTag("spinner").captureToImage().toPixelMap()
    }

    /** The spinner's pixels, as one string to compare. */
    private fun look(): String {
        val pixels = pixels()
        return (0 until pixels.height).joinToString("") { y ->
            (0 until pixels.width).joinToString("") { x -> pixels[x, y].hashCode().toString(36) }
        }
    }

    /**
     * The darkest of the eight spokes, black on white, counted clockwise from the one at the top: the shade along each
     * spoke's middle, from a little out of its inner end to a little in from its outer one.
     */
    private fun brightestSpoke(): Int {
        val pixels = pixels()
        val centre = pixels.width / 2f
        val outer = pixels.width / 2f
        val darkness = List(SPOKES) { spoke ->
            val angle = Math.toRadians(spoke * 360.0 / SPOKES)
            (0..5).sumOf { step ->
                val radius = outer * (0.56 + step * 0.05)
                val x = (centre + radius * sin(angle)).roundToInt()
                val y = (centre - radius * cos(angle)).roundToInt()
                val color = pixels[x, y]
                1.0 - (color.red + color.green + color.blue) / 3.0
            }
        }
        return darkness.indices.maxBy { darkness[it] }
    }

    private companion object {
        const val SPOKES = 8
    }
}
