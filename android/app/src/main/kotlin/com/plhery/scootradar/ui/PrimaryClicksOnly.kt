package com.plhery.scootradar.ui

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
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.node.PointerInputModifierNode
import androidx.compose.ui.node.TraversableNode
import androidx.compose.ui.node.TraversableNode.Companion.TraverseDescendantsAction
import androidx.compose.ui.node.requireLayoutCoordinates
import androidx.compose.ui.node.traverseDescendants
import androidx.compose.ui.platform.InspectorInfo
import androidx.compose.ui.unit.IntSize

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
 * finger or a stylus has no secondary button here.
 */
fun Modifier.primaryClicksOnly(): Modifier = this then PrimaryClicksOnlyElement

/** A text field, under [primaryClicksOnly], that a right click reaches, for its edit menu. */
fun Modifier.keepsSecondaryClicks(): Modifier = this then KeepsSecondaryClicksElement

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
            over = coordinates.isAttached && here.localBoundingBoxOf(coordinates).contains(position)
            if (over) TraverseDescendantsAction.CancelTraversal else TraverseDescendantsAction.ContinueTraversal
        }
        return over
    }
}

private object KeepsSecondaryClicksElement : ModifierNodeElement<KeepsSecondaryClicksNode>() {
    override fun create() = KeepsSecondaryClicksNode()

    override fun update(node: KeepsSecondaryClicksNode) = Unit

    override fun InspectorInfo.inspectableProperties() {
        name = "keepsSecondaryClicks"
    }

    override fun hashCode() = "keepsSecondaryClicks".hashCode()

    override fun equals(other: Any?) = other === this
}

private class KeepsSecondaryClicksNode : Modifier.Node(), TraversableNode {
    override val traverseKey = Key

    companion object Key
}
