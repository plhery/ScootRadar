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
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.font.createFontFamilyResolver
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterDeviceOrientation
import com.plhery.scootradar.core.map.ScooterLocationError
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterLocationManager
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.showWalkingRoute
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterResponseMetadata
import com.plhery.scootradar.core.model.ScooterWalkPhase
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneArea
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneResponse
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.ui.ScooterMapScreen
import com.plhery.scootradar.ui.chrome.LOCATION_CARD_TAG
import com.plhery.scootradar.ui.chrome.STATUS_BANNER_TAG
import com.plhery.scootradar.ui.chrome.ZONE_LEGEND_TAG
import com.plhery.scootradar.ui.dock.DOCK_TAG
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import okhttp3.OkHttpClient
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
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
import kotlin.math.floor
import kotlin.math.hypot
import kotlin.math.log2
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
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

    /** The operators' zones the server gives for any area. */
    @Volatile
    private var zones: List<ScooterZone> = emptyList()

    /** What the server answers once a test has set it; until then the scooters the controller was made with. */
    @Volatile
    private var served: ScooterResponse? = null

    /** iOS's margins as shownChrome last checked them, read back with the safe area, in points from the map's edges. */
    private var iosMargins: MapInsets? = null

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
     * upright half there (the lead's decision of 30 Oct); over the dock in the middle of the map, which keeps no
     * margins (placed). The span is locating's 350 m, grown by the window's shorter side past a phone's 440 points. A
     * step in from the keyboard then keeps what is there (MAP-049).
     */
    @Test
    fun locatingPutsTheRiderInTheMiddleOfThePartOfTheMapInView() {
        show(controller())
        locate(rider)
        assertTrue("the move to the rider", waitFor(LOCATING) { onMain { map.cameraPosition.target }?.let { hypot(it.latitude - rider.latitude, it.longitude - rider.longitude) < 0.01 } == true })
        waitUntilAtRest(rider)
        val bounds = onMain { projection.bounds }
        val chrome = shownChrome()
        val part = partInView(chrome, bounds)
        val frame = frame(bounds)
        val expected = placed(part, bounds)
        // The move is measured once on the map tilted as it will be, as iOS's is: replayed so, the place lands a
        // little down the screen from where it was meant to go, past it where the move takes it down.
        val landed = replayed(rider, expected, measuredOn = onMain { CameraPosition.Builder(map.cameraPosition).target(LatLng(rider.latitude, rider.longitude)).build() })
        screenshot("located")
        val shown = onMain { projection.point(rider) }
        Log.i(TAG, "${size()}: chrome $chrome, part $part, frame $frame, rider at $shown for $expected, measured once $landed")
        assertEquals("across: $shown for $expected", expected.x, shown.x, 3.0)
        assertLandsAsMeasuredOnce(shown, expected, landed)
        assertNoMarginsWithoutAPanelOrAFold(bounds)
        // Locating's span over the window's shorter side, as phones up to 440 points show it.
        val scale = max(1.0, min(bounds.width, bounds.height) / 440)
        val region = MapRegion.around(rider, 350 * scale, 350 * scale)
        assertEquals("the zoom for ${350 * scale} m", MapZoom.fitting(region, frame.width, frame.height), zoom(), log2(1.02))

        // A step in from the keyboard keeps what is shown where a place located shows (MAP-049, ScooterMapView.swift
        // applyZoom): beside a panel above a tabletop's fold the upright half's middle, not the fold (review-app-p
        // finding 3). Measured once on the tilted map, as iOS's step is.
        val kept = onMain { projection.coordinate(expected) }
        val unstepped = zoom()
        onMain { controller.zoom(by = 1) }
        assertTrue("the step in", waitFor(5_000) { zoom() > unstepped + 0.9 })
        waitUntilAtRest(kept)
        val stepped = onMain { projection.point(kept) }
        screenshot("stepped")
        Log.i(TAG, "${size()}: a step in from zoom $unstepped to ${zoom()}, what was at $expected now at $stepped")
        assertEquals("a step in", unstepped + 1, zoom(), 0.01)
        assertEquals("what was at $expected across after a step in: $stepped", expected.x, stepped.x, 3.0)
        assertEquals("what was at $expected up and down after a step in: $stepped", expected.y, stepped.y, 3.0)
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
        val before = onMain { map.cameraPosition }
        onMain { controller.focusOnScooter(scooter) }
        Thread.sleep(600)
        waitUntilAtRest(scooter.point)
        val bounds = onMain { projection.bounds }
        val chrome = shownChrome()
        val part = partInView(chrome, bounds)
        val expected = ScreenPoint(part.midX, part.midY)
        // Measured once on the map as it was, its zoom kept, as iOS's is: replayed so, a scooter moved far up from
        // where the margins show the centre lands a little short of its spot, down the screen from it, as on a
        // phone's map over the dock (100 points up, 5 short).
        val landed = replayed(scooter.point, expected, measuredOn = before)
        screenshot("card")
        val shown = onMain { projection.point(scooter.point) }
        Log.i(TAG, "${size()}: chrome $chrome, part $part, scooter at $shown for $expected, measured once $landed")
        if (part.width >= 44) assertEquals("across: $shown in $part, measured once $landed", landed.x, shown.x, 3.0)
        if (part.height >= 44) assertLandsAsMeasuredOnce(shown, expected, landed)
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
        val part = partInView(shownChrome(), bounds)
        val inside = part.insetBy(FIT_MARGIN - 1, FIT_MARGIN - 1) ?: part
        screenshot("route")
        // Measured flat: the fit is made in the plane of the map and the tilt kept, as iOS's fit hands its rect to
        // setRegionPreservingPerspective (ScooterMapView.swift fit), so on the tilted map the places nearer than the
        // middle come out a little further from it and the further ones a little nearer (2 points past the margin
        // beside a book's fold, right to left).
        val tilted = onMain { map.cameraPosition }
        val points = onMain {
            map.moveCamera(CameraUpdateFactory.newCameraPosition(CameraPosition.Builder(tilted).tilt(0.0).build()))
            route.map { projection.point(it) }.also { map.moveCamera(CameraUpdateFactory.newCameraPosition(tilted)) }
        }
        Log.i(TAG, "${size()}: chrome ${chrome()}, part $part, route at $points, flat, of the camera $tilted")
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
     * (ScooterMapView.swift:1877-1907), and over the dock in the middle of the map (placed). A tap with a scooter's dot in
     * reach chooses the scooter as well (MAP-209).
     */
    @Test
    fun aTapOnAClusterOfTheServersShowsItsRegionWhereAPlaceLocatedShows() {
        val controller = controller()
        show(controller)
        val bounds = onMain { projection.bounds }
        val part = partInView(shownChrome(), bounds)
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
            // Small enough to open well past the opening zoom in a tablet's upright part beside its panel, 388 wide.
            bounds = GeoBounds(south = groupAt.latitude - 0.03, west = groupAt.longitude - 0.05, north = groupAt.latitude + 0.02, east = groupAt.longitude + 0.06),
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
            assertTrue("${cluster.id} opened", waitFor(5_000) { zoom() > opening.zoom + 0.5 }.also { if (!it) Log.i(TAG, "${size()}: ${cluster.id} at zoom ${zoom()}") })
            waitUntilAtRest(centre)
            val expected = placed(part, bounds)
            val shown = onMain { projection.point(centre) }
            val landed = replayed(centre, expected, measuredOn = onMain { CameraPosition.Builder(map.cameraPosition).target(LatLng(centre.latitude, centre.longitude)).build() })
            screenshot("cluster-${cluster.id.substringBefore(':')}")
            Log.i(TAG, "${size()}: ${cluster.id} at $shown for $expected, measured once $landed, part $part")
            assertEquals("${cluster.id} across: $shown for $expected", landed.x, shown.x, 3.0)
            assertLandsAsMeasuredOnce(shown, expected, landed, cluster.id)
            assertEquals("${cluster.id} across, as iOS shows it: $shown for $expected", expected.x, shown.x, 3.0)
            if (cluster === city) {
                val frame = fittedIn(bounds)
                val region = MapRegion(centre, latitudeDelta = 0.08 * citySpan, longitudeDelta = 0.12 * citySpan)
                assertEquals("the zoom for a city's span", MapZoom.fitting(region, frame.width, frame.height), zoom(), log2(1.02))
            }
            if (inReach) assertEquals("the scooter in reach chosen", alone.id, onMain { controller.selectedScooterID.value })
        }
        assertNoMarginsWithoutAPanelOrAFold(bounds)
    }

    /**
     * On a map turned and tilted, a place located and a server cluster's region show where they do north up, and the
     * map keeps its turn and its tilt: setRegionPreservingPerspective keeps the camera's pitch and heading and measures
     * where the centre goes on the map as the camera will show it (ScooterMapView.swift:35-70; MAP-041, MAP-051). A
     * region shown north up, or measured so, would fail here (review-app-p finding 6).
     */
    @Test
    fun onAMapTurnedAndTiltedAPlaceLocatedAndAClusterOpenedShowWhereTheyDoNorthUp() {
        val controller = controller()
        show(controller)
        val bounds = onMain { projection.bounds }
        val part = partInView(shownChrome(), bounds)
        val expected = placed(part, bounds)
        onMain { map.moveCamera(CameraUpdateFactory.newCameraPosition(CameraPosition.Builder(map.cameraPosition).bearing(TURN).tilt(TILT).build())) }
        Thread.sleep(500)

        locate(rider)
        assertTrue("the move to the rider", waitFor(LOCATING) { onMain { map.cameraPosition.target }?.let { hypot(it.latitude - rider.latitude, it.longitude - rider.longitude) < 0.01 } == true })
        waitUntilAtRest(rider)
        val located = onMain { map.cameraPosition }
        val riderShown = onMain { projection.point(rider) }
        val riderLanded = replayed(rider, expected, measuredOn = CameraPosition.Builder(located).target(LatLng(rider.latitude, rider.longitude)).build())
        screenshot("turned-located")
        Log.i(TAG, "${size()}: turned and tilted, located at $located, the rider at $riderShown for $expected, measured once $riderLanded")
        assertEquals("the turn kept as the rider is located", TURN, located.bearing, 0.1)
        assertEquals("the tilt kept as the rider is located", TILT, located.tilt, 0.1)
        assertEquals("the rider across: $riderShown for $expected", expected.x, riderShown.x, 3.0)
        assertLandsAsMeasuredOnce(riderShown, expected, riderLanded, "the rider")

        // A city total of the server's, from high enough for the server to group its scooters, the map turned and
        // tilted as it was.
        val opening = onMain {
            val zurich = zurichStart.region.center
            map.moveCamera(CameraUpdateFactory.newCameraPosition(CameraPosition.Builder(located).target(LatLng(zurich.latitude, zurich.longitude)).zoom(9.0).build()))
            map.cameraPosition
        }
        val cityAt = onMain { projection.coordinate(ScreenPoint(part.minX + part.width * 0.65, part.minY + part.height * 0.35)) }
        val city = ScooterCluster("city:ch:Zürich", cityAt.latitude, cityAt.longitude, count = 1_288, providers = mapOf("lime" to 700, "voi" to 588), city = "Zürich")
        served = ScooterResponse(vehicles = emptyList(), clusters = listOf(city), meta = ScooterResponseMetadata(partial = false, failedSources = emptyList(), mode = "clusters"))
        onMain { controller.updateViewport(MapZoom.region(of = projection.visibleMapRect), zoom = 9) }
        assertTrue("the cluster drawn", waitFor(30_000) { onMain { mapView.markers?.scene?.clusters()?.size } == 1 })
        Thread.sleep(1_000)
        val point = onMain { projection.point(cityAt) }
        assertTrue("${city.id} at $point in $part", part.contains(point))
        fingers(point to point, millis = 40, steps = 1)
        assertTrue("${city.id} opened", waitFor(5_000) { zoom() > opening.zoom + 0.5 })
        waitUntilAtRest(cityAt)
        val opened = onMain { map.cameraPosition }
        val shown = onMain { projection.point(cityAt) }
        val landed = replayed(cityAt, expected, measuredOn = CameraPosition.Builder(opened).target(LatLng(cityAt.latitude, cityAt.longitude)).build())
        screenshot("turned-cluster")
        Log.i(TAG, "${size()}: turned and tilted, ${city.id} opened at $opened, at $shown for $expected, measured once $landed")
        assertEquals("the turn kept as the cluster opens", TURN, opened.bearing, 0.1)
        assertEquals("the tilt kept as the cluster opens", TILT, opened.tilt, 0.1)
        assertEquals("${city.id} across: $shown for $expected", expected.x, shown.x, 3.0)
        assertLandsAsMeasuredOnce(shown, expected, landed, city.id)
    }

    /**
     * A tap on a cluster of the app's own fits its scooters in the part of the map in view, 40 points in from its
     * edges, beside a panel or a fold as over the dock, as the iPhone fits a route there (MAP-052, MAP-147); a phone's
     * MapKit shows them with insets of its own, which the app's fit stands in for (MAP-302).
     */
    @Test
    fun aTapOnAClusterOfTheAppsFitsItsScootersInThePartOfTheMapInView() {
        val controller = controller()
        show(controller)
        val bounds = onMain { projection.bounds }
        val part = partInView(shownChrome(), bounds)
        // Zürich from high enough for the app to gather the scooters into clusters of its own.
        val opening = onMain {
            val zurich = zurichStart.region.center
            // Flat: the fit is made in the plane of the map, as iOS's is, and a tilt spreads the nearer scooters.
            map.moveCamera(CameraUpdateFactory.newCameraPosition(CameraPosition.Builder(map.cameraPosition).target(LatLng(zurich.latitude, zurich.longitude)).zoom(11.0).tilt(0.0).build()))
            map.cameraPosition
        }
        // The six in one cell of the app's grid, around the middle of the cell under the part's (0.35, 0.5): 80 grid
        // points a cell at the map's whole zoom 12, a point of the map's zoom 11 each. Split over two cells, the
        // largest cluster can be close enough to fit at the closest zoom a fit allows, which fills less of the part.
        val middle = MapPoint(onMain { projection.coordinate(ScreenPoint(part.minX + part.width * 0.35, part.minY + part.height * 0.5)) })
        val perMapPoint = 256 * 2.0.pow(12) / MapPoint.worldSize
        val cellMiddleX = (floor(middle.x * perMapPoint / APP_CELL) + 0.5) * APP_CELL
        val cellMiddleY = (floor(middle.y * perMapPoint / APP_CELL) + 0.5) * APP_CELL
        val scooters = listOf(-20.0 to -15.0, 15.0 to -20.0, 0.0 to 0.0, -15.0 to 18.0, 20.0 to 12.0, 5.0 to -5.0).mapIndexed { index, (dx, dy) ->
            val place = MapPoint((cellMiddleX + dx) / perMapPoint, (cellMiddleY + dy) / perMapPoint).coordinate
            Scooter(provider = if (index % 2 == 0) "voi" else "lime", latitude = place.latitude, longitude = place.longitude, battery = 80, vehicleID = "s$index", distanceMeters = 0.0)
        }
        served = ScooterResponse(vehicles = scooters)
        onMain { controller.updateViewport(MapZoom.region(of = projection.visibleMapRect), zoom = 11) }
        assertTrue("the app's clusters", waitFor(30_000) { onMain { mapView.markers?.scene?.clusters()?.any { !it.isServer } } == true })
        Thread.sleep(1_000)
        val cluster = onMain { mapView.markers!!.scene.clusters().filter { !it.isServer }.maxBy { it.members!!.size } }
        val members = cluster.members!!.map { it.point }
        val point = onMain { projection.point(cluster.cluster.coordinate) }
        assertTrue("${cluster.id} at $point in $part", part.contains(point))
        fingers(point to point, millis = 40, steps = 1)
        assertTrue("${cluster.id} opened", waitFor(5_000) { zoom() > opening.zoom + 0.5 })
        Thread.sleep(500)
        waitUntilAtRest(members.first())
        screenshot("app-cluster")
        val points = onMain { members.map { projection.point(it) } }
        val inside = part.insetBy(FIT_MARGIN - 1, FIT_MARGIN - 1) ?: part
        Log.i(TAG, "${size()}: ${cluster.id} of ${members.size}, at $points, part $part")
        for (shown in points) assertTrue("$shown in $inside", inside.contains(shown))
        // Fitted: as wide or as high as the part less its margins allow, give or take.
        val width = points.maxOf { it.x } - points.minOf { it.x }
        val height = points.maxOf { it.y } - points.minOf { it.y }
        val filled = max(width / (part.width - 2 * FIT_MARGIN), height / (part.height - 2 * FIT_MARGIN))
        assertTrue("the scooters fill ${"%.2f".format(filled)} of $part", filled > 0.85)
    }

    /**
     * The scooters' names beside a panel and on both halves of a fold (MAP-111, MAP-115), as ScooterMapView.swift's
     * placePills shows them: on the map beside the panel and below it, as a panel covers only as far down as it
     * reaches, and on either half of a partly open foldable, the flat one too; none for a dot under the panel or on the
     * fold. Each scooter is the nearest of its own provider to the rider, so that each is named.
     */
    @Test
    fun namesShowBesideAndBelowAPanelAndOnBothHalvesOfAFoldButNotUnderThem() {
        val controller = controller()
        show(controller)
        locate(rider)
        assertTrue("the move to the rider", waitFor(LOCATING) { onMain { map.cameraPosition.target }?.let { hypot(it.latitude - rider.latitude, it.longitude - rider.longitude) < 0.01 } == true })
        waitUntilAtRest(rider)
        // At street level, where each scooter is a dot of its own.
        onMain { map.moveCamera(CameraUpdateFactory.zoomTo(16.5)) }
        Thread.sleep(1_000)
        val bounds = onMain { projection.bounds }
        val chrome = shownChrome()
        val safe = safeArea()
        val panel = chrome.panel?.takeIf { !it.isEmpty }
        val fold = chrome.fold?.takeIf { !it.isEmpty && it.intersects(bounds) }
        assumeTrue("a panel or a fold over the map", panel != null || fold != null)
        val part = partInView(chrome, bounds)
        val foot = bounds.maxY - safe.bottom

        // Where each scooter stands, and whether its name shows there.
        val spots = mutableListOf<Triple<String, ScreenPoint, Boolean>>()
        spots += Triple("beside", ScreenPoint(part.minX + part.width * 0.25, part.minY + part.height * 0.3), true)
        if (panel != null) {
            spots += Triple("under the panel", ScreenPoint(panel.midX, panel.minY + min(panel.height / 2, 100.0)), false)
            if (foot - panel.maxY >= 120) spots += Triple("below the panel", ScreenPoint(panel.midX, panel.maxY + 60), true)
        }
        if (fold != null) {
            if (fold.width > fold.height) {
                spots += Triple("on the flat half", ScreenPoint(part.minX + part.width * 0.6, fold.maxY + (foot - fold.maxY) * 0.4), true)
                spots += Triple("on the fold", ScreenPoint(part.minX + part.width * 0.4, fold.midY), false)
            } else {
                // The half the panel is on, below it, is the other one.
                if (panel == null) {
                    val other = if (part.midX > fold.midX) (bounds.minX + fold.minX) / 2 else (fold.maxX + bounds.maxX) / 2
                    spots += Triple("on the other half", ScreenPoint(other, part.minY + part.height * 0.6), true)
                }
                spots += Triple("on the fold", ScreenPoint(fold.midX, part.minY + part.height * 0.7), false)
            }
        }
        val providers = listOf("voi", "lime", "bolt", "dott", "bird", "hopp")
        val scooters = spots.mapIndexed { index, (where, at, _) ->
            val place = onMain { projection.coordinate(at) }
            Scooter(provider = providers[index], latitude = place.latitude, longitude = place.longitude, battery = 80, vehicleID = where, distanceMeters = 0.0)
        }
        served = ScooterResponse(vehicles = scooters)
        onMain { controller.refresh() }
        assertTrue("the scooters", waitFor(30_000) { onMain { controller.mapScooters.value.size } == scooters.size })
        val named = spots.indices.filter { spots[it].third }.map { scooters[it].id }.toSet()
        fun shown() = onMain { mapView.markers!!.scene.shownPillFrames(projection).map { (mark, _) -> mark.scooter.id }.toSet() }
        waitFor(10_000) { shown() == named }
        Thread.sleep(1_000)
        screenshot("names")
        val places = scooters.associate { it.id to onMain { projection.point(it.point) } }
        Log.i(TAG, "${size()}: chrome $chrome, part $part, scooters at $places, named ${shown()}")
        for ((index, spot) in spots.withIndex()) {
            val (where, _, shows) = spot
            val id = scooters[index].id
            assertEquals("the name of the scooter $where, at ${places[id]}", shows, id in shown())
        }
    }

    /**
     * In a region that measures in miles, the map turned and zooming: the compass 16 in from the trailing edge, level
     * with the panel's top or under the search bar; the scale at the same height on the leading side, past the
     * panel; the credits at the foot of the part of the map in view, past the panel by the map's leading margin, and
     * cut by no control on any side: seen whole, or wholly under a phone's dock as the iPhone's Legal is.
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
        val chrome = shownChrome()
        val safe = safeArea()
        val top = ornamentsTop(chrome, bounds, safe.top)
        val compassFrame = inMap(compass.visibleBounds)
        // Right to left, the sides swap (MAP-059): the compass on the left, the scale and the credits on the right.
        val rightToLeft = onMain { mapView.layoutDirection == View.LAYOUT_DIRECTION_RTL }
        Log.i(TAG, "${size()}: chrome $chrome, safe $safe, compass $compassFrame, ornaments' top $top, right to left $rightToLeft")
        // By its middle: TalkBack's frame is the 48 a finger needs around the 44 drawn.
        val half = MapOrnaments.COMPASS_SIZE / 2
        val compassMiddle = if (rightToLeft) bounds.minX + safe.left + MapOrnaments.EDGE_GAP + half else bounds.maxX - safe.right - MapOrnaments.EDGE_GAP - half
        assertEquals("the compass's trailing edge: $compassFrame", compassMiddle, compassFrame.midX, 1.0)
        assertEquals("the compass's top: $compassFrame", top + half, compassFrame.midY, 1.0)

        val margins = onMain { mapView.camera!!.margins }
        assertTheCreditsAreSeen(chrome, bounds, safe, rightToLeft)

        // A zoom step: the scale shows while the map zooms, level with the compass, past the panel.
        onMain { map.animateCamera(CameraUpdateFactory.zoomBy(1.0), 1_000) }
        val scale = device.wait(Until.findObject(By.desc(Pattern.compile(".*\\b(feet|foot|miles?)$"))), 1_500)
        assertNotNull("the scale while the map zooms", scale)
        val scaleFrame = inMap(scale.visibleBounds)
        screenshot("ornaments")
        Log.i(TAG, "${size()}: scale $scaleFrame")
        assertEquals("the scale's top: $scaleFrame", top, scaleFrame.minY, 1.0)
        val leadingMargin = if (rightToLeft) margins.right else margins.left
        val leading = if (leadingMargin > 0 && chrome.panel != null) leadingMargin else (if (rightToLeft) safe.right else safe.left) + MapOrnaments.EDGE_GAP
        val edge = if (rightToLeft) bounds.maxX - scaleFrame.maxX else scaleFrame.minX - bounds.minX
        assertEquals("the scale's leading edge: $scaleFrame", leading, edge, 1.0)
    }

    /**
     * The credits seen whole and cut by no control, as above, with the chrome the rider opens over the map: nothing (the
     * zones off), a scooter's card in the dock or the panel, the zones' legend listing their kinds, and the card, the
     * legend and a notice under the search bar together. A window as short as a phone's or a folded Fold's held
     * sideways leaves the least room over the dock (review-app-v finding 2).
     */
    @Test
    fun theCreditsAreSeenWithNothingOpen() = creditsWith("nothing")

    @Test
    fun theCreditsAreSeenOverAScootersCard() = creditsWith("card", card = true)

    @Test
    fun theCreditsAreSeenOverTheZonesLegend() = creditsWith("legend", legend = true)

    @Test
    fun theCreditsAreSeenOverACardTheLegendAndANotice() = creditsWith("all", card = true, legend = true, notice = true)

    /**
     * The map at a scooter at zoom 16, with its card chosen if [card], the operators' zones on and drawn there if
     * [legend], else off, and the location not found if [notice]; then the credits checked, the screen kept as
     * credits-[name].
     */
    private fun creditsWith(name: String, card: Boolean = false, legend: Boolean = false, notice: Boolean = false) {
        val scooter = Scooter(provider = "voi", latitude = 47.3769, longitude = 8.5417, battery = 80, vehicleID = "s1", distanceMeters = 0.0)
        zones = if (legend) listOf(ScooterZoneKind.Slow, ScooterZoneKind.NoParking, ScooterZoneKind.NoRide).mapIndexed { index, kind -> zurichZone(kind, east = 0.002 * index) } else emptyList()
        val controller = controller(scooters = listOf(scooter), defaults = InMemoryScooterDefaults().apply { set(legend, forKey = "map-zones") })
        show(controller)
        onMain { map.moveCamera(CameraUpdateFactory.newLatLngZoom(LatLng(scooter.latitude, scooter.longitude), 16.0)) }
        onMain { controller.updateViewport(zurichStart.region, zoom = 16) }
        assertTrue("the scooters", waitFor(30_000) { onMain { controller.vehicles.value.isNotEmpty() } })
        if (legend) {
            assertTrue("the zones", waitFor(30_000) { onMain { controller.zoneState.value == ScooterZoneState.Shown && controller.mapOperatorZoneCount.value > 0 } })
        }
        if (card) onMain { controller.selectScooter(scooter.id) }
        if (notice) onMain { controller.locationFailed(ScooterLocationError.LocationUnknown) }
        // The card and the notice at their full heights.
        Thread.sleep(2_500)
        assertEquals("the zones' legend", legend, device.findObject(By.res(ZONE_LEGEND_TAG)) != null)
        assertEquals("the notice", notice, device.findObject(By.res(LOCATION_CARD_TAG)) != null)
        assertEquals("the card", card, onMain { controller.selectedScooterID.value } == scooter.id)
        val bounds = onMain { projection.bounds }
        val rightToLeft = onMain { mapView.layoutDirection == View.LAYOUT_DIRECTION_RTL }
        screenshot("credits-$name")
        assertTheCreditsAreSeen(chrome(), bounds, safeArea(), rightToLeft)
    }

    /**
     * The credits where the screen shows them: past the panel by the map's leading margin and in the part of the map in
     * view, at the foot their rules give, and cut by no control on any side: seen whole, or wholly under a phone's dock
     * as the iPhone's Legal is. Out of sight only where, over the dock, the chrome leaves them no room under the search
     * bar and its notices (creditsHaveRoom).
     */
    private fun assertTheCreditsAreSeen(chrome: MapChrome, bounds: ScreenRect, safe: MapInsets, rightToLeft: Boolean) {
        val credits = device.findObject(By.text("© OpenStreetMap"))
        if (credits == null) {
            assertNoRoomForTheCredits(chrome, bounds, safe, rightToLeft)
            return
        }
        val creditsFrame = inMap(credits.visibleBounds)
        val margins = onMain { mapView.camera!!.margins }
        Log.i(TAG, "${size()}: credits $creditsFrame, margins $margins")
        val part = partInView(chrome, bounds)
        // By its middle again: the 18 drawn lie in the middle of the 48 TalkBack is given. Their foot is the upright
        // half's, 16 above a tabletop's fold where WindowManager puts it, as iOS's bottom margin keeps Apple's logo
        // (ScooterMapView.swift updateMargins); beside a panel, 4 over the zones' legend and the locate button in the
        // corner where they would cover them, as the button does on a tablet upright; over the dock, 4 over it and over
        // the legend and the locate button on it where the dock would cut them, part of their text beside it and part
        // under it, or their frame, as on a tablet upright with a cutout down its side; under a phone's dock whose foot
        // would cut them, 4 below it or on its foot; elsewhere 8 above the safe area's foot.
        // The legend's and the dock's rules are Android's only (MAP-318, STATE 29 Oct 06:55Z): their licence asks that
        // the map's credits be seen, and Apple's logo and Legal link, a third as wide, stay in the map's margins
        // (ScooterMapView.swift :897-903), beside the iPad's dock too. The legend and the dock are where the screen
        // shows them, not where the chrome hands them to the map, so a frame measured wrong moves the credits and not
        // what they are checked against (review-app-p finding 4).
        val across = windowFold()?.takeIf { it.intersects(bounds) && it.width > it.height }
        // Each credit's four edges as the screen shows it, the 18 drawn, and their text 6 inside them.
        val sources = listOf("© OpenStreetMap", "OpenFreeMap © OpenMapTiles").map { text ->
            val found = device.findObject(By.text(text))
            assertNotNull(text, found)
            inMap(found.visibleBounds).let { ScreenRect(it.minX, it.midY - 9, it.width, 18.0) }
        }
        val text = ScreenRect(sources.minOf { it.minX } + 6, sources.minOf { it.minY }, sources.maxOf { it.maxX } - sources.minOf { it.minX } - 12, 18.0)
        fun shown(tag: String) = device.findObject(By.res(tag))?.let { inMap(it.visibleBounds) }
        val dock = shown(DOCK_TAG)
        val shownLegend = shown(ZONE_LEGEND_TAG)
        val locateButton = device.findObject(By.desc(Pattern.compile("Go to my location|Near me")))?.let { inMap(it.visibleBounds) }
        val overCredits = { frame: ScreenRect -> frame.minX < text.maxX + 6 && frame.maxX > text.minX - 6 }
        val corner = listOfNotNull(shownLegend, locateButton).filter(overCredits).takeIf { chrome.panel?.isEmpty == false && it.isNotEmpty() }
        val cutByDock = chrome.panel == null && dock != null &&
            !(dock.minX <= text.minX && dock.maxX >= text.maxX) && overCredits(dock)
        val overDock = listOfNotNull(dock, shownLegend, locateButton).filter(overCredits).takeIf { cutByDock }
        // Under a phone's dock over all of their text whose foot would cut them 8 over the safe area's foot, as its
        // foot over a gesture bar does where the bar is short (UI-121): 4 below it where they fit over the bar, else on
        // its foot, under it (creditsUnderDock).
        val safeFoot = bounds.maxY - safe.bottom - 8
        val byDocksFoot = dock?.takeIf {
            chrome.panel == null && chrome.fold?.isEmpty != false && it.minX <= text.minX && it.maxX >= text.maxX &&
                it.maxY > safeFoot - 18 && it.maxY < safeFoot && it.minY <= safeFoot - 18
        }?.let { if (it.maxY + 4 + 18 <= bounds.maxY - safe.bottom) it.maxY + 4 + 18 else it.maxY }
        val foot = across?.let { it.minY - PANEL_GAP } ?: (corner ?: overDock)?.let { frames -> frames.minOf { it.minY } - 4 }
            ?: byDocksFoot ?: safeFoot
        Log.i(
            TAG,
            "${size()}: credits $sources, dock $dock, legend $shownLegend, locate button $locateButton, cut by the dock $cutByDock, " +
                "search bar ${shown(SEARCH_ISLAND_TAG)}, banner ${shown(STATUS_BANNER_TAG)}, location's card ${shown(LOCATION_CARD_TAG)}, safe $safe",
        )
        assertEquals("the credits' foot: $creditsFrame, the fold $across, the corner over them $corner, the dock $dock", foot, creditsFrame.midY + 9, 2.0)
        // Seen whole, in the safe area and clear of every control over the map, or, over a dock that spans the map as a
        // phone's does, wholly under it with all their text, as the iPhone's Legal is under its dock: never cut.
        val underDock = chrome.panel == null && dock != null && dock.minX <= text.minX + 1 && dock.maxX >= text.maxX - 1 &&
            dock.minY <= text.minY + 1 && dock.maxY >= text.maxY - 1
        if (!underDock) {
            val controls = listOf(
                "the search bar" to shown(SEARCH_ISLAND_TAG),
                "the dock" to dock,
                "the zones' legend" to shownLegend,
                "the locate button" to locateButton,
                "the panel" to chrome.panel?.takeIf { !it.isEmpty },
                "the banner" to shown(STATUS_BANNER_TAG),
                "the location's card" to shown(LOCATION_CARD_TAG),
                "the compass" to device.findObject(By.desc("Compass"))?.let { inMap(it.visibleBounds) },
                "the scale" to shown(SCALE_TAG),
            ).mapNotNull { (name, frame) -> frame?.let { name to it } }
            for (source in sources) {
                assertTrue(
                    "the credit $source in the safe area $safe of $bounds",
                    source.minX >= bounds.minX + safe.left - 1 && source.maxX <= bounds.maxX - safe.right + 1 &&
                        source.minY >= bounds.minY + safe.top - 1 && source.maxY <= bounds.maxY - safe.bottom + 1,
                )
                for ((name, frame) in controls) {
                    val over = frame.intersection(source)
                    assertTrue("the credit $source cut by $name $frame", over == null || over.width < 1 || over.height < 1)
                }
            }
        }
        if (rightToLeft) {
            assertTrue("the credits $creditsFrame past the leading margin $margins", creditsFrame.maxX <= bounds.maxX - max(margins.right, safe.right) + 1)
            assertTrue("the credits $creditsFrame in the part in view $part", creditsFrame.maxX <= part.maxX + 1 && creditsFrame.minY >= part.minY - 1)
        } else {
            assertTrue("the credits $creditsFrame past the leading margin $margins", creditsFrame.minX >= max(margins.left, safe.left) - 1)
            assertTrue("the credits $creditsFrame in the part in view $part", creditsFrame.minX >= part.minX - 1 && creditsFrame.minY >= part.minY - 1)
        }
        chrome.panel?.takeIf { !it.isEmpty }?.let { assertTrue("the credits $creditsFrame clear of the panel $it", !it.intersects(creditsFrame)) }
    }

    /**
     * With the credits out of sight, that the dock's layout leaves them no room: lifted 4 over the highest of the dock,
     * the zones' legend and the locate button over their text, 8 in from the safe area's leading edge and about 240
     * wide, their 18 would come within 4 of the search bar or a notice under it.
     */
    private fun assertNoRoomForTheCredits(chrome: MapChrome, bounds: ScreenRect, safe: MapInsets, rightToLeft: Boolean) {
        fun shown(tag: String) = device.findObject(By.res(tag))?.let { inMap(it.visibleBounds) }
        val dock = shown(DOCK_TAG)
        val legend = shown(ZONE_LEGEND_TAG)
        val locateButton = device.findObject(By.desc(Pattern.compile("Go to my location|Near me")))?.let { inMap(it.visibleBounds) }
        val chromeFoot = listOfNotNull(shown(SEARCH_ISLAND_TAG), shown(STATUS_BANNER_TAG), shown(LOCATION_CARD_TAG)).maxOfOrNull { it.maxY }
            ?: (bounds.minY + safe.top)
        // In a region that measures in miles, the scale under the search bar while the map zooms, on their side.
        val scaleFoot = onMain {
            controller.language.value.locale.takeIf { MapScale.showsScale(it) }?.let {
                val context = InstrumentationRegistry.getInstrumentation().targetContext
                ornamentsTop(chrome, bounds, safe.top) +
                    scaleHeight(TextMeasurer(createFontFamilyResolver(context), Density(context), LayoutDirection.Ltr), Density(context))
            }
        }
        val top = max(chromeFoot, scaleFoot ?: 0.0)
        val start = if (rightToLeft) bounds.maxX - safe.right - 8 - CREDITS_WIDTH else bounds.minX + safe.left + 8
        val over = listOfNotNull(dock, legend, locateButton).filter { it.minX < start + CREDITS_WIDTH - 6 && it.maxX > start + 6 }
        Log.i(TAG, "${size()}: the credits out of sight, over $over, under $top (the scale's foot $scaleFoot)")
        assertTrue("the credits out of sight beside a panel ${chrome.panel}", chrome.panel?.takeIf { !it.isEmpty } == null)
        assertTrue("the credits out of sight with no dock over them: $dock", dock != null && dock in over)
        val foot = over.minOf { it.minY } - 4
        assertTrue("the credits out of sight with room for them: their foot $foot, the chrome over them down to $top", foot - 18 < top + 4)
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
        val part = partInView(shownChrome(), onMain { projection.bounds })
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

        // Locating, then a hand on the map before the move lands: the map stays where the hand leaves it. The move
        // has to be under way when the hand comes: the camera at rest before locating, moving between 100 and 150 ms
        // after, and short of the zoom a place located takes.
        val bounds = onMain { projection.bounds }
        val scale = max(1.0, min(bounds.width, bounds.height) / 440)
        val frame = frame(bounds)
        val locatedZoom = MapZoom.fitting(MapRegion.around(rider, 350 * scale, 350 * scale), frame.width, frame.height)
        val resting = onMain { map.cameraPosition }
        Thread.sleep(50)
        val atRest = onMain { map.cameraPosition }
        locate(rider)
        Thread.sleep(100)
        val earlier = onMain { map.cameraPosition }
        Thread.sleep(50)
        val underWay = onMain { map.cameraPosition }
        fingers(ScreenPoint(centre.x, centre.y) to ScreenPoint(centre.x + reach, centre.y + reach / 2), millis = 300)
        Log.i(TAG, "${size()}: the camera at $atRest, $earlier 100 ms after locating, $underWay 150 ms after, for zoom $locatedZoom")
        assertTrue("the camera at rest before locating: $resting, then $atRest", !moved(resting, atRest))
        assertTrue("the move to the rider under way when the hand came: $earlier, then $underWay", moved(earlier, underWay))
        assertTrue("the move to the rider not over: zoom ${underWay.zoom} for $locatedZoom", abs(underWay.zoom - locatedZoom) >= 0.05)
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
        val part = partInView(shownChrome(), onMain { projection.bounds })
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

    /**
     * A controller allowed to locate that hears only the fixes the test gives it, with `scooters` about, the operators'
     * [zones] in any area, the walks' `route`, and `defaults` as kept from before (the zones on).
     */
    private fun controller(
        scooters: List<Scooter> = emptyList(),
        route: List<GeoPoint> = emptyList(),
        defaults: ScooterDefaults = InMemoryScooterDefaults(),
    ) = ScooterMapController(
        api = object : ScooterAPIClient {
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = served ?: ScooterResponse(vehicles = scooters)

            override suspend fun zonesIn(area: ScooterZoneArea) = ScooterZoneResponse(zones = zones, pending = false, truncated = false)
        },
        locationManager = TestLocation(),
        defaults = defaults,
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
                // The chrome's tags as resource ids, for UiAutomator to find the search bar where the screen shows it.
                Box(Modifier.fillMaxSize().semantics { testTagsAsResourceId = true }) {
                    ScooterMapScreen(
                        controller = controller,
                        map = { dark -> ScooterMap(controller, zurichStart, MapCameraMemory(), tiles, dark) },
                    )
                }
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

    /**
     * The chrome the screen hands the map, once it is checked against what the screen shows and iOS's numbers rather
     * than only read back from the map: over the dock the search bar's foot and the locate button's top where
     * UiAutomator finds them; a panel 16 inside the safe area and 380 across (ScooterChromeLayout.panelWidth in
     * ScooterMapScreen.swift); the fold where WindowManager says it is. The map's margins are then iOS's
     * (ScooterMapView.swift updateMargins), as UIKit reads them back with the safe area: 16 past the panel, 16 past a
     * fold down the map on the side the map shows, and above a fold across it the safe area's top and 16 above the
     * fold, which MapLibre's own margins hold too as they put the centre in the upright half; the others the safe
     * area's.
     */
    private fun shownChrome(): MapChrome {
        val chrome = chrome()
        val bounds = onMain { projection.bounds }
        val safe = safeArea()
        val rightToLeft = onMain { mapView.layoutDirection == View.LAYOUT_DIRECTION_RTL }
        val fold = windowFold()?.takeIf { it.intersects(bounds) }
        val handedFold = chrome.fold?.takeIf { !it.isEmpty && it.intersects(bounds) }
        Log.i(TAG, "${size()}: chrome $chrome, the fold on the screen $fold, safe $safe")
        if (fold == null) {
            assertEquals("no fold on the screen", null, handedFold)
        } else {
            assertNotNull("the fold on the screen at $fold", handedFold)
            assertRect("the fold", fold, handedFold!!)
        }
        val handedPanel = chrome.panel?.takeIf { !it.isEmpty }
        var panel: ScreenRect? = null
        if (handedPanel != null) {
            val minX = if (rightToLeft) bounds.maxX - safe.right - PANEL_GAP - PANEL_WIDTH else bounds.minX + safe.left + PANEL_GAP
            panel = ScreenRect(minX, bounds.minY + safe.top + PANEL_GAP, PANEL_WIDTH, handedPanel.height)
            assertRect("the panel", panel, handedPanel)
        } else {
            val bar = device.findObject(By.res(SEARCH_ISLAND_TAG))?.let { inMap(it.visibleBounds) }
            assertNotNull("the search bar on the screen", bar)
            assertEquals("the search bar's foot, handed ${chrome.top}, on the screen $bar", bar!!.maxY, chrome.top?.maxY ?: Double.NaN, 1.0)
            val locate = device.findObject(By.desc(Pattern.compile("Go to my location|Near me")))?.let { inMap(it.visibleBounds) }
            assertNotNull("the locate button on the screen", locate)
            assertEquals("the locate button's top, handed ${chrome.bottomTop}, on the screen $locate", locate!!.minY, chrome.bottomTop ?: Double.NaN, 1.0)
        }

        // iOS's margins, read back with the safe area, against the app's.
        var left = 0.0
        var right = 0.0
        var bottom = 0.0
        panel?.let { if (rightToLeft) right = bounds.maxX - it.minX + PANEL_GAP else left = it.maxX - bounds.minX + PANEL_GAP }
        val across = fold != null && fold.width > fold.height
        if (fold != null) {
            when {
                across -> bottom = bounds.maxY - fold.minY + PANEL_GAP
                // Down the map, the map shows on the side away from the panel, or the trailing one.
                (panel?.let { it.midX > fold.midX } ?: rightToLeft) -> right = max(right, bounds.maxX - fold.minX + PANEL_GAP)
                else -> left = max(left, fold.maxX - bounds.minX + PANEL_GAP)
            }
        }
        val ios = MapInsets(top = safe.top, left = max(safe.left, left), bottom = max(safe.bottom, bottom), right = max(safe.right, right))
        iosMargins = ios
        val margins = onMain { mapView.camera!!.margins }
        val within = MapCamera.within(bounds, margins, safe)
        val expected = ScreenRect(bounds.minX + ios.left, bounds.minY + ios.top, bounds.width - ios.left - ios.right, bounds.height - ios.top - ios.bottom)
        Log.i(TAG, "${size()}: margins $margins, iOS's $ios")
        assertRect("the map's margins $margins, iOS's $ios", expected, within)
        if (across) assertEquals("the top margin above a fold across the map: $margins", safe.top, margins.top, 1.0)
        return chrome
    }

    /**
     * Without a panel or a fold the map keeps no margins (ScooterMapView.swift:913-921 leaves them as they were), which
     * shownChrome's comparison inside the safe area can't tell from a margin under it (review-app-p finding 2).
     */
    private fun assertNoMarginsWithoutAPanelOrAFold(bounds: ScreenRect) {
        if (chrome().panel?.takeIf { !it.isEmpty } != null || windowFold()?.takeIf { it.intersects(bounds) } != null) return
        val margins = onMain { mapView.camera!!.margins }
        assertEquals("the map's margins without a panel or a fold", MapInsets.zero, margins)
    }

    /** Whether the camera moved from `from` to `to`: its place, zoom, turn or tilt. */
    private fun moved(from: CameraPosition, to: CameraPosition): Boolean =
        abs(from.target!!.latitude - to.target!!.latitude) > 1e-9 || abs(from.target!!.longitude - to.target!!.longitude) > 1e-9 ||
            abs(from.zoom - to.zoom) > 1e-6 || abs(from.bearing - to.bearing) > 1e-6 || abs(from.tilt - to.tilt) > 1e-6

    private fun assertRect(what: String, expected: ScreenRect, actual: ScreenRect, within: Double = 1.0) {
        val message = "$what: $actual for $expected"
        assertEquals(message, expected.minX, actual.minX, within)
        assertEquals(message, expected.minY, actual.minY, within)
        assertEquals(message, expected.maxX, actual.maxX, within)
        assertEquals(message, expected.maxY, actual.maxY, within)
    }

    /**
     * The fold of a partly open foldable where WindowManager says it is, in the map's points; none flat, closed or on
     * a device without one. A seamless screen folds along a line of no width, which is taken a pixel wide.
     */
    private fun windowFold(): ScreenRect? {
        val window = activity
        val layout = runBlocking { withTimeout(5_000) { WindowInfoTracker.getOrCreate(window).windowLayoutInfo(window).first() } }
        val fold = layout.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull { it.state == FoldingFeature.State.HALF_OPENED } ?: return null
        val (origin, density) = onMain { IntArray(2).also { mapView.getLocationInWindow(it) } to mapView.resources.displayMetrics.density.toDouble() }
        val at = fold.bounds
        return ScreenRect((at.left - origin[0]) / density, (at.top - origin[1]) / density, max(at.width(), 1) / density, max(at.height(), 1) / density)
    }

    /**
     * `shown` up and down within 3 points of where a move measured once lands the place, `landed`, and on the same side
     * of `expected` as it: on a tilted map always down the screen from it, past a spot below the middle of the margins,
     * short of one above it (review finding 3). The side is asked where the one measure leaves it 1.5 points off or more.
     */
    private fun assertLandsAsMeasuredOnce(shown: ScreenPoint, expected: ScreenPoint, landed: ScreenPoint, what: String = "the place") {
        assertEquals("$what up and down: $shown for $expected, measured once $landed", landed.y, shown.y, 3.0)
        val off = landed.y - expected.y
        if (abs(off) >= 1.5) assertTrue("$what on the side of $expected the one measure leaves it, as $landed: $shown", (shown.y - expected.y) * off > 0)
    }

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
     * Where a place located or a region opened shows (setRegionPreservingPerspective, MAP-041), by iOS's rules from the
     * chrome on the screen rather than from the app's own margins (review-app-p finding 2): beside a panel or a fold down
     * the map, in the middle of the `part` of the map in view across and of the whole map up and down (aside); beside a
     * panel above a tabletop's fold, in the middle of the part, the upright half, by iOS's rule that the map takes it
     * (the lead's decision of 30 Oct); above a tabletop's fold without one, in the middle of iOS's margins as shownChrome
     * checked them, from under the status bar to 16 above the fold; over the dock, in the middle of the map, whose
     * margins iOS leaves as they were (ScooterMapView.swift:913-921).
     */
    private fun placed(part: ScreenRect, bounds: ScreenRect): ScreenPoint {
        val fold = windowFold()?.takeIf { it.intersects(bounds) }
        val across = fold?.takeIf { it.width > it.height }
        return when {
            abs(part.midX - bounds.midX) >= 1 -> if (across != null) ScreenPoint(part.midX, part.midY) else ScreenPoint(part.midX, bounds.midY)
            fold == null -> ScreenPoint(bounds.midX, bounds.midY)
            else -> iosMargins!!.let { ScreenPoint((bounds.minX + it.left + bounds.maxX - it.right) / 2, (bounds.minY + it.top + bounds.maxY - it.bottom) / 2) }
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

    /** A square of 0.002° a side in Zürich's centre, [east] east of it, of the operators' [kind]. */
    private fun zurichZone(kind: ScooterZoneKind, east: Double): ScooterZone {
        val (lat, lon) = 47.3760 to 8.5400 + east
        val ring = listOf(GeoPoint(lat, lon), GeoPoint(lat, lon + 0.002), GeoPoint(lat + 0.002, lon + 0.002), GeoPoint(lat + 0.002, lon), GeoPoint(lat, lon))
        return ScooterZone(id = kind.name, provider = "voi", kind = kind, polygons = listOf(listOf(ring)))
    }

    private companion object {
        const val TAG = "MapInTheWindowTest"

        /** Whether an activity was launched in this process already. */
        var launchedBefore = false

        /** Long enough for a move to the rider on a slow emulator. */
        const val LOCATING = 20_000L

        /** How far in from the part in view a route is fitted (WalkTrailLook.fitMargin). */
        const val FIT_MARGIN = 40.0

        /** A cell of the app's grid at the map's zoom 11 (ScooterGridClustering.cellSize below zoom 13). */
        const val APP_CELL = 80.0

        /** The turn and the tilt of a map turned and tilted: past north-east, and within MapKit's 35° at any height. */
        const val TURN = 50.0
        const val TILT = 30.0

        /** iOS's panel: 16 inside the safe area, and from the panel or a fold to the map's margin (panelGap). */
        const val PANEL_GAP = 16.0

        /** About how wide the map's credits are, their frames end to end: 245.5 on a phone, 240.8 on a Fold. */
        const val CREDITS_WIDTH = 240.0

        /** iOS's panel's width, at the default text size (ScooterChromeLayout.panelWidth). */
        const val PANEL_WIDTH = 380.0

        val rider = GeoPoint(47.3720, 8.5390)
    }
}
