package com.plhery.scootradar.map

import com.plhery.scootradar.core.map.ScooterUserHeading
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.MapRect
import com.plhery.scootradar.core.model.ScooterMapProjection
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.pow
import kotlin.math.sin

// MAP-187 and MAP-193 to MAP-195: the beam's turns and the dot's breath as they are written to the map, which
// lays the rider's layers out again for each turn written.

class RiderMotionTest {
    /** The map's rider layers as the motion writes them, and the frames it asks for, at 60 frames a second. */
    private inner class Layers : RiderMotion.Rider {
        var target: Double? = 0.0
        var breathing = true
        val rotations = mutableListOf<Double>()
        val shown = mutableListOf<Boolean>()
        val radii = mutableListOf<Double>()
        var frameAt: Long? = null

        override fun beamRotation(): Double? = target

        override fun rotateBeam(degrees: Double) {
            rotations += degrees
        }

        override fun showBeam(shown: Boolean) {
            this.shown += shown
        }

        override fun setRadius(radius: Double) {
            radii += radius
        }

        override fun breathes(): Boolean = breathing

        override fun frameAfter(delayMillis: Long) {
            assertNull("one frame asked at a time", frameAt)
            // The first frame from then, and as Choreographer has it, never the frame under way.
            frameAt = max((now / VSYNC + 1) * VSYNC, (now + delayMillis + VSYNC - 1) / VSYNC * VSYNC)
        }
    }

    private var now = 1_000 * VSYNC
    private var frames = 0
    private val layers = Layers()
    private val motion = RiderMotion(layers, uptimeMillis = { now }, ease = { it })

    /** The frames asked for until [millis] from now, or until none is. */
    private fun run(millis: Long) {
        val end = now + millis
        while (true) {
            val frame = layers.frameAt ?: break
            if (frame > end) break
            now = frame
            layers.frameAt = null
            frames += 1
            motion.onFrame()
        }
        now = end
    }

    @Test
    fun aCompassTurnIsWrittenInAFewStepsOfTwoDegreesAtLeast() {
        layers.breathing = false
        motion.beamChanged(animated = false)
        assertEquals(listOf(0.0), layers.rotations)
        assertEquals(listOf(true), layers.shown)

        // 40° over 0.18 s, where a step each frame would write it eleven times.
        layers.target = 40.0
        layers.rotations.clear()
        motion.beamChanged(animated = true)
        run(1_000)
        assertTrue("${layers.rotations}", layers.rotations.size <= 4)
        assertEquals(40.0, layers.rotations.last(), 0.0)
        layers.rotations.zipWithNext().forEach { (from, to) -> assertTrue("${layers.rotations}", to - from >= 2.0) }
        assertNull("nothing more asked at rest", layers.frameAt)

        // 3°: a step of 2°, and its end.
        layers.target = 43.0
        layers.rotations.clear()
        motion.beamChanged(animated = true)
        run(1_000)
        assertEquals(43.0, layers.rotations.last(), 0.0)
        assertTrue("${layers.rotations}", layers.rotations.size <= 2)
    }

    @Test
    fun aTurnGoesTheShortWayFromWhereTheBeamIs() {
        layers.breathing = false
        layers.target = 350.0
        motion.beamChanged(animated = false)
        layers.target = 30.0
        layers.rotations.clear()
        motion.beamChanged(animated = true)
        run(60)
        // A new reading halfway: on from where the beam was, not from where it was going.
        layers.target = 10.0
        motion.beamChanged(animated = true)
        run(1_000)
        assertTrue(
            "${layers.rotations}",
            layers.rotations.all { it >= 350.0 || it <= 30.0 },
        )
        assertEquals(10.0, layers.rotations.last(), 0.0)
    }

    @Test
    fun aMovingCameraWritesTheBeamOnlyOnceItShowsTwoDegreesOff() {
        layers.breathing = false
        layers.target = 30.0
        motion.beamChanged(animated = false)
        layers.rotations.clear()

        // A flat map turned, panned or zoomed: the map turns the beam itself.
        repeat(120) { motion.cameraMoved() }
        assertEquals(emptyList<Double>(), layers.rotations)

        // A tilted one, where the way on the screen strays from the compass's as it moves.
        layers.target = 31.5
        motion.cameraMoved()
        assertEquals(emptyList<Double>(), layers.rotations)
        layers.target = 32.5
        motion.cameraMoved()
        assertEquals(listOf(32.5), layers.rotations)
        layers.target = 33.4
        motion.cameraMoved()
        assertEquals(listOf(32.5), layers.rotations)
        // Stopped, it is exact.
        motion.cameraStopped()
        assertEquals(2, layers.rotations.size)
        assertEquals(33.4, layers.rotations.last(), 1e-9)
    }

    @Test
    fun aTurnEndsWhereTheMapShowsTheWayThen() {
        layers.breathing = false
        motion.beamChanged(animated = false)
        layers.target = 40.0
        layers.rotations.clear()
        motion.beamChanged(animated = true)
        run(60)
        // The tilted map moved meanwhile: the turn goes on, and ends where the beam now should be.
        layers.target = 44.0
        motion.cameraMoved()
        run(1_000)
        assertEquals(44.0, layers.rotations.last(), 0.0)
    }

    @Test
    fun theBeamHidesAndComesBackAtOnce() {
        layers.breathing = false
        motion.beamChanged(animated = false)
        layers.target = null
        motion.beamChanged(animated = true)
        motion.cameraMoved()
        assertEquals(listOf(true, false), layers.shown)

        layers.target = 120.0
        motion.beamChanged(animated = true)
        assertEquals(listOf(true, false, true), layers.shown)
        assertEquals(listOf(0.0, 120.0), layers.rotations)
        assertNull("no turn from hidden", layers.frameAt)
    }

    @Test
    fun theDotBreathesEvery66MsOnlyWhileItIsOnTheScreen() {
        layers.target = null
        motion.wake()
        run(1_000)
        // A frame each 66 ms or so, not each of the screen's sixty a second.
        assertTrue("$frames frames", frames in 10..16)
        assertTrue(layers.radii.size > 8)
        assertTrue(layers.radii.all { it < RiderArt.DOT_RADIUS + 0.01 && it > RiderArt.DOT_RADIUS * 0.85 - 0.01 })

        // The dot off the screen: no frame asked, and at rest full size.
        layers.breathing = false
        run(100)
        assertNull(layers.frameAt)
        frames = 0
        assertEquals(RiderArt.DOT_RADIUS, layers.radii.last(), 0.0)
        val written = layers.radii.size
        repeat(30) { motion.cameraMoved() }
        run(1_000)
        assertEquals(0, frames)
        assertEquals(written, layers.radii.size)

        // Back on the screen as the camera moves: it breathes again.
        layers.breathing = true
        motion.cameraMoved()
        run(500)
        assertTrue(layers.radii.size > written + 5)
    }

    @Test
    fun onAFlatMapTheBeamsRotationIsTheCompassWhateverWayTheMapIsTurned() {
        val place = GeoPoint(47.3769, 8.5417)
        val facing = ScooterUserHeading(trueHeading = 30.0, magneticHeading = 30.0, accuracy = 10.0)!!
        for (bearing in listOf(0.0, 45.0, 90.0, 200.0)) {
            val map = CameraMap(place, bearing = bearing, pitch = 0.0)
            assertEquals("bearing $bearing", 30.0, ScooterRider.beamRotation(facing, place, map)!!, 1e-6)
        }
    }

    @Test
    fun onATiltedMapTheMapsTurnAndTheBeamsRotationShowTheWayOnTheScreen() {
        val place = GeoPoint(47.3769, 8.5417)
        val facing = ScooterUserHeading(trueHeading = 45.0, magneticHeading = 45.0, accuracy = 10.0)!!
        val map = CameraMap(place, bearing = 0.0, pitch = 50.0)
        val rotation = ScooterRider.beamRotation(facing, place, map)!!
        // MapLibre turns a symbol turned with the map as the map's east shows on the screen, its up a quarter turn
        // anticlockwise from that east, and then by the symbol's rotation, clockwise.
        val origin = map.point(place)
        val east = map.point(MapPoint(MapPoint(place).x + 100, MapPoint(place).y).coordinate)
        val eastTurn = Math.toDegrees(atan2(east.y - origin.y, east.x - origin.x))
        val drawn = eastTurn + rotation
        val way = Math.toDegrees(facing.screenAngle(at = place, on = map)!!)
        assertEquals(0.0, RiderMotion.shortest(drawn - way), 0.01)
        assertTrue("the tilt takes the way on the screen from the compass's", abs(RiderMotion.shortest(rotation - 45.0)) > 10)
    }

    /** A camera over [centre] at street level, turned to [bearing] and tilted by [pitch], in degrees. */
    private class CameraMap(val centre: GeoPoint, bearing: Double, pitch: Double) : ScooterMapProjection {
        private val perPoint = MapPoint.worldSize / (512 * 2.0.pow(17.0))
        private val middle = MapPoint(centre)
        private val turn = bearing * PI / 180
        private val tilt = pitch * PI / 180

        /** The camera's distance from what it looks at, in the screen's points. */
        private val distance = 1_000.0

        override val bounds = ScreenRect(0.0, 0.0, 390.0, 844.0)
        override val centerCoordinate: GeoPoint get() = centre
        override val visibleMapRect: MapRect get() = MapRect(middle.x, middle.y, 0.0, 0.0)

        override fun point(coordinate: GeoPoint): ScreenPoint {
            val mapPoint = MapPoint(coordinate)
            val east = (mapPoint.x - middle.x) / perPoint
            val north = -(mapPoint.y - middle.y) / perPoint
            val ahead = north * cos(turn) + east * sin(turn)
            val right = east * cos(turn) - north * sin(turn)
            val depth = ahead * sin(tilt) + distance
            return ScreenPoint(bounds.midX + distance * right / depth, bounds.midY - distance * ahead * cos(tilt) / depth)
        }

        override fun coordinate(point: ScreenPoint): GeoPoint = centre
    }

    private companion object {
        const val VSYNC = 16L
    }
}
