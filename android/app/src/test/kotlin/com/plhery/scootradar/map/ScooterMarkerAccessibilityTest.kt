package com.plhery.scootradar.map

import android.graphics.Rect
import android.view.View
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.customview.widget.ExploreByTouchHelper
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterMapProjection
import com.plhery.scootradar.core.model.ScooterParking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import java.util.Locale
import kotlin.math.roundToInt

/** TalkBack's virtual views of the markers: which there are, in what order, what they read and what they do. */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScooterMarkerAccessibilityTest {
    private val density = 3f
    private val art = ScooterMarkerArt(density, MarkerFonts.of(ApplicationProvider.getApplicationContext()))
    private val host = View(ApplicationProvider.getApplicationContext())
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current

    private val selections = mutableListOf<String?>()
    private val parkingSelections = mutableListOf<String?>()
    private val events = mutableListOf<String>()
    private val moves = mutableListOf<CameraMove>()
    private var changes = 0
    private val scene = ScooterMarkerScene(
        art,
        onSelectionChange = { selections += it },
        onParkingSelectionChange = { parkingSelections += it },
        track = { name, _ -> events += name },
        move = { moves += it },
        now = { 100.0 },
        animates = { true },
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

    /** A map whose camera a test moves. */
    private class CameraMap(var shown: FlatMarkerMap) : MarkerMap {
        override val projection: ScooterMapProjection get() = shown
        override val heading: Double get() = shown.heading
        override val isShown: Boolean get() = shown.isShown
        override val safeTop: Double get() = shown.safeTop
    }

    private fun helper(map: MarkerMap) = ScooterMarkerAccessibility(host, scene, map, density) { changes += 1 }

    private fun ScooterMarkerAccessibility.node(id: Int): AccessibilityNodeInfoCompat =
        getAccessibilityNodeProvider(host)!!.createAccessibilityNodeInfo(id)!!

    private fun ScooterMarkerAccessibility.click(id: Int): Boolean =
        getAccessibilityNodeProvider(host)!!.performAction(id, AccessibilityNodeInfoCompat.ACTION_CLICK, null)

    private fun AccessibilityNodeInfoCompat.clickLabel(): CharSequence? =
        actionList.single { it.id == AccessibilityNodeInfoCompat.ACTION_CLICK }.label

    @Suppress("DEPRECATION")
    private fun AccessibilityNodeInfoCompat.bounds(): Rect = Rect().also { getBoundsInParent(it) }

    @Test
    fun everyMarkerOnTheMapIsAButtonReadTopToBottomThenLeftToRight() {
        val map = FlatMarkerMap()
        val bay = map.at(200.0, 450.0).let { ScooterParking("dott:bay", "dott", "Rue Faidherbe", it.latitude, it.longitude, mandatory = false) }
        scene.reconcileParking(listOf(bay))
        scene.reconcile(
            listOf(
                scooter("low", "lime", at = map.at(100.0, 600.0)),
                scooter("right", "voi", at = map.at(300.0, 199.8)),
                scooter("left", "bolt", at = map.at(50.0, 200.2)),
                // Its view reaches onto the map.
                scooter("edge", "voi", at = map.at(195.0, -15.0)),
                scooter("gone", "lime", at = map.at(195.0, -100.0)),
            ),
            revision = 1,
        )
        scene.reconcileLastSeen(listOf(scooter("seen", "lime", at = map.at(300.0, 300.0))), emptyList(), revision = 1)
        scene.updateLook(map)

        // Two dots a fraction of a point apart are on one line, read from the left.
        val elements = MarkerElements.of(scene, map)
        assertEquals(listOf("v:voi:edge", "v:bolt:left", "v:voi:right", "p:dott:bay", "v:lime:low"), elements.map { it.key })

        val accessibility = helper(map)
        val ids = accessibility.virtualViews()
        assertEquals(5, ids.toSet().size)
        val low = accessibility.node(ids[4])
        val description = MarkerDescriptions.of(scene.mark("lime:low")!!)
        assertEquals(listOfNotNull(description.label, description.value).joinToString(", "), low.contentDescription)
        assertEquals("android.widget.Button", low.className)
        assertTrue(low.isClickable)
        assertFalse(low.isSelected)
        assertEquals("show scooter details", low.clickLabel())
        // Its 44 pt square, in pixels.
        val centre = scene.dotCentre(scene.mark("lime:low")!!, map)
        val expected = Rect(((centre.x - 22) * 3).roundToInt(), ((centre.y - 22) * 3).roundToInt(), ((centre.x + 22) * 3).roundToInt(), ((centre.y + 22) * 3).roundToInt())
        assertEquals(expected, low.bounds())

        // The bay reads what it is, its rule and its hint, in its balloon.
        val balloon = accessibility.node(ids[3])
        assertEquals("${MarkerDescriptions.of(bay).label}, ${bay.notice}", balloon.contentDescription)
        assertEquals("show parking details", balloon.clickLabel())
        assertEquals(((450 - 36.3) * 3).roundToInt(), balloon.bounds().top)

        // A double tap selects, as a tap does.
        assertTrue(accessibility.click(ids[4]))
        assertEquals(listOf<String?>("lime:low"), selections)
        assertEquals(1, changes)
        assertTrue(accessibility.node(ids[4]).isSelected)
        assertTrue(accessibility.click(ids[3]))
        assertEquals(listOf<String?>("dott:bay"), parkingSelections)
    }

    @Test
    fun theViewsFollowTheCameraAndTheSelectionAndKeepTheirNumbers() {
        val start = FlatMarkerMap()
        val map = CameraMap(start)
        scene.reconcile(
            listOf(
                scooter("a", "lime", at = start.at(195.0, 300.0)),
                scooter("b", "lime", at = start.at(195.0, 800.0)),
                scooter("c", "voi", at = start.at(195.0, 1_200.0)),
            ),
            revision = 1,
        )
        val accessibility = helper(map)
        val (a, b) = accessibility.virtualViews()
        val before = accessibility.node(b).bounds()

        // The map moves 400 pt up: one scooter leaves it, one comes, and the one that stays keeps its view.
        map.shown = FlatMarkerMap(centre = start.at(195.0, 822.0))
        accessibility.refresh()
        val (stayed, came) = accessibility.virtualViews()
        assertEquals(b, stayed)
        assertNotEquals(a, came)
        assertEquals(before.top - 1_200, accessibility.node(b).bounds().top)

        // The selection is read as it is, without listing the views again.
        assertFalse(accessibility.node(b).isSelected)
        scene.applySelection("lime:b", map)
        assertTrue(accessibility.node(b).isSelected)
        scene.applySelection(null, map)
        assertFalse(accessibility.node(b).isSelected)
    }

    @Test
    fun aFingerExploringTheMapFindsWhatATapThereTakes() {
        val map = FlatMarkerMap()
        val bayPlace = map.at(300.0, 600.0)
        scene.reconcileParking(listOf(ScooterParking("dott:bay", "dott", "Rue Faidherbe", bayPlace.latitude, bayPlace.longitude, mandatory = false)))
        scene.reconcile(listOf(scooter("a", "lime", at = map.at(195.0, 400.0)), scooter("b", "voi", at = map.at(205.0, 400.0))), revision = 1)
        val accessibility = helper(map)
        val ids = MarkerElements.of(scene, map).map { it.key }.zip(accessibility.virtualViews()).toMap()

        // The nearest centre, not the dot drawn on top.
        assertEquals(ids["v:voi:b"], accessibility.virtualViewAt(202f * 3, 400f * 3))
        assertEquals(ids["v:lime:a"], accessibility.virtualViewAt(198f * 3, 400f * 3))
        assertEquals(ids["p:dott:bay"], accessibility.virtualViewAt(300f * 3, 585f * 3))
        assertEquals(ExploreByTouchHelper.INVALID_ID, accessibility.virtualViewAt(195f * 3, 700f * 3))
    }

    @Test
    fun citiesAndClustersReadTheirNumbersAndZoomInOnADoubleTap() {
        val map = FlatMarkerMap(mapLibreZoom = 10.0)
        val zurich = map.at(195.0, 300.0)
        val cell = map.at(100.0, 500.0)
        scene.reconcileClusters(
            listOf(
                ScooterCluster("city:ch:Zürich", zurich.latitude, zurich.longitude, count = 1_288, providers = mapOf("lime" to 1_288), city = "Zürich"),
                ScooterCluster("10:536:358", cell.latitude, cell.longitude, count = 12, providers = mapOf("voi" to 12)),
            ),
            revision = 1,
        )
        val accessibility = helper(map)
        val (total, group) = accessibility.virtualViews()

        val city = accessibility.node(total)
        assertEquals("Zürich, 1,288 scooters", city.contentDescription)
        assertEquals("zoom in to show individual scooters", city.clickLabel())
        assertEquals("android.widget.Button", city.className)
        assertEquals("12 scooters", accessibility.node(group).contentDescription)
        // Its 48 pt view.
        assertEquals(48 * 3, accessibility.node(total).bounds().width())
        assertEquals(total, accessibility.virtualViewAt(195f * 3 + 60, 300f * 3 + 60))

        // A double tap opens the city, and leaves the card as it is.
        assertTrue(accessibility.click(total))
        assertEquals(listOf("cluster_select"), events)
        assertTrue(moves.single() is CameraMove.Region)
        assertTrue(selections.isEmpty())
    }

    @Test
    fun theViewsAreReadInTheAppsLanguage() {
        val map = FlatMarkerMap()
        scene.reconcile(listOf(scooter("a", "lime", battery = 82, latitude = map.centre.latitude, longitude = map.centre.longitude)), revision = 1)
        val accessibility = helper(map)
        val id = accessibility.virtualViews().single()
        assertEquals("Lime scooter, Battery: 82 percent", accessibility.node(id).contentDescription)

        ScooterLanguage.current = ScooterLanguage.De
        accessibility.refresh()
        val node = accessibility.node(id)
        assertEquals("Lime-Scooter, Akku: 82 Prozent", node.contentDescription)
        // TalkBack says it as "Zum Anzeigen der Scooter-Details doppeltippen" (UI-327).
        assertEquals("Anzeigen der Scooter-Details", node.clickLabel())
    }

    /**
     * The rider is read as "Your location" where MapKit gives VoiceOver its element for the user's location
     * (MAP-224), in the app's language, with its label only; the pin is read by its title, and a double tap selects
     * it, as VoiceOver's does, showing its callout (MAP-270).
     */
    @Test
    fun theRiderIsReadAsYourLocationAndThePinByItsTitle() {
        val map = FlatMarkerMap()
        scene.parent = MarkerParent(userLocation = map.at(195.0, 500.0))
        scene.applyDestination(MapDestination("Bahnhofplatz", "3011 Bern", map.at(195.0, 300.0), MapDestination.Kind.Address, isCovered = true))
        val elements = MarkerElements.of(scene, map)
        assertEquals(listOf("a:search", "u:rider"), elements.map { it.key })

        val accessibility = helper(map)
        val (pin, rider) = accessibility.virtualViews()
        val you = accessibility.node(rider)
        assertEquals("Your location", you.contentDescription)
        assertFalse(you.isClickable)
        assertTrue(you.actionList.none { it.id == AccessibilityNodeInfoCompat.ACTION_CLICK })
        // A square of 44 pt around the dot, as a scooter's.
        assertEquals(Rect((173 * 3), (478 * 3), (217 * 3), (522 * 3)), you.bounds())
        assertEquals(rider, accessibility.virtualViewAt(195f * 3, 500f * 3))

        assertEquals("Bahnhofplatz", accessibility.node(pin).contentDescription)
        assertTrue(accessibility.click(pin))
        assertTrue(scene.showsCallout)
        assertEquals(1, changes)

        ScooterLanguage.current = ScooterLanguage.De
        accessibility.refresh()
        assertEquals("Dein Standort", accessibility.node(rider).contentDescription)

        // No rider shown, no element.
        scene.parent = MarkerParent()
        assertEquals(listOf("a:search"), MarkerElements.of(scene, map).map { it.key })
    }
}
