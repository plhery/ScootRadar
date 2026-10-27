package com.plhery.scootradar.ui

import android.os.ParcelFileDescriptor
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterDeviceOrientation
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
import com.plhery.scootradar.map.GroundTiles
import com.plhery.scootradar.map.MapCameraMemory
import com.plhery.scootradar.map.ScooterMap
import com.plhery.scootradar.map.zurichStart
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import okhttp3.OkHttpClient
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule
import org.junit.runner.RunWith
import org.junit.runners.model.Statement
import java.time.Instant
import java.util.Locale

/**
 * Films the dock's transitions (ui.md §4) over the live map with `screenrecord`, one film for each kind, in
 * /sdcard/Movies/app-c/. Only with the argument recordMotion=true; otherwise each test passes without doing anything.
 * No compose rule: its test clock would move the animations only while the test waits for it, and the films need
 * them in real time.
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

    /** UI-195 and UI-203: the summary becomes a scooter's card, glow and all, and the card the summary again. */
    @Test
    fun dockKind() {
        val controller = show()
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
        record("ui199-201-chips-reorder", seconds = 4) {
            api.scooters = reordered
            main { controller.refresh() }
        }
    }

    /** UI-193: a first load that failed slides its banner in under the search bar; Try again takes it away. */
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

    /** UI-198: Directions finds the way (the label and its spinner), shows it, and hides it again. */
    @Test
    fun walkPhase() {
        directions.holds = true
        val controller = show()
        // The first fix takes the map to the rider and loads again: the card opens once that is done.
        main { controller.locationsUpdated(listOf(ScooterLocationFix(rider, horizontalAccuracy = 10.0, timestamp = Instant.now()))) }
        Thread.sleep(5_000)
        main { controller.selectScooter("lime:a") }
        Thread.sleep(1_500)
        record("ui198-walk-phase", seconds = 6) {
            main { controller.showWalkingRoute(ScooterWalkTarget.Scooter(scooters.first())) }
            Thread.sleep(1_500)
            directions.release()
            Thread.sleep(2_000)
            main { controller.hideWalkingRoute() }
        }
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
                ScooterMapScreen(
                    controller,
                    map = { dark ->
                        if (liveMap) ScooterMap(controller, zurichStart, MapCameraMemory(), tiles, dark)
                        else Box(Modifier.fillMaxSize().background(Color(0xFF1B2230)))
                    },
                )
            }
        }
        if (!liveMap) main { controller.updateViewport(zurichStart.region, zurichStart.zoom) }
        val start = System.currentTimeMillis()
        while (loaded && controller.lastUpdated.value == null && System.currentTimeMillis() - start < 30_000) Thread.sleep(200)
        // Time for OpenFreeMap's tiles.
        Thread.sleep(5_000)
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

    /** Walking directions that follow the street round a corner, held back while [holds] says so. */
    private class HeldDirections : WalkingDirectionsClient {
        @Volatile var holds = false
        private val gate = CompletableDeferred<Unit>()

        override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> {
            if (holds) gate.await()
            return listOf(from, GeoPoint(from.latitude, to.longitude), to)
        }

        fun release() {
            gate.complete(Unit)
        }
    }

    /** The rider's location, allowed; positions come from the test. */
    private class AuthorizedLocation : ScooterLocationManager {
        override val authorizationStatus = ScooterAuthorizationStatus.AuthorizedWhenInUse
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
