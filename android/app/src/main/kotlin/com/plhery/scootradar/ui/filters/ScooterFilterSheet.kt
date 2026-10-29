package com.plhery.scootradar.ui.filters

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dock
import com.plhery.scootradar.core.map.filterProviders
import com.plhery.scootradar.core.map.hasActiveFilters
import com.plhery.scootradar.core.map.showResultsTitle
import com.plhery.scootradar.core.model.ScooterBatteryFilter
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterNumberFormat
import com.plhery.scootradar.core.model.ScooterProviderEntry
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.ui.dock.FixedSymbol
import com.plhery.scootradar.ui.dock.chipAccessibilityLabel
import com.plhery.scootradar.ui.dock.plainButton
import com.plhery.scootradar.ui.rememberControllerChanges
import com.plhery.scootradar.ui.sheet.SheetBarButton
import com.plhery.scootradar.ui.sheet.SheetTitleBar
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.FocusRing
import com.plhery.scootradar.ui.theme.IosWeight
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SelectionFeedback
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.TextSize
import com.plhery.scootradar.ui.theme.TextSizeUpToAX1
import com.plhery.scootradar.ui.theme.iosShadow
import com.plhery.scootradar.ui.theme.monospacedDigit
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.shrinking
import com.plhery.scootradar.ui.theme.weight

// ScooterFilterSheet in ios/ScootRadar/Views/ScooterControls.swift: the filters a phone opens over the dock
// (ui.md UI-060, UI-062, UI-064 to UI-066, UI-175).

/**
 * Filters: the battery minimum and the providers shown, which change the map at once, with Reset in the bar and
 * the button that closes the sheet on what the map now shows.
 */
@Composable
fun ScooterFilterSheet(
    controller: ScooterMapController,
    bottomInset: Dp,
    onDone: () -> Unit,
    /** In a popover, which is as tall as the filters, not a sheet's height: ScooterFilterSheet's `inPopover`. */
    inPopover: Boolean = false,
) {
    val changes = rememberControllerChanges(controller)
    val minimumBattery by controller.minimumBattery.collectAsState()
    val hasActiveFilters = remember(controller, changes) { controller.hasActiveFilters }
    val entries = remember(controller, changes) { controller.filterProviders }
    val showResults = remember(controller, changes) {
        // While the answer for a new minimum is on its way there is no count to promise.
        if (controller.dock is ScooterDockContent.Finding) localized("Finding scooters…") else controller.showResultsTitle
    }
    // The dock ticks for the providers shown, which it shows under the sheet; the sheet for the battery (UI-217).
    SelectionFeedback(minimumBattery)
    FilterSheetContent(
        minimumBattery = minimumBattery.toInt(),
        entries = entries,
        hasActiveFilters = hasActiveFilters,
        showResults = showResults,
        bottomInset = bottomInset,
        onChooseMinimum = { controller.setMinimumBattery(it.toDouble()) },
        onToggle = { controller.toggle(it.provider) },
        onReset = controller::resetFilters,
        onDone = onDone,
        inPopover = inPopover,
    )
}

/** What the filter sheet shows, given what the map's filters are. */
@Composable
internal fun FilterSheetContent(
    minimumBattery: Int,
    entries: List<ScooterProviderEntry>,
    hasActiveFilters: Boolean,
    /** "Show 12 scooters", or "Finding scooters…". */
    showResults: String,
    bottomInset: Dp,
    onChooseMinimum: (Int) -> Unit,
    onToggle: (ScooterProviderEntry) -> Unit,
    onReset: () -> Unit,
    onDone: () -> Unit,
    /** As tall as the filters, up to the room it is given, rather than all of it: the list scrolls only past that. */
    inPopover: Boolean = false,
) {
    val colors = scootColors
    Column(if (inPopover) Modifier.fillMaxWidth() else Modifier.fillMaxSize()) {
        SheetTitleBar(
            title = localized("Filters"),
            trailing = { SheetBarButton(localized("Reset"), onClick = onReset, enabled = hasActiveFilters) },
        )
        Column(
            Modifier
                .weight(1f, fill = !inPopover)
                .verticalScroll(rememberScrollState())
                .padding(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(22.dp),
        ) {
            BatteryFilters(minimumBattery, onChoose = onChooseMinimum)
            ProviderFilters(entries, onToggle = onToggle)
        }
        // The list ends above the button instead of showing through and under it, and fades out just above it.
        Box(Modifier.zIndex(1f).background(colors.systemGroupedBackground).padding(bottom = bottomInset)) {
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(FADE)
                    .align(Alignment.TopCenter)
                    .layoutAbove(FADE)
                    .background(Brush.verticalGradient(listOf(colors.systemGroupedBackground.copy(alpha = 0f), colors.systemGroupedBackground))),
            )
            ShowResultsButton(showResults, onDone)
        }
    }
}

/** The room the list fades out in above Show results. */
private val FADE = 14.dp

@Composable
private fun BatteryFilters(minimum: Int, onChoose: (Int) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        SectionHeader(localized("Battery"))
        val isAccessibility = TextSize.isAccessibility
        val group = Modifier
            .fillMaxWidth()
            .background(scootColors.tertiarySystemFill, SquircleShape(16.dp))
            .padding(4.dp)
            // A group under the "Battery" heading, as iOS's `.accessibilityElement(children: .contain)`: no stop of its own.
            .selectableGroup()
        // Side by side; one above the other when the text is very large.
        if (isAccessibility) {
            Column(group, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                ScooterBatteryFilter.presets.forEach { BatteryPreset(it, it == minimum, Modifier.fillMaxWidth(), onChoose) }
            }
        } else {
            Row(group, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                ScooterBatteryFilter.presets.forEach { BatteryPreset(it, it == minimum, Modifier.weight(1f), onChoose) }
            }
        }
        if (minimum > 0) {
            Text(
                localized("Scooters without battery info are hidden while a minimum is set."),
                style = ScootType.footnote,
                color = scootColors.secondaryText,
                modifier = Modifier.padding(horizontal = 4.dp),
            )
        }
    }
}

/**
 * How far the label of a battery preset may shrink to stay on one line. 0.75 on the iPhone, whose narrowest is 375
 * points wide: on a 360 dp phone, in the sheet at its medium height, "Indifférent" at 1.3 needs 0.7.
 */
internal const val PRESET_MINIMUM_SCALE = 0.7f

/** A battery preset's label: "Any" in the language shown, "30%+" the same in every one. */
internal fun batteryPresetLabel(preset: Int): String = ScooterBatteryFilter.label(preset)

/** The style a preset's label is drawn in, chosen or not. */
internal fun batteryPresetStyle(selected: Boolean) =
    ScootType.subheadline.weight(if (selected) IosWeight.semibold else IosWeight.regular).monospacedDigit()

@Composable
private fun BatteryPreset(preset: Int, selected: Boolean, modifier: Modifier, onChoose: (Int) -> Unit) {
    val colors = scootColors
    // The raised segment of the chosen minimum, as in a segmented control.
    val raised = if (colors.isDark) colors.systemGray2 else Color.White
    val segment = SquircleShape(12.dp)
    Box(
        modifier
            .heightIn(min = 44.dp)
            .then(
                if (selected) {
                    Modifier.iosShadow(segment, Color.Black.copy(alpha = 0.1f), radius = 2.dp, y = 1.dp).background(raised, segment)
                } else {
                    Modifier
                },
            )
            .selectable(
                selected = selected,
                interactionSource = null,
                indication = FocusRing(segment),
                role = Role.RadioButton,
                onClick = { onChoose(preset) },
            )
            .semantics {
                contentDescription = if (preset == 0) {
                    localized("Any")
                } else {
                    stringFormat(localized("%lld percent or more"), preset.toLong())
                }
            },
        contentAlignment = Alignment.Center,
    ) {
        // "Indifférent" outgrows its segment before the presets stack: it shrinks a little rather than break in the
        // middle of the word.
        val style = batteryPresetStyle(selected)
        Text(
            batteryPresetLabel(preset),
            style = style,
            color = colors.label,
            maxLines = 1,
            softWrap = false,
            textAlign = TextAlign.Center,
            autoSize = shrinking(style, PRESET_MINIMUM_SCALE),
            modifier = Modifier.clearAndSetSemantics { },
        )
    }
}

@Composable
private fun ProviderFilters(entries: List<ScooterProviderEntry>, onToggle: (ScooterProviderEntry) -> Unit) {
    val colors = scootColors
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        SectionHeader(localized("Providers"))
        Column(Modifier.fillMaxWidth().background(colors.secondarySystemGroupedBackground, SquircleShape(16.dp))) {
            if (entries.isEmpty()) {
                // No provider operates in this part of the map.
                Box(Modifier.fillMaxWidth().heightIn(min = 56.dp).padding(horizontal = 14.dp), contentAlignment = Alignment.CenterStart) {
                    Text(localized("No scooter data here yet"), style = ScootType.subheadline, color = colors.secondaryText)
                }
            }
            entries.forEachIndexed { index, entry ->
                ProviderRow(entry, onClick = { onToggle(entry) })
                if (index < entries.lastIndex) {
                    Box(Modifier.padding(start = 62.dp).fillMaxWidth().height(0.5.dp).background(colors.separator))
                }
            }
        }
    }
}

@Composable
private fun ProviderRow(entry: ScooterProviderEntry, onClick: () -> Unit) {
    val colors = scootColors
    val title = entry.provider.displayName
    val label = chipAccessibilityLabel(if (entry.isDown) entry.downLabel else title, entry.count, entry.isDown)
    val state = if (entry.isEnabled) localized("Shown") else localized("Hidden")
    Row(
        Modifier
            .fillMaxWidth()
            .plainButton(onClick = onClick)
            .clearAndSetSemantics {
                contentDescription = label
                stateDescription = state
                role = Role.Button
                onClick { onClick(); true }
            }
            .heightIn(min = 56.dp)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Dark initials on a tint of the provider's colour, never white on the colour itself.
        val initials = ScootType.footnote.weight(IosWeight.bold)
        Box(
            Modifier
                .size(36.dp)
                .background(
                    if (entry.isDown) colors.secondaryLabel.copy(alpha = 0.14f) else colors.providerAccent(entry.provider).copy(alpha = 0.2f),
                    SquircleShape(10.dp),
                ),
            contentAlignment = Alignment.Center,
        ) {
            // The tile keeps its size, so with very large text the initials shrink to fit.
            Text(
                entry.provider.shortName,
                style = initials,
                color = if (entry.isDown) colors.secondaryText else colors.label,
                maxLines = 1,
                softWrap = false,
                autoSize = shrinking(initials, 0.4f),
            )
        }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(title, style = ScootType.body.weight(IosWeight.medium), color = if (entry.isDown) colors.secondaryText else colors.label)
            if (entry.isDown) {
                Text(localized("Not sharing data right now"), style = ScootType.caption, color = colors.warning)
            }
        }
        // Spacer(minLength: 8), between the row's own spacing.
        Spacer(Modifier.width(8.dp))
        if (!entry.isDown) {
            // `.contentTransition(.numericText())` rolls a number only when it changes inside an animation, and
            // nothing in the iPhone's sheet animates the counts: they change in place there, as here.
            Text(
                ScooterNumberFormat.integer(entry.count.toLong(), ScooterLanguage.current.locale),
                style = ScootType.subheadline.monospacedDigit(),
                color = colors.secondaryText,
                maxLines = 1,
            )
        }
        ProviderCheck(entry, Modifier.size(26.dp))
    }
}

/** A check for a provider that is shown, an empty circle for one that is hidden, a dashed circle for one chosen that shares no data. */
@Composable
private fun ProviderCheck(entry: ScooterProviderEntry, modifier: Modifier) {
    val colors = scootColors
    Box(modifier, contentAlignment = Alignment.Center) {
        when {
            !entry.isEnabled -> FixedSymbol(Symbols.circle, 22f, colors.secondaryText)
            entry.isDown -> Box(
                Modifier
                    .padding(2.dp)
                    .size(22.dp)
                    .drawBehind {
                        val width = 1.5.dp.toPx()
                        drawCircle(
                            colors.secondaryText,
                            radius = (size.minDimension - width) / 2,
                            style = Stroke(width, pathEffect = PathEffect.dashPathEffect(floatArrayOf(3.5.dp.toPx(), 3.dp.toPx()))),
                        )
                    },
            )
            else -> FixedSymbol(Symbols.checkCircleFill, 22f, colors.actionFill)
        }
    }
}

@Composable
private fun ShowResultsButton(title: String, onClick: () -> Unit) {
    // The button stays over the list, so its text stops growing before it covers it.
    TextSizeUpToAX1 {
        Box(
            Modifier
                .padding(horizontal = 20.dp, vertical = 8.dp)
                .fillMaxWidth()
                .heightIn(min = 50.dp)
                .background(scootColors.actionFill, CapsuleShape)
                .plainButton(onClick = onClick)
                .padding(horizontal = 20.dp, vertical = 14.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(title, style = ScootType.headline, color = Color.White, textAlign = TextAlign.Center)
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        title,
        style = ScootType.subheadline.weight(IosWeight.semibold),
        color = scootColors.secondaryText,
        modifier = Modifier.padding(horizontal = 4.dp).semantics { heading() },
    )
}

/** Draws the element [height] above where it is laid out, taking no room: the fade over the list's end. */
private fun Modifier.layoutAbove(height: Dp): Modifier = layout { measurable, constraints ->
    val placeable = measurable.measure(constraints)
    layout(placeable.width, 0) { placeable.place(0, -height.roundToPx()) }
}
