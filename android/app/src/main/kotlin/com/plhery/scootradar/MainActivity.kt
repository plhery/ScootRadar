package com.plhery.scootradar

import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.plhery.scootradar.app.AndroidLocationManager
import com.plhery.scootradar.app.LaunchArgumentDefaults
import com.plhery.scootradar.app.ScooterApplication
import com.plhery.scootradar.app.ScooterMapViewModel
import com.plhery.scootradar.map.ScooterMap
import com.plhery.scootradar.ui.ScooterMapScreen

/**
 * The app's one activity, edge to edge. It is AppCompat's so that a language chosen for the app applies from
 * its start on Android 12 (X-AD14); rotation, a resized window, dark mode and a language change reach it as
 * they are, without a new activity.
 */
class MainActivity : AppCompatActivity() {
    private val model: ScooterMapViewModel by viewModels {
        viewModelFactory {
            initializer {
                val container = (application as ScooterApplication).container
                val arguments = if (BuildConfig.DEBUG) LaunchArgumentDefaults.arguments(intent.extras) else emptyMap()
                ScooterMapViewModel(
                    container = container,
                    defaults = if (arguments.isEmpty()) container.defaults else LaunchArgumentDefaults(arguments, container.defaults),
                    languageAtLaunch = container.languages.choiceAtLaunch(),
                )
            }
        }
    }

    /** Android's location dialog, whose answer goes to the location service, as iOS's prompt does (LOG-242). */
    private val locationPermissions = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        model.location.permissionsAnswered()
    }
    private val permissionRequester = AndroidLocationManager.PermissionRequester { locationPermissions.launch(it) }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        // AppCompat has put a language chosen for the app in the activity's configuration by now.
        (application as ScooterApplication).container.languages.launched(resources.configuration)
        // Only this activity asks the rider, and only while it exists: the location service outlives it.
        model.location.permissionRequester = permissionRequester
        lifecycle.addObserver(model)
        setContent {
            ScooterMapScreen(
                controller = model.controller,
                map = { dark ->
                    ScooterMap(
                        controller = model.controller,
                        start = model.start,
                        memory = model.camera,
                        tiles = model.groundTiles,
                        dark = dark,
                        screenshot = model.screenshotCamera,
                        analytics = model.analytics,
                    )
                },
                analytics = model.analytics,
                addressSearch = model.addressSearch,
                defaults = (application as ScooterApplication).container.defaults,
                locationSettings = model.location,
            )
        }
    }

    override fun onDestroy() {
        if (model.location.permissionRequester === permissionRequester) model.location.permissionRequester = null
        super.onDestroy()
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        // The system bars' icons follow the window's light or dark.
        enableEdgeToEdge()
    }
}
