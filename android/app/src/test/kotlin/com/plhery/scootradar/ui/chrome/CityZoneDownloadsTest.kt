package com.plhery.scootradar.ui.chrome

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.model.CityZoneDownload
import com.plhery.scootradar.core.model.CityZoneDownloads
import com.plhery.scootradar.core.model.CityZoneFile
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.ScooterMapScreen
import com.plhery.scootradar.ui.theme.PHONE
import kotlinx.coroutines.CompletableDeferred
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.util.Locale

// The map's test of ios/ScootRadarTests/CityZoneDownloadsTests.swift (T433), through the screen and its legend
// (ui.md UI-409): the city's zones the app downloads are loading, then drawn, and unavailable after a failure.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = PHONE)
class CityZoneDownloadsTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()

    @Before
    fun setUp() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    @Test
    fun theMapDrawsADownloadedCitysZonesFromZoom14AndSaysWhileTheyAreNot() {
        val file = zoneFile(listOf(ZONE))
        val api = ZoneFilesAPI(mapOf("index.json" to index(file), "berlin.json" to file))
        api.hold("berlin.json")
        val clock = TestClock()
        val model = controllers.make(api, clock, catalog = ScooterCatalog.Listed(zoneDownloads = listOf(BERLIN)))
        // The operators' zones off: only the city's are drawn, from zoom 14.
        model.updateViewport(tiergarten, zoom = 16)
        assertTrue(controllers.waitUntil { api.asked == listOf("index.json", "berlin.json") })
        assertEquals(ScooterZoneState.Off, model.zoneState.value)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = { Box(Modifier.fillMaxSize()) }, glassBlurs = false)
            }
        }
        compose.waitForIdle()

        // Loading: the legend is there for the notice alone, the zones off and none drawn.
        compose.onNodeWithTag(ZONE_LEGEND_TAG).assertExists()
        compose.onNodeWithText("Loading Berlin’s zones…").assertExists()
        assertTrue(model.mapZones.value.isEmpty())
        // Never "No zones published here" over a city whose zones are not drawn.
        assertNull(zoneLegendNote(ScooterZoneState.Shown, count = 0, rules = false, notices = true))
        assertEquals("No zones published here", zoneLegendNote(ScooterZoneState.Shown, count = 0, rules = false, notices = false))

        // Drawn once the file has come, and credited to the city.
        api.release("berlin.json")
        assertTrue(controllers.waitUntil { model.mapZones.value.map { it.id } == listOf("rule:berlin-no-parking-1") })
        compose.waitForIdle()
        compose.onNodeWithText("Loading Berlin’s zones…").assertDoesNotExist()
        compose.onNodeWithText("No parking · Land Berlin, DL-DE Zero").assertExists()

        // A new version is published, and its file fails to come: the old one is not drawn, and the legend says so.
        api.set("index.json", index(zoneFile(listOf(ZONE, OTHER_ZONE))))
        api.remove("berlin.json")
        clock.advance(CityZoneDownloads.indexRefresh)
        model.autoRefreshIfNeeded()
        assertTrue(controllers.waitUntil { model.mapZoneNotices.value.map { it.state } == listOf(CityZoneDownloads.Notice.State.Unavailable) })
        compose.waitForIdle()
        compose.onNodeWithText("Berlin’s zones unavailable right now").assertExists()
        compose.onNodeWithText("No parking · Land Berlin, DL-DE Zero").assertDoesNotExist()
        assertTrue(model.mapZones.value.isEmpty())

        // Further out than zoom 14, neither the zones nor the notice, nor the legend.
        model.updateViewport(tiergarten.copy(latitudeDelta = 0.08, longitudeDelta = 0.1), zoom = 13)
        compose.waitForIdle()
        assertTrue(model.mapZoneNotices.value.isEmpty())
        compose.onNodeWithTag(ZONE_LEGEND_TAG).assertDoesNotExist()
    }

    /** The website's files under /zones/v1/, by name, a name it has not a 404; one it holds is on its way until let go. */
    private class ZoneFilesAPI(files: Map<String, ByteArray>) : ScooterAPIClient {
        private val files = files.toMutableMap()
        private val held = mutableMapOf<String, CompletableDeferred<Unit>>()
        val asked = mutableListOf<String>()

        override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(vehicles = emptyList())

        override suspend fun cityZoneFile(name: String): ByteArray {
            asked += name
            held[name]?.await()
            return files[name] ?: throw ScooterAPIError.HttpStatus(404)
        }

        fun set(name: String, data: ByteArray) {
            files[name] = data
        }

        fun remove(name: String) {
            files.remove(name)
        }

        fun hold(name: String) {
            held[name] = CompletableDeferred()
        }

        fun release(name: String) {
            held.remove(name)?.complete(Unit)
        }
    }

    private companion object {
        /** Round Berlin's Tiergarten, at zoom 16 on a phone. */
        val tiergarten = MapRegion(GeoPoint(52.5145, 13.355), latitudeDelta = 0.006, longitudeDelta = 0.01)

        const val SOURCE = "https://www.berlin.de/sen/uvk/verkehr/verkehrsplanung/fuss-und-radverkehr/"
        const val ZONE = """{"id":"berlin-no-parking-1","kind":"noParking","ring":[52.511,13.35,52.512,13.35,52.512,13.351]}"""
        const val OTHER_ZONE = """{"id":"berlin-parking-2","kind":"parking","ring":[52.513,13.36,52.5131,13.36,52.5131,13.3601]}"""

        /** Berlin as the app's build lists it. */
        val BERLIN = CityZoneDownload(
            id = "berlin", place = "Berlin", authority = "Land Berlin, DL-DE Zero", timeZone = "Europe/Berlin",
            source = SOURCE, bounds = GeoBounds(south = 52.5, west = 13.3, north = 52.6, east = 13.5),
        )

        fun zoneFile(zones: List<String>): ByteArray = "{\"id\":\"berlin\",\"zones\":[\n${zones.joinToString(",\n")}\n]}\n".toByteArray()

        /** The index of Berlin's file. */
        fun index(file: ByteArray): ByteArray = (
            """{"format":1,"cities":[{"id":"berlin","place":"Berlin","authority":"Land Berlin, DL-DE Zero",""" +
                """"timeZone":"Europe/Berlin","source":{"title":"Berlin","url":"$SOURCE"},""" +
                """"bounds":{"south":52.5,"west":13.3,"north":52.6,"east":13.5},"zones":1,"bytes":${file.size},""" +
                """"sha256":"${CityZoneFile.digest(file)}"}]}"""
            ).toByteArray()
    }
}
