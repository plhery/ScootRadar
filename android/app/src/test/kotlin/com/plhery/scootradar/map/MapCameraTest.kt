package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.MapRect
import com.plhery.scootradar.core.model.ScooterMapCameraPolicy
import com.plhery.scootradar.core.model.ScooterMapProjection
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterScreenshotCamera
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.geometry.LatLng
import kotlin.math.abs

class MapCameraTest {
    @Test
    fun theMapOpensOnTheStartRegionAsMapKitFitsItTilted() {
        val start = ScooterMapStart.switzerland
        val opening = MapCamera.opening(start, MapKitCamera.IPhone)

        assertEquals(start.region.center.latitude, opening.target!!.latitude, 0.0)
        assertEquals(start.region.center.longitude, opening.target!!.longitude, 0.0)
        assertEquals(MapZoom.fitting(start.region, width = 390.0, height = 844.0), opening.zoom, 0.0)
        assertEquals(20.0, opening.tilt, 0.0)
        assertEquals(0.0, opening.bearing, 0.0)
    }

    @Test
    fun aScreenshotCameraTakesThePlaceOfTheStart() {
        val camera = ScooterScreenshotCamera.Camera(GeoPoint(47.3769, 8.5417), distance = 900.0, pitch = 45.0, heading = 30.0)
        val opening = MapCamera.opening(ScooterMapStart.switzerland, MapKitCamera.IPhone, camera)

        assertEquals(47.3769, opening.target!!.latitude, 0.0)
        assertEquals(8.5417, opening.target!!.longitude, 0.0)
        assertEquals(MapZoom.atDistance(900.0, latitude = 47.3769, height = 844.0, MapKitCamera.IPhone), opening.zoom, 0.0)
        assertEquals(45.0, opening.tilt, 0.0)
        assertEquals(30.0, opening.bearing, 0.0)
        // In an iPad's window MapKit's camera stands closer for the same map, so the same distance shows more.
        val onTheIPad = MapCamera.opening(ScooterMapStart.switzerland, MapKitCamera.IPad, camera)
        assertEquals(MapZoom.atDistance(900.0, latitude = 47.3769, height = 844.0, MapKitCamera.IPad), onTheIPad.zoom, 0.0)
        assertEquals(0.0803, opening.zoom - onTheIPad.zoom, 0.0001)
    }

    @Test
    fun aMoveGoesStraightAcrossTheFlatMapAndTurnsTheShortWay() {
        val from = position(47.0, 8.0, zoom = 12.0, tilt = 20.0, bearing = 350.0)
        val to = position(48.0, 9.0, zoom = 14.0, tilt = 40.0, bearing = 10.0)

        val halfway = MapCamera.between(from, to, 0.5)
        val middle = MapPoint(
            (MapPoint(GeoPoint(47.0, 8.0)).x + MapPoint(GeoPoint(48.0, 9.0)).x) / 2,
            (MapPoint(GeoPoint(47.0, 8.0)).y + MapPoint(GeoPoint(48.0, 9.0)).y) / 2,
        ).coordinate
        assertEquals(middle.latitude, halfway.target!!.latitude, 1e-9)
        assertEquals(middle.longitude, halfway.target!!.longitude, 1e-9)
        // The camera's distance halfway, not the zoom: past 13, as MapKit's comes in.
        val distance = (MapZoom.mapKitDistance(12.0, 47.0, 844.0, MapKitCamera.IPhone) + MapZoom.mapKitDistance(14.0, 48.0, 844.0, MapKitCamera.IPhone)) / 2
        assertEquals(MapZoom.atDistance(distance, middle.latitude, 844.0, MapKitCamera.IPhone), halfway.zoom, 1e-9)
        assertEquals(12.67, halfway.zoom, 0.01)
        assertEquals(30.0, halfway.tilt, 1e-9)
        assertEquals(0.0, halfway.bearing % 360, 1e-9)

        val there = MapCamera.between(from, to, 1.0)
        assertEquals(48.0, there.target!!.latitude, 1e-9)
        assertEquals(9.0, there.target!!.longitude, 1e-9)
        assertEquals(14.0, there.zoom, 1e-9)
    }

    @Test
    fun aMoveTakesAQuarterOfASecondForEachZoomLevelBegun() {
        // As MapKit's moves in and out took on the iOS 27 simulator.
        val from = position(47.3769, 8.5417, zoom = 15.0, tilt = 20.0)
        fun zoomedBy(levels: Double) = MapCamera.moveMillis(from, position(47.3769, 8.5417, zoom = 15.0 + levels, tilt = 20.0), 956.0, MapKitCamera.IPhone)
        assertEquals(250, zoomedBy(0.0))
        assertEquals(250, zoomedBy(0.9))
        assertEquals(250, zoomedBy(1.0))
        assertEquals(500, zoomedBy(1.05))
        assertEquals(500, zoomedBy(-2.0))
        assertEquals(750, zoomedBy(2.05))
        assertEquals(1750, zoomedBy(-7.0))
        assertEquals(2000, zoomedBy(-7.5))
        assertEquals(2000, zoomedBy(-12.0))
    }

    @Test
    fun aMoveTakesAQuarterOfASecondForEachHeightOfTheCameraItCrosses() {
        // MapKit's camera 1200 m above Zürich on the iPhone, moved east: 3.23 km took 0.70 s flat, 0.75 s at 20°
        // and 0.98 s at 45°, and 9 km 1.90 s, each with some 30 ms before the first frame.
        val zoom = MapZoom.atDistance(1200.0, latitude = 47.3769, height = 956.0, MapKitCamera.IPhone)
        fun east(km: Double, tilt: Double): Int {
            val longitude = 8.5417 + km / (111.32 * kotlin.math.cos(47.3769 * Math.PI / 180))
            return MapCamera.moveMillis(
                position(47.3769, 8.5417, zoom = zoom, tilt = tilt),
                position(47.3769, longitude, zoom = zoom, tilt = tilt),
                956.0,
                MapKitCamera.IPhone,
            )
        }
        assertEquals(670.0, east(3.228, tilt = 0.0).toDouble(), 10.0)
        assertEquals(715.0, east(3.228, tilt = 20.0).toDouble(), 10.0)
        assertEquals(950.0, east(3.228, tilt = 45.0).toDouble(), 10.0)
        assertEquals(1870.0, east(9.0, tilt = 0.0).toDouble(), 10.0)
        // A short move still takes a quarter of a second, a long one two seconds.
        assertEquals(250, east(0.5, tilt = 0.0))
        assertEquals(2000, east(40.0, tilt = 0.0))
        // The longer of the two: one level in over 3.23 km is the ground's time at the closer camera.
        val closer = MapCamera.moveMillis(
            position(47.3769, 8.5417, zoom = zoom - 1, tilt = 0.0),
            position(47.3769, 8.5417 + 3.228 / (111.32 * kotlin.math.cos(47.3769 * Math.PI / 180)), zoom = zoom, tilt = 0.0),
            956.0,
            MapKitCamera.IPhone,
        )
        assertEquals(670.0, closer.toDouble(), 10.0)
    }

    @Test
    fun onTheIPadAMoveTakesTheSameTimeForTheSameCameraHeight() {
        // MapKit's camera 1200 m above Zürich on the iPad, a map 1376 points tall, moved east: 3 km took 0.67 s,
        // 6 km 1.29 s and 9 km 1.90 s, each with some 30 ms before the first frame, as on the iPhone.
        val height = 1376.0
        val zoom = MapZoom.atDistance(1200.0, latitude = 47.3769, height = height, MapKitCamera.IPad)
        fun east(km: Double, camera: MapKitCamera): Int {
            val longitude = 8.5417 + km / (111.32 * kotlin.math.cos(47.3769 * Math.PI / 180))
            return MapCamera.moveMillis(
                position(47.3769, 8.5417, zoom = zoom, tilt = 0.0),
                position(47.3769, longitude, zoom = zoom, tilt = 0.0),
                height,
                camera,
            )
        }
        assertEquals(640.0, east(3.0, MapKitCamera.IPad).toDouble(), 20.0)
        assertEquals(1260.0, east(6.0, MapKitCamera.IPad).toDouble(), 20.0)
        assertEquals(1870.0, east(9.0, MapKitCamera.IPad).toDouble(), 20.0)
        // The iPhone's camera would stand 6% higher over that map, and cross the same ground sooner.
        assertEquals(592, east(3.0, MapKitCamera.IPhone))
    }

    @Test
    fun aMoveAcrossTheAntimeridianGoesTheShortWay() {
        val halfway = MapCamera.between(position(0.0, 179.0), position(0.0, -179.0), 0.5)

        assertEquals(180.0, abs(halfway.target!!.longitude), 1e-9)
    }

    /** T221's margin: 16 dp from the edge, 380 of panel and 16 to spare, on the panel's side only. */
    @Test
    fun besideAPanelOnlyTheLeadingMarginReachesPastIt() {
        val bounds = ScreenRect(0.0, 0.0, 1280.0, 800.0)
        val panel = ScreenRect(16.0, 40.0, 380.0, 500.0)
        assertEquals(MapInsets(0.0, 16.0 + 380 + 16, 0.0, 0.0), MapCamera.beside(panel, bounds, rightToLeft = false))
        // Right to left the panel is down the right side, and the margin with it.
        val right = ScreenRect(1280.0 - 16 - 380, 40.0, 380.0, 500.0)
        assertEquals(MapInsets(0.0, 0.0, 0.0, 16.0 + 380 + 16), MapCamera.beside(right, bounds, rightToLeft = true))
        // The panel's height, which its fold changes, moves nothing (T229).
        assertEquals(MapCamera.beside(panel, bounds, false), MapCamera.beside(ScreenRect(16.0, 40.0, 380.0, 120.0), bounds, false))
        // Measured from the map's own edge.
        assertEquals(MapInsets(0.0, 380.0 + 16, 0.0, 0.0), MapCamera.beside(panel, ScreenRect(16.0, 0.0, 1264.0, 800.0), false))
    }

    /**
     * A route or a region beside the panel is fitted inside the safe area too, as iOS fits it within the map's layout
     * margins, which UIKit reads back with the safe area added: above a tablet's taskbar, under its status bar.
     */
    @Test
    fun besideAPanelAFitKeepsInsideTheSafeArea() {
        val bounds = ScreenRect(0.0, 0.0, 1280.0, 800.0)
        val margins = MapCamera.beside(ScreenRect(16.0, 40.0, 380.0, 500.0), bounds, rightToLeft = false)
        val safeArea = MapInsets(top = 24.0, left = 0.0, bottom = 48.0, right = 0.0)
        assertEquals(ScreenRect(412.0, 24.0, 868.0, 728.0), MapCamera.within(bounds, margins, safeArea))
        // A side bar for navigation: the panel's margin is past it already, and the other side keeps clear of it.
        val sides = MapInsets(top = 24.0, left = 48.0, bottom = 0.0, right = 48.0)
        assertEquals(ScreenRect(412.0, 24.0, 820.0, 776.0), MapCamera.within(bounds, margins, sides))
        // Without a safe area it is the map inside its margins.
        assertEquals(ScreenRect(412.0, 0.0, 868.0, 800.0), MapCamera.within(bounds, margins, MapInsets.zero))
    }

    /**
     * MAP-044's margins beside the fold of a partly open foldable (ScooterMapView.swift:913-951): past a fold down the
     * map on the side away from the panel, or the trailing one, and above a fold across it, from under the status bar.
     */
    @Test
    fun besideAFoldTheMarginsReachPastItOnTheSideTheMapShowsOn() {
        val book = ScreenRect(465.0, 0.0, 20.0, 669.0)
        val window = ScreenRect(0.0, 0.0, 951.0, 669.0)
        // T244: no panel, and the map shows in the trailing half.
        assertEquals(MapInsets(0.0, 485.0 + 16, 0.0, 0.0), MapCamera.beside(null, book, window, safeTop = 24.0, rightToLeft = false))
        assertEquals(MapInsets(0.0, 0.0, 0.0, 951.0 - 465 + 16), MapCamera.beside(null, book, window, safeTop = 24.0, rightToLeft = true))
        // Beside the panel, the half away from it, whichever side it is on.
        val panel = ScreenRect(16.0, 24.0, 380.0, 400.0)
        assertEquals(MapInsets(0.0, 485.0 + 16, 0.0, 0.0), MapCamera.beside(panel, book, window, safeTop = 24.0, rightToLeft = false))
        val right = ScreenRect(951.0 - 16 - 380, 24.0, 380.0, 400.0)
        assertEquals(MapInsets(0.0, 0.0, 0.0, 951.0 - 465 + 16), MapCamera.beside(right, book, window, safeTop = 24.0, rightToLeft = true))
        // A fold the panel reaches past leaves the panel's margin.
        val near = ScreenRect(300.0, 0.0, 20.0, 669.0)
        assertEquals(MapInsets(0.0, 16.0 + 380 + 16, 0.0, 0.0), MapCamera.beside(panel, near, window, safeTop = 24.0, rightToLeft = false))

        // T245: standing like a laptop, the upright half between the status bar and the fold.
        val laptop = ScreenRect(0.0, 465.0, 669.0, 20.0)
        val upright = ScreenRect(0.0, 0.0, 669.0, 951.0)
        assertEquals(MapInsets(24.0, 0.0, 951.0 - 465 + 16, 0.0), MapCamera.beside(null, laptop, upright, safeTop = 24.0, rightToLeft = false))
    }

    /**
     * A server cluster's region, as a place located (MAP-041, MAP-050, MAP-051): beside a panel or a fold its centre
     * goes to the middle of the part of the map beside it, across, and of the whole map up and down, as the iPhone's
     * cluster tap gives setRegionPreservingPerspective the part left visible (ScooterMapView.swift:1877-1907, aside at
     * :44 and :111-115); not to the middle of the map's margins, 16 further on past the panel or the fold.
     */
    @Test
    fun besideAPanelOrAFoldARegionIsCentredInThePartOfTheMapBesideIt() {
        val city = GeoPoint(47.3769, 8.5417)
        // The Tablet across, the panel from 16 to 396: iOS shows a city total at (396 + 1280) / 2, where the map's
        // margins, 412 past its edge, would show it at 846.
        val tablet = ScreenRect(0.0, 0.0, 1280.0, 800.0)
        val panel = ScreenRect(16.0, 40.0, 380.0, 500.0)
        val besidePanel = ScooterMapCameraPolicy.visibleRectIn(tablet, top = 24.0, bottom = tablet.maxY, beside = panel)
        shownAt(city, tablet, MapCamera.beside(panel, tablet, rightToLeft = false), besidePanel, panel).let {
            assertEquals(838.0, it.x, 1e-6)
            assertEquals(400.0, it.y, 1e-6)
        }
        // Right to left the panel is down the right side, and the part beside it on the left.
        val right = ScreenRect(1280.0 - 16 - 380, 40.0, 380.0, 500.0)
        val besideRight = ScooterMapCameraPolicy.visibleRectIn(tablet, top = 24.0, bottom = tablet.maxY, beside = right)
        assertEquals(442.0, shownAt(city, tablet, MapCamera.beside(right, tablet, rightToLeft = true), besideRight, right, rightToLeft = true).x, 1e-6)

        // Open like a book with the panel in the leading half: the middle of the trailing one, past the fold.
        val window = ScreenRect(0.0, 0.0, 951.0, 669.0)
        val book = ScreenRect(465.0, 0.0, 20.0, 669.0)
        val leading = ScreenRect(16.0, 24.0, 380.0, 400.0)
        val trailing = ScooterMapCameraPolicy.visibleRect(
            ScooterMapCameraPolicy.visibleRectIn(window, top = 24.0, bottom = window.maxY, beside = leading),
            safeTop = 24.0,
            beside = book,
            on = ScooterMapCameraPolicy.FoldSide.Right,
        )
        shownAt(city, window, MapCamera.beside(leading, book, window, safeTop = 24.0, rightToLeft = false), trailing, leading, book).let {
            assertEquals((485.0 + 951) / 2, it.x, 1e-6)
            assertEquals(669.0 / 2, it.y, 1e-6)
        }

        // A phone's map, whole across: the middle of its margins, which it has none of.
        val phone = ScreenRect(0.0, 0.0, 390.0, 844.0)
        val overTheDock = ScooterMapCameraPolicy.visibleRectIn(phone, top = 120.0, bottom = 600.0, beside = null)
        assertEquals(null, MapCamera.aside(overTheDock, phone))
    }

    /**
     * A foldable standing like a laptop beside a panel, which iOS never shows (a Duo gets the dock): a place or a
     * region goes to the middle of the upright half beside the panel, by iOS's rule that the map takes the upright
     * half, not to the fold in the whole map's middle (the lead's decision of 30 Oct). Without a panel nothing covers
     * a side, and the margins, above the fold, put it in the upright half already.
     */
    @Test
    fun standingLikeALaptopBesideAPanelAPlaceGoesToTheMiddleOfTheUprightHalf() {
        val city = GeoPoint(47.3769, 8.5417)
        // The Fold unfolded and turned, its fold across the middle, the panel at the top of the leading side.
        val window = ScreenRect(0.0, 0.0, 883.0, 852.0)
        val laptop = ScreenRect(0.0, 426.0, 883.0, 1.0)
        val panel = ScreenRect(16.0, 40.0, 380.0, 360.0)
        val upright = ScooterMapCameraPolicy.visibleRect(
            ScooterMapCameraPolicy.visibleRectIn(window, top = 24.0, bottom = window.maxY, beside = panel),
            safeTop = 24.0,
            beside = laptop,
            on = ScooterMapCameraPolicy.FoldSide.Above,
        )
        assertEquals(ScreenRect(396.0, 24.0, 487.0, 402.0), upright)
        val margins = MapCamera.beside(panel, laptop, window, safeTop = 24.0, rightToLeft = false)
        // The upright half is told from the fold across the map, as MapCamera tells it from the chrome.
        shownAt(city, window, margins, upright, panel, laptop).let {
            assertEquals((396.0 + 883) / 2, it.x, 1e-6)
            assertEquals((24.0 + 426) / 2, it.y, 1e-6)
        }
        // By the rule iOS shares with a fold down the map, the fold itself.
        assertEquals(426.0, shownIn(city, window, margins, MapCamera.aside(upright, window, upright = false)).y, 1e-6)

        // Without the panel the map is whole across: the middle of its margins, from under the status bar to 16 above
        // the fold.
        val whole = ScooterMapCameraPolicy.visibleRect(
            ScooterMapCameraPolicy.visibleRectIn(window, top = 24.0, bottom = window.maxY, beside = null),
            safeTop = 24.0,
            beside = laptop,
            on = ScooterMapCameraPolicy.FoldSide.Above,
        )
        assertEquals(null, MapCamera.aside(whole, window, panel = null, fold = laptop, rightToLeft = false))
        shownAt(city, window, MapCamera.beside(null, laptop, window, safeTop = 24.0, rightToLeft = false), whole, fold = laptop).let {
            assertEquals(883.0 / 2, it.x, 1e-6)
            assertEquals((24.0 + 426 - 16) / 2, it.y, 1e-6)
        }
    }

    /**
     * The upright half, standing like a laptop, is told from the fold MapCamera is handed (review-app-p finding 3): above
     * a fold across the map a place beside a panel is centred in the part of the map above it, on either side; beside a
     * fold down the map, or a panel alone, in a part as tall as the map, as iOS's aside has it
     * (ScooterMapView.swift:111-115).
     */
    @Test
    fun theUprightHalfIsTakenAboveAFoldAcrossTheMapOnly() {
        // The Fold unfolded and turned, the panel at the top of the leading side, then right to left on the right.
        val window = ScreenRect(0.0, 0.0, 883.0, 852.0)
        val laptop = ScreenRect(0.0, 426.0, 883.0, 1.0)
        val panel = ScreenRect(16.0, 40.0, 380.0, 360.0)
        val upright = partInView(window, top = 24.0, bottom = window.maxY, panel, laptop, rightToLeft = false)
        assertEquals(ScreenRect(396.0, 24.0, 487.0, 402.0), upright)
        assertEquals(upright, MapCamera.aside(upright, window, panel, laptop, rightToLeft = false))
        val right = ScreenRect(883.0 - 16 - 380, 40.0, 380.0, 360.0)
        val uprightLeft = partInView(window, top = 24.0, bottom = window.maxY, right, laptop, rightToLeft = true)
        assertEquals(ScreenRect(0.0, 24.0, 487.0, 402.0), uprightLeft)
        assertEquals(uprightLeft, MapCamera.aside(uprightLeft, window, right, laptop, rightToLeft = true))

        // Open like a book, the panel in the leading half: the trailing half, as tall as the map.
        val book = ScreenRect(0.0, 0.0, 951.0, 669.0)
        val down = ScreenRect(465.0, 0.0, 20.0, 669.0)
        val leading = ScreenRect(16.0, 24.0, 380.0, 400.0)
        val trailing = partInView(book, top = 24.0, bottom = book.maxY, leading, down, rightToLeft = false)
        assertEquals(ScreenRect(485.0, 0.0, 466.0, 669.0), MapCamera.aside(trailing, book, leading, down, rightToLeft = false))

        // The Tablet across, the panel alone: as tall as the map.
        val tablet = ScreenRect(0.0, 0.0, 1280.0, 800.0)
        val besidePanel = ScreenRect(16.0, 40.0, 380.0, 500.0)
        val part = partInView(tablet, top = 24.0, bottom = tablet.maxY, besidePanel, fold = null, rightToLeft = false)
        assertEquals(ScreenRect(396.0, 0.0, 884.0, 800.0), MapCamera.aside(part, tablet, besidePanel, fold = null, rightToLeft = false))
    }

    /**
     * A step in or out from the keyboard keeps what is shown where a move to a place shows it (MAP-049; applyZoom and
     * focus in ScooterMapView.swift:754-780 and :122-127), so a step after locating keeps the rider: over the dock, in
     * the middle of the map's margins; beside a panel and beside a book's fold, in the middle of the part beside it
     * across and of the whole map up and down; standing like a laptop, over the dock in the middle of the margins above
     * the fold, and beside a panel in the middle of the upright half, not on the fold where iOS's focus, which never
     * sees a panel there, would keep it (review-app-p finding 3). Measured on the map once a place is shown there.
     */
    @Test
    fun aStepFromTheKeyboardKeepsWhatIsShownWhereAPlaceLocatedShows() {
        val city = GeoPoint(47.3769, 8.5417)
        val phone = ScreenRect(0.0, 0.0, 390.0, 844.0)
        val tablet = ScreenRect(0.0, 0.0, 1280.0, 800.0)
        val book = ScreenRect(0.0, 0.0, 951.0, 669.0)
        val laptop = ScreenRect(0.0, 0.0, 883.0, 852.0)
        val across = ScreenRect(0.0, 426.0, 883.0, 1.0)
        val laptopPanel = ScreenRect(16.0, 40.0, 380.0, 360.0)
        val windows = listOf(
            Window("a phone over the dock", phone, top = 120.0, bottom = 600.0, located = ScreenPoint(195.0, 422.0)),
            Window("the Tablet beside its panel", tablet, top = 24.0, bottom = 800.0, panel = ScreenRect(16.0, 40.0, 380.0, 500.0), located = ScreenPoint(838.0, 400.0)),
            Window("the Tablet right to left", tablet, top = 24.0, bottom = 800.0, panel = ScreenRect(884.0, 40.0, 380.0, 500.0), rightToLeft = true, located = ScreenPoint(442.0, 400.0)),
            Window("a book beside its panel", book, top = 24.0, bottom = 669.0, panel = ScreenRect(16.0, 24.0, 380.0, 400.0), fold = ScreenRect(465.0, 0.0, 20.0, 669.0), located = ScreenPoint(718.0, 334.5)),
            // The search bar lies with the dock under the fold.
            Window("a laptop over the dock", laptop, top = 500.0, bottom = 780.0, fold = across, located = ScreenPoint(441.5, (24.0 + 426 - 16) / 2)),
            Window("a laptop beside its panel", laptop, top = 24.0, bottom = 852.0, panel = laptopPanel, fold = across, located = ScreenPoint(639.5, 225.0)),
            Window("a laptop right to left", laptop, top = 24.0, bottom = 852.0, panel = ScreenRect(487.0, 40.0, 380.0, 360.0), fold = across, rightToLeft = true, located = ScreenPoint(243.5, 225.0)),
        )
        for (window in windows) {
            val bounds = window.bounds
            val visible = partInView(bounds, top = window.top, bottom = window.bottom, window.panel, window.fold, window.rightToLeft)
            val map = locatedOn(city, window, visible)
            val located = map.point(city)
            assertEquals("${window.name}: located across", window.located.x, located.x, 1e-6)
            assertEquals("${window.name}: located up and down", window.located.y, located.y, 1e-6)
            val kept = MapCamera.focus(on = map, visible = visible, panel = window.panel, fold = window.fold, rightToLeft = window.rightToLeft)
            assertEquals("${window.name}: kept across", located.x, kept.x, 1e-6)
            assertEquals("${window.name}: kept up and down", located.y, kept.y, 1e-6)
        }
        // iOS's own focus, which knows no upright half, would keep the fold, and a step in would take the rider off it.
        val upright = windows.first { it.name == "a laptop beside its panel" }
        val visible = partInView(laptop, top = 24.0, bottom = 852.0, laptopPanel, across, rightToLeft = false)
        assertEquals(426.0, ScooterMapCameraPolicy.focus(on = locatedOn(city, upright, visible), visible = visible).y, 1e-6)
    }

    /** A window of [aStepFromTheKeyboardKeepsWhatIsShownWhereAPlaceLocatedShows], and where a place located shows in it. */
    private data class Window(
        val name: String,
        val bounds: ScreenRect,
        /** The top and the bottom of the part of the map in view before a panel or a fold: the search bar's foot, the locate button's top. */
        val top: Double,
        val bottom: Double,
        val panel: ScreenRect? = null,
        val fold: ScreenRect? = null,
        val rightToLeft: Boolean = false,
        val located: ScreenPoint,
    )

    /** The flat map of `window` once `place` is located, as MapCamera moves it, with the margins it sets there, the part of it left `visible`. */
    private fun locatedOn(place: GeoPoint, window: Window, visible: ScreenRect): FlatMap {
        val margins = if (window.panel == null && window.fold == null) {
            MapInsets.zero
        } else {
            MapCamera.beside(window.panel, window.fold, window.bounds, safeTop = SAFE_TOP, rightToLeft = window.rightToLeft)
        }
        val beside = MapCamera.aside(visible, window.bounds, window.panel, window.fold, window.rightToLeft)
        return FlatMap(window.bounds, margins, centre = movedTo(place, window.bounds, margins, beside))
    }

    /**
     * The part of a map of `bounds` in view, as MapCamera's visibleRect measures it: between `top` and `bottom`, beside
     * the `panel`, then on the side of the `fold` where the map shows, from under the status bar above one across it.
     */
    private fun partInView(bounds: ScreenRect, top: Double, bottom: Double, panel: ScreenRect?, fold: ScreenRect?, rightToLeft: Boolean): ScreenRect {
        val visible = ScooterMapCameraPolicy.visibleRectIn(bounds, top = top, bottom = bottom, beside = panel)
        fold ?: return visible
        val side = ScooterMapCameraPolicy.side(of = fold, panel = panel, rightToLeft = rightToLeft)
        return ScooterMapCameraPolicy.visibleRect(visible, safeTop = SAFE_TOP, beside = fold, on = side)
    }

    /**
     * Where `place` shows once a region centred on it is shown on a flat map of `bounds` with `margins`, the part of it
     * left `visible` beside the `panel` or the `fold`: measured on the map as the camera will show it, then moved there,
     * as MapCamera does.
     */
    private fun shownAt(
        place: GeoPoint,
        bounds: ScreenRect,
        margins: MapInsets,
        visible: ScreenRect,
        panel: ScreenRect? = null,
        fold: ScreenRect? = null,
        rightToLeft: Boolean = false,
    ): ScreenPoint = shownIn(place, bounds, margins, MapCamera.aside(visible, bounds, panel, fold, rightToLeft))

    /** Where `place` shows once a region centred on it is shown on a flat map of `bounds` with `margins`, centred `beside` a panel or a fold. */
    private fun shownIn(place: GeoPoint, bounds: ScreenRect, margins: MapInsets, beside: ScreenRect?): ScreenPoint =
        FlatMap(bounds, margins, movedTo(place, bounds, margins, beside)).point(place)

    /**
     * The centre of a flat map of `bounds` with `margins` once a region centred on `place` is shown on it: the place in
     * the middle of the margins, or moved to show it in the middle of what it is centred in `beside` a panel or a fold.
     */
    private fun movedTo(place: GeoPoint, bounds: ScreenRect, margins: MapInsets, beside: ScreenRect?): GeoPoint =
        beside?.let { ScooterMapCameraPolicy.center(showing = place, on = FlatMap(bounds, margins, centre = place), visible = it) } ?: place

    /** A map seen from straight above, north up, at two map points a point, its centre in the middle of its margins. */
    private class FlatMap(override val bounds: ScreenRect, margins: MapInsets, centre: GeoPoint) : ScooterMapProjection {
        private val middle = ScreenPoint(
            bounds.minX + margins.left + (bounds.width - margins.left - margins.right) / 2,
            bounds.minY + margins.top + (bounds.height - margins.top - margins.bottom) / 2,
        )
        private val shown = MapPoint(centre)
        override val centerCoordinate = centre
        override val visibleMapRect = MapRect(shown.x - bounds.width, shown.y - bounds.height, 2 * bounds.width, 2 * bounds.height)

        override fun point(coordinate: GeoPoint): ScreenPoint = MapPoint(coordinate).let {
            ScreenPoint(middle.x + (it.x - shown.x) / 2, middle.y + (it.y - shown.y) / 2)
        }

        override fun coordinate(point: ScreenPoint): GeoPoint =
            MapPoint(shown.x + (point.x - middle.x) * 2, shown.y + (point.y - middle.y) * 2).coordinate
    }

    @Test
    fun marginsMeasuredApartInTheirLastDigitsAreTheSame() {
        val margins = MapInsets(0.0, 412.0, 0.0, 0.0)
        assertTrue(margins.nearlyEquals(MapInsets(0.0, 412.4, 0.0, 0.0), within = 0.5))
        assertFalse(margins.nearlyEquals(MapInsets(0.0, 412.5, 0.0, 0.0), within = 0.5))
        assertFalse(margins.nearlyEquals(MapInsets(0.0, 412.0, 1.0, 0.0), within = 0.5))
    }

    private fun position(latitude: Double, longitude: Double, zoom: Double = 10.0, tilt: Double = 0.0, bearing: Double = 0.0) =
        CameraPosition.Builder().target(LatLng(latitude, longitude)).zoom(zoom).tilt(tilt).bearing(bearing).build()

    private companion object {
        /** The status bar's room at the top of the windows the tests lay out. */
        const val SAFE_TOP = 24.0
    }
}
