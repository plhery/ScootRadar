package com.plhery.scootradar.ui.sheet

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import kotlin.math.abs

/**
 * The form sheet beside a panel rises and goes down on the system sheet's spring to its very end, a pixel at most from
 * where it stops in its last frame, as an iPhone sheet settles (UI-208): a spring that ended at Compose's default 0.01
 * of the way left the last 8 of the 710 it rises here, and 16 to 21 px on the Fold and the Tablet, to one frame.
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w1280dp-h800dp-mdpi")
class IosFormSheetTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private var isPresented by mutableStateOf(false)

    @Test
    fun theFormSheetRisesAndGoesDownWithoutALastFrameJump() {
        compose.mainClock.autoAdvance = false
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = false) {
                IosFormSheet(isPresented, onDismiss = { isPresented = false }, title = "Settings") { Box(Modifier.fillMaxSize()) }
            }
        }
        compose.mainClock.advanceTimeByFrame()

        compose.runOnUiThread { isPresented = true }
        val rising = tops().filterNotNull()
        // In the middle up and down: (800 - 620) / 2.
        assertEquals("at rest: $rising", 90f, rising.last(), 0.01f)
        assertTrue("risen from below: $rising", rising.first() > 400f)
        // Placed on whole pixels, the sheet's last step is one at most.
        assertTrue("the last step up, a pixel at most: ${steps(rising)}", steps(rising).last() <= 1f)

        compose.runOnUiThread { isPresented = false }
        val going = tops()
        assertEquals("gone: $going", null, going.last())
        val lastShown = going.filterNotNull().last()
        assertTrue("its last frame shown a pixel at most above the window's foot: $going", lastShown >= 800f - 1)
    }

    /** The sheet's top in dp, each frame for two seconds; null once it is gone. */
    private fun tops(): List<Float?> = List(120) {
        compose.mainClock.advanceTimeByFrame()
        val nodes = compose.onAllNodesWithTag(FORM_SHEET_TAG).fetchSemanticsNodes()
        if (nodes.isEmpty()) null else compose.onNodeWithTag(FORM_SHEET_TAG).fetchSemanticsNode().boundsInRoot.top
    }

    /** How far the sheet moves from each frame to the next, as long as it moves. */
    private fun steps(tops: List<Float>): List<Float> =
        tops.zipWithNext { a, b -> abs(b - a) }.dropLastWhile { it == 0f }
}
