package com.plhery.scootradar.ui.sheet

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.ui.dock.SymbolIcon
import com.plhery.scootradar.ui.dock.textSymbolSize
import com.plhery.scootradar.ui.glass.chromeGlass
import com.plhery.scootradar.ui.theme.FocusRing
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.animation
import com.plhery.scootradar.ui.theme.iosShadow
import com.plhery.scootradar.ui.theme.scootColors

// SwiftUI's Menu of choices, drawn as the iPhone draws one (ui.md UI-404 and §10).

const val MENU_TAG = "menu"

/**
 * A `Menu`'s list of [choices], opened by what it is in: a rounded panel of glass under it, or over it where there
 * is no room under it, kept inside the window. Its rows are 44 dp high at least, separated by hairlines, and the
 * [chosen] one has a check at its end. It grows out of what opened it and fades; with Reduce Motion it fades. A tap
 * outside it, Back or a hardware keyboard's Esc closes it through [onDismiss]; a row calls [onChoose] with its index.
 */
@Composable
fun IosMenu(expanded: Boolean, onDismiss: () -> Unit, choices: List<String>, chosen: Int?, onChoose: (Int) -> Unit) {
    val visibility = remember { MutableTransitionState(false) }
    visibility.targetState = expanded
    if (!visibility.currentState && !visibility.targetState) return

    val presented by rememberUpdatedState(expanded)
    val dismiss by rememberUpdatedState(onDismiss)
    val close: () -> Unit = { if (presented) dismiss() }
    val density = LocalDensity.current
    val origin = remember { mutableStateOf(TransformOrigin(0f, 0f)) }
    val position = remember(density) { MenuPosition(density) { origin.value = it } }
    Popup(
        popupPositionProvider = position,
        onDismissRequest = close,
        // The window is larger than the menu by its shadow's room, which may reach past the screen's edge.
        properties = PopupProperties(focusable = true, clippingEnabled = false),
    ) {
        val reduceMotion = LocalReduceMotion.current
        val grow = IosMotion.snappy(duration = 0.35)
        val fade = IosMotion.smooth(duration = 0.25)
        AnimatedVisibility(
            visibleState = visibility,
            enter = if (reduceMotion) {
                fadeIn(fade.animation())
            } else {
                fadeIn(fade.animation()) + scaleIn(grow.animation(), initialScale = INITIAL_SCALE, transformOrigin = origin.value)
            },
            exit = if (reduceMotion) {
                fadeOut(fade.animation())
            } else {
                fadeOut(fade.animation()) + scaleOut(fade.animation(), targetScale = FINAL_SCALE, transformOrigin = origin.value)
            },
            label = "menu",
        ) {
            // The shadow's room, which takes a tap as outside the menu.
            Box(Modifier.pointerInput(Unit) { detectTapGestures { close() } }.padding(SHADOW_ROOM)) {
                MenuPanel(choices, chosen, onChoose, onEscape = close)
            }
        }
    }
}

@Composable
private fun MenuPanel(choices: List<String>, chosen: Int?, onChoose: (Int) -> Unit, onEscape: () -> Unit) {
    val colors = scootColors
    val shape = SquircleShape(MENU_CORNER_RADIUS)
    val window = with(LocalDensity.current) { LocalWindowInfo.current.containerSize.width.toDp() }
    Column(
        Modifier
            .widthIn(min = MENU_WIDTH, max = (window - MENU_MARGIN * 2).coerceAtLeast(MENU_WIDTH))
            .width(IntrinsicSize.Max)
            .iosShadow(shape, Color.Black.copy(alpha = SHADOW_ALPHA), radius = SHADOW_RADIUS, y = SHADOW_Y)
            // A window of its own can't blur what is under it, as the iPhone's menu does: the glass is laid on the
            // ground, so that the card's text doesn't show through between the rows.
            .background(colors.systemBackground, shape)
            .chromeGlass(shape)
            // A tap between the rows stays in the menu, rather than reaching the room around it, which would close it.
            .pointerInput(Unit) { awaitPointerEventScope { while (true) awaitPointerEvent() } }
            .testTag(MENU_TAG)
            .closedByEscape(onEscape),
    ) {
        choices.forEachIndexed { index, title ->
            if (index > 0) Box(Modifier.fillMaxWidth().height(0.5.dp).background(colors.separator))
            MenuRow(title, checked = index == chosen) { onChoose(index) }
        }
    }
}

/** A row of the menu: its title in body text, the check at its end where it is the chosen one, lit while pressed. */
@Composable
private fun MenuRow(title: String, checked: Boolean, onClick: () -> Unit) {
    val colors = scootColors
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    Row(
        Modifier
            .fillMaxWidth()
            .heightIn(min = 44.dp)
            .background(if (pressed) colors.tertiarySystemFill else Color.Transparent)
            .clickable(source, FocusRing(), role = Role.Button, onClick = onClick)
            .semantics { selected = checked }
            .padding(horizontal = 16.dp, vertical = 11.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, style = ScootType.body, color = colors.label, modifier = Modifier.weight(1f))
        if (checked) SymbolIcon(Symbols.check, textSymbolSize(17f), colors.label)
    }
}

/**
 * Where the menu goes: its leading edge on its opener's, under the opener or, where the window has no room for it
 * there, over it, and moved along to stay [MENU_MARGIN] inside the window. The popup is the menu with its shadow's
 * room around it. [onPlaced] is given the point it grows out of: the opener's middle, on the side it is on.
 */
internal class MenuPosition(density: Density, private val onPlaced: (TransformOrigin) -> Unit) : PopupPositionProvider {
    private val room = with(density) { SHADOW_ROOM.roundToPx() }
    private val margin = with(density) { MENU_MARGIN.roundToPx() }
    private val gap = with(density) { MENU_GAP.roundToPx() }

    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize): IntOffset {
        val width = popupContentSize.width - room * 2
        val height = popupContentSize.height - room * 2
        val leading = if (layoutDirection == LayoutDirection.Ltr) anchorBounds.left else anchorBounds.right - width
        val x = leading.coerceAtMost(windowSize.width - margin - width).coerceAtLeast(margin)
        val under = anchorBounds.bottom + gap
        val over = anchorBounds.top - gap - height
        val below = under + height <= windowSize.height - margin || over < margin
        val y = if (below) under.coerceAtMost(windowSize.height - margin - height).coerceAtLeast(margin) else over
        if (popupContentSize.width > 0 && popupContentSize.height > 0) {
            val middle = (anchorBounds.center.x - x + room).toFloat() / popupContentSize.width
            onPlaced(TransformOrigin(middle.coerceIn(0f, 1f), if (below) 0f else 1f))
        }
        return IntOffset(x - room, y - room)
    }
}

/** UIKit's menu width on a phone; it grows with longer titles. */
private val MENU_WIDTH = 250.dp
private val MENU_CORNER_RADIUS = 13.dp
private val MENU_MARGIN = 8.dp
private val MENU_GAP = 8.dp
private const val SHADOW_ALPHA = 0.16f
private val SHADOW_RADIUS = 24.dp
private val SHADOW_Y = 8.dp
/** Room for the shadow's blur, which runs on about twice its radius, under the menu too. */
private val SHADOW_ROOM = SHADOW_RADIUS * 2 + SHADOW_Y
private const val INITIAL_SCALE = 0.6f
private const val FINAL_SCALE = 0.9f
