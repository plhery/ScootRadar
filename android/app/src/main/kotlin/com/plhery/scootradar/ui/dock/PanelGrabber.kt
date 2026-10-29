package com.plhery.scootradar.ui.dock

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.scootColors
import kotlin.math.abs

// PanelGrabber in ios/ScootRadar/Views/ScooterControls.swift (ui.md UI-228).

/**
 * The handle at the foot of the panel's card, as on the card of Maps: a tap folds the card down to one line under
 * the search bar or opens it again, and so does a swipe on it, up to fold and down to open. A move of 10 points is a
 * swipe rather than a tap, and a swipe of less than 16 up or down does nothing. The width of the card and 44 points
 * high take the touch.
 */
@Composable
internal fun PanelGrabber(isFolded: Boolean, setFolded: (Boolean) -> Unit, modifier: Modifier = Modifier) {
    val colors = scootColors
    val label = if (isFolded) localized("Expand panel") else localized("Collapse panel")
    val value = if (isFolded) localized("Collapsed") else localized("Expanded")
    val folded by rememberUpdatedState(isFolded)
    val set by rememberUpdatedState(setFolded)
    var pressed by remember { mutableStateOf(false) }
    Box(
        modifier
            .fillMaxWidth()
            .heightIn(min = 44.dp)
            // Before the semantics it sets, which would clear them.
            .testTag(PANEL_GRABBER_TAG)
            .focusableControl { set(!folded) }
            .clearAndSetSemantics {
                contentDescription = label
                stateDescription = value
                role = Role.Button
                onClick { set(!folded); true }
            }
            .pointerInput(Unit) {
                val slop = 10.dp.toPx()
                val enough = 16.dp.toPx()
                awaitEachGesture {
                    val down = awaitFirstDown()
                    pressed = true
                    var swiping = false
                    try {
                        while (true) {
                            val change = awaitPointerEvent().changes.firstOrNull { it.id == down.id } ?: break
                            val moved = change.position - down.position
                            if (!swiping && moved.getDistance() >= slop) {
                                swiping = true
                                pressed = false
                            }
                            if (swiping) change.consume()
                            if (!change.pressed) {
                                when {
                                    !swiping -> {
                                        change.consume()
                                        set(!folded)
                                    }
                                    abs(moved.y) >= enough -> set(moved.y < 0)
                                }
                                break
                            }
                        }
                    } finally {
                        pressed = false
                    }
                }
            },
        contentAlignment = Alignment.Center,
    ) {
        Box(
            Modifier
                .graphicsLayer { alpha = if (pressed) 0.4f else 1f }
                .size(36.dp, 5.dp)
                .clip(CapsuleShape)
                .background(colors.dockQuiet.copy(alpha = colors.dockQuiet.alpha * 0.55f)),
        )
    }
}

/** The grabber's tag, by which the tests find it. */
const val PANEL_GRABBER_TAG = "panelGrabber"
