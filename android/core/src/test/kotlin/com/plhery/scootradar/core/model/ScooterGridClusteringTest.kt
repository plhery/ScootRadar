package com.plhery.scootradar.core.model

import java.io.File
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.double
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

// The web's clustering tests (src/lib/clustering.test.ts, "web clustering"), and the port held to what the web's
// own clusterVehicles makes of the same scooters.
class ScooterGridClusteringTest {
    private fun vehicle(id: String, provider: String, latitude: Double, longitude: Double) = Scooter(
        provider = provider,
        latitude = latitude,
        longitude = longitude,
        battery = 80,
        rangeMeters = 10_000,
        vehicleID = id,
    )

    @Test
    fun clustersThroughZoom15AndSeparatesScootersAboveIt() {
        assertTrue(ScooterGridClustering.shouldCluster(14.0))
        assertTrue(ScooterGridClustering.shouldCluster(15.0))
        assertFalse(ScooterGridClustering.shouldCluster(16.0))
        // The iPhone's threshold is the same.
        assertEquals(ScooterClusteringPolicy.maximumClusterZoom, ScooterGridClustering.maximumClusterZoom)
    }

    @Test
    fun rejectsInvalidZoomValues() {
        assertFalse(ScooterGridClustering.shouldCluster(Double.NaN))
        assertFalse(ScooterGridClustering.shouldCluster(Double.POSITIVE_INFINITY))
    }

    @Test
    fun groupsNearbyVehiclesIntoDeterministicProviderAwareCells() {
        val result = ScooterGridClustering.cluster(
            listOf(
                vehicle("lime-1", "lime", 47.37690, 8.54170),
                vehicle("lime-2", "lime", 47.37691, 8.54171),
                vehicle("voi-1", "voi", 47.37692, 8.54172),
                vehicle("far-away", "bird", 47.39, 8.57),
            ),
            zoom = 15.0,
        )

        assertEquals(listOf("far-away"), result.scooters.map { it.vehicleID })
        assertEquals(1, result.clusters.size)
        val cluster = result.clusters[0]
        assertEquals(3, cluster.count)
        assertEquals(mapOf("lime" to 2, "voi" to 1), cluster.providers)
        assertTrue(cluster.id, Regex("^15:\\d+:\\d+$").matches(cluster.id))
        assertEquals(47.37691, cluster.latitude, 5e-6)
        assertEquals(8.54171, cluster.longitude, 5e-6)
        // The app keeps the scooters of each cluster, to fit them on a tap and to read them out.
        assertEquals(listOf("lime-1", "lime-2", "voi-1"), result.members.getValue(cluster.id).map { it.vehicleID })
    }

    @Test
    fun returnsRawVehiclesAboveTheClusteringThreshold() {
        val vehicles = listOf(
            vehicle("lime-1", "lime", 47.3769, 8.5417),
            vehicle("lime-2", "lime", 47.37691, 8.54171),
        )

        assertEquals(ClusteredScooters(vehicles, emptyList(), emptyMap()), ScooterGridClustering.cluster(vehicles, zoom = 16.0))
    }

    @Test
    fun idsAreOrderedAsTheWebOrdersThem() {
        // localeCompare puts the colon before the digits, and the hyphen before both.
        assertTrue(ScooterGridClustering.localeCompare("15:999:1", "15:9990:1") < 0)
        assertTrue(ScooterGridClustering.localeCompare("1:3:-1", "1:3:1") < 0)
        assertTrue(ScooterGridClustering.localeCompare("14.5:1:2", "14:1:2") > 0)
        assertTrue(ScooterGridClustering.localeCompare("12:0:7207", "12:0:7207") == 0)
        assertTrue(ScooterGridClustering.localeCompare("12:0:720", "12:0:7207") < 0)
    }

    @Test
    fun makesWhatTheWebMakesOfTheSameScooters() {
        val web = Json.parseToJsonElement(File(System.getProperty("scootradar.webClustering")).readText()).jsonObject
        val vehicles = web.getValue("vehicles").jsonArray.map { it.jsonObject }.map {
            vehicle(it.text("vehicle_id"), it.text("provider"), it.number("lat"), it.number("lng"))
        }
        val results = web.getValue("results").jsonArray.map { it.jsonObject }
        assertEquals(9, results.size)
        var clustered = 0
        for (result in results) {
            val zoom = result.number("zoom")
            val port = ScooterGridClustering.cluster(vehicles, zoom)
            assertEquals("alone at $zoom", result.getValue("vehicles").jsonArray.map { it.jsonPrimitive.content }, port.scooters.map { it.vehicleID })
            val expected = result.getValue("clusters").jsonArray.map { it.jsonObject }.map { cluster ->
                ScooterCluster(
                    id = cluster.text("id"),
                    latitude = cluster.number("lat"),
                    longitude = cluster.number("lng"),
                    count = cluster.getValue("count").jsonPrimitive.int,
                    providers = cluster.getValue("providers").jsonObject.mapValues { it.value.jsonPrimitive.int },
                )
            }
            // The same cells, in the same order, at the same places to the last digit.
            assertEquals("clusters at $zoom", expected, port.clusters)
            for (cluster in port.clusters) assertEquals(cluster.count, port.members.getValue(cluster.id).size)
            clustered += port.clusters.size
        }
        assertTrue(clustered > 100)
    }

    private fun JsonObject.text(key: String): String = getValue(key).jsonPrimitive.content
    private fun JsonObject.number(key: String): Double = getValue(key).jsonPrimitive.double
}
