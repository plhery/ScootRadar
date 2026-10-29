package com.plhery.scootradar.map

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Rect
import android.os.Handler
import android.os.HandlerThread
import android.os.ParcelFileDescriptor
import android.os.SystemClock
import android.util.Log
import android.view.Choreographer
import android.view.PixelCopy
import android.view.Window
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterDotState
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapView
import org.maplibre.android.style.sources.GeoJsonSource
import org.maplibre.android.tile.TileOperation
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.roundToInt

// The markers' eases on MapLibre's map (MAP-097, MAP-098, MAP-116): a dot easing changes hands between the scooters'
// layers and the movers' with no frame of nothing, hundreds of dots easing at once keep the frames, as gfxinfo counts
// them, against the same changes drawn at once, and a name slides to its new side and goes along with its dot.
@RunWith(AndroidJUnit4::class)
class MarkerEasesTest {
    private val zurich = GeoPoint(47.3769, 8.5417)
    private val language = ScooterLanguage.current

    /** What the fake server sends, wherever the map is: what the test last gave it. */
    @Volatile
    private var served = ScooterResponse(vehicles = emptyList())
    private val api = object : ScooterAPIClient {
        override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = served
    }

    /** Whether the markers ease, as Remove animations leaves it. */
    @Volatile
    private var animates = true

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        ScooterLanguage.current = language
    }

    private class Marked(val phone: PhoneMap, val controller: ScooterMapController, val markers: ScooterMarkers) {
        val ratio: Float get() = phone.view.pixelRatio

        fun at(x: Double, y: Double): GeoPoint = phone.onMain { phone.projection.coordinate(ScreenPoint(x, y)) }

        fun point(of: GeoPoint): ScreenPoint = phone.onMain { phone.projection.point(of) }
    }

    private fun withMarkers(centre: GeoPoint, mapLibreZoom: Double, test: (Marked) -> Unit) {
        val camera = CameraPosition.Builder().target(LatLng(centre.latitude, centre.longitude)).zoom(mapLibreZoom).build()
        served = ScooterResponse(vehicles = emptyList())
        withPhoneMap(camera) { phone ->
            val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
            try {
                val marked = phone.onMain {
                    val controller = testController(scope, api)
                    val markers = ScooterMarkers(phone.map, phone.view, controller, analytics = null, scope = scope, move = {}, animates = { animates })
                    Marked(phone, controller, markers)
                }
                try {
                    test(marked)
                } finally {
                    phone.onMain { marked.markers.close() }
                }
            } finally {
                scope.cancel()
            }
        }
    }

    /** Has the fake server send these scooters, and waits for the markers to have them. */
    private fun Marked.serve(scooters: List<Scooter>) {
        served = ScooterResponse(vehicles = scooters)
        phone.onMain {
            val projection = phone.projection
            val level = MapZoom.level(on = projection)
            controller.updateViewport(MapZoom.region(of = projection.visibleMapRect), MapZoom.apiZoom(level), level)
            controller.refresh()
        }
        waitFor("the markers have what the server sent") { phone.onMain { markers.scene.marks.size == scooters.size } }
        settle()
    }

    /**
     * A dot's ease from a change made on the main thread, as MapLibre drew it: the colour of a pixel of the window at
     * each frame, by the time since the change in ms; the scooters' source's writes and the layouts of its tiles; when
     * the movers' layers had the dot, from the first frame to the last.
     */
    private class Eased(
        val colours: List<Pair<Long, Int>>,
        val written: Int,
        val layouts: Map<String, Int>,
        val moved: List<Long>,
        val frames: List<String>,
        val most: Int,
    ) {
        override fun toString() = "the scooters written $written times, their tiles laid out $layouts; the movers had it from " +
            "${moved.firstOrNull()} to ${moved.lastOrNull()} ms, $most easing at most; frames (ms:e easing) $frames; its middle ${colours.map { "${it.first}:${Integer.toHexString(it.second)}" }}"
    }

    private fun Marked.ease(id: String, x: Int, y: Int, change: () -> Unit): Eased {
        val layouts = HashMap<String, Int>()
        val tiles = MapView.OnTileActionListener { operation, tileX, tileY, z, wrap, overscaledZ, source ->
            if (operation == TileOperation.StartParse && source == ScooterMarkerLayers.MARKERS_SOURCE) {
                val tile = "$overscaledZ/$wrap/$z/$tileX/$tileY"
                layouts[tile] = (layouts[tile] ?: 0) + 1
            }
        }
        val written = phone.onMain {
            phone.view.addOnTileActionListener(tiles)
            markers.markersWritten
        }
        val frames = mutableListOf<String>()
        val moved = mutableListOf<Long>()
        var most = 0
        var changedAt = 0L
        val colours = probe(phone, x, y, millis = 1_000, everyFrame = {
            val at = SystemClock.uptimeMillis() - changedAt
            val moving = markers.scene.moving()
            most = max(most, moving.size)
            val easing = moving.any { it.scooter.id == id }
            if (easing) moved += at
            frames += "$at${if (easing) "e" else ""}"
        }) {
            changedAt = SystemClock.uptimeMillis()
            change()
        }
        return phone.onMain {
            phone.view.removeOnTileActionListener(tiles)
            Eased(colours, markers.markersWritten - written, HashMap(layouts), moved.toList(), frames.toList(), most)
        }
    }

    /**
     * Selected, a dot in the middle grows into its ring over a quarter of a second, drawn by the movers' layers from
     * the frame it starts to the frame it stops, and never missing meanwhile; the scooters' source is written once,
     * for its new look, and its tiles laid out once from it. Among others kept 80 pt from it, as many as a map eases.
     */
    @Test
    fun aDotEasesAndChangesHandsWithNoFrameOfNothing() = withMarkers(zurich, mapLibreZoom = 16.0) { marked ->
        val middle = ScreenPoint(195.0, 422.0)
        val others = spread(ScooterMarkerScene.MOST_DOTS_EASED - 20, around = zurich).filter { scooter ->
            val point = marked.point(scooter.coordinate)
            abs(point.x - middle.x) > 80 || abs(point.y - middle.y) > 80
        }
        val probe = scooter("probe", "lime", marked.at(middle.x, middle.y))
        marked.serve(others + probe)

        val window = marked.phone.onMain { IntArray(2).also { marked.phone.view.getLocationInWindow(it) } }
        val x = window[0] + (middle.x * marked.ratio).toInt()
        val y = window[1] + (middle.y * marked.ratio).toInt()
        val ground = Color.rgb(0xee, 0xf0, 0xf4)

        val selected = marked.ease(probe.id, x, y) { marked.controller.selectScooter(probe.id) }
        Log.i(TAG, "A dot selected: $selected")

        // Never a frame without the dot.
        val gaps = selected.colours.filter { isGround(it.second, ground) }
        assertTrue("frames without the dot: $gaps; $selected", gaps.isEmpty())
        assertHandedOver(selected)
    }

    /**
     * The rider walks 65 m towards a faint dot 310 m away: its strength eases from 0.5 to 0.6 over a quarter of a
     * second. Drawn by the scooters' layers and the movers' at once, it would show at 0.75 for a while; by neither, not
     * at all. Each frame shows it between what it was and what it is.
     */
    @Test
    fun aFaintDotEasesNeitherDrawnTwiceNorMissing() = withMarkers(zurich, mapLibreZoom = 16.0) { marked ->
        val rider = marked.at(195.0, 614.0)
        val faint = scooter("faint", "lime", GeoPoint(rider.latitude + 310 / METRES_PER_DEGREE, rider.longitude))
        val middle = marked.point(faint.coordinate)
        // A nearer Lime keeps the faint one plain, without a name.
        val near = scooter("near", "lime", GeoPoint(rider.latitude, rider.longitude + 30 / METRES_PER_DEGREE / cos(rider.latitude * PI / 180)))
        val others = spread(ScooterMarkerScene.MOST_DOTS_EASED - 20, around = zurich).filter { scooter ->
            val point = marked.point(scooter.coordinate)
            abs(point.x - middle.x) > 80 || abs(point.y - middle.y) > 80
        }
        marked.phone.onMain { marked.controller.setUserLocation(rider) }
        marked.serve(others + near + faint)
        // A dot 310 m away lights up 0.47 s after the nearest, and the scene does not ease it until 1.55 s after it
        // has lit up, in case MapLibre held the light-up.
        settle()
        val mark = marked.phone.onMain { marked.markers.scene.mark(faint.id)!! }
        val before = marked.phone.onMain { mark.look }
        assertEquals(0.5, before.strength, 0.001)
        assertEquals(ScooterDotState.Plain, before.state)

        val window = marked.phone.onMain { IntArray(2).also { marked.phone.view.getLocationInWindow(it) } }
        val x = window[0] + (middle.x * marked.ratio).toInt()
        val y = window[1] + (middle.y * marked.ratio).toInt()
        val ground = Color.rgb(0xee, 0xf0, 0xf4)
        val names = marked.phone.onMain { marked.markers.scene.shownPillFrames(marked.phone.projection) }
        assertTrue("no name over it: $names", names.none { (_, frame) -> ScreenRect(frame.x - 4, frame.y - 4, frame.width + 8, frame.height + 8).contains(middle) })
        val atRest = probe(marked.phone, x, y, millis = 200, everyFrame = {}) {}.last().second

        val walked = marked.ease(faint.id, x, y) {
            marked.controller.setUserLocation(GeoPoint(rider.latitude + 65 / METRES_PER_DEGREE, rider.longitude))
        }
        Log.i(TAG, "A faint dot, the rider come closer: $walked")
        val after = marked.phone.onMain { mark.look }
        assertEquals(0.605, after.strength, 0.001)
        assertEquals(before.diameter, after.diameter, 0.0)
        val atEnd = probe(marked.phone, x, y, millis = 200, everyFrame = {}) {}.last().second

        // How strongly each frame shows the dot, against how it showed before and after.
        val first = contrast(atRest, ground)
        val last = contrast(atEnd, ground)
        Log.i(TAG, "Its middle at rest ${Integer.toHexString(atRest)} ($first), then ${Integer.toHexString(atEnd)} ($last)")
        assertTrue("it shows stronger: $first, then $last", last > first)
        val shown = walked.colours.map { it.first to contrast(it.second, ground) }
        val doubled = shown.filter { it.second > last * 1.1 }
        val missing = shown.filter { it.second < first * 0.9 }
        assertTrue("drawn twice: $doubled; $walked", doubled.isEmpty())
        assertTrue("missing: $missing; $walked", missing.isEmpty())
        assertHandedOver(walked)
    }

    /**
     * The dot changed hands with the movers' layers in the frame its ease began, and back by the frame after it ended,
     * a quarter of a second later, give or take the frame each was seen in; the scooters' source was written once, for
     * its new look, and no tile of it laid out twice.
     */
    private fun assertHandedOver(eased: Eased) {
        assertEquals("$eased", 1, eased.written)
        assertTrue("$eased", eased.layouts.values.all { it == 1 })
        val firstFrame = eased.frames.first().removeSuffix("e").toLong()
        assertTrue("$eased", eased.moved.firstOrNull() == firstFrame)
        val length = (IosMotion.IMPLICIT_DURATION * 1000).toLong()
        assertTrue("$eased", eased.moved.last() - eased.moved.first() in length - 40..length + 20)
    }

    /**
     * MapLibre's frames from a change made on the main thread, by the time since it in ms, and the main thread's frames
     * at which something moved, the most that moved at once.
     */
    private class Watched(val drawn: List<Long>, val movedAt: List<Long>, val most: Int) {
        /** MapLibre's frames while something moved, from the last before it: their gaps. */
        val gaps: List<Long>
            get() {
                val from = movedAt.firstOrNull() ?: return emptyList()
                val to = movedAt.last()
                return (listOfNotNull(drawn.lastOrNull { it < from }) + drawn.filter { it in from..to }).zipWithNext { a, b -> b - a }
            }

        val p90: Long get() = gaps.sorted().let { if (it.isEmpty()) 0L else it[((it.size - 1) * 0.9).roundToInt()] }

        override fun toString() = if (movedAt.isEmpty()) {
            "nothing moved"
        } else {
            "$most moving from ${movedAt.first()} to ${movedAt.last()} ms: ${gaps.size} map frames, gaps p90 $p90, longest ${gaps.maxOrNull()} ms; drawn at ${drawn.filter { it <= movedAt.last() + 50 }}"
        }
    }

    /**
     * MapLibre's frames for [millis] from a [change] made on the main thread, and when [moving] counted anything at
     * the main thread's frames.
     */
    private fun Marked.watch(moving: () -> Int, millis: Long = 1_200, change: () -> Unit): Watched {
        val drawn = mutableListOf<Long>()
        val movedAt = mutableListOf<Long>()
        var most = 0
        var changedAt = 0L
        val frames = MapView.OnDidFinishRenderingFrameListener { _, _, _ -> drawn += SystemClock.uptimeMillis() - changedAt }
        val vsync = object : Choreographer.FrameCallback {
            override fun doFrame(frameTimeNanos: Long) {
                val now = SystemClock.uptimeMillis() - changedAt
                val count = moving()
                if (count > 0) movedAt += now
                most = max(most, count)
                if (now < millis) Choreographer.getInstance().postFrameCallback(this)
            }
        }
        phone.onMain {
            phone.view.addOnDidFinishRenderingFrameListener(frames)
            changedAt = SystemClock.uptimeMillis()
            change()
            Choreographer.getInstance().postFrameCallback(vsync)
        }
        SystemClock.sleep(millis + 100)
        return phone.onMain {
            phone.view.removeOnDidFinishRenderingFrameListener(frames)
            Watched(drawn.toList(), movedAt.toList(), most)
        }
    }

    /**
     * The rider walks 250 m: the dots within some 360 m of where it was or is take a new strength, dozens of them
     * eased. A filter narrowed and widened again changes the places of the dots in a spread. Over as many scooters as a
     * map eases, MapLibre draws the map through the eases at the phone's frame rate (MAP-319), and the window's frames
     * are on time as often as when the same changes are drawn at once, as gfxinfo counts them. Over 5000, the dots
     * change at once.
     */
    @Test
    fun dotsEasingAtOnceKeepTheFrames() = withMarkers(zurich, mapLibreZoom = 15.0) { marked ->
        marked.phone.onMain { marked.controller.setUserLocation(zurich) }
        marked.serve(spread(ScooterMarkerScene.MOST_DOTS_EASED, around = zurich))
        // The light-up is over.
        settle()
        val results = mutableListOf<Measured>()
        var walks = 0
        for (eased in listOf(false, true, false, true)) {
            animates = eased
            for (change in listOf("rider", "narrowed", "widened")) {
                gfxinfo("reset")
                val watched = marked.watch({ marked.markers.scene.moving().size }) {
                    when (change) {
                        "rider" -> {
                            walks += 1
                            marked.controller.setUserLocation(GeoPoint(zurich.latitude + 0.00225 * (if (walks % 2 == 0) 0 else 1), zurich.longitude))
                        }
                        "narrowed" -> marked.controller.showProviders(setOf(ScooterProvider.Lime, ScooterProvider.Voi))
                        else -> marked.controller.showAllProviders()
                    }
                }
                val stats = gfxinfo("")
                val first = watched.drawn.filter { it <= 800 }
                val measured = Measured(
                    eased = eased,
                    change = change,
                    frames = Regex("Total frames rendered: (\\d+)").find(stats)?.groupValues?.get(1)?.toInt() ?: 0,
                    janky = Regex("Janky frames: \\d+ \\(([\\d.]+)%\\)").find(stats)?.groupValues?.get(1)?.toDouble() ?: 0.0,
                    percentiles = listOf(50, 90, 99).joinToString("/") { Regex("${it}th percentile: (\\d+)ms").find(stats)?.groupValues?.get(1) ?: "?" },
                    mapFrames = first.size,
                    longestGap = first.zipWithNext { a, b -> b - a }.maxOrNull() ?: 0L,
                    easing = watched,
                )
                Log.i(TAG, "$measured")
                results += measured
                settle()
            }
        }
        Log.i(TAG, "Dots easing: ${results.joinToString(" | ")}")
        // Dozens of dots ease as the rider walks, and the window's frames are as many on time as at once.
        assertTrue("$results", results.filter { it.eased && it.change == "rider" }.all { it.easing.most >= 30 })
        val atOnce = results.filter { !it.eased }.maxOf { it.janky }
        assertTrue("$results", results.filter { it.eased }.all { it.janky <= atOnce + 10 })
        // MapLibre draws the map through the eases at the phone's rate, as it draws a light-up, not a write's 140 ms at
        // a time as over 5000 (MAP-319).
        val easings = results.filter { it.eased }.map { it.easing }
        assertTrue("$results", easings.all { it.movedAt.isNotEmpty() })
        assertTrue("$results", easings.all { it.p90 <= 34 && (it.gaps.maxOrNull() ?: 0L) <= 100 })

        // Over 5000 scooters, the rider walking changes the dots at once.
        marked.serve(spread(5_000, around = zurich))
        settle()
        animates = true
        marked.phone.onMain { marked.controller.setUserLocation(GeoPoint(zurich.latitude + 0.00225, zurich.longitude)) }
        var moving = 0
        repeat(12) {
            SystemClock.sleep(50)
            moving = max(moving, marked.phone.onMain { marked.markers.scene.moving().size })
        }
        assertEquals(0, moving)
    }

    private data class Measured(
        val eased: Boolean,
        val change: String,
        val frames: Int,
        val janky: Double,
        val percentiles: String,
        val mapFrames: Int,
        val longestGap: Long,
        /** The map's frames while the dots ease. */
        val easing: Watched,
    ) {
        override fun toString() = "${if (eased) "eased" else "at once"}, $change: window frames $frames, janky $janky %, " +
            "$percentiles ms; map frames $mapFrames in 0.8 s, longest gap $longestGap ms; easing: $easing"
    }

    /**
     * Among as many scooters as a map eases, a name slides to its new side, then goes along with its dot to a new place
     * in a spread, while MapLibre draws the map at the phone's frame rate: the names' source written at every frame
     * has it place every marker again (MAP-116, MAP-319).
     */
    @Test
    fun aNameSlidesAtTheMapsFrameRateAmongAsManyDotsAsAMapEases() = withMarkers(zurich, mapLibreZoom = 15.0) { marked ->
        val phone = marked.phone
        val centre = marked.point(zurich)
        phone.onMain { marked.controller.setUserLocation(zurich) }
        val spot = marked.at(centre.x, centre.y - 60)
        val named = scooter("named", "voi", spot)
        // Voi's one scooter is named. The others keep clear of its sides.
        val others = spread(800, around = zurich).filter { scooter ->
            val point = marked.point(scooter.coordinate)
            scooter.provider != "voi" && (abs(point.x - centre.x) > 150 || abs(point.y - centre.y + 60) > 50)
        }.take(ScooterMarkerScene.MOST_DOTS_EASED - 2)
        marked.serve(others + named)
        waitFor("its name is shown") { phone.onMain { marked.markers.scene.mark(named.id)?.shownPill != null } }
        settle()
        val mark = phone.onMain { marked.markers.scene.mark(named.id)!! }

        // A panel comes over the side the name is on: it slides to the other over 0.2 s. Then over that one: it slides
        // back.
        val slides = List(3) {
            val before = phone.onMain { mark.pillOrigin }
            val panel = if (before.x > 0) ScreenRect(centre.x + 5, 0.0, 390 - centre.x - 5, 844.0) else ScreenRect(0.0, 0.0, centre.x - 5, 844.0)
            val slid = marked.watch({ if (mark.pillMoves(SystemClock.uptimeMillis() / 1000.0)) 1 else 0 }) {
                marked.markers.chromeDidChange(MapChrome(panel = panel))
            }
            Log.i(TAG, "A name slid from $before to ${phone.onMain { mark.pillOrigin }} among ${others.size + 1} dots: $slid")
            settle()
            slid
        }

        // Another comes to the same spot: the dot moves aside over 0.22 s, and its name goes with it. It goes: they
        // come back.
        phone.onMain { marked.markers.chromeDidChange(MapChrome()) }
        settle()
        val asides = List(3) { index ->
            val other = if (index % 2 == 0) listOf(scooter("other", "lime", spot)) else emptyList()
            val aside = marked.watch({ if (mark.pillMoves(SystemClock.uptimeMillis() / 1000.0) || mark.motion != null) 1 else 0 }) {
                served = ScooterResponse(vehicles = others + named + other)
                marked.controller.refresh()
            }
            Log.i(TAG, "A name went along with its dot among ${others.size + 1 + other.size} dots: $aside")
            settle()
            aside
        }

        // The emulator's frames vary with what else its host runs: the middle of three counts.
        for (runs in listOf(slides, asides)) {
            assertTrue("$runs", runs.all { it.movedAt.isNotEmpty() })
            val middle = runs.sortedBy { it.p90 }[1]
            assertTrue("$runs", middle.p90 <= 34 && (middle.gaps.maxOrNull() ?: 0L) <= 100)
        }
    }

    @Test
    fun aNameSlidesToItsNewSideAndGoesAlongWithItsDot() = withMarkers(zurich, mapLibreZoom = 17.0) { marked ->
        val phone = marked.phone
        phone.onMain { marked.controller.setUserLocation(marked.at(195.0, 422.0)) }
        val spot = marked.at(195.0, 340.0)
        val named = scooter("named", "voi", spot)
        marked.serve(listOf(named))
        waitFor("its name is shown") { phone.onMain { marked.markers.scene.mark("voi:named")?.shownPill != null } }
        val mark = phone.onMain { marked.markers.scene.mark("voi:named")!! }
        val image = phone.onMain { mark.shownPill!!.id }
        val recording = if (recordsScreen) record("pill-slide") else null

        // A panel comes over the side the name is on: it slides to the other over 0.2 s, a place at each frame.
        val before = phone.onMain { mark.pillOrigin }
        val panel = if (before.x > 0) ScreenRect(200.0, 0.0, 190.0, 844.0) else ScreenRect(0.0, 0.0, 190.0, 844.0)
        val slid = pillPlaces(marked, image) { marked.markers.chromeDidChange(MapChrome(panel = panel)) }
        val after = phone.onMain { mark.pillOrigin }
        Log.i(TAG, "Slid from $before to $after: $slid")
        assertSlid(slid, from = before.x, to = after.x)

        // The panel goes, and the name stays on its side. Another comes to the same spot and its name takes that
        // side: the dot moves aside over 0.22 s, and its name goes with it to the other side.
        SystemClock.sleep(500)
        phone.onMain { marked.markers.chromeDidChange(MapChrome()) }
        SystemClock.sleep(500)
        assertEquals(after, phone.onMain { mark.pillOrigin })
        // The server answers a while after it is asked.
        val spread = pillPlaces(marked, image, millis = 1_500) {
            served = ScooterResponse(vehicles = listOf(named, scooter("other", "lime", spot)))
            marked.controller.refresh()
        }
        val aside = phone.onMain { mark.look.offset.x + mark.pillOrigin.x }
        Log.i(TAG, "Went along with its dot from ${after.x} to $aside: $spread")
        assertSlid(spread, from = after.x, to = aside)
        recording?.join()
    }

    /** A name went from [from] to [to] through places between, frame by frame, and stopped there. */
    private fun assertSlid(places: List<Double>, from: Double, to: Double) {
        val margin = ScooterMarkerArt.PILL_MARGIN
        assertEquals("$places", from - margin, places.first(), 0.01)
        assertEquals("$places", to - margin, places.last(), 0.01)
        val between = places.distinct().filter { abs(it - from + margin) > 0.5 && abs(it - to + margin) > 0.5 }
        assertTrue("$places", between.size >= 4)
        assertTrue("$places", between.all { (it - from + margin) * (to - margin - it) > 0 })
    }

    /**
     * Where MapLibre's names' source has the name with [image] across from its scooter, at each frame for [millis]
     * from before something done on the main thread.
     */
    private fun pillPlaces(marked: Marked, image: String, millis: Long = 600, action: () -> Unit): List<Double> {
        val places = mutableListOf<Double>()
        val end = SystemClock.uptimeMillis() + millis
        fun read() {
            val features = marked.phone.map.style?.getSourceAs<GeoJsonSource>(ScooterMarkerLayers.PILLS_SOURCE)?.querySourceFeatures(null).orEmpty()
            val feature = features.firstOrNull { it.getStringProperty("image") == image } ?: return
            val x = feature.getProperty("offset").asJsonArray[0].asDouble
            if (places.lastOrNull() != x) places += x
        }
        val done = CountDownLatch(1)
        val frame = object : Choreographer.FrameCallback {
            override fun doFrame(frameTimeNanos: Long) {
                read()
                if (SystemClock.uptimeMillis() < end) Choreographer.getInstance().postFrameCallback(this) else done.countDown()
            }
        }
        marked.phone.onMain {
            read()
            action()
            Choreographer.getInstance().postFrameCallback(frame)
        }
        done.await(5, TimeUnit.SECONDS)
        return places
    }

    /** Whether the instrumentation argument `screenrecord` asks for the screen to be recorded. */
    private val recordsScreen: Boolean get() = InstrumentationRegistry.getArguments().getString("screenrecord") == "true"

    /** Records the screen for five seconds from a second from now, to /data/local/tmp/app-l-[name].mp4. */
    private fun record(name: String): Thread {
        val output = InstrumentationRegistry.getInstrumentation().uiAutomation
            .executeShellCommand("screenrecord --time-limit 5 /data/local/tmp/app-l-$name.mp4")
        val recording = thread { ParcelFileDescriptor.AutoCloseInputStream(output).use { it.readBytes() } }
        SystemClock.sleep(1_000)
        return recording
    }

    private fun gfxinfo(argument: String): String {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val output = instrumentation.uiAutomation.executeShellCommand("dumpsys gfxinfo ${instrumentation.targetContext.packageName} $argument".trim())
        return ParcelFileDescriptor.AutoCloseInputStream(output).use { String(it.readBytes()) }
    }

    private fun isGround(colour: Int, ground: Int): Boolean = contrast(colour, ground) < 12

    private fun contrast(colour: Int, ground: Int): Int =
        abs(Color.red(colour) - Color.red(ground)) + abs(Color.green(colour) - Color.green(ground)) + abs(Color.blue(colour) - Color.blue(ground))

    /**
     * The colour of a pixel of the window at each frame for a while after an action, by the time since the action in
     * ms, with something done on the main thread at each frame too.
     */
    private fun probe(phone: PhoneMap, x: Int, y: Int, millis: Long, everyFrame: () -> Unit, action: () -> Unit): List<Pair<Long, Int>> {
        lateinit var window: Window
        phone.scenario.onActivity { window = it.window }
        val reading = HandlerThread("pixels").apply { start() }
        val reader = Handler(reading.looper)
        val out = mutableListOf<Pair<Long, Int>>()
        var start = 0L
        var measuring = true
        val vsync = object : Choreographer.FrameCallback {
            override fun doFrame(frameTimeNanos: Long) {
                everyFrame()
                reader.post {
                    val at = SystemClock.uptimeMillis()
                    val pixels = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
                    try {
                        PixelCopy.request(window, Rect(x, y, x + 1, y + 1), pixels, { result ->
                            if (result == PixelCopy.SUCCESS) synchronized(out) { out += (at - start) to pixels.getPixel(0, 0) }
                        }, reader)
                    } catch (_: IllegalArgumentException) {
                    }
                }
                if (measuring) Choreographer.getInstance().postFrameCallback(this)
            }
        }
        phone.onMain {
            start = SystemClock.uptimeMillis()
            Choreographer.getInstance().postFrameCallback(vsync)
            action()
        }
        SystemClock.sleep(millis)
        phone.onMain { measuring = false }
        SystemClock.sleep(100)
        reading.quitSafely()
        return synchronized(out) { out.toList() }
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

    private fun waitFor(what: String, condition: () -> Boolean) {
        val end = SystemClock.uptimeMillis() + 10_000
        while (SystemClock.uptimeMillis() < end) {
            if (condition()) return
            SystemClock.sleep(50)
        }
        throw AssertionError("Timed out: $what")
    }

    companion object {
        private const val TAG = "MarkerEasesTest"

        /** A degree of latitude, in metres. */
        private const val METRES_PER_DEGREE = 111_320.0
    }
}
