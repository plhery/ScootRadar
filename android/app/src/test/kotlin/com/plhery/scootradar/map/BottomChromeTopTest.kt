package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.ScreenRect
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * The foot of the map's room over the dock (MapChrome.bottomTop): the locate button's top, as the iPhone's, or the
 * zones' legend's where it stands over the button (UI-410), never above the search bar's foot.
 */
class BottomChromeTopTest {
    private val bar = ScreenRect(x = 12.0, y = 24.0, width = 336.0, height = 61.0)
    private val button = ScreenRect(x = 156.0, y = 415.0, width = 192.0, height = 56.0)

    @Test
    fun theButtonsTopWithNoLegendOrALegendBesideIt() {
        assertNull(bottomChromeTop(locateButton = null, zoneLegend = null, top = bar))
        assertEquals(415.0, bottomChromeTop(button, zoneLegend = null, top = bar)!!, 0.0)
        // Beside the button, on its foot.
        assertEquals(415.0, bottomChromeTop(button, ScreenRect(x = 12.0, y = 300.0, width = 124.0, height = 171.0), bar)!!, 0.0)
        assertEquals(415.0, bottomChromeTop(button, ScreenRect(x = 12.0, y = 415.0, width = 0.0, height = 0.0), bar)!!, 0.0)
    }

    @Test
    fun theLegendsTopWhereItStandsOverTheButton() {
        assertEquals(180.0, bottomChromeTop(button, ScreenRect(x = 12.0, y = 180.0, width = 336.0, height = 225.0), bar)!!, 0.0)
        assertEquals(180.0, bottomChromeTop(button, ScreenRect(x = 12.0, y = 180.0, width = 336.0, height = 225.0), top = null)!!, 0.0)
    }

    /** A legend too tall for its room, up under the bar: the map's room is empty there, not upside down. */
    @Test
    fun neverAboveTheSearchBarsFoot() {
        assertEquals(85.0, bottomChromeTop(button, ScreenRect(x = 12.0, y = -3.0, width = 336.0, height = 408.0), bar)!!, 0.0)
    }
}
