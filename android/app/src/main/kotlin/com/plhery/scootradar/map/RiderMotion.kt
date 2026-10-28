// The beam's turn and the dot's breath in time: ScooterUserLocationView's 0.18 s rotation, from
// ios/ScootRadar/Views/ScooterUserLocationView.swift, and MapKit's breathing dot (map.md MAP-187, MAP-193 to MAP-195).

package com.plhery.scootradar.map

import kotlin.math.abs
import kotlin.math.max

/**
 * When the rider's beam and dot are written to the map, apart from MapLibre: the beam's turn as the compass turns,
 * in a few steps over its 0.18 s, and the dot's breath, a step every 66 ms while the dot is on the screen. At rest,
 * or with the dot off the screen, no frame is asked for.
 *
 * The beam turns with the map, which turns it on the screen by the way its east shows at the dot, each frame and
 * on the GPU: a camera that moves needs nothing written while the map lies flat. Its rotation, written as a layout
 * of the rider's layers, is the compass's there; on a tilted map, where the way on the screen strays from it, it is
 * written again only once the beam shows 2° or more off the way the rider faces as the camera moves, and exactly
 * once it stops.
 */
internal class RiderMotion(
    private val rider: Rider,
    private val uptimeMillis: () -> Long,
    /** ScooterUserLocationView's ease-out, from a turn's progress to its share of the angle. */
    private val ease: (Float) -> Float,
) {
    /** The map's rider layers, and the frames that move them. */
    interface Rider {
        /**
         * The beam's rotation for the way the rider faces as the map shows it now, in degrees: the compass's own
         * where the map lies flat. Null while the beam hides: no heading, or a map that cannot show the way.
         */
        fun beamRotation(): Double?

        fun rotateBeam(degrees: Double)

        fun showBeam(shown: Boolean)

        fun setRadius(radius: Double)

        /** Whether the dot breathes now: on the screen, the map shown, with animations on (MAP-187). */
        fun breathes(): Boolean

        /** Asks for [RiderMotion.onFrame] at the first frame [delayMillis] from now. */
        fun frameAfter(delayMillis: Long)
    }

    /** The beam's rotation as written; null while it hides. */
    private var rotation: Double? = null
    private var turn: Turn? = null
    private var frameAsked = false
    private var lastBreath = 0L
    private var radius = RiderArt.DOT_RADIUS

    /**
     * The beam the way the rider faces: over 0.18 s from where it is if [animated], as the compass turns; at once
     * as the rider moves, or from hidden.
     */
    fun beamChanged(animated: Boolean) {
        val target = rider.beamRotation() ?: return hideBeam()
        val from = shownRotation()
        if (from == null) {
            turn = null
            rotate(target, tolerance = 0.0)
            rider.showBeam(true)
        } else if (animated) {
            turn = Turn(from, from + shortest(target - from), uptimeMillis())
            wake()
        } else if (turn == null) {
            rotate(target, tolerance = MIN_TURN)
        }
    }

    /**
     * The camera moved: the beam written again only where a tilted map shows it 2° or more off (a turn under way
     * takes the camera at its end), and the dot breathes again once it is back on the screen.
     */
    fun cameraMoved() {
        if (turn == null) {
            val target = rider.beamRotation()
            when {
                target == null -> hideBeam()
                rotation == null -> beamChanged(animated = false)
                else -> rotate(target, tolerance = CAMERA_DRIFT)
            }
        }
        wake()
    }

    /** The camera stopped: the beam exactly the way the rider faces. */
    fun cameraStopped() {
        if (turn == null) beamChanged(animated = false)
    }

    /** Asks for a frame if a turn or the breath wants one; at rest, the dot full size. */
    fun wake() {
        if (frameAsked) return
        val now = uptimeMillis()
        val turnStep = turn?.let { TURN_STEP_MILLIS - (now - it.start) % TURN_STEP_MILLIS }
        val breath = if (rider.breathes()) max(0, lastBreath + BREATH_STEP_MILLIS - now) else null
        val delay = listOfNotNull(turnStep, breath).minOrNull()
        if (delay == null) {
            setRadius(RiderArt.DOT_RADIUS)
            return
        }
        frameAsked = true
        rider.frameAfter(delay)
    }

    fun onFrame() {
        frameAsked = false
        val now = uptimeMillis()
        turn?.let { turn ->
            val progress = (now - turn.start).toFloat() / TURN_MILLIS
            if (progress >= 1) {
                this.turn = null
                // Its end as the map shows it now, which may have moved meanwhile.
                beamChanged(animated = false)
            } else {
                rotate(turn.at(ease(progress)), tolerance = TURN_STEP)
            }
        }
        // A few times a second is enough for a change this slow, and spares the map being drawn again each frame.
        if (rider.breathes() && now - lastBreath >= BREATH_STEP_MILLIS) {
            lastBreath = now
            setRadius(RiderArt.breathingRadius(now / 1000.0))
        }
        wake()
    }

    fun close() {
        turn = null
        frameAsked = false
    }

    /** The beam's rotation drawn now: where a turn under way has it, else as written. */
    private fun shownRotation(): Double? {
        val turn = turn ?: return rotation
        val progress = ((uptimeMillis() - turn.start).toFloat() / TURN_MILLIS).coerceIn(0f, 1f)
        return turn.at(ease(progress))
    }

    private fun hideBeam() {
        turn = null
        if (rotation == null) return
        rotation = null
        rider.showBeam(false)
    }

    /** Writes [degrees] unless the beam is already less than [tolerance] from it. */
    private fun rotate(degrees: Double, tolerance: Double) {
        val written = rotation
        if (written != null && abs(shortest(degrees - written)) < tolerance) return
        val normalized = (degrees % 360 + 360) % 360
        rotation = normalized
        rider.rotateBeam(normalized)
    }

    private fun setRadius(radius: Double) {
        if (abs(radius - this.radius) < 0.01) return
        this.radius = radius
        rider.setRadius(radius)
    }

    private data class Turn(val from: Double, val to: Double, val start: Long) {
        fun at(share: Float): Double = from + (to - from) * share
    }

    companion object {
        /** The beam's turn as the compass turns, in milliseconds: ScooterUserLocationView's 0.18 s ease-out. */
        const val TURN_MILLIS = 180f

        /** A turn's steps: four over its 0.18 s at most, each 2° on at least but its last. */
        const val TURN_STEP_MILLIS = 45L
        const val TURN_STEP = 2.0

        /** How far off the beam may show while the camera moves a tilted map, in degrees: the compass's own step. */
        const val CAMERA_DRIFT = 2.0

        /** The least change of the beam written at rest, in degrees. */
        const val MIN_TURN = 0.5

        const val BREATH_STEP_MILLIS = 66L

        /** The difference of two angles, in degrees, the short way round: from -180 to 180. */
        fun shortest(degrees: Double): Double = ((degrees % 360) + 540) % 360 - 180
    }
}
