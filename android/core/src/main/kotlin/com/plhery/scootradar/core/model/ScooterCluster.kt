package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import kotlin.math.PI
import kotlin.math.ceil
import kotlin.math.hypot
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin

// ScooterCluster, ScooterCityGrouping and ScooterClusteringPolicy from ios/ScootRadar/Models/ScooterModels.swift.

data class ScooterCluster(
    val id: String,
    val latitude: Double,
    val longitude: Double,
    val count: Int,
    val providers: Map<String, Int>,
    val city: String? = null,
    /** Where the cities of a group lie, for a total that stands for several. */
    val bounds: GeoBounds? = null,
) {
    val coordinate: GeoPoint get() = GeoPoint(latitude, longitude)

    fun filtered(enabledProviders: Set<ScooterProvider>): ScooterCluster? {
        val filteredProviders = providers.filterKeys { providerID ->
            ScooterProvider.fromRawValue(providerID)?.let { it in enabledProviders } == true
        }
        val filteredCount = filteredProviders.values.sum()
        if (filteredCount <= 0) return null
        return copy(count = filteredCount, providers = filteredProviders)
    }
}

/** Zoomed out, a country, a state or province, or neighbouring cities are drawn as one total. */
object ScooterCityGrouping {
    /** Further out than this, where a phone shows more than France, a country is one total. */
    const val countryTotalsBelowZoom: Double = 5.0

    /**
     * Down to this zoom, a country whose totals are its states' or provinces' (data/countries.json) shows one
     * per region; further out, where the whole United States is a couple of hundred points wide, one for the
     * country again.
     */
    const val regionTotalsFromZoom: Double = 3.0

    /** Centres closer than this, in points, would draw the totals over one another. */
    const val spacing: Double = 60.0

    /** Named in a group's label; the rest are left to zooming in. */
    const val namedCities: Int = 3

    /** Where a country's total stands: inland and about the middle of the country, from data/countries.json. */
    val countryAnchors: Map<String, GeoPoint> get() = ScooterCountryCatalog.anchors

    /**
     * Zoomed out to a continent, one total per country, never two countries in one, or per state or province
     * where the country's totals are its regions'; closer, one per city or cluster of neighbouring cities.
     * Countries are named by countryName, regions in the language.
     */
    fun group(
        cities: List<ScooterCluster>,
        zoomLevel: Double,
        language: ScooterLanguage = ScooterLanguage.En,
        regions: Map<String, Map<String, ScooterRegion>> = ScooterCountryCatalog.regionTotals,
        countryName: (String) -> String = { it.uppercase() },
    ): List<ScooterCluster> =
        if (zoomLevel < countryTotalsBelowZoom) {
            countryTotals(
                cities,
                regions = if (zoomLevel >= regionTotalsFromZoom) regions else emptyMap(),
                language = language,
                countryName = countryName,
            ).sortedWith(byCount)
        } else {
            spacedApart(cities, zoomLevel)
        }

    /** "city:fr:Paris" is in France, and "city:us:or:Portland", whose id names its state, in the United States. */
    fun country(of: ScooterCluster): String? {
        val parts = of.id.swiftSplit(':', maxSplits = 2)
        if (parts.size != 3 || parts[0] != "city" || parts[1].length != 2) return null
        return parts[1]
    }

    private val byCount: Comparator<ScooterCluster> =
        compareByDescending<ScooterCluster> { it.count }.thenBy { it.id }

    /** "city:us:or:Portland" is in Oregon, "or", where the regions name the United States' states. */
    fun region(of: ScooterCluster, regions: Map<String, Map<String, ScooterRegion>>): Pair<String, ScooterRegion>? {
        val parts = of.id.swiftSplit(':', maxSplits = 3)
        if (parts.size != 4 || parts[0] != "city") return null
        val region = regions[parts[1]]?.get(parts[2]) ?: return null
        return parts[2] to region
    }

    private class Group(val name: String, val anchor: GeoPoint?, val members: MutableList<ScooterCluster> = mutableListOf())

    private fun countryTotals(
        cities: List<ScooterCluster>,
        regions: Map<String, Map<String, ScooterRegion>>,
        language: ScooterLanguage,
        countryName: (String) -> String,
    ): List<ScooterCluster> {
        val groups = LinkedHashMap<String, Group>()
        val totals = mutableListOf<ScooterCluster>()
        for (city in cities) {
            val country = country(city)
            if (country == null) {
                totals += city
                continue
            }
            val region = region(city, regions)
            if (region != null) {
                val (code, place) = region
                groups.getOrPut("region:$country:$code") {
                    Group(name = place.names[language.rawValue] ?: place.name, anchor = GeoPoint(place.latitude, place.longitude))
                }.members += city
            } else {
                groups.getOrPut("country:$country") {
                    Group(name = countryName(country), anchor = countryAnchors[country])
                }.members += city
            }
        }
        for ((id, group) in groups) {
            val anchor = group.anchor ?: GeoPoint(group.members[0].latitude, group.members[0].longitude)
            totals += combined(group.members, id = id, latitude = anchor.latitude, longitude = anchor.longitude, name = group.name)
        }
        return totals
    }

    /**
     * The total with the most scooters takes in its neighbours on screen and stays where it is, so a group
     * sits on a real city and keeps its place while the map is panned.
     */
    private fun spacedApart(totals: List<ScooterCluster>, zoomLevel: Double): List<ScooterCluster> {
        val ordered = totals.sortedWith(byCount).map { it to worldPoint(it.latitude, it.longitude, zoomLevel) }
        val taken = mutableSetOf<String>()
        val groups = mutableListOf<ScooterCluster>()
        for ((head, headPoint) in ordered) {
            if (head.id in taken) continue
            val members = ordered.filter { (other, point) ->
                other.id !in taken && hypot(point.first - headPoint.first, point.second - headPoint.second) < spacing
            }.map { it.first }
            for (member in members) taken += member.id
            if (members.size <= 1) {
                groups += head
                continue
            }
            val names = members.mapNotNull { it.city }
            groups += combined(
                members,
                id = "group:${head.id}",
                latitude = head.latitude,
                longitude = head.longitude,
                name = if (names.size > namedCities) names.take(namedCities).joinToString(", ") + "…" else names.joinToString(", "),
            )
        }
        return groups
    }

    private fun combined(members: List<ScooterCluster>, id: String, latitude: Double, longitude: Double, name: String): ScooterCluster {
        val providers = LinkedHashMap<String, Int>()
        for (member in members) {
            for ((provider, count) in member.providers) providers[provider] = (providers[provider] ?: 0) + count
        }
        return ScooterCluster(
            id = id,
            latitude = latitude,
            longitude = longitude,
            count = members.sumOf { it.count },
            providers = providers,
            city = name,
            bounds = GeoBounds(
                south = members.minOf { it.bounds?.south ?: it.latitude },
                west = members.minOf { it.bounds?.west ?: it.longitude },
                north = members.maxOf { it.bounds?.north ?: it.latitude },
                east = members.maxOf { it.bounds?.east ?: it.longitude },
            ),
        )
    }

    /** Web Mercator, in points of a 256-point tile. */
    private fun worldPoint(latitude: Double, longitude: Double, zoomLevel: Double): Pair<Double, Double> {
        val worldSize = 256 * 2.0.pow(zoomLevel)
        val sinLatitude = sin(min(85.05112878, max(-85.05112878, latitude)) * PI / 180)
        return Pair(
            (longitude + 180) / 360 * worldSize,
            (0.5 - ln((1 + sinLatitude) / (1 - sinLatitude)) / (4 * PI)) * worldSize,
        )
    }
}

object ScooterClusteringPolicy {
    const val maximumClusterZoom: Int = 15
    const val maximumOverviewZoom: Int = 10

    fun shouldCluster(zoomLevel: Double): Boolean = zoomLevel <= maximumClusterZoom.toDouble()

    fun shouldCluster(apiZoom: Int): Boolean = apiZoom <= maximumClusterZoom

    /** A zoom past Int's range, which would stop the iPhone app, is 22 here, as any above 22 is. */
    fun apiZoom(zoomLevel: Double): Int {
        if (!zoomLevel.isFinite()) return 0
        return min(22, max(0, ceil(zoomLevel).toInt()))
    }

    fun representationsMatch(lhs: Int, rhs: Int): Boolean {
        if (lhs <= maximumOverviewZoom && rhs <= maximumOverviewZoom) return true
        if (!shouldCluster(lhs) && !shouldCluster(rhs)) return true
        return lhs == rhs
    }
}

/** String.split(separator:maxSplits:), which leaves out empty parts, as Swift does. */
internal fun String.swiftSplit(separator: Char, maxSplits: Int): List<String> {
    val parts = mutableListOf<String>()
    var start = 0
    for (index in indices) {
        if (this[index] != separator || index < start) continue
        val appended = index > start
        if (appended) parts += substring(start, index)
        start = index + 1
        if (appended && parts.size == maxSplits) break
    }
    if (start < length) parts += substring(start)
    return parts
}
