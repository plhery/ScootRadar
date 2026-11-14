package com.plhery.scootradar.map

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Paint
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterMapLook
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import java.util.Locale
import kotlin.math.ceil

/**
 * The names, walking times and counts drawn on the map grow with the text size, the names up to twice their size and
 * shown whole or not at all, the counts as far as their discs allow (4f64d247: ScooterMapLookTests and
 * ScooterMapModelTests.testTheNamesOnTheMapGrowWithVeryLargeTextAndKeepTheirSizeOtherwise).
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MapTextGrowsTest {
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current
    private val fonts get() = MarkerFonts.of(ApplicationProvider.getApplicationContext())

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        resetFontScale()
        Locale.setDefault(locale)
        ScooterLanguage.current = language
    }

    @Test
    fun theTextOnTheMapFollowsTheFontSizeUpToTwiceItsSize() {
        fun scale(fontScale: Float): Double {
            useFontScale(fontScale)
            return mapTextScale(ApplicationProvider.getApplicationContext())
        }
        assertEquals("The standard size", 1.0, scale(1f), 1e-9)
        assertEquals("Smaller text leaves the map as it is", 1.0, scale(0.85f), 1e-9)
        val larger = scale(1.3f)
        assertTrue("$larger", larger > 1 && larger < 2)
        assertEquals("Twice at Android's largest font size", 2.0, scale(2f), 1e-9)
    }

    @Test
    fun aLargerNameIsTallerAndWider() {
        val standard = ScooterMarkerArt(3f, fonts)
        val larger = ScooterMarkerArt(3f, fonts, textScale = 2.0)
        val pills = listOf(
            ScooterMarkerArt.PillContent(ScooterProvider.Voi, "Voi", "5 min", isFilled = false, isDark = false),
            ScooterMarkerArt.PillContent(ScooterProvider.Lime, "Lime", null, isFilled = true, isDark = true),
        )
        assertEquals(ScooterMapLook.pillHeight, standard.pillHeight, 0.0)
        assertEquals(2 * ScooterMapLook.pillHeight, larger.pillHeight, 0.0)
        for (pill in pills) {
            assertTrue(pill.name, larger.pillWidth(pill) > standard.pillWidth(pill) * 1.4)
            // The picture is the pill with its shadow's margin, at the map's pixel ratio.
            assertEquals(ceil((larger.pillHeight + 2 * ScooterMarkerArt.PILL_MARGIN) * 3).toInt(), larger.pillImage(pill).height)
        }
        // Its name at 24 points of Inter Bold and its walking time at 24 of Inter SemiBold; the dot and the gaps keep
        // their size (ScooterMarkerArt.swift:283-297).
        fun width(text: String, paint: Paint) = ceil(paint.measureText(text).toDouble())
        val bold = Paint().apply { typeface = fonts.bold; textSize = 24f; isSubpixelText = true }
        val semibold = Paint().apply { typeface = fonts.semibold; textSize = 24f; isSubpixelText = true }
        assertEquals(8 + 7 + 6 + width("Voi", bold) + 6 + width("5 min", semibold) + 10, larger.pillWidth(pills[0]), 0.0)
        assertEquals(8 + 7 + 6 + width("Lime", bold) + 10, larger.pillWidth(pills[1]), 0.0)
        // Half a point rounds up, as the iPhone's .rounded(): 26 × 1.25 is 32.5.
        assertEquals(33.0, ScooterMarkerArt(3f, fonts, textScale = 1.25).pillHeight, 0.0)
    }

    @Test
    fun countsGrowAsFarAsTheirDiscsAllow() {
        val standard = ScooterMarkerArt(3f, fonts)
        val larger = ScooterMarkerArt(3f, fonts, textScale = 2.0)
        // "128" in the largest disc grows; its disc keeps its size, so the map is laid out as before.
        val roomy = ScooterMarkerArt.ClusterKey(ScooterProvider.Bolt, diameter = 44.0, isDark = false, count = "128")
        assertEquals(standard.clusterImage(roomy).width, larger.clusterImage(roomy).width)
        val grown = digitsHeight(larger.clusterImage(roomy)) / digitsHeight(standard.clusterImage(roomy))
        assertTrue("$grown", grown > 1.4 && grown < 2.05)
        val seen = digitsHeight(larger.lastSeenClusterImage(roomy)) / digitsHeight(standard.lastSeenClusterImage(roomy))
        assertTrue("$seen", seen > 1.4 && seen < 2.05)
        // A long number already fills a small disc: it is as large as before, and no smaller.
        val full = ScooterMarkerArt.ClusterKey(ScooterProvider.Bolt, diameter = 30.0, isDark = false, count = "1,024")
        assertEquals(digitsHeight(standard.clusterImage(full)), digitsHeight(larger.clusterImage(full)), 1.0)
    }

    @Test
    fun theNamesOnTheMapGrowWithVeryLargeTextAndKeepTheirSizeOtherwise() {
        val dock = ScreenRect(10.0, 600.0, 370.0, 244.0)
        for ((scale, height) in listOf(1.0 to 26.0, 2.0 to 52.0)) {
            val map = FlatMarkerMap()
            val scene = ScooterMarkerScene(ScooterMarkerArt(3f, fonts, textScale = scale), animates = { false })
            scene.parent = MarkerParent(origin = map.at(195.0, 422.0), bottomChromeFrames = listOf(dock))
            scene.updateClusteringMode(zoomLevel = 17.0, map = map)
            scene.reconcile(listOf(scooter("near", "voi", at = map.at(195.0, 380.0))), revision = 1)
            scene.updateLook(map)

            val names = scene.shownPillFrames(map).map { it.second }
            assertEquals("$scale", listOf(height), names.map { it.height })
            // Clear of what floats over the map.
            for (name in names) assertFalse("$scale: the name $name under $dock", name.intersects(dock))
        }
    }

    @Test
    fun aLargerNameShowsWholeOrNotAtAll() {
        // A dot in a band of the map 50 high between what floats over it: the standard name fits, a larger one
        // would lose 1 point at its top and at its foot, wherever it went, and is left out; in a band 60 high it fits.
        assertEquals(listOf(26.0), bandedNames(scale = 1.0, band = 50.0).map { it.height })
        assertEquals(emptyList<ScreenRect>(), bandedNames(scale = 2.0, band = 50.0))
        assertEquals(listOf(52.0), bandedNames(scale = 2.0, band = 60.0).map { it.height })
    }

    /**
     * The selected scooter's name shows whole or not at all at every size: at 360 dp Near me covered about a quarter
     * of the selected "Hopp", which the third any other name may lose let through (ctl-0130-sra). In a band 24 high
     * the standard name loses 1 point at its top and at its foot, wherever it goes: shown for any other scooter, left
     * out for the selected one; in a band 28 high it shows whole.
     */
    @Test
    fun theSelectedScootersNameShowsWholeOrNotAtAllAtEverySize() {
        assertEquals(listOf(26.0), bandedNames(scale = 1.0, band = 24.0).map { it.height })
        assertEquals(emptyList<ScreenRect>(), bandedNames(scale = 1.0, band = 24.0, selected = true))
        assertEquals(listOf(26.0), bandedNames(scale = 1.0, band = 28.0, selected = true).map { it.height })
    }

    /** The names shown for a dot in a band of the map [band] high between what floats over it. */
    private fun bandedNames(scale: Double, band: Double, selected: Boolean = false): List<ScreenRect> {
        val map = FlatMarkerMap()
        val above = ScreenRect(0.0, 200.0, 390.0, 200.0 - band / 2)
        val below = ScreenRect(0.0, 400.0 + band / 2, 390.0, 444.0 - band / 2)
        val scene = ScooterMarkerScene(ScooterMarkerArt(3f, fonts, textScale = scale), animates = { false })
        scene.parent = MarkerParent(origin = map.at(195.0, 400.0), bottomChromeFrames = listOf(above, below))
        scene.updateClusteringMode(zoomLevel = 17.0, map = map)
        scene.reconcile(listOf(scooter("banded", "voi", at = map.at(195.0, 400.0))), revision = 1)
        if (selected) scene.applySelection("voi:banded", map)
        scene.updateLook(map)
        return scene.shownPillFrames(map).map { it.second }
    }

    /** How tall the count's dark digits are in a light cluster's picture, in pixels. */
    private fun digitsHeight(picture: Bitmap): Double {
        fun dark(pixel: Int) = pixel ushr 24 > 250 && Color.red(pixel) < 90 && Color.green(pixel) < 90 && Color.blue(pixel) < 90
        val rows = (0 until picture.height).filter { y -> (0 until picture.width).any { x -> dark(picture.getPixel(x, y)) } }
        return (rows.last() - rows.first() + 1).toDouble()
    }
}
