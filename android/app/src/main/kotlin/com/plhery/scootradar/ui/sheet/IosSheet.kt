package com.plhery.scootradar.ui.sheet

import androidx.activity.compose.PredictiveBackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.AnchoredDraggableDefaults
import androidx.compose.foundation.gestures.AnchoredDraggableState
import androidx.compose.foundation.gestures.DraggableAnchors
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.anchoredDraggable
import androidx.compose.foundation.gestures.animateTo
import androidx.compose.foundation.gestures.detectTapGestures
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
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
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
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.traversalIndex
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.Velocity
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.LocalScootColors
import com.plhery.scootradar.ui.theme.animation
import com.plhery.scootradar.ui.theme.scootColors
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import kotlin.math.max
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
    SideEffect { state.updateAnchors(anchors, state.targetValue) }

    // The system's sheet springs without a bounce. Reduce Motion leaves it be on iOS; Android's "Remove
    // animations" makes it jump, as every animation.
    val spring = remember { IosMotion.smooth(duration = 0.5).animation<Float>() }
    val first = if (hasMedium) SheetValue.Medium else SheetValue.Large
    LaunchedEffect(isPresented) {
        state.animateTo(if (isPresented) first else SheetValue.Hidden, spring)
    }

    // Dragged, flung or tapped away: the sheet tells its presenter once it is down.
    val presented by rememberUpdatedState(isPresented)
    val dismiss by rememberUpdatedState(onDismiss)
    LaunchedEffect(state) {
        var shown = false
        snapshotFlow { state.settledValue }.collect { value ->
            if (value != SheetValue.Hidden) {
                shown = true
            } else if (shown) {
                shown = false
                if (presented) dismiss()
            }
        }
    }

    // The offset changes with every frame of a drag, so it is read while the sheet is laid out and drawn, not here.
    val isDown by remember(full) { derivedStateOf { state.offset.isNaN() || state.offset >= full - 0.5f } }
    if (!isPresented && isDown) return

    val scope = rememberCoroutineScope()
    val close: () -> Unit = { scope.launch { state.animateTo(SheetValue.Hidden, spring) } }
    var backProgress by remember { mutableFloatStateOf(0f) }
    PredictiveBackHandler(enabled = isPresented) { progress ->
        try {
            progress.collect { backProgress = it.progress }
            backProgress = 0f
            close()
        } catch (cancelled: CancellationException) {
            backProgress = 0f
            throw cancelled
        }
    }

    val scroll = remember(state) { SheetScrollConnection(state) { velocity -> state.settle(velocity) } }
    val sheetColors = scootColors.elevated()
    val fling = AnchoredDraggableDefaults.flingBehavior(state, positionalThreshold = { it / 2 }, animationSpec = spring)
    val inset = with(density) { FLOATING_INSET.toPx() }
    val radius = with(density) { CORNER_RADIUS.toPx() }
    fun top(): Float = state.offset.let { if (it.isNaN()) full else it }
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
                .pointerInput(Unit) { detectTapGestures { close() } }
                .semantics {
                    traversalIndex = 1f
                    contentDescription = localized("Close")
                    onClick { close(); true }
                },
        )

        Box(
            Modifier
                .layout { measurable, constraints ->
                    // As tall as the detent it is at, and no shorter than the lowest one as it goes down.
                    val top = top()
                    val gap = gap()
                    val height = max(0f, full - max(top, lowestTop) - gap).roundToInt()
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
                .anchoredDraggable(state, Orientation.Vertical, flingBehavior = fling)
                .semantics {
                    paneTitle = title
                    isTraversalGroup = true
                    traversalIndex = 0f
                },
        ) {
            // The home indicator is under a sheet at the large height, and partly under a floating one.
            val floating = hasMedium && state.targetValue != SheetValue.Large
            val bottom = max(0f, WindowInsets.safeDrawing.getBottom(density) - if (floating) inset else 0f)
            CompositionLocalProvider(LocalScootColors provides sheetColors) {
                content(with(density) { bottom.toDp() })
            }
            // The drag indicator.
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

/**
 * A list inside the sheet: pushed up, it raises the sheet to the large height before it scrolls; pulled down
 * from its top, it brings the sheet down with it; flung, it lets the sheet settle at a detent.
 */
private class SheetScrollConnection(
    private val state: AnchoredDraggableState<SheetValue>,
    private val settle: suspend (velocity: Float) -> Unit,
) : NestedScrollConnection {
    override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset =
        if (available.y < 0 && source == NestedScrollSource.UserInput) Offset(0f, state.dispatchRawDelta(available.y)) else Offset.Zero

    override fun onPostScroll(consumed: Offset, available: Offset, source: NestedScrollSource): Offset =
        if (source == NestedScrollSource.UserInput) Offset(0f, state.dispatchRawDelta(available.y)) else Offset.Zero

    override suspend fun onPreFling(available: Velocity): Velocity =
        if (available.y < 0 && state.requireOffset() > state.anchors.minPosition()) {
            settle(available.y)
            available
        } else {
            Velocity.Zero
        }

    override suspend fun onPostFling(consumed: Velocity, available: Velocity): Velocity {
        settle(available.y)
        return available
    }
}

/** The room between the status bar and a sheet at the large height. */
private val LARGE_GAP = 10.dp

/** How far inside the screen's edges a sheet at the medium height floats. */
private val FLOATING_INSET = 8.dp

private val CORNER_RADIUS = 38.dp

/** The dimming over the map, at its darkest: UIKit's dimming view. */
private const val DIM_LIGHT = 0.2f
private const val DIM_DARK = 0.48f

/** How much a predictive Back shrinks the sheet, all the way out. */
private const val BACK_SHRINK = 0.06f
