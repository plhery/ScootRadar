package com.plhery.scootradar.map

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.DisplayMetrics
import androidx.core.graphics.createBitmap
import androidx.core.graphics.toColorInt
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.github.takahirom.roborazzi.captureRoboImage
import com.plhery.scootradar.ui.theme.drawnArtOptions
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

// MAP-187, MAP-191 to MAP-197: MKUserLocationView and ScooterHeadingBeamView as the rider's pictures draw them.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class RiderArtTest {
    private val density = 2f
    private val art = RiderArt(density)
    private val light = RiderArt.Look(dark = false, highContrast = false)
    private val dark = RiderArt.Look(dark = true, highContrast = false)

    @Test
    fun theBeamIsASectorOf144PointsFadingFromItsPoint() {
        val beam = art.beam(halfAngle = 22.0, look = light)
        assertEquals(288, beam.width)
        assertEquals(288, beam.height)
        assertEquals("MapLibre reads its pixel ratio from its density", 320, beam.density)

        val middle = 144
        // Just above its point, the blue at 0.42; 0.45 of the way out, half that; at its edge, nothing.
        assertEquals(0.42 * (1 - 0.5 * 1.5 / (0.45 * 72)) * 255, Color.alpha(beam.getPixel(middle, middle - 3)).toDouble(), 8.0)
        assertEquals(0.21 * 255, Color.alpha(beam.getPixel(middle, middle - (0.45 * 144).roundToInt())).toDouble(), 4.0)
        assertTrue(Color.alpha(beam.getPixel(middle, 1)) < 8)
        assertEquals(0x00, Color.red(beam.getPixel(middle, middle - 20)))
        assertEquals(0x7A.toDouble(), Color.green(beam.getPixel(middle, middle - 20)).toDouble(), 2.0)
        // Nothing behind the dot, nor outside its angle.
        assertEquals(0, Color.alpha(beam.getPixel(middle, middle + 30)))
        assertEquals(0, Color.alpha(at(beam, degrees = 30.0, distance = 40.0)))
        assertTrue(Color.alpha(at(beam, degrees = 18.0, distance = 40.0)) > 0)

        val wide = art.beam(halfAngle = 60.0, look = light)
        assertTrue(Color.alpha(at(wide, degrees = 55.0, distance = 40.0)) > 0)
        assertEquals(0, Color.alpha(at(wide, degrees = 65.0, distance = 40.0)))
    }

    @Test
    fun increaseContrastStrengthensTheBeamAndDeepensTheBlue() {
        val contrast = RiderArt.Look(dark = false, highContrast = true)
        val beam = art.beam(halfAngle = 22.0, look = contrast)
        // 1.5 points from its point, the gradient has fallen a little from 0.65 towards half that.
        assertEquals(0.65 * (1 - 0.5 * 1.5 / (0.45 * 72)) * 255, Color.alpha(beam.getPixel(144, 141)).toDouble(), 8.0)
        assertEquals(0xFF007AFF.toInt(), art.blue(light))
        assertEquals(0xFF0A84FF.toInt(), art.blue(dark))
        assertEquals(0xFF0040DD.toInt(), art.blue(contrast))
        assertEquals(0xFF409CFF.toInt(), art.blue(RiderArt.Look(dark = true, highContrast = true)))
    }

    @Test
    fun theRingIsWhiteAndTheDotBreathesSlowly() {
        val ring = art.ring(light)
        assertEquals(68, ring.width)
        assertEquals(Color.WHITE, ring.getPixel(34, 34 - 20))
        assertTrue("its shadow round it", Color.alpha(ring.getPixel(34, 34 - 24)) in 1..254)
        assertEquals(0, Color.alpha(ring.getPixel(0, 0)))

        assertEquals(8.0, RiderArt.breathingRadius(0.0), 1e-9)
        assertEquals(6.8, RiderArt.breathingRadius(1.5), 1e-9)
        assertEquals(8.0, RiderArt.breathingRadius(3.0), 1e-9)
    }

    @Test
    fun theHaloIsAsWideAsTheFixIsVague() {
        // 10 m on the equator at zoom 17: MapLibre's world is 512 × 2¹⁷ points round 40,075 km.
        assertEquals(16.75, ScooterRider.haloRadius(accuracy = 10.0, latitude = 0.0, zoom = 17.0), 0.01)
        // Twice as wide a zoom in, and wider north, where the map stretches.
        assertEquals(33.5, ScooterRider.haloRadius(accuracy = 10.0, latitude = 0.0, zoom = 18.0), 0.02)
        assertEquals(16.75 / cos(Math.toRadians(47.3769)), ScooterRider.haloRadius(accuracy = 10.0, latitude = 47.3769, zoom = 17.0), 0.01)
        assertEquals(0.0, ScooterRider.haloRadius(accuracy = -1.0, latitude = 0.0, zoom = 17.0), 0.0)
    }

    @Test
    fun riderScreenshots() {
        val looks = mapOf(
            "light" to light,
            "dark" to dark,
            "lightHighContrast" to RiderArt.Look(dark = false, highContrast = true),
            "darkHighContrast" to RiderArt.Look(dark = true, highContrast = true),
        )
        for ((name, look) in looks) {
            // A sure compass to the north-east, and a vaguer one to the south-south-west, in a wider halo.
            rider(look, beam = 30.0, halfAngle = 22.0, halo = 40.0).captureRoboImage("src/test/screenshots/rider/northEast_$name.png", drawnArtOptions)
            rider(look, beam = 200.0, halfAngle = 45.0, halo = 70.0).captureRoboImage("src/test/screenshots/rider/southSouthWest_$name.png", drawnArtOptions)
        }
    }

    /** The beam's pixel `distance` points from its point, `degrees` clockwise from straight up. */
    private fun at(beam: Bitmap, degrees: Double, distance: Double): Int {
        val radians = Math.toRadians(degrees)
        return beam.getPixel((144 + sin(radians) * distance * density).roundToInt(), (144 - cos(radians) * distance * density).roundToInt())
    }

    /**
     * The rider as the map draws its layers, over the ground's land: the halo's circle, the beam turned [beam]
     * degrees, the ring and the dot, 200 points square.
     */
    private fun rider(look: RiderArt.Look, beam: Double, halfAngle: Double, halo: Double): Bitmap {
        val size = (200 * density).toInt()
        val bitmap = createBitmap(size, size)
        bitmap.density = (density * DisplayMetrics.DENSITY_DEFAULT).roundToInt()
        val middle = size / 2f
        // Canvas has a density of its own, the bitmap's dpi, which `density` would mean inside apply.
        val ratio = density
        Canvas(bitmap).apply {
            drawColor((if (look.dark) GroundPalettes.night.land else GroundPalettes.day.land).toColorInt())
            drawCircle(middle, middle, (halo * ratio).toFloat(), Paint(Paint.ANTI_ALIAS_FLAG).apply { color = art.halo(look) })
            val picture = art.beam(halfAngle, look)
            save()
            rotate(beam.toFloat(), middle, middle)
            drawBitmap(picture, middle - picture.width / 2f, middle - picture.height / 2f, null)
            restore()
            val ring = art.ring(look)
            drawBitmap(ring, middle - ring.width / 2f, middle - ring.height / 2f, null)
            drawCircle(middle, middle, (RiderArt.DOT_RADIUS * ratio).toFloat(), Paint(Paint.ANTI_ALIAS_FLAG).apply { color = art.blue(look) })
        }
        return bitmap
    }
}
