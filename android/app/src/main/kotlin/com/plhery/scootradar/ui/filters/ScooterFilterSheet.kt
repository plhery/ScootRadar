package com.plhery.scootradar.ui.filters

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.indication
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalLayoutDirection
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
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dock
import com.plhery.scootradar.core.map.filterProviders
import com.plhery.scootradar.core.map.hasActiveFilters
import com.plhery.scootradar.core.map.showResultsTitle
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterNumberFormat
import com.plhery.scootradar.core.model.ScooterProviderEntry
import com.plhery.scootradar.core.model.ScooterRangeFilter
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.dock.SYMBOL_FRAME
import com.plhery.scootradar.ui.dock.SymbolIcon
import com.plhery.scootradar.ui.dock.bodyMetric
import com.plhery.scootradar.ui.dock.chipAccessibilityLabel
import com.plhery.scootradar.ui.dock.glassButton
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
import com.plhery.scootradar.ui.theme.iosShadow
import com.plhery.scootradar.ui.theme.monospacedDigit
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.shrinking
import com.plhery.scootradar.ui.theme.weight
import kotlin.math.roundToInt

// ScooterFilterSheet in ios/ScootRadar/Views/ScooterControls.swift: the filters a phone opens over the dock
// (ui.md UI-060, UI-062, UI-064 to UI-066, UI-175).

/**
 * Filters: the minimum range, the filters' only minimum, and the providers shown, which change the map at once, with
 * Reset in the bar and the button that closes the sheet on what the map now shows.
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
    val minimumRange by controller.minimumRange.collectAsState()
    // The range's steps are in the units lengths are written in, on Automatic the phone's region's, which may
    // change while the filters are open.
    val language by controller.language.collectAsState()
    val units by controller.units.collectAsState()
    val locales = LocalConfiguration.current.locales
    val rangeUnit = remember(controller, language, units, locales) { controller.rangeUnit }
    // What the minimum asks of the scooters that report only a battery, from the latest answer's batteryRanges and the
    // apps switched on.
    val rangeHelp = remember(controller, changes, locales) {
        ScooterRangeFilter.help(controller.minimumRange.value, controller.batteryRanges.value, controller.enabledProviders.value)
    }
    val hasActiveFilters = remember(controller, changes) { controller.hasActiveFilters }
    val entries = remember(controller, changes) { controller.filterProviders }
    val showResults = remember(controller, changes) {
        // While the answer for a new minimum is on its way there is no count to promise.
        if (controller.dock is ScooterDockContent.Finding) localized("Finding scooters…") else controller.showResultsTitle
    }
    // The dock ticks for the providers shown, which it shows under the sheet; the sheet for the range (UI-217), a tick
    // a step as the slider moves.
    SelectionFeedback(minimumRange)
    FilterSheetContent(
        minimumRange = minimumRange,
        rangeUnit = rangeUnit,
        rangeHelp = rangeHelp,
        entries = entries,
        hasActiveFilters = hasActiveFilters,
        showResults = showResults,
        bottomInset = bottomInset,
        onChooseRange = controller::setMinimumRange,
        onToggle = { controller.toggle(it.provider) },
        onReset = controller::resetFilters,
        onDone = onDone,
        inPopover = inPopover,
    )
}

/** What the filter sheet shows, given what the map's filters are. */
@Composable
internal fun FilterSheetContent(
    entries: List<ScooterProviderEntry>,
    hasActiveFilters: Boolean,
    /** "Show 12 scooters", or "Finding scooters…". */
    showResults: String,
    bottomInset: Dp,
    onToggle: (ScooterProviderEntry) -> Unit,
    onReset: () -> Unit,
    onDone: () -> Unit,
    /** As tall as the filters, up to the room it is given, rather than all of it: the list scrolls only past that. */
    inPopover: Boolean = false,
    /** The minimum range in metres, a whole step of [rangeUnit]; 0 for Any. */
    minimumRange: Int = 0,
    /** The range slider's unit: kilometres, or miles where lengths are written in miles. */
    rangeUnit: ScooterRangeFilter.Unit = ScooterRangeFilter.Unit.Kilometres,
    /**
     * The paragraph under the slider while a minimum is set (ScooterRangeFilter.help): the battery the scooters that
     * report only a battery need, and that those that give neither are hidden. Null for Any.
     */
    rangeHelp: String? = ScooterRangeFilter.help(minimumRange, batteryRanges = emptyMap(), enabledProviders = emptySet()),
    /** A minimum range in metres chosen on the slider. */
    onChooseRange: (Int) -> Unit = {},
) {
    val colors = scootColors
    Column(if (inPopover) Modifier.fillMaxWidth() else Modifier.fillMaxSize()) {
        SheetTitleBar(
            title = localized("Filters"),
            trailing = { SheetBarButton(localized("Reset"), onClick = onReset, enabled = hasActiveFilters) },
        )
        // The margins are the list's own, inside what scrolls: TalkBack scrolls a page by the part of it in view, and
        // margins between the two would shorten the page, its scroll back stopping short of the top.
        Column(Modifier.weight(1f, fill = !inPopover).verticalScroll(rememberScrollState())) {
            Column(
                Modifier.padding(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 16.dp),
                verticalArrangement = Arrangement.spacedBy(22.dp),
            ) {
                RangeFilter(minimumRange, rangeUnit, rangeHelp, onChoose = onChooseRange)
                ProviderFilters(entries, onToggle = onToggle)
            }
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

/**
 * "Range" with the minimum beside it, "Any" or "5 km+", over a slider in whole kilometres up to 30, or whole miles up
 * to 20 where lengths are in miles, and under it, while a minimum is set, [help] in the help's style: one paragraph,
 * which TalkBack reads right after the slider, as it describes the choice.
 */
@Composable
private fun RangeFilter(minimum: Int, unit: ScooterRangeFilter.Unit, help: String?, onChoose: (Int) -> Unit) {
    val colors = scootColors
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            SectionHeader(localized("Range"), Modifier.alignByBaseline())
            Spacer(Modifier.weight(1f))
            // The slider says it to TalkBack.
            Text(
                ScooterRangeFilter.label(minimum),
                style = ScootType.subheadline.weight(if (minimum > 0) IosWeight.semibold else IosWeight.regular).monospacedDigit(),
                color = if (minimum > 0) colors.label else colors.secondaryText,
                modifier = Modifier.alignByBaseline().padding(horizontal = 4.dp).clearAndSetSemantics { },
            )
        }
        Box(
            Modifier
                .fillMaxWidth()
                .heightIn(min = 52.dp)
                .background(colors.tertiarySystemFill, SquircleShape(16.dp))
                .padding(horizontal = 14.dp, vertical = 4.dp),
            contentAlignment = Alignment.Center,
        ) {
            RangeSlider(minimum, unit, onChoose)
        }
        if (help != null) {
            Text(
                help,
                style = ScootType.footnote,
                color = colors.secondaryText,
                modifier = Modifier.padding(horizontal = 4.dp),
            )
        }
    }
}

/**
 * The iPhone's Slider in the app's blue, a step a whole kilometre or mile: a white capsule of a thumb on a track
 * across the card, blue up to the thumb and grey after it. Material's slider underneath takes the drags, taps and
 * arrow keys, mirrors in a right-to-left language and gives TalkBack its steps: it reads "Range, 5 km or more" and
 * moves a step a swipe. Its thumb and track of our own are still experimental in Material 1.4.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RangeSlider(minimum: Int, unit: ScooterRangeFilter.Unit, onChoose: (Int) -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    val label = localized("Range")
    val spoken = ScooterRangeFilter.spokenValue(minimum)
    val steps = ScooterRangeFilter.steps(minimum, unit)
    Slider(
        value = steps.toFloat(),
        onValueChange = { onChoose(ScooterRangeFilter.metres(it.roundToInt(), unit)) },
        valueRange = 0f..unit.maximumSteps.toFloat(),
        steps = unit.maximumSteps - 1,
        interactionSource = interaction,
        thumb = { RangeThumb(interaction) },
        track = { RangeTrack(steps.toFloat() / unit.maximumSteps) },
        modifier = Modifier.fillMaxWidth().semantics {
            contentDescription = label
            stateDescription = spoken
        },
    )
}

/** UISlider's thumb: white by day and by night, with the switch's knob's shadow. */
@Composable
private fun RangeThumb(interaction: MutableInteractionSource) {
    Box(
        Modifier
            .size(RANGE_THUMB_WIDTH, RANGE_THUMB_HEIGHT)
            .iosShadow(CapsuleShape, Color.Black.copy(alpha = 0.15f), radius = 8.dp, y = 3.dp)
            .iosShadow(CapsuleShape, Color.Black.copy(alpha = 0.06f), radius = 1.dp, y = 3.dp)
            .background(Color.White, CapsuleShape)
            .indication(interaction, FocusRing(CapsuleShape)),
    )
}

/**
 * The track: blue from its start to the thumb's middle, [fraction] of the way the thumb goes, and grey on. Material
 * lays it out from the thumb's middle at one end to its middle at the other; the iPhone's runs on under the thumb to
 * the slider's ends, as this one is drawn.
 */
@Composable
private fun RangeTrack(fraction: Float) {
    val colors = scootColors
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val rest = if (colors.isDark) RANGE_TRACK_DARK else RANGE_TRACK_LIGHT
    Canvas(Modifier.fillMaxWidth().height(RANGE_TRACK_HEIGHT)) {
        val radius = CornerRadius(size.height / 2)
        val half = RANGE_THUMB_WIDTH.toPx() / 2
        drawRoundRect(rest, Offset(-half, 0f), Size(size.width + 2 * half, size.height), radius)
        // Under the thumb at Any.
        val filled = half + size.width * fraction.coerceIn(0f, 1f)
        val start = if (rtl) size.width + half - filled else -half
        drawRoundRect(colors.actionFill, Offset(start, 0f), Size(filled, size.height), radius)
    }
}

/** iOS 26's slider, measured on an iPhone 17 Pro Max: a thumb 36 by 24, a track 6 high. */
private val RANGE_THUMB_WIDTH = 36.dp
private val RANGE_THUMB_HEIGHT = 24.dp
private val RANGE_TRACK_HEIGHT = 6.dp

/** UIKit's systemFill, the grey of a slider's track past its thumb. */
private val RANGE_TRACK_LIGHT = Color(0x33787880)
private val RANGE_TRACK_DARK = Color(0x5C787880)

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
        // With very large text the count goes under the provider's name, which then has the row's width: beside it
        // "PubliBike / Velospot" broke inside "Velospot" (f80a9728).
        val countUnderName = TextSize.isAccessibility
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(title, style = ScootType.body.weight(IosWeight.medium), color = if (entry.isDown) colors.secondaryText else colors.label)
            if (entry.isDown) {
                Text(localized("Not sharing data right now"), style = ScootType.caption, color = colors.warning)
            } else if (countUnderName) {
                ProviderCount(entry)
            }
        }
        // Spacer(minLength: 8), between the row's own spacing.
        Spacer(Modifier.width(8.dp))
        if (!entry.isDown && !countUnderName) ProviderCount(entry)
        ProviderCheck(entry)
    }
}

/** How many of the provider's scooters the map shows, in grey digits of one width. */
@Composable
private fun ProviderCount(entry: ScooterProviderEntry) {
    // `.contentTransition(.numericText())` rolls a number only when it changes inside an animation, and nothing in the
    // iPhone's sheet animates the counts: they change in place there, as here.
    Text(
        ScooterNumberFormat.integer(entry.count.toLong(), ScooterLanguage.current.locale),
        style = ScootType.subheadline.monospacedDigit(),
        color = scootColors.secondaryText,
        maxLines = 1,
    )
}

/**
 * A check for a provider that is shown, an empty circle for one that is hidden, a dashed circle for one chosen that
 * shares no data: 26 points at the standard text size, growing with the text up to 44, the glyph 22 in 26 (9d12300b).
 */
@Composable
private fun ProviderCheck(entry: ScooterProviderEntry) {
    val colors = scootColors
    val frame = minOf(bodyMetric(26f), 44.dp)
    val glyph = frame * (22f / 26f) * SYMBOL_FRAME
    Box(Modifier.size(frame), contentAlignment = Alignment.Center) {
        when {
            !entry.isEnabled -> SymbolIcon(Symbols.circleRegular, glyph, colors.secondaryText)
            entry.isDown -> Box(
                Modifier
                    .fillMaxSize()
                    .padding(2.dp)
                    .drawBehind {
                        val width = 1.5.dp.toPx()
                        drawCircle(
                            colors.secondaryText,
                            radius = (size.minDimension - width) / 2,
                            style = Stroke(width, pathEffect = PathEffect.dashPathEffect(floatArrayOf(3.5.dp.toPx(), 3.dp.toPx()))),
                        )
                    },
            )
            else -> SymbolIcon(Symbols.checkCircleFillRegular, glyph, colors.actionFill)
        }
    }
}

@Composable
private fun ShowResultsButton(title: String, onClick: () -> Unit) {
    // The button stays over the list. The iPhone's text grows through the third accessibility size and stops there,
    // 40 points against 17 (9d12300b), which Android's largest font scale, 2.0, stays under: it grows all the way.
    Box(
        Modifier
            .padding(horizontal = 20.dp, vertical = 8.dp)
            .fillMaxWidth()
            .heightIn(min = 50.dp)
            .glassButton(
                CapsuleShape,
                glass = Modifier.background(scootColors.actionFill, CapsuleShape),
                focusRing = FocusRing(CapsuleShape, onTint = true),
                onClick = onClick,
            )
            .padding(horizontal = 20.dp, vertical = 14.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(title, style = ScootType.headline, color = Color.White, textAlign = TextAlign.Center)
    }
}

@Composable
private fun SectionHeader(title: String, modifier: Modifier = Modifier) {
    Text(
        title,
        style = ScootType.subheadline.weight(IosWeight.semibold),
        color = scootColors.secondaryText,
        modifier = modifier.padding(horizontal = 4.dp).semantics { heading() },
    )
}

/** Draws the element [height] above where it is laid out, taking no room: the fade over the list's end. */
private fun Modifier.layoutAbove(height: Dp): Modifier = layout { measurable, constraints ->
    val placeable = measurable.measure(constraints)
    layout(placeable.width, 0) { placeable.place(0, -height.roundToPx()) }
}
