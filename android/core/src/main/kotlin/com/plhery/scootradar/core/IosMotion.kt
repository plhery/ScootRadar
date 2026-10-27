package com.plhery.scootradar.core

import kotlin.math.PI

/** SwiftUI's spring parameters, converted to the stiffness and damping ratio Compose's springs take. */
data class SpringSpec(val dampingRatio: Float, val stiffness: Float)

object IosMotion {
    /** `.spring(response:dampingFraction:)`: stiffness = (2π / response)², damping ratio = damping fraction. */
    fun spring(response: Double, dampingFraction: Double): SpringSpec {
        val angular = 2 * PI / response
        return SpringSpec(dampingRatio = dampingFraction.toFloat(), stiffness = (angular * angular).toFloat())
    }

    /** `.spring(duration:bounce:)`, and `.smooth`, `.snappy`, `.bouncy` with their defaults. */
    fun springWithDuration(duration: Double, bounce: Double): SpringSpec =
        spring(response = duration, dampingFraction = 1 - bounce)

    val smooth: SpringSpec get() = springWithDuration(duration = 0.5, bounce = 0.0)
    val snappy: SpringSpec get() = springWithDuration(duration = 0.5, bounce = 0.15)
    val bouncy: SpringSpec get() = springWithDuration(duration = 0.5, bounce = 0.3)
}
