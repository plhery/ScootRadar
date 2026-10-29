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
import org.maplibre.android.style.layers.PaintPropertyValue
import org.maplibre.android.style.layers.Property
import org.maplibre.android.style.layers.PropertyFactory
import org.maplibre.android.style.sources.GeoJsonSource
import org.maplibre.android.tile.TileOperation
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.math.abs
import kotlin.math.cos

// The ground's buildings (MAP-254, MAP-249) at Zürich Hauptbahnhof close up, by day and by night. Seen from straight
// above, the flat map as the web draws it, with nothing of the raised buildings drawn once the map rests; tilted, the
// buildings raised, their walls standing; from one to the other their strengths alone change, and no tile of the
// ground is laid out again. The zones and the walk's trail lie over the flat buildings and under the raised ones. And
// the frames of a pan.
@RunWith(AndroidJUnit4::class)
class MapBuildingsTest {
    private val station = LatLng(47.3779, 8.5403)

    @Test
    fun theBuildingsRiseAtZurichHauptbahnhofAndLieFlatAgainWithNothingLaidOutAgain() {
        // The web's zoom 17, a street close up.
        val camera = CameraPosition.Builder().target(station).zoom(16.0).build()
        withPhoneMap(camera) { phone ->
            val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
            val day = GroundLook(GroundTheme.Day, GroundDetail.Calm, "en")
            val ground = phone.onMain { MapGround(phone.map, day, GroundTiles.openFreeMap(OkHttpClient()), imagery = null, scope) }
            try {
                waitFor(phone) { phone.map.style?.takeIf { it.getSource(GroundStyle.SOURCE) != null } }
                for (theme in GroundTheme.entries) {
                    val palette = GroundPalettes.of(theme)
                    phone.onMain { ground.show(day.copy(theme = theme)) }
                    val name = theme.name.lowercase()
                    tilt(phone, 0.0)
                    // Seen from straight above, the flat buildings, as the web draws them.
                    assertStrengths(phone, raised = false)
                    val flat = shot("buildings-$name-0")
                    val fills = count(flat) { it == palette.building.toColorInt() }
                    assertTrue("$name: $fills pixels of flat building", fills > 10_000)
                    val roofs = roofs(phone, flat, palette, name)
                    Log.i(TAG, "$name: $roofs")
                    // From above, the raised roofs are the flat buildings they take the place of.
                    assertTrue("$name: $roofs", roofs.pixels > 10_000 && roofs.distance <= ROOF_SHADE)

                    // Tilted, they stand: their walls, and their roofs off the ground.
                    for (pitch in listOf(45.0, 60.0)) {
                        tilt(phone, pitch)
                        assertStrengths(phone, raised = true)
                        screenshot("buildings-$name-${pitch.toInt()}")
                    }
                    val standing = standing(phone, name)
                    Log.i(TAG, "$name at 60°: $standing")
                    assertTrue("$name at 60°: $standing", standing.stood > 20_000)
                    // By night, their walls are as dark as the land.
                    if (theme == GroundTheme.Day) assertTrue("$name at 60°: $standing", standing.walls > 5_000)

                    // Flat again, the map is what it is without the raised buildings at all.
                    tilt(phone, 0.0)
                    val bare = bare(phone, "buildings-$name-0-bare")
                    // The buildings rise at the least tilt and lie flat again, once for the tiles the tilt shows, then
                    // twice over: no tile of the ground is laid out again, where a change to what they draw would lay
                    // out every tile shown.
                    val least = 2 * GroundStyle.LEAST_RAISED_TILT
                    for (pitch in listOf(least, 0.0)) tilt(phone, pitch)
                    val parses = parses(phone) {
                        repeat(2) {
                            tilt(phone, least)
                            assertStrengths(phone, raised = true)
                            tilt(phone, 0.0)
                            assertStrengths(phone, raised = false)
                        }
                    }
                    Log.i(TAG, "$name: the ground's tiles laid out through the switches: $parses")
                    assertEquals("$name: $parses", emptyList<String>(), parses)
                    // Raised as far as the map tilts and laid flat again: at rest, nothing raised is drawn, no wall,
                    // no roof.
                    tilt(phone, 60.0)
                    tilt(phone, 0.0)
                    assertStrengths(phone, raised = false)
                    val rested = shot("buildings-$name-0-rested")
                    val walls = count(phone, rested, bare) { a, b -> distance(a, b) > 8 }
                    Log.i(TAG, "$name: $walls pixels at rest unlike the map without the raised buildings")
                    assertEquals(name, 0, walls)

                    // Panning tilted, raised and without buildings, by turns, so that what else the computer running
                    // the emulator does weighs on both alike: the map draws the raised ones nearly as often (MAP-249).
                    // The gaps themselves are the computer's as much as the map's; they are logged, not held to.
                    tilt(phone, 60.0)
                    val panned = (1..PANS).flatMap { listOf(true, false) }.map { raised ->
                        phone.onMain { raisedLayer(phone).setProperties(PropertyFactory.visibility(if (raised) Property.VISIBLE else Property.NONE)) }
                        drawn(phone)
                        raised to pan(phone).also { Log.i(TAG, "$name, ${if (raised) "raised" else "no buildings"}, panning at 60°: $it") }
                    }
                    phone.onMain { raisedLayer(phone).setProperties(PropertyFactory.visibility(Property.VISIBLE)) }
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
     * A no-parking zone whose edge crosses the station, and a walk through it and the buildings beside it. They lie
     * between the streets and the raised buildings, whichever are shown: tilted, under the raised buildings, which
     * hide what is behind them, as MapKit's 3D buildings hide its overlays; seen from straight above, over the flat
     * ones, as MapKit's overlays lie over the roads. Each way, the trail shows less as it would the other way round:
     * over the raised buildings, more; under the flat ones, less.
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
                        assertStrengths(phone, raised)
                        // In their order, after the streets and before the raised buildings.
                        val order = phone.onMain { phone.map.style!!.layers.map { it.id } }
                        val overlays = GroundOverlays.order.map(order::indexOf)
                        assertEquals("$order", (order.indexOf("street-major") + 1 until order.indexOf(GroundStyle.RAISED_BUILDINGS)).toList(), overlays)
                        val shown = trailPixels(shot("overlays-$name-${pitch.toInt()}"))

                        // The other way round: over the raised buildings; under the flat ones.
                        phone.onMain { restack(phone, under = if (raised) GroundStyle.FIRST_LABEL_LAYER else GroundStyle.BUILDINGS) }
                        drawn(phone)
                        val other = trailPixels(shot("overlays-$name-${pitch.toInt()}-${if (raised) "over" else "under"}-buildings"))
                        phone.onMain { restack(phone, under = GroundStyle.RAISED_BUILDINGS) }
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

    private fun raisedLayer(phone: PhoneMap) = phone.map.style!!.getLayer(GroundStyle.RAISED_BUILDINGS)!!

    /** The buildings' layers at the strengths MapGround gives them, raised or flat. */
    private fun assertStrengths(phone: PhoneMap, raised: Boolean) {
        val strengths = phone.onMain {
            GroundStyle.buildingStrengths(raised).map { strength ->
                strength to when (val layer = phone.map.style!!.getLayer(strength.layer)) {
                    is FillLayer -> layer.fillOpacity.value
                    is LineLayer -> layer.lineOpacity.value
                    is FillExtrusionLayer -> layer.fillExtrusionOpacity.value
                    else -> null
                }
            }
        }
        for ((strength, value) in strengths) assertEquals("$strength", strength.opacity.toFloat(), value)
    }

    /** The buildings' layers set at their strengths, raised or flat, as MapGround sets them. */
    private fun strengthen(phone: PhoneMap, raised: Boolean) {
        val style = phone.map.style!!
        for (strength in GroundStyle.buildingStrengths(raised)) {
            style.getLayer(strength.layer)!!.setProperties(PaintPropertyValue(strength.property, strength.opacity.toFloat()))
        }
    }

    /** The ground's tiles MapLibre begins to lay out while [action] runs, as overscaled z/wrap/z/x/y. */
    private fun parses(phone: PhoneMap, action: () -> Unit): List<String> {
        val all = mutableListOf<String>()
        val listener = MapView.OnTileActionListener { operation, x, y, z, wrap, overscaledZ, source ->
            if (source == GroundStyle.SOURCE && operation == TileOperation.StartParse) all += "$overscaledZ/$wrap/$z/$x/$y"
        }
        phone.onMain { phone.view.addOnTileActionListener(listener) }
        try {
            action()
        } finally {
            phone.onMain { phone.view.removeOnTileActionListener(listener) }
        }
        return phone.onMain { all.toList() }
    }

    /**
     * How the raised buildings stand: the pixels drawn otherwise than with the same buildings laid flat on the ground
     * at the same strength, their walls and their roofs lifted off their footprints; and of those, the walls darker
     * than any roof by day.
     */
    private data class Standing(val stood: Int, val walls: Int)

    private fun standing(phone: PhoneMap, name: String): Standing {
        val raised = shot("buildings-$name-60-raised")
        val laid = laidFlat(phone) { shot("buildings-$name-60-laid-flat") }
        val stood = count(phone, raised, laid) { a, b -> distance(a, b) > 12 }
        // A roof lies at 0.8 over the ground, at least #b4b7bc by day; a wall is lit less, from the side.
        val walls = count(phone, raised, laid) { a, b -> distance(a, b) > 24 && maxOf(Color.red(a), Color.green(a), Color.blue(a)) < 0xb0 }
        return Standing(stood, walls)
    }

    /**
     * The raised buildings laid flat on the ground while [look] looks at them, then at their heights again as the
     * style has them.
     */
    private fun <T> laidFlat(phone: PhoneMap, look: () -> T): T {
        val (height, base) = phone.onMain {
            (raisedLayer(phone) as FillExtrusionLayer).let { it.fillExtrusionHeight.expression!! to it.fillExtrusionBase.expression!! }
        }
        phone.onMain { raisedLayer(phone).setProperties(PropertyFactory.fillExtrusionHeight(0f), PropertyFactory.fillExtrusionBase(0f)) }
        try {
            drawn(phone)
            return look()
        } finally {
            phone.onMain { raisedLayer(phone).setProperties(PropertyFactory.fillExtrusionHeight(height), PropertyFactory.fillExtrusionBase(base)) }
            drawn(phone)
        }
    }

    /** The screen without the raised buildings at all, kept as [name].png. */
    private fun bare(phone: PhoneMap, name: String): Bitmap {
        phone.onMain { raisedLayer(phone).setProperties(PropertyFactory.visibility(Property.NONE)) }
        drawn(phone)
        val bare = shot(name)
        phone.onMain { raisedLayer(phone).setProperties(PropertyFactory.visibility(Property.VISIBLE)) }
        drawn(phone)
        return bare
    }

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

    /** The zones and the trail moved under another layer, in their order. */
    private fun restack(phone: PhoneMap, under: String) {
        val style = phone.map.style!!
        val layers = GroundOverlays.order.mapNotNull { style.getLayer(it) }
        for (layer in layers) style.removeLayer(layer)
        var above = under
        for (layer in layers.asReversed()) {
            style.addLayerBelow(layer, above)
            above = layer.id
        }
    }

    /** How many pixels of a screen are the trail's blue. */
    private fun trailPixels(screen: Bitmap): Int {
        val blue = (WalkTrailLook.dotColor and 0xFFFFFF).toInt()
        return count(screen) { distance(it, blue) <= 24 }
    }

    /** How many pixels of a screen are as asked. */
    private fun count(screen: Bitmap, which: (Int) -> Boolean): Int {
        val pixels = IntArray(screen.width * screen.height)
        screen.getPixels(pixels, 0, screen.width, 0, 0, screen.width, screen.height)
        return pixels.count(which)
    }

    /** How many of the map's pixels on one screen are as asked, against the same pixel of another. */
    private fun count(phone: PhoneMap, screen: Bitmap, other: Bitmap, which: (Int, Int) -> Boolean): Int {
        // The map's own pixels, without the status bar, whose clock may have turned between the two.
        val (left, top) = phone.onMain { IntArray(2).also(phone.view::getLocationOnScreen).toList() }
        val width = minOf(phone.view.width, screen.width - left)
        val height = minOf(phone.view.height, screen.height - top)
        val pixels = IntArray(width * height)
        val others = IntArray(width * height)
        screen.getPixels(pixels, 0, width, left, top, width, height)
        other.getPixels(others, 0, width, left, top, width, height)
        return pixels.indices.count { which(pixels[it], others[it]) }
    }

    /** The most two colours are apart in a channel of 255. */
    private fun distance(a: Int, b: Int): Int =
        maxOf(abs(Color.red(a) - Color.red(b)), abs(Color.green(a) - Color.green(b)), abs(Color.blue(a) - Color.blue(b)))

    /** How far the raised roofs seen from above are from the flat buildings, where the flat map shows a building's fill. */
    private data class Roofs(val pixels: Int, val flat: Int, val raised: Int) {
        val distance: Int
            get() = maxOf(abs(Color.red(flat) - Color.red(raised)), abs(Color.green(flat) - Color.green(raised)), abs(Color.blue(flat) - Color.blue(raised)))

        override fun toString() = "$pixels pixels of building: flat #%06x, raised roofs from above #%06x on average, %d apart"
            .format(flat and 0xffffff, raised and 0xffffff, distance)
    }

    /**
     * The raised buildings shown in place of the flat ones on a map seen from straight above, at the ground, so that
     * no wall shows at the edges MapLibre draws in perspective: the mean colour of their roofs where the [flat] map
     * shows a building's fill. Then the flat buildings again, as MapGround has them.
     */
    private fun roofs(phone: PhoneMap, flat: Bitmap, palette: GroundPalette, name: String): Roofs {
        phone.onMain { strengthen(phone, raised = true) }
        val roofs = laidFlat(phone) { shot("buildings-$name-0-roofs") }
        phone.onMain { strengthen(phone, raised = false) }
        drawn(phone)
        val fill = palette.building.toColorInt()
        var count = 0
        var red = 0L
        var green = 0L
        var blue = 0L
        for (y in 0 until flat.height) {
            for (x in 0 until flat.width) {
                if (flat.getPixel(x, y) != fill) continue
                val pixel = roofs.getPixel(x, y)
                count += 1
                red += Color.red(pixel)
                green += Color.green(pixel)
                blue += Color.blue(pixel)
            }
        }
        val mean = if (count == 0) 0 else Color.rgb((red / count).toInt(), (green / count).toInt(), (blue / count).toInt())
        return Roofs(count, fill, mean)
    }

    /** The camera turned to [pitch] at once, and the map drawn whole after, the buildings' strengths eased. */
    private fun tilt(phone: PhoneMap, pitch: Double) {
        phone.onMain {
            val position = CameraPosition.Builder(phone.map.cameraPosition).target(station).tilt(pitch).build()
            phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(position))
        }
        drawn(phone)
    }

    /**
     * Waits for MapLibre to have drawn the map whole after what was just asked of it, its tiles loaded and nothing
     * easing: it says so after any frame that leaves it so, where "finished rendering the map" comes only once the
     * map was partly drawn.
     */
    private fun drawn(phone: PhoneMap) {
        SystemClock.sleep(GroundStyle.BUILDINGS_RISE)
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
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            File(dir).mkdirs()
            File(dir, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
        return bitmap
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

        /** How far apart, in any channel of 255, the raised roofs seen from above may be from the flat buildings, on average. */
        const val ROOF_SHADE = 3
    }
}
