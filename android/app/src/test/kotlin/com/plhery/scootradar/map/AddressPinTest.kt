package com.plhery.scootradar.map

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.MapDestination
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode

/**
 * The searched place's pin among the markers (MAP-124, MAP-125): MapKit's unselected marker view, which the
 * scooters' light-up leaves as it is.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class AddressPinTest {
    private val art = ScooterMarkerArt(3f, MarkerFonts.of(ApplicationProvider.getApplicationContext()))
    private val map = FlatMarkerMap()
    private val scene = ScooterMarkerScene(
        art,
        onSelectionChange = {},
        onParkingSelectionChange = {},
        now = { 100.0 },
        animates = { true },
    )

    @Test
    fun theSearchedPlacesPinStaysInTheMarkersAtItsWholeStrengthWhileTheScootersLightUp() {
        scene.parent = MarkerParent(origin = map.at(195.0, 422.0))
        val lit = scene.reconcile(listOf(scooter("near", "voi", at = map.at(195.0, 412.0))), revision = 1)
        scene.lightUp(lit, map)
        scene.applyDestination(MapDestination("Bahnhofplatz", "3011 Bern", map.at(195.0, 300.0), MapDestination.Kind.Address, isCovered = true))

        val features = MarkerFeatures.markers(scene, art)
        val pin = features.single { it.id.startsWith("a:") }
        // MKAnnotationViewZPriority.defaultUnselected, in the markers layer, with no fade of its own.
        assertEquals(500f, pin.sortKey)
        assertFalse(pin.isRaised)
        assertNull(pin.fade)
        assertEquals(1.0, pin.opacity, 0.0)

        // The light-up's bands take the scooter's dot and leave the pin where it is.
        val (banded, _) = MarkerBands(ScooterMarkerLayers.MARKERS, ScooterMarkerLayers.RAISED).assign(features, epoch = 100.0, time = 0.0)
        assertTrue(banded.keys.any { it.id.endsWith("voi:near") })
        assertFalse(pin in banded)
    }
}
