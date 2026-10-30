package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import java.io.File
import java.util.Locale
import kotlin.math.abs
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The Android app's catalog (ProviderCatalog.kt and catalog.json) holds what the iPhone app's
 * ProviderCatalog.generated.swift holds, entry for entry: each Kotlin entry is written out as the Swift
 * generator writes it and must be the same line.
 */
class CatalogParityTest {
    private val swift: List<String> =
        File(System.getProperty("scootradar.repo"), "ios/ScootRadar/Models/ProviderCatalog.generated.swift").readLines()
    private val data = CatalogData.value

    private fun string(value: String) = Json.encodeToString(String.serializer(), value)

    /** A number as JavaScript writes it, as the generator wrote it into Swift. */
    private fun number(value: Double) =
        if (value == Math.rint(value) && abs(value) < 1e15) value.toLong().toString() else value.toString()

    private fun bounds(b: GeoBounds) =
        "GeoBounds(south: ${number(b.south)}, west: ${number(b.west)}, north: ${number(b.north)}, east: ${number(b.east)})"

    private fun pause(p: ScooterSeasonalPause) =
        "ScooterSeasonalPause(from: ${string(p.from)}, until: ${string(p.until)}, timeZone: ${string(p.timeZone)})"

    private fun numbers(lines: List<List<GeoPoint>>) = lines.joinToString(", ", "[", "]") { line ->
        line.joinToString(", ", "[", "]") { "${number(it.latitude)}, ${number(it.longitude)}" }
    }

    /** The lines after the one that is [start], up to the first that is [end]. */
    private fun section(start: String, end: String = "    ]"): List<String> {
        val from = swift.indexOf(start)
        assertTrue("No line \"$start\"", from >= 0)
        return swift.subList(from + 1, swift.subList(from + 1, swift.size).indexOf(end) + from + 1)
    }

    /** The cases of the switch that opens after the line [start], each its provider's key and what it gives, in order. */
    private fun cases(start: String): List<Pair<String, String>> {
        val from = swift.indexOf(start)
        assertTrue("No line \"$start\"", from >= 0 && swift[from + 1] == "        switch self {")
        val case = Regex("""^        case \.([a-z0-9_]+): (.+)$""")
        return swift.drop(from + 2).takeWhile { it != "        }" }.map { line ->
            val (key, value) = checkNotNull(case.matchEntire(line)) { line }.destructured
            key to value
        }
    }

    @Test
    fun providersAreTheSwiftOnesInTheirOrder() {
        assertEquals(
            swift.filter { Regex("^    case [a-z0-9_]+$").matches(it) }.map { it.removePrefix("    case ") },
            ScooterProvider.entries.map { it.rawValue },
        )
        // Each in its own switch, provider by provider: a name and a short name swapped, or two providers' swapped,
        // are each still a line of the file.
        val entries = ScooterProvider.entries
        assertEquals(entries.map { it.rawValue to string(it.displayName) }, cases("    var name: String {"))
        assertEquals(entries.map { it.rawValue to string(it.shortName) }, cases("    var shortName: String {"))
        assertEquals(entries.map { provider ->
            val (alpha, red, green, blue) = listOf(24, 16, 8, 0).map { (provider.color shr it) and 0xFF }
                .map { String.format(Locale.ROOT, "%.6f", it / 255.0) }
            // The Swift generator writes every colour opaque.
            provider.rawValue to "UIColor(red: $red, green: $green, blue: $blue, alpha: ${if (alpha == "1.000000") "1" else alpha})"
        }, cases("    var uiColor: UIColor {"))
        for (provider in entries) {
            val key = provider.rawValue
            val app = swift.filter { it.startsWith("        case .$key: OperatorApp(link: ") }
            assertEquals(key, listOfNotNull(provider.app?.let { "URL(string: ${string(it.link)})!" }), app.map {
                it.removePrefix("        case .$key: OperatorApp(link: ").substringBefore(", appStore:")
            })
        }
        val swiss = swift.single { it.startsWith("    static let swissProviders: [ScooterProvider] = [") }
        assertEquals(swiss.substringAfter("= [").removeSuffix("]").split(", ").map { it.removePrefix(".") },
            ScooterProvider.swissProviders.map { it.rawValue })
    }

    @Test
    fun systemIDsNameTheProviderTheSwiftMatchersName() {
        val matcher = Regex("""^        \(\.([a-z0-9_]+), (\[.*?]), (\[.*?])\),$""")
        val list = { text: String -> Json.decodeFromString<List<String>>(text) }
        val matchers = swift.mapNotNull { matcher.matchEntire(it)?.destructured }
            .map { (key, exact, prefixes) -> Triple(key, list(exact), list(prefixes)) }
        assertTrue(matchers.size >= ScooterProvider.entries.size)
        val ids = matchers.flatMap { (_, exact, prefixes) -> exact + prefixes + prefixes.map { "${it}x" } } +
            listOf("LIME_ZURICH", "hoppy_be_kortrijk", "unknown_system", "")
        for (id in ids) {
            val expected = matchers.firstOrNull { (_, exact, prefixes) ->
                id.lowercase() in exact || prefixes.any { id.lowercase().startsWith(it) }
            }?.first
            assertEquals(id, expected, ScooterProvider.forSystemID(id)?.rawValue)
        }
    }

    @Test
    fun coverageAreasAreTheSwiftOnes() {
        assertEquals(
            section("    private static let swissAreas: [GeoBounds] = ["),
            data.swissAreas.map { "        ${bounds(it)}," },
        )
        assertEquals(
            swift.filter { it.startsWith("        systems.append(") },
            data.regionalSystems.map { (provider, area) -> "        systems.append((.${provider.rawValue}, ${bounds(area)}))" },
        )
    }

    @Test
    fun citiesAreTheSwiftOnes() {
        val cities = data.cities.map { city ->
            val pauses = if (city.pauses.isEmpty()) "" else city.pauses.joinToString(", ", ", pauses: [", "]", transform = ::pause)
            val feeds = if (city.feeds.isEmpty()) "" else city.feeds.joinToString(", ", ", feeds: [", "]") { feed ->
                "ScooterCityFeed(id: ${string(feed.id)}${feed.pause?.let { ", pause: ${pause(it)}" } ?: ""})"
            }
            "        cities.append(ScooterCity(id: ${string(city.id)}, name: ${string(city.name)}, " +
                "countryCode: ${string(city.countryCode)}, center: GeoPoint(latitude: ${number(city.center.latitude)}, " +
                "longitude: ${number(city.center.longitude)}), bounds: ${bounds(city.bounds)}$pauses$feeds))"
        }
        assertEquals(swift.filter { it.startsWith("        cities.append(") }, cities)
        assertTrue("    static let cityCount = ${ScooterCityCatalog.cityCount}" in swift)
        assertTrue("    static let countryCount = ${ScooterCityCatalog.countryCount}" in swift)
    }

    @Test
    fun curfewsAndRuleZonesAreTheSwiftOnes() {
        val curfews = section("    static let all: [RentalCurfew] = [").filter { !it.contains("areas: rings(") }
        assertEquals(curfews, data.curfews.flatMap { curfew ->
            val nights = curfew.nights.joinToString(", ") { night ->
                val evenings = night.evenings?.joinToString(", ", "[", "]") ?: "nil"
                "RentalCurfew.Night(evenings: $evenings, fromMinute: ${night.fromMinute}, untilMinute: ${night.untilMinute})"
            }
            listOf(
                "        RentalCurfew(",
                "            city: ${string(curfew.city)}, timeZone: ${string(curfew.timeZone)},",
                "            nights: [$nights],",
                "        ),",
            )
        })
        assertEquals(
            swift.filter { Regex("^    private static let [A-Za-z0-9]+Areas: \\[\\[Double]] = ").containsMatchIn(it) }
                .map { it.substringAfter(" = ") },
            data.curfews.map { numbers(it.areas) },
        )

        val zones = section("    static let all: [CityRuleZone] = [").filter { !it.contains("lines: points(") }
        assertEquals(zones, data.ruleZones.flatMap { zone ->
            val hours = zone.hours.joinToString(", ") { ".init(fromMinute: ${it.fromMinute}, untilMinute: ${it.untilMinute})" }
            listOf(
                "        CityRuleZone(",
                "            id: ${string(zone.id)}, authority: ${string(zone.authority)},",
                "            timeZone: ${string(zone.timeZone)}, firstDay: ${string(zone.firstDay)}, hours: [$hours],",
                "            source: URL(string: ${string(zone.source)})!,",
                "        ),",
            )
        })
        assertEquals(
            swift.filter { Regex("^    private static let [A-Za-z0-9]+Lines: \\[\\[Double]] = ").containsMatchIn(it) }
                .map { it.substringAfter(" = ") },
            data.ruleZones.map { numbers(it.lines) },
        )
    }

    @Test
    fun cityZonesAreTheSwiftOnes() {
        // Each city's zones are one call, its own from the city's id that starts each zone's.
        val cities = data.cityZones.groupBy { it.id.substringBefore('-') }
        val calls = cities.entries.flatMapIndexed { index, (city, zones) ->
            val first = zones.first()
            for (zone in zones) {
                assertEquals(zone.id, listOf(first.authority, first.timeZone, first.source), listOf(zone.authority, zone.timeZone, zone.source))
            }
            listOf(
                "        zones(",
                "            authority: ${string(first.authority)}, timeZone: ${string(first.timeZone)},",
                "            source: URL(string: ${string(first.source)})!,",
                "            ids: ${city}ZoneIds, kinds: ${city}ZoneKinds, rings: ${city}ZoneRings",
                if (index < cities.size - 1) "        ) +" else "        )",
            )
        }
        assertEquals(section("    static let cityZones: [CityRuleZone] =", ""), calls)
        assertEquals(
            swift.filter { Regex("^    private static let [a-z]+Zone(Ids|Kinds|Rings): ").containsMatchIn(it) },
            cities.flatMap { (city, zones) ->
                listOf(
                    "    private static let ${city}ZoneIds: [String] = [${zones.joinToString(", ") { string(it.id) }}]",
                    "    private static let ${city}ZoneKinds: [ScooterZoneKind] = [${zones.joinToString(", ") { ".${it.kind.rawValue}" }}]",
                    "    private static let ${city}ZoneRings: [[Double]] = ${numbers(zones.map { it.polygons.single().single() })}",
                )
            },
        )
    }

    @Test
    fun zoneDownloadsAreTheSwiftOnes() {
        // The cities whose zones the app downloads, as the app is built (CityZoneDownloads.builtIn).
        val empty = "    static let builtIn: [CityZoneDownload] = []"
        val swiftCities = if (empty in swift) emptyList() else section("    static let builtIn: [CityZoneDownload] = [")
        assertEquals(
            swiftCities,
            data.zoneDownloads.flatMap { city ->
                listOf(
                    "        CityZoneDownload(",
                    "            id: ${string(city.id)}, place: ${string(city.place)}, authority: ${string(city.authority)},",
                    "            timeZone: ${string(city.timeZone)}, source: URL(string: ${string(city.source)})!,",
                    "            bounds: ${bounds(city.bounds)}",
                    "        ),",
                )
            },
        )
        assertTrue(data.zoneDownloads.all { it.sha256 == null })
        // And the cities whose zones are built in, those of the catalog's city zones.
        assertEquals(
            swift.single { it.startsWith("    static let builtInCities: Set<String> = ") },
            "    static let builtInCities: Set<String> = [${data.zoneCities.joinToString(", ") { string(it) }}]",
        )
        assertEquals(data.cityZones.map { it.id.substringBefore('-') }.toSet(), data.zoneCities)
        assertTrue(data.zoneDownloads.none { it.id in data.zoneCities })
    }

    @Test
    fun countriesAreTheSwiftOnes() {
        assertEquals(
            section("    static let anchors: [String: (latitude: Double, longitude: Double)] = [").filter { !it.trimStart().startsWith("//") },
            data.anchors.map { (code, anchor) -> "        \"$code\": (${number(anchor.latitude)}, ${number(anchor.longitude)})," },
        )
        assertEquals(
            section("    static let credits: [(title: String, url: String)] = ["),
            data.credits.map { (title, url) -> "        (${string(title)}, ${string(url)})," },
        )
        val regions = data.regionTotals.flatMap { (country, regions) ->
            listOf("        \"$country\": [") + regions.map { (code, region) ->
                val names = if (region.names.isEmpty()) "" else
                    region.names.entries.joinToString(", ", "names: [", "], ") { (language, name) -> "\"$language\": ${string(name)}" }
                "            \"$code\": ScooterRegion(name: ${string(region.name)}, ${names}latitude: ${number(region.latitude)}, " +
                    "longitude: ${number(region.longitude)}),"
            } + "        ],"
        }
        assertEquals(
            section("    static let regionTotals: [String: [String: ScooterRegion]] = [", "    ]").filter { !it.trimStart().startsWith("//") },
            regions,
        )
    }
}
