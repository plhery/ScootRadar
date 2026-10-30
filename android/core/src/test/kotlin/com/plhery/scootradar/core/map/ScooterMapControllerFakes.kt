@file:OptIn(ExperimentalCoroutinesApi::class)

package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.api.ScooterAnalytics
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterRefreshPolicy
import com.plhery.scootradar.core.model.ScooterRentalURIs
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.addingTimeInterval
import java.time.Instant
import java.util.concurrent.AbstractExecutorService
import java.util.concurrent.TimeUnit
import kotlin.coroutines.CoroutineContext
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonObject
import okhttp3.Dispatcher
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue

// The stubs and helpers of ios/ScootRadarTests/ScooterMapModelTests.swift: its APIs, its clock, its location manager
// and the model it makes, which the walk's and the zones' tests share.

internal class StubScooterAPI(
    private var response: ScooterResponse,
    private val delaysFirstRequest: Boolean = false,
) : ScooterAPIClient {
    private var failure: ScooterAPIError? = null
    var calls = 0
        private set
    var cancellations = 0
        private set
    var lastZoom: Int? = null
        private set
    var lastMinimumBattery: Int? = null
        private set
    /** The area of each request, in order. */
    val askedBounds = mutableListOf<GeoBounds>()

    override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse {
        calls += 1
        askedBounds += bounds
        lastZoom = zoom
        lastMinimumBattery = minimumBattery
        if (delaysFirstRequest && calls == 1) {
            try {
                delay(30.seconds)
            } catch (error: CancellationException) {
                cancellations += 1
                throw error
            }
        }
        failure?.let { throw it }
        return response
    }

    fun setResponse(response: ScooterResponse) {
        this.response = response
    }

    fun setFailure(failure: ScooterAPIError?) {
        this.failure = failure
    }
}

internal class DelayedSecondAPI : ScooterAPIClient {
    private var calls = 0

    fun callCount(): Int = calls

    override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse {
        calls += 1
        val second = calls == 2
        if (second) delay(500.milliseconds)
        return ScooterResponse(
            vehicles = listOf(
                Scooter(
                    provider = "lime",
                    latitude = if (second) 45.75 else 47.377,
                    longitude = if (second) 4.85 else 8.542,
                    battery = 80,
                    vehicleID = if (second) "B" else "A",
                ),
            ),
        )
    }
}

internal class CancelledAPI : ScooterAPIClient {
    private var calls = 0

    fun callCount(): Int = calls

    override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse {
        calls += 1
        throw CancellationException()
    }
}

/** Holds a request until the test releases it, optionally with a failure. */
internal class HeldScooterAPI(private val response: ScooterResponse) : ScooterAPIClient {
    private var calls = 0
    private var holdsNextRequest = false
    private var held: CompletableDeferred<Unit>? = null
    private var heldFailure: ScooterAPIError? = null

    val isHolding: Boolean get() = held != null

    fun callCount(): Int = calls

    fun holdNextRequest() {
        holdsNextRequest = true
    }

    fun release(failing: ScooterAPIError? = null) {
        heldFailure = failing
        held?.complete(Unit)
        held = null
    }

    override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse {
        calls += 1
        if (holdsNextRequest) {
            holdsNextRequest = false
            val gate = CompletableDeferred<Unit>()
            held = gate
            gate.await()
            heldFailure?.let {
                heldFailure = null
                throw it
            }
        }
        return response
    }
}

/** A clock the test moves by hand: the waits of the test's scheduler do not move it. */
internal class TestClock {
    var now: Instant = Instant.ofEpochSecond(1_790_000_000)

    fun advance(seconds: Double) {
        now = now.addingTimeInterval(seconds)
    }
}

/**
 * The phone's location service, as a test has it: the permission a test sets, which it changes to answer the
 * prompt, and the fix kept from before, as at a relaunch. Nothing is located until the test calls the
 * controller back.
 */
internal class FakeLocationManager(
    var status: ScooterAuthorizationStatus = ScooterAuthorizationStatus.NotDetermined,
) : ScooterLocationManager {
    /** The fix the location service keeps from before, as at a relaunch. */
    var cachedLocation: ScooterLocationFix? = null

    var authorizationRequests = 0
        private set
    var locationStarts = 0
        private set
    var headingStarts = 0
        private set
    var headingStops = 0
        private set

    override val authorizationStatus: ScooterAuthorizationStatus get() = status
    override val location: ScooterLocationFix? get() = cachedLocation
    override var isHeadingAvailable: Boolean = false
    override var headingOrientation: ScooterDeviceOrientation = ScooterDeviceOrientation.Portrait

    /** kCLDistanceFilterNone until the controller sets its own. */
    override var distanceFilter: Double = -1.0

    override fun requestWhenInUseAuthorization() {
        authorizationRequests += 1
    }

    override fun startUpdatingLocation() {
        locationStarts += 1
    }

    override fun startUpdatingHeading() {
        headingStarts += 1
    }

    override fun stopUpdatingHeading() {
        headingStops += 1
    }
}

/**
 * A store that keeps what is written to it, as a test reads a UserDefaults suite's persistent domain: every
 * value set, as text, under its key.
 */
internal class RecordingDefaults(
    private val store: InMemoryScooterDefaults = InMemoryScooterDefaults(),
) : ScooterDefaults by store {
    private val written = mutableListOf<String>()

    val writes: List<String> get() = written.toList()

    override fun set(value: Boolean, forKey: String) = record(forKey, value) { store.set(value, forKey) }

    override fun set(value: Int, forKey: String) = record(forKey, value) { store.set(value, forKey) }

    override fun set(value: String, forKey: String) = record(forKey, value) { store.set(value, forKey) }

    override fun set(value: List<String>, forKey: String) = record(forKey, value) { store.set(value, forKey) }

    override fun set(value: ByteArray, forKey: String) = record(forKey, value.decodeToString()) { store.set(value, forKey) }

    override fun set(value: Instant, forKey: String) = record(forKey, value) { store.set(value, forKey) }

    private fun record(key: String, value: Any, write: () -> Unit) {
        written += "$key = $value"
        write()
    }
}

/** An event as ScooterAnalytics sends it: its name and its data, but the platform, which every event carries. */
internal data class TrackedEvent(
    val name: String?,
    val provider: String? = null,
    val value: Int? = null,
    val result: String? = null,
    val target: String? = null,
)

/**
 * The app's analytics as a test has them: a ScooterAnalytics that sends each event as it is tracked, on the
 * caller's thread, to a client that keeps it and answers it itself. Nothing reaches the network.
 */
internal class RecordingAnalytics(
    /** What the client answers each event with: Umami's answer, its status and its body. */
    private val answer: (index: Int) -> Pair<Int, String> = { 200 to "{}" },
    /** Where the events are sent from: at once, unless the test holds them on its own dispatcher. */
    scope: CoroutineScope = CoroutineScope(Dispatchers.Unconfined),
    /** The app's defaults, which the analytics reads its switch from. */
    defaults: ScooterDefaults = InMemoryScooterDefaults(),
) {
    private val sent = mutableListOf<okhttp3.Request>()
    private val bodies = mutableListOf<JsonObject>()

    /** Each request, as it reached the client, in order. */
    val requests: List<okhttp3.Request> get() = sent.toList()

    /** The payload of each event sent, in order. */
    val payloads: List<JsonObject> get() = bodies.map { it.getValue("payload").jsonObject }

    val events: List<TrackedEvent>
        get() = payloads.map { payload ->
            val data = payload["data"]?.jsonObject
            fun string(key: String): String? = (data?.get(key) as? JsonPrimitive)?.takeIf { it.isString }?.content
            TrackedEvent(
                name = (payload["name"] as? JsonPrimitive)?.content,
                provider = string("provider"),
                value = (data?.get("value") as? JsonPrimitive)?.int,
                result = string("result"),
                target = string("target"),
            )
        }

    /** The names of the events, in order. */
    val names: List<String?> get() = events.map { it.name }

    val analytics = ScooterAnalytics(
        website = "test-website",
        sends = true,
        userAgent = ScooterAnalytics.userAgent(androidVersion = "16", chromeMajor = 141),
        defaults = defaults,
        scope = scope,
        client = OkHttpClient.Builder()
            // A call runs on the thread that makes it, so an event is sent before track returns.
            .dispatcher(Dispatcher(DirectExecutorService()))
            .addInterceptor { chain ->
                val request = chain.request()
                val body = Buffer().also { request.body?.writeTo(it) }.readUtf8()
                val index = sent.size
                sent += request
                bodies += Json.parseToJsonElement(body).jsonObject
                val (code, text) = answer(index)
                Response.Builder()
                    .request(request)
                    .protocol(Protocol.HTTP_1_1)
                    .code(code)
                    .message("")
                    .body(text.toResponseBody("application/json".toMediaType()))
                    .build()
            }
            .build(),
    )

    /** Forgets the events sent so far. */
    fun clear() {
        sent.clear()
        bodies.clear()
    }

    private class DirectExecutorService : AbstractExecutorService() {
        override fun execute(command: Runnable) = command.run()

        override fun shutdown() = Unit

        override fun shutdownNow(): List<Runnable> = emptyList()

        override fun isShutdown(): Boolean = false

        override fun isTerminated(): Boolean = false

        override fun awaitTermination(timeout: Long, unit: TimeUnit): Boolean = true
    }
}

/** Directions a test does not ask for: no path, and nothing goes out to the network. */
internal object NoWalkingDirections : WalkingDirectionsClient {
    override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> = emptyList()
}

/**
 * The controller on the test's background scope. Without a clock of its own it reads the test's, which the
 * test's waits move as real time moves under the iPhone's tests, from where TestClock starts. It reads the tests'
 * own catalog unless given another.
 */
internal fun TestScope.makeController(
    api: ScooterAPIClient,
    clock: TestClock? = null,
    defaults: ScooterDefaults = InMemoryScooterDefaults(),
    locationManager: ScooterLocationManager = FakeLocationManager(),
    refreshPolicy: ScooterRefreshPolicy = ScooterRefreshPolicy.standard,
    locationTimeout: Duration = 5.seconds,
    phoneLanguages: () -> List<String> = { listOf("en-US") },
    keepAppLanguages: (List<String>) -> Unit = {},
    directions: WalkingDirectionsClient = NoWalkingDirections,
    openInMaps: (ScooterWalkTarget) -> Unit = {},
    analytics: RecordingAnalytics? = null,
    start: ScooterMapStart = ScooterMapStart.switzerland,
    catalog: ScooterCatalog = TestCatalog.catalog,
    debug: Boolean = false,
    cityZoneFiles: CoroutineContext = Dispatchers.IO,
): ScooterMapController {
    val scheduler = testScheduler
    val startedAt = TestClock().now
    val now: () -> Instant = if (clock != null) {
        { clock.now }
    } else {
        { startedAt.plusMillis(scheduler.currentTime) }
    }
    return ScooterMapController(
        api = api,
        locationManager = locationManager,
        defaults = defaults,
        scope = backgroundScope,
        directions = directions,
        openInMaps = openInMaps,
        locationTimeout = locationTimeout,
        refreshPolicy = refreshPolicy,
        now = now,
        phoneLanguages = phoneLanguages,
        keepAppLanguages = keepAppLanguages,
        analytics = analytics?.analytics,
        start = start,
        catalog = catalog,
        debug = debug,
        cityZoneFiles = cityZoneFiles,
    )
}

internal fun TestScope.loadedController(vehicles: List<Scooter>, origin: GeoPoint): ScooterMapController {
    val api = StubScooterAPI(ScooterResponse(vehicles = vehicles))
    val model = makeController(api)
    model.setUserLocation(origin)
    model.refresh()
    val loadingFinished = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
    assertTrue(loadingFinished)
    return model
}

internal fun scooter(
    id: String,
    provider: String,
    latitude: Double = 47.3769,
    longitude: Double = 8.5417,
    battery: Int? = 80,
    rangeMeters: Int? = null,
    rentalURIs: ScooterRentalURIs? = null,
): Scooter = Scooter(
    provider = provider,
    latitude = latitude,
    longitude = longitude,
    battery = battery,
    rangeMeters = rangeMeters,
    vehicleID = id,
    deepLink = null,
    rentalURIs = rentalURIs,
    distanceMeters = 0.0,
)

/**
 * Lets the controller's work run, 10 ms of the test's time at a time, until the condition holds: false if it
 * never does in `attempts` steps.
 */
internal fun TestScope.waitUntil(attempts: Int = 200, condition: () -> Boolean): Boolean {
    repeat(attempts) {
        if (condition()) return true
        advanceTimeBy(10)
        runCurrent()
    }
    return false
}

/** Long enough for a refresh that was going to start to have reached the API. */
internal fun TestScope.settle() {
    advanceTimeBy(60)
    runCurrent()
}

/** XCTUnwrap: the value, or the test fails. */
internal fun <T : Any> unwrap(value: T?): T {
    assertNotNull(value)
    return value!!
}
