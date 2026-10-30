package com.plhery.scootradar.ui.sheet

import android.view.KeyEvent as AndroidKeyEvent
import androidx.activity.ComponentActivity
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.click
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeDown
import androidx.compose.ui.test.swipeUp
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterProviderEntry
import com.plhery.scootradar.ui.filters.FilterSheetContent
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

/** The sheet's heights and the ways it goes: dragged down, the dimmed map tapped, Back and Esc (ui.md UI-208, UI-387). */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w390dp-h844dp-xhdpi")
class IosSheetTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private var isPresented by mutableStateOf(true)
    private var detents by mutableStateOf(listOf(SheetDetent.Medium, SheetDetent.Large))
    private var dismissals = 0
    private var mapTaps = 0

    private val sheet = SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, "Filters")

    private fun show(detents: List<SheetDetent>, content: @Composable () -> Unit = { Box(Modifier.fillMaxSize()) }) {
        this.detents = detents
        compose.setContent {
            ScootTheme(dark = false) {
                // The map under the sheet, which counts the taps that reach it.
                Box(Modifier.fillMaxSize().testTag("map").clickable { mapTaps += 1 })
                IosSheet(isPresented, onDismiss = { dismissals += 1; isPresented = false }, detents = this.detents, title = "Filters") {
                    content()
                }
            }
        }
        compose.waitForIdle()
    }

    /** A list taller than the sheet. */
    @Composable
    private fun LongList() {
        Column(Modifier.fillMaxSize().testTag("list").verticalScroll(rememberScrollState())) {
            repeat(40) { Box(Modifier.fillMaxWidth().height(60.dp)) }
        }
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

    /**
     * A hardware keyboard's Esc closes it, as it closes the form and the popover a larger window has. API 31's key maps
     * made an Esc nothing took Back, which closed it; API 37's don't, and nothing did (review-app-t finding 10).
     */
    @Test
    fun escClosesTheSheet() {
        show(listOf(SheetDetent.Large))
        compose.runOnUiThread {
            for (action in listOf(AndroidKeyEvent.ACTION_DOWN, AndroidKeyEvent.ACTION_UP)) {
                compose.activity.dispatchKeyEvent(AndroidKeyEvent(action, AndroidKeyEvent.KEYCODE_ESCAPE))
            }
        }
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

    @Test
    fun aListInTheSheetIsScrolledAndLetGo() {
        show(listOf(SheetDetent.Medium, SheetDetent.Large)) { LongList() }
        // Pushed up, the list raises the sheet before it scrolls; pulled down, it scrolls back and lowers the sheet.
        compose.onNodeWithTag("list").performTouchInput { swipeUp() }
        compose.waitForIdle()
        assertEquals(10f, sheetTop, 1f)
        compose.onNodeWithTag("list").performTouchInput { swipeUp() }
        compose.waitForIdle()
        compose.onNodeWithTag("list").performTouchInput { swipeDown(endY = top + 100.dp.toPx()) }
        compose.waitForIdle()
        compose.onNodeWithTag("list").performTouchInput { swipeDown(endY = bottom) }
        compose.waitForIdle()
        assertTrue(isPresented || dismissals == 1)
    }

    @Test
    fun theFiltersListIsScrolledAndLetGo() {
        val entries = ScooterProvider.entries.take(12).map {
            ScooterProviderEntry(provider = it, count = 3, isEnabled = true, isSelected = false, isDown = false)
        }
        show(listOf(SheetDetent.Medium, SheetDetent.Large)) {
            FilterSheetContent(
                minimumBattery = 0,
                entries = entries,
                hasActiveFilters = false,
                showResults = "Show 36 scooters",
                bottomInset = 0.dp,
                onChooseMinimum = {},
                onToggle = {},
                onReset = {},
                onDone = {},
            )
        }
        val list = compose.onNode(SemanticsMatcher.keyIsDefined(SemanticsProperties.VerticalScrollAxisRange))
        list.performTouchInput { swipeUp() }
        compose.waitForIdle()
        list.performTouchInput { swipeUp() }
        compose.waitForIdle()
        assertEquals(10f, sheetTop, 1f)
        // Half the sheet's height: back up the list, then the sheet some way down, and it settles.
        list.performTouchInput { swipeDown(endY = centerY) }
        compose.waitForIdle()
        assertEquals(0, dismissals)
    }

    @Test
    fun aSheetClosedAsItOpensLetsTheMapBeTapped() {
        compose.mainClock.autoAdvance = false
        show(listOf(SheetDetent.Medium, SheetDetent.Large))
        compose.mainClock.advanceTimeBy(150)
        // The dimmed map, above the rising sheet.
        compose.onNodeWithTag("map").performTouchInput { click(Offset(centerX, 60.dp.toPx())) }
        compose.mainClock.advanceTimeByFrame()
        assertEquals(1, dismissals)
        assertFalse(isPresented)
        assertEquals(0, mapTaps)

        compose.mainClock.advanceTimeBy(1_000)
        assertTrue(compose.onAllNodes(sheet).fetchSemanticsNodes().isEmpty())
        compose.onNodeWithTag("map").performTouchInput { click(Offset(centerX, 60.dp.toPx())) }
        compose.mainClock.advanceTimeBy(100)
        assertEquals(1, mapTaps)
        assertEquals(1, dismissals)
    }

    @Test
    fun backAsTheSheetOpensClosesIt() {
        compose.mainClock.autoAdvance = false
        show(listOf(SheetDetent.Medium, SheetDetent.Large))
        compose.mainClock.advanceTimeBy(150)
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.onBackPressed() }
        compose.mainClock.advanceTimeBy(1_000)
        assertEquals(1, dismissals)
        assertTrue(compose.onAllNodes(sheet).fetchSemanticsNodes().isEmpty())
        assertFalse(compose.activity.onBackPressedDispatcher.hasEnabledCallbacks())
    }

    @Test
    fun aSheetWhoseDetentGoesWithARotationRisesToTheLargeHeight() {
        show(listOf(SheetDetent.Medium, SheetDetent.Large))
        assertEquals(844 - 834 / 2f, sheetTop, 1f)
        // A landscape window is too short for the medium detent (ScooterMapScreen's Filters).
        detents = listOf(SheetDetent.Large)
        compose.waitForIdle()
        assertEquals(10f, sheetTop, 1f)
        assertEquals(0, dismissals)

        detents = listOf(SheetDetent.Medium, SheetDetent.Large)
        compose.waitForIdle()
        assertEquals(10f, sheetTop, 1f)
    }

    @Test
    fun theGrabberTakesTheSheetToItsOtherHeightForTalkBack() {
        show(listOf(SheetDetent.Medium, SheetDetent.Large))
        val grabber = compose.onNodeWithContentDescription("Sheet Grabber")
        grabber.assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Half screen"))
        grabber.performSemanticsAction(SemanticsActions.OnClick)
        compose.waitForIdle()
        assertEquals(10f, sheetTop, 1f)
        grabber.assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Expanded"))
        grabber.performSemanticsAction(SemanticsActions.OnClick)
        compose.waitForIdle()
        assertEquals(844 - 834 / 2f, sheetTop, 1f)
        assertEquals(0, dismissals)
    }

    @Test
    fun theGrabberOfASheetWithOneHeightClosesIt() {
        show(listOf(SheetDetent.Large))
        compose.onNodeWithContentDescription("Sheet Grabber").performSemanticsAction(SemanticsActions.OnClick)
        compose.waitForIdle()
        assertEquals(1, dismissals)
        assertTrue(compose.onAllNodes(sheet).fetchSemanticsNodes().isEmpty())
    }

    @Test
    fun aSheetPulledUpPastTheLargeHeightStretchesAndSpringsBack() {
        show(listOf(SheetDetent.Large))
        compose.onNode(sheet).performTouchInput {
            down(Offset(centerX, 100.dp.toPx()))
            repeat(20) { moveBy(Offset(0f, -20.dp.toPx())) }
        }
        compose.waitForIdle()
        // Never into the room above it, and less and less: 400 dp of travel take it up most of the 10 dp.
        assertTrue("$sheetTop", sheetTop in 0f..5f)
        compose.onNode(sheet).performTouchInput { up() }
        compose.waitForIdle()
        assertEquals(10f, sheetTop, 1f)
        assertEquals(0, dismissals)
    }
}
