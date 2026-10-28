package com.plhery.scootradar.map

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import com.plhery.scootradar.core.model.ScreenRect

// The chrome's frames that ios/ScootRadar/Views/ScooterMapScreen.swift hands its ScooterMapView in the dock's
// layout: interactionExclusionFrame, bottomChromeTop and bottomChromeFrames (ui.md UI-003, MAP-112).

/** Where the chrome over the map is, in the map's points, which are the window's: what the map keeps clear of. */
@Immutable
data class MapChrome(
    /** The search bar and the notices under it: names stay under it, and a place shown is centred below it. */
    val top: ScreenRect? = null,
    /** Where the locate button begins, over the dock: the bottom of what the map shows clear of the chrome. */
    val bottomTop: Double? = null,
    /** The locate button, the zone legend and the dock: what floats over the bottom of the map. */
    val bottomFrames: List<ScreenRect> = emptyList(),
)

/** The chrome's frames as the screen measures them, for the map under it to read. */
@Stable
class MapChromeFrames {
    var top by mutableStateOf<ScreenRect?>(null)
    var locateButton by mutableStateOf<ScreenRect?>(null)

    /** The zones' legend beside the locate button, while it shows. */
    var zoneLegend by mutableStateOf<ScreenRect?>(null)
    var dock by mutableStateOf<ScreenRect?>(null)

    val chrome: MapChrome
        get() = MapChrome(
            top = top,
            bottomTop = locateButton?.minY,
            bottomFrames = listOfNotNull(locateButton, zoneLegend, dock),
        )
}

/** The frames of the chrome drawn over the map; none where nothing is drawn over it, as in the map's own tests. */
val LocalMapChrome = staticCompositionLocalOf<MapChromeFrames?> { null }
