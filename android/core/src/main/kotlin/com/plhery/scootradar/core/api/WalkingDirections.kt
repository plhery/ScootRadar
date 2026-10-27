package com.plhery.scootradar.core.api

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterCityCatalog
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.WalkRoute
import java.io.IOException
import java.math.BigDecimal
import java.util.concurrent.TimeUnit
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.putJsonArray
import okhttp3.HttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

// From ios/ScootRadar/Services/WalkingDirections.swift.

/** Finds the way on foot between two points. The site's in the app; tests hand in their own, which answers when they say so. */
interface WalkingDirectionsClient {
    /**
     * The points of the walking route, from its start to its end, which the router puts on the paths nearest
     * to the two points. Throws when there is no route, or when the task is cancelled.
     */
    suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint>
}

/** Why no way was found: too far to ask for, none on foot, the server busy, or any other trouble. */
class WalkingDirectionsError(val reason: Reason) : Exception("Walking route failed: ${reason.rawValue}") {
    enum class Reason(val rawValue: String) {
        TooFar("too_far"),

        /** The server answered without a route. */
        NoRoute("no_route"),
        Busy("busy"),
        Failed("failed"),
    }

    override fun equals(other: Any?): Boolean = other is WalkingDirectionsError && other.reason == reason

    override fun hashCode(): Int = reason.hashCode()
}

/**
 * This site's walking directions, the ones the web map gives (src/lib/walkRoute.ts). The two points go in the
 * body of a request that nothing caches; the server asks the routing service without saying who wanted it.
 */
class ScootRadarWalkingDirections(
    private val baseURL: HttpUrl = ScooterAPI.productionBaseURL,
    client: OkHttpClient = ScooterAPI.privateClient,
    /** The longest wait for the whole answer. */
    val timeout: Duration = 12.seconds,
) : WalkingDirectionsClient {
    private val http: OkHttpClient = client.newBuilder()
        .callTimeout(timeout.inWholeMilliseconds, TimeUnit.MILLISECONDS)
        .build()

    override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> {
        // The server would say so too, after a request for nothing.
        if (ScooterCityCatalog.distanceMeters(from, to) > WalkRoute.longestWalk) {
            throw WalkingDirectionsError(WalkingDirectionsError.Reason.TooFar)
        }
        val body = buildJsonObject {
            putJsonArray("from") { add(from.latitude); add(from.longitude) }
            putJsonArray("to") { add(to.latitude); add(to.longitude) }
        }
        val request = Request.Builder()
            .url(baseURL.newBuilder().addPathSegments("api/walk").build())
            .post(body.toString().encodeToByteArray().toRequestBody(jsonMediaType))
            .build()

        val response = try {
            http.fetch(request)
        } catch (error: IOException) {
            throw WalkingDirectionsError(WalkingDirectionsError.Reason.Failed)
        }
        val answer = json(response.body)
        if (response.code !in 200..299) {
            val reason = ((answer as? JsonObject)?.get("reason") as? JsonPrimitive)?.takeIf { it.isString }?.content
            throw WalkingDirectionsError(
                when {
                    reason == "too_far" -> WalkingDirectionsError.Reason.TooFar
                    reason == "no_route" -> WalkingDirectionsError.Reason.NoRoute
                    response.code == 429 || response.code == 503 -> WalkingDirectionsError.Reason.Busy
                    else -> WalkingDirectionsError.Reason.Failed
                },
            )
        }

        val path = ((answer as? JsonObject)?.get("path") as? JsonArray)?.map { point(it) ?: return failed() }
        val distance = ((answer as? JsonObject)?.get("distanceM") as? JsonPrimitive)?.takeUnless { it.isString }?.doubleOrNull
        if (path == null || distance == null) return failed()
        // A route without points is none.
        if (path.isEmpty()) throw WalkingDirectionsError(WalkingDirectionsError.Reason.NoRoute)
        return path
    }

    private fun failed(): Nothing = throw WalkingDirectionsError(WalkingDirectionsError.Reason.Failed)

    private fun json(body: ByteArray): JsonElement? = try {
        ScooterAPIJson.parseToJsonElement(body.decodeToString())
    } catch (_: SerializationException) {
        null
    }

    /** [lat, lng]: two numbers, and nothing else. */
    private fun point(element: JsonElement): GeoPoint? {
        val numbers = (element as? JsonArray)?.takeIf { it.size == 2 }?.map {
            (it as? JsonPrimitive)?.takeUnless { number -> number.isString }?.doubleOrNull?.takeIf(Double::isFinite) ?: return null
        } ?: return null
        return GeoPoint(latitude = numbers[0], longitude = numbers[1])
    }
}

/**
 * Google Maps with walking directions to the scooter or the bay, as the web links them: what Directions does
 * for a walk of more than ten kilometres or when no route was found. The link carries the destination only.
 */
val ScooterWalkTarget.mapsURL: String
    get() = "https://www.google.com/maps/dir/?api=1&destination=" +
        "${point.latitude.javaScriptDescription}%2C${point.longitude.javaScriptDescription}&travelmode=walking"

/** A coordinate as JavaScript writes it into a string: "45.75", "47", "-0.5". */
private val Double.javaScriptDescription: String
    get() = if (this == 0.0) "0" else BigDecimal.valueOf(this).stripTrailingZeros().toPlainString()
