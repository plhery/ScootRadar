package com.plhery.scootradar.ui.sheet

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.absoluteOffset
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.AbsoluteAlignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.focusTarget
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathOperation
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.addOutline
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.traversalIndex
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.LocalScootColors
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.animation
import com.plhery.scootradar.ui.theme.iosShadow
import com.plhery.scootradar.ui.theme.scootColors
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

// `.popover(isPresented:)` on the panel's search bar in ios/ScootRadar/Views/ScooterMapScreen.swift, as an iPad
// draws one (ui.md UI-061, UI-129, UI-209, UI-231; PLAN §10's own popover with an arrow).

/** The popover's test tag. */
const val POPOVER_TAG = "popover"

/**
 * A popover from [anchor]: under it, its arrow at the middle of the anchor's bottom edge, its body centred on the
 * arrow and kept inside the window's safe area, as tall as what it shows or as the room under the anchor, where
 * that scrolls. It fades and grows in from its arrow, and fades out. A tap outside it, which reaches nothing under
 * it, Back or a hardware keyboard's Esc closes it.
 */
@Composable
fun IosPopover(
    isPresented: Boolean,
    /** Called as a tap outside or Back closes the popover: the presenter sets [isPresented] false. */
    onDismiss: () -> Unit,
    /** The frame of what the popover points at, in the window, in pixels. */
    anchor: Rect?,
    /** What TalkBack says as the popover opens, as VoiceOver reads the navigation title. */
    title: String,
    modifier: Modifier = Modifier,
    /** What the popover shows, as tall as it needs under the room it is given, where it scrolls. */
    content: @Composable () -> Unit,
) {
    val visibility = remember { MutableTransitionState(false) }
    visibility.targetState = isPresented && anchor != null
    // Where it pointed stays while it goes.
    val lastAnchor = remember { mutableStateOf(anchor) }
    if (anchor != null) lastAnchor.value = anchor
    val at = lastAnchor.value
    if (at == null || (!visibility.currentState && !visibility.targetState)) return

    val presented by rememberUpdatedState(isPresented)
    val dismiss by rememberUpdatedState(onDismiss)
    val close: () -> Unit = { if (presented) dismiss() }
    BackHandler(enabled = isPresented, onBack = close)

    val density = LocalDensity.current
    val direction = LocalLayoutDirection.current
    val safe = WindowInsets.safeDrawing
    var origin by remember { mutableStateOf(Offset.Zero) }
    BoxWithConstraints(modifier.fillMaxSize().onGloballyPositioned { origin = it.positionInWindow() }) {
        val margin = with(density) { POPOVER_MARGIN.toPx() }
        val room = Rect(
            safe.getLeft(density, direction) + margin,
            safe.getTop(density) + margin,
            constraints.maxWidth - safe.getRight(density, direction) - margin,
            constraints.maxHeight - safe.getBottom(density) - margin,
        )
        val placement = with(density) {
            placePopover(
                anchor = at.translate(-origin),
                room = room,
                idealWidth = IDEAL_WIDTH.toPx(),
                minimumWidth = MINIMUM_WIDTH.toPx(),
                arrowInset = (POPOVER_CORNER_RADIUS + ARROW_WIDTH / 2).toPx(),
            )
        }

        // The window outside the popover, which takes a tap to close it, as UIKit's dimming view does, and lets it
        // reach nothing under it. Once closed it lets taps through to the map, while the popover is still fading.
        if (isPresented) {
            Box(
                Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) { detectTapGestures { close() } }
                    .semantics {
                        traversalIndex = 1f
                        contentDescription = localized("Close")
                        onClick { close(); true }
                    },
            )
        }

        // The system's popover grows out of its arrow on a spring and fades as it goes; with Reduce Motion it fades.
        val reduceMotion = LocalReduceMotion.current
        val grow = IosMotion.snappy(duration = 0.35)
        val fade = IosMotion.smooth(duration = 0.25)
        val arrowTip = TransformOrigin(if (placement.width > 0) placement.arrowX / placement.width else 0.5f, 0f)
        AnimatedVisibility(
            visibleState = visibility,
            modifier = Modifier
                .align(AbsoluteAlignment.TopLeft)
                .absoluteOffset { IntOffset(placement.x.roundToInt(), placement.y.roundToInt()) },
            enter = if (reduceMotion) {
                fadeIn(fade.animation())
            } else {
                fadeIn(fade.animation()) + scaleIn(grow.animation(), initialScale = INITIAL_SCALE, transformOrigin = arrowTip)
            },
            exit = if (reduceMotion) {
                fadeOut(fade.animation())
            } else {
                fadeOut(fade.animation()) + scaleOut(fade.animation(), targetScale = FINAL_SCALE, transformOrigin = arrowTip)
            },
            label = "popover",
        ) {
            PopoverBody(placement, title, onEscape = close, content)
        }
    }
}

@Composable
private fun PopoverBody(placement: PopoverPlacement, title: String, onEscape: () -> Unit, content: @Composable () -> Unit) {
    val density = LocalDensity.current
    val colors = scootColors.elevated()
    val shape = remember(placement.arrowX, density) {
        with(density) { PopoverShape(placement.arrowX, ARROW_HEIGHT.toPx(), ARROW_WIDTH.toPx(), POPOVER_CORNER_RADIUS) }
    }
    Column(
        Modifier
            .width(with(density) { placement.width.toDp() })
            .heightIn(max = with(density) { placement.maxHeight.toDp() })
            .iosShadow(shape, Color.Black.copy(alpha = SHADOW_ALPHA), radius = SHADOW_RADIUS, y = SHADOW_Y)
            .clip(shape)
            .background(colors.systemGroupedBackground)
            // A tap on the popover stays in it, rather than reaching the window outside it, which would close it.
            .pointerInput(Unit) { awaitPointerEventScope { while (true) awaitPointerEvent() } }
            .semantics {
                paneTitle = title
                isTraversalGroup = true
                traversalIndex = 0f
            }
            .testTag(POPOVER_TAG)
            .closedByEscape(onEscape)
            .padding(top = ARROW_HEIGHT),
    ) {
        CompositionLocalProvider(LocalScootColors provides colors) { content() }
    }
}

/**
 * Esc on a hardware keyboard calls [onEscape]: what it is on takes the keyboard's focus as it appears, with no
 * semantics, so that TalkBack still reads what is in it one by one. Esc is no Back to Android: its key maps give it
 * no fallback (Generic.kcm on API 37).
 */
internal fun Modifier.closedByEscape(onEscape: () -> Unit): Modifier = composed {
    val focus = remember { FocusRequester() }
    LaunchedEffect(focus) { focus.requestFocus() }
    onKeyEvent { event ->
        if (event.type == KeyEventType.KeyDown && event.key == Key.Escape) {
            onEscape()
            true
        } else {
            false
        }
    }
        .focusRequester(focus)
        .focusTarget()
}

/** Where a popover goes in the screen, in pixels: its top left corner, its width, its height at most, and its arrow's tip along its top. */
internal data class PopoverPlacement(val x: Float, val y: Float, val width: Float, val maxHeight: Float, val arrowX: Float)

/**
 * Where a popover from [anchor] goes, as UIKit places one from a bar at the top of the window: under it, the arrow's
 * tip on the middle of its bottom edge, and the body centred on the arrow and moved along to stay inside [room],
 * the arrow keeping [arrowInset] from the body's ends. As wide as [idealWidth], or as the room where that is
 * narrower, and never under [minimumWidth]; as tall as the room under the anchor at most.
 */
internal fun placePopover(anchor: Rect, room: Rect, idealWidth: Float, minimumWidth: Float, arrowInset: Float): PopoverPlacement {
    val width = min(idealWidth, max(room.width, minimumWidth))
    val middle = anchor.center.x
    val x = (middle - width / 2).coerceIn(room.left, max(room.left, room.right - width))
    val arrowX = if (width > 2 * arrowInset) (middle - x).coerceIn(arrowInset, width - arrowInset) else width / 2
    return PopoverPlacement(x = x, y = anchor.bottom, width = width, maxHeight = max(0f, room.bottom - anchor.bottom), arrowX = arrowX)
}

/**
 * The popover's outline: a body of continuous corners under its arrow, whose sides curve in from the body's top and
 * meet in a rounded tip [arrowX] from the left.
 */
private class PopoverShape(
    private val arrowX: Float,
    private val arrowHeight: Float,
    private val arrowWidth: Float,
    private val radius: Dp,
) : Shape {
    override fun createOutline(size: Size, layoutDirection: LayoutDirection, density: Density): Outline {
        val body = Path().apply {
            addOutline(SquircleShape(radius).createOutline(Size(size.width, max(0f, size.height - arrowHeight)), layoutDirection, density))
            translate(Offset(0f, arrowHeight))
        }
        val half = arrowWidth / 2
        val arrow = Path().apply {
            moveTo(arrowX - half, arrowHeight)
            cubicTo(arrowX - half * 0.5f, arrowHeight, arrowX - half * 0.35f, 0f, arrowX, 0f)
            cubicTo(arrowX + half * 0.35f, 0f, arrowX + half * 0.5f, arrowHeight, arrowX + half, arrowHeight)
            // A pixel into the body, so that no seam shows where they join.
            lineTo(arrowX + half, arrowHeight + 1)
            lineTo(arrowX - half, arrowHeight + 1)
            close()
        }
        return Outline.Generic(Path.combine(PathOperation.Union, body, arrow))
    }
}

/** SwiftUI's frame on the filters in the popover: `minWidth: 360, idealWidth: 400`. */
private val IDEAL_WIDTH = 400.dp
private val MINIMUM_WIDTH = 360.dp

/** UIPopoverPresentationController's `popoverLayoutMargins`: how far from the safe area's edges it stays. */
private val POPOVER_MARGIN = 10.dp

private val POPOVER_CORNER_RADIUS = 26.dp
private val ARROW_HEIGHT = 13.dp
private val ARROW_WIDTH = 36.dp

private const val SHADOW_ALPHA = 0.12f
private val SHADOW_RADIUS = 24.dp
private val SHADOW_Y = 8.dp

/** How small the popover starts as it grows out of its arrow, and how small it ends as it fades. */
private const val INITIAL_SCALE = 0.6f
private const val FINAL_SCALE = 0.9f
