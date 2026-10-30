package com.plhery.scootradar.map

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
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
import com.plhery.scootradar.ui.theme.FocusRing

// The web's MapCredits (src/components/MapCredits.tsx), where the iPhone shows Apple's logo and Legal link.

/**
 * Where the map comes from, as OpenStreetMap's licence and OpenFreeMap's ask (MAP-318): the map's own credits in a
 * corner of the part of it in view, as the iPhone shows Apple's logo and its Legal link there. Its text keeps its
 * size, as Apple's does, and each name opens its page. Over imagery, the imagery's credit comes first. Where the
 * chrome leaves them no room ([creditsHaveRoom]) they are not [seen]: laid out still, but not drawn, read or tapped.
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
            BasicText(
                text = name,
                style = style,
                modifier = Modifier
                    .clickable(remember { MutableInteractionSource() }, FocusRing(), enabled = seen, role = Role.Button) { uri.openUri(page) }
                    .padding(horizontal = TEXT_INSET.dp, vertical = 3.dp),
            )
        }
    }
}

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
 * as a dock that spans the map does on a phone, where the iPhone's Legal is under its dock too.
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
 * Whether the credits, [height] tall, have room [lift] above the map's foot, where [creditsOverDock] puts them: under
 * the chrome at the map's top, whose foot is [top] (the search bar and the notices under it, or the safe area's top),
 * by the gap they keep over the controls under them, and so on the map.
 *
 * A window as short as a phone's held sideways (640 by 360) or a Fold's folded (970 by 443), with a scooter's card,
 * the zones' legend and a notice open, leaves them none: the card, the legend and the notice fill the map's leading
 * side from the search bar down (review-app-v finding 2), and lifted they would show cut between them. They then wait
 * out of sight until the chrome leaves them room, as the iPhone's Legal stays under its dock; Settings' Map & data
 * credits name the map's sources all the while.
 */
internal fun creditsHaveRoom(lift: Double, height: Double, top: Double, mapHeight: Double): Boolean =
    mapHeight - lift - height >= top + LEGEND_GAP

/** The room between the legend and the credits over it. */
private const val LEGEND_GAP = 4.0

/** The room either side of a credit's name, inside its frame. */
private const val TEXT_INSET = 6.0

private val SOURCES = listOf(
    "© OpenStreetMap" to "https://www.openstreetmap.org/copyright",
    "OpenFreeMap © OpenMapTiles" to "https://openfreemap.org/",
)
