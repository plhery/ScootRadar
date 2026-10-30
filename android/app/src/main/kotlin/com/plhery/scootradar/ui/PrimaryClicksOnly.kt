package com.plhery.scootradar.ui

import android.annotation.SuppressLint
import android.view.MotionEvent
import android.view.View
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.PointerEvent
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerId
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.changedToDownIgnoreConsumed
import androidx.compose.ui.input.pointer.changedToUpIgnoreConsumed
import androidx.compose.ui.input.pointer.isPrimaryPressed
import androidx.compose.ui.input.pointer.isSecondaryPressed
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.node.PointerInputModifierNode
import androidx.compose.ui.node.TraversableNode
import androidx.compose.ui.node.TraversableNode.Companion.TraverseDescendantsAction
import androidx.compose.ui.node.requireLayoutCoordinates
import androidx.compose.ui.node.traverseDescendants
import androidx.compose.ui.platform.InspectorInfo
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.window.DialogWindowProvider

// X-AD22: an iPad's pointer clicks with its primary button. UIKit's tap recognizers answer that button alone unless
// told otherwise (UITapGestureRecognizer.h: buttonMaskRequired, "Default is UIEventButtonMaskPrimary"), the map's
// own among them (ios/ScootRadar/Views/ScooterMapView.swift:326-331). A text field is the one place a secondary click
// means something: UITextField opens its edit menu there (UIEditMenuInteraction: "When responding to a secondary click
// on devices with pointer-based input, the actions display in a context menu"), as Compose's text field opens its own.

/**
 * A mouse's press that starts with the secondary button, and all of it until the button is let go, taken before
 * anything under it sees it: the buttons, rows and sheets under it, and the map, which takes no tap from it, answer the
 * primary button alone, as on an iPad, where Compose's would take a right click for a click. A press on a
 * [keepsSecondaryClicks] field goes on to it. The pointer's hover, its wheel and the primary button go on as before; a
 * finger or a stylus has no secondary button here. A dialog's content needs [PrimaryClicksOnlyBesideTheDialog] as well.
 */
fun Modifier.primaryClicksOnly(): Modifier = this then PrimaryClicksOnlyElement

/**
 * A text field, under [primaryClicksOnly], that a right click reaches, for its edit menu. With [below], only its part
 * under that edge: Material's date picker, which has its text field under a header that holds its mode's button.
 */
fun Modifier.keepsSecondaryClicks(below: SecondaryClicksEdge? = null): Modifier = this then KeepsSecondaryClicksElement(below)

/**
 * Where the part of a [keepsSecondaryClicks] that a right click reaches starts: the bottom of what
 * [marksSecondaryClicksEdge] is put on.
 */
class SecondaryClicksEdge {
    internal var coordinates: LayoutCoordinates? = null
}

/** This one's bottom is the [edge]. */
fun Modifier.marksSecondaryClicksEdge(edge: SecondaryClicksEdge): Modifier = onGloballyPositioned { edge.coordinates = it }

private object PrimaryClicksOnlyElement : ModifierNodeElement<PrimaryClicksOnlyNode>() {
    override fun create() = PrimaryClicksOnlyNode()

    override fun update(node: PrimaryClicksOnlyNode) = Unit

    override fun InspectorInfo.inspectableProperties() {
        name = "primaryClicksOnly"
    }

    override fun hashCode() = "primaryClicksOnly".hashCode()

    override fun equals(other: Any?) = other === this
}

private class PrimaryClicksOnlyNode : Modifier.Node(), PointerInputModifierNode {
    private val ignored = mutableSetOf<PointerId>()

    override fun onPointerEvent(pointerEvent: PointerEvent, pass: PointerEventPass, bounds: IntSize) {
        // On the way down, root to leaves, so before anything under it.
        if (pass != PointerEventPass.Initial) return
        for (change in pointerEvent.changes) {
            if (change.changedToDownIgnoreConsumed() && change.type == PointerType.Mouse &&
                pointerEvent.buttons.isSecondaryPressed && !pointerEvent.buttons.isPrimaryPressed &&
                !overAFieldThatKeepsIt(change.position)
            ) {
                ignored += change.id
            }
            if (change.id in ignored) {
                change.consume()
                if (change.changedToUpIgnoreConsumed()) ignored -= change.id
            }
        }
    }

    override fun onCancelPointerInput() {
        ignored.clear()
    }

    private fun overAFieldThatKeepsIt(position: Offset): Boolean {
        val here = requireLayoutCoordinates()
        var over = false
        traverseDescendants(KeepsSecondaryClicksNode.Key) { field ->
            val coordinates = field.requireLayoutCoordinates()
            var part = here.localBoundingBoxOf(coordinates)
            (field as KeepsSecondaryClicksNode).below?.coordinates?.takeIf { it.isAttached }?.let { edge ->
                part = part.copy(top = maxOf(part.top, here.localBoundingBoxOf(edge).bottom))
            }
            over = coordinates.isAttached && part.contains(position)
            if (over) TraverseDescendantsAction.CancelTraversal else TraverseDescendantsAction.ContinueTraversal
        }
        return over
    }
}

/**
 * In a dialog's content: a right click beside it, where a tap closes the dialog, leaves it open, as an iPad's popover
 * stays open under one. A Dialog's window is the whole screen, its content in the middle, and a click on the rest, which
 * no View under it takes, goes to the Dialog, which closes on it whatever the button; Compose doesn't see it.
 */
@Composable
fun PrimaryClicksOnlyBesideTheDialog() {
    val view = LocalView.current
    DisposableEffect(view) {
        val dialog = (view.parent as? View)?.takeIf { it is DialogWindowProvider }
        dialog?.setOnTouchListener(BesideTheDialog())
        onDispose { dialog?.setOnTouchListener(null) }
    }
}

/**
 * A mouse's press that starts with the secondary button beside a dialog's content, and all of it, taken. It is no click
 * (none of TalkBack's, which aren't a mouse's), so it has no [View.performClick] to call.
 */
@SuppressLint("ClickableViewAccessibility")
private class BesideTheDialog : View.OnTouchListener {
    private var ignoring = false

    override fun onTouch(view: View, event: MotionEvent): Boolean {
        if (event.actionMasked == MotionEvent.ACTION_DOWN) {
            ignoring = event.getToolType(0) == MotionEvent.TOOL_TYPE_MOUSE &&
                event.isButtonPressed(MotionEvent.BUTTON_SECONDARY) && !event.isButtonPressed(MotionEvent.BUTTON_PRIMARY)
        }
        val taken = ignoring
        if (event.actionMasked == MotionEvent.ACTION_UP || event.actionMasked == MotionEvent.ACTION_CANCEL) ignoring = false
        return taken
    }
}

private data class KeepsSecondaryClicksElement(val below: SecondaryClicksEdge?) : ModifierNodeElement<KeepsSecondaryClicksNode>() {
    override fun create() = KeepsSecondaryClicksNode(below)

    override fun update(node: KeepsSecondaryClicksNode) {
        node.below = below
    }

    override fun InspectorInfo.inspectableProperties() {
        name = "keepsSecondaryClicks"
        properties["below"] = below
    }
}

private class KeepsSecondaryClicksNode(var below: SecondaryClicksEdge?) : Modifier.Node(), TraversableNode {
    override val traverseKey = Key

    companion object Key
}
