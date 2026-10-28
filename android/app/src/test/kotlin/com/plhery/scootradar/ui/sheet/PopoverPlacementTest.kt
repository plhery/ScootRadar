package com.plhery.scootradar.ui.sheet

import androidx.compose.ui.geometry.Rect
import org.junit.Assert.assertEquals
import org.junit.Test

/** Where the Filters popover goes from the panel's Filters button (UI-061, UI-129), in points at one pixel each. */
class PopoverPlacementTest {
    /** A tablet's window across, 1280 by 800, with a status bar of 24 and the popover's margins of 10. */
    private val room = Rect(10f, 34f, 1270f, 790f)

    /** The panel's Filters button: 44 wide, in the search bar's trailing end, 16 + 380 wide. */
    private val filters = Rect(296f, 40f, 340f, 96f)

    @Test
    fun underTheButtonItsArrowOnTheButtonsMiddleAndItsBodyCentredOnIt() {
        val placement = placePopover(filters, room, idealWidth = 400f, minimumWidth = 360f, arrowInset = 44f)
        assertEquals(PopoverPlacement(x = 118f, y = 96f, width = 400f, maxHeight = 694f, arrowX = 200f), placement)
    }

    @Test
    fun keptInsideTheRoomItsArrowStillOnTheButton() {
        val nearTheEdge = Rect(30f, 40f, 74f, 96f)
        val placement = placePopover(nearTheEdge, room, idealWidth = 400f, minimumWidth = 360f, arrowInset = 44f)
        assertEquals(10f, placement.x)
        // The button's middle is 42 in, and the arrow keeps 44 from the body's end, clear of its rounded corner.
        assertEquals(44f, placement.arrowX)
    }

    @Test
    fun narrowerWhereTheRoomIsAndNeverUnderItsLeast() {
        val narrow = Rect(10f, 34f, 390f, 790f)
        assertEquals(380f, placePopover(filters, narrow, idealWidth = 400f, minimumWidth = 360f, arrowInset = 44f).width)
        val narrower = Rect(10f, 34f, 310f, 790f)
        assertEquals(360f, placePopover(filters, narrower, idealWidth = 400f, minimumWidth = 360f, arrowInset = 44f).width)
    }

    @Test
    fun noTallerThanTheRoomUnderTheButton() {
        val short = Rect(10f, 34f, 1270f, 300f)
        assertEquals(204f, placePopover(filters, short, idealWidth = 400f, minimumWidth = 360f, arrowInset = 44f).maxHeight)
    }
}
