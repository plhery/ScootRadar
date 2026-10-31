package com.plhery.scootradar.ui.dock

import androidx.compose.animation.SizeTransform
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.addOutline
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.isFinite
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dock
import com.plhery.scootradar.core.map.dockAnnouncement
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterCityCatalog
import com.plhery.scootradar.core.model.ScooterCityDistance
import com.plhery.scootradar.core.model.ScooterCoverageSummary
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterDockHint
import com.plhery.scootradar.core.model.ScooterDockLead
import com.plhery.scootradar.core.model.ScooterDockNotice
import com.plhery.scootradar.core.model.ScooterDockStatus
import com.plhery.scootradar.core.model.ScooterDockSummary
import com.plhery.scootradar.core.model.ScooterFilterSummary
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterNumberFormat
import com.plhery.scootradar.core.model.ScooterProviderEntry
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.Announcer
import com.plhery.scootradar.ui.chrome.overTheMap
import com.plhery.scootradar.ui.glass.chromeGlass
import com.plhery.scootradar.ui.rememberAnnouncementOnChange
import com.plhery.scootradar.ui.rememberControllerChanges
import com.plhery.scootradar.ui.rememberNow
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.ChangingContent
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SelectionFeedback
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.TextSize
import com.plhery.scootradar.ui.theme.animation
import com.plhery.scootradar.ui.theme.designFont
import com.plhery.scootradar.ui.theme.hairline
import com.plhery.scootradar.ui.theme.iosShadow
import com.plhery.scootradar.ui.theme.monospacedDigit
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight
import java.time.Instant

// ScooterControlDock in ios/ScootRadar/Views/ScooterControls.swift: the card at the bottom of a phone's screen, and
// the card of a large window's panel (ui.md UI-026 to UI-049, UI-097, UI-100, UI-108, UI-109, UI-228).

/**
 * The dock: one glass card at the bottom of the screen, which says what the map shows. Its content is the
 * controller's [dock]: scooters being found, the count and its status, a scooter's or a bay's card, or why there is
 * nothing to show. A change of kind springs the card to its new height while the old content fades out and the new
 * fades in. Content taller than [maximumContentHeight] scrolls inside the card.
 *
 * In the [layout] of a large window's panel it is the panel's card, which lists the providers one under the other
 * and folds: a grabber at its foot folds it down to one line, or opens it again.
 */
@Composable
fun ScooterControlDock(
    controller: ScooterMapController,
    modifier: Modifier = Modifier,
    layout: ScooterChromeLayout = ScooterChromeLayout.Dock,
    maximumContentHeight: Dp = Dp.Infinity,
    onEditFilters: () -> Unit = {},
    onHeightChange: (Int) -> Unit = {},
) {
    val changes = rememberControllerChanges(controller)
    val content = remember(controller, changes) { controller.dock }
    val colors = scootColors
    val shape = SquircleShape(28.dp)
    val reduceMotion = LocalReduceMotion.current
    SelectionFeedback(controller.enabledProviders.collectAsState().value)
    // Only the panel folds; a phone's dock always shows all it has.
    val isFolded = layout == ScooterChromeLayout.Panel && controller.isPanelCollapsed.collectAsState().value

    Box(modifier.widthIn(max = 560.dp)) {
        Box(
            Modifier
                .iosShadow(shape, Color.Black.copy(alpha = if (colors.isDark) 0.3f else 0.1f), radius = 16.dp, y = 10.dp)
                .chromeGlass(shape, live = true)
                .hairline(shape, colors.dockHairline)
                .overTheMap()
                .onSizeChanged { onHeightChange(it.height) }
                .testTag(DOCK_TAG),
        ) {
            when (layout) {
                ScooterChromeLayout.Dock -> DockCards(controller, content, layout, PaddingValues(16.dp), maximumContentHeight, onEditFilters)
                ScooterChromeLayout.Panel -> {
                    // The card folds to its line, and opens again, as the one fades into the other; under Reduce
                    // Motion the one is the other in the frame it folds (UI-184).
                    val fold = IosMotion.snappy(duration = 0.3)
                    ChangingContent(
                        targetState = isFolded,
                        atOnce = reduceMotion,
                        contentAlignment = Alignment.TopStart,
                        transitionSpec = {
                            fadeIn(fold.animation()) togetherWith fadeOut(fold.animation()) using
                                SizeTransform(clip = false) { _, _ -> fold.animation() }
                        },
                        label = "fold",
                    ) { folded ->
                        if (folded) {
                            FoldedPanelLine(controller, Modifier.padding(start = 16.dp, top = 4.dp, end = 16.dp, bottom = FOLDED_FOOT))
                        } else {
                            DockCards(
                                controller,
                                content,
                                layout,
                                PaddingValues(start = 16.dp, top = 16.dp, end = 16.dp, bottom = PANEL_FOOT),
                                maximumContentHeight,
                                onEditFilters,
                            )
                        }
                    }
                }
            }
            // A card opens down here while TalkBack is still on the marker, and the out-of-date card replaces the
            // count unasked. The walking route is drawn on the map, away from the button that asked for it, and the
            // walk can end on its own.
            Announcer(rememberAnnouncementOnChange(content.kind) { controller.dockAnnouncement })
            val walkAnnouncement = controller.walkAnnouncement.collectAsState().value
            Announcer(rememberAnnouncementOnChange(walkAnnouncement) { walkAnnouncement?.text })
        }
        if (layout == ScooterChromeLayout.Panel) {
            PanelGrabber(
                isFolded,
                controller::setPanelCollapsed,
                // Its 44 point reach from the foot of the card to just past its edge, and the handle shows 12
                // points above the edge.
                Modifier.align(Alignment.BottomCenter).offset(y = GRABBER_OVERHANG),
            )
        }
    }
}

/** Under the content of the panel's card, the room its grabber takes. */
val PANEL_FOOT = 34.dp

/** Under the line of a folded card, where the grabber reaches up over the line's own foot: both open the card. */
private val FOLDED_FOOT = 22.dp

/** How far the grabber's reach goes past the card's edge. */
private val GRABBER_OVERHANG = 10.dp

/**
 * What the card holds, inside [padding]: all of the content, which scrolls when taller than [maximumContentHeight].
 * A change of kind springs the card to its new height while the old content fades out and the new fades in; under
 * Reduce Motion the new one is there at once.
 */
@Composable
private fun DockCards(
    controller: ScooterMapController,
    content: ScooterDockContent,
    layout: ScooterChromeLayout,
    padding: PaddingValues,
    maximumContentHeight: Dp,
    onEditFilters: () -> Unit,
) {
    val colors = scootColors
    val shape = SquircleShape(28.dp)
    val spring = IosMotion.snappy(duration = 0.28, extraBounce = 0.06)
    val reduceMotion = LocalReduceMotion.current
    // Under Reduce Motion the new kind's card in the frame the dock changes (UI-184).
    ChangingContent(
        targetState = content,
        atOnce = reduceMotion,
        contentKey = { it.kind },
        contentAlignment = Alignment.TopStart,
        transitionSpec = {
            fadeIn(spring.animation()) togetherWith fadeOut(spring.animation()) using
                SizeTransform(clip = false) { _, _ -> spring.animation() }
        },
        label = "dock",
    ) { shown ->
        val scroll = rememberScrollState()
        Box(
            (if (shown is ScooterDockContent.Scooter) Modifier.cardGlow(colors.providerAccent(shown.scooter.providerInfo), shape) else Modifier)
                .fillMaxWidth()
                .padding(padding)
                // HeightLimit: as tall as the content, up to the limit, and scrolling past it. Without a limit
                // nothing scrolls, as a scroll needs a height to fit in.
                .then(if (maximumContentHeight.isFinite) Modifier.heightIn(max = maximumContentHeight).verticalScroll(scroll) else Modifier),
        ) {
            DockContent(controller, shown, layout, onEditFilters)
        }
    }
}

/** The dock's tag, by which the tests over the live map find it. */
const val DOCK_TAG = "dock"

/** What the dock shows, without its details: a change of kind animates. */
internal val ScooterDockContent.kind: String
    get() = when (this) {
        is ScooterDockContent.Scooter -> "scooter:${scooter.id}"
        is ScooterDockContent.Parking -> "parking:${parking.id}"
        is ScooterDockContent.OutOfDate -> "outOfDate"
        is ScooterDockContent.Finding -> "finding"
        ScooterDockContent.Waiting -> "waiting"
        is ScooterDockContent.OutsideCoverage -> "outsideCoverage"
        is ScooterDockContent.FiltersHideEverything -> "filtersHideEverything"
        is ScooterDockContent.Summary -> "summary"
    }

/**
 * A soft light in the provider's colour from the top left corner of a scooter's card: an ellipse 0.9 of the card
 * wide and 0.7 high, fading out at 0.7 of the way to its edge, inside the card's [shape].
 */
private fun Modifier.cardGlow(tint: Color, shape: Shape): Modifier = drawBehind {
    val width = size.width * 0.9f
    val height = size.height * 0.7f
    if (width <= 0f || height <= 0f) return@drawBehind
    val brush = Brush.radialGradient(
        0f to tint.copy(alpha = 0.2f),
        0.7f to tint.copy(alpha = 0f),
        center = Offset.Zero,
        radius = width,
    )
    val card = Path().apply { addOutline(shape.createOutline(size, layoutDirection, this@drawBehind)) }
    clipPath(card) {
        // A circle of the frame's width, squeezed to the frame's height.
        scale(scaleX = 1f, scaleY = height / width, pivot = Offset.Zero) {
            drawRect(brush, size = Size(width, width))
        }
    }
}

/** Count and status, and "Finding scooters…" in their place, keep one height so the dock does not jump. */
private val headerHeight = 38.dp

@Composable
private fun DockContent(controller: ScooterMapController, content: ScooterDockContent, layout: ScooterChromeLayout, onEditFilters: () -> Unit) {
    when (content) {
        is ScooterDockContent.Scooter -> ScooterCard(controller, content.scooter)
        is ScooterDockContent.Parking -> ParkingBayCard(controller, content.parking)
        is ScooterDockContent.OutOfDate -> OutOfDateCard(controller, content.failure, content.lastUpdate)
        is ScooterDockContent.Finding -> Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                Modifier.fillMaxWidth().heightIn(min = headerHeight),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Spinner(SpinnerSize.Small)
                Text(localized("Finding scooters…"), style = ScootType.subheadline.weight(FontWeight.SemiBold), color = scootColors.dockText)
            }
            if (content.notices.isNotEmpty()) NoticeRows(content.notices)
            if (content.chips.isNotEmpty()) ProviderFilters(controller, content.chips, layout)
        }
        ScooterDockContent.Waiting -> Box(Modifier.fillMaxWidth().heightIn(min = headerHeight), contentAlignment = Alignment.CenterStart) {
            Text(localized("Waiting for scooter data"), style = ScootType.subheadline.weight(FontWeight.SemiBold), color = scootColors.dockText)
        }
        is ScooterDockContent.OutsideCoverage -> OutsideCoverageCard(controller, content.cities)
        is ScooterDockContent.FiltersHideEverything -> HiddenByFiltersCard(controller, content.summary, onEditFilters)
        is ScooterDockContent.Summary -> SummaryContent(controller, content.summary, layout)
    }
}

/** The providers: chips side by side in a phone's dock, and in the panel of a large window a list. */
@Composable
private fun ProviderFilters(controller: ScooterMapController, chips: List<ScooterProviderEntry>, layout: ScooterChromeLayout) {
    when (layout) {
        ScooterChromeLayout.Dock -> ProviderChips(controller, chips)
        ScooterChromeLayout.Panel -> ProviderList(controller, chips)
    }
}

/**
 * The count, or the nearest scooter, with the status under it; the notices, the chips and the hint. With very
 * large text Try again goes under the count and the status.
 */
@Composable
private fun SummaryContent(controller: ScooterMapController, summary: ScooterDockSummary, layout: ScooterChromeLayout) {
    val colors = scootColors
    val isLoading = controller.isLoading.collectAsState().value
    val now = rememberNow()
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        val lead = summary.lead
        if (lead != null) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                DockLeadButton(lead, tint = colors.providerAccent(lead.scooter.providerInfo)) {
                    controller.focusOnScooter(lead.scooter)
                }
                // While all is well the status stays out of the way; a delay, old data or a failed refresh is always said.
                val status = summary.status(at = now)
                if (status != null && (!status.isLive || summary.showsTryAgain)) {
                    SummaryHeader(
                        showsTryAgain = summary.showsTryAgain,
                        isLoading = isLoading,
                        onRetry = controller::retryLoad,
                    ) { DockStatusLabel(status, it) }
                }
            }
        } else {
            SummaryHeader(
                showsTryAgain = summary.showsTryAgain,
                isLoading = isLoading,
                onRetry = controller::retryLoad,
            ) { fill ->
                Column(fill.heightIn(min = headerHeight), verticalArrangement = Arrangement.spacedBy(1.dp, Alignment.CenterVertically)) {
                    CountLine(summary)
                    summary.status(at = now)?.let { DockStatusLabel(it) }
                }
            }
        }

        if (summary.notices.isNotEmpty()) NoticeRows(summary.notices)

        ProviderFilters(controller, summary.chips, layout)

        summary.hint?.let { hint ->
            DockNoteRow(if (hint == ScooterDockHint.TapCity) Symbols.mapPin else Symbols.scooter, hint.text)
        }
    }
}

/**
 * The count or the status, and Try again after a failed refresh: side by side, or one under the other with very
 * large text. [main] takes the room Try again leaves, through the modifier it is given.
 */
@Composable
private fun SummaryHeader(
    showsTryAgain: Boolean,
    isLoading: Boolean,
    onRetry: () -> Unit,
    main: @Composable (Modifier) -> Unit,
) {
    if (TextSize.isAccessibility) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            main(Modifier.fillMaxWidth())
            if (showsTryAgain) TryAgainPill(isLoading, onRetry, Modifier)
        }
    } else {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            main(Modifier.weight(1f))
            if (showsTryAgain) TryAgainPill(isLoading, onRetry)
        }
    }
}

/** "22 scooters nearby": the count stands out, and the two are one text, so a long line wraps like a sentence. */
@Composable
private fun CountLine(summary: ScooterDockSummary) {
    val number = ScooterNumberFormat.integer(summary.count.toLong(), ScooterLanguage.current.locale)
    val headline = ScootType.headline.weight(FontWeight.Bold).monospacedDigit()
    val subheadline = ScootType.subheadline.weight(FontWeight.SemiBold)
    val text = buildAnnotatedString {
        withStyle(headline.toSpanStyle()) { append(number) }
        withStyle(subheadline.toSpanStyle()) { append(" ${summary.countLabel}") }
    }
    Text(text, style = headline, color = scootColors.dockText)
}

/** The notices under the status: a night ban or a season in blue, trouble with the data in grey. */
@Composable
private fun NoticeRows(notices: List<ScooterDockNotice>) {
    val colors = scootColors
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        notices.forEach { notice ->
            DockNoteRow(
                Symbols.named(notice.systemImage) ?: Symbols.warning,
                notice.text,
                tint = if (notice.isCalm) colors.actionText else null,
            )
        }
    }
}

/**
 * The nearest scooter, in the place of the count while the rider or the searched place is on the map: its
 * distance, large, "to the nearest scooter", and the provider and minutes on foot. A tap shows it on the map.
 */
@Composable
private fun DockLeadButton(lead: ScooterDockLead, tint: Color, onClick: () -> Unit) {
    val colors = scootColors
    val label = lead.accessibilityLabel
    val dotDrop = with(LocalDensity.current) { 1.dp.roundToPx() }
    Row(
        Modifier
            .fillMaxWidth()
            .heightIn(min = 44.dp)
            .plainButton(label = label, onClick = onClick),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        val distance = @Composable {
            Text(
                lead.distance,
                style = designFont(38f, FontWeight.Black, tracking = -1.5f, tabular = true),
                color = colors.dockText,
                maxLines = 1,
                softWrap = false,
            )
        }
        val words = @Composable { modifier: Modifier ->
            Column(modifier, verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(localized("to the nearest scooter"), style = designFont(14.5f, FontWeight.Bold), color = colors.dockText)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    // The dot's foot one point above the line's baseline.
                    Box(
                        Modifier
                            .alignBy { it.measuredHeight + dotDrop }
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(tint),
                    )
                    Text(
                        lead.detail,
                        style = designFont(12.5f, tabular = true),
                        color = colors.dockQuiet,
                        modifier = Modifier.alignByBaseline(),
                    )
                }
            }
        }
        if (TextSize.isAccessibility) {
            // Very large text: the figure keeps a line to itself.
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                distance()
                words(Modifier)
            }
        } else {
            Row(Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
                distance()
                words(Modifier.weight(1f))
            }
        }
        FixedSymbol(Symbols.chevronRight, 15f, colors.dockQuiet)
    }
}

/** The data expired and the refresh after it failed: the map is empty, and Try again is the way on. */
@Composable
private fun OutOfDateCard(controller: ScooterMapController, failure: ScooterLoadFailure, lastUpdate: Instant) {
    val colors = scootColors
    val isLoading = controller.isLoading.collectAsState().value
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        DockCardHeader(
            Symbols.clock,
            colors.warning,
            localized("These positions are out of date"),
            ScooterDockStatus.outOfDateBody(failure, lastUpdate),
        )
        DockActionRow {
            DockActionButton(
                prominent = true,
                onClick = controller::retryLoad,
                enabled = !isLoading,
                label = localized("Try again"),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Box(Modifier.alpha(if (isLoading) 0f else 1f)) { DockActionLabel(localized("Try again"), Symbols.refresh) }
                    if (isLoading) Spinner(SpinnerSize.Small, Color.White)
                }
            }
        }
    }
}

/** The cities and countries the coverage card counts: the catalog's, or a screenshot test's, which a new city doesn't move. */
val LocalCoverageCounts = staticCompositionLocalOf { ScooterCityCatalog.cityCount to ScooterCityCatalog.countryCount }

/** A place no operator serves: how far ScootRadar reaches, and the closest cities it covers. */
@Composable
private fun OutsideCoverageCard(controller: ScooterMapController, cities: List<ScooterCityDistance>) {
    val colors = scootColors
    val (cityCount, countryCount) = LocalCoverageCounts.current
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        DockCardHeader(
            Symbols.map,
            colors.actionText,
            localized("No scooter data here yet"),
            ScooterCoverageSummary.text(cityCount, countryCount),
        )
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                localized("Closest cities"),
                style = ScootType.footnote.weight(FontWeight.SemiBold),
                color = colors.secondaryText,
                modifier = Modifier.semantics { heading() },
            )
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                itemVerticalAlignment = Alignment.CenterVertically,
            ) {
                cities.forEach { entry ->
                    Row(
                        Modifier
                            .plainButton(label = entry.label) { controller.focusOnCity(entry.city) }
                            .clip(CapsuleShape)
                            .background(colors.label.copy(alpha = 0.055f))
                            .hairline(CapsuleShape, colors.secondaryLabel.copy(alpha = colors.secondaryLabel.alpha * 0.16f))
                            .heightIn(min = 44.dp)
                            .padding(horizontal = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        // A plain button: the dock's text colour.
                        SymbolIcon(Symbols.mapPin, textSymbolSize(15f), colors.dockText)
                        Text(entry.label, style = ScootType.subheadline.weight(FontWeight.SemiBold).monospacedDigit(), color = colors.dockText)
                    }
                }
            }
        }
    }
}

/** The filters hide every scooter of the loaded area: what they hide, Show all, and Edit filters. */
@Composable
private fun HiddenByFiltersCard(controller: ScooterMapController, summary: ScooterFilterSummary, onEditFilters: () -> Unit) {
    val colors = scootColors
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        DockCardHeader(Symbols.filter, colors.actionText, summary.title, summary.body)
        DockActionRow {
            // "Show all 1" reads badly; one hidden scooter gets the plain label.
            DockActionButton(prominent = true, onClick = controller::resetFilters) {
                DockActionLabel(if (summary.hiddenCount == 1) localized("Show all") else summary.showAllTitle)
            }
            DockActionButton(prominent = false, onClick = onEditFilters) {
                DockActionLabel(localized("Edit filters"))
            }
        }
    }
}
