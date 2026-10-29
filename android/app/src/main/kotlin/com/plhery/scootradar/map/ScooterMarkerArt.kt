// ios/ScootRadar/Views/ScooterMarkerArt.swift, with MapKit's balloon (MKMarkerAnnotationView) for the bays.

package com.plhery.scootradar.map

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.DashPathEffect
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.graphics.fonts.Font
import android.graphics.fonts.FontFamily
import android.util.DisplayMetrics
import androidx.core.graphics.PathParser
import androidx.core.graphics.createBitmap
import androidx.core.graphics.withSave
import com.plhery.scootradar.R
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterDotState
import com.plhery.scootradar.core.model.ScooterMapLook
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.ui.theme.SEARCH_PATH
import kotlin.math.acos
import kotlin.math.ceil
import kotlin.math.exp
import kotlin.math.max
import kotlin.math.roundToInt
import kotlin.math.sqrt

/**
 * The faces of the markers' text: Inter (NEEDS-USER #2), in the weights the iPhone takes of its system font:
 * semibold, bold and heavy, each an instance of the chrome's variable Inter at its text optical size.
 */
class MarkerFonts(val semibold: Typeface, val bold: Typeface, val heavy: Typeface) {
    companion object {
        fun of(context: Context) = MarkerFonts(
            semibold = inter(context, 600),
            bold = inter(context, 700),
            heavy = inter(context, 800),
        )

        private fun inter(context: Context, weight: Int): Typeface {
            val font = Font.Builder(context.resources, R.font.inter_variable)
                .setWeight(weight)
                .setFontVariationSettings("'wght' $weight")
                .build()
            return Typeface.CustomFallbackBuilder(FontFamily.Builder(font).build()).build()
        }
    }
}

/**
 * The pictures of the markers. A glow drawn live under several hundred markers would make the map stutter while
 * it moves, so each picture is drawn once, with its ring and its glow, and shared by every marker that looks the
 * same: the map's style holds it under its [id]. They are drawn at the map's pixel ratio, sized in points as on
 * the iPhone. What the iPhone writes over a picture with a label, a cluster's count, is drawn into it here, as a
 * symbol of the map takes one picture.
 */
class ScooterMarkerArt(
    /** Pixels to a point: the map's pixel ratio. */
    val density: Float,
    private val fonts: MarkerFonts,
) {
    data class Key(
        val provider: ScooterProvider?,
        val diameter: Double,
        val state: ScooterDotState,
        val showsInitials: Boolean,
        /** Dark appearance, and the satellite picture in either appearance. */
        val isDark: Boolean,
    ) {
        val id: String
            get() = "dot/${provider.part}/${(diameter * 2).roundToInt()}/${state.name}/${showsInitials.part}/${isDark.part}"
    }

    data class ClusterKey(
        /** The provider with the most scooters in the cluster lends its colour to the glow. */
        val provider: ScooterProvider?,
        val diameter: Double,
        val isDark: Boolean,
        /** "128", written in the middle. */
        val count: String,
    ) {
        val id: String get() = "cluster/${provider.part}/${diameter.roundToInt()}/${isDark.part}/$count"

        /** The picture of a group of scooters last seen. */
        val lastSeenID: String get() = "seen-group/${provider.part}/${diameter.roundToInt()}/${isDark.part}/$count"
    }

    /** A scooter where it was last seen, while the server collects it again. */
    data class LastSeenKey(val provider: ScooterProvider?, val isDark: Boolean) {
        val id: String get() = "seen/${provider.part}/${isDark.part}"
    }

    /** A parking bay's balloon, small at rest and large when selected. */
    data class BayKey(val provider: ScooterProvider?, val isSelected: Boolean) {
        val id: String get() = "bay/${provider.part}/${isSelected.part}"
    }

    /**
     * The name beside the nearest scooter of a provider: a small dot in the provider's colour, the name and the
     * walking time. The pill of the selected scooter is filled with the provider's colour.
     */
    data class PillContent(
        val provider: ScooterProvider?,
        val name: String,
        /** "1 min"; null without an origin. */
        val time: String?,
        val isFilled: Boolean,
        val isDark: Boolean,
    ) {
        val id: String get() = "pill/${provider.part}/${isFilled.part}/${isDark.part}/$name/${time.orEmpty()}"
    }

    private val dots = HashMap<Key, Bitmap>()
    private val clusters = HashMap<ClusterKey, Bitmap>()
    private val lastSeenDots = HashMap<LastSeenKey, Bitmap>()
    private val lastSeenClusters = HashMap<ClusterKey, Bitmap>()
    private val bays = HashMap<BayKey, Bitmap>()
    private val addresses = HashMap<Boolean, Bitmap>()
    private val pills = HashMap<PillContent, Bitmap>()
    private val pillWidths = HashMap<PillContent, Double>()

    fun image(key: Key): Bitmap = dots.kept(key) { draw(it) }

    /** Every count is a picture of its own, so they are not all kept either. */
    fun clusterImage(key: ClusterKey): Bitmap = clusters.kept(key) { draw(it) }

    fun lastSeenImage(key: LastSeenKey): Bitmap = lastSeenDots.getOrPut(key) { draw(key) }

    fun lastSeenClusterImage(key: ClusterKey): Bitmap = lastSeenClusters.kept(key) { drawLastSeen(it) }

    fun bayImage(key: BayKey): Bitmap = bays.getOrPut(key) { draw(key) }

    /** The pill and its shadow, with the pill's frame [PILL_MARGIN] points in from each side. */
    fun pillImage(content: PillContent): Bitmap = pills.kept(content) { draw(it) }

    /** Zooming through every scale draws many sizes; they are not all kept. */
    private fun <K> HashMap<K, Bitmap>.kept(key: K, draw: (K) -> Bitmap): Bitmap {
        get(key)?.let { return it }
        if (size >= MAXIMUM_DOTS) clear()
        return draw(key).also { put(key, it) }
    }

    /** The width of the pill in points, which its placement needs: its text is measured in the app's font. */
    fun pillWidth(content: PillContent): Double = pillWidths.getOrPut(content) {
        if (pillWidths.size >= MAXIMUM_DOTS) pillWidths.clear()
        var width = PILL_LEADING + PILL_DOT + PILL_GAP + ceil(textWidth(content.name, nameFont))
        content.time?.let { width += PILL_GAP + ceil(textWidth(it, timeFont)) }
        width + PILL_TRAILING
    }

    private val nameFont = TextFace(fonts.bold, 12f)
    private val timeFont = TextFace(fonts.semibold, 12f)

    private class TextFace(val typeface: Typeface, val size: Float, val tabular: Boolean = false)

    private fun textPaint(face: TextFace, color: Int, size: Float = face.size) = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        typeface = face.typeface
        textSize = size
        isSubpixelText = true
        if (face.tabular) fontFeatureSettings = "tnum"
        this.color = color
    }

    private fun textWidth(text: String, face: TextFace): Double = textPaint(face, Color.BLACK).measureText(text).toDouble()

    /**
     * Text written as UIKit draws an attributed string at a point: its line, from the font's ascent to its
     * descent, from the top-left corner given.
     */
    private fun Canvas.text(text: String, paint: Paint, left: Double, top: Double) {
        drawText(text, left.toFloat(), (top - paint.fontMetrics.ascent).toFloat(), paint)
    }

    private fun lineHeight(paint: Paint): Double = (paint.fontMetrics.descent - paint.fontMetrics.ascent).toDouble()

    /**
     * A picture [width] by [height] points at the map's pixel ratio, drawn in points, given its middle: a picture
     * of a fractional size is a whole number of pixels.
     */
    private fun picture(width: Double, height: Double, draw: Canvas.(x: Float, y: Float) -> Unit): Bitmap {
        val bitmap = createBitmap(max(1, ceil(width * density).toInt()), max(1, ceil(height * density).toInt()))
        // MapLibre reads a picture's pixel ratio from its density.
        bitmap.density = (density * DisplayMetrics.DENSITY_DEFAULT).roundToInt()
        val ratio = density
        Canvas(bitmap).apply {
            scale(ratio, ratio)
            draw(bitmap.width / ratio / 2, bitmap.height / ratio / 2)
        }
        return bitmap
    }

    private class Glow(
        /** The disc that glows, and how far its light is blurred. */
        val radius: Double,
        val blur: Double,
        val alpha: Double = 0.6,
    ) {
        /** A blurred disc is close to a bell: this is how wide. */
        val spread: Double get() = sqrt(blur * blur + radius * radius / 2)
        val extent: Double get() = 2.4 * spread
    }

    private fun glow(key: Key): Glow? {
        val diameter = key.diameter
        return when (key.state) {
            ScooterDotState.Plain -> if (key.isDark) Glow(diameter * 0.8, diameter * 0.75) else null
            ScooterDotState.Head -> {
                val scale = diameter / 14
                if (key.isDark) Glow(diameter / 2 + 6 * scale, 11 * scale) else null
            }
            ScooterDotState.Selected -> {
                val scale = diameter / 16
                Glow(diameter / 2 + 8 * scale, 13 * scale, alpha = if (key.isDark) 0.6 else 0.5)
            }
        }
    }

    private fun draw(key: Key): Bitmap {
        val color = ScooterMapLook.dotColor(key.provider, key.isDark)
        val radius = key.diameter / 2
        val glow = glow(key)
        val ring = ScooterMapLook.ringReach(key.state)
        // Room for the glow, or for the ring and the shadow that falls under it.
        val margin = ceil(max((glow?.extent ?: 0.0) - radius, ring + (if (key.state == ScooterDotState.Plain) 12 else 16)))
        val side = key.diameter + 2 * margin
        val ground = if (key.isDark) ScooterMapLook.darkGround else ScooterMapLook.white
        val shadow = shadowColor(color)

        return picture(side, side) { x, y ->
            if (glow != null) draw(glow, color, x, y)

            // In light appearance a short shadow in the dot's own colour falls under its white ring.
            fun disc(radius: Double, color: Long, offset: Double = 0.0, blur: Double = 0.0) {
                val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = color.toInt() }
                if (blur > 0 && !key.isDark) paint.setShadowLayer(shadowRadius(blur), 0f, offset.toFloat(), shadow)
                drawCircle(x, y, radius.toFloat(), paint)
            }
            when (key.state) {
                ScooterDotState.Plain -> disc(radius + (if (key.isDark) 1.5 else 2.0), ground, offset = 2.0, blur = 7.0)
                ScooterDotState.Head -> {
                    disc(radius + 4, color, offset = 3.0, blur = 10.0)
                    disc(radius + 2.5, ground)
                }
                ScooterDotState.Selected -> {
                    disc(radius + 6, ScooterMapLook.selectionRing, offset = 3.0, blur = 10.0)
                    disc(radius + 3, ground)
                }
            }
            disc(radius, color)

            if (key.showsInitials) {
                val initials = key.provider?.shortName ?: "?"
                val size = key.diameter * (if (initials.length > 1) 0.43 else 0.54)
                val paint = textPaint(TextFace(fonts.heavy, size.toFloat()), ScooterMapLook.ink(key.provider, key.isDark).toInt())
                text(initials, paint, x - paint.measureText(initials) / 2.0, y - lineHeight(paint) / 2)
            }
        }
    }

    private fun draw(key: ClusterKey): Bitmap {
        val tint = ScooterMapLook.dotColor(key.provider, key.isDark)
        val radius = key.diameter / 2
        val glow = Glow(radius + 5, 11.0, alpha = 0.55)
        val margin = ceil(if (key.isDark) glow.extent - radius else 16.0)
        val side = key.diameter + 2 * margin

        return picture(side, side) { x, y ->
            val ring = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                strokeWidth = 1.5f
            }
            if (key.isDark) {
                draw(glow, tint, x, y)
                drawCircle(x, y, radius.toFloat(), Paint(Paint.ANTI_ALIAS_FLAG).apply { color = RAISED_DARK })
                ring.color = tint.withAlpha(0.55)
            } else {
                val disc = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = Color.WHITE
                    setShadowLayer(shadowRadius(10.0), 0f, 3f, shadowColor(tint))
                }
                drawCircle(x, y, radius.toFloat(), disc)
                ring.color = tint.withAlpha(0.7)
            }
            drawCircle(x, y, (radius - 0.75).toFloat(), ring)
            count(key, x, y)
        }
    }

    /** The dot in the provider's colour inside a thin ring, without a glow or a shadow. */
    private fun draw(key: LastSeenKey): Bitmap {
        val ring = 1.5
        val side = LAST_SEEN_DIAMETER + 2 * ring
        val ground = if (key.isDark) ScooterMapLook.darkGround else ScooterMapLook.white
        return picture(side, side) { x, y ->
            drawCircle(x, y, (side / 2).toFloat(), Paint(Paint.ANTI_ALIAS_FLAG).apply { color = ground.toInt() })
            val dot = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = ScooterMapLook.dotColor(key.provider, key.isDark).toInt() }
            drawCircle(x, y, (LAST_SEEN_DIAMETER / 2).toFloat(), dot)
        }
    }

    /**
     * A group of them: a dashed ring in the colour of the provider with the most of them, around a disc that
     * lets the map through, and their number.
     */
    private fun drawLastSeen(key: ClusterKey): Bitmap {
        val tint = ScooterMapLook.dotColor(key.provider, key.isDark)
        val ground = if (key.isDark) ScooterMapLook.darkGround else ScooterMapLook.white
        val line = 2.0
        val ring = key.diameter - line
        // Dashes of 4 pt with gaps of 3, stretched a little so that they go round evenly.
        val circumference = Math.PI * ring
        val period = circumference / Math.round(circumference / 7).toDouble()

        return picture(key.diameter, key.diameter) { x, y ->
            drawCircle(x, y, (key.diameter / 2).toFloat(), Paint(Paint.ANTI_ALIAS_FLAG).apply { color = ground.withAlpha(0.8) })
            val dashes = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                strokeWidth = line.toFloat()
                color = tint.toInt()
                pathEffect = DashPathEffect(floatArrayOf((period * 4 / 7).toFloat(), (period * 3 / 7).toFloat()), 0f)
            }
            // Core Graphics strokes an ellipse from its right, going down: the dashes start where they do there.
            val circle = Path().apply {
                addArc(RectF(x - ring.toFloat() / 2, y - ring.toFloat() / 2, x + ring.toFloat() / 2, y + ring.toFloat() / 2), 0f, 359.999f)
            }
            drawPath(circle, dashes)
            count(key, x, y)
        }
    }

    /**
     * The count, in bold digits of one width at 13 points, made smaller down to 0.6 of that to fit 8 points inside
     * the disc, as UIKit fits a label's text to its width.
     */
    private fun Canvas.count(key: ClusterKey, x: Float, y: Float) {
        val face = TextFace(fonts.bold, 13f, tabular = true)
        val color = if (key.isDark) COUNT_ON_DARK else COUNT_ON_LIGHT
        val natural = textPaint(face, color).measureText(key.count)
        val box = (key.diameter - 8).toFloat()
        val scale = if (natural > box) max(0.6f, box / natural) else 1f
        val paint = textPaint(face, color, size = 13f * scale)
        text(key.count, paint, x - paint.measureText(key.count) / 2.0, y - lineHeight(paint) / 2)
    }

    /**
     * MapKit's marker balloon, as it draws it on the Mac (MAP-300): a disc in the tint inside a white rim, lighter
     * at its top, on a short point, with the glyph in white. Selected, it is larger, on a longer point, over a small
     * dot where the bay is. The picture is as tall above the bay as below it, so that it hangs from its middle.
     */
    private fun draw(key: BayKey): Bitmap {
        val shape = BayShape.of(key.isSelected)
        return balloon(key.provider?.color ?: SYSTEM_BLUE, shape) { x, centre ->
            val paint = textPaint(TextFace(fonts.bold, shape.glyph.toFloat()), Color.WHITE)
            text("P", paint, x - paint.measureText("P") / 2.0, centre - lineHeight(paint) / 2)
        }
    }

    /**
     * The searched place's pin (MAP-033): MapKit's balloon at rest in the system's blue, with a magnifying glass
     * for its glyph.
     */
    fun addressImage(isDark: Boolean): Bitmap = addresses.getOrPut(isDark) {
        val shape = BayShape.rest
        balloon(if (isDark) SYSTEM_BLUE_DARK else SYSTEM_BLUE, shape) { x, centre ->
            // A Material symbol fills 20 of its 24 units, as an SF Symbol fills its point size (SYMBOL_FRAME).
            val side = (shape.glyph * 24 / 20).toFloat()
            val glyph = PathParser.createPathFromPathData(SEARCH_PATH)
            withSave {
                translate(x - side / 2, centre - side / 2)
                scale(side / 960f, side / 960f)
                translate(0f, 960f)
                drawPath(glyph, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE })
            }
        }
    }

    /** The balloon of [shape] in [tint], with its [glyph] drawn about the disc's centre. */
    private fun balloon(tint: Long, shape: BayShape, glyph: Canvas.(x: Float, centre: Float) -> Unit): Bitmap {
        val outer = shape.radius + shape.rim
        val side = 2 * (outer + BAY_MARGIN)
        val height = 2 * shape.above + 2 * BAY_MARGIN
        // The bay is at the picture's middle.
        return picture(side, height) { x, anchor ->
            val centre = anchor - shape.above.toFloat() + outer.toFloat()
            val tip = anchor - shape.dotGap.toFloat()
            val white = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.WHITE
                setShadowLayer(shadowRadius(BAY_SHADOW_BLUR), 0f, 3f, Color.argb(0.3f, 0f, 0f, 0f))
            }
            drawPath(balloon(x, centre, outer.toFloat(), tip), white)
            val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                shader = LinearGradient(
                    0f, centre - shape.radius.toFloat(), 0f, centre + shape.radius.toFloat(),
                    mix(tint, ScooterMapLook.white, 0.3), mix(tint, 0xFF000000, 0.12), Shader.TileMode.CLAMP,
                )
            }
            drawCircle(x, centre, shape.radius.toFloat(), fill)
            if (shape.dotGap > 0) {
                val dot = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = tint.toInt()
                    setShadowLayer(shadowRadius(4.0), 0f, 1f, Color.argb(0.3f, 0f, 0f, 0f))
                }
                drawCircle(x, anchor, BAY_DOT_RADIUS.toFloat(), dot)
            }
            glyph(x, centre)
        }
    }

    /** A disc of [radius] around ([x], [centre]) whose sides run down to a point at [tip]. */
    private fun balloon(x: Float, centre: Float, radius: Float, tip: Float): Path {
        val reach = tip - centre
        // Where the lines from the point touch the disc, from straight down.
        val touch = Math.toDegrees(acos((radius / reach).toDouble())).toFloat()
        return Path().apply {
            arcTo(RectF(x - radius, centre - radius, x + radius, centre + radius), 90f - touch, -(360f - 2 * touch))
            lineTo(x, tip)
            close()
        }
    }

    /** A bay's balloon, measured on MapKit's: its disc, its rim, and how far the picture reaches above the bay. */
    data class BayShape(val radius: Double, val rim: Double, val point: Double, val dotGap: Double, val glyph: Double) {
        /** From the bay up to the top of the rim. */
        val above: Double get() = dotGap + point + 2 * (radius + rim)

        /** Where the balloon is, from the bay: what a tap on it touches. */
        val frame: ScreenRect
            get() = ScreenRect(-(radius + rim), -above, 2 * (radius + rim), above - dotGap + (if (dotGap > 0) BAY_DOT_RADIUS else 0.0))

        companion object {
            val rest = BayShape(radius = 14.0, rim = 2.5, point = 3.3, dotGap = 0.0, glyph = 15.0)
            val selected = BayShape(radius = 30.0, rim = 3.85, point = 12.0, dotGap = 5.7, glyph = 34.0)

            fun of(isSelected: Boolean) = if (isSelected) selected else rest
        }
    }

    private fun draw(content: PillContent): Bitmap {
        val width = pillWidth(content)
        val height = ScooterMapLook.pillHeight
        val color = ScooterMapLook.dotColor(content.provider, content.isDark)
        val ink = ScooterMapLook.ink(content.provider, content.isDark)
        val text = if (content.isDark) PILL_TEXT_ON_DARK else PILL_TEXT_ON_LIGHT
        val quiet = if (content.isDark) PILL_QUIET_ON_DARK else PILL_QUIET_ON_LIGHT
        return picture(width + 2 * PILL_MARGIN, height + 2 * PILL_MARGIN) { _, _ ->
            translate(PILL_MARGIN.toFloat(), PILL_MARGIN.toFloat())
            val frame = RectF(0f, 0f, width.toFloat(), height.toFloat())
            val corner = (height / 2).toFloat()
            // The layer's shadow follows the pill's outline, whatever lies in it.
            val shadow = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                this.color = Color.TRANSPARENT
                setShadowLayer(layerShadowRadius(7.0), 0f, 4f, Color.argb(if (content.isDark) 0.3f else 0.16f, 0f, 0f, 0f))
            }
            drawRoundRect(frame, corner, corner, shadow)
            val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                // No material blurs the map under a symbol: a denser tint keeps the small text readable over it.
                this.color = if (content.isFilled) color.toInt() else if (content.isDark) PILL_ON_DARK else PILL_ON_LIGHT
            }
            drawRoundRect(frame, corner, corner, fill)
            if (!content.isFilled) {
                val border = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    style = Paint.Style.STROKE
                    strokeWidth = 1f
                    this.color = (if (content.isDark) ScooterMapLook.white else text).withAlpha(0.1)
                }
                drawRoundRect(RectF(0.5f, 0.5f, width.toFloat() - 0.5f, height.toFloat() - 0.5f), corner - 0.5f, corner - 0.5f, border)
            }
            val dot = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = (if (content.isFilled) ink else color).toInt() }
            val dotTop = ((height - PILL_DOT) / 2).toFloat()
            drawCircle((PILL_LEADING + PILL_DOT / 2).toFloat(), dotTop + (PILL_DOT / 2).toFloat(), (PILL_DOT / 2).toFloat(), dot)

            val name = textPaint(nameFont, (if (content.isFilled) ink else text).toInt())
            val nameLeft = PILL_LEADING + PILL_DOT + PILL_GAP
            text(content.name, name, nameLeft, (height - lineHeight(name)) / 2)
            content.time?.let { time ->
                val paint = textPaint(timeFont, if (content.isFilled) ink.withAlpha(0.8) else quiet.toInt())
                val left = nameLeft + ceil(name.measureText(content.name).toDouble()) + PILL_GAP
                text(time, paint, left, (height - lineHeight(paint)) / 2)
            }
        }
    }

    /** The light around a dot: strongest under it and gone at the edge of the picture. */
    private fun Canvas.draw(glow: Glow, color: Long, x: Float, y: Float) {
        val peak = glow.alpha * (1 - exp(-glow.radius * glow.radius / (2 * glow.blur * glow.blur)))
        val colors = IntArray(GLOW_STEPS + 1)
        val stops = FloatArray(GLOW_STEPS + 1)
        for (step in 0..GLOW_STEPS) {
            val position = step.toDouble() / GLOW_STEPS
            val distance = position * glow.extent
            val fall = exp(-distance * distance / (2 * glow.spread * glow.spread))
            colors[step] = color.withAlpha(if (step == GLOW_STEPS) 0.0 else peak * fall)
            stops[step] = position.toFloat()
        }
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            shader = RadialGradient(x, y, glow.extent.toFloat(), colors, stops, Shader.TileMode.CLAMP)
        }
        drawCircle(x, y, glow.extent.toFloat(), paint)
    }

    companion object {
        /**
         * A picture with what it shows grown to [scale] of its size about its middle, as a layer's transform.scale
         * grows it about its anchor, in a picture of the same size and pixel ratio (MAP-119). Whole, it is the
         * picture itself. Drawn [into] a bitmap of the picture's size if given one, cleared first.
         */
        fun grown(picture: Bitmap, scale: Double, into: Bitmap? = null): Bitmap {
            if (scale >= 1.0) return picture
            val bitmap = into?.apply { eraseColor(Color.TRANSPARENT) } ?: createBitmap(picture.width, picture.height)
            require(bitmap.width == picture.width && bitmap.height == picture.height) { "a ${bitmap.width}x${bitmap.height} bitmap for a ${picture.width}x${picture.height} picture" }
            bitmap.density = picture.density
            Canvas(bitmap).apply {
                scale(scale.toFloat(), scale.toFloat(), picture.width / 2f, picture.height / 2f)
                drawBitmap(picture, 0f, 0f, Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG))
            }
            return bitmap
        }

        /** Smaller than the others' dots, which stand out over it, as on the web. */
        const val LAST_SEEN_DIAMETER: Double = 10.0

        /** The room around a pill's frame in its picture, for its shadow. */
        const val PILL_MARGIN: Double = 20.0

        /** Zooming through every scale draws many sizes; they are not all kept. */
        private const val MAXIMUM_DOTS = 600
        private const val GLOW_STEPS = 10

        private const val PILL_LEADING = 8.0
        private const val PILL_TRAILING = 10.0
        private const val PILL_GAP = 6.0
        private const val PILL_DOT = 7.0

        private const val BAY_MARGIN = 6.0
        private const val BAY_SHADOW_BLUR = 8.0
        private const val BAY_DOT_RADIUS = 3.0

        /** UIColor.systemBlue, the balloon's tint without a provider. */
        private const val SYSTEM_BLUE: Long = 0xFF007AFF

        /** UIColor.systemBlue in the dark. */
        private const val SYSTEM_BLUE_DARK: Long = 0xFF0A84FF

        private val RAISED_DARK = Color.argb(1f, 0.086f, 0.102f, 0.141f)
        private val COUNT_ON_DARK = Color.argb(1f, 0.957f, 0.961f, 0.969f)
        private val COUNT_ON_LIGHT = Color.argb(1f, 0.063f, 0.075f, 0.102f)
        private val PILL_TEXT_ON_DARK = rgb(0.957, 0.961, 0.969)
        private val PILL_TEXT_ON_LIGHT = rgb(0.063, 0.075, 0.102)
        private val PILL_QUIET_ON_DARK = rgb(0.639, 0.659, 0.702)
        private val PILL_QUIET_ON_LIGHT = rgb(0.4, 0.439, 0.502)

        /** The iPhone's tint over its material is 0.62 and 0.66 (MAP-106). */
        private val PILL_ON_DARK = Color.argb(0.85f, 0.063f, 0.075f, 0.102f)
        private val PILL_ON_LIGHT = Color.argb(0.88f, 1f, 1f, 1f)

        /** The dark of the shadows, mixed into the dot's colour. */
        private val SHADE = doubleArrayOf(0.063, 0.075, 0.102)

        private fun rgb(red: Double, green: Double, blue: Double): Long =
            (0xFF shl 24 or (channel(red) shl 16) or (channel(green) shl 8) or channel(blue)).toLong() and 0xFFFFFFFF

        private fun channel(value: Double): Int = (value * 255).roundToInt().coerceIn(0, 255)

        private fun Long.withAlpha(alpha: Double): Int = (channel(alpha) shl 24) or (this and 0xFFFFFF).toInt()

        private fun mix(color: Long, with: Long, share: Double): Int {
            fun part(shift: Int) = ((color shr shift and 0xFF) * (1 - share) + (with shr shift and 0xFF) * share).roundToInt()
            return Color.rgb(part(16), part(8), part(0))
        }

        /**
         * Core Graphics' shadow blur, as the radius Android blurs a shadow by. Core Graphics' blur of b points is a
         * bell about 0.47 b wide, as measured on the Mac; Android's of r is 0.57735 r + 0.5 wide (its
         * convertRadiusToSigma), both in the units the picture is drawn in.
         */
        fun shadowRadius(blur: Double): Float = max(0.0, (0.47 * blur - 0.5) / 0.57735).toFloat()

        /** A layer's shadowRadius is Core Graphics' blur of twice as much, as measured on the Mac. */
        fun layerShadowRadius(radius: Double): Float = shadowRadius(2 * radius)

        /** The dot's colour, a little over half, with a dark shade. */
        private fun shadowColor(color: Long): Int {
            val own = 0.55
            val dark = 0.45 * 0.35
            val total = own + dark
            fun part(shift: Int, index: Int) = ((color shr shift and 0xFF) / 255.0 * own + SHADE[index] * dark) / total
            return Color.argb(total.toFloat(), part(16, 0).toFloat(), part(8, 1).toFloat(), part(0, 2).toFloat())
        }

        private val ScooterProvider?.part: String get() = this?.rawValue ?: "none"
        private val Boolean.part: String get() = if (this) "1" else "0"
    }
}
