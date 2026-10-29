package com.plhery.scootradar

import com.plhery.scootradar.app.NotDeterminedLocationManager
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterLocationManager
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterRentalURIs
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterRidePricing
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.addingTimeInterval
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestCoroutineScheduler
import java.time.Instant

// The stubs and helpers of ios/ScootRadarTests/ScooterMapModelTests.swift that the screen's tests need, as :core's
// tests have them in ScooterMapControllerFakes.kt.

/** A server with nothing on its map. */
object EmptyScooterAPI : ScooterAPIClient {
    override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse =
        ScooterResponse(vehicles = emptyList())
}

/** A router that finds no path. */
object NoWalkingDirections : WalkingDirectionsClient {
    override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> = emptyList()
}

/**
 * Nothing kept from before but the operators' zones turned off, as they were before they were on unless turned
 * off: the screens are drawn without the zones' legend, which ZoneLegendScreenshotTest draws.
 */
fun zonesOffDefaults(): ScooterDefaults = InMemoryScooterDefaults().apply { set(false, forKey = "map-zones") }

/** A controller of an empty map, on `scope`, with the zones off, reading the tests' own catalog. */
fun testController(
    scope: CoroutineScope,
    now: () -> Instant = Instant::now,
    defaults: ScooterDefaults = zonesOffDefaults(),
    phoneLanguages: () -> List<String> = { listOf("en-US") },
    keepAppLanguages: (List<String>) -> Unit = {},
    catalog: ScooterCatalog = TestCatalog.catalog,
): ScooterMapController = ScooterMapController(
    api = EmptyScooterAPI,
    locationManager = NotDeterminedLocationManager(),
    defaults = defaults,
    scope = scope,
    directions = NoWalkingDirections,
    openInMaps = {},
    now = now,
    phoneLanguages = phoneLanguages,
    keepAppLanguages = keepAppLanguages,
    catalog = catalog,
)

/** A server that gives the same answer every time, or fails as the test says; it counts the requests. */
class StubScooterAPI(private var response: ScooterResponse) : ScooterAPIClient {
    private var failure: ScooterAPIError? = null
    var calls = 0
        private set

    override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse {
        calls += 1
        failure?.let { throw it }
        return response
    }

    fun setFailure(failure: ScooterAPIError?) {
        this.failure = failure
    }
}

/** A clock the test moves by hand: the waits of the test's scheduler do not move it. */
class TestClock {
    var now: Instant = Instant.ofEpochSecond(1_790_000_000)

    fun advance(seconds: Double) {
        now = now.addingTimeInterval(seconds)
    }
}

/**
 * The controllers of a test, on one scheduler that only the test moves, as :core's tests have them: their work
 * runs on the test's thread, between the test's steps. [close] when done.
 */
class TestControllers {
    private val scheduler = TestCoroutineScheduler()
    private val scope = CoroutineScope(SupervisorJob() + StandardTestDispatcher(scheduler))
    private val start = TestClock().now

    /**
     * A controller of `api`'s map, with nothing kept from before but `defaults`, the zones off unless they say
     * otherwise. Without a clock of its own it
     * reads the scheduler's, which [waitUntil] moves as real time moves under the iPhone's tests. It reads the
     * tests' own catalog unless given another.
     */
    fun make(
        api: ScooterAPIClient,
        clock: TestClock? = null,
        locationManager: ScooterLocationManager = NotDeterminedLocationManager(),
        directions: WalkingDirectionsClient = NoWalkingDirections,
        openInMaps: (ScooterWalkTarget) -> Unit = {},
        defaults: ScooterDefaults = zonesOffDefaults(),
        catalog: ScooterCatalog = TestCatalog.catalog,
    ): ScooterMapController = ScooterMapController(
        api = api,
        locationManager = locationManager,
        defaults = defaults,
        scope = scope,
        directions = directions,
        openInMaps = openInMaps,
        now = now(clock),
        phoneLanguages = { listOf("en-US") },
        keepAppLanguages = {},
        catalog = catalog,
    )

    /** What the controllers made with `clock` read as the time: the clock, or the scheduler's. */
    fun now(clock: TestClock? = null): () -> Instant =
        if (clock != null) ({ clock.now }) else ({ start.plusMillis(scheduler.currentTime) })

    /**
     * Lets the controllers' work run, 10 ms of the scheduler's time at a time, until the condition holds: false
     * if it never does in `attempts` steps.
     */
    fun waitUntil(attempts: Int = 200, condition: () -> Boolean): Boolean {
        repeat(attempts) {
            if (condition()) return true
            scheduler.advanceTimeBy(10)
            scheduler.runCurrent()
        }
        return condition()
    }

    fun close() {
        scope.cancel()
    }
}

/** Zürich's centre, at a street's zoom. */
val zurichRegion = MapRegion(GeoPoint(47.3769, 8.5417), latitudeDelta = 0.01, longitudeDelta = 0.01)

/** Lungern, where no operator serves in the tests' catalog (TestCatalog). */
val lungernRegion = MapRegion(GeoPoint(46.7741, 8.1558), latitudeDelta = 0.02, longitudeDelta = 0.02)

fun scooter(
    id: String,
    provider: String,
    latitude: Double = 47.3769,
    longitude: Double = 8.5417,
    battery: Int? = 80,
    rangeMeters: Int? = null,
    rentalURIs: ScooterRentalURIs? = null,
    pricing: ScooterRidePricing? = null,
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
    pricing = pricing,
)
