package com.plhery.scootradar.ui.glass

import android.content.Context
import android.graphics.Canvas
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.unit.Dp

// The backdrop of ChromeGlass in ios/ScootRadar/Views/ScooterControls.swift: Liquid Glass sees the map under it.
// The spike's MapBackdrop (branch spike/android-map, PLAN §4 "Glass").

/**
 * The map's frame, which keeps what the map draws in a RenderNode the glass can blur. Each time the map draws a
 * frame, [frames] goes up, so the glass over it draws again. Only what MapLibre draws is in it: the chrome
 * composed over the map is not.
 */
class MapBackdrop(context: Context) : FrameLayout(context) {
    /** The map's last frame. */
    val node = RenderNode("map-backdrop")

    /** Goes up with each frame of the map's. */
    val frames = mutableIntStateOf(0)

    private val location = IntArray(2)

    /** Puts the map in the frame, out of any other first. */
    fun hold(map: View): MapBackdrop {
        if (map.parent === this) return this
        (map.parent as? ViewGroup)?.removeView(map)
        removeAllViews()
        addView(map)
        return this
    }

    /** Where the backdrop is in its window, in pixels. */
    fun positionInWindow(): IntArray {
        getLocationInWindow(location)
        return location
    }

    override fun onDescendantInvalidated(child: View, target: View) {
        super.onDescendantInvalidated(child, target)
        frames.intValue += 1
    }

    override fun dispatchDraw(canvas: Canvas) {
        if (!canvas.isHardwareAccelerated) return super.dispatchDraw(canvas)
        node.setPosition(0, 0, width, height)
        val recording = node.beginRecording(width, height)
        try {
            super.dispatchDraw(recording)
        } finally {
            node.endRecording()
        }
        canvas.drawRenderNode(node)
    }
}

/**
 * Draws behind the element the map under it, blurred by [radius]: the map's frame from [backdrop], moved to where
 * the element is. Clip to the element's shape first. The modifier is kept across compositions, so that a change in
 * the element's content doesn't blur the map again: only a frame of the map's, or the element moving over it, does.
 */
fun Modifier.mapBlur(backdrop: MapBackdrop, radius: Dp): Modifier = composed {
    remember(backdrop, radius) {
        val glass = BlurredMap()
        Modifier.onGloballyPositioned { coordinates ->
            val position = coordinates.positionInWindow()
            glass.at[0] = position.x
            glass.at[1] = position.y
        }.drawBehind {
            // Read so that each frame of the map's draws the glass again.
            drawBlurred(backdrop, backdrop.frames.intValue, glass, radius)
        }
    }
}

/**
 * The blurred copy of the map behind one element, where it is, and what its blur was made for.
 *
 * Android keeps the image a RenderEffect made of a node for as long as the node keeps that effect, even when what the
 * node draws changes (bug D: with one effect kept, the glass showed the map as it was at its first draw, before any
 * tile, through every pan and appearance). So the glass takes a new effect for each new frame of the map's, and for
 * each new place or size over it: the blur is made again when what is under the glass has changed, and only then.
 */
private class BlurredMap {
    val node = RenderNode("glass")
    val at = floatArrayOf(0f, 0f)
    private var frame = -1
    private var radius = Float.NaN
    private var left = Float.NaN
    private var top = Float.NaN
    private var width = -1
    private var height = -1

    /** Blurs by [px] the map's [frame] drawn [left] and [top] of the glass, [width] by [height]. */
    fun blur(px: Float, frame: Int, left: Float, top: Float, width: Int, height: Int) {
        if (frame == this.frame && px == radius && left == this.left && top == this.top && width == this.width && height == this.height) return
        node.setRenderEffect(RenderEffect.createBlurEffect(px, px, Shader.TileMode.CLAMP))
        this.frame = frame
        radius = px
        this.left = left
        this.top = top
        this.width = width
        this.height = height
    }
}

private fun DrawScope.drawBlurred(backdrop: MapBackdrop, frame: Int, glass: BlurredMap, radius: Dp) {
    val origin = backdrop.positionInWindow()
    val left = origin[0] - glass.at[0]
    val top = origin[1] - glass.at[1]
    val width = size.width.toInt()
    val height = size.height.toInt()
    glass.node.setPosition(0, 0, width, height)
    glass.blur(radius.toPx(), frame, left, top, width, height)
    val recording = glass.node.beginRecording()
    try {
        recording.translate(left, top)
        recording.drawRenderNode(backdrop.node)
    } finally {
        glass.node.endRecording()
    }
    drawIntoCanvas { canvas ->
        val native = canvas.nativeCanvas
        if (native.isHardwareAccelerated) native.drawRenderNode(glass.node)
    }
}
