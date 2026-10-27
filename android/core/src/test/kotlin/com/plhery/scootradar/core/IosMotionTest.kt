package com.plhery.scootradar.core

import org.junit.Assert.assertEquals
import org.junit.Test

class IosMotionTest {
    @Test
    fun responseBecomesStiffness() {
        val spec = IosMotion.spring(response = 0.35, dampingFraction = 0.86)
        assertEquals(0.86f, spec.dampingRatio, 0f)
        assertEquals(322.27f, spec.stiffness, 0.01f)
    }

    @Test
    fun snappyHasApplesBounce() {
        val spec = IosMotion.snappy
        assertEquals(0.85f, spec.dampingRatio, 1e-6f)
        assertEquals(157.91f, spec.stiffness, 0.01f)
    }
}
