package com.plhery.scootradar.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.plhery.scootradar.R

// SwiftUI's text styles and ScooterControls.swift's designFont (ui.md UI-356 to UI-360).

/**
 * The app's type: Inter (SIL Open Font License 1.1, NEEDS-USER #2) where the iPhone app has SF Pro. Sizes are in sp,
 * so they follow the phone's font size as iOS's follow Dynamic Type.
 */
object ScootType {
    private val weights = listOf(400, 500, 600, 700, 800, 900)
    private val families = mutableMapOf<Float, FontFamily>()

    /**
     * Inter at a size: its optical size follows the text's, from the text cut at 14 to the display cut at 32, as
     * SF Pro goes from Text to Display.
     */
    fun family(size: TextUnit): FontFamily = synchronized(families) {
        families.getOrPut(size.value) {
            FontFamily(
                weights.map { weight ->
                    Font(
                        R.font.inter_variable,
                        weight = FontWeight(weight),
                        variationSettings = FontVariation.Settings(
                            FontVariation.weight(weight),
                            FontVariation.opticalSizing(size),
                        ),
                    )
                },
            )
        }
    }

    /** A text style at an iOS size in points, which is sp here. */
    fun style(size: Float, weight: FontWeight = FontWeight.Normal, tabular: Boolean = false): TextStyle =
        TextStyle(
            fontFamily = family(size.sp),
            fontWeight = weight,
            fontSize = size.sp,
            fontFeatureSettings = if (tabular) "tnum" else null,
        )

    /** `.headline`. */
    val headline = style(17f, FontWeight.SemiBold)

    /** `.body`. */
    val body = style(17f)

    /** `.subheadline`. */
    val subheadline = style(15f)

    /** `.footnote`. */
    val footnote = style(13f)

    /** `.caption`. */
    val caption = style(12f)

    /** `.caption2`. */
    val caption2 = style(11f)
}

/** `.monospacedDigit()`. */
fun TextStyle.monospacedDigit(): TextStyle = copy(fontFeatureSettings = "tnum")

/** `.fontWeight(_:)` on a style. */
fun TextStyle.weight(weight: FontWeight): TextStyle = copy(fontWeight = weight)

/**
 * ScooterControls.swift's `designFont(size, weight, relativeTo:)`, with `.tracking(_:)`: SwiftUI's tracking is in points,
 * whatever the text size, so it is kept in dp.
 */
@Composable
@ReadOnlyComposable
fun designFont(size: Float, weight: FontWeight = FontWeight.Normal, tracking: Float = 0f, tabular: Boolean = false): TextStyle {
    val style = ScootType.style(size, weight, tabular)
    if (tracking == 0f) return style
    return style.copy(letterSpacing = with(LocalDensity.current) { tracking.dp.toSp() })
}

/** iOS's weights by name (UI-357). */
object IosWeight {
    val regular = FontWeight.Normal
    val medium = FontWeight.Medium
    val semibold = FontWeight.SemiBold
    val bold = FontWeight.Bold
    val heavy = FontWeight.ExtraBold
    val black = FontWeight.Black
}
