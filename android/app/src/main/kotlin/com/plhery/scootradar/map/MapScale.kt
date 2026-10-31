package com.plhery.scootradar.map

import android.icu.util.LocaleData
import android.icu.util.Measure
import android.icu.util.MeasureUnit
import android.icu.util.ULocale
import android.icu.text.MeasureFormat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.model.ScooterLengthUnit
import com.plhery.scootradar.core.model.ScooterMeasureFormat
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.atOnceUnderReduceMotion
import com.plhery.scootradar.ui.theme.easing
import kotlinx.coroutines.delay
import java.math.BigDecimal
import java.util.Locale
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.pow

// ScooterMapScalePolicy and the coordinator's installScale, with MapKit's MKScaleView, from
// ios/ScootRadar/Views/ScooterMapView.swift (map.md MAP-023, MAP-275, MAP-292).

/** The map's scale: whether it shows, and the length it shows (MAP-023). */
object MapScale {
    /**
     * Whether the map shows a scale while it zooms: where the region measures in miles, so a rider can judge feet and
     * miles on the map as Apple Maps lets them. Metric regions keep the map as it was. The [locale] is the one the
     * app formats with: its language in the phone's region, which the measurement system follows.
     */
    fun showsScale(locale: Locale): Boolean =
        LocaleData.getMeasurementSystem(ULocale.forLocale(locale)) != LocaleData.MeasurementSystem.SI

    /** A length the scale shows: a round number of feet or miles, and how long it is on the map, in points. */
    data class Step(val value: BigDecimal, val unit: ScooterLengthUnit, val points: Double)

    /**
     * The longest of MapKit's round lengths that fits in [MAXIMUM_WIDTH] points, at [metresPerPoint]: 1, 2 and 5 times
     * a power of ten, in feet below a tenth of a mile and in miles from there.
     */
    fun step(metresPerPoint: Double): Step? {
        if (!(metresPerPoint > 0)) return null
        val most = MAXIMUM_WIDTH * metresPerPoint
        return STEPS.lastOrNull { (value, unit) -> metres(value, unit) <= most }
            ?.let { (value, unit) -> Step(value, unit, metres(value, unit) / metresPerPoint) }
    }

    /**
     * How many metres a point of the map spans at its centre, flat: MapLibre's world is 512 points wide at zoom 0
     * (tools/mapkit-probe/FINDINGS.md).
     */
    fun metresPerPoint(zoom: Double, latitude: Double): Double =
        2 * PI * EARTH_RADIUS * cos(latitude * PI / 180) / (512 * 2.0.pow(zoom))

    private fun metres(value: BigDecimal, unit: ScooterLengthUnit): Double = value.toDouble() * when (unit) {
        ScooterLengthUnit.Miles -> METRES_PER_MILE
        else -> METRES_PER_FOOT
    }

    /** The longest the scale's bar grows, in points; MapKit doesn't say its own. */
    const val MAXIMUM_WIDTH = 120.0

    private const val EARTH_RADIUS = 6_378_137.0
    private const val METRES_PER_FOOT = 0.3048
    private const val METRES_PER_MILE = 1_609.344

    private val STEPS: List<Pair<BigDecimal, ScooterLengthUnit>> = run {
        val decades = listOf("1", "2", "5")
        val feet = listOf("", "0", "00").flatMap { zeros -> decades.map { BigDecimal(it + zeros) to ScooterLengthUnit.Feet } }
        val miles = (-1..4).flatMap { power -> decades.map { BigDecimal(it).scaleByPowerOfTen(power).stripTrailingZeros() } }
            .map { (if (it.scale() < 0) it.setScale(0) else it) to ScooterLengthUnit.Miles }
        feet + miles
    }
}

/**
 * MapKit's scale with its adaptive visibility, as the app adds it to the map in a region that measures in miles: it
 * fades in as the map's zoom starts to change, and out a second after it last changed, at once under Remove
 * animations. A bar of a round length, in two segments, with "0" over its leading end and the length over its other.
 * TalkBack reads the length in words; its tag is the iPhone's accessibility identifier. It takes no touches: the map
 * zooming under it goes on.
 */
@Composable
fun MapScaleBar(
    /** How many metres a point of the map spans, read as the map moves. */
    metresPerPoint: () -> Double,
    /** How many times the map's zoom has changed, counted as it moves. */
    zoomChanges: () -> Int,
    locale: Locale,
    dark: Boolean,
    modifier: Modifier = Modifier,
) {
    if (!remember(locale) { MapScale.showsScale(locale) }) return
    val changes = zoomChanges()
    // The zoom as the scale found it is no change: the map opened where it was.
    val opened = remember { changes }
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(changes) {
        if (changes == opened) return@LaunchedEffect
        visible = true
        delay(HOLD_MILLIS)
        visible = false
    }
    // Under Remove animations there, or gone, in the frame it shows or goes (UI-184).
    val spec = if (LocalReduceMotion.current) snap() else tween<Float>(FADE_MILLIS, easing = IosMotion.easeInOut.easing)
    val target = if (visible) 1f else 0f
    val opacity by animateFloatAsState(target, spec, label = "scale").atOnceUnderReduceMotion(target)
    if (!visible && opacity == 0f) return
    val step = MapScale.step(metresPerPoint()) ?: return
    ScaleArt(step, locale, dark, modifier.alpha(opacity))
}

/** The scale's bar and legend for a [step], the legend in [locale]'s words. */
@Composable
internal fun ScaleArt(step: MapScale.Step, locale: Locale, dark: Boolean, modifier: Modifier = Modifier) {
    val ink = if (dark) Color.White else Color.Black
    val halo = if (dark) Color.Black.copy(alpha = 0.6f) else Color.White.copy(alpha = 0.9f)
    val style = scaleStyle(LocalDensity.current, ink, halo)
    val legend = ScooterMeasureFormat.length(step.value, step.unit, locale)
    val spoken = remember(step, locale) { spokenLength(step, locale) }
    val rightToLeft = LocalLayoutDirection.current == LayoutDirection.Rtl
    Column(modifier.testTag(SCALE_TAG).clearAndSetSemantics { contentDescription = spoken }) {
        // "0" over the leading end, and the length ending over the other, or after the "0" where the bar is short.
        Layout(
            content = {
                BasicText("0", style = style)
                BasicText(legend, style = style)
            },
        ) { measurables, _ ->
            val (zero, length) = measurables.map { it.measure(Constraints()) }
            val bar = step.points.dp.roundToPx()
            val gap = 4.dp.roundToPx()
            val height = maxOf(zero.height, length.height)
            layout(maxOf(bar, zero.width + gap + length.width), height) {
                zero.placeRelative(0, height - zero.height)
                length.placeRelative(maxOf(bar - length.width, zero.width + gap), height - length.height)
            }
        }
        Spacer(Modifier.height(LEGEND_TO_BAR.dp))
        Canvas(Modifier.width(step.points.dp).height(BAR_HEIGHT.dp)) {
            val line = 1.dp.toPx()
            val half = size.width / 2
            val top = size.height - 4.dp.toPx()
            val first = if (rightToLeft) half else 0f
            val second = if (rightToLeft) 0f else half
            // Two segments, dark then light from the leading end, in an outline, with ticks at the ends and the middle.
            drawRect(halo, Offset(0f, top - line), Size(size.width, size.height - top + line))
            drawRect(ink, Offset(first, top), Size(half, size.height - top - line))
            drawRect(if (dark) Color(0xFF8E8E93) else Color.White, Offset(second, top), Size(half, size.height - top - line))
            drawRect(ink, Offset(0f, top), Size(size.width, size.height - top), style = Stroke(line))
            for (x in listOf(line / 2, half, size.width - line / 2)) {
                drawLine(ink, Offset(x, 0f), Offset(x, size.height), strokeWidth = line)
            }
        }
    }
}

/** The scale's legend: MapKit's keeps its size whatever the phone's font size, as the map's own art does. */
private fun scaleStyle(density: Density, ink: Color = Color.Black, halo: Color = Color.Transparent): TextStyle {
    val textSize = with(density) { 11.dp.toSp() }
    return TextStyle(
        color = ink,
        fontSize = textSize,
        fontFamily = ScootType.family(textSize),
        fontWeight = FontWeight.SemiBold,
        shadow = Shadow(halo, blurRadius = with(density) { 2.dp.toPx() }),
    )
}

/**
 * How tall the scale stands, in points, whatever its length: a line of its legend over its bar. The credits lifted
 * over the dock keep under it, where the map shows it (ScooterMap).
 */
internal fun scaleHeight(measurer: TextMeasurer, density: Density): Double =
    with(density) { measurer.measure("0", scaleStyle(density)).size.height.toDp().value.toDouble() } + LEGEND_TO_BAR + BAR_HEIGHT

/** The room between the scale's legend and its bar. */
private const val LEGEND_TO_BAR = 2.0

/** The scale's bar, its ticks' height. */
private const val BAR_HEIGHT = 6.0

/** The length as TalkBack reads it: "500 feet", "1 mile". */
internal fun spokenLength(step: MapScale.Step, locale: Locale): String {
    val unit = if (step.unit == ScooterLengthUnit.Miles) MeasureUnit.MILE else MeasureUnit.FOOT
    return MeasureFormat.getInstance(ULocale.forLocale(locale), MeasureFormat.FormatWidth.WIDE).format(Measure(step.value, unit))
}

/** How long the scale stays after the zoom last changed, in milliseconds: about a second, as MKScaleView's. */
private const val HOLD_MILLIS = 1_000L

/** How long it takes to fade in or out. */
private const val FADE_MILLIS = 250

/** The scale's tag, the iPhone's accessibility identifier. */
const val SCALE_TAG = "map-scale"
