package com.plhery.scootradar.map

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
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
 * it.
 */
@Composable
fun PinCallout(title: String, anchor: () -> ScreenPoint, dark: Boolean, modifier: Modifier = Modifier) {
    val fill = if (dark) Color(0xFF2C2C2E) else Color.White
    val ink = if (dark) Color.White else Color.Black
    val shape = RoundedCornerShape(CORNER.dp)
    // MapKit doesn't say how its callout pops in; a fifth of a second, from a little smaller.
    val reduceMotion = LocalReduceMotion.current
    val shown = remember(title) { Animatable(if (reduceMotion) 1f else 0f) }
    LaunchedEffect(shown) { shown.animateTo(1f, tween(POP_MILLIS, easing = IosMotion.easeInOut.easing)) }
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
                Text(title, style = ScootType.headline, color = ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        },
        modifier = modifier.graphicsLayer {
            val point = anchor()
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
            val x = point.x.dp.roundToPx()
            val tip = (point.y - GAP).dp.roundToPx()
            val inside = (x - bubble.width / 2).coerceIn(margin, maxOf(margin, constraints.maxWidth - margin - bubble.width))
            // The arrow under the bubble's straight edge, clear of its rounded corners, wherever the pin is; a bubble
            // too narrow for that is centred on it.
            val reach = arrow.width / 2 + CORNER.dp.roundToPx()
            val lowest = x + reach - bubble.width
            val left = if (lowest <= x - reach) inside.coerceIn(lowest, x - reach) else x - bubble.width / 2
            bubble.place(left, tip - arrow.height - bubble.height + 1)
            // The arrow over the bubble's shadow, and over its bottom edge, so that no seam shows between them.
            arrow.place(x - arrow.width / 2, tip - arrow.height)
        }
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
