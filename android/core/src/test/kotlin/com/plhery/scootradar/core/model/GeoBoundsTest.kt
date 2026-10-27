package com.plhery.scootradar.core.model

import kotlin.math.PI
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

// ios/ScootRadarTests/GeoBoundsTests.swift; the MapKit drawing test is the map's, on a device.
class GeoBoundsTest {
    private fun region(latitude: Double, longitude: Double, latitudeDelta: Double, longitudeDelta: Double) =
        MapRegion(GeoPoint(latitude, longitude), latitudeDelta, longitudeDelta)

    @Test
    fun regionConversionAndContainment() {
        val bounds = GeoBounds(region(47.3769, 8.5417, 0.02, 0.04))

        assertEquals(47.3669, bounds.south, 0.000_001)
        assertEquals(47.3869, bounds.north, 0.000_001)
        assertEquals(8.5217, bounds.west, 0.000_001)
        assertEquals(8.5617, bounds.east, 0.000_001)
        assertTrue(bounds.contains(latitude = 47.3769, longitude = 8.5417))
        assertFalse(bounds.contains(latitude = 47.4, longitude = 8.5417))
    }

    @Test
    fun expandedBoundsContainOriginalBounds() {
        val original = GeoBounds(region(47.3769, 8.5417, 0.01, 0.01))

        assertTrue(original.expanded(by = 0.25).contains(original))
    }

    @Test
    fun expansionClampsWorldCoordinates() {
        val world = GeoBounds(region(0.0, 0.0, 180.0, 360.0)).expanded(by = 1.0)

        assertEquals(-90.0, world.south, 0.0)
        assertEquals(90.0, world.north, 0.0)
        assertEquals(-180.0, world.west, 0.0)
        assertEquals(180.0, world.east, 0.0)
    }

    // New Zealand lies just west of 180°: Auckland west of the line, the Chatham Islands east of it.
    private val auckland = GeoPoint(latitude = -36.8485, longitude = 174.7633)
    private val chatham = GeoPoint(latitude = -43.95, longitude = -176.56)

    private fun region(longitude: Double, span: Double) = region(-36.52, longitude, 21.08, span)

    @Test
    fun aViewPastTheLineEastwardsCrossesIt() {
        // Centred on 181.4°E, which MapKit calls -178.6°.
        val bounds = GeoBounds(region(longitude = -178.6, span = 43.0))

        assertTrue(bounds.crossesDateLine)
        assertEquals(159.9, bounds.west, 0.000_001)
        assertEquals(-157.1, bounds.east, 0.000_001)
        assertEquals(43.0, bounds.longitudeSpan, 0.000_001)
        assertTrue(bounds.contains(auckland))
        assertTrue(bounds.contains(chatham))
        assertTrue(bounds.contains(latitude = -40.0, longitude = 180.0))
        assertTrue(bounds.contains(latitude = -40.0, longitude = -180.0))
        assertFalse(bounds.contains(latitude = -36.8, longitude = 150.0))
        assertFalse(bounds.contains(latitude = -36.8, longitude = -150.0))
        assertFalse(bounds.contains(latitude = -20.0, longitude = 174.7))
    }

    @Test
    fun aViewPastTheLineWestwardsCrossesIt() {
        // Centred on Tauranga, reaching past 180° on the right.
        val bounds = GeoBounds(region(longitude = 176.17, span = 20.0))

        assertTrue(bounds.crossesDateLine)
        assertEquals(166.17, bounds.west, 0.000_001)
        assertEquals(-173.83, bounds.east, 0.000_001)
        assertTrue(bounds.contains(auckland))
        assertTrue(bounds.contains(chatham))
        assertEquals(176.17, bounds.center.longitude, 0.000_001)
    }

    @Test
    fun aViewWiderThanTheWorldIsAllOfIt() {
        val bounds = GeoBounds(region(longitude = -178.6, span = 400.0))

        assertFalse(bounds.crossesDateLine)
        assertEquals(-180.0, bounds.west, 0.0)
        assertEquals(180.0, bounds.east, 0.0)
        assertTrue(bounds.contains(auckland))
        assertTrue(bounds.contains(chatham))
    }

    @Test
    fun anEdgeExactlyOnTheLineStaysOnTheSideOfTheView() {
        val east = GeoBounds(region(longitude = -165.0, span = 30.0))
        assertFalse(east.crossesDateLine)
        assertEquals(-180.0, east.west, 0.0)
        assertEquals(-150.0, east.east, 0.0)

        val west = GeoBounds(region(longitude = 165.0, span = 30.0))
        assertFalse(west.crossesDateLine)
        assertEquals(150.0, west.west, 0.0)
        assertEquals(180.0, west.east, 0.0)
        assertTrue(west.contains(latitude = -36.52, longitude = 180.0))
        assertFalse(west.contains(latitude = -36.52, longitude = -179.9))

        // Centred on the line itself.
        val across = GeoBounds(region(longitude = 180.0, span = 20.0))
        assertTrue(across.crossesDateLine)
        assertEquals(170.0, across.west, 0.0)
        assertEquals(-170.0, across.east, 0.000_001)
        assertEquals(across, GeoBounds(region(longitude = -180.0, span = 20.0)))
    }

    @Test
    fun boxesAcrossTheLineMeetAndHoldBoxesOnEitherSide() {
        val view = GeoBounds(region(longitude = -178.6, span = 43.0))
        val tauranga = GeoBounds(south = -37.8, west = 176.0, north = -37.5, east = 176.4)
        val islands = GeoBounds(south = -44.4, west = -177.0, north = -43.6, east = -176.1)
        val hawaii = GeoBounds(south = 18.9, west = -160.3, north = 22.3, east = -154.8)

        assertTrue(view.intersects(tauranga))
        assertTrue(tauranga.intersects(view))
        assertTrue(view.intersects(islands))
        assertFalse(view.intersects(hawaii))
        assertTrue(view.contains(tauranga))
        assertTrue(view.contains(islands))
        assertTrue(view.contains(GeoBounds(south = -40.0, west = 170.0, north = -38.0, east = -170.0)))
        assertFalse(view.contains(GeoBounds(south = -40.0, west = 150.0, north = -38.0, east = -170.0)))
        // Only the whole world holds a box across the line without crossing it.
        assertTrue(GeoBounds(south = -90.0, west = -180.0, north = 90.0, east = 180.0).contains(view))
        assertFalse(GeoBounds(south = -90.0, west = -179.0, north = 90.0, east = 179.0).contains(view))
    }

    @Test
    fun paddingReachesAcrossTheLineAndRoundTheWorld() {
        val westOfTheLine = GeoBounds(south = -40.0, west = 170.0, north = -36.0, east = 179.0).expanded(by = 0.25)
        assertTrue(westOfTheLine.crossesDateLine)
        assertEquals(167.75, westOfTheLine.west, 0.000_001)
        assertEquals(-178.75, westOfTheLine.east, 0.000_001)

        val view = GeoBounds(region(longitude = -178.6, span = 43.0))
        val padded = view.expanded(by = 0.25)
        assertTrue(padded.contains(view))
        assertEquals(64.5, padded.longitudeSpan, 0.000_001)

        val round = GeoBounds(south = -10.0, west = -170.0, north = 10.0, east = 170.0).expanded(by = 0.25)
        assertEquals(-180.0, round.west, 0.0)
        assertEquals(180.0, round.east, 0.0)
    }

    @Test
    fun theMiddleOfAViewAcrossTheLineIsOnTheLine() {
        val view = GeoBounds(region(longitude = -178.6, span = 43.0))
        assertEquals(-178.6, view.center.longitude, 0.000_001)
        assertEquals(-36.52, view.center.latitude, 0.000_001)
        assertEquals(8.5, GeoBounds(south = 47.0, west = 8.0, north = 48.0, east = 9.0).center.longitude, 0.0)
    }

    @Test
    fun zeroAndMinusZeroAreOneCoordinateAsInSwift() {
        assertEquals(GeoBounds(0.0, 0.0, 1.0, 1.0), GeoBounds(-0.0, -0.0, 1.0, 1.0))
        assertEquals(GeoBounds(0.0, 0.0, 1.0, 1.0).hashCode(), GeoBounds(-0.0, -0.0, 1.0, 1.0).hashCode())
        assertEquals(GeoPoint(0.0, 0.0), GeoPoint(-0.0, 0.0))
    }

    @Test
    fun anUnclearSpanOrPointKeepsToTheBoundsAsSwiftsMinAndMaxDo() {
        // Swift's max(-90, .nan) is -90, where kotlin.math.max gives NaN.
        val view = GeoBounds(MapRegion(GeoPoint(47.0, 8.0), latitudeDelta = Double.NaN, longitudeDelta = 1.0))
        assertEquals(GeoBounds(south = -90.0, west = 7.5, north = 90.0, east = 8.5), view)
        assertTrue(view.contains(GeoPoint(47.0, 8.0)))
        val padded = GeoBounds(south = 1.0, west = 1.0, north = 2.0, east = 2.0).expanded(by = Double.NaN)
        assertEquals(listOf(-90.0, 90.0), listOf(padded.south, padded.north))
        // Half the world round, as asin(min(1, .nan)) is asin(1).
        val unclear = ScooterCityCatalog.distanceMeters(GeoPoint(Double.NaN, 8.0), GeoPoint(47.0, 8.0))
        assertEquals(PI * 6_371_000, unclear, 1e-6)
    }
}
