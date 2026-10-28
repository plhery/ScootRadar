package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.Month
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.TextStyle
import java.util.Locale
import kotlin.math.PI
import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

// The catalog the iPhone app has in ProviderCatalog.generated.swift, read from the generated
// catalog.json (CatalogData) the first time it is used, as Swift's static lets are.

data class ScooterCity(
    val id: String,
    val name: String,
    /** CH, FR, DE, IT, BE, NO, GB… */
    val countryCode: String,
    val center: GeoPoint,
    val bounds: GeoBounds,
    /** The seasonal pauses of its service areas when every one has one, like pauses on the web. */
    val pauses: List<ScooterSeasonalPause> = emptyList(),
    /**
     * The feeds of its service areas, each with the area's pause: it is off season once their operators
     * have all closed its season or are in their pause, as closedForSeason on the web.
     */
    val feeds: List<ScooterCityFeed> = emptyList(),
) {
    /** The country in the user's language, such as "Germany". */
    val countryName: String
        get() {
            val region = runCatching { Locale.Builder().setRegion(countryCode).build() }.getOrNull() ?: return countryCode
            // The JDK answers a region it has no name for with its code.
            return region.getDisplayCountry(ScooterLanguage.current.locale).takeIf { it.isNotEmpty() && it != region.country }
                ?: countryCode
        }

    /** The city as a place to search from. */
    val destination: MapDestination
        get() = MapDestination(title = name, subtitle = countryName, point = center, kind = MapDestination.Kind.City, isCovered = true)
}

/** A feed with a service area in a city, by the id meta.seasonOver names it with. */
data class ScooterCityFeed(
    /** "kazakhstan:whoosh_kz_nqz": the country's source, then the system's id. */
    val id: String,
    /** The seasonal pause of its service area there, if it has one. */
    val pause: ScooterSeasonalPause? = null,
)

/**
 * The part of the year a city has no scooters, as Montréal each winter, like src/lib/seasonalPauses.ts. Its
 * operators may list nothing or stop answering then, so the dock says when the scooters are back.
 * ScooterCity.pauses is generated from the catalogs' `seasonal` windows. Some operators say themselves that
 * a town's season is over, as Whoosh for Astana: the answers name those feeds (`seasonOver`), and the town is
 * off season once every feed of ScooterCity.feeds is closed or in its pause.
 */
data class ScooterSeasonalPause(
    /** Local "MM-DD": the first day without scooters. */
    val from: String,
    /**
     * Local "MM-DD": the first day they are back; or "clear", once the streets are clear of snow and ice, on
     * no set day, as in Skien.
     */
    val until: String,
    /** The IANA time zone the dates are in. */
    val timeZone: String,
) {
    /** When the scooters come back. */
    sealed interface Return {
        /** In that month, 1 for January. */
        data class Month(val month: Int) : Return

        /** Once the streets are clear, on no set day, after a pause from that local "MM-DD". */
        data class Clear(val from: String) : Return

        /** When its operators open its season again: they have closed it, and set no day. */
        data object SeasonOver : Return
    }

    data class Active(val city: String, val back: Return)

    /** The local date in the pause's zone, "MM-DD". */
    private fun localDate(date: Instant): String? {
        val zone = runCatching { ZoneId.of(timeZone) }.getOrNull() ?: return null
        val day = date.atZone(zone)
        return String.format(Locale.ROOT, "%02d-%02d", day.monthValue, day.dayOfMonth)
    }

    /** Whether it holds on that date. A window from "11-16" until "04-15" spans the new year; one until the streets are clear holds until `clearBy`. */
    fun holds(on: Instant): Boolean {
        val today = localDate(on) ?: return false
        val until = if (until == "clear") clearBy else until
        return if (from < until) today >= from && today < until else today >= from || today < until
    }

    /** Days from that date to the first day back. */
    private fun daysLeft(on: Instant): Int {
        val today = localDate(on) ?: return 365
        return (dayOfYear(until) - dayOfYear(today) + 365) % 365
    }

    companion object {
        /**
         * The first day a pause until the streets are clear no longer holds, like CLEAR_BY on the web: 1 May,
         * when Tromsø, the northernmost town covered, starts its season. The dock shows such a pause only
         * while no scooter is in view, so it gives way as soon as the operator brings them back.
         */
        const val clearBy: String = "05-01"

        private val daysBeforeMonth = listOf(0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334)

        private fun dayOfYear(date: String): Int {
            val month = date.take(2).toIntOrNull() ?: 1
            return daysBeforeMonth[(month - 1).coerceIn(0, 11)] + (date.takeLast(2).toIntOrNull() ?: 1)
        }

        /**
         * When the scooters come back when every one of the pauses holds: the soonest of their ends, and a
         * pause until the streets are clear may end any day. Null when one does not hold, or there are none.
         */
        fun back(pauses: List<ScooterSeasonalPause>, on: Instant): Return? {
            if (pauses.isEmpty() || !pauses.all { it.holds(on) }) return null
            pauses.firstOrNull { it.until == "clear" }?.let { return Return.Clear(from = it.from) }
            val soonest = pauses.minBy { it.daysLeft(on) }
            val month = soonest.until.take(2).toIntOrNull() ?: return null
            return Return.Month(month)
        }

        /**
         * The city at that point whose scooters are away for the season. Null outside every city, or where
         * one of the cities around the point has scooters now. `seasonOver` holds the feeds whose operator
         * says their season is over.
         */
        fun active(
            at: GeoPoint,
            on: Instant,
            among: List<ScooterCity> = ScooterCityCatalog.cities,
            seasonOver: Set<String> = emptySet(),
        ): Active? {
            var found: Active? = null
            for (city in among) {
                if (!city.bounds.contains(at)) continue
                val back = back(city.pauses, on)
                    ?: (if (closedForSeason(city, on, seasonOver)) Return.SeasonOver else null)
                    ?: return null
                if (found == null) found = Active(city = city.name, back = back)
            }
            return found
        }

        /**
         * Whether the city's operators have all closed its season, or are in their own pause, and one at
         * least has closed it: Almaty is not, while Jet runs there besides Whoosh.
         */
        private fun closedForSeason(city: ScooterCity, on: Instant, seasonOver: Set<String>): Boolean =
            city.feeds.any { it.id in seasonOver } && city.feeds.all { it.id in seasonOver || it.pause?.holds(on) == true }

        /** The month's name in the app's language, as it stands in a sentence: "April", "avril". */
        fun monthName(month: Int, locale: Locale = ScooterLanguage.current.locale): String =
            if (month in 1..12) Month.of(month).getDisplayName(TextStyle.FULL_STANDALONE, locale) else month.toString()

        /**
         * A local "MM-DD" in the app's language and the phone's region, as it stands in a sentence: "15
         * December", "December 15" in the US, "15. Dezember". A month or day past its last runs on, as
         * Calendar takes them.
         */
        fun dayName(date: String, locale: Locale = ScooterLanguage.current.locale): String {
            val month = date.take(2).toIntOrNull() ?: return date
            val day = date.takeLast(2).toIntOrNull() ?: return date
            val instant = LocalDate.of(2001, 1, 1).plusMonths(month - 1L).plusDays(day - 1L)
                .atStartOfDay(ZoneOffset.UTC).toInstant()
            return ScooterDateFormat.skeleton("MMMMd", instant, ZoneOffset.UTC, locale)
        }
    }
}

data class ScooterCityDistance(val city: ScooterCity, val distanceMeters: Double) {
    val id: String get() = city.id

    /** Whole kilometres such as "61 km", as on the web; whole miles such as "38 mi" where the region measures in miles. */
    val formattedDistance: String get() = formattedDistance(ScooterLanguage.current.locale)

    fun formattedDistance(locale: Locale): String {
        val metric = locale.measurementSystem == ScooterMeasurementSystem.Metric
        val value = maxOf(1.0, (distanceMeters / (if (metric) 1_000.0 else 1_609.344)).roundedAwayFromZero())
        val unit = if (metric) ScooterLengthUnit.Kilometers else ScooterLengthUnit.Miles
        // A line never breaks between the number and its unit.
        return ScooterMeasureFormat.length(BigDecimal(value), unit, locale).replace(' ', '\u00A0')
    }

    /** "Bern · 61 km", the label of a closest-city chip. */
    val label: String get() = stringFormat(localized("%1\$@ · %2\$@"), city.name, formattedDistance)
}

/** Every city with scooter data, one entry per city, like COVERED_CITIES on the web. */
object ScooterCityCatalog {
    val cities: List<ScooterCity> get() = CatalogData.value.cities

    /**
     * How many cities the app covers, and in how many countries, for the card outside coverage, as
     * COVERED_CITY_TOTAL and COVERED_COUNTRY_TOTAL count them on the web.
     */
    val cityCount: Int get() = cities.size
    val countryCount: Int get() = CatalogData.value.countryCount

    /** Cities by distance from the point to their centre, nearest first. */
    fun nearest(to: GeoPoint, count: Int, among: List<ScooterCity> = cities): List<ScooterCityDistance> =
        among.map { ScooterCityDistance(it, distanceMeters(to, it.center)) }
            .sortedBy { it.distanceMeters }
            .take(maxOf(0, count))

    /** Whether the point is inside an operator's service area, like isPointCovered on the web. */
    fun contains(latitude: Double, longitude: Double): Boolean = ScooterProviderCoverage.contains(latitude, longitude)

    fun contains(point: GeoPoint): Boolean = contains(point.latitude, point.longitude)

    /**
     * The city whose centre the point is. The address search answers a typed city name with that centre;
     * addresses, stations and places lie elsewhere.
     */
    fun city(centredAt: GeoPoint): ScooterCity? = cities.firstOrNull {
        kotlin.math.abs(it.center.latitude - centredAt.latitude) < 0.000_001 &&
            kotlin.math.abs(it.center.longitude - centredAt.longitude) < 0.000_001
    }

    // haversineM from src/lib/geo.ts, so both apps show the same distances.
    internal fun distanceMeters(origin: GeoPoint, destination: GeoPoint): Double {
        val radians = PI / 180
        val latitudeDelta = (destination.latitude - origin.latitude) * radians
        val longitudeDelta = (destination.longitude - origin.longitude) * radians
        val a = sin(latitudeDelta / 2).pow(2) +
            cos(origin.latitude * radians) * cos(destination.latitude * radians) * sin(longitudeDelta / 2).pow(2)
        return 2 * 6_371_000 * asin(swiftMin(1.0, sqrt(a)))
    }
}

object ScooterProviderCoverage {
    /** The providers the Swiss open data names; the others run scooters only abroad. */
    val swissProviders: List<ScooterProvider> get() = ScooterProvider.swissProviders

    fun providers(viewport: GeoBounds): List<ScooterProvider> {
        val data = CatalogData.value
        val available = mutableSetOf<ScooterProvider>()
        if (data.swissAreas.any { it.intersects(viewport) }) available += swissProviders
        for ((provider, bounds) in data.regionalSystems) {
            if (bounds.intersects(viewport)) available += provider
        }
        return ScooterProvider.entries.filter { it in available }
    }

    fun contains(latitude: Double, longitude: Double): Boolean {
        val data = CatalogData.value
        return data.swissAreas.any { it.contains(latitude, longitude) } ||
            data.regionalSystems.any { it.second.contains(latitude, longitude) }
    }
}

/**
 * The catalog as the map controller reads it: the cities, where each provider operates, the night bans and the
 * cities' rules for streets. The app's is the one generated from data/ ([Generated]). A test hands the controller
 * one of its own ([Listed]), which a city added or paused in data/, or a provider's area moved, leaves as it is.
 * Not in the iPhone app, whose tests read its generated catalog.
 */
interface ScooterCatalog {
    /** Every city with scooter data. */
    val cities: List<ScooterCity>

    /** The cities' bans on renting at night. */
    val curfews: List<RentalCurfew>

    /** The cities' own rules for streets. */
    val ruleZones: List<CityRuleZone>

    /** The providers operating in the viewport, in catalogue order. */
    fun providers(viewport: GeoBounds): List<ScooterProvider>

    /** Whether the point is inside an operator's service area. */
    fun contains(point: GeoPoint): Boolean

    /** The catalog generated from data/: ScooterCityCatalog, ScooterProviderCoverage, RentalCurfew.all, CityRuleZone.all. */
    data object Generated : ScooterCatalog {
        override val cities: List<ScooterCity> get() = ScooterCityCatalog.cities
        override val curfews: List<RentalCurfew> get() = RentalCurfew.all
        override val ruleZones: List<CityRuleZone> get() = CityRuleZone.all

        override fun providers(viewport: GeoBounds): List<ScooterProvider> = ScooterProviderCoverage.providers(viewport)

        override fun contains(point: GeoPoint): Boolean = ScooterProviderCoverage.contains(point.latitude, point.longitude)
    }

    /** A catalog of what it lists, for tests and previews: a provider operates wherever one of its areas reaches. */
    data class Listed(
        override val cities: List<ScooterCity> = emptyList(),
        /** Each provider's service areas, one box a piece. */
        val areas: List<Pair<ScooterProvider, GeoBounds>> = emptyList(),
        override val curfews: List<RentalCurfew> = emptyList(),
        override val ruleZones: List<CityRuleZone> = emptyList(),
    ) : ScooterCatalog {
        override fun providers(viewport: GeoBounds): List<ScooterProvider> {
            val available = areas.filter { it.second.intersects(viewport) }.mapTo(HashSet()) { it.first }
            return ScooterProvider.entries.filter { it in available }
        }

        override fun contains(point: GeoPoint): Boolean = areas.any { it.second.contains(point.latitude, point.longitude) }
    }
}

/**
 * A city's ban on renting shared scooters at night, like src/lib/rentalCurfews.ts. `all` is generated
 * from data/rental-curfews.json.
 */
data class RentalCurfew(
    val city: String,
    val timeZone: String,
    val nights: List<Night>,
    /** The municipality's boundary, one ring a piece. */
    val areas: List<List<GeoPoint>>,
) {
    /**
     * One window of the ban. A night belongs to the evening it starts on: a window that starts before noon
     * is the early hours after that evening.
     */
    data class Night(
        /** Weekdays of those evenings, 1 for Sunday as Apple's Calendar counts them; every evening when null. */
        val evenings: Set<Int>?,
        /** Local minutes since midnight; a window past midnight starts after it ends. */
        val fromMinute: Int,
        val untilMinute: Int,
    ) {
        /** Whether it holds at that wall-clock time, on that weekday. */
        fun holds(atMinute: Int, weekday: Int): Boolean {
            val evening: Int
            if (fromMinute > untilMinute) {
                if (!(atMinute >= fromMinute || atMinute < untilMinute)) return false
                evening = if (atMinute >= fromMinute) weekday else weekday - 1
            } else {
                if (!(atMinute >= fromMinute && atMinute < untilMinute)) return false
                evening = if (fromMinute >= 12 * 60) weekday else weekday - 1
            }
            return evenings?.contains((evening + 6) % 7 + 1) ?: true
        }
    }

    data class Active(
        val city: String,
        /** When renting is allowed again. */
        val until: Instant,
        /** The city's time zone, whose clock that time is told by. */
        val timeZone: ZoneId,
    )

    /** Ray casting, as polygonContainsPoint on the web. */
    fun contains(point: GeoPoint): Boolean = areas.any { area ->
        var inside = false
        var previous = area.size - 1
        for (index in area.indices) {
            val a = area[index]
            val b = area[previous]
            if ((a.latitude > point.latitude) != (b.latitude > point.latitude) &&
                point.longitude < (b.longitude - a.longitude) * (point.latitude - a.latitude) / (b.latitude - a.latitude) + a.longitude
            ) {
                inside = !inside
            }
            previous = index
        }
        inside
    }

    companion object {
        val all: List<RentalCurfew> get() = CatalogData.value.curfews

        /** The ban in force at that point and instant, if any. */
        fun active(at: GeoPoint, on: Instant, among: List<RentalCurfew> = all): Active? {
            for (curfew in among) {
                if (!curfew.contains(at)) continue
                val zone = runCatching { ZoneId.of(curfew.timeZone) }.getOrNull() ?: continue
                val clock = on.atZone(zone)
                val local = clock.hour * 60 + clock.minute
                // Apple's weekdays: 1 for Sunday.
                val weekday = clock.dayOfWeek.value % 7 + 1
                val night = curfew.nights.firstOrNull { it.holds(atMinute = local, weekday = weekday) } ?: continue
                val until = nextDate(after = on, zone = zone, time = LocalTime.of(night.untilMinute / 60, night.untilMinute % 60))
                return Active(city = curfew.city, until = until, timeZone = zone)
            }
            return null
        }

        /**
         * Calendar.nextDate(after:matching:matchingPolicy: .nextTime) for a time of day: the first instant after
         * the date whose clock reads it. The calendar finds it across a change of the clocks: a time the
         * clocks skip is the first after the gap, and one they read twice comes twice.
         */
        private fun nextDate(after: Instant, zone: ZoneId, time: LocalTime): Instant {
            var day = after.atZone(zone).toLocalDate()
            while (true) {
                val local = LocalDateTime.of(day, time)
                val offsets = zone.rules.getValidOffsets(local)
                val candidates = if (offsets.isEmpty()) {
                    listOf(zone.rules.getTransition(local).instant)
                } else {
                    offsets.map { local.toInstant(it) }.sorted()
                }
                candidates.firstOrNull { it > after }?.let { return it }
                day = day.plusDays(1)
            }
        }
    }
}

/** The countries of data/countries.json, as src/generated/countries.ts has them on the web. */
object ScooterCountryCatalog {
    /** Where a country's total stands, zoomed out: inland and about the middle of the country. */
    val anchors: Map<String, GeoPoint> get() = CatalogData.value.anchors

    /** The countries' own credits, after Switzerland's and France's: their GBFS feeds, then their licences. */
    val credits: List<Pair<String, String>> get() = CatalogData.value.credits

    /** The countries whose totals, zoomed out, are their states' or provinces', and those by code. */
    val regionTotals: Map<String, Map<String, ScooterRegion>> get() = CatalogData.value.regionTotals
}

/** A state or province whose total stands apart, zoomed out. */
data class ScooterRegion(
    val name: String,
    /** Its name where a language of the app writes it otherwise: "Colombie-Britannique". */
    val names: Map<String, String> = emptyMap(),
    val latitude: Double,
    val longitude: Double,
)
