package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.ScreenRect
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

// MAP-021, MAP-022 and MAP-027's showsMapCompass: where the compass and the scale go, and when the compass shows, as
// the iPhone's updateCompass has it (ios/ScootRadar/Views/ScooterMapView.swift:511-547).

class MapOrnamentsTest {
    /** An iPhone's map, 390×844, its status bar 47 tall. */
    private val bounds = ScreenRect(0.0, 0.0, 390.0, 844.0)
    private val safeTop = 47.0

    /** The search bar under the status bar, and with the notices under it, as the screen measures them. */
    private val searchBar = ScreenRect(12.0, 55.0, 366.0, 62.0)
    private val searchAndNotices = ScreenRect(12.0, 55.0, 366.0, 62.0 + 8.0 + 96.0)

    /** A foldable standing like a laptop: its fold across the map, the upright half above it. */
    private val foldAcross = ScreenRect(0.0, 400.0, 390.0, 24.0)

    @Test
    fun besideAPanelLevelWithItsTop() {
        val panel = ScreenRect(16.0, 63.0, 360.0, 700.0)
        assertEquals(63.0, MapOrnaments.top(panel, fold = null, search = null, safeTop, bounds), 0.0)
        // The panel's layout hands the map no search bar; a fold doesn't move it either.
        assertEquals(63.0, MapOrnaments.top(panel, fold = foldAcross, search = searchBar, safeTop, bounds), 0.0)
    }

    @Test
    fun aboveAFoldAcrossTheMapWithTheBarOnOrUnderIt() {
        // Under the fold, on the half lying flat.
        val under = ScreenRect(12.0, 432.0, 366.0, 62.0)
        assertEquals(safeTop + 12, MapOrnaments.top(panel = null, fold = foldAcross, search = under, safeTop, bounds), 0.0)
        // Its top on the fold's.
        val on = ScreenRect(12.0, 400.0, 366.0, 62.0)
        assertEquals(safeTop + 12, MapOrnaments.top(panel = null, fold = foldAcross, search = on, safeTop, bounds), 0.0)
        // No search bar at all.
        assertEquals(safeTop + 12, MapOrnaments.top(panel = null, fold = foldAcross, search = null, safeTop, bounds), 0.0)
    }

    @Test
    fun aBarAboveTheFoldKeepsTheCompassUnderIt() {
        assertEquals(117.0 + 12, MapOrnaments.top(panel = null, fold = foldAcross, search = searchBar, safeTop, bounds), 0.0)
    }

    @Test
    fun aFoldDownTheMapOrOffItCountsForNothing() {
        // Open like a book.
        val down = ScreenRect(195.0, 0.0, 24.0, 844.0)
        assertEquals(117.0 + 12, MapOrnaments.top(panel = null, fold = down, search = searchBar, safeTop, bounds), 0.0)
        // Across, but past the map's foot.
        val off = ScreenRect(0.0, 900.0, 390.0, 24.0)
        assertEquals(117.0 + 12, MapOrnaments.top(panel = null, fold = off, search = searchBar, safeTop, bounds), 0.0)
        // A fold of no size.
        val none = ScreenRect(0.0, 400.0, 390.0, 0.0)
        assertEquals(117.0 + 12, MapOrnaments.top(panel = null, fold = none, search = searchBar, safeTop, bounds), 0.0)
    }

    @Test
    fun withNoSearchBar80UnderTheSafeAreasTop() {
        assertEquals(safeTop + 80, MapOrnaments.top(panel = null, fold = null, search = null, safeTop, bounds), 0.0)
        // A frame of no size is none, as CGRect's isEmpty.
        val empty = ScreenRect(12.0, 55.0, 366.0, 0.0)
        assertEquals(safeTop + 80, MapOrnaments.top(panel = null, fold = null, search = empty, safeTop, bounds), 0.0)
        // An empty panel is none too.
        assertEquals(safeTop + 80, MapOrnaments.top(ScreenRect(16.0, 63.0, 0.0, 0.0), fold = null, search = null, safeTop, bounds), 0.0)
    }

    @Test
    fun twelveUnderTheSearchBarAndItsNotices() {
        assertEquals(117.0 + 12, MapOrnaments.top(panel = null, fold = null, search = searchBar, safeTop, bounds), 0.0)
        assertEquals(55.0 + 166.0 + 12, MapOrnaments.top(panel = null, fold = null, search = searchAndNotices, safeTop, bounds), 0.0)
    }

    /** A desktop window 1000 wide, its caption's buttons at the trailing end of its top 40, the panel up beside them. */
    @Test
    fun theCompassKeepsUnderTheCaptionsButtons() {
        val buttons = listOf(ScreenRect(880.0, 0.0, 56.0, 40.0), ScreenRect(940.0, 0.0, 56.0, 40.0))
        assertEquals(52.0, MapOrnaments.compassTop(16.0, width = 1000.0, safeLeft = 0.0, safeRight = 0.0, rightToLeft = false, buttons), 0.0)
        // Lower down, clear of them.
        assertEquals(63.0, MapOrnaments.compassTop(63.0, width = 1000.0, safeLeft = 0.0, safeRight = 0.0, rightToLeft = false, buttons), 0.0)
        // On the left of a right-to-left window, away from them.
        assertEquals(16.0, MapOrnaments.compassTop(16.0, width = 1000.0, safeLeft = 0.0, safeRight = 0.0, rightToLeft = true, buttons), 0.0)
        // No caption.
        assertEquals(16.0, MapOrnaments.compassTop(16.0, width = 1000.0, safeLeft = 0.0, safeRight = 0.0, rightToLeft = false, emptyList()), 0.0)
    }

    @Test
    fun theCompassShowsWhileTheMapIsTurned() {
        assertFalse(MapOrnaments.isTurned(0.0))
        assertFalse(MapOrnaments.isTurned(360.0))
        // A turn back the short way, a hair off north.
        assertFalse(MapOrnaments.isTurned(359.99999999999994))
        assertFalse(MapOrnaments.isTurned(-1e-9))
        assertTrue(MapOrnaments.isTurned(30.0))
        assertTrue(MapOrnaments.isTurned(-30.0))
        assertTrue(MapOrnaments.isTurned(180.0))
        assertTrue(MapOrnaments.isTurned(0.01))

        assertTrue(MapOrnaments.showsCompass(30.0, showsMapCompass = true))
        assertFalse(MapOrnaments.showsCompass(30.0, showsMapCompass = false))
        assertFalse(MapOrnaments.showsCompass(0.0, showsMapCompass = true))
    }

    /** `showsMapCompass: layout == .panel || !searchIsExpanded` (ScooterMapScreen.swift:80). */
    @Test
    fun onAPhoneTheCompassMakesWayForTheSearch() {
        assertTrue(MapOrnaments.showsMapCompass(panelLayout = false, isSearching = false))
        assertFalse(MapOrnaments.showsMapCompass(panelLayout = false, isSearching = true))
        assertTrue(MapOrnaments.showsMapCompass(panelLayout = true, isSearching = true))
        assertTrue(MapOrnaments.showsMapCompass(panelLayout = true, isSearching = false))
    }
}
