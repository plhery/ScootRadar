package com.plhery.scootradar.core.model

import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

// CGPoint and CGRect, as CoreGraphics works them out, for what the map lays out in points.

/** A place in points, on screen or in any plane with the screen's scale and directions. */
data class ScreenPoint(val x: Double, val y: Double) {
    companion object {
        val zero = ScreenPoint(0.0, 0.0)
    }
}

/** A width and a height in points. */
data class ScreenSize(val width: Double, val height: Double)

/**
 * A rectangle in points from its origin, which is its top left corner while its size is positive. Where
 * CoreGraphics answers CGRect.null, the rectangle of nothing, these functions answer null.
 */
data class ScreenRect(val x: Double, val y: Double, val width: Double, val height: Double) {
    val minX: Double get() = min(x, x + width)
    val maxX: Double get() = max(x, x + width)
    val minY: Double get() = min(y, y + height)
    val maxY: Double get() = max(y, y + height)
    val midX: Double get() = x + width / 2
    val midY: Double get() = y + height / 2

    /** No width or no height. */
    val isEmpty: Boolean get() = width == 0.0 || height == 0.0

    /** Whether the point is in it: on its left or top edge, and not on its right or bottom one. */
    fun contains(point: ScreenPoint): Boolean =
        point.x >= minX && point.x < maxX && point.y >= minY && point.y < maxY

    /** The same rectangle with its origin at its top left corner, and its size positive. */
    val standardized: ScreenRect
        get() = if (width >= 0 && height >= 0) this else ScreenRect(minX, minY, abs(width), abs(height))

    fun offsetBy(dx: Double, dy: Double): ScreenRect = standardized.let { ScreenRect(it.x + dx, it.y + dy, it.width, it.height) }

    /**
     * Smaller by dx on the left and on the right and by dy at the top and at the bottom; larger where they are
     * negative. Null where nothing would be left.
     */
    fun insetBy(dx: Double, dy: Double): ScreenRect? {
        val rect = standardized
        val width = rect.width - 2 * dx
        val height = rect.height - 2 * dy
        if (width < 0 || height < 0) return null
        return ScreenRect(rect.x + dx, rect.y + dy, width, height)
    }

    /**
     * What the two have in common: no more than an edge where they only touch, and null where they do not
     * meet.
     */
    fun intersection(other: ScreenRect): ScreenRect? {
        val left = max(minX, other.minX)
        val right = min(maxX, other.maxX)
        val top = max(minY, other.minY)
        val bottom = min(maxY, other.maxY)
        if (right < left || bottom < top) return null
        return ScreenRect(left, top, right - left, bottom - top)
    }

    /**
     * Whether the two overlap. Each holds its left and top edges and not its right and bottom ones, so two
     * that only touch do not; a rectangle with no width or height is the line or the point it lies on.
     */
    fun intersects(other: ScreenRect): Boolean =
        overlap(minX, maxX, other.minX, other.maxX) && overlap(minY, maxY, other.minY, other.maxY)

    private fun overlap(firstMin: Double, firstMax: Double, secondMin: Double, secondMax: Double): Boolean {
        val start = max(firstMin, secondMin)
        return holds(start, firstMin, firstMax) && holds(start, secondMin, secondMax)
    }

    private fun holds(value: Double, min: Double, max: Double): Boolean =
        if (min == max) value == min else value >= min && value < max
}
