package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.ScooterClusteringPolicy
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneArea
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneResponse
import com.plhery.scootradar.core.model.ScooterZoneState
import java.time.Instant
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
    fun zonesAreOffUntilTurnedOnAndTheChoiceIsKept() = runTest {
        val defaults = InMemoryScooterDefaults()
        val model = makeController(ZoneStubAPI(), defaults = defaults)
        assertFalse(model.showsZones.value)
        assertEquals(ScooterZoneState.Off, model.zoneState.value)

        model.setShowsZones(true)

        assertTrue(makeController(ZoneStubAPI(), defaults = defaults).showsZones.value)
    }

    @Test
    fun theZonesOfTheMapsAreaAreDrawnForTheProvidersShown() = runTest {
        val api = ZoneStubAPI()
        val model = makeController(api)
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
        // What came is drawn while the rest is on its way.
        assertEquals(ScooterZoneState.Shown, model.zoneState.value)
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
        assertEquals(ScooterZoneState.Shown, model.zoneState.value)
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

    // Android's own: where the area the cities' zones are picked over ends, and the zoom they are picked from.

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
        assertEquals(ScooterZoneState.Shown, model.zoneState.value)
    }
}

private class ZoneStubAPI : ScooterAPIClient {
    private var failure: ScooterAPIError? = null
    /** Whether some feeds' zones are still on their way. */
    var pending = false
    private val areas = mutableListOf<ScooterZoneArea>()

    val zoneAreas: List<ScooterZoneArea> get() = areas.toList()

    override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse =
        ScooterResponse(vehicles = emptyList())

    override suspend fun zonesIn(area: ScooterZoneArea): ScooterZoneResponse {
        areas += area
        failure?.let { throw it }
        val ring = listOf(
            GeoPoint(latitude = 47.37, longitude = 8.54), GeoPoint(latitude = 47.38, longitude = 8.54),
            GeoPoint(latitude = 47.38, longitude = 8.55), GeoPoint(latitude = 47.37, longitude = 8.54),
        )
        return ScooterZoneResponse(
            zones = listOf(
                ScooterZone(id = "lime:0", provider = "lime", kind = ScooterZoneKind.NoRide, maxSpeedKph = null, polygons = listOf(listOf(ring))),
                ScooterZone(id = "bird:0", provider = "bird", kind = ScooterZoneKind.NoParking, maxSpeedKph = null, polygons = listOf(listOf(ring))),
            ),
            pending = pending,
            truncated = false,
        )
    }

    fun setFailure(failure: ScooterAPIError?) {
        this.failure = failure
    }
}
