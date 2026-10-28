package com.plhery.scootradar.map

import androidx.compose.ui.platform.AndroidUiDispatcher
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapFocusRequest
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.MapZoomRequest
import com.plhery.scootradar.core.model.ScreenPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

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

    @Test
    fun aMoveIsMadeAgainWhenTheMapChangesSize() = withCamera { phone, camera ->
        phone.onMain { camera.applyFocus(MapFocusRequest(bern, token = 1)) }
        settle()
        // A fold or a window leaves the map 300 points high: the span is fitted to it again (MAP-046).
        phone.resize(390, 300)
        settle()
        phone.onMain {
            val position = phone.map.cameraPosition
            assertEquals(MapZoom.fitting(MapRegion.around(bern, 850.0, 850.0), 390.0, 300.0), position.zoom, 1e-6)
            assertEquals(bern.latitude, position.target!!.latitude, 1e-6)
        }
    }

    @Test
    fun aHandOnTheMapEndsTheMoveAndItsFocus() = withCamera { phone, camera ->
        val reasons = java.util.concurrent.CopyOnWriteArrayList<Int>()
        val dragged = CountDownLatch(1)
        val zoom = phone.onMain {
            val start = phone.map.cameraPosition.zoom
            phone.map.addOnCameraMoveStartedListener { reasons += it }
            // Early in the move's two seconds, once it has taken a step, a hand pans the map (MAP-047). The main
            // thread does it, as it takes the move's steps: a test thread kept waiting by a just-booted phone's work
            // would let the move land first.
            phone.map.addOnCameraMoveListener {
                if (dragged.count > 0 && phone.map.cameraPosition.zoom > start) {
                    dragged.countDown()
                    phone.view.post { phone.drag(points = 200) }
                }
            }
            camera.applyFocus(MapFocusRequest(bern, token = 1))
            start
        }
        assertTrue("the move had begun within a second", dragged.await(1, TimeUnit.SECONDS))
        settle()
        val stopped = phone.onMain { phone.map.cameraPosition }
        val atBern = MapZoom.fitting(MapRegion.around(bern, 850.0, 850.0), 390.0, 844.0)
        assertTrue("the move was stopped short of Bern: ${stopped.zoom}, $reasons", stopped.zoom < atBern - 0.1)
        assertTrue("the move had begun", stopped.zoom > zoom)
        // The focus went with it: a new size moves nothing.
        phone.resize(390, 300)
        settle()
        phone.onMain { assertEquals(stopped.zoom, phone.map.cameraPosition.zoom, 1e-9) }
    }

    @Test
    fun theMapTiltsNoMoreThanMapKitsCameraWouldAtItsHeight() = withCamera { phone, camera ->
        phone.onMain { phone.map.moveCamera(CameraUpdateFactory.newLatLngZoom(LatLng(bern.latitude, bern.longitude), 17.0)) }
        settle()
        phone.onMain {
            // Close over Bern a hand tilts the map as far as it goes: MapKit's 70° there, MapLibre's 60°.
            phone.map.moveCamera(CameraUpdateFactory.tiltTo(85.0))
            assertEquals(60.0, phone.map.cameraPosition.tilt, 1e-6)
            // Out where MapKit's camera stands more than 3 m a point above the ground, 35°.
            phone.map.moveCamera(CameraUpdateFactory.zoomTo(13.0))
        }
        settle()
        phone.onMain {
            assertEquals(35.0, phone.map.cameraPosition.tilt, 1e-6)
            phone.map.moveCamera(CameraUpdateFactory.tiltTo(30.0))
            // A place asked for keeps a tilt the camera can have there. A street's span on a phone is some 3.8 km
            // of MapKit's camera above it, where it can have 35°.
            camera.applyFocus(MapFocusRequest(bern, token = 1))
        }
        settle()
        phone.onMain {
            assertEquals(30.0, phone.map.cameraPosition.tilt, 1e-6)
            phone.map.moveCamera(CameraUpdateFactory.zoomTo(17.0))
        }
        settle()
        phone.onMain {
            // Tilted again as far as it goes, then two steps out past the edge: the tilt comes down with the move.
            phone.map.moveCamera(CameraUpdateFactory.tiltTo(85.0))
            assertEquals(60.0, phone.map.cameraPosition.tilt, 1e-6)
            camera.applyZoom(MapZoomRequest(steps = -2, token = 1))
        }
        settle()
        phone.onMain {
            assertEquals(15.0, phone.map.cameraPosition.zoom, 1e-6)
            assertEquals(35.0, phone.map.cameraPosition.tilt, 1e-6)
        }
    }

    @Test
    fun aMapMadeAgainDoesNotTakeTheLastRequestsAgain() = withPhoneMap { phone ->
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
        val frames = CoroutineScope(SupervisorJob() + AndroidUiDispatcher.Main)
        val memory = MapCameraMemory()
        try {
            val first = phone.onMain {
                phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(MapCamera.opening(zurichStart)))
                MapCamera(phone.map, phone.view, testController(scope), memory, frames).also {
                    it.applyFocus(MapFocusRequest(bern, token = 1))
                }
            }
            settle()
            phone.onMain {
                first.applyZoom(MapZoomRequest(steps = 1, token = 1))
            }
            settle()
            // A font size changed: the activity and its map are made again, after the hand moved the map.
            val (zoom, second) = phone.onMain {
                first.close()
                phone.map.moveCamera(CameraUpdateFactory.newLatLng(LatLng(zurich.latitude, zurich.longitude)))
                phone.map.cameraPosition.zoom to MapCamera(phone.map, phone.view, testController(scope), memory, frames)
            }
            phone.onMain {
                second.applyFocus(MapFocusRequest(bern, token = 1))
                second.applyZoom(MapZoomRequest(steps = 1, token = 1))
            }
            settle()
            phone.onMain {
                val position = phone.map.cameraPosition
                assertEquals(zurich.latitude, position.target!!.latitude, 1e-6)
                assertEquals(zoom, position.zoom, 1e-9)
                second.close()
            }
        } finally {
            frames.cancel()
            scope.cancel()
        }
    }

    /** The camera of a phone's map opened on Zürich, tilted as the app opens it. */
    private fun withCamera(test: (PhoneMap, MapCamera) -> Unit) = withPhoneMap { phone ->
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
        val frames = CoroutineScope(SupervisorJob() + AndroidUiDispatcher.Main)
        val camera = phone.onMain {
            phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(MapCamera.opening(zurichStart)))
            MapCamera(phone.map, phone.view, testController(scope), MapCameraMemory(), frames)
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
}
