package com.plhery.scootradar.map

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.io.IOException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

// groundTileUrl from src/lib/quietGround.ts, and the ground's retries from src/components/MapComponent.tsx.

/**
 * Where the ground's vector tiles are. OpenFreeMap's address carries the date of its build, so it is asked for
 * once for the screen, as the web asks once per visit; a failure is not remembered, so the next try asks again.
 */
class GroundTiles(
    /** The status and the body of a GET of an address. */
    private val fetch: suspend (String) -> Answer,
) {
    class Answer(val status: Int, val body: String)

    class Failure(message: String) : Exception(message)

    private val lock = Mutex()

    /** The address, once it has been had. */
    var known: String? = null
        private set

    /** The {z}/{x}/{y} address of the tiles. */
    suspend fun url(): String = lock.withLock { known ?: ask().also { known = it } }

    /** The address, asked for again after each failure until it can be had (MAP-014). */
    suspend fun urlWhenReachable(): String {
        var attempt = 0
        while (true) {
            try {
                return url()
            } catch (error: CancellationException) {
                throw error
            } catch (_: Exception) {
                delay(retryDelay(attempt))
                attempt += 1
            }
        }
    }

    private suspend fun ask(): String {
        val answer = fetch(GroundStyle.TILE_INDEX_URL)
        if (answer.status !in 200..299) throw Failure("Map tiles: ${answer.status}")
        val index = Json.parseToJsonElement(answer.body) as? JsonObject
        val url = ((index?.get("tiles") as? JsonArray)?.firstOrNull() as? JsonPrimitive)?.takeIf { it.isString }?.content
        if (url == null || !TILE_URL_PATTERN.matches(url)) throw Failure("Map tiles: unexpected address")
        return url
    }

    companion object {
        private val TILE_URL_PATTERN = Regex("""https://tiles\.openfreemap\.org/[\w./-]*\{z\}/\{x\}/\{y\}\.pbf""")

        /** The ground is asked for again after these waits when its address cannot be had, then every 30 s. */
        val RETRY_DELAYS: List<Duration> = listOf(2.seconds, 5.seconds, 15.seconds, 30.seconds)

        fun retryDelay(attempt: Int): Duration = RETRY_DELAYS[minOf(attempt, RETRY_DELAYS.lastIndex)]

        /** OpenFreeMap's, asked through the app's client. */
        fun openFreeMap(client: OkHttpClient): GroundTiles = GroundTiles { url -> client.get(url) }

        private suspend fun OkHttpClient.get(url: String): Answer = suspendCancellableCoroutine { continuation ->
            val call = newCall(Request.Builder().url(url).header("Accept", "application/json").build())
            continuation.invokeOnCancellation { call.cancel() }
            call.enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    continuation.resumeWithException(e)
                }

                override fun onResponse(call: Call, response: Response) {
                    val answer = try {
                        response.use { Answer(it.code, it.body.string()) }
                    } catch (error: IOException) {
                        onFailure(call, error)
                        return
                    }
                    continuation.resume(answer)
                }
            })
        }
    }
}
