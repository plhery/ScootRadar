package com.plhery.scootradar.map

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScreenRect

// The chrome's frames that ios/ScootRadar/Views/ScooterMapScreen.swift hands its ScooterMapView: in the dock's
// layout interactionExclusionFrame, bottomChromeTop and bottomChromeFrames, and in the panel's its panelFrame and
// the frames of the locate button and the legend in the corner; in both, the foldFrame (ui.md UI-003, MAP-112).

/** Where the chrome over the map is, in the map's points, which are the window's: what the map keeps clear of. */
@Immutable
data class MapChrome(
    /** The search bar and the notices under it: names stay under it, and a place shown is centred below it. */
    val top: ScreenRect? = null,
    /** Where the locate button begins, over the dock: the bottom of what the map shows clear of the chrome. */
    val bottomTop: Double? = null,
    /** The locate button, the zone legend and the dock: what floats over the bottom of the map. */
    val bottomFrames: List<ScreenRect> = emptyList(),
    /** A large window's panel down the leading side: the map shows what it is asked to beside it. */
    val panel: ScreenRect? = null,
    /** The fold of a partly open foldable: the map shows what it is asked to on the side of it away from the chrome. */
    val fold: ScreenRect? = null,
)

/** The chrome's frames as the screen measures them, for the map under it to read, in the layout the screen has. */
@Stable
class MapChromeFrames {
    var layout by mutableStateOf(ScooterChromeLayout.Dock)
    var top by mutableStateOf<ScreenRect?>(null)
    var locateButton by mutableStateOf<ScreenRect?>(null)

    /** The zones' legend beside the locate button, while it shows. */
    var zoneLegend by mutableStateOf<ScreenRect?>(null)
    var dock by mutableStateOf<ScreenRect?>(null)

    /** The panel, search bar, notices and card, in the panel's layout. */
    var panel by mutableStateOf<ScreenRect?>(null)

    /** The fold of a partly open foldable, in either layout. */
    var fold by mutableStateOf<ScreenRect?>(null)

    /** The search is open: on a phone the compass makes way for it (`showsMapCompass`). */
    var isSearching by mutableStateOf(false)

    /** The buttons of a desktop window's caption bar, which the compass keeps under. */
    var captionButtons by mutableStateOf(emptyList<ScreenRect>())

    val chrome: MapChrome
        get() = when (layout) {
            ScooterChromeLayout.Dock -> MapChrome(
                top = top,
                bottomTop = locateButton?.minY,
                bottomFrames = listOfNotNull(locateButton, zoneLegend, dock),
                fold = fold,
            )
            // Beside the panel the map's top is the window's, and only the corner's controls are over its bottom.
            ScooterChromeLayout.Panel -> MapChrome(
                bottomFrames = listOfNotNull(locateButton, zoneLegend),
                panel = panel,
                fold = fold,
            )
        }
}

/** The frames of the chrome drawn over the map; none where nothing is drawn over it, as in the map's own tests. */
val LocalMapChrome = staticCompositionLocalOf<MapChromeFrames?> { null }
