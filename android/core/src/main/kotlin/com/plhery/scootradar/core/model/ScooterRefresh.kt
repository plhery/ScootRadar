package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.generated.ScooterProvider
import java.time.Instant

// ScooterFollowUpQuery, ScooterRefreshPolicy, ScooterLoadIssue and ScooterProviderHealth from
// ios/ScootRadar/Models/ScooterModels.swift. Intervals are in seconds, as TimeInterval counts them.

/** The query of a refreshing response whose quick follow-up was already granted. */
data class ScooterFollowUpQuery(val bounds: GeoBounds, val zoom: Int, val minimumBattery: Int)

/** When scooter data is refreshed automatically. Web and iOS follow the same rules. */
data class ScooterRefreshPolicy(
    /** The interval when a response names none. */
    val defaultRefreshAfter: Double = 60.0,
    /** Refresh this long before the data expires. */
    val expiryLead: Double = 5.0,
    /** Automatic requests leave at least this long after the previous one finished. */
    val minimumAttemptGap: Double = 10.0,
    /** The shortest gap before the one follow-up a refreshing response asks for. */
    val followUpGap: Double = 2.0,
    /**
     * The shortest gap before a follow-up a response asks for with `followUpMs`. Asked for at once while a
     * quick feed is on its way, the server holds the request until it is in: the gap only spaces the
     * requests should it not.
     */
    val minimumFollowUp: Double = 0.2,
) {
    /**
     * The gap before the follow-up a refreshing response asks for with `followUpMs`, which also takes the
     * place of its `refreshAfterSeconds`; null when it asks for none.
     */
    fun askedFollowUp(meta: ScooterResponseMetadata?): Double? {
        if (meta == null || !meta.refreshing) return null
        val milliseconds = meta.followUpMs ?: return null
        if (milliseconds < 0) return null
        return maxOf(minimumFollowUp, milliseconds.toDouble() / 1000)
    }

    /**
     * When the data is due for a refresh, before the gap between requests is applied: at the server's
     * interval or shortly before the data expires, whichever comes first. Without a successful load it is
     * always due. `attemptGap` replaces `minimumAttemptGap` for a quick follow-up.
     */
    fun refreshDue(lastSuccess: Instant?, refreshAfter: Double, expiresAt: Instant?, attemptGap: Double? = null): Instant {
        if (lastSuccess == null) return distantPast
        val interval = lastSuccess.addingTimeInterval(maxOf(attemptGap ?: minimumAttemptGap, refreshAfter))
        if (expiresAt == null) return interval
        return minOf(interval, expiresAt.addingTimeInterval(-expiryLead))
    }

    /** When the next automatic request may start. `lastAttempt` is when the previous request finished, whatever its outcome. */
    fun nextAttempt(
        lastSuccess: Instant?,
        refreshAfter: Double,
        expiresAt: Instant?,
        lastAttempt: Instant?,
        attemptGap: Double? = null,
    ): Instant {
        val due = refreshDue(lastSuccess = lastSuccess, refreshAfter = refreshAfter, expiresAt = expiresAt, attemptGap = attemptGap)
        if (lastAttempt == null) return due
        return maxOf(due, lastAttempt.addingTimeInterval(attemptGap ?: minimumAttemptGap))
    }

    companion object {
        val standard: ScooterRefreshPolicy = ScooterRefreshPolicy()

        /** Date.distantPast: the first day of the year 1. */
        val distantPast: Instant = Instant.parse("0001-01-01T00:00:00Z")
    }
}

/** Date.addingTimeInterval: the instant that many seconds later, to the nanosecond. */
fun Instant.addingTimeInterval(seconds: Double): Instant {
    val whole = kotlin.math.floor(seconds)
    return plusSeconds(whole.toLong()).plusNanos(Math.round((seconds - whole) * 1e9))
}

/** Date.timeIntervalSince: the seconds from the other instant to this one. */
fun Instant.timeIntervalSince(other: Instant): Double =
    (epochSecond - other.epochSecond).toDouble() + (nano - other.nano) / 1e9

/** What went wrong with loading scooters, and what is still on the map. */
sealed interface ScooterLoadIssue {
    val failure: ScooterLoadFailure

    /** Nothing has loaded yet and the load failed: the banner under the search bar. */
    data class FirstLoadFailed(override val failure: ScooterLoadFailure) : ScooterLoadIssue

    /**
     * The last refresh failed and the data from `showing` is still on the map, unchanged: the warning status
     * line and the Try again pill in the dock.
     */
    data class RefreshFailed(override val failure: ScooterLoadFailure, val showing: Instant) : ScooterLoadIssue

    /** The data expired and the refresh after that failed, so the map was cleared: the out-of-date card in the dock. */
    data class OutOfDate(override val failure: ScooterLoadFailure, val lastUpdate: Instant) : ScooterLoadIssue
}

/** Which providers are not sharing data for the area on screen. */
data class ScooterProviderHealth(
    /**
     * Providers that show nothing where they should: a feed of theirs failed, they operate in the viewport
     * and none of their scooters is in view. In catalogue order.
     */
    val downProviders: List<ScooterProvider>,
    /** A failed source belongs to no known provider, such as "city-overview". */
    val hasUnknownFailures: Boolean,
) {
    companion object {
        val healthy: ScooterProviderHealth = ScooterProviderHealth(downProviders = emptyList(), hasUnknownFailures = false)

        /**
         * `inView` holds the providers with a scooter in view in the loaded data, before the rider's own
         * filters. One failed city feed does not make a provider down while its scooters from other feeds
         * are on the map.
         */
        operator fun invoke(
            failedSources: List<String>,
            operating: List<ScooterProvider>,
            inView: Set<ScooterProvider>,
        ): ScooterProviderHealth {
            val failed = mutableSetOf<ScooterProvider>()
            var hasUnknownFailures = false
            for (source in failedSources) {
                val provider = provider(forSource = source)
                if (provider != null) failed += provider else hasUnknownFailures = true
            }
            val operatingSet = operating.toSet()
            return ScooterProviderHealth(
                downProviders = ScooterProvider.entries.filter { it in failed && it in operatingSet && it !in inView },
                hasUnknownFailures = hasUnknownFailures,
            )
        }

        /**
         * The provider behind an entry of `failedSources`. An id can carry its source in front
         * ("national:lime_zurich", "france:dott_fr_lyon", "hopp:hopp_ch_basel"), so the source goes before
         * the system id is matched.
         */
        fun provider(forSource: String): ScooterProvider? {
            val colon = forSource.indexOf(':')
            return ScooterProvider.forSystemID(if (colon >= 0) forSource.substring(colon + 1) else forSource)
        }
    }
}
