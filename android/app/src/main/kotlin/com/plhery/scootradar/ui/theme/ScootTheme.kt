package com.plhery.scootradar.ui.theme

import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.LocalMinimumInteractiveComponentSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp

// The app's look, as ScootRadarApp.swift's root and ScooterControls.swift's palette set it.

/**
 * The app's colours, type and motion for one appearance, with Increase Contrast's colours where the phone asks for
 * more contrast (UI-186). Material's few controls take the app's blue (UI-346) and iOS's 44 pt touch size (UI-361,
 * UI-405).
 */
@Composable
fun ScootTheme(
    dark: Boolean,
    reduceMotion: Boolean = reduceMotionSetting(),
    increasedContrast: Boolean = increasedContrastSetting(),
    content: @Composable () -> Unit,
) {
    val appearance = if (dark) ScootColors.Dark else ScootColors.Light
    val colors = if (increasedContrast) appearance.withIncreasedContrast() else appearance
    val scheme = if (dark) {
        darkColorScheme(primary = colors.accent, background = colors.systemBackground, surface = colors.systemBackground)
    } else {
        lightColorScheme(primary = colors.accent, background = colors.systemBackground, surface = colors.systemBackground)
    }
    MaterialTheme(colorScheme = scheme) {
        CompositionLocalProvider(
            LocalScootColors provides colors,
            LocalReduceMotion provides reduceMotion,
            LocalMinimumInteractiveComponentSize provides 44.dp,
            LocalContentColor provides colors.dockText,
            content = content,
        )
    }
}

/** The colours of the appearance in use. */
val scootColors: ScootColors
    @Composable @ReadOnlyComposable get() = LocalScootColors.current

/**
 * The text size switches of UI-133, from the phone's font scale (UI-134): the accessibility sizes, sizes above
 * Large, and xLarge and up.
 */
object TextSize {
    /** `dynamicTypeSize.isAccessibilitySize`. */
    val isAccessibility: Boolean
        @Composable @ReadOnlyComposable get() = LocalDensity.current.fontScale >= 1.5f

    /** `dynamicTypeSize > .large`. */
    val isAboveLarge: Boolean
        @Composable @ReadOnlyComposable get() = LocalDensity.current.fontScale > 1f

    /** `dynamicTypeSize >= .xLarge`. */
    val isXLargeOrMore: Boolean
        @Composable @ReadOnlyComposable get() = LocalDensity.current.fontScale >= 1.1f
}
