package com.plhery.scootradar.ui.dock

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.withInfiniteAnimationFrameNanos
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
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
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.text
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.offset
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.model.ScooterDockStatus
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.glass.pressedGlass
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.FocusRing
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.TextSize
import com.plhery.scootradar.ui.theme.boldText
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
 * accessibility hint (UI-327), and [state] what it reads after the name where iOS reads an accessibility value.
 * [shows] is the text it shows where [label] says it otherwise: its text for Voice Access to answer to, as Voice
 * Control answers to the iPhone's input labels (b55719d0), which TalkBack, reading the label, leaves unread.
 * [focusRing] is the ring's shape, and white on the tint. A button that answers the finger otherwise doesn't [dim],
 * and gives the [interaction] it watches.
 */
internal fun Modifier.plainButton(
    enabled: Boolean = true,
    label: String? = null,
    hint: String? = null,
    state: String? = null,
    shows: String? = null,
    focusRing: FocusRing = FocusRing(),
    interaction: MutableInteractionSource? = null,
    dim: Boolean = true,
    onClick: () -> Unit,
): Modifier = composed {
    val source = remember(interaction) { interaction ?: MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val hovered by source.collectIsHoveredAsState()
    val dims = if (dim) {
        Modifier.graphicsLayer { alpha = if (pressed) PLAIN_PRESSED_ALPHA else if (hovered) hoveredAlpha(PLAIN_PRESSED_ALPHA) else 1f }
    } else {
        Modifier
    }
    dims
        .clickable(source, focusRing, enabled = enabled, onClickLabel = hint, role = Role.Button, onClick = onClick)
        .then(
            if (label != null) {
                Modifier.clearAndSetSemantics {
                    contentDescription = label
                    if (state != null) stateDescription = state
                    if (shows != null && shows != label) text = AnnotatedString(shows)
                    role = Role.Button
                    if (enabled) onClick(label = hint) { onClick(); true }
                }
            } else {
                Modifier
            },
        )
}

/**
 * `.buttonStyle(.glass)` and `.glassProminent`: a button of glass, which swells and lights up under the finger where a
 * plain one dims, its focus ring swelling with it (pressedGlass, ui.md UI-211). [glass] is the glass; the rest is
 * [plainButton]'s.
 */
internal fun Modifier.glassButton(
    shape: Shape,
    glass: Modifier,
    enabled: Boolean = true,
    label: String? = null,
    focusRing: FocusRing = FocusRing(shape),
    onClick: () -> Unit,
): Modifier = composed {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val hovered by interaction.collectIsHoveredAsState()
    pressedGlass(pressed && enabled, shape, glass, hovered = hovered && enabled)
        .plainButton(enabled, label, focusRing = focusRing, interaction = interaction, dim = false, onClick = onClick)
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

/** A symbol at a size in points, in a colour, with nothing to say to TalkBack; heavier under Bold Text (UI-187). */
@Composable
internal fun SymbolIcon(symbol: ImageVector, size: Dp, color: Color, modifier: Modifier = Modifier) {
    Icon(boldText(symbol), contentDescription = null, tint = color, modifier = modifier.size(size))
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

/** `@ScaledMetric(relativeTo: .body)`: [value] grown as the body, 17 points, grows with the font scale. */
@Composable
internal fun bodyMetric(value: Float): Dp = scaledMetric(value, BODY_POINTS)

/** The body text style's size at the standard text size, the one `relativeTo: .body` scales with. */
internal const val BODY_POINTS = 17f

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
            status.isLastSeen -> FadedDot()
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

/**
 * Try again beside the count or the status after a failed refresh; a spinner in its place while it loads. Beside them
 * it keeps its one line, as the iPhone's fixedSize does; under them with very large text it wraps, [wraps], where the
 * iPhone's is no longer fixed in width and has no line limit: "Opnieuw proberen" was cut short there at 320 dp.
 */
@Composable
internal fun TryAgainPill(isLoading: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier, wraps: Boolean = false) {
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
            maxLines = if (wraps) Int.MAX_VALUE else 1,
            // Wrapped, it takes the row's width: its lines centred in it, as a dock button's.
            textAlign = if (wraps) TextAlign.Center else TextAlign.Unspecified,
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

/**
 * A symbol on a tile of its tint, [size] at the standard text size: 44 points in the cards, 40 in the location card.
 * It grows with the text as the body does, up to nearly half as large again, 64 points in the cards and 58 in the
 * location card, its symbol and corners in proportion (ddd8e672).
 */
@Composable
internal fun DockSymbolTile(symbol: ImageVector, foreground: Color, tint: Color, modifier: Modifier = Modifier, size: Dp = 44.dp) {
    val side = size * (minOf(bodyMetric(44f), 64.dp) / 44.dp)
    Box(
        modifier
            .size(side)
            .clip(SquircleShape(side / 3))
            .background(tint.copy(alpha = 0.16f))
            .clearAndSetSemantics {},
        contentAlignment = Alignment.Center,
    ) {
        // `.system(size: side × 0.43)`.
        SymbolIcon(symbol, side * 0.43f * SYMBOL_FRAME, foreground)
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
 * A symbol set with `.designFont(points, relativeTo: .body, maximum:)`: [points] at the standard text size, growing
 * with the text as the body does, up to [maximum] points, where the button around it keeps its size (9d12300b).
 */
@Composable
internal fun BodySymbol(symbol: ImageVector, points: Float, maximum: Float, color: Color, modifier: Modifier = Modifier) {
    SymbolIcon(symbol, minOf(bodyMetric(points), maximum.dp) * SYMBOL_FRAME, color, modifier)
}

/**
 * A button of a dock card, 48 points high: filled with the app's blue, or quiet beside it. Its label stays on one
 * line beside another button and takes two where it has the row to itself (DockActionRow); it dims to 0.78 under the
 * finger, a little under a mouse's pointer, and to 0.6 while it can't be used.
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
            .clickable(interaction, FocusRing(shape, onTint = prominent), enabled = enabled, role = Role.Button, onClick = onClick)
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

/**
 * The label of a dock button, with a symbol before it when it has one: its text in up to two lines, centred, which it
 * takes only where its button has the row to itself, as beside another button it is given the room of one line.
 */
@Composable
internal fun DockActionLabel(title: String, symbol: ImageVector? = null) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
        if (symbol != null) {
            SymbolIcon(symbol, textSymbolSize(14f), androidx.compose.material3.LocalContentColor.current)
        }
        DockActionTitle(title)
    }
}

/**
 * A dock button's text: in up to two lines, centred. On a phone of 320 dp with the text at its largest, a label
 * stacked alone on its row, as "Ouvrir dans Lime", "Opna Lime-appið" or "Erneut versuchen", was cut short on its one
 * line, "Ouvrir dans Li…"; it now takes a second (ctl-0130-sra).
 */
@Composable
internal fun DockActionTitle(title: String) {
    Text(title, maxLines = DOCK_ACTION_LINES, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center)
}

/** The lines a dock button's label may take where its button has the row to itself. */
internal const val DOCK_ACTION_LINES = 2

/**
 * One or two buttons: side by side where their labels fit on one line, by their [weights] or in equal shares, one
 * above the other where they do not or the text is very large (DockActionLayout). Side by side, each is given at least
 * the room of its one line, so its label never wraps there; a button alone on its row may wrap its label to two.
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
            // Beside another, a button given up to half a point less than its one line takes it from the gap: its label
            // would wrap there, where before it kept its line.
            val fitted = if (count == 1) widths else widths.zip(ideal) { width, needs -> maxOf(width, needs) }
            val taken = fitted.sum() - widths.sum()
            val gap = if (count > 1) spacing - (taken + count - 2) / (count - 1) else spacing
            val height = measurables.zip(fitted).maxOfOrNull { (button, width) -> button.minIntrinsicHeight(width) } ?: 0
            val placeables = measurables.zip(fitted).map { (button, width) ->
                button.measure(Constraints.fixed(maxOf(0, width), height))
            }
            layout(placeables.sumOf { it.width } + gap * maxOf(0, count - 1), height) {
                var x = 0
                placeables.forEach {
                    it.place(x, 0)
                    x += it.width + gap
                }
            }
        }
    }
}

/**
 * The close button of a card: 40 points to look at, 44 to touch, and no bigger in the layout than 40, at the standard
 * text size; it grows with the text up to 56, its cross from 13 points up to 18 (9d12300b).
 */
@Composable
internal fun DockCloseButton(label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val colors = scootColors
    val side = minOf(bodyMetric(40f), 56.dp)
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
            .size(side)
            .clip(CapsuleShape)
            .background(colors.dockTile)
            .hairline(CapsuleShape, colors.dockHairline),
        contentAlignment = Alignment.Center,
    ) {
        BodySymbol(Symbols.close, 13f, maximum = 18f, colors.dockQuiet)
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

/**
 * Scooters drawn faded that nothing is collecting: a hollow dot, as still as they are, in front of "faded ones last
 * seen" where a spinner stands while new positions are on their way.
 */
@Composable
internal fun FadedDot() {
    val color = scootColors.secondaryText
    Canvas(Modifier.size(7.dp).clearAndSetSemantics {}) {
        val ring = 1.5.dp.toPx()
        drawCircle(color, radius = (size.minDimension - ring) / 2, style = Stroke(ring))
    }
}

/** The sizes of SwiftUI's spinner: `.controlSize(.small)` and the regular one, and `.mini`; and the chips' count's. */
internal enum class SpinnerSize(val size: Dp) {
    Small(20.dp),
    Mini(16.dp),

    /** Before the faded ones' number on a chip or in the list, while new positions of the provider are on their way. */
    Count(9.dp),
}

/**
 * iOS's activity indicator (UI-207): eight rounded spokes, the brightest going round once a second, the others
 * fading behind it. It turns under Reduce Motion too, as the iPhone's does: it reads the frames' time, as an animation
 * would not under Android's Remove animations, the app's Reduce Motion, which stopped it on the Tablet.
 */
@Composable
internal fun Spinner(size: SpinnerSize = SpinnerSize.Small, color: Color = scootColors.secondaryLabel) {
    // The spoke ahead, read as the spinner is drawn: each step draws it again, and composes nothing.
    var head by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        val start = withInfiniteAnimationFrameNanos { it }
        while (true) {
            withInfiniteAnimationFrameNanos { now -> head = ((now - start) / (TURN_NANOS / SPOKES) % SPOKES).toInt() }
        }
    }
    Canvas(Modifier.size(size.size).clearAndSetSemantics {}) {
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

/** Once round a second. */
private const val TURN_NANOS = 1_000_000_000L
