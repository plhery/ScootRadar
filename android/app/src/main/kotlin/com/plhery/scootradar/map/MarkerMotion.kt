// The animations of ScooterAnnotationView.refreshLook, from ios/ScootRadar/Views/ScooterMapView.swift.

package com.plhery.scootradar.map

import androidx.compose.animation.core.Easing
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.ui.theme.easing
import kotlin.math.abs

/**
 * How a dot is drawn at a moment: its picture, how wide its dot is drawn, which while it eases is between two of
 * the pictures' widths, and its strength.
 */
data class DotDrawing(val art: ScooterMarkerArt.Key, val diameter: Double, val strength: Double) {
    /** The picture's scale, for its dot to be [diameter] wide. */
    val size: Double get() = diameter / art.diameter
}

/** A value easing to [to] from [from], over [length] seconds along [curve], from [start]. */
class MarkerEase<T>(val from: T, val to: T, val length: Double, val curve: Easing, val start: Double) {
    /** How far along its curve the ease is at [at], from 0 to 1. */
    fun progress(at: Double): Float = curve.transform(((at - start) / length).coerceIn(0.0, 1.0).toFloat())

    fun isOver(at: Double): Boolean = at >= start + length
}

/** The point an ease of points has got to at [at]. */
fun MarkerEase<ScreenPoint>.point(at: Double): ScreenPoint {
    val progress = progress(at)
    return ScreenPoint(from.x + (to.x - from.x) * progress, from.y + (to.y - from.y) * progress)
}

/**
 * A dot's look and place easing to what the scene gives it, as the iPhone's marker view eases them when its look is
 * drawn again, animated (MAP-097, MAP-098, MAP-309):
 * - Core Animation's implicit animations take the dot's strength and its picture's bounds from the old to the new,
 *   and cross-fade the old picture into the new, over 0.25 s along its default curve. A symbol of MapLibre draws one
 *   picture: its dot's width eases from the old to the new, and the new picture takes the old one's place once the
 *   cross-fade is half way, where the new picture starts to show the more of the two: 0.07 s in, as the curve is
 *   quick to start. A picture changed at the same width and strength, a dot taking the dark art, is changed at once.
 * - UIView.animate takes centerOffset, the dot's place in a spread, to its new one over 0.22 s, in and out.
 * What changes while the dot eases eases on from where it has got to; what changes at once, at a new scale, changes
 * at once here too.
 */
class DotMotion(drawing: DotDrawing, offset: ScreenPoint) {
    /** What the dot eases to. */
    var drawing = drawing
        private set
    var offset = offset
        private set

    private var look: MarkerEase<DotDrawing>? = null
    private var place: MarkerEase<ScreenPoint>? = null

    /** Takes the dot to a new look and place, eased from what is drawn now, or at once. */
    fun go(drawing: DotDrawing, offset: ScreenPoint, at: Double, animated: Boolean) {
        if (drawing != this.drawing) {
            val from = drawing(at)
            look = if (animated && eases(from, drawing)) MarkerEase(from, drawing, IosMotion.IMPLICIT_DURATION, implicit, at) else null
            this.drawing = drawing
        }
        if (offset != this.offset) {
            val from = offset(at)
            place = if (animated) MarkerEase(from, offset, SPREAD, easeInOut, at) else null
            this.offset = offset
        }
    }

    /** The dot as drawn at [at]. */
    fun drawing(at: Double): DotDrawing {
        val look = look ?: return drawing
        val progress = look.progress(at)
        val from = look.from
        val to = look.to
        return DotDrawing(
            art = if (progress < 0.5f) from.art else to.art,
            diameter = from.diameter + (to.diameter - from.diameter) * progress,
            strength = from.strength + (to.strength - from.strength) * progress,
        )
    }

    /** Where the dot is drawn from its scooter at [at]. */
    fun offset(at: Double): ScreenPoint = place?.point(at) ?: offset

    /** Whether the dot's place still eases at [at]: a name beside it goes with it. */
    fun moves(at: Double): Boolean = place?.isOver(at) == false

    /** Whether nothing eases any more at [at]: the dot can go back to its source's layers. */
    fun isOver(at: Double): Boolean = look?.isOver(at) != false && place?.isOver(at) != false

    companion object {
        /** UIView.animate(withDuration: 0.22), which moves a dot to its new place in a spread. */
        const val SPREAD = 0.22

        private val implicit = IosMotion.implicit.easing
        private val easeInOut = IosMotion.easeInOut.easing

        /** Whether a look changes in a way MapLibre can ease: a picture changed alone is changed at once. */
        fun eases(from: DotDrawing, to: DotDrawing): Boolean = from.diameter != to.diameter || from.strength != to.strength

        /**
         * Whether a dot at rest starts to ease to a new look: a change too small to see, as the rider's few metres
         * make in the dots around, is drawn at once, without its two hand-overs.
         */
        fun shows(from: DotDrawing, to: DotDrawing): Boolean =
            abs(from.diameter - to.diameter) >= LEAST_DIAMETER || abs(from.strength - to.strength) >= LEAST_STRENGTH

        /** A change of a dot's width, in points, and of its strength, that shows. */
        const val LEAST_DIAMETER = 1.0
        const val LEAST_STRENGTH = 0.1
    }
}
