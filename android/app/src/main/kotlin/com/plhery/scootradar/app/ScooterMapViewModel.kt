package com.plhery.scootradar.app

import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ViewModel
import com.plhery.scootradar.BuildConfig
import com.plhery.scootradar.core.map.ScooterLocationManager
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterLanguageChoice
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
    locationManager: ScooterLocationManager = NotDeterminedLocationManager(),
) : ViewModel(), DefaultLifecycleObserver {
    // Dispatchers.Main, not viewModelScope's Main.immediate: the controller's work starts after the call that
    // asked for it returns, as a Swift Task does.
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val analytics = container.analytics

    val controller = ScooterMapController(
        api = container.api,
        locationManager = locationManager,
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

    private var hasStarted = false

    /** The screen's first appearance starts the controller; each later one is a return to the foreground. */
    override fun onStart(owner: LifecycleOwner) {
        if (!hasStarted) {
            hasStarted = true
            analytics.track()
            analytics.track("app_open")
            controller.start()
        } else {
            analytics.track("app_foreground")
            controller.becameActive()
        }
    }

    override fun onStop(owner: LifecycleOwner) {
        controller.becameInactive()
    }

    override fun onCleared() {
        scope.cancel()
    }
}
