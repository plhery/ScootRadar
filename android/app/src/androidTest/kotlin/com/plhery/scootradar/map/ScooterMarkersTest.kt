package com.plhery.scootradar.map

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Rect
import android.os.Debug
import android.os.Handler
import android.os.HandlerThread
import android.os.ParcelFileDescriptor
import android.os.SystemClock
import android.util.Log
import android.view.Choreographer
import android.view.FrameMetrics
import android.view.MotionEvent
import android.view.PixelCopy
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
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.core.model.distance
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
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapView
import org.maplibre.android.offline.OfflineManager
import org.maplibre.android.tile.TileOperation
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread
import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.roundToInt
import kotlin.math.roundToLong

// The scooters' markers on MapLibre's map, fed by a fake ScooterAPI: a tap on a dot, a bay and a cluster, the dot
// taken where dots overlap, TalkBack's virtual views, the frames of a pan over 2000 and 5000 scooters (MAP-329), and
// their light-up from the rider (MAP-119).
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

    /**
     * The test on a phone's map with the app's markers. With [ground], the app's own ground is under them, set as
     * ScooterMap sets it, its tiles coming from OpenFreeMap with nothing of them kept from before, as on a first
     * start.
     */
    private fun withMarkers(centre: GeoPoint, mapLibreZoom: Double, ground: Boolean = false, test: (Marked) -> Unit) {
        val camera = CameraPosition.Builder().target(LatLng(centre.latitude, centre.longitude)).zoom(mapLibreZoom).build()
        // A new map's server has nothing yet: the scooters a test gives it come as one answer.
        served = ScooterResponse(vehicles = emptyList())
        withPhoneMap(camera) { phone ->
            val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
            val frames = CoroutineScope(SupervisorJob() + AndroidUiDispatcher.Main)
            if (ground) forgetTiles(phone)
            val day = GroundLook(GroundTheme.Day, GroundDetail.Calm, "en")
            val shown = if (ground) {
                phone.onMain { MapGround(phone.map, day, GroundTiles.openFreeMap(OkHttpClient()), imagery = null, scope) }
            } else {
                null
            }
            try {
                val marked = phone.onMain {
                    val controller = testController(scope, api)
                    val moving = MapCamera(phone.map, phone.view, controller, MapCameraMemory(), frames)
                    val markers = ScooterMarkers(phone.map, phone.view, controller, analytics = null, scope = scope, move = { moving.show(it) })
                    Marked(phone, controller, markers, moving)
                }
                if (ground) {
                    waitFor("the markers are on the ground") {
                        phone.onMain {
                            val style = phone.map.style
                            style?.getLayer(ScooterMarkerLayers.MARKERS) != null && GroundStyle.layers(day).all { style.getLayer(it.id) != null }
                        }
                    }
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
                phone.onMain { shown?.close() }
                frames.cancel()
                scope.cancel()
            }
        }
    }

    /** Empties MapLibre's cache of tiles, glyphs and styles. */
    private fun forgetTiles(phone: PhoneMap) {
        val forgotten = CountDownLatch(1)
        phone.onMain {
            OfflineManager.getInstance(phone.view.context).clearAmbientCache(object : OfflineManager.FileSourceCallback {
                override fun onSuccess() = forgotten.countDown()

                override fun onError(message: String) = forgotten.countDown()
            })
        }
        assertTrue("the cache is emptied", forgotten.await(10, TimeUnit.SECONDS))
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

        swipe(until = SystemClock.uptimeMillis() + 10_000)

        phone.onMain { measuring = false }
        val work = (phone.onMain { Debug.threadCpuTimeNanos() } - working) / 1e6
        phone.scenario.onActivity { it.window.removeOnFrameMetricsAvailableListener(listener) }
        thread.quitSafely()
        return synchronized(window) { FrameTimes(window.toList(), late, phone.onMain { gaps.toList() }, work) }
    }

    /** A finger panning the map up and down, 800 ms a swipe, as the spike's `input swipe` did, until a moment of the uptime clock. */
    private fun Marked.swipe(until: Long) {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        var up = true
        while (SystemClock.uptimeMillis() < until) {
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
                MarkerFeatures.json(MarkerFeatures.markers(marked.markers.scene, marked.markers.art))
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

    // The light-up

    /** A frame MapLibre's thread drew: when the main thread heard of it, whether every tile was laid out, and that thread's time on it, in ms. */
    private class RenderedFrame(val at: Long, val fully: Boolean, val encoding: Double, val rendering: Double)

    /** A scooter kept clear of the others, whose dot's middle is read off the window at each frame while it lights up. */
    private class Probe(val metres: Double, val scooter: Scooter) {
        var fade: MarkerFade? = null

        /** How long the light-up waited for MapLibre to draw the scooters, in ms: its fades run that much later. */
        var late = 0L

        /** Under a name at some moment of the light-up: the dot is not what its middle shows then. */
        @Volatile
        var isUnderName = false

        /** Its middle in the window, in pixels. */
        var x = 0
        var y = 0

        /** The colour shown there, by the uptime it was read at, in ms. */
        val colours = mutableListOf<Pair<Long, Int>>()

        /** The colours shown from the start of its fade to its end. */
        fun shades(): Int {
            val fade = fade ?: return 0
            val from = (fade.from * 1000).toLong() + late
            val to = ((fade.from + fade.length) * 1000).toLong() + late + SHOWN_LATE
            return colours.filter { it.first in from..to }.map { it.second }.distinct().size
        }

        /** How long after its fade's start, once the light-up waited, the dot was first shown, in ms, and how far along it already was then. */
        fun firstShown(): Pair<Long, Double>? {
            val fade = fade ?: return null
            val ground = colours.firstOrNull()?.second ?: return null
            val whole = colours.last().second
            val first = colours.firstOrNull { it.second != ground } ?: return null
            return first.first - (fade.from * 1000).toLong() - late to contrast(first.second, ground) / contrast(whole, ground)
        }

        /**
         * How far the dot strays from its last strength once its fade is over, through the hand-back of its band
         * to its layer, as a part of its last strength.
         */
        fun wavers(): Double {
            val fade = fade ?: return Double.NaN
            val ground = colours.firstOrNull()?.second ?: return Double.NaN
            val whole = contrast(colours.last().second, ground)
            val over = ((fade.from + fade.length) * 1000).toLong() + late + SHOWN_LATE
            return colours.filter { it.first >= over }.maxOfOrNull { abs(contrast(it.second, ground) - whole) / whole } ?: Double.NaN
        }

        private fun contrast(colour: Int, ground: Int): Double =
            (abs(Color.red(colour) - Color.red(ground)) + abs(Color.green(colour) - Color.green(ground)) + abs(Color.blue(colour) - Color.blue(ground))).toDouble()
    }

    /** What a light-up drew, from the moment the scooters were sent to the end of the last fade. */
    private class LightUp(
        val count: Int,
        val start: Long,
        val end: Long,
        val rendered: List<RenderedFrame>,
        val vsyncs: List<Long>,
        val mainWork: Double,
        val probes: List<Probe>,
        val rewritten: Int,
        val late: Long,
        val bands: Int,
        /** When MapLibre laid out each of the scooters' tiles, in ms from the first fade's moment. */
        val laidOut: List<Long>,
        /** How many of those it laid out once the light-up had started. */
        val laidOutLit: Int,
    ) {
        /** MapLibre's frames from the first dot's fade to the last's, once the light-up waited. */
        val lit: List<RenderedFrame> get() = rendered.filter { it.at in start + late..end + late }

        val renderGaps: List<Double> get() = lit.zipWithNext { first, second -> (second.at - first.at).toDouble() }

        val renderGapP90: Double get() = percentile(renderGaps, 0.9)

        /** The gaps between the main thread's frames over the same time, in ms. */
        val mainGaps: List<Long> get() = vsyncs.filter { it in start + late..end + late }.zipWithNext { first, second -> second - first }

        private fun percentile(values: List<Double>, fraction: Double) =
            values.sorted().let { if (it.isEmpty()) Double.NaN else it[((it.size - 1) * fraction).roundToInt()] }

        override fun toString(): String {
            val gaps = renderGaps
            val encoding = lit.map { it.encoding }
            val probes = if (probes.all { it.colours.isEmpty() }) "dots not read while the map moves" else probes.joinToString("; ") { probe ->
                val shown = probe.firstShown()
                if (probe.isUnderName) {
                    "%.0f m: %d shades, under a name".format(probe.metres, probe.shades())
                } else {
                    "%.0f m: %d shades, first shown %s, then within %.0f%%".format(
                        probe.metres,
                        probe.shades(),
                        shown?.let { "%+d ms at %.0f%%".format(it.first, it.second * 100) } ?: "never",
                        probe.wavers() * 100,
                    )
                }
            }
            val main = mainGaps
            val parsed = if (laidOut.isEmpty()) "none" else "+${laidOut.first()} to +${laidOut.last()} ms (${laidOut.size}, $laidOutLit once lit)"
            return ("$count scooters, %d ms waiting to be drawn, their tiles laid out $parsed, %.2f s lighting up in %d bands: MapLibre drew %d frames (%d whole), " +
                "gaps p50 %.0f, p90 %.0f, max %.0f ms, its thread's work p50 %.1f, p90 %.1f, max %.1f ms; " +
                "main thread %d frames, longest gap %d ms, %d vsyncs missed, %.0f ms at work in all; source written %d times; ").format(
                late,
                (end - start) / 1000.0,
                bands,
                lit.size,
                lit.count { it.fully },
                percentile(gaps, 0.5),
                percentile(gaps, 0.9),
                gaps.maxOrNull() ?: Double.NaN,
                percentile(encoding, 0.5),
                percentile(encoding, 0.9),
                encoding.maxOrNull() ?: Double.NaN,
                main.size + 1,
                main.maxOrNull() ?: 0L,
                main.sumOf { max(0L, (it / VSYNC).roundToLong() - 1) },
                mainWork,
                rewritten,
            ) + probes
        }
    }

    /**
     * The first scooters sent with the rider on the map, so that they light up from the rider outwards, as the app
     * gets them: MapLibre's frames and the main thread's are recorded from then to the end of the last fade, and,
     * unless the map pans meanwhile, the middles of a few dots kept clear of the others are read off the window at
     * every frame. The fades start once MapLibre has laid the scooters out, at most 1.5 s later. With the
     * instrumentation argument `screenrecord`, the screen is recorded to /data/local/tmp/app-b2-<name>.mp4.
     */
    private fun Marked.lightUp(count: Int, pans: Boolean, name: String, reads: Boolean = !pans): LightUp {
        val rider = zurich
        phone.onMain { controller.setUserLocation(rider) }
        val probes = PROBE_METRES.map { metres ->
            Probe(metres, scooter("probe-${metres.toInt()}", "voi", GeoPoint(rider.latitude + metres / 111_320.0, rider.longitude)))
        }
        val scooters = spread(count + 400, around = rider)
            .filter { scooter -> probes.none { it.scooter.coordinate.distance(to = scooter.coordinate) < PROBE_CLEARING } }
            .take(count - probes.size) + probes.map { it.scooter }
        assertEquals(count, scooters.size)

        // Where each probe's middle is in the window, which must show it.
        lateinit var window: Window
        phone.scenario.onActivity { window = it.window }
        phone.onMain {
            val inWindow = IntArray(2).also { phone.view.getLocationInWindow(it) }
            val onScreen = IntArray(2).also { phone.view.getLocationOnScreen(it) }
            val visible = Rect().also { phone.view.getWindowVisibleDisplayFrame(it) }
            for (probe in probes) {
                val point = phone.projection.point(probe.scooter.coordinate)
                probe.x = inWindow[0] + (point.x * ratio).roundToInt()
                probe.y = inWindow[1] + (point.y * ratio).roundToInt()
                val screenX = onScreen[0] + (point.x * ratio).roundToInt()
                val screenY = onScreen[1] + (point.y * ratio).roundToInt()
                assertTrue("${probe.metres} m is on the screen", visible.contains(screenX, screenY))
            }
        }
        val column = Rect(probes.first().x, probes.minOf { it.y }, probes.first().x + 1, probes.maxOf { it.y } + 1)
        assertTrue(probes.all { it.x == column.left })

        val recording = if (recordsScreen) record(name) else null

        // MapLibre's frames, heard on the main thread.
        val rendered = mutableListOf<RenderedFrame>()
        val renderListener = MapView.OnDidFinishRenderingFrameWithStatsListener { fully, stats ->
            rendered += RenderedFrame(SystemClock.uptimeMillis(), fully, stats.encodingTime * 1000, stats.renderingTime * 1000)
        }
        // When MapLibre has laid out each of the scooters' tiles.
        val parsed = mutableListOf<Pair<Long, Boolean>>()
        val parseListener = MapView.OnTileActionListener { operation, _, _, _, _, _, source ->
            if (operation == TileOperation.EndParse && source == ScooterMarkerLayers.MARKERS_SOURCE) parsed += SystemClock.uptimeMillis() to (markers.lightUpLate > 0)
        }
        // The main thread's frames, and at each the probes' middles, read off the window on a thread of their own.
        val reading = HandlerThread("pixels").apply { start() }
        val reader = Handler(reading.looper)
        val vsyncs = mutableListOf<Long>()
        var measuring = true

        // The names that cover a probe, wherever the scene puts them during the light-up; a name's shadow reaches a
        // few points beyond its frame.
        fun underNames() {
            val names = markers.scene.shownPillFrames(phone.projection)
            if (names.isEmpty()) return
            for (probe in probes) {
                val point = phone.projection.point(probe.scooter.coordinate)
                if (names.any { (_, frame) -> ScreenRect(frame.x - 4, frame.y - 4, frame.width + 8, frame.height + 8).contains(point) }) {
                    probe.isUnderName = true
                }
            }
        }
        val vsync = object : Choreographer.FrameCallback {
            override fun doFrame(frameTimeNanos: Long) {
                vsyncs += frameTimeNanos / 1_000_000
                if (reads) {
                    if (vsyncs.size % NAMES_EVERY == 0) underNames()
                    reader.post {
                        val at = SystemClock.uptimeMillis()
                        val pixels = Bitmap.createBitmap(1, column.height(), Bitmap.Config.ARGB_8888)
                        PixelCopy.request(window, column, pixels, { result ->
                            if (result != PixelCopy.SUCCESS) return@request
                            synchronized(probes) {
                                for (probe in probes) probe.colours += at to pixels.getPixel(0, probe.y - column.top)
                            }
                        }, reader)
                    }
                }
                if (measuring) Choreographer.getInstance().postFrameCallback(this)
            }
        }
        phone.onMain {
            phone.view.addOnDidFinishRenderingFrameListener(renderListener)
            phone.view.addOnTileActionListener(parseListener)
            Choreographer.getInstance().postFrameCallback(vsync)
        }
        val working = phone.onMain { Debug.threadCpuTimeNanos() }
        // The ground alone, before the scooters come.
        SystemClock.sleep(300)

        served = ScooterResponse(vehicles = scooters)
        phone.onMain {
            val projection = phone.projection
            val level = MapZoom.level(on = projection)
            controller.updateViewport(MapZoom.region(of = projection.visibleMapRect), MapZoom.apiZoom(level), level)
            controller.refresh()
        }
        waitFor("the markers have what the server sent") { phone.onMain { markers.scene.marks.size == count } }
        val (written, start, end) = phone.onMain {
            val scene = markers.scene
            for (probe in probes) probe.fade = scene.mark(probe.scooter.id)?.dotFade
            val fades = scene.marks.flatMap { listOfNotNull(it.dotFade, it.pillFade) }
            Triple(scene.markersVersion, (fades.minOf { it.from } * 1000).toLong(), (fades.maxOf { it.from + it.length } * 1000).toLong())
        }
        assertTrue("the probes light up", probes.all { it.fade != null })
        val bands = phone.onMain { phone.map.style!!.layers.count { "-band-" in it.id } }
        val over = end + HELD_AT_MOST + SHOWN_LATE
        if (pans) swipe(until = over) else SystemClock.sleep(max(0L, over - SystemClock.uptimeMillis()))

        phone.onMain {
            measuring = false
            phone.view.removeOnDidFinishRenderingFrameListener(renderListener)
            phone.view.removeOnTileActionListener(parseListener)
        }
        val work = (phone.onMain { Debug.threadCpuTimeNanos() } - working) / 1e6
        reading.quitSafely()
        reading.join()
        recording?.join()
        val rewritten = phone.onMain { markers.scene.markersVersion } - written
        val late = (phone.onMain { markers.lightUpLate } * 1000).roundToLong()
        for (probe in probes) probe.late = late
        if (reads) phone.onMain { underNames() }
        // The bands' layers are taken out once the dots are drawn by their own again.
        waitFor("the bands are taken out") { phone.onMain { phone.map.style!!.layers.none { "-band-" in it.id } } }
        val laidOut = phone.onMain { parsed.filter { it.first in start..end + late } }
        return LightUp(
            count, start, end, phone.onMain { rendered.toList() }, phone.onMain { vsyncs.toList() }, work, probes, rewritten, late, bands,
            laidOut.map { it.first - start }, laidOut.count { it.second },
        )
    }

    /** Whether the instrumentation argument `screenrecord` asks for the screen to be recorded. */
    private val recordsScreen: Boolean get() = InstrumentationRegistry.getArguments().getString("screenrecord") == "true"

    /**
     * MapLibre draws a light-up as the main thread's frames come, a dot at a time from the rider outwards: each
     * comes up from nothing, through many strengths, and stays once it is up. A screen being recorded slows the
     * emulator down: its numbers are not held then.
     */
    private fun assertDrawnInTime(lightUp: LightUp, panning: Boolean) {
        if (recordsScreen) return
        inTime(lightUp.renderGapP90 <= 34, lightUp)
        inTime((lightUp.mainGaps.maxOrNull() ?: 0L) <= 50, lightUp)
        if (panning) return
        val checked = lightUp.probes.filter { !it.isUnderName }
        assertTrue("$lightUp", checked.size >= 3)
        for (probe in checked) {
            inTime(probe.shades() >= 10, lightUp)
            inTime(probe.firstShown()!!.second < 0.45, lightUp)
            inTime(probe.wavers() < 0.15, lightUp)
        }
    }

    private class DrawnTooSlowly(message: String) : AssertionError(message)

    private fun inTime(held: Boolean, lightUp: LightUp) {
        if (!held) throw DrawnTooSlowly("$lightUp")
    }

    /**
     * The emulator shares the Mac with other work, whose bursts slow MapLibre's thread for a while: a light-up drawn
     * too slowly is measured once more on a fresh map, and that run decides. Slow code is slow both times: the
     * stepped light-up drew p90 45 ms at 2000 scooters and 108 ms at 5000.
     */
    private fun measuredAgainIfSlow(measure: () -> Unit) {
        try {
            measure()
        } catch (slow: DrawnTooSlowly) {
            Log.w(TAG, "Drawn too slowly, measured again: ${slow.message}")
            measure()
        }
    }

    /** Records the screen for five seconds from a second from now, as `adb shell screenrecord` does. */
    private fun record(name: String): Thread {
        val output = InstrumentationRegistry.getInstrumentation().uiAutomation
            .executeShellCommand("screenrecord --time-limit 5 /data/local/tmp/app-b2-$name.mp4")
        val recording = thread { ParcelFileDescriptor.AutoCloseInputStream(output).use { it.readBytes() } }
        SystemClock.sleep(1_000)
        return recording
    }

    @Test
    fun theScootersLightUpFromTheRiderFrameByFrameOver2000And5000() {
        for (count in listOf(2_000, 5_000)) {
            measuredAgainIfSlow {
                withMarkers(zurich, mapLibreZoom = 15.0) { marked ->
                    val lightUp = marked.lightUp(count, pans = false, name = "lightup-$count")
                    Log.i(TAG, "Light-up: $lightUp")
                    // The dots fade as the strength of a layer, never by writing the scooters again (MAP-319).
                    assertEquals(0, lightUp.rewritten)
                    // They start once MapLibre has laid them out, from nothing.
                    assertEquals("$lightUp", 0, lightUp.laidOutLit)
                    assertDrawnInTime(lightUp, panning = false)
                }
            }
        }
    }

    @Test
    fun theMapPansWhileTheScootersLightUpOver2000And5000() {
        for (count in listOf(2_000, 5_000)) {
            measuredAgainIfSlow {
                withMarkers(zurich, mapLibreZoom = 15.0) { marked ->
                    val lightUp = marked.lightUp(count, pans = true, name = "lightup-pan-$count")
                    Log.i(TAG, "Light-up while panning: $lightUp")
                    assertEquals(0, lightUp.rewritten)
                    assertDrawnInTime(lightUp, panning = true)
                }
            }
        }
    }

    @Test
    fun theScootersLightUpOverTheAppsOwnGroundAsItsTilesCome() {
        for (count in listOf(2_000, 5_000)) {
            for (panning in listOf(false, true)) {
                withMarkers(zurich, mapLibreZoom = 15.0, ground = true) { marked ->
                    // The ground's tiles come as the dots light up, under the probes: their colours say nothing.
                    val lightUp = marked.lightUp(count, pans = panning, name = "lightup-ground-$count${if (panning) "-pan" else ""}", reads = false)
                    Log.i(TAG, "Light-up over the ground${if (panning) " while panning" else ""}: $lightUp")
                    assertEquals(0, lightUp.rewritten)
                    // The light-up waits for the scooters' tiles, not for the ground's; those the map pans to come later.
                    if (!panning) assertEquals("$lightUp", 0, lightUp.laidOutLit)
                    if (!recordsScreen) assertTrue("$lightUp", lightUp.late <= HELD_ON_THE_GROUND)
                }
            }
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

        /** The probes' distances north of the rider: their fades start from 0.12 s to 0.93 s. */
        val PROBE_METRES = listOf(80.0, 200.0, 330.0, 470.0, 620.0)

        /** The metres around a probe kept clear of other scooters. */
        const val PROBE_CLEARING = 45.0

        /** How long after its moment a frame may reach the screen, in ms. */
        const val SHOWN_LATE = 300L

        /** The longest the light-up waits for MapLibre to draw the scooters, in ms. */
        const val HELD_AT_MOST = 1_500L

        /** The longest it waits on the app's ground, whose tiles come meanwhile: some 0.2 s on an emulator, in ms. */
        const val HELD_ON_THE_GROUND = 500L

        /** A vsync of a 60 Hz screen, in ms. */
        const val VSYNC = 1000.0 / 60

        /** The main thread's frames between two looks at where the names are. */
        const val NAMES_EVERY = 6
    }
}
