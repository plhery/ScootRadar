package com.plhery.scootradar.map

import android.view.View
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterMapCameraPolicy
import com.plhery.scootradar.core.model.ScooterMapStart
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap

// The camera of ScooterMapView's coordinator, from ios/ScootRadar/Views/ScooterMapView.swift.

/**
 * What the iPhone's map coordinator does with the camera: it reports each place the map comes to rest on to the
 * controller, as regionDidChange does, with the region and zoom the iPhone measures.
 */
class MapCamera(
    private val map: MapLibreMap,
    private val view: ScooterMapView,
    private val controller: ScooterMapController,
    private val memory: MapCameraMemory,
) {
    private val projection = MapLibreProjection(map, view)
    private val idle = MapLibreMap.OnCameraIdleListener { regionDidChange() }
    private val resized = View.OnLayoutChangeListener { _, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom ->
        if (right - left != oldRight - oldLeft || bottom - top != oldBottom - oldTop) regionDidChange()
    }

    init {
        map.addOnCameraIdleListener(idle)
        view.addOnLayoutChangeListener(resized)
        // MapKit reports the region it opens on; MapLibre may already be at rest.
        view.post { regionDidChange() }
    }

    fun close() {
        map.removeOnCameraIdleListener(idle)
        view.removeOnLayoutChangeListener(resized)
    }

    private fun regionDidChange() {
        if (view.width == 0 || view.height == 0) return
        memory.position = map.cameraPosition
        val region = MapZoom.region(of = projection.visibleMapRect)
        val zoomLevel = MapZoom.level(on = projection)
        val zoom = MapZoom.apiZoom(zoomLevel)
        // After the map's own work, as the iPhone's Task on the main actor.
        view.post { controller.updateViewport(region, zoom, zoomLevel) }
    }

    companion object {
        /**
         * Where the map opens: the start region fitted in the iPhone's opening frame, as MapKit fits it before the
         * map has a size of its own, then tilted to the opening pitch, north up (MAP-002–004).
         */
        fun opening(start: ScooterMapStart): CameraPosition {
            val frame = ScooterMapCameraPolicy.openingFrame
            return CameraPosition.Builder()
                .target(LatLng(start.region.center.latitude, start.region.center.longitude))
                .zoom(MapZoom.fitting(start.region, frame.width, frame.height))
                .tilt(ScooterMapCameraPolicy.openingPitch)
                .bearing(0.0)
                .build()
        }
    }
}
