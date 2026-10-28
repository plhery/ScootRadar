package com.plhery.scootradar.ui

import android.app.Activity
import android.app.Application
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterDeviceOrientation
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterLocationManager
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dock
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterRentalURIs
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterRidePricing
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.map.GroundTiles
import com.plhery.scootradar.map.MapCameraMemory
import com.plhery.scootradar.map.MapInsets
import com.plhery.scootradar.map.MapLibreProjection
import com.plhery.scootradar.map.MapZoom
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
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
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

/**
 * The map beside a large window's panel, on the live map and edge to edge as MainActivity has it, as the iPad's
 * tests have it (ScooterMapModelTests.swift): the leading margin past the panel (T221), a fold that leaves the map
 * where it is (T229), locating beside the panel (T233–T236), the moves to places counted (T237, T238), the tablet
 * turned (T250–T252) and a step of zoom around the middle (T263). For ScootRadar_Tablet, 1280 × 800 dp across; the
 * screens are kept in the run's additional output, as panel-*.png.
 *
 * No compose rule: its test clock would move the camera only while the test waits for it, and these time the
 * camera as the rider sees it. The tests' activity keeps itself through a turn, as MainActivity does (the debug
 * manifest).
 */
@RunWith(AndroidJUnit4::class)
class PanelBesideTheMapTest {
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

    /** The text size the screen is given, as a font scale; none keeps the phone's. */
    private val textScale = mutableStateOf<Float?>(null)

    /** The map's margins, as its camera set them, in points. */
    private fun margins(): MapInsets = onMain { mapView.camera!!.margins }

    /** How many moves to a place the camera made. */
    private fun moves(): Int = onMain { mapView.camera!!.movesToPlaces }

    private fun dock(): ScooterDockContent = onMain { controller.dock }

    @Before
    fun setUp() {
        Locale.setDefault(Locale.UK)
        ScooterLanguage.current = ScooterLanguage.En
        turn(upright = false)
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

    /** Apple's logo and Legal link sit in the map's leading margin, which a panel moves past itself; a phone has none. */
    @Test
    fun aPanelMovesTheMapsLeadingMarginPastItAndAPhoneLeavesItAlone() {
        show(controller(), phone = true)
        val resting = margins()
        Thread.sleep(300)
        assertEquals(resting, margins())
        assertTrue("${margins()}", margins().left < 100)
        assertEquals(MapInsets.zero, padding())
        screenshot("panel-t221-phone")
        scenario?.close()

        show(controller())
        // 16 from the edge, 380 of panel, and 16 to spare: the map shows its centre beside the panel.
        val moved = waitFor(10_000) { margins().left >= 16 + 380 + 16 && padding().left >= 16 + 380 + 16 }
        assertTrue("${margins()}, padding ${padding()}", moved)
        screenshot("panel-t221-panel")
    }

    /** The map keeps clear of the panel by its leading margin, which a fold leaves as it is: what was in the middle stays. */
    @Test
    fun foldingThePanelLeavesTheMapWhereItIs() {
        show(controller())
        val besidePanel = waitFor(10_000) { margins().left >= 16 + 380 + 16 }
        assertTrue("${margins()}", besidePanel)
        Thread.sleep(300)
        val margins = margins()
        val centre = onMain { map.cameraPosition.target!! }

        for (folded in listOf(true, false)) {
            onMain { controller.setPanelCollapsed(folded) }
            Thread.sleep(600)
            assertEquals("folded: $folded", margins, margins())
            val now = onMain { map.cameraPosition.target!! }
            assertEquals("folded: $folded", centre.latitude, now.latitude, 1e-9)
            assertEquals("folded: $folded", centre.longitude, now.longitude, 1e-9)
            screenshot("panel-t229-folded-$folded")
        }
    }

    /**
     * Beside a panel, locating puts the rider in the middle of the part of the map beside it, at the first fix and
     * again with the locate button once the map was moved.
     */
    @Test
    fun locatingBesideThePanelPutsTheRiderInTheMiddleOfTheMapBesideIt() {
        show(controller())
        val besidePanel = waitFor(10_000) { margins().left >= 16 + 380 + 16 }
        assertTrue("${margins()}", besidePanel)
        Thread.sleep(500)

        locate(rider)
        assertTrue("${shown(rider)}", waitFor(LOCATING) { isBesideThePanel(rider) })
        screenshot("panel-t233-located")

        // Once the move has landed: MapKit's setCenter ends a move under way, and MapLibre's moveCamera doesn't
        // end the camera's own.
        waitUntilAtRest(rider)
        onMain { map.moveCamera(CameraUpdateFactory.newLatLng(LatLng(47.3790, 8.5450))) }
        assertFalse(isBesideThePanel(rider))
        onMain { controller.focusOnUser() }
        assertTrue("${shown(rider)}", waitFor(LOCATING) { isBesideThePanel(rider) })
    }

    /**
     * At a relaunch the controller starts with the fix the phone kept, as the panel takes its place and before the
     * map has its size: the move to the rider ends beside the panel, and stays there.
     */
    @Test
    fun theFixKeptFromBeforeLocatesTheRiderBesideThePanelAtLaunch() {
        show(controller(TestLocation(kept = fix(rider))), start = true)
        assertTrue("${shown(rider)}", waitFor(LOCATING) { isBesideThePanel(rider) })
        assertNotNull(controller.focusRequest.value)
        Thread.sleep(800)
        assertTrue("${shown(rider)}", isBesideThePanel(rider))
    }

    /** A first fix can come before the map is made: the move waits for it, and ends beside the panel. */
    @Test
    fun aFirstFixBeforeThePanelIsInPlaceStillEndsBesideIt() {
        val controller = controller()
        onMain { controller.locationsUpdated(listOf(fix(rider))) }
        assertNotNull(controller.focusRequest.value)
        show(controller)
        assertTrue("${shown(rider)}", waitFor(LOCATING) { isBesideThePanel(rider) })
    }

    /** On a slow phone the first layout can take seconds: the move waits for the map's size however long that takes. */
    @Test
    fun aFirstFixStillEndsBesideThePanelAfterASlowFirstLayout() {
        val controller = controller()
        onMain { controller.locationsUpdated(listOf(fix(rider))) }
        show(controller, firstLayoutTaking = 2_000)
        assertTrue("${shown(rider)}", waitFor(LOCATING) { isBesideThePanel(rider) })
    }

    /**
     * A move to a place is made again only when the panel's leading margin moves. On a phone nothing moves it:
     * locating, a tall card opening in the dock with very large text, and locating again from it move the map
     * once for each place asked for, however the dock and the card grow.
     */
    @Test
    fun aTallCardOpeningInTheDockMovesTheMapOnceForEachPlaceAskedFor() {
        val tall = Scooter(
            provider = "publibike", latitude = 47.3769, longitude = 8.5417, battery = 82, rangeMeters = 24_000,
            vehicleID = "tall", rentalURIs = ScooterRentalURIs(android = "https://publibike.ch/ride"), distanceMeters = 0.0,
            pricing = ScooterRidePricing(currency = "CHF", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 35),
        )
        val controller = controller(scooters = listOf(tall))
        onMain { controller.updateViewport(zurichStart.region, zoom = 16) }
        assertTrue(waitFor(30_000) { controller.lastUpdated.value != null && !controller.isLoading.value })

        onMain { textScale.value = ACCESSIBILITY_3 }
        show(controller, phone = true)
        Thread.sleep(600)
        assertTrue("${dock()}", dock() is ScooterDockContent.Summary)

        val before = moves()
        // Beside the scooter, which stays in the little left in view above the dock.
        locate(GeoPoint(47.3770, 8.5417))
        // Once the map is there: its zoom then no longer changes how scooters are grouped, which would close the card.
        val located = waitFor(LOCATING) { onMain { MapZoom.region(of = projection.visibleMapRect).latitudeDelta } < 0.02 }
        assertTrue(located)
        Thread.sleep(500)
        assertEquals(1, moves() - before)

        onMain { controller.selectScooter("publibike:tall") }
        Thread.sleep(1_500)
        assertTrue("${dock()}", dock() is ScooterDockContent.Scooter)
        assertEquals(1, moves() - before)
        screenshot("panel-t237-tall-card")

        // Locating from the card, which stays.
        onMain { controller.focusOnUser() }
        Thread.sleep(1_500)
        assertEquals(2, moves() - before)
    }

    /**
     * Beside a panel a move under way is made again once for each real move of the panel's leading margin, and
     * only a few times in all: the panel growing and shrinking with the text size over and over moves the map a
     * few times, then leaves it where it is, and nothing moves it once the panel stops.
     */
    @Test
    fun aMoveUnderWayIsMadeAgainAFewTimesAtMostAsThePanelKeepsMoving() {
        show(controller())
        val besidePanel = waitFor(10_000) { margins().left >= 16 + 380 + 16 }
        assertTrue("${margins()}", besidePanel)
        Thread.sleep(500)

        locate(rider)
        assertTrue("${shown(rider)}", waitFor(LOCATING) { isBesideThePanel(rider) })
        val before = moves()

        // The first change takes the map on to the rider beside the wider panel.
        onMain { textScale.value = ACCESSIBILITY_1 }
        val wider = waitFor(5_000) { margins().left >= 16 + 420 + 16 }
        assertTrue("${margins()}", wider)
        Thread.sleep(300)
        assertEquals(1, moves() - before)

        repeat(12) {
            onMain { textScale.value = if (textScale.value == ACCESSIBILITY_1) 1f else ACCESSIBILITY_1 }
            Thread.sleep(150)
        }
        Thread.sleep(500)
        val afterChanges = moves()
        assertTrue("${afterChanges - before}", afterChanges - before in 2..6)
        Thread.sleep(1_000)
        assertEquals(afterChanges, moves())
    }

    /**
     * Upright and located, then turned across: the rider lands beside the panel where locating would, at
     * locating's zoom. Upright the tablet's 800 dp leave too little map beside the panel at the largest text
     * sizes, and the window has the dock: the panel takes its place as the tablet turns, as the Duo's does.
     */
    @Test
    fun turnedSidewaysWhileLocatingTheRiderLandsBesideThePanel() {
        turn(upright = true)
        onMain { textScale.value = ACCESSIBILITY_1 }
        show(controller())
        Thread.sleep(500)
        assertEquals(MapInsets.zero, margins())
        locate(rider)
        Thread.sleep(1_500)
        screenshot("panel-t250-upright")
        turn(upright = false)
        Thread.sleep(1_500)
        assertLanded(rider, at = middleBesideThePanel(panel = 420.0))
        screenshot("panel-t250-across")
    }

    /**
     * The map takes its new size as the tablet turns, and loses the status bar's room only once it is on its way
     * to the rider: it lands beside the panel all the same.
     */
    @Test
    fun turnedSidewaysTheRiderLandsBesideThePanelOnceTheSafeAreaHasTurned() {
        turn(upright = true)
        show(controller())
        Thread.sleep(500)
        locate(rider)
        Thread.sleep(1_500)
        val upright = zoom()
        turn(upright = false, waits = false)
        val onItsWay = waitFor(5_000) { abs(zoom() - upright) > log2(1.01) }
        assertTrue("${zoom()} from $upright", onItsWay)
        hideTheStatusBar()
        Thread.sleep(1_500)
        assertLanded(rider, at = middleBesideThePanel())
    }

    /**
     * Once the map has landed on the rider, the status bar's room leaving it makes no region change: the move is
     * made again for the new safe area all the same, and the rider is where locating again puts them.
     */
    @Test
    fun theMoveIsMadeAgainWhenOnlyTheSafeAreaChangesAfterItLanded() {
        show(controller())
        Thread.sleep(500)
        locate(rider)
        assertTrue("${shown(rider)}", waitFor(LOCATING) { isBesideThePanel(rider) })
        waitUntilAtRest(rider)
        hideTheStatusBar()
        assertLanded(rider, at = middleBesideThePanel(), within = 0.5)
    }

    /**
     * A step in and out from the keyboard beside the panel: the camera comes a step in, then goes two out, and
     * what was in the middle of the map stays there. The status bar over the map leaves the middle where locating
     * puts it.
     */
    @Test
    fun theMapZoomsAStepAtATimeAroundItsMiddle() {
        show(controller())
        locate(rider)
        assertTrue("${shown(rider)}", waitFor(LOCATING) { isBesideThePanel(rider) })
        waitUntilAtRest(rider)
        val start = zoom()

        // Twice as close, within 2 %.
        onMain { controller.zoom(by = 1) }
        val closer = waitFor(6_000) { abs(zoom() - (start + 1)) < log2(1.02) }
        assertTrue("$start → ${zoom()}", closer)
        waitUntilAtRest(rider)
        assertEquals("the step in held", start + 1, zoom(), log2(1.02))
        assertTrue(whereTheMiddleShows(), isBesideThePanel(rider))
        screenshot("panel-t263-closer")

        onMain { controller.zoom(by = -2) }
        val further = waitFor(6_000) { abs(zoom() - (start - 1)) < log2(1.04) }
        assertTrue("$start → ${zoom()}", further)
        waitUntilAtRest(rider)
        assertTrue(whereTheMiddleShows(), isBesideThePanel(rider))
    }

    /** A controller allowed to locate that hears only the fixes the test gives it, with `scooters` about. */
    private fun controller(location: TestLocation = TestLocation(), scooters: List<Scooter> = emptyList()) = ScooterMapController(
        api = object : ScooterAPIClient {
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(vehicles = scooters)
        },
        locationManager = location,
        defaults = InMemoryScooterDefaults(),
        scope = scope,
        directions = object : WalkingDirectionsClient {
            override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> = emptyList()
        },
        openInMaps = {},
        phoneLanguages = { listOf("en-GB") },
    )

    /**
     * The screen over the live map with `controller`, edge to edge, once the map has its camera: in a phone's width
     * if `phone` says so, started as the activity starts it if `start` does, and with its first layout held up
     * `firstLayoutTaking` milliseconds, as on a slow phone.
     */
    private fun show(controller: ScooterMapController, phone: Boolean = false, start: Boolean = false, firstLayoutTaking: Long = 0) {
        this.controller = controller
        var slowed = false
        val content: @Composable () -> Unit = {
            val given = LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(given.density, textScale.value ?: given.fontScale)) {
                val size = if (phone) Modifier.size(402.dp, 800.dp) else Modifier.fillMaxSize()
                Box(
                    size.onSizeChanged {
                        if (firstLayoutTaking > 0 && !slowed) {
                            slowed = true
                            Thread.sleep(firstLayoutTaking)
                        }
                    },
                ) {
                    ScooterMapScreen(
                        controller = controller,
                        map = { dark -> ScooterMap(controller, zurichStart, MapCameraMemory(), tiles, dark) },
                    )
                }
            }
        }
        // The activity keeps itself through a turn, but the first launch after the app is installed makes a new
        // one once, which shows the screen too.
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
            if (start) controller.start()
        }
        assertTrue("the map's camera", waitFor(30_000) { onMain { mapIn(activity.window.decorView)?.camera != null } })
        // The first launch after the app is installed makes its new activity about two seconds in.
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

    /** The rider found at `place`. */
    private fun locate(place: GeoPoint) = onMain { controller.locationsUpdated(listOf(fix(place))) }

    /** The map's padding, in points: MapKit's margins as MapLibre has them. */
    private fun padding(): MapInsets = onMain {
        val ratio = mapView.pixelRatio.toDouble()
        val padding = map.cameraPosition.padding ?: DoubleArray(4)
        MapInsets(top = padding[1] / ratio, left = padding[0] / ratio, bottom = padding[3] / ratio, right = padding[2] / ratio)
    }

    private fun zoom(): Double = onMain { map.cameraPosition.zoom }

    private fun shown(place: GeoPoint): ScreenPoint = onMain { projection.point(place) }

    /** The middle of the map right of the panel, 16 from the edge and `panel` wide. */
    private fun middleBesideThePanel(panel: Double = 380.0): ScreenPoint =
        onMain { projection.bounds }.let { ScreenPoint((16 + panel + it.maxX) / 2, it.midY) }

    /** Whether a place is in the middle of the map right of the panel, within a little. */
    private fun isBesideThePanel(place: GeoPoint, panel: Double = 380.0) = shows(place, at = middleBesideThePanel(panel))

    /** Whether a place shows at `point` on the map, within `tolerance` points. */
    private fun shows(place: GeoPoint, at: ScreenPoint, tolerance: Double = 24.0): Boolean {
        val shown = shown(place)
        return abs(shown.x - at.x) <= tolerance && abs(shown.y - at.y) <= tolerance
    }

    /**
     * The place shows at `point` once the map has settled, and locating again leaves the map where it is, within
     * `within` points, at its zoom: it is where that move puts it.
     */
    private fun assertLanded(place: GeoPoint, at: ScreenPoint, within: Double = 3.0) {
        waitFor(3_000) { shows(place, at, tolerance = 8.0) }
        waitUntilAtRest(place)
        val shown = shown(place)
        assertTrue("$shown for $at", shows(place, at, tolerance = 8.0))
        val zoom = zoom()
        onMain { controller.focusOnUser() }
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

    /** The rider, the camera's centre, the map's size and its margins, for a failure to say where the step went. */
    private fun whereTheMiddleShows(): String = onMain {
        "rider ${projection.point(rider)}, centre ${projection.point(projection.centerCoordinate)}, bounds ${projection.bounds}, " +
            "margins ${mapView.camera?.margins}"
    }

    /** Turns the tablet upright or across, as the rider does, and waits for the screen, and the screen shown, to have turned. */
    private fun turn(upright: Boolean, waits: Boolean = true) {
        if (upright) device.setOrientationPortrait() else device.setOrientationLandscape()
        if (!waits) return
        assertTrue("turned", waitFor(10_000) { (device.displayHeight > device.displayWidth) == upright })
        if (scenario != null) {
            val shown = waitFor(10_000) { onMain { activity.window.decorView.let { it.height > it.width } } == upright }
            assertTrue("the window turned", shown)
        }
    }

    /** The status bar leaves, and its room with it. */
    private fun hideTheStatusBar() = onMain {
        WindowCompat.getInsetsController(activity.window, activity.window.decorView).hide(WindowInsetsCompat.Type.statusBars())
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

    /** The rider's location, allowed, with the fix the phone kept from before or none; fixes come from the test. */
    private class TestLocation(private val kept: ScooterLocationFix? = null) : ScooterLocationManager {
        override val authorizationStatus = ScooterAuthorizationStatus.AuthorizedWhenInUse
        override val location: ScooterLocationFix? get() = kept
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

        /** iOS's accessibility1 and accessibility3 over its large: 28 and 40 points of body text over 17. */
        const val ACCESSIBILITY_1 = 28f / 17
        const val ACCESSIBILITY_3 = 40f / 17

        val rider = GeoPoint(47.3720, 8.5390)

        fun fix(at: GeoPoint) = ScooterLocationFix(at, horizontalAccuracy = 5.0, timestamp = Instant.now())
    }
}
