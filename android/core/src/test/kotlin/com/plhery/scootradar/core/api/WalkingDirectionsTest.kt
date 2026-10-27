package com.plhery.scootradar.core.api

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterCityCatalog
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.WalkRoute
import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

// The tests of fetchWalkRoute in src/lib/walkRoute.test.ts and of walkingDirectionsUrl in src/lib/walking.test.ts.

class WalkingDirectionsTest {
    private val server = MockWebServer()
    private val client = OkHttpClient()
    private val from = GeoPoint(latitude = 47.3779, longitude = 8.5403)
    private val to = GeoPoint(latitude = 47.3769, longitude = 8.5417)

    @Before
    fun startTheServer() {
        server.start()
    }

    @After
    fun closeTheServer() {
        server.close()
    }

    @Test
    fun asksThisSiteForTheWayInTheBodyOfARequestNothingCaches() = runBlocking<Unit> {
        server.enqueue(answer("""{"path":[[47.3779,8.5403],[47.3769,8.5417]],"distanceM":180}"""))

        assertEquals(listOf(from, to), directions().walkingPath(from = from, to = to))

        assertEquals(1, server.requestCount)
        val request = server.takeRequest()
        assertEquals("/api/walk", request.url.encodedPath)
        assertEquals("POST", request.method)
        assertEquals("application/json", request.headers["Content-Type"])
        assertEquals(
            Json.parseToJsonElement("""{"from":[47.3779,8.5403],"to":[47.3769,8.5417]}"""),
            Json.parseToJsonElement(request.body!!.utf8()),
        )
    }

    @Test
    fun saysWhyWhenTheServerAnswersWithAFailure() = runBlocking<Unit> {
        for ((status, body, reason) in listOf(
            Triple(422, """{"reason":"no_route"}""", WalkingDirectionsError.Reason.NoRoute),
            Triple(422, """{"reason":"too_far"}""", WalkingDirectionsError.Reason.TooFar),
            Triple(429, "", WalkingDirectionsError.Reason.Busy),
            Triple(503, """{"error":"Walking routes are busy."}""", WalkingDirectionsError.Reason.Busy),
            Triple(503, """{"reason":"busy"}""", WalkingDirectionsError.Reason.Busy),
            Triple(500, "", WalkingDirectionsError.Reason.Failed),
            Triple(502, """{"reason":"failed"}""", WalkingDirectionsError.Reason.Failed),
            Triple(400, """{"reason":"invalid"}""", WalkingDirectionsError.Reason.Failed),
        )) {
            server.enqueue(answer(body, status))

            val error = failure { directions().walkingPath(from = from, to = to) }

            assertEquals("$status $body", WalkingDirectionsError(reason), error)
        }
    }

    @Test
    fun failsOnASuccessWithSomethingElseInIt() = runBlocking<Unit> {
        for ((label, body) in listOf(
            "text" to "Bad gateway",
            "nothing" to "null",
            "a path that is not a list" to """{"path":"Zürich HB","distanceM":180}""",
            "a point without a longitude" to """{"path":[[47.3779]],"distanceM":180}""",
            "a point in text" to """{"path":[[47.3779,"8.5403"]],"distanceM":180}""",
            "a point with a height" to """{"path":[[47.3779,8.5403,408]],"distanceM":180}""",
            "no distance" to """{"path":[[47.3779,8.5403],[47.3769,8.5417]]}""",
            "a distance in text" to """{"path":[[47.3779,8.5403],[47.3769,8.5417]],"distanceM":"180"}""",
        )) {
            server.enqueue(answer(body))

            val error = failure { directions().walkingPath(from = from, to = to) }

            assertEquals(label, WalkingDirectionsError(WalkingDirectionsError.Reason.Failed), error)
        }
    }

    @Test
    fun aRouteWithoutPointsIsNone() = runBlocking<Unit> {
        server.enqueue(answer("""{"path":[],"distanceM":0}"""))

        val error = failure { directions().walkingPath(from = from, to = to) }

        assertEquals(WalkingDirectionsError(WalkingDirectionsError.Reason.NoRoute), error)
    }

    @Test
    fun failsWhenTheNetworkDoes() = runBlocking<Unit> {
        val offline = OkHttpClient.Builder().addInterceptor { throw IOException("Failed to fetch") }.build()

        val error = failure { ScootRadarWalkingDirections(baseURL = server.url("/"), client = offline).walkingPath(from = from, to = to) }

        assertEquals(WalkingDirectionsError(WalkingDirectionsError.Reason.Failed), error)
    }

    @Test
    fun passesOnACancellationAsItIs() = runBlocking<Unit> {
        server.enqueue(MockResponse.Builder().headersDelay(10, TimeUnit.SECONDS).body("{}").build())
        var thrown: Throwable? = null

        val walk = launch(Dispatchers.IO) {
            try {
                directions().walkingPath(from = from, to = to)
            } catch (error: Throwable) {
                thrown = error
                throw error
            }
        }
        assertNotNull(server.takeRequest(5, TimeUnit.SECONDS))
        walk.cancelAndJoin()

        assertTrue("$thrown", thrown is CancellationException)
        assertFalse(thrown is WalkingDirectionsError)
    }

    @Test
    fun givesUpAsFailedAfterTwelveSeconds() = runBlocking<Unit> {
        assertEquals(12.seconds, ScootRadarWalkingDirections().timeout)
        // The same with a shorter wait.
        server.enqueue(MockResponse.Builder().headersDelay(10, TimeUnit.SECONDS).body("{}").build())
        val started = System.nanoTime()

        val error = failure {
            ScootRadarWalkingDirections(baseURL = server.url("/"), client = client, timeout = 300.milliseconds)
                .walkingPath(from = from, to = to)
        }

        val waited = (System.nanoTime() - started) / 1_000_000
        assertEquals(WalkingDirectionsError(WalkingDirectionsError.Reason.Failed), error)
        assertTrue("$waited ms", waited in 300..5_000)
    }

    @Test
    fun doesNotAskForAWayFurtherThanAWalk() = runBlocking<Unit> {
        server.enqueue(answer("""{"path":[],"distanceM":0}"""))
        val winterthur = GeoPoint(latitude = 47.4997, longitude = 8.7241)
        assertTrue(ScooterCityCatalog.distanceMeters(from, winterthur) > WalkRoute.longestWalk)

        val error = failure { directions().walkingPath(from = from, to = winterthur) }

        assertEquals(WalkingDirectionsError(WalkingDirectionsError.Reason.TooFar), error)
        assertEquals(0, server.requestCount)
    }

    @Test
    fun asksForAWalkToThePointAndSaysNothingAboutWhereItStarts() {
        val scooter = Scooter(
            provider = "lime", latitude = 45.75, longitude = 4.85, battery = 80,
            rangeMeters = null, vehicleID = "s1", deepLink = null, rentalURIs = null, distanceMeters = 0.0,
        )
        val url = ScooterWalkTarget.Scooter(scooter).mapsURL.toHttpUrl()
        assertEquals("https://www.google.com/maps/dir/", url.newBuilder().query(null).build().toString())
        assertEquals(
            mapOf("api" to "1", "destination" to "45.75,4.85", "travelmode" to "walking"),
            url.queryParameterNames.associateWith { url.queryParameter(it) },
        )

        val bay = ScooterParking(id = "dott:bay", provider = "dott", name = "", latitude = 47.0, longitude = -0.5, mandatory = false)
        assertEquals(
            "https://www.google.com/maps/dir/?api=1&destination=47%2C-0.5&travelmode=walking",
            ScooterWalkTarget.Parking(bay).mapsURL,
        )
    }

    private fun directions(): ScootRadarWalkingDirections = ScootRadarWalkingDirections(baseURL = server.url("/"), client = client)

    private fun answer(body: String, status: Int = 200): MockResponse = MockResponse.Builder().code(status).body(body).build()

    private suspend fun failure(block: suspend () -> Any?): Throwable? = try {
        block()
        null
    } catch (error: Exception) {
        error
    }
}
