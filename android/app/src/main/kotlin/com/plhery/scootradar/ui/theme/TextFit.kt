package com.plhery.scootradar.ui.theme

import android.icu.text.BreakIterator
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
 *
 * On more lines than one, SwiftUI counts a word broken in the middle, one longer than the line, as not fitting, as it
 * does a text cut short: the search bar's "Bahnhofstrasse" at the accessibility sizes is drawn smaller, on one line
 * where it fits so, and else broken at `factor` of its size (SwiftUI's own layout, drawn with ImageRenderer, app-bb).
 *
 * The iPhone draws in SF, which runs 2 to 4% narrower than the Inter drawn here (CoreText, the search bar's
 * placeholder in the nine languages at 15, 19.5 and 27 points: 0.962 to 0.985), so a text it fits at `factor` could be
 * cut here: "Search city or addre…" at 360 dp with text at 1.3. Where that is all it lacks, the text goes on down to
 * [SF_IN_INTER] of the floor, as wide as the iPhone's at its floor; one that fits at none of those sizes is drawn at
 * `factor` of its size, as before.
 */
internal fun shrinking(style: TextStyle, factor: Float): TextAutoSize = MinimumScale(style.fontSize, factor)

/** SF's width against Inter's for the same text and size, at the narrowest measured. */
internal const val SF_IN_INTER = 0.96f

/** The size in sp that is drawn at [factor] of what [size] is drawn at. */
internal fun shrunk(size: TextUnit, factor: Float, density: Density): TextUnit = with(density) { (size.toDp() * factor).toSp() }

private data class MinimumScale(val size: TextUnit, val factor: Float) : TextAutoSize {
    override fun TextAutoSizeLayoutScope.getFontSize(constraints: Constraints, text: AnnotatedString): TextUnit {
        val breaks = lazy { BreakIterator.getLineInstance().apply { setText(text.text) } }
        fun fits(px: Float) = performLayout(constraints, text, px.toSp()).let { !it.overflows() && !it.breaksAWord(breaks) }
        val largest = size.toPx()
        if (fits(largest)) return size
        val atFactor = shrunk(size, factor, this)
        val smallest = atFactor.toPx() * SF_IN_INTER
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
        return if (fewest <= steps) (largest - fewest * step).toSp() else atFactor
    }
}

/**
 * One line where the text fits on one at the style's size, or else at the largest size, a quarter of a dp at a time
 * below it, down to `factor` of it, that does; where it fits on one line at none of them, it wraps whole at the style's
 * size. Never cut: a text with more lines than one is laid out with as many as it needs. The factor is of the size
 * drawn, as in [shrinking].
 */
internal fun oneLineShrinkingTo(style: TextStyle, factor: Float): TextAutoSize = OneLineOrWrapping(style.fontSize, factor)

private data class OneLineOrWrapping(val size: TextUnit, val factor: Float) : TextAutoSize {
    override fun TextAutoSizeLayoutScope.getFontSize(constraints: Constraints, text: AnnotatedString): TextUnit {
        fun fits(px: Float) = performLayout(constraints, text, px.toSp()).let { it.lineCount <= 1 && !it.overflows() }
        val largest = size.toPx()
        if (fits(largest)) return size
        val smallest = shrunk(size, factor, this).toPx()
        if (!fits(smallest)) return size
        val step = 0.25.dp.toPx()
        val steps = floor((largest - smallest) / step).toInt()
        // The fewest steps down that fit on one line; the floor, which does, if none of them does.
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
        return if (fewest <= steps) (largest - fewest * step).toSp() else shrunk(size, factor, this)
    }
}

/**
 * Whether a line ends inside a word: where no line may break, as only a word too long for the line is broken. [breaks]
 * are the text's own places where a line may break.
 */
private fun TextLayoutResult.breaksAWord(breaks: Lazy<BreakIterator>): Boolean {
    val length = layoutInput.text.length
    return (0 until lineCount - 1).any { line ->
        val end = getLineEnd(line)
        end in 1 until length && !breaks.value.isBoundary(end)
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
