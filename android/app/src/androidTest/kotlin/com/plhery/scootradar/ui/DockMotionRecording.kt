package com.plhery.scootradar.ui

import android.os.ParcelFileDescriptor
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityNodeInfo
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.InterceptPlatformTextInput
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.BySelector
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterDeviceOrientation
import com.plhery.scootradar.core.map.ScooterLocationError
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterLocationManager
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.hideWalkingRoute
import com.plhery.scootradar.core.map.showWalkingRoute
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.map.GroundTiles
import com.plhery.scootradar.map.MapCameraMemory
import com.plhery.scootradar.map.ScooterMap
import com.plhery.scootradar.map.zurichStart
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import okhttp3.OkHttpClient
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule
import org.junit.runner.RunWith
import org.junit.runners.model.Statement
import java.io.File
import java.time.Instant
import java.util.Locale
import java.util.regex.Pattern

/**
 * Films the dock's transitions (ui.md §4) over the live map with `screenrecord`, one film for each kind, in
 * /sdcard/Movies/app-c/. Only with the argument recordMotion=true; otherwise each test passes without doing anything.
 * With ground=plain the map is a plain ground, whose still pixels let a film be measured frame by frame. No compose
 * rule: its test clock would move the animations only while the test waits for it, and the films need them in real
 * time.
 */
@RunWith(AndroidJUnit4::class)
class DockMotionRecording {
    // Not an assumption: the connected run's results count a test skipped by one as failed.
    @get:Rule
    val onlyWhenAsked = TestRule { test, _ ->
        if (InstrumentationRegistry.getArguments().getString("recordMotion") == "true") test
        else object : Statement() {
            override fun evaluate() {}
        }
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val plainGround = InstrumentationRegistry.getArguments().getString("ground") == "plain"
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current
    private val tiles = GroundTiles.openFreeMap(OkHttpClient())
    private val api = HeldAPI()
    private val location = AuthorizedLocation()
    private val directions = HeldDirections()
    private var scenario: ActivityScenario<ComponentActivity>? = null

    @Before
    fun setUp() {
        Locale.setDefault(Locale.UK)
        ScooterLanguage.current = ScooterLanguage.En
        shell("mkdir -p $FOLDER")
    }

    @After
    fun tearDown() {
        scenario?.close()
        scope.cancel()
        ScooterLanguage.current = language
        Locale.setDefault(locale)
    }

    /**
     * UI-195 and UI-203: the summary becomes a scooter's card, glow and all, and the card the summary again. Once
     * before the film, as each film's change is where it can be: a card drawn for the first time stalls a debug
     * build's frames.
     */
    @Test
    fun dockKind() {
        val controller = show()
        main { controller.selectScooter("lime:a") }
        Thread.sleep(1_500)
        main { controller.selectScooter(null) }
        Thread.sleep(1_500)
        record("ui195-dock-kind", seconds = 5) {
            main { controller.selectScooter("lime:a") }
            Thread.sleep(2_000)
            main { controller.selectScooter(null) }
        }
    }

    /** UI-207 and UI-195: "Finding scooters…" with its spinner, then the count and the chips. */
    @Test
    fun findingThenSummary() {
        api.holds = true
        val controller = show(loaded = false)
        record("ui207-finding-then-summary", seconds = 4) {
            Thread.sleep(1_500)
            api.release()
        }
        check(controller.lastUpdated.value != null)
    }

    /** UI-199 and UI-201: Voi passes Lime, the chips slide to their places and the counts roll. */
    @Test
    fun chipsReorder() {
        val controller = show()
        api.scooters = reordered
        main { controller.refresh() }
        Thread.sleep(1_500)
        api.scooters = scooters
        main { controller.refresh() }
        Thread.sleep(1_500)
        record("ui199-201-chips-reorder", seconds = 4) {
            api.scooters = reordered
            main { controller.refresh() }
        }
    }

    /**
     * UI-193: a first load that failed slides its banner in under the search bar; Try again takes it away. Drawn for
     * the first time in the film.
     */
    @Test
    fun topNotice() {
        api.holds = true
        api.failure = ScooterAPIError.Offline()
        val controller = show(loaded = false)
        record("ui193-top-notice", seconds = 6) {
            api.release()
            Thread.sleep(2_500)
            api.failure = null
            api.holds = false
            main { controller.retryLoad() }
        }
    }

    /**
     * UI-193: the card of a location that can't be had slides in under the search bar, and goes as it is dismissed;
     * once before the film.
     */
    @Test
    fun locationCard() {
        val controller = show()
        location.authorizationStatus = ScooterAuthorizationStatus.Denied
        main { controller.locationFailed(ScooterLocationError.Denied) }
        Thread.sleep(1_500)
        main { controller.dismissLocationIssue() }
        Thread.sleep(1_500)
        // Another issue, which shows again.
        location.authorizationStatus = ScooterAuthorizationStatus.Restricted
        record("ui193-location-card", seconds = 5) {
            main { controller.locationFailed(ScooterLocationError.Denied) }
            Thread.sleep(2_000)
            main { controller.dismissLocationIssue() }
        }
    }

    /**
     * UI-193 after app-r's stage 1: the first notice (a first load that failed) fades in where it rests, a second (a
     * location that can't be had) joins under it on the spring, the first goes as the load is tried again and the
     * second slides up into its place, and the last fades out where it was as it is dismissed. Once before the film,
     * on a screen of its own, as a first load fails only once.
     */
    @Test
    fun notices() {
        repeat(2) { take ->
            api.holds = true
            api.failure = ScooterAPIError.Offline()
            location.authorizationStatus = ScooterAuthorizationStatus.Denied
            scenario?.close()
            val controller = show(loaded = false)
            val steps = {
                api.release()
                Thread.sleep(2_000)
                main { controller.locationFailed(ScooterLocationError.Denied) }
                Thread.sleep(2_000)
                api.failure = null
                main { controller.retryLoad() }
                Thread.sleep(2_000)
                main { controller.dismissLocationIssue() }
            }
            if (take == 0) steps() else record("ui193-notices", seconds = 9, action = steps)
            Thread.sleep(1_000)
        }
    }

    /** UI-198: Directions finds the way (the label and its spinner), shows it, and hides it again; once before the film. */
    @Test
    fun walkPhase() {
        val controller = show()
        // The first fix takes the map to the rider and loads again: the card opens once that is done.
        main { controller.locationsUpdated(listOf(ScooterLocationFix(rider, horizontalAccuracy = 10.0, timestamp = Instant.now()))) }
        Thread.sleep(if (plainGround) 1_500 else 5_000)
        main { controller.selectScooter("lime:a") }
        Thread.sleep(1_500)
        // The second film takes the first's place.
        repeat(2) {
            directions.hold()
            record("ui198-walk-phase", seconds = 6) {
                main { controller.showWalkingRoute(ScooterWalkTarget.Scooter(scooters.first())) }
                Thread.sleep(1_500)
                directions.release()
                Thread.sleep(2_000)
                main { controller.hideWalkingRoute() }
            }
        }
    }

    /** UI-069 and UI-198: no way is found, and the card's note says so as it fades in; once before the film. */
    @Test
    fun walkNote() {
        directions.fails = true
        val controller = show()
        main { controller.locationsUpdated(listOf(ScooterLocationFix(rider, horizontalAccuracy = 10.0, timestamp = Instant.now()))) }
        Thread.sleep(if (plainGround) 1_500 else 5_000)
        repeat(2) {
            main { controller.selectScooter("lime:a") }
            Thread.sleep(1_500)
            directions.hold()
            record("ui069-walk-note", seconds = 5) {
                main { controller.showWalkingRoute(ScooterWalkTarget.Scooter(scooters.first())) }
                Thread.sleep(1_000)
                directions.release()
                Thread.sleep(2_000)
                main { controller.selectScooter(null) }
            }
            Thread.sleep(1_000)
        }
    }

    /**
     * UI-211: a finger held on Directions (a dock button: it dims at once), on the search bar and on Near me (glass:
     * they swell on a spring and light up), each let go off the button, so that nothing is done.
     */
    @Test
    fun pressed() {
        val controller = show()
        main { controller.selectScooter("lime:a") }
        Thread.sleep(1_500)
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        val targets = listOf("Directions", "Settings", "Near me").map { name ->
            val found = device.wait(Until.findObject(By.desc(name)), 5_000) ?: device.findObject(By.text(name))
            checkNotNull(found) { "no $name" }.visibleBounds
        }
        fun press() = targets.forEach { bounds ->
            val (x, y) = bounds.centerX() to bounds.centerY()
            shell("input motionevent DOWN $x $y")
            Thread.sleep(1_200)
            // Off the button before it is let go: no tap.
            shell("input motionevent MOVE $x ${y - 400}")
            shell("input motionevent UP $x ${y - 400}")
            Thread.sleep(1_000)
        }
        press()
        record("ui211-pressed", seconds = 9) { press() }
    }

    /** UI-204: the first fix turns Near me into the round locate button, over a still map that the fix can't move. */
    @Test
    fun nearMeBecomesRound() {
        val controller = show(liveMap = false)
        record("ui204-near-me", seconds = 4) {
            main {
                controller.locationsUpdated(listOf(ScooterLocationFix(rider, horizontalAccuracy = 10.0, timestamp = Instant.now())))
            }
        }
    }

    /**
     * UI-184, run with Remove animations on (the run sets it, and sets it back): each place whose content changes swaps
     * it with no fade, slide or roll, in one film. On a large window, with the panel: the dock's kind, the panel's
     * fold, the Filters symbol, the chips' counts, Near me's first fix, the search opening and closing, and a Settings
     * page pushed and popped; on a phone, the dock in the panel's place and Settings taken to its large height first.
     * Before the first fix, with the location denied: the location card coming and going, the notices going as the
     * search opens over the card and back as it closes, and a walk with no location, whose note comes with the card and
     * goes as the route is hidden. Once before the film, but for the first fix and Settings, which change once.
     *
     * With ground=plain the film is then read frame by frame (filmFrames): no frame that changes the screen comes
     * within [ONE_CHANGE_MILLIS] of another, as a change drawn over two frames or more, its old state's or a
     * transition's, would. A change is a frame of which more than [CHANGE_POINTS] points differ from the frame before:
     * more than the field's cursor blinking and the encoder's own touches to a still screen. The keyboard is kept away,
     * the screen's text input intercepted: it comes up some frames after the search opens and goes a frame or two after
     * it closes, under Remove animations too, in its own window, and on API 37 Gboard draws a taller layout between
     * (FLAG_ALT_FOCUSABLE_IM and FLAG_NOT_FOCUSABLE leave it be). The presses' light is kept apart: each tap is a press
     * held 0.4 s and let go, as a click's press and its release would light a glass button for a frame between them,
     * but Settings' button's, clicked as TalkBack does (clickAccessibly). Over the live map, whose tiles and labels
     * come as they load, the film is only made.
     */
    @Test
    fun reduceMotionAtOnce() {
        val resolver = InstrumentationRegistry.getInstrumentation().targetContext.contentResolver
        check(Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f) { "Remove animations is off" }
        val controller = show()
        var bars = 0f to 1f
        scenario!!.onActivity { activity ->
            val root = activity.window.decorView
            val insets = ViewCompat.getRootWindowInsets(root)!!.getInsets(WindowInsetsCompat.Type.systemBars())
            bars = insets.top.toFloat() / root.height to 1f - insets.bottom.toFloat() / root.height
        }
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        // A Compose button's label is its description, a row's its text: either, whichever shows first. Pressed and
        // held, then let go.
        fun tap(name: String, vararg selectors: BySelector) {
            val until = System.currentTimeMillis() + 5_000
            var found: UiObject2? = null
            while (found == null && System.currentTimeMillis() < until) {
                found = selectors.firstNotNullOfOrNull { device.findObject(it) }
                if (found == null) Thread.sleep(200)
            }
            val at = checkNotNull(found) { "no $name" }.visibleBounds
            shell("input motionevent DOWN ${at.centerX()} ${at.centerY()}")
            Thread.sleep(400)
            shell("input motionevent UP ${at.centerX()} ${at.centerY()}")
            Thread.sleep(1_500)
        }
        fun named(label: String) = arrayOf(By.desc(label), By.text(label))
        fun step(block: () -> Unit) {
            main(block)
            Thread.sleep(1_500)
        }
        val searchBar = By.desc(Pattern.compile("Search city or address|Finding your location.*|Showing scooters near.*"))
        val steps = { warm: Boolean ->
            step { controller.selectScooter("lime:a") }
            step { controller.selectScooter(null) }
            step { controller.setPanelCollapsed(true) }
            step { controller.setPanelCollapsed(false) }
            step { controller.setMinimumBattery(75.0) }
            step { controller.resetFilters() }
            api.scooters = if (warm) scooters else reordered
            step { controller.refresh() }
            // The bar's label: no place, a location on its way, or the place shown.
            tap("the search bar", searchBar)
            tap("Cancel", *named("Cancel"))
            if (!warm) {
                location.authorizationStatus = ScooterAuthorizationStatus.Denied
                step { controller.focusOnUser() }
                tap("the search bar", searchBar)
                tap("Cancel", *named("Cancel"))
                step { controller.dismissLocationIssue() }
                step { controller.selectScooter("lime:a") }
                step { controller.showWalkingRoute(ScooterWalkTarget.Scooter(scooters.first())) }
                step { controller.hideWalkingRoute() }
                step { controller.dismissLocationIssue() }
                step { controller.selectScooter(null) }
                location.authorizationStatus = ScooterAuthorizationStatus.AuthorizedWhenInUse
                step {
                    controller.locationsUpdated(listOf(ScooterLocationFix(rider, horizontalAccuracy = 10.0, timestamp = Instant.now())))
                }
                clickAccessibly(localized("Settings"))
                expandSheet()
                tap("the Language row", *named("English"))
                tap("Back", *named("Back"))
                tap("Done", *named("Done"))
            }
        }
        steps(true)
        record("ui184-reduce-motion", seconds = 75) { steps(false) }
        if (!plainGround) return

        val film = File(InstrumentationRegistry.getInstrumentation().targetContext.cacheDir, "ui184-reduce-motion.mp4")
        val copy = InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand("cat $FOLDER/ui184-reduce-motion.mp4")
        ParcelFileDescriptor.AutoCloseInputStream(copy).use { input -> film.outputStream().use { input.copyTo(it) } }
        val frames = filmFrames(film, top = bars.first, bottom = bars.second)
        film.delete()
        val changes = frames.filter { it.changed > CHANGE_POINTS }
        Log.i("DockMotionRecording", "${frames.size} frames; changes at ${changes.map { "%.0f ms (%d)".format(it.millis, it.changed) }}")
        check(changes.size >= 20) { "the film's changes, ${changes.size}: ${changes.map { it.millis.toInt() }}" }
        val twice = changes.zipWithNext().filter { (a, b) -> b.millis - a.millis < ONE_CHANGE_MILLIS }
        check(twice.isEmpty()) {
            "changes over more than one frame, at " + twice.joinToString { (a, b) -> "%.0f ms (%d) and %.0f ms (%d)".format(a.millis, a.changed, b.millis, b.changed) }
        }
    }

    /** UI-206: the live dot's ring, 1.6 s a round. */
    @Test
    fun livePulse() {
        show()
        record("ui206-live-pulse", seconds = 5) {}
    }

    /**
     * The screen over the live map, or a plain ground in its place, once the scooters are in (unless [loaded] is
     * false) and the ground is drawn.
     */
    private fun show(loaded: Boolean = true, liveMap: Boolean = true): ScooterMapController {
        val controller = ScooterMapController(
            api = api,
            locationManager = location,
            defaults = InMemoryScooterDefaults(),
            scope = scope,
            directions = directions,
            openInMaps = {},
            phoneLanguages = { listOf("en-GB") },
        )
        scenario = ActivityScenario.launch(ComponentActivity::class.java).onActivity {
            it.setContent {
                // On the plain ground, measured frame by frame, no keyboard: the search's field takes no text input.
                InterceptPlatformTextInput({ request, next -> if (plainGround) awaitCancellation() else next.startInputMethod(request) }) {
                    ScooterMapScreen(
                        controller,
                        map = { dark ->
                            if (liveMap && !plainGround) ScooterMap(controller, zurichStart, MapCameraMemory(), tiles, dark)
                            else Box(Modifier.fillMaxSize().background(Color(0xFF1B2230)))
                        },
                    )
                }
            }
        }
        if (!liveMap || plainGround) main { controller.updateViewport(zurichStart.region, zurichStart.zoom) }
        val start = System.currentTimeMillis()
        while (loaded && controller.lastUpdated.value == null && System.currentTimeMillis() - start < 30_000) Thread.sleep(200)
        // Time for OpenFreeMap's tiles.
        Thread.sleep(if (plainGround) 1_500 else 5_000)
        return controller
    }

    /** Films the screen for [seconds], doing [action] once the film has started. */
    private fun record(name: String, seconds: Int, action: () -> Unit) {
        val recorder = InstrumentationRegistry.getInstrumentation().uiAutomation
            .executeShellCommand("screenrecord --time-limit $seconds --bit-rate 8000000 $FOLDER/$name.mp4")
        Thread.sleep(1_000)
        action()
        // The recorder's output closes as it stops, at its time limit.
        ParcelFileDescriptor.AutoCloseInputStream(recorder).use { it.readBytes() }
        Thread.sleep(500)
    }

    /**
     * On a phone Settings opens at half the screen, the Language row under it: the grabber takes the sheet to its large
     * height, as TalkBack's double tap on it does, in one frame under Remove animations, where a drag would move it
     * over many. Nothing at a form sheet's, whose grabber would close it.
     */
    private fun expandSheet() {
        val grabber = accessibilityNode(localized("Sheet Grabber"))
        if (grabber == null || grabber.stateDescription?.toString() != localized("Sheet at half screen")) return
        check(grabber.performAction(AccessibilityNodeInfo.ACTION_CLICK)) { "the grabber's click" }
        Thread.sleep(1_500)
    }

    /**
     * Clicks the control described [description] as TalkBack does, with no press: Settings' button, whose light goes as
     * the finger lifts and its sheet comes the 3 to 10 frames it takes to compose, which a quicker device could bring
     * within ONE_CHANGE_MILLIS of each other.
     */
    private fun clickAccessibly(description: String) {
        val until = System.currentTimeMillis() + 5_000
        var node = accessibilityNode(description)
        while (node == null && System.currentTimeMillis() < until) {
            Thread.sleep(200)
            node = accessibilityNode(description)
        }
        check(checkNotNull(node) { "no $description" }.performAction(AccessibilityNodeInfo.ACTION_CLICK)) { "$description's click" }
        Thread.sleep(1_500)
    }

    /** The node described [description] in any of the screen's windows. */
    private fun accessibilityNode(description: String): AccessibilityNodeInfo? {
        fun find(node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
            if (node == null) return null
            if (node.contentDescription?.toString() == description) return node
            return (0 until node.childCount).firstNotNullOfOrNull { find(node.getChild(it)) }
        }
        val automation = InstrumentationRegistry.getInstrumentation().uiAutomation
        val roots = listOfNotNull(automation.rootInActiveWindow) + automation.windows.mapNotNull { it.root }
        return roots.firstNotNullOfOrNull { find(it) }
    }

    private fun main(block: () -> Unit) {
        InstrumentationRegistry.getInstrumentation().runOnMainSync(block)
    }

    private fun shell(command: String) {
        val output = InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand(command)
        ParcelFileDescriptor.AutoCloseInputStream(output).use { it.readBytes() }
    }

    /** A server that answers with [scooters], fails with [failure], and holds its answers while [holds] says so. */
    private class HeldAPI : ScooterAPIClient {
        @Volatile var scooters = DockMotionRecording.scooters

        @Volatile var failure: ScooterAPIError? = null

        @Volatile var holds = false
        private var gate = CompletableDeferred<Unit>()

        override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse {
            if (holds) gate.await()
            failure?.let { throw it }
            return ScooterResponse(vehicles = scooters)
        }

        fun release() {
            holds = false
            gate.complete(Unit)
            gate = CompletableDeferred()
        }
    }

    /**
     * Walking directions that follow the street round a corner, or find none while [fails] says so, held back from
     * [hold] to [release].
     */
    private class HeldDirections : WalkingDirectionsClient {
        @Volatile var fails = false

        @Volatile private var gate: CompletableDeferred<Unit>? = null

        override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> {
            gate?.await()
            if (fails) throw IllegalStateException("No route")
            return listOf(from, GeoPoint(from.latitude, to.longitude), to)
        }

        fun hold() {
            gate = CompletableDeferred()
        }

        fun release() {
            gate?.complete(Unit)
            gate = null
        }
    }

    /** The rider's location, allowed unless the test says otherwise; positions come from the test. */
    private class AuthorizedLocation : ScooterLocationManager {
        override var authorizationStatus = ScooterAuthorizationStatus.AuthorizedWhenInUse
        override val location: ScooterLocationFix? = null
        override val isHeadingAvailable = false
        override var headingOrientation = ScooterDeviceOrientation.Portrait
        override var distanceFilter = -1.0

        override fun requestWhenInUseAuthorization() {}

        override fun startUpdatingLocation() {}

        override fun startUpdatingHeading() {}

        override fun stopUpdatingHeading() {}
    }

    private companion object {
        const val FOLDER = "/sdcard/Movies/app-c"

        /** The least time between two changes of the screen in reduceMotionAtOnce's film: more than two frames at 60 Hz. */
        const val ONE_CHANGE_MILLIS = 40.0

        /** The points a frame of that film must change to be a change: about a word of the dock's text. */
        const val CHANGE_POINTS = 150

        /** 250 m west of Lime's scooter. */
        val rider = GeoPoint(47.3772, 8.5388)

        fun scooter(id: String, provider: String, latitude: Double, longitude: Double, battery: Int = 70) = Scooter(
            provider = provider, latitude = latitude, longitude = longitude, battery = battery, rangeMeters = null,
            vehicleID = id, deepLink = null, rentalURIs = null, distanceMeters = 0.0,
        )

        val scooters = listOf(
            scooter("a", "lime", 47.3772, 8.5421, battery = 82),
            scooter("b", "lime", 47.3760, 8.5410),
            scooter("c", "bird", 47.3775, 8.5402),
            scooter("d", "voi", 47.3765, 8.5430),
            scooter("e", "bolt", 47.3781, 8.5415),
        )

        /** Voi with three and Lime with one: Voi comes first, and every count changes. */
        val reordered = listOf(
            scooter("a", "lime", 47.3772, 8.5421, battery = 82),
            scooter("c", "bird", 47.3775, 8.5402),
            scooter("d", "voi", 47.3765, 8.5430),
            scooter("f", "voi", 47.3769, 8.5436),
            scooter("g", "voi", 47.3759, 8.5425),
            scooter("e", "bolt", 47.3781, 8.5415),
        )
    }
}
