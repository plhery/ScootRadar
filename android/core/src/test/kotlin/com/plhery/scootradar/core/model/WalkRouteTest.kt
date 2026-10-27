package com.plhery.scootradar.core.model

import kotlin.math.PI
import kotlin.math.cos
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

// ios/ScootRadarTests/WalkRouteTests.swift. The trail's look and the camera's fit (WalkTrailLook,
// ScooterMapCameraPolicy) are the map view's, and come with it.

class WalkRouteTest {
    private val start = GeoPoint(latitude = 47.3769, longitude = 8.5417)

    // Connectors

    @Test
    fun aPathThatStopsShortIsJoinedToTheRiderAndTheScooter() {
        val target = point(east = 300.0, north = 0.0)
        val path = listOf(point(east = 0.0, north = 20.0), point(east = 300.0, north = 20.0))

        val route = WalkRoute(origin = start, path = path, target = target)

        assertEquals(4, route.points.size)
        assertEquals(start, route.start)
        assertEquals(target, route.end)
        assertEquals(340.0, route.length, 1.0)
    }

    @Test
    fun aPathWithinTwoMetresOfBothEndsGetsNoConnector() {
        val target = point(east = 300.0, north = 0.0)
        val path = listOf(point(east = 1.0, north = 1.0), point(east = 299.0, north = 1.0))

        val route = WalkRoute(origin = start, path = path, target = target)

        assertEquals(path, route.points)
    }

    @Test
    fun anEmptyPathIsTheStraightLine() {
        val target = point(east = 0.0, north = 150.0)

        val route = WalkRoute(origin = start, path = emptyList(), target = target)

        assertEquals(listOf(start, target), route.points)
        assertEquals(start.distance(to = target), route.length, 1.0)
    }

    @Test
    fun aSinglePointIsAPathOfNoLength() {
        val route = WalkRoute(points = listOf(start))

        assertEquals(2, route.points.size)
        assertEquals(0.0, route.length, 0.0)
        assertEquals(0.0, route.position(of = point(east = 10.0, north = 0.0))?.along)
    }

    // Lengths

    @Test
    fun lengthsAddUpAlongThePathAsCoreLocationMeasuresThem() {
        val corner = point(east = 400.0, north = 0.0)
        val end = point(east = 400.0, north = 300.0)
        val route = WalkRoute(points = listOf(start, corner, end))

        assertEquals(0.0, route.distances[0], 0.0)
        assertEquals(start.distance(to = corner), route.distances[1], 2.0)
        assertEquals(start.distance(to = corner) + corner.distance(to = end), route.length, 3.0)
        assertEquals(route.length - 100, route.remainingDistance(from = 100.0), 0.001)
        assertEquals(0.0, route.remainingDistance(from = 10_000.0), 0.0)
    }

    // Progress

    @Test
    fun aLocationBesideThePathIsPlacedOnIt() {
        val route = WalkRoute(points = listOf(start, point(east = 200.0, north = 0.0)))

        val position = unwrap(route.position(of = point(east = 80.0, north = 12.0)))

        assertEquals(80.0, position.along, 0.5)
        assertEquals(12.0, position.offset, 0.5)
        assertEquals(0, position.segment)
        assertEquals(0.0, position.point.distance(to = point(east = 80.0, north = 0.0)), 0.5)
    }

    @Test
    fun aPathThatComesBackBesideItselfKeepsTheRiderWhereTheyAre() {
        // Out along a street and back on the other side of it, 20 m away.
        val route = WalkRoute(
            points = listOf(
                start, point(east = 200.0, north = 0.0), point(east = 200.0, north = 20.0), point(east = 0.0, north = 20.0),
            ),
        )
        val nearTheStart = point(east = 2.0, north = 9.0)

        val atFirst = unwrap(route.position(of = nearTheStart, after = 0.0))
        assertTrue(atFirst.along < 10)

        // Once on the way back, the same spot is the end of the walk.
        val onTheWayBack = unwrap(route.position(of = nearTheStart, after = 380.0))
        assertTrue(onTheWayBack.along > 400)
    }

    @Test
    fun aLocationIsNeverPlacedMoreThanThirtyMetresBack() {
        val route = WalkRoute(points = listOf(start, point(east = 300.0, north = 0.0)))

        val slightlyBack = unwrap(route.position(of = point(east = 80.0, north = 0.0), after = 100.0))
        assertEquals(80.0, slightlyBack.along, 0.5)

        val farBack = unwrap(route.position(of = point(east = 20.0, north = 0.0), after = 100.0))
        assertEquals(70.0, farBack.along, 0.5)
        assertEquals(50.0, farBack.offset, 0.5)
    }

    @Test
    fun leavingThePathDependsOnHowPreciseTheLocationIs() {
        assertFalse(WalkRoute.isOffRoute(40.0, accuracy = 5.0))
        assertTrue(WalkRoute.isOffRoute(41.0, accuracy = 5.0))
        // A location good to 40 m may lie 60 m from the path.
        assertFalse(WalkRoute.isOffRoute(59.0, accuracy = 40.0))
        assertTrue(WalkRoute.isOffRoute(61.0, accuracy = 40.0))
        assertTrue(WalkRoute.isOffRoute(41.0, accuracy = -1.0))
    }

    @Test
    fun theRiderIsThereWithinTwentyMetres() {
        assertTrue(WalkRoute.hasArrived(point(east = 19.0, north = 0.0), at = start))
        assertFalse(WalkRoute.hasArrived(point(east = 21.0, north = 0.0), at = start))
    }

    @Test
    fun aWalkIsTenKilometresAtMost() {
        assertTrue(WalkRoute.isWalk(from = start, to = point(east = 0.0, north = 9_900.0)))
        assertFalse(WalkRoute.isWalk(from = start, to = point(east = 0.0, north = 10_100.0)))
    }

    // Walk

    @Test
    fun theButtonAndTheLineFollowTheWalk() {
        val scooter = Scooter(
            provider = "lime", latitude = start.latitude, longitude = start.longitude, battery = 80,
            rangeMeters = null, vehicleID = "s1", deepLink = null, rentalURIs = null, distanceMeters = 0.0,
        )
        var walk = ScooterWalk(target = ScooterWalkTarget.Scooter(scooter), phase = ScooterWalkPhase.Locating)
        assertEquals(ScooterDirectionsControl.Finding, walk.control)
        assertNull(walk.trail)
        assertEquals(scooter, walk.heldScooter)

        walk = walk.copy(
            phase = ScooterWalkPhase.Shown,
            origin = ScooterWalkOrigin.Rider,
            route = WalkRoute(points = listOf(point(east = -200.0, north = 0.0), start)),
            progress = 50.0,
        )
        assertEquals(ScooterDirectionsControl.HideRoute, walk.control)
        assertEquals(150.0, walk.remainingDistance ?: 0.0, 0.5)
        assertEquals(0.25, walk.trail?.walked ?: 0.0, 0.01)

        walk = walk.copy(phase = ScooterWalkPhase.Failed(ScooterWalkFailure.NoRoute))
        assertEquals(ScooterDirectionsControl.OpenInMaps, walk.control)
        assertEquals(ScooterWalkNote.NoRoute, walk.note)
        assertNull(walk.trail)
        assertNull(walk.heldScooter)

        walk = walk.copy(phase = ScooterWalkPhase.Arrived)
        assertEquals(ScooterDirectionsControl.Directions, walk.control)
        assertEquals(ScooterWalkNote.Arrived, walk.note)

        walk = walk.copy(phase = ScooterWalkPhase.Gone)
        assertEquals(ScooterDirectionsControl.None, walk.control)
        assertEquals(ScooterWalkNote.Gone, walk.note)
        assertTrue(walk.holdsCard)
        assertFalse(walk.isUnderway)
    }

    private fun point(east: Double, north: Double): GeoPoint {
        val metresPerDegree = 6_371_008.8 * PI / 180
        return GeoPoint(
            latitude = start.latitude + north / metresPerDegree,
            longitude = start.longitude + east / (metresPerDegree * cos(start.latitude * PI / 180)),
        )
    }

    /** XCTUnwrap: the value, or the test fails. */
    private fun <T : Any> unwrap(value: T?): T {
        assertNotNull(value)
        return value!!
    }
}
