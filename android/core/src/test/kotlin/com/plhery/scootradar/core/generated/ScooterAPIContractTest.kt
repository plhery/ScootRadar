package com.plhery.scootradar.core.generated

import com.plhery.scootradar.core.api.ScooterAPI
import com.plhery.scootradar.core.api.ScooterAPIJson
import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.model
import java.io.File
import java.util.Locale
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class ScooterAPIContractTest {
    private val launchLocale = ScooterLanguage.launchLocale

    /** The phone's language, English whatever the host's, for the sentence a failed load shows. */
    @Before
    fun setUp() {
        ScooterLanguage.launchLocale = { Locale.US }
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    @After
    fun tearDown() {
        ScooterLanguage.launchLocale = launchLocale
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    private fun decode(json: String): ScooterAPIResponsePayload =
        ScooterAPIJson.decodeFromString(ScooterAPIResponsePayload.serializer(), json)

    /**
     * The scooters loaded from a server that answers [json] with a 200, as the map loads them: null when they load,
     * else the reason the dock gives.
     */
    private fun load(json: String): ScooterLoadFailure? = runBlocking {
        val client = OkHttpClient.Builder().addInterceptor { chain ->
            Response.Builder().request(chain.request()).protocol(Protocol.HTTP_1_1).code(200).message("OK")
                .body(json.toResponseBody("application/json".toMediaType())).build()
        }.build()
        val api = ScooterAPI(baseURL = "https://scootradar.test/".toHttpUrl(), client = client)
        try {
            api.scooters(GeoBounds(south = 47.3, west = 8.5, north = 47.4, east = 8.6), zoom = 16, minimumBattery = 0)
            null
        } catch (error: CancellationException) {
            throw error
        } catch (error: Exception) {
            ScooterLoadFailure(error)
        }
    }

    @Test
    fun decodesEveryVehicleField() {
        val response = decode(
            """
            {
              "vehicles": [{
                "provider": "lime",
                "lat": 47.3769,
                "lng": 8.5417,
                "battery": 82,
                "range_m": 12345,
                "vehicle_id": "abc-123",
                "deep_link": "https://lime.bike/vehicle/abc-123",
                "rental_uris": {
                  "ios": "limebike://vehicle/abc-123",
                  "android": "https://lime.bike/vehicle/abc-123?platform=android",
                  "web": "https://lime.bike/vehicle/abc-123"
                },
                "pricing": {
                  "currency": "CHF",
                  "unlock_fee_minor_units": 100,
                  "minute_fee_minor_units": 42
                },
                "distance_m": 250.5
              }],
              "clusters": [],
              "providers": {"lime": 1},
              "meta": {
                "partial": false,
                "stale": false,
                "failedSources": [],
                "sources": {"national": "fresh", "hopp": "fresh"},
                "generatedAt": "2026-08-05T12:00:00.000Z",
                "truncated": false,
                "totalVehicles": 1,
                "mode": "vehicles",
                "zoom": null
              }
            }
            """,
        )

        val vehicle = response.vehicles.single()
        assertEquals("lime", vehicle.provider)
        assertEquals(47.3769, vehicle.latitude, 0.0)
        assertEquals(8.5417, vehicle.longitude, 0.0)
        assertEquals(82L, vehicle.battery)
        assertEquals(12_345L, vehicle.rangeMeters)
        assertEquals("abc-123", vehicle.vehicleID)
        assertEquals("limebike://vehicle/abc-123", vehicle.rentalURIs?.ios)
        assertEquals("https://lime.bike/vehicle/abc-123?platform=android", vehicle.rentalURIs?.android)
        assertEquals(ScooterRidePricingPayload(currency = "CHF", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 42), vehicle.pricing)
        assertEquals(250.5, vehicle.distanceMeters!!, 0.0)
        assertEquals(mapOf("lime" to 1L), response.providers)
        assertEquals(ScooterFeedSourceStatusPayload.Fresh, response.meta.sources["hopp"])
        assertEquals(ScooterResponseModePayload.Vehicles, response.meta.mode)
        assertNull(response.meta.zoom)
        assertNull(response.lastSeen)
        assertNull(response.parking)
    }

    @Test
    fun readsNumbersPastThirtyTwoBitsAsSwiftsIntDoes() {
        val response = decode(
            """
            {"vehicles": [{"provider": "lime", "lat": 47.3769, "lng": 8.5417,
              "pricing": {"currency": "CHF", "unlock_fee_minor_units": 100, "minute_fee_minor_units": 3000000000}}],
             "clusters": [], "providers": {"lime": 5000000000}, "meta": {"partial": false, "stale": false,
             "failedSources": [], "sources": {}, "generatedAt": "2026-10-25T10:02:00.000Z", "truncated": false,
             "totalVehicles": 5000000000, "mode": "vehicles", "zoom": null}}
            """,
        )

        assertEquals(3_000_000_000L, response.vehicles.single().pricing?.minuteFeeMinorUnits)
        assertEquals(5_000_000_000L, response.meta.totalVehicles)
        // Held as Int past the answer, at its end.
        val model = response.model
        assertEquals(Int.MAX_VALUE, model.vehicles.single().pricing?.minuteFeeMinorUnits)
        assertEquals(Int.MAX_VALUE, model.providers["lime"])
        assertEquals(Int.MAX_VALUE, model.meta?.totalVehicles)
    }

    @Test
    fun skipsKeysItDoesNotKnow() {
        val response = decode(
            """
            {"vehicles": [], "clusters": [], "providers": {}, "future": [1, 2], "meta": {"partial": false,
             "stale": false, "failedSources": [], "sources": {}, "generatedAt": "2026-10-25T10:02:00.000Z",
             "truncated": false, "totalVehicles": 0, "mode": "clusters", "zoom": 13, "newFlag": true}}
            """,
        )

        assertTrue(response.vehicles.isEmpty())
        assertEquals(ScooterResponseModePayload.Clusters, response.meta.mode)
        assertEquals(13L, response.meta.zoom)
    }

    @Test
    fun failsOnAModeOrStatusItDoesNotKnowAsIOSDoes() {
        val meta = """"partial": false, "stale": false, "failedSources": [], "generatedAt": "2026-10-25T10:02:00.000Z",
             "truncated": false, "totalVehicles": 0"""
        assertThrows(SerializationException::class.java) {
            decode("""{"vehicles": [], "clusters": [], "providers": {}, "meta": {$meta, "sources": {}, "mode": "heatmap"}}""")
        }
        assertThrows(SerializationException::class.java) {
            decode("""{"vehicles": [], "clusters": [], "providers": {}, "meta": {$meta, "sources": {"x": "late"}, "mode": "vehicles"}}""")
        }
    }

    /**
     * LOG-027/392: Swift decodes an optional enum with decodeIfPresent, which reads a missing or null `parkingStatus`
     * as none but throws on a value it doesn't know, as on any raw value in another case: Swift's raw values are
     * matched exactly. So the answer fails to load, as one with an unknown `mode` does, and isn't shown without its
     * parking status.
     */
    @Test
    fun failsOnAParkingStatusItDoesNotKnowOrInAnotherCaseAsIOSDoes() {
        val meta = """"partial": false, "stale": false, "failedSources": [], "generatedAt": "2026-10-25T10:02:00.000Z",
             "truncated": false, "totalVehicles": 0, "zoom": 13"""
        fun answer(rest: String) = """{"vehicles": [], "clusters": [], "providers": {}, "meta": {$meta, $rest}}"""
        val sources = """"sources": {"national": "fresh"}"""

        assertEquals(
            ScooterFeedSourceStatusPayload.Stale,
            decode(answer(""""mode": "vehicles", $sources, "parkingStatus": "stale"""")).meta.parkingStatus,
        )
        assertNull(decode(answer(""""mode": "vehicles", $sources, "parkingStatus": null""")).meta.parkingStatus)
        assertNull(decode(answer(""""mode": "vehicles", $sources""")).meta.parkingStatus)

        for (rest in listOf(
            """"mode": "vehicles", $sources, "parkingStatus": "late"""",
            """"mode": "vehicles", $sources, "parkingStatus": "Stale"""",
            """"mode": "vehicles", $sources, "parkingStatus": "FAILED"""",
            """"mode": "Clusters", $sources""",
            """"mode": "vehicles", "sources": {"national": "Fresh"}""",
        )) {
            assertThrows(rest, SerializationException::class.java) { decode(answer(rest)) }
            val failure = load(answer(rest))
            assertEquals(rest, ScooterLoadFailure.Failed, failure)
            assertEquals(rest, "Couldn’t load scooters.", failure?.message)
        }
    }

    @Test
    fun failsWhenARequiredKeyIsMissingOrNull() {
        assertThrows(SerializationException::class.java) {
            decode("""{"vehicles": [], "clusters": [], "providers": {}}""")
        }
        assertThrows(SerializationException::class.java) {
            ScooterAPIJson.decodeFromString(ScooterVehiclePayload.serializer(), """{"provider": "lime", "lat": null, "lng": 8.5}""")
        }
    }

    /**
     * LOG-026: iOS's decoder fails the whole answer when its meta lacks a key the schema requires, or has it null, and
     * the dock says "Couldn’t load scooters.": none of the eight is read as a default (a `partial` taken as false, a
     * `mode` as vehicles). The ninth, `zoom`, is required but may be null, and Swift reads an optional with
     * decodeIfPresent: an answer without it loads.
     */
    @Test
    fun failsTheLoadWhenTheMetaLacksAnyKeyItRequiresAsIOSDoes() {
        val meta = linkedMapOf(
            "partial" to "false",
            "stale" to "false",
            "failedSources" to "[]",
            "sources" to """{"national": "fresh"}""",
            "generatedAt" to """"2026-10-25T10:02:00.000Z"""",
            "truncated" to "false",
            "totalVehicles" to "0",
            "mode" to """"vehicles"""",
            "zoom" to "13",
        )
        // The schema's own list, so a key it comes to require is tested too.
        val schema = Json.parseToJsonElement(File(System.getProperty("scootradar.repo"), "data/scooter-api.schema.json").readText())
        val required = schema.jsonObject.getValue("\$defs").jsonObject.getValue("ScooterResponseMeta").jsonObject
            .getValue("required").jsonArray.map { it.jsonPrimitive.content }
        assertEquals(meta.keys.toList(), required)

        fun answer(meta: Map<String, String>): String {
            val fields = meta.entries.joinToString { (key, value) -> "\"$key\": $value" }
            return """{"vehicles": [], "clusters": [], "providers": {}, "meta": {$fields}}"""
        }
        assertNull("the whole meta", load(answer(meta)))
        assertNull("without zoom", load(answer(meta - "zoom")))
        assertNull("zoom null", load(answer(meta + ("zoom" to "null"))))

        for (key in meta.keys - "zoom") {
            for ((case, json) in listOf("without $key" to answer(meta - key), "$key null" to answer(meta + (key to "null")))) {
                assertThrows(case, SerializationException::class.java) { decode(json) }
                val failure = load(json)
                assertEquals(case, ScooterLoadFailure.Failed, failure)
                assertEquals(case, "Couldn’t load scooters.", failure?.message)
            }
        }
    }

    @Test
    fun enumsKeepTheServersSpelling() {
        assertEquals(
            listOf("fresh", "stale", "partial", "failed", "skipped"),
            ScooterFeedSourceStatusPayload.entries.map { it.rawValue },
        )
        assertEquals(ScooterResponseModePayload.Clusters, ScooterResponseModePayload.fromRawValue("clusters"))
        assertNull(ScooterResponseModePayload.fromRawValue("heatmap"))
    }
}
