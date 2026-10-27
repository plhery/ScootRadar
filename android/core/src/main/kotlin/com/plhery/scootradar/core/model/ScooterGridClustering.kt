package com.plhery.scootradar.core.model

import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin

// clusterVehicles and shouldClusterAtZoom from the web's src/lib/clustering.ts (MAP-139).

/** The scooters left on their own, and the clusters the others make, with the scooters in each. */
data class ClusteredScooters(
    val scooters: List<Scooter>,
    val clusters: List<ScooterCluster>,
    /** The scooters of each cluster, by the cluster's id, in the order they came. */
    val members: Map<String, List<Scooter>>,
)

/**
 * The grid the app gathers its scooters in while zoomed out, as the web does. The iPhone has MapKit's own
 * clustering, which merges markers whose circles collide and can't be reproduced (MAP-303).
 */
object ScooterGridClustering {
    /** The closest zoom at which scooters are gathered, in the 256-unit zoom of the web and the server. */
    const val maximumClusterZoom: Int = 15

    private const val tileSize = 256.0
    private const val maximumMercatorLatitude = 85.05112878

    fun shouldCluster(zoom: Double): Boolean = zoom.isFinite() && zoom <= maximumClusterZoom

    /** Fixed cells keep the ids the same when a padded viewport changes how many scooters it holds. */
    fun cellSize(zoom: Double): Double = if (zoom >= 15) 56.0 else if (zoom >= 13) 64.0 else 80.0

    /**
     * The scooters in cells of the world at a zoom: a cell holding one keeps it on its own, a cell holding more
     * is a cluster at their mean place, named by the zoom and the cell, that counts them by provider. Above the
     * clustering zoom every scooter is on its own.
     */
    fun cluster(scooters: List<Scooter>, zoom: Double): ClusteredScooters {
        if (!shouldCluster(zoom)) return ClusteredScooters(scooters, emptyList(), emptyMap())

        val cellSize = cellSize(zoom)
        val zoomName = jsNumber(zoom)
        val cells = LinkedHashMap<String, MutableList<Scooter>>()
        for (scooter in scooters) {
            val (x, y) = worldPixel(scooter.latitude, scooter.longitude, zoom)
            val key = "$zoomName:${jsNumber(floor(x / cellSize))}:${jsNumber(floor(y / cellSize))}"
            cells.getOrPut(key) { mutableListOf() } += scooter
        }

        val singletons = mutableListOf<Scooter>()
        val clusters = mutableListOf<ScooterCluster>()
        val members = HashMap<String, List<Scooter>>()
        for ((id, cell) in cells) {
            if (cell.size == 1) {
                singletons += cell[0]
                continue
            }
            val providers = LinkedHashMap<String, Int>()
            var latitude = 0.0
            var longitude = 0.0
            for (scooter in cell) {
                latitude += scooter.latitude
                longitude += scooter.longitude
                providers[scooter.provider] = (providers[scooter.provider] ?: 0) + 1
            }
            clusters += ScooterCluster(
                id = id,
                latitude = latitude / cell.size,
                longitude = longitude / cell.size,
                count = cell.size,
                providers = providers,
            )
            members[id] = cell
        }

        clusters.sortWith { first, second -> localeCompare(first.id, second.id) }
        return ClusteredScooters(singletons, clusters, members)
    }

    private fun worldPixel(latitude: Double, longitude: Double, zoom: Double): Pair<Double, Double> {
        val worldSize = tileSize * 2.0.pow(zoom)
        val clamped = max(-maximumMercatorLatitude, min(maximumMercatorLatitude, latitude))
        val sine = sin(clamped * PI / 180)
        return Pair(
            (longitude + 180) / 360 * worldSize,
            (0.5 - ln((1 + sine) / (1 - sine)) / (4 * PI)) * worldSize,
        )
    }

    /** A number as JavaScript writes it into a string: a whole number without its ".0". */
    private fun jsNumber(value: Double): String =
        if (value.isFinite() && value == floor(value) && abs(value) < 1e15) value.toLong().toString() else value.toString()

    /**
     * String.localeCompare of the clusters' ids, as ICU's root collation orders their characters: the hyphen,
     * then the colon, then the full stop, then the digits, where a plain comparison puts the colon after the
     * digits. "15:999:1" comes before "15:9990:1".
     */
    internal fun localeCompare(first: String, second: String): Int {
        val length = min(first.length, second.length)
        for (index in 0 until length) {
            val difference = rank(first[index]) - rank(second[index])
            if (difference != 0) return difference
        }
        return first.length - second.length
    }

    private fun rank(character: Char): Int = when (character) {
        '-' -> 0
        ':' -> 1
        '.' -> 2
        in '0'..'9' -> 3 + (character - '0')
        else -> 13 + character.code
    }
}
