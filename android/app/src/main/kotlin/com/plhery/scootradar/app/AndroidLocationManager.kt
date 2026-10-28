package com.plhery.scootradar.app

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
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

// CLLocationManager as ios/ScootRadar/ViewModels/ScooterMapModel.swift sets it up and asks it (logic.md LOG-241 to
// LOG-260; X.md X-AD11 to X-AD13 and X-AD38).

/**
 * The phone's location service, as the controller asks CLLocationManager: Android's LocationManager, on its fused
 * provider where the phone has one, else on GPS and the network together. It asks the rider through the activity
 * that is in front, never at launch, and runs only while the app is: nothing goes on in the background.
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
    private val main: Executor = context.mainExecutor

    /** Asked for since the controller started the updates; they pause while the app is away. */
    private var isUpdatingLocation = false
    private var isInForeground = false

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

    override val isHeadingAvailable: Boolean = false

    override var headingOrientation: ScooterDeviceOrientation = ScooterDeviceOrientation.Portrait

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

    override fun startUpdatingHeading() = Unit

    override fun stopUpdatingHeading() = Unit

    /**
     * The rider answered Android's dialog. Any refusal, Android's own after two (no dialog shown) included, is kept
     * as iOS keeps "Don't Allow": the app asks no more, and the card offers Settings (PLAN §10).
     */
    fun permissionsAnswered() {
        if (hasLocationPermission) defaults.removeObject(forKey = REFUSED_KEY) else defaults.set(true, forKey = REFUSED_KEY)
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
        reportAuthorization()
    }

    /** The app left the front (ON_STOP): nothing is asked of the phone until it comes back (LOG-259, X-AD38). */
    fun leftForeground() {
        if (isInForeground) context.unregisterReceiver(modeChanges)
        isInForeground = false
        removeUpdates()
    }

    /** The screen is gone for good. */
    fun close() {
        leftForeground()
        isUpdatingLocation = false
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
     */
    private fun reportAuthorization() {
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
     * by its own date, which a phone sets from the network and GPS (LOG-252).
     */
    internal fun fix(location: Location): ScooterLocationFix {
        val timestamp = if (location.elapsedRealtimeNanos > 0) {
            now().minusNanos(elapsedRealtimeNanos() - location.elapsedRealtimeNanos)
        } else {
            Instant.ofEpochMilli(location.time)
        }
        return ScooterLocationFix(
            coordinate = GeoPoint(location.latitude, location.longitude),
            horizontalAccuracy = if (location.hasAccuracy()) location.accuracy.toDouble() else -1.0,
            timestamp = timestamp,
        )
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
    }
}
