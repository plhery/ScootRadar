package com.plhery.scootradar.ui.chrome

import android.icu.text.MeasureFormat
import android.icu.util.Measure
import android.icu.util.MeasureUnit
import android.icu.util.ULocale
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
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
import androidx.compose.ui.text.withLink
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.CityZoneDownloads
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterMeasurementSystem
import com.plhery.scootradar.core.model.ScooterNumberFormat
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneLook
import com.plhery.scootradar.core.model.ScooterZoneSpeeds
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.isolated
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.measurementSystem
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.ui.glass.chromeGlass
import com.plhery.scootradar.ui.spokenPlainly
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight
import java.time.Instant
import java.time.ZoneOffset
import java.util.Locale
import kotlin.math.floor

// ZoneLegend and ZoneSwatch in ios/ScootRadar/Views/ScooterControls.swift (ui.md UI-092, UI-093, UI-174, UI-285,
// UI-348, UI-409).

/**
 * What the colours of the zones mean while they are on, or why none are drawn, at the foot of the map beside the
 * locate button, as on the web (ZoneLegend.tsx). Each kind is named once, the strongest rule first, whether the
 * operators or a city set it, and slow with the limit of the slow zones it counts where each has one, "Slow: 6 km/h";
 * who sets a city's is credited once, small, at the foot. Taps go through it to the map, but where it credits a city,
 * whose name is a link: then it takes them all.
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
    /** The limits of the operators' slow zones drawn, which "Slow" says, with the cities', while their kinds are named. */
    slowSpeeds: ScooterZoneSpeeds = ScooterZoneSpeeds(),
) {
    val colors = scootColors
    val note = zoneLegendNote(state, count, rules = rules.isNotEmpty(), notices = notices.isNotEmpty())
    val kinds = legendKinds(state, count, rules, besideNote = note != null)
    val speeds = legendKindSpeeds(state, count, slowSpeeds, rules, besideNote = note != null)
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
            // row's ceiling under the search bar, UI-410; the iPhone's maximumHeight, ScooterControls.swift:2955-2969):
            // a tap or a drag goes to the map under it until then.
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
            val labels = kinds.map { kindLabel(it, speeds) }
            KindsFlow(
                Modifier.clearAndSetSemantics {
                    contentDescription = zones
                    stateDescription = labels.joinToString(", ")
                },
            ) {
                for ((kind, label) in kinds.zip(labels)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                        ZoneSwatch(kind)
                        Text(label, style = style, color = colors.dockText)
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
                ZoneSwatch(line.kind, Modifier.alpha(if (line.inForce) 1f else CityRuleZone.dimmed.toFloat()), timed = line.timed)
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

/**
 * The kinds one after another as FlowRow lays them out, 12 apart and 4 between their lines, each in a line at most: a
 * name longer than the line wraps beside its swatch, as the iPhone's has since f80a9728 (ScooterControls.swift:3002;
 * its `.lineLimit(1)` cut it short, "No park…", and "Stationnement int…" on ScootRadar_Phone_Min in French). Its
 * intrinsic height at a width is the one it takes there, a wrapped name's lines too, so the locate row's choice
 * (LocateRow, UI-410) and the scroll's ([scrollsWhereShort]) see the legend as it is drawn: FlowRow asks an item's
 * height at its least width, which for a name kept to one line is that line, however much wider than the row.
 */
@Composable
private fun KindsFlow(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Layout(content, modifier, KindsFlowPolicy)
}

private object KindsFlowPolicy : MeasurePolicy {
    private val gap = 12.dp
    private val lineGap = 4.dp

    override fun MeasureScope.measure(measurables: List<Measurable>, constraints: Constraints): MeasureResult {
        // Each as wide as its one line, or the whole line where that is narrower.
        val placeables = measurables.map { it.measure(Constraints(maxWidth = constraints.maxWidth)) }
        val lines = lines(placeables.map { it.width }, placeables.map { it.height }, constraints.maxWidth, gap.roundToPx())
        val height = lines.sumOf { it.height } + lineGap.roundToPx() * (lines.size - 1).coerceAtLeast(0)
        return layout(constraints.constrainWidth(lines.maxOfOrNull { it.width } ?: 0), constraints.constrainHeight(height)) {
            var y = 0
            for (line in lines) {
                var x = 0
                for (index in line.items) {
                    placeables[index].placeRelative(x, y)
                    x += placeables[index].width + gap.roundToPx()
                }
                y += line.height + lineGap.roundToPx()
            }
        }
    }

    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int): Int =
        intrinsicHeight(measurables, width) { maxIntrinsicHeight(it) }

    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int): Int =
        intrinsicHeight(measurables, width) { minIntrinsicHeight(it) }

    /** All on one line. */
    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int): Int =
        measurables.sumOf { it.maxIntrinsicWidth(Constraints.Infinity) } + gap.roundToPx() * (measurables.size - 1).coerceAtLeast(0)

    /** The widest of the kinds at its narrowest, its name wrapped at each space. */
    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int): Int =
        measurables.maxOfOrNull { it.minIntrinsicWidth(Constraints.Infinity) } ?: 0

    private fun IntrinsicMeasureScope.intrinsicHeight(
        measurables: List<IntrinsicMeasurable>,
        width: Int,
        heightAt: IntrinsicMeasurable.(Int) -> Int,
    ): Int {
        val widths = measurables.map { minOf(it.maxIntrinsicWidth(Constraints.Infinity), width) }
        val heights = measurables.mapIndexed { index, it -> it.heightAt(widths[index]) }
        val lines = lines(widths, heights, width, gap.roundToPx())
        return lines.sumOf { it.height } + lineGap.roundToPx() * (lines.size - 1).coerceAtLeast(0)
    }

    private class Line(val items: List<Int>, val width: Int, val height: Int)

    /** The items in lines of [maxWidth] at most, as FlowRow breaks them: the next goes on a new line where it doesn't fit. */
    private fun lines(widths: List<Int>, heights: List<Int>, maxWidth: Int, gap: Int): List<Line> {
        val lines = mutableListOf<Line>()
        var items = mutableListOf<Int>()
        var width = 0
        var height = 0
        for (index in widths.indices) {
            if (items.isNotEmpty() && width.toLong() + gap + widths[index] > maxWidth) {
                lines += Line(items, width, height)
                items = mutableListOf()
                width = 0
                height = 0
            }
            width += (if (items.isEmpty()) 0 else gap) + widths[index]
            height = maxOf(height, heights[index])
            items += index
        }
        if (items.isNotEmpty()) lines += Line(items, width, height)
        return lines
    }
}

/** The legend's tag, by which the tests find its frame on the screen. */
const val ZONE_LEGEND_TAG = "zoneLegend"

/**
 * Each kind once, the strongest rule first: the operators' while they are drawn, unless a note stands for them
 * ([besideNote]), as none does beside an answer with zones left out or with a feed's zones unreadable while others'
 * are drawn, and those of the cities' [rules] that hold at all hours.
 */
internal fun legendKinds(state: ScooterZoneState, count: Int, rules: List<CityRuleZone.Shown>, besideNote: Boolean): List<ScooterZoneKind> {
    val operators = namesOperatorKinds(state, count, besideNote)
    return ScooterZoneKind.entries.filter { kind ->
        (operators && kind in ScooterZoneKind.operatorKinds) || rules.any { it.rule.kind == kind && it.rule.hours.isEmpty() && it.inForce }
    }
}

/**
 * The limits "Slow" says among the kinds: the operators' slow zones' ([slowSpeeds]) while their kinds are named, and
 * those of the cities' slow [rules] that hold at all hours.
 */
internal fun legendKindSpeeds(
    state: ScooterZoneState,
    count: Int,
    slowSpeeds: ScooterZoneSpeeds,
    rules: List<CityRuleZone.Shown>,
    besideNote: Boolean,
): ScooterZoneSpeeds = rules
    .filter { it.rule.kind == ScooterZoneKind.Slow && it.rule.hours.isEmpty() && it.inForce }
    .fold(if (namesOperatorKinds(state, count, besideNote)) slowSpeeds else ScooterZoneSpeeds()) { speeds, shown ->
        speeds + shown.rule.maxSpeedKph
    }

/**
 * Whether the operators' kinds are named: while their zones are drawn, unless a note stands for them; beside the note
 * of an answer with zones left out, and of one with a feed's zones unreadable while others' are drawn ([count]), they
 * are named still (week review, finding 3.3).
 */
private fun namesOperatorKinds(state: ScooterZoneState, count: Int, besideNote: Boolean): Boolean =
    (!besideNote || state == ScooterZoneState.Partial || (state == ScooterZoneState.Failed && count > 0)) &&
        state != ScooterZoneState.Off && !(state == ScooterZoneState.Shown && count == 0)

/**
 * The kind's name, which TalkBack reads too; a slow one's with the limits of the zones it counts where each has one:
 * "Slow: 6 km/h", "Slow: 6–15 km/h".
 */
internal fun kindLabel(kind: ScooterZoneKind, speeds: ScooterZoneSpeeds, locale: Locale = ScooterLanguage.current.locale): String {
    val range = speeds.known
    if (kind != ScooterZoneKind.Slow || range == null) return kind.label
    return stringFormat(localized("Slow: %@"), speedText(range, locale))
}

/**
 * "6 km/h", or from the least to the greatest, "6–15 km/h"; in mph where the region measures distances in miles
 * ("10 mph"). Each is rounded down to a whole number, once converted, unless within a tenth of the next whole one, so
 * that none is said above the limit: 6 km/h (3.73 mph) is 3 mph and 25 km/h (15.53) 15, a UK 10 mph zone 10 mph,
 * written 16.09 km/h (9.998) or, as Dott writes it, 16 km/h (9.94) (Desk cards 350, item 7, and 353), and a US 8 mph
 * zone, 12.87 km/h, 12 km/h, not 13 (fresh-eyes review of 14 November 2026). As on the web (formatSpeedLimits) and the
 * iPhone (e17fb7f5). Whole on
 * its line: where the legend wraps a slow zone's name, it breaks before the speed, never in it, where a line may break
 * after "/" or "–" ("Velocidade reduzida: 5 km/" over "h" beside the locate button, Portuguese at font scale 1.3 on
 * ScootRadar_Phone_Min).
 */
internal fun speedText(range: ClosedFloatingPointRange<Double>, locale: Locale = ScooterLanguage.current.locale): String {
    val miles = locale.measurementSystem != ScooterMeasurementSystem.Metric
    val whole = { kph: Double -> floor((if (miles) kph / KM_PER_MILE else kph) + 0.1).toLong() }
    val least = whole(range.start)
    val greatest = whole(range.endInclusive)
    val unit = if (miles) MeasureUnit.MILE_PER_HOUR else MeasureUnit.KILOMETER_PER_HOUR
    val withUnit = MeasureFormat.getInstance(ULocale.forLocale(locale), MeasureFormat.FormatWidth.SHORT).format(Measure(greatest, unit))
    val speed = if (least == greatest) withUnit else "${ScooterNumberFormat.integer(least, locale)}–$withUnit"
    return speed.replace(' ', '\u00A0').replace("/", "/$WORD_JOINER").replace("–", "–$WORD_JOINER")
}

/** No line breaks on either side of it, and nothing drawn. */
private const val WORD_JOINER = '\u2060'

private const val KM_PER_MILE = 1.609344

/**
 * What the legend says instead of the kinds, or above them where some zones were left out, or could not be read while
 * others are drawn: never that no zones are published where a city's are drawn ([rules]), or where a city's are on
 * their way or unavailable ([notices]).
 */
internal fun zoneLegendNote(state: ScooterZoneState, count: Int, rules: Boolean, notices: Boolean): String? = when {
    // Some zones were left out of the area's answer: those drawn are named, and zoomed in, all are.
    state == ScooterZoneState.ZoomIn || state == ScooterZoneState.Partial -> localized("Zoom in to see the zones")
    // Some could not be read: those of the others drawn are named under it.
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
internal class RuleLine(
    val key: String,
    val kind: ScooterZoneKind,
    val inForce: Boolean,
    /** Its hours set it apart: its swatch hatched the other way, as the map draws it. */
    val timed: Boolean,
    val text: String,
)

/**
 * The lines, the strongest rule first, a slow one's with the limit of its own zones: "No riding 12:00–23:00",
 * "Slow: 12 km/h (not now)".
 */
internal fun ruleLines(rules: List<CityRuleZone.Shown>): List<RuleLine> {
    class Line(val key: String, val kind: ScooterZoneKind, val inForce: Boolean, val hours: String, var speeds: ScooterZoneSpeeds)
    // Hundreds of a city's zones may be in view, and make a few lines.
    val lines = LinkedHashMap<String, Line>()
    for (kind in ScooterZoneKind.entries) {
        for (shown in rules) {
            if (shown.rule.kind != kind || (shown.rule.hours.isEmpty() && shown.inForce)) continue
            val hours = shown.rule.hours.joinToString(", ") { "${wallTime(it.fromMinute)}–${wallTime(it.untilMinute)}" }
            val key = "${kind.rawValue} $hours ${shown.inForce}"
            val line = lines.getOrPut(key) { Line(key, kind, shown.inForce, hours, ScooterZoneSpeeds()) }
            if (kind == ScooterZoneKind.Slow) line.speeds += shown.rule.maxSpeedKph
        }
    }
    return lines.values.map { line ->
        val label = kindLabel(line.kind, line.speeds)
        var text = if (line.hours.isEmpty()) label else "$label ${line.hours}"
        if (!line.inForce) text += " (${localized("not now")})"
        RuleLine(line.key, line.kind, line.inForce, timed = line.hours.isNotEmpty(), text = text)
    }
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
 * app's appearance: 16 by 12 points, its corners rounded by 3, filled faintly, no riding hatched every 4 points, the
 * other way for a city's rule with hours ([timed]), and its edge a point in, solid, dashed or dotted.
 */
@Composable
fun ZoneSwatch(kind: ScooterZoneKind, modifier: Modifier = Modifier, timed: Boolean = false) {
    val color = Color(ScooterZoneLook.color(kind, isDark = scootColors.isDark))
    Canvas(modifier.size(16.dp, 12.dp)) {
        val shape = SquircleShape(3.dp).createOutline(size, layoutDirection, this)
        drawOutline(shape, color.copy(alpha = swatchFillOpacity(kind)))
        if (kind == ScooterZoneKind.NoRide) {
            clipPath(Path().apply { addOutline(shape) }) {
                val step = 4.dp.toPx()
                var c = 0f
                while (c <= size.width + size.height) {
                    val (top, bottom) = if (timed) size.height to 0f else 0f to size.height
                    drawLine(color.copy(alpha = 0.55f), Offset(c, top), Offset(c - size.height, bottom), strokeWidth = 1.5.dp.toPx())
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
