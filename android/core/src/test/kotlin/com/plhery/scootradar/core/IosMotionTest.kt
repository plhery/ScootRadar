package com.plhery.scootradar.core

import org.junit.Assert.assertEquals
import org.junit.Test
import kotlin.math.PI

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

    @Test
    fun stiffnessIsTheSquareOfTheAngularFrequency() {
        for (response in listOf(0.24, 0.25, 0.28, 0.3, 0.36, 0.5, 1.0)) {
            val expected = (2 * PI / response) * (2 * PI / response)
            assertEquals(expected.toFloat(), IosMotion.spring(response, 0.5).stiffness, 1e-3f)
        }
    }

    /** The values ui.md §4 gives each of the dock's springs, which it rounds down to a tenth. */
    @Test
    fun theDocksSpringsAreUiMdsValues() {
        assertSpring(0.85f, 503.5f, IosMotion.snappy(duration = 0.28))
        assertSpring(0.85f, 685.4f, IosMotion.snappy(duration = 0.24))
        assertSpring(0.85f, 631.7f, IosMotion.snappy(duration = 0.25))
        assertSpring(0.85f, 438.6f, IosMotion.snappy(duration = 0.3))
        assertSpring(0.79f, 503.5f, IosMotion.snappy(duration = 0.28, extraBounce = 0.06))
        assertSpring(0.88f, 304.6f, IosMotion.spring(response = 0.36, dampingFraction = 0.88))
    }

    @Test
    fun smoothAndBouncyHaveTheirBounces() {
        assertEquals(1f, IosMotion.smooth.dampingRatio, 1e-6f)
        assertEquals(0.7f, IosMotion.bouncy.dampingRatio, 1e-6f)
        assertEquals(0.6f, IosMotion.bouncy(extraBounce = 0.1).dampingRatio, 1e-6f)
        assertEquals(0.9f, IosMotion.smooth(duration = 0.3, extraBounce = 0.1).dampingRatio, 1e-6f)
        assertEquals(438.65f, IosMotion.smooth(duration = 0.3).stiffness, 0.01f)
    }

    @Test
    fun aNegativeBounceOverdamps() {
        assertEquals(2f, IosMotion.springWithDuration(duration = 0.5, bounce = -0.5).dampingRatio, 1e-6f)
        assertEquals(1.25f, IosMotion.springWithDuration(duration = 0.5, bounce = -0.2).dampingRatio, 1e-6f)
        assertEquals(1f, IosMotion.springWithDuration(duration = 0.5, bounce = 0.0).dampingRatio, 1e-6f)
    }

    @Test
    fun curvesHaveApplesControlPoints() {
        assertEquals(TimingCurve(0.42f, 0f, 0.58f, 1f), IosMotion.easeInOut)
        assertEquals(TimingCurve(0f, 0f, 0.58f, 1f), IosMotion.easeOut)
        assertEquals(TimingCurve(0.42f, 0f, 1f, 1f), IosMotion.easeIn)
    }

    /** What QuartzCore's CAMediaTimingFunction(name: .default) and CATransaction.animationDuration() return. */
    @Test
    fun implicitAnimationsHaveCoreAnimationsDefaults() {
        assertEquals(TimingCurve(0.25f, 0.1f, 0.25f, 1f), IosMotion.implicit)
        assertEquals(0.25, IosMotion.IMPLICIT_DURATION, 0.0)
    }

    private fun assertSpring(dampingRatio: Float, stiffness: Float, spec: SpringSpec) {
        assertEquals(dampingRatio, spec.dampingRatio, 1e-6f)
        assertEquals(stiffness, spec.stiffness, 0.1f)
    }
}
