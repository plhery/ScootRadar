package com.plhery.scootradar.map

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScreenPoint
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

    /**
     * A tap on the pin selects it, as MapKit selects it, and its callout shows the place's title over the pin's top
     * (MAP-270); a tap elsewhere, on a scooter or on the map, or a new destination closes it.
     */
    @Test
    fun aTapOnThePinShowsItsCalloutAndATapElsewhereOrANewPlaceClosesIt() {
        val bahnhofplatz = MapDestination("Bahnhofplatz", "3011 Bern", map.at(195.0, 300.0), MapDestination.Kind.Address, isCovered = true)
        scene.parent = MarkerParent(origin = map.at(195.0, 422.0))
        scene.reconcile(listOf(scooter("near", "voi", at = map.at(300.0, 300.0))), revision = 1)
        scene.updateLook(map)
        scene.applyDestination(bahnhofplatz)
        assertNull(scene.callout(map))

        // On the balloon, over its foot.
        scene.tap(ScreenPoint(195.0, 280.0), map)
        assertTrue(scene.showsCallout)
        assertEquals(PinCalloutPlace("Bahnhofplatz", ScreenPoint(195.0, 256.0)), scene.callout(map))
        // A tap on it again keeps it, and the same place given again leaves it.
        scene.tap(ScreenPoint(190.0, 260.0), map)
        scene.applyDestination(bahnhofplatz)
        assertTrue(scene.showsCallout)

        // On the map beside it.
        scene.tap(ScreenPoint(60.0, 600.0), map)
        assertNull(scene.callout(map))

        // On a scooter: it is selected, and the callout closes.
        scene.tap(ScreenPoint(195.0, 280.0), map)
        scene.tap(ScreenPoint(300.0, 300.0), map)
        assertFalse(scene.showsCallout)
        assertEquals("voi:near", scene.appliedSelectionID)

        // Another place: a new pin, not selected.
        scene.tap(ScreenPoint(195.0, 280.0), map)
        assertTrue(scene.showsCallout)
        scene.applyDestination(bahnhofplatz.copy(title = "Bärenplatz", point = map.at(100.0, 300.0)))
        assertFalse(scene.showsCallout)

        // TalkBack's double tap selects it too.
        scene.selectPin(map)
        assertEquals("Bärenplatz", scene.callout(map)?.title)
    }

    /**
     * MapKit selects one marker at a time: a scooter or a bay chosen elsewhere, in the dock or by TalkBack, closes the
     * callout, and none chosen leaves it; the pin chosen by TalkBack closes the scooter's or bay's card, unless a walk
     * is under way.
     */
    @Test
    fun anotherMarkerChosenClosesTheCalloutAndThePinChosenClosesTheCard() {
        scene.parent = MarkerParent(origin = map.at(195.0, 422.0))
        scene.reconcile(listOf(scooter("near", "voi", at = map.at(300.0, 300.0))), revision = 1)
        val bay = map.at(100.0, 500.0)
        scene.reconcileParking(listOf(ScooterParking("dott:bay", "dott", "Rue Faidherbe", bay.latitude, bay.longitude, mandatory = false)))
        scene.updateLook(map)
        scene.applyDestination(MapDestination("Bahnhofplatz", "3011 Bern", map.at(195.0, 300.0), MapDestination.Kind.Address, isCovered = true))
        val near = scene.mark("voi:near")!!

        // The dock's nearest scooter.
        scene.tap(ScreenPoint(195.0, 280.0), map)
        scene.applySelection("voi:near", map)
        assertFalse(scene.showsCallout)
        // The pin again, which closes the card; the card's closing leaves the callout.
        scene.tap(ScreenPoint(195.0, 280.0), map)
        assertNull(scene.appliedSelectionID)
        scene.applySelection(null, map)
        assertTrue(scene.showsCallout)
        // A bay chosen in the dock.
        scene.applyParkingSelection("dott:bay")
        assertFalse(scene.showsCallout)

        // TalkBack: the pin closes the bay's card, then a scooter closes the callout.
        scene.selectPin(map)
        assertTrue(scene.showsCallout)
        assertNull(scene.appliedParkingID)
        scene.select(near, map)
        assertFalse(scene.showsCallout)
        // The pin closes the scooter's card.
        scene.selectPin(map)
        assertTrue(scene.showsCallout)
        assertNull(scene.appliedSelectionID)

        // During a walk the card stays.
        scene.parent = MarkerParent(origin = map.at(195.0, 422.0), isWalking = true)
        scene.select(near, map)
        scene.selectPin(map)
        assertTrue(scene.showsCallout)
        assertEquals("voi:near", scene.appliedSelectionID)
    }
}
