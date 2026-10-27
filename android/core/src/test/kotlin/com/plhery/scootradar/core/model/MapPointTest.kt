package com.plhery.scootradar.core.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

// MKMapPoint's values, as MapKit gave them on macOS 27 (MKMapPoint(coordinate) and .coordinate), for the walk
// trail's dots and the fit of a route, which measure the flat map in its points.
class MapPointTest {
    @Test
    fun aCoordinateIsAtThePointMapKitPutsItAt() {
        assertPoint(134_217_728.0, 134_217_728.0, GeoPoint(0.0, 0.0))
        assertPoint(140_586_881.1514311, 94_002_247.12822987, GeoPoint(47.3769, 8.5417))
        assertPoint(246_967_554.10261333, 161_086_037.16240326, GeoPoint(-33.8688, 151.2093))
        assertPoint(745.6540444480048, 77_953_560.01662686, GeoPoint(60.0, -179.999))
        assertPoint(MapPoint.worldSize, 134_217_728.0, GeoPoint(0.0, 180.0))
        // The map stops 85° from the equator.
        assertPoint(134_217_728.0, 439_674.4024835378, GeoPoint(85.1, 0.0))
        assertPoint(134_217_728.0, 439_674.4024835378, GeoPoint(90.0, 0.0))
        assertPoint(134_217_728.0, 267_995_781.59751648, GeoPoint(-89.9, 0.0))
        assertPoint(136_454_690.13333333, 267_994_926.06398153, GeoPoint(-84.9999, 3.0))
        // What is not a coordinate.
        assertPoint(-1.0, -1.0, GeoPoint(91.0, 0.0))
        assertPoint(-1.0, -1.0, GeoPoint(0.0, 190.0))
        assertPoint(-1.0, -1.0, GeoPoint(Double.NaN, 0.0))
    }

    @Test
    fun aPointIsAtTheCoordinateMapKitGivesIt() {
        assertCoordinate(85.05112877980659, -180.0, MapPoint(0.0, 0.0))
        assertCoordinate(47.3769, 8.5417, MapPoint(140_586_881.1514311, 94_002_247.12822987))
        // Past the world's edges: round it east and west, beyond 85° north and south.
        assertCoordinate(85.051128201343, 179.99865889549255, MapPoint(-1_000.0, 5.0))
        assertCoordinate(41.648031768182285, -179.99865889549255, MapPoint(268_436_456.0, 1.0e8))
        assertCoordinate(41.648031768182285, -179.99999329447746, MapPoint(2 * MapPoint.worldSize + 5, 1.0e8))
        assertCoordinate(85.16548289565795, -45.889549255371094, MapPoint(1.0e8, -1.0e6))
        assertCoordinate(-87.63490542535585, -45.889549255371094, MapPoint(1.0e8, 3.0e8))
    }

    // MKMapRect's intersects and insetBy, for the zones near a tile.
    @Test
    fun rectsMeetAndGrowAsMapKitHasThem() {
        val rect = MapRect(0.0, 0.0, 10.0, 10.0)
        assertTrue(rect.intersects(MapRect(9.5, 0.0, 10.0, 10.0)))
        assertTrue(rect.intersects(MapRect(5.0, 5.0, 0.0, 0.0)))
        // Rects that only touch do not meet.
        assertFalse(rect.intersects(MapRect(10.0, 0.0, 10.0, 10.0)))
        assertFalse(rect.intersects(MapRect(10.0, 5.0, 0.0, 3.0)))
        assertFalse(rect.intersects(MapRect(-5.0, -5.0, 5.0, 20.0)))
        assertTrue(rect.intersects(MapRect(-5.0, -5.0, 5.0001, 20.0)))
        // A rect of no size on another's edge meets it, but the other does not meet it.
        assertFalse(rect.intersects(MapRect(0.0, 0.0, 0.0, 0.0)))
        assertTrue(MapRect(0.0, 0.0, 0.0, 0.0).intersects(rect))
        assertFalse(rect.intersects(MapRect(0.0, 5.0, 0.0, 0.0)))
        assertTrue(MapRect(0.0, 5.0, 0.0, 0.0).intersects(rect))

        assertEquals(MapRect(-4.0, -4.0, 18.0, 18.0), rect.insetBy(dx = -4.0, dy = -4.0))
        assertEquals(MapRect(6.0, 6.0, -2.0, -2.0), rect.insetBy(dx = 6.0, dy = 6.0))
    }

    private fun assertPoint(x: Double, y: Double, coordinate: GeoPoint) {
        val point = MapPoint(coordinate)
        assertEquals("$coordinate", x, point.x, 0.000_001)
        assertEquals("$coordinate", y, point.y, 0.000_001)
    }

    private fun assertCoordinate(latitude: Double, longitude: Double, point: MapPoint) {
        val coordinate = point.coordinate
        assertEquals("$point", latitude, coordinate.latitude, 1e-12)
        assertEquals("$point", longitude, coordinate.longitude, 1e-12)
    }
}
