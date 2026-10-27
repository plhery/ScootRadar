package com.plhery.scootradar.map

import androidx.compose.ui.platform.AndroidUiDispatcher
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.app.NotDeterminedLocationManager
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.MapFocusRequest
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.MapZoomRequest
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScreenPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng

// The moves of ScooterMapView's coordinator (MAP-039–049), on MapLibre's map of an iPhone's size.
@RunWith(AndroidJUnit4::class)
class MapCameraTest {
    private val bern = GeoPoint(46.9480, 7.4474)
    private val zurich = GeoPoint(47.3769, 8.5417)

    @Test
    fun aPlaceAskedForIsShownInTheMiddleOfTheMapAtItsSpan() = withCamera { phone, camera ->
        phone.onMain { camera.applyFocus(MapFocusRequest(bern, token = 1)) }
        settle()
        phone.onMain {
            val position = phone.map.cameraPosition
            assertEquals(bern.latitude, position.target!!.latitude, 1e-6)
            assertEquals(bern.longitude, position.target!!.longitude, 1e-6)
            assertEquals(MapZoom.fitting(MapRegion.around(bern, 850.0, 850.0), 390.0, 844.0), position.zoom, 1e-6)
            // The tilt the map opened with stays.
            assertEquals(20.0, position.tilt, 1e-6)
            val shown = phone.projection.point(bern)
            assertEquals(195.0, shown.x, 0.5)
            assertEquals(422.0, shown.y, 0.5)

            // A token is taken once: the map stays where the hand put it.
            phone.map.moveCamera(CameraUpdateFactory.newLatLng(LatLng(zurich.latitude, zurich.longitude)))
            camera.applyFocus(MapFocusRequest(bern, token = 1))
        }
        settle()
        phone.onMain { assertEquals(zurich.latitude, phone.map.cameraPosition.target!!.latitude, 1e-6) }
    }

    @Test
    fun aPlaceAskedForAtTheSameZoomIsShownBelowTheStatusBar() = withCamera { phone, camera ->
        // A scooter in view, as the card's header asks for it (focusOnScooter).
        val (zoom, scooter) = phone.onMain {
            camera.safeAreaDidChange(MapInsets(top = 40.0, left = 0.0, bottom = 0.0, right = 0.0))
            phone.map.cameraPosition.zoom to phone.projection.coordinate(ScreenPoint(120.0, 600.0))
        }
        phone.onMain { camera.applyFocus(MapFocusRequest.center(scooter, token = 1)) }
        settle()
        phone.onMain {
            assertEquals(zoom, phone.map.cameraPosition.zoom, 1e-9)
            // In the middle of the map below the status bar, from 40 to 844: on a tilted map, near enough.
            val shown = phone.projection.point(scooter)
            assertEquals(195.0, shown.x, 1.0)
            assertEquals(442.0, shown.y, 2.0)
        }
    }

    @Test
    fun aStepInDoublesTheScaleAndKeepsWhatIsInTheMiddle() = withCamera { phone, camera ->
        val (zoom, kept) = phone.onMain {
            phone.map.cameraPosition.zoom to phone.projection.coordinate(phone.projection.point(phone.projection.centerCoordinate))
        }
        phone.onMain { camera.applyZoom(MapZoomRequest(steps = 1, token = 1)) }
        settle()
        phone.onMain {
            val position = phone.map.cameraPosition
            assertEquals(zoom + 1, position.zoom, 1e-9)
            assertEquals(20.0, position.tilt, 1e-6)
            val shown = phone.projection.point(kept)
            assertEquals(195.0, shown.x, 0.5)
            assertEquals(422.0, shown.y, 0.5)
        }
    }

    /** The camera of a phone's map opened on Zürich, tilted as the app opens it. */
    private fun withCamera(test: (PhoneMap, MapCamera) -> Unit) = withPhoneMap { phone ->
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
        val frames = CoroutineScope(SupervisorJob() + AndroidUiDispatcher.Main)
        val camera = phone.onMain {
            phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(MapCamera.opening(zurichStart)))
            MapCamera(phone.map, phone.view, controller(scope), MapCameraMemory(), frames)
        }
        settle()
        try {
            test(phone, camera)
        } finally {
            phone.onMain { camera.close() }
            frames.cancel()
            scope.cancel()
        }
    }

    /** Long enough for a move of MapKit's time to land. */
    private fun settle() {
        Thread.sleep(1_000)
        InstrumentationRegistry.getInstrumentation().waitForIdleSync()
    }

    private val zurichStart = ScooterMapStart(MapRegion.around(zurich, 8_906.0, 9_052.0), zoom = 12)

    private fun controller(scope: CoroutineScope) = ScooterMapController(
        api = object : ScooterAPIClient {
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(vehicles = emptyList())
        },
        locationManager = NotDeterminedLocationManager(),
        defaults = InMemoryScooterDefaults(),
        scope = scope,
        directions = object : WalkingDirectionsClient {
            override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> = emptyList()
        },
        openInMaps = {},
        phoneLanguages = { listOf("en-US") },
    )
}
