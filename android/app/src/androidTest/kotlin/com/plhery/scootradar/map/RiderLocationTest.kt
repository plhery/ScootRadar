package com.plhery.scootradar.map

import android.Manifest
import android.app.Activity
import android.graphics.Bitmap
import android.os.ParcelFileDescriptor
import android.view.Surface
import android.view.View
import android.view.ViewGroup
import androidx.compose.ui.test.ComposeTimeoutException
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.core.content.ContextCompat
import androidx.core.view.children
import androidx.lifecycle.ViewModelProvider
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import com.plhery.scootradar.MainActivity
import com.plhery.scootradar.app.AndroidLocationManager
import com.plhery.scootradar.app.ScooterMapViewModel
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.distance
import com.plhery.scootradar.core.model.localized
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.style.layers.SymbolLayer
import java.io.File
import java.util.regex.Pattern

/**
 * The rider's location on a phone, as the app runs it (logic.md LOG-241 to LOG-260, map.md MAP-186 to MAP-198,
 * ui.md UI-090, UI-091, UI-095, UI-162 to UI-165, UI-310): Android's dialog answered both ways, a fix from the
 * emulator's GPS moving the map there under the dot, location off for the whole phone, no fix within 5 s, and the
 * phone turned with the dot and its beam on the map.
 *
 * Each test starts from an app never asked, with location on. Revoking a permission ends the app's process, and
 * this test's with it, so rider-location-pass.sh beside these tests resets the app after each, and sends the
 * emulator's GPS a fix every 2 s for the tests that need one, which only the host can do (`adb emu geo fix`). The
 * screens are kept in the run's additional output, as rider-*.png.
 */
@RunWith(AndroidJUnit4::class)
class RiderLocationTest {
    @get:Rule
    val compose = createEmptyComposeRule()

    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val device = UiDevice.getInstance(instrumentation)
    private var scenario: ActivityScenario<MainActivity>? = null
    private lateinit var activity: MainActivity
    private lateinit var controller: ScooterMapController
    private lateinit var location: AndroidLocationManager

    @After
    fun tearDown() {
        scenario?.close()
        device.setOrientationNatural()
        device.unfreezeRotation()
        shell("cmd location set-location-enabled true")
        for (provider in providers) shell("cmd location providers remove-test-provider $provider")
    }

    @Test
    fun noFixWithinFiveSecondsSaysTheRiderCouldNotBeFound() {
        grant()
        // The emulator's network location answers from where its connection seems to be, without a GPS fix: the
        // phone's providers give way to test providers, which locate nothing.
        shell("appops set 2000 android:mock_location allow")
        for (provider in providers) {
            shell("cmd location providers add-test-provider $provider")
            shell("cmd location providers set-test-provider-enabled $provider true")
        }
        // Allowed at launch, the app looks for the rider as it starts (LOG-243).
        val launching = System.nanoTime()
        launch()
        val launched = System.nanoTime()
        waitFor(15_000) { controller.locationIssue.value == ScooterLocationIssue.NotFound }
        val found = System.nanoTime()
        assertTrue("Gave up ${(found - launching) / 1e9} s after the launch began", (found - launching) / 1e9 >= 4.9)
        assertTrue("Gave up ${(found - launched) / 1e9} s after the launch", (found - launched) / 1e9 <= 8.0)
        assertFalse(controller.isLocating.value)
        compose.onNodeWithText(ScooterLocationIssue.NotFound.message).assertExists()
        screenshot("rider-not-found")

        // Try again looks again, and gives up again, 5 s later.
        val retried = System.nanoTime()
        compose.onNodeWithText(localized("Try again")).performClick()
        waitFor(5_000) { controller.isLocating.value && controller.locationIssue.value == null }
        waitFor(15_000) { controller.locationIssue.value == ScooterLocationIssue.NotFound }
        val waited = (System.nanoTime() - retried) / 1e9
        assertTrue("Gave up again after $waited s", waited in 4.9..8.0)
    }

    @Test
    fun theDialogRefusedShowsTheLocationCard() {
        launch()
        assertEquals(ScooterAuthorizationStatus.NotDetermined, location.authorizationStatus)
        // Not asked at launch (LOG-242): only Near me asks.
        assertFalse(dialogShown())
        compose.onNodeWithContentDescription(localized("Near me")).performClick()
        val deny = device.wait(Until.findObject(By.res(Pattern.compile(".*:id/permission_deny_button"))), DIALOG_WAIT)
        assertNotNull("Android's location dialog", deny)
        screenshot("rider-dialog")
        deny.click()

        waitFor(10_000) { controller.locationIssue.value == ScooterLocationIssue.Denied }
        assertEquals(ScooterAuthorizationStatus.Denied, location.authorizationStatus)
        compose.onNodeWithText(localized("Location is off")).assertExists()
        compose.onNodeWithText(localized("Open Settings")).assertExists()
        screenshot("rider-refused")
        compose.onNodeWithContentDescription(localized("Dismiss")).performClick()
        waitFor(5_000) { controller.locationIssue.value == null }
    }

    @Test
    fun theDialogAllowedMovesTheMapToTheRiderWithAFix() {
        launch()
        compose.onNodeWithContentDescription(localized("Near me")).performClick()
        val allow = device.wait(Until.findObject(By.res(Pattern.compile(".*:id/permission_allow_foreground_only_button"))), DIALOG_WAIT)
        assertNotNull("Android's location dialog", allow)
        allow.click()

        waitFor(FIX_WAIT) { controller.userLocation.value != null }
        assertEquals(ScooterAuthorizationStatus.AuthorizedWhenInUse, location.authorizationStatus)
        val rider = controller.userLocation.value!!
        assertTrue("$rider is the emulator's fix", rider.distance(to = zurichHB) < 50)
        // The map comes to the rider, and the dot is drawn there, in its ring.
        waitFor(10_000) {
            controller.viewport.value.contains(rider) && drawn(ScooterMarkerLayers.RIDER) && drawn(ScooterMarkerLayers.RIDER_RING)
        }
        assertTrue(controller.hasLocatedOnce.value)
        compose.waitUntil(5_000) { compose.onAllNodesWithContentDescription(localized("Go to my location")).fetchSemanticsNodes().isNotEmpty() }
        compose.waitForIdle()
        screenshot("rider-located")
    }

    /** Run after [theDialogAllowedMovesTheMapToTheRiderWithAFix], without a reset: the app's process is new. */
    @Test
    fun theRiderLocatedOnceIsRememberedAfterARestartWithAFix() {
        launch()
        assertTrue(controller.hasLocatedOnce.value)
        compose.onNodeWithContentDescription(localized("Go to my location")).assertExists()
        assertTrue(compose.onAllNodesWithContentDescription(localized("Near me")).fetchSemanticsNodes().isEmpty())
    }

    @Test
    fun locationOffShowsTheCardWhoseSettingsAreTheLocationSwitch() {
        grant()
        shell("cmd location set-location-enabled false")
        launch()
        // Allowed, but the phone does not locate: iOS calls that refused (LOG-247).
        assertEquals(ScooterAuthorizationStatus.Denied, location.authorizationStatus)
        compose.onNodeWithContentDescription(localized("Near me")).performClick()
        waitFor(5_000) { controller.locationIssue.value == ScooterLocationIssue.Denied }
        compose.onNodeWithText(ScooterLocationIssue.Denied.message).assertExists()
        assertFalse("No dialog for a phone with location off", dialogShown())
        screenshot("rider-location-off")

        compose.onNodeWithText(localized("Open Settings")).performClick()
        assertNotNull(device.wait(Until.findObject(By.text(Pattern.compile("Use location", Pattern.CASE_INSENSITIVE))), 10_000))
        screenshot("rider-location-settings")
        device.pressBack()
    }

    @Test
    fun aTurnOfThePhoneKeepsTheDotAndItsBeamWithAFix() {
        grant()
        launch()
        waitFor(FIX_WAIT) { controller.userLocation.value != null }
        // The emulator's compass: its virtual accelerometer, gyroscope and magnetometer, fused by Android.
        waitFor(10_000) { controller.userHeading.value != null }
        waitFor(10_000) { drawn(ScooterMarkerLayers.RIDER) && beamShown() }
        screenshot("rider-portrait")

        device.setOrientationLandscape()
        compose.waitUntil(10_000) { rotation() == Surface.ROTATION_90 || rotation() == Surface.ROTATION_270 }
        // The same activity, the rider and the beam still drawn where the turned map shows them.
        waitFor(10_000) { drawn(ScooterMarkerLayers.RIDER) && drawn(ScooterMarkerLayers.RIDER_RING) && beamShown() }
        assertTrue(scenario!!.state.isAtLeast(androidx.lifecycle.Lifecycle.State.RESUMED))
        activity.let { turned -> scenario!!.onActivity { assertTrue(it === turned) } }
        compose.waitForIdle()
        screenshot("rider-landscape")
    }

    /** Waits for [condition], or fails saying where the rider's location stands. */
    private fun waitFor(timeoutMillis: Long, condition: () -> Boolean) {
        try {
            compose.waitUntil(timeoutMillis, condition)
        } catch (timeout: ComposeTimeoutException) {
            throw AssertionError(
                "After $timeoutMillis ms: ${location.authorizationStatus}, locating ${controller.isLocating.value}, " +
                    "issue ${controller.locationIssue.value}, rider ${controller.userLocation.value}, " +
                    "heading ${controller.userHeading.value}, beam opacity ${beamOpacity()}",
                timeout,
            )
        }
    }

    private fun launch() {
        val scenario = ActivityScenario.launch(MainActivity::class.java).also { this.scenario = it }
        scenario.onActivity {
            activity = it
            val model = ViewModelProvider(it)[ScooterMapViewModel::class.java]
            controller = model.controller
            location = model.location
        }
        compose.waitUntil(30_000) { map != null }
    }

    /** The map, once MapLibre has it ready. */
    private val map: MapLibreMap?
        get() {
            var map: MapLibreMap? = null
            instrumentation.runOnMainSync { activity.window.decorView.findMap()?.getMapAsync { map = it } }
            return map
        }

    private fun View.findMap(): ScooterMapView? =
        this as? ScooterMapView ?: (this as? ViewGroup)?.children?.firstNotNullOfOrNull { it.findMap() }

    /** Whether the map draws [layer] at the rider's place. */
    private fun drawn(layer: String): Boolean {
        val map = map ?: return false
        val rider = controller.userLocation.value ?: return false
        var drawn = false
        instrumentation.runOnMainSync {
            val point = map.projection.toScreenLocation(LatLng(rider.latitude, rider.longitude))
            drawn = map.queryRenderedFeatures(point, layer).isNotEmpty()
        }
        return drawn
    }

    /** Whether the beam is drawn and showing, as it does with a heading. */
    private fun beamShown(): Boolean = beamOpacity() == 1f && drawn(ScooterMarkerLayers.RIDER_BEAM)

    private fun beamOpacity(): Float? {
        val map = map ?: return null
        var opacity: Float? = null
        instrumentation.runOnMainSync {
            opacity = (map.style?.getLayer(ScooterMarkerLayers.RIDER_BEAM) as? SymbolLayer)?.iconOpacity?.value
        }
        return opacity
    }

    private fun rotation(): Int {
        var rotation = Surface.ROTATION_0
        instrumentation.runOnMainSync { rotation = ContextCompat.getDisplayOrDefault(activity as Activity).rotation }
        return rotation
    }

    private fun dialogShown(): Boolean = device.hasObject(By.res(Pattern.compile(".*:id/permission_deny_button")))

    private fun grant() {
        val automation = instrumentation.uiAutomation
        val app = instrumentation.targetContext.packageName
        automation.grantRuntimePermission(app, Manifest.permission.ACCESS_FINE_LOCATION)
        automation.grantRuntimePermission(app, Manifest.permission.ACCESS_COARSE_LOCATION)
    }

    private fun shell(command: String) {
        ParcelFileDescriptor.AutoCloseInputStream(instrumentation.uiAutomation.executeShellCommand(command)).use { it.readBytes() }
    }

    /** The screen now, kept as [name].png in the run's additional output. */
    private fun screenshot(name: String) {
        val bitmap = instrumentation.uiAutomation.takeScreenshot()
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            File(dir).mkdirs()
            File(dir, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
    }

    private companion object {
        /** Where rider-location-pass.sh puts the emulator: Zürich's main station. */
        val zurichHB = GeoPoint(47.3782, 8.5402)
        const val DIALOG_WAIT = 10_000L
        const val FIX_WAIT = 30_000L
        val providers = listOf("fused", "gps", "network")
    }
}
