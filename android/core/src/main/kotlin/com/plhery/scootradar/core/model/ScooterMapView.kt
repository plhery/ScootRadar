package com.plhery.scootradar.core.model

import java.util.Locale
import kotlin.math.abs
import kotlin.math.pow

// ScooterMapScalePolicy, ScooterMapCameraPolicy, ScooterScreenshotCamera and the coordinator's static rules
// from ios/ScootRadar/Views/ScooterMapView.swift; the rest of that file is the map view.

/**
 * Whether the map shows a scale while it zooms: where the region measures in miles, so a rider can judge
 * feet and miles on the map as Apple Maps lets them. Metric regions keep the map as it was.
 */
object ScooterMapScalePolicy {
    fun showsScale(locale: Locale): Boolean = locale.measurementSystem != ScooterMeasurementSystem.Metric
}

/**
 * What the camera's rules read from the map view: its bounds, the coordinate it centres on, and where it
 * shows a place at its camera, tilted and turned as it is. Its points are MapKit's: dp, which is MapLibre's
 * pixels over the screen's density, and every rule of 44 or 1 point counts in them.
 */
interface ScooterMapProjection {
    /** The map view's own bounds, in points. */
    val bounds: ScreenRect

    /** The coordinate the map centres on, shown in the middle of the map's margins. */
    val centerCoordinate: GeoPoint

    /**
     * The part of the flat map the view shows, as MapKit gives it: the box, north up, around the view's
     * corners. Turned 90°, a phone shows a box wider than tall, with as many map points across as it had
     * down; turned 45°, a square.
     */
    val visibleMapRect: MapRect

    /** Where the map shows a coordinate, in its own points. */
    fun point(coordinate: GeoPoint): ScreenPoint

    /**
     * The coordinate the map shows at a point of its own, its longitude from -180 to 180 as MapKit gives it
     * past the antimeridian: MapLibre's is wrapped first.
     */
    fun coordinate(point: ScreenPoint): GeoPoint
}

object ScooterMapCameraPolicy {
    /**
     * The tilt the map opens with, in degrees, so that the buildings stand up a little. It is the least
     * MapKit keeps: under 20° it lays the map flat again at the first zoom, the rider's or the app's own.
     */
    const val openingPitch: Double = 20.0

    /**
     * A map without a size cannot take a region: it lost the opening view of Switzerland and started out
     * empty. This stands in until the first layout.
     */
    val openingFrame: ScreenRect = ScreenRect(0.0, 0.0, 390.0, 844.0)

    /**
     * The centre that shows a point in the middle of the part of the map left visible by what covers it, at
     * the current zoom. The search bar, the locate button and above all the dock cover the map, and in a
     * large window a panel down one side: centred on the point itself, a scooter can end up behind its own
     * card. `marginsMoved` says that the map's margins were moved past a panel or a fold.
     */
    fun center(
        showing: GeoPoint,
        on: ScooterMapProjection,
        visible: ScreenRect,
        marginsMoved: Boolean = false,
    ): GeoPoint {
        val mapView = on
        val bounds = mapView.bounds
        val top = swiftMax(bounds.minY, visible.minY)
        val bottom = swiftMin(bounds.maxY, visible.maxY)
        val leading = swiftMax(bounds.minX, visible.minX)
        val trailing = swiftMin(bounds.maxX, visible.maxX)
        // MapKit shows the centre in the middle of the map's layout margins, which a panel or a fold moves
        // past it: then the offset is measured from where the centre is shown, not from the middle of the map.
        val middle = if (marginsMoved || trailing - leading < abs(bounds.width)) {
            mapView.point(mapView.centerCoordinate)
        } else {
            ScreenPoint(bounds.midX, bounds.midY)
        }
        // With hardly anything left to show it in, the plain centre is as good.
        val offsetY = if (bottom - top >= 44) middle.y - (top + bottom) / 2 else 0.0
        val offsetX = if (trailing - leading >= 44) middle.x - (leading + trailing) / 2 else 0.0
        if (!(abs(offsetX) >= 1 || abs(offsetY) >= 1)) return showing
        val point = mapView.point(showing)
        return mapView.coordinate(ScreenPoint(point.x + offsetX, point.y + offsetY))
    }

    /**
     * What a region is centred in beside a panel or a fold: as wide as the part of the map left `visible`,
     * as tall as the map. None where nothing covers a side, and the region keeps to the middle of the map's
     * margins.
     */
    fun aside(visible: ScreenRect?, bounds: ScreenRect): ScreenRect? {
        if (visible == null) return null
        val beside = ScreenRect(visible.minX, bounds.minY, abs(visible.width), abs(bounds.height))
        // Where the two do not meet, CoreGraphics' rectangle of nothing has its middle at infinity.
        val across = beside.intersection(bounds)
        return if (across == null || abs(across.midX - bounds.midX) >= 1) beside else null
    }

    /**
     * Where a move to a place shows it, so where a step in or out keeps what is shown: beside a panel or a
     * fold, the middle of the part of the map left `visible` across and of the whole map up and down;
     * elsewhere where MapKit shows the centre, the middle of the map's margins.
     */
    fun focus(on: ScooterMapProjection, visible: ScreenRect): ScreenPoint {
        val mapView = on
        val shown = mapView.point(mapView.centerCoordinate)
        val beside = aside(visible, mapView.bounds) ?: return shown
        val across = beside.intersection(mapView.bounds)
        return ScreenPoint(
            x = if (across != null && abs(across.width) >= 44) across.midX else shown.x,
            y = mapView.bounds.midY,
        )
    }

    /**
     * The part of a map of `bounds` left visible between what covers its `top` and its `bottom`, and
     * `beside` the panel down one side of a large window. The panel counts as tall as the map, as far down
     * as a card in it may grow. On a phone nothing covers the sides.
     */
    fun visibleRectIn(bounds: ScreenRect, top: Double, bottom: Double, beside: ScreenRect?): ScreenRect {
        val band = ScreenRect(bounds.minX, top, abs(bounds.width), bottom - top)
        if (beside == null || beside.isEmpty) return band
        val panel = beside
        val minX = if (panel.midX < bounds.midX) swiftMin(swiftMax(panel.maxX, bounds.minX), bounds.maxX) else bounds.minX
        val maxX = if (panel.midX < bounds.midX) bounds.maxX else swiftMax(swiftMin(panel.minX, bounds.maxX), bounds.minX)
        return ScreenRect(minX, band.minY, maxX - minX, abs(band.height))
    }

    /** Where the map shows what it centres beside the fold of a partly open folding phone. */
    enum class FoldSide {
        /**
         * Above a fold across the map, standing like a laptop: the upright half, with the search bar, the
         * notices and the dock on the flat one.
         */
        Above,

        /**
         * Left or right of a fold down the map, open like a book: the half away from the panel, or the
         * trailing one without a panel.
         */
        Left,
        Right,
    }

    fun side(of: ScreenRect, panel: ScreenRect?, rightToLeft: Boolean): FoldSide {
        if (ScooterFold.isAcross(of)) return FoldSide.Above
        if (panel != null && !panel.isEmpty) return if (panel.midX < of.midX) FoldSide.Right else FoldSide.Left
        return if (rightToLeft) FoldSide.Left else FoldSide.Right
    }

    /**
     * The part of `visible` on the side `on` of a fold where the map shows. What covers the map on the
     * other side covers none of it: above a fold across the map, the search bar lying under it with the dock
     * doesn't, and the map shows from the top of its safe area, `safeTop`, down to the fold. With hardly
     * any room left the fold is let be.
     */
    fun visibleRect(visible: ScreenRect, safeTop: Double, beside: ScreenRect, on: FoldSide): ScreenRect {
        val fold = beside
        val rect = when (on) {
            FoldSide.Above -> {
                val top = if (visible.minY < fold.minY) visible.minY else safeTop
                ScreenRect(visible.minX, top, abs(visible.width), swiftMin(visible.maxY, fold.minY) - top)
            }
            FoldSide.Right -> {
                val minX = swiftMax(visible.minX, fold.maxX)
                ScreenRect(minX, visible.minY, visible.maxX - minX, abs(visible.height))
            }
            FoldSide.Left -> {
                val maxX = swiftMin(visible.maxX, fold.minX)
                ScreenRect(visible.minX, visible.minY, maxX - visible.minX, abs(visible.height))
            }
        }
        // A side that ends before it starts, past an edge of the map, leaves no room either. The iPhone reads its
        // size alone and keeps it (STATE.md, small fixes noticed).
        return if (rect.width >= 44 && rect.height >= 44) rect else visible
    }

    /**
     * The camera's distance `zoomedBy` steps in, or out when negative: each step halves or doubles it, as a
     * double tap or a tap with two fingers does.
     */
    fun distance(distance: Double, zoomedBy: Int): Double = distance / 2.0.pow(zoomedBy.toDouble())

    /** The widest phone. Its spans were chosen on phones. */
    const val phoneWidth: Double = 440.0

    /**
     * How much more ground than asked a map `across` points wide shows, so that a span chosen on a phone
     * looks there as it does on a phone instead of closer in: locating shows the same streets, larger
     * windows more of them around. 1 up to the widest phone, so phones are as they were.
     */
    fun spanScale(across: Double): Double = swiftMax(1.0, across / phoneWidth)
}

/**
 * A camera to open the map on, for screenshots, in debug builds only: `ScreenshotCamera` set to
 * "lat,lng,distance,pitch,heading" is the point looked at, the camera's distance from it in metres, its
 * tilt and the direction it faces in degrees, and `ScreenshotTerrain` set to "realistic" draws the ground
 * in 3D. A located rider leaves the map where the camera put it.
 */
object ScooterScreenshotCamera {
    data class Camera(val center: GeoPoint, val distance: Double, val pitch: Double, val heading: Double)

    fun fromLaunchArguments(defaults: ScooterDefaults): Camera? {
        val values = defaults.string(forKey = "ScreenshotCamera")
            ?.swiftSplit(',', maxSplits = Int.MAX_VALUE)
            // Trimmed of CharacterSet.whitespaces: the space separators and the tab.
            ?.mapNotNull { value -> swiftDouble(value.trim { it == '\t' || it.category == CharCategory.SPACE_SEPARATOR }) }
            ?: return null
        if (values.size != 5) return null
        return Camera(
            center = GeoPoint(latitude = values[0], longitude = values[1]),
            distance = values[2],
            pitch = values[3],
            heading = values[4],
        )
    }

    fun drawsTerrain(defaults: ScooterDefaults): Boolean = defaults.string(forKey = "ScreenshotTerrain") == "realistic"
}

/** The map coordinator's rules for which touches and selections it keeps. */
object ScooterMapCoordinator {
    /** How long, in seconds, a selection MapKit makes late for a touch already answered is set aside. */
    const val mapKitTapResolutionGracePeriod: Double = 1.0

    /** Whether a point is inside a frame that keeps touches from the map; there is none without a size. */
    fun point(point: ScreenPoint, isInside: ScreenRect?): Boolean {
        if (isInside == null || isInside.isEmpty || !(abs(isInside.width) > 0) || !(abs(isInside.height) > 0)) return false
        return isInside.contains(point)
    }

    /**
     * Whether a selection MapKit makes after a direct tap is set aside: one of another scooter than the
     * tapped one, `intendedID`, before the `until` deadline. Times are in seconds of the device's uptime.
     */
    fun shouldSuppressMapKitSelection(candidateID: String, intendedID: String?, until: Double, now: Double): Boolean =
        now < until && candidateID != intendedID

    /** Whether every selection MapKit makes is set aside, after a touch on what covers the map, until `until`. */
    fun shouldSuppressAllMapKitSelections(until: Double, now: Double): Boolean = now < until
}
