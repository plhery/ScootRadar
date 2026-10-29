package com.plhery.scootradar.map

import androidx.compose.ui.platform.AndroidUiDispatcher
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.MapFocusRequest
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ScooterCity
import com.plhery.scootradar.core.model.ScooterMapCameraPolicy
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterStartPlace
import com.plhery.scootradar.core.model.ScreenRect
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import kotlin.math.log2

// The map's part of ios/ScootRadarTests/ScooterFilteringTests.swift, on MapLibre's map of an iPhone's size.
@RunWith(AndroidJUnit4::class)
class ScooterFilteringTest {
    private val scooter = GeoPoint(latitude = 47.3769, longitude = 8.5417)

    @Test
    fun mapStartsWithASizeSoItOpensOnSwitzerland() {
        // A map created without a size drops the region it is given.
        assertFalse(ScooterMapCameraPolicy.openingFrame.isEmpty)

        withPhoneMap(camera = MapCamera.opening(ScooterMapStart.switzerland, MapKitCamera.IPhone)) { phone ->
            val center = phone.onMain { phone.map.cameraPosition.target!! }
            assertEquals(ScooterMapStart.switzerlandCenter.latitude, center.latitude, 0.5)
            assertEquals(ScooterMapStart.switzerlandCenter.longitude, center.longitude, 0.5)
        }
    }

    @Test
    fun mapOpensOnTheCityOfTheTimeZone() {
        // Berlin as data/ had it on 28 October 2026, on its own: data/ may add a German city nearer Berlin's main
        // place (LOG-370). Which city a zone opens on is :core's to test; the map opening on it is this one's.
        val berlin = ScooterCity(
            id = "de:Berlin", name = "Berlin", countryCode = "DE", center = GeoPoint(latitude = 52.52, longitude = 13.405),
            bounds = GeoBounds(south = 52.1367, west = 12.6012, north = 52.9019, east = 13.9059),
        )
        val start = ScooterStartPlace.start(forTimeZone = "Europe/Berlin", cities = listOf(berlin))
        withPhoneMap(camera = MapCamera.opening(start, MapKitCamera.IPhone)) { phone ->
            val center = phone.onMain { phone.map.cameraPosition.target!! }
            assertEquals(berlin.center.latitude, center.latitude, 0.02)
            assertEquals(berlin.center.longitude, center.longitude, 0.02)
        }
        assertEquals(ScooterStartPlace.cityZoom, start.zoom)
    }

    @Test
    fun centringAScooterShowsItInTheMapLeftVisibleAboveTheDock() = withPhoneMap { phone ->
        phone.setRegion(MapRegion.around(scooter, 850.0, 850.0))
        phone.onMain {
            // The search bar ends at 110 pt and a tall card begins at 380 pt: the middle is at 245 pt.
            val center = phone.centre(visible = ScreenRect(0.0, 110.0, 390.0, 270.0))
            assertTrue(center.latitude < scooter.latitude)
            assertEquals(scooter.longitude, center.longitude, 0.0001)

            phone.map.moveCamera(CameraUpdateFactory.newLatLng(LatLng(center.latitude, center.longitude)))
            val shown = phone.projection.point(scooter)
            assertEquals(245.0, shown.y, 3.0)
            assertEquals(195.0, shown.x, 3.0)

            // Nothing covers the map, or nearly all of it is covered: the scooter itself is the centre.
            val uncovered = phone.centre(visible = ScreenRect(0.0, 0.0, 390.0, 844.0))
            assertEquals(scooter.latitude, uncovered.latitude, 0.000_001)
            val covered = phone.centre(visible = ScreenRect(0.0, 400.0, 390.0, 20.0))
            assertEquals(scooter.latitude, covered.latitude, 0.000_001)
        }
    }

    @Test
    fun centringAScooterBesideAPanelShowsItInTheMiddleOfTheMapLeftVisible() = withPhoneMap { phone ->
        phone.resize(1376, 1032)
        settle()
        phone.setRegion(MapRegion.around(scooter, 850.0, 850.0))
        phone.onMain {
            // A panel 380 pt wide 16 pt from the edge: the middle of the rest is at 886 pt.
            val center = phone.centre(visible = ScreenRect(396.0, 0.0, 980.0, 1032.0))
            phone.map.moveCamera(CameraUpdateFactory.newLatLng(LatLng(center.latitude, center.longitude)))
            val shown = phone.projection.point(scooter)
            assertEquals(886.0, shown.x, 3.0)
            assertEquals(516.0, shown.y, 3.0)
        }
    }

    /**
     * T055. setRegionPreservingPerspective is MapCamera's move to a place here: the move itself, on a map without
     * margins as the iPhone's test has it, given the part of the map left visible as the iPhone's test gives it. Beside
     * a panel the region's centre goes to the middle of the part left, at the zoom it has alone; then the same beside
     * a real panel's chrome, which moves the map's margins too.
     */
    @Test
    fun aRegionBesideAPanelIsShownInTheMiddleOfTheMapLeftVisibleAtTheSameZoom() = withPhoneMap { phone ->
        phone.resize(1376, 1032)
        settle()
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
        val frames = CoroutineScope(SupervisorJob() + AndroidUiDispatcher.Main)
        val camera = phone.onMain {
            MapCamera(phone.map, phone.view, testController(scope), MapCameraMemory(), frames, animationsOn = { false })
        }
        try {
            settle()
            val request = MapFocusRequest(point = scooter, token = 1)
            // Each move starts far from the place, as the iPhone's test starts each on a new map: one that kept the
            // camera, or measured before it moved, would not fit the place again.
            fun elsewhere() = phone.map.moveCamera(CameraUpdateFactory.newLatLngZoom(LatLng(0.0, 0.0), 3.0))

            // As on a phone: the band between the search bar and the dock leaves the sides alone, and the region is
            // the map's own.
            val alone = phone.onMain {
                assertEquals(1376.0, phone.projection.bounds.width, 0.0)
                elsewhere()
                camera.move(request, visible = ScreenRect(0.0, 110.0, 1376.0, 700.0))
                val centred = phone.projection.point(scooter)
                assertEquals(688.0, centred.x, 3.0)
                assertEquals(516.0, centred.y, 3.0)
                phone.map.cameraPosition.zoom
            }

            phone.onMain {
                elsewhere()
                camera.move(request, visible = ScreenRect(396.0, 24.0, 980.0, 1008.0))
                val shown = phone.projection.point(scooter)
                assertEquals(886.0, shown.x, 3.0)
                assertEquals(516.0, shown.y, 3.0)
                // MapKit's camera distance within 1%: the zoom within log2(1.01).
                assertEquals(alone, phone.map.cameraPosition.zoom, log2(1.01))
            }

            // Beside a real panel, 380 points wide 16 in from the edge: in the middle of the part beside it too.
            phone.onMain {
                camera.chromeDidChange(MapChrome(panel = ScreenRect(16.0, 16.0, 380.0, 1000.0)))
                elsewhere()
                camera.applyFocus(request.copy(token = 2))
                val shown = phone.projection.point(scooter)
                assertEquals(886.0, shown.x, 3.0)
                assertEquals(516.0, shown.y, 3.0)
            }
        } finally {
            phone.onMain { camera.close() }
            frames.cancel()
            scope.cancel()
        }
    }

    @Test
    fun focusRequestWaitsUntilTheMapHasASize() = withPhoneMap { phone ->
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
        val frames = CoroutineScope(SupervisorJob() + AndroidUiDispatcher.Main)
        val memory = MapCameraMemory()
        phone.resize(0, 0)
        settle()
        try {
            val camera = phone.onMain {
                val controller = testController(scope)
                val address = MapDestination(
                    title = "Bahnhofplatz",
                    subtitle = "",
                    point = scooter,
                    kind = MapDestination.Kind.Address,
                    isCovered = true,
                )
                controller.focusOnAddress(address)
                MapCamera(phone.map, phone.view, controller, memory, frames).also {
                    // Before the first layout the request is kept for later, not dropped.
                    it.applyFocus(controller.focusRequest.value)
                }
            }
            settle()
            assertNull(memory.focusToken)

            // The region change that follows the layout applies it.
            phone.resize(390, 844)
            settle()
            phone.onMain {
                assertEquals(1, memory.focusToken)
                assertEquals(scooter.latitude, phone.map.cameraPosition.target!!.latitude, 1e-6)
                camera.close()
            }
        } finally {
            frames.cancel()
            scope.cancel()
        }
    }

    /** Where the map's centre goes for the scooter to show in the middle of the part of the map left visible. */
    private fun PhoneMap.centre(visible: ScreenRect): GeoPoint =
        ScooterMapCameraPolicy.center(showing = scooter, on = projection, visible = visible)
}
