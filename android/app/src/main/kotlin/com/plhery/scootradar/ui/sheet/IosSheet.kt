package com.plhery.scootradar.ui.sheet

import androidx.activity.compose.PredictiveBackHandler
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.animate
import androidx.compose.foundation.MutatePriority
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.AnchoredDraggableState
import androidx.compose.foundation.gestures.DragScope
import androidx.compose.foundation.gestures.DraggableAnchors
import androidx.compose.foundation.gestures.DraggableState
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.traversalIndex
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.Velocity
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.LocalScootColors
import com.plhery.scootradar.ui.theme.animation
import com.plhery.scootradar.ui.theme.scootColors
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

// `.sheet(isPresented:)` with `.presentationDetents` and `.presentationDragIndicator(.visible)` in
// ios/ScootRadar/Views/ScooterMapScreen.swift, as iOS 26 draws a sheet on an iPhone (ui.md UI-208, UI-230, UI-387).

/** The heights a sheet may rest at: about half the screen, and nearly all of it. */
enum class SheetDetent { Medium, Large }

private enum class SheetValue { Hidden, Medium, Large }

/**
 * A sheet over the whole screen: it slides up to the first of [detents] over the dimmed map, follows the finger
 * between them, and goes when dragged or flung down, when the dimmed map is tapped, or on Back. At the medium height
 * it floats inside the screen's edges, and it meets them as it is pulled up to the large one. A list in it scrolls
 * once the sheet is as tall as it gets, and pulls the sheet down from its top.
 */
@Composable
fun IosSheet(
    isPresented: Boolean,
    /** Called as a finger, a tap or Back sends the sheet away, before it is down: the presenter sets [isPresented] false. */
    onDismiss: () -> Unit,
    detents: List<SheetDetent>,
    /** What TalkBack says as the sheet opens, as VoiceOver reads the navigation title. */
    title: String,
    /** What the sheet shows, given the room the home indicator takes at its bottom. */
    content: @Composable (bottomInset: Dp) -> Unit,
) {
    val density = LocalDensity.current
    val window = LocalWindowInfo.current.containerSize
    val full = window.height.toFloat()
    val largeTop = WindowInsets.safeDrawing.getTop(density) + with(density) { LARGE_GAP.toPx() }
    // UISheetPresentationController.Detent.medium: half the large detent's height.
    val mediumTop = full - (full - largeTop) / 2
    val hasMedium = SheetDetent.Medium in detents
    val lowestTop = if (hasMedium) mediumTop else largeTop
    val anchors = remember(full, largeTop, hasMedium) {
        DraggableAnchors {
            SheetValue.Hidden at full
            if (hasMedium) SheetValue.Medium at mediumTop
            SheetValue.Large at largeTop
        }
    }
    val state = remember { AnchoredDraggableState(SheetValue.Hidden, anchors) }
    SideEffect {
        // A detent the window no longer has, after a rotation: the sheet goes to the large one, as UIKit's does.
        state.updateAnchors(anchors, state.targetValue.takeIf { anchors.hasPositionFor(it) } ?: SheetValue.Large)
    }

    // Dragged or flung down, the dimmed map tapped, or Back: the sheet tells its presenter at once, as it starts to
    // go, as `.sheet(isPresented:)` sets its binding.
    val presented by rememberUpdatedState(isPresented)
    val dismiss by rememberUpdatedState(onDismiss)
    val close: () -> Unit = { if (presented) dismiss() }
    // The system's sheet springs without a bounce. Reduce Motion leaves it be on iOS; Android's "Remove
    // animations" makes it jump, as every animation.
    val motion = remember(state) {
        SheetMotion(
            state = state,
            spring = IosMotion.smooth(duration = 0.5).animation(),
            flingSpeed = with(density) { FLING_SPEED.toPx() },
            mayStay = { presented },
            goes = { close() },
        )
    }
    SideEffect { motion.room = largeTop }
    val first = if (hasMedium) SheetValue.Medium else SheetValue.Large
    LaunchedEffect(isPresented) {
        // A sheet flung away is on its way down already, and keeps the finger's speed.
        if (isPresented || motion.heading != SheetValue.Hidden) motion.go(if (isPresented) first else SheetValue.Hidden)
    }

    // The offset changes with every frame of a drag, so it is read while the sheet is laid out and drawn, not here.
    val isDown by remember(full) { derivedStateOf { state.offset.isNaN() || state.offset >= full - 0.5f } }
    if (!isPresented && isDown) return

    val scope = rememberCoroutineScope()
    var backProgress by remember { mutableFloatStateOf(0f) }
    // Let go, the sheet goes down as small as the gesture left it; shown again before it is down, it is whole again.
    LaunchedEffect(isPresented) { if (isPresented) backProgress = 0f }
    PredictiveBackHandler(enabled = isPresented) { progress ->
        try {
            progress.collect { backProgress = it.progress }
            close()
        } catch (cancelled: CancellationException) {
            backProgress = 0f
            throw cancelled
        }
    }

    val scroll = remember(motion) { SheetScrollConnection(motion) }
    val sheetColors = scootColors.elevated()
    val inset = with(density) { FLOATING_INSET.toPx() }
    val radius = with(density) { CORNER_RADIUS.toPx() }
    // Pulled up past the large height, the sheet stretches a little toward the status bar.
    fun top(): Float = state.offset.let { if (it.isNaN()) full else it } - motion.stretch
    // How far inside the screen's edges the sheet is: it floats at the medium height and meets them at the large one.
    fun gap(): Float =
        if (hasMedium) inset * (1 - ((mediumTop - top()) / (mediumTop - largeTop)).coerceIn(0f, 1f)) else 0f

    Box(Modifier.fillMaxSize()) {
        // The dimmed map, which closes the sheet when tapped.
        Box(
            Modifier
                .fillMaxSize()
                .graphicsLayer { alpha = ((full - top()) / (full - lowestTop)).coerceIn(0f, 1f) }
                .background(Color.Black.copy(alpha = if (scootColors.isDark) DIM_DARK else DIM_LIGHT))
                // Once closed it lets taps through to the map, while the sheet is still going down.
                .then(
                    if (isPresented) {
                        Modifier
                            .pointerInput(Unit) { detectTapGestures { close() } }
                            .semantics {
                                traversalIndex = 1f
                                contentDescription = localized("Close")
                                onClick { close(); true }
                            }
                    } else {
                        Modifier
                    },
                ),
        )

        Box(
            Modifier
                .layout { measurable, constraints ->
                    // As tall as the detent it is at, down to the screen's foot, and no shorter than the lowest one
                    // as it goes down, sliding off the foot.
                    val top = top()
                    val gap = gap()
                    val height = max(0f, full - min(top, lowestTop) - gap).roundToInt()
                    val width = max(0, constraints.maxWidth - 2 * gap.roundToInt())
                    val placeable = measurable.measure(Constraints.fixed(width, height))
                    layout(constraints.maxWidth, constraints.maxHeight) { placeable.place(gap.roundToInt(), top.roundToInt()) }
                }
                .graphicsLayer {
                    // Back, as it is drawn out, shrinks the sheet a little toward the bottom of the screen.
                    val scale = 1 - BACK_SHRINK * backProgress
                    scaleX = scale
                    scaleY = scale
                    transformOrigin = TransformOrigin(0.5f, 1f)
                    // The bottom corners round as the sheet lifts off the screen's edges.
                    val bottom = radius * gap() / inset
                    shape = RoundedCornerShape(topStart = radius, topEnd = radius, bottomStart = bottom, bottomEnd = bottom)
                    clip = true
                }
                .background(sheetColors.systemGroupedBackground)
                .nestedScroll(scroll)
                .draggable(
                    motion,
                    Orientation.Vertical,
                    // A sheet on its way is caught by the finger that touches it.
                    startDragImmediately = state.isAnimationRunning,
                    onDragStopped = { velocity -> motion.settle(velocity) },
                )
                .semantics {
                    paneTitle = title
                    isTraversalGroup = true
                    traversalIndex = 0f
                }
                // Esc closes it, as it closes the form and the popover a larger window has: API 37's key maps no longer
                // make Esc Back, as API 31's did (review-app-t finding 10).
                .closedByEscape(close),
        ) {
            // The home indicator is under a sheet at the large height, and partly under a floating one.
            val floating = hasMedium && state.targetValue != SheetValue.Large
            val bottom = max(0f, WindowInsets.safeDrawing.getBottom(density) - if (floating) inset else 0f)
            CompositionLocalProvider(LocalScootColors provides sheetColors) {
                content(with(density) { bottom.toDp() })
            }
            // The drag indicator. For VoiceOver UIKit's is a button that takes the sheet to its other height, or
            // away when it has one; TalkBack reads it the same.
            val expanded = state.targetValue == SheetValue.Large
            Box(
                Modifier
                    .align(Alignment.TopCenter)
                    .size(GRABBER_TARGET.width, GRABBER_TARGET.height)
                    .semantics {
                        contentDescription = localized("Sheet Grabber")
                        stateDescription = localized(if (expanded) "Sheet expanded" else "Sheet at half screen")
                        role = Role.Button
                        onClick {
                            when {
                                !hasMedium -> close()
                                expanded -> scope.launch { motion.go(SheetValue.Medium) }
                                else -> scope.launch { motion.go(SheetValue.Large) }
                            }
                            true
                        }
                    },
            ) {
                Box(
                    Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = 5.dp)
                        .size(36.dp, 5.dp)
                        .clip(CapsuleShape)
                        .background(sheetColors.tertiaryLabel),
                )
            }
        }
    }
}

/**
 * How the sheet follows a finger and where it goes when let go: to the next detent its way when flung, else to the
 * closest, on the sheet's spring from the finger's speed. Pulled up past the large detent it stretches, more and
 * more stiffly, and springs back.
 */
private class SheetMotion(
    val state: AnchoredDraggableState<SheetValue>,
    private val spring: AnimationSpec<Float>,
    private val flingSpeed: Float,
    /** Whether the sheet may rest at a detent: not once its presenter has closed it. */
    private val mayStay: () -> Boolean,
    /** Tells the presenter, as a finger sends the sheet down. */
    private val goes: () -> Unit,
) : DraggableState {
    /** The detent the sheet is on its way to, while it springs there. */
    var heading: SheetValue? by mutableStateOf(null)
        private set

    /** How far the sheet is stretched above the large detent. */
    var stretch by mutableFloatStateOf(0f)
        private set

    /** The room above the sheet at the large detent, which a stretch nears and never fills. */
    var room = 1f

    private var pull = 0f

    private val scope = object : DragScope {
        override fun dragBy(pixels: Float) {
            dispatchRawDelta(pixels)
        }
    }

    override suspend fun drag(dragPriority: MutatePriority, block: suspend DragScope.() -> Unit) {
        state.anchoredDrag(dragPriority) { scope.block() }
    }

    override fun dispatchRawDelta(delta: Float) {
        // Down, the stretch gives first; up at the large detent, the rest of the finger's travel stretches.
        var left = delta
        if (pull > 0 && left > 0) {
            val given = minOf(pull, left)
            pull -= given
            left -= given
        }
        left -= state.dispatchRawDelta(left)
        if (left < 0) pull -= left
        stretch = rubberBand(pull)
    }

    /** UIScrollView's rubber band: the first points follow the finger at about half its speed, then less and less. */
    private fun rubberBand(distance: Float): Float =
        if (distance <= 0f) 0f else (1 - 1 / (distance * RUBBER_BAND / room + 1)) * room

    /** Lets the sheet go at [velocity], positive down. */
    suspend fun settle(velocity: Float) {
        val offset = state.requireOffset()
        val target = when {
            !mayStay() -> SheetValue.Hidden
            abs(velocity) > flingSpeed -> state.anchors.closestAnchor(offset, searchUpwards = velocity > 0)
            else -> state.anchors.closestAnchor(offset)
        } ?: SheetValue.Hidden
        if (target == SheetValue.Hidden) goes()
        // The finger's speed carries the sheet only toward where it goes: one let go at its detent stays there.
        go(target, if ((state.anchors.positionOf(target) - offset) * velocity > 0) velocity else 0f)
    }

    /** Springs the sheet to [target], and its stretch back. */
    suspend fun go(target: SheetValue, velocity: Float = 0f) = coroutineScope {
        if (stretch > 0) {
            launch {
                pull = 0f
                animate(stretch, 0f, animationSpec = spring) { value, _ -> stretch = value }
            }
        }
        heading = target
        try {
            state.anchoredDrag(target) { anchors, latest ->
                animate(state.requireOffset(), anchors.positionOf(latest), velocity, spring) { value, speed -> dragTo(value, speed) }
            }
        } finally {
            if (heading == target) heading = null
        }
    }
}

/**
 * A list inside the sheet: pushed up, it raises the sheet to the large height before it scrolls; pulled down
 * from its top, it brings the sheet down with it; flung, it lets the sheet settle at a detent.
 */
private class SheetScrollConnection(private val motion: SheetMotion) : NestedScrollConnection {
    private val state get() = motion.state

    /** Whether the finger on the list has moved the sheet: a list that only scrolled leaves the sheet be. */
    private var moved = false

    private fun move(delta: Float): Offset {
        val consumed = state.dispatchRawDelta(delta)
        if (consumed != 0f) moved = true
        return Offset(0f, consumed)
    }

    override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset =
        if (available.y < 0 && source == NestedScrollSource.UserInput) move(available.y) else Offset.Zero

    override fun onPostScroll(consumed: Offset, available: Offset, source: NestedScrollSource): Offset =
        if (source == NestedScrollSource.UserInput) move(available.y) else Offset.Zero

    override suspend fun onPreFling(available: Velocity): Velocity =
        if (moved && available.y < 0 && state.requireOffset() > state.anchors.minPosition()) {
            moved = false
            motion.settle(available.y)
            available
        } else {
            Velocity.Zero
        }

    override suspend fun onPostFling(consumed: Velocity, available: Velocity): Velocity {
        if (!moved) return Velocity.Zero
        moved = false
        motion.settle(available.y)
        return available
    }
}

/** The room between the status bar and a sheet at the large height. */
private val LARGE_GAP = 10.dp

/** How far inside the screen's edges a sheet at the medium height floats. */
private val FLOATING_INSET = 8.dp

internal val CORNER_RADIUS = 38.dp

/** How fast a finger lets go for the sheet to go on to the next detent its way: Compose's default for anchors. */
private val FLING_SPEED = 125.dp

/** UIScrollView's rubber-band constant. */
private const val RUBBER_BAND = 0.55f

/** The room TalkBack finds the drag indicator in, at the sheet's top. */
private val GRABBER_TARGET = DpSize(48.dp, 20.dp)

/** The dimming over the map, at its darkest: UIKit's dimming view. */
internal const val DIM_LIGHT = 0.2f
internal const val DIM_DARK = 0.48f

/** How much a predictive Back shrinks the sheet, all the way out. */
internal const val BACK_SHRINK = 0.06f
