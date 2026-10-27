package com.plhery.scootradar.ui.theme

import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.dropShadow
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.shadow.Shadow
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import kotlin.math.min

// SwiftUI's continuous corners, shadows and hairlines in ios/ScootRadar/Views (ui.md UI-352 to UI-355).

/**
 * `RoundedRectangle(cornerRadius:style: .continuous)`: Apple's corner, whose curve starts about 1.53 times the
 * radius from the corner and eases into the side with no visible break. Where a side is too short for that, the
 * radius shrinks until the curve fits; a radius of half the shorter side or more makes a capsule.
 */
@Immutable
class SquircleShape(private val radius: Dp) : Shape {
    override fun createOutline(size: Size, layoutDirection: LayoutDirection, density: Density): Outline {
        val half = min(size.width, size.height) / 2
        val wanted = with(density) { radius.toPx() }
        if (wanted >= half) return CapsuleShape.createOutline(size, layoutDirection, density)
        val r = min(wanted, half / EXTENT)
        if (r <= 0f) return Outline.Rectangle(size.toRect())
        return Outline.Generic(continuousRect(size.width, size.height, r))
    }

    override fun equals(other: Any?) = other is SquircleShape && other.radius == radius

    override fun hashCode() = radius.hashCode()

    override fun toString() = "SquircleShape($radius)"

    private companion object {
        /** How far from the corner the curve starts, in radii. */
        const val EXTENT = 1.52866483f
    }
}

/** `Capsule()`. */
val CapsuleShape = RoundedCornerShape(percent = 50)

private fun Size.toRect() = androidx.compose.ui.geometry.Rect(0f, 0f, width, height)

/**
 * The continuous rounded rectangle, corner by corner. Each corner is the same three curves, given as distances from
 * the corner along the two sides it joins.
 */
private fun continuousRect(width: Float, height: Float, r: Float): Path = Path().apply {
    // One corner, from the side it leaves to the side it joins: (along the first side, along the second).
    val points = floatArrayOf(
        1.52866483f, 0f,
        1.08849323f, 0f, 0.86840689f, 0f, 0.66993427f, 0.06549600f,
        0.63149399f, 0.07491100f,
        0.37282392f, 0.16905899f, 0.16905899f, 0.37282392f, 0.07491100f, 0.63149399f,
        0.06549600f, 0.66993427f,
        0f, 0.86840689f, 0f, 1.08849323f, 0f, 1.52866483f,
    )

    // The corner at (cx, cy), whose first side runs along (ax, ay) towards it and second along (bx, by) away from it.
    fun corner(cx: Float, cy: Float, ax: Float, ay: Float, bx: Float, by: Float, first: Boolean) {
        fun x(i: Int) = cx - ax * points[i] * r + bx * points[i + 1] * r
        fun y(i: Int) = cy - ay * points[i] * r + by * points[i + 1] * r
        if (first) moveTo(x(0), y(0)) else lineTo(x(0), y(0))
        cubicTo(x(2), y(2), x(4), y(4), x(6), y(6))
        lineTo(x(8), y(8))
        cubicTo(x(10), y(10), x(12), y(12), x(14), y(14))
        lineTo(x(16), y(16))
        cubicTo(x(18), y(18), x(20), y(20), x(22), y(22))
    }
    corner(width, 0f, 1f, 0f, 0f, 1f, first = true)
    corner(width, height, 0f, 1f, -1f, 0f, first = false)
    corner(0f, height, -1f, 0f, 0f, -1f, first = false)
    corner(0f, 0f, 0f, -1f, 1f, 0f, first = false)
    close()
}

/**
 * `.shadow(color:radius:x:y:)`. Core Animation's radius is the blur's standard deviation, about half of what Compose's
 * shadow (CSS's blur radius) takes.
 */
fun Modifier.iosShadow(shape: Shape, color: Color, radius: Dp, y: Dp = 0.dp, x: Dp = 0.dp): Modifier =
    dropShadow(shape, Shadow(radius = radius * 2, color = color, offset = DpOffset(x, y)))

/** A 1 pt `strokeBorder` in the hairline colour. */
fun Modifier.hairline(shape: Shape, color: Color, width: Dp = 1.dp): Modifier = border(width, color, shape)
