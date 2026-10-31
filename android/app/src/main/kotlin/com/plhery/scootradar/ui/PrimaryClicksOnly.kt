package com.plhery.scootradar.ui

import android.annotation.SuppressLint
import android.view.InputDevice
import android.view.MotionEvent
import android.view.View
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.PointerButtons
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

// X-AD22: an iPad's pointer clicks with its primary button. UIKit's tap recognizers answer that button alone unless
// told otherwise (UITapGestureRecognizer.h: buttonMaskRequired, "Default is UIEventButtonMaskPrimary"), the map's
// own among them (ios/ScootRadar/Views/ScooterMapView.swift:326-331). A text field is the one place a secondary click
// means something: UITextField opens its edit menu there (UIEditMenuInteraction: "When responding to a secondary click
// on devices with pointer-based input, the actions display in a context menu"), as Compose's text field opens its own.
// A secondary press does nothing, whatever sends it (lead, X-AD22): a stylus's barrel button is one, as Android's own
// views take a stylus's tap with it held for a context click.

/**
 * A secondary press, and all of it until it is let go, taken before anything under it sees it: a mouse's or a
 * trackpad's that starts with the secondary button, and a stylus's, from its tip or its eraser, with a barrel button
 * held. The buttons, rows and sheets under it, and the map, which takes no tap from it, answer the primary button
 * alone, as on an iPad, where Compose's would take a right click for a click. A press on a [keepsSecondaryClicks] field
 * goes on to it. The pointer's hover, its wheel and the primary button go on as before, and so does a stylus's plain
 * tap, a barrel button pressed during it too: a press is a secondary one or not from how it begins, as a mouse's right
 * button pressed during a left click leaves it a click (PLAN §10). A finger on the screen has no secondary button.
 * Compose tells a trackpad's finger, which is a mouse's pointer, from one on the screen. A dialog's or a popup's content
 * needs [PrimaryClicksOnlyAroundTheContent] as well.
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
            if (change.changedToDownIgnoreConsumed() && isSecondaryPress(change.type, pointerEvent.buttons) &&
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
            // A node it visits is attached, and so are its coordinates.
            over = part.contains(position)
            if (over) TraverseDescendantsAction.CancelTraversal else TraverseDescendantsAction.ContinueTraversal
        }
        return over
    }
}

/**
 * Whether a press of a [type] of pointer with [buttons] down is a secondary one: a mouse's that starts with the
 * secondary button and not the primary, or a stylus's with a barrel button held. Compose reads a stylus's buttons into
 * the primary and the secondary (BUTTON_STYLUS_PRIMARY and BUTTON_STYLUS_SECONDARY); its tip on the screen presses
 * neither.
 */
private fun isSecondaryPress(type: PointerType, buttons: PointerButtons): Boolean = when (type) {
    PointerType.Mouse -> buttons.isSecondaryPressed && !buttons.isPrimaryPressed
    PointerType.Stylus, PointerType.Eraser -> buttons.isPrimaryPressed || buttons.isSecondaryPressed
    else -> false
}

/**
 * In a dialog's or a popup's content: a right click outside the content, where a tap closes the window, leaves it open,
 * as an iPad's popover and menu stay open under one. Such a window is handed every press on the app while it shows,
 * outside it too (it is touch modal): a press beside its content, or past the window's edges, which no View in it
 * takes, goes to the window's root view, and then to the Dialog or the Popup, which closes on it whatever the button;
 * Compose's pointer input doesn't see it. A dialog's window is as wide as the screen and as tall as its content (the
 * calendar's), or the whole screen when the content needs it; a popup's is its content and the room around it.
 */
@Composable
fun PrimaryClicksOnlyAroundTheContent() {
    val view = LocalView.current
    DisposableEffect(view) {
        // The decor view of a dialog's window; a popup's PopupLayout, the root of its own.
        val window = view.rootView
        window.setOnTouchListener(SecondaryClicksAround())
        onDispose { window.setOnTouchListener(null) }
    }
}

/**
 * Whether the pointer pressed is one Compose takes for a mouse (ui's MotionEventAdapter): a mouse, or a finger on a
 * trackpad, which Android sends from the mouse's source (or the touchpad's) with a finger's tool, a trackpad's
 * two-finger right click among them. Compose takes a trackpad's two-finger swipe or pinch, which presses no button, for
 * a touch.
 */
private fun MotionEvent.isFromAMouse(): Boolean = when (getToolType(actionIndex)) {
    MotionEvent.TOOL_TYPE_MOUSE -> true
    MotionEvent.TOOL_TYPE_FINGER -> isFromSource(InputDevice.SOURCE_MOUSE) || isFromSource(InputDevice.SOURCE_TOUCHPAD)
    else -> false
}

/**
 * A secondary press, as [isSecondaryPress] reads Compose's: a mouse's or a trackpad's that starts with the secondary
 * button and not the primary, or a stylus's, its tip or its eraser (which Compose tells by the tool), with a button held.
 */
private fun MotionEvent.isSecondaryPress(): Boolean = when {
    isFromAMouse() -> isButtonPressed(MotionEvent.BUTTON_SECONDARY) && !isButtonPressed(MotionEvent.BUTTON_PRIMARY)
    getToolType(actionIndex) == MotionEvent.TOOL_TYPE_STYLUS || getToolType(actionIndex) == MotionEvent.TOOL_TYPE_ERASER ->
        buttonState and STYLUS_BUTTONS != 0
    else -> false
}

/** The buttons Compose reads as a stylus's primary and secondary: the barrel's, and the primary and secondary. */
private const val STYLUS_BUTTONS = MotionEvent.BUTTON_PRIMARY or MotionEvent.BUTTON_SECONDARY or
    MotionEvent.BUTTON_STYLUS_PRIMARY or MotionEvent.BUTTON_STYLUS_SECONDARY

/**
 * A secondary press outside a window's content, a mouse's, a trackpad's or a stylus's, and all of it, taken; and one in
 * another window, which a popup is told of (ACTION_OUTSIDE, one event) and closes on. It is no click (none of
 * TalkBack's, which aren't a mouse's or a stylus's), so it has no [View.performClick] to call.
 */
@SuppressLint("ClickableViewAccessibility")
private class SecondaryClicksAround : View.OnTouchListener {
    private var ignoring = false

    override fun onTouch(view: View, event: MotionEvent): Boolean {
        if (event.actionMasked == MotionEvent.ACTION_OUTSIDE) return event.isSecondaryPress()
        if (event.actionMasked == MotionEvent.ACTION_DOWN) ignoring = event.isSecondaryPress()
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
