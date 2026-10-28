package com.plhery.scootradar.ui.sheet

import androidx.activity.compose.PredictiveBackHandler
import androidx.compose.animation.core.Animatable
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.traversalIndex
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.theme.LocalScootColors
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.animation
import com.plhery.scootradar.ui.theme.scootColors
import kotlinx.coroutines.CancellationException
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

// `.presentationSizing(.form)` and iOS 27's `.presentationPlacement(.trailing)` on the Settings sheet beside a
// panel, in ios/ScootRadar/Views/ScooterMapScreen.swift (ui.md UI-071, UI-130, UI-231; PLAN §10).

/** The form sheet's test tag. */
const val FORM_SHEET_TAG = "formSheet"

/**
 * A form sheet at the trailing side of the window, clear of the panel at its leading side: 540 wide and 620 tall,
 * or 16 short of the safe area's edges where it has less room, in the middle up and down. It slides up over the
 * dimmed window and back down, on the system sheet's spring; a tap on the dimmed window, Back or a hardware
 * keyboard's Esc closes it.
 */
@Composable
fun IosFormSheet(
    isPresented: Boolean,
    /** Called as a tap or Back sends the sheet away, before it is down: the presenter sets [isPresented] false. */
    onDismiss: () -> Unit,
    /** What TalkBack says as the sheet opens, as VoiceOver reads the navigation title. */
    title: String,
    content: @Composable () -> Unit,
) {
    // How far up the sheet is, from 0, under the window, to 1, in its place.
    val shown = remember { Animatable(0f) }
    LaunchedEffect(isPresented) { shown.animateTo(if (isPresented) 1f else 0f, IosMotion.smooth(duration = 0.5).animation()) }
    val isDown by remember { derivedStateOf { shown.value == 0f } }
    if (!isPresented && isDown) return

    val presented by rememberUpdatedState(isPresented)
    val dismiss by rememberUpdatedState(onDismiss)
    val close: () -> Unit = { if (presented) dismiss() }
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

    val safe = WindowInsets.safeDrawing
    val colors = scootColors.elevated()
    Box(Modifier.fillMaxSize()) {
        // The dimmed window, which closes the sheet when tapped.
        Box(
            Modifier
                .fillMaxSize()
                .graphicsLayer { alpha = shown.value }
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
                    val left = safe.getLeft(this, layoutDirection)
                    val top = safe.getTop(this)
                    val right = safe.getRight(this, layoutDirection)
                    val bottom = safe.getBottom(this)
                    val margin = FORM_MARGIN.roundToPx()
                    val roomWidth = constraints.maxWidth - left - right
                    val roomHeight = constraints.maxHeight - top - bottom
                    val width = max(0, min(FORM_WIDTH.roundToPx(), roomWidth - 2 * margin))
                    val height = max(0, min(FORM_HEIGHT.roundToPx(), roomHeight - 2 * margin))
                    val placeable = measurable.measure(Constraints.fixed(width, height))
                    layout(constraints.maxWidth, constraints.maxHeight) {
                        // At the trailing side, and in the middle up and down, from under the window's bottom.
                        val x = if (layoutDirection == LayoutDirection.Ltr) constraints.maxWidth - right - margin - width else left + margin
                        val rest = top + (roomHeight - height) / 2
                        val y = rest + (1 - shown.value) * (constraints.maxHeight - rest)
                        placeable.place(x, y.roundToInt())
                    }
                }
                .graphicsLayer {
                    // Back, as it is drawn out, shrinks the sheet a little toward the bottom of the window.
                    val scale = 1 - BACK_SHRINK * backProgress
                    scaleX = scale
                    scaleY = scale
                    transformOrigin = TransformOrigin(0.5f, 1f)
                    shape = SquircleShape(CORNER_RADIUS)
                    clip = true
                }
                .background(colors.systemGroupedBackground)
                // A tap on the sheet stays in it, rather than reaching the dimmed window, which would close it.
                .pointerInput(Unit) { awaitPointerEventScope { while (true) awaitPointerEvent() } }
                .semantics {
                    paneTitle = title
                    isTraversalGroup = true
                    traversalIndex = 0f
                }
                .testTag(FORM_SHEET_TAG)
                .closedByEscape(close),
        ) {
            CompositionLocalProvider(LocalScootColors provides colors) { content() }
        }
    }
}

/** `.presentationSizing(.form)` on an iPad: 540 by 620 points. */
private val FORM_WIDTH = 540.dp
private val FORM_HEIGHT = 620.dp

/** How far the form keeps from the safe area's edges. */
private val FORM_MARGIN = 16.dp
