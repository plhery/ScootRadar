package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.AppleMapStyle
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

// The website's ground, from src/lib/quietGround.ts, where the iPhone draws Apple's map (MAP-297).

// The ground under the scooters: land, water, green, buildings, streets, rails and a few names, drawn from
// OpenStreetMap data in the colours of the app. Nothing on it competes with a scooter.

enum class GroundTheme { Day, Night }

/** Calm names the streets and the quarters; detailed adds places, stops and house numbers. */
enum class GroundDetail { Calm, Detailed }

class GroundPalette(
    val land: String,
    val green: String,
    val water: String,
    val building: String,
    /**
     * The colour the buildings are raised in, whose roofs MapLibre's light shows as [building] from above: it
     * adds 0.03 to a roof, lights it by 1.15·cos 30° between 0.5 and max(1.5 − luminance, 1), and lays it at 0.8
     * over the land. The night's would otherwise lift from #10141d to #1d232f, the day's from #e2e5eb to #e8ebf0.
     */
    val buildingRaised: String,
    val rail: String,
    val path: String,
    /** The edge of a street where the street is as light as the land; null where it is not needed. */
    val casing: String?,
    val minor: String,
    val mid: String,
    val major: String,
    val border: String,
    val label: String,
    val labelStrong: String,
    val halo: String,
    val waterLabel: String,
)

object GroundPalettes {
    val night = GroundPalette(
        land = "#0b0e14", green = "#0d1d1b", water = "#0b2244", building = "#10141d", buildingRaised = "#04070e",
        rail = "#2a3246", path = "#1a2030", casing = null, minor = "#222a3b", mid = "#2b354a", major = "#35415a",
        border = "#3a4560", label = "#76819a", labelStrong = "#9aa4b8", halo = "#0b0e14", waterLabel = "#4670aa",
    )

    val day = GroundPalette(
        land = "#eef0f4", green = "#dbe8da", water = "#c2d8f2", building = "#e2e5eb", buildingRaised = "#d8dbe2",
        rail = "#cfd4dd", path = "#f7f8fa", casing = "#dde1e8", minor = "#ffffff", mid = "#ffffff", major = "#ffffff",
        border = "#b9c0cc", label = "#7c8596", labelStrong = "#5f6878", halo = "#eef0f4", waterLabel = "#6d93c4",
    )

    fun of(theme: GroundTheme): GroundPalette = if (theme == GroundTheme.Night) night else day
}

/**
 * How the ground looks: its colours, how much of it is named, the language of the names, and whether imagery
 * lies under its streets.
 */
data class GroundLook(
    val theme: GroundTheme,
    val detail: GroundDetail,
    /** The app's language, as ScooterLanguage's raw value. */
    val language: String,
    val satellite: Boolean = false,
) {
    companion object {
        /**
         * The ground for a map style: Quiet is the web's calm ground and Standard its detailed one (MAP-006).
         * Satellite lays the imagery under the detailed ground's streets and names, in the night's colours, as
         * the iPhone draws its own art dark over imagery (MAP-010); without imagery it is Standard.
         */
        fun of(style: AppleMapStyle, dark: Boolean, language: String, hasImagery: Boolean): GroundLook = when {
            style == AppleMapStyle.Quiet -> GroundLook(theme(dark), GroundDetail.Calm, language)
            style == AppleMapStyle.Satellite && hasImagery ->
                GroundLook(GroundTheme.Night, GroundDetail.Detailed, language, satellite = true)
            else -> GroundLook(theme(dark), GroundDetail.Detailed, language)
        }

        private fun theme(dark: Boolean) = if (dark) GroundTheme.Night else GroundTheme.Day
    }
}

/**
 * Imagery for the Satellite style. None may be used yet without an account and a key (NEEDS-USER #3), so the
 * app has none, Settings leaves Satellite out, and a Satellite kept from elsewhere draws Standard.
 */
interface SatelliteSource {
    /** Its raster tiles, as {z}/{x}/{y} addresses. */
    val tiles: List<String>

    /** The size of a tile, in points. */
    val tileSize: Int

    /** The deepest zoom its tiles are cut for, in MapLibre's zoom. */
    val maxZoom: Int

    /** Its credit beside the map's, and the page the credit opens. */
    val credit: Pair<String, String>
}

/**
 * The ground as MapLibre's style: the web's paint and label rules as layers, bottom up, with every zoom of the
 * web's lowered by one to MapLibre's (MapZoom). The look changes in place: a new look only sets the colours,
 * filters, names and visibility that differ (changes), so the tiles and whatever the app adds over the ground
 * stay.
 */
object GroundStyle {
    /** Where OpenFreeMap says its tiles are: their address carries the date of the build. */
    const val TILE_INDEX_URL = "https://tiles.openfreemap.org/planet"

    /** OpenFreeMap's glyphs, the Noto Sans its own styles name places in (MAP-299). */
    const val GLYPHS_URL = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf"

    /** The deepest zoom the tiles are cut for; closer in, the same data is drawn larger. */
    const val MAX_DATA_ZOOM = 14

    /** The ground's vector tiles, as the style names them. */
    const val SOURCE = "ground"

    const val SATELLITE = "satellite"

    /**
     * The lowest of the ground's names: what the app draws over the streets and under the names, the zones and
     * the walk's trail (MAP-252), goes below it.
     */
    const val FIRST_LABEL_LAYER = "housenumber"

    /** The buildings, raised on a tilted map close up (MAP-254). */
    const val BUILDINGS = "building"

    /**
     * The least tilt, in degrees, at which the buildings stand: below it the map is seen from straight above, where
     * MapKit's buildings are flat.
     */
    const val LEAST_RAISED_TILT = 1.0

    /** How long MapLibre takes to raise the buildings or lay them flat, in ms: its own default for a change. */
    const val BUILDINGS_RISE = 300L

    /**
     * The style for a look. Without the tiles' address the ground is the plain colour of the land, as on the web,
     * until the source is added (source).
     */
    fun json(look: GroundLook, tiles: String?, imagery: SatelliteSource? = null): String = buildJsonObject {
        put("version", 8)
        put("name", "ScootRadar")
        put("glyphs", GLYPHS_URL)
        put(
            "sources",
            JsonObject(
                buildMap {
                    if (tiles != null) put(SOURCE, source(tiles))
                    if (imagery != null) put(SATELLITE, imagery(imagery))
                },
            ),
        )
        put("layers", JsonArray(layers(look, imagery != null).map { it.json }))
    }.toString()

    /** The ground's vector tiles, once their address is known. */
    fun source(tiles: String): JsonObject = buildJsonObject {
        put("type", "vector")
        put("tiles", JsonArray(listOf(JsonPrimitive(tiles))))
        put("minzoom", 0)
        put("maxzoom", MAX_DATA_ZOOM)
    }

    private fun imagery(source: SatelliteSource): JsonObject = buildJsonObject {
        put("type", "raster")
        put("tiles", JsonArray(source.tiles.map(::JsonPrimitive)))
        put("tileSize", source.tileSize)
        put("maxzoom", source.maxZoom)
    }

    /** One of the style's layers. */
    class Layer(val id: String, val json: JsonObject) {
        val paint: JsonObject get() = json["paint"] as? JsonObject ?: JsonObject(emptyMap())
        val layout: JsonObject get() = json["layout"] as? JsonObject ?: JsonObject(emptyMap())
        val filter: JsonElement? get() = json["filter"]
        val visible: Boolean get() = (layout["visibility"] as? JsonPrimitive)?.content != "none"
        val type: String get() = (json["type"] as JsonPrimitive).content
    }

    /** What changes from one look to another, layer by layer: a paint or layout property, or the filter. */
    data class Change(val layer: String, val kind: Kind, val name: String, val value: JsonElement) {
        enum class Kind { Paint, Layout, Filter }
    }

    /** What to set on a style drawn for one look to draw it for another. */
    fun changes(from: GroundLook, to: GroundLook, hasImagery: Boolean = false): List<Change> {
        val before = layers(from, hasImagery).associateBy { it.id }
        return layers(to, hasImagery).flatMap { layer ->
            val old = before.getValue(layer.id)
            buildList {
                for ((name, value) in layer.paint) {
                    if (old.paint[name] != value) add(Change(layer.id, Change.Kind.Paint, name, value))
                }
                for ((name, value) in layer.layout) {
                    if (old.layout[name] != value) add(Change(layer.id, Change.Kind.Layout, name, value))
                }
                if (old.filter != layer.filter) add(Change(layer.id, Change.Kind.Filter, "filter", layer.filter ?: JsonNull))
            }
        }
    }

    /**
     * Which of a feature's names its label shows, the first it has: the place in the app's language where
     * OpenStreetMap has it (Norwegian is filed under no), else its Latin form, else the local name. The web
     * shows the local name before the Latin form where the local name is in the language's own script; the
     * app's languages are all written in Latin letters, where the two are the same name (MAP-019), and a style
     * cannot tell scripts apart.
     */
    fun nameKeys(language: String): List<String> {
        val own = if (language == "nb" || language == "nn") "no" else language
        return listOf("name:$own", "name:latin", "name")
    }

    /** The layers for a look, bottom up: the land, the imagery if any, the ground's shapes, then the names. */
    fun layers(look: GroundLook, hasImagery: Boolean = false): List<Layer> = buildList {
        val c = GroundPalettes.of(look.theme)
        add(layer("land", "background", source = null, paint = mapOf("background-color" to c.land)))
        if (hasImagery) add(layer(SATELLITE, "raster", source = null, raster = true, visible = look.satellite))
        addAll(paintLayers(look))
        addAll(labelLayers(look))
    }

    private fun paintLayers(look: GroundLook): List<Layer> {
        val c = GroundPalettes.of(look.theme)
        // Over imagery, the streets and names are drawn and the ground's own shapes are not.
        val shapes = !look.satellite
        return listOf(
            layer(
                "landcover", "fill", "landcover", visible = shapes,
                filter = classIn("grass", "wood"),
                paint = mapOf("fill-color" to c.green),
            ),
            layer("park", "fill", "park", visible = shapes, paint = mapOf("fill-color" to c.green, "fill-opacity" to 0.6)),
            layer("water", "fill", "water", visible = shapes, paint = mapOf("fill-color" to c.water)),
            layer(
                "waterway", "line", "waterway", minzoom = web(11),
                filter = isLine,
                paint = mapOf("line-color" to c.water, "line-width" to grows(11 to 0.6, 17 to 2.4)),
            ),
            layer(
                "boundary", "line", "boundary",
                filter = all(listOf("==", get("admin_level"), 2), listOf("!=", get("maritime"), 1)),
                paint = mapOf("line-color" to c.border, "line-width" to grows(4 to 0.6, 10 to 1.4)),
            ),
            // A square or a street closed to cars, mapped as an area.
            layer(
                "square", "fill", "transportation", minzoom = web(15), visible = shapes,
                filter = all(isPolygon, listOf("==", get("class"), "path")),
                paint = mapOf("fill-color" to c.path),
            ),
            // The sidings of a station are left out until the tracks can be told apart.
            layer(
                "rail", "line", "transportation", minzoom = web(12),
                filter = all(ways("rail"), listOf("!", listOf("has", "service"))),
                paint = railPaint(c),
            ),
            layer(
                "rail-siding", "line", "transportation", minzoom = web(17),
                filter = all(ways("rail"), listOf("has", "service")),
                paint = railPaint(c),
            ),
            layer(
                "path", "line", "transportation", minzoom = web(16),
                filter = all(ways("path", "track"), listOf("!", isPedestrianStreet)),
                layout = mapOf("line-cap" to "round"),
                paint = mapOf("line-color" to c.path, "line-width" to grows(16 to 0.6, 17 to 1.3, 19 to 3.2)),
            ),
        ) + streets("casing", extra = 1.8, visible = c.casing != null) { c.casing ?: c.land } +
            streets("street", extra = 0.0, visible = true) { kind ->
                when (kind) {
                    Street.Service, Street.Minor -> c.minor
                    Street.Mid -> c.mid
                    Street.Major -> c.major
                }
            } + buildings(c, visible = shapes)
    }

    /**
     * The buildings, raised to their heights as MapKit raises them when the map is tilted close up (MAP-254), as
     * OpenFreeMap's Liberty does: from above, their roofs are the web's flat buildings in its colour. They come after the
     * streets, which they hide where they stand in front of them; an outline whose parts have their own heights is
     * left to its parts. The map lays them flat when it comes to rest seen from straight above (MapGround).
     */
    private fun buildings(c: GroundPalette, visible: Boolean) = layer(
        BUILDINGS, "fill-extrusion", "building", minzoom = web(15), visible = visible,
        filter = listOf("!", listOf("has", "hide_3d")),
        paint = mapOf(
            "fill-extrusion-color" to c.buildingRaised,
            "fill-extrusion-opacity" to 0.8,
            "fill-extrusion-vertical-gradient" to true,
        ) + buildingHeights(raised = true),
    )

    /**
     * The buildings' heights: raised, or flat as MapKit's are on a map seen from straight above (ios/README.md: "a
     * smaller tilt is flat again"). Paint properties, which MapLibre changes without laying the buildings out again.
     */
    fun buildingHeights(raised: Boolean): Map<String, JsonElement> = mapOf(
        "fill-extrusion-height" to if (raised) element(get("render_height")) else JsonPrimitive(0),
        "fill-extrusion-base" to if (raised) element(get("render_min_height")) else JsonPrimitive(0),
    )

    private fun railPaint(c: GroundPalette) =
        mapOf("line-color" to c.rail, "line-width" to grows(12 to 0.4, 17 to 1.0, 19 to 2.0))

    /** Widths in points at the web's zooms, growing as streets do on the ground. */
    private enum class Street(val minzoom: Double, val widths: List<Pair<Int, Double>>) {
        Service(15.0, listOf(15 to 0.5, 17 to 2.8, 19 to 9.0)),
        Minor(13.0, listOf(14 to 0.7, 17 to 5.4, 19 to 18.0)),
        Mid(11.0, listOf(12 to 0.8, 17 to 7.0, 19 to 22.0)),
        Major(8.0, listOf(8 to 0.6, 12 to 1.4, 17 to 8.6, 19 to 25.0)),
    }

    /**
     * The streets of each kind, `extra` points wider for their casings. The night has no casings; theirs stay in
     * the style, hidden, so that the day can show them again in place.
     */
    private fun streets(
        prefix: String,
        extra: Double,
        visible: Boolean,
        color: (Street) -> String,
    ): List<Layer> = Street.entries.map { kind ->
        val filter = when (kind) {
            Street.Service -> ways("service")
            // A street closed to cars is filed with the footpaths; it is drawn as the street it is.
            Street.Minor -> any(ways("minor"), all(isLine, notTunnel, isPedestrianStreet))
            Street.Mid -> ways("tertiary", "secondary")
            Street.Major -> ways("primary", "trunk", "motorway")
        }
        layer(
            "$prefix-${kind.name.lowercase()}", "line", "transportation", minzoom = web(kind.minzoom),
            visible = visible,
            filter = filter,
            layout = mapOf("line-cap" to "round", "line-join" to "round"),
            paint = mapOf(
                "line-color" to color(kind),
                "line-width" to grows(*kind.widths.map { (zoom, width) -> zoom to width + extra }.toTypedArray()),
            ),
        )
    }

    /**
     * The names, bottom up. The web places its names in the order of its rules, the first first, where MapLibre
     * places the top layer's first: the layers are the web's rules upside down, so the larger place still wins
     * the room.
     */
    private fun labelLayers(look: GroundLook): List<Layer> {
        val c = GroundPalettes.of(look.theme)
        val name = name(look.language)
        val detailed = look.detail == GroundDetail.Detailed
        val halo = mapOf("text-halo-color" to c.halo, "text-halo-width" to 2.8)

        fun place(id: String, classes: List<String>, minzoom: Int, maxzoom: Int, size: Double, strong: Boolean = false) =
            layer(
                id, "symbol", "place", minzoom = web(minzoom),
                // The web counts its last zoom in; MapLibre stops before its maxzoom, one lower.
                maxzoom = web(maxzoom + 1),
                filter = classIn(*classes.toTypedArray()),
                layout = mapOf(
                    "text-field" to name,
                    "text-font" to BOLD,
                    "text-size" to size,
                    "text-max-width" to maxWidth(12),
                    // The larger place first where two names want the same room.
                    "symbol-sort-key" to rank,
                ),
                paint = mapOf("text-color" to (if (strong) c.labelStrong else c.label)) + halo,
            )

        val rules = listOf(
            place("city", listOf("city"), 5, 12, 14.0, strong = true),
            place("town", listOf("town"), 9, 13, 12.5, strong = true),
            place("village", listOf("village"), 11, 14, 11.5),
            layer(
                "quarter", "symbol", "place", minzoom = web(13),
                filter = classIn("suburb", "quarter", "neighbourhood"),
                layout = mapOf(
                    "text-field" to name,
                    "text-font" to BOLD,
                    "text-size" to 11,
                    "text-transform" to "uppercase",
                    // 1.6 points between letters, in the em of 11 points.
                    "text-letter-spacing" to 1.6 / 11,
                    "text-max-width" to maxWidth(12),
                ),
                paint = mapOf("text-color" to c.label) + halo,
            ),
            layer(
                "station", "symbol", "poi", minzoom = web(14),
                filter = isStation,
                layout = mapOf(
                    "text-field" to name,
                    "text-font" to BOLD,
                    "text-size" to 12.5,
                    "text-max-width" to maxWidth(14),
                ),
                paint = mapOf("text-color" to c.labelStrong) + halo,
            ),
            layer(
                "water-name", "symbol", "water_name", minzoom = web(9),
                filter = isPoint,
                layout = mapOf(
                    "text-field" to name,
                    "text-font" to ITALIC,
                    "text-size" to 12,
                    "text-max-width" to maxWidth(12),
                ),
                paint = mapOf("text-color" to c.waterLabel),
            ),
            layer(
                "street-name", "symbol", "transportation_name", minzoom = web(16),
                filter = if (detailed) classIn("minor", "tertiary", "secondary", "primary", "trunk", "path")
                else classIn("minor", "tertiary", "secondary", "primary", "trunk"),
                layout = mapOf(
                    "text-field" to name,
                    "text-font" to REGULAR,
                    "text-size" to listOf("step", listOf("zoom"), 10, web(17), 11, web(18), 12),
                    "symbol-placement" to "line",
                    "symbol-spacing" to 420,
                ),
                // A name along a line has a stroke half as wide on the web as a name at a point.
                paint = mapOf("text-color" to c.label, "text-halo-color" to c.halo, "text-halo-width" to 1.4),
            ),
            layer(
                "waterway-name", "symbol", "waterway", minzoom = web(15),
                layout = mapOf(
                    "text-field" to name,
                    "text-font" to ITALIC,
                    "text-size" to 12,
                    "symbol-placement" to "line",
                ),
                paint = mapOf("text-color" to c.waterLabel),
            ),
            // Stations already have their name; the rest comes in the order of the data's own ranking.
            layer(
                "poi", "symbol", "poi", minzoom = web(17), visible = detailed,
                filter = listOf("!", isStation),
                layout = mapOf(
                    "text-field" to name,
                    "text-font" to REGULAR,
                    "text-size" to 10.5,
                    "text-max-width" to maxWidth(14),
                    "symbol-sort-key" to rank,
                ),
                paint = mapOf("text-color" to c.label) + halo,
            ),
            layer(
                "housenumber", "symbol", "housenumber", minzoom = web(19), visible = detailed,
                layout = mapOf("text-field" to get("housenumber"), "text-font" to REGULAR, "text-size" to 9.5),
                paint = mapOf("text-color" to c.label, "text-halo-color" to c.halo, "text-halo-width" to 2),
            ),
        )
        return rules.reversed()
    }

    // The web's weights: 700 is Noto Sans Bold, and 500 its Regular, the nearest OpenFreeMap has.
    private val BOLD = listOf("Noto Sans Bold")
    private val REGULAR = listOf("Noto Sans Regular")
    private val ITALIC = listOf("Noto Sans Italic")

    /** The web breaks a name after so many characters; MapLibre after so many ems, and a letter is about half one. */
    private fun maxWidth(characters: Int): Double = characters * 0.55

    private val rank = listOf("coalesce", get("rank"), 99)

    /** The first of the names the feature has, as nameKeys lists them. */
    private fun name(language: String): List<Any> = listOf("coalesce") + nameKeys(language).map(::get)

    /** MapLibre's zoom at a zoom of the web's. */
    private fun web(zoom: Number): Double = MapZoom.mapLibreZoom(zoom.toDouble())

    /** Widths in points at the web's zooms, growing as streets do on the ground. */
    private fun grows(vararg stops: Pair<Int, Double>): List<Any> =
        listOf("interpolate", listOf("exponential", 1.6), listOf("zoom")) +
            stops.flatMap { (zoom, width) -> listOf(web(zoom), width) }

    private fun get(key: String) = listOf("get", key)
    private fun all(vararg conditions: Any) = listOf("all", *conditions)
    private fun any(vararg conditions: Any) = listOf("any", *conditions)
    private fun classIn(vararg classes: String) = listOf("match", get("class"), classes.toList(), true, false)

    private val isLine = listOf("match", listOf("geometry-type"), listOf("LineString", "MultiLineString"), true, false)
    private val isPolygon = listOf("match", listOf("geometry-type"), listOf("Polygon", "MultiPolygon"), true, false)
    private val isPoint = listOf("match", listOf("geometry-type"), listOf("Point", "MultiPoint"), true, false)
    private val notTunnel = listOf("!=", get("brunnel"), "tunnel")
    private val isPedestrianStreet = all(listOf("==", get("class"), "path"), listOf("==", get("subclass"), "pedestrian"))
    private val isStation = all(listOf("==", get("class"), "railway"), listOf("==", get("subclass"), "station"))

    /** Lines of the transportation layer of these classes, above ground. */
    private fun ways(vararg classes: String) = all(isLine, notTunnel, classIn(*classes))

    /** A layer of the ground's tiles, of `source`'s features; or the land, or the imagery. */
    private fun layer(
        id: String,
        type: String,
        source: String?,
        raster: Boolean = false,
        minzoom: Double? = null,
        maxzoom: Double? = null,
        visible: Boolean = true,
        filter: List<Any>? = null,
        layout: Map<String, Any> = emptyMap(),
        paint: Map<String, Any> = emptyMap(),
    ): Layer = Layer(
        id,
        buildJsonObject {
            put("id", id)
            put("type", type)
            if (raster) put("source", SATELLITE)
            if (source != null) {
                put("source", SOURCE)
                put("source-layer", source)
            }
            if (minzoom != null) put("minzoom", minzoom)
            if (maxzoom != null) put("maxzoom", maxzoom)
            if (filter != null) put("filter", element(filter))
            put("layout", element(layout + ("visibility" to if (visible) "visible" else "none")))
            put("paint", element(paint))
        },
    )

    private fun element(value: Any?): JsonElement = when (value) {
        null -> JsonNull
        is JsonElement -> value
        is String -> JsonPrimitive(value)
        is Number -> JsonPrimitive(value)
        is Boolean -> JsonPrimitive(value)
        is List<*> -> JsonArray(value.map(::element))
        is Map<*, *> -> JsonObject(value.entries.associate { (key, item) -> key as String to element(item) })
        else -> error("Not a style value: $value")
    }
}
