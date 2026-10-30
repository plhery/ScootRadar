package com.plhery.scootradar.ui.chrome

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
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
 * locate button, as on the web (ZoneLegend.tsx). Taps go through it to the map, but for a city's line, whose
 * authority, who sets it, is a link: then it takes them all.
 */
@Composable
fun ZoneLegend(
    state: ScooterZoneState,
    /** The operators' zones drawn. */
    count: Int,
    /**
     * The cities' rules and zones over the map, whether or not the zones are on: a line for each kind, hours and
     * who sets them, linked to where they say so (as on the web, ZoneLegend.tsx).
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
    val lines = ruleLines(rules, link = colors.dockText, focus = colors.accent)
    val note = zoneLegendNote(state, count, rules = lines.isNotEmpty(), notices = notices.isNotEmpty())
    val zones = localized("Zones")
    val style = ScootType.caption.weight(FontWeight.Medium)
    Column(
        modifier
            .testTag(ZONE_LEGEND_TAG)
            .chromeGlass(SquircleShape(16.dp))
            .then(if (lines.isEmpty()) Modifier else Modifier.overTheMap())
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
        } else if (showsKinds(state, count)) {
            val labels = ScooterZoneKind.operatorKinds.map { it.label }
            FlowRow(
                Modifier.clearAndSetSemantics {
                    contentDescription = zones
                    stateDescription = labels.joinToString(", ")
                },
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                for (kind in ScooterZoneKind.operatorKinds) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
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
    }
}

/** The legend's tag, by which the tests find its frame on the screen. */
const val ZONE_LEGEND_TAG = "zoneLegend"

/** The kinds are listed while the zones are on, but where they are shown and there are none. */
private fun showsKinds(state: ScooterZoneState, count: Int): Boolean =
    state != ScooterZoneState.Off && !(state == ScooterZoneState.Shown && count == 0)

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

/** A city's line: one for each kind, authority, hours and whether they hold now. */
internal class RuleLine(val key: String, val kind: ScooterZoneKind, val inForce: Boolean, val text: AnnotatedString)

/**
 * The lines, the strongest rule first: "No riding 12:00–23:00 · Seoul", "Parking · Porto". The city's name is a link,
 * white on the [focus] colour while a keyboard is on it, as iPadOS rings a link in the tint (UI-251).
 */
internal fun ruleLines(rules: List<CityRuleZone.Shown>, link: Color, focus: Color = link): List<RuleLine> {
    val lines = mutableListOf<RuleLine>()
    // Hundreds of a city's zones may be in view, and make a few lines.
    val keys = mutableSetOf<String>()
    for (kind in ScooterZoneKind.entries) {
        for (shown in rules) {
            if (shown.rule.kind != kind) continue
            val hours = shown.rule.hours.joinToString(", ") { "${wallTime(it.fromMinute)}–${wallTime(it.untilMinute)}" }
            val key = "${kind.rawValue} ${shown.rule.authority} $hours ${shown.inForce}"
            if (!keys.add(key)) continue
            val text = buildAnnotatedString {
                append(if (hours.isEmpty()) "${kind.label} · " else "${kind.label} $hours · ")
                withLink(
                    LinkAnnotation.Url(
                        shown.rule.source,
                        TextLinkStyles(
                            style = SpanStyle(color = link, textDecoration = TextDecoration.Underline),
                            focusedStyle = SpanStyle(color = Color.White, background = focus),
                        ),
                    ),
                ) { append(shown.rule.authority) }
                if (!shown.inForce) append(" (${localized("not now")})")
            }
            lines += RuleLine(key, kind, shown.inForce, text)
        }
    }
    return lines
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
