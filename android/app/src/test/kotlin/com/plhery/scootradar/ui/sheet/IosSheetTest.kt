package com.plhery.scootradar.ui.sheet

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeDown
import androidx.compose.ui.test.swipeUp
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

/** The sheet's heights and the ways it goes: dragged down, the dimmed map tapped, and Back (ui.md UI-208, UI-387). */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w390dp-h844dp-xhdpi")
class IosSheetTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private var isPresented by mutableStateOf(true)
    private var dismissals = 0

    private val sheet = SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, "Filters")

    private fun show(detents: List<SheetDetent>) {
        compose.setContent {
            ScootTheme(dark = false) {
                IosSheet(isPresented, onDismiss = { dismissals += 1; isPresented = false }, detents = detents, title = "Filters") {
                    Box(Modifier.fillMaxSize())
                }
            }
        }
        compose.waitForIdle()
    }

    private val sheetTop get() = compose.onNode(sheet).fetchSemanticsNode().boundsInRoot.top / compose.density.density

    @Test
    fun aSheetOpensHalfwayAndIsPulledUpToTheLargeHeight() {
        show(listOf(SheetDetent.Medium, SheetDetent.Large))
        // Half the large height: (844 − 10) / 2 below the large detent's top.
        assertEquals(844 - 834 / 2f, sheetTop, 1f)

        compose.onNode(sheet).performTouchInput { swipeUp() }
        compose.waitForIdle()
        assertEquals(10f, sheetTop, 1f)
        assertEquals(0, dismissals)
    }

    @Test
    fun aShortWindowsSheetOpensAtTheLargeHeight() {
        show(listOf(SheetDetent.Large))
        assertEquals(10f, sheetTop, 1f)
    }

    @Test
    fun aSheetDraggedDownGoes() {
        show(listOf(SheetDetent.Medium, SheetDetent.Large))
        compose.onNode(sheet).performTouchInput { swipeDown(endY = bottom + 400.dp.toPx()) }
        compose.waitForIdle()
        assertEquals(1, dismissals)
        assertTrue(compose.onAllNodes(sheet).fetchSemanticsNodes().isEmpty())
    }

    @Test
    fun tappingTheDimmedMapClosesTheSheet() {
        show(listOf(SheetDetent.Medium, SheetDetent.Large))
        compose.onNodeWithContentDescription("Close").performClick()
        compose.waitForIdle()
        assertEquals(1, dismissals)
        assertFalse(isPresented)
    }

    @Test
    fun backClosesTheSheet() {
        show(listOf(SheetDetent.Large))
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.onBackPressed() }
        compose.waitForIdle()
        assertEquals(1, dismissals)
        assertTrue(compose.onAllNodes(sheet).fetchSemanticsNodes().isEmpty())
    }

    @Test
    fun aSheetItsPresenterClosesGoesWithoutTellingIt() {
        show(listOf(SheetDetent.Large))
        isPresented = false
        compose.waitForIdle()
        assertEquals(0, dismissals)
        assertTrue(compose.onAllNodes(sheet).fetchSemanticsNodes().isEmpty())
    }
}
