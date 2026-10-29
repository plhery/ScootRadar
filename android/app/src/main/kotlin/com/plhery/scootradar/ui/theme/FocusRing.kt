package com.plhery.scootradar.ui.theme

import androidx.compose.foundation.IndicationNodeFactory
import androidx.compose.foundation.interaction.FocusInteraction
import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.drawscope.ContentDrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.node.CompositionLocalConsumerModifierNode
import androidx.compose.ui.node.DelegatableNode
import androidx.compose.ui.node.DrawModifierNode
import androidx.compose.ui.node.currentValueOf
import androidx.compose.ui.node.invalidateDraw
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import kotlin.math.max
import kotlin.math.min

// The focus halo iPadOS draws around a control a hardware keyboard has reached with Tab (ui.md UI-251).

/**
 * The control's look while a keyboard has its focus: a ring in the app's tint, in [shape], as iPadOS's halo follows
 * the control's own. Touch, press and hover leave it as it is, so a control with `indication = null` can take this
 * in its place. With no shape, a round or short control is ringed as a capsule and a longer one, such as a row, as
 * a rounded rectangle. Clickables take focus only from a keyboard, so a finger never shows it. The halo stands just
 * outside the control; the ring keeps just inside its edge, where the glass, which clips, leaves it whole, and a
 * grouped row's section too where the row's [shape] is its part of the section's. Inside a control filled with the
 * tint ([onTint]), where the tint couldn't be seen, the ring is white, as the control's label is.
 */
class FocusRing(private val shape: Shape? = null, private val onTint: Boolean = false) : IndicationNodeFactory {
    override fun create(interactionSource: InteractionSource): DelegatableNode = FocusRingNode(interactionSource, shape, onTint)

    override fun equals(other: Any?) = other is FocusRing && other.shape == shape && other.onTint == onTint

    override fun hashCode() = 31 * shape.hashCode() + onTint.hashCode()

    companion object {
        /** The ring's width, about the halo's. */
        val Width = 3.dp

        /** How long a control may be for its length, as a capsule; a longer one is a row. */
        internal const val CAPSULE_UP_TO = 3.5f
    }
}

private class FocusRingNode(
    private val interactionSource: InteractionSource,
    private val shape: Shape?,
    private val onTint: Boolean,
) : Modifier.Node(), DrawModifierNode, CompositionLocalConsumerModifierNode {
    private var focused = false

    override fun onAttach() {
        coroutineScope.launch {
            val focuses = mutableListOf<FocusInteraction.Focus>()
            interactionSource.interactions.collect { interaction ->
                when (interaction) {
                    is FocusInteraction.Focus -> focuses += interaction
                    is FocusInteraction.Unfocus -> focuses -= interaction.focus
                    else -> return@collect
                }
                if (focuses.isNotEmpty() != focused) {
                    focused = focuses.isNotEmpty()
                    invalidateDraw()
                }
            }
        }
    }

    override fun ContentDrawScope.draw() {
        drawContent()
        if (!focused) return
        val width = FocusRing.Width.toPx()
        // The stroke's middle, half its width inside the control's edge.
        val ring = Size(size.width - width, size.height - width)
        if (ring.width <= 0f || ring.height <= 0f) return
        val outline = (shape ?: shapeFor(size)).createOutline(ring, layoutDirection, this)
        translate(width / 2, width / 2) {
            drawOutline(outline, if (onTint) Color.White else currentValueOf(LocalScootColors).accent, style = Stroke(width))
        }
    }

    private fun shapeFor(size: Size): Shape {
        val short = min(size.width, size.height)
        return if (short > 0f && max(size.width, size.height) / short <= FocusRing.CAPSULE_UP_TO) CapsuleShape else SquircleShape(10.dp)
    }
}
