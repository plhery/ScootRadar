package com.plhery.scootradar.ui.theme

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.SpringSpec
import com.plhery.scootradar.core.IosMotion
import org.junit.Assert.assertEquals
import org.junit.Test

class MotionTest {
    @Test
    fun aSwiftUISpringIsComposesWithTheSameNumbers() {
        val spring = IosMotion.snappy(duration = 0.28, extraBounce = 0.06).animation<Float>()
        assertEquals(0.79f, spring.dampingRatio, 1e-6f)
        assertEquals(503.5f, spring.stiffness, 0.1f)
        assertEquals(SpringSpec::class, spring::class)
    }

    @Test
    fun easeInOutIsUIKits() {
        assertEquals(CubicBezierEasing(0.42f, 0f, 0.58f, 1f), IosMotion.easeInOut.easing)
        assertEquals(0.5f, IosMotion.easeInOut.easing.transform(0.5f), 1e-3f)
        // Ease out is nearly half way at a third of the time.
        assertEquals(0.488f, IosMotion.easeOut.easing.transform(1 / 3f), 0.005f)
    }
}
