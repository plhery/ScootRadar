package com.plhery.scootradar.map

import android.app.Activity
import android.app.Application
import android.graphics.Bitmap
import android.graphics.Rect
import android.os.Bundle
import android.os.SystemClock
import android.util.Log
import android.view.InputDevice
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterDeviceOrientation
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterLocationManager
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.showWalkingRoute
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterResponseMetadata
import com.plhery.scootradar.core.model.ScooterWalkPhase
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.ui.ScooterMapScreen
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import okhttp3.OkHttpClient
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import java.io.File
import java.time.Instant
import java.util.Locale
import java.util.regex.Pattern
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.log2
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

/**
 * The camera and the map's own ornaments at the window's own size, on whatever device runs it and in whatever
 * posture, edge to edge as MainActivity has it: the device matrix's camera pass (X.md X-M03 to X-M11). Locating puts
 * the rider in the middle of the part of the map beside the panel or the fold, at a span grown with the window
 * (MAP-038, MAP-041, MAP-072); a card's header centres its scooter in the part of the map left in view (MAP-042,
 * MAP-043); a walk's route is fitted in that part (MAP-176, MAP-177); and the compass, the scale and the credits sit
 * where the iPhone's and the iPad's do, clear of the chrome (MAP-021 to MAP-023, MAP-034, MAP-318). Fingers on the
 * part of the map in view pinch, turn and tilt it, a double tap zooms it in, a long press does nothing and a tap on a
 * dot chooses its scooter (MAP-199 to MAP-213), as real touches through the window.
 *
 * The places are measured from the chrome's frames the screen hands the map, as ScooterMapView.swift's are from
 * those ScooterMapScreen.swift hands it, so the same test holds on a phone, a tablet upright or across, a foldable
 * folded, open or half open, and a window of any size. The screens are kept in the run's additional output, as
 * window-<width>x<height>-*.png, the window's size in points.
 *
 * No compose rule: its test clock would move the camera only while the test waits for it.
 */
@RunWith(AndroidJUnit4::class)
class MapInTheWindowTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val device = UiDevice.getInstance(instrumentation)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current
    private val launchLocale = ScooterLanguage.launchLocale
    private val tiles = GroundTiles.openFreeMap(OkHttpClient())
    private val application = ApplicationProvider.getApplicationContext<Application>()
    private var scenario: ActivityScenario<ComponentActivity>? = null
    private var recreations: Application.ActivityLifecycleCallbacks? = null
    private lateinit var activity: ComponentActivity
    private lateinit var controller: ScooterMapController
    private lateinit var mapView: ScooterMapView
    private lateinit var map: MapLibreMap
    private lateinit var projection: MapLibreProjection

    /** What the server answers once a test has set it; until then the scooters the controller was made with. */
    @Volatile
    private var served: ScooterResponse? = null

    @Before
    fun setUp() {
        Locale.setDefault(Locale.UK)
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        // The map gone first: the rider's breath draws frames back to back on a busy emulator, and the scenario
        // closes only once the main thread is idle.
        if (scenario != null) onMain { activity.setContent { } }
        scenario?.close()
        recreations?.let(application::unregisterActivityLifecycleCallbacks)
        scope.cancel()
        ScooterLanguage.current = language
        ScooterLanguage.launchLocale = launchLocale
        Locale.setDefault(locale)
    }

    /**
     * Located, the rider shows in the middle of the part of the map beside a panel or a fold, across, and of the whole
     * map up and down (MAP-041), or of the upright half beside a panel above a tabletop's fold, as the map takes the
     * upright half there (the lead's decision of 30 Oct); elsewhere in the middle of the map inside its margins. The
     * span is locating's 350 m, grown by the window's shorter side past a phone's 440 points.
     */
    @Test
    fun locatingPutsTheRiderInTheMiddleOfThePartOfTheMapInView() {
        show(controller())
        locate(rider)
        assertTrue("the move to the rider", waitFor(LOCATING) { onMain { map.cameraPosition.target }?.let { hypot(it.latitude - rider.latitude, it.longitude - rider.longitude) < 0.01 } == true })
        waitUntilAtRest(rider)
        val bounds = onMain { projection.bounds }
        val chrome = chrome()
        val part = partInView(chrome, bounds)
        val frame = frame(bounds)
        val expected = placed(part, bounds)
        // The move is measured once on the map tilted as it will be, as iOS's is: a place shown far from where the
        // margins put the centre lands past it, the ground nearer the eye being drawn larger.
        val past = 0.15 * abs(expected.y - frame.midY)
        screenshot("located")
        val shown = onMain { projection.point(rider) }
        Log.i(TAG, "${size()}: chrome $chrome, part $part, frame $frame, rider at $shown for $expected")
        assertEquals("across: $shown for $expected", expected.x, shown.x, 4.0)
        assertEquals("up and down: $shown for $expected", expected.y, shown.y, 4.0 + past)
        // Locating's span over the window's shorter side, as phones up to 440 points show it.
        val scale = max(1.0, min(bounds.width, bounds.height) / 440)
        val region = MapRegion.around(rider, 350 * scale, 350 * scale)
        assertEquals("the zoom for ${350 * scale} m", MapZoom.fitting(region, frame.width, frame.height), zoom(), log2(1.02))
    }

    /** A scooter's card header centres it in the part of the map in view: under the search bar, over the dock or beside the panel. */
    @Test
    fun aCardsHeaderCentresItsScooterInThePartOfTheMapInView() {
        val scooter = Scooter(provider = "voi", latitude = 47.3745, longitude = 8.5360, battery = 80, vehicleID = "s1", distanceMeters = 0.0)
        val controller = controller(scooters = listOf(scooter))
        show(controller)
        onMain { controller.updateViewport(zurichStart.region, zoom = 16) }
        assertTrue("the scooters", waitFor(30_000) { onMain { controller.vehicles.value.isNotEmpty() } })
        onMain { controller.selectScooter(scooter.id) }
        // The card in the dock or the panel, at its full height.
        Thread.sleep(2_000)
        onMain { controller.focusOnScooter(scooter) }
        Thread.sleep(600)
        waitUntilAtRest(scooter.point)
        val bounds = onMain { projection.bounds }
        val part = partInView(chrome(), bounds)
        screenshot("card")
        val shown = onMain { projection.point(scooter.point) }
        Log.i(TAG, "${size()}: chrome ${chrome()}, part $part, scooter at $shown")
        // Measured once on the tilted map, as iOS's is: a scooter moved far up from where the margins show the centre
        // lands a little short, as on a phone's map over the dock (100 points up, 5 short).
        val past = 0.15 * abs(part.midY - frame(bounds).midY)
        if (part.width >= 44) assertEquals("across: $shown in $part", part.midX, shown.x, 3.0)
        if (part.height >= 44) assertEquals("up and down: $shown in $part", part.midY, shown.y, 3.0 + past)
    }

    /** A walk's route is fitted in the part of the map in view, 40 points in from its edges, and fills it one way. */
    @Test
    fun aWalksRouteIsFittedInThePartOfTheMapInView() {
        val scooter = Scooter(provider = "voi", latitude = 47.3812, longitude = 8.5462, battery = 80, vehicleID = "s1", distanceMeters = 0.0)
        val route = listOf(rider, GeoPoint(47.3760, 8.5370), GeoPoint(47.3790, 8.5440), scooter.point)
        val controller = controller(scooters = listOf(scooter), route = route)
        show(controller)
        locate(rider)
        assertTrue("the move to the rider", waitFor(LOCATING) { onMain { map.cameraPosition.target }?.let { hypot(it.latitude - rider.latitude, it.longitude - rider.longitude) < 0.01 } == true })
        waitUntilAtRest(rider)
        onMain { controller.updateViewport(zurichStart.region, zoom = 16) }
        assertTrue("the scooters", waitFor(30_000) { onMain { controller.vehicles.value.isNotEmpty() } })
        onMain { controller.selectScooter(scooter.id) }
        Thread.sleep(2_000)
        onMain { controller.showWalkingRoute(ScooterWalkTarget.Scooter(scooter)) }
        assertTrue("the route shown", waitFor(10_000) { onMain { controller.walk.value?.phase } == ScooterWalkPhase.Shown })
        // The fit's move, then the reveal's 0.7 s.
        Thread.sleep(3_000)
        waitUntilAtRest(scooter.point)
        val bounds = onMain { projection.bounds }
        val part = partInView(chrome(), bounds)
        val inside = part.insetBy(FIT_MARGIN - 1, FIT_MARGIN - 1) ?: part
        screenshot("route")
        val points = onMain { route.map { projection.point(it) } }
        Log.i(TAG, "${size()}: chrome ${chrome()}, part $part, route at $points")
        for (point in points) assertTrue("$point in $inside", inside.contains(point))
        // Fitted: as wide or as high as the part less its margins allow, give or take.
        val width = points.maxOf { it.x } - points.minOf { it.x }
        val height = points.maxOf { it.y } - points.minOf { it.y }
        val filled = max(width / (part.width - 2 * FIT_MARGIN), height / (part.height - 2 * FIT_MARGIN))
        assertTrue("the route fills ${"%.2f".format(filled)} of $part", filled > 0.85)
    }

    /**
     * A tap on a cluster of the server's opens it where a place located shows, beside a panel or a fold as over the
     * dock: a group of cities onto their bounds (MAP-050), a city total onto a city's span and a cluster two zoom levels
     * closer (MAP-051, MAP-147), each centred in the middle of the part of the map beside the panel or the fold across
     * and of the whole map up and down, as the iPhone's tap gives setRegionPreservingPerspective the part left visible
     * (ScooterMapView.swift:1877-1907), and elsewhere in the middle of the map's margins. A tap with a scooter's dot in
     * reach chooses the scooter as well (MAP-209).
     */
    @Test
    fun aTapOnAClusterOfTheServersShowsItsRegionWhereAPlaceLocatedShows() {
        val controller = controller()
        show(controller)
        val bounds = onMain { projection.bounds }
        val part = partInView(chrome(), bounds)
        // Zürich from high enough for the server to group its scooters.
        val opening = onMain {
            val zurich = zurichStart.region.center
            map.moveCamera(CameraUpdateFactory.newCameraPosition(CameraPosition.Builder(map.cameraPosition).target(LatLng(zurich.latitude, zurich.longitude)).zoom(9.0).build()))
            map.cameraPosition
        }
        fun at(x: Double, y: Double) = onMain { projection.coordinate(ScreenPoint(part.minX + part.width * x, part.minY + part.height * y)) }
        val groupAt = at(0.3, 0.3)
        val cityAt = at(0.7, 0.3)
        val cellAt = at(0.6, 0.7)
        val group = ScooterCluster(
            "group:city:ch:Zürich", groupAt.latitude, groupAt.longitude, count = 1_900, providers = mapOf("voi" to 1_900), city = "Zürich, Winterthur",
            bounds = GeoBounds(south = groupAt.latitude - 0.1, west = groupAt.longitude - 0.15, north = groupAt.latitude + 0.05, east = groupAt.longitude + 0.2),
        )
        val city = ScooterCluster("city:ch:Zürich", cityAt.latitude, cityAt.longitude, count = 1_288, providers = mapOf("lime" to 700, "voi" to 588), city = "Zürich")
        val cell = ScooterCluster("9:268:179", cellAt.latitude, cellAt.longitude, count = 12, providers = mapOf("voi" to 12))
        // A scooter the server sends alone, 20 points before the cluster.
        val alone = onMain { projection.point(cellAt) }.let { point ->
            val place = onMain { projection.coordinate(ScreenPoint(point.x - 20, point.y)) }
            Scooter(provider = "lime", latitude = place.latitude, longitude = place.longitude, battery = 80, vehicleID = "alone", distanceMeters = 0.0)
        }
        served = ScooterResponse(
            vehicles = listOf(alone),
            clusters = listOf(group, city, cell),
            meta = ScooterResponseMetadata(partial = false, failedSources = emptyList(), mode = "clusters"),
        )
        onMain { controller.updateViewport(MapZoom.region(of = projection.visibleMapRect), zoom = 9) }
        assertTrue("the clusters drawn", waitFor(30_000) { onMain { mapView.markers?.scene?.clusters()?.size } == 3 })

        // A city's span is a phone's, grown with the window's shorter side, as when a city is chosen.
        val citySpan = max(1.0, min(bounds.width, bounds.height) / 440)
        for ((cluster, centre, inReach) in listOf(Triple(group, group.bounds!!.center, false), Triple(city, cityAt, false), Triple(cell, cellAt, true))) {
            onMain { map.moveCamera(CameraUpdateFactory.newCameraPosition(opening)) }
            Thread.sleep(1_000)
            val point = onMain { projection.point(cluster.coordinate) }
            assertTrue("${cluster.id} at $point in $part", part.contains(point))
            // On the cluster's view, and with the scooter in reach on the dot's square.
            val tap = if (inReach) ScreenPoint(point.x - 10, point.y) else point
            fingers(tap to tap, millis = 40, steps = 1)
            assertTrue("${cluster.id} opened", waitFor(5_000) { zoom() > opening.zoom + 0.5 })
            waitUntilAtRest(centre)
            val expected = placed(part, bounds)
            val shown = onMain { projection.point(centre) }
            val landed = replayed(centre, expected, measuredOn = onMain { CameraPosition.Builder(map.cameraPosition).target(LatLng(centre.latitude, centre.longitude)).build() })
            screenshot("cluster-${cluster.id.substringBefore(':')}")
            Log.i(TAG, "${size()}: ${cluster.id} at $shown for $expected, measured once $landed, part $part")
            assertEquals("${cluster.id} across: $shown for $expected", landed.x, shown.x, 3.0)
            assertEquals("${cluster.id} up and down: $shown for $expected", landed.y, shown.y, 3.0)
            assertEquals("${cluster.id} across, as iOS shows it: $shown for $expected", expected.x, shown.x, 3.0)
            if (cluster === city) {
                val frame = fittedIn(bounds)
                val region = MapRegion(centre, latitudeDelta = 0.08 * citySpan, longitudeDelta = 0.12 * citySpan)
                assertEquals("the zoom for a city's span", MapZoom.fitting(region, frame.width, frame.height), zoom(), log2(1.02))
            }
            if (inReach) assertEquals("the scooter in reach chosen", alone.id, onMain { controller.selectedScooterID.value })
        }
    }

    /**
     * In a region that measures in miles, the map turned and zooming: the compass 16 in from the trailing edge, level
     * with the panel's top or under the search bar; the scale at the same height on the leading side, past the
     * panel; the credits at the foot of the part of the map in view, past the panel by the map's leading margin.
     */
    @Test
    fun theCompassScaleAndCreditsSitInThePartOfTheMapInView() {
        ScooterLanguage.launchLocale = { Locale.US }
        show(controller())
        Thread.sleep(1_000)
        onMain { map.moveCamera(CameraUpdateFactory.bearingTo(30.0)) }
        val compass = device.wait(Until.findObject(By.desc("Compass")), 5_000)
        assertNotNull("the compass", compass)
        val bounds = onMain { projection.bounds }
        val chrome = chrome()
        val safe = safeArea()
        val top = ornamentsTop(chrome, bounds, safe.top)
        val compassFrame = inMap(compass.visibleBounds)
        Log.i(TAG, "${size()}: chrome $chrome, safe $safe, compass $compassFrame, ornaments' top $top")
        // By its middle: TalkBack's frame is the 48 a finger needs around the 44 drawn.
        val half = MapOrnaments.COMPASS_SIZE / 2
        assertEquals("the compass's trailing edge: $compassFrame", bounds.maxX - safe.right - MapOrnaments.EDGE_GAP - half, compassFrame.midX, 1.0)
        assertEquals("the compass's top: $compassFrame", top + half, compassFrame.midY, 1.0)

        val credits = device.findObject(By.text("© OpenStreetMap"))
        assertNotNull("the credits", credits)
        val creditsFrame = inMap(credits.visibleBounds)
        val margins = onMain { mapView.camera!!.margins }
        Log.i(TAG, "${size()}: credits $creditsFrame, margins $margins")
        val part = partInView(chrome, bounds)
        // By its middle again: the 18 drawn lie in the middle of the 48 TalkBack is given.
        assertTrue("the credits $creditsFrame within the map's foot ${bounds.maxY - safe.bottom}", creditsFrame.midY + 9 <= bounds.maxY - safe.bottom + 1)
        assertTrue("the credits $creditsFrame past the leading margin $margins", creditsFrame.minX >= max(margins.left, safe.left) - 1)
        assertTrue("the credits $creditsFrame in the part in view $part", creditsFrame.minX >= part.minX - 1 && creditsFrame.minY >= part.minY - 1)
        chrome.panel?.takeIf { !it.isEmpty }?.let { assertTrue("the credits $creditsFrame clear of the panel $it", !it.intersects(creditsFrame)) }

        // A zoom step: the scale shows while the map zooms, level with the compass, past the panel.
        onMain { map.animateCamera(CameraUpdateFactory.zoomBy(1.0), 1_000) }
        val scale = device.wait(Until.findObject(By.desc(Pattern.compile(".*\\b(feet|foot|miles?)$"))), 1_500)
        assertNotNull("the scale while the map zooms", scale)
        val scaleFrame = inMap(scale.visibleBounds)
        screenshot("ornaments")
        Log.i(TAG, "${size()}: scale $scaleFrame")
        assertEquals("the scale's top: $scaleFrame", top, scaleFrame.minY, 1.0)
        val leading = if (margins.left > 0 && chrome.panel != null) margins.left else safe.left + MapOrnaments.EDGE_GAP
        assertEquals("the scale's leading edge: $scaleFrame", leading, scaleFrame.minX, 1.0)
    }

    /**
     * Two fingers spread in the part of the map in view zoom it in, and turned they turn it, which shows the compass;
     * pushed up together they tilt it, no more than MapKit's camera would tilt at that zoom (MAP-199, MAP-200,
     * MAP-322). A hand on the map ends the move to the rider under way (MAP-047).
     */
    @Test
    fun twoFingersZoomTurnAndTiltTheMapInTheWindow() {
        show(controller())
        // Once the map has opened where it starts.
        Thread.sleep(1_500)
        waitUntilAtRest(zurichStart.region.center)
        val part = partInView(chrome(), onMain { projection.bounds })
        val centre = ScreenPoint(part.midX, part.midY)
        val reach = min(part.width, part.height) / 4

        val before = zoom()
        // Spread quickly, as a hand does: MapLibre starts a pinch only from 0.6 points a millisecond.
        fingers(
            ScreenPoint(centre.x, centre.y - reach / 3) to ScreenPoint(centre.x, centre.y - reach * 1.2),
            ScreenPoint(centre.x, centre.y + reach / 3) to ScreenPoint(centre.x, centre.y + reach * 1.2),
            millis = 150,
            steps = 6,
        )
        Thread.sleep(800)
        assertTrue("a pinch out from ${"%.2f".format(before)} to ${"%.2f".format(zoom())}", zoom() > before + 0.8)
        screenshot("pinched")

        // Turned a sixth of a turn about the middle, at the same reach.
        fingers { done ->
            val angle = Math.toRadians(60.0 * done)
            val (dx, dy) = reach * cos(angle) to reach * sin(angle)
            listOf(ScreenPoint(centre.x - dx, centre.y - dy), ScreenPoint(centre.x + dx, centre.y + dy))
        }
        Thread.sleep(800)
        val bearing = onMain { map.cameraPosition.bearing }
        assertTrue("turned to $bearing°", bearing in 10.0..350.0)
        assertNotNull("the compass", device.wait(Until.findObject(By.desc("Compass")), 3_000))

        val tilt = onMain { map.cameraPosition.tilt }
        fingers(
            ScreenPoint(centre.x - reach / 2, centre.y + reach) to ScreenPoint(centre.x - reach / 2, centre.y - reach),
            ScreenPoint(centre.x + reach / 2, centre.y + reach) to ScreenPoint(centre.x + reach / 2, centre.y - reach),
            millis = 900,
        )
        Thread.sleep(800)
        val (tilted, most) = onMain {
            val position = map.cameraPosition
            position.tilt to MapZoom.mostTilt(position.zoom, position.target!!.latitude, mapView.camera!!.mapKit)
        }
        screenshot("tilted")
        Log.i(TAG, "${size()}: tilted from $tilt to $tilted, at most $most")
        assertTrue("tilted from $tilt to $tilted", tilted > tilt + 5)
        assertTrue("tilted $tilted, MapKit's most $most", tilted <= most + 0.5)

        // Locating, then a hand on the map before the move lands: the map stays where the hand leaves it.
        locate(rider)
        Thread.sleep(150)
        fingers(ScreenPoint(centre.x, centre.y) to ScreenPoint(centre.x + reach, centre.y + reach / 2), millis = 300)
        val left = onMain { map.cameraPosition.target!! }
        Thread.sleep(2_500)
        val now = onMain { map.cameraPosition.target!! }
        assertEquals("the map left where the hand left it", left.latitude, now.latitude, 1e-5)
        assertEquals("the map left where the hand left it", left.longitude, now.longitude, 1e-5)
    }

    /**
     * A double tap zooms in a step around the finger, and a long press does nothing: no scooter chosen, no move
     * (MAP-199, MAP-213). A tap on a scooter's dot chooses it at once (MAP-202, MAP-204, MAP-305), its card opening in
     * the dock or the panel.
     */
    @Test
    fun aDoubleTapZoomsInALongPressDoesNothingAndATapChoosesAScooter() {
        val scooter = Scooter(provider = "voi", latitude = 47.3769, longitude = 8.5417, battery = 80, vehicleID = "s1", distanceMeters = 0.0)
        val controller = controller(scooters = listOf(scooter))
        show(controller)
        onMain { map.moveCamera(CameraUpdateFactory.newLatLngZoom(LatLng(47.3769, 8.5417), 16.0)) }
        onMain { controller.updateViewport(zurichStart.region, zoom = 17) }
        assertTrue("the scooters", waitFor(30_000) { onMain { controller.mapScooters.value.isNotEmpty() } })
        Thread.sleep(1_500)
        val part = partInView(chrome(), onMain { projection.bounds })
        // Away from the scooter, in the part of the map in view.
        val empty = ScreenPoint(part.minX + part.width / 4, part.minY + part.height / 4)

        val camera = onMain { map.cameraPosition }
        fingers(empty to empty, millis = 900, steps = 10)
        Thread.sleep(1_200)
        val pressed = onMain { map.cameraPosition }
        assertEquals("no move after a long press", camera.zoom, pressed.zoom, 1e-6)
        assertEquals(camera.target!!.latitude, pressed.target!!.latitude, 1e-7)
        assertEquals(null, onMain { controller.selectedScooterID.value })

        val kept = onMain { projection.coordinate(empty) }
        fingers(empty to empty, millis = 40, steps = 1)
        Thread.sleep(80)
        fingers(empty to empty, millis = 40, steps = 1)
        Thread.sleep(1_500)
        assertEquals("a step in", camera.zoom + 1, zoom(), 0.1)
        val stayed = onMain { projection.point(kept) }
        assertEquals("around the finger: $stayed for $empty", empty.x, stayed.x, 8.0)
        assertEquals("around the finger: $stayed for $empty", empty.y, stayed.y, 8.0)

        // The step in took the scooter away from the finger, under the dock in a short window: it comes back to where
        // the map shows its centre, in the part in view.
        onMain { map.moveCamera(CameraUpdateFactory.newLatLng(LatLng(scooter.latitude, scooter.longitude))) }
        Thread.sleep(1_000)
        val dot = onMain { projection.point(scooter.point) }
        assertTrue("the scooter at $dot in $part", part.contains(dot))
        val tapped = System.nanoTime()
        fingers(dot to dot, millis = 40, steps = 1)
        assertTrue("the scooter chosen", waitFor(1_000) { onMain { controller.selectedScooterID.value } == scooter.id })
        Log.i(TAG, "${size()}: chosen ${(System.nanoTime() - tapped) / 1_000_000} ms after the tap")
        Thread.sleep(1_500)
        screenshot("chosen")
    }

    /** A controller allowed to locate that hears only the fixes the test gives it, with `scooters` about and the walks' `route`. */
    private fun controller(scooters: List<Scooter> = emptyList(), route: List<GeoPoint> = emptyList()) = ScooterMapController(
        api = object : ScooterAPIClient {
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = served ?: ScooterResponse(vehicles = scooters)
        },
        locationManager = TestLocation(),
        defaults = InMemoryScooterDefaults(),
        scope = scope,
        directions = object : WalkingDirectionsClient {
            override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> = route
        },
        openInMaps = {},
        phoneLanguages = { listOf("en-GB") },
    )

    /** The app's screen over the live map with `controller`, edge to edge, filling the window, once the map has its camera and chrome. */
    private fun show(controller: ScooterMapController) {
        this.controller = controller
        val content: ComponentActivity.() -> Unit = {
            enableEdgeToEdge()
            setContent {
                ScooterMapScreen(
                    controller = controller,
                    map = { dark -> ScooterMap(controller, zurichStart, MapCameraMemory(), tiles, dark) },
                )
            }
        }
        // The first launch after the app is installed makes a new activity once, which shows the screen too.
        val recreated = object : Application.ActivityLifecycleCallbacks {
            override fun onActivityCreated(created: Activity, savedInstanceState: Bundle?) {
                if (savedInstanceState == null || created !is ComponentActivity) return
                activity = created
                created.content()
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
            it.content()
        }
        assertTrue("the map's camera", waitFor(30_000) { onMain { mapIn(activity.window.decorView)?.camera?.currentChrome != null } })
        if (!launchedBefore) {
            launchedBefore = true
            Thread.sleep(3_000)
            assertTrue("the map's camera", waitFor(30_000) { onMain { mapIn(activity.window.decorView)?.camera?.currentChrome != null } })
        }
        onMain {
            mapView = mapIn(activity.window.decorView)!!
            mapView.getMapAsync { map = it }
            projection = MapLibreProjection(map, mapView)
        }
        // The chrome measured: the search bar over the dock, or the panel.
        assertTrue("the chrome's frames", waitFor(10_000) { chrome().let { it.top != null || it.panel != null } })
        Thread.sleep(1_000)
    }

    private fun mapIn(view: View): ScooterMapView? =
        view as? ScooterMapView ?: (view as? ViewGroup)?.let { group -> (0 until group.childCount).firstNotNullOfOrNull { mapIn(group.getChildAt(it)) } }

    /** The chrome's frames as the screen hands them to the map, in the map's points. */
    private fun chrome(): MapChrome = onMain { mapView.camera!!.currentChrome!!.invoke() }

    /** The window's safe area, in points: its bars and cutout. */
    private fun safeArea(): MapInsets = onMain {
        val insets = ViewCompat.getRootWindowInsets(mapView)!!.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
        val density = mapView.resources.displayMetrics.density.toDouble()
        MapInsets(top = insets.top / density, left = insets.left / density, bottom = insets.bottom / density, right = insets.right / density)
    }

    /**
     * The part of the map in view (ScooterMapView.swift visibleRect, MAP-043, MAP-044): under the search bar, else the
     * safe area's top, down to the locate button over the dock; beside a panel; then on the side of a fold where the
     * map shows, above one across it, right of one down it unless the panel is right of it.
     */
    private fun partInView(chrome: MapChrome, bounds: ScreenRect): ScreenRect {
        val safeTop = safeArea().top
        val top = chrome.top?.takeIf { !it.isEmpty }?.maxY ?: safeTop
        val bottom = chrome.bottomTop ?: bounds.maxY
        var part = ScreenRect(bounds.x, top, bounds.width, bottom - top)
        chrome.panel?.takeIf { !it.isEmpty }?.let { panel ->
            part = if (panel.midX < bounds.midX) {
                ScreenRect(panel.maxX, part.y, bounds.maxX - panel.maxX, part.height)
            } else {
                ScreenRect(bounds.minX, part.y, panel.minX - bounds.minX, part.height)
            }
        }
        val fold = chrome.fold?.takeIf { !it.isEmpty && it.intersects(bounds) } ?: return part
        val beside = if (fold.width > fold.height) {
            val minY = if (part.minY < fold.minY) part.minY else safeTop
            ScreenRect(part.x, minY, part.width, min(part.maxY, fold.minY) - minY)
        } else if (chrome.panel?.let { !it.isEmpty && it.midX > fold.midX } == true) {
            ScreenRect(part.x, part.y, min(part.maxX, fold.minX) - part.x, part.height)
        } else {
            val minX = max(part.minX, fold.maxX)
            ScreenRect(minX, part.y, part.maxX - minX, part.height)
        }
        return if (beside.width >= 44 && beside.height >= 44) beside else part
    }

    /** The map inside its margins, where it shows its centre. */
    private fun frame(bounds: ScreenRect): ScreenRect {
        val margins = onMain { mapView.camera!!.margins }
        return ScreenRect(bounds.x + margins.left, bounds.y + margins.top, bounds.width - margins.left - margins.right, bounds.height - margins.top - margins.bottom)
    }

    /** Where a region is fitted: inside the map's margins, and inside its safe area too where a panel or a fold moved them. */
    private fun fittedIn(bounds: ScreenRect): ScreenRect {
        val margins = onMain { mapView.camera!!.margins }
        return if (margins == MapInsets.zero) frame(bounds) else MapCamera.within(bounds, margins, safeArea())
    }

    /**
     * Where a place located or a region opened shows (setRegionPreservingPerspective, MAP-041): beside a panel or a
     * fold down the map, in the middle of the `part` of the map in view across and of the whole map up and down
     * (aside); beside a panel above a tabletop's fold, in the middle of the part, the upright half, by iOS's rule that
     * the map takes it (the lead's decision of 30 Oct); elsewhere in the middle of the map's margins.
     */
    private fun placed(part: ScreenRect, bounds: ScreenRect): ScreenPoint {
        val frame = frame(bounds)
        val across = chrome().fold?.takeIf { !it.isEmpty && it.intersects(bounds) && it.width > it.height }
        return when {
            abs(part.midX - bounds.midX) < 1 -> ScreenPoint(frame.midX, frame.midY)
            across != null -> ScreenPoint(part.midX, part.midY)
            else -> ScreenPoint(part.midX, bounds.midY)
        }
    }

    /**
     * Where a move that measures once shows `place`, meaning to show it at `expected`, as ScooterMapCameraPolicy.center
     * and the iPhone's center(showing:) measure it: on the map at the camera `measuredOn`, the place's point moved by
     * the offset of the middle of the margins from `expected` is taken back to a place, and the camera centred there.
     * On a tilted map the ground nearer the eye is drawn larger, so the place lands a little down the screen from
     * `expected`: past it moved down, short of it moved up. Replayed on the map itself, which is put back as it was.
     */
    private fun replayed(place: GeoPoint, expected: ScreenPoint, measuredOn: CameraPosition): ScreenPoint = onMain {
        val was = map.cameraPosition
        map.moveCamera(CameraUpdateFactory.newCameraPosition(measuredOn))
        val middle = projection.point(projection.centerCoordinate)
        val shown = projection.point(place)
        val centre = projection.coordinate(ScreenPoint(shown.x + middle.x - expected.x, shown.y + middle.y - expected.y))
        map.moveCamera(CameraUpdateFactory.newCameraPosition(CameraPosition.Builder(measuredOn).target(LatLng(centre.latitude, centre.longitude)).build()))
        val landed = projection.point(place)
        map.moveCamera(CameraUpdateFactory.newCameraPosition(was))
        landed
    }

    /**
     * The top of the compass and the scale (ScooterMapView.swift, MAP-022): the panel's top beside one; 12 under the
     * safe area's top above a fold across the map with the search bar under the fold or none; 80 under it with no
     * search bar; else 12 under the search bar.
     */
    private fun ornamentsTop(chrome: MapChrome, bounds: ScreenRect, safeTop: Double): Double {
        val search = chrome.top?.takeIf { !it.isEmpty }
        val across = chrome.fold?.takeIf { !it.isEmpty && it.intersects(bounds) && it.width > it.height }
        return when {
            chrome.panel != null && !chrome.panel!!.isEmpty -> chrome.panel!!.minY
            across != null && (search == null || search.minY >= across.minY) -> safeTop + 12
            search == null -> safeTop + 80
            else -> search.maxY + 12
        }
    }

    /** A frame on the screen, in pixels, in the map's points. */
    private fun inMap(screen: Rect): ScreenRect = onMain {
        val density = mapView.resources.displayMetrics.density.toDouble()
        val at = IntArray(2).also { mapView.getLocationOnScreen(it) }
        ScreenRect((screen.left - at[0]) / density, (screen.top - at[1]) / density, screen.width() / density, screen.height() / density)
    }

    /** One or two fingers drawn from their starts to their ends over `millis`, in the map's points. */
    private fun fingers(vararg paths: Pair<ScreenPoint, ScreenPoint>, millis: Long = 600, steps: Int = 30) =
        fingers(millis, steps) { done -> paths.map { (from, to) -> ScreenPoint(from.x + (to.x - from.x) * done, from.y + (to.y - from.y) * done) } }

    /**
     * Fingers on the screen where `at` puts them as the gesture is done from 0 to 1 over `millis`, in the map's
     * points: real touches, sent through the window as the screen sends them, so that the chrome over the map takes
     * those on it.
     */
    private fun fingers(millis: Long = 600, steps: Int = 30, at: (done: Double) -> List<ScreenPoint>) {
        val (origin, density) = onMain { IntArray(2).also { mapView.getLocationOnScreen(it) } to mapView.resources.displayMetrics.density }
        val count = at(0.0).size
        val properties = Array(count) { MotionEvent.PointerProperties().apply { id = it; toolType = MotionEvent.TOOL_TYPE_FINGER } }
        val down = SystemClock.uptimeMillis()
        fun send(action: Int, pointers: Int, done: Double) {
            val coordinates = at(done).map { point ->
                MotionEvent.PointerCoords().apply {
                    x = origin[0] + (point.x * density).toFloat()
                    y = origin[1] + (point.y * density).toFloat()
                    pressure = 1f
                    size = 1f
                }
            }.toTypedArray()
            val event = MotionEvent.obtain(down, SystemClock.uptimeMillis(), action, pointers, properties, coordinates, 0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0)
            instrumentation.uiAutomation.injectInputEvent(event, true)
            event.recycle()
        }
        val second = 1 shl MotionEvent.ACTION_POINTER_INDEX_SHIFT
        send(MotionEvent.ACTION_DOWN, 1, 0.0)
        if (count == 2) send(MotionEvent.ACTION_POINTER_DOWN or second, 2, 0.0)
        for (step in 1..steps) {
            SystemClock.sleep(millis / steps)
            send(MotionEvent.ACTION_MOVE, count, step.toDouble() / steps)
        }
        if (count == 2) send(MotionEvent.ACTION_POINTER_UP or second, 2, 1.0)
        send(MotionEvent.ACTION_UP, 1, 1.0)
    }

    private fun locate(place: GeoPoint) = onMain { controller.locationsUpdated(listOf(ScooterLocationFix(place, horizontalAccuracy = 5.0, timestamp = Instant.now()))) }

    private fun zoom(): Double = onMain { map.cameraPosition.zoom }

    /** The window's size in points, for the screens' names. */
    private fun size(): String = onMain { projection.bounds }.let { "${it.width.toInt()}x${it.height.toInt()}" }

    /** Waits for the place to keep its place and the camera its zoom for 600 ms, for 5 s at most. */
    private fun waitUntilAtRest(place: GeoPoint) {
        var shown = onMain { projection.point(place) }
        var zoom = zoom()
        var still = 0
        repeat(50) {
            Thread.sleep(100)
            val now = onMain { projection.point(place) }
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

    /** The screen now, kept as window-<size>-[name].png in the run's additional output. */
    private fun screenshot(name: String) {
        val bitmap = instrumentation.uiAutomation.takeScreenshot() ?: return
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            File(dir).mkdirs()
            File(dir, "window-${size()}-$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
    }

    /** The rider's location, allowed; fixes come from the test. */
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

    private val Scooter.point: GeoPoint get() = GeoPoint(latitude, longitude)

    private companion object {
        const val TAG = "MapInTheWindowTest"

        /** Whether an activity was launched in this process already. */
        var launchedBefore = false

        /** Long enough for a move to the rider on a slow emulator. */
        const val LOCATING = 20_000L

        /** How far in from the part in view a route is fitted (WalkTrailLook.fitMargin). */
        const val FIT_MARGIN = 40.0

        val rider = GeoPoint(47.3720, 8.5390)
    }
}
