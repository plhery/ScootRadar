package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.ScreenRect
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

// MAP-318: the credits beside a panel keep clear of the zones' legend, which on a Fold's inner screen reaches over them,
// and of the locate button beside it, which a tablet upright brings to their end; and they go up over a dock that would
// cut them, as on a tablet upright with a cutout down its side.

class MapCreditsTest {
    /** The Fold's inner screen beside the panel: Bergen's legend, four lines, over the credits' end. */
    @Test
    fun theCreditsGoUpOverTheLegendWhereItWouldCoverThem() {
        val legend = ScreenRect(x = 560.0, y = 790.0, width = 280.0, height = 100.0)
        assertEquals(882.0 - 790.0 + 4.0, creditsOverCorner(400.0 to 680.0, listOf(legend), mapHeight = 882.0)!!, 0.0)
    }

    /** A tablet's wider map leaves room between them, and Porto's one line is shorter. */
    @Test
    fun theyStayWhereTheLegendLeavesThemBe() {
        val legend = ScreenRect(x = 900.0, y = 760.0, width = 120.0, height = 30.0)
        assertNull(creditsOverCorner(400.0 to 680.0, listOf(legend), mapHeight = 800.0))
        // Side by side, touching.
        assertNull(creditsOverCorner(400.0 to 900.0, listOf(legend), mapHeight = 800.0))
        // No legend, or the credits not laid out yet.
        assertNull(creditsOverCorner(400.0 to 680.0, emptyList(), mapHeight = 800.0))
        assertNull(creditsOverCorner(null, listOf(legend), mapHeight = 800.0))
        assertNull(creditsOverCorner(400.0 to 680.0, listOf(ScreenRect(600.0, 760.0, 0.0, 0.0)), mapHeight = 800.0))
    }

    /** Turned sideways, the legend's frame from the upright map lies below the map's foot until it is laid out again. */
    @Test
    fun aLegendBelowTheMapsFootLeavesThemBe() {
        val upright = ScreenRect(x = 560.0, y = 1180.0, width = 280.0, height = 30.0)
        assertNull(creditsOverCorner(400.0 to 680.0, listOf(upright), mapHeight = 752.0))
        assertNull(creditsOverCorner(400.0 to 680.0, listOf(upright), mapHeight = 1180.0))
    }

    /**
     * The Tablet upright beside the panel, 800 by 1280, as app-v's pass measured it: the credits, from 412 to 657.5,
     * reach past the legend to the locate button's side, 655. They go up over the button, the higher, not only over the
     * legend, where the button would cut their end; and over the button alone where there is no legend.
     */
    @Test
    fun theCreditsGoUpOverTheLocateButtonBesideTheLegend() {
        val legend = ScreenRect(x = 478.5, y = 1203.5, width = 166.5, height = 28.5)
        val locate = ScreenRect(x = 655.0, y = 1176.0, width = 129.0, height = 56.0)
        assertEquals(1280.0 - 1176.0 + 4.0, creditsOverCorner(412.0 to 657.5, listOf(legend, locate), mapHeight = 1280.0)!!, 0.0)
        assertEquals(1280.0 - 1176.0 + 4.0, creditsOverCorner(412.0 to 657.5, listOf(locate), mapHeight = 1280.0)!!, 0.0)
        // Short of the button, over the legend alone.
        assertEquals(1280.0 - 1203.5 + 4.0, creditsOverCorner(412.0 to 655.0, listOf(legend, locate), mapHeight = 1280.0)!!, 0.0)
    }

    /**
     * The Tablet upright, 800 wide, in the dock's layout (a cutout down its side leaves too little for the panel): the
     * dock keeps to 560 in the middle, from 120 in a window without the cutout, and would cut the credits, from 8
     * to 245, after "© OpenStreetMap" (review-app-t finding 4). They go up over it, and over the zones' legend on it.
     */
    @Test
    fun theCreditsGoUpOverADockThatWouldCutThem() {
        val dock = ScreenRect(x = 120.0, y = 1100.0, width = 560.0, height = 156.0)
        val legend = ScreenRect(x = 122.0, y = 1056.0, width = 230.0, height = 34.0)
        val locate = ScreenRect(x = 560.0, y = 1046.0, width = 108.0, height = 44.0)
        assertEquals(1280.0 - 1100.0 + 4.0, creditsOverDock(8.0 to 245.0, dock, listOf(locate), mapHeight = 1280.0)!!, 0.0)
        assertEquals(1280.0 - 1056.0 + 4.0, creditsOverDock(8.0 to 245.0, dock, listOf(legend, locate), mapHeight = 1280.0)!!, 0.0)
        // Beside a side cutout, 48 in, and right to left, at the other side.
        assertEquals(1280.0 - 1100.0 + 4.0, creditsOverDock(56.0 to 293.0, dock, listOf(locate), mapHeight = 1280.0)!!, 0.0)
        assertEquals(1280.0 - 1100.0 + 4.0, creditsOverDock(555.0 to 792.0, dock, emptyList(), mapHeight = 1280.0)!!, 0.0)
    }

    /**
     * A phone's dock spans the map, 10 in from its sides, and covers all of the credits' text, 6 inside their frame,
     * as the iPhone's dock covers Legal; credits beside the dock are seen as they are.
     */
    @Test
    fun aDockOverAllOfTheirTextOrNoneOfItLeavesThemBe() {
        val phone = ScreenRect(x = 10.0, y = 500.0, width = 340.0, height = 132.0)
        assertNull(creditsOverDock(8.0 to 245.0, phone, emptyList(), mapHeight = 640.0))
        val tablet = ScreenRect(x = 300.0, y = 1100.0, width = 560.0, height = 156.0)
        assertNull(creditsOverDock(8.0 to 245.0, tablet, emptyList(), mapHeight = 1280.0))
        // Touching their frame's end, and over all of their text but the room before it, as on the phone.
        assertNull(creditsOverDock(8.0 to 245.0, tablet.copy(x = 245.0), emptyList(), mapHeight = 1280.0))
        assertNull(creditsOverDock(8.0 to 245.0, tablet.copy(x = 14.0, width = 560.0), emptyList(), mapHeight = 1280.0))
        // Over the room after their text only, the dock would still cut their frame: they go up over it.
        assertEquals(1280.0 - 1100.0 + 4.0, creditsOverDock(8.0 to 245.0, tablet.copy(x = 241.0), emptyList(), mapHeight = 1280.0)!!, 0.0)
        // No dock, a dock not laid out yet or one from the map before it turned, or credits not laid out yet.
        assertNull(creditsOverDock(8.0 to 245.0, null, emptyList(), mapHeight = 1280.0))
        assertNull(creditsOverDock(8.0 to 245.0, ScreenRect(120.0, 1100.0, 0.0, 0.0), emptyList(), mapHeight = 1280.0))
        assertNull(creditsOverDock(8.0 to 245.0, ScreenRect(120.0, 1180.0, 560.0, 156.0), emptyList(), mapHeight = 800.0))
        assertNull(creditsOverDock(null, tablet.copy(x = 120.0), emptyList(), mapHeight = 1280.0))
    }
}
