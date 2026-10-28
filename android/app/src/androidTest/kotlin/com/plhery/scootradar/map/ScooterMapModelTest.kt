package com.plhery.scootradar.map

import androidx.compose.ui.platform.AndroidUiDispatcher
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapFocusRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraUpdateFactory

// The map's part of ios/ScootRadarTests/ScooterMapModelTests.swift, on MapLibre's map of an iPhone's size.
@RunWith(AndroidJUnit4::class)
class ScooterMapModelTest {
    private val zurich = GeoPoint(latitude = 47.3769, longitude = 8.5417)

    @Test
    fun mapOpensSlightlyTiltedAndKeepsItsTiltWhenTheAppMovesIt() = withPhoneMap(MapCamera.opening(zurichStart, MapKitCamera.IPhone)) { phone ->
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
        val frames = CoroutineScope(SupervisorJob() + AndroidUiDispatcher.Main)
        val camera = phone.onMain { MapCamera(phone.map, phone.view, testController(scope), MapCameraMemory(), frames) }
        try {
            phone.onMain {
                assertEquals(20.0, phone.map.cameraPosition.tilt, 0.1)
                camera.applyFocus(MapFocusRequest.city(zurich, token = 1))
            }
            settle()

            // As it keeps the one two fingers give it.
            phone.onMain {
                assertEquals(20.0, phone.map.cameraPosition.tilt, 0.1)
                phone.map.moveCamera(CameraUpdateFactory.tiltTo(30.0))
                camera.applyFocus(MapFocusRequest.city(zurich, token = 2))
            }
            settle()
            phone.onMain { assertEquals(30.0, phone.map.cameraPosition.tilt, 0.1) }
        } finally {
            phone.onMain { camera.close() }
            frames.cancel()
            scope.cancel()
        }
    }
}
