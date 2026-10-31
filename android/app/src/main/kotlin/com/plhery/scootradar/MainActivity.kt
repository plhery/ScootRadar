package com.plhery.scootradar

import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import android.view.KeyEvent
import android.view.KeyboardShortcutGroup
import android.view.Menu
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.annotation.VisibleForTesting
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.Composable
import androidx.lifecycle.createSavedStateHandle
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.plhery.scootradar.app.AndroidLocationManager
import com.plhery.scootradar.app.AppLink
import com.plhery.scootradar.app.HeadingOrientationWatcher
import com.plhery.scootradar.app.LaunchArgumentDefaults
import com.plhery.scootradar.app.ScooterApplication
import com.plhery.scootradar.app.ScooterMapViewModel
import com.plhery.scootradar.app.ScreenOrientation
import com.plhery.scootradar.core.model.ScooterMapLink
import com.plhery.scootradar.map.ScooterMap
import com.plhery.scootradar.ui.ScooterMapScreen
import com.plhery.scootradar.ui.ScreenShortcuts
import com.plhery.scootradar.ui.keyboardShortcutGroups
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.receiveAsFlow

/**
 * The app's one activity, edge to edge. It is AppCompat's so that a language chosen for the app applies from
 * its start on Android 12 (X-AD14); rotation, a resized window, dark mode and a language change reach it as
 * they are, without a new activity. On a phone it stays upright, as the iPhone's app does; on a larger screen it
 * turns every way, as the iPad's does. A scootradar.com link to the map opens in it, or comes to it while it runs.
 */
class MainActivity : AppCompatActivity() {
    private val model: ScooterMapViewModel by viewModels {
        viewModelFactory {
            initializer {
                val container = (application as ScooterApplication).container
                val arguments = if (BuildConfig.DEBUG) LaunchArgumentDefaults.arguments(intent.extras) else emptyMap()
                container.analyticsSmokeTest = arguments[LaunchArgumentDefaults.ANALYTICS_SMOKE_TEST] == true
                ScooterMapViewModel(
                    container = container,
                    defaults = if (arguments.isEmpty()) container.defaults else LaunchArgumentDefaults(arguments, container.defaults),
                    languageAtLaunch = container.languages.choiceAtLaunch(),
                    savedState = createSavedStateHandle(),
                )
            }
        }
    }

    /** Android's location dialog, whose answer goes to the location service, as iOS's prompt does (LOG-242). */
    private val locationPermissions = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { answers ->
        model.location.permissionsAnswered(answers)
    }
    private val permissionRequester = AndroidLocationManager.PermissionRequester { locationPermissions.launch(it) }

    /** The compass reads the way the rider faces from the top of the window as it shows. */
    private val headingOrientation = HeadingOrientationWatcher(this) { model.controller.setHeadingOrientation(it) }

    /** The links to the map the phone opened in the app, the last one kept until the screen shows it. */
    @VisibleForTesting
    internal val links = Channel<ScooterMapLink>(Channel.CONFLATED)
    private val openedLinks = links.receiveAsFlow()

    /** What the screen's keys stand for now, which Android's keyboard shortcut helper lists. */
    @VisibleForTesting
    internal val shortcuts = ScreenShortcuts()

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        ScreenOrientation.apply(this)
        // AppCompat has put a language chosen for the app in the activity's configuration by now.
        (application as ScooterApplication).container.languages.launched(resources.configuration)
        // Only this activity asks the rider, and only while it exists: the location service outlives it.
        model.location.permissionRequester = permissionRequester
        lifecycle.addObserver(model)
        lifecycle.addObserver(headingOrientation)
        setContent {
            Screen { dark ->
                ScooterMap(
                    controller = model.controller,
                    start = model.start,
                    memory = model.camera,
                    tiles = model.groundTiles,
                    dark = dark,
                    screenshot = model.screenshotCamera,
                    analytics = model.analytics,
                )
            }
        }
        // The link that opened the app; an activity made again has it already.
        if (savedInstanceState == null) open(intent, launched = true)
    }

    /**
     * The screen over [map]: the app's own map, or a test's stand-in, as MapLibre's native library does not load in
     * a JVM test.
     */
    @VisibleForTesting
    @Composable
    internal fun Screen(map: @Composable (dark: Boolean) -> Unit) {
        ScooterMapScreen(
            controller = model.controller,
            map = map,
            analytics = model.analytics,
            addressSearch = model.addressSearch,
            defaults = (application as ScooterApplication).container.defaults,
            locationSettings = model.location,
            links = openedLinks,
            shortcuts = shortcuts,
        )
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        open(intent, launched = false)
    }

    /**
     * A link the phone opened in the app: one to the map shows its place; a page of the site goes on to the
     * browser, and an app opened only for it closes again.
     */
    private fun open(intent: Intent, launched: Boolean) {
        when (val link = AppLink.of(intent)) {
            null -> Unit
            is AppLink.Map -> links.trySend(link.link)
            is AppLink.Page -> {
                try {
                    startActivity(AppLink.browser(link.uri))
                } catch (_: ActivityNotFoundException) {
                    return
                }
                if (launched && isTaskRoot) finish()
            }
        }
    }

    /**
     * A key that nothing in the screen took, as when nothing has the focus, which Compose then gives no key: the
     * screen's shortcuts answer it, as an iPad's window answers its key commands whatever has the focus. Esc on the
     * screen with nothing to close does nothing, as UIKit drops it (UI-245), where Android would take it for Back
     * and leave the app. A sheet, form or popover takes Esc itself and closes (closedByEscape); one that has lost the
     * focus leaves it to Android, whose key maps make it Back on API 31 and not on API 37. The Back key itself still
     * goes back.
     */
    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean =
        shortcuts.handle(androidx.compose.ui.input.key.KeyEvent(event)) ||
            (keyCode == KeyEvent.KEYCODE_ESCAPE && shortcuts.situation?.isPresenting == false) ||
            super.onKeyDown(keyCode, event)

    /**
     * The screen's shortcuts in the helper Meta + / shows, as the iPad lists them in its menu bar (UI-102). A phone
     * lists none, as an iPhone has no menu bar; its keys work all the same.
     */
    override fun onProvideKeyboardShortcuts(data: MutableList<KeyboardShortcutGroup>, menu: Menu?, deviceId: Int) {
        super.onProvideKeyboardShortcuts(data, menu, deviceId)
        if (ScreenOrientation.smallestWidth(this) < ScreenOrientation.PHONE_UNDER) return
        data += keyboardShortcutGroups(shortcuts.situation, applicationInfo.loadLabel(packageManager))
    }

    override fun onDestroy() {
        if (model.location.permissionRequester === permissionRequester) model.location.permissionRequester = null
        super.onDestroy()
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        // The system bars' icons follow the window's light or dark.
        enableEdgeToEdge()
        // A foldable unfolded or folded is on another screen.
        ScreenOrientation.apply(this)
        headingOrientation.displayChanged()
    }
}
