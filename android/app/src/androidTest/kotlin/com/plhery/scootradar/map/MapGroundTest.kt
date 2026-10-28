package com.plhery.scootradar.map

import androidx.core.graphics.toColorInt
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.style.layers.BackgroundLayer
import org.maplibre.android.style.layers.Property
import java.io.IOException

// The ground on MapLibre's map (MAP-008, MAP-009, MAP-014).
@RunWith(AndroidJUnit4::class)
class MapGroundTest {
    private val tiles = "https://tiles.openfreemap.org/planet/20261018_080001_pt/{z}/{x}/{y}.pbf"

    @Test
    fun theGroundWaitsForItsTilesAndTurnsDarkInPlace() = withPhoneMap { phone ->
        var tries = 0
        // OpenFreeMap can't be reached the first time, and answers the second, 2 s later.
        val ground = GroundTiles {
            tries += 1
            if (tries == 1) throw IOException("offline")
            GroundTiles.Answer(200, """{"tiles":["$tiles"]}""")
        }
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
        val day = GroundLook(GroundTheme.Day, GroundDetail.Calm, "en")
        val drawn = phone.onMain { MapGround(phone.map, day, ground, imagery = null, scope) }
        try {
            val style = waitFor(phone) { phone.map.style?.takeIf { it.isFullyLoaded && it.getLayer("city") != null } }
            phone.onMain {
                // The land and the ground's layers, without their tiles yet.
                assertNull(style.getSource(GroundStyle.SOURCE))
                assertEquals("#eef0f4".toColorInt(), (style.getLayer("land") as BackgroundLayer).backgroundColorAsInt)
                // Nothing eased by the style, nor its names faded in: either has the map drawn every frame while
                // the rider's dot breathes (RiderLocationTest's frame times).
                val transition = style.transition
                assertEquals(0L, transition.duration)
                assertFalse(transition.isEnablePlacementTransitions)
            }
            waitFor(phone) { style.getSource(GroundStyle.SOURCE) }
            assertEquals(2, tries)

            phone.onMain { drawn.show(day.copy(theme = GroundTheme.Night, language = "de")) }
            phone.onMain {
                // The same style, its tiles kept, in the night's colours.
                assertSame(style, phone.map.style)
                assertNotNull(style.getSource(GroundStyle.SOURCE))
                assertEquals("#0b0e14".toColorInt(), (style.getLayer("land") as BackgroundLayer).backgroundColorAsInt)
                assertEquals(Property.NONE, style.getLayer("casing-minor")!!.visibility.value)
                assertEquals(Property.VISIBLE, style.getLayer("street-minor")!!.visibility.value)
                assertTrue(style.getLayer("city")!!.let { it.minZoom == 4f && it.maxZoom == 12f })
            }
        } finally {
            phone.onMain { drawn.close() }
            scope.cancel()
        }
    }

    /** What `find` gives once it gives something, asked on the main thread for 30 s at most. */
    private fun <T : Any> waitFor(phone: PhoneMap, find: () -> T?): T {
        repeat(300) {
            phone.onMain(find)?.let { return it }
            Thread.sleep(100)
        }
        error("Nothing came in 30 s")
    }
}
