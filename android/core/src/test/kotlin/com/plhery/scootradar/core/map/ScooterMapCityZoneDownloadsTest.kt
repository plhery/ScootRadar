package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.model.CityZoneDownloads
import com.plhery.scootradar.core.model.DownloadStubAPI
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.berlinDownload
import com.plhery.scootradar.core.model.berlinZone
import com.plhery.scootradar.core.model.indexEntry
import com.plhery.scootradar.core.model.zoneFile
import com.plhery.scootradar.core.model.zoneIndex
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

// The map's part of ios/ScootRadar/ViewModels/ScooterMapModel.swift rebuildMapZones (LOG-423): the cities' zones the
// app downloads, asked for and drawn with those built in. T433, through the screen and its legend, is the app's
// (:app ui/chrome/CityZoneDownloadsTest.kt).
@OptIn(ExperimentalCoroutinesApi::class)
class ScooterMapCityZoneDownloadsTest {
    /** Round Berlin's Tiergarten, at zoom 16 on a phone. */
    private val tiergarten = MapRegion(center = GeoPoint(latitude = 52.5145, longitude = 13.355), latitudeDelta = 0.006, longitudeDelta = 0.01)
    private val file = zoneFile(id = "berlin", zones = listOf(berlinZone))
    private val index = zoneIndex(listOf(indexEntry("berlin", file = file)))
    private val Loading = CityZoneDownloads.Notice.State.Loading
    private val Unavailable = CityZoneDownloads.Notice.State.Unavailable

    /** A controller whose catalog's only city to download is Berlin, its zones off, on the test's clock. */
    private fun TestScope.berlinController(api: DownloadStubAPI, clock: TestClock): ScooterMapController {
        val model = makeController(
            api, clock = clock, catalog = ScooterCatalog.Listed(zoneDownloads = listOf(berlinDownload)),
            cityZoneFiles = StandardTestDispatcher(testScheduler),
        )
        model.setShowsZones(false)
        return model
    }

    @Test
    fun aViewFromZoom14OverACityAsksForItsZonesAndTheMapDrawsThemOrSaysWhyNotAsTheyComeOrFail() = runTest {
        val api = DownloadStubAPI(mapOf("index.json" to index))
        api.hold("berlin.json")
        val clock = TestClock()
        val model = berlinController(api, clock)

        model.updateViewport(tiergarten, zoom = 16)
        val onItsWay = waitUntil { api.asked == listOf("index.json", "berlin.json") }
        assertTrue(onItsWay)
        assertEquals(listOf(Loading), model.mapZoneNotices.value.map { it.state })
        assertEquals("Berlin", model.mapZoneNotices.value.single().city.place)
        assertTrue(model.mapZones.value.isEmpty())

        // berlin.json answers 404: said at once, nothing drawn.
        api.release("berlin.json")
        runCurrent()
        assertEquals(listOf(Unavailable), model.mapZoneNotices.value.map { it.state })
        assertTrue(model.mapZones.value.isEmpty())

        // Asked for again after a while, as the map refreshes, and drawn once it has come.
        api.set("berlin.json", file)
        clock.advance(CityZoneDownloads.retryAfter)
        model.autoRefreshIfNeeded()
        val drawn = waitUntil { model.mapZones.value.map { it.id } == listOf("rule:berlin-no-parking-1") }
        assertTrue(drawn)
        assertTrue(model.mapZoneNotices.value.isEmpty())
        assertEquals(listOf("Land Berlin, DL-DE Zero"), model.mapRuleZones.value.map { it.rule.authority })
        assertEquals(listOf("index.json", "berlin.json", "berlin.json"), api.asked)

        model.updateViewport(tiergarten.copy(latitudeDelta = 0.08, longitudeDelta = 0.1), zoom = 13)
        assertTrue(model.mapZones.value.isEmpty())
        assertTrue(model.mapZoneNotices.value.isEmpty())
    }

    @Test
    fun aCitysZonesAreAskedForOverTheWiderAreaAndItsNoticeIsForTheMapItself() = runTest {
        val api = DownloadStubAPI(mapOf("index.json" to index))
        val model = berlinController(api, TestClock())

        // Just east of Berlin's bounds (13.5): the map and half of it again on each side reach them.
        val east = MapRegion(center = GeoPoint(latitude = 52.55, longitude = 13.508), latitudeDelta = 0.006, longitudeDelta = 0.01)
        model.updateViewport(east, zoom = 16)
        val asked = waitUntil { api.asked == listOf("index.json", "berlin.json") }
        assertTrue(asked)
        settle()
        assertTrue(model.mapZoneNotices.value.isEmpty())

        // Over Berlin, its zones are unavailable.
        val west = east.copy(center = GeoPoint(latitude = 52.55, longitude = 13.497))
        model.updateViewport(west, zoom = 16)
        assertEquals(listOf(Unavailable), model.mapZoneNotices.value.map { it.state })
    }
}
