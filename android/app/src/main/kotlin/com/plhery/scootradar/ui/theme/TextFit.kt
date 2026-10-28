package com.plhery.scootradar.ui.theme

import androidx.compose.foundation.text.TextAutoSize
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.sp

/** `.minimumScaleFactor(_:)`: the style's size, or down to `factor` of it where the line would not fit. */
internal fun shrinking(style: TextStyle, factor: Float): TextAutoSize =
    TextAutoSize.StepBased(minFontSize = style.fontSize * factor, maxFontSize = style.fontSize, stepSize = 0.25.sp)
