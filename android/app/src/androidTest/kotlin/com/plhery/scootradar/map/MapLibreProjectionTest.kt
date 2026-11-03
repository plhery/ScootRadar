package com.plhery.scootradar.map

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ScreenPoint
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import kotlin.math.log2

// MapKit's numbers for an iPhone's 390×844 pt map (STATE.md, "App hooks"), against MapLibre's map through the
// projection the camera's rules read.
@RunWith(AndroidJUnit4::class)
class MapLibreProjectionTest {
    @Test
    fun aPhonesMapMeasuresTheFlatMapAsMapKitDoes() {
        val zurich = GeoPoint(47.3769, 8.5417)
        val zoom = MapZoom.fitting(MapRegion.around(zurich, 850.0, 850.0), width = 390.0, height = 844.0)
        withPhoneMap { phone ->
            phone.onMain {
                val projection = phone.projection
                assertEquals(390.0, projection.bounds.width, 0.0)
                assertEquals(844.0, projection.bounds.height, 0.0)
                for ((heading, size) in listOf(0.0 to (8392.0 to 18162.0), 45.0 to (18777.0 to 18777.0), 90.0 to (18162.0 to 8392.0))) {
                    phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(flat(zurich, zoom, heading)))
                    val rect = projection.visibleMapRect
                    assertEquals("width at $heading°", size.first, rect.width, 1.0)
                    assertEquals("height at $heading°", size.second, rect.height, 1.0)
                    assertEquals(MapPoint(zurich).x, rect.midX, 1.0)
                    assertEquals(MapPoint(zurich).y, rect.midY, 1.0)
                    // The iPhone's zoom: MapLibre's + 1 north up, further out as the box widens.
                    assertEquals(zoom + 1 - log2(size.first / 8392.0), MapZoom.level(on = projection), 1e-3)
                }
                phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(flat(zurich, zoom, 0.0)))
                val middle = projection.point(zurich)
                assertEquals(195.0, middle.x, 0.01)
                assertEquals(422.0, middle.y, 0.01)
            }
        }
    }

    @Test
    fun aCoordinatePastTheAntimeridianComesBackOnTheOtherSide() {
        val east = GeoPoint(0.0, 179.999)
        val region = MapRegion.around(east, 850.0, 850.0)
        val zoom = MapZoom.fitting(region, width = 390.0, height = 844.0)
        withPhoneMap { phone ->
            phone.onMain {
                val projection = phone.projection
                phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(flat(east, zoom, 0.0)))
                val coordinate = projection.coordinate(ScreenPoint(389.0, 422.0))
                assertEquals(-179.997, coordinate.longitude, 0.0005)
                assertEquals(179.999, projection.centerCoordinate.longitude, 1e-9)
                // Back where it was, on the centre's side of the line.
                assertEquals(389.0, projection.point(coordinate).x, 0.01)
                // The box runs on past the world's east edge, rather than round the whole world.
                val rect = projection.visibleMapRect
                assertTrue(rect.maxX > MapPoint.worldSize)
                assertEquals(region.longitudeDelta / 360 * MapPoint.worldSize, rect.width, 1.0)
            }
        }
    }

    @Test
    fun theCountsArePlacedAllAtOnceWhereEachAloneIs() {
        // The Europe view of the phone's screenshot, turned, and a map across the antimeridian.
        val cases = listOf(
            flat(GeoPoint(47.75, 8.3), 5.2, 30.0) to listOf(GeoPoint(47.3769, 8.5417), GeoPoint(48.8566, 2.3522), GeoPoint(52.52, 13.405), GeoPoint(41.9, 12.5)),
            flat(GeoPoint(-17.7, 179.9), 6.0, 0.0) to listOf(GeoPoint(-17.7, -179.8), GeoPoint(-18.1, 178.4), GeoPoint(-16.5, 179.99)),
        )
        withPhoneMap { phone ->
            phone.onMain {
                val projection = phone.projection
                assertTrue(projection.points(emptyList()).isEmpty())
                for ((camera, coordinates) in cases) {
                    phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(camera))
                    val together = projection.points(coordinates)
                    for ((index, coordinate) in coordinates.withIndex()) {
                        val alone = projection.point(coordinate)
                        assertEquals("$coordinate x", alone.x, together[index].x, 0.01)
                        assertEquals("$coordinate y", alone.y, together[index].y, 0.01)
                    }
                }
            }
        }
    }

    private fun flat(center: GeoPoint, zoom: Double, heading: Double): CameraPosition =
        CameraPosition.Builder().target(LatLng(center.latitude, center.longitude)).zoom(zoom).bearing(heading).tilt(0.0).build()
}
