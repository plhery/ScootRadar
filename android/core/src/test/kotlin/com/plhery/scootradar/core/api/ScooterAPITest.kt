package com.plhery.scootradar.core.api

import com.plhery.scootradar.core.map.RecordingAnalytics
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterStartPlace
import com.plhery.scootradar.core.model.ScooterZoneArea
import java.io.IOException
import java.net.MalformedURLException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.time.Instant
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.concurrent.TimeUnit
import kotlin.io.path.createTempDirectory
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.joinAll
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.doubleOrNull
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import okhttp3.Cache
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test

// ios/ScootRadarTests/ScooterAPITests.swift. AddressSearchModelTests test the search field's model
// (Views/SwissAddressSearch.swift), which comes with the screens.

class ScooterAPITest {
    private val server = MockWebServer()
    private val launchLocale = ScooterLanguage.launchLocale
    private val timeZone = ScooterDateFormat.timeZone

    /** The phone's locale and zone, the same whatever the host's; a server on this machine only. */
    @Before
    fun setUp() {
        ScooterLanguage.launchLocale = { Locale.US }
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        server.start()
    }

    @After
    fun tearDown() {
        server.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = timeZone
    }

    // ScooterAPITests

    @Test
    fun parkingIsDecodedSeparatelyFromVehiclesAndLegacyResponsesStillWork() = runBlocking<Unit> {
        val data = """{"vehicles":[],"clusters":[],"providers":{},"parking":[{"id":"dott:bay","provider":"dott","name":"Place test","lat":45.75,"lng":4.85,"mandatory":true}],"meta":{"partial":false,"stale":false,"failedSources":[],"sources":{},"generatedAt":"2026-09-08T12:00:00Z","truncated":false,"totalVehicles":0,"mode":"vehicles","zoom":16,"parkingStatus":"fresh"}}"""
        val response = makeAPI(responseStatus = 200, data = data).scooters(bounds = bounds, zoom = 16, minimumBattery = 0)
        assertEquals(1, response.parking.size)
        assertTrue(response.parking[0].mandatory)
        assertEquals(45.75, response.parking[0].coordinate.latitude, 0.0)
        assertEquals("fresh", response.meta?.parkingStatus)
        assertTrue(response.vehicles.isEmpty())
        val legacy = makeAPI(responseStatus = 200, data = emptyResponseData).scooters(bounds = bounds, zoom = 16, minimumBattery = 0)
        assertTrue(legacy.parking.isEmpty())
    }

    @Test
    fun successfulResponseIsDecoded() = runBlocking<Unit> {
        val api = makeAPI(responseStatus = 200, data = emptyResponseData)

        val response = api.scooters(bounds = bounds, zoom = 16, minimumBattery = 0)

        assertTrue(response.vehicles.isEmpty())
    }

    @Test
    fun requestSendsBoundsZoomAndFilterWithoutASeparateUserLocation() = runBlocking<Unit> {
        val api = makeAPI(responseStatus = 200, data = emptyResponseData)

        // A point for the decimals whatever the phone's language.
        val defaultLocale = Locale.getDefault()
        Locale.setDefault(Locale.GERMANY)
        try {
            api.scooters(bounds = GeoBounds(south = 47.36789, west = 8.5, north = 47.4, east = 8.61234), zoom = 12, minimumBattery = 55)
        } finally {
            Locale.setDefault(defaultLocale)
        }

        // In the iPhone's order.
        val url = server.takeRequest().url
        assertEquals(
            listOf("south" to "47.36789", "west" to "8.50000", "north" to "47.40000", "east" to "8.61234", "zoom" to "12", "minBattery" to "55"),
            (0 until url.querySize).map { url.queryParameterName(it) to url.queryParameterValue(it) },
        )
    }

    @Test
    fun aViewAcrossTheDateLineIsAskedForWithItsWestGreaterThanItsEast() = runBlocking<Unit> {
        val api = makeAPI(responseStatus = 200, data = emptyResponseData)
        val view = GeoBounds(
            region = MapRegion(center = GeoPoint(latitude = -36.52, longitude = -178.6), latitudeDelta = 21.08, longitudeDelta = 43.0),
        )

        api.scooters(bounds = view, zoom = 6, minimumBattery = 0)

        val url = server.takeRequest().url
        assertEquals("159.90000", url.queryParameter("west"))
        assertEquals("-157.10000", url.queryParameter("east"))
    }

    @Test
    fun requestsToTheServerLeaveNothingOnDisk() {
        // Left to themselves, both clients use a session without a URL cache:
        // the bounds in a request are the rider's position after Near me.
        for (client in listOf(ScooterAPI().client, AddressSearchAPI().client)) {
            assertNull(client.cache)
            assertSame(CookieJar.NO_COOKIES, client.cookieJar)
        }
        // Nor with a client the app hands over that keeps both; and a search or a walk is not sent twice.
        val keeping = OkHttpClient.Builder()
            .cache(Cache(createTempDirectory("scootradar-cache").toFile(), 1_024))
            .cookieJar(object : CookieJar {
                override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) = Unit
                override fun loadForRequest(url: HttpUrl): List<Cookie> = emptyList()
            })
            .build()
        val search = AddressSearchAPI(client = keeping).http
        val walk = ScootRadarWalkingDirections(client = keeping).http
        for (http in listOf(ScooterAPI(client = keeping).http, search, walk)) {
            assertNull(http.cache)
            assertSame(CookieJar.NO_COOKIES, http.cookieJar)
        }
        assertFalse(search.retryOnConnectionFailure)
        assertFalse(walk.retryOnConnectionFailure)
    }

    @Test
    fun theSiteIsScootRadarComAndItsWaitsAreBetweenBytes() = runBlocking<Unit> {
        assertEquals("https://scootradar.com/", ScooterAPI.productionBaseURL.toString())
        val asked = mutableListOf<String>()
        val waits = mutableListOf<List<Long>>()
        val answering = answeringClient(asked, waits)

        failure { ScooterAPI(client = answering).scooters(bounds, zoom = 15, minimumBattery = 0) }
        failure { ScooterAPI(client = answering).zonesIn(ScooterZoneArea(covering = bounds)!!) }
        failure { AddressSearchAPI(client = answering).search("Paradeplatz", language = "de", near = null) }

        assertEquals(
            listOf("GET https://scootradar.com/api/scooters", "GET https://scootradar.com/api/zones", "POST https://scootradar.com/api/geocode"),
            asked,
        )
        // URLSession's timeoutInterval is the longest wait to connect or between bytes, with no limit on the
        // whole request: 20 s for the site's maps, 12 s for a search.
        val site = listOf(20_000L, 20_000L, 20_000L, 0L)
        assertEquals(listOf(site, site, listOf(12_000L, 12_000L, 12_000L, 0L)), waits)
    }

    @Test
    fun responseHealthMetadataIsDecoded() = runBlocking<Unit> {
        val data = """{"vehicles":[],"clusters":[],"providers":{},"meta":{"partial":true,"stale":true,"failedSources":["national"],"sources":{"national":"failed","hopp":"fresh"},"generatedAt":"2026-08-05T12:00:00.000Z","truncated":true,"totalVehicles":6200,"mode":"vehicles","zoom":null}}"""
        val api = makeAPI(responseStatus = 200, data = data)

        val response = api.scooters(bounds = bounds, zoom = 16, minimumBattery = 0)

        assertTrue(response.meta?.partial == true)
        assertTrue(response.meta?.stale == true)
        assertEquals(listOf("national"), response.meta?.failedSources)
        assertTrue(response.meta?.truncated == true)
        assertEquals(6_200, response.meta?.totalVehicles)
    }

    @Test
    fun httpStatusIsPreserved() = runBlocking<Unit> {
        val api = makeAPI(responseStatus = 503)

        when (val error = failure { api.scooters(bounds = bounds, zoom = 16, minimumBattery = 0) }) {
            null -> fail("Expected an HTTP status error")
            is ScooterAPIError -> {
                if (error !is ScooterAPIError.HttpStatus || error.statusCode != 503) fail("Expected HTTP 503, got $error")
                assertEquals(ScooterLoadFailure.Unavailable, error.loadFailure)
            }
            else -> fail("Unexpected error: $error")
        }
    }

    @Test
    fun offlineErrorIsToldApart() = runBlocking<Unit> {
        val api = makeAPI(failure = UnknownHostException("scootradar.com"), offline = true)

        when (val error = failure { api.scooters(bounds = bounds, zoom = 16, minimumBattery = 0) }) {
            null -> fail("Expected an offline error")
            is ScooterAPIError -> {
                if (error !is ScooterAPIError.Offline) fail("Expected offline, got $error")
                assertEquals(ScooterLoadFailure.Offline, error.loadFailure)
            }
            else -> fail("Unexpected error: $error")
        }
    }

    @Test
    fun timeoutIsToldApart() = runBlocking<Unit> {
        val api = makeAPI(failure = SocketTimeoutException("timeout"))

        when (val error = failure { api.scooters(bounds = bounds, zoom = 16, minimumBattery = 0) }) {
            null -> fail("Expected a timeout error")
            is ScooterAPIError -> {
                if (error !is ScooterAPIError.TimedOut) fail("Expected timedOut, got $error")
                assertEquals(ScooterLoadFailure.Timeout, error.loadFailure)
            }
            else -> fail("Unexpected error: $error")
        }
    }

    /**
     * A connection lost on the way, as the phone went offline mid-load, may only run out its wait on Android: the
     * phone offline then, it is offline, as iOS's networkConnectionLost is (X-M21).
     */
    @Test
    fun aTimeoutWithThePhoneOfflineIsOffline() = runBlocking<Unit> {
        val api = makeAPI(failure = SocketTimeoutException("timeout"), offline = true)

        when (val error = failure { api.scooters(bounds = bounds, zoom = 16, minimumBattery = 0) }) {
            null -> fail("Expected an offline error")
            is ScooterAPIError -> {
                if (error !is ScooterAPIError.Offline) fail("Expected offline, got $error")
                assertEquals(ScooterLoadFailure.Offline, error.loadFailure)
            }
            else -> fail("Unexpected error: $error")
        }
    }

    @Test
    fun invalidJSONIsToldApart() = runBlocking<Unit> {
        val api = makeAPI(responseStatus = 200, data = "{}")

        when (val error = failure { api.scooters(bounds = bounds, zoom = 16, minimumBattery = 0) }) {
            null -> fail("Expected a decoding error")
            is ScooterAPIError -> {
                if (error !is ScooterAPIError.InvalidData) fail("Expected invalidData, got $error")
                assertEquals(ScooterLoadFailure.Failed, error.loadFailure)
            }
            else -> fail("Unexpected error: $error")
        }
    }

    @Test
    fun loadFailureReasonIsDerivedFromTheAPIError() = runBlocking<Unit> {
        val expectations: List<Pair<ScooterAPIError, ScooterLoadFailure>> = listOf(
            ScooterAPIError.Offline() to ScooterLoadFailure.Offline,
            ScooterAPIError.TimedOut() to ScooterLoadFailure.Timeout,
            ScooterAPIError.HttpStatus(429) to ScooterLoadFailure.Busy,
            ScooterAPIError.HttpStatus(500) to ScooterLoadFailure.Unavailable,
            ScooterAPIError.HttpStatus(503) to ScooterLoadFailure.Unavailable,
            ScooterAPIError.HttpStatus(599) to ScooterLoadFailure.Unavailable,
            ScooterAPIError.HttpStatus(404) to ScooterLoadFailure.Failed,
            ScooterAPIError.InvalidURL() to ScooterLoadFailure.Failed,
            ScooterAPIError.InvalidResponse() to ScooterLoadFailure.Failed,
            ScooterAPIError.InvalidData(IOException("cannotParseResponse")) to ScooterLoadFailure.Failed,
            ScooterAPIError.Network(UnknownHostException("cannotFindHost")) to ScooterLoadFailure.Failed,
        )
        for ((error, expected) in expectations) {
            assertEquals("$error", expected, error.loadFailure)
            assertEquals("$error", expected, ScooterLoadFailure(error))
        }
        assertEquals(ScooterLoadFailure.Failed, ScooterLoadFailure(MalformedURLException("badURL")))
        assertEquals(5, ScooterLoadFailure.entries.map { it.message }.toSet().size)

        // The reason survives the trip through the real client.
        for ((api, expected) in listOf(
            makeAPI(failure = UnknownHostException("scootradar.com"), offline = true) to ScooterLoadFailure.Offline,
            makeAPI(failure = IOException("unexpected end of stream"), offline = true) to ScooterLoadFailure.Offline,
            // On a network that reaches the internet, a request that could not reach the server has failed.
            makeAPI(failure = IOException("unexpected end of stream")) to ScooterLoadFailure.Failed,
            makeAPI(failure = UnknownHostException("scootradar.com")) to ScooterLoadFailure.Failed,
            makeAPI(failure = SocketTimeoutException("timeout")) to ScooterLoadFailure.Timeout,
            makeAPI(failure = SocketTimeoutException("timeout"), offline = true) to ScooterLoadFailure.Offline,
            makeAPI(responseStatus = 429) to ScooterLoadFailure.Busy,
            makeAPI(responseStatus = 502) to ScooterLoadFailure.Unavailable,
            makeAPI(responseStatus = 200, data = "{}") to ScooterLoadFailure.Failed,
        )) {
            val error = failure { api.scooters(bounds = bounds, zoom = 16, minimumBattery = 0) }
            if (error == null) fail("Expected a $expected failure") else assertEquals(expected, ScooterLoadFailure(error))
        }
    }

    @Test
    fun theClockOffsetComesFromTheDateHeaderOfTheResponse() = runBlocking<Unit> {
        val sentAt = Instant.parse("2026-10-12T10:00:00Z")
        val header = "Mon, 12 Oct 2026 10:00:00 GMT"
        // Twenty minutes fast, twenty minutes slow, and right.
        assertEquals(1_200.0, ScooterAPI.clockOffset(dateHeader = header, receivedAt = sentAt.plusSeconds(1_200)), 0.0)
        assertEquals(-1_200.0, ScooterAPI.clockOffset(dateHeader = header, receivedAt = sentAt.minusSeconds(1_200)), 0.0)
        assertEquals(0.0, ScooterAPI.clockOffset(dateHeader = header, receivedAt = sentAt), 0.0)
        // Without a header that can be read, nothing is moved.
        assertEquals(0.0, ScooterAPI.clockOffset(dateHeader = null, receivedAt = sentAt), 0.0)
        assertEquals(0.0, ScooterAPI.clockOffset(dateHeader = "yesterday", receivedAt = sentAt), 0.0)

        // The client reads it from the response it received: the server's clock
        // says twenty minutes less than this one.
        val formatter = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss 'GMT'", Locale.US).withZone(ZoneOffset.UTC)
        val fast = makeAPI(
            responseStatus = 200,
            data = emptyResponseData,
            headers = mapOf("Date" to formatter.format(Instant.now().minusSeconds(1_200))),
        ).scooters(bounds = bounds, zoom = 16, minimumBattery = 0)
        assertEquals(1_200.0, fast.clockOffset, 5.0)
        val withoutHeader = makeAPI(responseStatus = 200, data = emptyResponseData)
            .scooters(bounds = bounds, zoom = 16, minimumBattery = 0)
        assertEquals(0.0, withoutHeader.clockOffset, 0.0)
    }

    @Test
    fun aDateHeaderIsReadAsFoundationReadsIt() {
        // A minute after 10:00 GMT: 60 for a header read as 10:00 GMT, 0 for one that is not read.
        val receivedAt = Instant.parse("2026-10-12T10:01:00Z")
        val read = listOf(
            "Tue, 12 Oct 2026 10:00:00 GMT",
            "mo, 12 october 2026 10:00:00 gmt",
            "Monday, 12 OCT 2026 10:00:00 UTC",
            "M , 12 Oct 2026 10:00:00 UT",
            " Mon,\t12 Oct 2026 10 :00: 00  Z ",
            "Mon, 012 Oct 02026 010:00:00 -00:00",
            "Mon, 12 Oct 2026 12:00:00 +0200",
            "Mon, 12 Oct 2026 12:00:00 +2",
            "Mon, 12 Oct 2026 12:30:00 GMT+2:30",
            "Mon, 12 Oct 2026 12:00:00 UTC+0200",
            "Mon, 12 Oct 2026 08:30:00 -01:30",
            "Mon, 12 Oct 2026 03:00:00 PDT",
            "Mon, 12 Oct 2026 05:00:00 EST",
        )
        for (header in read) assertEquals(header, 60.0, ScooterAPI.clockOffset(dateHeader = header, receivedAt = receivedAt), 0.0)
        val unread = listOf(
            "Mon, 12 Oct 2026 12:00:00 GMT+0200",
            "Mon, 12 Oct 2026 12:00:00 CEST",
            "Mon, 12 Oct 2026 10:00:00 Europe/Zurich",
            "Thur, 12 Oct 2026 10:00:00 GMT",
            "Mon, 12 Sept 2026 10:00:00 GMT",
            "Mon,12 Oct 2026 10:00:00 GMT",
            "12 Oct 2026 10:00:00 GMT",
            "Mon, 12 Oct 2026 10:00:00",
            "Mon, 12 Oct 2026 10:00:00GMT",
            "Mon, 12 Oct 2026 10:00:00 GMT\n",
            "Mon, 12 Oct 2026 10:00:00.5 GMT",
            "Mon, 12 Oct 2026 10:00 GMT",
            "Mon, 31 Feb 2026 10:00:00 GMT",
            "Mon, 12 Oct 2026 24:00:00 GMT",
            "Mon, 12 Oct 0 10:00:00 GMT",
            "Mon, 12 Oct 2026 10:00:00 +0260",
            "Mon, 12 Oct 2026 10:00:00 +2400",
        )
        for (header in unread) assertEquals(header, 0.0, ScooterAPI.clockOffset(dateHeader = header, receivedAt = receivedAt), 0.0)
    }

    @Test
    fun aZoneIsReadAsFoundationReadsIt() {
        // What DateFormatter (en_US_POSIX, "zzz") answers for "Mon, 12 Oct 2026 10:00:00 <zone>", received at
        // 10:01 GMT: the zone's offset from GMT plus the minute, or 0 where it reads nothing.
        val receivedAt = Instant.parse("2026-10-12T10:01:00Z")
        val foundation = mapOf(
            "GMT" to 0, "gmt" to 0, "utc" to 0, "ut" to 0, "z" to 0, "est" to -18_000, "UTC" to 0,
            "GMT+2" to 7_200, "gmt+2" to 7_200, "utc+2" to 7_200, "UT+2" to 7_200, "GMT+02" to 7_200, "UT+02" to 7_200,
            "GMT+02:00" to 7_200, "GMT+2:00" to 7_200, "GMT-02:30" to -9_000, "utc+2:00" to 7_200, "UT+2:00" to 7_200,
            "GMT+02:00:00" to 7_200, "utc+02:00:00" to 7_200, "GMT+2:00:30" to 7_230, "UTC+02:00:30" to 7_230,
            "UT+2:00:00" to 7_200, "UTC+0200" to 7_200, "ut+0200" to 7_200, "UTC+020000" to 7_200, "UTC+023" to 1_380,
            "UTC+02000" to 1_200, "+2" to 7_200, "+02" to 7_200, "+0200" to 7_200, "+02:00" to 7_200,
            "+02:00:00" to 7_200, "+020000" to 7_200, "+02:00:30" to 7_230, "-0530" to -19_800, "+23:59" to 86_340,
            "+023" to 1_380, "+02000" to 1_200, "-00:00" to 0, "GMT-0" to 0, "+0" to 0, "+00" to 0,
            "GMT+0200" to null, "GMT+2:0" to null, "GMT+02:0" to null, "GMT+020000" to null, "GMT+023" to null,
            "GMT+24:00" to null, "GMT+00:60" to null, "+2:00" to null, "+2:0" to null, "+02:0" to null,
            "+2:00:00" to null, "+2:00:30" to null, "+24" to null, "+2400" to null, "+0060" to null, "+00:60" to null,
            "+0260" to null, "GMT+" to null, "+" to null,
        )
        for ((zone, offset) in foundation) {
            val read = ScooterAPI.clockOffset(dateHeader = "Mon, 12 Oct 2026 10:00:00 $zone", receivedAt = receivedAt)
            assertEquals(zone, offset?.let { it + 60.0 } ?: 0.0, read, 0.0)
        }
    }

    @Test
    fun theEdgesAreWrittenAsPrintfWritesThem() {
        // Five decimals of the exact value, a tie to the even digit, a point whatever the language.
        val defaultLocale = Locale.getDefault()
        Locale.setDefault(Locale.GERMANY)
        try {
            for ((value, text) in listOf(
                47.3769 to "47.37690",
                0.015625 to "0.01562",
                -0.015625 to "-0.01562",
                0.046875 to "0.04688",
                179.999995 to "180.00000",
                -0.0000049 to "-0.00000",
                -0.0 to "-0.00000",
            )) {
                assertEquals("$value", text, ScooterAPI.fiveDecimals(value))
            }
        } finally {
            Locale.setDefault(defaultLocale)
        }
    }

    @Test
    fun theSiteIsAskedForJSONAtItsOwnAddresses() = runBlocking<Unit> {
        makeAPI(responseStatus = 200, data = emptyResponseData).scooters(bounds = bounds, zoom = 16, minimumBattery = 0)
        server.enqueue(answer(200, """{"zones":[]}"""))
        ScooterAPI(baseURL = server.url("/"), client = client).zonesIn(area = ScooterZoneArea(covering = bounds)!!)
        server.enqueue(answer(200, "[]"))
        AddressSearchAPI(baseURL = server.url("/"), client = client, homeCountry = null).search(query = "Zürich", language = "en", near = null)

        val scooters = server.takeRequest()
        assertEquals("GET", scooters.method)
        assertEquals("/api/scooters", scooters.url.encodedPath)
        assertEquals("application/json", scooters.headers["Accept"])
        val zones = server.takeRequest()
        assertEquals("GET", zones.method)
        assertEquals("/api/zones", zones.url.encodedPath)
        assertEquals(ScooterZoneArea(covering = bounds)!!.queryItems, zones.url.queryParameterNames.map { it to zones.url.queryParameter(it) })
        assertEquals("application/json", zones.headers["Accept"])
        val search = server.takeRequest()
        assertEquals("/api/geocode", search.url.encodedPath)
        assertEquals("application/json", search.headers["Accept"])
    }

    // AddressSearchAPITests

    @Test
    fun swissGeocoderResponseIsDecodedAndRequestIsLocalized() = runBlocking<Unit> {
        val data = """[{"lat":47.3762772,"lng":8.5280816,"display_name":"114, Ankerstrasse, Zurich, Switzerland"}]"""
        server.enqueue(answer(200, data))
        val api = AddressSearchAPI(baseURL = server.url("/"), client = client, homeCountry = null)

        val results = api.search(query = "Ankerstrasse 114", language = "de", near = null)

        assertEquals(
            listOf(
                AddressSearchResult(
                    latitude = 47.3762772,
                    longitude = 8.5280816,
                    displayName = "114, Ankerstrasse, Zurich, Switzerland",
                ),
            ),
            results,
        )

        val request = server.takeRequest()
        assertEquals("/api/geocode", request.url.encodedPath)
        assertNull(request.url.query)
        assertEquals("POST", request.method)
        assertNull(api.http.cache)
        assertEquals("application/json", request.headers["Content-Type"])
        val json = Json.parseToJsonElement(request.body!!.utf8()) as JsonObject
        assertEquals(mapOf("q" to JsonPrimitive("Ankerstrasse 114"), "lang" to JsonPrimitive("de")), json)
    }

    @Test
    fun theMapCentreIsSentWhenThereIsOne() = runBlocking<Unit> {
        server.enqueue(answer(200, "[]"))
        val api = AddressSearchAPI(baseURL = server.url("/"), client = client, homeCountry = "FR")

        api.search(query = "Rue de Rivoli 10", language = "fr", near = GeoPoint(latitude = 48.86, longitude = 2.35))

        val request = server.takeRequest()
        val json = Json.parseToJsonElement(request.body!!.utf8()) as JsonObject
        assertEquals(JsonPrimitive("Rue de Rivoli 10"), json["q"])
        assertEquals(JsonPrimitive("fr"), json["lang"])
        assertEquals(listOf(48.86, 2.35), (json["near"] as? JsonArray)?.map { (it as JsonPrimitive).doubleOrNull })
        // The centre says more than the time zone's country, which then stays on the iPhone.
        assertNull(json["country"])
    }

    @Test
    fun theTimeZoneCountryIsSentWithoutACentre() = runBlocking<Unit> {
        server.enqueue(answer(200, "[]"))
        val api = AddressSearchAPI(baseURL = server.url("/"), client = client, homeCountry = "US")

        api.search(query = "Congress Ave", language = "en", near = null)

        val request = server.takeRequest()
        val json = Json.parseToJsonElement(request.body!!.utf8()) as JsonObject
        assertEquals(mapOf("q" to JsonPrimitive("Congress Ave"), "lang" to JsonPrimitive("en"), "country" to JsonPrimitive("US")), json)
        assertEquals("US", ScooterStartPlace.country(forTimeZone = "America/Chicago"))
        assertEquals("CA", ScooterStartPlace.country(forTimeZone = "America/Montreal"))
        assertNull(ScooterStartPlace.country(forTimeZone = "UTC"))
    }

    @Test
    fun tooManySearchesAreToldApartFromOtherFailures() = runBlocking<Unit> {
        val expectations: List<Triple<Int, Map<String, String>, AddressSearchAPIError>> = listOf(
            Triple(429, mapOf("Retry-After" to "60"), AddressSearchAPIError.RateLimited(retryAfter = 60.seconds)),
            Triple(429, emptyMap(), AddressSearchAPIError.RateLimited(retryAfter = null)),
            Triple(429, mapOf("Retry-After" to "Wed, 21 Oct 2026 07:28:00 GMT"), AddressSearchAPIError.RateLimited(retryAfter = null)),
            // Swift traps on a wait too long to count; here there is no wait.
            Triple(429, mapOf("Retry-After" to "1e400"), AddressSearchAPIError.RateLimited(retryAfter = null)),
            Triple(503, mapOf("Retry-After" to "30"), AddressSearchAPIError.InvalidResponse()),
        )
        for ((statusCode, headers, expected) in expectations) {
            server.enqueue(answer(statusCode, "", headers))
            val api = AddressSearchAPI(baseURL = server.url("/"), client = client)
            val error = failure { api.search(query = "Bahnhofstrasse", language = "de", near = null) }
            if (error == null) fail("Expected an error for $statusCode")
            assertEquals("$statusCode $headers", expected, error)
        }
    }

    @Test
    fun titleSubtitleAndCoverageAreDecodedWhenTheAPISendsThem() {
        val data = """
        [
          {"lat": 47.3695, "lng": 8.5389, "display_name": "Paradeplatz 2 8001 Zürich",
           "title": "Paradeplatz 2", "subtitle": "8001 Zürich", "covered": true},
          {"lat": 46.7741, "lng": 8.1558, "display_name": "Paradeplatz (OW) - Lungern",
           "title": "Paradeplatz", "subtitle": "Lungern OW", "covered": false},
          {"lat": 47.3782, "lng": 8.5402, "display_name": "Zürich HB",
           "title": "Zürich HB", "subtitle": "", "covered": true}
        ]
        """

        val results = ScooterAPIJson.decodeFromString(ListSerializer(AddressSearchResult.serializer()), data)

        assertEquals(listOf("Paradeplatz 2", "Paradeplatz", "Zürich HB"), results.map { it.title })
        assertEquals(listOf("8001 Zürich", "Lungern OW", ""), results.map { it.subtitle })
        assertEquals(listOf(true, false, true), results.map { it.isCovered })
        assertEquals("Paradeplatz (OW) - Lungern", results[1].displayName)
        assertEquals(
            MapDestination(
                title = "Paradeplatz",
                subtitle = "Lungern OW",
                point = GeoPoint(latitude = 46.7741, longitude = 8.1558),
                isCovered = false,
            ),
            results[1].destination,
        )
        // A chosen place keeps the search's answer about scooter data.
        assertEquals(listOf(true, false, true), results.map { it.destination.isCovered })
        assertEquals(3, results.map { it.id }.toSet().size)
    }

    @Test
    fun olderResponsesFallBackToLabelSplittingAndBundledCoverage() {
        val data = """
        [
          {"lat": 47.3695, "lng": 8.5389, "display_name": "Paradeplatz 2 8001 Zürich"},
          {"lat": 30.0, "lng": -40.0, "display_name": "Atlantic", "title": "", "covered": null},
          {"lat": 47.3762772, "lng": 8.5280816, "display_name": "114, Ankerstrasse, Zurich, Switzerland",
           "title": 12, "subtitle": "ignored without a title"}
        ]
        """

        val results = ScooterAPIJson.decodeFromString(ListSerializer(AddressSearchResult.serializer()), data)

        assertEquals(listOf("Paradeplatz 2", "Atlantic", "Ankerstrasse 114"), results.map { it.title })
        assertEquals(listOf("8001 Zürich", "", "Zurich, Switzerland"), results.map { it.subtitle })
        // Without `covered`, the service areas bundled with the app decide: Zürich's, which Switzerland's open data has
        // had from the start and data/ will not drop, and none in the middle of the Atlantic (LOG-370).
        assertEquals(listOf(true, false, true), results.map { it.isCovered })

        val examples = listOf(
            Triple("Bahnhofstrasse 1 8001 Zürich", "Bahnhofstrasse 1", "8001 Zürich"),
            Triple("Rue du Rhône 10 1204 Genève", "Rue du Rhône 10", "1204 Genève"),
            Triple("Via Nassa 5, 6900 Lugano", "Via Nassa 5", "6900 Lugano"),
            Triple("114, Ankerstrasse, Zurich, Switzerland", "Ankerstrasse 114", "Zurich, Switzerland"),
            Triple("Zürich HB", "Zürich HB", ""),
            Triple("8001 Zürich", "8001 Zürich", ""),
            Triple("  Bahnhofstrasse 1, CH-8001 Zürich  ", "Bahnhofstrasse 1", "CH-8001 Zürich"),
        )
        for ((label, title, subtitle) in examples) {
            val lines = AddressSearchResult.lines(fromDisplayName = label)
            assertEquals(label, title, lines.title)
            assertEquals(label, subtitle, lines.subtitle)

            // A search result without its own title shows the same two lines.
            val result = AddressSearchResult(latitude = 47.3769, longitude = 8.5417, displayName = label)
            assertEquals(label, title, result.title)
            assertEquals(label, subtitle, result.subtitle)
        }
    }

    // ScooterAnalyticsTests

    @Test
    fun payloadExcludesSensitiveValuesAndPersistentIdentity() {
        val payload = ScooterAnalytics.payload(
            "rental_open", provider = "lime", value = 10,
            result = "47.123,8.456", target = "private address", screen = "/?lat=47.123", website = testWebsite,
        )
        assertEquals("/", payload.string("url"))
        assertEquals("", payload.string("referrer"))
        assertEquals("android", payload.string("tag"))
        assertNull(payload["id"])
        val data = payload["data"] as? JsonObject
        assertEquals("lime", data.string("provider"))
        assertEquals("android", data.string("platform"))
        assertNull(data?.get("result"))
        assertNull(data?.get("target"))
    }

    @Test
    fun aPayloadSaysTheSiteTheAppAndTheLanguageShownInTheRegionOfThePhone() {
        ScooterLanguage.launchLocale = { Locale.forLanguageTag("de-CH") }
        ScooterLanguage.current = ScooterLanguage.Fr
        val payload = ScooterAnalytics.payload("refresh", website = testWebsite)
        assertEquals("scootradar.com", payload.string("hostname"))
        assertEquals("ScootRadar", payload.string("title"))
        assertEquals("/", payload.string("url"))
        // The locale's identifier, where a search sends only the language (AddressSearchModelTest).
        assertEquals("fr-CH", payload.string("language"))
    }

    @Test
    fun aValueIsKeptUpToFortyCharactersAndACountAsANumber() {
        val forty = "a".repeat(40)
        val payload = ScooterAnalytics.payload(
            "provider_filter", provider = forty, result = "b".repeat(41), target = "vehicle", value = 7, website = testWebsite,
        )
        val data = payload["data"] as JsonObject
        assertEquals(forty, data.string("provider"))
        assertNull(data["result"])
        assertEquals("vehicle", data.string("target"))
        val value = data["value"] as JsonPrimitive
        assertFalse(value.isString)
        assertEquals(7, value.content.toInt())
        assertEquals("provider_filter", payload.string("name"))
    }

    @Test
    fun atMostThirtyEventsWaitAndAFailedOneIsNotSentAgain() = runTest {
        // Held on the test's dispatcher until it runs: the 31st and later are dropped.
        val held = RecordingAnalytics(answer = { index -> if (index == 0) throw IOException("offline") else 503 to "" }, scope = backgroundScope)
        for (index in 1..35) held.analytics.track("event_$index")
        runCurrent()
        assertEquals((1..30).map { "event_$it" }, held.names)

        // What failed is not sent again, nor kept for later.
        held.analytics.track("later")
        runCurrent()
        assertEquals((1..30).map { "event_$it" } + "later", held.names)
    }

    @Test
    fun onlyAWholeAnswerChangesTheCacheSentBack() {
        val answers = listOf(
            200 to """{"cache":"first"}""",
            500 to """{"cache":"refused","disabled":true}""",
            200 to "not JSON",
            200 to "{}",
            200 to "{}",
        )
        val recording = RecordingAnalytics(answer = { answers[it] })
        repeat(answers.size) { recording.analytics.track("refresh") }

        assertEquals(5, recording.requests.size)
        // A refusal or an answer that is not JSON changes nothing; a whole answer without a cache clears it.
        assertEquals(listOf(null, "first", "first", "first", null), recording.requests.map { it.header("x-umami-cache") })
    }

    @Test
    fun screenViewDoesNotBecomeNamedEvent() {
        val payload = ScooterAnalytics.payload(null, screen = "/settings", website = testWebsite)
        assertEquals("/settings", payload.string("url"))
        assertNull(payload["name"])
        assertNull(payload["data"])
    }

    @Test
    fun userAgentIsAWebViewsWithoutTheAppsName() {
        val userAgent = ScooterAnalytics.userAgent(androidVersion = "16", chromeMajor = 141)
        assertEquals("Mozilla/5.0 (Linux; Android 16; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36", userAgent)
        assertFalse(userAgent.contains("radar", ignoreCase = true))
    }

    @Test
    fun payloadGoesToTheAppsOwnWebsite() {
        // "ScootRadar Android", apart from the iPhone's "ScootRadar iOS" and the website's "ScootRadar" (docs/analytics.md).
        assertEquals("2bba24f8-8180-4616-ae0e-4bc528957c85", ScooterAnalytics.website)
        assertEquals(testWebsite, ScooterAnalytics.payload(null, website = testWebsite).string("website"))
    }

    @Test
    fun nothingIsSentWithoutAWebsiteInABuildThatDoesNotSendOrWhenTurnedOff() = runBlocking<Unit> {
        var requests = 0
        val refusing = OkHttpClient.Builder().addInterceptor {
            requests += 1
            throw IOException("Nothing may be sent")
        }.build()
        val turnedOff = InMemoryScooterDefaults().apply { set(true, forKey = ScooterAnalytics.disabledKey) }
        val job = SupervisorJob()
        for (analytics in listOf(
            makeAnalytics(website = null, sends = true, client = refusing, job = job),
            makeAnalytics(website = testWebsite, sends = false, client = refusing, job = job),
            makeAnalytics(website = testWebsite, sends = true, defaults = turnedOff, client = refusing, job = job),
        )) {
            analytics.track()
            analytics.track("rental_open", provider = "lime")
        }
        job.children.toList().joinAll()
        assertEquals(0, requests)
    }

    @Test
    fun eventsGoOneAfterAnotherWithTheServersCacheUntilItSaysStop() = runBlocking<Unit> {
        server.enqueue(answer(200, """{"cache":"first-cache"}"""))
        server.enqueue(answer(200, """{"cache":"second-cache","disabled":1}"""))
        val job = SupervisorJob()
        val analytics = makeAnalytics(website = testWebsite, sends = true, client = client, job = job)

        analytics.track()
        analytics.track("rental_open", provider = "lime", value = 3)
        analytics.track("filters_apply")
        job.children.toList().joinAll()

        assertEquals(2, server.requestCount)
        val first = server.takeRequest()
        assertEquals("POST", first.method)
        assertEquals("/api/send", first.url.encodedPath)
        assertEquals("application/json", first.headers["Content-Type"])
        assertEquals(userAgent, first.headers["User-Agent"])
        assertNull(first.headers["x-umami-cache"])
        assertNull(first.headers["Cookie"])
        val event = Json.parseToJsonElement(first.body!!.utf8()) as JsonObject
        assertEquals("event", event.string("type"))
        assertEquals(ScooterAnalytics.payload(null, website = testWebsite), event["payload"])
        val second = server.takeRequest()
        assertEquals("first-cache", second.headers["x-umami-cache"])
        val payload = (Json.parseToJsonElement(second.body!!.utf8()) as JsonObject)["payload"] as JsonObject
        assertEquals("rental_open", payload.string("name"))
    }

    @Test
    fun eventsGoToTheCollectorAndWaitFiveSecondsAtMostInAll() = runBlocking<Unit> {
        val asked = mutableListOf<String>()
        val waits = mutableListOf<List<Long>>()
        val job = SupervisorJob()
        val analytics = ScooterAnalytics(
            website = testWebsite,
            sends = true,
            userAgent = userAgent,
            defaults = InMemoryScooterDefaults(),
            scope = CoroutineScope(job + Dispatchers.IO),
            client = answeringClient(asked, waits),
        )

        analytics.track("refresh")
        job.children.toList().joinAll()

        assertEquals(listOf("POST https://u.plhery.com/api/send"), asked)
        // Five seconds to connect, between bytes, and for the whole event.
        assertEquals(listOf(listOf(5_000L, 5_000L, 5_000L, 5_000L)), waits)
    }

    @Test
    fun aCacheTheServerSendsThatCannotBeAHeaderIsLeftOutNotTheEvent() = runBlocking<Unit> {
        server.enqueue(answer(200, """{"cache":"first\nline"}"""))
        server.enqueue(answer(200, "{}"))
        val job = SupervisorJob()
        val analytics = makeAnalytics(website = testWebsite, sends = true, client = client, job = job)

        analytics.track()
        analytics.track("filters_apply")
        job.children.toList().joinAll()

        assertEquals(2, server.requestCount)
        server.takeRequest()
        assertNull(server.takeRequest().headers["x-umami-cache"])
    }

    private val client = OkHttpClient()
    private val testWebsite = "test-website"
    private val userAgent = ScooterAnalytics.userAgent(androidVersion = "16", chromeMajor = 141)

    private val origin: GeoPoint
        get() = GeoPoint(latitude = 47.3769, longitude = 8.5417)

    private val bounds: GeoBounds
        get() = GeoBounds(region = MapRegion.around(center = origin, latitudinalMeters = 1_000.0, longitudinalMeters = 1_000.0))

    private val emptyResponseData: String
        get() = """{"vehicles":[],"clusters":[],"providers":{},"meta":{"partial":false,"stale":false,"failedSources":[],"sources":{"national":"fresh","hopp":"fresh"},"generatedAt":"2026-08-05T12:00:00.000Z","truncated":false,"totalVehicles":0,"mode":"vehicles","zoom":null}}"""

    private fun answer(statusCode: Int, data: String, headers: Map<String, String> = emptyMap()): MockResponse =
        MockResponse.Builder().code(statusCode).apply {
            for ((name, value) in mapOf("Content-Type" to "application/json") + headers) addHeader(name, value)
        }.body(data).build()

    /** The API, with the server's next answer. */
    private fun makeAPI(responseStatus: Int, data: String = "", headers: Map<String, String> = emptyMap()): ScooterAPI {
        server.enqueue(answer(responseStatus, data, headers))
        return ScooterAPI(baseURL = server.url("/"), client = client)
    }

    /** The API, with a request that never leaves the phone and fails as it is told. */
    private fun makeAPI(failure: IOException, offline: Boolean = false): ScooterAPI = ScooterAPI(
        baseURL = server.url("/"),
        client = OkHttpClient.Builder().addInterceptor { throw failure }.build(),
        isOffline = { offline },
    )

    /**
     * Answers every request at once with a 503, so nothing leaves the test, and notes where each went and the
     * client's waits in milliseconds: to connect, to read, to write, and for the whole call (0 for none).
     */
    private fun answeringClient(asked: MutableList<String>, waits: MutableList<List<Long>>): OkHttpClient =
        OkHttpClient.Builder().addInterceptor { chain ->
            val request = chain.request()
            synchronized(asked) {
                asked += "${request.method} ${request.url.newBuilder().query(null).build()}"
                waits += listOf(
                    chain.connectTimeoutMillis().toLong(),
                    chain.readTimeoutMillis().toLong(),
                    chain.writeTimeoutMillis().toLong(),
                    TimeUnit.NANOSECONDS.toMillis(chain.call().timeout().timeoutNanos()),
                )
            }
            Response.Builder().request(request).protocol(Protocol.HTTP_1_1).code(503).message("").body("".toResponseBody()).build()
        }.build()

    private fun makeAnalytics(
        website: String?,
        sends: Boolean,
        client: OkHttpClient,
        job: kotlinx.coroutines.Job,
        defaults: InMemoryScooterDefaults = InMemoryScooterDefaults(),
    ): ScooterAnalytics = ScooterAnalytics(
        website = website,
        sends = sends,
        userAgent = userAgent,
        defaults = defaults,
        scope = CoroutineScope(job + Dispatchers.IO),
        endpoint = server.url("/api/send"),
        client = client,
    )

    private suspend fun failure(block: suspend () -> Any?): Throwable? = try {
        block()
        null
    } catch (error: Exception) {
        error
    }

    private fun JsonObject?.string(key: String): String? = (this?.get(key) as? JsonPrimitive)?.takeIf { it.isString }?.content
}
