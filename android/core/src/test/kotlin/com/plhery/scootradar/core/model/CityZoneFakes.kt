package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.ScooterAPIError
import kotlinx.coroutines.CompletableDeferred

// The helpers of ios/ScootRadarTests/CityZoneDownloadsTests.swift, for the downloads' tests and the map's.

internal const val berlinSource = "https://www.berlin.de/sen/uvk/verkehr/verkehrsplanung/fuss-und-radverkehr/"

/** A no-parking zone round the Tiergarten, as a city's file has it. */
internal const val berlinZone = """{"id":"berlin-no-parking-1","kind":"noParking","ring":[52.511,13.35,52.512,13.35,52.512,13.351]}"""
internal const val berlinOtherZone = """{"id":"berlin-parking-2","kind":"parking","ring":[52.513,13.36,52.5131,13.36,52.5131,13.3601]}"""

/** Berlin as the app's build lists it, vouching for no file. */
internal val berlinDownload = CityZoneDownload(
    id = "berlin", place = "Berlin", authority = "Land Berlin, DL-DE Zero", timeZone = "Europe/Berlin",
    source = berlinSource, bounds = GeoBounds(south = 52.5, west = 13.3, north = 52.6, east = 13.5),
)

/** A city's file, /zones/v1/<id>.json. */
internal fun zoneFile(id: String, zones: List<String>): ByteArray =
    "{\"id\":\"$id\",\"zones\":[\n${zones.joinToString(",\n")}\n]}\n".toByteArray()

/** A city as the index lists it, vouching for that file, round Berlin and credited to it. */
internal fun indexEntry(id: String, file: ByteArray, source: String? = null): String =
    """{"id":"$id","place":"${id.replaceFirstChar { it.uppercase() }}","authority":"Land Berlin, DL-DE Zero","timeZone":"Europe/Berlin",""" +
        """"source":{"title":"Berlin","url":"${source ?: berlinSource}"},""" +
        """"bounds":{"south":52.5,"west":13.3,"north":52.6,"east":13.5},"zones":1,"bytes":${file.size},""" +
        """"sha256":"${CityZoneFile.digest(file)}"}"""

/** /zones/v1/index.json. */
internal fun zoneIndex(entries: List<String>): ByteArray =
    "{\"format\":1,\"cities\":[\n${entries.joinToString(",\n")}\n]}\n".toByteArray()

/**
 * The website's files under /zones/v1/, by name; a name it has not is a 404. It notes each name asked for, and one it
 * holds is on its way until let go.
 */
internal class DownloadStubAPI(files: Map<String, ByteArray>) : ScooterAPIClient {
    private val files = files.toMutableMap()

    /** Answers given in turn, the last one again and again. */
    private val queued = mutableMapOf<String, List<ByteArray>>()
    private val held = mutableMapOf<String, CompletableDeferred<Unit>>()
    val asked = mutableListOf<String>()

    override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse =
        ScooterResponse(vehicles = emptyList())

    override suspend fun cityZoneFile(name: String): ByteArray {
        asked += name
        held[name]?.await()
        val answers = queued[name]
        if (answers != null && answers.isNotEmpty()) {
            if (answers.size > 1) queued[name] = answers.drop(1)
            return answers.first()
        }
        return files[name] ?: throw ScooterAPIError.HttpStatus(404)
    }

    fun queue(name: String, answers: List<ByteArray>) {
        queued[name] = answers
    }

    fun set(name: String, data: ByteArray) {
        files[name] = data
    }

    fun remove(name: String) {
        files.remove(name)
    }

    fun hold(name: String) {
        held[name] = CompletableDeferred()
    }

    fun release(name: String) {
        held.remove(name)?.complete(Unit)
    }
}
