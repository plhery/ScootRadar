package com.plhery.scootradar.app

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.os.Build
import android.webkit.WebView
import androidx.core.net.toUri
import com.plhery.scootradar.BuildConfig
import com.plhery.scootradar.core.api.AddressSearchAPI
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.api.ScooterAPI
import com.plhery.scootradar.core.api.ScooterAnalytics
import com.plhery.scootradar.core.api.ScootRadarWalkingDirections
import com.plhery.scootradar.core.api.mapsURL
import com.plhery.scootradar.core.model.CityZoneCache
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLinks
import com.plhery.scootradar.core.model.ScooterListFormat
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterMeasureFormat
import com.plhery.scootradar.core.model.ScooterNumberFormat
import com.plhery.scootradar.core.model.ScooterStartPlace
import com.plhery.scootradar.core.model.ScooterWalkTarget
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

/**
 * What the app's screens share for as long as the app runs: its defaults, the server, the formats :core asks
 * the platform for, and the phone's languages. The Application makes one as it starts.
 */
class AppContainer(private val context: Context) {
    val defaults: ScooterDefaults =
        SharedPreferencesScooterDefaults(context.getSharedPreferences("ScooterDefaults", Context.MODE_PRIVATE))

    val languages = AppLanguages(context)

    val formats = AndroidFormats(context)

    /** The app's own scope, which outlives every screen: where analytics sends from. */
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    val api = ScooterAPI(isOffline = ::isOffline)

    val directions = ScootRadarWalkingDirections()

    /**
     * Where the cities' zones the app downloads are kept: cacheDir/CityZones/v1, among the app's caches, which no
     * backup takes and Android may clear when space runs short (LOG-423).
     */
    val cityZoneCache: CityZoneCache by lazy { CityZoneCache.standard(context.cacheDir) }

    /** The server's address search, which the search bar asks for places. */
    val addressSearch: AddressSearchAPIClient by lazy { AddressSearchAPI(client = api.client) }

    /**
     * Whether a debug build was started for the analytics smoke test, as the iPhone app's simulator is with
     * `-analytics-smoke-test`: set from the launch before [analytics] is first read.
     */
    var analyticsSmokeTest = false

    /** "ScootRadar Android" in Umami: the release build sends, a debug build only when started for the smoke test. */
    val analytics: ScooterAnalytics by lazy {
        ScooterAnalytics(
            sends = sendsAnalytics(BuildConfig.BUILD_TYPE, analyticsSmokeTest),
            userAgent = ScooterAnalytics.userAgent(Build.VERSION.RELEASE, chromeMajor()),
            defaults = defaults,
            scope = scope,
        )
    }

    /** The phone's location service for a screen, which its controller asks and hears from. */
    fun locationManager(): AndroidLocationManager = AndroidLocationManager(context, defaults)

    /** Where the map opens: the covered city nearest the phone's time zone, as this run starts. */
    val start: ScooterMapStart by lazy { ScooterStartPlace.start(forTimeZone = java.util.TimeZone.getDefault().id) }

    /** Sets what :core reads from the platform, before anything is shown. */
    fun setHooks() {
        ScooterNumberFormat.integer = formats::integer
        ScooterNumberFormat.amount = formats::amount
        ScooterNumberFormat.currency = formats::currency
        ScooterMeasureFormat.length = formats::length
        ScooterDateFormat.skeleton = formats::skeleton
        ScooterDateFormat.timeZone = formats::timeZone
        ScooterListFormat.and = formats::and
        ScooterLanguage.launchLocale = { languages.launchLocale }
        ScooterLinks.appVersion = BuildConfig.VERSION_NAME
    }

    /**
     * Ends the server's requests under way as the phone goes offline, by [lost]: a socket of the network Android lost
     * may wait out its 20 seconds, where the iPhone's URLSession ends its requests as offline at once (X-M21). Android
     * tells a default network's callback of its loss only when no other network takes its place, and what it says of
     * the networks within the callback may be out of date, so the loss is enough (review-app-ah 2). Called once, as
     * the app starts.
     */
    fun watchNetwork(lost: () -> Unit = api::networkLost) {
        val connectivity = context.getSystemService(ConnectivityManager::class.java) ?: return
        connectivity.registerDefaultNetworkCallback(object : ConnectivityManager.NetworkCallback() {
            override fun onLost(network: Network) = lost()
        })
    }

    /** Whether the phone has no network that reaches the internet just now: none Android has validated. */
    fun isOffline(): Boolean {
        val connectivity = context.getSystemService(ConnectivityManager::class.java) ?: return false
        val capabilities = connectivity.getNetworkCapabilities(connectivity.activeNetwork) ?: return true
        return !capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    /** Google Maps with walking directions to the scooter or the bay, in its app or else the browser (X-AD10). */
    fun openInMaps(target: ScooterWalkTarget) {
        val intent = Intent(Intent.ACTION_VIEW, target.mapsURL.toUri()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            context.startActivity(intent)
        } catch (_: ActivityNotFoundException) {
            // Nothing on the phone opens a web address.
        }
    }

    /** The major version of the phone's WebView, which is Chrome's: 0 when it has none. */
    private fun chromeMajor(): Int =
        WebView.getCurrentWebViewPackage()?.versionName?.substringBefore('.')?.toIntOrNull() ?: 0

    companion object {
        /**
         * Whether a build of [buildType] sends analytics: the `release` build type itself, which is the one that goes
         * to Play, or a debug build started for the smoke test. The builds made from release to measure the app and
         * to record its Baseline Profile (benchmarkRelease, nonMinifiedRelease) are not debuggable either, but run
         * on an emulator, whose sessions must count nowhere. The Baseline Profile plugin makes them with
         * `initWith(release)`, so a flag set only on release would follow them; the build type's name does not.
         */
        fun sendsAnalytics(buildType: String, smokeTest: Boolean): Boolean = buildType == "release" || smokeTest
    }
}
