package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.addingTimeInterval
import java.time.Instant
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.delay

// The stubs of ios/ScootRadarTests/ScooterMapModelTests.swift: its APIs, its clock and its location manager.

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

    override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse {
        calls += 1
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

/** Directions a test does not ask for: no path, and nothing goes out to the network. */
internal object NoWalkingDirections : WalkingDirectionsClient {
    override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> = emptyList()
}
