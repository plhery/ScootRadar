package com.plhery.scootradar.map

import androidx.compose.animation.core.CubicBezierEasing
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.ScooterDotState
import com.plhery.scootradar.core.model.ScooterLanguage
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

/**
 * How a dot eases to a new look and place, as the iPhone's marker view does when its look is drawn again, animated
 * (MAP-097, MAP-098, MAP-309), and how a name slides to another side (MAP-116): on a fake clock, at the start, the
 * middle and the end of each ease.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MarkerMotionTest {
    private val art = ScooterMarkerArt(3f, MarkerFonts.of(ApplicationProvider.getApplicationContext()))
    private val map = FlatMarkerMap()
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current

    private var clock = 100.0
    private var animates = true
    private val scene = ScooterMarkerScene(art, now = { clock }, animates = { animates })

    /** CAMediaTimingFunction(name: .default), and UIView.animate's ease in, ease out. */
    private val implicit = CubicBezierEasing(0.25f, 0.1f, 0.25f, 1f)
    private val easeInOut = CubicBezierEasing(0.42f, 0f, 0.58f, 1f)

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
        scene.parent = MarkerParent(origin = map.at(195.0, 422.0))
        scene.updateClusteringMode(zoomLevel = 17.0, map = map)
    }

    @After
    fun tearDown() {
        Locale.setDefault(locale)
        ScooterLanguage.current = language
    }

    private fun drawing(mark: ScooterMark) = DotDrawing(mark.art, mark.look.diameter, mark.look.strength)

    /** Two of Voi's, the nearer its head, and the farther a plain dot. */
    private fun twoDots(): ScooterMark {
        scene.reconcile(listOf(scooter("near", "voi", at = map.at(195.0, 400.0)), scooter("far", "voi", at = map.at(300.0, 600.0))), revision = 1)
        scene.updateLook(map)
        return scene.mark("voi:far")!!
    }

    @Test
    fun aDotsLookEasesAlongCoreAnimationsCurveOverAQuarterOfASecond() {
        val mark = twoDots()
        val before = drawing(mark)
        assertEquals(ScooterDotState.Plain, mark.look.state)

        scene.applySelection("voi:far", map)
        val after = drawing(mark)
        assertNotEquals(before.diameter, after.diameter)
        assertNotEquals(before.strength, after.strength)
        val motion = mark.motion!!
        // The movers' layers draw it meanwhile, and the scooters' own leave it to them.
        assertEquals(listOf(mark), scene.moving())
        val dot = MarkerFeatures.dot(mark, art)
        assertTrue(dot.isMoving)
        assertEquals(after.art.id, dot.image)

        // Until MapLibre has handed it over, it stays as it was.
        clock = 100.4
        assertEquals(before, motion.drawing(100.4))
        assertTrue(scene.settleMotions(100.4).isEmpty())
        scene.beginMotions(100.5)

        fun expect(at: Double) {
            val progress = implicit.transform(((at - 100.5) / 0.25).toFloat())
            val drawn = motion.drawing(at)
            assertEquals("$at", before.diameter + (after.diameter - before.diameter) * progress, drawn.diameter, 1e-6)
            assertEquals("$at", before.strength + (after.strength - before.strength) * progress, drawn.strength, 1e-6)
        }
        // At its start, as it was.
        assertEquals(before, motion.drawing(100.5))
        // In the middle of its time, 80 % of the way, the curve being quick to start.
        expect(100.625)
        assertEquals(0.80f, implicit.transform(0.5f), 0.005f)
        // The new picture takes the old one's place where the cross-fade is half way, 0.07 s in.
        expect(100.56)
        assertEquals(before.art, motion.drawing(100.56).art)
        expect(100.58)
        assertEquals(after.art, motion.drawing(100.58).art)
        // The picture drawn is scaled for its dot to be as wide as the ease has it.
        val mover = MarkerFeatures.mover(mark, art, 100.625)
        val drawn = motion.drawing(100.625)
        assertEquals(after.art.id, mover.image)
        assertEquals(drawn.diameter / after.diameter, mover.size, 1e-9)
        assertEquals(drawn.strength, mover.opacity, 1e-9)
        assertTrue(mover.isRaised)
        // At its end, as it is.
        assertEquals(after, motion.drawing(100.75))
        assertEquals(1.0, MarkerFeatures.mover(mark, art, 100.75).size, 0.0)

        // Once over, it goes back to the scooters' layers, which draw it again from their next write.
        assertTrue(scene.settleMotions(100.749).isEmpty())
        val version = scene.markersVersion
        assertEquals(listOf(mark), scene.settleMotions(100.75))
        assertNull(mark.motion)
        assertTrue(scene.moving().isEmpty())
        assertFalse(MarkerFeatures.dot(mark, art).isMoving)
        assertTrue(scene.markersVersion > version)
    }

    @Test
    fun aDotMovesToItsPlaceInASpreadInAndOutOverAFifthOfASecond() {
        val spot = map.at(250.0, 500.0)
        scene.reconcile(listOf(scooter("a", "voi", at = spot)), revision = 1)
        scene.updateLook(map)
        val mark = scene.mark("voi:a")!!
        val look = drawing(mark)
        assertEquals(ScreenPoint.zero, mark.look.offset)

        // Another comes to the same spot: the first moves aside, the newcomer is drawn in its place at once.
        scene.reconcile(listOf(scooter("a", "voi", at = spot), scooter("b", "lime", at = spot)), revision = 2)
        scene.updateLook(map)
        val target = mark.look.offset
        assertNotEquals(ScreenPoint.zero, target)
        assertNull(scene.mark("lime:b")!!.motion)
        val motion = mark.motion!!
        scene.beginMotions(100.0)

        assertEquals(ScreenPoint.zero, motion.offset(100.0))
        // The curve is even: half the time, half the way.
        assertEquals(target.x / 2, motion.offset(100.11).x, 1e-6)
        assertEquals(target.y / 2, motion.offset(100.11).y, 1e-6)
        val quarter = easeInOut.transform(0.25f)
        assertEquals(target.x * quarter, motion.offset(100.055).x, 1e-6)
        assertEquals(target.y * quarter, motion.offset(100.055).y, 1e-6)
        assertEquals(target, motion.offset(100.2201))
        assertEquals(target, MarkerFeatures.mover(mark, art, 100.2201).offset)
        // Its look did not change, and stays as it was all along.
        assertEquals(look, motion.drawing(100.05))
        assertTrue(motion.isOver(100.2201))
        assertFalse(motion.isOver(100.2199))
    }

    @Test
    fun withRemoveAnimationsALookAndAPlaceChangeAtOnce() {
        animates = false
        val mark = twoDots()
        scene.applySelection("voi:far", map)
        assertNull(mark.motion)
        assertTrue(scene.moving().isEmpty())
        val dot = MarkerFeatures.dot(mark, art)
        assertFalse(dot.isMoving)
        assertEquals(mark.art.id, dot.image)
        assertEquals(ScooterDotState.Selected, mark.look.state)

        val spot = map.at(195.0, 600.0)
        scene.reconcile(scene.marks.map { it.scooter } + scooter("one", "bolt", at = spot), revision = 2)
        scene.updateLook(map)
        scene.reconcile(scene.marks.map { it.scooter } + scooter("two", "tier", at = spot), revision = 3)
        scene.updateLook(map)
        assertNotEquals(ScreenPoint.zero, scene.mark("bolt:one")!!.look.offset)
        assertTrue(scene.moving().isEmpty())
    }

    @Test
    fun aDotChangedWhileItEasesGoesOnFromWhereItHasGot() {
        val mark = twoDots()
        val plain = drawing(mark)
        scene.applySelection("voi:far", map)
        val motion = mark.motion!!
        scene.beginMotions(100.0)

        // Deselected 0.1 s in, it shrinks back from where it had got to, over a quarter of a second from then.
        clock = 100.1
        val got = motion.drawing(100.1)
        scene.applySelection(null, map)
        assertEquals(got, motion.drawing(100.1))
        val progress = implicit.transform(0.4f)
        assertEquals(got.diameter + (plain.diameter - got.diameter) * progress, motion.drawing(100.2).diameter, 1e-6)
        assertFalse(motion.isOver(100.349))
        assertEquals(plain, motion.drawing(100.3501))
        assertTrue(scene.settleMotions(100.3).isEmpty())
        assertEquals(listOf(mark), scene.settleMotions(100.3501))

        // What changes at once while it eases, a new scale, changes at once, and the movers' layers draw it until
        // the dots go back together.
        scene.applySelection("voi:far", map)
        scene.beginMotions(101.0)
        val eased = mark.motion!!
        eased.go(plain, ScreenPoint.zero, at = 101.1, animated = false)
        assertEquals(plain, eased.drawing(101.1))
        assertEquals(listOf(mark), scene.moving())
    }

    @Test
    fun aPictureChangedAloneIsChangedAtOnce() {
        val mark = twoDots()
        val light = mark.art
        // The dark art is the same width and strength: MapLibre cannot cross-fade it in.
        scene.isDark = true
        scene.updateLook(map)
        assertNotEquals(light, mark.art)
        assertNull(mark.motion)
        assertEquals(mark.art.id, MarkerFeatures.dot(mark, art).image)
    }

    @Test
    fun onlyTheDotsOnTheMapEaseAndAtMostThreeHundred() {
        // Off the map, a dot has no view to ease: it changes at once.
        scene.reconcile(listOf(scooter("off", "voi", at = map.at(195.0, -300.0))), revision = 1)
        scene.updateLook(map)
        scene.applySelection("voi:off", map)
        assertNull(scene.mark("voi:off")!!.motion)

        // The rider walking away changes every dot's size and strength: 300 ease, the rest change at once.
        val scooters = (0 until 320).map { index -> scooter("$index", "lime", at = map.at(20.0 + (index % 20) * 18, 100.0 + (index / 20) * 40)) }
        scene.reconcile(scooters, revision = 2)
        scene.updateLook(map)
        scene.parent = MarkerParent(origin = map.at(195.0, 820.0))
        scene.updateLook(map)
        assertEquals(ScooterMarkerScene.MOST_MOVING, scene.moving().size)
        assertEquals(300, ScooterMarkerScene.MOST_MOVING)
    }

    /** A name beside its dot, and the panel that comes over the side it is on. */
    private fun named(): Pair<ScooterMark, ScreenPoint> {
        scene.reconcile(listOf(scooter("named", "voi", at = map.at(195.0, 380.0))), revision = 1)
        scene.updateLook(map)
        val mark = scene.mark("voi:named")!!
        assertNotNull(mark.shownPill)
        val before = mark.pillOrigin
        cover(mark)
        return mark to before
    }

    /** A panel comes over the side of its dot the name is on. */
    private fun cover(mark: ScooterMark) {
        val panel = if (mark.pillOrigin.x > 0) ScreenRect(200.0, 0.0, 190.0, 844.0) else ScreenRect(0.0, 0.0, 190.0, 844.0)
        scene.parent = scene.parent.copy(panelFrame = panel)
    }

    /** Where the name is drawn from its scooter at [at], its picture's margin aside. */
    private fun drawnPill(mark: ScooterMark, at: Double): ScreenPoint =
        MarkerFeatures.pill(mark, art, at)!!.offset.let { ScreenPoint(it.x + ScooterMarkerArt.PILL_MARGIN, it.y + ScooterMarkerArt.PILL_MARGIN) }

    @Test
    fun aNameSlidesToItsNewSideInAndOutOverAFifthOfASecond() {
        val (mark, before) = named()
        assertFalse(scene.pillsMove(clock))
        scene.movePills(map)
        val after = mark.pillOrigin
        assertNotEquals(before, after)
        assertNotNull(mark.shownPill)
        assertTrue(scene.pillsMove(100.0))

        fun expect(at: Double, progress: Float) {
            val drawn = drawnPill(mark, at)
            assertEquals("$at", before.x + (after.x - before.x) * progress, drawn.x, 1e-6)
            assertEquals("$at", before.y + (after.y - before.y) * progress, drawn.y, 1e-6)
        }
        // At its start, where it was; half the time, half the way; at its end, on its new side.
        expect(100.0, 0f)
        expect(100.05, easeInOut.transform(0.25f))
        expect(100.1, easeInOut.transform(0.5f))
        assertTrue(scene.pillsMove(100.199))
        expect(100.2, 1f)
        assertFalse(scene.pillsMove(100.2))
        // The dot stays where it was: only the name moves.
        assertNull(mark.motion)

        // Moved again half way, it slides on from where it has got to.
        clock = 100.1
        val got = drawnPill(mark, 100.1)
        cover(mark)
        scene.movePills(map)
        assertEquals(before, mark.pillOrigin)
        assertEquals(got.x, drawnPill(mark, 100.1).x, 1e-6)
        assertEquals(before.x, drawnPill(mark, 100.3).x, 1e-6)
        assertTrue(scene.pillsMove(100.299))
    }

    @Test
    fun aNameThatGoesGoesAtOnceAndWithRemoveAnimationsOneMovesAtOnce() {
        val (mark, _) = named()
        animates = false
        scene.movePills(map)
        assertEquals(mark.pillOrigin, drawnPill(mark, 100.0))
        assertFalse(scene.pillsMove(100.0))

        // Covered, it goes at once, even sliding.
        animates = true
        cover(mark)
        scene.movePills(map)
        assertTrue(scene.pillsMove(100.0))
        scene.parent = scene.parent.copy(panelFrame = ScreenRect(0.0, 0.0, 390.0, 844.0))
        scene.movePills(map)
        assertNull(mark.shownPill)
        assertNull(MarkerFeatures.pill(mark, art, 100.0))
        assertFalse(scene.pillsMove(100.0))
    }

    @Test
    fun theDotsEasingAreDrawnFromASourceOfTheirOwn() {
        val specs = ScooterMarkerLayers.specs.associateBy { it.id }
        val order = ScooterMarkerLayers.order
        for (id in listOf(ScooterMarkerLayers.MOVING, ScooterMarkerLayers.MOVING_RAISED)) {
            val spec = specs.getValue(id)
            assertEquals(ScooterMarkerLayers.MOVING_SOURCE, spec.source)
            assertEquals(SymbolLayerSpec.Json("[\"number\",[\"get\",\"size\"],1]"), spec.layout["icon-size"])
            assertEquals(SymbolLayerSpec.Json(ScooterMarkerLayers.STRENGTH), spec.paint["icon-opacity"])
            assertEquals("center", spec.layout["icon-anchor"])
        }
        // Over the dots, and the selected one over every dot.
        assertEquals(
            listOf(ScooterMarkerLayers.MARKERS, ScooterMarkerLayers.MOVING, ScooterMarkerLayers.RAISED, ScooterMarkerLayers.MOVING_RAISED, ScooterMarkerLayers.PILLS),
            order.subList(order.indexOf(ScooterMarkerLayers.MARKERS), order.indexOf(ScooterMarkerLayers.PILLS) + 1),
        )
        assertEquals("[\"!\",[\"has\",\"raised\"]]", specs.getValue(ScooterMarkerLayers.MOVING).filter)
        assertEquals("[\"has\",\"raised\"]", specs.getValue(ScooterMarkerLayers.MOVING_RAISED).filter)
        // The scooters' own layers leave the dots easing to them.
        assertEquals("[\"all\",[\"!\",[\"has\",\"raised\"]],[\"!\",[\"has\",\"moving\"]]]", specs.getValue(ScooterMarkerLayers.MARKERS).filter)
        assertEquals("[\"all\",[\"has\",\"raised\"],[\"!\",[\"has\",\"moving\"]]]", specs.getValue(ScooterMarkerLayers.RAISED).filter)

        val still = MarkerFeature("v:a", map.at(195.0, 400.0), "dot/a", { error("not drawn") })
        val moving = MarkerFeature("v:b", map.at(195.0, 400.0), "dot/b", { error("not drawn") }, isMoving = true)
        val mover = MarkerFeature("v:b", map.at(195.0, 400.0), "dot/b", { error("not drawn") }, size = 0.75)
        val features = JSONObject(MarkerFeatures.json(listOf(still, moving, mover))).getJSONArray("features")
        val first = features.getJSONObject(0).getJSONObject("properties")
        assertFalse(first.has("size"))
        assertFalse(first.has("moving"))
        assertTrue(features.getJSONObject(1).getJSONObject("properties").getBoolean("moving"))
        assertEquals(0.75, features.getJSONObject(2).getJSONObject("properties").getDouble("size"), 0.0)
    }
}
