package com.plhery.scootradar.ui.glass

import android.content.Context
import android.graphics.Canvas
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.unit.Dp
import kotlin.math.ceil
import kotlin.math.max

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

    /** How many times a glass over the map has taken a new blur of it (for the tests). */
    internal var blurs = 0

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

    override fun dispatchTouchEvent(event: MotionEvent): Boolean {
        touchedAt = SystemClock.uptimeMillis()
        return super.dispatchTouchEvent(event)
    }

    override fun dispatchGenericMotionEvent(event: MotionEvent): Boolean {
        // A mouse's wheel or a trackpad's two fingers zoom the map; a pointer only passing over it doesn't move it.
        if (event.actionMasked == MotionEvent.ACTION_SCROLL) touchedAt = SystemClock.uptimeMillis()
        return super.dispatchGenericMotionEvent(event)
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

    companion object {
        /**
         * When a hand, a mouse's wheel or a trackpad was last on the map, in uptime milliseconds: the glass, once
         * slow frames have stopped its blur, waits for the map to rest before it tries it again.
         */
        @Volatile
        var touchedAt = 0L
            private set
    }
}

/**
 * Draws behind the element the map under it, blurred by [radius]: the map's frame from [backdrop], moved to where
 * the element is. Clip to the element's shape first. The modifier is kept across compositions, so that a change in
 * the element's content doesn't blur the map again: only a frame of the map's, or the element laid out at a new place
 * over it, does. Its place is read as it draws, as the clip's layer is moved without drawing what is in it again.
 */
fun Modifier.mapBlur(backdrop: MapBackdrop, radius: Dp): Modifier = composed {
    remember(backdrop, radius) {
        val glass = BlurredMap()
        Modifier.onGloballyPositioned { coordinates ->
            glass.at.value = coordinates.positionInWindow()
        }.drawBehind {
            // Read so that each frame of the map's, and each new place of the element's, draws the glass again.
            drawBlurred(backdrop, backdrop.frames.intValue, glass, glass.at.value, radius)
        }
    }
}

/**
 * The blurred copy of the map behind one element, where it is, and what its blur was made for.
 *
 * Android 12 (API 31) keeps the image a RenderEffect made of a node for as long as the node keeps that effect, even
 * when what the node draws changes (bug D: with one effect kept, the glass showed the map as it was at its first draw,
 * before any tile, through every pan and appearance; API 37 makes it again, the versions between weren't tried). So
 * the glass takes a new effect for each new frame of the map's, and for each new place or size over it: the blur is
 * made again when what is under the glass has changed, and only then.
 */
private class BlurredMap {
    val node = RenderNode("glass")

    /** Where the element is in its window, in pixels. */
    val at = mutableStateOf(Offset.Zero)
    private var frame = -1
    private var radius = Float.NaN
    private var left = Float.NaN
    private var top = Float.NaN
    private var width = -1
    private var height = -1

    /**
     * Blurs by [px], in the shrunk map's pixels, the map's [frame] drawn [left] and [top] of the glass, [width] by
     * [height]; false if it already was.
     */
    fun blur(px: Float, frame: Int, left: Float, top: Float, width: Int, height: Int): Boolean {
        if (frame == this.frame && px == radius && left == this.left && top == this.top && width == this.width && height == this.height) return false
        node.setRenderEffect(RenderEffect.createBlurEffect(px, px, Shader.TileMode.CLAMP))
        this.frame = frame
        radius = px
        this.left = left
        this.top = top
        this.width = width
        this.height = height
        return true
    }
}

/**
 * Draws the map under the glass at [SHRINK] times smaller, blurs it there as much, and draws the blur back at the
 * glass's size. A blur this wide keeps nothing finer than a few pixels, so the glass looks the same, with a
 * sixteenth of the pixels to draw and blur at each frame of the map's.
 */
private fun DrawScope.drawBlurred(backdrop: MapBackdrop, frame: Int, glass: BlurredMap, at: Offset, radius: Dp) {
    val origin = backdrop.positionInWindow()
    val left = origin[0] - at.x
    val top = origin[1] - at.y
    val width = size.width.toInt()
    val height = size.height.toInt()
    glass.node.setPosition(0, 0, ceil(width / SHRINK).toInt(), ceil(height / SHRINK).toInt())
    if (glass.blur(shrunk(radius.toPx()), frame, left, top, width, height)) backdrop.blurs += 1
    val recording = glass.node.beginRecording()
    try {
        recording.scale(1 / SHRINK, 1 / SHRINK)
        recording.translate(left, top)
        recording.drawRenderNode(backdrop.node)
    } finally {
        glass.node.endRecording()
    }
    scale(SHRINK, pivot = Offset.Zero) {
        drawIntoCanvas { canvas ->
            val native = canvas.nativeCanvas
            if (native.isHardwareAccelerated) native.drawRenderNode(glass.node)
        }
    }
}

/** How many times smaller than the glass the map is blurred. */
private const val SHRINK = 4f

/**
 * The radius that blurs the map drawn [SHRINK] times smaller as [px] blurs it at its size: Android blurs a
 * RenderEffect's radius r by a bell of sigma 0.57735 r + 0.5 pixels (Blur::convertRadiusToSigma), and the sigma
 * shrinks with the map.
 */
private fun shrunk(px: Float): Float = max(0f, (SIGMA_PER_RADIUS * px + 0.5f) / SHRINK - 0.5f) / SIGMA_PER_RADIUS

private const val SIGMA_PER_RADIUS = 0.57735f
