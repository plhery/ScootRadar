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
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread
import kotlin.math.abs
import kotlin.math.max

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

    /** How many dots the movers' layers draw now. */
    private fun Marked.movers(): Int =
        phone.map.style?.getSourceAs<GeoJsonSource>(ScooterMarkerLayers.MOVING_SOURCE)?.querySourceFeatures(null)?.size ?: 0

    @Test
    fun aDotEasesAndChangesHandsWithNoFrameOfNothing() = withMarkers(zurich, mapLibreZoom = 16.0) { marked ->
        // A dot in the middle, among 2000 others kept 80 pt from it: the scooters' source takes a while to lay out.
        val middle = ScreenPoint(195.0, 422.0)
        val others = spread(2_000, around = zurich).filter { scooter ->
            val point = marked.point(scooter.coordinate)
            abs(point.x - middle.x) > 80 || abs(point.y - middle.y) > 80
        }
        val probe = scooter("probe", "lime", marked.at(middle.x, middle.y))
        marked.serve(others + probe)

        val window = marked.phone.onMain { IntArray(2).also { marked.phone.view.getLocationInWindow(it) } }
        val x = window[0] + (middle.x * marked.ratio).toInt()
        val y = window[1] + (middle.y * marked.ratio).toInt()
        val ground = Color.rgb(0xee, 0xf0, 0xf4)

        // Selected at once, as with Remove animations, then let go: the main thread's frames meanwhile, against those
        // of the ease.
        animates = false
        val atOnce = mutableListOf<Long>()
        var asked = 0L
        probe(marked.phone, x, y, millis = 1_000, everyFrame = { atOnce += SystemClock.uptimeMillis() - asked }) {
            asked = SystemClock.uptimeMillis()
            marked.controller.selectScooter(probe.id)
        }
        Log.i(TAG, "Selected at once: the main thread's frames at $atOnce")
        marked.phone.onMain { marked.controller.selectScooter(null) }
        settle()
        animates = true

        // Selected, the dot grows into its ring over a quarter of a second, drawn by the movers meanwhile.
        val frames = mutableListOf<String>()
        var begun: Long? = null
        var drawnByMovers = 0L to 0L
        var selectedAt = 0L
        val colours = probe(marked.phone, x, y, millis = 1_500, everyFrame = {
            val now = SystemClock.uptimeMillis()
            val motion = marked.markers.scene.mark(probe.id)?.motion
            if (begun == null && motion?.begun != null) begun = now
            val movers = marked.movers()
            if (movers > 0 && drawnByMovers.first == 0L) drawnByMovers = now to 0L
            if (movers == 0 && drawnByMovers.first != 0L && drawnByMovers.second == 0L) drawnByMovers = drawnByMovers.first to now
            frames += "${now - selectedAt}:${movers}${if (motion == null) "" else if (motion.begun == null) "w" else "e"}"
        }) {
            selectedAt = SystemClock.uptimeMillis()
            marked.controller.selectScooter(probe.id)
        }
        Log.i(TAG, "A dot selected: frames (ms:movers, w waiting, e easing) $frames")
        Log.i(TAG, "Its middle: $colours")
        val handedOver = begun?.let { it - selectedAt }
        val handedBack = drawnByMovers.second - (begun ?: 0L) - 250
        Log.i(TAG, "Handed over after $handedOver ms, back $handedBack ms after its ease's end")

        // Never a frame without the dot.
        val gaps = colours.filter { isGround(it.second, ground) }
        assertTrue("frames without the dot: $gaps", gaps.isEmpty())
        // It changed hands once MapLibre had let it go, not after the longest wait, and back once MapLibre drew it.
        assertTrue("handed over after $handedOver ms", handedOver != null && handedOver < 450)
        assertTrue("handed back $handedBack ms after its end", drawnByMovers.second != 0L && handedBack < 450)
    }

    /**
     * The rider walks 250 m: the dots within some 360 m of where it was or is take a new strength, hundreds of
     * them eased. A filter narrowed and widened again changes the places of the dots in a spread. The frames of
     * the second after, as gfxinfo counts the window's and as MapLibre draws the map's, eased and at once, over
     * 5000 scooters.
     */
    @Test
    fun hundredsOfDotsEasingAtOnceKeepTheFrames() = withMarkers(zurich, mapLibreZoom = 15.0) { marked ->
        marked.phone.onMain { marked.controller.setUserLocation(zurich) }
        marked.serve(spread(5_000, around = zurich))
        // The light-up is over.
        settle()
        val results = mutableListOf<Measured>()
        var walks = 0
        for (eased in listOf(false, true, false, true)) {
            animates = eased
            for (change in listOf("rider", "narrowed", "widened")) {
                gfxinfo("reset")
                val drawn = mutableListOf<Long>()
                var changedAt = 0L
                val frames = MapView.OnDidFinishRenderingFrameListener { _, _, _ ->
                    drawn += SystemClock.uptimeMillis() - changedAt
                }
                marked.phone.onMain {
                    marked.phone.view.addOnDidFinishRenderingFrameListener(frames)
                    changedAt = SystemClock.uptimeMillis()
                    when (change) {
                        "rider" -> {
                            walks += 1
                            marked.controller.setUserLocation(GeoPoint(zurich.latitude + 0.00225 * (if (walks % 2 == 0) 0 else 1), zurich.longitude))
                        }
                        "narrowed" -> marked.controller.showProviders(setOf(ScooterProvider.Lime, ScooterProvider.Voi))
                        else -> marked.controller.showAllProviders()
                    }
                }
                var moving = 0
                var begun: Double? = null
                repeat(12) {
                    SystemClock.sleep(50)
                    marked.phone.onMain {
                        val marks = marked.markers.scene.moving()
                        moving = max(moving, marks.size)
                        begun = begun ?: marks.firstNotNullOfOrNull { it.motion?.begun }
                    }
                }
                SystemClock.sleep(600)
                marked.phone.onMain { marked.phone.view.removeOnDidFinishRenderingFrameListener(frames) }
                val stats = gfxinfo("")
                val first = drawn.filter { it <= 800 }
                val measured = Measured(
                    eased = eased,
                    change = change,
                    moving = moving,
                    frames = Regex("Total frames rendered: (\\d+)").find(stats)?.groupValues?.get(1)?.toInt() ?: 0,
                    janky = Regex("Janky frames: \\d+ \\(([\\d.]+)%\\)").find(stats)?.groupValues?.get(1)?.toDouble() ?: 0.0,
                    percentiles = listOf(50, 90, 99).joinToString("/") { Regex("${it}th percentile: (\\d+)ms").find(stats)?.groupValues?.get(1) ?: "?" },
                    mapFrames = first.size,
                    longestGap = first.zipWithNext { a, b -> b - a }.maxOrNull() ?: 0L,
                    easing = begun?.let { at ->
                        // From the last frame before the ease to the first after it.
                        val start = (at * 1000).toLong() - changedAt
                        val end = start + (IosMotion.IMPLICIT_DURATION * 1000).toLong()
                        val around = drawn.filter { it in start..end } + listOfNotNull(drawn.lastOrNull { it < start }, drawn.firstOrNull { it > end })
                        drawn.count { it in start..end } to (around.sorted().zipWithNext { a, b -> b - a }.maxOrNull() ?: 0L)
                    },
                )
                Log.i(TAG, "$measured")
                results += measured
                settle()
            }
        }
        Log.i(TAG, "Hundreds of dots: ${results.joinToString(" | ")}")
        // Hundreds of dots ease as the rider walks, and the window's frames are as many on time as at once.
        assertTrue("$results", results.filter { it.eased && it.change == "rider" }.all { it.moving >= 200 })
        val atOnce = results.filter { !it.eased }.maxOf { it.janky }
        assertTrue("$results", results.filter { it.eased }.all { it.janky <= atOnce + 10 })
    }

    private data class Measured(
        val eased: Boolean,
        val change: String,
        val moving: Int,
        val frames: Int,
        val janky: Double,
        val percentiles: String,
        val mapFrames: Int,
        val longestGap: Long,
        /** The map's frames while the dots ease, and the longest gap between them. */
        val easing: Pair<Int, Long>?,
    ) {
        override fun toString() = "${if (eased) "eased" else "at once"}, $change: $moving dots easing; window frames $frames, janky $janky %, " +
            "$percentiles ms; map frames $mapFrames in 0.8 s, longest gap $longestGap ms" +
            (easing?.let { "; easing ${it.first} map frames in 0.25 s, longest gap ${it.second} ms" } ?: "")
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

    private fun isGround(colour: Int, ground: Int): Boolean =
        abs(Color.red(colour) - Color.red(ground)) + abs(Color.green(colour) - Color.green(ground)) + abs(Color.blue(colour) - Color.blue(ground)) < 12

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
    }
}
