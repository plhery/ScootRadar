package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.api.WalkingDirectionsError
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterDirectionsControl
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterMapLook
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterResponseMetadata
import com.plhery.scootradar.core.model.ScooterWalkFailure
import com.plhery.scootradar.core.model.ScooterWalkNote
import com.plhery.scootradar.core.model.ScooterWalkPhase
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.WalkRoute
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import java.time.Instant
import java.util.Locale
import kotlin.math.PI
import kotlin.math.cos
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.completeWith
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withContext
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

// ios/ScootRadarTests/ScooterWalkTests.swift.

/**
 * Directions on a card: the walking route drawn in the app, from the tap to the rider's arrival, and everything
 * that ends it on the way.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class ScooterWalkTest {
    private val launchLocale = ScooterLanguage.launchLocale
    private val rider = GeoPoint(latitude = 47.3769, longitude = 8.5417)

    @Before
    fun pinTheLocale() {
        ScooterLanguage.launchLocale = { Locale.US }
    }

    @After
    fun restoreTheLocale() {
        ScooterLanguage.launchLocale = launchLocale
    }

    // Showing the route

    @Test
    fun directionsDrawsTheWayFromTheRiderAndTheCardCountsAlongIt() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val h = harness(vehicles = listOf(target), rider = rider)
        h.model.selectScooter(target.id)
        val straight = unwrap(h.model.straightLineDistance(target))
        h.analytics.clear()

        h.model.showWalkingRoute(ScooterWalkTarget.Scooter(target))

        assertEquals(ScooterDirectionsControl.Finding, h.model.directionsControl(ScooterWalkTarget.Scooter(target)))
        assertEquals(localized("Finding the way…"), h.model.walkAnnouncement.value?.text)
        val shown = waitUntil { h.model.walk.value?.phase == ScooterWalkPhase.Shown }
        assertTrue(shown)
        assertEquals(1, h.directions.requests.size)
        assertEquals(rider, h.directions.requests.firstOrNull()?.origin)
        assertEquals(target.coordinate, h.directions.requests.firstOrNull()?.target)

        val trail = unwrap(h.model.walkTrail)
        assertTrue(trail.reveals)
        assertEquals(0.0, trail.walked, 0.0)
        assertEquals(rider, trail.points.firstOrNull())
        assertEquals(target.coordinate, trail.points.lastOrNull())
        assertEquals(ScooterDirectionsControl.HideRoute, h.model.directionsControl(ScooterWalkTarget.Scooter(target)))
        assertNull(h.model.walkNote(ScooterWalkTarget.Scooter(target)))
        assertTrue(h.model.isWalking)
        // The trail behind the rider goes a few metres at a time.
        assertEquals(5.0, h.manager.distanceFilter, 0.0)

        // The card, the pill and TalkBack count along the route, not as the crow flies.
        val remaining = unwrap(h.model.walkRemainingMetres)
        assertEquals(500.0, remaining, 3.0)
        assertTrue(remaining > straight + 100)
        val minutes = ScooterMapLook.walkingMinutes(metres = remaining)
        assertEquals(minutes, h.model.approximateWalkingMinutes(target))
        assertEquals("$minutes", h.model.cardContent(target).figures.firstOrNull()?.value)
        assertEquals(Scooter.formattedLength(meters = remaining), h.model.formattedDistance(target))
        assertEquals(
            stringFormat(
                localized("Route shown: ≈%1\$lld min walk · %2\$@"),
                minutes.toLong(),
                Scooter.formattedLength(meters = remaining),
            ),
            h.model.walkAnnouncement.value?.text,
        )
        // The tap, then the route it asked for.
        assertEquals(
            listOf(
                TrackedEvent("directions_open", provider = "lime", target = "vehicle"),
                TrackedEvent("route_result", provider = "lime", result = "success", target = "vehicle"),
            ),
            h.analytics.events,
        )
    }

    @Test
    fun withoutALocationTheRiderIsLocatedFirstAndTheMapStaysPut() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val h = harness(vehicles = listOf(target), rider = null)
        h.model.selectScooter(target.id)
        val focus = h.model.focusRequest.value
        h.analytics.clear()

        h.model.showWalkingRoute(ScooterWalkTarget.Scooter(target))

        assertEquals(ScooterWalkPhase.Locating, h.model.walk.value?.phase)
        assertTrue(h.model.isLocating.value)
        assertEquals(ScooterDirectionsControl.Finding, h.model.directionsControl(ScooterWalkTarget.Scooter(target)))
        assertTrue(h.directions.requests.isEmpty())

        h.model.locationsUpdated(listOf(fix(at = rider)))

        val shown = waitUntil { h.model.walk.value?.phase == ScooterWalkPhase.Shown }
        assertTrue(shown)
        assertEquals(rider, h.directions.requests.firstOrNull()?.origin)
        assertEquals(focus, h.model.focusRequest.value)
        assertEquals(target.id, h.model.selectedScooterID.value)
        // The route the rider waited for is reported, as one they asked for.
        assertEquals(
            listOf(
                TrackedEvent("directions_open", provider = "lime", target = "vehicle"),
                TrackedEvent("locate"),
                TrackedEvent("location_result", result = "success"),
                TrackedEvent("route_result", provider = "lime", result = "success", target = "vehicle"),
            ),
            h.analytics.events,
        )
    }

    @Test
    fun whenTheRiderCannotBeLocatedTheCardOffersAppleMaps() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val h = harness(vehicles = listOf(target), rider = null, status = ScooterAuthorizationStatus.Denied)
        h.model.selectScooter(target.id)
        h.analytics.clear()

        h.model.showWalkingRoute(ScooterWalkTarget.Scooter(target))

        assertEquals(ScooterWalkPhase.Failed(ScooterWalkFailure.NoLocation), h.model.walk.value?.phase)
        assertEquals(ScooterDirectionsControl.OpenInMaps, h.model.directionsControl(ScooterWalkTarget.Scooter(target)))
        assertEquals(ScooterWalkNote.NoLocation, h.model.walkNote(ScooterWalkTarget.Scooter(target)))
        assertEquals(localized("Couldn’t find your location."), h.model.walkAnnouncement.value?.text)
        assertTrue(h.opened.isEmpty())

        h.model.openWalkInMaps(ScooterWalkTarget.Scooter(target))

        assertEquals(listOf(ScooterWalkTarget.Scooter(target)), h.opened)
        // Open in Maps is counted as Directions is, with no result: the maps app finds the way.
        val directionsOpen = TrackedEvent("directions_open", provider = "lime", target = "vehicle")
        assertEquals(
            listOf(directionsOpen, TrackedEvent("locate"), TrackedEvent("location_result", result = "denied"), directionsOpen),
            h.analytics.events,
        )
    }

    @Test
    fun aWalkOfMoreThanTenKilometresOpensAppleMapsAsBefore() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val h = harness(vehicles = listOf(target), rider = point(east = 0, north = 12_000))
        h.model.selectScooter(target.id)
        h.analytics.clear()

        h.model.showWalkingRoute(ScooterWalkTarget.Scooter(target))

        assertEquals(
            listOf(
                TrackedEvent("directions_open", provider = "lime", target = "vehicle"),
                TrackedEvent("route_result", provider = "lime", result = "too_far", target = "vehicle"),
            ),
            h.analytics.events,
        )
        assertNull(h.model.walk.value)
        assertEquals(listOf(ScooterWalkTarget.Scooter(target)), h.opened)
        assertTrue(h.directions.requests.isEmpty())
        assertEquals(ScooterDirectionsControl.Directions, h.model.directionsControl(ScooterWalkTarget.Scooter(target)))
    }

    @Test
    fun withoutARouteTheCardOffersAppleMapsAndCountsAsTheCrowFlies() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val h = harness(vehicles = listOf(target), rider = rider)
        h.directions.result = Result.failure(WalkingDirectionsError(WalkingDirectionsError.Reason.NoRoute))
        h.model.selectScooter(target.id)
        h.analytics.clear()

        h.model.showWalkingRoute(ScooterWalkTarget.Scooter(target))

        val failed = waitUntil { h.model.walk.value?.phase == ScooterWalkPhase.Failed(ScooterWalkFailure.NoRoute) }
        assertTrue(failed)
        assertNull(h.model.walkTrail)
        assertFalse(h.model.isWalking)
        assertEquals(ScooterDirectionsControl.OpenInMaps, h.model.directionsControl(ScooterWalkTarget.Scooter(target)))
        assertEquals(ScooterWalkNote.NoRoute, h.model.walkNote(ScooterWalkTarget.Scooter(target)))
        assertEquals(localized("Couldn’t find a walking route."), h.model.walkAnnouncement.value?.text)
        assertEquals(h.model.straightLineDistance(target), h.model.walkingDistance(target))
        assertEquals(20.0, h.manager.distanceFilter, 0.0)
        assertEquals(
            TrackedEvent("route_result", provider = "lime", result = "error", target = "vehicle"),
            h.analytics.events.lastOrNull(),
        )
    }

    @Test
    fun aRiderAlreadyThereArrivesWithoutAskingForARoute() = runTest {
        val target = scooter("s1", at = point(east = 10, north = 0))
        val h = harness(vehicles = listOf(target), rider = rider)
        h.model.selectScooter(target.id)
        h.analytics.clear()

        h.model.showWalkingRoute(ScooterWalkTarget.Scooter(target))

        assertEquals(ScooterWalkPhase.Arrived, h.model.walk.value?.phase)
        assertTrue(h.directions.requests.isEmpty())
        assertEquals(ScooterWalkNote.Arrived, h.model.walkNote(ScooterWalkTarget.Scooter(target)))
        assertEquals(ScooterDirectionsControl.Directions, h.model.directionsControl(ScooterWalkTarget.Scooter(target)))
        assertEquals(localized("You’re there."), h.model.walkAnnouncement.value?.text)
        assertEquals(
            listOf(
                TrackedEvent("directions_open", provider = "lime", target = "vehicle"),
                TrackedEvent("route_arrived", provider = "lime", target = "vehicle"),
            ),
            h.analytics.events,
        )
    }

    // Walking

    @Test
    fun walkingAlongShrinksTheRouteUntilTheRiderIsThere() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val h = shownWalk(to = target)
        val revision = unwrap(h.model.walkTrail?.revision)
        h.analytics.clear()

        h.model.setUserLocation(point(east = 3, north = 60))

        assertEquals(60.0, h.model.walk.value?.progress ?: 0.0, 1.0)
        assertEquals(440.0, h.model.walkRemainingMetres ?: 0.0, 3.0)
        assertEquals(60.0 / 500, h.model.walkTrail?.walked ?: 0.0, 0.01)
        assertEquals(revision, h.model.walkTrail?.revision)

        h.model.setUserLocation(point(east = 200, north = 104))
        assertEquals(300.0, h.model.walk.value?.progress ?: 0.0, 1.0)

        h.model.setUserLocation(point(east = 300, north = 15))

        assertEquals(ScooterWalkPhase.Arrived, h.model.walk.value?.phase)
        assertNull(h.model.walkTrail)
        assertEquals(ScooterWalkNote.Arrived, h.model.walkNote(ScooterWalkTarget.Scooter(target)))
        assertEquals(ScooterDirectionsControl.Directions, h.model.directionsControl(ScooterWalkTarget.Scooter(target)))
        assertEquals(localized("You’re there."), h.model.walkAnnouncement.value?.text)
        assertEquals(20.0, h.manager.distanceFilter, 0.0)
        assertEquals(1, h.directions.requests.size)
        // The card stays open on the scooter.
        assertEquals(ScooterDockContent.Scooter(target), h.model.dock)
        assertEquals(listOf(TrackedEvent("route_arrived", provider = "lime", target = "vehicle")), h.analytics.events)
    }

    @Test
    fun leavingTheRouteFindsANewOneAtMostEveryFifteenSecondsAndTenTimes() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val h = shownWalk(to = target)
        val revision = unwrap(h.model.walkTrail?.revision)

        h.clock.advance(5.0)
        h.model.setUserLocation(point(east = -100, north = 0))
        settle()
        assertEquals("Too soon after the first route", 1, h.directions.requests.size)

        h.directions.holds = true
        h.clock.advance(11.0)
        h.model.setUserLocation(point(east = -110, north = 0))
        val asked = waitUntil { h.directions.requests.size == 2 }
        assertTrue(asked)
        assertEquals(point(east = -110, north = 0), h.directions.requests.lastOrNull()?.origin)
        // The old route stays on the map meanwhile.
        assertEquals(ScooterWalkPhase.Shown, h.model.walk.value?.phase)
        assertEquals(revision, h.model.walkTrail?.revision)

        h.directions.releaseAll(Result.success(listOf(point(east = -110, north = 0), point(east = 300, north = 0))))
        val swapped = waitUntil { h.model.walkTrail?.let { it.revision != revision } == true }
        assertTrue(swapped)
        // Swapped in as it is: no fit, no drawing.
        assertEquals(false, h.model.walkTrail?.reveals)
        assertEquals(410.0, h.model.walkRemainingMetres ?: 0.0, 3.0)

        h.directions.holds = false
        h.directions.result = null
        var expected = 2
        for (index in 0 until 12) {
            h.clock.advance(16.0)
            val away = point(east = -100, north = if (index % 2 == 0) 200 else -200)
            h.model.setUserLocation(away)
            if (expected < 1 + WalkRoute.maximumReroutes) {
                expected += 1
                val found = waitUntil { h.model.walkTrail?.points?.firstOrNull() == away }
                assertTrue("Route $expected", found)
            } else {
                settle()
            }
            assertEquals(expected, h.directions.requests.size)
        }
        assertEquals(11, h.directions.requests.size)
        assertEquals(WalkRoute.maximumReroutes, h.model.walk.value?.reroutes)
        // Only the route the rider asked for is reported, not those found again on the way.
        assertEquals(1, h.analytics.events.count { it.name == "route_result" })
    }

    @Test
    fun aScooterThatMovedGetsANewRoute() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val h = shownWalk(to = target)
        val moved = scooter("s1", at = point(east = 300, north = 40))
        h.api.setResponse(ScooterResponse(vehicles = listOf(moved)))
        h.clock.advance(16.0)

        h.model.refresh()

        val rerouted = waitUntil { h.directions.requests.size == 2 }
        assertTrue(rerouted)
        assertEquals(moved.coordinate, h.directions.requests.lastOrNull()?.target)
        assertEquals(moved, h.model.selectedScooter)
    }

    // Ending the walk

    @Test
    fun hidingClosingOrChoosingAnotherScooterOrBayEndsTheWalk() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val other = scooter("s2", at = point(east = -200, north = 0))
        val h = shownWalk(to = target, others = listOf(other))

        h.model.hideWalkingRoute()
        assertNull(h.model.walk.value)
        assertNull(h.model.walkTrail)
        assertEquals(ScooterDirectionsControl.Directions, h.model.directionsControl(ScooterWalkTarget.Scooter(target)))
        assertEquals(target.id, h.model.selectedScooterID.value)
        assertEquals(20.0, h.manager.distanceFilter, 0.0)

        val ends: List<(ScooterMapController) -> Unit> = listOf(
            { it.selectScooter(other.id) },
            { it.selectParking("dott:bay") },
            { it.selectScooter(null) },
        )
        for (end in ends) {
            h.model.selectScooter(target.id)
            h.model.showWalkingRoute(ScooterWalkTarget.Scooter(target))
            val shown = waitUntil { h.model.walk.value?.phase == ScooterWalkPhase.Shown }
            assertTrue(shown)

            end(h.model)

            assertNull(h.model.walk.value)
            assertNull(h.model.walkTrail)
        }
    }

    @Test
    fun anAnswerToAnEarlierRequestIsIgnored() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val h = harness(vehicles = listOf(target), rider = rider)
        h.model.selectScooter(target.id)
        h.directions.holds = true

        h.model.showWalkingRoute(ScooterWalkTarget.Scooter(target))
        // A Swift task cancelled before it starts still runs, so on the iPhone the first request reaches the
        // directions anyway; a coroutine cancelled before it starts never does. It starts here, as it does in the
        // app, where a show and a hide are separate taps.
        runCurrent()
        h.model.hideWalkingRoute()
        h.model.showWalkingRoute(ScooterWalkTarget.Scooter(target))
        val asked = waitUntil { h.directions.requests.size == 2 }
        assertTrue(asked)

        h.directions.release(0, Result.success(listOf(rider, point(east = 300, north = 0))))
        settle()
        assertEquals(ScooterWalkPhase.Finding, h.model.walk.value?.phase)

        h.directions.release(1, Result.success(detour))
        val shown = waitUntil { h.model.walk.value?.phase == ScooterWalkPhase.Shown }
        assertTrue(shown)
        assertEquals(500.0, h.model.walkRemainingMetres ?: 0.0, 3.0)
    }

    @Test
    fun anotherPlaceFindsTheRouteFromThereAndTheRouteIsFittedInsteadOfThePlace() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val h = shownWalk(to = target)
        val revision = unwrap(h.model.walkTrail?.revision)
        val focus = h.model.focusRequest.value
        val place = MapDestination(title = "Paradeplatz", point = point(east = 100, north = -150))
        h.analytics.clear()

        h.model.focusOnAddress(place)

        assertEquals(target.id, h.model.selectedScooterID.value)
        assertEquals(ScooterWalkPhase.Finding, h.model.walk.value?.phase)
        assertNull(h.model.walkTrail)
        assertEquals(focus, h.model.focusRequest.value)
        val fromPlace = waitUntil { h.model.walk.value?.phase == ScooterWalkPhase.Shown }
        assertTrue(fromPlace)
        assertEquals(place.point, h.directions.requests.lastOrNull()?.origin)
        assertEquals(true, h.model.walkTrail?.reveals)
        assertTrue((h.model.walkTrail?.revision ?: 0) > revision)

        h.model.clearAddressSearch()

        val fromRider = waitUntil { h.directions.requests.size == 3 && h.model.walk.value?.phase == ScooterWalkPhase.Shown }
        assertTrue(fromRider)
        assertEquals(rider, h.directions.requests.lastOrNull()?.origin)
        assertEquals(true, h.model.walkTrail?.reveals)
        // Neither route found again was asked for: no route_result.
        assertEquals(listOf(TrackedEvent("search_select")), h.analytics.events)
    }

    @Test
    fun aRouteFromASearchedPlaceDoesNotFollowTheRider() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val h = harness(vehicles = listOf(target), rider = null)
        h.model.focusOnAddress(MapDestination(title = "Paradeplatz", point = rider))
        h.model.selectScooter(target.id)
        h.model.showWalkingRoute(ScooterWalkTarget.Scooter(target))
        val shown = waitUntil { h.model.walk.value?.phase == ScooterWalkPhase.Shown }
        assertTrue(shown)

        h.model.setUserLocation(point(east = 300, north = 5))
        h.model.setUserLocation(point(east = -500, north = 0))

        assertEquals(ScooterWalkPhase.Shown, h.model.walk.value?.phase)
        assertEquals(0.0, unwrap(h.model.walk.value?.progress), 0.0)
        assertEquals(1, h.directions.requests.size)
        assertEquals(20.0, h.manager.distanceFilter, 0.0)
    }

    // Selection while walking

    @Test
    fun theScooterWalkedToStaysSelectedAndDrawnWhereverTheMapGoes() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val h = shownWalk(to = target)
        h.api.setResponse(
            ScooterResponse(
                vehicles = emptyList(),
                meta = ScooterResponseMetadata(partial = false, failedSources = emptyList(), mode = "clusters"),
            ),
        )

        // Far away and zoomed out, where the data only counts scooters.
        val away = MapRegion(center = point(east = 4_000, north = 4_000), latitudeDelta = 0.2, longitudeDelta = 0.2)
        h.model.updateViewport(away, zoom = 12)
        val loaded = waitUntil { h.api.calls == 2 && !h.model.isLoading.value }
        assertTrue(loaded)

        assertEquals(target.id, h.model.selectedScooterID.value)
        assertEquals(target, h.model.selectedScooter)
        assertEquals(ScooterDockContent.Scooter(target), h.model.dock)
        assertTrue(h.model.mapScooters.value.contains(target))
        assertEquals(ScooterWalkPhase.Shown, h.model.walk.value?.phase)

        // Once the walk is over the map is as it was.
        h.model.hideWalkingRoute()
        assertFalse(h.model.mapScooters.value.contains(target))
    }

    @Test
    fun theBayWalkedToStaysOnTheMapWhenZoomedOut() = runTest {
        val bay = ScooterParking(
            id = "dott:bay",
            provider = "dott",
            name = "Place test",
            latitude = point(east = 200, north = 100).latitude,
            longitude = point(east = 200, north = 100).longitude,
            mandatory = false,
        )
        val h = harness(vehicles = emptyList(), parking = listOf(bay), rider = rider)
        h.directions.result = null
        h.model.selectParking(bay.id)
        assertEquals(bay, h.model.selectedParking)
        // The map counts the bay's tap itself (parking_select); choosing it here sends nothing.
        assertEquals(emptyList<TrackedEvent>(), h.analytics.events)

        h.model.showWalkingRoute(ScooterWalkTarget.Parking(bay))
        val shown = waitUntil { h.model.walk.value?.phase == ScooterWalkPhase.Shown }
        assertTrue(shown)
        val minutes = ScooterMapLook.walkingMinutes(metres = unwrap(h.model.walkRemainingMetres))
        assertEquals(minutes, h.model.approximateWalkingMinutes(bay))

        h.model.updateViewport(region, zoom = 14)

        assertEquals(listOf(bay), h.model.mapParking)
        assertEquals(bay, h.model.selectedParking)
        assertEquals(ScooterDockContent.Parking(bay), h.model.dock)
        assertEquals(ScooterDirectionsControl.HideRoute, h.model.directionsControl(ScooterWalkTarget.Parking(bay)))
        assertEquals(
            listOf(
                TrackedEvent("directions_open", provider = "dott", target = "parking"),
                TrackedEvent("route_result", provider = "dott", result = "success", target = "parking"),
            ),
            h.analytics.events,
        )
    }

    // Taken scooters

    @Test
    fun aTakenScooterKeepsItsCardWithoutActionsUntilItIsBack() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val other = scooter("s2", at = point(east = -200, north = 0))
        // Another provider's scooter where it stood is not it.
        val neighbour = scooter("b1", provider = "bird", at = point(east = 303, north = 0))
        val h = shownWalk(to = target, others = listOf(other))
        h.api.setResponse(
            ScooterResponse(
                vehicles = listOf(other, neighbour),
                meta = ScooterResponseMetadata(partial = false, failedSources = emptyList()),
            ),
        )

        h.model.refresh()

        val gone = waitUntil { h.model.walk.value?.phase == ScooterWalkPhase.Gone }
        assertTrue(gone)
        assertEquals(target.id, h.model.selectedScooterID.value)
        assertEquals(ScooterDockContent.Scooter(target), h.model.dock)
        assertEquals(ScooterDirectionsControl.None, h.model.directionsControl(ScooterWalkTarget.Scooter(target)))
        assertEquals(ScooterWalkNote.Gone, h.model.walkNote(ScooterWalkTarget.Scooter(target)))
        assertNull(h.model.walkTrail)
        assertFalse(h.model.isWalking)
        assertFalse(h.model.mapScooters.value.contains(target))
        assertEquals(
            localized("No longer on the map. Someone may have taken it."),
            h.model.walkAnnouncement.value?.text,
        )

        h.api.setResponse(ScooterResponse(vehicles = listOf(target, other)))
        h.model.refresh()

        val back = waitUntil { h.model.walk.value == null }
        assertTrue(back)
        assertEquals(ScooterDockContent.Scooter(target), h.model.dock)
        assertEquals(ScooterDirectionsControl.Directions, h.model.directionsControl(ScooterWalkTarget.Scooter(target)))
    }

    @Test
    fun aScooterUnderANewIDIsStillTheOneWalkedTo() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val h = shownWalk(to = target)
        val renamed = scooter("s1-new", at = point(east = 305, north = 0))
        h.api.setResponse(ScooterResponse(vehicles = listOf(renamed)))

        h.model.refresh()

        val followed = waitUntil { h.model.selectedScooterID.value == renamed.id }
        assertTrue(followed)
        assertEquals(ScooterWalkPhase.Shown, h.model.walk.value?.phase)
        assertEquals(ScooterWalkTarget.Scooter(renamed), h.model.walk.value?.target)
        assertEquals(ScooterDockContent.Scooter(renamed), h.model.dock)
        assertEquals(ScooterDirectionsControl.HideRoute, h.model.directionsControl(ScooterWalkTarget.Scooter(renamed)))
    }

    @Test
    fun aScooterIsNotTakenWhenTheDataCannotTell() = runTest {
        val target = scooter("s1", at = point(east = 300, north = 0))
        val other = scooter("s2", at = point(east = -200, north = 0))
        val h = shownWalk(to = target, others = listOf(other))
        val unclear = listOf(
            // Its provider's feed failed.
            ScooterResponseMetadata(partial = true, failedSources = listOf("lime_zurich")),
            // A feed nobody can name failed.
            ScooterResponseMetadata(partial = true, failedSources = listOf("mystery-feed")),
            // The list was cut short.
            ScooterResponseMetadata(partial = false, failedSources = emptyList(), truncated = true),
        )

        for ((index, meta) in unclear.withIndex()) {
            h.api.setResponse(ScooterResponse(vehicles = listOf(other), meta = meta))
            h.model.refresh()
            val loaded = waitUntil { h.api.calls == index + 2 && !h.model.isLoading.value }
            assertTrue(loaded)

            assertEquals("${meta.failedSources}", ScooterWalkPhase.Shown, h.model.walk.value?.phase)
            assertEquals(target, h.model.selectedScooter)
            assertTrue(h.model.mapScooters.value.contains(target))
        }
    }

    // Helpers

    private class Harness(
        val model: ScooterMapController,
        val api: StubScooterAPI,
        val directions: FakeWalkingDirections,
        val manager: FakeLocationManager,
        val clock: TestClock,
        val opened: List<ScooterWalkTarget>,
        val analytics: RecordingAnalytics,
    )

    /** The site's path from the rider to a scooter 300 m east: 100 m north, 300 m east and 100 m back south, 500 m in all. */
    private val detour: List<GeoPoint>
        get() = listOf(rider, point(east = 0, north = 100), point(east = 300, north = 100), point(east = 300, north = 0))

    private val region: MapRegion get() = MapRegion(center = rider, latitudeDelta = 0.01, longitudeDelta = 0.01)

    private fun TestScope.harness(
        vehicles: List<Scooter>,
        parking: List<ScooterParking> = emptyList(),
        rider: GeoPoint?,
        status: ScooterAuthorizationStatus = ScooterAuthorizationStatus.AuthorizedWhenInUse,
    ): Harness {
        val api = StubScooterAPI(ScooterResponse(vehicles = vehicles, parking = parking))
        val directions = FakeWalkingDirections(result = Result.success(detour))
        val manager = FakeLocationManager(status)
        val clock = TestClock()
        val opened = mutableListOf<ScooterWalkTarget>()
        val analytics = RecordingAnalytics()
        val model = makeController(
            api,
            clock = clock,
            locationManager = manager,
            directions = directions,
            openInMaps = { opened += it },
            analytics = analytics,
        )
        model.setUserLocation(rider)
        model.updateViewport(region, zoom = 17)
        val loaded = waitUntil { model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        return Harness(model, api, directions, manager, clock, opened, analytics)
    }

    /** A walk from the rider to `target`, with its route on the map. */
    private fun TestScope.shownWalk(to: Scooter, others: List<Scooter> = emptyList()): Harness {
        val h = harness(vehicles = listOf(to) + others, rider = rider)
        h.model.selectScooter(to.id)
        h.model.showWalkingRoute(ScooterWalkTarget.Scooter(to))
        val shown = waitUntil { h.model.walk.value?.phase == ScooterWalkPhase.Shown }
        assertTrue(shown)
        return h
    }

    private fun scooter(id: String, provider: String = "lime", at: GeoPoint): Scooter =
        scooter(id, provider, latitude = at.latitude, longitude = at.longitude)

    private fun point(east: Number, north: Number): GeoPoint {
        val metresPerDegree = 6_371_008.8 * PI / 180
        return GeoPoint(
            latitude = rider.latitude + north.toDouble() / metresPerDegree,
            longitude = rider.longitude + east.toDouble() / (metresPerDegree * cos(rider.latitude * PI / 180)),
        )
    }

    /** A fix of now, as the location policy measures a fix's age on the phone's own clock. */
    private fun fix(at: GeoPoint): ScooterLocationFix =
        ScooterLocationFix(coordinate = at, horizontalAccuracy = 10.0, timestamp = Instant.now())
}

/** The site's walking directions, answering at once or when the test says so. */
private class FakeWalkingDirections(
    /** What it answers; null for the straight line between the two points. */
    var result: Result<List<GeoPoint>>?,
) : WalkingDirectionsClient {
    data class Request(val origin: GeoPoint, val target: GeoPoint)

    /** Holds the answers back until they are released. */
    var holds = false
    val requests = mutableListOf<Request>()
    private val waiting = mutableMapOf<Int, CompletableDeferred<List<GeoPoint>>>()

    override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> {
        val index = requests.size
        requests += Request(from, to)
        if (holds) {
            val answer = CompletableDeferred<List<GeoPoint>>()
            waiting[index] = answer
            // As a Swift continuation, a held answer waits for the test even once its request is cancelled.
            return withContext(NonCancellable) { answer.await() }
        }
        return (result ?: Result.success(listOf(from, to))).getOrThrow()
    }

    fun release(index: Int, with: Result<List<GeoPoint>>) {
        waiting.remove(index)?.completeWith(with)
    }

    fun releaseAll(with: Result<List<GeoPoint>>) {
        for (index in waiting.keys.sorted()) release(index, with)
    }
}
