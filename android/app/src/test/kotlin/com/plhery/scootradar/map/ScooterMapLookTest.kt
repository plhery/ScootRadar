package com.plhery.scootradar.map

import android.graphics.Color
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterDotState
import com.plhery.scootradar.core.model.ScooterMapLook
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode

// The pictures' tests of ios/ScootRadarTests/ScooterMapLookTests.swift.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScooterMapLookTest {
    private val density = 3f
    private val art = ScooterMarkerArt(density, MarkerFonts.of(ApplicationProvider.getApplicationContext()))

    @Test
    fun dotPicturesAreDrawnOnceAndLeaveRoomForTheirGlow() {
        val key = ScooterMarkerArt.Key(ScooterProvider.Voi, diameter = 12.0, state = ScooterDotState.Plain, showsInitials = false, isDark = true)
        val image = art.image(key)

        assertSame(image, art.image(key))
        assertEquals(image.width, image.height)
        assertTrue(image.width / density > 12 * 3)

        // The middle is the provider's colour, the corner is clear.
        val voi = ScooterProvider.Voi.color.toInt()
        val middle = image.getPixel(image.width / 2, image.height / 2)
        assertEquals(Color.red(voi) / 255.0, Color.red(middle) / 255.0, 0.03)
        assertEquals(Color.green(voi) / 255.0, Color.green(middle) / 255.0, 0.03)
        assertEquals(Color.blue(voi) / 255.0, Color.blue(middle) / 255.0, 0.03)
        assertEquals(1.0, Color.alpha(middle) / 255.0, 0.01)
        assertEquals(0.0, Color.alpha(image.getPixel(density.toInt(), density.toInt())) / 255.0, 0.02)

        for (state in listOf(ScooterDotState.Plain, ScooterDotState.Head, ScooterDotState.Selected)) {
            for (isDark in listOf(false, true)) {
                val picture = art.image(ScooterMarkerArt.Key(ScooterProvider.Bird, 24.0, state, showsInitials = true, isDark = isDark))
                val ring = ScooterMapLook.ringReach(state)
                assertTrue("$state, dark: $isDark", picture.width / density > 24 + 2 * ring)
            }
        }
    }
}
