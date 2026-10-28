package com.plhery.scootradar.ui

import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.unit.Dp
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.map.MapKitCamera
import com.plhery.scootradar.ui.theme.TextSize

// The size classes and the chrome layout of ScooterMapScreen's body, from ios/ScootRadar/Views/ScooterMapScreen.swift.

/**
 * The window's size classes, as iOS hands them to the screen: regular across from 600 dp, the width from which
 * Android counts a window as a tablet's, and regular up and down from 480 dp, which a phone held sideways stays
 * under. A window regular both ways is an iPad's; a phone's, a folded foldable's and a narrow window on a tablet
 * are compact one way or the other.
 */
data class SizeClasses(val regularWidth: Boolean, val regularHeight: Boolean) {
    /** Regular both ways, as an iPad's full screen and its larger windows are. */
    val isRegular: Boolean get() = regularWidth && regularHeight

    /** How MapKit's camera would stand on a map in the window: the iPad's in a window regular both ways. */
    val mapKit: MapKitCamera get() = MapKitCamera.of(isRegular)

    companion object {
        /** The width, in dp, from which a window is regular across. */
        const val REGULAR_WIDTH = 600.0

        /** The height, in dp, from which a window is regular up and down. */
        const val REGULAR_HEIGHT = 480.0

        /** The size classes of a window `width` by `height` dp, its system bars included. */
        fun of(width: Double, height: Double): SizeClasses = SizeClasses(width >= REGULAR_WIDTH, height >= REGULAR_HEIGHT)
    }
}

/** The size classes of the window the composition is in, which follow it as it is turned or resized. */
@Composable
fun windowSizeClasses(): SizeClasses {
    val size = LocalWindowInfo.current.containerDpSize
    return SizeClasses.of(size.width.value.toDouble(), size.height.value.toDouble())
}

/**
 * The screen's chrome in a window of `classes`, for a screen `width` dp across inside its safe area, as the
 * iPhone's GeometryReader measures it: the panel beside the map in a window regular both ways with room for both,
 * the dock under it otherwise (UI-007, UI-008). The `current` layout holds until the map would be too narrow.
 */
fun chromeLayout(width: Double, classes: SizeClasses, largeText: Boolean, current: ScooterChromeLayout): ScooterChromeLayout =
    ScooterChromeLayout.resolve(
        width = width,
        regularWidth = classes.regularWidth,
        regularHeight = classes.regularHeight,
        largeText = largeText,
        current = current,
    )

/**
 * The screen's [chromeLayout] for a screen `width` wide, less the safe area's sides. The last layout is held from
 * one size to the next, as the screen's `chromeLayout` state is, so that a window resized across the line doesn't
 * switch back and forth; it is chosen again at every size, with no new activity.
 */
@Composable
fun rememberChromeLayout(width: Dp): ScooterChromeLayout {
    val density = LocalDensity.current
    val direction = LocalLayoutDirection.current
    val safe = WindowInsets.safeDrawing
    val sides = with(density) { (safe.getLeft(density, direction) + safe.getRight(density, direction)).toDp() }
    val held = remember { arrayOf(ScooterChromeLayout.Dock) }
    val layout = chromeLayout((width - sides).value.toDouble(), windowSizeClasses(), TextSize.isAccessibility, current = held[0])
    // `.onChange(of: layout, initial: true) { chromeLayout = layout }`
    SideEffect { held[0] = layout }
    return layout
}
