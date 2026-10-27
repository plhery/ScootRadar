package com.plhery.scootradar.core.model

import kotlin.math.PI
import kotlin.math.cos

// MapFocusRequest and MapZoomRequest from ios/ScootRadar/Models/ScooterModels.swift.

data class MapFocusRequest(
    val point: GeoPoint,
    val token: Int,
    val latitudinalMeters: Double = 850.0,
    val longitudinalMeters: Double = 850.0,
) {
    companion object {
        /** The span the map zooms to when a city total is tapped: 0.08° by 0.12°. */
        fun city(point: GeoPoint, token: Int): MapFocusRequest {
            val metersPerDegree = 111_320.0
            return MapFocusRequest(
                point = point,
                token = token,
                latitudinalMeters = 0.08 * metersPerDegree,
                longitudinalMeters = 0.12 * metersPerDegree * cos(point.latitude * PI / 180),
            )
        }
    }
}

/** A step closer in, or further out, asked of the map from the keyboard. The map takes each token once. */
data class MapZoomRequest(
    /** In when positive, out when negative. */
    val steps: Int,
    val token: Int,
)
