package com.plhery.scootradar.map

import android.os.SystemClock
import android.util.Log
import androidx.compose.ui.platform.AndroidUiDispatcher
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapFocusRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import okhttp3.OkHttpClient
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraUpdateFactory
import java.util.concurrent.CopyOnWriteArrayList

// A move of the camera over the ground, in the time the app gives a MapKit move (MAP-277).
@RunWith(AndroidJUnit4::class)
class MapMoveTest {
    @Test
    fun aPlaceAskedForIsReachedInAMapKitMovesTime() = withPhoneMap { phone ->
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
        val frames = CoroutineScope(SupervisorJob() + AndroidUiDispatcher.Main)
        val (ground, camera) = phone.onMain {
            phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(MapCamera.opening(zurichStart)))
            // OpenFreeMap's ground where it can be reached, so that a recording shows the move over it.
            val day = GroundLook(GroundTheme.Day, GroundDetail.Calm, "en")
            MapGround(phone.map, day, GroundTiles.openFreeMap(OkHttpClient()), imagery = null, scope) to
                MapCamera(phone.map, phone.view, testController(scope), MapCameraMemory(), frames)
        }
        // The ground's tiles.
        Thread.sleep(4_000)
        val steps = CopyOnWriteArrayList<Long>()
        try {
            phone.onMain {
                phone.map.addOnCameraMoveListener { steps += SystemClock.uptimeMillis() }
                // Langstrasse, in from the city's span to a street's.
                camera.applyFocus(MapFocusRequest(GeoPoint(47.3786, 8.5274), token = 1))
            }
            settle()
            Thread.sleep(1_000)
            // From the first frame's step to the last's: the first frame of the move is drawn before its step.
            val took = steps.last() - steps.first()
            Log.i("MapMoveTest", "The move took $took ms over ${steps.size} steps")
            assertTrue("took $took ms", took in 280L..450L)
            assertTrue("${steps.size} steps", steps.size >= 10)
        } finally {
            phone.onMain {
                camera.close()
                ground.close()
            }
            frames.cancel()
            scope.cancel()
        }
    }
}
