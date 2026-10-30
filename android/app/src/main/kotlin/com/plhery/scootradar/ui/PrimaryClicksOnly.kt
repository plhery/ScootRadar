package com.plhery.scootradar.ui

import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerId
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.changedToDownIgnoreConsumed
import androidx.compose.ui.input.pointer.changedToUpIgnoreConsumed
import androidx.compose.ui.input.pointer.isPrimaryPressed
import androidx.compose.ui.input.pointer.isSecondaryPressed
import androidx.compose.ui.input.pointer.pointerInput

// X-AD22: an iPad's pointer clicks with its primary button. UIKit's tap recognizers answer that button alone unless
// told otherwise (UITapGestureRecognizer.h: buttonMaskRequired, "Default is UIEventButtonMaskPrimary"), the map's
// own among them (ios/ScootRadar/Views/ScooterMapView.swift:326-331), and the app gives nothing a context menu.

/**
 * A mouse's press that starts with the secondary button, and all of it until the button is let go, taken before
 * anything under it sees it: the buttons, rows and sheets under it, and the map, which takes no tap from it, answer the
 * primary button alone, as on an iPad, where Compose's would take a right click for a click. The pointer's hover, its
 * wheel and the primary button go on as before; a finger or a stylus has no secondary button here.
 */
fun Modifier.primaryClicksOnly(): Modifier = pointerInput(Unit) {
    val ignored = mutableSetOf<PointerId>()
    awaitPointerEventScope {
        while (true) {
            val event = awaitPointerEvent(PointerEventPass.Initial)
            for (change in event.changes) {
                if (change.changedToDownIgnoreConsumed() && change.type == PointerType.Mouse &&
                    event.buttons.isSecondaryPressed && !event.buttons.isPrimaryPressed
                ) {
                    ignored += change.id
                }
                if (change.id in ignored) {
                    change.consume()
                    if (change.changedToUpIgnoreConsumed()) ignored -= change.id
                }
            }
        }
    }
}
