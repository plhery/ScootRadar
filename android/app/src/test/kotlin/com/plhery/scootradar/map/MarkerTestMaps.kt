package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.MapRect
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterMapProjection
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import kotlin.math.pow

/** A phone's map, flat and north up, of an iPhone's size: what the markers' scene is tested on without MapLibre. */
class FlatMarkerMap(
    val centre: GeoPoint = GeoPoint(47.3769, 8.5417),
    /** MapLibre's zoom: 16 is the iPhone's 17, street level. */
    mapLibreZoom: Double = 16.0,
    width: Double = 390.0,
    height: Double = 844.0,
    override val isShown: Boolean = true,
    override val safeTop: Double = 47.0,
) : MarkerMap, ScooterMapProjection {
    /** Map points across a point of the screen. */
    private val perPoint = MapPoint.worldSize / (512 * 2.0.pow(mapLibreZoom))
    private val middle = MapPoint(centre)

    override val projection: ScooterMapProjection get() = this
    override val heading: Double = 0.0
    override val bounds = ScreenRect(0.0, 0.0, width, height)
    override val centerCoordinate: GeoPoint get() = centre
    override val visibleMapRect = MapRect(middle.x - width / 2 * perPoint, middle.y - height / 2 * perPoint, width * perPoint, height * perPoint)

    override fun point(coordinate: GeoPoint): ScreenPoint {
        val mapPoint = MapPoint(coordinate)
        return ScreenPoint((mapPoint.x - middle.x) / perPoint + bounds.midX, (mapPoint.y - middle.y) / perPoint + bounds.midY)
    }

    override fun coordinate(point: ScreenPoint): GeoPoint =
        MapPoint(middle.x + (point.x - bounds.midX) * perPoint, middle.y + (point.y - bounds.midY) * perPoint).coordinate

    /** The coordinate shown at a point, for a scooter to stand there. */
    fun at(x: Double, y: Double): GeoPoint = coordinate(ScreenPoint(x, y))
}

fun scooter(
    id: String,
    provider: String,
    battery: Int = 80,
    latitude: Double = 47.3769,
    longitude: Double = 8.5417,
    rangeMeters: Int? = null,
): Scooter = Scooter(
    provider = provider,
    latitude = latitude,
    longitude = longitude,
    battery = battery,
    rangeMeters = rangeMeters,
    vehicleID = id,
    deepLink = null,
    rentalURIs = null,
    distanceMeters = 0.0,
)

fun scooter(id: String, provider: String, at: GeoPoint): Scooter =
    scooter(id, provider, latitude = at.latitude, longitude = at.longitude)
