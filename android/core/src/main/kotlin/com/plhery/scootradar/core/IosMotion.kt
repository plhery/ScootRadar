package com.plhery.scootradar.core

import kotlin.math.PI

/** SwiftUI's spring parameters, converted to the stiffness and damping ratio Compose's springs take. */
data class SpringSpec(val dampingRatio: Float, val stiffness: Float)

/** A timing curve as Core Animation gives it: a cubic Bézier from (0, 0) to (1, 1) through two control points. */
data class TimingCurve(val x1: Float, val y1: Float, val x2: Float, val y2: Float)

object IosMotion {
    /** `.spring(response:dampingFraction:)`: stiffness = (2π / response)², damping ratio = damping fraction. */
    fun spring(response: Double, dampingFraction: Double): SpringSpec {
        val angular = 2 * PI / response
        return SpringSpec(dampingRatio = dampingFraction.toFloat(), stiffness = (angular * angular).toFloat())
    }

    /**
     * `.spring(duration:bounce:)`, and `.smooth`, `.snappy`, `.bouncy` with their defaults. A bounce above 0 takes
     * that much off a critical damping; one below it overdamps the spring, as SwiftUI's `Spring` does, to a ratio of
     * 1 / (1 + bounce).
     */
    fun springWithDuration(duration: Double, bounce: Double): SpringSpec =
        spring(response = duration, dampingFraction = if (bounce < 0) 1 / (1 + bounce) else 1 - bounce)

    val smooth: SpringSpec get() = smooth()
    val snappy: SpringSpec get() = snappy()
    val bouncy: SpringSpec get() = bouncy()

    /** `.smooth(duration:extraBounce:)`: no bounce of its own. */
    fun smooth(duration: Double = 0.5, extraBounce: Double = 0.0): SpringSpec =
        springWithDuration(duration, bounce = extraBounce)

    /** `.snappy(duration:extraBounce:)`: a bounce of 0.15, and the extra on top. */
    fun snappy(duration: Double = 0.5, extraBounce: Double = 0.0): SpringSpec =
        springWithDuration(duration, bounce = 0.15 + extraBounce)

    /** `.bouncy(duration:extraBounce:)`: a bounce of 0.3, and the extra on top. */
    fun bouncy(duration: Double = 0.5, extraBounce: Double = 0.0): SpringSpec =
        springWithDuration(duration, bounce = 0.3 + extraBounce)

    /** `.easeInOut`, Core Animation's `easeInEaseOut`. */
    val easeInOut = TimingCurve(0.42f, 0f, 0.58f, 1f)

    /** `.easeOut`, Core Animation's `easeOut`. */
    val easeOut = TimingCurve(0f, 0f, 0.58f, 1f)

    /** `.easeIn`, Core Animation's `easeIn`. */
    val easeIn = TimingCurve(0.42f, 0f, 1f, 1f)

    /** How long `.easeInOut`, `.easeOut` and `.easeIn` take when no duration is given. */
    const val DEFAULT_DURATION = 0.35
}
