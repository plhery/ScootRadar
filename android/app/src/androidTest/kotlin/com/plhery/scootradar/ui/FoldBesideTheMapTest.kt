package com.plhery.scootradar.ui

import android.app.Activity
import android.app.Application
import android.graphics.Bitmap
import android.graphics.Rect
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowMetricsCalculator
import androidx.window.testing.layout.FoldingFeature
import androidx.window.testing.layout.TestWindowLayoutInfo
import androidx.window.testing.layout.WindowLayoutInfoPublisherRule
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterDeviceOrientation
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterLocationManager
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.map.GroundTiles
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapCameraMemory
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.map.MapInsets
import com.plhery.scootradar.map.MapLibreProjection
import com.plhery.scootradar.map.ScooterMap
import com.plhery.scootradar.map.ScooterMapView
import com.plhery.scootradar.map.zurichStart
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import okhttp3.OkHttpClient
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import java.io.File
import java.time.Instant
import java.util.Locale
import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.log2
import kotlin.math.roundToInt

/**
 * The map beside the fold of a partly open foldable, on the live map and edge to edge as MainActivity has it, as
 * the iPhone Duo's tests have it (ScooterMapModelTests.swift:4296-4500): locating open like a book (T244) and
 * standing like a laptop (T245), and the moves to the rider, to a scooter and to what was in the middle as the
 * hinge folds and opens (T246–T249). The fold is given as WindowManager gives it, by window-testing, 20 dp wide as
 * the Duo's; the foldable's own hinge is left flat. For ScootRadar_Fold held across, 883 × 852 dp, as the Duo is
 * held sideways in the iPhone's tests; the screens are kept in the run's additional output, as fold-*.png.
 *
 * No compose rule, as PanelBesideTheMapTest has none: these time the camera as the rider sees it.
 */
@RunWith(AndroidJUnit4::class)
class FoldBesideTheMapTest {
    @get:Rule
    val hinge = WindowLayoutInfoPublisherRule()

    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val device = UiDevice.getInstance(instrumentation)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current
    private val tiles = GroundTiles.openFreeMap(OkHttpClient())
    private var scenario: ActivityScenario<ComponentActivity>? = null
    private val application = ApplicationProvider.getApplicationContext<Application>()
    private var recreations: Application.ActivityLifecycleCallbacks? = null
    private lateinit var activity: ComponentActivity
    private lateinit var controller: ScooterMapController
    private lateinit var mapView: ScooterMapView
    private lateinit var map: MapLibreMap
    private lateinit var projection: MapLibreProjection
    private var frames: MapChromeFrames? = null

    /** The map's margins, as its camera set them, in points. */
    private fun margins(): MapInsets = onMain { mapView.camera!!.margins }

    @Before
    fun setUp() {
        Locale.setDefault(Locale.UK)
        ScooterLanguage.current = ScooterLanguage.En
        device.setOrientationLandscape()
        assertTrue("turned", waitFor(10_000) { device.displayWidth > device.displayHeight })
    }

    @After
    fun tearDown() {
        scenario?.close()
        recreations?.let(application::unregisterActivityLifecycleCallbacks)
        scope.cancel()
        device.setOrientationNatural()
        device.unfreezeRotation()
        ScooterLanguage.current = language
        Locale.setDefault(locale)
    }

    /**
     * Open like a book, the panel on the leading half: locating puts the rider in the middle of the trailing half,
     * not on the fold side of it, and the credits go past the fold.
     */
    @Test
    fun openLikeABookLocatingPutsTheRiderInTheMiddleOfTheTrailingHalf() {
        show(controller())
        val fold = fold(down = true)
        val pastTheFold = waitFor(10_000) { margins().left >= fold.maxX + 15 }
        assertTrue("${margins()}", pastTheFold)
        Thread.sleep(500)

        val middle = trailingHalf(fold)
        locate(rider)
        assertTrue("${shown(rider)} for $middle", waitFor(LOCATING) { shows(rider, at = middle) })
        waitUntilAtRest(rider)
        screenshot("fold-t244-book")

        onMain { map.moveCamera(CameraUpdateFactory.newLatLng(LatLng(47.3790, 8.5450))) }
        onMain { controller.focusOnUser() }
        assertTrue("${shown(rider)} for $middle", waitFor(LOCATING) { shows(rider, at = middle) })
    }

    /**
     * Standing like a laptop, the screen as narrow as the Duo upright, which has the dock: the search bar goes down
     * under the fold with the dock, and locating puts the rider in the middle of the upright half, not on the fold,
     * nor under the search bar.
     */
    @Test
    fun standingLikeALaptopTheMapTakesTheUprightHalf() {
        show(controller(), width = DUO_UPRIGHT_WIDTH)
        val fold = fold(down = false, width = DUO_UPRIGHT_WIDTH)
        val searchUnderTheFold = waitFor(10_000) { onMain { frames?.chrome?.top }?.let { it.minY >= fold.maxY } == true }
        assertTrue("${onMain { frames?.chrome }}", searchUnderTheFold)
        val chrome = onMain { frames!!.chrome }
        assertNull("a phone's layout", chrome.panel)
        assertTrue("${chrome.bottomFrames}", chrome.bottomFrames.all { it.minY >= fold.maxY })
        val bounds = onMain { projection.bounds }
        val marginsAboveTheFold = waitFor(10_000) { margins().bottom >= bounds.maxY - fold.minY }
        assertTrue("${margins()}", marginsAboveTheFold)
        Thread.sleep(500)

        val safeTop = onMain {
            val insets = ViewCompat.getRootWindowInsets(mapView)!!
                .getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            insets.top / mapView.resources.displayMetrics.density.toDouble()
        }
        val middle = ScreenPoint(bounds.midX, (safeTop + fold.minY) / 2)
        locate(rider)
        assertTrue("${shown(rider)} for $middle", waitFor(LOCATING) { shows(rider, at = middle) })
        waitUntilAtRest(rider)
        screenshot("fold-t245-laptop")
    }

    /**
     * Folded open like a book and opened again while the move to the rider is under way, nothing having touched the
     * map: the map lands each time where locating would, in the middle of the half where it shows, at locating's
     * zoom there.
     */
    @Test
    fun foldingAndOpeningWhileLocatingLandsWhereLocatingWould() {
        show(controller())
        val besidePanel = waitFor(10_000) { margins().left >= BESIDE_THE_PANEL }
        assertTrue("${margins()}", besidePanel)
        Thread.sleep(500)
        locate(rider)
        assertTrue("${shown(rider)}", waitFor(LOCATING) { shows(rider, at = middleBesideThePanel()) })
        // MapLibre's move goes on a while after the rider is near the middle: the hinge folds while it does.
        Thread.sleep(800)

        val fold = fold(down = true)
        Thread.sleep(TURNING)
        assertLanded(rider, at = trailingHalf(fold), within = 1.0)
        val folded = zoom()
        screenshot("fold-t246-folded")

        // Opened, the map lands where locating does beside the panel, which the test takes as locating's zoom.
        unfold()
        assertLanded(rider, at = middleBesideThePanel(), within = 1.0)
        val open = zoom()
        // The same place fitted into the narrower half.
        assertTrue("$open → $folded", open - folded > log2(1.1))

        fold(down = true)
        Thread.sleep(TURNING)
        assertLanded(rider, at = trailingHalf(fold), within = 1.0)
        assertEquals(folded, zoom(), log2(1.02))
    }

    /** The other way: located open like a book, then opened and folded again. */
    @Test
    fun openingAndFoldingAfterLocatingInTheBookPoseLandsWhereLocatingWould() {
        show(controller())
        val fold = fold(down = true)
        val pastTheFold = waitFor(10_000) { margins().left >= fold.maxX + 15 }
        assertTrue("${margins()}", pastTheFold)
        Thread.sleep(500)
        locate(rider)
        assertTrue("${shown(rider)}", waitFor(LOCATING) { shows(rider, at = trailingHalf(fold)) })
        Thread.sleep(800)
        // MapLibre's move goes on a while after the rider is near the middle: the zoom it ends at.
        waitUntilAtRest(rider)
        val folded = zoom()

        unfold()
        assertLanded(rider, at = middleBesideThePanel(), within = 1.0)
        assertTrue("$folded → ${zoom()}", zoom() - folded > log2(1.1))

        fold(down = true)
        Thread.sleep(TURNING)
        assertLanded(rider, at = trailingHalf(fold), within = 1.0)
        assertEquals(folded, zoom(), log2(1.02))
    }

    /**
     * The card's header centres its scooter at the zoom the map has, and folding like a book makes that move again:
     * the scooter lands where the header puts it, in the middle of the half where the map shows, at the same zoom.
     */
    @Test
    fun foldingAfterTheCardHeaderCentresAScooterLandsWhereTheHeaderWould() {
        val parked = Scooter(provider = "lime", latitude = 47.3728, longitude = 8.5412, vehicleID = "one")
        show(controller(scooters = listOf(parked)))
        val besidePanel = waitFor(10_000) { margins().left >= BESIDE_THE_PANEL }
        assertTrue("${margins()}", besidePanel)
        Thread.sleep(500)
        locate(rider)
        assertTrue("${shown(rider)}", waitFor(LOCATING) { shows(rider, at = middleBesideThePanel()) })
        val loaded = waitFor(LOCATING) { onMain { controller.mapScooters.value.any { it.id == parked.id } } }
        assertTrue(loaded)
        // The header is on the card of the scooter chosen.
        onMain { controller.selectScooter(parked.id) }
        Thread.sleep(1_500)
        onMain { controller.focusOnScooter(parked) }
        val centred = waitFor(15_000) { shows(parked.coordinate, at = middleBesideThePanel(), tolerance = 80.0) }
        assertTrue("${shown(parked.coordinate)}", centred)
        waitUntilAtRest(parked.coordinate)
        val open = shown(parked.coordinate)
        val zoom = zoom()

        val fold = fold(down = true)
        Thread.sleep(TURNING)
        assertLanded(parked.coordinate, at = ScreenPoint(trailingHalf(fold).x, open.y), within = 1.0) {
            controller.focusOnScooter(parked)
        }
        assertEquals(zoom, zoom(), log2(1.01))
        screenshot("fold-t248-card")
    }

    /**
     * Once the rider has moved the map, here a step in from the keyboard, the fold takes what was in the middle beside
     * the panel to the middle of the trailing half, and opening brings it back, at the zoom it has.
     */
    @Test
    fun foldingAndOpeningAfterTheMapWasMovedKeepsWhatIsInTheMiddle() {
        show(controller())
        locate(rider)
        assertTrue("${shown(rider)}", waitFor(LOCATING) { shows(rider, at = middleBesideThePanel()) })
        Thread.sleep(800)
        onMain { controller.zoom(by = 1) }
        Thread.sleep(1_200)
        waitUntilAtRest(rider)
        val middle = middleBesideThePanel()
        val kept = onMain { projection.coordinate(middle) }
        val zoomed = zoom()

        val fold = fold(down = true)
        Thread.sleep(TURNING)
        assertTrue("${shown(kept)}", shows(kept, at = trailingHalf(fold), tolerance = 8.0))
        assertEquals(zoomed, zoom(), log2(1.01))

        unfold()
        assertTrue("${shown(kept)}", shows(kept, at = middleBesideThePanel(), tolerance = 8.0))
        assertEquals(zoomed, zoom(), log2(1.01))
    }

    /** A controller allowed to locate that hears only the fixes the test gives it, with `scooters` about. */
    private fun controller(scooters: List<Scooter> = emptyList()) = ScooterMapController(
        api = object : ScooterAPIClient {
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(vehicles = scooters)
        },
        locationManager = TestLocation(),
        defaults = InMemoryScooterDefaults(),
        scope = scope,
        directions = object : WalkingDirectionsClient {
            override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> = emptyList()
        },
        openInMaps = {},
        phoneLanguages = { listOf("en-GB") },
    )

    /**
     * The screen over the live map with `controller`, edge to edge, once the map has its camera, `width` wide from
     * the window's leading edge, or the whole window.
     */
    private fun show(controller: ScooterMapController, width: Double? = null) {
        this.controller = controller
        val content: @Composable () -> Unit = {
            val size = if (width != null) Modifier.width(width.dp).fillMaxHeight() else Modifier.fillMaxSize()
            Box(size) {
                ScooterMapScreen(
                    controller = controller,
                    map = { dark ->
                        frames = LocalMapChrome.current
                        ScooterMap(controller, zurichStart, MapCameraMemory(), tiles, dark)
                    },
                )
            }
        }
        // The first launch after the app is installed makes a new activity once, which shows the screen too.
        val recreated = object : Application.ActivityLifecycleCallbacks {
            override fun onActivityCreated(created: Activity, savedInstanceState: Bundle?) {
                if (savedInstanceState == null || created !is ComponentActivity) return
                activity = created
                created.enableEdgeToEdge()
                created.setContent(content = content)
            }
            override fun onActivityStarted(activity: Activity) = Unit
            override fun onActivityResumed(activity: Activity) = Unit
            override fun onActivityPaused(activity: Activity) = Unit
            override fun onActivityStopped(activity: Activity) = Unit
            override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
            override fun onActivityDestroyed(activity: Activity) = Unit
        }
        recreations?.let(application::unregisterActivityLifecycleCallbacks)
        application.registerActivityLifecycleCallbacks(recreated)
        recreations = recreated
        scenario = ActivityScenario.launch(ComponentActivity::class.java).onActivity {
            activity = it
            it.enableEdgeToEdge()
            it.setContent(content = content)
        }
        assertTrue("the map's camera", waitFor(30_000) { onMain { mapIn(activity.window.decorView)?.camera != null } })
        if (!launchedBefore) {
            launchedBefore = true
            Thread.sleep(3_000)
            assertTrue("the map's camera", waitFor(30_000) { onMain { mapIn(activity.window.decorView)?.camera != null } })
        }
        onMain {
            mapView = mapIn(activity.window.decorView)!!
            mapView.getMapAsync { map = it }
            projection = MapLibreProjection(map, mapView)
        }
    }

    private fun mapIn(view: View): ScooterMapView? =
        view as? ScooterMapView ?: (view as? ViewGroup)?.let { group -> (0 until group.childCount).firstNotNullOfOrNull { mapIn(group.getChildAt(it)) } }

    /**
     * The hinge partly open, 20 dp wide across the middle of the window: down it, open like a book, or across it,
     * standing like a laptop, over the screen's `width` from the leading edge or the whole window. Answers the fold
     * in the window's points, as the map has it.
     */
    private fun fold(down: Boolean, width: Double? = null): ScreenRect {
        val density = onMain { activity.resources.displayMetrics.density }
        val window = onMain { WindowMetricsCalculator.getOrCreate().computeCurrentWindowMetrics(activity).bounds }
        val bounds = if (width != null) Rect(0, 0, (width * density).roundToInt(), window.bottom) else window
        val half = (10 * density).roundToInt()
        val feature = FoldingFeature(
            bounds,
            center = if (down) bounds.centerX() else bounds.centerY(),
            size = 2 * half,
            state = FoldingFeature.State.HALF_OPENED,
            orientation = if (down) FoldingFeature.Orientation.VERTICAL else FoldingFeature.Orientation.HORIZONTAL,
        )
        hinge.overrideWindowLayoutInfo(TestWindowLayoutInfo(listOf(feature)))
        return feature.bounds.let {
            ScreenRect(it.left / density.toDouble(), it.top / density.toDouble(), it.width() / density.toDouble(), it.height() / density.toDouble())
        }
    }

    /** The hinge opened flat, which leaves no fold; and the map at rest after it. */
    private fun unfold() {
        hinge.overrideWindowLayoutInfo(TestWindowLayoutInfo(emptyList()))
        Thread.sleep(TURNING)
    }

    /** The rider found at `place`. */
    private fun locate(place: GeoPoint) = onMain { controller.locationsUpdated(listOf(ScooterLocationFix(place, horizontalAccuracy = 5.0, timestamp = Instant.now()))) }

    private fun zoom(): Double = onMain { map.cameraPosition.zoom }


    private fun shown(place: GeoPoint): ScreenPoint = onMain { projection.point(place) }

    /** The middle of the map right of the panel, 16 from the edge and 380 wide. */
    private fun middleBesideThePanel(): ScreenPoint = onMain { projection.bounds }.let { ScreenPoint((16 + 380 + it.maxX) / 2, it.midY) }

    /** The middle of the half of the map right of a fold down it. */
    private fun trailingHalf(fold: ScreenRect): ScreenPoint = onMain { projection.bounds }.let { ScreenPoint((fold.maxX + it.maxX) / 2, it.midY) }

    /** Whether a place shows at `point` on the map, within `tolerance` points. */
    private fun shows(place: GeoPoint, at: ScreenPoint, tolerance: Double = 24.0): Boolean {
        val shown = shown(place)
        return abs(shown.x - at.x) <= tolerance && abs(shown.y - at.y) <= tolerance
    }

    /**
     * The place shows at `point` once the map has settled, and locating again, or moving there again as
     * `moveAgain` does, leaves the map where it is, within `within` points, at its zoom: it is where that move puts it.
     */
    private fun assertLanded(place: GeoPoint, at: ScreenPoint, within: Double = 3.0, moveAgain: () -> Unit = { controller.focusOnUser() }) {
        waitFor(3_000) { shows(place, at, tolerance = 8.0) }
        waitUntilAtRest(place)
        val shown = shown(place)
        assertTrue("$shown for $at", shows(place, at, tolerance = 8.0))
        val zoom = zoom()
        onMain(moveAgain)
        Thread.sleep(600)
        waitUntilAtRest(place)
        val relocated = shown(place)
        assertEquals("$shown → $relocated", shown.x, relocated.x, within)
        assertEquals("$shown → $relocated", shown.y, relocated.y, within)
        assertEquals("zoom", zoom, zoom(), log2(1.01))
    }

    /** Waits for the place to keep its place and the camera its zoom for 600 ms, for 5 s at most. */
    private fun waitUntilAtRest(place: GeoPoint) {
        var shown = shown(place)
        var zoom = zoom()
        var still = 0
        repeat(50) {
            Thread.sleep(100)
            val now = shown(place)
            val nowZoom = zoom()
            val moved = hypot(now.x - shown.x, now.y - shown.y) > 0.5 || abs(nowZoom - zoom) > log2(1.001)
            still = if (moved) 0 else still + 1
            if (still == 6) return
            shown = now
            zoom = nowZoom
        }
    }

    /** Whether `condition` holds within `timeoutMillis`, asked every 50 ms. */
    private fun waitFor(timeoutMillis: Long, condition: () -> Boolean): Boolean {
        val end = System.currentTimeMillis() + timeoutMillis
        while (System.currentTimeMillis() < end) {
            if (condition()) return true
            Thread.sleep(50)
        }
        return condition()
    }

    private fun <T> onMain(block: () -> T): T {
        var result: Result<T>? = null
        instrumentation.runOnMainSync { result = runCatching(block) }
        return result!!.getOrThrow()
    }

    /** The screen now, kept as [name].png in the run's additional output. */
    private fun screenshot(name: String) {
        val bitmap = instrumentation.uiAutomation.takeScreenshot() ?: return
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            File(dir).mkdirs()
            File(dir, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
    }

    /** The rider's location, allowed, with no fix kept from before; fixes come from the test. */
    private class TestLocation : ScooterLocationManager {
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
        /** Whether an activity was launched in this process already. */
        var launchedBefore = false

        /** Long enough for a move to the rider on a slow emulator. */
        const val LOCATING = 20_000L

        /** How long the iPhone's tests give the Duo to fold or open, and the map to follow. */
        const val TURNING = 1_200L

        /**
         * 16 from the edge, 380 of panel and 16 to spare, less half a point: the panel's edge is measured in whole
         * pixels, which the Fold's 2.4375 to the point leave 0.1 short of it.
         */
        const val BESIDE_THE_PANEL = 16 + 380 + 16 - 0.5

        /** The Duo's width upright, which has the dock. */
        const val DUO_UPRIGHT_WIDTH = 669.0

        val rider = GeoPoint(47.3720, 8.5390)
    }
}
