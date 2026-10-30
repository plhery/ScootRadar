package com.plhery.scootradar.ui.dock

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.Modifier
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.graphics.Color
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

// UI-207: ScooterControls.swift's ProgressView, which turns under Reduce Motion as UIKit's activity indicator does.

/**
 * The spinner goes round once a second under Android's Remove animations, which the app reads as Reduce Motion: on
 * the Tablet with animations removed it stood still, an animation that the scale of 0 stopped.
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
        compose.mainClock.autoAdvance = false
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                Box(Modifier.background(Color.White).testTag("spinner")) {
                    Spinner(color = Color.Black)
                }
            }
        }
        compose.mainClock.advanceTimeByFrame()
        // An eighth of a second at a time, a turn and a step: a spoke ahead at each.
        val looks = List(10) {
            compose.mainClock.advanceTimeBy(125)
            compose.waitForIdle()
            look()
        }
        assertTrue("${looks.map { ('A' + looks.distinct().indexOf(it)) }.joinToString("")}", looks.zipWithNext().all { (a, b) -> a != b })
        // Eight steps on, a second later, the spinner is as it was.
        assertEquals(looks[0], looks[8])
        assertEquals(looks[1], looks[9])
    }

    /** The spinner's pixels, as one string to compare, its frame put where the capture takes it first. */
    private fun look(): String {
        compose.putFramesOnSurfaces()
        val pixels = compose.onNodeWithTag("spinner").captureToImage().toPixelMap()
        return (0 until pixels.height).joinToString("") { y ->
            (0 until pixels.width).joinToString("") { x -> pixels[x, y].hashCode().toString(36) }
        }
    }
}
