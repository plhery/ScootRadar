package com.plhery.scootradar.ui.dock

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.snap
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.TextAutoSize
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.cardContent
import com.plhery.scootradar.core.map.cardStatus
import com.plhery.scootradar.core.map.directionsControl
import com.plhery.scootradar.core.map.hideWalkingRoute
import com.plhery.scootradar.core.map.openWalkInMaps
import com.plhery.scootradar.core.map.rentalOpened
import com.plhery.scootradar.core.map.showWalkingRoute
import com.plhery.scootradar.core.map.straightLineDistance
import com.plhery.scootradar.core.map.walkNote
import com.plhery.scootradar.core.model.RideEstimateDuration
import com.plhery.scootradar.core.model.RidePriceFormatter
import com.plhery.scootradar.core.model.RidePriceQuote
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterCardContent
import com.plhery.scootradar.core.model.ScooterCardFigure
import com.plhery.scootradar.core.model.ScooterDirectionsControl
import com.plhery.scootradar.core.model.ScooterDockStatus
import com.plhery.scootradar.core.model.ScooterWalkNote
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.ui.LocalAnalytics
import com.plhery.scootradar.ui.rememberControllerChanges
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.TextSize
import com.plhery.scootradar.ui.theme.animation
import com.plhery.scootradar.ui.theme.designFont
import com.plhery.scootradar.ui.theme.hairline
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight
import kotlinx.coroutines.launch
import kotlin.math.max
import kotlin.math.roundToInt

// ScooterCard, CardFigureRow, CardFigureCell, CardStatusLine, DirectionsButton and WalkNoteRow in
// ios/ScootRadar/Views/ScooterControls.swift: the card of a chosen scooter (ui.md UI-050 to UI-059, UI-068, UI-069).

/**
 * A scooter's card: the status of the data while it is failing; the provider's tile, its name and what is known
 * of the scooter, which show it on the map; up to three figures; how the price is made up; the night ban; what
 * became of the walk; and Open in and Directions.
 */
@Composable
internal fun ScooterCard(controller: ScooterMapController, scooter: Scooter) {
    // Worked out again whenever the controller changes, as the walk, the price and the status do.
    val changes = rememberControllerChanges(controller)
    val content = remember(changes, scooter) { controller.cardContent(scooter) }
    val status = remember(changes) { controller.cardStatus }
    val target = remember(scooter) { ScooterWalkTarget.Scooter(scooter) }
    val colors = scootColors

    Column(Modifier.fillMaxWidth()) {
        if (status != null) {
            CardStatusLine(controller, status, Modifier.padding(bottom = 10.dp))
        }

        CardHeader(controller, scooter, content)

        if (content.figures.isNotEmpty()) {
            CardFigures(controller, scooter, content.figures, Modifier.padding(top = 14.dp))
        }

        Text(
            content.note,
            style = designFont(12f, tabular = true),
            color = colors.dockQuiet,
            modifier = Modifier.padding(horizontal = 2.dp).padding(top = 10.dp),
        )

        content.curfew?.let { curfew ->
            Row(
                Modifier.padding(horizontal = 2.dp).padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                SymbolIcon(Symbols.moonFill, textSymbolSize(11f), colors.actionText, Modifier.alignBy(SymbolBaseline))
                Text(curfew, style = designFont(12f, tabular = true), color = colors.dockQuiet, modifier = Modifier.alignByBaseline())
            }
        }

        WalkNote(controller.walkNote(target), Modifier.padding(top = 12.dp))

        // A scooter gone from the map can be neither rented nor walked to.
        if (controller.directionsControl(target) != ScooterDirectionsControl.None) {
            // "Open in …" is the wider of the two. Where the feed links no scooter, as Lime's and Bird's never do,
            // it opens the operator's app, or else its page.
            val opens = scooter.rentalURL != null || scooter.operatorApp != null
            DockActionRow(Modifier.padding(top = 12.dp), weights = if (opens) listOf(1.5f, 1f) else emptyList()) {
                if (opens) OpenInButton(controller, scooter)
                DirectionsButton(controller, target, prominent = false)
            }
        }
    }
}

/**
 * The tile, the name and the facts, which show the scooter on the map; with no distance to it, only the tile does,
 * and the line under the name asks for the rider's location. The close button at the end.
 */
@Composable
private fun CardHeader(controller: ScooterMapController, scooter: Scooter, content: ScooterCardContent) {
    val colors = scootColors
    val isLocating = controller.isLocating.collectAsState().value
    val hint = localized("Centers this scooter on the map")
    val focus = { controller.focusOnScooter(scooter) }
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Row(Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(11.dp), verticalAlignment = Alignment.CenterVertically) {
            if (controller.straightLineDistance(scooter) != null) {
                Row(
                    Modifier.weight(1f, fill = false).plainButton(hint = hint, onClick = focus),
                    horizontalArrangement = Arrangement.spacedBy(11.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    ProviderTile(scooter, Modifier.clearAndSetSemantics {})
                    TitleBlock(scooter.providerName, Modifier.weight(1f, fill = false)) {
                        content.facts?.let { Text(it, style = designFont(12.5f, tabular = true), color = colors.dockQuiet) }
                    }
                }
            } else {
                ProviderTile(scooter, Modifier.plainButton(label = scooter.providerName, hint = hint, onClick = focus))
                if (isLocating) {
                    TitleBlock(scooter.providerName, Modifier.weight(1f, fill = false).semantics(mergeDescendants = true) {}) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Spinner(SpinnerSize.Mini)
                            Text(localized("Finding your location…"), style = designFont(12.5f), color = colors.dockQuiet)
                        }
                    }
                } else {
                    // Locates without moving the map, so this card stays open.
                    TitleBlock(scooter.providerName, Modifier.weight(1f, fill = false).plainButton(onClick = controller::locateForWalkingTime)) {
                        Text(localized("Turn on location to see walking time"), style = designFont(12.5f), color = colors.actionText)
                    }
                }
            }
        }
        // Spacer(minLength: 4), with the stack's 11 on each side of it.
        Spacer(Modifier.width(26.dp))
        DockCloseButton(localized("Close scooter details"), onClick = { controller.selectScooter(null) })
    }
}

/** The provider's colour with its initials, in the ink that reads on it: 40 points, whatever the text size. */
@Composable
private fun ProviderTile(scooter: Scooter, modifier: Modifier = Modifier) {
    val colors = scootColors
    val provider = scooter.providerInfo
    val size = with(LocalDensity.current) { 14.dp.toSp() }
    Box(
        modifier.size(40.dp).clip(SquircleShape(12.dp)).background(colors.dot(provider)),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            provider?.shortName ?: "?",
            style = ScootType.style(14f, FontWeight.ExtraBold).copy(fontSize = size),
            color = colors.ink(on = provider),
            maxLines = 1,
        )
    }
}

/** The provider's name, large, with a line under it, at least as tall as the tile. */
@Composable
private fun TitleBlock(name: String, modifier: Modifier = Modifier, subtitle: @Composable () -> Unit) {
    Column(
        modifier.heightIn(min = 40.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp, Alignment.CenterVertically),
    ) {
        Text(name, style = designFont(19f, FontWeight.ExtraBold, tracking = -0.38f), color = scootColors.dockText)
        subtitle()
    }
}

/** Up to three figures in equal cells; with very large text, one a row. The price's cell changes the ride's length. */
@Composable
private fun CardFigures(controller: ScooterMapController, scooter: Scooter, figures: List<ScooterCardFigure>, modifier: Modifier) {
    val cells = @Composable {
        for (figure in figures) {
            val quote = if (figure.kind == ScooterCardFigure.Kind.Price) controller.ridePriceQuote(scooter) else null
            if (quote != null) {
                PriceCell(controller, figure, quote)
            } else {
                CardFigureCell(figure, Modifier.semantics(mergeDescendants = true) {})
            }
        }
    }
    if (TextSize.isAccessibility) {
        Column(modifier, verticalArrangement = Arrangement.spacedBy(CardFigures.spacing)) { cells() }
    } else {
        CardFigureRow(modifier, cells)
    }
}

/** When the card's figures go two over one (CardFigureRow.wraps). */
internal object CardFigures {
    val spacing: Dp = 8.dp

    /** Whether three cells across [width] go two over one. A 375-point phone's card gives them 321. */
    fun wraps(count: Int, width: Dp?): Boolean = count == 3 && width != null && width < 300.dp
}

/**
 * The card's figures side by side in equal cells as tall as the tallest, as on every phone. In a window narrower
 * than any phone's, three would cut what each measures short ("CHF, 10…"), so the third goes under the other two,
 * at their width.
 */
@Composable
internal fun CardFigureRow(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Layout(content, modifier) { measurables, constraints ->
        val spacing = CardFigures.spacing.toPx()
        val gaps = spacing * max(measurables.size - 1, 0)
        val width = if (constraints.hasBoundedWidth) {
            constraints.maxWidth.toFloat()
        } else {
            measurables.sumOf { it.maxIntrinsicWidth(Constraints.Infinity) } + gaps
        }
        val rows = if (CardFigures.wraps(measurables.size, width.toDp())) listOf(0..1, 2..2) else listOf(measurables.indices)
        val placed = mutableListOf<Triple<Placeable, Int, Int>>()
        var y = 0
        rows.forEachIndexed { index, cells ->
            val count = cells.count()
            val cellWidth = (width - spacing * max(count - 1, 0)) / max(count, 1)
            val lefts = List(count) { (it * (cellWidth + spacing)).roundToInt() }
            val widths = List(count) { (it * (cellWidth + spacing) + cellWidth).roundToInt() - lefts[it] }
            val height = cells.mapIndexed { column, cell -> measurables[cell].maxIntrinsicHeight(widths[column]) }.maxOrNull() ?: 0
            cells.forEachIndexed { column, cell ->
                placed += Triple(measurables[cell].measure(Constraints.fixed(widths[column], height)), lefts[column], y)
            }
            y += height + if (index < rows.lastIndex) spacing.roundToInt() else 0
        }
        layout(width.roundToInt(), y) {
            for ((placeable, x, top) in placed) placeable.place(x, top)
        }
    }
}

/** One figure: a large number with its unit, and what it measures under it. */
@Composable
private fun CardFigureCell(
    figure: ScooterCardFigure,
    modifier: Modifier = Modifier,
    /** The number's colour when it is not the text's. */
    tint: Color? = null,
    symbol: ImageVector? = null,
    /** The cell opens a menu: its label says so with a small mark. */
    opensMenu: Boolean = false,
) {
    val colors = scootColors
    val shape = SquircleShape(16.dp)
    val number = designFont(25f, FontWeight.Black, tracking = -1f, tabular = true)
    val label = designFont(11.5f, FontWeight.Medium, tabular = true)
    Column(
        modifier
            .fillMaxWidth()
            .clip(shape)
            .background(colors.dockTile)
            .hairline(shape, colors.dockHairline)
            .padding(start = 12.dp, top = 12.dp, end = 10.dp, bottom = 11.dp),
        verticalArrangement = Arrangement.spacedBy(5.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                figure.value,
                style = number,
                color = tint ?: colors.dockText,
                maxLines = 1,
                autoSize = shrinking(number, 0.6f),
                modifier = Modifier.alignByBaseline().weight(1f, fill = false),
            )
            figure.unit?.let {
                Text(it, style = designFont(12f, FontWeight.Bold), color = tint ?: colors.dockText, maxLines = 1, modifier = Modifier.alignByBaseline())
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
            symbol?.let { SymbolIcon(it, textSymbolSize(11.5f), tint ?: colors.dockQuiet) }
            // With text larger than standard, two lines rather than "de dista…"; at the standard size it shrinks a little.
            Text(
                figure.label,
                style = label,
                color = colors.dockQuiet,
                maxLines = if (TextSize.isAboveLarge) 2 else 1,
                overflow = TextOverflow.Ellipsis,
                autoSize = shrinking(label, 0.8f),
                modifier = Modifier.weight(1f, fill = false),
            )
            if (opensMenu) {
                // `.imageScale(.small)`.
                SymbolIcon(Symbols.unfold, textSymbolSize(11.5f) * 0.8f, colors.dockQuiet)
            }
        }
    }
}

/** `.minimumScaleFactor(_:)`: the style's size, or down to `factor` of it where the line would not fit. */
private fun shrinking(style: TextStyle, factor: Float): TextAutoSize =
    TextAutoSize.StepBased(minFontSize = style.fontSize * factor, maxFontSize = style.fontSize, stepSize = 0.25.sp)

/** The price of a ride of the chosen length. The cell is the menu that changes the length. */
@Composable
private fun PriceCell(controller: ScooterMapController, figure: ScooterCardFigure, quote: RidePriceQuote) {
    val colors = scootColors
    val minutes = controller.rideEstimateMinutes.collectAsState().value
    var isOpen by remember { mutableStateOf(false) }
    val label = stringFormat(localized("Ride estimate, %lld minutes. Change duration."), minutes.toLong())
    val value = priceLabel(quote)
    Box {
        CardFigureCell(
            figure,
            Modifier
                .plainButton { isOpen = true }
                .clearAndSetSemantics {
                    contentDescription = label
                    stateDescription = value
                    role = Role.DropdownList
                    onClick { isOpen = true; true }
                },
            tint = if (quote.passApplied) colors.good else null,
            symbol = if (quote.passApplied) Symbols.ticketFill else null,
            opensMenu = true,
        )
        DropdownMenu(expanded = isOpen, onDismissRequest = { isOpen = false }) {
            for (choice in RideEstimateDuration.allowedMinutes) {
                DropdownMenuItem(
                    text = { Text(stringFormat(localized("%lld min"), choice.toLong())) },
                    onClick = {
                        controller.setRideEstimateMinutes(choice)
                        isOpen = false
                    },
                    trailingIcon = if (choice == minutes) {
                        { SymbolIcon(Symbols.check, 20.dp, LocalContentColor.current) }
                    } else {
                        null
                    },
                )
            }
        }
    }
}

/**
 * "≈ CHF 4.50 for 10 min", or "From USD 5.50 for 10 min" where the minute fee is the lowest of a range, followed by
 * "Pass applied" when a pass lowers it.
 */
internal fun priceLabel(quote: RidePriceQuote): String {
    val price = RidePriceFormatter.string(quote.totalMinorUnits, quote.currency)
    val estimate = stringFormat(
        if (quote.minuteFeeFrom) localized("From %1\$@ for %2\$lld min") else localized("≈ %1\$@ for %2\$lld min"),
        if (quote.plusTax) stringFormat(localized("%@ + tax"), price) else price,
        quote.durationMinutes.toLong(),
    )
    if (!quote.passApplied) return estimate
    return stringFormat(localized("%1\$@ · %2\$@"), estimate, localized("Pass applied"))
}

/**
 * Open in the provider's app: the scooter's own link where the feed gives one, or else the operator's app. The
 * return from the ride may be the moment to ask for a rating (rentalOpened).
 */
@Composable
private fun OpenInButton(controller: ScooterMapController, scooter: Scooter) {
    val context = LocalContext.current
    val analytics = LocalAnalytics.current
    val scope = rememberCoroutineScope()
    DockActionButton(
        prominent = true,
        onClick = {
            controller.rentalOpened()
            if (scooter.rentalURL != null) {
                analytics?.track("rental_open", provider = scooter.provider)
                scope.launch { scooter.openRental { context.openRentalLink(it) } }
            } else {
                analytics?.track("rental_open", provider = scooter.provider, result = "app")
                scope.launch { scooter.openOperatorApp { url, appOnly -> context.openLink(url, appOnly) } }
            }
        },
    ) {
        DockActionLabel(stringFormat(localized("Open in %@"), scooter.providerName), Symbols.scooter)
    }
}

/**
 * Directions, Hide route or Open in Maps, as the walk stands; while the rider is located or the way found, a
 * spinner in place of its symbol, and a tap waits as the rider does.
 */
@Composable
internal fun DirectionsButton(controller: ScooterMapController, target: ScooterWalkTarget, prominent: Boolean) {
    val colors = scootColors
    val control = controller.directionsControl(target)
    val isFinding = control == ScooterDirectionsControl.Finding
    val title = when (control) {
        ScooterDirectionsControl.Directions, ScooterDirectionsControl.Finding, ScooterDirectionsControl.None -> localized("Directions")
        ScooterDirectionsControl.HideRoute -> localized("Hide route")
        ScooterDirectionsControl.OpenInMaps -> localized("Open in Maps")
    }
    val symbol = when (control) {
        ScooterDirectionsControl.Directions, ScooterDirectionsControl.Finding, ScooterDirectionsControl.None -> Symbols.walk
        ScooterDirectionsControl.HideRoute -> Symbols.close
        ScooterDirectionsControl.OpenInMaps -> Symbols.map
    }
    DockActionButton(
        prominent = prominent,
        onClick = {
            when (control) {
                ScooterDirectionsControl.Directions -> controller.showWalkingRoute(target)
                ScooterDirectionsControl.HideRoute -> controller.hideWalkingRoute()
                ScooterDirectionsControl.OpenInMaps -> controller.openWalkInMaps(target)
                // Busy: the tap waits for the way like the rider does.
                ScooterDirectionsControl.Finding, ScooterDirectionsControl.None -> Unit
            }
        },
        label = if (isFinding) localized("Finding the way…") else title,
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(contentAlignment = Alignment.Center) {
                SymbolIcon(symbol, textSymbolSize(14f), LocalContentColor.current, Modifier.alpha(if (isFinding) 0f else 1f))
                if (isFinding) Spinner(SpinnerSize.Mini, if (prominent) Color.White else colors.dockText)
            }
            Text(title, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

/**
 * The status of the data at the top of a card while it is failing, with Try again after a failed refresh. The
 * button keeps its 44-point target and the line stays compact; with very large text the status has the whole width.
 */
@Composable
internal fun CardStatusLine(controller: ScooterMapController, status: ScooterDockStatus, modifier: Modifier = Modifier) {
    val colors = scootColors
    val isLoading = controller.isLoading.collectAsState().value
    val tryAgain = @Composable {
        Box(
            Modifier.plainButton(enabled = !isLoading, onClick = controller::retryLoad).heightIn(min = 44.dp),
            contentAlignment = Alignment.CenterStart,
        ) {
            Text(localized("Try again"), style = ScootType.caption.weight(FontWeight.SemiBold), color = colors.actionText, maxLines = 1)
        }
    }
    if (TextSize.isAccessibility) {
        Column(modifier.fillMaxWidth()) {
            DockStatusLabel(status)
            if (status.isWarning) tryAgain()
        }
    } else {
        Row(
            modifier
                .fillMaxWidth()
                .then(if (status.isWarning) Modifier.overhang(8.dp) else Modifier),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            DockStatusLabel(status, Modifier.weight(1f))
            if (status.isWarning) {
                // Spacer(minLength: 4), with the stack's 8 on each side of it.
                Spacer(Modifier.width(20.dp))
                tryAgain()
            }
        }
    }
}

/** `.padding(.vertical, -by)`: the content laid out `by` shorter at the top and at the bottom, and drawn whole. */
private fun Modifier.overhang(by: Dp): Modifier = layout { measurable, constraints ->
    val reach = by.roundToPx()
    val placeable = measurable.measure(constraints.copy(maxHeight = if (constraints.hasBoundedHeight) constraints.maxHeight + 2 * reach else Constraints.Infinity))
    layout(placeable.width, max(0, placeable.height - 2 * reach)) { placeable.place(0, -reach) }
}

/**
 * What became of a walk, on its card, fading in and out as the walk goes: no location or no route in the colour of
 * a warning; there, in green; or the scooter gone from the map.
 */
@Composable
internal fun WalkNote(note: ScooterWalkNote?, modifier: Modifier = Modifier) {
    val spring = IosMotion.snappy(duration = 0.24)
    val reduceMotion = LocalReduceMotion.current
    // The note stays as it was while it fades.
    val shown = remember { mutableStateOf(note) }
    if (note != null) shown.value = note
    AnimatedVisibility(
        visible = note != null,
        enter = if (reduceMotion) fadeIn(snap()) else fadeIn(spring.animation()) + expandVertically(spring.animation()),
        exit = if (reduceMotion) fadeOut(snap()) else fadeOut(spring.animation()) + shrinkVertically(spring.animation()),
    ) {
        shown.value?.let { WalkNoteRow(it, modifier) }
    }
}

@Composable
private fun WalkNoteRow(note: ScooterWalkNote, modifier: Modifier = Modifier) {
    val colors = scootColors
    val color = when (note) {
        ScooterWalkNote.NoLocation, ScooterWalkNote.NoRoute -> colors.warning
        ScooterWalkNote.Arrived -> colors.good
        ScooterWalkNote.Gone -> colors.secondaryText
    }
    Row(
        modifier.fillMaxWidth().padding(horizontal = 2.dp).semantics(mergeDescendants = true) {},
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        SymbolIcon(Symbols.named(note.systemImage) ?: Symbols.warning, textSymbolSize(12f), color, Modifier.alignBy(SymbolBaseline))
        Text(
            note.text,
            style = ScootType.footnote.weight(FontWeight.SemiBold),
            color = color,
            modifier = Modifier.alignByBaseline().weight(1f),
        )
    }
}
