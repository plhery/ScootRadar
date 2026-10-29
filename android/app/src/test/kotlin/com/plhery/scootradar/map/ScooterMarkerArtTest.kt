package com.plhery.scootradar.map

import android.graphics.Bitmap
import android.graphics.Paint
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterDotState
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotSame
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import kotlin.math.ceil

/** The pictures the markers are drawn with: how many are kept, and the size of the text in them. */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScooterMarkerArtTest {
    @After
    fun tearDown() {
        resetFontScale()
    }

    private fun art(density: Float = 3f) = ScooterMarkerArt(density, MarkerFonts.of(ApplicationProvider.getApplicationContext()))

    @Test
    fun theDotsKeptAreForgottenOnceSixHundredAreKept() {
        // MAP-247 (ScooterMarkerArt.swift:37-46): zooming through every scale draws many sizes, so the pictures kept
        // are let go together when a 601st is drawn, and the first is drawn again when it is next asked for.
        val art = art(density = 1f)
        val providers = ScooterProvider.entries
        fun key(index: Int) = ScooterMarkerArt.Key(
            provider = providers[index % providers.size],
            diameter = 8.0 + index / providers.size * 0.5,
            state = ScooterDotState.Plain,
            showsInitials = false,
            isDark = false,
        )
        assertEquals(601, (0..600).map { key(it).id }.toSet().size)

        val first = art.image(key(0))
        for (index in 1 until 600) art.image(key(index))
        assertSame(first, art.image(key(0)))
        val last = art.image(key(599))

        art.image(key(600))
        assertSame(art.image(key(600)), art.image(key(600)))
        val again = art.image(key(0))
        assertNotSame(first, again)
        assertTrue(first.sameAs(again))
        assertNotSame(last, art.image(key(599)))
    }

    @Test
    fun aDotGrowsAboutItsMiddleInAPictureOfItsOwnSize() {
        // MAP-119: a band's copy of a dot's picture, the dot grown to a part of its size, is a picture of the same
        // size and pixel ratio, which MapLibre puts in the old one's place without laying anything out again.
        val picture = art().image(ScooterMarkerArt.Key(ScooterProvider.Voi, diameter = 16.0, state = ScooterDotState.Head, showsInitials = false, isDark = false))
        assertSame(picture, ScooterMarkerArt.grown(picture, 1.0))
        fun opaque(bitmap: Bitmap): List<Int> {
            val columns = (0 until bitmap.width).filter { x -> (0 until bitmap.height).any { y -> bitmap.getPixel(x, y) ushr 24 > 128 } }
            val rows = (0 until bitmap.height).filter { y -> (0 until bitmap.width).any { x -> bitmap.getPixel(x, y) ushr 24 > 128 } }
            return listOf(columns.first(), columns.last(), rows.first(), rows.last())
        }
        val whole = opaque(picture)
        val wide = whole[1] - whole[0] + 1
        for (scale in listOf(0.2, 0.6)) {
            val grown = ScooterMarkerArt.grown(picture, scale)
            assertEquals(picture.width, grown.width)
            assertEquals(picture.height, grown.height)
            assertEquals(picture.density, grown.density)
            val (left, right, top, bottom) = opaque(grown)
            // As wide as the dot at that scale, to a pixel each side, and with the same middle.
            assertEquals("$scale", wide * scale, (right - left + 1).toDouble(), 2.0)
            assertEquals("$scale", (whole[0] + whole[1]) / 2.0, (left + right) / 2.0, 1.0)
            assertEquals("$scale", (whole[2] + whole[3]) / 2.0, (top + bottom) / 2.0, 1.0)
        }
    }

    @Test
    fun namesAndCountsStayTwelveAndThirteenPointsAtTheLargestTextSize() {
        // MAP-312 (ScooterMarkerArt.swift:298-300): the pills' and the counts' text is of a fixed size, as the
        // iPhone's, whatever text size the person chose; the dock and the cards grow instead.
        val pills = listOf(
            ScooterMarkerArt.PillContent(ScooterProvider.fromRawValue("voi"), "Voi", "3 min", isFilled = false, isDark = false),
            ScooterMarkerArt.PillContent(ScooterProvider.fromRawValue("lime"), "Lime", null, isFilled = true, isDark = true),
        )
        val clusters = listOf(
            ScooterMarkerArt.ClusterKey(ScooterProvider.fromRawValue("bolt"), diameter = 44.0, isDark = false, count = "128"),
            ScooterMarkerArt.ClusterKey(ScooterProvider.fromRawValue("dott"), diameter = 30.0, isDark = true, count = "1,024"),
        )
        fun drawn(art: ScooterMarkerArt): List<Bitmap> =
            pills.map { art.pillImage(it) } + clusters.map { art.clusterImage(it) } + clusters.map { art.lastSeenClusterImage(it) }
        val usual = art()
        val widths = pills.map { usual.pillWidth(it) }
        val pictures = drawn(usual)

        useFontScale(2f)
        val largest = art()
        assertEquals(widths, pills.map { largest.pillWidth(it) })
        for ((index, picture) in drawn(largest).withIndex()) assertTrue("picture $index", picture.sameAs(pictures[index]))

        // The name is measured at 12 points of Inter Bold, and the walking time at 12 of Inter SemiBold.
        val fonts = MarkerFonts.of(ApplicationProvider.getApplicationContext())
        fun width(text: String, paint: Paint) = ceil(paint.measureText(text).toDouble())
        val bold = Paint().apply { typeface = fonts.bold; textSize = 12f; isSubpixelText = true }
        val semibold = Paint().apply { typeface = fonts.semibold; textSize = 12f; isSubpixelText = true }
        assertEquals(8 + 7 + 6 + width("Voi", bold) + 6 + width("3 min", semibold) + 10, largest.pillWidth(pills[0]), 0.0)
        assertEquals(8 + 7 + 6 + width("Lime", bold) + 10, largest.pillWidth(pills[1]), 0.0)
    }
}
