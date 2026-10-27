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
        // The closest the map goes is the server's 22, the furthest 1.
        assertEquals(22, MapZoom.apiZoom(MapZoom.level(MapZoom.maximum)))
        assertEquals(1, MapZoom.apiZoom(MapZoom.level(MapZoom.minimum)))
    }

    @Test
    fun aCameraDistanceIsMapLibresOwnCamerasScale() {
        // MapLibre's camera stands 1.5 heights of the map away: 1266 m over an 844 dp map is 1 m a dp.
        val zoom = MapZoom.atDistance(1266.0, latitude = 0.0, height = 844.0)
        assertEquals(2 * Math.PI * 6_378_137.0 / (512 * 2.0.pow(zoom)), 1.0, 1e-9)
        // Further north a metre is more of the flat map.
        assertEquals(zoom + log2(0.5), MapZoom.atDistance(1266.0, latitude = 60.0, height = 844.0), 1e-9)
        assertEquals(MapZoom.maximum, MapZoom.atDistance(0.01, latitude = 47.0, height = 844.0), 0.0)
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
