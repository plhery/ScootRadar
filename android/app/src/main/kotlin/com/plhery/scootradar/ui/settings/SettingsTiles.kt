package com.plhery.scootradar.ui.settings

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.graphics.toColorInt
import com.plhery.scootradar.core.model.AppleMapStyle
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.map.GroundPalette
import com.plhery.scootradar.map.GroundPalettes
import com.plhery.scootradar.ui.dock.SymbolIcon
import com.plhery.scootradar.ui.dock.hoveredAlpha
import com.plhery.scootradar.ui.dock.textSymbolSize
import com.plhery.scootradar.ui.theme.FocusRing
import com.plhery.scootradar.ui.theme.IosWeight
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.TextSize
import com.plhery.scootradar.ui.theme.boldText
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.shrinking
import com.plhery.scootradar.ui.theme.weight

// ios/ScootRadar/Views/ScooterSettingsTiles.swift (ui.md UI-072 to UI-075).

/**
 * The choices of Settings that change how the app looks or reads, as [count] tiles side by side: a picture of the
 * choice over its name, as on the web. One above the other when the text is very large. They stand on the sheet
 * itself, not in a row of the list. TalkBack names the group [title] as it enters it.
 */
@Composable
internal fun SettingsTileRow(title: String, count: Int, tile: @Composable (index: Int, modifier: Modifier) -> Unit) {
    val group = Modifier.fillMaxWidth().selectableGroup().semantics {
        contentDescription = title
        isTraversalGroup = true
    }
    if (TextSize.isAccessibility) {
        Column(group, verticalArrangement = Arrangement.spacedBy(TILE_SPACING)) {
            repeat(count) { tile(it, Modifier.fillMaxWidth()) }
        }
    } else {
        Row(group, horizontalArrangement = Arrangement.spacedBy(TILE_SPACING)) {
            repeat(count) { tile(it, Modifier.weight(1f)) }
        }
    }
}

/** The room between two tiles: SettingsTileRow's stack spacing on the iPhone. */
internal val TILE_SPACING = 10.dp

/**
 * How far in from a tile's edges its name may reach: 1.5 clear of its 1.5 frame, where the iPhone's stands 6 in, the
 * tile's 4 and its own 2. Centred, a name that fits is drawn where the iPhone draws it, so this changes only one that
 * didn't fit: the chosen Automatic, beside its check at three quarters of its size, needed 48 of the 49 it leaves on a
 * phone 360 wide, the sheet floating, where 6 in left it 43 and cut it to "Autom…" (app-bf). English has said Auto
 * since, as the iPhone's shared string does.
 */
private val NAME_INSET = 3.dp

/**
 * A choice as a tile: its picture over its name, in a hairline frame around a faint fill, blue and checked once
 * chosen. It dims under the finger, as a plain button, and a little under a mouse's pointer; TalkBack reads it as one
 * of the group's choices, by [spokenTitle] where that differs from the name shown, which Voice Access answers to.
 */
@Composable
internal fun SettingsTile(
    title: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    spokenTitle: String = title,
    picture: @Composable () -> Unit,
) {
    val colors = scootColors
    val shape = SquircleShape(17.dp)
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val hovered by interaction.collectIsHoveredAsState()
    Column(
        modifier
            .graphicsLayer { alpha = if (pressed) 0.4f else if (hovered) hoveredAlpha(0.4f) else 1f }
            .background(if (isSelected) colors.accentColor.copy(alpha = 0.08f) else colors.quaternarySystemFill, shape)
            .border(1.5.dp, if (isSelected) colors.accentColor else colors.dockHairline, shape)
            .selectable(isSelected, interaction, FocusRing(shape), role = Role.RadioButton, onClick = onClick)
            // TalkBack reads "Automatic" where the tile shows "Auto", as the units' segment does (review choice 16).
            .then(if (spokenTitle == title) Modifier else Modifier.semantics { contentDescription = spokenTitle })
            .padding(top = 4.dp, bottom = 10.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(
            Modifier.padding(horizontal = 4.dp).fillMaxWidth().height(64.dp).clip(SquircleShape(12.dp)).clearAndSetSemantics { },
        ) { picture() }
        val style = ScootType.footnote.weight(IosWeight.semibold)
        val ink = if (isSelected) colors.actionText else colors.label
        // The chosen tile says so by more than its colour: a check before its name, the two centred together, as the
        // iPhone's since 357f0c2c (ScooterSettingsTiles.swift:42-54), hidden from TalkBack, which reads the tile as
        // selected. The name has the room the check leaves, out to NAME_INSET from the tile's edges.
        Row(
            Modifier.fillMaxWidth().padding(horizontal = NAME_INSET),
            horizontalArrangement = Arrangement.spacedBy(3.dp, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (isSelected) {
                // `checkmark.circle.fill` in the footnote, `.imageScale(.small)`.
                SymbolIcon(Symbols.checkCircleFill, textSymbolSize(13f) * 0.8f, ink, Modifier.clearAndSetSemantics { })
            }
            Text(
                title,
                style = style,
                color = ink,
                maxLines = 1,
                softWrap = false,
                // `.lineLimit(1)`: what doesn't fit at three quarters of its size ends with "…", not at the tile's edge.
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center,
                autoSize = shrinking(style, 0.75f),
                modifier = Modifier.weight(1f, fill = false),
            )
        }
    }
}

/**
 * The app in small, in the light or in the dark: the map, a few scooters, the search bar and the dock. System
 * shows half of each, and Automatic the sun over the light half and the moon over the dark one.
 */
@Composable
internal fun AppearancePicture(appearance: ScooterAppearance) {
    // Heavier under Bold Text, as iOS's SF Symbols are (UI-187).
    val sun = rememberVectorPainter(boldText(Symbols.sunFill))
    val moon = rememberVectorPainter(boldText(Symbols.moonFillRegular))
    Canvas(Modifier.fillMaxWidth().height(64.dp)) {
        when (appearance) {
            ScooterAppearance.Light -> smallScreen(isDark = false)
            ScooterAppearance.Dark -> smallScreen(isDark = true)
            ScooterAppearance.System, ScooterAppearance.Sun -> {
                smallScreen(isDark = false)
                // The half under the diagonal from the top right corner.
                val lowerHalf = Path().apply {
                    moveTo(size.width, 0f)
                    lineTo(size.width, size.height)
                    lineTo(0f, size.height)
                    close()
                }
                clipPath(lowerHalf) { smallScreen(isDark = true) }
                if (appearance == ScooterAppearance.Sun) {
                    // Between the scooters, clear of the search bar and the dock. iOS's Color(1, 0.72, 0.1) and
                    // Color(0.98, 0.92, 0.7), at the levels the iOS 27 simulator draws them (ui348): a float literal
                    // here would give the sun's 0.1 as 26 where iOS draws 25.
                    for ((painter, place, colour) in listOf(
                        Triple(sun, Offset(0.14f, 0.45f), Color(0xFFFFB819)),
                        Triple(moon, Offset(0.87f, 0.3f), Color(0xFFFAEBB3)),
                    )) {
                        // SF Symbols fill the 10 points they are drawn in; Material's fill 20 of their 24 units.
                        val side = 10.dp.toPx() * 1.2f
                        translate(place.x * size.width - side / 2, place.y * size.height - side / 2) {
                            with(painter) { draw(Size(side, side), colorFilter = ColorFilter.tint(colour)) }
                        }
                    }
                }
            }
        }
    }
}

private fun DrawScope.smallScreen(isDark: Boolean) {
    MapGround.quiet(isDark).draw(this)

    val raised = if (isDark) Color(0.086f, 0.102f, 0.141f) else Color.White
    val ink = if (isDark) Color.White else Color(0.063f, 0.075f, 0.102f)
    val edge = ink.copy(alpha = if (isDark) 0.14f else 0.08f)
    val unit = 1.dp.toPx()

    // The scooters, as the lights they are on the map: iOS's (0.2, 0.78, 0.35), (0.93, 0.16, 0.55), (0.1, 0.67, 0.86)
    // and (1, 0.55, 0.1), as the iOS 27 simulator draws them (ui348), where Compose would round each 0.1 up to 26.
    for ((place, colour) in listOf(
        Offset(0.3f, 0.34f) to Color(0xFF33C759),
        Offset(0.62f, 0.3f) to Color(0xFFED298C),
        Offset(0.47f, 0.5f) to Color(0xFF19ABDB),
        Offset(0.8f, 0.48f) to Color(0xFFFF8C19),
    )) {
        val centre = Offset(place.x * size.width, place.y * size.height)
        if (isDark) drawCircle(colour.copy(alpha = 0.3f), radius = 5.5f * unit, center = centre)
        drawCircle(colour, radius = 3f * unit, center = centre)
    }

    fun box(rect: Rect, radius: Float, fill: Color, stroke: Color? = null) {
        val path = Path().apply { addRoundRect(RoundRect(rect, CornerRadius(radius * unit))) }
        drawPath(path, fill)
        if (stroke != null) drawPath(path, stroke, style = Stroke(width = 0.5f * unit))
    }

    // The search bar.
    box(Rect(Offset(7 * unit, 5 * unit), Size(size.width - 14 * unit, 9 * unit)), 4.5f, raised, edge)

    // The dock: the distance to the nearest scooter, and two providers.
    val dock = Rect(Offset(6 * unit, size.height - 23 * unit), Size(size.width - 12 * unit, 18 * unit))
    box(dock, 6f, raised, edge)
    box(Rect(Offset(dock.left + 6 * unit, dock.top + 4 * unit), Size(20 * unit, 4 * unit)), 2f, ink.copy(alpha = 0.85f))
    for (index in 0 until 2) {
        box(
            Rect(Offset(dock.left + (6 + index * 17) * unit, dock.top + 11 * unit), Size(14 * unit, 3 * unit)),
            1.5f,
            ink.copy(alpha = 0.28f),
        )
    }
}

/**
 * A park, a river and a street in the colours of the ground of a map style. Quiet keeps to them; Standard writes
 * names on it. Satellite has no picture: Settings leaves it out while the app has no imagery (NEEDS-USER #3).
 */
@Composable
internal fun MapStylePicture(style: AppleMapStyle) {
    val isDark = scootColors.isDark
    Canvas(Modifier.fillMaxWidth().height(64.dp)) {
        MapGround.of(style, isDark).draw(this)
    }
}

/**
 * The ground of a map in a few strokes, in the colours the app's map has in the light or in the dark: the web's
 * ground (GroundPalettes), where the iPhone reads Apple's. Quiet and Standard share its colours; Standard names its
 * streets and places.
 */
private class MapGround(val land: Color, val green: Color, val water: Color, val street: Color, val names: Color?) {
    fun draw(scope: DrawScope) = with(scope) {
        val unit = 1.dp.toPx()
        drawRect(land)

        // The park, a block set at the angle of the street.
        translate(size.width * 0.2f, size.height * 0.44f) {
            rotate(-25f, pivot = Offset.Zero) {
                val park = Rect(Offset(-size.width * 0.28f, -size.height * 0.3f), Size(size.width * 0.56f, size.height * 0.6f))
                drawPath(Path().apply { addRoundRect(RoundRect(park, CornerRadius(12 * unit))) }, green)
            }
        }

        // The river crosses the street.
        translate(size.width * 0.62f, size.height / 2) {
            rotate(25f, pivot = Offset.Zero) {
                drawRect(water, Offset(-size.width * 0.1f, -size.height), Size(size.width * 0.2f, size.height * 2))
            }
        }

        translate(size.width / 2, size.height / 2) {
            rotate(-25f, pivot = Offset.Zero) {
                drawRect(street, Offset(-size.width, -4 * unit), Size(size.width * 2, 8 * unit))
                // Three names, as short strokes along the street.
                if (names != null) {
                    for ((x, y) in listOf(-0.34f to -11f, 0.02f to -11f, 0.2f to 9f)) {
                        drawRoundRect(names, Offset(size.width * x, y * unit), Size(20 * unit, 3 * unit), CornerRadius(1.5f * unit))
                    }
                }
            }
        }
    }

    companion object {
        fun quiet(isDark: Boolean): MapGround = of(AppleMapStyle.Quiet, isDark)

        fun of(style: AppleMapStyle, isDark: Boolean): MapGround {
            val palette: GroundPalette = if (isDark) GroundPalettes.night else GroundPalettes.day
            return MapGround(
                land = palette.land.color,
                green = palette.green.color,
                water = palette.water.color,
                street = palette.major.color,
                names = if (style == AppleMapStyle.Quiet) null else palette.label.color,
            )
        }

        private val String.color: Color get() = Color(toColorInt())
    }
}
