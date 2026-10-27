package com.plhery.scootradar.ui.dock

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dockLine
import com.plhery.scootradar.core.model.PartsFlow
import com.plhery.scootradar.core.model.ScooterDockLine
import com.plhery.scootradar.core.model.ScreenSize
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.rememberControllerChanges
import com.plhery.scootradar.ui.rememberNow
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.monospacedDigit
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight
import kotlin.math.ceil
import kotlin.math.roundToInt

// foldedLine, FoldedDockLine and PartsFlow in ios/ScootRadar/Views/ScooterControls.swift (ui.md UI-097, UI-098).

/**
 * The line a folded panel shows under its search bar, read again every 30 seconds so that "Updated 4 min ago"
 * keeps up. A tap on it opens the panel again, as the grabber does.
 */
@Composable
internal fun FoldedPanelLine(controller: ScooterMapController, modifier: Modifier = Modifier) {
    val changes = rememberControllerChanges(controller)
    val now = rememberNow(30)
    val line = remember(changes, now) { controller.dockLine(at = now) }
    Box(
        modifier
            .fillMaxWidth()
            .heightIn(min = 44.dp)
            .plainButton(label = line.accessibilityLabel, hint = localized("Expands the panel")) {
                controller.setPanelCollapsed(false)
            },
        contentAlignment = Alignment.CenterStart,
    ) {
        FoldedDockLine(line)
    }
}

/**
 * What the dock shows, in one line: its mark, a provider's dot, a spinner or a symbol, beside the first line of
 * text; then the parts, the first in bold, with a dot after each but the last, which stays at the end of a line
 * when the line wraps. The mark's column and the gap between parts grow with the text.
 */
@Composable
internal fun FoldedDockLine(line: ScooterDockLine, modifier: Modifier = Modifier) {
    val colors = scootColors
    val scale = LocalDensity.current.fontScale
    // ScaledMetric(relativeTo: .subheadline).
    val markWidth = (18 * scale).dp
    val lineHeight = (20 * scale).dp
    val dotSize = (10 * scale).dp
    val gap = (4 * scale).dp
    val parts = line.parts

    Row(modifier, horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Top) {
        Box(Modifier.sizeIn(minWidth = markWidth, minHeight = lineHeight).clearAndSetSemantics {}, contentAlignment = Alignment.Center) {
            when (val mark = line.mark) {
                is ScooterDockLine.Mark.Provider -> Box(Modifier.size(dotSize).clip(CircleShape).background(colors.providerAccent(mark.provider)))
                ScooterDockLine.Mark.Progress -> Spinner(SpinnerSize.Small)
                is ScooterDockLine.Mark.Symbol -> Symbols.named(mark.name)?.let {
                    SymbolIcon(it, textSymbolSize(13f), if (line.isWarning) colors.warning else colors.actionText)
                }
            }
        }
        PartsFlow(gap, Modifier.weight(1f)) {
            parts.forEachIndexed { index, part ->
                val isStatus = line.status != null && index == parts.lastIndex
                val text = buildAnnotatedString {
                    append(part)
                    if (index < parts.lastIndex) withStyle(SpanStyle(color = colors.dockQuiet)) { append("\u00A0·") }
                }
                Text(
                    text,
                    style = if (index == 0) ScootType.subheadline.weight(FontWeight.SemiBold).monospacedDigit() else ScootType.subheadline.monospacedDigit(),
                    color = when {
                        index == 0 -> colors.dockText
                        isStatus && line.status?.isWarning == true -> colors.warning
                        else -> colors.dockQuiet
                    },
                )
            }
        }
    }
}

/**
 * Lays out its parts as the words of a paragraph, as :core's [PartsFlow] places them: side by side while they fit,
 * and the next on a new row when it doesn't. A part is never broken, unless it is wider than a row on its own; it
 * then takes a row of its own and wraps inside it.
 */
@Composable
internal fun PartsFlow(spacing: Dp, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Layout(content, modifier) { measurables, constraints ->
        val width = if (constraints.hasBoundedWidth) constraints.maxWidth.toDouble() else Double.POSITIVE_INFINITY
        val oneLine = measurables.map {
            val ideal = it.maxIntrinsicWidth(Constraints.Infinity)
            ScreenSize(ideal.toDouble(), it.maxIntrinsicHeight(ideal).toDouble())
        }
        val frames = PartsFlow.frames(of = oneLine, width = width, spacing = spacing.toPx().toDouble()) { index, within ->
            ScreenSize(within, measurables[index].maxIntrinsicHeight(within.toInt()).toDouble())
        }
        val placeables = measurables.zip(frames) { measurable, frame ->
            measurable.measure(Constraints(maxWidth = ceil(frame.width).toInt(), maxHeight = ceil(frame.height).toInt()))
        }
        val right = ceil(frames.maxOfOrNull { it.maxX } ?: 0.0).toInt()
        val bottom = ceil(frames.maxOfOrNull { it.maxY } ?: 0.0).toInt()
        layout(constraints.constrainWidth(right), constraints.constrainHeight(bottom)) {
            placeables.zip(frames) { placeable, frame -> placeable.place(frame.x.roundToInt(), frame.y.roundToInt()) }
        }
    }
}
