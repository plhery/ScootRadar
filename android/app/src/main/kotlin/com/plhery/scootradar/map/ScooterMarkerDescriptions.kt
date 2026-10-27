// What VoiceOver reads of the map's markers, from ios/ScootRadar/Views/ScooterMapView.swift.

package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterMapLook
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.formatted
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat

/** What TalkBack reads of a marker: what it is, what is known of it, and what a double tap does. */
data class MarkerDescription(val label: String, val value: String?, val hint: String?)

object MarkerDescriptions {
    /**
     * A scooter: its provider, then how far it is, its battery and its range, those that are known
     * (ScooterAnnotationView.refreshAppearance).
     */
    fun of(scooter: Scooter, metres: Double?): MarkerDescription {
        val details = mutableListOf<String>()
        if (metres != null && metres.isFinite()) {
            details += stringFormat(
                localized("≈%1\$lld min walk · %2\$@"),
                ScooterMapLook.walkingMinutes(metres).toLong(),
                Scooter.formattedLength(metres),
            )
        }
        scooter.battery?.let { battery ->
            details += "${localized("Battery")}: ${stringFormat(localized("%lld percent"), battery.toLong())}"
        }
        scooter.formattedRange?.let { range -> details += "${localized("Estimated range")}: $range" }
        return MarkerDescription(
            label = stringFormat(localized("%@ scooter"), scooter.providerInfo?.displayName ?: ScooterMarkerScene.capitalized(scooter.provider)),
            value = if (details.isEmpty()) null else details.joinToString(", "),
            hint = localized("Shows scooter details"),
        )
    }

    fun of(mark: ScooterMark): MarkerDescription = of(mark.scooter, mark.metres)

    /** A cluster or a city total: how many scooters, and where for a city, so that a rider can pick one. */
    fun of(cluster: ScooterCluster) = MarkerDescription(
        label = clusterLabel(cluster.count, cluster.city),
        value = null,
        hint = localized("Zooms in to show individual scooters"),
    )

    /**
     * "Zürich, 1’288 scooters" for a city total; "40 scooters" for any other cluster
     * (ScooterClusterAnnotationView.accessibilityLabel).
     */
    fun clusterLabel(count: Int, city: String?): String {
        val locale = ScooterLanguage.current.locale
        if (city.isNullOrEmpty()) return stringFormat(localized("%@ scooters"), count.formatted(locale))
        if (count == 1) return stringFormat(localized("%@, one scooter"), city)
        return stringFormat(localized("%@, %lld scooters"), city, count.toLong(), locale = locale)
    }

    /** A bay opens in the dock without a callout, so the marker itself says what the rule is (describe(_:as:)). */
    fun of(parking: ScooterParking) = MarkerDescription(
        label = listOf(parking.bayTitle, parking.name).filter { it.isNotEmpty() }.joinToString(", "),
        // Whether parking here is mandatory is heard at the marker already.
        value = parking.notice,
        hint = localized("Shows parking details"),
    )
}
