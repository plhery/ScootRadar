package com.plhery.scootradar.map

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterDotState
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterMapLook
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterPillSide
import com.plhery.scootradar.core.model.localized
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import java.util.Locale

// The markers' tests of ios/ScootRadarTests/ScooterFilteringTests.swift, on the scene and the layers that take
// the place of MapKit's annotations and their views. The map's camera tests are instrumented, in androidTest.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScooterFilteringTest {
    private val density = 3f
    private val art = ScooterMarkerArt(density, MarkerFonts.of(ApplicationProvider.getApplicationContext()))
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

    private fun scene(
        selections: MutableList<String?> = mutableListOf(),
        parkingSelections: MutableList<String?> = mutableListOf(),
        events: MutableList<Pair<String, String?>> = mutableListOf(),
    ) = ScooterMarkerScene(
        art,
        onSelectionChange = { selections += it },
        onParkingSelectionChange = { parkingSelections += it },
        track = { name, provider -> events += name to provider },
        now = { 100.0 },
        animates = { true },
    )

    @Test
    fun annotationPinsCannotBeHiddenByCollisions() {
        // The marker is far larger than its dot, and no larger than a target needs.
        assertEquals(44.0, ScooterMarkerScene.MARKER_SIZE, 0.0)
        assertTrue(ScooterMarkerScene.MARKER_SIZE < 46)
        for (spec in ScooterMarkerLayers.specs) {
            // Every marker is drawn, whatever it overlaps: MapKit's required display priority, without collisions.
            assertEquals(spec.id, true, spec.layout["icon-allow-overlap"])
            assertEquals(spec.id, true, spec.layout["icon-ignore-placement"])
            assertEquals(spec.id, "viewport", spec.layout["icon-rotation-alignment"])
            assertEquals(spec.id, "viewport", spec.layout["icon-pitch-alignment"])
        }
        val markers = ScooterMarkerLayers.specs.first { it.id == ScooterMarkerLayers.MARKERS }
        assertEquals("center", markers.layout["icon-anchor"])
        assertEquals(SymbolLayerSpec.Json("[\"get\",\"sort\"]"), markers.layout["symbol-sort-key"])

        // A dot stands on its scooter, at MapKit's default unselected priority, and selected at 900.
        val dot = MarkerFeatures.dot(ScooterMark(scooter("plain", "voi")), art)
        assertEquals(0.0, dot.offset.x, 0.0)
        assertEquals(0.0, dot.offset.y, 0.0)
        assertEquals(500f, dot.sortKey)
        assertFalse(dot.isRaised)

        // Clustering goes with the zoom: up to the iPhone's 15, where MapKit's clustering identifier is set.
        val map = FlatMarkerMap()
        val scene = scene()
        scene.updateClusteringMode(zoomLevel = 15.0, map = map)
        assertEquals(true, scene.clusteringEnabled)
        scene.updateClusteringMode(zoomLevel = 15.01, map = map)
        assertEquals(false, scene.clusteringEnabled)
        // The server's groups take its place.
        scene.parent = MarkerParent(usesServerClusters = true)
        scene.updateClusteringMode(zoomLevel = 12.0, map = map)
        assertEquals(false, scene.clusteringEnabled)
    }

    @Test
    fun scootersLastSeenLieFadedUnderTheOthersAndAreNeitherTappedNorRead() {
        val order = ScooterMarkerLayers.order
        assertEquals(ScooterMarkerLayers.LAST_SEEN, order.first())
        assertTrue(order.indexOf(ScooterMarkerLayers.LAST_SEEN) < order.indexOf(ScooterMarkerLayers.MARKERS))
        val layer = ScooterMarkerLayers.specs.first { it.id == ScooterMarkerLayers.LAST_SEEN }
        assertEquals(true, layer.layout["icon-allow-overlap"])
        assertEquals(LastSeenBreath.STILL, layer.paint["icon-opacity"])

        // A 10 pt dot inside a ring of 1.5 pt.
        val single = art.lastSeenImage(ScooterMarkerArt.LastSeenKey(ScooterProvider.Lime, isDark = false))
        assertEquals(13f, single.width / density)
        assertEquals(13f, single.height / density)
        val group = art.lastSeenClusterImage(ScooterMarkerArt.ClusterKey(ScooterProvider.Lime, 40.0, isDark = true, count = "12"))
        assertEquals(40f, group.width / density)
        assertEquals(40f, group.height / density)

        // A tap on it goes through to the map, which closes the card.
        val map = FlatMarkerMap()
        val selections = mutableListOf<String?>()
        val scene = scene(selections)
        val seen = map.at(195.0, 400.0)
        scene.reconcileLastSeen(listOf(scooter("seen", "lime", at = seen)), emptyList(), revision = 1)
        scene.reconcile(listOf(scooter("far", "voi", at = map.at(60.0, 700.0))), revision = 1)
        scene.applySelection("voi:far", map)
        scene.tap(map.point(seen), map)
        assertEquals(listOf<String?>(null), selections)

        // It breathes, one way in 1.6 s and back, in step with every other, and stands still with Remove animations.
        assertEquals(0.35f, LastSeenBreath.FAINTEST)
        assertEquals(0.65f, LastSeenBreath.STRONGEST)
        assertEquals(1.6, LastSeenBreath.BREATH, 0.0)
        assertEquals(LastSeenBreath.FAINTEST, LastSeenBreath.strength(at = 3200.0, animates = true), 1e-4f)
        assertEquals(LastSeenBreath.STRONGEST, LastSeenBreath.strength(at = 3201.6, animates = true), 1e-4f)
        assertEquals(0.5f, LastSeenBreath.strength(at = 3200.8, animates = true), 1e-3f)
        assertEquals(LastSeenBreath.FAINTEST, LastSeenBreath.strength(at = 3203.2, animates = true), 1e-4f)
        assertEquals(LastSeenBreath.STILL, LastSeenBreath.strength(at = 3201.6, animates = false))
    }

    @Test
    fun fadedMarkersAreKeptAndMovedWhileTheirScootersStay() {
        val scene = scene()
        val seen = scooter("seen", "lime", battery = 80)
        val group = ScooterCluster(
            id = "seen:13:4290:2868", latitude = 47.38, longitude = 8.54,
            count = 12, providers = mapOf("lime" to 5, "bird" to 7),
        )
        fun faded() = scene.lastSeen.sortedBy { it.id }

        scene.reconcileLastSeen(listOf(seen), listOf(group), revision = 1)
        val first = faded()
        assertEquals(listOf("c:seen:13:4290:2868", "v:lime:seen"), first.map { it.id })
        // The ring takes the colour of the provider with the most of them.
        assertEquals(LastSeenMark.Kind.Group(count = 12, provider = ScooterProvider.Bird), first[0].mark)
        assertEquals(LastSeenMark.Kind.Single(ScooterProvider.Lime), first[1].mark)

        // The same revision changes nothing.
        scene.reconcileLastSeen(emptyList(), emptyList(), revision = 1)
        assertEquals(2, faded().size)

        // A scooter that moved keeps its marker; a group that went takes its marker with it.
        val moved = scooter("seen", "lime", battery = 80, latitude = 47.3779)
        scene.reconcileLastSeen(listOf(moved), emptyList(), revision = 2)
        val second = faded()
        assertEquals(listOf("v:lime:seen"), second.map { it.id })
        assertSame(first[1], second[0])
        assertEquals(47.3779, second[0].coordinate.latitude, 0.0)

        scene.reconcileLastSeen(emptyList(), emptyList(), revision = 3)
        assertTrue(faded().isEmpty())
    }

    @Test
    fun selectedScooterTakesItsRingAndReturnsToItsDot() {
        val mark = ScooterMark(scooter("voi", "voi", battery = 82))
        assertEquals(ScooterDotState.Plain, mark.art.state)
        assertEquals(ScooterMapLook.plainDiameter, mark.art.diameter, 0.0)

        mark.look = ScooterMapLook.look(metres = 400.0, state = ScooterDotState.Selected, metresPerPoint = 1.07)
        val content = ScooterMarkerArt.PillContent(ScooterProvider.Voi, "Voi", "5 min", isFilled = true, isDark = false)
        mark.pill = content
        mark.pillOrigin = ScooterMapLook.pillOrigin(ScooterPillSide.Right, width = 80.0, reach = mark.look.footprint / 2)

        val dot = MarkerFeatures.dot(mark, art)
        assertEquals(ScooterDotState.Selected, mark.art.state)
        assertEquals(16.0, mark.art.diameter, 0.0)
        assertEquals(mark.art.id, dot.image)
        // MapKit's selected priority, in the layer no neighbour covers.
        assertEquals(900f, dot.sortKey)
        assertTrue(dot.isRaised)
        // The name stands beside the dot, clear of its ring.
        val name = MarkerFeatures.pill(mark, art)
        assertNotNull(name)
        val picture = name!!.picture()
        assertEquals(ScooterMapLook.pillHeight, picture.height / density - 2 * ScooterMarkerArt.PILL_MARGIN, 0.5)
        assertTrue(name.offset.x + ScooterMarkerArt.PILL_MARGIN >= mark.look.footprint / 2)

        mark.look = ScooterMapLook.look(metres = 400.0, state = ScooterDotState.Plain, metresPerPoint = 1.07)
        mark.pill = null

        assertEquals(ScooterDotState.Plain, mark.art.state)
        assertEquals(8.0, mark.art.diameter, 0.0)
        assertFalse(MarkerFeatures.dot(mark, art).isRaised)
        assertNull(MarkerFeatures.pill(mark, art))
    }

    @Test
    fun theDotTakesItsProviderWhenScooterAnnotationsAreReused() {
        assertEquals(ScooterProvider.Bolt, ScooterMark(scooter("bolt", "bolt", battery = 82)).art.provider)

        val images = mutableSetOf<String>()
        for ((provider, expected) in listOf("bird" to ScooterProvider.Bird, "publibike" to ScooterProvider.Publibike, "lime" to ScooterProvider.Lime, "unknown" to null)) {
            val mark = ScooterMark(scooter(provider, provider, battery = 82))
            // Close up, where each dot carries its provider's initials.
            mark.look = ScooterMapLook.look(metres = null, state = ScooterDotState.Plain, metresPerPoint = 0.4)

            assertEquals(provider, expected, mark.art.provider)
            assertEquals(provider, true, mark.art.showsInitials)
            assertEquals(provider, 20.0, mark.art.diameter, 0.0)
            // The letters are part of the picture: each provider has its own.
            images += MarkerFeatures.dot(mark, art).image
        }
        assertEquals(4, images.size)
    }

    @Test
    fun userLocationAlwaysRendersAboveScooterMarkers() {
        val order = ScooterMarkerLayers.order
        assertEquals(ScooterMarkerLayers.RIDER, order.last())
        for (layer in listOf(ScooterMarkerLayers.MARKERS, ScooterMarkerLayers.RAISED, ScooterMarkerLayers.PILLS)) {
            assertTrue(layer, order.indexOf(ScooterMarkerLayers.RIDER) > order.indexOf(layer))
        }
        assertEquals(order, ScooterMarkerLayers.specs.map { it.id })
        val rider = ScooterMarkerLayers.specs.last()
        assertEquals(true, rider.layout["icon-allow-overlap"])
        assertEquals(true, rider.layout["icon-ignore-placement"])
    }

    @Test
    fun mapBackgroundTapClearsSelectionSynchronously() {
        val selections = mutableListOf<String?>()
        val scene = scene(selections)
        val map = FlatMarkerMap()
        scene.applySelection("lime:tapped", map)

        scene.clearSelection(map)
        scene.clearSelection(map)

        assertEquals(listOf<String?>(null), selections)
    }

    @Test
    fun mapBackgroundTapClosesTheSelectedParkingBay() {
        val parkingChanges = mutableListOf<String?>()
        val bay = ScooterParking("dott:bay", "dott", "Rue Faidherbe", latitude = 50.63, longitude = 3.06, mandatory = true)
        val scene = scene(parkingSelections = parkingChanges)
        val map = FlatMarkerMap(centre = GeoPoint(50.63, 3.06))
        scene.reconcileParking(listOf(bay))

        // Selecting from the model is not reported back to it.
        scene.applyParkingSelection(bay.id)
        assertTrue(parkingChanges.isEmpty())
        assertTrue(MarkerFeatures.markers(scene, art).single().isRaised)

        scene.clearSelection(map)
        scene.clearSelection(map)

        assertEquals(listOf<String?>(null), parkingChanges)
        assertFalse(MarkerFeatures.markers(scene, art).single().isRaised)
    }

    @Test
    fun parkingBaysOpenInTheDockWithoutACallout() {
        val bay = ScooterParking("dott:bay", "dott", "Rue Faidherbe", latitude = 50.63, longitude = 3.06, mandatory = true)
        val description = MarkerDescriptions.of(bay)

        assertEquals("${bay.bayTitle}, Rue Faidherbe", description.label)
        // Without the callout, the marker itself says what it does and what the rule is.
        assertEquals(localized("Shows parking details"), description.hint)
        assertEquals(localized("You must park in a bay in this zone."), description.value)

        // A tap on the balloon opens the bay in the dock, as a scooter's card opens.
        val parkingChanges = mutableListOf<String?>()
        val events = mutableListOf<Pair<String, String?>>()
        val scene = scene(parkingSelections = parkingChanges, events = events)
        val map = FlatMarkerMap(centre = GeoPoint(50.63, 3.06))
        scene.reconcileParking(listOf(bay))
        val balloon = scene.bayFrame(bay, map)
        scene.tap(com.plhery.scootradar.core.model.ScreenPoint(balloon.midX, balloon.midY), map)
        assertEquals(listOf<String?>(bay.id), parkingChanges)
        assertEquals(listOf("parking_select" to "dott"), events)
    }
}
