package com.plhery.scootradar.map

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.displayCutout
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.layout.union
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.ui.dock.DOCK_RADIUS
import com.plhery.scootradar.ui.theme.FocusRing
import com.plhery.scootradar.ui.theme.SQUIRCLE_EXTENT
import kotlin.math.min

// The web's MapCredits (src/components/MapCredits.tsx), where the iPhone shows Apple's logo and Legal link.

/**
 * Where the map comes from, as OpenStreetMap's licence and OpenFreeMap's ask (MAP-318): the map's own credits in a
 * corner of the part of it in view, as the iPhone shows Apple's logo and its Legal link there. Its text keeps its
 * size, as Apple's does, and each name opens its page. Over imagery, the imagery's credit comes first. Where the
 * chrome leaves them no room ([creditsHaveRoom]) they are not [seen]: laid out still, but not drawn, read or tapped,
 * and a touch on them reaches the map.
 */
@Composable
fun MapCredits(
    /** Whether the ground under the credits is dark. */
    dark: Boolean,
    modifier: Modifier = Modifier,
    /** The imagery's name and page, while it is shown. */
    imagery: Pair<String, String>? = null,
    seen: Boolean = true,
) {
    // The ground's own land and label colours (src/lib/quietGround.ts).
    val ground = if (dark) Color(0xCC0B0E14) else Color(0xCCEEF0F4)
    val label = if (dark) Color(0xFF9AA4B8) else Color(0xFF5F6878)
    val size = with(LocalDensity.current) { 10.dp.toSp() }
    val style = TextStyle(color = label, fontSize = size)
    val uri = LocalUriHandler.current
    Row(
        modifier
            .alpha(if (seen) 1f else 0f)
            .then(if (seen) Modifier else Modifier.clearAndSetSemantics { })
            .clip(RoundedCornerShape(6.dp))
            .background(ground),
    ) {
        for ((name, page) in listOfNotNull(imagery) + SOURCES) {
            val interaction = remember { MutableInteractionSource() }
            BasicText(
                text = name,
                style = style,
                modifier = Modifier
                    // Out of sight, not even disabled: a disabled clickable is still hit, and the map under them would
                    // lose a pan or a tap begun there.
                    .then(if (seen) Modifier.clickable(interaction, FocusRing(), role = Role.Button) { uri.openUri(page) } else Modifier)
                    .padding(horizontal = TEXT_INSET.dp, vertical = 3.dp),
            )
        }
    }
}

/**
 * The safe area the credits keep to: the system's bars and the display's cutout, not the keyboard. The iPhone's screen
 * ignores the keyboard's safe area at its foot (ScooterMapScreen.swift:110) and the map all of it, so Apple's Legal
 * stays in the map's margins, under the keyboard, while the search is open. In safeDrawing, which counts the keyboard,
 * they rose to 8 over it wherever the dock did not place them.
 */
internal val creditsSafeArea: WindowInsets
    @Composable get() = WindowInsets.systemBars.union(WindowInsets.displayCutout)

/**
 * How far above the map's foot the credits go, beside a panel, where the controls in the map's trailing corner, the
 * zones' legend and the locate button, would cover them, from the [credits]' sides and the [corner]'s frames in the
 * map's points: just over the highest of them over the credits, as their licence asks that they be seen. Null where
 * the corner leaves them be. Apple's logo and Legal link, a third as wide, stay where they are on the iPhone.
 *
 * On a tablet upright beside the panel the credits, from 412, reach past the legend to the locate button's side, 655:
 * over the legend alone they would run under the button (review-app-t finding 4, app-v's pass).
 */
internal fun creditsOverCorner(credits: Pair<Double, Double>?, corner: List<ScreenRect>, mapHeight: Double): Double? {
    if (credits == null) return null
    val (start, end) = credits
    // A frame laid out for the map before it turned can lie below its foot for a frame.
    val over = corner.filter { !it.isEmpty && it.minX < end && it.maxX > start && it.minY < mapHeight }
    if (over.isEmpty()) return null
    return mapHeight - over.minOf { it.minY } + LEGEND_GAP
}

/**
 * How far above the map's foot the credits go, over the dock, from the [credits]' sides, the [dock]'s frame and the
 * frames of the controls that stand on it, [onDock] (the zones' legend and the locate button), in the map's points:
 * just over the highest of them over the credits, where the dock would cut them, part of their text beside it and
 * part under it, or their frame. Null where the dock leaves them be: clear of their frame, or over all of their text,
 * as a dock that spans the map does on a phone, where the iPhone's Legal is under its dock too ([creditsUnderDock]
 * keeps them clear of its foot).
 *
 * iOS keeps Apple's logo and Legal link in the map's layout margins, which it moves only beside a panel or a fold
 * (ScooterMapView.swift:897-903): over the dock they stay in the corner. On a tablet upright the dock keeps to 560 in
 * the middle, and Legal, a third as wide as the credits, fits beside it; the credits don't, and their licence asks
 * that they be seen (MAP-318).
 */
internal fun creditsOverDock(credits: Pair<Double, Double>?, dock: ScreenRect?, onDock: List<ScreenRect>, mapHeight: Double): Double? {
    if (credits == null || dock == null || dock.isEmpty) return null
    // A dock laid out for the map before it turned can lie below its foot for a frame.
    if (dock.minY >= mapHeight) return null
    val (start, end) = credits
    val textStart = start + TEXT_INSET
    val textEnd = end - TEXT_INSET
    val underIt = dock.minX <= textStart && dock.maxX >= textEnd
    // Over the room around their text only, the dock would still cut their frame.
    val besideIt = dock.minX >= end || dock.maxX <= start
    if (underIt || besideIt) return null
    val over = (onDock + dock).filter { !it.isEmpty && it.minX < end && it.maxX > start && it.minY < mapHeight }
    return mapHeight - over.minOf { it.minY } + LEGEND_GAP
}

/**
 * How far above the map's foot the credits go under a dock over all of their text, as a phone's is, where the dock's
 * foot would cut them 8 above the safe area's foot ([safeBottom] above the map's), from the [credits]' sides, their
 * [height] and the [dock]'s frame, in the map's points: 4 below the dock where that leaves them over the safe area's
 * foot, else on the dock's foot, wholly under it. Null where the dock's foot leaves them be, below it or under it.
 *
 * The iPhone's dock stands max(safe bottom, 8) over the safe area (ScooterMapScreen.swift:313), and Apple's logo and
 * Legal link, 9 over the safe area's foot, are seen below it on a phone with a home indicator, whose 34 leave them 12
 * under the dock (the lead's iPhone 17 Pro Max screen), and under it on one with a home button, whose dock stands 8
 * over the window's foot. Phone_Min's gesture bar is 16 tall: the dock's foot, 32 above the window's, would cut the
 * credits, from 24 to 42 above it, and 4 below it they would reach into the bar; they go under it, as they were with
 * the dock 8 over the bar.
 */
internal fun creditsUnderDock(credits: Pair<Double, Double>?, height: Double, dock: ScreenRect?, safeBottom: Double, mapHeight: Double): Double? {
    if (credits == null || height <= 0 || dock == null || dock.isEmpty || dock.minY >= mapHeight) return null
    val (start, end) = credits
    // Over part of their text only, creditsOverDock takes them up over it.
    if (dock.minX > start + TEXT_INSET || dock.maxX < end - TEXT_INSET) return null
    val bottom = mapHeight - safeBottom - SAFE_GAP
    val top = bottom - height
    if (dock.maxY <= top || dock.maxY >= bottom || dock.minY > top) return null
    val below = dock.maxY + LEGEND_GAP + height
    return mapHeight - if (below <= mapHeight - safeBottom) below else dock.maxY
}

/**
 * Where the credits start, from the map's leading side, under a phone's dock over all of their text whose rounded
 * corners would show them, their foot, [foot], within the reach of its bottom corners' curve: past the curve of its
 * leading corner, wholly under its straight edge, or centred on the dock where they are wider than that edge. From the
 * [credits]' sides, their [height] and the [dock]'s frame, in the map's points, [mapWidth] wide. Null where the dock
 * leaves them be: over part of their text only ([creditsOverDock]'s), below its foot, or over it clear of the curve.
 *
 * Phone_Min upright, over its gesture bar on the dock's foot ([creditsUnderDock]) as over its 3-button bar 8 over the
 * safe area's foot, showed their "©" and their frame's corner in the dock's corner: they started at 8, and the curve
 * runs 42.8 in from the dock's side at 10 (28 radii of SquircleShape's 1.53), to 52.8. An iPhone with a home button
 * lays Legal out the same way in the map's margins, in its dock's corner (by the layout, not seen); the lead asked
 * that the credits keep clear of it (app-ad's brief).
 */
internal fun creditsStartUnderDock(
    credits: Pair<Double, Double>?,
    height: Double,
    foot: Double,
    dock: ScreenRect?,
    mapWidth: Double,
    rightToLeft: Boolean,
): Double? {
    if (credits == null || height <= 0 || dock == null || dock.isEmpty) return null
    val (start, end) = credits
    if (dock.minX > start + TEXT_INSET || dock.maxX < end - TEXT_INSET) return null
    // How far in from the corner the curve starts: no further than half the dock's shorter side, a capsule's.
    val reach = min(DOCK_RADIUS.value.toDouble() * SQUIRCLE_EXTENT, min(dock.width, dock.height) / 2)
    val top = foot - height
    // On the dock's foot to within the frames' rounding to pixels.
    if (foot > dock.maxY + ROUNDING || top < dock.minY || foot <= dock.maxY - reach) return null
    val width = end - start
    val left = if (width <= dock.width - 2 * reach) {
        if (rightToLeft) dock.maxX - reach - width else dock.minX + reach
    } else {
        dock.minX + (dock.width - width) / 2
    }
    return if (rightToLeft) mapWidth - (left + width) else left
}

/**
 * Whether the credits, [height] tall, have room [lift] above the map's foot, where [creditsOverDock] puts them: under
 * the chrome at the map's top, whose foot is [top] ([creditsCeiling]: the search bar and the notices under it, or the
 * safe area's top, and the scale under them), by the gap they keep over the controls under them, and so on the map.
 *
 * A window as short as a phone's held sideways (640 by 360) or a Fold's folded (970 by 443), with a scooter's card,
 * the zones' legend and a notice open, leaves them none: the card, the legend and the notice fill the map's leading
 * side from the search bar down (review-app-v finding 2), and lifted they would show cut between them. They then wait
 * out of sight until the chrome leaves them room, as the iPhone's Legal stays under its dock; Settings' Map & data
 * credits name the map's sources all the while.
 */
internal fun creditsHaveRoom(lift: Double, height: Double, top: Double, mapHeight: Double): Boolean =
    mapHeight - lift - height >= top + LEGEND_GAP

/**
 * The foot of what the credits keep under at the map's top, for [creditsHaveRoom]: the search bar and the notices under
 * it, whose foot is [chromeTop], or the safe area's top, [safeTop]; and in a region that measures in miles the scale
 * under them, on the credits' side, whose foot is [scaleFoot]. It shows only while the map zooms, but lifted over it
 * they would cover it then, and hide it from TalkBack under their frame (UI-121, Phone_Min sideways over its gesture
 * bar with a scooter's card: the credits from 114, the scale from 106 to 127).
 */
internal fun creditsCeiling(chromeTop: Double?, safeTop: Double, scaleFoot: Double?): Double =
    maxOf(chromeTop ?: safeTop, scaleFoot ?: safeTop)

/** The room between the legend and the credits over it. */
private const val LEGEND_GAP = 4.0

/** The room between the credits and the safe area's foot, as MapKit's logo keeps. */
private const val SAFE_GAP = 8.0

/** The room either side of a credit's name, inside its frame. */
private const val TEXT_INSET = 6.0

/** How far apart two frames measured from the same pixels can lie, rounded each its own way. */
private const val ROUNDING = 1.0

private val SOURCES = listOf(
    "© OpenStreetMap" to "https://www.openstreetmap.org/copyright",
    "OpenFreeMap © OpenMapTiles" to "https://openfreemap.org/",
)
