package com.plhery.scootradar.app

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.hardware.GeomagneticField
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.location.LocationRequest
import android.os.SystemClock
import android.os.UserManager
import androidx.core.content.ContextCompat
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterDeviceOrientation
import com.plhery.scootradar.core.map.ScooterHeadingReading
import com.plhery.scootradar.core.map.ScooterLocationError
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterLocationManager
import com.plhery.scootradar.core.map.ScooterLocationPolicy
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.ui.chrome.LocationSettings
import java.time.Instant
import java.util.concurrent.Executor
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.hypot

// CLLocationManager as ios/ScootRadar/ViewModels/ScooterMapModel.swift sets it up and asks it (logic.md LOG-241 to
// LOG-260; X.md X-AD11 to X-AD13 and X-AD38).

/**
 * The phone's location service, as the controller asks CLLocationManager: Android's LocationManager, on its fused
 * provider where the phone has one, else on GPS and the network together, and the compass from the rotation
 * vector sensor. It asks the rider through the activity that is in front, never at launch, and runs only while
 * the app is: nothing goes on in the background.
 *
 * Everything it reports goes to [delegate] on the main thread, after the call that caused it returns, as Core
 * Location's delegate calls do.
 */
class AndroidLocationManager(
    private val context: Context,
    /** Where a refusal is kept, since Android tells a refusal from a question never asked only by asking. */
    private val defaults: ScooterDefaults,
    private val now: () -> Instant = Instant::now,
    private val elapsedRealtimeNanos: () -> Long = SystemClock::elapsedRealtimeNanos,
) : ScooterLocationManager, LocationSettings {
    /** What the location service reports, as CLLocationManagerDelegate: the controller's callbacks. */
    interface Delegate {
        fun authorizationChanged()

        fun locationsUpdated(locations: List<ScooterLocationFix>)

        fun headingUpdated(heading: ScooterHeadingReading)

        fun locationFailed(error: ScooterLocationError)
    }

    /** Shows Android's permission dialog for these permissions: the activity's launcher, while there is one. */
    fun interface PermissionRequester {
        fun request(permissions: Array<String>)
    }

    var delegate: Delegate? = null

    /** Set by the activity as it is made and cleared as it goes, so that the service never holds on to one. */
    var permissionRequester: PermissionRequester? = null

    private val locationManager = context.getSystemService(LocationManager::class.java)
    private val userManager = context.getSystemService(UserManager::class.java)
    private val sensorManager = context.getSystemService(SensorManager::class.java)

    /** The phone's orientation as its gyroscope, accelerometer and magnetometer together give it, north magnetic. */
    private val rotationSensor: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
    private val main: Executor = context.mainExecutor

    /** Asked for since the controller started the updates; they pause while the app is away. */
    private var isUpdatingLocation = false
    private var isUpdatingHeading = false
    private var isInForeground = false
    private var isListeningToHeading = false

    /** True north's angle from magnetic north where the phone last was, in degrees east; null before a fix. */
    private var declination: Double? = null

    /** The compass reading last reported, which the next must be 2° from to be reported. */
    private var reportedHeading: ScooterHeadingReading? = null

    /** The answer the controller last heard, with whether it was precise, to tell it of a change. */
    private var reportedStatus = authorizationStatus
    private var reportedPrecise = hasPermission(Manifest.permission.ACCESS_FINE_LOCATION)

    /** What Try again does once the rider has answered the request for precise location. */
    private var afterPreciseAnswer: (() -> Unit)? = null

    /** Each provider's newest fix, which together are reported as one batch. */
    private val latestFixes = mutableMapOf<String, ScooterLocationFix>()
    private val listeners = mutableMapOf<String, LocationListener>()

    /** Location turned on or off for the whole phone from the quick settings, the app still in front. */
    private val modeChanges = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            reportAuthorization()
        }
    }

    /**
     * When-in-use while the app may locate the phone; restricted when the phone's owner turned location off for
     * good; refused once the rider has refused, or while location is off for the whole phone, as iOS reports it
     * (LOG-247); not determined before the rider is asked, and again after a grant for only this time ran out
     * (LOG-251).
     */
    override val authorizationStatus: ScooterAuthorizationStatus
        get() {
            val granted = hasLocationPermission
            val enabled = locationManager?.isLocationEnabled == true
            return when {
                granted && enabled -> ScooterAuthorizationStatus.AuthorizedWhenInUse
                isRestricted(UserManager.DISALLOW_SHARE_LOCATION) ||
                    (!enabled && isRestricted(UserManager.DISALLOW_CONFIG_LOCATION)) -> ScooterAuthorizationStatus.Restricted
                granted -> ScooterAuthorizationStatus.Denied
                defaults.bool(forKey = REFUSED_KEY) -> ScooterAuthorizationStatus.Denied
                else -> ScooterAuthorizationStatus.NotDetermined
            }
        }

    /** The provider's last fix, as Core Location keeps one across launches; none without the permission. */
    override val location: ScooterLocationFix?
        get() {
            val locationManager = locationManager ?: return null
            if (!hasLocationPermission) return null
            val fixes = try {
                providers.mapNotNull { locationManager.getLastKnownLocation(it)?.let(::fix) }
            } catch (_: SecurityException) {
                return null
            }
            return ScooterLocationPolicy.bestCandidate(fixes, now = now()) ?: fixes.maxByOrNull { it.timestamp }
        }

    /** Whether the phone has the sensor the compass is read from. */
    override val isHeadingAvailable: Boolean get() = rotationSensor != null

    /** Which way up the screen shows: the heading is the way its top faces. A turn is reported at the next reading. */
    override var headingOrientation: ScooterDeviceOrientation = ScooterDeviceOrientation.Portrait
        set(value) {
            if (field == value) return
            field = value
            reportedHeading = null
        }

    /** A new position is reported once the phone has moved this far: 20 m, 5 m on a walk (LOG-258). */
    override var distanceFilter: Double = 0.0
        set(value) {
            if (field == value) return
            field = value
            if (isUpdatingLocation && isInForeground) requestUpdates()
        }

    /** Whether the rider gave approximate location only: its fixes, 2 km wide or more, are never good enough. */
    val isApproximateOnly: Boolean
        get() = hasPermission(Manifest.permission.ACCESS_COARSE_LOCATION) &&
            !hasPermission(Manifest.permission.ACCESS_FINE_LOCATION)

    override fun requestWhenInUseAuthorization() {
        permissionRequester?.request(PERMISSIONS)
    }

    override fun startUpdatingLocation() {
        isUpdatingLocation = true
        if (isInForeground) requestUpdates()
    }

    override fun startUpdatingHeading() {
        isUpdatingHeading = true
        if (isInForeground) listenToHeading()
    }

    override fun stopUpdatingHeading() {
        isUpdatingHeading = false
        stopListeningToHeading()
    }

    /**
     * The rider answered Android's dialog. Any refusal, Android's own after two (no dialog shown) included, is kept
     * as iOS keeps "Don't Allow": the app asks no more, and the card offers Settings (PLAN §10).
     */
    fun permissionsAnswered() {
        if (!hasLocationPermission) defaults.set(true, forKey = REFUSED_KEY)
        reportAuthorization()
        afterPreciseAnswer?.let { locate ->
            afterPreciseAnswer = null
            locate()
        }
    }

    /**
     * The app came to the front (ON_START): the rider may have changed the permission or the phone's location in
     * Settings meanwhile, and the updates that paused go on.
     */
    fun cameToForeground() {
        if (!isInForeground) {
            ContextCompat.registerReceiver(
                context,
                modeChanges,
                IntentFilter(LocationManager.MODE_CHANGED_ACTION),
                ContextCompat.RECEIVER_NOT_EXPORTED,
            )
        }
        isInForeground = true
        if (isUpdatingLocation && authorizationStatus.isAuthorized) requestUpdates()
        if (isUpdatingHeading) listenToHeading()
        reportAuthorization()
    }

    /** The app left the front (ON_STOP): nothing is asked of the phone until it comes back (LOG-259, X-AD38). */
    fun leftForeground() {
        if (isInForeground) context.unregisterReceiver(modeChanges)
        isInForeground = false
        removeUpdates()
        stopListeningToHeading()
    }

    /** The screen is gone for good. */
    fun close() {
        leftForeground()
        isUpdatingLocation = false
        isUpdatingHeading = false
        delegate = null
        permissionRequester = null
    }

    override fun settingsIntent(context: Context): Intent =
        if (hasLocationPermission && locationManager?.isLocationEnabled == false) {
            LocationSettings.locationSwitch()
        } else {
            LocationSettings.appSettings(context.packageName)
        }

    /**
     * With approximate location only, Try again first asks for precise location, which shows Android's dialog to
     * change to it, and then locates (NEEDS-USER #6); otherwise it locates at once.
     */
    override fun retry(locate: () -> Unit) {
        val requester = permissionRequester
        if (!isApproximateOnly || requester == null) {
            locate()
            return
        }
        afterPreciseAnswer = locate
        requester.request(PERMISSIONS)
    }

    /**
     * Tells the controller when the answer is no longer the one it last heard: its status, or precise location
     * given or taken back, which iOS reports alike. Updates under way are asked for again at the new level.
     *
     * A grant seen here, from the dialog or made in Settings, ends a refusal kept: taken back later, for "Ask every
     * time" or by Android for an app unused, it is a question not asked again, as iOS has it (LOG-251).
     */
    private fun reportAuthorization() {
        if (hasLocationPermission) defaults.removeObject(forKey = REFUSED_KEY)
        val status = authorizationStatus
        val precise = hasPermission(Manifest.permission.ACCESS_FINE_LOCATION)
        if (status == reportedStatus && precise == reportedPrecise) return
        val preciseChanged = precise != reportedPrecise
        reportedStatus = status
        reportedPrecise = precise
        if (preciseChanged && isUpdatingLocation && isInForeground && status.isAuthorized) requestUpdates()
        main.execute { delegate?.authorizationChanged() }
    }

    /** The fused provider where the phone has one (Play services implements it on Google's phones), else GPS and the network. */
    internal val providers: List<String>
        get() {
            val locationManager = locationManager ?: return emptyList()
            if (locationManager.hasProvider(LocationManager.FUSED_PROVIDER)) return listOf(LocationManager.FUSED_PROVIDER)
            return listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER).filter(locationManager::hasProvider)
        }

    /** The best accuracy, a fix a second at most, and one only once the phone has moved [distanceFilter] metres. */
    internal fun request(): LocationRequest =
        LocationRequest.Builder(INTERVAL_MILLIS)
            .setQuality(LocationRequest.QUALITY_HIGH_ACCURACY)
            .setMinUpdateDistanceMeters(distanceFilter.toFloat())
            .build()

    private fun requestUpdates() {
        val locationManager = locationManager ?: return
        if (!hasLocationPermission) return
        val request = request()
        try {
            for (provider in providers) {
                // Asked again with the same listener, a provider takes the new request in place of the old.
                val listener = listeners.getOrPut(provider) { ProviderListener(provider) }
                locationManager.requestLocationUpdates(provider, request, main, listener)
            }
        } catch (_: SecurityException) {
            // The permission went between the check and the request.
            removeUpdates()
            main.execute { delegate?.locationFailed(ScooterLocationError.Denied) }
        }
    }

    private fun removeUpdates() {
        val locationManager = locationManager ?: return
        for (listener in listeners.values) locationManager.removeUpdates(listener)
        listeners.clear()
    }

    private inner class ProviderListener(private val provider: String) : LocationListener {
        override fun onLocationChanged(location: Location) {
            latestFixes[provider] = fix(location)
            declination = declinationAt(location.latitude, location.longitude, location.altitude)
            // With GPS and the network both, :core keeps the better of their latest fixes (X-AD13).
            delegate?.locationsUpdated(latestFixes.values.sortedBy { it.timestamp })
        }

        override fun onProviderEnabled(enabled: String) {
            reportAuthorization()
        }

        /**
         * Location turned off for the whole phone changes the answer, as iOS reports it; a provider of its own
         * gone with another left to go on is nothing; every provider gone is "location unknown", which the wait
         * for a fix rides out (LOG-254).
         */
        override fun onProviderDisabled(disabled: String) {
            val locationManager = locationManager ?: return
            // The broadcast and the providers' callbacks come in either order.
            if (!locationManager.isLocationEnabled || authorizationStatus != reportedStatus) {
                reportAuthorization()
                return
            }
            if (providers.any(locationManager::isProviderEnabled)) return
            delegate?.locationFailed(ScooterLocationError.LocationUnknown)
        }
    }

    /**
     * A fix as the controller reads it. Its time is when the phone took it by the clock that runs since boot, not
     * by its own date, which a phone sets from the network and GPS (LOG-252); but by its date when that clock says
     * it was taken after now, as the emulator's GPS stamps its fixes with the date in that clock's place.
     */
    internal fun fix(location: Location): ScooterLocationFix {
        val sinceBoot = elapsedRealtimeNanos()
        val timestamp = if (location.elapsedRealtimeNanos in 1..sinceBoot) {
            now().minusNanos(sinceBoot - location.elapsedRealtimeNanos)
        } else {
            Instant.ofEpochMilli(location.time)
        }
        return ScooterLocationFix(
            coordinate = GeoPoint(location.latitude, location.longitude),
            horizontalAccuracy = if (location.hasAccuracy()) location.accuracy.toDouble() else -1.0,
            timestamp = timestamp,
        )
    }

    /** The compass only while the controller asks for it, the app is in front and may locate the phone. */
    private fun listenToHeading() {
        val sensor = rotationSensor ?: return
        if (isListeningToHeading || !authorizationStatus.isAuthorized) return
        // True north from where the phone was last, until a fix says where it is.
        if (declination == null) location?.let { declination = declinationAt(it.coordinate.latitude, it.coordinate.longitude, 0.0) }
        reportedHeading = null
        isListeningToHeading = sensorManager?.registerListener(compass, sensor, SensorManager.SENSOR_DELAY_UI) == true
    }

    private fun stopListeningToHeading() {
        if (!isListeningToHeading) return
        sensorManager?.unregisterListener(compass)
        isListeningToHeading = false
    }

    private val compass = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent) {
            headingChanged(event.values, event.accuracy, event.timestamp)
        }

        override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit
    }

    /**
     * A reading of the rotation vector sensor, reported as CLHeading once it is 2° from the last one reported
     * (headingFilter), in direction or in accuracy.
     */
    internal fun headingChanged(rotationVector: FloatArray, status: Int, timestampNanos: Long) {
        val magnetic = magneticHeading(rotationVector, headingOrientation) ?: return
        val trueHeading = declination?.let { normalized(magnetic + it) } ?: -1.0
        val reading = ScooterHeadingReading(
            trueHeading = trueHeading,
            magneticHeading = magnetic,
            headingAccuracy = headingAccuracy(rotationVector, status),
            timestamp = now().minusNanos(elapsedRealtimeNanos() - timestampNanos),
        )
        val last = reportedHeading
        if (last != null &&
            angleBetween(last.magneticHeading, reading.magneticHeading) < HEADING_FILTER &&
            abs(last.headingAccuracy - reading.headingAccuracy) < HEADING_FILTER &&
            (last.trueHeading < 0) == (reading.trueHeading < 0)
        ) {
            return
        }
        reportedHeading = reading
        delegate?.headingUpdated(reading)
    }

    private val hasLocationPermission: Boolean
        get() = hasPermission(Manifest.permission.ACCESS_FINE_LOCATION) ||
            hasPermission(Manifest.permission.ACCESS_COARSE_LOCATION)

    private fun hasPermission(permission: String): Boolean =
        context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED

    private fun isRestricted(restriction: String): Boolean = userManager?.hasUserRestriction(restriction) == true

    companion object {
        /** Both, so that Android 12 offers precise and approximate location (LOG-241). */
        val PERMISSIONS = arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)

        /** Set once the rider refused, cleared once the app may locate the phone. */
        internal const val REFUSED_KEY = "android-location-refused"

        private const val INTERVAL_MILLIS = 1_000L

        /** The change of heading, in degrees, that is reported, as the controller asks CLLocationManager's headingFilter. */
        private const val HEADING_FILTER = 2.0

        /**
         * Degrees from magnetic north the top of the screen faces, held as `orientation` says; with the phone held
         * up rather than flat, the way its back faces, where the rider looks through it. Null when neither says,
         * as for a phone held up and tilted halfway towards the sky.
         *
         * The sensor turns the phone's axes, x to its right and y to its top as it is held upright and z out of
         * its screen, into east, north and up. The way ahead is the screen's top less its face: the top when the
         * phone lies flat, its back when it stands up, and in between a blend of both.
         */
        internal fun magneticHeading(rotationVector: FloatArray, orientation: ScooterDeviceOrientation): Double? {
            val matrix = FloatArray(9)
            SensorManager.getRotationMatrixFromVector(matrix, rotationVector)
            // The screen's top, in east and north: the phone's y held upright, its x with the phone turned a quarter
            // to the left (LandscapeLeft), and so on.
            val (topEast, topNorth) = when (orientation) {
                ScooterDeviceOrientation.LandscapeLeft -> matrix[0] to matrix[3]
                ScooterDeviceOrientation.PortraitUpsideDown -> -matrix[1] to -matrix[4]
                ScooterDeviceOrientation.LandscapeRight -> -matrix[0] to -matrix[3]
                else -> matrix[1] to matrix[4]
            }
            val east = (topEast - matrix[2]).toDouble()
            val north = (topNorth - matrix[5]).toDouble()
            if (hypot(east, north) < 0.1) return null
            return normalized(Math.toDegrees(atan2(east, north)))
        }

        /**
         * How far off the reading may be, in degrees: the sensor's own estimate where it gives one, else by its
         * status, and not valid (negative) while it needs calibrating.
         */
        internal fun headingAccuracy(rotationVector: FloatArray, status: Int): Double {
            val estimate = rotationVector.getOrNull(4)?.toDouble()
            if (estimate != null && estimate.isFinite() && estimate >= 0) return Math.toDegrees(estimate)
            return when (status) {
                SensorManager.SENSOR_STATUS_ACCURACY_HIGH -> 15.0
                SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM -> 30.0
                SensorManager.SENSOR_STATUS_ACCURACY_LOW -> 60.0
                else -> -1.0
            }
        }

        /** True north's angle from magnetic north at a place, today, in degrees east. */
        internal fun declinationAt(latitude: Double, longitude: Double, altitude: Double): Double =
            GeomagneticField(latitude.toFloat(), longitude.toFloat(), altitude.toFloat(), System.currentTimeMillis())
                .declination.toDouble()

        private fun normalized(degrees: Double): Double = ((degrees % 360) + 360) % 360

        private fun angleBetween(first: Double, second: Double): Double {
            val difference = abs(first - second) % 360
            return if (difference > 180) 360 - difference else difference
        }
    }
}
