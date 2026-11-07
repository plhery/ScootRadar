package com.plhery.scootradar.map

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.easing
import com.plhery.scootradar.ui.theme.iosShadow

// The callout MapKit shows over the searched place's pin, which canShowCallout gives it, from
// ios/ScootRadar/Views/ScooterMapView.swift:1576-1587 (map.md MAP-033, MAP-270).

/**
 * MapKit's callout over the searched place's pin, once a tap has selected the pin: a bubble with the place's [title]
 * on one line, its arrow on the top of the pin at [anchor] (in the map's points, read as the map moves). It keeps
 * inside the map as far as its arrow can stay under its straight edge, and leaves the map with the pin. It pops in, at
 * once under Remove animations. It takes the taps on it, the arrow's too, as MapKit's does, so that they don't close
 * it. A faded scooter's tip is drawn so too, with a [subtitle] under its title, in MapKit's callout's secondary
 * colour, and hangs [below] its dot, pointing up at it, where it would reach above the room the map has over it
 * ([CalloutPlacement]).
 */
@Composable
fun PinCallout(
    title: String,
    anchor: () -> ScreenPoint,
    dark: Boolean,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    below: () -> CalloutBelow? = { null },
) {
    val fill = if (dark) Color(0xFF2C2C2E) else Color.White
    val ink = if (dark) Color.White else Color.Black
    val shape = RoundedCornerShape(CORNER.dp)
    // MapKit doesn't say how its callout pops in; a fifth of a second, from a little smaller.
    val reduceMotion = LocalReduceMotion.current
    val shown = remember(title) { Animatable(if (reduceMotion) 1f else 0f) }
    LaunchedEffect(shown) { shown.animateTo(1f, tween(POP_MILLIS, easing = IosMotion.easeInOut.easing)) }
    // The foot it points up at once placed under it, which it pops in from then: read as it is drawn, not composed.
    val hung = remember { Hung() }
    Layout(
        content = {
            Canvas(Modifier.size(ARROW_WIDTH.dp, ARROW_HEIGHT.dp).pointerInput(Unit) { detectTapGestures {} }) {
                val arrow = Path().apply {
                    moveTo(0f, 0f)
                    lineTo(size.width, 0f)
                    lineTo(size.width / 2, size.height)
                    close()
                }
                drawPath(arrow, fill)
            }
            Box(
                Modifier
                    .testTag(CALLOUT_TAG)
                    .iosShadow(shape, Color.Black.copy(alpha = 0.18f), radius = 8.dp, y = 2.dp)
                    .background(fill, shape)
                    .pointerInput(Unit) { detectTapGestures {} }
                    .padding(horizontal = 12.dp, vertical = 11.dp),
            ) {
                if (subtitle == null) {
                    Text(title, style = ScootType.headline, color = ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
                } else {
                    Column {
                        Text(title, style = ScootType.headline, color = ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        // UIKit's secondaryLabel.
                        val secondary = if (dark) Color(0x99EBEBF5) else Color(0x993C3C43)
                        Text(subtitle, style = ScootType.subheadline, color = secondary, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    }
                }
            }
        },
        modifier = modifier.graphicsLayer {
            val point = hung.foot ?: anchor()
            val scale = POP_FROM + (1 - POP_FROM) * shown.value
            alpha = shown.value
            scaleX = scale
            scaleY = scale
            if (size.width > 0 && size.height > 0) {
                transformOrigin = TransformOrigin(point.x.dp.toPx() / size.width, point.y.dp.toPx() / size.height)
            }
        },
    ) { measurables, constraints ->
        val margin = MARGIN.dp.roundToPx()
        val arrow = measurables[0].measure(Constraints())
        val bubble = measurables[1].measure(Constraints(maxWidth = (constraints.maxWidth - 2 * margin).coerceAtLeast(0)))
        layout(constraints.maxWidth, constraints.maxHeight) {
            // Read as the map moves: the callout is placed again, not composed again.
            val point = anchor()
            val under = below()
            val placed = CalloutPlacement.place(
                x = point.x.dp.roundToPx(),
                tip = (point.y - GAP).dp.roundToPx(),
                tipBelow = under?.let { (it.foot.y + GAP).dp.roundToPx() },
                ceiling = under?.let { it.ceiling.dp.roundToPx() },
                bubble = IntSize(bubble.width, bubble.height),
                arrow = IntSize(arrow.width, arrow.height),
                width = constraints.maxWidth,
                margin = margin,
                corner = CORNER.dp.roundToPx(),
            )
            hung.foot = if (placed.isBelow) under?.foot else null
            bubble.place(placed.bubble)
            // The arrow over the bubble's shadow, and over its edge, so that no seam shows between them; under the
            // dot, it points up.
            if (placed.isBelow) arrow.placeWithLayer(placed.arrow) { rotationZ = 180f } else arrow.place(placed.arrow)
        }
    }
}

/**
 * Where a callout may go instead, under what it points at, in the map's points: the [foot] of what it points at, which
 * its arrow then points up at, and the [ceiling], the top of the room the map has above it, under the status bar and
 * the chrome at its top.
 */
data class CalloutBelow(val foot: ScreenPoint, val ceiling: Double)

/** The foot a callout points up at, while it is placed under it: it pops in from there. */
private class Hung {
    var foot: ScreenPoint? = null
}

/**
 * Where a callout's bubble and arrow go, in pixels, about the arrow's [tip] over what it points at, at [x]: the bubble
 * over the arrow, inside the map's [width] by [margin] as far as the arrow can stay under its straight edge, clear of
 * its [corner]s. Given [tipBelow], where the arrow's tip would be under what it points at, and the [ceiling] of the
 * room above, it goes under instead when its bubble would reach within [margin] of the ceiling, as the iPhone places a
 * faded scooter's tip (ScooterMapView.placeFadedTip): the arrow pointing up at it, the bubble under the arrow.
 */
internal object CalloutPlacement {
    data class Placed(val bubble: IntOffset, val arrow: IntOffset, val isBelow: Boolean)

    fun place(
        x: Int,
        tip: Int,
        tipBelow: Int?,
        ceiling: Int?,
        bubble: IntSize,
        arrow: IntSize,
        width: Int,
        margin: Int,
        corner: Int,
    ): Placed {
        val inside = (x - bubble.width / 2).coerceIn(margin, maxOf(margin, width - margin - bubble.width))
        // The arrow under the bubble's straight edge, clear of its rounded corners, wherever the pin is; a bubble
        // too narrow for that is centred on it.
        val reach = arrow.width / 2 + corner
        val lowest = x + reach - bubble.width
        val left = if (lowest <= x - reach) inside.coerceIn(lowest, x - reach) else x - bubble.width / 2
        val above = tip - arrow.height - bubble.height + 1
        if (tipBelow != null && ceiling != null && above < ceiling + margin) {
            return Placed(IntOffset(left, tipBelow + arrow.height - 1), IntOffset(x - arrow.width / 2, tipBelow), isBelow = true)
        }
        return Placed(IntOffset(left, above), IntOffset(x - arrow.width / 2, tip - arrow.height), isBelow = false)
    }
}

/** From the bubble to the map's sides, in points. */
private const val MARGIN = 8.0

/** From the arrow's tip to the top of the pin, in points. */
private const val GAP = 2.0

private const val CORNER = 12.0
private const val ARROW_WIDTH = 20.0
private const val ARROW_HEIGHT = 10.0
private const val POP_MILLIS = 200
private const val POP_FROM = 0.8f

/** The callout's tag. */
const val CALLOUT_TAG = "map-pin-callout"
