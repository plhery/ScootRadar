package com.plhery.scootradar.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.putFramesOnSurfaces
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * [FitOrScroll], as the iPhone's HeightLimit with ViewThatFits: content taller than the limit is cut at it from the
 * frame it grows, as ViewThatFits takes its ScrollView in the same layout pass. The scroll, chosen from the last
 * layout's height, comes a frame later, and that frame drew the content whole past the limit: the search's places as
 * they came, past the foot of the search above the keyboard (UI-212).
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w200dp-h300dp-mdpi")
class FitOrScrollTest {
    @get:Rule
    val compose = createComposeRule()

    private var tall by mutableStateOf(false)

    @Test
    fun contentThatOutgrowsItsLimitIsCutAtItFromTheFrameItGrows() {
        compose.mainClock.autoAdvance = false
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = false) {
                Box(Modifier.fillMaxSize().background(Color.White).testTag(PLACE)) {
                    FitOrScroll(50.dp) {
                        Box(Modifier.size(100.dp, if (tall) 120.dp else 30.dp).background(Color.Red))
                    }
                }
            }
        }
        compose.mainClock.advanceTimeByFrame()
        assertEquals("short, it is plain", emptyList<Unit>(), scrolls())
        assertEquals("its foot", Color.Red to Color.White, pixel(28) to pixel(32))

        tall = true
        // Recomposition sees the change in the next frame, as the app's own changes are seen.
        Snapshot.sendApplyNotifications()
        val grown = List(3) {
            compose.mainClock.advanceTimeByFrame()
            pixel(48) to pixel(52)
        }
        assertEquals("cut at the limit, frame by frame", List(3) { Color.Red to Color.White }, grown)
        assertEquals("tall, it scrolls", 1, scrolls().size)

        tall = false
        Snapshot.sendApplyNotifications()
        compose.mainClock.advanceTimeByFrame()
        compose.mainClock.advanceTimeByFrame()
        assertEquals("short again, it is plain", emptyList<Unit>(), scrolls())
        assertEquals("its foot again", Color.Red to Color.White, pixel(28) to pixel(32))
    }

    /** The colour in the middle of the content's width, [y] dp down. */
    private fun pixel(y: Int): Color {
        compose.putFramesOnSurfaces()
        val image = compose.onNodeWithTag(PLACE).captureToImage().toPixelMap()
        return image[(50 * compose.density.density).toInt(), (y * compose.density.density).toInt()]
    }

    private fun scrolls() = compose.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.VerticalScrollAxisRange))
        .fetchSemanticsNodes().map { }

    private companion object {
        const val PLACE = "place"
    }
}
