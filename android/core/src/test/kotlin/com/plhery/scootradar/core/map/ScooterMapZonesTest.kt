package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.PinnedStreets
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.ScooterClusteringPolicy
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneArea
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneResponse
import com.plhery.scootradar.core.model.ScooterZoneState
import java.time.Instant
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.currentTime
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

// The ScooterZonesModelTests of ios/ScootRadarTests/ScooterZonesTests.swift.
@OptIn(ExperimentalCoroutinesApi::class)
class ScooterMapZonesTest {
    private val zurich = MapRegion(center = GeoPoint(latitude = 47.3769, longitude = 8.5417), latitudeDelta = 0.01, longitudeDelta = 0.01)
    private val porto = MapRegion(center = GeoPoint(latitude = 41.147, longitude = -8.611), latitudeDelta = 0.01, longitudeDelta = 0.01)

    @Test
    fun zonesAreOnUntilTurnedOffAndTheChoiceIsKept() = runTest {
        val defaults = InMemoryScooterDefaults()
        val model = makeController(ZoneStubAPI(), defaults = defaults)
        assertTrue(model.showsZones.value)

        model.setShowsZones(false)
        assertEquals(ScooterZoneState.Off, model.zoneState.value)

        assertFalse(makeController(ZoneStubAPI(), defaults = defaults).showsZones.value)
    }

    @Test
    fun theZonesOfTheMapsAreaAreDrawnForTheProvidersShown() = runTest {
        val api = ZoneStubAPI()
        val model = makeController(api)
        model.setShowsZones(false)
        model.updateViewport(zurich, zoom = 16)
        assertEquals(ScooterZoneState.Off, model.zoneState.value)
        // Past the debounce, so that a request would have gone out by now.
        advanceTimeBy(400)
        runCurrent()
        val none = waitUntil { api.zoneAreas.isEmpty() }
        assertTrue("Nothing is asked for while the zones are off", none)

        model.setShowsZones(true)

        val shown = waitUntil { api.zoneAreas.size == 1 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(shown)
        assertEquals(
            listOf(ScooterZoneArea(covering = GeoBounds(south = 47.361, west = 8.521, north = 47.399, east = 8.559))),
            api.zoneAreas,
        )
        assertEquals(listOf("lime:0", "bird:0"), model.mapZones.value.map { it.id })

        model.showProviders(setOf(ScooterProvider.Lime))
        assertEquals(listOf("lime:0"), model.mapZones.value.map { it.id })
    }

    @Test
    fun zonesAreNotAskedForFurtherOutThanZoom14AndComeBackWithoutAskingAgain() = runTest {
        val api = ZoneStubAPI()
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(zurich, zoom = 16)
        val shown = waitUntil { api.zoneAreas.size == 1 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(shown)
        val revision = model.mapZonesRevision.value

        model.updateViewport(zurich.copy(latitudeDelta = 0.08, longitudeDelta = 0.08), zoom = 13)
        assertEquals(ScooterZoneState.ZoomIn, model.zoneState.value)
        assertTrue(model.mapZones.value.isEmpty())
        assertTrue(model.mapZonesRevision.value > revision)

        model.updateViewport(zurich, zoom = 16)
        assertEquals(ScooterZoneState.Shown, model.zoneState.value)
        assertEquals(2, model.mapZones.value.size)
        advanceTimeBy(400)
        runCurrent()
        assertEquals(1, api.zoneAreas.size)
    }

    @Test
    fun aNearbyViewIsServedByTheAnswerAtHandAndAnotherAreaIsAskedFor() = runTest {
        val api = ZoneStubAPI()
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(zurich, zoom = 16)
        val first = waitUntil { api.zoneAreas.size == 1 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(first)

        // A few hundred metres on, within the area answered for.
        val nearby = zurich.copy(center = GeoPoint(latitude = zurich.center.latitude, longitude = zurich.center.longitude + 0.003))
        model.updateViewport(nearby, zoom = 16)
        assertEquals(ScooterZoneState.Shown, model.zoneState.value)

        val bern = zurich.copy(center = GeoPoint(latitude = 46.948, longitude = 7.4474))
        model.updateViewport(bern, zoom = 16)
        assertEquals(ScooterZoneState.Loading, model.zoneState.value)
        assertEquals("Zürich's stay drawn until Bern's come", 2, model.mapZones.value.size)
        val second = waitUntil { api.zoneAreas.size == 2 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(second)

        // Back in Zürich, the answer of a moment ago serves.
        model.updateViewport(zurich, zoom = 16)
        assertEquals(ScooterZoneState.Shown, model.zoneState.value)
        advanceTimeBy(400)
        runCurrent()
        assertEquals(2, api.zoneAreas.size)
    }

    @Test
    fun aFailureIsToldAndTurningTheZonesOffTakesThemAway() = runTest {
        val api = ZoneStubAPI()
        api.setFailure(ScooterAPIError.HttpStatus(503))
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(zurich, zoom = 16)
        val failed = waitUntil { api.zoneAreas.size == 1 && model.zoneState.value == ScooterZoneState.Failed }
        assertTrue(failed)
        assertTrue(model.mapZones.value.isEmpty())

        api.setFailure(null)
        model.setShowsZones(false)
        assertEquals(ScooterZoneState.Off, model.zoneState.value)
        model.setShowsZones(true)
        val shown = waitUntil { api.zoneAreas.size == 2 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue("Turned on again, the zones are asked for again", shown)
        model.setShowsZones(false)
        assertTrue(model.mapZones.value.isEmpty())
    }

    @Test
    fun aFailedAnswerIsAskedForAgainWithTheScootersSoTheZonesComeBackWithThem() = runTest {
        val api = ZoneStubAPI()
        api.setFailure(ScooterAPIError.Offline())
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(zurich, zoom = 16)
        val failed = waitUntil { api.zoneAreas.size == 1 && model.zoneState.value == ScooterZoneState.Failed }
        assertTrue(failed)

        // Still within the area, the failure no longer stands once the network is back.
        api.setFailure(null)
        model.retryLoad()
        val shown = waitUntil { api.zoneAreas.size == 2 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue("A refresh asks for the zones again with the scooters", shown)
        assertEquals(2, model.mapZones.value.filter { it.provider != "city" }.size)

        // A whole answer at hand is not asked for again.
        model.refresh()
        advanceTimeBy(400)
        runCurrent()
        assertEquals(2, api.zoneAreas.size)
    }

    @Test
    fun zonesWaitAQuarterSecondAndAPendingAnswerIsAskedForAgainEveryThreeSecondsThreeTimes() = runTest {
        val api = ZoneStubAPI()
        api.pending = true
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(zurich, zoom = 16)
        assertEquals(ScooterZoneState.Loading, model.zoneState.value)

        // The moves of one gesture make one request, 250 ms after the last.
        advanceTimeBy(249)
        runCurrent()
        assertTrue(api.zoneAreas.isEmpty())
        advanceTimeBy(1)
        runCurrent()
        assertEquals(1, api.zoneAreas.size)
        // What came is drawn while the rest is on its way; that there are no others is not known yet.
        assertEquals(ScooterZoneState.Loading, model.zoneState.value)
        assertEquals(2, model.mapZones.value.size)

        for (asked in 2..4) {
            advanceTimeBy(2_999)
            runCurrent()
            assertEquals(asked - 1, api.zoneAreas.size)
            advanceTimeBy(1)
            runCurrent()
            assertEquals(asked, api.zoneAreas.size)
        }
        advanceTimeBy(30_000)
        runCurrent()
        assertEquals("Three times more, then the answer stands", 4, api.zoneAreas.size)
        assertEquals(1, api.zoneAreas.toSet().size)
        // Some still on their way after the last try: the area's rules are unknown, not absent, and those that came stay.
        assertEquals(ScooterZoneState.Failed, model.zoneState.value)
        assertEquals(2, model.mapZones.value.size)
    }

    @Test
    fun theLastEightWholeAnswersServeForFiveMinutes() = runTest {
        val api = ZoneStubAPI()
        val model = makeController(api)
        model.setShowsZones(true)
        // Nine areas a tenth of a degree apart, each answered in turn.
        val areas = (0 until 9).map { zurich.copy(center = GeoPoint(latitude = 47.3769, longitude = 8.5417 + it * 0.1)) }
        for ((index, area) in areas.withIndex()) {
            model.updateViewport(area, zoom = 16)
            advanceTimeBy(250)
            runCurrent()
            assertEquals(index + 1, api.zoneAreas.size)
        }

        // The eighth answer back is at hand; the ninth is asked for again.
        model.updateViewport(areas[1], zoom = 16)
        assertEquals(ScooterZoneState.Shown, model.zoneState.value)
        model.updateViewport(areas[0], zoom = 16)
        assertEquals(ScooterZoneState.Loading, model.zoneState.value)
        advanceTimeBy(250)
        runCurrent()
        assertEquals(10, api.zoneAreas.size)

        // An answer serves for 300 s from its arrival, not a moment longer.
        val fresh = ZoneStubAPI()
        val later = makeController(fresh)
        later.setShowsZones(true)
        later.updateViewport(areas[0], zoom = 16)
        advanceTimeBy(250)
        runCurrent()
        val answeredAt = currentTime
        later.updateViewport(areas[1], zoom = 16)
        advanceTimeBy(250)
        runCurrent()
        assertEquals(2, fresh.zoneAreas.size)

        advanceTimeBy(answeredAt + 300_000 - currentTime)
        later.updateViewport(areas[0], zoom = 16)
        assertEquals(ScooterZoneState.Shown, later.zoneState.value)
        later.updateViewport(areas[1], zoom = 16)
        advanceTimeBy(1)
        later.updateViewport(areas[0], zoom = 16)
        assertEquals(ScooterZoneState.Loading, later.zoneState.value)
        advanceTimeBy(250)
        runCurrent()
        assertEquals(3, fresh.zoneAreas.size)
        assertEquals(fresh.zoneAreas[0], fresh.zoneAreas[2])
    }

    @Test
    fun aCitysRulesAreDrawnFromZoom14WithTheZonesOffAndDimmerOutsideTheirHours() = runTest {
        val hongdae = MapRegion(center = GeoPoint(latitude = 37.5545, longitude = 126.9245), latitudeDelta = 0.008, longitudeDelta = 0.008)
        // Noon in Seoul, then 23:00.
        val clock = TestClock().apply { now = Instant.ofEpochSecond(1_792_983_600) }
        val model = makeController(ZoneStubAPI(), clock = clock)
        model.setShowsZones(false)
        model.updateViewport(hongdae, zoom = 16)

        assertEquals(ScooterZoneState.Off, model.zoneState.value)
        assertEquals(listOf("seoul-hongdae-red-road"), model.mapRuleZones.value.map { it.rule.id })
        assertEquals(listOf("rule:seoul-hongdae-red-road"), model.mapZones.value.map { it.id })
        assertEquals(listOf(1.0), model.mapZones.value.map { it.strength })
        val revision = model.mapZonesRevision.value

        clock.advance(11 * 3600.0)
        model.autoRefreshIfNeeded()
        assertEquals(listOf(false), model.mapRuleZones.value.map { it.inForce })
        assertEquals(listOf(CityRuleZone.dimmed), model.mapZones.value.map { it.strength })
        assertTrue(model.mapZonesRevision.value > revision)

        model.updateViewport(hongdae.copy(latitudeDelta = 0.08, longitudeDelta = 0.08), zoom = 13)
        assertTrue(model.mapRuleZones.value.isEmpty())
        assertTrue(model.mapZones.value.isEmpty())
    }

    // The catalog's Porto is a few of its parking places (TestCatalog), as the iPhone's test reads them all.
    @Test
    fun aCitysZonesAreDrawnFromZoom14WithTheZonesOffAndTheSameOnesOverAShortPan() = runTest {
        val model = makeController(ZoneStubAPI())
        model.setShowsZones(false)
        model.updateViewport(porto, zoom = 16)

        assertEquals(ScooterZoneState.Off, model.zoneState.value)
        assertFalse(model.mapRuleZones.value.isEmpty())
        assertTrue(model.mapRuleZones.value.all { it.rule.kind == ScooterZoneKind.Parking && it.rule.authority == "Porto" && it.inForce })
        assertTrue(model.mapZones.value.all { it.provider == "city" && it.kind == ScooterZoneKind.Parking && it.strength == 1.0 })
        assertTrue(model.mapZones.value.map { it.id }.containsAll(model.mapRuleZones.value.map { "rule:${it.rule.id}" }))
        assertEquals(0, model.mapOperatorZoneCount.value)
        val revision = model.mapZonesRevision.value
        val inView = model.mapRuleZones.value

        // A third of the map on, other places are in view and the same are drawn.
        val nearby = porto.copy(center = GeoPoint(latitude = porto.center.latitude, longitude = porto.center.longitude + 0.0033))
        model.updateViewport(nearby, zoom = 16)
        assertNotEquals(inView, model.mapRuleZones.value)
        assertEquals(revision, model.mapZonesRevision.value)
        assertTrue(model.mapZones.value.map { it.id }.containsAll(model.mapRuleZones.value.map { "rule:${it.rule.id}" }))

        // Past the half of the map around it, they are picked again.
        val further = nearby.copy(center = GeoPoint(latitude = nearby.center.latitude, longitude = nearby.center.longitude + 0.01))
        model.updateViewport(further, zoom = 16)
        assertTrue(model.mapZonesRevision.value > revision)
        assertTrue(model.mapZones.value.map { it.id }.containsAll(model.mapRuleZones.value.map { "rule:${it.rule.id}" }))

        model.updateViewport(porto.copy(latitudeDelta = 0.08, longitudeDelta = 0.08), zoom = 13)
        assertTrue(model.mapRuleZones.value.isEmpty())
        assertTrue(model.mapZones.value.isEmpty())
    }

    @Test
    fun theLegendCountsTheOperatorsZonesApartFromTheCitys() = runTest {
        val api = ZoneStubAPI()
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(porto, zoom = 16)
        val shown = waitUntil { api.zoneAreas.size == 1 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(shown)

        assertEquals(2, model.mapOperatorZoneCount.value)
        assertEquals(listOf("lime:0", "bird:0"), model.mapZones.value.filter { it.provider != "city" }.map { it.id })
        assertFalse(model.mapRuleZones.value.isEmpty())
        model.showProviders(setOf(ScooterProvider.Lime))
        assertEquals(1, model.mapOperatorZoneCount.value)
    }

    @Test
    fun theLegendSaysTheLimitsOfTheOperatorsSlowZonesDrawn() = runTest {
        // Lime's at 15 km/h and Bird's at 20: "Slow: 15–20 km/h", then Lime's alone, and none where one has no limit.
        fun slow(provider: String, maxSpeedKph: Double?) = ScooterZone(
            id = "$provider:slow", provider = provider, kind = ScooterZoneKind.Slow, maxSpeedKph = maxSpeedKph,
            polygons = listOf(listOf(listOf(GeoPoint(47.37, 8.54), GeoPoint(47.38, 8.54), GeoPoint(47.38, 8.55), GeoPoint(47.37, 8.54)))),
        )
        val api = ZoneStubAPI(more = listOf(slow("lime", 15.0), slow("bird", 20.0)))
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(porto, zoom = 16)
        assertTrue(waitUntil { api.zoneAreas.size == 1 && model.zoneState.value == ScooterZoneState.Shown })

        assertEquals(15.0..20.0, model.mapOperatorSlowSpeeds.value.known)
        model.showProviders(setOf(ScooterProvider.Lime))
        assertEquals(15.0..15.0, model.mapOperatorSlowSpeeds.value.known)

        val without = ZoneStubAPI(more = listOf(slow("lime", 15.0), slow("bird", null)))
        val other = makeController(without)
        other.setShowsZones(true)
        other.updateViewport(porto, zoom = 16)
        assertTrue(waitUntil { without.zoneAreas.size == 1 && other.zoneState.value == ScooterZoneState.Shown })
        assertNull(other.mapOperatorSlowSpeeds.value.known)
    }

    @Test
    fun anAreaWhoseZonesCouldNotBeReadSaysTheyAreUnavailableNotThatItHasNone() = runTest {
        val api = ZoneStubAPI()
        api.unavailable = true
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(zurich, zoom = 16)
        val failed = waitUntil { api.zoneAreas.size == 1 && model.zoneState.value == ScooterZoneState.Failed }
        assertTrue(failed)
        // Those read are drawn, and the area is not said to have no others: the legend's note in this state is
        // CityRuleZoneTest's.
        assertEquals(listOf("lime:0", "bird:0"), model.mapZones.value.filter { it.provider != "city" }.map { it.id })

        // The next refresh of the scooters asks again, once the server has tried the feed again.
        api.unavailable = false
        model.refresh()
        val shown = waitUntil { api.zoneAreas.size == 2 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(shown)
        assertEquals(2, model.mapZones.value.filter { it.provider != "city" }.size)
    }

    /**
     * Zones that cannot be had are asked for again with the next three refreshes of the scooters, as the web asks for an
     * unreadable feed's three more times, then not until the map comes to the area anew (week review, choice 15; the
     * iPhone's f1d1cb4b).
     */
    @Test
    fun zonesThatCannotBeHadAreAskedForAgainThreeTimesThenWhenTheMapComesBack() = runTest {
        val api = ZoneStubAPI()
        api.unavailable = true
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(zurich, zoom = 16)
        val failed = waitUntil { api.zoneAreas.size == 1 && model.zoneState.value == ScooterZoneState.Failed }
        assertTrue(failed)
        for (count in 2..4) {
            model.refresh()
            val asked = waitUntil { api.zoneAreas.size == count && model.zoneTaskArea == null }
            assertTrue("Refresh ${count - 1}", asked)
            assertEquals(ScooterZoneState.Failed, model.zoneState.value)
        }
        model.refresh()
        advanceTimeBy(400)
        runCurrent()
        assertEquals(4, api.zoneAreas.size)
        assertEquals(ScooterZoneState.Failed, model.zoneState.value)
        assertEquals("Those that came stay drawn", 2, model.mapOperatorZoneCount.value)

        // Away and back, the area is asked for anew, and again with the next refresh.
        val bern = zurich.copy(center = GeoPoint(latitude = 46.948, longitude = 7.4474))
        model.updateViewport(bern, zoom = 16)
        val away = waitUntil { api.zoneAreas.size == 5 && model.zoneTaskArea == null }
        assertTrue(away)
        model.updateViewport(zurich, zoom = 16)
        val back = waitUntil { api.zoneAreas.size == 6 && model.zoneTaskArea == null }
        assertTrue(back)
        api.unavailable = false
        model.refresh()
        val shown = waitUntil { api.zoneAreas.size == 7 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(shown)
        assertEquals(api.zoneAreas[0], api.zoneAreas[6])
    }

    @Test
    fun anAnswerWithZonesThatCouldNotBeReadIsNotKeptForTheMapToComeBackTo() = runTest {
        val api = ZoneStubAPI()
        api.unavailable = true
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(zurich, zoom = 16)
        val failed = waitUntil { api.zoneAreas.size == 1 && model.zoneState.value == ScooterZoneState.Failed }
        assertTrue(failed)

        api.unavailable = false
        val bern = zurich.copy(center = GeoPoint(latitude = 46.948, longitude = 7.4474))
        model.updateViewport(bern, zoom = 16)
        val second = waitUntil { api.zoneAreas.size == 2 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(second)

        // Back in Zürich, its zones are asked for again, not said unavailable from memory.
        model.updateViewport(zurich, zoom = 16)
        assertEquals(ScooterZoneState.Loading, model.zoneState.value)
        val third = waitUntil { api.zoneAreas.size == 3 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(third)
    }

    @Test
    fun zonesStillOnTheirWayAreLoadingWithThoseThatCameDrawnUntilTheRestCome() = runTest {
        val api = ZoneStubAPI()
        api.pending = true
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(zurich, zoom = 16)
        val drawn = waitUntil { api.zoneAreas.size == 1 && model.mapOperatorZoneCount.value == 2 }
        assertTrue(drawn)
        // What came is drawn meanwhile; that there are no others is not known yet.
        assertEquals(ScooterZoneState.Loading, model.zoneState.value)

        api.pending = false
        val shown = waitUntil(attempts = 400) { model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(shown)
        assertEquals(2, api.zoneAreas.size)
        assertEquals(2, model.mapOperatorZoneCount.value)
    }

    @Test
    fun zonesStillOnTheirWayAfterTheLastTryAreSaidUnavailableAndAskedForAgainWithTheScooters() = runTest {
        val api = ZoneStubAPI()
        api.pending = true
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(zurich, zoom = 16)
        // The first answer and three more tries.
        advanceTimeBy(250 + 3 * 3_000)
        runCurrent()
        assertEquals(4, api.zoneAreas.size)
        assertEquals(ScooterZoneState.Failed, model.zoneState.value)
        assertEquals("Those that came stay drawn", 2, model.mapOperatorZoneCount.value)
        advanceTimeBy(30_000)
        runCurrent()
        assertEquals(4, api.zoneAreas.size)

        api.pending = false
        model.refresh()
        val shown = waitUntil { api.zoneAreas.size == 5 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(shown)
    }

    @Test
    fun anAnswerWithZonesLeftOutAsksToZoomInBesideTheKindsAndStillDoesFromMemory() = runTest {
        val api = ZoneStubAPI()
        api.truncated = true
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(zurich, zoom = 16)
        val partial = waitUntil { api.zoneAreas.size == 1 && model.zoneState.value == ScooterZoneState.Partial }
        assertTrue(partial)
        assertEquals(2, model.mapOperatorZoneCount.value)

        // Further out and back, the answer at hand still says so.
        model.updateViewport(zurich.copy(latitudeDelta = 0.08, longitudeDelta = 0.08), zoom = 13)
        assertEquals(ScooterZoneState.ZoomIn, model.zoneState.value)
        model.updateViewport(zurich, zoom = 16)
        assertEquals(ScooterZoneState.Partial, model.zoneState.value)

        api.truncated = false
        val bern = zurich.copy(center = GeoPoint(latitude = 46.948, longitude = 7.4474))
        model.updateViewport(bern, zoom = 16)
        val second = waitUntil { api.zoneAreas.size == 2 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(second)

        // Back in Zürich, the answer of a moment ago serves, and still says some were left out.
        model.updateViewport(zurich, zoom = 16)
        assertEquals(ScooterZoneState.Partial, model.zoneState.value)
        assertEquals(2, model.mapOperatorZoneCount.value)
        advanceTimeBy(400)
        runCurrent()
        assertEquals(2, api.zoneAreas.size)
    }

    // Android's own: where the area the cities' zones are picked over ends, and the zoom they are picked from.

    /**
     * A long street is in the legend only where a piece of it is in view (logic.md LOG-425): the Loop by Michigan Avenue
     * at zoom 16, inside the lakefront trail's bounds. The wider area its zones are picked over takes in the trail's
     * end by Monroe Street, so its band is drawn, off the view's edge; the view stops west of every point of the trail,
     * so no line says so. On the trail's whole bounds the legend named it here.
     */
    @Test
    fun aStreetIsInTheLegendOnlyWhereAPieceOfItIsInView() = runTest {
        val loop = MapRegion(center = GeoPoint(latitude = 41.880, longitude = -87.6235), latitudeDelta = 0.004, longitudeDelta = 0.007)
        val trail = PinnedStreets.chicagoTrails.single { it.id == "chicago-lakefront-trail" }
        assertTrue(trail.bounds.intersects(GeoBounds(loop)))
        val model = makeController(ZoneStubAPI(), catalog = ScooterCatalog.Listed(ruleZones = listOf(trail)))
        model.setShowsZones(false)
        model.updateViewport(loop, zoom = 16)
        assertEquals(listOf("rule:chicago-lakefront-trail"), model.mapZones.value.map { it.id })
        assertTrue(model.mapRuleZones.value.isEmpty())
    }

    @Test
    fun aCitysZonesArePickedAgainOnceTheViewLeavesTheMapAndHalfOfItAgainOnEachSide() = runTest {
        // A view 0.01° a side picks over 0.02°: here to -8.601° east. Two places just within that edge and just past it.
        fun place(id: String, longitude: Double) = CityRuleZone(
            id = "porto-parking-$id", authority = "Porto", timeZone = "Europe/Lisbon", kind = ScooterZoneKind.Parking,
            source = "https://example.com/porto",
            ring = listOf(GeoPoint(41.147, longitude), GeoPoint(41.14705, longitude), GeoPoint(41.14705, longitude + 0.00005)),
        )
        val within = place("within", -8.60115)
        val past = place("past", -8.60095)
        val model = makeController(ZoneStubAPI(), catalog = ScooterCatalog.Listed(ruleZones = listOf(within, past)))
        model.setShowsZones(false)
        model.updateViewport(porto, zoom = 16)
        assertEquals(GeoBounds(porto).expanded(by = 0.5), model.ruleZoneArea)
        assertEquals(listOf("rule:porto-parking-within"), model.mapZones.value.map { it.id })
        assertTrue("Neither is in view", model.mapRuleZones.value.isEmpty())
        val revision = model.mapZonesRevision.value

        // The view's east edge a hair within the area's: nothing is picked again, though the edge is past `within`.
        fun east(edge: Double) = porto.copy(center = GeoPoint(latitude = porto.center.latitude, longitude = edge - porto.longitudeDelta / 2))
        model.updateViewport(east(-8.60101), zoom = 16)
        assertEquals(GeoBounds(porto).expanded(by = 0.5), model.ruleZoneArea)
        assertEquals(revision, model.mapZonesRevision.value)
        assertEquals(listOf("porto-parking-within"), model.mapRuleZones.value.map { it.rule.id })

        // A hair past it, the view's own area is picked over, which reaches `past`.
        model.updateViewport(east(-8.60099), zoom = 16)
        assertEquals(GeoBounds(east(-8.60099)).expanded(by = 0.5), model.ruleZoneArea)
        assertEquals(listOf("rule:porto-parking-within", "rule:porto-parking-past"), model.mapZones.value.map { it.id })
        assertEquals(revision + 1, model.mapZonesRevision.value)
    }

    @Test
    fun aCitysZonesArePickedFromZoom14AsTheMapsLevelRoundsUpTo() = runTest {
        val model = makeController(ZoneStubAPI())
        model.setShowsZones(false)
        // The map's zoom level is rounded up to the API's zoom: 13.01 and 13.9 are 14, as 14 is.
        for ((level, drawn) in listOf(13.0 to false, 13.01 to true, 13.9 to true, 14.0 to true)) {
            model.updateViewport(porto, zoom = ScooterClusteringPolicy.apiZoom(level), zoomLevel = level)
            assertEquals("at $level", drawn, model.mapZones.value.isNotEmpty())
            assertEquals("at $level", drawn, model.mapRuleZones.value.isNotEmpty())
            assertEquals("at $level", drawn, model.ruleZoneArea != null)
        }
        model.updateViewport(porto, zoom = 13, zoomLevel = 13.0)
        assertNull(model.ruleZoneArea)
    }

    @Test
    fun aCitysZonesFollowTheMapWhileTheZonesAreAskedFor() = runTest {
        val api = ZoneStubAPI()
        api.pending = true
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(porto, zoom = 16)
        assertEquals(ScooterZoneState.Loading, model.zoneState.value)
        val inView = model.mapRuleZones.value.map { it.rule.id }
        assertEquals(listOf("porto-parking-1abcfc08", "porto-parking-9fdb7b30"), inView)

        // Within the area being asked for, before it is answered.
        val nearby = porto.copy(center = GeoPoint(latitude = porto.center.latitude, longitude = porto.center.longitude + 0.0033))
        model.updateViewport(nearby, zoom = 16)
        assertTrue(api.zoneAreas.isEmpty())
        assertEquals(listOf("porto-parking-1abcfc08", "porto-parking-0814d2f8"), model.mapRuleZones.value.map { it.rule.id })

        // Answered while some feeds' zones are on their way, and asked for again.
        advanceTimeBy(250)
        runCurrent()
        assertEquals(1, api.zoneAreas.size)
        model.updateViewport(porto, zoom = 16)
        assertEquals(1, api.zoneAreas.size)
        assertEquals(inView, model.mapRuleZones.value.map { it.rule.id })
        assertEquals(ScooterZoneState.Loading, model.zoneState.value)
    }
    // Android's own: an answer with zones left out serves no smaller area than its own, which may have them all.

    /**
     * Zoomed in, the area asked for is smaller, and so is what the server finds in it: an answer with zones left out
     * that served the areas within its own would keep "Zoom in to see the zones" whatever the zoom.
     */
    @Test
    fun anAnswerWithZonesLeftOutServesItsOwnAreaAloneSoThatZoomingInAsksForTheRest() = runTest {
        val api = ZoneStubAPI()
        api.truncated = true
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(zurich, zoom = 16)
        val partial = waitUntil { api.zoneAreas.size == 1 && model.zoneState.value == ScooterZoneState.Partial }
        assertTrue(partial)

        // Within the same area, the answer stands.
        val nearby = zurich.copy(center = GeoPoint(latitude = zurich.center.latitude, longitude = zurich.center.longitude + 0.003))
        model.updateViewport(nearby, zoom = 16)
        assertEquals(ScooterZoneState.Partial, model.zoneState.value)
        advanceTimeBy(400)
        runCurrent()
        assertEquals(1, api.zoneAreas.size)

        // Zoomed in, the smaller area within it is asked for, those drawn staying meanwhile.
        api.truncated = false
        model.updateViewport(zurich.copy(latitudeDelta = 0.004, longitudeDelta = 0.004), zoom = 17)
        assertEquals(ScooterZoneState.Loading, model.zoneState.value)
        assertEquals(2, model.mapOperatorZoneCount.value)
        val shown = waitUntil { api.zoneAreas.size == 2 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(shown)
        assertTrue(api.zoneAreas[0].contains(api.zoneAreas[1]) && api.zoneAreas[0] != api.zoneAreas[1])

        // Back out, the answer of a moment ago serves its own area.
        model.updateViewport(zurich, zoom = 16)
        assertEquals(ScooterZoneState.Partial, model.zoneState.value)
        advanceTimeBy(400)
        runCurrent()
        assertEquals(2, api.zoneAreas.size)
    }

    /**
     * Zoomed in while the wide area's answer is on its way, the view waits for it, as it serves any area within its
     * own; one with zones left out serves its own alone, and the close view's area is asked for once it comes, rather
     * than "Zoom in to see the zones" staying at street level (week review, finding 5.1; the iPhone's 35d7a34c).
     */
    @Test
    fun zoomingInWhileAnAnswerWithZonesLeftOutIsOnItsWayAsksForTheCloseViewsOwnOnceItComes() = runTest {
        val api = ZoneStubAPI()
        api.truncated = true
        api.hold()
        val model = makeController(api)
        model.setShowsZones(true)
        model.updateViewport(zurich.copy(latitudeDelta = 0.03, longitudeDelta = 0.03), zoom = 14)
        val asked = waitUntil { api.zoneAreas.size == 1 }
        assertTrue(asked)

        model.updateViewport(zurich.copy(latitudeDelta = 0.004, longitudeDelta = 0.004), zoom = 17)
        api.truncated = false
        api.release()
        val shown = waitUntil { api.zoneAreas.size == 2 && model.zoneState.value == ScooterZoneState.Shown }
        assertTrue(shown)
        assertTrue(api.zoneAreas[0].contains(api.zoneAreas[1]) && api.zoneAreas[0] != api.zoneAreas[1])
    }
}

/** Lime's no riding and Bird's no parking, and [more] after them. */
private class ZoneStubAPI(private val more: List<ScooterZone> = emptyList()) : ScooterAPIClient {
    private var failure: ScooterAPIError? = null
    /** Whether some feeds' zones are still on their way. */
    var pending = false

    /** Whether some feeds' zones could not be read. */
    var unavailable = false

    /** Whether zones were left out to keep the answer small. */
    var truncated = false
    private val areas = mutableListOf<ScooterZoneArea>()

    val zoneAreas: List<ScooterZoneArea> get() = areas.toList()

    override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumRange: Int): ScooterResponse =
        ScooterResponse(vehicles = emptyList())

    override suspend fun zonesIn(area: ScooterZoneArea): ScooterZoneResponse {
        areas += area
        // The answer is as things were when it was asked for, also when it is held back.
        val pending = pending
        val unavailable = unavailable
        val truncated = truncated
        gate?.await()
        failure?.let { throw it }
        val ring = listOf(
            GeoPoint(latitude = 47.37, longitude = 8.54), GeoPoint(latitude = 47.38, longitude = 8.54),
            GeoPoint(latitude = 47.38, longitude = 8.55), GeoPoint(latitude = 47.37, longitude = 8.54),
        )
        return ScooterZoneResponse(
            zones = listOf(
                ScooterZone(id = "lime:0", provider = "lime", kind = ScooterZoneKind.NoRide, maxSpeedKph = null, polygons = listOf(listOf(ring))),
                ScooterZone(id = "bird:0", provider = "bird", kind = ScooterZoneKind.NoParking, maxSpeedKph = null, polygons = listOf(listOf(ring))),
            ) + more,
            pending = pending,
            unavailable = unavailable,
            truncated = truncated,
        )
    }

    fun setFailure(failure: ScooterAPIError?) {
        this.failure = failure
    }

    private var gate: CompletableDeferred<Unit>? = null

    /** Holds the answers to the zones asked for from now on, until [release]. */
    fun hold() {
        gate = CompletableDeferred()
    }

    /** Lets the answers held go. */
    fun release() {
        gate?.complete(Unit)
        gate = null
    }
}
