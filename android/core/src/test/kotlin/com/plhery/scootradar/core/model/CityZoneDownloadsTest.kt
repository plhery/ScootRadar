package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.api.ScooterAPI
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.map.waitUntil
import java.io.File
import java.time.Instant
import kotlin.io.path.createTempDirectory
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.After
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

// ios/ScootRadarTests/CityZoneDownloadsTests.swift (T422 to T432). Its map's test, T433, is the app's
// (:app ui/chrome/CityZoneDownloadsTest.kt), with the legend it checks.

@OptIn(ExperimentalCoroutinesApi::class)
class CityZoneDownloadsTest {
    /** Round Berlin's Tiergarten, at zoom 16 on a phone. */
    private val tiergarten = GeoBounds(south = 52.51, west = 13.34, north = 52.52, east = 13.37)
    private val zurich = GeoBounds(south = 47.36, west = 8.53, north = 47.38, east = 8.55)
    private val directory: File = createTempDirectory("CityZoneDownloadsTest").toFile()
    private var now: Instant = Instant.ofEpochSecond(1_793_000_000)

    @After
    fun tearDown() {
        directory.deleteRecursively()
    }

    private val cache: CityZoneCache get() = CityZoneCache(directory)

    // The files

    @Test
    fun theIndexListsTheCitiesItCanReadAndNoneOfAnotherFormat() {
        val file = zoneFile(id = "berlin", zones = listOf(berlinZone))
        val index = CityZoneIndex(
            data = zoneIndex(
                listOf(
                    indexEntry("berlin", file = file),
                    """{"id":"hamburg","place":"Hamburg"}""",
                    indexEntry("lille", file = file, source = "http://example.com"),
                ),
            ),
        )
        assertEquals(listOf("berlin"), index.cities.map { it.id })
        val berlin = index.cities.first()
        assertEquals("Berlin", berlin.place)
        assertEquals("Land Berlin, DL-DE Zero", berlin.authority)
        assertEquals("Europe/Berlin", berlin.timeZone)
        assertEquals(berlinSource, berlin.source)
        assertEquals(GeoBounds(south = 52.5, west = 13.3, north = 52.6, east = 13.5), berlin.bounds)
        assertEquals(CityZoneFile.digest(file), berlin.sha256)
        assertEquals("berlin.json", berlin.fileName)

        try {
            CityZoneIndex(data = """{"format":2,"cities":[]}""".toByteArray())
            fail("An index of another format is none")
        } catch (_: CityZoneDownloadError.Format) {
        }
    }

    @Test
    fun aCitysFileIsItsZonesEachOneRingCreditedToTheCityLeavingOutKindsAddedLater() {
        val berlin = CityZoneIndex(data = zoneIndex(listOf(indexEntry("berlin", file = ByteArray(0))))).cities.first()
        val file = """
            {"id":"berlin","zones":[
            {"id":"berlin-no-parking-1","kind":"noParking","ring":[52.511,13.35,52.512,13.35,52.512,13.351]},
            {"id":"berlin-racks-only-2","kind":"racksOnly","ring":[52.511,13.35,52.512,13.35,52.512,13.351]},
            {"id":"berlin-parking-3","kind":"parking","ring":[52.511,13.35,52.512]}
            ]}
        """.trimIndent().toByteArray()
        val zones = CityZoneFile.zones(of = berlin, from = file)
        assertEquals(listOf("berlin-no-parking-1"), zones.map { it.id })
        val zone = zones.first()
        assertEquals(ScooterZoneKind.NoParking, zone.kind)
        assertEquals("Land Berlin, DL-DE Zero", zone.authority)
        assertEquals(berlinSource, zone.source)
        assertEquals(
            listOf(listOf(listOf(GeoPoint(52.511, 13.35), GeoPoint(52.512, 13.35), GeoPoint(52.512, 13.351)))),
            zone.polygons,
        )
        assertTrue(zone.inForce(now))

        try {
            CityZoneFile.zones(of = berlin, from = zoneFile(id = "hamburg", zones = listOf(berlinZone)))
            fail("Hamburg's file is not Berlin's")
        } catch (_: CityZoneDownloadError.Mismatch) {
        }
    }

    @Test
    fun theFilesAreTheWebsitesAskedForWithNothingOfWhereTheRiderIs() = runBlocking<Unit> {
        val asked = mutableListOf<Request>()
        val api = ScooterAPI(client = answering(200, asked))
        // The client that keeps nothing on disk (LOG-002).
        assertNull(api.http.cache)
        val data = api.cityZoneFile("berlin.json")
        assertEquals("{}", data.decodeToString())
        val request = asked.single()
        assertEquals("GET", request.method)
        assertEquals("https://scootradar.com/zones/v1/berlin.json", request.url.toString())
        assertNull(request.url.query)

        try {
            ScooterAPI(client = answering(404, asked)).cityZoneFile("index.json")
            fail("A 404 is no file")
        } catch (error: ScooterAPIError.HttpStatus) {
            assertEquals(404, error.statusCode)
        }
    }

    // Downloading

    @Test
    fun aViewOverACityAsksForTheIndexThenItsFileAndDrawsItsZones() = runTest {
        val file = zoneFile(id = "berlin", zones = listOf(berlinZone))
        val api = DownloadStubAPI(mapOf("index.json" to zoneIndex(listOf(indexEntry("berlin", file = file))), "berlin.json" to file))
        val downloads = makeDownloads(api)

        downloads.request(over = zurich)
        val indexed = waitUntil { downloads.cities.firstOrNull()?.sha256 != null }
        assertTrue("The index is asked for from the first view, wherever it is", indexed)
        assertTrue(downloads.shown(over = zurich).notices.isEmpty())

        downloads.request(over = tiergarten)
        val drawn = waitUntil { downloads.shown(over = tiergarten).zones.size == 1 }
        assertTrue(drawn)
        assertEquals(listOf("berlin-no-parking-1"), downloads.shown(over = tiergarten).zones.map { it.id })
        assertTrue(downloads.shown(over = tiergarten).notices.isEmpty())
        assertEquals(listOf("index.json", "berlin.json"), api.asked)

        // Kept on the device, the index confirmed now.
        assertArrayEquals(file, cache.read("berlin.json")?.data)
        assertEquals(now, cache.read("index.json")?.savedAt)
        // Asked for again only after 6 hours.
        downloads.request(over = tiergarten)
        runCurrent()
        assertEquals(listOf("index.json", "berlin.json"), api.asked)
        now = now.addingTimeInterval(CityZoneDownloads.indexRefresh)
        downloads.request(over = tiergarten)
        val again = waitUntil { api.asked.size == 3 }
        assertTrue(again)
        assertEquals("index.json", api.asked.last())
    }

    @Test
    fun whileTheFileIsOnItsWayTheCitysZonesAreLoadingAndWhenItFailsUnavailableAndAskedForAgainLater() = runTest {
        val file = zoneFile(id = "berlin", zones = listOf(berlinZone))
        val api = DownloadStubAPI(mapOf("index.json" to zoneIndex(listOf(indexEntry("berlin", file = file)))))
        api.hold("berlin.json")
        val downloads = makeDownloads(api)
        var changes = 0
        downloads.onChange = { changes += 1 }

        downloads.request(over = tiergarten)
        assertEquals("Before the first index, the built-in list", listOf(Loading), states(downloads.shown(over = tiergarten)))
        val onItsWay = waitUntil { api.asked == listOf("index.json", "berlin.json") }
        assertTrue(onItsWay)
        assertEquals("While the file is on its way", listOf(Loading), states(downloads.shown(over = tiergarten)))
        api.release("berlin.json")
        val failed = waitUntil { states(downloads.shown(over = tiergarten)) == listOf(Unavailable) }
        assertTrue("berlin.json answers 404", failed)
        assertTrue(downloads.shown(over = tiergarten).zones.isEmpty())
        assertEquals("The index came, then the file failed", 2, changes)

        // Not asked for again at once, still unavailable while it is asked for again.
        downloads.request(over = tiergarten)
        runCurrent()
        assertEquals(listOf("index.json", "berlin.json"), api.asked)
        api.set("berlin.json", file)
        now = now.addingTimeInterval(CityZoneDownloads.retryAfter)
        downloads.request(over = tiergarten)
        assertEquals(listOf(Unavailable), states(downloads.shown(over = tiergarten)))
        val drawn = waitUntil { downloads.shown(over = tiergarten).zones.size == 1 }
        assertTrue(drawn)
        assertTrue(downloads.shown(over = tiergarten).notices.isEmpty())
        assertEquals(listOf("index.json", "berlin.json", "berlin.json"), api.asked)
    }

    @Test
    fun beforeAnyIndexAViewOverABuiltInDownloadCitySaysItsZonesAreUnavailableOnceTheIndexFails() = runTest {
        val api = DownloadStubAPI(emptyMap())
        val downloads = makeDownloads(api)

        downloads.request(over = tiergarten)
        assertEquals(listOf(Loading), states(downloads.shown(over = tiergarten)))
        val failed = waitUntil { states(downloads.shown(over = tiergarten)) == listOf(Unavailable) }
        assertTrue(failed)
        assertEquals("Berlin", downloads.shown(over = tiergarten).notices.firstOrNull()?.city?.place)
        assertTrue(downloads.shown(over = zurich).notices.isEmpty())
    }

    @Test
    fun aFileThatIsNotTheIndexsIsNotDrawnAndTheIndexIsAskedForAgainAtOnce() = runTest {
        val old = zoneFile(id = "berlin", zones = listOf(berlinZone))
        val new = zoneFile(id = "berlin", zones = listOf(berlinZone, berlinOtherZone))
        // The index of one deploy, the file of the next; then the next's index.
        val api = DownloadStubAPI(mapOf("berlin.json" to new))
        api.queue("index.json", listOf(zoneIndex(listOf(indexEntry("berlin", file = old))), zoneIndex(listOf(indexEntry("berlin", file = new)))))
        val downloads = makeDownloads(api)

        downloads.request(over = tiergarten)
        val drawn = waitUntil { downloads.shown(over = tiergarten).zones.size == 2 }
        assertTrue("The new index is asked for at once, and the file of its version with it", drawn)
        assertEquals(listOf("index.json", "berlin.json", "index.json", "berlin.json"), api.asked)
        assertArrayEquals(new, cache.read("berlin.json")?.data)
    }

    @Test
    fun aNewVersionIsNotDrawnUntilItHasComeAndAnOldOneNeverInItsPlace() = runTest {
        val old = zoneFile(id = "berlin", zones = listOf(berlinZone))
        val new = zoneFile(id = "berlin", zones = listOf(berlinZone, berlinOtherZone))
        val api = DownloadStubAPI(mapOf("index.json" to zoneIndex(listOf(indexEntry("berlin", file = old))), "berlin.json" to old))
        val downloads = makeDownloads(api)
        downloads.request(over = tiergarten)
        val drawn = waitUntil { downloads.shown(over = tiergarten).zones.size == 1 }
        assertTrue(drawn)

        // A new version is published, and the new file fails to come.
        api.set("index.json", zoneIndex(listOf(indexEntry("berlin", file = new))))
        api.remove("berlin.json")
        now = now.addingTimeInterval(CityZoneDownloads.indexRefresh)
        downloads.request(over = tiergarten)
        val failed = waitUntil { states(downloads.shown(over = tiergarten)) == listOf(Unavailable) }
        assertTrue(failed)
        assertTrue("The old version is not drawn", downloads.shown(over = tiergarten).zones.isEmpty())
    }

    @Test
    fun offlineTheFilesKeptAreDrawnForAWeekAfterTheIndexWasLastConfirmed() = runTest {
        val file = zoneFile(id = "berlin", zones = listOf(berlinZone))
        val online = DownloadStubAPI(mapOf("index.json" to zoneIndex(listOf(indexEntry("berlin", file = file))), "berlin.json" to file))
        val first = makeDownloads(online)
        first.request(over = tiergarten)
        val drawn = waitUntil { first.shown(over = tiergarten).zones.size == 1 }
        assertTrue(drawn)

        // The app opened again, offline, a day later: the files kept serve.
        now = now.addingTimeInterval(24 * 3600.0)
        val offline = DownloadStubAPI(emptyMap())
        val second = makeDownloads(offline)
        second.request(over = tiergarten)
        val kept = waitUntil { second.shown(over = tiergarten).zones.size == 1 }
        assertTrue(kept)
        assertEquals("The index was due, and failed; the file was read from the device", listOf("index.json"), offline.asked)

        // A week after the index was confirmed, not any more.
        now = now.addingTimeInterval(CityZoneDownloads.indexLifetime)
        val third = makeDownloads(offline)
        third.request(over = tiergarten)
        val unavailable = waitUntil { states(third.shown(over = tiergarten)) == listOf(Unavailable) }
        assertTrue(unavailable)
        assertTrue(third.shown(over = tiergarten).zones.isEmpty())
    }

    @Test
    fun aCityBuiltIntoTheAppIsDrawnFromTheCatalogAndLeftAsideInTheIndex() = runTest {
        val file = zoneFile(id = "berlin", zones = listOf(berlinZone))
        val api = DownloadStubAPI(mapOf("index.json" to zoneIndex(listOf(indexEntry("berlin", file = file))), "berlin.json" to file))
        val downloads = makeDownloads(api, builtInCities = setOf("berlin"))
        downloads.request(over = tiergarten)
        val indexed = waitUntil { api.asked == listOf("index.json") }
        assertTrue(indexed)
        downloads.request(over = tiergarten)
        assertTrue(downloads.cities.isEmpty())
        assertEquals(emptyList<CityRuleZone>(), downloads.shown(over = tiergarten).zones)
        assertEquals(emptyList<CityZoneDownloads.Notice>(), downloads.shown(over = tiergarten).notices)
    }

    @Test
    fun aNewIndexLetsGoOfTheFilesOfCitiesItNoLongerLists() = runTest {
        val file = zoneFile(id = "berlin", zones = listOf(berlinZone))
        cache.write("hamburg.json", "{}".toByteArray(), at = now)
        val api = DownloadStubAPI(mapOf("index.json" to zoneIndex(listOf(indexEntry("berlin", file = file))), "berlin.json" to file))
        val downloads = makeDownloads(api)
        downloads.request(over = tiergarten)
        val drawn = waitUntil { downloads.shown(over = tiergarten).zones.size == 1 }
        assertTrue(drawn)
        assertEquals(listOf("berlin.json", "index.json"), directory.list().orEmpty().sorted())
    }

    // Helpers

    /** The downloads on the test's scheduler, their files read and written on it too, with the tests' Berlin built in. */
    private fun TestScope.makeDownloads(api: ScooterAPIClient, builtInCities: Set<String> = emptySet()) = CityZoneDownloads(
        api = api, cache = cache, scope = backgroundScope, now = { now }, builtIn = listOf(berlinDownload),
        builtInCities = builtInCities, files = StandardTestDispatcher(testScheduler),
    )

    private fun states(shown: CityZoneDownloads.Shown) = shown.notices.map { it.state }

    /** Answers every request at once with the status and "{}", so nothing leaves the test, and notes each. */
    private fun answering(statusCode: Int, asked: MutableList<Request>): OkHttpClient =
        OkHttpClient.Builder().addInterceptor { chain ->
            val request = chain.request()
            synchronized(asked) { asked += request }
            Response.Builder().request(request).protocol(Protocol.HTTP_1_1).code(statusCode).message("")
                .body("{}".toResponseBody()).build()
        }.build()

    private companion object {
        val Loading = CityZoneDownloads.Notice.State.Loading
        val Unavailable = CityZoneDownloads.Notice.State.Unavailable
    }
}
