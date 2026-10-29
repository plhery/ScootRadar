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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import okhttp3.OkHttpClient
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapView
import org.maplibre.android.style.layers.FillLayer
import org.maplibre.android.style.layers.LineLayer
import org.maplibre.android.style.layers.Property
import org.maplibre.android.style.layers.PropertyFactory
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.math.abs

// The ground's buildings raised (MAP-254, MAP-249), at Zürich Hauptbahnhof close up, by day and by night: from above
// their roofs against the flat buildings they replace, tilted as the iPhone's map tilts, and the frames of a pan.
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
                    val roofs = roofs(phone, GroundPalettes.of(theme), name)
                    Log.i(TAG, "$name: $roofs")
                    // From above, the roofs are the flat buildings they replace.
                    assertTrue("$name: $roofs", roofs.pixels > 10_000 && roofs.distance <= ROOF_SHADE)

                    for (pitch in listOf(45.0, 60.0)) {
                        tilt(phone, pitch)
                        screenshot("buildings-$name-${pitch.toInt()}")
                    }
                    // Panning tilted, raised and as flat as before.
                    for (raised in listOf(true, false)) {
                        phone.onMain {
                            phone.map.style!!.getLayer("building")!!.setProperties(PropertyFactory.visibility(if (raised) Property.VISIBLE else Property.NONE))
                        }
                        drawn(phone)
                        val frames = pan(phone)
                        Log.i(TAG, "$name, ${if (raised) "raised" else "no buildings"}, panning at 60°: $frames")
                    }
                    phone.onMain { phone.map.style!!.getLayer("building")!!.setProperties(PropertyFactory.visibility(Property.VISIBLE)) }
                }
            } finally {
                phone.onMain { ground.close() }
                scope.cancel()
            }
        }
    }

    /** How far the raised roofs seen from above are from the flat buildings of before, where those are drawn. */
    private data class Roofs(val pixels: Int, val flat: Int, val raised: Int) {
        val distance: Int
            get() = maxOf(abs(Color.red(flat) - Color.red(raised)), abs(Color.green(flat) - Color.green(raised)), abs(Color.blue(flat) - Color.blue(raised)))

        override fun toString() = "$pixels pixels of building: flat #%06x, raised roofs #%06x on average, %d apart"
            .format(flat and 0xffffff, raised and 0xffffff, distance)
    }

    /**
     * The buildings drawn flat as before, a fill in the building colour with its outline, and then raised: the mean
     * colour of the raised map where the flat one shows a building's fill.
     */
    private fun roofs(phone: PhoneMap, palette: GroundPalette, name: String): Roofs {
        phone.onMain {
            // The web's: a fill, stroked 1 point wide.
            val flat = FillLayer("flat-building", GroundStyle.SOURCE).withSourceLayer("building")
                .withProperties(PropertyFactory.fillColor(palette.building))
            val outline = LineLayer("flat-building-line", GroundStyle.SOURCE).withSourceLayer("building")
                .withProperties(PropertyFactory.lineColor(if (palette === GroundPalettes.day) "#d6dae2" else "#171d2a"), PropertyFactory.lineWidth(1f))
            val style = phone.map.style!!
            style.addLayerBelow(flat, "building")
            style.addLayerAbove(outline, flat.id)
            style.getLayer("building")!!.setProperties(PropertyFactory.visibility(Property.NONE))
        }
        drawn(phone)
        val before = shot("buildings-$name-flat-before")
        phone.onMain {
            val style = phone.map.style!!
            style.removeLayer("flat-building-line")
            style.removeLayer("flat-building")
            style.getLayer("building")!!.setProperties(PropertyFactory.visibility(Property.VISIBLE))
        }
        drawn(phone)
        val after = shot("buildings-$name-0")
        val fill = palette.building.toColorInt()
        var count = 0
        var red = 0L
        var green = 0L
        var blue = 0L
        for (y in 0 until before.height) {
            for (x in 0 until before.width) {
                if (before.getPixel(x, y) != fill) continue
                val pixel = after.getPixel(x, y)
                count += 1
                red += Color.red(pixel)
                green += Color.green(pixel)
                blue += Color.blue(pixel)
            }
        }
        val mean = if (count == 0) 0 else Color.rgb((red / count).toInt(), (green / count).toInt(), (blue / count).toInt())
        return Roofs(count, fill, mean)
    }

    private fun tilt(phone: PhoneMap, pitch: Double) {
        phone.onMain {
            val position = CameraPosition.Builder(phone.map.cameraPosition).target(station).tilt(pitch).build()
            phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(position))
        }
        drawn(phone)
    }

    /** Waits for MapLibre to have drawn the map whole, its tiles loaded, after what was just asked of it. */
    private fun drawn(phone: PhoneMap) {
        SystemClock.sleep(300)
        val whole = CountDownLatch(1)
        val listener = MapView.OnDidFinishRenderingMapListener { fully -> if (fully) whole.countDown() }
        phone.onMain {
            phone.view.addOnDidFinishRenderingMapListener(listener)
            phone.map.triggerRepaint()
        }
        whole.await(30, TimeUnit.SECONDS)
        phone.onMain { phone.view.removeOnDidFinishRenderingMapListener(listener) }
        SystemClock.sleep(300)
    }

    /** The screen now, kept as [name].png as [screenshot] keeps it. */
    private fun shot(name: String): Bitmap {
        val bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()
        screenshot(name)
        return bitmap
    }

    /**
     * Four seconds of a finger panning the tilted map up and down, 800 ms a swipe: gfxinfo's count of the window's
     * frames, and the map's own.
     */
    private fun pan(phone: PhoneMap): String {
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
        return "window frames $total, janky ${janky?.get(1)} (${janky?.get(2)} %), $percentiles ms; " +
            "map frames ${drawn.size} in 4 s, p90 gap $p90 ms, longest ${gaps.lastOrNull()} ms"
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

        /**
         * How far apart, in any channel of 255, the roofs seen from above may be from the flat buildings they
         * replace, on average: the walls of the tallest show at the edges of the map, which MapLibre draws in
         * perspective.
         */
        const val ROOF_SHADE = 6
    }
}
