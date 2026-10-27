package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.generated.ScooterProvider
import java.time.Instant
import java.time.ZoneId

// ScooterDockContent, ScooterDockSummary, ScooterDockStatus, ScooterDockLine, ScooterDockNotice and
// ScooterDockHint from ios/ScootRadar/Models/ScooterModels.swift.

/** What the dock shows; `ScooterMapModel.dock` picks the one that applies. */
sealed interface ScooterDockContent {
    /** Only the scooter card: no count, no chips. */
    data class Scooter(val scooter: com.plhery.scootradar.core.model.Scooter) : ScooterDockContent

    /** Only the parking bay card. */
    data class Parking(val parking: ScooterParking) : ScooterDockContent

    /** The out-of-date card with a Refresh button, instead of count and chips. */
    data class OutOfDate(val failure: ScooterLoadFailure, val lastUpdate: Instant) : ScooterDockContent

    /**
     * The answer for this view is on its way: "Finding scooters…" instead of a count. The chips are empty
     * until something has loaded. While the server collects an app's map again and only faded scooters
     * stand in view, which can last a minute or two, the notices show as well.
     */
    data class Finding(val chips: List<ScooterProviderEntry>, val notices: List<ScooterDockNotice> = emptyList()) : ScooterDockContent

    /** Nothing has loaded and the load failed: "Waiting for scooter data", no count, no chips. */
    data object Waiting : ScooterDockContent

    /** No provider operates here: the three closest covered cities. */
    data class OutsideCoverage(val cities: List<ScooterCityDistance>) : ScooterDockContent

    /** There are scooters here, all of them hidden by the filters. */
    data class FiltersHideEverything(val summary: ScooterFilterSummary) : ScooterDockContent

    /** Count, status line, notices and chips. */
    data class Summary(val summary: ScooterDockSummary) : ScooterDockContent
}

data class ScooterDockSummary(
    val count: Int,
    val countContext: ScooterCountContext,
    /** When the data on the map was observed. */
    val lastUpdated: Instant,
    /** Set while the last refresh failed and the earlier data is still shown. */
    val refreshFailure: ScooterLoadFailure?,
    /** City totals instead of single scooters. */
    val isOverview: Boolean,
    /** The server answered with data it could not renew. */
    val isDelayed: Boolean,
    /** One calm line each, under the status. */
    val notices: List<ScooterDockNotice>,
    val hint: ScooterDockHint?,
    /** Providers after the "All" chip, in display order. */
    val chips: List<ScooterProviderEntry>,
    /**
     * The nearest scooter in view, which takes the place of the count while the rider or the searched place
     * is on the map and no scooter is grouped.
     */
    val lead: ScooterDockLead? = null,
    /**
     * Every provider in the viewport is down: the notice that says so explains the empty map, which is then
     * neither live nor merely empty.
     */
    val everyProviderDown: Boolean = false,
    /** Set while scooters stand faded where they were last seen, at that time: the server is collecting them again. */
    val lastSeenAt: Instant? = null,
) {
    /** "scooters nearby" or "scooters on this map"; the view renders the number. */
    val countLabel: String get() = countContext.label(count)

    /** The Try again pill at the right of the dock header. */
    val showsTryAgain: Boolean get() = refreshFailure != null

    /** The status line, null when there is none. It changes as the data ages, so ask again over time. */
    fun status(at: Instant = Instant.now()): ScooterDockStatus? {
        if (refreshFailure != null) {
            return if (refreshFailure == ScooterLoadFailure.Offline) {
                ScooterDockStatus.Offline(showing = lastUpdated)
            } else {
                ScooterDockStatus.RefreshFailed(showing = lastUpdated)
            }
        }
        // Rather than delayed: the faded scooters are the old positions, and the others are coming in.
        if (lastSeenAt != null) return ScooterDockStatus.Updating(seenAt = lastSeenAt)
        // Delayed data says so at every zoom, city totals included.
        if (isDelayed) return ScooterDockStatus.Delayed(showing = lastUpdated)
        if (isOverview) return ScooterDockStatus.CityTotals
        // "Live", or an age, would be of no scooters at all.
        if (everyProviderDown) return null

        val age = maxOf(0.0, at.timeIntervalSince(lastUpdated))
        if (age < ScooterDockStatus.liveWindow) return ScooterDockStatus.Live
        if (age < 3_600) return ScooterDockStatus.UpdatedMinutesAgo((age / 60).toInt())
        return ScooterDockStatus.UpdatedAt(lastUpdated)
    }
}

sealed interface ScooterDockStatus {
    data class RefreshFailed(val showing: Instant) : ScooterDockStatus

    data class Offline(val showing: Instant) : ScooterDockStatus

    data object CityTotals : ScooterDockStatus

    data class Delayed(val showing: Instant) : ScooterDockStatus

    /** Scooters stand faded where they were last seen while they are collected again. */
    data class Updating(val seenAt: Instant) : ScooterDockStatus

    data object Live : ScooterDockStatus

    data class UpdatedMinutesAgo(val minutes: Int) : ScooterDockStatus

    data class UpdatedAt(val date: Instant) : ScooterDockStatus

    /** Failed refreshes use the warning style. */
    val isWarning: Boolean get() = this is RefreshFailed || this is Offline

    /** The green dot in front of "Live". */
    val isLive: Boolean get() = this == Live

    /** The small spinner in front of "Updating". */
    val isUpdating: Boolean get() = this is Updating

    val text: String
        get() = when (this) {
            is RefreshFailed -> stringFormat(localized("Couldn’t refresh · showing %@"), clockTime(showing))
            is Offline -> stringFormat(localized("You’re offline · showing %@"), clockTime(showing))
            CityTotals -> localized("City totals · refreshed hourly")
            is Delayed -> stringFormat(localized("Data delayed · showing %@"), clockTime(showing))
            is Updating -> stringFormat(localized("Updating · faded ones seen at %@"), seenTime(seenAt))
            Live -> localized("Live")
            is UpdatedMinutesAgo -> stringFormat(localized("Updated %lld min ago"), minutes.toLong())
            is UpdatedAt -> stringFormat(localized("Updated %@"), clockTime(date))
        }

    /** The same in fewer words where the count stands before it, on the line of a folded panel: "3'784 scooters · 6 min ago". */
    val briefText: String
        get() = when (this) {
            is UpdatedMinutesAgo -> stringFormat(localized("%lld min ago"), minutes.toLong())
            else -> text
        }

    companion object {
        /** Data younger than this, in seconds, reads "Live". */
        const val liveWindow: Double = 90.0

        /**
         * "14:02", the time of day in the user's format. For a place in another time zone, given, the time
         * by the place's clock, named after it where the phone's clock reads otherwise: Oslo's night ban ends
         * at "05:00 GMT+2" seen from New York, as on the web (formatClockTime in src/lib/uiText.ts).
         */
        fun clockTime(date: Instant, zone: ZoneId? = null): String {
            val locale = ScooterLanguage.current.locale
            val current = ScooterDateFormat.timeZone()
            if (zone == null || zone.rules.getOffset(date) == current.rules.getOffset(date)) {
                return ScooterDateFormat.skeleton("jm", date, current, locale)
            }
            return ScooterDateFormat.skeleton("jmz", date, zone, locale)
        }

        /**
         * When faded scooters were seen: "14:02", or "Fri 14:02" on another day, as a slow feed collected less
         * often, as Lime's, may have been seen days ago (as on the web, dockModel.ts). The day is the
         * calendar's, in its zone.
         */
        fun seenTime(date: Instant, now: Instant = Instant.now(), zone: ZoneId = ScooterDateFormat.timeZone()): String {
            if (date.atZone(zone).toLocalDate() == now.atZone(zone).toLocalDate()) return clockTime(date)
            return ScooterDateFormat.skeleton("Ejm", date, ScooterDateFormat.timeZone(), ScooterLanguage.current.locale)
        }

        /** The body of the out-of-date card: "Last update 14:02. You’re offline. Check your connection." */
        fun outOfDateBody(failure: ScooterLoadFailure, lastUpdate: Instant): String =
            "${stringFormat(localized("Last update %@."), clockTime(lastUpdate))} ${failure.message}"
    }
}

/** What the dock shows, in one line: the panel of a large window, folded, shows it under its search bar. "23 m · Bird · 1 min · Live". */
data class ScooterDockLine(
    val mark: Mark,
    /** What the line is about: "23 m", "22 scooters", "Finding scooters…". */
    val title: String,
    /** What follows it: "Bird", "1 min". */
    val details: List<String> = emptyList(),
    /** How fresh the data is, last: "Live", or a failed refresh in the warning colour. */
    val status: ScooterDockStatus? = null,
    /** The mark is a warning: the positions on the map are out of date. */
    val isWarning: Boolean = false,
) {
    sealed interface Mark {
        /** A dot in the provider's colour: the nearest scooter, a scooter's card or a bay's. */
        data class Provider(val provider: ScooterProvider?) : Mark

        /** A spinner while scooters are being found. */
        data object Progress : Mark

        /** The symbol of one of the dock's other cards. */
        data class Symbol(val name: String) : Mark
    }

    /** The parts of the line, in order; it is written with a dot between them, and wraps between them, never inside one. */
    val parts: List<String> get() = listOf(title) + details + listOfNotNull(status?.briefText)

    /** What TalkBack reads: the same parts with a pause between them rather than a dot. */
    val accessibilityLabel: String get() = parts.joinToString(", ")
}

sealed interface ScooterDockNotice {
    /** The city in view bans renting at night: a moon rather than a warning. */
    data class Curfew(val curfew: RentalCurfew.Active) : ScooterDockNotice

    /** The city in view has no scooters this part of the year: a calendar. */
    data class Season(val season: ScooterSeasonalPause.Active) : ScooterDockNotice

    /** Named providers, in catalogue order; never empty. */
    data class ProvidersDown(val providers: List<ScooterProvider>) : ScooterDockNotice

    /** Only sources that belong to no known provider failed. */
    data object SomeProvidersDown : ScooterDockNotice

    data class Truncated(val shown: Int, val total: Int) : ScooterDockNotice

    data object ParkingUnavailable : ScooterDockNotice

    data object ParkingOutOfDate : ScooterDockNotice

    val id: ScooterDockNotice get() = this

    /** The SF Symbol the iPhone draws; the app picks its own icon for each. */
    val systemImage: String
        get() = when (this) {
            is Curfew -> "moon.fill"
            is Season -> "calendar"
            else -> "exclamationmark.triangle"
        }

    /** A ban or a season is the city's rule, not trouble with the data. */
    val isCalm: Boolean get() = this is Curfew || this is Season

    val text: String
        get() = when (this) {
            is Curfew -> stringFormat(
                localized("Night ban in %1\$@: no scooter rentals until %2\$@"),
                curfew.city,
                ScooterDockStatus.clockTime(curfew.until, curfew.timeZone),
            )
            is Season -> when (val back = season.back) {
                is ScooterSeasonalPause.Return.Month -> stringFormat(
                    localized("Off season in %1\$@: scooters are back in %2\$@"),
                    season.city,
                    ScooterSeasonalPause.monthName(back.month),
                )
                is ScooterSeasonalPause.Return.Clear -> stringFormat(
                    localized("Off season in %1\$@: from %2\$@ until the streets are clear"),
                    season.city,
                    ScooterSeasonalPause.dayName(back.from),
                )
                ScooterSeasonalPause.Return.SeasonOver -> stringFormat(
                    localized("Off season in %@: scooters are back when the operator reopens"),
                    season.city,
                )
            }
            is ProvidersDown -> when (providers.size) {
                1 -> stringFormat(localized("%@ isn’t sharing data right now."), providers[0].displayName)
                2 -> stringFormat(
                    localized("%1\$@ and %2\$@ aren’t sharing data right now."),
                    providers[0].displayName,
                    providers[1].displayName,
                )
                else -> stringFormat(localized("%lld providers aren’t sharing data right now."), providers.size.toLong())
            }
            SomeProvidersDown -> localized("Some providers aren’t sharing data right now.")
            is Truncated -> stringFormat(
                localized("Showing %1\$@ of %2\$@ — zoom in to see all"),
                shown.formatted(ScooterLanguage.current.locale),
                total.formatted(ScooterLanguage.current.locale),
            )
            ParkingUnavailable -> localized("Parking bays unavailable right now")
            ParkingOutOfDate -> localized("Parking bays may be out of date")
        }

    companion object {
        /**
         * A night ban first, as some operators keep listing their scooters through it, then the season,
         * providers down, truncation and parking. A pause until the streets are clear has no end to wait for:
         * it gives way once `scootersInView`, whatever the filters hide. So does a season its operators have
         * closed: they say when it opens again.
         */
        fun notices(
            curfew: RentalCurfew.Active? = null,
            season: ScooterSeasonalPause.Active? = null,
            scootersInView: Boolean = false,
            health: ScooterProviderHealth,
            metadata: ScooterResponseMetadata,
            shownCount: Int,
        ): List<ScooterDockNotice> {
            val notices = mutableListOf<ScooterDockNotice>()
            if (curfew != null) notices += Curfew(curfew)
            if (season != null) {
                val givesWay = scootersInView &&
                    (season.back is ScooterSeasonalPause.Return.Clear || season.back == ScooterSeasonalPause.Return.SeasonOver)
                if (!givesWay) notices += Season(season)
            }
            if (health.downProviders.isNotEmpty()) {
                notices += ProvidersDown(health.downProviders)
            } else if (health.hasUnknownFailures) {
                notices += SomeProvidersDown
            }
            if (metadata.truncated) {
                notices += Truncated(shown = shownCount, total = metadata.totalVehicles ?: shownCount)
            }
            if (metadata.parkingStatus == "failed" || metadata.parkingStatus == "partial") {
                notices += ParkingUnavailable
            } else if (metadata.parkingStatus == "stale") {
                notices += ParkingOutOfDate
            }
            return notices
        }
    }
}

enum class ScooterDockHint {
    /** City totals are on screen: "Tap a city to see its scooters." */
    TapCity,

    /** A covered area with no scooters: "No scooters here right now. Zoom out or move the map." */
    EmptyArea,
    ;

    val text: String
        get() = when (this) {
            TapCity -> localized("Tap a city to see its scooters.")
            EmptyArea -> localized("No scooters here right now. Zoom out or move the map.")
        }
}
