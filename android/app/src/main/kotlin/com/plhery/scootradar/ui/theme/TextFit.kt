package com.plhery.scootradar.ui.theme

import androidx.compose.foundation.text.TextAutoSize
import androidx.compose.foundation.text.modifiers.TextAutoSizeLayoutScope
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import kotlin.math.floor

/**
 * `.minimumScaleFactor(_:)`: the style's size where the text fits, or else the largest, a quarter of a dp at a time
 * below it, that does, down to `factor` of it. The factor is of the size drawn, as iOS's is of its points: under
 * Android's nonlinear font scale, `factor` of the size in sp is drawn larger than that (at 2.0, 0.8 of 18 sp is 0.88
 * of the 30 dp 18 sp are drawn at). TextAutoSize.StepBased counts its steps up from the smallest size, so with such a
 * floor a text that fits would not be drawn at its own size.
 */
internal fun shrinking(style: TextStyle, factor: Float): TextAutoSize = MinimumScale(style.fontSize, factor)

/** The size in sp that is drawn at [factor] of what [size] is drawn at. */
internal fun shrunk(size: TextUnit, factor: Float, density: Density): TextUnit = with(density) { (size.toDp() * factor).toSp() }

private data class MinimumScale(val size: TextUnit, val factor: Float) : TextAutoSize {
    override fun TextAutoSizeLayoutScope.getFontSize(constraints: Constraints, text: AnnotatedString): TextUnit {
        fun fits(px: Float) = !performLayout(constraints, text, px.toSp()).overflows()
        val largest = size.toPx()
        if (fits(largest)) return size
        val smallest = shrunk(size, factor, this).toPx()
        val step = 0.25.dp.toPx()
        val steps = floor((largest - smallest) / step).toInt()
        // The fewest steps down that fit; the floor if none does.
        var fewest = steps + 1
        var low = 1
        var high = steps
        while (low <= high) {
            val middle = (low + high) / 2
            if (fits(largest - middle * step)) {
                fewest = middle
                high = middle - 1
            } else {
                low = middle + 1
            }
        }
        return (if (fewest <= steps) largest - fewest * step else smallest).toSp()
    }
}

/** Whether the text was cut short with "…", or else took more room than it has, as StepBased judges it. */
private fun TextLayoutResult.overflows(): Boolean =
    if (layoutInput.overflow == TextOverflow.Ellipsis && lineCount > 0) {
        isLineEllipsized(lineCount - 1)
    } else {
        didOverflowWidth || didOverflowHeight
    }

/** `.dynamicTypeSize(...DynamicTypeSize.accessibility1)`: [content]'s text grows with the phone's no further than AX1. */
@Composable
internal fun TextSizeUpToAX1(content: @Composable () -> Unit) {
    val density = LocalDensity.current
    if (density.fontScale <= AX1_SCALE) {
        content()
    } else {
        CompositionLocalProvider(LocalDensity provides Density(density.density, AX1_SCALE), content = content)
    }
}

/**
 * Body text at AX1 against Large, 28 points against 17 (ui.md UI-134). Exactly that, so the body and headline styles
 * land on whole pixels: drawn at 28.05 sp, their edges came out a shade different after other tests had drawn text.
 */
private const val AX1_SCALE = 28f / 17f
