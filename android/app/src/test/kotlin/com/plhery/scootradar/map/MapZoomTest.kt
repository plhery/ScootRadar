package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.MapRect
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ScooterClusteringPolicy
import com.plhery.scootradar.core.model.ScooterMapProjection
import com.plhery.scootradar.core.model.ScooterZoneArea
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.log2
import kotlin.math.pow

class MapZoomTest {
    private val zurich = GeoPoint(47.3769, 8.5417)

    @Test
    fun aFlatMapIsOneLevelCloserThanMapLibreSays() {
        assertEquals(16.0, MapZoom.level(on = FlatMap(mapLibreZoom = 15.0)), 1e-9)
        assertEquals(8.5, MapZoom.level(on = FlatMap(mapLibreZoom = 7.5, width = 1280.0, height = 800.0)), 1e-9)
        assertEquals(16.0, MapZoom.level(mapLibreZoom = 15.0), 0.0)
        assertEquals(15.0, MapZoom.mapLibreZoom(level = 16.0), 0.0)
    }

    /** Each threshold of :core and the server, on both sides of it, from MapLibre's zoom (MAP-062–066, MAP-313). */
    @Test
    fun eachThresholdFallsAtTheIPhonesZoom() {
        val below = 1e-6
        // Scooters are grouped up to the iPhone's 15, on the zoom between levels: MapLibre's 14.
        assertTrue(ScooterClusteringPolicy.shouldCluster(MapZoom.level(mapLibreZoom = 14.0)))
        assertFalse(ScooterClusteringPolicy.shouldCluster(MapZoom.level(mapLibreZoom = 14.0 + below)))
        // The zoom asked for is the level's ceiling: bays from 16 (the controller's mapParking), past MapLibre's 14.
        assertEquals(15, MapZoom.apiZoom(MapZoom.level(mapLibreZoom = 14.0)))
        assertEquals(16, MapZoom.apiZoom(MapZoom.level(mapLibreZoom = 14.0 + below)))
        // Zones from 14, past MapLibre's 12.
        assertTrue(MapZoom.apiZoom(MapZoom.level(mapLibreZoom = 12.0)) < ScooterZoneArea.minimumZoom)
        assertEquals(ScooterZoneArea.minimumZoom, MapZoom.apiZoom(MapZoom.level(mapLibreZoom = 12.0 + below)))
        // The overview up to 10: MapLibre's 9 and below.
        assertEquals(ScooterClusteringPolicy.maximumOverviewZoom, MapZoom.apiZoom(MapZoom.level(mapLibreZoom = 9.0)))
        assertEquals(ScooterClusteringPolicy.maximumOverviewZoom + 1, MapZoom.apiZoom(MapZoom.level(mapLibreZoom = 9.0 + below)))
        // The closest the map goes is the server's 21, as MapKit's closest is, the furthest 2.
        assertEquals(21, MapZoom.apiZoom(MapZoom.level(MapZoom.maximum)))
        assertEquals(2, MapZoom.apiZoom(MapZoom.level(MapZoom.minimum)))
    }

    @Test
    fun aCameraDistanceShowsWhatMapKitsCameraShowsFromThere() {
        // MapKit's camera stood 90.05 m over Zürich HB at its closest on the iPhone's 440×956 map, which it draws at the
        // iPhone's zoom 21; 45.03 m over a map half as tall, 180.11 m over one twice as tall, and 90.78 m over Bern. Its
        // metres are 0.13% shorter than the sphere's, 0.002 of a level.
        assertEquals(20.0, MapZoom.atDistance(90.053, latitude = 47.3779, height = 956.0), 0.003)
        assertEquals(20.0, MapZoom.atDistance(45.027, latitude = 47.3779, height = 478.0), 0.003)
        assertEquals(20.0, MapZoom.atDistance(180.11, latitude = 47.3779, height = 1912.0), 0.003)
        assertEquals(20.0, MapZoom.atDistance(90.777, latitude = 46.9490, height = 956.0), 0.003)
        // A field of view of 30° from the map's top to its bottom: 1.8660 heights of the map, 1574.9 m over an 844 dp
        // map for 1 m a dp.
        assertEquals(1.8660, MapZoom.mapKitHeights, 0.0001)
        val zoom = MapZoom.atDistance(1574.9254, latitude = 0.0, height = 844.0)
        assertEquals(1.0, MapZoom.metresPerPoint(zoom, latitude = 0.0), 1e-6)
        assertEquals(1574.9254, MapZoom.mapKitDistance(zoom, latitude = 0.0, height = 844.0), 1e-6)
        // Further north a metre is more of the flat map.
        assertEquals(zoom + log2(0.5), MapZoom.atDistance(1574.9254, latitude = 60.0, height = 844.0), 1e-9)
        assertEquals(MapZoom.maximum, MapZoom.atDistance(0.01, latitude = 47.0, height = 844.0), 0.0)
        assertEquals(MapZoom.minimum, MapZoom.atDistance(1e9, latitude = 47.0, height = 844.0), 0.0)
    }

    @Test
    fun theCameraTiltsNoMoreThanMapKitsDoesAtItsZoom() {
        // MapKit's edges, at the iPhone's zooms 19, 17 and 16 over the equator, Zürich and Sydney alike.
        assertEquals(75.0, MapZoom.mapKitMostTilt(18.0), 0.0)
        assertEquals(70.0, MapZoom.mapKitMostTilt(17.999), 0.0)
        assertEquals(70.0, MapZoom.mapKitMostTilt(16.0), 0.0)
        assertEquals(60.0, MapZoom.mapKitMostTilt(15.999), 0.0)
        assertEquals(60.0, MapZoom.mapKitMostTilt(15.0), 0.0)
        assertEquals(35.0, MapZoom.mapKitMostTilt(14.999), 0.0)
        assertEquals(35.0, MapZoom.mapKitMostTilt(MapZoom.minimum), 0.0)
        assertEquals(75.0, MapZoom.mapKitMostTilt(MapZoom.maximum), 0.0)
        // Over Zürich on the iPhone's map, the first came between 360 and 361 m above the ground.
        assertEquals(75.0, MapZoom.mapKitMostTilt(MapZoom.atDistance(360.0, latitude = 47.3769, height = 956.0)), 0.0)
        assertEquals(70.0, MapZoom.mapKitMostTilt(MapZoom.atDistance(361.0, latitude = 47.3769, height = 956.0)), 0.0)
        // MapLibre goes no further than 60°.
        assertEquals(60.0, MapZoom.mostTilt(MapZoom.maximum), 0.0)
        assertEquals(60.0, MapZoom.mostTilt(15.0), 0.0)
        assertEquals(35.0, MapZoom.mostTilt(14.999), 0.0)
        assertEquals(35.0, MapZoom.mostTilt(12.0), 0.0)
    }

    @Test
    fun aWideMapGoesNoFurtherOutThanAWorldTwiceItsWidth() {
        // MapKit's pinch stopped at the iPhone's zoom 2 on maps 220 and 440 points wide, and at 2.781 on one 880 wide,
        // where the world was twice as wide as the map.
        assertEquals(MapZoom.minimum, MapZoom.minimum(width = 220.0), 0.0)
        assertEquals(MapZoom.minimum, MapZoom.minimum(width = 440.0), 0.0)
        assertEquals(MapZoom.minimum, MapZoom.minimum(width = 512.0), 0.0)
        assertEquals(2.781, MapZoom.level(MapZoom.minimum(width = 880.0)), 0.001)
        // MapLibre's world is 512 dp wide at its zoom 0.
        assertEquals(2 * 1280.0, 512 * 2.0.pow(MapZoom.minimum(width = 1280.0)), 1e-9)
        // A map not yet laid out goes as far as a phone's.
        assertEquals(MapZoom.minimum, MapZoom.minimum(width = 0.0), 0.0)
    }

    @Test
    fun aWiderBoxIsAFurtherZoomAsOnTheIPhone() {
        // Turned 45°, the box around a 390×844 phone's corners is 872.6 points of the flat map wide.
        val turned = FlatMap(mapLibreZoom = 15.0, mapWidth = (390.0 + 844.0) / 2.0.pow(0.5))
        assertEquals(16.0 - log2(872.5698 / 390), MapZoom.level(on = turned), 1e-5)
    }

    @Test
    fun aMapWithNoWidthIsAtZoomZero() {
        assertEquals(0.0, MapZoom.level(on = FlatMap(mapLibreZoom = 15.0, width = 0.0)), 0.0)
    }

    @Test
    fun anOpeningRegionFitsAsMapKitFitsIt() {
        // MapKit shows an 850 m region over Zürich on a 390×844 pt map as 8392×18162 map points.
        val region = MapRegion.around(zurich, latitudinalMeters = 850.0, longitudinalMeters = 850.0)
        val perPoint = MapPoint.worldSize / (512 * 2.0.pow(MapZoom.fitting(region, width = 390.0, height = 844.0)))
        assertEquals(8392.0, 390 * perPoint, 1.0)
        assertEquals(18162.0, 844 * perPoint, 1.0)

        // Switzerland's 500 km across fits the width; a wide window fits its 300 km down instead.
        val switzerland = MapRegion.around(GeoPoint(46.8182, 8.2275), latitudinalMeters = 300_000.0, longitudinalMeters = 500_000.0)
        val across = switzerland.longitudeDelta / 360 * MapPoint.worldSize
        assertEquals(
            across / 390,
            MapPoint.worldSize / (512 * 2.0.pow(MapZoom.fitting(switzerland, width = 390.0, height = 844.0))),
            1e-6,
        )
        val down = MapPoint(GeoPoint(46.8182 - switzerland.latitudeDelta / 2, 0.0)).y -
            MapPoint(GeoPoint(46.8182 + switzerland.latitudeDelta / 2, 0.0)).y
        assertEquals(
            down / 400,
            MapPoint.worldSize / (512 * 2.0.pow(MapZoom.fitting(switzerland, width = 2000.0, height = 400.0))),
            1e-6,
        )
    }

    @Test
    fun aFitStaysWithinTheMapsZooms() {
        assertEquals(MapZoom.maximum, MapZoom.fitting(MapRegion(zurich, 1e-7, 1e-7), width = 390.0, height = 844.0), 0.0)
        assertEquals(MapZoom.minimum, MapZoom.fitting(MapRegion(zurich, 170.0, 360.0), width = 39.0, height = 84.0), 0.0)
    }

    @Test
    fun theRegionOfAPartOfTheMapIsMapKits() {
        val middle = MapPoint(zurich)
        val rect = MapRect(middle.x - 4196, middle.y - 9081, 8392.0, 18162.0)
        val region = MapZoom.region(of = rect)

        assertEquals(zurich.latitude, region.center.latitude, 1e-9)
        assertEquals(zurich.longitude, region.center.longitude, 1e-9)
        assertEquals(8392.0 / MapPoint.worldSize * 360, region.longitudeDelta, 1e-12)
        val top = MapPoint(middle.x, rect.minY).coordinate.latitude
        val bottom = MapPoint(middle.x, rect.maxY).coordinate.latitude
        assertEquals(top - bottom, region.latitudeDelta, 1e-12)

        // More than the world across is the world.
        assertEquals(360.0, MapZoom.region(of = MapRect(-10.0, 0.0, 2 * MapPoint.worldSize, MapPoint.worldSize)).longitudeDelta, 0.0)
    }

    /** A map seen from straight above, north up, at a zoom of MapLibre's. */
    private class FlatMap(
        mapLibreZoom: Double,
        width: Double = 390.0,
        height: Double = 844.0,
        /** How many points of the screen the box around its corners is wide, when that is not its width. */
        mapWidth: Double = width,
    ) : ScooterMapProjection {
        private val perPoint = MapPoint.worldSize / (512 * 2.0.pow(mapLibreZoom))
        override val bounds = ScreenRect(0.0, 0.0, width, height)
        override val centerCoordinate = GeoPoint(47.3769, 8.5417)
        override val visibleMapRect = MapRect(0.0, 0.0, mapWidth * perPoint, height * perPoint)
        override fun point(coordinate: GeoPoint) = ScreenPoint.zero
        override fun coordinate(point: ScreenPoint) = centerCoordinate
    }
}
