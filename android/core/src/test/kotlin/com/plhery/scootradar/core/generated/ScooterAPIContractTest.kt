package com.plhery.scootradar.core.generated

import com.plhery.scootradar.core.api.ScooterAPIJson
import kotlinx.serialization.SerializationException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class ScooterAPIContractTest {
    private fun decode(json: String): ScooterAPIResponsePayload =
        ScooterAPIJson.decodeFromString(ScooterAPIResponsePayload.serializer(), json)

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
        assertEquals(82, vehicle.battery)
        assertEquals(12_345, vehicle.rangeMeters)
        assertEquals("abc-123", vehicle.vehicleID)
        assertEquals("limebike://vehicle/abc-123", vehicle.rentalURIs?.ios)
        assertEquals("https://lime.bike/vehicle/abc-123?platform=android", vehicle.rentalURIs?.android)
        assertEquals(ScooterRidePricingPayload(currency = "CHF", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 42), vehicle.pricing)
        assertEquals(250.5, vehicle.distanceMeters!!, 0.0)
        assertEquals(mapOf("lime" to 1), response.providers)
        assertEquals(ScooterFeedSourceStatusPayload.Fresh, response.meta.sources["hopp"])
        assertEquals(ScooterResponseModePayload.Vehicles, response.meta.mode)
        assertNull(response.meta.zoom)
        assertNull(response.lastSeen)
        assertNull(response.parking)
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
        assertEquals(13, response.meta.zoom)
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

    @Test
    fun failsWhenARequiredKeyIsMissingOrNull() {
        assertThrows(SerializationException::class.java) {
            decode("""{"vehicles": [], "clusters": [], "providers": {}}""")
        }
        assertThrows(SerializationException::class.java) {
            ScooterAPIJson.decodeFromString(ScooterVehiclePayload.serializer(), """{"provider": "lime", "lat": null, "lng": 8.5}""")
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
