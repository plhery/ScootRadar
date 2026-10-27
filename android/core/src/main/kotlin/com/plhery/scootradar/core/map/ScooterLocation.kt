package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.timeIntervalSince
import java.time.Instant
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

// ios/ScootRadar/ViewModels/ScooterMapModel.swift's location policy, ios/ScootRadar/Views/ScooterUserLocationView.swift's
// heading, and ios/ScootRadar/Views/ScooterMapScreen.swift's heading policy.

/** A position the phone reported, as CLLocation gives what the map reads of it. */
data class ScooterLocationFix(
    val coordinate: GeoPoint,
    /** In metres; negative when the position is not valid. */
    val horizontalAccuracy: Double,
    val timestamp: Instant,
)

/** A compass reading, as CLHeading gives what the map reads of it. */
data class ScooterHeadingReading(
    /** Degrees from true north; negative when it is not known. */
    val trueHeading: Double,
    /** Degrees from magnetic north. */
    val magneticHeading: Double,
    /** How far off the reading may be, in degrees; negative when it is not valid. */
    val headingAccuracy: Double,
    val timestamp: Instant,
)

object ScooterLocationPolicy {
    const val preferredAccuracy: Double = 200.0
    const val fallbackAccuracy: Double = 1_000.0
    const val maximumAge: Double = 30.0

    fun isAcceptable(location: ScooterLocationFix, maximumAccuracy: Double, now: Instant = Instant.now()): Boolean =
        location.horizontalAccuracy >= 0 &&
            location.horizontalAccuracy <= maximumAccuracy &&
            abs(location.timestamp.timeIntervalSince(now)) <= maximumAge

    fun bestCandidate(
        locations: List<ScooterLocationFix>,
        maximumAccuracy: Double = fallbackAccuracy,
        now: Instant = Instant.now(),
    ): ScooterLocationFix? =
        locations
            .filter { isAcceptable(it, maximumAccuracy, now) }
            .minByOrNull { it.horizontalAccuracy }
}

/** Whether the app may know where the phone is, as CLAuthorizationStatus says. */
enum class ScooterAuthorizationStatus {
    /** Not asked yet. */
    NotDetermined,

    /** Not allowed on this device, whatever the rider says. */
    Restricted,

    /** Refused. */
    Denied,
    AuthorizedAlways,
    AuthorizedWhenInUse,
    ;

    val isAuthorized: Boolean get() = this == AuthorizedAlways || this == AuthorizedWhenInUse
}

/** Which way up the screen shows, as CLDeviceOrientation says, for the heading to be the way the person faces. */
enum class ScooterDeviceOrientation {
    Unknown,
    Portrait,
    PortraitUpsideDown,
    LandscapeLeft,
    LandscapeRight,
    FaceUp,
    FaceDown,
}

/**
 * Which way up the window shows, as UIInterfaceOrientation says. The interface turns the other way from the
 * phone: Android's Surface.ROTATION_90, the phone turned a quarter anticlockwise, is LandscapeRight, and
 * ROTATION_270 is LandscapeLeft.
 */
enum class ScooterInterfaceOrientation {
    Unknown,
    Portrait,
    PortraitUpsideDown,
    LandscapeLeft,
    LandscapeRight,
}

/**
 * The compass reads the heading from the top of the phone held upright. The direction someone faces is the top
 * of the screen as it shows, so a screen shown sideways, as an open folding phone shows the map, turns it with
 * it.
 */
object ScooterHeadingPolicy {
    fun deviceOrientation(interfaceOrientation: ScooterInterfaceOrientation): ScooterDeviceOrientation =
        when (interfaceOrientation) {
            ScooterInterfaceOrientation.PortraitUpsideDown -> ScooterDeviceOrientation.PortraitUpsideDown
            // The interface turns the other way from the device.
            ScooterInterfaceOrientation.LandscapeLeft -> ScooterDeviceOrientation.LandscapeRight
            ScooterInterfaceOrientation.LandscapeRight -> ScooterDeviceOrientation.LandscapeLeft
            else -> ScooterDeviceOrientation.Portrait
        }
}

/** Why locating failed, as the CLError codes the map tells apart. */
enum class ScooterLocationError {
    /** The rider refused, or the device does not allow it. */
    Denied,

    /** No position just now; the phone keeps trying. */
    LocationUnknown,

    /** Anything else. */
    Other,
}

/**
 * What the map's controller asks of the phone's location service, as it asks CLLocationManager. The app's
 * implementation calls the controller back with what the service reports (`authorizationChanged`,
 * `locationsUpdated`, `headingUpdated`, `locationFailed`), on the thread the controller is confined to. It
 * always asks for the best accuracy the phone has, and for the heading from a change of 2°.
 */
interface ScooterLocationManager {
    val authorizationStatus: ScooterAuthorizationStatus

    /** The last position the service kept, as at a relaunch; null when it has none. */
    val location: ScooterLocationFix?

    /** Whether the phone can tell which way it points: CLLocationManager.headingAvailable(). */
    val isHeadingAvailable: Boolean

    /** Which way up the screen shows, for the heading to be the way the person faces. */
    var headingOrientation: ScooterDeviceOrientation

    /** The move, in metres, that is reported as a new position. */
    var distanceFilter: Double

    /** Asks the rider for the position while the app is in use; the answer comes as `authorizationChanged`. */
    fun requestWhenInUseAuthorization()

    fun startUpdatingLocation()

    fun startUpdatingHeading()

    fun stopUpdatingHeading()
}

/** Where distances are measured from: the searched place, or else the rider. */
sealed interface NearbyOrigin {
    val point: GeoPoint

    data class SearchedDestination(val destination: MapDestination) : NearbyOrigin {
        override val point: GeoPoint get() = destination.point
    }

    data class UserLocation(override val point: GeoPoint) : NearbyOrigin
}

/** Which way the person faces, with how sure the compass is: the beam of the dot on the map. */
@ConsistentCopyVisibility
data class ScooterUserHeading private constructor(
    /** Degrees from north. */
    val direction: Double,
    /** Degrees each way. */
    val accuracy: Double,
) {
    /** Half the beam's angle, in radians: between 22° and 60° each way. */
    val halfAngle: Double get() = min(60.0, max(22.0, accuracy)) * PI / 180

    companion object {
        /**
         * Null for a reading too vague to draw, 90° or more each way, or with no direction: true north when it
         * is known, else magnetic north.
         */
        operator fun invoke(trueHeading: Double, magneticHeading: Double, accuracy: Double): ScooterUserHeading? {
            if (!(accuracy.isFinite() && accuracy >= 0 && accuracy < 90)) return null
            val direction = if (trueHeading.isFinite() && trueHeading >= 0) trueHeading else magneticHeading
            if (!(direction.isFinite() && direction >= 0 && direction < 360)) return null
            return ScooterUserHeading(direction = direction, accuracy = accuracy)
        }
    }
}
