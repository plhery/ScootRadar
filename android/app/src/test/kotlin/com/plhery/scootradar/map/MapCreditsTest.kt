package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.ScreenRect
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

// MAP-318: the credits beside a panel keep clear of the zones' legend, which on a Fold's inner screen reaches over them.

class MapCreditsTest {
    /** The Fold's inner screen beside the panel: Bergen's legend, four lines, over the credits' end. */
    @Test
    fun theCreditsGoUpOverTheLegendWhereItWouldCoverThem() {
        val legend = ScreenRect(x = 560.0, y = 790.0, width = 280.0, height = 100.0)
        assertEquals(882.0 - 790.0 + 4.0, creditsOverLegend(400.0 to 680.0, legend, mapHeight = 882.0)!!, 0.0)
    }

    /** A tablet's wider map leaves room between them, and Porto's one line is shorter. */
    @Test
    fun theyStayWhereTheLegendLeavesThemBe() {
        val legend = ScreenRect(x = 900.0, y = 760.0, width = 120.0, height = 30.0)
        assertNull(creditsOverLegend(400.0 to 680.0, legend, mapHeight = 800.0))
        // Side by side, touching.
        assertNull(creditsOverLegend(400.0 to 900.0, legend, mapHeight = 800.0))
        // No legend, or the credits not laid out yet.
        assertNull(creditsOverLegend(400.0 to 680.0, null, mapHeight = 800.0))
        assertNull(creditsOverLegend(null, legend, mapHeight = 800.0))
        assertNull(creditsOverLegend(400.0 to 680.0, ScreenRect(600.0, 760.0, 0.0, 0.0), mapHeight = 800.0))
    }

    /** Turned sideways, the legend's frame from the upright map lies below the map's foot until it is laid out again. */
    @Test
    fun aLegendBelowTheMapsFootLeavesThemBe() {
        val upright = ScreenRect(x = 560.0, y = 1180.0, width = 280.0, height = 30.0)
        assertNull(creditsOverLegend(400.0 to 680.0, upright, mapHeight = 752.0))
        assertNull(creditsOverLegend(400.0 to 680.0, upright, mapHeight = 1180.0))
    }
}
