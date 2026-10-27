package com.plhery.scootradar

import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterDeviceOrientation
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterLocationManager
import com.plhery.scootradar.core.model.GeoPoint
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.completeWith
import kotlinx.coroutines.withContext
import kotlin.math.PI
import kotlin.math.cos

// WalkLocationManager and FakeWalkingDirections in ios/ScootRadarTests/ScooterWalkTests.swift, as :core's
// ScooterWalkTest has them.

/** The phone's location service with the permission a test gives it; nothing is located until the test says so. */
class FakeLocationManager(
    var authorization: ScooterAuthorizationStatus = ScooterAuthorizationStatus.AuthorizedWhenInUse,
) : ScooterLocationManager {
    override val authorizationStatus: ScooterAuthorizationStatus get() = authorization
    override val location: ScooterLocationFix? = null
    override val isHeadingAvailable: Boolean = false
    override var headingOrientation: ScooterDeviceOrientation = ScooterDeviceOrientation.Portrait

    /** kCLDistanceFilterNone until the controller sets its own. */
    override var distanceFilter: Double = -1.0

    override fun requestWhenInUseAuthorization() {}

    override fun startUpdatingLocation() {}

    override fun startUpdatingHeading() {}

    override fun stopUpdatingHeading() {}
}

/** The site's walking directions, answering at once or when the test says so. */
class FakeWalkingDirections(
    /** What it answers; null for the straight line between the two points. */
    var result: Result<List<GeoPoint>>?,
) : WalkingDirectionsClient {
    data class Request(val origin: GeoPoint, val target: GeoPoint)

    /** Holds the answers back until they are released. */
    var holds = false
    val requests = mutableListOf<Request>()
    private val waiting = mutableMapOf<Int, CompletableDeferred<List<GeoPoint>>>()

    override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> {
        val index = requests.size
        requests += Request(from, to)
        if (holds) {
            val answer = CompletableDeferred<List<GeoPoint>>()
            waiting[index] = answer
            // As a Swift continuation, a held answer waits for the test even once its request is cancelled.
            return withContext(NonCancellable) { answer.await() }
        }
        return (result ?: Result.success(listOf(from, to))).getOrThrow()
    }

    fun releaseAll(with: Result<List<GeoPoint>>) {
        for (index in waiting.keys.sorted()) waiting.remove(index)?.completeWith(with)
    }
}

/** The point `east` and `north` metres from `origin`. */
fun GeoPoint.offset(east: Number, north: Number): GeoPoint {
    val metresPerDegree = 6_371_008.8 * PI / 180
    return GeoPoint(
        latitude = latitude + north.toDouble() / metresPerDegree,
        longitude = longitude + east.toDouble() / (metresPerDegree * cos(latitude * PI / 180)),
    )
}
