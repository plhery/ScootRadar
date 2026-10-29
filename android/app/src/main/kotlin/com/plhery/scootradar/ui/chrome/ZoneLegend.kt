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
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneLook
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.glass.chromeGlass
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight
import java.time.Instant
import java.time.ZoneOffset

// ZoneLegend and ZoneSwatch in ios/ScootRadar/Views/ScooterControls.swift (ui.md UI-092, UI-093, UI-174, UI-285,
// UI-348).

/**
 * What the colours of the zones mean while they are on, or why none are drawn, at the foot of the map beside the
 * locate button, as on the web (ZoneLegend.tsx). Taps go through it to the map, but for a city's line, whose
 * authority is a link: then it takes them all.
 */
@Composable
fun ZoneLegend(
    state: ScooterZoneState,
    /** The operators' zones drawn. */
    count: Int,
    /**
     * The streets over the map where a city forbids riding, each a line of its own whether or not the zones are on:
     * its hours, and who forbids it, linked to where they say so (as on the web, ZoneLegend.tsx).
     */
    rules: List<CityRuleZone.Shown>,
    modifier: Modifier = Modifier,
) {
    val colors = scootColors
    val lines = ruleLines(rules, link = colors.dockText)
    val note = note(state, count, rules = lines.isNotEmpty())
    val zones = localized("Zones")
    val style = ScootType.caption.weight(FontWeight.Medium)
    Column(
        modifier
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
                ZoneSwatch(ScooterZoneKind.NoRide, Modifier.alpha(if (line.inForce) 1f else CityRuleZone.dimmed.toFloat()))
                Text(line.text, style = style, color = colors.dockText)
            }
        }
    }
}

/** The kinds are listed while the zones are on, but where they are shown and there are none. */
private fun showsKinds(state: ScooterZoneState, count: Int): Boolean =
    state != ScooterZoneState.Off && !(state == ScooterZoneState.Shown && count == 0)

private fun note(state: ScooterZoneState, count: Int, rules: Boolean): String? = when {
    state == ScooterZoneState.ZoomIn -> localized("Zoom in to see the zones")
    state == ScooterZoneState.Failed -> localized("Zones unavailable right now")
    state == ScooterZoneState.Shown && count == 0 && !rules -> localized("No zones published here")
    else -> null
}

/** A city's line: one for each authority, hours and whether they hold now. */
private class RuleLine(val key: String, val inForce: Boolean, val text: AnnotatedString)

private fun ruleLines(rules: List<CityRuleZone.Shown>, link: Color): List<RuleLine> {
    val lines = mutableListOf<RuleLine>()
    for (shown in rules) {
        val hours = shown.rule.hours.joinToString(", ") { "${wallTime(it.fromMinute)}–${wallTime(it.untilMinute)}" }
        val key = "${shown.rule.authority} $hours ${shown.inForce}"
        if (lines.any { it.key == key }) continue
        val text = buildAnnotatedString {
            append("${ScooterZoneKind.NoRide.label} $hours · ")
            withLink(
                LinkAnnotation.Url(
                    shown.rule.source,
                    TextLinkStyles(SpanStyle(color = link, textDecoration = TextDecoration.Underline)),
                ),
            ) { append(shown.rule.authority) }
            if (!shown.inForce) append(" (${localized("not now")})")
        }
        lines += RuleLine(key, shown.inForce, text)
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
