package com.plhery.scootradar.map

import android.Manifest
import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.PointF
import android.os.ParcelFileDescriptor
import android.os.Process
import android.os.SystemClock
import android.util.Log
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
import com.plhery.scootradar.core.map.ScooterHeadingReading
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.ScooterUserHeading
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.distance
import com.plhery.scootradar.core.model.localized
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.MapView
import org.maplibre.android.style.layers.SymbolLayer
import org.maplibre.android.style.layers.TransitionOptions
import java.io.File
import java.time.Instant
import java.util.Locale
import java.util.Random
import java.util.regex.Pattern
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

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

    @Before
    fun setUp() {
        // In a run of every test, these would find the app as the test before left it, and leave it located for
        // the tests after: only rider-location-pass.sh runs them.
        assumeTrue("run by rider-location-pass.sh", InstrumentationRegistry.getArguments().getString("riderLocationPass") == "true")
    }

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
    fun aTurnOfThePhoneKeepsTheScreenUprightAndTheDotAndItsBeamWithAFix() {
        grant()
        launch()
        waitFor(FIX_WAIT) { controller.userLocation.value != null }
        // The emulator's compass: its virtual accelerometer, gyroscope and magnetometer, fused by Android.
        waitFor(10_000) { controller.userHeading.value != null }
        waitFor(10_000) { drawn(ScooterMarkerLayers.RIDER) && beamShown() }
        screenshot("rider-portrait")

        // A phone's screen stays upright, as the iPhone's app does; a tablet's or an unfolded foldable's turns, as the
        // iPad's does (UI-375). A phone's by the screen's own size, under Android's 600 dp line for a tablet (the
        // widest iPhone is 440 points across, iPad mini 744), not by what the app makes of it.
        val phone = device.displaySizeDp.let { min(it.x, it.y) } < 600
        val wasWide = wide()
        if (wasWide) device.setOrientationPortrait() else device.setOrientationLandscape()
        Thread.sleep(2_000)
        if (phone) assertEquals(Surface.ROTATION_0, rotation()) else assertTrue("the screen turned", wide() != wasWide)
        // The same activity, the rider and the beam still drawn.
        waitFor(10_000) { drawn(ScooterMarkerLayers.RIDER) && drawn(ScooterMarkerLayers.RIDER_RING) && beamShown() }
        assertTrue(scenario!!.state.isAtLeast(androidx.lifecycle.Lifecycle.State.RESUMED))
        activity.let { turned -> scenario!!.onActivity { assertTrue(it === turned) } }
        compose.waitForIdle()
        screenshot("rider-turned")
    }

    @Test
    fun theBeamPointsTheWayTheRiderFacesOnATurnedAndTiltedMapWithAFix() {
        grant()
        launch()
        waitFor(FIX_WAIT) { controller.userLocation.value != null }
        takeTheCompass()
        // North on a map turned to face east, which shows it to the left; then turned and tilted, where the way on
        // the screen is furthest from the compass's (MAP-193).
        for ((bearing, tilt, heading) in listOf(Triple(90.0, 0.0, 0.0), Triple(0.0, 50.0, 45.0), Triple(300.0, 50.0, 200.0))) {
            look(bearing = bearing, tilt = tilt)
            face(null)
            waitFor(5_000) { beamOpacity() == 0f }
            Thread.sleep(SETTLE)
            val without = instrumentation.uiAutomation.takeScreenshot()
            face(heading)
            waitFor(5_000) { beamShown() }
            Thread.sleep(SETTLE)
            val with = instrumentation.uiAutomation.takeScreenshot()
            screenshot("rider-beam-bearing${bearing.toInt()}-tilt${tilt.toInt()}-heading${heading.toInt()}", with)
            val expected = Math.toDegrees(screenAngle(heading))
            val drawn = beamAxis(without, with)
            assertTrue(
                "Bearing $bearing°, tilt $tilt°, heading $heading°: the beam points $drawn°, the way $expected° on the screen",
                angleBetween(drawn, expected) <= 5,
            )
        }
    }

    /**
     * Not a check but a measure, run by hand (the review of app-e, finding 3: each turn of the beam lays the rider's
     * layers out again). Over 10 s each, the frames MapLibre draws, how many of them whole, how long each took to
     * encode and render, and the app's CPU time: the map still with the rider off it, with the beam hidden, and with
     * the compass turning as in a hand; the map turning with the beam hidden, showing still, and with the compass
     * turning; tilted 20°, as the map opens, then flat and tilted 50°; and last the dot's breath with the style's
     * own transitions back on, its paint transitions, its name fades and both. An emulator draws as often as MapLibre asks, not at the screen's rate. Written to
     * rider-frame-times.txt in the run's additional output. With the app allowed and a fix every 2 s, as
     * rider-location-pass.sh gives them:
     *
     *     adb -s emulator-5660 shell am instrument -w -e riderLocationPass true -e riderFrameTimes true \
     *         -e class com.plhery.scootradar.map.RiderLocationTest#theBeamsFrameTimesWithAFix \
     *         -e additionalTestOutputDir /sdcard/Android/media/com.plhery.scootradar/additional_test_output \
     *         com.plhery.scootradar.test/androidx.test.runner.AndroidJUnitRunner
     */
    @Test
    fun theBeamsFrameTimesWithAFix() {
        assumeTrue("run by hand", InstrumentationRegistry.getArguments().getString("riderFrameTimes") == "true")
        grant()
        launch()
        waitFor(FIX_WAIT) { controller.userLocation.value != null }
        takeTheCompass()
        // A hand's compass: 2° to 8° either way, ten times a second.
        val random = Random(66)
        var heading = 0.0
        val hand = {
            heading = (heading + (2 + random.nextDouble() * 6) * (if (random.nextBoolean()) 1 else -1) + 360) % 360
            face(heading)
        }
        val still = { face(heading) }
        val lines = mutableListOf<String>()
        for (tilt in listOf(20.0, 0.0, 50.0)) {
            if (tilt == 20.0) {
                look(bearing = 0.0, tilt = tilt)
                face(null)
                // The map with the rider 2 km off it: nothing of the rider's written.
                val rider = controller.userLocation.value!!
                val map = map!!
                instrumentation.runOnMainSync {
                    map.moveCamera(CameraUpdateFactory.newLatLng(LatLng(rider.latitude + 0.02, rider.longitude)))
                }
                Thread.sleep(3_000)
                lines += measure("tilt 20, map still, rider off it", turnMap = false) {}
                look(bearing = 0.0, tilt = tilt)
                lines += measure("tilt 20, map still, no beam", turnMap = false) {}
                face(heading)
                lines += measure("tilt 20, map still, compass turning", turnMap = false, hand)
                face(null)
                lines += measure("tilt 20, map turning, no beam", turnMap = true) {}
            }
            look(bearing = 0.0, tilt = tilt)
            face(heading)
            lines += measure("tilt ${tilt.toInt()}, map turning, beam still", turnMap = true, still)
            if (tilt == 20.0) lines += measure("tilt 20, map turning, compass turning", turnMap = true, hand)
        }
        // The dot's breath with the map's labels placed at once, not faded in over the style's transition.
        look(bearing = 0.0, tilt = 20.0)
        face(null)
        val map = map!!
        // The style's own transitions, off in the app: either alone has the map drawn every frame while the dot shows.
        val off = map.style!!.transition
        lines += "style transition $off"
        for ((name, transition) in listOf(
            "the style's paint transitions" to TransitionOptions(300, 0, false),
            "the style's name fades" to TransitionOptions(0, 0, true),
            "both, MapLibre's default" to TransitionOptions(300, 0, true),
        )) {
            instrumentation.runOnMainSync { map.style?.transition = transition }
            lines += measure("tilt 20, map still, no beam, with $name", turnMap = false) {}
        }
        instrumentation.runOnMainSync { map.style?.transition = off }
        val report = lines.joinToString("\n")
        Log.i("RiderFrameTimes", report)
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            File(dir).mkdirs()
            File(dir, "rider-frame-times.txt").writeText(report + "\n")
        }
    }

    /** The compass is the test's from here: the emulator's, lying still, would only say the same, or nothing. */
    private fun takeTheCompass() {
        instrumentation.runOnMainSync { location.stopUpdatingHeading() }
        // The map's own move to the rider, started by the app's collectors, which run as the test idles, and done.
        compose.waitForIdle()
        Thread.sleep(3_000)
        compose.waitForIdle()
    }

    /** The compass says the rider faces [degrees] from true north, or nothing it can be sure of. */
    private fun face(degrees: Double?) {
        val reading = ScooterHeadingReading(
            trueHeading = degrees ?: -1.0,
            magneticHeading = degrees ?: 0.0,
            headingAccuracy = if (degrees == null) -1.0 else 10.0,
            timestamp = Instant.now(),
        )
        instrumentation.runOnMainSync { controller.headingUpdated(reading) }
    }

    /** The map on the rider, close up, turned and tilted so. */
    private fun look(bearing: Double, tilt: Double) {
        val map = map!!
        val rider = controller.userLocation.value!!
        val camera = CameraPosition.Builder().target(LatLng(rider.latitude, rider.longitude)).zoom(17.0).bearing(bearing).tilt(tilt).build()
        instrumentation.runOnMainSync { map.moveCamera(CameraUpdateFactory.newCameraPosition(camera)) }
        waitFor(5_000) { drawn(ScooterMarkerLayers.RIDER) }
    }

    /** The way the rider faces, [heading], on the screen, in radians clockwise from up, as MAP-193 has it. */
    private fun screenAngle(heading: Double): Double {
        val map = map!!
        val view = mapView!!
        val rider = controller.userLocation.value!!
        var angle = Double.NaN
        instrumentation.runOnMainSync {
            val facing = ScooterUserHeading(trueHeading = heading, magneticHeading = heading, accuracy = 10.0)!!
            angle = facing.screenAngle(at = rider, on = MapLibreProjection(map, view))!!
        }
        return angle
    }

    /**
     * The way the beam points from the dot, in degrees clockwise from up: the mean of the ways the screen turned
     * bluer from [without] to [with], 20 dp to 60 dp out (past the breathing dot and its ring), weighted by how much.
     */
    private fun beamAxis(without: Bitmap, with: Bitmap): Double {
        val map = map!!
        val view = mapView!!
        val rider = controller.userLocation.value!!
        var centre = PointF()
        val origin = IntArray(2)
        instrumentation.runOnMainSync {
            centre = map.projection.toScreenLocation(LatLng(rider.latitude, rider.longitude))
            view.getLocationOnScreen(origin)
        }
        val density = instrumentation.targetContext.resources.displayMetrics.density
        var east = 0.0
        var north = 0.0
        for (step in 0 until 180) {
            val angle = step * 2 * PI / 180
            var gain = 0.0
            for (distance in 20..60 step 2) {
                val x = (origin[0] + centre.x + distance * density * sin(angle)).toInt()
                val y = (origin[1] + centre.y - distance * density * cos(angle)).toInt()
                if (x !in 0 until with.width || y !in 0 until with.height) continue
                val before = without.getPixel(x, y)
                val after = with.getPixel(x, y)
                gain += max(0, (Color.blue(after) - Color.blue(before)) + (Color.red(before) - Color.red(after)))
            }
            east += gain * sin(angle)
            north += gain * cos(angle)
        }
        return (Math.toDegrees(atan2(east, north)) + 360) % 360
    }

    private fun angleBetween(first: Double, second: Double): Double {
        val difference = abs(first - second) % 360
        return if (difference > 180) 360 - difference else difference
    }

    /**
     * MapLibre's frames over 10 s, those drawn whole (with no layout or tile still on its way), their draw calls and
     * times, and the app's CPU time, with the map turning by 170° each 5 s if [turnMap], and [compass] ten times a
     * second; and whether the beam showed halfway, kept as a screenshot.
     */
    private fun measure(name: String, turnMap: Boolean, compass: () -> Unit): String {
        val map = map!!
        val view = mapView!!
        val times = mutableListOf<Double>()
        var full = 0
        var drawCalls = 0L
        val frames = MapView.OnDidFinishRenderingFrameWithStatsListener { fully, stats ->
            synchronized(times) {
                times += (stats.encodingTime + stats.renderingTime) * 1000
                if (fully) full += 1
                drawCalls += stats.numDrawCalls
            }
        }
        val turn = { instrumentation.runOnMainSync { map.easeCamera(CameraUpdateFactory.bearingTo(map.cameraPosition.bearing + 170), 5_000, false) } }
        instrumentation.runOnMainSync { view.addOnDidFinishRenderingFrameListener(frames) }
        val cpu = Process.getElapsedCpuTime()
        val start = SystemClock.uptimeMillis()
        if (turnMap) turn()
        var halfway = false
        var beam = false
        while (SystemClock.uptimeMillis() - start < 10_000) {
            if (!halfway && SystemClock.uptimeMillis() - start >= 5_000) {
                halfway = true
                beam = beamOpacity() == 1f
                screenshot("rider-frame-times-" + name.replace(Regex("[^a-z0-9]+"), "-"))
                if (turnMap) turn()
            }
            compass()
            // The app's collectors, which the test's dispatcher runs only as it idles, take the reading.
            compose.waitForIdle()
            Thread.sleep(100)
        }
        val used = Process.getElapsedCpuTime() - cpu
        instrumentation.runOnMainSync {
            view.removeOnDidFinishRenderingFrameListener(frames)
            map.cancelTransitions()
        }
        val sorted = synchronized(times) { times.sorted() }
        return String.format(
            Locale.ROOT,
            "%-40s beam %-5s %4d frames (%4d whole)  draw calls %5.1f  draw mean %5.2f ms  p95 %5.2f ms  max %6.2f ms  app CPU %5d ms",
            name,
            beam,
            sorted.size,
            full,
            drawCalls.toDouble() / max(1, sorted.size),
            if (sorted.isEmpty()) 0.0 else sorted.average(),
            sorted.getOrElse((sorted.size * 0.95).toInt()) { sorted.lastOrNull() ?: 0.0 },
            sorted.lastOrNull() ?: 0.0,
            used,
        )
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

    private val mapView: ScooterMapView?
        get() {
            var view: ScooterMapView? = null
            instrumentation.runOnMainSync { view = activity.window.decorView.findMap() }
            return view
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

    /** Whether the activity's window is wider than it is tall. */
    private fun wide(): Boolean {
        var wide = false
        instrumentation.runOnMainSync { activity.window.decorView.let { wide = it.width > it.height } }
        return wide
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

    /** The screen now, or [bitmap], kept as [name].png in the run's additional output. */
    private fun screenshot(name: String, bitmap: Bitmap = instrumentation.uiAutomation.takeScreenshot()) {
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

        /** Long enough for MapLibre to lay out and draw a change. */
        const val SETTLE = 600L
        val providers = listOf("fused", "gps", "network")
    }
}
