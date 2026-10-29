package com.plhery.scootradar.map

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.model.ScooterFold
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.easing
import com.plhery.scootradar.ui.theme.iosShadow
import org.maplibre.android.maps.MapLibreMap
import kotlin.math.abs

// The coordinator's installCompass and updateCompass, and MapKit's MKCompassButton, from
// ios/ScootRadar/Views/ScooterMapView.swift (map.md MAP-021, MAP-022, MAP-211, MAP-225, MAP-274).

/** Where the compass and the scale go over the map, as the iPhone's coordinator places them. */
internal object MapOrnaments {
    /** The compass's side, as the iPhone's constraints make it. */
    const val COMPASS_SIZE = 44.0

    /** From the safe area's trailing edge to the compass, and from its leading edge to the scale. */
    const val EDGE_GAP = 16.0

    /**
     * The top of the compass and of the scale, in the map's points (MAP-022):
     * - beside a [panel], level with its top, the compass on the far side of the map and the scale next to the panel;
     * - above a [fold] across the map, with the [search] bar on the flat half under it or no search bar: at the top of
     *   the upright half, 12 under the safe area's top;
     * - with no search bar, 80 under the safe area's top;
     * - else 12 under the search bar and what sits under it.
     *
     * The fold counts only where it crosses the map's [bounds]. Frames are in the map's points, which are the window's.
     */
    fun top(panel: ScreenRect?, fold: ScreenRect?, search: ScreenRect?, safeTop: Double, bounds: ScreenRect): Double {
        val searchBar = search?.takeIf { !it.isEmpty }
        val across = fold?.takeIf { !it.isEmpty && it.intersects(bounds) && ScooterFold.isAcross(it) }
        return when {
            panel != null && !panel.isEmpty -> panel.minY
            across != null && (searchBar == null || searchBar.minY >= across.minY) -> safeTop + 12
            searchBar == null -> safeTop + 80
            else -> searchBar.maxY + 12
        }
    }

    /**
     * The compass's [top], kept under the buttons of a desktop window's caption bar, which Android puts at its
     * trailing end where iPadOS has none: beside a panel the panel's search bar goes up beside them, and the compass
     * level with it would sit under them. It goes 12 under the lowest it meets. The compass is [COMPASS_SIZE] from
     * [EDGE_GAP] inside the trailing [safe] edge of a map [width] wide.
     */
    fun compassTop(top: Double, width: Double, safeLeft: Double, safeRight: Double, rightToLeft: Boolean, captionButtons: List<ScreenRect>): Double {
        val x = if (rightToLeft) safeLeft + EDGE_GAP else width - safeRight - EDGE_GAP - COMPASS_SIZE
        val compass = ScreenRect(x, top, COMPASS_SIZE, COMPASS_SIZE)
        val under = captionButtons.filter { !it.isEmpty && it.intersects(compass) }.maxOfOrNull { it.maxY } ?: return top
        return under + 12
    }

    /**
     * Whether the map is turned from north, which MKCompassButton's adaptive visibility shows the compass for. A
     * turn back the short way ends a hair off 0 or 360 in floating point.
     */
    fun isTurned(bearing: Double): Boolean {
        val turn = ((bearing % 360) + 360) % 360
        return minOf(turn, 360 - turn) > NORTH_TOLERANCE
    }

    /**
     * Whether the compass shows: `compassVisibility = .adaptive` while [showsMapCompass] holds, where the map is
     * turned, and `.hidden` otherwise.
     */
    fun showsCompass(bearing: Double, showsMapCompass: Boolean): Boolean = showsMapCompass && isTurned(bearing)

    /** `showsMapCompass`: in the panel's layout, or while the search is closed; beside the panel it is far from the search. */
    fun showsMapCompass(panelLayout: Boolean, isSearching: Boolean): Boolean = panelLayout || !isSearching

    private const val NORTH_TOLERANCE = 1e-6
}

/**
 * The map's camera as the compass reads it: its bearing, followed as the camera moves, a gesture's or the app's own.
 * [close] it with the map.
 */
internal class MapCameraWatch(private val map: MapLibreMap) {
    /** The map's bearing, in degrees clockwise from north. */
    var bearing by mutableDoubleStateOf(map.cameraPosition.bearing)
        private set

    private val moved = MapLibreMap.OnCameraMoveListener { read() }
    private val idle = MapLibreMap.OnCameraIdleListener { read() }

    init {
        map.addOnCameraMoveListener(moved)
        map.addOnCameraIdleListener(idle)
    }

    private fun read() {
        val camera = map.cameraPosition
        if (abs(camera.bearing - bearing) > 0) bearing = camera.bearing
    }

    fun close() {
        map.removeOnCameraMoveListener(moved)
        map.removeOnCameraIdleListener(idle)
    }
}

/**
 * MapKit's compass, which the app adds to the map itself: a disc 44 points across, its needle turned by the map's
 * [bearing] to point north, red to the north and grey to the south, under an N. It shows while the map is turned
 * from north, if [showsMapCompass] holds, fading in and out as MKCompassButton's adaptive visibility does, at once
 * under Remove animations; while it is gone it takes no taps. A tap turns the map north ([onTap]). TalkBack reads it
 * as "Compass", MapKit's word; its tag is the iPhone's accessibility identifier.
 */
@Composable
fun MapCompass(bearing: () -> Double, showsMapCompass: Boolean, dark: Boolean, onTap: () -> Unit, modifier: Modifier = Modifier) {
    // Read here, so that only the compass is drawn again as the map turns.
    val bearing = bearing()
    val shown = MapOrnaments.showsCompass(bearing, showsMapCompass)
    // MapKit doesn't say how long its compass fades; a quarter of a second, as its shortest camera move.
    val spec = if (LocalReduceMotion.current) snap() else tween<Float>(FADE_MILLIS, easing = IosMotion.easeInOut.easing)
    val opacity by animateFloatAsState(if (shown) 1f else 0f, spec, label = "compass")
    // The bearing it last showed, kept as it fades out at north.
    var lastBearing by remember { mutableDoubleStateOf(bearing) }
    if (shown) lastBearing = bearing
    if (!shown && opacity == 0f) return
    val label = localized("Compass")
    CompassDisc(
        bearing = if (shown) bearing else lastBearing,
        dark = dark,
        modifier = modifier
            .testTag(COMPASS_TAG)
            .size(MapOrnaments.COMPASS_SIZE.dp)
            .alpha(opacity)
            .then(
                if (shown) {
                    Modifier
                        .clickable(remember { MutableInteractionSource() }, indication = null, role = Role.Button, onClick = onTap)
                        .semantics { contentDescription = label }
                } else {
                    Modifier
                },
            ),
    )
}

/** The compass's art: the disc, its shadow, the needle and the N, turned by −[bearing] about its centre. */
@Composable
internal fun CompassDisc(bearing: Double, dark: Boolean, modifier: Modifier = Modifier) {
    val colors = if (dark) CompassColors.Dark else CompassColors.Light
    val measurer = rememberTextMeasurer()
    // The N keeps its size whatever the phone's font size, as MapKit's does.
    val letterSize = with(LocalDensity.current) { 10.dp.toSp() }
    val letter = TextStyle(color = colors.letter, fontSize = letterSize, fontFamily = ScootType.family(letterSize), fontWeight = FontWeight.Bold)
    Canvas(
        modifier
            .iosShadow(CircleShape, Color.Black.copy(alpha = 0.16f), radius = 4.dp, y = 1.dp),
    ) {
        val centre = center
        val radius = size.minDimension / 2
        drawCircle(colors.disc, radius, centre)
        drawCircle(colors.rim, radius - 0.25.dp.toPx(), centre, style = Stroke(0.5.dp.toPx()))
        rotate(-bearing.toFloat(), centre) {
            // The needle's waist sits a little under the centre, leaving the north end room for the N.
            val waist = centre.y + 3.dp.toPx()
            val half = 3.5.dp.toPx()
            val reach = 11.dp.toPx()
            val north = Path().apply {
                moveTo(centre.x - half, waist)
                lineTo(centre.x, waist - reach)
                lineTo(centre.x + half, waist)
                close()
            }
            val south = Path().apply {
                moveTo(centre.x - half, waist)
                lineTo(centre.x, waist + reach)
                lineTo(centre.x + half, waist)
                close()
            }
            drawPath(north, colors.north)
            drawPath(south, colors.south)
            val n = measurer.measure("N", letter)
            drawText(n, topLeft = Offset(centre.x - n.size.width / 2f, waist - reach - 1.dp.toPx() - n.size.height))
        }
    }
}

/** The compass's colours, as MapKit draws it over a light map and over a dark one. */
private enum class CompassColors(val disc: Color, val rim: Color, val north: Color, val south: Color, val letter: Color) {
    Light(
        disc = Color(0xFFFFFFFF),
        rim = Color(0x14000000),
        // systemRed and systemGray.
        north = Color(0xFFFF3B30),
        south = Color(0xFF8E8E93),
        letter = Color(0xFF3C3C43),
    ),
    Dark(
        disc = Color(0xFF2C2C2E),
        rim = Color(0x29FFFFFF),
        north = Color(0xFFFF453A),
        south = Color(0xFF8E8E93),
        letter = Color(0xFFFFFFFF),
    ),
}

/** How long the compass takes to fade in or out, in milliseconds. */
private const val FADE_MILLIS = 250

/** The compass's tag, the iPhone's accessibility identifier. */
const val COMPASS_TAG = "map-north-compass"
