package com.plhery.scootradar.map

import android.graphics.Bitmap
import android.graphics.Paint
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterDotState
import com.plhery.scootradar.core.model.ScooterMapLook
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
import kotlin.math.abs
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

    /**
     * The balloon's disc goes evenly in sRGB from a lighter colour of its tint at its top to a darker one at its
     * bottom, as the iOS 27 simulator draws them (ui346, ui347): the searched place's pin in the system's blue by
     * day, by night and by night with Increase Contrast, and the bays of four providers, whose ends are the same in
     * every look. A bay without a provider is drawn as the pin is, its P in the middle.
     */
    @Test
    fun aBalloonIsLitAsMapKitsIs() {
        val art = art()
        fun look(isDark: Boolean, highContrast: Boolean = false) = ScooterMarkerArt.BalloonLook(isDark, highContrast)
        val pins = listOf(
            look(isDark = false) to (0x6DA2FE to 0x006ED1),
            look(isDark = true) to (0x73AAFE to 0x0077D3),
            look(isDark = true, highContrast = true) to (0xA4D0FE to 0x009EEA),
        )
        val balloons = pins.flatMap { (look, ends) ->
            listOf(
                "the pin, $look" to art.addressImage(look) to ends,
                "a bay without a provider, $look" to art.bayImage(ScooterMarkerArt.BayKey(null, isSelected = false, look = look)) to ends,
            )
        } + listOf(
            "voi" to (0xFE6DA9 to 0xD30077),
            "ryde" to (0x3B9F19 to 0x23670C),
            "pony" to (0x00C4BC to 0x008A84),
            "bird" to (0x363636 to 0x090909),
        ).flatMap { (provider, ends) ->
            listOf(false, true).map { isDark ->
                val key = ScooterMarkerArt.BayKey(ScooterProvider.fromRawValue(provider), isSelected = false, look = look(isDark))
                "$provider, dark $isDark" to art.bayImage(key) to ends
            }
        }
        val shape = ScooterMarkerArt.BayShape.rest
        for ((named, ends) in balloons) {
            val (name, balloon) = named
            // The picture hangs from its middle; the disc's centre is a rim and a radius below its top.
            val x = balloon.width / 3.0 / 2
            val centre = balloon.height / 3.0 / 2 - shape.above + shape.radius + shape.rim
            // Left of the glyph, a third of the way up and down the disc.
            for (row in listOf(centre - 6, centre + 6)) {
                val py = (row * 3).toInt()
                val share = ((py + 0.5) / 3 - (centre - shape.radius)) / (2 * shape.radius)
                val pixel = balloon.getPixel(((x - 10.5) * 3).toInt(), py)
                for (shift in listOf(16, 8, 0)) {
                    val top = ends.first shr shift and 0xFF
                    val bottom = ends.second shr shift and 0xFF
                    val expected = top + (bottom - top) * share
                    val drawn = pixel shr shift and 0xFF
                    assertTrue("$name, $share down, channel $shift: $drawn against $expected", abs(drawn - expected) <= 2.5)
                }
            }
        }
    }

    /**
     * The rim is white by day, over any ground, and by night #222834 at 0.81, the map showing through it but not the
     * balloon's own shadow (ui347), with Increase Contrast too.
     */
    @Test
    fun theRimIsWhiteByDayAndLetsTheMapThroughByNight() {
        val art = art()
        val shape = ScooterMarkerArt.BayShape.rest
        for (highContrast in listOf(false, true)) {
            for (isDark in listOf(false, true)) {
                val balloon = art.addressImage(ScooterMarkerArt.BalloonLook(isDark, highContrast))
                // The middle of the rim, straight above the disc.
                val x = balloon.width / 2
                val top = balloon.height / 3.0 / 2 - shape.above
                val pixel = balloon.getPixel(x, ((top + shape.rim / 2) * 3).toInt())
                val (alpha, colour) = if (isDark) 207 to 0x222834 else 255 to 0xFFFFFF
                assertEquals("dark $isDark, IC $highContrast: alpha", alpha.toDouble(), (pixel ushr 24).toDouble(), 2.0)
                for (shift in listOf(16, 8, 0)) {
                    assertEquals("dark $isDark, IC $highContrast: channel $shift", (colour shr shift and 0xFF).toDouble(), (pixel shr shift and 0xFF).toDouble(), 2.0)
                }
            }
        }
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
    fun aDotGrownInABitmapDrawnInBeforeIsTheSameAsInANewOne() {
        // Finding 5: the grow draws its copies in the bitmaps of the last ones, which MapLibre has taken the pixels
        // of; nothing of what was drawn there before stays.
        val voi = art().image(ScooterMarkerArt.Key(ScooterProvider.Voi, diameter = 16.0, state = ScooterDotState.Head, showsInitials = false, isDark = false))
        val bitmap = ScooterMarkerArt.grown(voi, 0.9)
        assertSame(bitmap, ScooterMarkerArt.grown(voi, 0.2, into = bitmap))
        assertTrue(bitmap.sameAs(ScooterMarkerArt.grown(voi, 0.2)))
        assertEquals(voi.density, bitmap.density)
    }

    @Test
    fun namesAndCountsAreTwelveAndThirteenPointsAtTheStandardSizeWhateverTheFontScaleSaysElsewhere() {
        // MAP-312: at the standard size the pills' and the counts' text is 12 and 13 points, as the iPhone's. Since
        // 4f64d247 they grow with the text size (MapTextGrowsTest), by the text scale the art is made with as the map
        // is made (mapTextScale), never by the font scale the art might otherwise read: art made at 1 draws the same
        // pictures at font scale 2.0.
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

        // The name is measured at 12 points of Inter Bold, and the walking time at 12 of Inter SemiBold; the pill is 26
        // high.
        assertEquals(ScooterMapLook.pillHeight, largest.pillHeight, 0.0)
        val fonts = MarkerFonts.of(ApplicationProvider.getApplicationContext())
        fun width(text: String, paint: Paint) = ceil(paint.measureText(text).toDouble())
        val bold = Paint().apply { typeface = fonts.bold; textSize = 12f; isSubpixelText = true }
        val semibold = Paint().apply { typeface = fonts.semibold; textSize = 12f; isSubpixelText = true }
        assertEquals(8 + 7 + 6 + width("Voi", bold) + 6 + width("3 min", semibold) + 10, largest.pillWidth(pills[0]), 0.0)
        assertEquals(8 + 7 + 6 + width("Lime", bold) + 10, largest.pillWidth(pills[1]), 0.0)
    }
}
