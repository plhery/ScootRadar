package com.plhery.scootradar.ui.dock

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.indication
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measured
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.offset
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.model.ScooterDockStatus
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.FocusRing
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.TextSize
import com.plhery.scootradar.ui.theme.designFont
import com.plhery.scootradar.ui.theme.hairline
import com.plhery.scootradar.ui.theme.easing
import com.plhery.scootradar.ui.theme.monospacedDigit
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.theme.weight
import kotlin.math.roundToInt

// The dock's small views in ios/ScootRadar/Views/ScooterControls.swift: DockStatusLabel, DockNoteRow, TryAgainPill,
// DockCardHeader, DockSymbolTile, DockActionRow and its style, LiveIndicator, and SwiftUI's ProgressView.

/**
 * `.buttonStyle(.plain)`: the label itself is the button, and dims while it is pressed, with no ripple, and a little
 * under a mouse's pointer, ringed while a keyboard has its focus (UI-251). Its semantics are a button's, which TalkBack names from the label unless [label] says
 * otherwise; [hint] is what a double tap does, which TalkBack says in a sentence of its own where iOS reads its
 * accessibility hint (UI-327).
 */
internal fun Modifier.plainButton(
    enabled: Boolean = true,
    label: String? = null,
    hint: String? = null,
    onClick: () -> Unit,
): Modifier = composed {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val hovered by interaction.collectIsHoveredAsState()
    graphicsLayer { alpha = if (pressed) PLAIN_PRESSED_ALPHA else if (hovered) hoveredAlpha(PLAIN_PRESSED_ALPHA) else 1f }
        .clickable(interaction, FocusRing(), enabled = enabled, onClickLabel = hint, role = Role.Button, onClick = onClick)
        .then(
            if (label != null) {
                Modifier.clearAndSetSemantics {
                    contentDescription = label
                    role = Role.Button
                    if (enabled) onClick(label = hint) { onClick(); true }
                }
            } else {
                Modifier
            },
        )
}

/** How far a plain button dims under the finger, as UIKit's highlighted label does. */
private const val PLAIN_PRESSED_ALPHA = 0.4f

/**
 * A control under the pointer of a mouse or a trackpad, which iPadOS's pointer highlights (ui.md UI-233): dimmed half
 * as far as it is under the finger, to [pressed].
 */
internal fun hoveredAlpha(pressed: Float): Float = 1f - (1f - pressed) / 2

/**
 * A control that takes its touches itself, reached with Tab as Full Keyboard Access reaches it, ringed while it has
 * the focus, and pressed with Enter or Space as a button is (ui.md UI-251): [onPress] as the key comes up. Before its
 * semantics, which would clear the focus's.
 */
internal fun Modifier.focusableControl(interaction: MutableInteractionSource? = null, onPress: () -> Unit): Modifier = composed {
    val own = remember { MutableInteractionSource() }
    val source = interaction ?: own
    onKeyEvent { event ->
        if (event.key !in PRESS_KEYS) return@onKeyEvent false
        if (event.type == KeyEventType.KeyUp) onPress()
        true
    }.indication(source, FocusRing()).focusable(interactionSource = source)
}

/** The keys that press a focused button, as Compose's clickable takes them. */
private val PRESS_KEYS = setOf(Key.Enter, Key.NumPadEnter, Key.Spacebar, Key.DirectionCenter)

/**
 * `HStack(alignment: .firstTextBaseline)` for a symbol: SF Symbols stand on the text's baseline, and Material's
 * stand on the 21st of their 24 units.
 */
internal val SymbolBaseline: (Measured) -> Int = { (it.measuredHeight * SYMBOL_BASELINE).roundToInt() }

/** Where in its box a Material symbol's glyph stands. */
internal const val SYMBOL_BASELINE = 21f / 24f

/** A symbol at a size in points, in a colour, with nothing to say to TalkBack. */
@Composable
internal fun SymbolIcon(symbol: ImageVector, size: Dp, color: Color, modifier: Modifier = Modifier) {
    Icon(symbol, contentDescription = null, tint = color, modifier = modifier.size(size))
}

/**
 * The size of a symbol set in a text style of that many points: it grows with the text, as the text does, along
 * Android 14's curve for large text, not in a straight line.
 */
@Composable
internal fun textSymbolSize(points: Float): Dp = with(LocalDensity.current) { points.sp.toDp() } * SYMBOL_FRAME

/** `@ScaledMetric(relativeTo:)`: [value] grown as a text style of [points] grows with the font scale. */
@Composable
internal fun scaledMetric(value: Float, points: Float): Dp = with(LocalDensity.current) { points.sp.toDp() } * (value / points)

/**
 * The status line under the count, and at the top of a card while data is failing. It wraps rather than lose the
 * time at its end.
 */
@Composable
internal fun DockStatusLabel(status: ScooterDockStatus, modifier: Modifier = Modifier) {
    val colors = scootColors
    val color = if (status.isWarning) colors.warning else colors.secondaryText
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
        when {
            status.isLive -> LiveIndicator()
            status.isUpdating -> Spinner(SpinnerSize.Mini)
            status.isWarning -> SymbolIcon(Symbols.warning, textSymbolSize(11f), color)
        }
        Text(status.text, style = ScootType.caption.monospacedDigit(), color = color)
    }
}

/** A calm line in the dock: a small icon and secondary text. */
@Composable
internal fun DockNoteRow(symbol: ImageVector, text: String, tint: Color? = null) {
    val colors = scootColors
    Row(Modifier.padding(start = 2.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        SymbolIcon(symbol, textSymbolSize(11f), tint ?: colors.secondaryText, Modifier.alignBy(SymbolBaseline))
        Text(text, style = ScootType.caption.monospacedDigit(), color = colors.secondaryText, modifier = Modifier.alignByBaseline())
    }
}

/** Try again beside the count or the status after a failed refresh; a spinner in its place while it loads. */
@Composable
internal fun TryAgainPill(isLoading: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val colors = scootColors
    val title = localized("Try again")
    Box(
        modifier
            .plainButton(enabled = !isLoading, label = title, onClick = onClick)
            .clip(CapsuleShape)
            .background(colors.actionText.copy(alpha = 0.12f))
            .heightIn(min = 44.dp)
            .padding(horizontal = 14.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            title,
            style = ScootType.subheadline.weight(FontWeight.SemiBold),
            color = colors.actionText,
            maxLines = 1,
            modifier = Modifier.alpha(if (isLoading) 0f else 1f),
        )
        if (isLoading) Spinner(SpinnerSize.Small)
    }
}

/** The head of a dock card: a tinted symbol, a title and the sentence under it, read as one. */
@Composable
internal fun DockCardHeader(symbol: ImageVector, tint: Color, title: String, message: String) {
    val colors = scootColors
    Row(
        Modifier.fillMaxWidth().semantics(mergeDescendants = true) {},
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        DockSymbolTile(symbol, foreground = tint, tint = tint)
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(title, style = ScootType.headline, color = colors.dockText)
            if (message.isNotEmpty()) {
                Text(message, style = ScootType.subheadline, color = colors.secondaryText)
            }
        }
    }
}

/** A symbol on a tile of its tint: 44 points in the cards, 40 in the location card. */
@Composable
internal fun DockSymbolTile(symbol: ImageVector, foreground: Color, tint: Color, modifier: Modifier = Modifier, size: Dp = 44.dp) {
    Box(
        modifier
            .size(size)
            .clip(SquircleShape(size / 3))
            .background(tint.copy(alpha = 0.16f))
            .clearAndSetSemantics {},
        contentAlignment = Alignment.Center,
    ) {
        // `.system(size: size × 0.43)`, which does not grow with the text.
        SymbolIcon(symbol, size * 0.43f * SYMBOL_FRAME, foreground)
    }
}

/**
 * A symbol of SF Symbols at a point size fills about 1.2 times that size; one of Material's fills 20 of its
 * 24 units. A Material icon of the point size times this is the same size on screen.
 */
internal const val SYMBOL_FRAME = 1.2f

/** A symbol set with `.font(.system(size:weight:))`: a fixed size, whatever the text size (UI-299). */
@Composable
internal fun FixedSymbol(symbol: ImageVector, points: Float, color: Color, modifier: Modifier = Modifier) {
    SymbolIcon(symbol, (points * SYMBOL_FRAME).dp, color, modifier)
}

/**
 * A button of a dock card, 48 points high: filled with the app's blue, or quiet beside it. Its label stays on one
 * line; it dims to 0.78 under the finger, a little under a mouse's pointer, and to 0.6 while it can't be used.
 */
@Composable
internal fun DockActionButton(
    prominent: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    label: String? = null,
    content: @Composable () -> Unit,
) {
    val colors = scootColors
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val hovered by interaction.collectIsHoveredAsState()
    val shape = SquircleShape(16.dp)
    Box(
        modifier
            .graphicsLayer {
                alpha = when {
                    pressed -> 0.78f
                    !enabled -> 0.6f
                    hovered -> hoveredAlpha(0.78f)
                    else -> 1f
                }
            }
            .clip(shape)
            .background(if (prominent) colors.cardActionFill else colors.dockQuietFill)
            .clickable(interaction, FocusRing(shape), enabled = enabled, role = Role.Button, onClick = onClick)
            .then(if (label != null) Modifier.clearAndSetSemantics { contentDescription = label } else Modifier)
            .fillMaxWidth()
            .heightIn(min = 48.dp)
            .padding(horizontal = 12.dp),
        contentAlignment = Alignment.Center,
    ) {
        androidx.compose.runtime.CompositionLocalProvider(
            androidx.compose.material3.LocalContentColor provides if (prominent) Color.White else colors.dockText,
            androidx.compose.material3.LocalTextStyle provides designFont(14f, FontWeight.Bold),
        ) {
            content()
        }
    }
}

/** The label of a dock button: its text on one line, with a symbol before it when it has one. */
@Composable
internal fun DockActionLabel(title: String, symbol: ImageVector? = null) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
        if (symbol != null) {
            SymbolIcon(symbol, textSymbolSize(14f), androidx.compose.material3.LocalContentColor.current)
        }
        Text(title, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

/**
 * One or two buttons whose labels stay on one line: side by side where they fit, by their [weights] or in equal
 * shares, one above the other where they do not or the text is very large (DockActionLayout).
 */
@Composable
internal fun DockActionRow(
    modifier: Modifier = Modifier,
    weights: List<Float> = emptyList(),
    content: @Composable () -> Unit,
) {
    val stacks = TextSize.isAccessibility
    Layout(content, modifier) { measurables, constraints ->
        val spacing = 8.dp.roundToPx()
        val count = measurables.size
        // What each button needs to keep its label on one line.
        val ideal = measurables.map { it.maxIntrinsicWidth(Constraints.Infinity) }
        val gaps = spacing * maxOf(0, count - 1)
        val available = if (constraints.hasBoundedWidth) constraints.maxWidth else (ideal.maxOrNull() ?: 0) * count + gaps
        val shares = (if (weights.size == count) weights else List(count) { 1f }).let { given ->
            val sum = maxOf(1f, given.sum())
            given.map { (available - gaps) * it / sum }
        }
        val half = 0.5f * density
        val widths: List<Int>? = when {
            count == 1 || (!stacks && ideal.zip(shares).all { (needs, share) -> needs <= share + half }) ->
                shares.map { it.roundToInt() }
            !stacks && ideal.sum() + gaps <= available + half ->
                ideal.dropLast(1) + (available - gaps - ideal.dropLast(1).sum())
            else -> null
        }
        if (widths == null) {
            val placeables = measurables.map { it.measure(Constraints(minWidth = available, maxWidth = available)) }
            val height = placeables.sumOf { it.height } + gaps
            layout(available, height) {
                var y = 0
                placeables.forEach {
                    it.place(0, y)
                    y += it.height + spacing
                }
            }
        } else {
            val height = measurables.zip(widths).maxOfOrNull { (button, width) -> button.minIntrinsicHeight(width) } ?: 0
            val placeables = measurables.zip(widths).map { (button, width) ->
                button.measure(Constraints.fixed(maxOf(0, width), height))
            }
            layout(placeables.sumOf { it.width } + gaps, height) {
                var x = 0
                placeables.forEach {
                    it.place(x, 0)
                    x += it.width + spacing
                }
            }
        }
    }
}

/** The close button of a card: 40 points to look at, 44 to touch, and no bigger in the layout than 40. */
@Composable
internal fun DockCloseButton(label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val colors = scootColors
    Box(
        modifier
            .layout { measurable, constraints ->
                // padding(2) for the touch, then padding(-2) so the layout keeps 40.
                val reach = 2.dp.roundToPx()
                val placeable = measurable.measure(constraints.offset(2 * reach, 2 * reach))
                layout(placeable.width - 2 * reach, placeable.height - 2 * reach) { placeable.place(-reach, -reach) }
            }
            .plainButton(label = label, onClick = onClick)
            .padding(2.dp)
            .size(40.dp)
            .clip(CapsuleShape)
            .background(colors.dockTile)
            .hairline(CapsuleShape, colors.dockHairline),
        contentAlignment = Alignment.Center,
    ) {
        FixedSymbol(Symbols.close, 13f, colors.dockQuiet)
    }
}

/** The green dot of live data, with a ring that grows and fades every 1.6 s; a still ring under Reduce Motion. */
@Composable
internal fun LiveIndicator() {
    val colors = scootColors
    val still = LocalReduceMotion.current
    val pulse = if (still) {
        null
    } else {
        rememberInfiniteTransition(label = "live").animateFloat(
            initialValue = 0f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(tween(1600, easing = IosMotion.easeOut.easing), RepeatMode.Restart),
            label = "pulse",
        )
    }
    Canvas(Modifier.size(7.dp).clearAndSetSemantics {}) {
        val t = pulse?.value
        val opacity = if (t == null) 0.18f else 0.32f * (1 - t)
        val scale = if (t == null) 1.35f else 0.8f + 0.95f * t
        val ring = 2.dp.toPx() * scale
        drawCircle(
            colors.systemGreen.copy(alpha = opacity),
            radius = size.minDimension / 2 * scale,
            style = Stroke(ring),
        )
        drawCircle(colors.systemGreen)
    }
}

/** The sizes of SwiftUI's spinner: `.controlSize(.small)` and the regular one, and `.mini`. */
internal enum class SpinnerSize(val size: Dp) {
    Small(20.dp),
    Mini(16.dp),
}

/**
 * iOS's activity indicator (UI-207): eight rounded spokes, the brightest going round once a second, the others
 * fading behind it. It turns under Reduce Motion too, as the iPhone's does.
 */
@Composable
internal fun Spinner(size: SpinnerSize = SpinnerSize.Small, color: Color = scootColors.secondaryLabel) {
    val turn by rememberInfiniteTransition(label = "spinner").animateFloat(
        initialValue = 0f,
        targetValue = SPOKES.toFloat(),
        animationSpec = infiniteRepeatable(tween(1000, easing = LinearEasing), RepeatMode.Restart),
        label = "turn",
    )
    Canvas(Modifier.size(size.size).clearAndSetSemantics {}) {
        val head = turn.toInt() % SPOKES
        val outer = this.size.minDimension / 2
        val width = outer * 0.2f
        val inner = outer * 0.48f
        for (spoke in 0 until SPOKES) {
            // How many steps behind the head this spoke is.
            val behind = (head - spoke + SPOKES) % SPOKES
            rotate(spoke * 360f / SPOKES) {
                drawLine(
                    color.copy(alpha = color.alpha * (1f - behind * 0.1f)),
                    start = Offset(center.x, center.y - inner),
                    end = Offset(center.x, center.y - outer + width / 2),
                    strokeWidth = width,
                    cap = StrokeCap.Round,
                )
            }
        }
    }
}

private const val SPOKES = 8
