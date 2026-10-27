package com.plhery.scootradar.map

import android.graphics.Rect
import android.os.Debug
import android.os.Handler
import android.os.HandlerThread
import android.os.SystemClock
import android.util.Log
import android.view.Choreographer
import android.view.FrameMetrics
import android.view.MotionEvent
import android.view.Window
import android.view.accessibility.AccessibilityNodeInfo
import androidx.compose.ui.platform.AndroidUiDispatcher
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterResponseMetadata
import com.plhery.scootradar.core.model.ScreenPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.roundToInt

// The scooters' markers on MapLibre's map, fed by a fake ScooterAPI: a tap on a dot, a bay and a cluster, the dot
// taken where dots overlap, TalkBack's virtual views, and the frames of a pan over 2000 and 5000 scooters (MAP-329).
@RunWith(AndroidJUnit4::class)
class ScooterMarkersTest {
    private val zurich = GeoPoint(47.3769, 8.5417)
    private val language = ScooterLanguage.current

    /** What the fake server sends, wherever the map is: what the test last gave it. */
    @Volatile
    private var served = ScooterResponse(vehicles = emptyList())
    private val api = object : ScooterAPIClient {
        override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = served
    }

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        ScooterLanguage.current = language
    }

    /** The map with the app's markers and camera, as ScooterMap puts them together. */
    private class Marked(val phone: PhoneMap, val controller: ScooterMapController, val markers: ScooterMarkers, val camera: MapCamera) {
        val ratio: Float get() = phone.view.pixelRatio
        val selected: String? get() = phone.onMain { controller.selectedScooterID.value }

        /** The coordinate shown at a point of the map. */
        fun at(x: Double, y: Double): GeoPoint = phone.onMain { phone.projection.coordinate(ScreenPoint(x, y)) }

        fun point(of: GeoPoint): ScreenPoint = phone.onMain { phone.projection.point(of) }
    }

    private fun withMarkers(centre: GeoPoint, mapLibreZoom: Double, test: (Marked) -> Unit) {
        val camera = CameraPosition.Builder().target(LatLng(centre.latitude, centre.longitude)).zoom(mapLibreZoom).build()
        withPhoneMap(camera) { phone ->
            val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
            val frames = CoroutineScope(SupervisorJob() + AndroidUiDispatcher.Main)
            try {
                val marked = phone.onMain {
                    val controller = testController(scope, api)
                    val moving = MapCamera(phone.map, phone.view, controller, MapCameraMemory(), frames)
                    val markers = ScooterMarkers(phone.map, phone.view, controller, analytics = null, scope = scope, move = { moving.show(it) })
                    Marked(phone, controller, markers, moving)
                }
                try {
                    test(marked)
                } finally {
                    phone.onMain {
                        marked.markers.close()
                        marked.camera.close()
                    }
                }
            } finally {
                frames.cancel()
                scope.cancel()
            }
        }
    }

    /** Has the fake server send this, and waits for the markers to have it. */
    private fun Marked.serve(response: ScooterResponse, drawn: (ScooterMarkerScene) -> Boolean) {
        served = response
        phone.onMain {
            val projection = phone.projection
            val level = MapZoom.level(on = projection)
            controller.updateViewport(MapZoom.region(of = projection.visibleMapRect), MapZoom.apiZoom(level), level)
            controller.refresh()
        }
        waitFor("the markers have what the server sent") { phone.onMain { drawn(markers.scene) } }
        settle()
    }

    private fun Marked.serve(scooters: List<Scooter>, parking: List<ScooterParking> = emptyList()) =
        serve(ScooterResponse(vehicles = scooters, parking = parking)) { scene ->
            scene.marks.size == scooters.size && scene.parking.size == parking.size
        }

    /** A finger put down and lifted at a point of the map, then a pause, so that the next is not a double tap. */
    private fun Marked.tap(x: Double, y: Double) {
        phone.onMain {
            val down = SystemClock.uptimeMillis()
            for ((action, time) in listOf(MotionEvent.ACTION_DOWN to down, MotionEvent.ACTION_UP to down + 60)) {
                val event = MotionEvent.obtain(down, time, action, (x * ratio).toFloat(), (y * ratio).toFloat(), 0)
                phone.view.dispatchTouchEvent(event)
                event.recycle()
            }
        }
        SystemClock.sleep(500)
    }

    @Test
    fun aTapSelectsTheDotNearestTheFingerWhereDotsOverlap() = withMarkers(zurich, mapLibreZoom = 16.0) { marked ->
        marked.serve(listOf(scooter("a", "lime", marked.at(195.0, 400.0)), scooter("b", "voi", marked.at(205.0, 400.0))))

        // Each dot's half lies over the other's: the centre nearest the finger wins, not the dot drawn on top.
        marked.tap(202.0, 400.0)
        assertEquals("voi:b", marked.selected)
        marked.tap(198.0, 400.0)
        assertEquals("lime:a", marked.selected)
        // Away from both, the card closes.
        marked.tap(195.0, 700.0)
        assertNull(marked.selected)
    }

    @Test
    fun aTapOnABayOpensItInTheDock() = withMarkers(zurich, mapLibreZoom = 16.0) { marked ->
        val place = marked.at(195.0, 500.0)
        val bay = ScooterParking("dott:bay", "dott", "Bahnhofstrasse", place.latitude, place.longitude, mandatory = true)
        marked.serve(listOf(scooter("a", "lime", marked.at(100.0, 200.0))), parking = listOf(bay))

        // On the balloon, above its point.
        marked.tap(195.0, 482.0)
        assertEquals(bay.id, marked.phone.onMain { marked.controller.selectedParkingID.value })
        assertNull(marked.selected)
    }

    @Test
    fun aTapOnAClusterOfTheAppsZoomsInOntoItsScooters() {
        // The middle of one of the web's cells at the iPhone's 14, 4,096 map points across, at MapLibre's 13.3.
        val cell = MapPoint(zurich).let { MapPoint((floor(it.x / 4096) + 0.5) * 4096, (floor(it.y / 4096) + 0.5) * 4096) }
        withMarkers(cell.coordinate, mapLibreZoom = 13.3) { marked ->
            val scooters = listOf(
                scooter("a", "lime", marked.at(193.0, 420.0)),
                scooter("b", "lime", marked.at(195.0, 422.0)),
                scooter("c", "voi", marked.at(197.0, 424.0)),
            )
            marked.serve(ScooterResponse(vehicles = scooters)) { it.marks.size == 3 && it.clusters().size == 1 }
            val zoom = marked.phone.onMain { marked.phone.map.cameraPosition.zoom }
            val cluster = marked.phone.onMain { marked.markers.scene.clusters().single() }
            assertEquals(3, cluster.members!!.size)

            val centre = marked.point(cluster.cluster.coordinate)
            marked.tap(centre.x, centre.y)

            waitFor("the map shows the cluster's scooters") {
                marked.phone.onMain { marked.markers.scene.clusters().isEmpty() && marked.markers.scene.drawnMarks().size == 3 }
            }
            settle()
            assertTrue(marked.phone.onMain { marked.phone.map.cameraPosition.zoom } > zoom + 1)
            val bounds = marked.phone.onMain { marked.phone.projection.bounds }
            for (scooter in scooters) assertTrue(scooter.id, bounds.contains(marked.point(scooter.coordinate)))
        }
    }

    // TalkBack

    /** The buttons of the window as an accessibility service is given them: what TalkBack reads, in its order. */
    private fun buttons(): List<AccessibilityNodeInfo> {
        val root = InstrumentationRegistry.getInstrumentation().uiAutomation.rootInActiveWindow ?: return emptyList()
        val found = mutableListOf<AccessibilityNodeInfo>()
        fun walk(node: AccessibilityNodeInfo) {
            if (node.className == "android.widget.Button" && node.contentDescription != null) found += node
            for (index in 0 until node.childCount) node.getChild(index)?.let(::walk)
        }
        walk(root)
        return found
    }

    private fun AccessibilityNodeInfo.read(): String {
        val click = actionList.firstOrNull { it.id == AccessibilityNodeInfo.ACTION_CLICK }?.label
        return listOfNotNull(if (isSelected) "Selected" else null, contentDescription, "Button", click?.let { "double-tap to $it" })
            .joinToString(" | ")
    }

    private fun AccessibilityNodeInfo.middle(): ScreenPoint = Rect().also { getBoundsInScreen(it) }.let {
        ScreenPoint(it.exactCenterX().toDouble(), it.exactCenterY().toDouble())
    }

    /** Where a point of the map is on the screen, in pixels. */
    private fun Marked.onScreen(point: ScreenPoint): ScreenPoint {
        val origin = phone.onMain { IntArray(2).also { phone.view.getLocationOnScreen(it) } }
        return ScreenPoint(origin[0] + point.x * ratio, origin[1] + point.y * ratio)
    }

    @Test
    fun talkBackHasAViewForEveryScooterAndBayThatFollowsTheCameraAndTheSelection() = withMarkers(zurich, mapLibreZoom = 16.0) { marked ->
        val place = marked.at(200.0, 300.0)
        val bay = ScooterParking("dott:bay", "dott", "Bahnhofstrasse", place.latitude, place.longitude, mandatory = true)
        val lime = scooter("a", "lime", marked.at(100.0, 150.0))
        marked.serve(
            listOf(lime, scooter("b", "voi", marked.at(250.0, 150.3)), scooter("c", "bolt", marked.at(120.0, 420.0))),
            parking = listOf(bay),
        )

        waitFor("TalkBack has the markers") { buttons().size == 4 }
        val read = buttons().map { it.contentDescription.toString() }
        read.forEach { Log.i(TAG, "TalkBack reads: $it") }
        // Top to bottom, then left to right: the two scooters a fraction of a point apart are on one line.
        assertEquals("Lime scooter, Battery: 80 percent", read[0])
        assertTrue(read[1], read[1].startsWith("Voi"))
        assertEquals("${bay.bayTitle}, Bahnhofstrasse, ${bay.notice}", read[2])
        assertTrue(read[3], read[3].startsWith("Bolt"))
        // Each is a 44 pt square on its dot.
        val first = buttons()[0]
        assertEquals(44 * marked.ratio.toDouble(), Rect().also { first.getBoundsInScreen(it) }.width().toDouble(), 2.0)
        val dot = marked.onScreen(marked.point(lime.coordinate))
        assertEquals(dot.x, first.middle().x, 2.0)
        assertEquals(dot.y, first.middle().y, 2.0)

        // A double tap selects, and the view is selected.
        assertTrue(buttons()[1].performAction(AccessibilityNodeInfo.ACTION_CLICK))
        waitFor("the scooter is selected") { marked.selected == "voi:b" }
        waitFor("TalkBack reads it selected") { buttons().getOrNull(1)?.isSelected == true }
        Log.i(TAG, "TalkBack reads a dot: ${buttons()[1].read()}")

        // The map moves 100 pt up: the views move with their dots once it comes to rest.
        val below = marked.at(195.0, 522.0)
        marked.phone.onMain { marked.phone.map.moveCamera(CameraUpdateFactory.newLatLng(LatLng(below.latitude, below.longitude))) }
        settle()
        val moved = marked.onScreen(marked.point(lime.coordinate))
        assertEquals(dot.y - 100 * marked.ratio, moved.y, 1.0)
        waitFor("the views follow the camera") {
            buttons().firstOrNull { it.contentDescription.startsWith("Lime") }?.middle()?.let { abs(it.y - moved.y) < 2 } == true
        }
    }

    @Test
    fun talkBackReadsCityTotalsAndClustersAndADoubleTapOpensOne() = withMarkers(zurich, mapLibreZoom = 9.0) { marked ->
        val city = marked.at(195.0, 200.0)
        val cell = marked.at(120.0, 400.0)
        val clusters = listOf(
            ScooterCluster("city:ch:Zürich", city.latitude, city.longitude, count = 1_288, providers = mapOf("lime" to 700, "voi" to 588), city = "Zürich"),
            ScooterCluster("10:536:358", cell.latitude, cell.longitude, count = 12, providers = mapOf("voi" to 12)),
        )
        val meta = ScooterResponseMetadata(partial = false, failedSources = emptyList(), mode = "clusters")
        marked.serve(ScooterResponse(vehicles = emptyList(), clusters = clusters, meta = meta)) { it.clusters().size == 2 }

        waitFor("TalkBack has the clusters") { buttons().size == 2 }
        val (total, group) = buttons()
        Log.i(TAG, "TalkBack reads a city total: ${total.read()}")
        Log.i(TAG, "TalkBack reads a cluster: ${group.read()}")
        assertEquals("Zürich, 1,288 scooters", total.contentDescription)
        assertEquals("12 scooters", group.contentDescription)
        assertEquals("Zooms in to show individual scooters", total.actionList.first { it.id == AccessibilityNodeInfo.ACTION_CLICK }.label)

        // A double tap opens the city: the map zooms in on it.
        val zoom = marked.phone.onMain { marked.phone.map.cameraPosition.zoom }
        assertTrue(total.performAction(AccessibilityNodeInfo.ACTION_CLICK))
        waitFor("the map zooms in on the city") { marked.phone.onMain { marked.phone.map.cameraPosition.zoom } > zoom + 1 }
    }

    // Frames

    /**
     * Frame times in milliseconds, as gfxinfo's framestats has them: the window's frames, and the main thread's;
     * and the time the main thread spent working, in milliseconds.
     */
    private class FrameTimes(val window: List<Double>, val late: Int, val vsyncGaps: List<Double>, val mainWork: Double) {
        fun percentile(values: List<Double>, fraction: Double): Double =
            values.sorted().let { if (it.isEmpty()) Double.NaN else it[((it.size - 1) * fraction).roundToInt()] }

        override fun toString(): String {
            val missed = vsyncGaps.count { it > 25 }
            return "window frames ${window.size}: p50 %.1f, p90 %.1f, p99 %.1f, max %.1f ms, %d past their deadline; main thread %d frames, %d missed, %.0f ms at work"
                .format(percentile(window, 0.5), percentile(window, 0.9), percentile(window, 0.99), window.maxOrNull() ?: Double.NaN, late, vsyncGaps.size, missed, mainWork)
        }
    }

    /** Ten seconds of a finger panning the map up and down, 800 ms a swipe, as the spike's `input swipe` did. */
    private fun Marked.pan(): FrameTimes {
        val window = mutableListOf<Double>()
        var late = 0
        val thread = HandlerThread("frames").apply { start() }
        val listener = Window.OnFrameMetricsAvailableListener { _, metrics, _ ->
            val total = metrics.getMetric(FrameMetrics.TOTAL_DURATION)
            synchronized(window) {
                window += total / 1e6
                if (total > metrics.getMetric(FrameMetrics.DEADLINE)) late += 1
            }
        }
        val gaps = mutableListOf<Double>()
        var measuring = true
        var last = 0L
        val vsync = object : Choreographer.FrameCallback {
            override fun doFrame(frameTimeNanos: Long) {
                if (last != 0L) gaps += (frameTimeNanos - last) / 1e6
                last = frameTimeNanos
                if (measuring) Choreographer.getInstance().postFrameCallback(this)
            }
        }
        phone.scenario.onActivity { it.window.addOnFrameMetricsAvailableListener(listener, Handler(thread.looper)) }
        phone.onMain { Choreographer.getInstance().postFrameCallback(vsync) }
        val working = phone.onMain { Debug.threadCpuTimeNanos() }

        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val end = SystemClock.uptimeMillis() + 10_000
        var up = true
        while (SystemClock.uptimeMillis() < end) {
            val down = SystemClock.uptimeMillis()
            val from = if (up) 600f else 250f
            val to = if (up) 250f else 600f
            fun send(action: Int, y: Float) {
                val event = MotionEvent.obtain(down, SystemClock.uptimeMillis(), action, 195f * ratio, y * ratio, 0)
                instrumentation.runOnMainSync { phone.view.dispatchTouchEvent(event) }
                event.recycle()
            }
            send(MotionEvent.ACTION_DOWN, from)
            for (step in 1..SWIPE_STEPS) {
                SystemClock.sleep(16)
                send(MotionEvent.ACTION_MOVE, from + (to - from) * step / SWIPE_STEPS)
            }
            send(MotionEvent.ACTION_UP, to)
            up = !up
        }

        phone.onMain { measuring = false }
        val work = (phone.onMain { Debug.threadCpuTimeNanos() } - working) / 1e6
        phone.scenario.onActivity { it.window.removeOnFrameMetricsAvailableListener(listener) }
        thread.quitSafely()
        return synchronized(window) { FrameTimes(window.toList(), late, phone.onMain { gaps.toList() }, work) }
    }

    @Test
    fun framesHoldWhilePanningOver2000And5000Scooters() = withMarkers(zurich, mapLibreZoom = 15.0) { marked ->
        val measured = mutableMapOf<Int, FrameTimes>()
        for (count in listOf(0, 2_000, 5_000)) {
            val scooters = spread(count, around = zurich)
            marked.serve(scooters)
            // What one revision of them costs the main thread: the features and their GeoJSON.
            val writing = marked.phone.onMain {
                val start = System.nanoTime()
                MarkerFeatures.json(MarkerFeatures.markers(marked.markers.scene, marked.markers.art), epoch = 0.0)
                (System.nanoTime() - start) / 1e6
            }
            val written = marked.phone.onMain { marked.markers.scene.markersVersion }
            val frames = marked.pan()
            settle()
            Log.i(TAG, "$count scooters: $frames; one revision's GeoJSON %.1f ms".format(writing))

            // The scooters are written once, not as the map moves (MAP-319).
            assertEquals(written, marked.phone.onMain { marked.markers.scene.markersVersion })
            // The pan was drawn.
            assertTrue("$count scooters: $frames", frames.window.size > 100)
            measured[count] = frames
        }

        // The scooters cost the main thread little more as the map moves than the empty map does. Its frames are
        // the AVD's and the host's: an emulator without a GPU draws MapLibre's icons on the host's processors, and
        // the window then waits on them however little the app does.
        val empty = measured.getValue(0)
        for (count in listOf(2_000, 5_000)) {
            val frames = measured.getValue(count)
            assertTrue("$count scooters: $frames; none: $empty", frames.mainWork < 2 * empty.mainWork + 1_000)
        }
    }

    /** Scooters strewn over 2 km around a place, the same every run, of five providers. */
    private fun spread(count: Int, around: GeoPoint): List<Scooter> {
        var seed = 20_261_027L
        fun next(): Double {
            seed = seed * 48_271 % 2_147_483_647
            return seed / 2_147_483_647.0
        }
        val providers = listOf("lime", "voi", "bolt", "dott", "bird")
        return List(count) { index ->
            scooter("s$index", providers[index % providers.size], GeoPoint(around.latitude + (next() - 0.5) * 0.018, around.longitude + (next() - 0.5) * 0.0266))
        }
    }

    private fun scooter(id: String, provider: String, at: GeoPoint) = Scooter(
        provider = provider,
        latitude = at.latitude,
        longitude = at.longitude,
        battery = 80,
        rangeMeters = null,
        vehicleID = id,
        deepLink = null,
        rentalURIs = null,
        distanceMeters = 0.0,
    )

    /** Waits up to 10 s for a condition, and fails if it never holds. */
    private fun waitFor(what: String, condition: () -> Boolean) {
        val end = SystemClock.uptimeMillis() + 10_000
        while (SystemClock.uptimeMillis() < end) {
            if (condition()) return
            SystemClock.sleep(50)
        }
        assertTrue(what, condition())
    }

    private companion object {
        const val TAG = "ScooterMarkersTest"
        const val SWIPE_STEPS = 50
    }
}
