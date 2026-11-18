package com.plhery.scootradar.core.api

import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterZoneArea
import java.io.IOException
import java.time.Duration
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Base64
import java.util.Collections
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.joinAll
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import mockwebserver3.Dispatcher
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import mockwebserver3.RecordedRequest
import okhttp3.OkHttpClient
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * The server's pass for the genuine app (ScooterPasses; the play build's StorePass asks Play Integrity for the token):
 * asked for in the background when an answer for scooters says the server saw none, once in 10 minutes at most and one
 * at a time, sent with the requests for scooters alone while it lasts, and never in the way of the scooters, whatever
 * fails. The server is the contract the Worker answers: a challenge, then the pass for Play's token of it.
 */
class ScooterPassesTest {
    private val server = MockWebServer()
    private val requests: MutableList<RecordedRequest> = Collections.synchronizedList(mutableListOf())

    /** What escaped an ask, which in the app's scope would end the app. */
    private val escaped: MutableList<Throwable> = Collections.synchronizedList(mutableListOf())
    private val job = SupervisorJob()
    private val scope = CoroutineScope(job + Dispatchers.IO + CoroutineExceptionHandler { _, error -> escaped += error })

    @Volatile private var clock = Instant.parse("2026-11-18T12:00:00Z")
    private val store = InMemoryScooterDefaults()
    private val nonces: MutableList<String> = Collections.synchronizedList(mutableListOf())
    @Volatile private var integrity: suspend (String) -> String = { nonce -> nonces += nonce; "play-token" }

    // How the server answers.
    @Volatile private var saysNone = true
    @Volatile private var scootersStatus = 200
    @Volatile private var challengeStatus = 200
    @Volatile private var passStatus = 200
    @Volatile private var passValue: (Int) -> String = { "pass-$it.signature_-" }
    @Volatile private var passDate: String? = null
    private val challenges = AtomicInteger()
    private val passes = AtomicInteger()

    @Before
    fun setUp() {
        server.dispatcher = object : Dispatcher() {
            override fun dispatch(request: RecordedRequest): MockResponse {
                requests += request
                return when (request.url.encodedPath) {
                    "/api/scooters" -> json(scootersStatus, emptyScooters, if (saysNone) mapOf("X-Scooter-Pass" to "none") else emptyMap())
                    "/api/pass/challenge" ->
                        json(challengeStatus, """{"challenge":"${challenge(challenges.incrementAndGet())}"}""", mapOf("Retry-After" to "60"))
                    "/api/pass" -> {
                        val number = passes.incrementAndGet()
                        val expiresAt = clock.plus(Duration.ofDays(1)).epochSecond
                        val body = buildJsonObject {
                            put("pass", JsonPrimitive(passValue(number)))
                            put("expiresAt", JsonPrimitive(expiresAt))
                        }.toString()
                        json(passStatus, body, passDate?.let { mapOf("Date" to it) } ?: emptyMap())
                    }
                    "/api/zones" -> json(200, """{"zones":[],"pending":false}""")
                    else -> json(404, "")
                }
            }
        }
        server.start()
    }

    @After
    fun tearDown() {
        job.cancel()
        server.close()
    }

    @Test
    fun anAnswerSayingTheServerSawNoPassAsksForOneOnceInTenMinutes() = runBlocking<Unit> {
        val api = makeAPI()
        api.scooters(bounds = bounds, zoom = 16)
        settle()
        assertEquals(listOf("GET /api/scooters", "GET /api/pass/challenge", "POST /api/pass"), asked())
        assertNull(requests[0].headers["X-Scooter-Pass"])
        assertEquals("android", requests[1].url.queryParameter("platform"))

        // Play was given the challenge, unchanged, as its nonce, and the server Play's token for it.
        assertEquals(listOf(challenge(1)), nonces)
        val post = requests[2]
        assertEquals("application/json", post.headers["Content-Type"])
        assertEquals(
            Json.parseToJsonElement("""{"platform":"android","challenge":"${challenge(1)}","integrityToken":"play-token"}"""),
            Json.parseToJsonElement(checkNotNull(post.body).utf8()),
        )

        // The next request carries the pass. The server still saw none, on another network say: not asked again yet.
        requests.clear()
        api.scooters(bounds = bounds, zoom = 16)
        clock += Duration.ofMinutes(9).plusSeconds(59)
        api.scooters(bounds = bounds, zoom = 16)
        settle()
        assertEquals(listOf("GET /api/scooters", "GET /api/scooters"), asked())
        assertEquals(listOf("pass-1.signature_-", "pass-1.signature_-"), requests.map { it.headers["X-Scooter-Pass"] })

        // Ten minutes after the last ask began, an answer saying none asks again, and the new pass replaces the old.
        requests.clear()
        clock += Duration.ofSeconds(1)
        api.scooters(bounds = bounds, zoom = 16)
        settle()
        api.scooters(bounds = bounds, zoom = 16)
        assertEquals(listOf("GET /api/scooters", "GET /api/pass/challenge", "POST /api/pass", "GET /api/scooters"), asked())
        assertEquals("pass-2.signature_-", requests[3].headers["X-Scooter-Pass"])
        assertEquals(listOf(challenge(1), challenge(2)), nonces)
        assertTrue(escaped.isEmpty())
    }

    @Test
    fun oneAskAtATime() = runBlocking<Unit> {
        val play = CompletableDeferred<String>()
        integrity = { nonce -> nonces += nonce; play.await() }
        val api = makeAPI()
        api.scooters(bounds = bounds, zoom = 16)
        // Play has not answered 10 minutes on: the ask under way is the only one.
        clock += Duration.ofMinutes(11)
        api.scooters(bounds = bounds, zoom = 16)
        play.complete("play-token")
        settle()
        assertEquals(1, asked().count { it == "GET /api/pass/challenge" })
        assertEquals(1, asked().count { it == "POST /api/pass" })
        assertEquals("pass-1.signature_-", store.string(ScooterPasses.PASS))
    }

    @Test
    fun aHeldPassGoesWithTheRequestsForScootersAloneUntilItEnds() = runBlocking<Unit> {
        saysNone = false
        store.set("held.signature", ScooterPasses.PASS)
        store.set(clock + Duration.ofHours(1), ScooterPasses.EXPIRES_AT)
        val api = makeAPI()
        api.scooters(bounds = bounds, zoom = 16)
        runCatching { api.zonesIn(checkNotNull(ScooterZoneArea(covering = bounds))) }
        runCatching { api.cityZoneFile("index.json") }
        assertEquals(listOf("held.signature", null, null), requests.map { it.headers["X-Scooter-Pass"] })

        // Ended: not sent, and dropped.
        requests.clear()
        clock += Duration.ofHours(1)
        api.scooters(bounds = bounds, zoom = 16)
        assertNull(requests.single().headers["X-Scooter-Pass"])
        assertNull(store.string(ScooterPasses.PASS))
        assertNull(store.date(ScooterPasses.EXPIRES_AT))
    }

    /** Relaunched on the same network, the app has its pass, and an ask a moment ago still counts. */
    @Test
    fun thePassAndTheLastAskOutliveTheApp() = runBlocking<Unit> {
        makeAPI().scooters(bounds = bounds, zoom = 16)
        settle()
        requests.clear()

        clock += Duration.ofMinutes(5)
        val relaunched = makeAPI()
        relaunched.scooters(bounds = bounds, zoom = 16)
        settle()
        assertEquals(listOf("GET /api/scooters"), asked())
        assertEquals("pass-1.signature_-", requests.single().headers["X-Scooter-Pass"])
    }

    /**
     * Play fails (no Play Store, a build it doesn't know), the server refuses or is busy, the network fails, or the pass
     * could not go in a header: the scooters load as ever, nothing escapes, and the app stays without a pass.
     */
    @Test
    fun aFailingAskNeverFailsTheScooters() = runBlocking<Unit> {
        val failures = listOf<Pair<String, () -> Unit>>(
            "Play's error" to { integrity = { throw IllegalStateException("Play Store app is not installed") } },
            "a refused token" to { passStatus = 403 },
            "the server limiting asks" to { challengeStatus = 429 },
            "the server unavailable" to { passStatus = 503 },
            "a pass no header may carry" to { passValue = { "pass $it\n" } },
            "a pass that isn't one" to { passValue = { "" } },
        )
        for ((name, fail) in failures) {
            fail()
            clock += ScooterPasses.INTERVAL
            val api = makeAPI()
            val response = api.scooters(bounds = bounds, zoom = 16)
            assertTrue(name, response.vehicles.isEmpty())
            settle()
            api.scooters(bounds = bounds, zoom = 16)
            assertNull(name, requests.last().headers["X-Scooter-Pass"])
            assertNull(name, store.string(ScooterPasses.PASS))
            integrity = { "play-token" }
            challengeStatus = 200
            passStatus = 200
            passValue = { "pass-$it" }
        }

        // The network failing on the way to the pass, but not to the scooters.
        clock += ScooterPasses.INTERVAL
        val offline = OkHttpClient.Builder().addInterceptor { chain ->
            if (chain.request().url.encodedPath.startsWith("/api/pass")) throw IOException("no network")
            chain.proceed(chain.request())
        }.build()
        val api = makeAPI(offline)
        api.scooters(bounds = bounds, zoom = 16)
        settle()
        api.scooters(bounds = bounds, zoom = 16)
        assertNull(requests.last().headers["X-Scooter-Pass"])
        assertNull(store.string(ScooterPasses.PASS))
        assertTrue(escaped.toString(), escaped.isEmpty())
    }

    /** An answer saying none asks whatever its status, as an answer refused for want of a pass may one day. */
    @Test
    fun anErrorSayingNoneAsksToo() = runBlocking<Unit> {
        scootersStatus = 429
        val api = makeAPI()
        val error = runCatching { api.scooters(bounds = bounds, zoom = 16) }.exceptionOrNull()
        assertEquals(ScooterLoadFailure.Busy, ScooterLoadFailure(checkNotNull(error)))
        settle()
        assertEquals("pass-1.signature_-", store.string(ScooterPasses.PASS))
    }

    /** The fdroid build's API has no source: no pass is sent, and an answer saying none asks for nothing. */
    @Test
    fun withoutASourceNothingIsAsked() = runBlocking<Unit> {
        val api = ScooterAPI(baseURL = server.url("/"), client = OkHttpClient())
        api.scooters(bounds = bounds, zoom = 16)
        settle()
        assertEquals(listOf("GET /api/scooters"), asked())
        assertNull(requests.single().headers["X-Scooter-Pass"])
    }

    /**
     * The pass ends by the server's clock, read with this device's: a phone an hour behind the server's Date drops it
     * as its own clock reads an hour before the expiry given, so that a wrong clock neither drops it early, to ask again
     * and again, nor sends it once ended.
     */
    @Test
    fun thePassEndsByTheServersClock() = runBlocking<Unit> {
        passDate = DateTimeFormatter.RFC_1123_DATE_TIME.format(Instant.now().plusSeconds(3_600).atOffset(ZoneOffset.UTC))
        makeAPI().scooters(bounds = bounds, zoom = 16)
        settle()
        val expected = clock + Duration.ofDays(1) - Duration.ofHours(1)
        val expiresAt = checkNotNull(store.date(ScooterPasses.EXPIRES_AT))
        assertTrue("$expiresAt", Duration.between(expected, expiresAt).abs() < Duration.ofSeconds(5))
    }

    private fun makeAPI(client: OkHttpClient = OkHttpClient()): ScooterAPI = ScooterAPI(
        baseURL = server.url("/"),
        client = client,
        pass = ScooterPasses(integrityToken = { integrity(it) }, store = store, scope = scope, now = { clock }),
    )

    /** Waits for the asks under way. */
    private suspend fun settle() = job.children.toList().joinAll()

    private fun asked(): List<String> = synchronized(requests) { requests.map { "${it.method} ${it.url.encodedPath}" } }

    /** The server's nth challenge: 48 random bytes, as URL-safe base64 without padding. */
    private fun challenge(number: Int): String =
        Base64.getUrlEncoder().withoutPadding().encodeToString(ByteArray(48) { (it * 7 + number).toByte() })

    private fun json(status: Int, body: String, headers: Map<String, String> = emptyMap()): MockResponse =
        MockResponse.Builder().code(status).apply {
            for ((name, value) in mapOf("Content-Type" to "application/json") + headers) addHeader(name, value)
        }.body(body).build()

    private val bounds = GeoBounds(south = 47.36, west = 8.5, north = 47.4, east = 8.6)

    private val emptyScooters =
        """{"vehicles":[],"clusters":[],"providers":{},"meta":{"partial":false,"stale":false,"failedSources":[],"sources":{},"generatedAt":"2026-11-18T12:00:00.000Z","truncated":false,"totalVehicles":0,"mode":"vehicles","zoom":null}}"""
}
