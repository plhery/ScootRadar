package com.plhery.scootradar.app

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
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

    /** The server's address search, which the search bar asks for places. */
    val addressSearch: AddressSearchAPIClient by lazy { AddressSearchAPI(client = api.client) }

    /**
     * Whether a debug build was started for the analytics smoke test, as the iPhone app's simulator is with
     * `-analytics-smoke-test`: set from the launch before [analytics] is first read.
     */
    var analyticsSmokeTest = false

    /** "ScootRadar Android" in Umami: a release sends, a debug build only when started for the smoke test. */
    val analytics: ScooterAnalytics by lazy {
        ScooterAnalytics(
            sends = !BuildConfig.DEBUG || analyticsSmokeTest,
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
        ScooterNumberFormat.decimal = formats::decimal
        ScooterNumberFormat.currency = formats::currency
        ScooterMeasureFormat.length = formats::length
        ScooterDateFormat.skeleton = formats::skeleton
        ScooterDateFormat.timeZone = formats::timeZone
        ScooterListFormat.and = formats::and
        ScooterLanguage.launchLocale = { languages.launchLocale }
        ScooterLinks.appVersion = BuildConfig.VERSION_NAME
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
}
