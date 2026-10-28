package com.plhery.scootradar

import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
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

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        // AppCompat has put a language chosen for the app in the activity's configuration by now.
        (application as ScooterApplication).container.languages.launched(resources.configuration)
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
            )
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        // The system bars' icons follow the window's light or dark.
        enableEdgeToEdge()
    }
}
