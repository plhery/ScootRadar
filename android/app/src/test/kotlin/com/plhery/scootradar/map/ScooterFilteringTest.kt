package com.plhery.scootradar.map

import android.graphics.Bitmap
import android.graphics.Color
import android.view.View
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterDockStatus
import com.plhery.scootradar.core.model.ScooterDotState
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLastSeenStatus
import com.plhery.scootradar.core.model.ScooterMapLook
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterPillSide
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.core.model.formatted
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.ui.Announcement
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
import java.time.Instant
import java.util.Locale
import kotlin.math.abs

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
        for (spec in ScooterMarkerLayers.specs + ScooterMarkerLayers.cities) {
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
    fun scootersLastSeenLieFadedUnderTheOthersAndBreatheOnlyWhileTheyUpdate() {
        // The groups, then the scooters' dots, at rest and breathing, under every other marker.
        assertEquals(
            listOf(
                ScooterMarkerLayers.LAST_SEEN,
                ScooterMarkerLayers.LAST_SEEN_UPDATING,
                ScooterMarkerLayers.LAST_SEEN_DOTS,
                ScooterMarkerLayers.LAST_SEEN_DOTS_UPDATING,
                ScooterMarkerLayers.MARKERS,
            ),
            ScooterMarkerLayers.order.take(5),
        )
        val groups = ScooterMarkerLayers.specs.first { it.id == ScooterMarkerLayers.LAST_SEEN }
        assertEquals(true, groups.layout["icon-allow-overlap"])
        assertEquals(ScooterMarkerLayers.NOT_UPDATING, groups.filter)
        assertEquals(0.6f, groups.paint["icon-opacity"])
        assertEquals(ScooterMarkerLayers.UPDATING, ScooterMarkerLayers.specs.first { it.id == ScooterMarkerLayers.LAST_SEEN_UPDATING }.filter)
        val group = art.lastSeenClusterImage(ScooterMarkerArt.ClusterKey(ScooterProvider.Lime, 40.0, isDark = true, count = "12"))
        assertEquals(40f, group.width / density)
        assertEquals(40f, group.height / density)

        // A dot of 10 pt inside a ring of 1.5, never tilted, at 0.42 at rest.
        val dots = ScooterMarkerLayers.fadedDots.first { it.id == ScooterMarkerLayers.LAST_SEEN_DOTS }
        assertEquals(ScooterMarkerLayers.NOT_UPDATING, dots.filter)
        assertEquals(5f, dots.paint["circle-radius"])
        assertEquals(1.5f, dots.paint["circle-stroke-width"])
        assertEquals(0.42f, dots.paint["circle-opacity"])
        assertEquals(0.42f, dots.paint["circle-stroke-opacity"])
        assertEquals("viewport", dots.paint["circle-pitch-alignment"])
        assertEquals("viewport", dots.paint["circle-pitch-scale"])
        assertEquals(ScooterMarkerLayers.UPDATING, ScooterMarkerLayers.fadedDots.first { it.id == ScooterMarkerLayers.LAST_SEEN_DOTS_UPDATING }.filter)

        // Each in its provider's colour inside a ring of the ground's; those whose new positions are on their way,
        // and a group with one app on its way, written to breathe.
        val map = FlatMarkerMap()
        val scene = scene()
        val seenAt = Instant.now().minusSeconds(600)
        val scooters = listOf(scooter("a", "bird", at = map.at(100.0, 100.0)), scooter("b", "lime", at = map.at(200.0, 100.0)))
        val clusters = listOf(map.at(300.0, 300.0).let { ScooterCluster("g", it.latitude, it.longitude, count = 5, providers = mapOf("lime" to 3, "bird" to 2)) })
        val bird = ScooterLastSeenStatus(seenAt, updating = true)
        val lime = ScooterLastSeenStatus(seenAt, updating = false)
        scene.reconcileLastSeen(scooters, clusters, revision = 1, statuses = mapOf(ScooterProvider.Bird to bird, ScooterProvider.Lime to lime))
        val features = MarkerFeatures.fadedDots(scene).associateBy { it.id }
        assertEquals(setOf("v:bird:a", "v:lime:b"), features.keys)
        assertTrue(features.getValue("v:bird:a").isUpdating)
        assertFalse(features.getValue("v:lime:b").isUpdating)
        assertEquals(ScooterMapLook.dotColor(ScooterProvider.Lime, isDark = false), features.getValue("v:lime:b").color)
        assertEquals(ScooterMapLook.white, features.getValue("v:lime:b").ground)
        val json = MarkerFeatures.json(features.values.toList())
        assertEquals(1, Regex("\"updating\":true").findAll(json).count())
        assertTrue(json, json.contains("\"ground\":\"rgba(255,255,255,1)\""))
        assertEquals("rgba(11,14,20,1)", MarkerFeatures.css(ScooterMapLook.darkGround))
        assertEquals("rgba(0,0,0,0.502)", MarkerFeatures.css(0x80000000))
        val groupFeature = MarkerFeatures.lastSeen(scene, art).single()
        assertTrue(groupFeature.isUpdating)
        assertTrue(MarkerFeatures.json(listOf(groupFeature)).contains("\"updating\":true"))
        // In its breathing picture, which the markers draw again as it breathes.
        val groupKey = ScooterMarkerArt.ClusterKey(ScooterProvider.Lime, 36.0, isDark = false, count = "5")
        assertEquals(groupKey.lastSeenBreathID, groupFeature.image)
        assertEquals(mapOf(groupKey.lastSeenBreathID to groupKey), MarkerFeatures.breathingGroups(scene))

        // Nothing on its way for Bird any more: they stand still, drawn again though the scooters are the same.
        val version = scene.lastSeenVersion
        scene.reconcileLastSeen(scooters, clusters, revision = 1, statuses = mapOf(ScooterProvider.Bird to bird.copy(updating = false), ScooterProvider.Lime to lime))
        assertTrue(scene.lastSeenVersion > version)
        assertTrue(MarkerFeatures.fadedDots(scene).none { it.isUpdating })
        assertFalse(MarkerFeatures.lastSeen(scene, art).single().isUpdating)
        assertEquals(groupKey.lastSeenID, MarkerFeatures.lastSeen(scene, art).single().image)
        assertTrue(MarkerFeatures.breathingGroups(scene).isEmpty())

        // Those on their way breathe, one way in 1.4 s and back, all in step: a dot in strength from 0.25 to 0.75 and
        // in size from 8 to 12 pt, a group in strength from 0.45 to 0.85 and in size from 0.95 to 1.05 of its own. With
        // Remove animations they stand at 0.55, at their own size.
        assertEquals(1.4, LastSeenBreath.BREATH, 0.0)
        val start = LastSeenBreath.drawn(at = 2800.0, animates = true)
        assertEquals(0.25f, start.dotStrength, 1e-4f)
        assertEquals(0.8f, start.dotScale, 1e-4f)
        assertEquals(0.45f, start.groupStrength, 1e-4f)
        assertEquals(0.95, start.groupScale, 0.0)
        val strongest = LastSeenBreath.drawn(at = 2801.4, animates = true)
        assertEquals(0.75f, strongest.dotStrength, 1e-4f)
        assertEquals(1.2f, strongest.dotScale, 1e-4f)
        assertEquals(0.85f, strongest.groupStrength, 1e-4f)
        assertEquals(1.05, strongest.groupScale, 0.0)
        val half = LastSeenBreath.drawn(at = 2800.7, animates = true)
        assertEquals(0.5f, half.dotStrength, 1e-3f)
        assertEquals(1f, half.dotScale, 1e-3f)
        assertEquals(0.65f, half.groupStrength, 1e-3f)
        assertEquals(1.0, half.groupScale, 0.0)
        assertEquals(0.25f, LastSeenBreath.drawn(at = 2802.8, animates = true).dotStrength, 1e-4f)
        assertEquals(0.95, LastSeenBreath.drawn(at = 2802.8, animates = true).groupScale, 0.0)
        assertEquals(LastSeenBreath.Drawn(0.55f, 1f, 0.55f, 1.0), LastSeenBreath.drawn(at = 2801.4, animates = false))
        // A group's picture is drawn at a hundredth of its size at a time, eleven sizes over a breath, a frame of
        // sixty a second changing it at most once.
        val sizes = (0..168).map { LastSeenBreath.drawn(at = 2800.0 + it / 60.0, animates = true).groupScale }
        assertEquals((95..105).map { it / 100.0 }, sizes.distinct().sorted())
        assertEquals(LastSeenBreath.GROUP_LARGEST, LastSeenBreath.groupScale(LastSeenBreath.GROUP_STEPS), 0.0)
        assertTrue(sizes.zipWithNext().all { (a, b) -> abs(b - a) <= 0.01 + 1e-9 })
        // At its largest, 12 pt across inside its ring, grown with it.
        val largest = ScooterMarkerLayers.fadedDotSize(strongest.dotStrength, strongest.dotScale)
        assertEquals(6f, largest.getValue("circle-radius"), 1e-4f)
        assertEquals(1.8f, largest.getValue("circle-stroke-width"), 1e-4f)
        assertEquals(0.75f, largest.getValue("circle-stroke-opacity"), 1e-4f)
    }

    @Test
    fun aBreathingGroupIsDrawnAgainInAPictureOfOneSize() {
        val key = ScooterMarkerArt.ClusterKey(ScooterProvider.Lime, 36.0, isDark = false, count = "5")
        val still = art.lastSeenClusterImage(key)
        // 108 pixels across at 3 a point, with 3 more each side for it to grow to 1.05 of that, 113.4.
        assertEquals(108, still.width)
        assertEquals(3, ScooterMarkerArt.breathingRoom(still, LastSeenBreath.GROUP_LARGEST))
        val whole = art.lastSeenBreathImage(key, 1.0)
        assertEquals(114, whole.width)
        assertEquals(114, whole.height)
        assertEquals(still.density, whole.density)
        // At its own size, its pixels are the picture's, where the picture is.
        val stillPixels = IntArray(108 * 108).also { still.getPixels(it, 0, 108, 0, 0, 108, 108) }
        val wholePixels = IntArray(108 * 108).also { whole.getPixels(it, 0, 108, 3, 3, 108, 108) }
        assertTrue(stillPixels.contentEquals(wholePixels))

        // Smaller and larger, in the same picture and the same bitmap, about the same middle.
        fun shown(bitmap: Bitmap) = (0 until bitmap.height).sumOf { y -> (0 until bitmap.width).count { x -> Color.alpha(bitmap.getPixel(x, y)) > 0 } }
        fun rows(bitmap: Bitmap) = (0 until bitmap.height).filter { y -> (0 until bitmap.width).any { x -> Color.alpha(bitmap.getPixel(x, y)) > 0 } }
        val shownWhole = shown(whole)
        val smallest = art.lastSeenBreathImage(key, 0.95)
        assertTrue(shown(smallest) < shownWhole)
        assertTrue(abs(rows(smallest).first() - (whole.height - 1 - rows(smallest).last())) <= 1)
        val largest = art.lastSeenBreathImage(key, 1.05, into = smallest)
        assertSame(smallest, largest)
        assertEquals(114, largest.width)
        assertTrue(shown(largest) > shownWhole)
        assertTrue(rows(largest).first() < rows(whole).first())
        assertTrue(abs(rows(largest).first() - (largest.height - 1 - rows(largest).last())) <= 1)
    }

    @Test
    fun aFadedScootersTipGoesUnderItsDotWhereTheChromeLeavesNoRoomOverItAndTalkBackIsToldOfIt() {
        val map = FlatMarkerMap()
        val scene = scene()
        val seenAt = Instant.now().minusSeconds(600)
        val seen = map.at(195.0, 130.0)
        val other = map.at(100.0, 500.0)
        fun faded(updating: Boolean) = scene.reconcileLastSeen(
            listOf(scooter("seen", "lime", at = seen), scooter("other", "lime", at = other)),
            emptyList(),
            revision = 1,
            statuses = mapOf(ScooterProvider.Lime to ScooterLastSeenStatus(seenAt, updating)),
        )
        faded(updating = false)
        scene.tap(map.point(seen), map)
        val tip = scene.callout(map) ?: throw AssertionError("Expected the faded scooter's tip")
        // It may go under its dot, pointing up at its foot, should it reach above the status bar's foot.
        val below = tip.below ?: throw AssertionError("Expected a place under the dot")
        assertEquals(map.point(seen).x, below.foot.x, 1e-6)
        assertEquals(map.point(seen).y + 5, below.foot.y, 1e-6)
        assertEquals(47.0, below.ceiling, 0.0)
        // Under the search bar and its notices over the top of the map, it reaches no higher than their foot; chrome
        // over the map's bottom half is no ceiling.
        scene.parent = MarkerParent(interactionExclusionFrame = ScreenRect(16.0, 47.0, 358.0, 64.0))
        assertEquals(111.0, scene.callout(map)?.below?.ceiling ?: 0.0, 0.0)
        scene.parent = MarkerParent(interactionExclusionFrame = ScreenRect(16.0, 600.0, 358.0, 64.0))
        assertEquals(47.0, scene.callout(map)?.below?.ceiling ?: 0.0, 0.0)
        scene.parent = MarkerParent(interactionExclusionFrame = ScreenRect(16.0, 47.0, 0.0, 0.0))
        assertEquals(47.0, scene.callout(map)?.below?.ceiling ?: 0.0, 0.0)

        // TalkBack is told of it as it opens: its title, then the line under it, as VoiceOver is.
        val time = ScooterDockStatus.seenTime(seenAt)
        assertEquals("Lime · last seen $time. May have moved since", tip.announcement)
        val told = TipAnnouncer()
        assertEquals(Announcement("Lime · last seen $time. May have moved since", 1), told.next(scene.fadedTipID, scene.callout(map)))
        // Not again while it shows the same, wherever the map takes it.
        assertNull(told.next(scene.fadedTipID, scene.callout(map)))
        assertNull(told.next(scene.fadedTipID, tip.copy(anchor = ScreenPoint(10.0, 10.0))))
        // Again once what it says has changed.
        faded(updating = true)
        assertEquals(
            Announcement("Lime · last seen $time. May have moved · new positions on the way", 2),
            told.next(scene.fadedTipID, scene.callout(map)),
        )
        // Another scooter's tip is a new one, though it says the same.
        val again = scene.callout(map)
        scene.tap(map.point(other), map)
        assertEquals("v:lime:other", scene.fadedTipID)
        assertEquals(again?.announcement, scene.callout(map)?.announcement)
        assertEquals(3, told.next(scene.fadedTipID, scene.callout(map))?.serial)
        // Closed, then opened again, it is told again.
        scene.closeFadedTip()
        assertNull(told.next(scene.fadedTipID, scene.callout(map)))
        scene.tap(map.point(other), map)
        assertEquals(4, told.next(scene.fadedTipID, scene.callout(map))?.serial)
        // The pin's callout is not announced, as MapKit's isn't.
        assertNull(PinCalloutPlace("Bahnhofplatz", ScreenPoint(195.0, 256.0)).announcement)
        assertNull(told.next(null, PinCalloutPlace("Bahnhofplatz", ScreenPoint(195.0, 256.0))))
    }

    @Test
    fun aTapOnAFadedScooterSaysWhoseItIsAndWhenItWasSeenWhereNoOtherMarkerIsMeant() {
        val map = FlatMarkerMap()
        val selections = mutableListOf<String?>()
        val scene = scene(selections)
        val seenAt = Instant.now().minusSeconds(600)
        val seen = map.at(195.0, 400.0)
        val scooters = listOf(scooter("seen", "lime", at = seen))
        val groups = listOf(map.at(300.0, 600.0).let { ScooterCluster("g", it.latitude, it.longitude, count = 4, providers = mapOf("lime" to 4)) })
        fun faded(updating: Boolean, revision: Int = 1, among: List<Scooter> = scooters) = scene.reconcileLastSeen(
            among,
            groups,
            revision = revision,
            statuses = mapOf(ScooterProvider.Lime to ScooterLastSeenStatus(seenAt, updating)),
        )
        faded(updating = false)
        val far = scooter("far", "voi", at = map.at(60.0, 700.0))
        scene.reconcile(listOf(far), revision = 1)
        scene.applySelection("voi:far", map)

        // The tap closes the card, as any on the map, and shows a tip over the dot: whose it is and when it was seen,
        // with nothing to rent and no walk.
        scene.tap(map.point(seen), map)
        assertEquals(listOf<String?>(null), selections)
        val time = ScooterDockStatus.seenTime(seenAt)
        val tip = scene.callout(map) ?: throw AssertionError("Expected the faded scooter's tip")
        assertEquals("Lime · last seen $time", tip.title)
        assertEquals("May have moved since", tip.subtitle)
        assertEquals(195.0, tip.anchor.x, 0.5)
        assertEquals(400.0 - 5, tip.anchor.y, 0.5)
        // New positions on their way: it says so.
        faded(updating = true)
        assertEquals("May have moved · new positions on the way", scene.callout(map)?.subtitle)

        // Another tap on it closes it, and one more opens it again; one elsewhere closes it, and so does the map
        // starting to move.
        scene.tap(map.point(seen), map)
        assertNull(scene.callout(map))
        scene.tap(map.point(seen), map)
        assertNotNull(scene.callout(map))
        scene.tap(ScreenPoint(300.0, 250.0), map)
        assertNull(scene.callout(map))
        scene.tap(map.point(seen), map)
        scene.closeFadedTip()
        assertNull(scene.callout(map))
        // A group is not tapped.
        scene.tap(map.point(groups.single().coordinate), map)
        assertNull(scene.callout(map))

        // A scooter of the map comes first: its card opens, and no tip shows.
        val near = scooter("near", "bird", at = map.at(200.0, 400.0))
        scene.reconcile(listOf(far, near), revision = 2)
        scene.updateLook(map)
        scene.tap(map.point(seen), map)
        assertEquals("bird:near", selections.last())
        assertNull(scene.callout(map))
        scene.reconcile(listOf(far), revision = 3)
        scene.updateLook(map)

        // The tip goes with its dot.
        scene.tap(map.point(seen), map)
        assertNotNull(scene.callout(map))
        faded(updating = true, revision = 2, among = emptyList())
        assertNull(scene.callout(map))
        faded(updating = true, revision = 3)

        // TalkBack reads it by its tip's title, then what may have happened since; a double tap shows the tip. The
        // group it does not read.
        val elements = MarkerElements.of(scene, map)
        assertEquals(listOf("f:v:lime:seen", "v:voi:far"), elements.map { it.key })
        val element = elements.first()
        assertEquals("Lime · last seen $time", element.description.label)
        assertEquals("May have moved · new positions on the way", element.description.value)
        assertEquals(element, MarkerElements.at(map.point(seen), elements, scene, map))
        MarkerElements.activate(element, scene, map)
        assertEquals("Lime · last seen $time", scene.callout(map)?.title)

        // Of an app whose last sight is not known, it shows nothing, and is not read.
        scene.closeFadedTip()
        scene.reconcileLastSeen(scooters, groups, revision = 4)
        scene.tap(map.point(seen), map)
        assertNull(scene.callout(map))
        assertEquals(listOf("v:voi:far"), MarkerElements.of(scene, map).map { it.key })
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
        val name = MarkerFeatures.pill(mark, art, at = 0.0)
        assertNotNull(name)
        val picture = name!!.picture()
        assertEquals(ScooterMapLook.pillHeight, picture.height / density - 2 * ScooterMarkerArt.PILL_MARGIN, 0.5)
        assertTrue(name.offset.x + ScooterMarkerArt.PILL_MARGIN >= mark.look.footprint / 2)

        mark.look = ScooterMapLook.look(metres = 400.0, state = ScooterDotState.Plain, metresPerPoint = 1.07)
        mark.pill = null

        assertEquals(ScooterDotState.Plain, mark.art.state)
        assertEquals(8.0, mark.art.diameter, 0.0)
        assertFalse(MarkerFeatures.dot(mark, art).isRaised)
        assertNull(MarkerFeatures.pill(mark, art, at = 0.0))
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
        for (layer in listOf(ScooterMarkerLayers.MARKERS, ScooterMarkerLayers.RAISED, ScooterMarkerLayers.PILLS)) {
            assertTrue(layer, order.indexOf(ScooterMarkerLayers.RIDER) > order.indexOf(layer))
        }
        // Above every scooter, bay, cluster and name; under the cities' totals of the overview alone, which it would
        // otherwise hide the digits of (CountsClearOfTheChromeTest).
        // The faded scooters' dots, circles, are added under the scooters' layer (ScooterMarkers.addLayers).
        val symbols = ScooterMarkerLayers.specs.map { it.id }
        val markers = symbols.indexOf(ScooterMarkerLayers.MARKERS)
        assertEquals(
            order,
            symbols.take(markers) + ScooterMarkerLayers.fadedDots.map { it.id } + symbols.drop(markers) +
                ScooterMarkerLayers.riderLayers + ScooterMarkerLayers.CITIES,
        )
        // The rider's halo, beam, and ring over its shadow, under its dot, all above the names (ScooterRider).
        assertEquals(
            listOf(
                ScooterMarkerLayers.RIDER_HALO,
                ScooterMarkerLayers.RIDER_BEAM,
                ScooterMarkerLayers.RIDER_SHADOW,
                ScooterMarkerLayers.RIDER_RING,
                ScooterMarkerLayers.RIDER,
            ),
            order.dropLast(1).takeLast(5),
        )

        // While they light up, the dots are drawn by bands over their layer, in the order of their priorities,
        // under the dots easing and the selected one; the names' bands are over the names, and under the whole
        // rider, its halo too.
        val near = MarkerBand.Layer("scooters-band-1", ScooterMarkerLayers.MARKERS, sortKey = 690f)
        val far = MarkerBand.Layer("scooters-band-2", ScooterMarkerLayers.MARKERS, sortKey = 520f)
        val name = MarkerBand.Layer("scooter-names-band-3", ScooterMarkerLayers.PILLS, sortKey = 690f)
        val bands = listOf(near, far, name)
        assertEquals(ScooterMarkerLayers.MOVING, ScooterMarkerLayers.below(ScooterMarkerLayers.MARKERS, 700f, bands))
        assertEquals(near.id, ScooterMarkerLayers.below(ScooterMarkerLayers.MARKERS, 600f, bands))
        assertEquals(far.id, ScooterMarkerLayers.below(ScooterMarkerLayers.MARKERS, 500f, bands))
        assertEquals(ScooterMarkerLayers.MOVING_RAISED, ScooterMarkerLayers.below(ScooterMarkerLayers.RAISED, 900f, bands))
        assertEquals(ScooterMarkerLayers.RIDER_HALO, ScooterMarkerLayers.below(ScooterMarkerLayers.PILLS, 700f, bands))
        assertEquals(name.id, ScooterMarkerLayers.below(ScooterMarkerLayers.PILLS, 600f, bands))
        for (base in listOf(ScooterMarkerLayers.MARKERS, ScooterMarkerLayers.RAISED, ScooterMarkerLayers.PILLS)) {
            val band = ScooterMarkerLayers.band(base, 9)
            assertEquals(true, band.layout["icon-allow-overlap"])
            assertEquals(true, band.layout["icon-ignore-placement"])
        }
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
        assertEquals(localized("show parking details"), description.hint)
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

    @Test
    fun annotationAccessibilityDescribesAvailabilityAndSelection() {
        val scooter = scooter("accessible", "lime", battery = 82, rangeMeters = 12_500)
        val map = FlatMarkerMap()
        val scene = scene()
        scene.reconcile(listOf(scooter), revision = 1)
        val host = View(ApplicationProvider.getApplicationContext())
        val accessibility = ScooterMarkerAccessibility(host, scene, map, density) {}
        val id = accessibility.virtualViews().single()
        fun node() = accessibility.getAccessibilityNodeProvider(host)!!.createAccessibilityNodeInfo(id)!!

        val description = MarkerDescriptions.of(scene.mark(scooter.id)!!)
        assertEquals(stringFormat(localized("%@ scooter"), "Lime"), description.label)
        val value = description.value!!
        assertTrue(value.contains(localized("Battery")))
        assertTrue(value.contains(stringFormat(localized("%lld percent"), 82L)))
        // "Estimated" alone left open what the figure is, right after a distance.
        val range = scooter.formattedRange!!
        assertTrue(value, value.contains("${localized("Estimated range")}: $range"))
        // TalkBack reads the value after the label.
        assertEquals("${description.label}, $value", node().contentDescription)
        assertFalse(node().isSelected)

        scene.applySelection(scooter.id, map)

        assertEquals("android.widget.Button", node().className)
        assertTrue(node().actionList.any { it.id == AccessibilityNodeInfoCompat.ACTION_CLICK })
        assertTrue(node().isSelected)

        scene.applySelection(null, map)

        assertFalse(node().isSelected)
    }

    @Test
    fun cityTotalsAreAnnouncedWithTheNameOfTheCity() {
        val zurich = ScooterCluster("city:ch:zurich", 47.38, 8.54, count = 1_288, providers = mapOf("lime" to 1_288), city = "Zürich")
        val map = FlatMarkerMap(centre = GeoPoint(47.38, 8.54), mapLibreZoom = 10.0)
        val scene = scene()
        val host = View(ApplicationProvider.getApplicationContext())
        val accessibility = ScooterMarkerAccessibility(host, scene, map, density) {}
        fun node() = accessibility.getAccessibilityNodeProvider(host)!!.createAccessibilityNodeInfo(accessibility.virtualViews().single())!!
        scene.reconcileClusters(listOf(zurich), revision = 1)

        val label = node().contentDescription.toString()
        assertTrue(label, label.startsWith("Zürich, "))
        assertEquals(MarkerDescriptions.clusterLabel(count = 1_288, city = "Zürich"), label)
        assertEquals("android.widget.Button", node().className)

        // A marker given a city with the same numbers takes the new name.
        scene.reconcileClusters(listOf(ScooterCluster("city:ch:bern", 47.38, 8.54, count = 1_288, providers = mapOf("lime" to 1_288), city = "Bern")), revision = 2)
        accessibility.refresh()
        assertTrue(node().contentDescription.startsWith("Bern, "))

        // A cluster inside a city has no name and keeps its count alone.
        scene.reconcileClusters(listOf(ScooterCluster("13:4290:2868", 47.38, 8.54, count = 1_288, providers = mapOf("lime" to 1_288))), revision = 3)
        accessibility.refresh()
        assertEquals(stringFormat(localized("%@ scooters"), 1_288.formatted(Locale.getDefault())), node().contentDescription)

        assertEquals(stringFormat(localized("%@, one scooter"), "Uster"), MarkerDescriptions.clusterLabel(count = 1, city = "Uster"))
    }
}
