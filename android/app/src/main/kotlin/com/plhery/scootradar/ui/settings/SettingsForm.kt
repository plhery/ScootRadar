package com.plhery.scootradar.ui.settings

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.ui.dock.FixedSymbol
import com.plhery.scootradar.ui.dock.SymbolIcon
import com.plhery.scootradar.ui.dock.plainButton
import com.plhery.scootradar.ui.dock.textSymbolSize
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.IosWeight
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.iosShadow
import com.plhery.scootradar.ui.theme.monospacedDigit
import com.plhery.scootradar.ui.theme.motion
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight
import kotlin.math.roundToInt

// SwiftUI's Form as iOS 26 draws it in a sheet, with its Toggle, Stepper and Label, and ExternalLinkRow in
// ios/ScootRadar/Views/ScooterControls.swift (ui.md UI-088, UI-404).

/**
 * A section of a form: its [header], what stands on the sheet itself ([bare], the tiles), the rounded group of
 * [rows] with a hairline between them that starts where their text does, [separatorInset] in, and its [footer].
 */
@Composable
internal fun FormSection(
    header: String? = null,
    footer: String? = null,
    separatorInset: Dp = ROW_PADDING,
    bare: (@Composable ColumnScope.() -> Unit)? = null,
    rows: List<@Composable () -> Unit> = emptyList(),
) {
    val colors = scootColors
    Column(Modifier.fillMaxWidth().padding(horizontal = SECTION_MARGIN).padding(top = SECTION_GAP)) {
        if (header != null) {
            Text(
                header,
                style = ScootType.subheadline.weight(IosWeight.semibold),
                color = colors.secondaryLabel,
                modifier = Modifier.padding(start = ROW_PADDING, end = ROW_PADDING, bottom = 8.dp).semantics { heading() },
            )
        }
        bare?.invoke(this)
        if (rows.isNotEmpty()) {
            // Each row of a list draws its own ground, rounded where it ends the section: under a clear row, the
            // next one's top corners stay square.
            val shape = if (bare != null) {
                RoundedCornerShape(bottomStart = SECTION_RADIUS, bottomEnd = SECTION_RADIUS)
            } else {
                SquircleShape(SECTION_RADIUS)
            }
            Column(Modifier.fillMaxWidth().clip(shape).background(colors.secondarySystemGroupedBackground)) {
                rows.forEachIndexed { index, row ->
                    row()
                    if (index < rows.lastIndex) FormSeparator(separatorInset)
                }
            }
        }
        if (footer != null) {
            Text(
                footer,
                style = ScootType.footnote,
                color = colors.secondaryLabel,
                modifier = Modifier.padding(start = ROW_PADDING, end = ROW_PADDING, top = 8.dp),
            )
        }
    }
}

@Composable
private fun FormSeparator(inset: Dp) {
    Box(Modifier.padding(start = inset).fillMaxWidth().height(0.5.dp).background(scootColors.separator))
}

/**
 * A row of the list, at least as tall as iOS 26's. A tap acts on [onClick], and the row greys under the finger as
 * a list's cell does; [selected] makes it one of a group of choices for TalkBack.
 */
@Composable
internal fun FormRow(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    selected: Boolean? = null,
    content: @Composable RowScope.() -> Unit,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val highlight = if (scootColors.isDark) CELL_HIGHLIGHT_DARK else CELL_HIGHLIGHT_LIGHT
    val press = when {
        onClick == null -> Modifier
        selected != null -> Modifier.selectable(selected, interaction, indication = null, role = Role.RadioButton, onClick = onClick)
        else -> Modifier.clickable(interaction, indication = null, role = Role.Button, onClick = onClick)
    }
    Row(
        modifier
            .fillMaxWidth()
            .drawBehind { if (pressed) drawRect(highlight) }
            .then(press)
            .heightIn(min = ROW_HEIGHT)
            .padding(horizontal = ROW_PADDING, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        content = content,
    )
}

/** A NavigationLink's row: its label, and the chevron that says it opens a page. */
@Composable
internal fun FormNavigationRow(onClick: () -> Unit, label: @Composable RowScope.() -> Unit) {
    FormRow(onClick = onClick) {
        label()
        FixedSymbol(Symbols.chevronRight, 13f, scootColors.tertiaryLabel, Modifier.clearAndSetSemantics { })
    }
}

/**
 * LabeledContent's row, as UIKit's value cell lays it out: [label] at the start and [value] at the end where both
 * fit on one line whole, else the value under the label, as at the largest text sizes.
 */
@Composable
internal fun FormValueRow(label: @Composable () -> Unit, onClick: (() -> Unit)? = null, value: @Composable () -> Unit) {
    FormRow(onClick = onClick) {
        Layout(content = { Box { label() }; Box { value() } }, modifier = Modifier.weight(1f)) { (start, end), constraints ->
            val width = constraints.maxWidth
            val gap = 8.dp.roundToPx()
            val loose = constraints.copy(minWidth = 0, minHeight = 0)
            val inLine = start.maxIntrinsicWidth(Constraints.Infinity) + gap + end.maxIntrinsicWidth(Constraints.Infinity) <= width
            if (inLine) {
                val valuePlaceable = end.measure(loose)
                val labelPlaceable = start.measure(loose.copy(maxWidth = width - gap - valuePlaceable.width))
                val height = maxOf(labelPlaceable.height, valuePlaceable.height)
                layout(width, height) {
                    labelPlaceable.place(0, (height - labelPlaceable.height) / 2)
                    valuePlaceable.place(width - valuePlaceable.width, (height - valuePlaceable.height) / 2)
                }
            } else {
                val labelPlaceable = start.measure(loose)
                val valuePlaceable = end.measure(loose)
                val below = labelPlaceable.height + 4.dp.roundToPx()
                layout(width, below + valuePlaceable.height) {
                    labelPlaceable.place(0, 0)
                    valuePlaceable.place(0, below)
                }
            }
        }
    }
}

/** `Label(title, systemImage:)` in a list: the symbol in the app's tint, in a column of its own, then the text. */
@Composable
internal fun RowScope.FormLabel(title: String, symbol: ImageVector, detail: String? = null) {
    Box(Modifier.width(LABEL_ICON), contentAlignment = Alignment.Center) {
        SymbolIcon(symbol, textSymbolSize(17f), scootColors.accent, Modifier.clearAndSetSemantics { })
    }
    FormText(title, Modifier.padding(start = LABEL_GAP - 8.dp).weight(1f), detail)
}

/** A row's text, with a smaller grey line under it. */
@Composable
internal fun FormText(title: String, modifier: Modifier = Modifier, detail: String? = null) {
    FormText(AnnotatedString(title), modifier, detail)
}

@Composable
internal fun FormText(
    title: AnnotatedString,
    modifier: Modifier = Modifier,
    detail: String? = null,
    detailStyle: Detail = Detail.Footnote,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(title, style = ScootType.body, color = scootColors.label)
        if (detail != null) {
            Text(
                detail,
                style = if (detailStyle == Detail.Footnote) ScootType.footnote else ScootType.subheadline,
                color = scootColors.secondaryLabel,
            )
        }
    }
}

/** The size of the grey line under a row's text: footnote under a link, subheadline under a choice. */
internal enum class Detail { Footnote, Subheadline }

/** ExternalLinkRow: a row that leaves the app, its text and an arrow that says so. */
@Composable
internal fun ExternalLinkRow(title: String, onOpen: () -> Unit, detail: String? = null, symbol: ImageVector? = null) {
    FormRow(onClick = onOpen) {
        if (symbol != null) FormLabel(title, symbol, detail) else FormText(title, Modifier.weight(1f), detail)
        FixedSymbol(Symbols.arrowUpRight, 13f, scootColors.tertiaryLabel, Modifier.clearAndSetSemantics { })
    }
}

/** A Toggle's row: its title, and the switch at the end; TalkBack reads the two as one switch. */
@Composable
internal fun FormToggleRow(title: String, isOn: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .toggleable(value = isOn, interactionSource = null, indication = null, role = Role.Switch, onValueChange = onChange)
            .heightIn(min = ROW_HEIGHT)
            .padding(horizontal = ROW_PADDING, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(title, style = ScootType.body, color = scootColors.label, modifier = Modifier.weight(1f))
        IosSwitch(isOn)
    }
}

/** UISwitch, 51 by 31 points, in the app's blue when on (UI-404). The row it is in takes the taps. */
@Composable
internal fun IosSwitch(isOn: Boolean, modifier: Modifier = Modifier) {
    val colors = scootColors
    val spring = IosMotion.snappy(duration = 0.3)
    val track by animateColorAsState(if (isOn) colors.accent else switchOff(colors.isDark), motion(spring), label = "track")
    val knob by animateDpAsState(if (isOn) SWITCH_WIDTH - SWITCH_KNOB - 2.dp else 2.dp, motion(spring), label = "knob")
    Box(
        modifier
            .size(SWITCH_WIDTH, SWITCH_HEIGHT)
            .background(track, CapsuleShape)
            .clearAndSetSemantics { },
        contentAlignment = Alignment.CenterStart,
    ) {
        Box(
            Modifier
                .offset { IntOffset(knob.roundToPx(), 0) }
                .size(SWITCH_KNOB)
                .iosShadow(CapsuleShape, Color.Black.copy(alpha = 0.15f), radius = 8.dp, y = 3.dp)
                .iosShadow(CapsuleShape, Color.Black.copy(alpha = 0.06f), radius = 1.dp, y = 3.dp)
                .background(Color.White, CapsuleShape),
        )
    }
}

/** The track of a switch that is off: UIKit's grey, which the sheet shows a little through. */
private fun switchOff(dark: Boolean): Color = if (dark) Color(0x52787880) else Color(0x29787880)

/**
 * A Stepper's row: [title] and [valueText] on one side, the − and + buttons on the other, moving [value] in steps
 * of [step] within [range]. TalkBack reads it as one control that swipes up and down move.
 */
@Composable
internal fun FormStepperRow(title: String, value: Int, valueText: String, range: IntRange, step: Int, onChange: (Int) -> Unit) {
    val colors = scootColors
    FormRow(
        Modifier.semantics(mergeDescendants = true) {
            contentDescription = title
            stateDescription = valueText
            progressBarRangeInfo = ProgressBarRangeInfo(
                value.toFloat(),
                range.first.toFloat()..range.last.toFloat(),
                steps = (range.last - range.first) / step - 1,
            )
            setProgress { target ->
                val next = ((target / step).roundToInt() * step).coerceIn(range.first, range.last)
                if (next != value) onChange(next)
                true
            }
        },
    ) {
        Text(title, style = ScootType.body, color = colors.label, modifier = Modifier.weight(1f).clearAndSetSemantics { })
        Text(valueText, style = ScootType.body.monospacedDigit(), color = colors.secondaryLabel, modifier = Modifier.clearAndSetSemantics { })
        Row(
            Modifier
                .padding(start = 8.dp)
                .height(32.dp)
                .background(colors.tertiarySystemFill, CapsuleShape)
                .clearAndSetSemantics { },
            verticalAlignment = Alignment.CenterVertically,
        ) {
            StepperHalf(Symbols.minus, enabled = value > range.first) { onChange((value - step).coerceAtLeast(range.first)) }
            Box(Modifier.width(1.dp).height(18.dp).background(colors.separator))
            StepperHalf(Symbols.plus, enabled = value < range.last) { onChange((value + step).coerceAtMost(range.last)) }
        }
    }
}

@Composable
private fun StepperHalf(symbol: ImageVector, enabled: Boolean, onClick: () -> Unit) {
    Box(
        Modifier.widthIn(min = 46.dp).height(32.dp).plainButton(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        FixedSymbol(symbol, 15f, if (enabled) scootColors.label else scootColors.tertiaryLabel)
    }
}

/** How far a section stands in from the sheet's edges. */
internal val SECTION_MARGIN = 16.dp

/** The room above a section, and its header. */
private val SECTION_GAP = 20.dp

private val SECTION_RADIUS = 26.dp

/** The text of a row from the edge of its group. */
internal val ROW_PADDING = 16.dp

private val ROW_HEIGHT = 52.dp

/** The column a label's symbol stands in, and the room after it. */
private val LABEL_ICON = 28.dp
private val LABEL_GAP = 14.dp

/** Where the text of a row with a label's symbol starts, for the hairline under it. */
internal val LABEL_TEXT_INSET = ROW_PADDING + LABEL_ICON + LABEL_GAP

/** A cell of a list under the finger: systemGray4. */
private val CELL_HIGHLIGHT_LIGHT = Color(0xFFD1D1D6)
private val CELL_HIGHLIGHT_DARK = Color(0xFF3A3A3C)

private val SWITCH_WIDTH = 51.dp
private val SWITCH_HEIGHT = 31.dp
private val SWITCH_KNOB = 27.dp
