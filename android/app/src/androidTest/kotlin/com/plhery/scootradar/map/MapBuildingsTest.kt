package com.plhery.scootradar.map

import android.graphics.Bitmap
import android.graphics.Color
import android.os.ParcelFileDescriptor
import android.os.SystemClock
import android.util.Log
import android.view.MotionEvent
import androidx.core.graphics.toColorInt
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.WalkTrailLook
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import okhttp3.OkHttpClient
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapView
import org.maplibre.android.style.expressions.Expression
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.layers.FillExtrusionLayer
import org.maplibre.android.style.layers.FillLayer
import org.maplibre.android.style.layers.LineLayer
import org.maplibre.android.style.layers.Property
import org.maplibre.android.style.layers.PropertyFactory
import org.maplibre.android.style.sources.GeoJsonSource
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.math.abs
import kotlin.math.cos

// The ground's buildings raised (MAP-254, MAP-249), at Zürich Hauptbahnhof close up, by day and by night: seen from
// straight above, laid flat, their roofs against the flat buildings they replace and the streets drawn over those;
// tilted as the iPhone's map tilts, raised, with the zones and the walk's trail under them; and the frames of a pan.
@RunWith(AndroidJUnit4::class)
class MapBuildingsTest {
    private val station = LatLng(47.3779, 8.5403)

    @Test
    fun theBuildingsRiseAtZurichHauptbahnhofAndTheirRoofsAreTheFlatBuildings() {
        // The web's zoom 17, a street close up.
        val camera = CameraPosition.Builder().target(station).zoom(16.0).build()
        withPhoneMap(camera) { phone ->
            val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
            val day = GroundLook(GroundTheme.Day, GroundDetail.Calm, "en")
            val ground = phone.onMain { MapGround(phone.map, day, GroundTiles.openFreeMap(OkHttpClient()), imagery = null, scope) }
            try {
                waitFor(phone) { phone.map.style?.takeIf { it.getSource(GroundStyle.SOURCE) != null } }
                for (theme in GroundTheme.entries) {
                    val look = day.copy(theme = theme)
                    phone.onMain { ground.show(look) }
                    val name = theme.name.lowercase()
                    tilt(phone, 0.0)
                    // Seen from straight above, they lie flat, as MapKit's do.
                    assertEquals(false, phone.onMain { areRaised(phone) })
                    val roofs = roofs(phone, GroundPalettes.of(theme), name)
                    Log.i(TAG, "$name: $roofs")
                    // From above, the roofs are the flat buildings they replace.
                    assertTrue("$name: $roofs", roofs.pixels > 10_000 && roofs.distance <= ROOF_SHADE)

                    for (pitch in listOf(45.0, 60.0)) {
                        tilt(phone, pitch)
                        assertEquals(true, phone.onMain { areRaised(phone) })
                        screenshot("buildings-$name-${pitch.toInt()}")
                    }
                    // Panning tilted, raised and without buildings, by turns, so that what else the computer running
                    // the emulator does weighs on both alike: the map draws the raised ones nearly as often (MAP-249).
                    // The gaps themselves are the computer's as much as the map's; they are logged, not held to.
                    val panned = (1..PANS).flatMap { listOf(true, false) }.map { raised ->
                        phone.onMain {
                            phone.map.style!!.getLayer(GroundStyle.BUILDINGS)!!.setProperties(PropertyFactory.visibility(if (raised) Property.VISIBLE else Property.NONE))
                        }
                        drawn(phone)
                        raised to pan(phone).also { Log.i(TAG, "$name, ${if (raised) "raised" else "no buildings"}, panning at 60°: $it") }
                    }
                    phone.onMain { phone.map.style!!.getLayer(GroundStyle.BUILDINGS)!!.setProperties(PropertyFactory.visibility(Property.VISIBLE)) }
                    val raised = panned.filter { it.first }.sumOf { it.second.mapFrames }
                    val none = panned.filter { !it.first }.sumOf { it.second.mapFrames }
                    Log.i(TAG, "$name: map frames panning, raised $raised, no buildings $none")
                    assertTrue("$name: raised $raised, no buildings $none: $panned", raised >= none * 0.8)
                }
            } finally {
                phone.onMain { ground.close() }
                scope.cancel()
            }
        }
    }

    /**
     * A no-parking zone whose edge crosses the station, and a walk through it and the buildings beside it. Tilted,
     * they go under the raised buildings, which hide what is behind them, as MapKit's 3D buildings hide its
     * overlays; seen from straight above, over the flat ones, as MapKit's overlays lie over the roads. Each way, the
     * trail shows less as it was before: over the raised buildings, more; under the flat ones' roofs, less.
     */
    @Test
    fun theZonesAndTheWalkGoUnderTheRaisedBuildingsAndOverTheFlatOnes() {
        val camera = CameraPosition.Builder().target(station).zoom(16.0).tilt(45.0).build()
        withPhoneMap(camera) { phone ->
            val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
            val day = GroundLook(GroundTheme.Day, GroundDetail.Calm, "en")
            val ground = phone.onMain { MapGround(phone.map, day, GroundTiles.openFreeMap(OkHttpClient()), imagery = null, scope) }
            try {
                waitFor(phone) { phone.map.style?.takeIf { it.getSource(GroundStyle.SOURCE) != null } }
                phone.onMain { drawOverlays(phone) }
                var dark = false
                for (theme in GroundTheme.entries) {
                    val name = theme.name.lowercase()
                    val isDark = theme == GroundTheme.Night
                    phone.onMain {
                        ground.show(day.copy(theme = theme))
                        val style = phone.map.style!!
                        GroundOverlays.restyle(style, ZoneLayers.specs(dark), ZoneLayers.specs(isDark))
                        GroundOverlays.restyle(style, TrailLayers.specs(dark), TrailLayers.specs(isDark))
                    }
                    dark = isDark
                    for (pitch in listOf(45.0, 0.0)) {
                        tilt(phone, pitch)
                        val raised = pitch > 0
                        assertEquals(raised, phone.onMain { areRaised(phone) })
                        val order = phone.onMain { phone.map.style!!.layers.map { it.id } }
                        val building = order.indexOf(GroundStyle.BUILDINGS)
                        val overlays = GroundOverlays.order.map(order::indexOf)
                        assertEquals("$order", GroundOverlays.order, order.filter { it in GroundOverlays.order })
                        assertTrue("$name at $pitch°: $order", if (raised) overlays.all { it in 0 until building } else overlays.all { it > building })
                        val shown = trailPixels(shot("overlays-$name-${pitch.toInt()}"))

                        // The other way round: over the raised buildings, as before; under the flat ones' roofs.
                        phone.onMain { restack(phone, underBuildings = !raised) }
                        drawn(phone)
                        val other = trailPixels(shot("overlays-$name-${pitch.toInt()}-${if (raised) "over" else "under"}-buildings"))
                        phone.onMain { GroundOverlays.stack(phone.map.style!!) }
                        drawn(phone)
                        Log.i(TAG, "$name at ${pitch.toInt()}°: the trail's blue in $shown pixels, $other the other way round")
                        if (raised) {
                            assertTrue("$name at $pitch°: $shown, $other", shown < other * 0.95)
                        } else {
                            assertTrue("$name at $pitch°: $shown, $other", shown > other * 1.05)
                        }
                    }
                }
            } finally {
                phone.onMain { ground.close() }
                scope.cancel()
            }
        }
    }

    /** Whether the buildings stand at their heights, not laid flat. */
    private fun areRaised(phone: PhoneMap): Boolean =
        (phone.map.style!!.getLayer(GroundStyle.BUILDINGS) as FillExtrusionLayer).fillExtrusionHeight.isExpression

    /** A point some metres east and north of the station. */
    private fun at(east: Double, north: Double): GeoPoint = GeoPoint(
        station.latitude + north / METRES_PER_DEGREE,
        station.longitude + east / (METRES_PER_DEGREE * cos(Math.toRadians(station.latitude))),
    )

    /** The zone and the walk, drawn as ScooterZoneLayer and WalkTrailLayer draw them, the whole walk shown. */
    private fun drawOverlays(phone: PhoneMap) {
        val style = phone.map.style!!
        val ring = listOf(at(-40.0, -30.0), at(160.0, -30.0), at(160.0, 170.0), at(-40.0, 170.0), at(-40.0, -30.0))
        val zone = ZoneDrawing(listOf(ScooterZone(id = "zone", provider = "voi", kind = ScooterZoneKind.NoParking, polygons = listOf(listOf(ring)))))
        style.addSource(GeoJsonSource(GroundOverlays.ZONES_SOURCE, zone.fills))
        style.addSource(GeoJsonSource(GroundOverlays.ZONE_EDGES_SOURCE, zone.edges(ZoneLayers.scale(phone.map.cameraPosition.zoom))))
        for (spec in ZoneLayers.specs(isDark = false)) GroundOverlays.add(style, spec)
        val walk = listOf(at(-180.0, -60.0), at(0.0, 0.0), at(180.0, 40.0)).map { MapPoint(it) }
        val dots = TrailDots(1, walk, WalkTrailLook.dotSpacing * WalkTrailLook.mapPointsPerPoint(phone.projection)!!)
        style.addSource(GeoJsonSource(GroundOverlays.TRAIL_SOURCE, dots.json))
        style.addSource(GeoJsonSource(GroundOverlays.FADING_TRAIL_SOURCE, GroundOverlays.NOTHING))
        for (spec in TrailLayers.specs(isDark = false)) GroundOverlays.add(style, spec)
        for (id in listOf(GroundOverlays.TRAIL_CASING, GroundOverlays.TRAIL)) {
            (style.getLayer(id) as CircleLayer).setFilter(Expression.raw(TrailLayers.filter(dots.positions.indices)))
        }
    }

    /** The zones and the trail moved under the buildings or over them, in their order. */
    private fun restack(phone: PhoneMap, underBuildings: Boolean) {
        val style = phone.map.style!!
        val layers = GroundOverlays.order.mapNotNull { style.getLayer(it) }
        for (layer in layers) style.removeLayer(layer)
        var above = if (underBuildings) GroundStyle.BUILDINGS else GroundStyle.FIRST_LABEL_LAYER
        for (layer in layers.asReversed()) {
            style.addLayerBelow(layer, above)
            above = layer.id
        }
    }

    /** How many pixels of a screen are the trail's blue. */
    private fun trailPixels(screen: Bitmap): Int {
        val blue = (WalkTrailLook.dotColor and 0xFFFFFF).toInt()
        val pixels = IntArray(screen.width * screen.height)
        screen.getPixels(pixels, 0, screen.width, 0, 0, screen.width, screen.height)
        return pixels.count { distance(it, blue) <= 24 }
    }

    /** The most two colours are apart in a channel of 255. */
    private fun distance(a: Int, b: Int): Int =
        maxOf(abs(Color.red(a) - Color.red(b)), abs(Color.green(a) - Color.green(b)), abs(Color.blue(a) - Color.blue(b)))

    /**
     * How far the roofs seen from above are from the flat buildings of before, where those are drawn; and the
     * pixels drawn otherwise than before, the outline left aside: where a street, a path, a rail or a square was
     * drawn over a building.
     */
    private data class Roofs(val pixels: Int, val flat: Int, val raised: Int, val changed: Int) {
        val distance: Int
            get() = maxOf(abs(Color.red(flat) - Color.red(raised)), abs(Color.green(flat) - Color.green(raised)), abs(Color.blue(flat) - Color.blue(raised)))

        override fun toString() = "$pixels pixels of building: flat #%06x, roofs #%06x on average, %d apart; %d pixels drawn otherwise than before"
            .format(flat and 0xffffff, raised and 0xffffff, distance, changed)
    }

    /**
     * The buildings drawn flat as before, a fill in the building colour under the squares, the rails, the paths and
     * the streets, with its outline; then laid flat as now: the mean colour of the roofs where the flat map shows a
     * building's fill, and the pixels that differ from the flat map without its outline, kept as
     * buildings-*-changed.png.
     */
    private fun roofs(phone: PhoneMap, palette: GroundPalette, name: String): Roofs {
        phone.onMain {
            // The web's: a fill, stroked 1 point wide.
            val flat = FillLayer("flat-building", GroundStyle.SOURCE).withSourceLayer("building")
                .withProperties(PropertyFactory.fillColor(palette.building))
            val outline = LineLayer("flat-building-line", GroundStyle.SOURCE).withSourceLayer("building")
                .withProperties(PropertyFactory.lineColor(if (palette === GroundPalettes.day) "#d6dae2" else "#171d2a"), PropertyFactory.lineWidth(1f))
            val style = phone.map.style!!
            style.addLayerBelow(flat, "square")
            style.addLayerAbove(outline, flat.id)
            style.getLayer(GroundStyle.BUILDINGS)!!.setProperties(PropertyFactory.visibility(Property.NONE))
        }
        drawn(phone)
        screenshot("buildings-$name-flat-before")
        phone.onMain { phone.map.style!!.getLayer("flat-building-line")!!.setProperties(PropertyFactory.visibility(Property.NONE)) }
        drawn(phone)
        val before = shot("buildings-$name-flat-before-unstroked")
        phone.onMain {
            val style = phone.map.style!!
            style.removeLayer("flat-building-line")
            style.removeLayer("flat-building")
            style.getLayer(GroundStyle.BUILDINGS)!!.setProperties(PropertyFactory.visibility(Property.VISIBLE))
        }
        drawn(phone)
        val after = shot("buildings-$name-0")
        val fill = palette.building.toColorInt()
        val changes = after.copy(Bitmap.Config.ARGB_8888, true)
        var count = 0
        var changed = 0
        var red = 0L
        var green = 0L
        var blue = 0L
        for (y in 0 until before.height) {
            for (x in 0 until before.width) {
                val was = before.getPixel(x, y)
                val pixel = after.getPixel(x, y)
                if (distance(was, pixel) > 8) {
                    changed += 1
                    changes.setPixel(x, y, Color.RED)
                }
                if (was != fill) continue
                count += 1
                red += Color.red(pixel)
                green += Color.green(pixel)
                blue += Color.blue(pixel)
            }
        }
        save(changes, "buildings-$name-changed")
        val mean = if (count == 0) 0 else Color.rgb((red / count).toInt(), (green / count).toInt(), (blue / count).toInt())
        return Roofs(count, fill, mean, changed)
    }

    private fun tilt(phone: PhoneMap, pitch: Double) {
        phone.onMain {
            val position = CameraPosition.Builder(phone.map.cameraPosition).target(station).tilt(pitch).build()
            phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(position))
        }
        // MapLibre's ease of the buildings' heights.
        SystemClock.sleep(GroundStyle.BUILDINGS_RISE)
        drawn(phone)
    }

    /**
     * Waits for MapLibre to have drawn the map whole after what was just asked of it, its tiles loaded and nothing
     * easing: it says so after any frame that leaves it so, where "finished rendering the map" comes only once the
     * map was partly drawn.
     */
    private fun drawn(phone: PhoneMap) {
        SystemClock.sleep(300)
        val idle = CountDownLatch(1)
        val listener = MapView.OnDidBecomeIdleListener { idle.countDown() }
        phone.onMain {
            phone.view.addOnDidBecomeIdleListener(listener)
            phone.map.triggerRepaint()
        }
        val done = idle.await(30, TimeUnit.SECONDS)
        phone.onMain { phone.view.removeOnDidBecomeIdleListener(listener) }
        assertTrue("the map drawn whole within 30 s", done)
        SystemClock.sleep(300)
    }

    /** The screen now, kept as [name].png as [screenshot] keeps it. */
    private fun shot(name: String): Bitmap {
        val bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        save(bitmap, name)
        return bitmap
    }

    private fun save(bitmap: Bitmap, name: String) {
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            File(dir).mkdirs()
            File(dir, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
    }

    /** A pan's frames: gfxinfo's count of the window's, and the map's own with the gaps between them. */
    private data class Panned(val windowFrames: String?, val janky: String?, val percentiles: String, val mapFrames: Int, val p90: Long, val longest: Long?) {
        override fun toString() = "window frames $windowFrames, janky $janky, $percentiles ms; map frames $mapFrames in 4 s, p90 gap $p90 ms, longest $longest ms"
    }

    /** Four seconds of a finger panning the tilted map up and down, 800 ms a swipe. */
    private fun pan(phone: PhoneMap): Panned {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        gfxinfo("reset")
        val drawn = mutableListOf<Long>()
        val frames = MapView.OnDidFinishRenderingFrameListener { _, _, _ -> drawn += SystemClock.uptimeMillis() }
        phone.onMain { phone.view.addOnDidFinishRenderingFrameListener(frames) }
        val ratio = phone.view.pixelRatio
        val until = SystemClock.uptimeMillis() + 4_000
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
            for (step in 1..STEPS) {
                SystemClock.sleep(16)
                send(MotionEvent.ACTION_MOVE, from + (to - from) * step / STEPS)
            }
            send(MotionEvent.ACTION_UP, to)
            up = !up
        }
        phone.onMain { phone.view.removeOnDidFinishRenderingFrameListener(frames) }
        val stats = gfxinfo("")
        val janky = Regex("Janky frames: (\\d+) \\(([\\d.]+)%\\)").find(stats)?.groupValues
        val total = Regex("Total frames rendered: (\\d+)").find(stats)?.groupValues?.get(1)
        val percentiles = listOf(50, 90, 99).joinToString("/") { Regex("${it}th percentile: (\\d+)ms").find(stats)?.groupValues?.get(1) ?: "?" }
        val gaps = drawn.zipWithNext { a, b -> b - a }.sorted()
        val p90 = gaps.getOrNull((gaps.size * 0.9).toInt()) ?: 0L
        return Panned(total, janky?.let { "${it[1]} (${it[2]} %)" }, percentiles, drawn.size, p90, gaps.lastOrNull())
    }

    private fun gfxinfo(argument: String): String {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val output = instrumentation.uiAutomation.executeShellCommand("dumpsys gfxinfo ${instrumentation.targetContext.packageName} $argument".trim())
        return ParcelFileDescriptor.AutoCloseInputStream(output).use { String(it.readBytes()) }
    }

    private fun <T : Any> waitFor(phone: PhoneMap, find: () -> T?): T {
        repeat(300) {
            phone.onMain(find)?.let { return it }
            Thread.sleep(100)
        }
        error("Nothing came in 30 s")
    }

    private companion object {
        const val TAG = "MapBuildingsTest"
        const val STEPS = 50

        /** Pans of each kind, raised and without buildings, by turns. */
        const val PANS = 2

        /** A degree of latitude, in metres. */
        const val METRES_PER_DEGREE = 111_195.0

        /**
         * How far apart, in any channel of 255, the roofs seen from above may be from the flat buildings they
         * replace, on average: the walls of the tallest show at the edges of the map, which MapLibre draws in
         * perspective.
         */
        const val ROOF_SHADE = 6
    }
}
