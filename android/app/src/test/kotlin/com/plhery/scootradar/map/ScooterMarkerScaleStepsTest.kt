package com.plhery.scootradar.map

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterLanguage
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import java.io.File
import java.security.MessageDigest
import java.util.Locale
import java.util.Random

/**
 * What a zoom writes, a scale step at a time (app-ax): the scooters' features, the names' and the movers', as the
 * layers are given them after every frame of a long zoom in and out, turning, past the close-up, into the clusters
 * and back, with a scooter selected and the rider moving on the way. The golden was written by the code before
 * app-ax made each step cheaper: the steps must write the same text, at the same versions.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScooterMarkerScaleStepsTest {
    private var time = 100.0
    private val art = ScooterMarkerArt(3f, MarkerFonts.of(ApplicationProvider.getApplicationContext()))
    private val scene = ScooterMarkerScene(art, now = { time }, animates = { true })
    private val centre = GeoPoint(47.3769, 8.5417)
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        Locale.setDefault(locale)
        ScooterLanguage.current = language
    }

    @Test
    fun aLongZoomWritesWhatItWroteBeforeApp_ax() {
        val lines = written()
        val golden = javaClass.getResource(GOLDEN)?.readText()?.lines()?.filter { it.isNotBlank() }
        if (golden == null) {
            // Written once, by the code before app-ax, then kept in the test's resources.
            File("build/$GOLDEN_NAME").writeText(lines.joinToString("\n", postfix = "\n"))
            error("No golden: written to build/$GOLDEN_NAME")
        }
        assertEquals(golden.size, lines.size)
        for ((index, line) in lines.withIndex()) assertEquals("frame $index", golden[index], line)
    }

    @Test
    fun theZoomGoesThroughWhatAStepCanChange() {
        val lines = written()
        val markers = lines.map { it.split(' ')[1] }.toSet()
        val movers = lines.map { it.split(' ')[3] }.toSet()
        // Many sizes, the spread with them, the clusters, the names and the dots easing are all written.
        assertTrue("${markers.size}", markers.size > 60)
        assertTrue("${movers.size}", movers.size > 5)
        assertTrue(seen.any { it.startsWith("cluster/") })
        assertTrue(seen.any { it.startsWith("pill/") })
        assertTrue(seen.any { it.startsWith("dot/") && it.contains("/Selected/") })
        assertTrue(seen.any { it.startsWith("dot/") && it.split('/')[4] == "1" })
        assertTrue(spread)
    }

    private val seen = HashSet<String>()
    private var spread = false

    /** Each frame's features as the layers are given them, as digests, with the versions that say what is written. */
    private fun written(): List<String> {
        val scooters = scooters()
        scene.parent = MarkerParent(origin = GeoPoint(centre.latitude + 0.0004, centre.longitude - 0.0003))
        scene.reconcile(scooters, revision = 1)
        val lines = ArrayList<String>()
        var zoom = 15.0
        var heading = 0.0
        fun frame() {
            time += 0.016
            val map = FlatMarkerMap(centre = centre, mapLibreZoom = zoom, heading = heading)
            // MapLibre's zoom is a step under the iPhone's.
            val level = zoom + 1
            scene.updateClusteringMode(level, map)
            scene.updateClusters(level)
            scene.updateLook(map)
            scene.movePills(map)
            val markers = MarkerFeatures.markers(scene, art)
            val pills = MarkerFeatures.pills(scene, art, at = time)
            val movers = MarkerFeatures.movers(scene, art, at = time)
            for (feature in markers + pills + movers) seen += feature.image
            if (markers.any { it.offset.x != 0.0 }) spread = true
            lines += listOf(
                lines.size,
                digest(MarkerFeatures.json(markers)),
                digest(MarkerFeatures.json(pills)),
                digest(MarkerFeatures.json(movers)),
                scene.markersVersion,
                scene.pillsVersion,
            ).joinToString(" ")
        }
        // In, past the close-up, a little faster than a step at a time.
        while (zoom < 19.2) {
            zoom += 0.031
            frame()
        }
        // Out into the clusters, turning.
        while (zoom > 13.0) {
            zoom -= 0.047
            heading += 0.7
            frame()
        }
        // In again, a scooter selected, the rider walking, the map turning back.
        scene.applySelection(scooters[17].id, FlatMarkerMap(centre = centre, mapLibreZoom = zoom, heading = heading))
        while (zoom < 17.5) {
            zoom += 0.023
            heading -= 0.4
            if (lines.size % 40 == 0) {
                val origin = scene.parent.origin ?: centre
                scene.parent = scene.parent.copy(origin = GeoPoint(origin.latitude - 0.0002, origin.longitude + 0.0001))
            }
            frame()
        }
        // At rest for a while: the eases end.
        repeat(30) { frame() }
        return lines
    }

    /** Scooters of six providers in and around the middle of Zürich, some alone, some several on a spot. */
    private fun scooters(): List<com.plhery.scootradar.core.model.Scooter> {
        val random = Random(7)
        val providers = listOf("voi", "lime", "bird", "bolt", "dott", "tier")
        val scooters = ArrayList<com.plhery.scootradar.core.model.Scooter>()
        repeat(70) { spot ->
            val latitude = centre.latitude + (random.nextDouble() - 0.5) * 0.012
            val longitude = centre.longitude + (random.nextDouble() - 0.5) * 0.016
            val count = if (random.nextInt(3) == 0) 2 + random.nextInt(9) else 1
            repeat(count) { index ->
                scooters += scooter(
                    id = "s$spot-$index",
                    provider = providers[random.nextInt(providers.size)],
                    latitude = latitude + random.nextDouble() * 0.000004,
                    longitude = longitude + random.nextDouble() * 0.000004,
                )
            }
        }
        return scooters
    }

    private fun digest(text: String): String =
        MessageDigest.getInstance("SHA-256").digest(text.toByteArray()).joinToString("") { "%02x".format(it) }.take(16)

    private companion object {
        const val GOLDEN_NAME = "scale-steps-golden.txt"
        const val GOLDEN = "/com/plhery/scootradar/map/$GOLDEN_NAME"
    }
}
