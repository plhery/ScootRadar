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
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.isFinite

/**
 * HeightLimit with ViewThatFits (ScooterControls.swift `fullContent`, SwissAddressSearch.swift): as tall as the
 * content, up to [maximum], and a scroll only while the content is taller. A plain stack while it fits draws its rows'
 * shapes whole and takes no drag of its own; without a limit nothing scrolls, as a scroll needs a height to fit in.
 * ViewThatFits takes its ScrollView in the layout pass the content outgrows the limit; the scroll here is chosen from
 * the last layout's height, so in that frame the content is cut at the limit as the scroll cuts it ([fitOrClip]), not
 * drawn whole past it. The swap has no animation of its own, as ViewThatFits has none (UI-212).
 */
@Composable
internal fun FitOrScroll(
    maximum: Dp,
    modifier: Modifier = Modifier,
    scroll: ScrollState = rememberScrollState(),
    content: @Composable ColumnScope.() -> Unit,
) {
    var contentHeight by remember { mutableIntStateOf(0) }
    val limit = if (maximum.isFinite) with(LocalDensity.current) { maximum.roundToPx() } else null
    val scrolls = limit != null && contentHeight > limit
    Column(
        if (limit == null) {
            modifier
        } else {
            modifier
                .heightIn(max = maximum)
                .then(if (scrolls) Modifier.verticalScroll(scroll) else Modifier)
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
