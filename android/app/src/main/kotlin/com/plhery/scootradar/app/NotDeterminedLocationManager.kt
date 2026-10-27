package com.plhery.scootradar.app

import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterDeviceOrientation
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterLocationManager

/**
 * Stands in for the phone's location until the app asks for it (milestone 5): it was never asked, knows no
 * position and no heading, and asks the rider nothing. The map opens on its start place and loads it.
 */
class NotDeterminedLocationManager : ScooterLocationManager {
    override val authorizationStatus: ScooterAuthorizationStatus = ScooterAuthorizationStatus.NotDetermined
    override val location: ScooterLocationFix? = null
    override val isHeadingAvailable: Boolean = false
    override var headingOrientation: ScooterDeviceOrientation = ScooterDeviceOrientation.Portrait
    override var distanceFilter: Double = 0.0

    override fun requestWhenInUseAuthorization() = Unit

    override fun startUpdatingLocation() = Unit

    override fun startUpdatingHeading() = Unit

    override fun stopUpdatingHeading() = Unit
}
