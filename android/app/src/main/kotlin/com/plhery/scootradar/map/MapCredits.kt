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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.ui.theme.FocusRing

// The web's MapCredits (src/components/MapCredits.tsx), where the iPhone shows Apple's logo and Legal link.

/**
 * Where the map comes from, as OpenStreetMap's licence and OpenFreeMap's ask (MAP-318): the map's own credits in a
 * corner of the part of it in view, as the iPhone shows Apple's logo and its Legal link there. Its text keeps its
 * size, as Apple's does, and each name opens its page. Over imagery, the imagery's credit comes first.
 */
@Composable
fun MapCredits(
    /** Whether the ground under the credits is dark. */
    dark: Boolean,
    modifier: Modifier = Modifier,
    /** The imagery's name and page, while it is shown. */
    imagery: Pair<String, String>? = null,
) {
    // The ground's own land and label colours (src/lib/quietGround.ts).
    val ground = if (dark) Color(0xCC0B0E14) else Color(0xCCEEF0F4)
    val label = if (dark) Color(0xFF9AA4B8) else Color(0xFF5F6878)
    val size = with(LocalDensity.current) { 10.dp.toSp() }
    val style = TextStyle(color = label, fontSize = size)
    val uri = LocalUriHandler.current
    Row(modifier.clip(RoundedCornerShape(6.dp)).background(ground)) {
        for ((name, page) in listOfNotNull(imagery) + SOURCES) {
            BasicText(
                text = name,
                style = style,
                modifier = Modifier
                    .clickable(remember { MutableInteractionSource() }, FocusRing(), role = Role.Button) { uri.openUri(page) }
                    .padding(horizontal = 6.dp, vertical = 3.dp),
            )
        }
    }
}

private val SOURCES = listOf(
    "© OpenStreetMap" to "https://www.openstreetmap.org/copyright",
    "OpenFreeMap © OpenMapTiles" to "https://openfreemap.org/",
)
