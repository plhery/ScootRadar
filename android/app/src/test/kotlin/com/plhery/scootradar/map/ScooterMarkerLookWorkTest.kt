package com.plhery.scootradar.map

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterLanguage
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import java.util.Locale

/**
 * When the markers' look is worked out again: not for a pan (MAP-237), and for a switch to dark and back, which
 * draws every kind of marker in its dark pictures (MAP-025, MAP-133). The layers write a source again only when
 * its version moves, so the versions are what a switch must move.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScooterMarkerLookWorkTest {
    private val art = ScooterMarkerArt(3f, MarkerFonts.of(ApplicationProvider.getApplicationContext()))
    private val map = FlatMarkerMap()
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current
    private val scene = ScooterMarkerScene(
        art,
        onSelectionChange = {},
        onParkingSelectionChange = {},
        now = { 100.0 },
        animates = { false },
    )

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

    private fun showScooters() {
        scene.parent = MarkerParent(origin = map.at(195.0, 422.0))
        scene.reconcile(
            listOf(
                scooter("near", "voi", at = map.at(180.0, 400.0)),
                scooter("far", "voi", at = map.at(260.0, 560.0)),
                scooter("other", "lime", at = map.at(120.0, 300.0)),
            ),
            revision = 1,
        )
        scene.updateClusteringMode(zoomLevel = 17.0, map = map)
        scene.updateLook(map)
    }

    @Test
    fun aPanAtOneZoomAndBearingDoesNoLookWork() {
        showScooters()
        val passes = scene.lookPasses
        val versions = listOf(scene.markersVersion, scene.pillsVersion)
        assertEquals(1, passes)

        // The map moved east and west by a few hundred points, and a little north, at the same zoom: the dots keep
        // their sizes, their names and their spread, so nothing is worked out again.
        for (east in listOf(0.001, 0.003, -0.002, 0.0005)) {
            for (north in listOf(0.0, 0.0002)) {
                val panned = FlatMarkerMap(centre = GeoPoint(map.centre.latitude + north, map.centre.longitude + east))
                scene.updateLook(panned)
            }
        }
        assertEquals(passes, scene.lookPasses)
        assertEquals(versions, listOf(scene.markersVersion, scene.pillsVersion))

        // A zoom does work it out again: the counter counts.
        scene.updateLook(FlatMarkerMap(mapLibreZoom = 17.0))
        assertEquals(passes + 1, scene.lookPasses)
    }

    @Test
    fun aDarkSwitchDrawsTheDotsNamesClustersAndFadedMarkersDarkAndBack() {
        showScooters()
        scene.reconcileClusters(
            listOf(ScooterCluster("10:536:358", 47.3790, 8.5450, count = 12, providers = mapOf("voi" to 12))),
            revision = 1,
        )
        val seen = map.at(300.0, 300.0)
        scene.reconcileLastSeen(
            listOf(scooter("seen", "lime", at = seen)),
            listOf(ScooterCluster("10:536:359", 47.3750, 8.5390, count = 7, providers = mapOf("bolt" to 7))),
            revision = 1,
        )
        assertEquals(setOf("dot", "cluster", "pill", "seen", "seen-group"), images().map { it.substringBefore('/') }.toSet())
        assertEquals(setOf(false), images().map(::isDark).toSet())

        for (dark in listOf(true, false)) {
            val markers = scene.markersVersion
            val pills = scene.pillsVersion
            val lastSeen = scene.lastSeenVersion
            scene.isDark = dark
            scene.updateLook(map)
            assertEquals(images().joinToString(), setOf(dark), images().map(::isDark).toSet())
            assertTrue(scene.markersVersion > markers)
            assertTrue(scene.pillsVersion > pills)
            assertTrue(scene.lastSeenVersion > lastSeen)
        }
    }

    @Test
    fun aDarkSwitchWritesTheClustersAndFadedMarkersAgainWithoutAnyDot() {
        // The dots changing would write the markers' source anyway; the clusters alone must too.
        scene.updateClusteringMode(zoomLevel = 17.0, map = map)
        scene.reconcileClusters(
            listOf(ScooterCluster("city:ch:Zürich", 47.3769, 8.5417, count = 1_288, providers = mapOf("lime" to 1_288), city = "Zürich")),
            revision = 1,
        )
        scene.reconcileLastSeen(emptyList(), listOf(ScooterCluster("10:536:359", 47.3750, 8.5390, count = 7, providers = mapOf("bolt" to 7))), revision = 1)
        scene.updateLook(map)
        for (dark in listOf(true, false)) {
            val markers = scene.markersVersion
            val lastSeen = scene.lastSeenVersion
            scene.isDark = dark
            scene.updateLook(map)
            assertEquals(setOf(dark), images().map(::isDark).toSet())
            assertEquals(markers + 1, scene.markersVersion)
            assertEquals(lastSeen + 1, scene.lastSeenVersion)
        }
    }

    /** The names of the pictures every layer draws now. */
    private fun images(): List<String> =
        (MarkerFeatures.markers(scene, art) + MarkerFeatures.pills(scene, art, at = 100.0) + MarkerFeatures.lastSeen(scene, art)).map { it.image }

    /** Whether a picture's name is of its dark version: the part of the name each kind keeps for it. */
    private fun isDark(image: String): Boolean {
        val parts = image.split('/')
        val part = when (parts[0]) {
            "dot" -> parts[5]
            "cluster", "seen-group", "pill" -> parts[3]
            "seen" -> parts[2]
            else -> error(image)
        }
        return part == "1"
    }
}
