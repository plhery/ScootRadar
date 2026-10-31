package com.plhery.scootradar.map

import android.content.Context
import android.content.res.Configuration
import android.graphics.Bitmap
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterDotState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import kotlin.math.sqrt

// UI-187: under Bold Text an iPhone draws the map's text heavier, as it draws it: the markers' text is UIKit's system
// font (ScooterMarkerArt.swift:144 the initials, heavy; :299-300 a name, bold, and its time, semibold;
// ScooterMapView.swift:2538 and :2719 a cluster's count, bold), and the searched place's pin and a bay are MapKit's
// markers, a symbol and a letter. Android's Bold Text adds 300 to the configuration's font weights.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class BoldTextMarkersTest {
    private val context: Context = ApplicationProvider.getApplicationContext()
    private val voi = ScooterProvider.fromRawValue("voi")

    /** The pictures with text or a symbol in them, each drawn by an art. */
    private val pictures: List<Pair<String, (ScooterMarkerArt) -> Bitmap>> = listOf(
        "a scooter's initials" to { it.image(ScooterMarkerArt.Key(voi, diameter = 30.0, state = ScooterDotState.Plain, showsInitials = true, isDark = false)) },
        "a cluster's count" to { it.clusterImage(ScooterMarkerArt.ClusterKey(voi, diameter = 44.0, isDark = false, count = "128")) },
        "a group last seen's count" to { it.lastSeenClusterImage(ScooterMarkerArt.ClusterKey(voi, diameter = 44.0, isDark = true, count = "56")) },
        "a bay's P" to { it.bayImage(ScooterMarkerArt.BayKey(voi, isSelected = false)) },
        "the searched place's pin" to { it.addressImage(isDark = false) },
    )
    private val pill = ScooterMarkerArt.PillContent(voi, "Voi", "3 min", isFilled = false, isDark = false)

    /** Under Bold Text the markers' text and the pin's symbol are drawn heavier: more of each is ink. */
    @Test
    fun underBoldTextTheMapsTextAndThePinsSymbolAreDrawnHeavier() {
        val regular = art(0)
        val bold = art(300)
        val notHeavier = mutableListOf<String>()
        for ((name, draw) in pictures) {
            val (one, other) = draw(regular) to draw(bold)
            val box = changed(one, other)
            val heavier = if (box == null) 1.0 else ink(other, box) / ink(one, box)
            if (heavier < 1.05) notHeavier += "$name (${"%.3f".format(heavier)})"
        }
        // A name and its time: the pill is wider for them, as the iPhone measures its text in the heavier font.
        val (one, other) = regular.pillImage(pill) to bold.pillImage(pill)
        val heavier = ink(other, whole(other)) / ink(one, whole(one))
        if (heavier < 1.05) notHeavier += "a name and its time (${"%.3f".format(heavier)})"
        assertEquals("the pictures drawn no heavier under Bold Text", emptyList<String>(), notHeavier)
        assertTrue("the pill under Bold Text, ${bold.pillWidth(pill)} against ${regular.pillWidth(pill)}", bold.pillWidth(pill) > regular.pillWidth(pill))
    }

    /** A configuration that doesn't say (FONT_WEIGHT_ADJUSTMENT_UNDEFINED) draws the map as one without Bold Text. */
    @Test
    fun anUndefinedAdjustmentDrawsTheMapsTextAtItsOwnWeight() {
        val usual = art(0)
        val undefined = art(Configuration.FONT_WEIGHT_ADJUSTMENT_UNDEFINED)
        for ((name, draw) in pictures) assertTrue(name, draw(undefined).sameAs(draw(usual)))
        assertTrue("a name and its time", undefined.pillImage(pill).sameAs(usual.pillImage(pill)))
    }

    private fun art(adjustment: Int): ScooterMarkerArt {
        val configuration = Configuration(context.resources.configuration).apply { fontWeightAdjustment = adjustment }
        return ScooterMarkerArt(3f, MarkerFonts.of(context.createConfigurationContext(configuration)))
    }

    private class Box(val left: Int, val top: Int, val right: Int, val bottom: Int)

    private fun whole(bitmap: Bitmap) = Box(0, 0, bitmap.width, bitmap.height)

    /** Where two pictures of one size differ, two pixels wider each side; null where they don't. */
    private fun changed(one: Bitmap, other: Bitmap): Box? {
        assertEquals(one.width, other.width)
        assertEquals(one.height, other.height)
        var left = Int.MAX_VALUE
        var top = Int.MAX_VALUE
        var right = -1
        var bottom = -1
        for (x in 0 until one.width) for (y in 0 until one.height) {
            if (one.getPixel(x, y) == other.getPixel(x, y)) continue
            left = minOf(left, x)
            top = minOf(top, y)
            right = maxOf(right, x)
            bottom = maxOf(bottom, y)
        }
        if (right < 0) return null
        return Box(maxOf(0, left - 2), maxOf(0, top - 2), minOf(one.width, right + 3), minOf(one.height, bottom + 3))
    }

    /**
     * How much of [box] is the text's or the symbol's ink: each pixel, over white, placed between the commonest colour
     * of the box's edge (what the text is drawn on; a balloon's is shaded) and the colour farthest from it (the
     * text's own), from 0 to 1, summed over the pixels more the text's than the ground's (a pill's shadow and border,
     * and its dot, are less).
     */
    private fun ink(bitmap: Bitmap, box: Box): Double {
        val colours = buildList {
            for (x in box.left until box.right) for (y in box.top until box.bottom) add(overWhite(bitmap.getPixel(x, y)))
        }
        val edge = buildList {
            for (x in box.left until box.right) for (y in listOf(box.top, box.bottom - 1)) add(overWhite(bitmap.getPixel(x, y)))
            for (y in box.top until box.bottom) for (x in listOf(box.left, box.right - 1)) add(overWhite(bitmap.getPixel(x, y)))
        }
        val ground = edge.groupingBy { it.toList() }.eachCount().maxBy { it.value }.key.toDoubleArray()
        val text = colours.maxBy { distance(it, ground) }
        val span = distance(text, ground)
        if (span == 0.0) return 0.0
        return colours.sumOf { colour ->
            val share = (0..2).sumOf { (colour[it] - ground[it]) * (text[it] - ground[it]) } / (span * span)
            if (share > 0.5) share.coerceAtMost(1.0) else 0.0
        }
    }

    /** A pixel as it shows over white, its three channels from 0 to 255. */
    private fun overWhite(pixel: Int): DoubleArray {
        val alpha = (pixel ushr 24) / 255.0
        val shifts = intArrayOf(16, 8, 0)
        return DoubleArray(3) { (pixel ushr shifts[it] and 0xFF) * alpha + 255 * (1 - alpha) }
    }

    private fun distance(one: DoubleArray, other: DoubleArray): Double = sqrt((0..2).sumOf { (one[it] - other[it]) * (one[it] - other[it]) })
}
