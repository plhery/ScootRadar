package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.decodeFromStream
import kotlinx.serialization.json.double
import kotlinx.serialization.json.jsonPrimitive

/** The bulk of the catalog, read from the catalog.json scripts/generate-provider-catalog.mjs writes. */
internal class CatalogData(
    val swissAreas: List<GeoBounds>,
    val regionalSystems: List<Pair<ScooterProvider, GeoBounds>>,
    val cities: List<ScooterCity>,
    val countryCount: Int,
    val curfews: List<RentalCurfew>,
    val ruleZones: List<CityRuleZone>,
    val cityZones: List<CityRuleZone>,
    val anchors: Map<String, GeoPoint>,
    val credits: List<Pair<String, String>>,
    val regionTotals: Map<String, Map<String, ScooterRegion>>,
) {
    /** Seoul's streets and the cities' zones, put together once (CityRuleZone.onMap). */
    val onMap: List<CityRuleZone> = ruleZones + cityZones

    companion object {
        private const val RESOURCE = "/com/plhery/scootradar/core/generated/catalog.json"

        /** Read the first time it is used; the app touches it off the main thread at launch. */
        val value: CatalogData by lazy { load() }

        @OptIn(ExperimentalSerializationApi::class)
        private fun load(): CatalogData {
            val stream = checkNotNull(CatalogData::class.java.getResourceAsStream(RESOURCE)) { "$RESOURCE is missing" }
            val file = stream.use { Json.decodeFromStream(File.serializer(), it) }
            return CatalogData(
                swissAreas = file.swissAreas.map(::bounds),
                regionalSystems = file.regionalSystems.map { system ->
                    val key = system[0].jsonPrimitive.content
                    val provider = checkNotNull(ScooterProvider.fromRawValue(key)) { "Unknown provider $key" }
                    provider to bounds(DoubleArray(4) { system[it + 1].jsonPrimitive.double })
                },
                cities = file.cities.map { city ->
                    ScooterCity(
                        id = city.id,
                        name = city.name,
                        countryCode = city.countryCode,
                        center = GeoPoint(city.center[0], city.center[1]),
                        bounds = bounds(city.bounds),
                        pauses = city.pauses.map(PauseEntry::pause),
                        feeds = city.feeds.map { ScooterCityFeed(it.id, it.pause?.pause()) },
                    )
                },
                countryCount = file.cities.mapTo(HashSet()) { it.countryCode }.size,
                curfews = file.curfews.map { curfew ->
                    RentalCurfew(
                        city = curfew.city,
                        timeZone = curfew.timeZone,
                        nights = curfew.nights.map { RentalCurfew.Night(it.evenings?.toSet(), it.fromMinute, it.untilMinute) },
                        areas = curfew.areas.map(::points),
                    )
                },
                ruleZones = file.ruleZones.map { zone ->
                    CityRuleZone(
                        id = zone.id,
                        authority = zone.authority,
                        timeZone = zone.timeZone,
                        firstDay = zone.firstDay,
                        hours = zone.hours.map { CityRuleZone.Hours(it.fromMinute, it.untilMinute) },
                        source = zone.source,
                        lines = zone.lines.map(::points),
                    )
                },
                cityZones = file.cityZones.map { zone ->
                    val kind = checkNotNull(ScooterZoneKind.fromRawValue(zone.kind)) { "Unknown zone kind ${zone.kind}" }
                    CityRuleZone(
                        id = zone.id,
                        authority = zone.authority,
                        timeZone = zone.timeZone,
                        kind = kind,
                        source = zone.source,
                        ring = points(zone.ring),
                    )
                },
                anchors = file.countries.anchors.mapValues { (_, anchor) -> GeoPoint(anchor[0], anchor[1]) },
                credits = file.countries.credits.map { it.title to it.url },
                regionTotals = file.countries.regionTotals.mapValues { (_, regions) ->
                    regions.mapValues { (_, region) -> ScooterRegion(region.name, region.names, region.latitude, region.longitude) }
                },
            )
        }

        private fun bounds(values: DoubleArray): GeoBounds {
            check(values.size == 4) { "A box needs south, west, north and east" }
            return GeoBounds(values[0], values[1], values[2], values[3])
        }

        /** Latitude, longitude, latitude, longitude… */
        private fun points(values: DoubleArray): List<GeoPoint> {
            check(values.size % 2 == 0) { "A line needs pairs of coordinates" }
            return List(values.size / 2) { GeoPoint(values[2 * it], values[2 * it + 1]) }
        }
    }

    @Serializable
    private class File(
        val swissAreas: List<DoubleArray>,
        val regionalSystems: List<JsonArray>,
        val cities: List<CityEntry>,
        val curfews: List<CurfewEntry>,
        val ruleZones: List<RuleZoneEntry>,
        val cityZones: List<CityZoneEntry>,
        val countries: CountriesEntry,
    )

    @Serializable
    private class CityEntry(
        val id: String,
        val name: String,
        val countryCode: String,
        val center: DoubleArray,
        val bounds: DoubleArray,
        val pauses: List<PauseEntry> = emptyList(),
        val feeds: List<FeedEntry> = emptyList(),
    )

    @Serializable
    private class PauseEntry(val from: String, val until: String, val timeZone: String) {
        fun pause() = ScooterSeasonalPause(from, until, timeZone)
    }

    @Serializable
    private class FeedEntry(val id: String, val pause: PauseEntry? = null)

    @Serializable
    private class CurfewEntry(val city: String, val timeZone: String, val nights: List<NightEntry>, val areas: List<DoubleArray>)

    @Serializable
    private class NightEntry(val evenings: List<Int>? = null, val fromMinute: Int, val untilMinute: Int)

    @Serializable
    private class RuleZoneEntry(
        val id: String,
        val authority: String,
        val timeZone: String,
        val firstDay: String,
        val hours: List<HoursEntry>,
        val source: String,
        val lines: List<DoubleArray>,
    )

    @Serializable
    private class HoursEntry(val fromMinute: Int, val untilMinute: Int)

    /** One of a city's zones, its ring as latitude, longitude, latitude, longitude… */
    @Serializable
    private class CityZoneEntry(
        val id: String,
        val authority: String,
        val timeZone: String,
        val kind: String,
        val source: String,
        val ring: DoubleArray,
    )

    @Serializable
    private class CountriesEntry(
        val anchors: Map<String, DoubleArray>,
        val credits: List<CreditEntry>,
        val regionTotals: Map<String, Map<String, RegionEntry>>,
    )

    @Serializable
    private class CreditEntry(val title: String, val url: String)

    @Serializable
    private class RegionEntry(
        val name: String,
        val names: Map<String, String> = emptyMap(),
        val latitude: Double,
        val longitude: Double,
    )
}
