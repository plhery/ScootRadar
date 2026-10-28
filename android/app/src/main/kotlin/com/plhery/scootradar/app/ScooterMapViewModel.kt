package com.plhery.scootradar.app

import android.app.Activity
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ViewModel
import com.plhery.scootradar.BuildConfig
import com.plhery.scootradar.core.map.ScooterHeadingReading
import com.plhery.scootradar.core.map.ScooterLocationError
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterScreenshotCamera
import com.plhery.scootradar.map.GroundTiles
import com.plhery.scootradar.map.MapCameraMemory
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel

/**
 * Holds the map's controller for as long as the screen lives, through a rotation or a resized window, as the
 * iPhone's ScooterMapModel lives with its scene. Observing the activity, it tells the controller when the app
 * comes to the foreground and leaves it, as the scene's phase does on the iPhone.
 */
class ScooterMapViewModel(
    container: AppContainer,
    /** The app's defaults, with a debug launch's arguments in front. */
    defaults: ScooterDefaults = container.defaults,
    languageAtLaunch: ScooterLanguageChoice,
    /** The phone's location service, which the activity lets ask the rider, and the controller hears from. */
    val location: AndroidLocationManager = container.locationManager(),
) : ViewModel(), DefaultLifecycleObserver {
    // Dispatchers.Main, not viewModelScope's Main.immediate: the controller's work starts after the call that
    // asked for it returns, as a Swift Task does.
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    /** The app's analytics, which the map also tracks with: a tap on a bay or a cluster. */
    val analytics = container.analytics

    /** Where the search bar asks for places. */
    val addressSearch = container.addressSearch

    /** Where the map opens, by the phone's time zone. */
    val start: ScooterMapStart = container.start

    /** The camera a recreated activity opens on. */
    val camera = MapCameraMemory()

    /** Where the ground's tiles are, asked for once for the screen. */
    val groundTiles = GroundTiles.openFreeMap(container.api.client)

    /** A debug build's camera for screenshots, from the launch's ScreenshotCamera extra (MAP-005). */
    val screenshotCamera: ScooterScreenshotCamera.Camera? =
        if (BuildConfig.DEBUG) ScooterScreenshotCamera.fromLaunchArguments(defaults) else null

    val controller = ScooterMapController(
        api = container.api,
        locationManager = location,
        defaults = defaults,
        scope = scope,
        directions = container.directions,
        openInMaps = container::openInMaps,
        phoneLanguages = container.languages::phoneLanguages,
        languageAtLaunch = languageAtLaunch,
        keepAppLanguages = container.languages::keep,
        analytics = analytics,
        start = container.start,
        debug = BuildConfig.DEBUG,
    )

    init {
        // On the main thread, as CLLocationManager's delegate calls the iPhone's model.
        location.delegate = object : AndroidLocationManager.Delegate {
            override fun authorizationChanged() = controller.authorizationChanged()

            override fun locationsUpdated(locations: List<ScooterLocationFix>) = controller.locationsUpdated(locations)

            override fun headingUpdated(heading: ScooterHeadingReading) = controller.headingUpdated(heading)

            override fun locationFailed(error: ScooterLocationError) = controller.locationFailed(error)
        }
    }

    private var hasStarted = false

    /**
     * The activity is being made again for a new configuration: a font size, a language, a density. The iPhone's
     * scene keeps its phase through such a change, so it is neither a leave nor a return.
     */
    private var recreating = false

    /**
     * The screen's first appearance starts the controller; each later one is a return to the foreground. The
     * location service hears of it first, so that the controller finds the permission as the rider left it.
     */
    override fun onStart(owner: LifecycleOwner) {
        if (!hasStarted) {
            hasStarted = true
            location.cameToForeground()
            analytics.track()
            analytics.track("app_open")
            controller.start()
        } else if (recreating) {
            recreating = false
        } else {
            location.cameToForeground()
            analytics.track("app_foreground")
            controller.becameActive()
        }
    }

    override fun onStop(owner: LifecycleOwner) {
        if ((owner as? Activity)?.isChangingConfigurations == true) {
            recreating = true
            return
        }
        controller.becameInactive()
        location.leftForeground()
    }

    override fun onCleared() {
        location.close()
        scope.cancel()
    }
}
