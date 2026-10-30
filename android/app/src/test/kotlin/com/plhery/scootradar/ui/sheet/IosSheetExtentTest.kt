package com.plhery.scootradar.ui.sheet

import androidx.activity.ComponentActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeDown
import androidx.compose.ui.test.swipeUp
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.drawWindowAgain
import com.plhery.scootradar.ui.theme.scootColors
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * How far down the sheet is drawn at each of its heights, and what shows under it: at the medium height it floats 8
 * above the screen's foot over the dimmed map, at the large one, and pulled past it, it reaches the foot with nothing
 * of the map below it, and dragged below the medium height it keeps that height as it slides off (ui.md UI-208,
 * UI-387). A sheet measured at the medium height and placed at the large one ended at the medium's line, the map and
 * the dock showing under it (app-t). Held between the two heights it is between in all, and a fling carries it on.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class IosSheetExtentTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val sheet = SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, "Settings")

    private var sheetColor = Color.Unspecified

    /** The sheet's content as laid out, which fills the sheet: its top and height, in pixels. */
    private var contentTop = 0f
    private var contentHeight = 0

    private val px get() = compose.density.density
    private val window get() = compose.onRoot().fetchSemanticsNode().size
    private val bounds: Rect get() = compose.onNode(sheet).fetchSemanticsNode().boundsInRoot

    @Test
    @Config(qualifiers = PHONE)
    fun onAPhoneTheSheetIsDrawnToTheFootAtTheLargeHeight() = eachHeight()

    /** The folded Fold's outer screen, where app-t saw it too. */
    @Test
    @Config(qualifiers = "w443dp-h970dp-mdpi")
    fun inATallWindowTheSheetIsDrawnToTheFootAtTheLargeHeight() = eachHeight()

    /** The Filters of a window under 700 high: one height only, which a pull stretches without lifting its foot. */
    @Test
    @Config(qualifiers = "w390dp-h667dp-xhdpi")
    fun aSheetWithTheLargeHeightOnlyIsDrawnToTheFootWhenStretched() {
        show(listOf(SheetDetent.Large))
        val foot = window.height.toFloat()
        assertExtent("large only", top = LARGE_TOP * px, bottom = foot)
        assertDrawnToTheFoot("large only")

        stretch()
        assertTrue("stretched, the top ${bounds.top / px} above ${LARGE_TOP}", bounds.top < (LARGE_TOP - 1) * px)
        assertEquals("stretched, the bottom", foot, bounds.bottom, 1f)
        assertDrawnToTheFoot("stretched")
        compose.onNode(sheet).performTouchInput { up() }
        compose.waitForIdle()
    }

    /**
     * Held between the medium and large heights, the sheet is between in all: as far inside the screen's edges as it is
     * from the large height, eased from the medium's 8 to the large's 0, drawn down to that line with the dimmed map
     * under it (UI-208). A gap that went at once, at either height, would leave it at 0 or 8 here.
     */
    @Test
    @Config(qualifiers = PHONE)
    fun heldBetweenTheMediumAndLargeHeightsTheSheetIsBetweenInAll() {
        show(listOf(SheetDetent.Medium, SheetDetent.Large))
        val foot = window.height.toFloat()
        val largeTop = LARGE_TOP * px
        val mediumTop = foot - (foot - largeTop) / 2
        compose.onNode(sheet).performTouchInput {
            down(Offset(centerX, top + 40.dp.toPx()))
            repeat(20) { moveBy(Offset(0f, -(mediumTop - largeTop) / 40)) }
        }
        compose.waitForIdle()
        val top = bounds.top
        val along = (mediumTop - top) / (mediumTop - largeTop)
        assertTrue("held $along of the way up", along in 0.3f..0.7f)
        val gap = INSET * px * (1 - along)
        assertExtent("between", top = top, bottom = foot - gap)
        assertEquals("between, the left edge", gap, bounds.left, 1f)
        assertEquals("between, the right edge", window.width - gap, bounds.right, 1f)
        val image = image()
        assertSheet(image, "between, just above its foot", y = foot - gap - 2 * px)
        assertDimmedMap(image, "between, under its foot", y = foot - gap / 2)
        compose.onNode(sheet).performTouchInput { up() }
        compose.waitForIdle()
    }

    /**
     * A short pull let go fast, past UIKit's fling speed, carries the sheet on to the next height, up or down; the same
     * pull let go slowly takes it back to the height it left, the nearest.
     */
    @Test
    @Config(qualifiers = PHONE)
    fun aFlingCarriesTheSheetOnToTheNextHeightAndASlowPullBack() {
        show(listOf(SheetDetent.Medium, SheetDetent.Large))
        val foot = window.height.toFloat()
        val mediumTop = foot - (foot - LARGE_TOP * px) / 2
        val pull = 60 * px

        compose.onNode(sheet).performTouchInput { swipeUp(startY = 40 * px, endY = 40 * px - pull, durationMillis = 3_000) }
        compose.waitForIdle()
        assertExtent("pulled up slowly", top = mediumTop, bottom = foot - INSET * px)
        compose.onNode(sheet).performTouchInput { swipeUp(startY = 40 * px, endY = 40 * px - pull, durationMillis = 80) }
        compose.waitForIdle()
        assertExtent("flung up", top = LARGE_TOP * px, bottom = foot)

        compose.onNode(sheet).performTouchInput { swipeDown(startY = 40 * px, endY = 40 * px + pull, durationMillis = 3_000) }
        compose.waitForIdle()
        assertExtent("pulled down slowly", top = LARGE_TOP * px, bottom = foot)
        compose.onNode(sheet).performTouchInput { swipeDown(startY = 40 * px, endY = 40 * px + pull, durationMillis = 80) }
        compose.waitForIdle()
        assertExtent("flung down", top = mediumTop, bottom = foot - INSET * px)
    }

    private fun show(detents: List<SheetDetent>) {
        compose.setContent {
            ScootTheme(dark = false) {
                sheetColor = scootColors.elevated().systemGroupedBackground
                Box(Modifier.fillMaxSize().background(MAP))
                IosSheet(isPresented = true, onDismiss = {}, detents = detents, title = "Settings") {
                    Box(
                        Modifier.fillMaxSize().onGloballyPositioned {
                            contentTop = it.positionInRoot().y
                            contentHeight = it.size.height
                        },
                    )
                }
            }
        }
        compose.waitForIdle()
    }

    /** The sheet at the medium height, pulled to the large one, stretched past it, then dragged below the medium. */
    private fun eachHeight() {
        show(listOf(SheetDetent.Medium, SheetDetent.Large))
        val foot = window.height.toFloat()
        // Half the large height, which starts 10 below the window's top.
        val mediumTop = foot - (foot - LARGE_TOP * px) / 2

        // Medium: inside the screen's edges, 8 above its foot, the dimmed map below and around it.
        assertExtent("medium", top = mediumTop, bottom = foot - INSET * px)
        val medium = image()
        assertSheet(medium, "medium, its middle", y = (mediumTop + foot) / 2)
        assertSheet(medium, "medium, just above its foot", y = foot - (INSET + 2) * px)
        assertDimmedMap(medium, "medium, under its foot", y = foot - 3 * px)
        assertDimmedMap(medium, "medium, above it", y = mediumTop - 20 * px)
        val mediumHeight = contentHeight

        // Large, pulled up by a finger: as tall as the window below the 10, edge to edge and down to the foot.
        compose.onNode(sheet).performTouchInput { swipeUp() }
        compose.waitForIdle()
        assertExtent("large", top = LARGE_TOP * px, bottom = foot)
        assertDrawnToTheFoot("large")

        // Stretched past the large height by a finger that holds it: taller still, its foot where it was.
        stretch()
        assertTrue("stretched, the top ${bounds.top / px} above $LARGE_TOP", bounds.top < (LARGE_TOP - 1) * px)
        assertEquals("stretched, the bottom", foot, bounds.bottom, 1f)
        assertDrawnToTheFoot("stretched")
        compose.onNode(sheet).performTouchInput { up() }
        compose.waitForIdle()
        assertExtent("large, let go", top = LARGE_TOP * px, bottom = foot)

        // Back at the medium height, then dragged 100 below it and held: no shorter, sliding off the screen's foot.
        compose.onNodeWithContentDescription("Sheet Grabber").performSemanticsAction(SemanticsActions.OnClick)
        compose.waitForIdle()
        assertExtent("medium again", top = mediumTop, bottom = foot - INSET * px)
        compose.onNode(sheet).performTouchInput {
            down(Offset(centerX, top + 40.dp.toPx()))
            repeat(10) { moveBy(Offset(0f, 10.dp.toPx())) }
        }
        compose.waitForIdle()
        assertTrue("below the medium height, the top ${contentTop / px} under ${mediumTop / px}", contentTop > mediumTop + 20 * px)
        assertEquals("below the medium height, the sheet's height", mediumHeight.toFloat(), contentHeight.toFloat(), 1f)
        compose.onNode(sheet).performTouchInput { up() }
        compose.waitForIdle()
    }

    /** A finger on the sheet pulls it up 200 past where it is and holds it there. */
    private fun stretch() {
        compose.onNode(sheet).performTouchInput {
            down(Offset(centerX, top + 100.dp.toPx()))
            repeat(10) { moveBy(Offset(0f, -20.dp.toPx())) }
        }
        compose.waitForIdle()
    }

    /** The sheet laid out from [top] to [bottom], in pixels, and its content filling it. */
    private fun assertExtent(at: String, top: Float, bottom: Float) {
        assertEquals("$at, the sheet's top", top, bounds.top, 1f)
        assertEquals("$at, the sheet's bottom", bottom, bounds.bottom, 1f)
        assertEquals("$at, the content's top", top, contentTop, 1f)
        assertEquals("$at, the content's height", bottom - top, contentHeight.toFloat(), 1f)
    }

    /** The sheet, and nothing of the map, down the middle from under its grabber to the window's last row, and across. */
    private fun assertDrawnToTheFoot(at: String) {
        val image = image()
        val foot = window.height - 1f
        var y = bounds.top + 30 * px
        while (y < foot) {
            assertSheet(image, at, y)
            y += 8 * px
        }
        assertSheet(image, "$at, the last row", foot)
        // Edge to edge: at the large height it meets the screen's sides.
        assertSheet(image, "$at, by the left edge", (bounds.top + foot) / 2, x = 0.5f * px)
        assertSheet(image, "$at, by the right edge", (bounds.top + foot) / 2, x = window.width - 0.5f * px)
    }

    private fun assertSheet(image: PixelMap, at: String, y: Float, x: Float = image.width / 2f) {
        val color = image[x.toInt(), y.toInt().coerceAtMost(image.height - 1)]
        assertTrue("$at, at ${(y / px).roundToInt()} dp: the sheet's $sheetColor, not $color", close(color, sheetColor))
    }

    private fun assertDimmedMap(image: PixelMap, at: String, y: Float) {
        val color = image[image.width / 2, y.toInt()]
        assertTrue("$at, at ${(y / px).roundToInt()} dp: the dimmed map's $DIMMED_MAP, not $color", close(color, DIMMED_MAP))
    }

    private fun image(): PixelMap {
        compose.drawWindowAgain()
        return compose.onRoot().captureToImage().toPixelMap()
    }

    private fun close(a: Color, b: Color, within: Int = 2): Boolean =
        abs(a.red - b.red) * 255 <= within && abs(a.green - b.green) * 255 <= within && abs(a.blue - b.blue) * 255 <= within

    private companion object {
        /** The map: a colour no sheet has. */
        val MAP = Color(0xFFFF0000)

        /** The map under the light dimming at its darkest. */
        val DIMMED_MAP = Color(red = 1 - DIM_LIGHT, green = 0f, blue = 0f)

        /** The room above a sheet at the large height, and how far inside the edges one floats at the medium height. */
        const val LARGE_TOP = 10f
        const val INSET = 8f
    }
}
