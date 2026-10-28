// The rider's dot, MKUserLocationView as ios/ScootRadar/Views/ScooterMapView.swift shows it, and its heading beam,
// from ios/ScootRadar/Views/ScooterUserLocationView.swift (map.md MAP-186 to MAP-198).

package com.plhery.scootradar.map

import android.animation.ValueAnimator
import android.app.UiModeManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import android.util.DisplayMetrics
import android.view.Choreographer
import android.view.View
import android.view.animation.PathInterpolator
import androidx.core.graphics.ColorUtils
import androidx.core.graphics.createBitmap
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.merge
import kotlinx.coroutines.launch
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.Style
import org.maplibre.android.style.expressions.Expression
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.layers.Property
import org.maplibre.android.style.layers.PropertyFactory
import org.maplibre.android.style.layers.SymbolLayer
import org.maplibre.android.style.layers.TransitionOptions
import org.maplibre.android.style.sources.GeoJsonSource
import java.util.Locale
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.pow
import kotlin.math.roundToInt

/**
 * The rider on MapLibre's map while the controller knows where they are (MAP-186), as MapKit draws its user
 * location: a blue disc in a white ring with a soft shadow, breathing slowly (MAP-187), in the halo of its fix's
 * accuracy, in metres on the ground (MAP-197), with the compass's beam behind it (MAP-191 to MAP-196); above every
 * marker and name (MAP-188). It follows each fix the controller takes.
 *
 * The beam is a symbol of the map's, turned on the screen by its `icon-rotate`, not a view over the map: MapLibre
 * draws it in the frame it draws the dot in, so it stays on the dot as the map pans, where a view moved after each
 * frame would trail it. Its angle is the one on the screen of the place 30 m ahead, as ScooterUserLocationView turns
 * its view, set again as the map turns or tilts, as the compass turns, eased over 0.18 s, and as the rider moves.
 *
 * None of it takes a tap (MAP-198) or a TalkBack node: the map's tap and its virtual views pass it by.
 */
class ScooterRider(
    private val map: MapLibreMap,
    private val view: ScooterMapView,
    private val controller: ScooterMapController,
    scope: CoroutineScope,
) {
    private val projection = MapLibreProjection(map, view)
    private val art = RiderArt(view.pixelRatio)
    private var style: Style? = null
    private var look = RiderArt.Look(dark = false, highContrast = false)

    /** The pictures in the style: the ring's look, and the beam's half angle in whole degrees with its look. */
    private var ringLook: RiderArt.Look? = null
    private var beamPicture: Pair<Int, RiderArt.Look>? = null

    /** What the rider's source and layers say now. */
    private var writtenPlace: GeoPoint? = null
    private var writtenHalo: Pair<Double, Double>? = null
    private var writtenRadius = RiderArt.DOT_RADIUS

    /** The beam's angle on the screen as drawn, in degrees clockwise from straight up; null while it is hidden. */
    private var shownAngle: Double? = null
    private var setAngle: Double? = null

    /** The beam's turn under way, in degrees, from its start's uptime in milliseconds. */
    private var turn: Turn? = null
    private val easeOut = IosMotion.easeOut.let { PathInterpolator(it.x1, it.y1, it.x2, it.y2) }

    private var framesWanted = false
    private var lastBreath = 0L
    private val frame = Choreographer.FrameCallback { onFrame() }
    private val moved = MapLibreMap.OnCameraMoveListener { updateBeam(animated = false) }
    private val updates: Job

    init {
        map.getStyle { loaded ->
            if (style != null) return@getStyle
            style = loaded
            update(headingChanged = false)
        }
        map.addOnCameraMoveListener(moved)
        view.windowShown = { wantFrames() }
        updates = scope.launch {
            launch { merge(controller.userLocation, controller.locationAccuracy).collect { update(headingChanged = false) } }
            launch { controller.userHeading.collect { update(headingChanged = true) } }
        }
    }

    fun close() {
        updates.cancel()
        Choreographer.getInstance().removeFrameCallback(frame)
        framesWanted = false
        map.removeOnCameraMoveListener(moved)
        view.windowShown = null
        style = null
    }

    /** The app's appearance, and Increase Contrast's: the dot's blue and the beam's strength. */
    fun setLook(look: RiderArt.Look) {
        if (look == this.look) return
        this.look = look
        update(headingChanged = false)
    }

    /** The rider where the controller has them, with the halo of the fix, and the beam as the compass says. */
    private fun update(headingChanged: Boolean) {
        val style = style ?: return
        val place = controller.userLocation.value
        if (ringLook != look) {
            ringLook = look
            style.addImage(RING_IMAGE, art.ring(look))
            style.getLayer(ScooterMarkerLayers.RIDER)?.setProperties(PropertyFactory.circleColor(art.blue(look)))
            style.getLayer(ScooterMarkerLayers.RIDER_HALO)?.setProperties(PropertyFactory.circleColor(art.halo(look)))
        }
        if (place != writtenPlace) {
            writtenPlace = place
            val json = if (place == null) NOWHERE else point(place)
            style.getSourceAs<GeoJsonSource>(ScooterMarkerLayers.RIDER_SOURCE)?.setGeoJson(json)
        }
        val accuracy = controller.locationAccuracy.value
        val halo = place?.let { accuracy to it.latitude }
        if (halo != null && halo != writtenHalo) {
            writtenHalo = halo
            style.getLayer(ScooterMarkerLayers.RIDER_HALO)?.setProperties(PropertyFactory.circleRadius(haloRadius(halo.first, halo.second)))
        }
        updateBeam(animated = headingChanged)
        wantFrames()
    }

    /**
     * Points the beam the way the rider faces as the map shows it now: at once as the map or the rider moves, and
     * over 0.18 s as the compass turns, from wherever it is, unless motion is reduced or it was hidden.
     */
    private fun updateBeam(animated: Boolean) {
        val style = style ?: return
        val place = controller.userLocation.value
        val heading = controller.userHeading.value
        val angle = if (place != null && heading != null) heading.screenAngle(at = place, on = projection) else null
        if (heading == null || angle == null) {
            if (shownAngle != null) style.getLayer(ScooterMarkerLayers.RIDER_BEAM)?.setProperties(PropertyFactory.iconOpacity(0f))
            shownAngle = null
            turn = null
            return
        }
        val half = Math.toDegrees(heading.halfAngle).roundToInt()
        if (beamPicture != half to look) {
            beamPicture = half to look
            style.addImage(BEAM_IMAGE, art.beam(half.toDouble(), look))
        }
        val target = Math.toDegrees(angle)
        val from = shownAngle
        if (from == null) {
            turn = null
            setBeamAngle(style, target)
            style.getLayer(ScooterMarkerLayers.RIDER_BEAM)?.setProperties(PropertyFactory.iconOpacity(1f))
        } else if (animated && ValueAnimator.areAnimatorsEnabled()) {
            // The short way round, from where it is now.
            val to = from + ((target - from) % 360 + 540) % 360 - 180
            turn = Turn(from, to, SystemClock.uptimeMillis())
            wantFrames()
        } else {
            turn = null
            setBeamAngle(style, target)
        }
    }

    private fun setBeamAngle(style: Style, degrees: Double) {
        shownAngle = degrees
        // A turn too small to see would only have MapLibre lay the beam out again.
        val set = setAngle
        if (set != null && abs(((degrees - set) % 360 + 540) % 360 - 180) < MIN_TURN) return
        setAngle = degrees
        style.getLayer(ScooterMarkerLayers.RIDER_BEAM)?.setProperties(PropertyFactory.iconRotate(((degrees % 360 + 360) % 360).toFloat()))
    }

    // Frames

    private fun wantFrames() {
        if (framesWanted || style == null) return
        if (turn == null && !breathes()) {
            // At rest: the dot full size.
            setRadius(RiderArt.DOT_RADIUS)
            return
        }
        framesWanted = true
        Choreographer.getInstance().postFrameCallback(frame)
    }

    private fun onFrame() {
        framesWanted = false
        val style = style ?: return
        val now = SystemClock.uptimeMillis()
        turn?.let { turn ->
            val progress = ((now - turn.start) / TURN_MILLIS).coerceIn(0.0, 1.0)
            setBeamAngle(style, turn.from + (turn.to - turn.from) * easeOut.getInterpolation(progress.toFloat()))
            if (progress >= 1) this.turn = null
        }
        // A few times a second is enough for a change this slow, and spares the map being drawn again each frame.
        if (breathes() && now - lastBreath >= BREATH_STEP_MILLIS && isOnScreen()) {
            lastBreath = now
            setRadius(RiderArt.breathingRadius(now / 1000.0))
        }
        wantFrames()
    }

    private fun setRadius(radius: Double) {
        if (abs(radius - writtenRadius) < 0.01) return
        writtenRadius = radius
        style?.getLayer(ScooterMarkerLayers.RIDER)?.setProperties(PropertyFactory.circleRadius(radius.toFloat()))
    }

    /** The dot breathes while it is on the map, the map on screen, with animations on, as MapKit's does. */
    private fun breathes(): Boolean = controller.userLocation.value != null && ValueAnimator.areAnimatorsEnabled() &&
        view.isAttachedToWindow && view.windowVisibility == View.VISIBLE

    private fun isOnScreen(): Boolean {
        val place = controller.userLocation.value ?: return false
        val point = projection.point(place)
        val bounds = projection.bounds
        return point.x >= -RiderArt.RING_SIZE && point.y >= -RiderArt.RING_SIZE &&
            point.x <= bounds.maxX + RiderArt.RING_SIZE && point.y <= bounds.maxY + RiderArt.RING_SIZE
    }

    private data class Turn(val from: Double, val to: Double, val start: Long)

    companion object {
        private const val RING_IMAGE = "rider-ring"
        private const val BEAM_IMAGE = "rider-beam"
        private const val NOWHERE = "{\"type\":\"FeatureCollection\",\"features\":[]}"

        /** The beam's turn as the compass turns, in milliseconds: ScooterUserLocationView's 0.18 s ease-out. */
        private const val TURN_MILLIS = 180.0

        /** The least turn of the beam drawn, in degrees. */
        private const val MIN_TURN = 0.5

        private const val BREATH_STEP_MILLIS = 66L

        /** The equator's length in metres, as MapLibre's Web Mercator measures it. */
        private const val EARTH_CIRCUMFERENCE = 40_075_016.68557849

        private fun point(place: GeoPoint) =
            String.format(Locale.ROOT, "{\"type\":\"Point\",\"coordinates\":[%.7f,%.7f]}", place.longitude, place.latitude)

        /**
         * The halo's radius on the map, in its points, for a fix [accuracy] metres wide at [latitude]: as many
         * points as metres span at each zoom, MapLibre's world being 512 points wide at zoom 0.
         */
        internal fun haloRadius(accuracy: Double, latitude: Double): Expression {
            val atZoomZero = haloRadius(accuracy, latitude, zoom = 0.0)
            return Expression.interpolate(
                Expression.exponential(2),
                Expression.zoom(),
                Expression.stop(0, atZoomZero),
                Expression.stop(MAX_ZOOM, atZoomZero * 2.0.pow(MAX_ZOOM)),
            )
        }

        /** The halo's radius in points at a zoom of MapLibre's. */
        internal fun haloRadius(accuracy: Double, latitude: Double, zoom: Double): Double =
            max(0.0, accuracy) * 512 * 2.0.pow(zoom) / (EARTH_CIRCUMFERENCE * cos(latitude * PI / 180))

        private const val MAX_ZOOM = 25

        /**
         * The rider's source and layers, above every marker and name, bottom to top: the halo, the beam, the ring
         * and the dot. Each is drawn whatever is near, and none is turned or tilted with the map but the halo,
         * which lies on the ground.
         */
        fun addLayers(style: Style) {
            style.addSource(GeoJsonSource(ScooterMarkerLayers.RIDER_SOURCE))
            style.addLayer(
                CircleLayer(ScooterMarkerLayers.RIDER_HALO, ScooterMarkerLayers.RIDER_SOURCE).withProperties(
                    PropertyFactory.circleRadius(0f),
                    PropertyFactory.circlePitchAlignment(Property.CIRCLE_PITCH_ALIGNMENT_MAP),
                    PropertyFactory.circlePitchScale(Property.CIRCLE_PITCH_SCALE_MAP),
                ),
            )
            style.addLayer(
                SymbolLayer(ScooterMarkerLayers.RIDER_BEAM, ScooterMarkerLayers.RIDER_SOURCE).withProperties(
                    PropertyFactory.iconImage(BEAM_IMAGE),
                    PropertyFactory.iconOpacity(0f),
                    *pictureProperties(),
                ),
            )
            style.addLayer(
                SymbolLayer(ScooterMarkerLayers.RIDER_RING, ScooterMarkerLayers.RIDER_SOURCE).withProperties(
                    PropertyFactory.iconImage(RING_IMAGE),
                    *pictureProperties(),
                ),
            )
            style.addLayer(
                CircleLayer(ScooterMarkerLayers.RIDER, ScooterMarkerLayers.RIDER_SOURCE).withProperties(
                    PropertyFactory.circleRadius(RiderArt.DOT_RADIUS.toFloat()),
                    PropertyFactory.circlePitchAlignment(Property.CIRCLE_PITCH_ALIGNMENT_VIEWPORT),
                    PropertyFactory.circlePitchScale(Property.CIRCLE_PITCH_SCALE_VIEWPORT),
                ),
            )
            // A breath or a turn set a frame at a time is shown at once, not eased over the style's 0.3 s.
            for (id in listOf(ScooterMarkerLayers.RIDER_HALO, ScooterMarkerLayers.RIDER)) {
                (style.getLayer(id) as? CircleLayer)?.circleRadiusTransition = TransitionOptions(0, 0)
            }
            (style.getLayer(ScooterMarkerLayers.RIDER_BEAM) as? SymbolLayer)?.iconOpacityTransition = TransitionOptions(0, 0)
        }

        private fun pictureProperties() = arrayOf(
            PropertyFactory.iconAnchor(Property.ICON_ANCHOR_CENTER),
            PropertyFactory.iconAllowOverlap(true),
            PropertyFactory.iconIgnorePlacement(true),
            PropertyFactory.iconRotationAlignment(Property.ICON_ROTATION_ALIGNMENT_VIEWPORT),
            PropertyFactory.iconPitchAlignment(Property.ICON_PITCH_ALIGNMENT_VIEWPORT),
        )
    }
}

/**
 * The rider's pictures and colours, as MapKit draws its user location and ScooterHeadingBeamView its beam, at the
 * map's pixel ratio, in points.
 */
class RiderArt(private val density: Float) {
    /** The app's appearance, and whether Increase Contrast is on: high contrast text, or Android 14's contrast. */
    data class Look(val dark: Boolean, val highContrast: Boolean)

    /** UIColor.systemBlue in each appearance, its accessible variants with Increase Contrast. */
    fun blue(look: Look): Int = when {
        look.highContrast && look.dark -> 0xFF409CFF.toInt()
        look.highContrast -> 0xFF0040DD.toInt()
        look.dark -> 0xFF0A84FF.toInt()
        else -> 0xFF007AFF.toInt()
    }

    /** The accuracy halo's fill: the blue, faint. */
    fun halo(look: Look): Int = ColorUtils.setAlphaComponent(blue(look), (HALO_OPACITY * 255).roundToInt())

    /**
     * ScooterHeadingBeamView: a sector of [halfAngle] degrees each way of straight up in a square of 144 points,
     * filled from its point outwards with the blue at o, o × 0.5 by 0.45 of the way, and nothing at its edge; o is
     * 0.42, 0.65 with Increase Contrast.
     */
    fun beam(halfAngle: Double, look: Look): Bitmap = picture(BEAM_SIZE) { x, y ->
        val radius = (BEAM_SIZE / 2).toFloat()
        val blue = blue(look)
        val opacity = if (look.highContrast) 0.65 else 0.42
        val sector = Path().apply {
            moveTo(x, y)
            arcTo(RectF(x - radius, y - radius, x + radius, y + radius), (-90 - halfAngle).toFloat(), (2 * halfAngle).toFloat())
            close()
        }
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            shader = RadialGradient(
                x,
                y,
                radius,
                intArrayOf(alpha(blue, opacity), alpha(blue, opacity * 0.5), alpha(blue, 0.0)),
                floatArrayOf(0f, 0.45f, 1f),
                Shader.TileMode.CLAMP,
            )
        }
        drawPath(sector, paint)
    }

    /** The white ring under the dot, with its soft shadow all round. */
    fun ring(look: Look): Bitmap = picture(RING_SIZE) { x, y ->
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            setShadowLayer(SHADOW_RADIUS, 0f, SHADOW_OFFSET, Color.argb(if (look.dark) 0.5f else 0.3f, 0f, 0f, 0f))
        }
        drawCircle(x, y, RING_DIAMETER.toFloat() / 2, paint)
    }

    private fun picture(size: Double, draw: Canvas.(x: Float, y: Float) -> Unit): Bitmap {
        val side = max(1, ceil(size * density).toInt())
        val bitmap = createBitmap(side, side)
        // MapLibre reads a picture's pixel ratio from its density.
        bitmap.density = (density * DisplayMetrics.DENSITY_DEFAULT).roundToInt()
        // The canvas has a density of its own.
        val ratio = density
        Canvas(bitmap).apply {
            scale(ratio, ratio)
            draw(side / ratio / 2, side / ratio / 2)
        }
        return bitmap
    }

    private fun alpha(color: Int, opacity: Double): Int = ColorUtils.setAlphaComponent(color, (opacity * 255).roundToInt())

    companion object {
        /** MapKit's dot: a blue disc 16 points across in a white one 22 across. */
        const val DOT_RADIUS = 8.0
        const val RING_DIAMETER = 22.0

        /** The ring's picture, with room for its shadow. */
        const val RING_SIZE = 34.0

        const val BEAM_SIZE = 144.0
        private const val HALO_OPACITY = 0.15
        private const val SHADOW_RADIUS = 4f
        private const val SHADOW_OFFSET = 1f

        /** The dot's breath: in to 0.85 of its size and out again every 3 s, as MapKit's breathes. */
        private const val BREATH_PERIOD = 3.0
        private const val BREATH_DEPTH = 0.15

        /** The dot's radius [time] seconds into its breath. */
        fun breathingRadius(time: Double): Double =
            DOT_RADIUS * (1 - BREATH_DEPTH * (1 - cos(2 * PI * time / BREATH_PERIOD)) / 2)

        /**
         * Whether the phone asks for more contrast, as iOS's Increase Contrast: high contrast text, or, from Android
         * 14, the contrast set to medium or high.
         */
        fun isHighContrast(context: Context): Boolean {
            val highTextContrast = Settings.Secure.getInt(context.contentResolver, "high_text_contrast_enabled", 0) == 1
            val contrast = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                context.getSystemService(UiModeManager::class.java)?.contrast ?: 0f
            } else {
                0f
            }
            return highTextContrast || contrast >= 0.5f
        }
    }
}
