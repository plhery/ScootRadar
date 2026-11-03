package com.plhery.scootradar.ui

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.isFinite
import kotlin.math.min

/**
 * HeightLimit with ViewThatFits (ScooterControls.swift `fullContent`, SwissAddressSearch.swift): as tall as the
 * content, up to [maximum] or the room it is given if less, and a scroll only while the content is taller. A plain
 * stack while it fits draws its rows' shapes whole and takes no drag of its own; without a limit nothing scrolls, as a
 * scroll needs a height to fit in. The scroll starts at the top each time it comes, as ViewThatFits's ScrollView is a
 * view of its own. ViewThatFits takes its ScrollView in the layout pass the content outgrows its room; the scroll here
 * is chosen from the last layout's heights, so in that frame the content is cut where the scroll would cut it
 * ([fitOrClip]), not drawn whole past it. The swap has no animation of its own, as ViewThatFits has none (UI-212).
 *
 * While it scrolls, its content fades out over the last [EDGE_FADE] of its foot where there is more below, and over its
 * head where some has scrolled up, as an Android scroll's fading edges, more as more is past it. Cut plainly, the cut
 * could fall where a row's name doesn't show: in a 7-inch tablet's panel, 612 dp tall, the providers' list ended at Voi
 * with the top of PubliBike's row blank under it, and nothing said the card scrolled to a seventh. The iPhone's
 * ScrollView shows nothing either until it is scrolled (ScooterControls.swift:257-265).
 */
@Composable
internal fun FitOrScroll(maximum: Dp, modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    // The content's whole height and the room it is given, both from the last layout: under the notices in a short
    // window the panel's card has less room than its limit.
    var contentHeight by remember { mutableIntStateOf(0) }
    var room by remember { mutableIntStateOf(Constraints.Infinity) }
    val limit = if (maximum.isFinite) with(LocalDensity.current) { maximum.roundToPx() } else null
    val scrolls = limit != null && contentHeight > min(limit, room)
    val scroll = if (scrolls) rememberScrollState() else null
    Column(
        if (limit == null) {
            modifier
        } else {
            modifier
                .layout { measurable, constraints ->
                    room = constraints.maxHeight
                    val placeable = measurable.measure(constraints)
                    layout(placeable.width, placeable.height) { placeable.place(0, 0) }
                }
                .heightIn(max = maximum)
                .then(if (scroll != null) Modifier.fadingEdges(scroll).verticalScroll(scroll) else Modifier)
                .fitOrClip(clips = true)
                .layout { measurable, constraints ->
                    val placeable = measurable.measure(constraints)
                    contentHeight = placeable.height
                    layout(placeable.width, placeable.height) { placeable.place(0, 0) }
                }
        },
        content = content,
    )
}

/**
 * The scroll's head and foot fade where its content goes on past them: over [EDGE_FADE], or a quarter of the scroll's
 * height if that is less, to nothing at the edge once that much or more is past it, and less while less is.
 */
private fun Modifier.fadingEdges(scroll: ScrollState): Modifier =
    graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }
        .drawWithContent {
            drawContent()
            val length = min(EDGE_FADE.toPx(), size.height / 4)
            if (length <= 0f) return@drawWithContent
            val above = scroll.value.toFloat()
            val below = (scroll.maxValue - scroll.value).toFloat().coerceAtLeast(0f)
            if (above > 0f) {
                val edge = Color.Black.copy(alpha = 1 - min(1f, above / length))
                drawRect(
                    Brush.verticalGradient(0f to edge, 1f to Color.Black, startY = 0f, endY = length),
                    size = Size(size.width, length),
                    blendMode = BlendMode.DstIn,
                )
            }
            if (below > 0f && scroll.maxValue != Int.MAX_VALUE) {
                val edge = Color.Black.copy(alpha = 1 - min(1f, below / length))
                val top = size.height - length
                drawRect(
                    Brush.verticalGradient(0f to Color.Black, 1f to edge, startY = top, endY = size.height),
                    topLeft = Offset(0f, top),
                    size = Size(size.width, length),
                    blendMode = BlendMode.DstIn,
                )
            }
        }

/**
 * How far into a scroll's head or foot its content fades where there is more past it: a little more than a row of the
 * panel's providers, 44 dp, so the row the foot falls in or under fades through its name.
 */
internal val EDGE_FADE = 48.dp
