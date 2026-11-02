package com.plhery.scootradar.ui.chrome

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.addOutline
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withLink
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.CityZoneDownloads
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneLook
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.isolated
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.ui.glass.chromeGlass
import com.plhery.scootradar.ui.spokenPlainly
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight
import java.time.Instant
import java.time.ZoneOffset

// ZoneLegend and ZoneSwatch in ios/ScootRadar/Views/ScooterControls.swift (ui.md UI-092, UI-093, UI-174, UI-285,
// UI-348, UI-409).

/**
 * What the colours of the zones mean while they are on, or why none are drawn, at the foot of the map beside the
 * locate button, as on the web (ZoneLegend.tsx). Each kind is named once, the strongest rule first, whether the
 * operators or a city set it; who sets a city's is credited once, small, at the foot. Taps go through it to the map,
 * but where it credits a city, whose name is a link: then it takes them all.
 */
@Composable
fun ZoneLegend(
    state: ScooterZoneState,
    /** The operators' zones drawn. */
    count: Int,
    /**
     * The cities' rules and zones over the map, whether or not the zones are on: their kinds among the operators', a
     * line for any whose hours set it apart, and who sets them, linked to where they say so (as on the web,
     * ZoneLegend.tsx).
     */
    rules: List<CityRuleZone.Shown>,
    modifier: Modifier = Modifier,
    /**
     * The cities over the map whose zones are downloaded and not drawn: a line for each, that they are on their way or
     * unavailable, so that no zones drawn never reads as none published there.
     */
    notices: List<CityZoneDownloads.Notice> = emptyList(),
) {
    val colors = scootColors
    val note = zoneLegendNote(state, count, rules = rules.isNotEmpty(), notices = notices.isNotEmpty())
    val kinds = legendKinds(state, count, rules, besideNote = note != null)
    val lines = ruleLines(rules)
    val credit = zoneCredit(rules, link = colors.dockSecondary, focus = colors.accent)
    val zones = localized("Zones")
    val style = ScootType.caption.weight(FontWeight.Medium)
    val scroll = rememberScrollState()
    // Taller than its room when last measured: only then is it a scroll, which takes every touch on it, even turned off.
    var scrolls by remember { mutableStateOf(false) }
    Column(
        modifier
            .testTag(ZONE_LEGEND_TAG)
            // Read whole, then the locate button beside it, as the iPhone's HStack lists the two (F5): TalkBack's
            // order by position read the button between the kinds and the cities' lines under them.
            .semantics { isTraversalGroup = true }
            .chromeGlass(SquircleShape(16.dp))
            .then(if (credit == null) Modifier else Modifier.overTheMap())
            // Inside the glass, as tall as the room it is given at most, and scrolled where it is taller (the locate
            // row's ceiling under the search bar, UI-410): a tap or a drag goes to the map under it until then.
            .scrollsWhereShort(scroll, scrolls) { scrolls = it }
            .padding(horizontal = 12.dp, vertical = 7.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        if (note != null) {
            Text(
                note,
                style = style,
                color = colors.dockSecondary,
                modifier = Modifier.clearAndSetSemantics {
                    contentDescription = zones
                    stateDescription = note
                },
            )
        }
        if (kinds.isNotEmpty()) {
            val labels = kinds.map { it.label }
            FlowRow(
                Modifier.clearAndSetSemantics {
                    contentDescription = zones
                    stateDescription = labels.joinToString(", ")
                },
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                for (kind in kinds) {
                    // As wide as its one line, in the FlowRow's intrinsics too, which pack by an item's least width
                    // (a Text's longest word): the legend's height asked beside the locate button is then the one it
                    // takes (LocateRow, UI-410).
                    Row(
                        Modifier.width(IntrinsicSize.Max),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        ZoneSwatch(kind)
                        Text(kind.label, style = style, color = colors.dockText, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                }
            }
        }
        for (line in lines) {
            Row(
                Modifier.semantics(mergeDescendants = true) {},
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                ZoneSwatch(line.kind, Modifier.alpha(if (line.inForce) 1f else CityRuleZone.dimmed.toFloat()))
                Text(line.text, style = style, color = colors.dockText)
            }
        }
        for (notice in notices) {
            Text(noticeText(notice), style = style, color = colors.dockSecondary)
        }
        if (credit != null) {
            Text(credit, style = ScootType.caption2, color = colors.dockSecondary, modifier = Modifier.spokenPlainly(credit))
        }
    }
}

/**
 * Scrolls by [state] where it is given less height than it takes, which [scrolls] says it was when last measured, and
 * is no scroll at all until then: a scroll, even one turned off, takes every touch on it, which the map under the legend
 * should have (review-legend-cap B1). [onScrollsChange] hears it from each measure that bounds the height, never from a
 * measure of intrinsics, which would turn it to and fro. Where nothing bounds its height, as where a test measures the
 * legend, it is as tall as it takes: a scroll may not be measured unbounded.
 */
private fun Modifier.scrollsWhereShort(state: ScrollState, scrolls: Boolean, onScrollsChange: (Boolean) -> Unit): Modifier =
    layout { measurable, constraints ->
        val tall = measurable.maxIntrinsicHeight(constraints.maxWidth)
        if (constraints.hasBoundedHeight) onScrollsChange(tall > constraints.maxHeight)
        val bounded = if (constraints.hasBoundedHeight) constraints else constraints.copy(maxHeight = maxOf(constraints.minHeight, tall))
        val placeable = measurable.measure(bounded)
        layout(placeable.width, placeable.height) { placeable.place(0, 0) }
    }.then(if (scrolls) Modifier.verticalScroll(state) else Modifier)

/** The legend's tag, by which the tests find its frame on the screen. */
const val ZONE_LEGEND_TAG = "zoneLegend"

/**
 * Each kind once, the strongest rule first: the operators' while they are drawn, unless a note stands for them
 * ([besideNote]), and those of the cities' [rules] that hold at all hours.
 */
internal fun legendKinds(state: ScooterZoneState, count: Int, rules: List<CityRuleZone.Shown>, besideNote: Boolean): List<ScooterZoneKind> {
    val operators = !besideNote && state != ScooterZoneState.Off && !(state == ScooterZoneState.Shown && count == 0)
    return ScooterZoneKind.entries.filter { kind ->
        (operators && kind in ScooterZoneKind.operatorKinds) || rules.any { it.rule.kind == kind && it.rule.hours.isEmpty() && it.inForce }
    }
}

/**
 * What the legend says instead of the kinds: never that no zones are published where a city's are drawn ([rules]), or
 * where a city's are on their way or unavailable ([notices]).
 */
internal fun zoneLegendNote(state: ScooterZoneState, count: Int, rules: Boolean, notices: Boolean): String? = when {
    state == ScooterZoneState.ZoomIn -> localized("Zoom in to see the zones")
    state == ScooterZoneState.Failed -> localized("Zones unavailable right now")
    state == ScooterZoneState.Shown && count == 0 && !rules && !notices -> localized("No zones published here")
    else -> null
}

/** "Loading Berlin’s zones…", "Berlin’s zones unavailable right now". */
internal fun noticeText(notice: CityZoneDownloads.Notice): String = when (notice.state) {
    CityZoneDownloads.Notice.State.Loading -> stringFormat(localized("Loading %@’s zones…"), notice.city.place.isolated)
    CityZoneDownloads.Notice.State.Unavailable -> stringFormat(localized("%@’s zones unavailable right now"), notice.city.place.isolated)
}

/** A city's line, for a rule whose hours set it apart or that does not hold yet: one for each kind, hours and whether they hold now. */
internal class RuleLine(val key: String, val kind: ScooterZoneKind, val inForce: Boolean, val text: String)

/** The lines, the strongest rule first: "No riding 12:00–23:00", "No riding (not now)". */
internal fun ruleLines(rules: List<CityRuleZone.Shown>): List<RuleLine> {
    val lines = mutableListOf<RuleLine>()
    // Hundreds of a city's zones may be in view, and make a few lines.
    val keys = mutableSetOf<String>()
    for (kind in ScooterZoneKind.entries) {
        for (shown in rules) {
            if (shown.rule.kind != kind || (shown.rule.hours.isEmpty() && shown.inForce)) continue
            val hours = shown.rule.hours.joinToString(", ") { "${wallTime(it.fromMinute)}–${wallTime(it.untilMinute)}" }
            val key = "${kind.rawValue} $hours ${shown.inForce}"
            if (!keys.add(key)) continue
            var text = if (hours.isEmpty()) kind.label else "${kind.label} $hours"
            if (!shown.inForce) text += " (${localized("not now")})"
            lines += RuleLine(key, kind, shown.inForce, text)
        }
    }
    return lines
}

/**
 * Who sets the cities' rules, each once, the strongest rule's first, linked to where they say so: "Bergen kommune ·
 * Seoul, lines © OpenStreetMap". Each name is a link, white on the [focus] colour while a keyboard is on it, as iPadOS
 * rings a link in the tint (UI-251).
 */
internal fun zoneCredit(rules: List<CityRuleZone.Shown>, link: Color, focus: Color = link): AnnotatedString? {
    val credited = ScooterZoneKind.entries.flatMap { kind -> rules.filter { it.rule.kind == kind } }.distinctBy { it.rule.authority }
    if (credited.isEmpty()) return null
    return buildAnnotatedString {
        credited.forEachIndexed { index, shown ->
            if (index > 0) append(" · ")
            withLink(
                LinkAnnotation.Url(
                    shown.rule.source,
                    TextLinkStyles(
                        style = SpanStyle(color = link, textDecoration = TextDecoration.Underline),
                        focusedStyle = SpanStyle(color = Color.White, background = focus),
                    ),
                ),
            ) { append(shown.rule.authority) }
        }
    }
}

/** "23:00" or "11:00 PM", a time on the place's clock in the user's format (formatWallTime on the web). */
private fun wallTime(minute: Int): String =
    ScooterDateFormat.skeleton("jm", Instant.ofEpochSecond(minute * 60L), ZoneOffset.UTC, ScooterLanguage.current.locale)

/**
 * A zone as the map draws it, so that the edge and the hatching tell the kinds apart without their colours, in the
 * app's appearance: 16 by 12 points, its corners rounded by 3, filled faintly, no riding hatched every 4 points, and
 * its edge a point in, solid, dashed or dotted.
 */
@Composable
fun ZoneSwatch(kind: ScooterZoneKind, modifier: Modifier = Modifier) {
    val color = Color(ScooterZoneLook.color(kind, isDark = scootColors.isDark))
    Canvas(modifier.size(16.dp, 12.dp)) {
        val shape = SquircleShape(3.dp).createOutline(size, layoutDirection, this)
        drawOutline(shape, color.copy(alpha = swatchFillOpacity(kind)))
        if (kind == ScooterZoneKind.NoRide) {
            clipPath(Path().apply { addOutline(shape) }) {
                val step = 4.dp.toPx()
                var c = 0f
                while (c <= size.width + size.height) {
                    drawLine(color.copy(alpha = 0.55f), Offset(c, 0f), Offset(c - size.height, size.height), strokeWidth = 1.5.dp.toPx())
                    c += step
                }
            }
        }
        // `shape.inset(by: 1)`: a point in, its corners rounded by a point less.
        val inset = 1.dp.toPx()
        val edge = SquircleShape(2.dp).createOutline(Size(size.width - 2 * inset, size.height - 2 * inset), layoutDirection, this)
        val dashes = when (kind) {
            ScooterZoneKind.NoRide, ScooterZoneKind.Parking -> null
            ScooterZoneKind.NoParking -> floatArrayOf(4.dp.toPx(), 2.5.dp.toPx())
            ScooterZoneKind.Slow -> floatArrayOf(0.1.dp.toPx(), 3.5.dp.toPx())
        }
        translate(inset, inset) {
            drawOutline(
                edge,
                color,
                style = Stroke(
                    width = 2.dp.toPx(),
                    cap = if (kind == ScooterZoneKind.Slow) StrokeCap.Round else StrokeCap.Butt,
                    pathEffect = dashes?.let { PathEffect.dashPathEffect(it) },
                ),
            )
        }
    }
}

/** How strongly the swatch is filled: a city's parking places as strongly as on the map, so that they show. */
private fun swatchFillOpacity(kind: ScooterZoneKind): Float = when (kind) {
    ScooterZoneKind.NoRide, ScooterZoneKind.NoParking -> 0.16f
    ScooterZoneKind.Slow -> 0.1f
    ScooterZoneKind.Parking -> 0.25f
}
