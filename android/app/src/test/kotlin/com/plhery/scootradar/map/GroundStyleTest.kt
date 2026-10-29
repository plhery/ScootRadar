package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.AppleMapStyle
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.double
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

// src/lib/quietGround.test.ts's groundRules and placeNameKeys, and the ground as MapLibre's style.
class GroundStyleTest {
    private val calmDay = GroundLook(GroundTheme.Day, GroundDetail.Calm, "en")

    @Test
    fun drawsTheLandInTheColourOfThePageByDayAndByNight() {
        assertEquals("#eef0f4", GroundPalettes.day.land)
        assertEquals("#0b0e14", GroundPalettes.night.land)
        val land = GroundStyle.layers(calmDay.copy(theme = GroundTheme.Night)).first()
        assertEquals("background", land.type)
        assertEquals(JsonPrimitive("#0b0e14"), land.paint["background-color"])
    }

    @Test
    fun writesMoreNamesOnTheDetailedMapThanOnTheCalmOne() {
        val calm = GroundStyle.layers(GroundLook(GroundTheme.Night, GroundDetail.Calm, "en"))
        val detailed = GroundStyle.layers(GroundLook(GroundTheme.Night, GroundDetail.Detailed, "en"))
        val names = { layers: List<GroundStyle.Layer> -> layers.count { it.type == "symbol" && it.visible } }
        assertTrue(names(detailed) > names(calm))
        // What is drawn under the names is the same.
        val ground = { layers: List<GroundStyle.Layer> -> layers.filter { it.type != "symbol" && it.visible }.map { it.id } }
        assertEquals(ground(calm), ground(detailed))
    }

    // Names as OpenFreeMap's tiles carry them, read on 15 October 2026.
    private val telAviv = mapOf("name" to "תל אביב–יפו", "name:latin" to "Tel Aviv", "name:en" to "Tel Aviv", "name:he" to "תל אביב–יפו", "name:el" to "Τελ Αβίβ")
    private val kupatHolim = mapOf("name" to "כללית", "name:he" to "כללית")
    private val dubai = mapOf("name" to "دبي", "name:latin" to "Dubai", "name:en" to "Dubai", "name:he" to "דובאי", "name:el" to "Ντουμπάι")
    private val mustaqbal = mapOf("name" to "شارع المستقبل", "name:latin" to "Al Mustaqbal Street", "name:en" to "Al Mustaqbal Street")
    private val athens = mapOf("name" to "Αθήνα", "name:latin" to "Athens", "name:en" to "Athens", "name:el" to "Αθήνα", "name:he" to "אתונה", "name:de" to "Athen")

    // Most streets of Athens give no name:el.
    private val lenorman = mapOf("name" to "Λένορμαν", "name:latin" to "Lenorman")
    private val kyiv = mapOf("name" to "Київ", "name:latin" to "Kyiv", "name:en" to "Kyiv", "name:uk" to "Київ", "name:el" to "Κίεβο", "name:he" to "קייב", "name:de" to "Kiew")
    private val zurich = mapOf("name" to "Zürich", "name:latin" to "Zürich", "name:en" to "Zurich", "name:de" to "Zürich", "name:el" to "Ζυρίχη", "name:he" to "ציריך")
    private val langstrasse = mapOf("name" to "Langstrasse", "name:latin" to "Langstrasse")
    private val oslo = mapOf("name" to "Oslo", "name:latin" to "Oslo", "name:no" to "Oslo", "name:fr" to "Oslo")
    private val bygdoy = mapOf("name" to "Bygdøy allé", "name:latin" to "Bygdøy allé")
    private val unnamedService = mapOf("name" to "1174", "name:latin" to "1174")

    /** As MapLibre reads the style's coalesce: the first key the feature has. */
    private fun label(language: String, props: Map<String, String>): String? =
        GroundStyle.nameKeys(language).firstNotNullOfOrNull { props[it] }

    @Test
    fun writesPlacesInEnglishThenInLatinLettersThenAsTheyAreForAnEnglishVisitor() {
        assertEquals(
            listOf("Tel Aviv", "כללית", "Dubai", "Al Mustaqbal Street", "Athens", "Lenorman", "Kyiv", "Zurich", "Langstrasse", "1174"),
            listOf(telAviv, kupatHolim, dubai, mustaqbal, athens, lenorman, kyiv, zurich, langstrasse, unnamedService).map { label("en", it) },
        )
    }

    @Test
    fun keepsTheNamesOfTheUILanguagesNorwegianUnderNo() {
        assertEquals(listOf("Zürich", "Athen", "Lenorman", "Kiew"), listOf(zurich, athens, lenorman, kyiv).map { label("de", it) })
        assertEquals(listOf("Oslo", "Bygdøy allé", "Tel Aviv"), listOf(oslo, bygdoy, telAviv).map { label("nb", it) })
        assertEquals(listOf("Київ", "Athens"), listOf(kyiv, athens).map { label("uk", it) })
    }

    @Test
    fun everyNameIsTheFirstOfItsNamesTheFeatureHas() {
        val city = GroundStyle.layers(calmDay.copy(language = "nb")).first { it.id == "city" }
        assertEquals(
            Json.parseToJsonElement("""["coalesce",["get","name:no"],["get","name:latin"],["get","name"]]"""),
            city.layout["text-field"],
        )
    }

    @Test
    fun everyZoomIsTheWebsLoweredByOne() {
        val layers = GroundStyle.layers(calmDay).associateBy { it.id }
        fun zoom(id: String, key: String) = layers.getValue(id).json[key]?.jsonPrimitive?.double
        // Cities from the web's 5 to its 12, which it counts in: MapLibre's 4 up to, not into, its 12.
        assertEquals(4.0, zoom("city", "minzoom")!!, 0.0)
        assertEquals(12.0, zoom("city", "maxzoom")!!, 0.0)
        assertEquals(14.0, zoom("building", "minzoom")!!, 0.0)
        assertEquals(7.0, zoom("street-major", "minzoom")!!, 0.0)
        assertEquals(15.0, zoom("street-name", "minzoom")!!, 0.0)
        assertNull(zoom("water", "minzoom"))
        // A major street is 8.6 points wide at the web's 17, and its casing 1.8 wider.
        val widths = layers.getValue("street-major").paint["line-width"]!!.jsonArray
        assertEquals(Json.parseToJsonElement("""["interpolate",["exponential",1.6],["zoom"],7.0,0.6,11.0,1.4,16.0,8.6,18.0,25.0]"""), widths)
        val casing = layers.getValue("casing-major").paint["line-width"]!!.jsonArray
        assertEquals(16.0, casing[7].jsonPrimitive.double, 0.0)
        assertEquals(10.4, casing[8].jsonPrimitive.double, 1e-9)
        assertEquals(
            Json.parseToJsonElement("""["step",["zoom"],10,16.0,11,17.0,12]"""),
            layers.getValue("street-name").layout["text-size"],
        )
    }

    @Test
    fun theLargerNamesAreOnTopAsTheWebPlacesThemFirst() {
        val names = GroundStyle.layers(calmDay).filter { it.type == "symbol" }.map { it.id }
        assertEquals(
            listOf("housenumber", "poi", "waterway-name", "street-name", "water-name", "station", "quarter", "village", "town", "city"),
            names,
        )
        assertEquals(GroundStyle.FIRST_LABEL_LAYER, names.first())
    }

    @Test
    fun nightComesInPlaceWithItsColoursAndWithoutCasings() {
        val changes = GroundStyle.changes(calmDay, calmDay.copy(theme = GroundTheme.Night))
        // Colours and the casings' visibility; nothing that loads the tiles' names again.
        assertTrue(changes.all { it.kind == GroundStyle.Change.Kind.Paint || it.name == "visibility" })
        assertTrue(GroundStyle.Change(layer = "land", kind = GroundStyle.Change.Kind.Paint, name = "background-color", value = JsonPrimitive("#0b0e14")) in changes)
        val hidden = changes.filter { it.name == "visibility" }
        assertEquals(listOf("casing-service", "casing-minor", "casing-mid", "casing-major"), hidden.map { it.layer })
        assertTrue(hidden.all { it.value == JsonPrimitive("none") })
        assertEquals(JsonPrimitive("#35415a"), changes.first { it.layer == "street-major" && it.name == "line-color" }.value)
        // And back.
        assertTrue(GroundStyle.changes(calmDay.copy(theme = GroundTheme.Night), calmDay).filter { it.name == "visibility" }
            .all { it.value == JsonPrimitive("visible") })
    }

    /** MapKit's buildings rise when the map is tilted close up, as OpenFreeMap's Liberty raises them (MAP-254). */
    @Test
    fun theBuildingsRiseToTheirHeightsFromTheWebsZoom15InTheirOwnColours() {
        val layers = GroundStyle.layers(calmDay)
        val buildings = layers.filter { (it.json["source-layer"] as? JsonPrimitive)?.content == "building" }
        // One layer, raised, in place of the flat fill and its outline.
        assertEquals(listOf("building"), buildings.map { it.id })
        val building = buildings.single()
        assertEquals("fill-extrusion", building.type)
        assertEquals(14.0, building.json["minzoom"]!!.jsonPrimitive.double, 0.0)
        assertEquals(
            Json.parseToJsonElement(
                """{"fill-extrusion-color":"#d8dbe2","fill-extrusion-height":["get","render_height"],""" +
                    """"fill-extrusion-base":["get","render_min_height"],"fill-extrusion-opacity":0.8,""" +
                    """"fill-extrusion-vertical-gradient":true}""",
            ),
            building.paint,
        )
        // A building's outline whose parts have their own heights is left to its parts.
        assertEquals(Json.parseToJsonElement("""["!",["has","hide_3d"]]"""), building.filter)
        assertTrue(building.visible)
        // Drawn after the streets, which the buildings hide where they stand in front, and under the names.
        val ids = layers.map { it.id }
        assertTrue(ids.indexOf("building") > ids.indexOf("street-major"))
        assertTrue(ids.indexOf("building") < ids.indexOf(GroundStyle.FIRST_LABEL_LAYER))
        // By night, only its colour changes: darker than the night's flat buildings, which MapLibre's light shows
        // its roofs as (MapBuildingsTest).
        val night = GroundStyle.changes(calmDay, calmDay.copy(theme = GroundTheme.Night)).filter { it.layer == "building" }
        assertEquals(listOf(GroundStyle.Change("building", GroundStyle.Change.Kind.Paint, "fill-extrusion-color", JsonPrimitive("#04070e"))), night)
        // Seen from straight above, they lie flat, as MapKit's do: their heights only, paint properties.
        assertEquals(
            mapOf("fill-extrusion-height" to JsonPrimitive(0), "fill-extrusion-base" to JsonPrimitive(0)),
            GroundStyle.buildingHeights(raised = false),
        )
        assertEquals(GroundStyle.buildingHeights(raised = true), building.paint.filterKeys { it in GroundStyle.buildingHeights(raised = false) })
    }

    /**
     * The colours the buildings are raised in are those whose roofs MapLibre's light shows as the palette's flat
     * buildings, over its land (GroundPalette.buildingRaised): a palette changed without them fails here, not only on
     * an emulator (MapBuildingsTest).
     */
    @Test
    fun theRaisedBuildingsRoofsAreThePalettesBuildings() {
        for ((name, palette) in listOf("day" to GroundPalettes.day, "night" to GroundPalettes.night)) {
            val roof = roof(rgb(palette.buildingRaised), over = rgb(palette.land))
            val flat = rgb(palette.building)
            for (channel in 0..2) assertEquals("$name, channel $channel: ${roof.toList()}", flat[channel], roof[channel], 1.0)
        }
    }

    /** A colour's channels, 0 to 255. */
    private fun rgb(hex: String): DoubleArray = DoubleArray(3) { hex.substring(1 + it * 2, 3 + it * 2).toInt(16).toDouble() }

    /**
     * The roof of a building raised in [colour], seen from above, as MapLibre's fill_extrusion shader lights it
     * with the style's default light (intensity 0.5, white, 1.15 from the polar 30°) and the layer lays it at 0.8
     * over the land: 0.03 added, lit by mix(1 − intensity, max(1 − luminance + intensity, 1), 1.15·cos 30°).
     */
    private fun roof(colour: DoubleArray, over: DoubleArray): DoubleArray {
        val intensity = 0.5
        val c = colour.map { it / 255 }
        val luminance = c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722
        val facing = 1.15 * kotlin.math.cos(Math.toRadians(30.0))
        val lit = (1 - intensity) + (maxOf(1 - luminance + intensity, 1.0) - (1 - intensity)) * facing
        return DoubleArray(3) { ((c[it] + 0.03) * lit).coerceIn(0.0, 1.0) * 255 * 0.8 + over[it] * 0.2 }
    }

    @Test
    fun anotherLanguageOnlyRenamesThePlaces() {
        val changes = GroundStyle.changes(calmDay, calmDay.copy(language = "de"))
        assertTrue(changes.all { it.kind == GroundStyle.Change.Kind.Layout && it.name == "text-field" })
        // House numbers are numbers in every language.
        assertEquals(
            listOf("poi", "waterway-name", "street-name", "water-name", "station", "quarter", "village", "town", "city"),
            changes.map { it.layer },
        )
    }

    @Test
    fun theDetailedMapNamesPathsPlacesAndHouseNumbers() {
        val changes = GroundStyle.changes(calmDay, calmDay.copy(detail = GroundDetail.Detailed))
        assertEquals(
            setOf("housenumber" to "visibility", "poi" to "visibility", "street-name" to "filter"),
            changes.map { it.layer to it.name }.toSet(),
        )
        val filter = changes.first { it.name == "filter" }.value.jsonArray
        assertTrue(JsonPrimitive("path") in filter[2].jsonArray)
    }

    @Test
    fun quietIsTheCalmGroundAndStandardTheDetailedOne() {
        assertEquals(calmDay, GroundLook.of(AppleMapStyle.Quiet, dark = false, language = "en", hasImagery = false))
        assertEquals(
            GroundLook(GroundTheme.Night, GroundDetail.Detailed, "fr"),
            GroundLook.of(AppleMapStyle.Standard, dark = true, language = "fr", hasImagery = false),
        )
    }

    @Test
    fun satelliteWithoutImageryIsStandardAndWithItIsDarkOverTheImagery() {
        assertEquals(
            GroundLook(GroundTheme.Day, GroundDetail.Detailed, "en"),
            GroundLook.of(AppleMapStyle.Satellite, dark = false, language = "en", hasImagery = false),
        )
        val look = GroundLook.of(AppleMapStyle.Satellite, dark = false, language = "en", hasImagery = true)
        assertEquals(GroundLook(GroundTheme.Night, GroundDetail.Detailed, "en", satellite = true), look)
        val layers = GroundStyle.layers(look, hasImagery = true).associateBy { it.id }
        assertTrue(layers.getValue(GroundStyle.SATELLITE).visible)
        for (shape in listOf("landcover", "park", "water", "building", "square")) assertFalse(shape, layers.getValue(shape).visible)
        assertTrue(layers.getValue("street-major").visible)
        assertTrue(layers.getValue("city").visible)
        // Without imagery there is no layer for it.
        assertNull(GroundStyle.layers(look).firstOrNull { it.id == GroundStyle.SATELLITE })
    }

    @Test
    fun theStyleWaitsForTheTilesAddressAndNamesPlacesInOpenFreeMapsNoto() {
        val tiles = "https://tiles.openfreemap.org/planet/20261007_001001_pt/{z}/{x}/{y}.pbf"
        val waiting = Json.parseToJsonElement(GroundStyle.json(calmDay, tiles = null)).jsonObject
        assertEquals(JsonObject(emptyMap()), waiting["sources"])
        assertEquals("https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf", waiting["glyphs"]!!.jsonPrimitive.content)
        val style = Json.parseToJsonElement(GroundStyle.json(calmDay, tiles)).jsonObject
        val source = style["sources"]!!.jsonObject[GroundStyle.SOURCE]!!.jsonObject
        assertEquals(JsonArray(listOf(JsonPrimitive(tiles))), source["tiles"])
        assertEquals(14.0, source["maxzoom"]!!.jsonPrimitive.double, 0.0)
        val layers = style["layers"]!!.jsonArray.map { it.jsonObject }
        assertTrue(layers.drop(1).all { it["source"] == JsonPrimitive(GroundStyle.SOURCE) })
        val fonts = layers.mapNotNull { it["layout"]!!.jsonObject["text-font"] }.flatMap { it.jsonArray }.map { it.jsonPrimitive.content }.toSet()
        assertEquals(setOf("Noto Sans Bold", "Noto Sans Regular", "Noto Sans Italic"), fonts)
    }
}
