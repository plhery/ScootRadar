package com.plhery.scootradar.map

import android.annotation.SuppressLint
import android.content.Context
import android.view.MotionEvent
import android.view.ViewConfiguration
import org.maplibre.android.maps.MapLibreMapOptions
import org.maplibre.android.maps.MapView
import kotlin.math.hypot

// SafeAreaReportingMapView and the map's own tap recognizer from ios/ScootRadar/Views/ScooterMapView.swift.

/**
 * MapLibre's MapView with what the app needs that MapView keeps to itself: a tap answered as the finger lifts
 * (MAP-305), before MapLibre's gesture detector has decided it isn't the first of a double tap, as the iPhone
 * selects a scooter at once; and the hover events of TalkBack's explore by touch, for the markers' virtual views.
 */
@SuppressLint("ViewConstructor")
class ScooterMapView(context: Context, options: MapLibreMapOptions) : MapView(context, options) {
    /** A tap at a point of the view, in pixels: one finger, lifted within the touch slop, before a long press. */
    var tap: ((x: Float, y: Float) -> Unit)? = null

    /** TalkBack's hover events, which the markers' accessibility helper takes first. */
    var hover: ((MotionEvent) -> Boolean)? = null

    /** The window shown again, for the rider's dot to breathe again: ViewTreeObserver's own listener is API 34's. */
    var windowShown: (() -> Unit)? = null

    private val slop = ViewConfiguration.get(context).scaledTouchSlop
    private var downX = 0f
    private var downY = 0f
    private var fingers = 0

    override fun onWindowVisibilityChanged(visibility: Int) {
        super.onWindowVisibilityChanged(visibility)
        if (visibility == VISIBLE) windowShown?.invoke()
    }

    override fun dispatchHoverEvent(event: MotionEvent): Boolean =
        hover?.invoke(event) == true || super.dispatchHoverEvent(event)

    override fun dispatchTouchEvent(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                downX = event.x
                downY = event.y
                fingers = 1
            }
            MotionEvent.ACTION_POINTER_DOWN -> fingers += 1
            MotionEvent.ACTION_UP -> {
                val still = hypot(event.x - downX, event.y - downY) < slop
                val short = event.eventTime - event.downTime < ViewConfiguration.getLongPressTimeout()
                if (fingers == 1 && still && short) tap?.invoke(event.x, event.y)
            }
        }
        return super.dispatchTouchEvent(event)
    }
}
