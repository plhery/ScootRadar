package com.plhery.scootradar.ui

import androidx.activity.compose.LocalActivity
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalDensity
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.window.layout.DisplayFeature
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.plhery.scootradar.core.model.ScooterFold
import com.plhery.scootradar.core.model.ScreenRect
import kotlin.math.max

// reservedFold(in:) of ios/ScootRadar/Views/ScooterMapScreen.swift: the fold the screen and the map keep clear of
// (ui.md UI-116), read from Jetpack WindowManager where iOS 27.1 reads its reserved division.

/**
 * The fold of a partly open foldable among a window's display `features`, in the window's points, for a `screen` at
 * that frame in the window: a fold that is partly open, standing like a laptop or open like a book. Flat or closed,
 * a foldable has none, as an iPhone Duo then reserves no division. The bounds WindowManager gives in the window's
 * pixels are handed to [ScooterFold.frame] in the screen's points, as iOS hands its reserved region.
 *
 * A seamless screen folds along a line, which WindowManager gives no width: it is taken a pixel wide. iOS reads a
 * division of no width as a phone lying flat, which WindowManager tells by the fold's state instead.
 */
fun windowFold(features: List<DisplayFeature>, screen: ScreenRect, density: Float): ScreenRect? {
    val regions = features
        .filterIsInstance<FoldingFeature>()
        .filter { it.state == FoldingFeature.State.HALF_OPENED }
        .map { fold ->
            val bounds = fold.bounds
            ScreenRect(
                bounds.left / density - screen.x,
                bounds.top / density - screen.y,
                max(bounds.width(), 1) / density.toDouble(),
                max(bounds.height(), 1) / density.toDouble(),
            )
        }
    return ScooterFold.frame(among = regions, container = screen)
}

/**
 * The fold of the window the screen is in, for a `screen` at that frame in the window, in points, as
 * WindowManager tells it while the activity is started; none flat, closed, before it has told it, or outside an
 * activity.
 */
@Composable
fun rememberWindowFold(screen: ScreenRect): ScreenRect? {
    val activity = LocalActivity.current ?: return null
    val layouts = remember(activity) { WindowInfoTracker.getOrCreate(activity).windowLayoutInfo(activity) }
    val layout: WindowLayoutInfo? by layouts.collectAsStateWithLifecycle(initialValue = null)
    val density = LocalDensity.current.density
    return remember(layout, screen, density) { layout?.let { windowFold(it.displayFeatures, screen, density) } }
}
