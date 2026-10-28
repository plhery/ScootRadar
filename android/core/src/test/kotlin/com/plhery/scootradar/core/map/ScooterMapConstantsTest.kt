package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.MapFocusRequest
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.UserInterfaceStyle
import java.time.Instant
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

// The values ios/ScootRadar/ViewModels/ScooterMapModel.swift fixes, at the controller's own defaults: the
// waits, the area asked for, where the map opens and how far the origin counts.
@OptIn(ExperimentalCoroutinesApi::class)
class ScooterMapConstantsTest {
    private val zurich = MapRegion(center = GeoPoint(latitude = 47.3769, longitude = 8.5417), latitudeDelta = 0.02, longitudeDelta = 0.03)
    private val bern = MapRegion(center = GeoPoint(latitude = 46.948, longitude = 7.4474), latitudeDelta = 0.02, longitudeDelta = 0.03)

    @Test
    fun aMovedMapIsAskedFor180MsAfterItStopsAndARefreshAtOnce() = runTest {
        val api = StubScooterAPI(ScooterResponse(vehicles = emptyList()))
        val model = makeController(api)

        model.updateViewport(zurich, zoom = 15)
        advanceTimeBy(179)
        runCurrent()
        assertEquals(0, api.calls)
        // A newer view replaces the one waiting, and waits in turn.
        model.updateViewport(bern, zoom = 16)
        advanceTimeBy(179)
        runCurrent()
        assertEquals(0, api.calls)
        advanceTimeBy(1)
        runCurrent()
        assertEquals(1, api.calls)
        assertEquals(16, api.lastZoom)

        // Refresh and Try again ask at once.
        model.refresh()
        runCurrent()
        assertEquals(2, api.calls)
        // Each for a quarter of the view more on every side, so that a small move needs no request.
        val asked = GeoBounds(bern).expanded(by = 0.25)
        assertEquals(listOf(asked, asked), api.askedBounds)
    }

    @Test
    fun theMapOpensOnItsStartPlaceAtItsZoom() = runTest {
        // Without a place of its own, all of Switzerland at zoom 8.
        val swiss = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        assertEquals(GeoBounds(ScooterMapStart.switzerland.region), swiss.viewport.value)
        assertEquals(8, swiss.viewportZoom.value)
        assertEquals(8.0, swiss.viewportZoomLevel.value, 0.0)

        val berlin = ScooterMapStart(
            region = MapRegion(center = GeoPoint(latitude = 52.52, longitude = 13.405), latitudeDelta = 0.2, longitudeDelta = 0.3),
            zoom = 11,
        )
        val api = StubScooterAPI(ScooterResponse(vehicles = emptyList()))
        val model = makeController(api, start = berlin)
        assertEquals(GeoBounds(berlin.region), model.viewport.value)
        assertEquals(11, model.viewportZoom.value)
        assertEquals(11.0, model.viewportZoomLevel.value, 0.0)

        model.refresh()
        runCurrent()
        assertEquals(listOf(GeoBounds(berlin.region).expanded(by = 0.25)), api.askedBounds)
        assertEquals(11, api.lastZoom)

        // The sun is the start place's until the rider is located: at the test's 14:13 UTC, day in Switzerland and
        // night in Tokyo.
        val tokyo = ScooterMapStart(
            region = MapRegion(center = GeoPoint(latitude = 35.6812, longitude = 139.7671), latitudeDelta = 0.2, longitudeDelta = 0.3),
            zoom = 11,
        )
        assertEquals(UserInterfaceStyle.Light, swiss.interfaceStyle)
        assertEquals(UserInterfaceStyle.Dark, makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), start = tokyo).interfaceStyle)
    }

    @Test
    fun aCityIsFramedEightHundredthsOfADegreeHighAndTwelveWide() {
        val metresPerDegree = 111_320.0
        val equator = MapFocusRequest.city(GeoPoint(latitude = 0.0, longitude = 10.0), token = 1)
        assertEquals(0.08 * metresPerDegree, equator.latitudinalMeters, 1e-9)
        assertEquals(0.12 * metresPerDegree, equator.longitudinalMeters, 1e-9)

        // Narrower in metres away from the equator, so as wide in degrees.
        val oslo = MapFocusRequest.city(GeoPoint(latitude = 60.0, longitude = 10.75), token = 2)
        assertEquals(0.08 * metresPerDegree, oslo.latitudinalMeters, 1e-9)
        assertEquals(0.06 * metresPerDegree, oslo.longitudinalMeters, 1e-6)
        assertFalse(oslo.keepsZoom)
    }

    @Test
    fun theOriginCountsWhileItIsWithinHalfAViewOfIt() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        model.setViewport(GeoBounds(south = 47.0, west = 8.0, north = 48.0, east = 9.0))

        for (inside in listOf(GeoPoint(latitude = 48.49, longitude = 9.49), GeoPoint(latitude = 46.51, longitude = 7.51))) {
            model.setUserLocation(inside)
            assertEquals(inside, model.mapOrigin)
        }
        for (outside in listOf(GeoPoint(latitude = 48.51, longitude = 8.5), GeoPoint(latitude = 47.5, longitude = 7.49))) {
            model.setUserLocation(outside)
            assertNull(model.mapOrigin)
        }
    }

    @Test
    fun aFixIsWaitedForFiveSecondsThenTheBestOneIsTakenOrNone() = runTest {
        // Nothing comes: after five seconds the map stops locating and says so.
        val silent = productionController()
        silent.focusOnUser()
        assertTrue(silent.isLocating.value)
        advanceTimeBy(4_999)
        runCurrent()
        assertTrue(silent.isLocating.value)
        advanceTimeBy(1)
        runCurrent()
        assertFalse(silent.isLocating.value)
        assertEquals(ScooterLocationIssue.NotFound, silent.locationIssue.value)

        // A rough fix is kept meanwhile, and taken then.
        val rough = productionController()
        rough.focusOnUser()
        val fix = ScooterLocationFix(coordinate = zurich.center, horizontalAccuracy = 500.0, timestamp = Instant.now())
        rough.locationsUpdated(listOf(fix))
        advanceTimeBy(4_999)
        runCurrent()
        assertNull(rough.userLocation.value)
        advanceTimeBy(1)
        runCurrent()
        assertEquals(zurich.center, rough.userLocation.value)
        assertEquals(500.0, rough.locationAccuracy.value, 0.0)
        assertFalse(rough.isLocating.value)
    }

    /** The controller with its own location wait, which makeController sets for its tests. */
    private fun TestScope.productionController(): ScooterMapController = ScooterMapController(
        api = StubScooterAPI(ScooterResponse(vehicles = emptyList())),
        locationManager = FakeLocationManager(ScooterAuthorizationStatus.AuthorizedWhenInUse),
        defaults = InMemoryScooterDefaults(),
        scope = backgroundScope,
        directions = NoWalkingDirections,
        openInMaps = {},
        phoneLanguages = { listOf("en-US") },
    )
}
