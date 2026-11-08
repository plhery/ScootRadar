package com.plhery.scootradar.core.model

import java.time.DateTimeException
import java.time.Instant
import java.time.ZoneId
import java.util.Locale
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.sin
import kotlin.math.sqrt
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

// ios/ScootRadar/Models/ScooterZones.swift.

/**
 * What a zone forbids a scooter: riding in it at all, ending a ride in it, or going fast (src/lib/zones.ts); or,
 * where a city sets it, where a ride is to end (CityRuleZone).
 */
enum class ScooterZoneKind(val rawValue: String) {
    NoRide("noRide"),
    NoParking("noParking"),
    Slow("slow"),
    Parking("parking"),
    ;

    val label: String
        get() = when (this) {
            NoRide -> localized("No riding")
            NoParking -> localized("No parking")
            Slow -> localized("Slow")
            Parking -> localized("Parking")
        }

    companion object {
        fun fromRawValue(rawValue: String): ScooterZoneKind? = entries.firstOrNull { it.rawValue == rawValue }

        /** The kinds of the operators' zones, as their legend names them: no operator publishes where to park. */
        val operatorKinds: List<ScooterZoneKind> = listOf(NoRide, NoParking, Slow)

        /** The fills are laid down in this order, the strongest rule on top, as on the web. */
        val belowFirst: List<ScooterZoneKind> = listOf(Parking, Slow, NoParking, NoRide)
    }
}

/**
 * One of the zones an operator publishes (GBFS geofencing_zones), as the server keeps it: simplified, and
 * only those a scooter must mind now.
 */
data class ScooterZone(
    val id: String,
    val provider: String,
    val kind: ScooterZoneKind,
    /** A slow zone's limit. */
    val maxSpeedKph: Double? = null,
    /** Polygons, each its outer ring and then its holes. */
    val polygons: List<List<List<GeoPoint>>>,
    /** How strongly it is drawn: a city's rule outside its hours is dimmer (CityRuleZone). */
    val strength: Double = 1.0,
    /**
     * A city's rule with hours, Seoul's streets: no riding hatched the other way, so that it is told from no riding at
     * all hours where they meet.
     */
    val timed: Boolean = false,
)

/**
 * The limits of the slow zones a line of the zones' legend counts, in km/h, as on the web (ZoneLegend.tsx): the least
 * and the greatest, and whether one of them has none, where the line says "Slow" alone.
 */
data class ScooterZoneSpeeds(
    /** The least limit; null while none is counted. */
    val least: Double? = null,
    /** The greatest limit; null while none is counted. */
    val greatest: Double? = null,
    /** One of the zones counted has no limit. */
    val hasZoneWithout: Boolean = false,
) {
    /** These and a slow zone's limit, or a slow zone without one. */
    operator fun plus(speed: Double?): ScooterZoneSpeeds = when {
        speed == null || !speed.isFinite() -> copy(hasZoneWithout = true)
        least == null || greatest == null -> copy(least = speed, greatest = speed)
        else -> copy(least = minOf(least, speed), greatest = maxOf(greatest, speed))
    }

    /** The least and the greatest where every zone counted has a limit; null where one has none, or none is counted. */
    val known: ClosedFloatingPointRange<Double>?
        get() = if (hasZoneWithout || least == null || greatest == null) null else least..greatest

    companion object {
        /** Those of the slow zones among the [zones]. */
        fun ofSlowZones(zones: Iterable<ScooterZone>): ScooterZoneSpeeds =
            zones.fold(ScooterZoneSpeeds()) { speeds, zone ->
                if (zone.kind == ScooterZoneKind.Slow) speeds + zone.maxSpeedKph else speeds
            }
    }
}

@Serializable(with = ScooterZoneResponse.Serializer::class)
data class ScooterZoneResponse(
    val zones: List<ScooterZone>,
    /** Some feeds' zones are still on their way: ask again in a few seconds. */
    val pending: Boolean,
    /**
     * Some feeds' zones could not be read, and none were before: their rules are unknown, not absent. Asked for again,
     * the server tries the next read a minute after the last. Older servers leave it out.
     */
    val unavailable: Boolean = false,
    /** Zones were left out to keep the answer small. */
    val truncated: Boolean,
) {
    /** Reads the server's answer; the app never writes one. */
    internal object Serializer : KSerializer<ScooterZoneResponse> {
        override val descriptor: SerialDescriptor = Body.serializer().descriptor

        override fun deserialize(decoder: Decoder): ScooterZoneResponse {
            val body = decoder.decodeSerializableValue(Body.serializer())
            return ScooterZoneResponse(
                // A kind added later is left out, and parking, which only cities set and the operators' legend
                // does not name, as is a ring with too few points.
                zones = body.zones.mapNotNull(Payload::zone),
                pending = body.meta?.pending ?: false,
                unavailable = body.meta?.unavailable ?: false,
                truncated = body.meta?.truncated ?: false,
            )
        }

        override fun serialize(encoder: Encoder, value: ScooterZoneResponse): Unit =
            throw SerializationException("Zones are only read")
    }

    @Serializable
    private class Body(val zones: List<Payload>, val meta: Meta? = null)

    @Serializable
    private class Meta(val pending: Boolean? = null, val unavailable: Boolean? = null, val truncated: Boolean? = null)

    /** A zone as it comes, with a kind this version may not know. */
    @Serializable
    private class Payload(
        val id: String,
        val provider: String,
        val kind: String,
        val maxSpeedKph: Double? = null,
        val polygons: List<List<List<List<Double>>>>,
    ) {
        fun zone(): ScooterZone? {
            val kind = ScooterZoneKind.fromRawValue(kind)?.takeIf { it in ScooterZoneKind.operatorKinds } ?: return null
            val polygons = polygons.mapNotNull { polygon ->
                val rings = polygon.map { ring ->
                    ring.mapNotNull { point -> if (point.size >= 2) GeoPoint(latitude = point[0], longitude = point[1]) else null }
                }
                val outer = rings.firstOrNull()
                if (outer == null || outer.size < 4) null else listOf(outer) + rings.drop(1).filter { it.size >= 4 }
            }
            if (polygons.isEmpty()) return null
            return ScooterZone(id = id, provider = provider, kind = kind, maxSpeedKph = maxSpeedKph, polygons = polygons)
        }
    }
}

/**
 * The area zones are asked for: the map's, rounded out to a grid of 1/50° (about 2 km), as the web asks
 * (src/lib/useZoneData.ts), so that views near each other ask the same address and one answer serves them.
 */
@ConsistentCopyVisibility
data class ScooterZoneArea private constructor(
    /** The edges in fiftieths of a degree. */
    val south: Int,
    val west: Int,
    val north: Int,
    val east: Int,
) {
    fun contains(other: ScooterZoneArea): Boolean =
        south <= other.south && west <= other.west && north >= other.north && east >= other.east

    /**
     * As the web writes them, "47.36" or "8.5", so both apps ask the same address. The answer is the same
     * at every zoom, so the zoom is the least.
     */
    val queryItems: List<Pair<String, String>>
        get() = listOf(
            "south" to degrees(south),
            "west" to degrees(west),
            "north" to degrees(north),
            "east" to degrees(east),
            "zoom" to minimumZoom.toString(),
        )

    companion object {
        /** Zones are drawn from this zoom in: further out they would cover the scooters, and weigh too much (ZONES_MIN_ZOOM). */
        const val minimumZoom = 14

        /** The widest area, in degrees each way, the server answers for (ZONES_MAX_SPAN_DEGREES). */
        const val maximumSpan = 1.0
        const val grid = 50.0

        /**
         * Null for an area the server would not answer for: one across the 180° line, where no operator
         * publishes zones, or one too wide.
         */
        operator fun invoke(covering: GeoBounds): ScooterZoneArea? {
            if (covering.crossesDateLine) return null
            val area = ScooterZoneArea(
                south = floor(covering.south * grid).toInt(),
                west = floor(covering.west * grid).toInt(),
                north = ceil(covering.north * grid).toInt(),
                east = ceil(covering.east * grid).toInt(),
            )
            if (!((area.north - area.south) / grid <= maximumSpan && (area.east - area.west) / grid <= maximumSpan)) {
                return null
            }
            return area
        }

        /** A multiple of 1/50° as JavaScript prints it: at most two decimals, none trailing. */
        fun degrees(fiftieths: Int): String {
            val hundredths = abs(fiftieths) * 2
            val sign = if (fiftieths < 0) "-" else ""
            val whole = hundredths / 100
            val fraction = hundredths % 100
            if (fraction == 0) return "$sign$whole"
            if (fraction % 10 == 0) return "$sign$whole.${fraction / 10}"
            return "$sign$whole.${if (fraction < 10) "0" else ""}$fraction"
        }
    }
}

/**
 * What the zones' legend says while they are turned on, as on the web (useZoneData.ts). Partial: some zones were left
 * out to keep the answer small; zoomed in, the area is smaller. Failed: some or all of the area's zones are unknown, its
 * answer having failed, or some feeds' zones being still on their way after the last try or unreadable; those drawn
 * stay drawn.
 */
enum class ScooterZoneState { Off, ZoomIn, Loading, Shown, Partial, Failed }

/**
 * How each kind of zone is drawn, as on the web (ZoneLegend.tsx, map.css): how strongly it is filled, the
 * stronger the rule the stronger the fill, and its edge, solid, dashed or dotted, so that the kinds tell
 * apart without their colours. No riding is hatched too. A city's parking places, some only a few metres
 * across, are filled more strongly still than no parking, in green, so that they show.
 */
object ScooterZoneLook {
    data class Edge(
        val width: Double,
        /** Dash and gap lengths in points; empty for a solid edge. */
        val dashes: List<Double>,
        val roundCaps: Boolean,
    )

    const val edgeOpacity = 0.9

    /** How far, in points, no parking's and slow zones' edges keep from no riding's edge, and out of its zones (ZONE_EDGE_CLEARANCE). */
    const val edgeClearance = 3.0

    /** No riding's hatching: lines this far apart and this wide, on a ground of this opacity, as the web's pattern draws it. */
    const val hatchSpacing = 8.0
    const val hatchWidth = 2.0
    const val hatchGroundOpacity = 0.4

    /** The opacity of the whole of a kind's fills. */
    fun fillOpacity(kind: ScooterZoneKind): Double = when (kind) {
        ScooterZoneKind.NoRide -> 0.4
        ScooterZoneKind.NoParking -> 0.16
        ScooterZoneKind.Slow -> 0.12
        ScooterZoneKind.Parking -> 0.25
    }

    fun edge(kind: ScooterZoneKind): Edge = when (kind) {
        ScooterZoneKind.NoRide -> Edge(width = 1.5, dashes = emptyList(), roundCaps = false)
        ScooterZoneKind.NoParking -> Edge(width = 1.5, dashes = listOf(6.0, 4.0), roundCaps = false)
        ScooterZoneKind.Slow -> Edge(width = 2.0, dashes = listOf(0.1, 4.0), roundCaps = true)
        ScooterZoneKind.Parking -> Edge(width = 1.5, dashes = emptyList(), roundCaps = false)
    }

    /**
     * The web's colours, 0xAARRGGBB: edges of 3:1 at least on the land, the parks and the streets of the
     * light map, lighter on a dark map and on satellite.
     */
    fun color(kind: ScooterZoneKind, isDark: Boolean): Long = when (kind) {
        ScooterZoneKind.NoRide -> if (isDark) 0xFFFF6961 else 0xFFD92D20
        ScooterZoneKind.NoParking -> if (isDark) 0xFFFFB340 else 0xFFC05600
        ScooterZoneKind.Slow -> if (isDark) 0xFF7C9CFF else 0xFF3E63DD
        ScooterZoneKind.Parking -> if (isDark) 0xFF4CD97B else 0xFF1A7F37
    }
}

/**
 * A street where a city or its police forbids riding, from data/rule-zones.json, or a zone a city sets for shared
 * scooters, from data/city-zones.json, as on the web (src/lib/ruleZones.ts): Seoul's kickboard-free streets, and
 * Bergen's and Porto's zones, credited to the city. Unlike the operators' zones they are the law, so the map draws
 * them from zoom 14 whether or not the zones are on, each as its kind's zones are and dimmer outside its hours, and
 * the legend gives their kind, a slow one's speed, their hours and who sets them, linked to where they say so.
 * CityRuleZone.all, Seoul's streets, and CityRuleZone.cityZones are generated.
 */
@ConsistentCopyVisibility
data class CityRuleZone private constructor(
    val id: String,
    /** Who sets it, as the legend names them: "Seoul", "Gangnam-gu", "Bergen kommune". */
    val authority: String,
    val timeZone: String,
    /** What it asks of a scooter: no riding, or riding slowly. */
    val kind: ScooterZoneKind,
    /** The speed a slow one sets, where the city gives one: Linköping's 6 km/h. A city's zone has none. */
    val maxSpeedKph: Double?,
    /** The local day it starts, "YYYY-MM-DD"; empty for one that has always held, as a city's zone. */
    val firstDay: String,
    /** Every day; all day when empty. */
    val hours: List<Hours>,
    /** Where they say so, an https address. */
    val source: String,
    /** A street's centrelines; none for an area. */
    val lines: List<List<GeoPoint>>,
    val bounds: GeoBounds,
    /**
     * As the map draws it. A street is the pieces of its band, a disc at each corner and a strip along each piece,
     * which the zones' overlay merges into one shape; an area is its ring.
     */
    val polygons: List<List<List<GeoPoint>>>,
) {
    /** A street where riding is forbidden, or slow. */
    constructor(
        id: String,
        authority: String,
        timeZone: String,
        kind: ScooterZoneKind = ScooterZoneKind.NoRide,
        maxSpeedKph: Double? = null,
        firstDay: String,
        hours: List<Hours>,
        source: String,
        lines: List<List<GeoPoint>>,
    ) : this(
        id = id, authority = authority, timeZone = timeZone, kind = kind, maxSpeedKph = maxSpeedKph,
        firstDay = firstDay, hours = hours, source = source, lines = lines, bounds = bounds(of = lines.flatten()),
        polygons = band(of = lines, widthMeters = bandWidthMeters),
    )

    /** One of a city's zones: one ring, which holds all day, every day. */
    constructor(
        id: String,
        authority: String,
        timeZone: String,
        kind: ScooterZoneKind,
        source: String,
        ring: List<GeoPoint>,
    ) : this(
        id = id, authority = authority, timeZone = timeZone, kind = kind, maxSpeedKph = null, firstDay = "",
        hours = emptyList(), source = source, lines = emptyList(), bounds = bounds(of = ring),
        polygons = listOf(listOf(ring)),
    )

    /**
     * Its bounds piece by piece, so that a long street is over a view only where it runs: the whole of Chicago's
     * lakefront trail, 22 km, would put it over the Loop beside it. A city's zone is its ring's.
     */
    val pieceBounds: List<GeoBounds> = if (lines.isEmpty()) listOf(bounds) else pieceBounds(of = lines)

    /** Whether any of it is over the view. */
    fun reaches(view: GeoBounds): Boolean = pieceBounds.any { it.intersects(view) }

    data class Hours(
        /** Local minutes since midnight; hours past midnight start after they end. */
        val fromMinute: Int,
        val untilMinute: Int,
    ) {
        fun holds(atMinute: Int): Boolean =
            if (fromMinute <= untilMinute) atMinute >= fromMinute && atMinute < untilMinute
            else atMinute >= fromMinute || atMinute < untilMinute
    }

    /** A rule over the map, with whether it holds now. */
    data class Shown(val rule: CityRuleZone, val inForce: Boolean) {
        /** As the map draws it: a zone of its kind, dimmer outside its hours, hatched the other way if it has any. */
        val mapZone: ScooterZone
            get() = ScooterZone(
                id = "rule:${rule.id}", provider = "city", kind = rule.kind, maxSpeedKph = rule.maxSpeedKph,
                polygons = rule.polygons, strength = if (inForce) 1.0 else dimmed, timed = rule.hours.isNotEmpty(),
            )
    }

    /** Whether it holds at that instant: from its first day there, within its hours. */
    fun inForce(at: Instant): Boolean {
        // A city's zone holds at any time: hundreds may be in view, and need no clock read.
        if (firstDay.isEmpty() && hours.isEmpty()) return true
        val zone = try {
            ZoneId.of(timeZone)
        } catch (_: DateTimeException) {
            return false
        }
        val clock = at.atZone(zone)
        val day = String.format(Locale.ROOT, "%04d-%02d-%02d", clock.year, clock.monthValue, clock.dayOfMonth)
        if (day < firstDay) return false
        val local = clock.hour * 60 + clock.minute
        return hours.isEmpty() || hours.any { it.holds(atMinute = local) }
    }

    companion object {
        /** The streets and areas traced on OpenStreetMap where a city forbids riding or asks scooters to go slowly. */
        val all: List<CityRuleZone> get() = CatalogData.value.ruleZones

        /**
         * An area traced on OpenStreetMap where a city forbids riding or asks scooters to go slowly, one ring, from its
         * first day, within its hours: a function, as a constructor would clash on the JVM with a street's.
         */
        fun area(
            id: String,
            authority: String,
            timeZone: String,
            kind: ScooterZoneKind,
            maxSpeedKph: Double? = null,
            firstDay: String,
            hours: List<Hours>,
            source: String,
            ring: List<GeoPoint>,
        ) = CityRuleZone(
            id = id, authority = authority, timeZone = timeZone, kind = kind, maxSpeedKph = maxSpeedKph,
            firstDay = firstDay, hours = hours, source = source, lines = emptyList(), bounds = bounds(of = ring),
            polygons = listOf(listOf(ring)),
        )

        /**
         * The zones cities set for shared scooters, as src/lib/ruleZones.ts reads data/city-zones.json: where to park,
         * where not to, where to ride slowly and where not to ride, each one ring.
         */
        val cityZones: List<CityRuleZone> get() = CatalogData.value.cityZones

        /** The streets and areas, and the cities' zones, put together once, as the map shows them. */
        val onMap: List<CityRuleZone> get() = CatalogData.value.onMap

        /** How wide a street's band is drawn: the street and its pavements, so that it shows from zoom 14. */
        const val bandWidthMeters = 14.0

        /** How strongly a rule is drawn outside its hours, of how strongly within them. */
        const val dimmed = 0.35

        /** The corners of the disc each bend and end of a band is rounded with. */
        private const val ROUND_CORNERS = 12

        /** The rules over the view, from zoom 14 in, each with whether it holds at that instant. */
        fun shown(over: GeoBounds, zoom: Int, at: Instant, among: List<CityRuleZone> = onMap): List<Shown> {
            if (zoom < ScooterZoneArea.minimumZoom) return emptyList()
            return among.mapNotNull { if (it.reaches(over)) Shown(rule = it, inForce = it.inForce(at)) else null }
        }

        /** The points of each piece of a line bounded on its own. */
        private const val PIECE_POINTS = 16

        private fun pieceBounds(of: List<List<GeoPoint>>): List<GeoBounds> = of.flatMap { line ->
            (0 until maxOf(line.size - 1, 1) step PIECE_POINTS).map { start ->
                bounds(of = line.subList(start, minOf(start + PIECE_POINTS + 1, line.size)))
            }
        }

        private fun bounds(of: List<GeoPoint>): GeoBounds = GeoBounds(
            south = of.minOfOrNull { it.latitude } ?: 0.0, west = of.minOfOrNull { it.longitude } ?: 0.0,
            north = of.maxOfOrNull { it.latitude } ?: 0.0, east = of.maxOfOrNull { it.longitude } ?: 0.0,
        )

        /** bandPolygons in src/lib/ruleZones.ts. */
        fun band(of: List<List<GeoPoint>>, widthMeters: Double): List<List<List<GeoPoint>>> {
            val metersPerDegreeLatitude = 110_540.0
            val half = widthMeters / 2
            return of.flatMap { line ->
                val first = line.firstOrNull() ?: return@flatMap emptyList()
                val metersPerDegreeLongitude = 111_320 * cos(first.latitude * PI / 180)
                val discs = line.map { point ->
                    listOf(
                        (0..ROUND_CORNERS).map { index ->
                            val angle = (index % ROUND_CORNERS).toDouble() / ROUND_CORNERS.toDouble() * 2 * PI
                            GeoPoint(
                                latitude = point.latitude + half * sin(angle) / metersPerDegreeLatitude,
                                longitude = point.longitude + half * cos(angle) / metersPerDegreeLongitude,
                            )
                        },
                    )
                }
                val strips = line.zipWithNext().mapNotNull { (start, end) ->
                    val dx = (end.longitude - start.longitude) * metersPerDegreeLongitude
                    val dy = (end.latitude - start.latitude) * metersPerDegreeLatitude
                    val length = sqrt(dx * dx + dy * dy)
                    if (!(length > 0)) return@mapNotNull null
                    // Half the width across the piece, in degrees.
                    val acrossLatitude = dx / length * half / metersPerDegreeLatitude
                    val acrossLongitude = -dy / length * half / metersPerDegreeLongitude
                    fun corner(point: GeoPoint, side: Double) = GeoPoint(
                        latitude = point.latitude + side * acrossLatitude,
                        longitude = point.longitude + side * acrossLongitude,
                    )
                    listOf(listOf(corner(start, 1.0), corner(end, 1.0), corner(end, -1.0), corner(start, -1.0), corner(start, 1.0)))
                }
                discs + strips
            }
        }
    }
}
