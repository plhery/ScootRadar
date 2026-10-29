package com.plhery.scootradar.map

import androidx.compose.animation.core.CubicBezierEasing
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import java.util.Locale
import kotlin.math.min

/** What a tap means on the markers, how they light up, and how they go to MapLibre: the scene's own tests. */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScooterMarkerSceneTest {
    private val art = ScooterMarkerArt(3f, MarkerFonts.of(ApplicationProvider.getApplicationContext()))
    private val map = FlatMarkerMap()
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current

    private var clock = 100.0
    private var animates = true
    private val selections = mutableListOf<String?>()
    private val parkingSelections = mutableListOf<String?>()
    private val scene = ScooterMarkerScene(
        art,
        onSelectionChange = { selections += it },
        onParkingSelectionChange = { parkingSelections += it },
        now = { clock },
        animates = { animates },
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

    private fun tap(x: Double, y: Double) = scene.tap(ScreenPoint(x, y), map)

    @Test
    fun theNearestDotIsTakenWhereDotsOverlap() {
        scene.reconcile(listOf(scooter("a", "lime", at = map.at(195.0, 400.0)), scooter("b", "voi", at = map.at(205.0, 400.0))), revision = 1)

        // Each dot's 10 pt lie over the other's: the centre nearest the finger wins, not the dot drawn on top.
        tap(202.0, 400.0)
        tap(198.0, 400.0)
        // A finger is larger than a dot: 22 pt from its centre still touch it, and further does not.
        tap(195.0, 423.0)
        tap(195.0, 421.0)

        assertEquals(listOf("voi:b", "lime:a", null, "lime:a"), selections)
    }

    @Test
    fun aDotOverABayIsTakenAndTheBalloonAroundIt() {
        val bayPlace = map.at(195.0, 400.0)
        val bay = ScooterParking("dott:bay", "dott", "Rue Faidherbe", bayPlace.latitude, bayPlace.longitude, mandatory = false)
        scene.reconcileParking(listOf(bay))
        scene.reconcile(listOf(scooter("dot", "dott", at = map.at(195.0, 380.0))), revision = 1)

        // Beside the dot, within its reach but on the balloon, the bay.
        tap(195.0, 368.0)
        assertEquals(listOf<String?>("dott:bay"), parkingSelections)
        assertTrue(selections.isEmpty())

        // On the dot, the dot, over the balloon grown with its selection.
        tap(195.0, 381.0)
        assertEquals(listOf<String?>("dott:dot"), selections)
        assertEquals(listOf<String?>("dott:bay"), parkingSelections)
        // Selected, the dot is larger with its ring: what was beside it is on it now.
        val (mark, distance) = scene.scooterMark(ScreenPoint(195.0, 368.0), map)!!
        assertTrue(distance <= mark.look.footprint / 2 + 4)
        // Below the bay's point there is no balloon.
        assertNull(scene.parking(ScreenPoint(195.0, 402.0), map))
    }

    @Test
    fun theChromeAndTheWalkKeepTheirTouches() {
        scene.reconcile(listOf(scooter("under", "lime", at = map.at(195.0, 60.0))), revision = 1)
        scene.applySelection("voi:other", map)

        // The search bar's touches are not the map's: nothing is selected and nothing closes.
        scene.parent = MarkerParent(interactionExclusionFrame = ScreenRect(0.0, 47.0, 390.0, 60.0))
        tap(195.0, 60.0)
        assertTrue(selections.isEmpty())

        // During a walk the card stays open over the map.
        scene.parent = MarkerParent(isWalking = true)
        tap(195.0, 600.0)
        assertTrue(selections.isEmpty())

        scene.parent = MarkerParent()
        tap(195.0, 600.0)
        assertEquals(listOf<String?>(null), selections)
    }

    @Test
    fun aNameStandsForItsDot() {
        scene.parent = MarkerParent(origin = map.at(195.0, 422.0))
        scene.updateClusteringMode(zoomLevel = 17.0, map = map)
        scene.reconcile(listOf(scooter("named", "voi", at = map.at(195.0, 380.0))), revision = 1)
        scene.updateLook(map)

        val (mark, frame) = scene.shownPillFrames(map).single()
        assertEquals("voi:named", mark.scooter.id)
        assertNotNull(MarkerFeatures.pill(mark, art))
        // Its far end is out of the dot's reach, and still means the dot.
        val end = ScreenPoint(frame.maxX - 2, frame.midY)
        assertTrue(scene.dotCentre(mark, map).let { kotlin.math.hypot(it.x - end.x, it.y - end.y) } > ScooterMarkerScene.TAP_REACH)
        scene.tap(end, map)
        assertEquals(listOf<String?>("voi:named"), selections)
    }

    @Test
    fun scootersLightUpOnceFromTheRiderOutwards() {
        scene.parent = MarkerParent(origin = map.at(195.0, 422.0))
        val farAway = map.at(195.0, 422.0).let { GeoPoint(it.latitude + 0.01, it.longitude) }
        val first = scene.reconcile(listOf(scooter("near", "voi", at = map.at(195.0, 412.0)), scooter("far", "lime", at = farAway)), revision = 1)
        scene.lightUp(first, map)

        val near = scene.mark("voi:near")!!
        val far = scene.mark("lime:far")!!
        // 1.5 ms a metre from the rider, up to 1.2 s.
        assertEquals(100 + near.metres!! * 0.0015, near.dotFade!!.from, 1e-9)
        assertTrue(far.metres!! > 800)
        assertEquals(101.2, far.dotFade!!.from, 1e-9)
        assertEquals(ScooterMarkerScene.LIGHT_UP, near.dotFade!!.length, 0.0)
        assertEquals(MarkerFade.Curve.LightUp, near.dotFade!!.curve)

        // What comes later is there at once.
        clock = 101.0
        val later = scene.reconcile(scene.marks.map { it.scooter } + scooter("later", "bolt", at = map.at(100.0, 422.0)), revision = 2)
        scene.lightUp(later, map)
        assertNull(scene.mark("bolt:later")!!.dotFade)
    }

    @Test
    fun withRemoveAnimationsNothingLightsUp() {
        animates = false
        scene.parent = MarkerParent(origin = map.at(195.0, 422.0))
        val added = scene.reconcile(listOf(scooter("near", "voi", at = map.at(195.0, 412.0))), revision = 1)
        scene.lightUp(added, map)
        assertNull(scene.mark("voi:near")!!.dotFade)
    }

    @Test
    fun markersGoToMapLibreAsGeoJSON() {
        val plain = MarkerFeature("v:lime:\"a\\b", map.at(195.0, 400.0), "dot/lime", { error("not drawn") }, ScreenPoint(1.5, -2.0), 612f, 0.6)
        val raised = MarkerFeature(
            "p:dott:bay", map.at(195.0, 400.0), "bay/dott", { error("not drawn") }, sortKey = 1000f, isRaised = true,
            fade = MarkerFade(from = 103.0, length = 0.2, curve = MarkerFade.Curve.EaseInEaseOut),
        )

        val json = JSONObject(MarkerFeatures.json(listOf(plain, raised), bands = mapOf(raised to 7)))
        val features = json.getJSONArray("features")
        assertEquals("FeatureCollection", json.getString("type"))
        assertEquals(2, features.length())

        val first = features.getJSONObject(0)
        assertEquals("v:lime:\"a\\b", first.getString("id"))
        val coordinates = first.getJSONObject("geometry").getJSONArray("coordinates")
        assertEquals(plain.coordinate.longitude, coordinates.getDouble(0), 1e-12)
        assertEquals(plain.coordinate.latitude, coordinates.getDouble(1), 1e-12)
        val properties = first.getJSONObject("properties")
        assertEquals("dot/lime", properties.getString("image"))
        assertEquals(1.5, properties.getJSONArray("offset").getDouble(0), 0.0)
        assertEquals(-2.0, properties.getJSONArray("offset").getDouble(1), 0.0)
        assertEquals(612.0, properties.getDouble("sort"), 0.0)
        assertEquals(0.6, properties.getDouble("opacity"), 0.0)
        // The layers tell the raised and the fading markers by what they have.
        assertFalse(properties.has("raised"))
        assertFalse(properties.has("band"))

        val second = features.getJSONObject(1).getJSONObject("properties")
        assertTrue(second.getBoolean("raised"))
        assertEquals(7, second.getInt("band"))
    }

    @Test
    fun fadingMarkersGoInBandsOfOneStrengthAFrame() {
        fun fading(from: Double, strength: Double, raised: Boolean = false) = MarkerFeature(
            "v:lime:$from", map.at(195.0, 400.0), "dot/lime", { error("not drawn") }, opacity = strength, isRaised = raised,
            fade = MarkerFade(from, ScooterMarkerScene.LIGHT_UP, MarkerFade.Curve.LightUp),
        )
        val epoch = 100.0
        // Fades starting within a twentieth of a second, at strengths within a twentieth, go together, and the
        // band starts with the last of them, so that none lights up before its time.
        val band = MarkerBand.of(fading(100.12, 0.87), epoch, time = 0.0)!!
        assertEquals(band, MarkerBand.of(fading(100.149, 0.86), epoch, time = 0.0))
        assertEquals(3, band.start)
        assertEquals(17, band.strength)
        assertNotEquals(band, MarkerBand.of(fading(100.151, 0.87), epoch, time = 0.0))
        assertNotEquals(band, MarkerBand.of(fading(100.12, 0.42), epoch, time = 0.0))
        assertNotEquals(band, MarkerBand.of(fading(100.12, 0.87, raised = true), epoch, time = 0.0))
        // A fade written once it is over has no band; one not fading has none either.
        assertNull(MarkerBand.of(fading(100.12, 0.87), epoch, time = 0.12 + ScooterMarkerScene.LIGHT_UP + 1e-6))
        assertNull(MarkerBand.of(MarkerFeature("v:lime:still", map.at(195.0, 400.0), "dot/lime", { error("not drawn") }), epoch, time = 0.0))

        // Unseen until its start, but still drawn; its own strength at its end, along the light-up's curve between.
        assertEquals(MarkerBand.FAINTEST, band.opacity(0.0), 0f)
        assertEquals(MarkerBand.FAINTEST, band.opacity(0.15), 0f)
        assertEquals(0.85f, band.opacity(0.15 + ScooterMarkerScene.LIGHT_UP), 1e-4f)
        assertEquals(0.85f, band.opacity(5.0), 1e-6f)
        assertTrue(band.opacity(0.15 + 0.1) > 0.85f * 0.4f)
        assertTrue(band.opacity(0.15 + 0.1) < band.opacity(0.15 + 0.2))
        assertFalse(band.isOver(0.15 + ScooterMarkerScene.LIGHT_UP - 0.01))
        assertTrue(band.isOver(0.15 + ScooterMarkerScene.LIGHT_UP + 1e-6))

        // MapLibre eases the dots' bands itself: its own curve, over less time, is the iPhone's light-up.
        val eased = band.eased!!
        val mapLibre = CubicBezierEasing(0f, 0f, 0.25f, 1f)
        val iPhone = CubicBezierEasing(0.22f, 1f, 0.36f, 1f)
        for (step in 0..100) {
            val time = ScooterMarkerScene.LIGHT_UP * step / 100
            assertEquals("$time s", iPhone.transform((time / ScooterMarkerScene.LIGHT_UP).toFloat()), mapLibre.transform(min(1.0, time / eased).toFloat()), 0.025f)
        }
        // A name's linear fade is not: its band's strength is set at each frame.
        val name = MarkerFeature("n:lime:a", map.at(195.0, 400.0), "pill", { error("not drawn") }, fade = MarkerFade(100.9, ScooterMarkerScene.NAME_IN, MarkerFade.Curve.Linear))
        assertNull(MarkerBand.of(name, epoch, time = 0.0)!!.eased)

        // A band's layer draws its markers alone, as its base layer draws them but all together, in the order they
        // are written in; unseen until its first frame.
        val markers = ScooterMarkerLayers.specs.first { it.id == ScooterMarkerLayers.MARKERS }
        val layer = ScooterMarkerLayers.band(ScooterMarkerLayers.MARKERS, 4)
        assertEquals("scooters-band-4", layer.id)
        assertEquals(markers.source, layer.source)
        assertEquals("[\"==\",[\"get\",\"band\"],4]", layer.filter)
        assertEquals(markers.layout - "symbol-sort-key" + ("symbol-z-order" to "source"), layer.layout)
        assertEquals(MarkerBand.FAINTEST, layer.paint["icon-opacity"])
    }

    @Test
    fun aDotChangedMidFadeGoesOnFromWhereItsFadeHasGot() {
        val epoch = 100.0
        val fade = MarkerFade(100.2, ScooterMarkerScene.LIGHT_UP, MarkerFade.Curve.LightUp)
        fun dot(strength: Double, raised: Boolean = false) = MarkerFeature(
            "v:lime:a", map.at(195.0, 400.0), "dot/lime", { error("not drawn") }, opacity = strength, fade = fade, isRaised = raised,
        )
        val iPhone = CubicBezierEasing(0.22f, 1f, 0.36f, 1f)
        val bands = MarkerBands(ScooterMarkerLayers.MARKERS, ScooterMarkerLayers.RAISED)

        // The light-up: the dot's band starts unseen, and MapLibre eases it from its start, 0.1 s on, once.
        val (lit, added) = bands.assign(listOf(dot(0.42)), epoch, time = 0.1)
        val first = lit.values.single()
        assertEquals(listOf(first), added)
        assertEquals(MarkerBand.FAINTEST, first.spec.paint["icon-opacity"])
        assertEquals(MarkerBands.Ease(370, 100, 0.4f), bands.ease(first, time = 0.1))
        assertNull(bands.ease(first, time = 0.2))

        // Selected 0.15 s into its fade: raised, at its whole strength. Its new band starts where the iPhone's
        // curve has got to at that strength, and MapLibre eases it the rest of the way, by the end of the curve.
        val (selected, raisedAdded) = bands.assign(listOf(dot(1.0, raised = true)), epoch, time = 0.35)
        val raised = selected.values.single()
        assertEquals(listOf(raised), raisedAdded)
        assertEquals(ScooterMarkerLayers.RAISED, raised.layer.base)
        assertEquals(ScooterMarkerLayers.MOVING_RAISED, raised.below)
        val got = iPhone.transform((0.15 / ScooterMarkerScene.LIGHT_UP).toFloat())
        assertTrue(got > 0.7f)
        assertEquals(got, raised.spec.paint["icon-opacity"] as Float, 1e-4f)
        assertEquals(MarkerBands.Ease(220, 0, 1f), bands.ease(raised, time = 0.35))

        // A rider come closer, its strength a step up: the same, at its new strength.
        val (closer, _) = bands.assign(listOf(dot(0.6)), epoch, time = 0.35)
        val stronger = closer.values.single()
        assertEquals(ScooterMarkerLayers.MARKERS, stronger.layer.base)
        assertEquals(0.6f * got, stronger.opacity, 1e-4f)
        // Changed once its curve is run, it is at its strength at once.
        val (late, _) = bands.assign(listOf(dot(0.8)), epoch, time = 0.6)
        assertEquals(MarkerBands.Ease(0, 0, 0.8f), bands.ease(late.values.single(), time = 0.6))

        // The bands it left draw nothing more of it, and are handed back with the rest once every fade is over.
        assertEquals(4, bands.all.size)
        assertFalse(bands.isOver(0.2 + ScooterMarkerScene.LIGHT_UP - 0.01))
        assertTrue(bands.isOver(0.2 + ScooterMarkerScene.LIGHT_UP))
        assertEquals(4, bands.clear().size)
        assertFalse(bands.isFading)

        // A name's band is given its strength at each frame, from where its fade has got to when it is added.
        val names = MarkerBands(ScooterMarkerLayers.PILLS, raised = null)
        val name = MarkerFeature(
            "n:lime:a", map.at(195.0, 400.0), "pill", { error("not drawn") },
            fade = MarkerFade(100.9, ScooterMarkerScene.NAME_IN, MarkerFade.Curve.Linear),
        )
        val pill = names.assign(listOf(name), epoch, time = 1.16).first.values.single()
        assertEquals(0.5f, pill.opacity, 1e-4f)
        assertNull(names.ease(pill, time = 1.16))
        assertEquals(emptyList<MarkerBands.Band>(), names.frame(1.16))
        assertEquals(listOf(pill), names.frame(1.29))
        assertEquals(0.75f, pill.opacity, 1e-4f)
    }
}
