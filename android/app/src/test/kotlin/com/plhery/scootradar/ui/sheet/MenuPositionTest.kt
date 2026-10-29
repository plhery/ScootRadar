package com.plhery.scootradar.ui.sheet

import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Where the price menu goes from the cell that opens it (UI-404), at one pixel a point: a menu 250 by 222, in a
 * popup 56 larger on each side for its shadow, kept 8 inside a window 400 by 800, 8 from the cell.
 */
class MenuPositionTest {
    private val menu = IntSize(250 + 112, 222 + 112)
    private val window = IntSize(400, 800)
    private var origin: TransformOrigin? = null
    private val position = MenuPosition(Density(1f)) { origin = it }

    @Test
    fun underTheCellItsLeadingEdgeOnTheCells() {
        val cell = IntRect(20, 100, 120, 160)
        assertEquals(IntOffset(20 - 56, 168 - 56), position.calculatePosition(cell, window, LayoutDirection.Ltr, menu))
        // It grows from the cell's middle, at its top.
        assertEquals(TransformOrigin((70f - 20f + 56f) / menu.width, 0f), origin)
    }

    /** The card's cell, low in the window and at its trailing end: the menu over it, moved back inside the window. */
    @Test
    fun overTheCellWhereThereIsNoRoomUnderIt() {
        val cell = IntRect(258, 660, 378, 740)
        assertEquals(IntOffset(142 - 56, 430 - 56), position.calculatePosition(cell, window, LayoutDirection.Ltr, menu))
        assertEquals(TransformOrigin((318f - 142f + 56f) / menu.width, 1f), origin)
    }

    @Test
    fun rightToLeftItsTrailingEdgeOnTheCells() {
        val cell = IntRect(280, 100, 380, 160)
        assertEquals(IntOffset(130 - 56, 168 - 56), position.calculatePosition(cell, window, LayoutDirection.Rtl, menu))
        val nearTheStart = IntRect(20, 100, 120, 160)
        assertEquals(IntOffset(8 - 56, 168 - 56), position.calculatePosition(nearTheStart, window, LayoutDirection.Rtl, menu))
    }

    /** With room neither under nor over the cell, the menu stays under it as far as the window lets it. */
    @Test
    fun inAShortWindowKeptInsideIt() {
        val short = IntSize(400, 300)
        val cell = IntRect(20, 100, 120, 160)
        assertEquals(IntOffset(20 - 56, 70 - 56), position.calculatePosition(cell, short, LayoutDirection.Ltr, menu))
    }
}
