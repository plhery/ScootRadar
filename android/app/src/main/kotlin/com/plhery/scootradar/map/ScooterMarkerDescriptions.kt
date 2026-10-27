// What VoiceOver reads of the map's markers, from ios/ScootRadar/Views/ScooterMapView.swift.

package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.localized

/** What TalkBack reads of a marker: what it is, what is known of it, and what a double tap does. */
data class MarkerDescription(val label: String, val value: String?, val hint: String?)

object MarkerDescriptions {
    /** A bay opens in the dock without a callout, so the marker itself says what the rule is (describe(_:as:)). */
    fun of(parking: ScooterParking) = MarkerDescription(
        label = listOf(parking.bayTitle, parking.name).filter { it.isNotEmpty() }.joinToString(", "),
        // Whether parking here is mandatory is heard at the marker already.
        value = parking.notice,
        hint = localized("Shows parking details"),
    )
}
