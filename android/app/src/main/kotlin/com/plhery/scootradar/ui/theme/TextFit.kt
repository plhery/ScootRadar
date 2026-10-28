package com.plhery.scootradar.ui.theme

import androidx.compose.foundation.text.TextAutoSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.sp

/** `.minimumScaleFactor(_:)`: the style's size, or down to `factor` of it where the line would not fit. */
internal fun shrinking(style: TextStyle, factor: Float): TextAutoSize =
    TextAutoSize.StepBased(minFontSize = style.fontSize * factor, maxFontSize = style.fontSize, stepSize = 0.25.sp)

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
