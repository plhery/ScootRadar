package com.plhery.scootradar.map

import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ScreenPoint
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.MapLibre
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.MapLibreMapOptions
import org.maplibre.android.maps.Style
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.math.log2

// MapKit's numbers for an iPhone's 390×844 pt map (STATE.md, "App hooks"), against MapLibre's map through the
// projection the camera's rules read.
@RunWith(AndroidJUnit4::class)
class MapLibreProjectionTest {
    @Test
    fun aPhonesMapMeasuresTheFlatMapAsMapKitDoes() {
        val zurich = GeoPoint(47.3769, 8.5417)
        val zoom = MapZoom.fitting(MapRegion.around(zurich, 850.0, 850.0), width = 390.0, height = 844.0)
        withPhoneMap { map, projection ->
            assertEquals(390.0, projection.bounds.width, 0.0)
            assertEquals(844.0, projection.bounds.height, 0.0)
            for ((heading, size) in listOf(0.0 to (8392.0 to 18162.0), 45.0 to (18777.0 to 18777.0), 90.0 to (18162.0 to 8392.0))) {
                map.moveCamera(CameraUpdateFactory.newCameraPosition(flat(zurich, zoom, heading)))
                val rect = projection.visibleMapRect
                assertEquals("width at $heading°", size.first, rect.width, 1.0)
                assertEquals("height at $heading°", size.second, rect.height, 1.0)
                assertEquals(MapPoint(zurich).x, rect.midX, 1.0)
                assertEquals(MapPoint(zurich).y, rect.midY, 1.0)
                // The iPhone's zoom: MapLibre's + 1 north up, further out as the box widens.
                assertEquals(zoom + 1 - log2(size.first / 8392.0), MapZoom.level(on = projection), 1e-3)
            }
            map.moveCamera(CameraUpdateFactory.newCameraPosition(flat(zurich, zoom, 0.0)))
            val middle = projection.point(zurich)
            assertEquals(195.0, middle.x, 0.01)
            assertEquals(422.0, middle.y, 0.01)
        }
    }

    @Test
    fun aCoordinatePastTheAntimeridianComesBackOnTheOtherSide() {
        val east = GeoPoint(0.0, 179.999)
        val zoom = MapZoom.fitting(MapRegion.around(east, 850.0, 850.0), width = 390.0, height = 844.0)
        withPhoneMap { map, projection ->
            map.moveCamera(CameraUpdateFactory.newCameraPosition(flat(east, zoom, 0.0)))
            val coordinate = projection.coordinate(ScreenPoint(389.0, 422.0))
            assertEquals(-179.997, coordinate.longitude, 0.0005)
            assertEquals(179.999, projection.centerCoordinate.longitude, 1e-9)
            // Back where it was, on the centre's side of the line.
            assertEquals(389.0, projection.point(coordinate).x, 0.01)
            // The box runs on past the world's east edge, rather than round the whole world.
            val rect = projection.visibleMapRect
            assertTrue(rect.maxX > MapPoint.worldSize)
            assertEquals(MapRegion.around(east, 850.0, 850.0).longitudeDelta / 360 * MapPoint.worldSize, rect.width, 1.0)
        }
    }

    private fun flat(center: GeoPoint, zoom: Double, heading: Double): CameraPosition =
        CameraPosition.Builder().target(LatLng(center.latitude, center.longitude)).zoom(zoom).bearing(heading).tilt(0.0).build()

    /**
     * A map of 390×844 points, laid out past the edges of the emulator's screen as it needs to be. Its pixel ratio
     * is 2, so that its points are whole at any density.
     */
    private fun withPhoneMap(test: (MapLibreMap, MapLibreProjection) -> Unit) {
        ActivityScenario.launch(ComponentActivity::class.java).use { scenario ->
            val drawn = CountDownLatch(1)
            lateinit var view: ScooterMapView
            lateinit var map: MapLibreMap
            scenario.onActivity { activity ->
                MapLibre.getInstance(activity)
                val options = MapLibreMapOptions.createFromAttributes(activity).textureMode(true).pixelRatio(RATIO)
                view = ScooterMapView(activity, options)
                view.onCreate(null)
                val frame = FrameLayout(activity)
                frame.addView(view, FrameLayout.LayoutParams((390 * RATIO).toInt(), (844 * RATIO).toInt()))
                activity.setContentView(frame)
                view.onStart()
                view.onResume()
                view.getMapAsync { ready ->
                    map = ready
                    ready.setStyle(Style.Builder().fromJson(BLANK)) {
                        view.addOnDidFinishRenderingFrameListener { _, _, _ -> drawn.countDown() }
                    }
                }
            }
            assertTrue("the map drew a frame", drawn.await(60, TimeUnit.SECONDS))
            scenario.onActivity { test(map, MapLibreProjection(map, view)) }
            scenario.onActivity {
                view.onPause()
                view.onStop()
                view.onDestroy()
            }
        }
    }

    private companion object {
        const val RATIO = 2f
        const val BLANK = """{"version":8,"sources":{},"layers":[{"id":"land","type":"background","paint":{"background-color":"#eef0f4"}}]}"""
    }
}
