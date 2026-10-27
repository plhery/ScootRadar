package com.plhery.scootradar.core.api

import com.plhery.scootradar.core.generated.ScooterAPIResponsePayload
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterZoneArea
import com.plhery.scootradar.core.model.ScooterZoneResponse
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.model
import java.io.IOException
import java.math.BigDecimal
import java.math.RoundingMode
import java.net.SocketTimeoutException
import java.time.DateTimeException
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneOffset
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import okhttp3.Call
import okhttp3.Callback
import okhttp3.CookieJar
import okhttp3.Headers
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response

// From ios/ScootRadar/Services/ScooterAPI.swift.

interface ScooterAPIClient {
    suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse

    /** The operators' zones that reach into the area. A client that knows no zones has none to give. */
    suspend fun zonesIn(area: ScooterZoneArea): ScooterZoneResponse =
        ScooterZoneResponse(zones = emptyList(), pending = false, truncated = false)
}

class ScooterAPI(
    private val baseURL: HttpUrl = productionBaseURL,
    val client: OkHttpClient = privateClient,
    /**
     * Whether the phone has no network that reaches the internet just now, which tells a request that could
     * not reach the server apart as offline: the app asks ConnectivityManager. Without it, such a request
     * has failed.
     */
    private val isOffline: () -> Boolean = { false },
) : ScooterAPIClient {
    // A request waits 20 seconds at most for the server: to connect, and between bytes.
    private val http: OkHttpClient = client.newBuilder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()

    override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse {
        val response = get(
            "api/scooters",
            listOf(
                "south" to fiveDecimals(bounds.south),
                "west" to fiveDecimals(bounds.west),
                "north" to fiveDecimals(bounds.north),
                "east" to fiveDecimals(bounds.east),
                "zoom" to zoom.toString(),
                "minBattery" to minimumBattery.toString(),
            ),
        )
        // The server's times are compared with this device's clock, which may be wrong.
        val clockOffset = clockOffset(dateHeader = response.headers["Date"], receivedAt = Instant.now())

        return decoded(response) { text ->
            ScooterAPIJson.decodeFromString(ScooterAPIResponsePayload.serializer(), text).model.copy(clockOffset = clockOffset)
        }
    }

    override suspend fun zonesIn(area: ScooterZoneArea): ScooterZoneResponse {
        val response = get("api/zones", area.queryItems)
        return decoded(response) { text -> ScooterAPIJson.decodeFromString(ScooterZoneResponse.serializer(), text) }
    }

    /** The answer read off the main thread; anything that cannot be read is invalid data. */
    private suspend fun <T> decoded(response: ScooterHTTPResponse, read: (String) -> T): T = try {
        withContext(Dispatchers.Default) { read(response.body.decodeToString()) }
    } catch (error: CancellationException) {
        throw error
    } catch (error: Exception) {
        throw ScooterAPIError.InvalidData(error)
    }

    /** A GET to the app's server, with what went wrong told apart as the dock reports it. */
    private suspend fun get(path: String, query: List<Pair<String, String>>): ScooterHTTPResponse {
        val url = baseURL.newBuilder().addPathSegments(path).apply {
            for ((name, value) in query) addQueryParameter(name, value)
        }.build()
        val request = Request.Builder().url(url).header("Accept", "application/json").build()

        val response = try {
            http.fetch(request)
        } catch (error: CancellationException) {
            throw error
        } catch (error: SocketTimeoutException) {
            throw ScooterAPIError.TimedOut()
        } catch (error: IOException) {
            throw if (isOffline()) ScooterAPIError.Offline() else ScooterAPIError.Network(error)
        }

        if (response.code !in 200..299) throw ScooterAPIError.HttpStatus(response.code)
        return response
    }

    companion object {
        val productionBaseURL: HttpUrl = "https://scootradar.com".toHttpUrl()

        /**
         * The client for the app's own server. A request for scooters carries the bounds of the map, which give
         * away the rider's position or the place searched, and the answers may be cached: this client keeps
         * nothing on disk, no cache and no cookies, as the privacy notice promises.
         */
        val privateClient: OkHttpClient by lazy {
            OkHttpClient.Builder().cache(null).cookieJar(CookieJar.NO_COOKIES).build()
        }

        /**
         * How far the clock of this device is ahead of the server's (negative when it is behind), in seconds,
         * from the Date header of a response and the moment it arrived; 0 without a readable header, as on the
         * web. The header counts whole seconds and the response took a moment to arrive, so a right clock gives
         * a second or two, not 0.
         */
        fun clockOffset(dateHeader: String?, receivedAt: Instant): Double {
            if (dateHeader == null) return 0.0
            // "Mon, 12 Oct 2026 10:00:00 GMT"
            val sentAt = httpDate(dateHeader) ?: return 0.0
            return (receivedAt.epochSecond - sentAt.epochSecond) + (receivedAt.nano - sentAt.nano) / 1e9
        }

        private val months = listOf(
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december",
        )
        private val weekdays = listOf("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
        private val httpDatePattern = Regex(
            """[ \t]*([A-Za-z]+)[ \t]*,[ \t]+(\d+)[ \t]+([A-Za-z]+)[ \t]+(\d+)[ \t]+(\d+)[ \t]*:[ \t]*(\d+)[ \t]*:[ \t]*(\d+)[ \t]+(\S+)[ \t]*""",
        )

        /** The zones en_US_POSIX reads by name, in hours from GMT. */
        private val namedZones = mapOf(
            "GMT" to 0, "UTC" to 0, "UT" to 0, "Z" to 0,
            "EST" to -5, "EDT" to -4, "CST" to -6, "CDT" to -5, "MST" to -7, "MDT" to -6, "PST" to -8, "PDT" to -7,
            "AKST" to -9, "AKDT" to -8, "HST" to -10, "AST" to -4,
        )
        private val offsetPattern = Regex("""(GMT|UTC|UT)?([+-])(\d{1,2})(:?)(\d{2})?""")

        /**
         * A date as Foundation reads "EEE, dd MMM yyyy HH:mm:ss zzz" in en_US_POSIX: the weekday in full or cut to
         * three letters or fewer, not checked against the date; the month in full or short; either in any case;
         * the zone by name, or as an offset, after GMT only with a colon. Null for anything else.
         */
        private fun httpDate(text: String): Instant? {
            val match = httpDatePattern.matchEntire(text) ?: return null
            val (weekday, day, monthName, year, hour, minute, second, zone) = match.destructured
            if (weekdays.none { it.equals(weekday, ignoreCase = true) || (weekday.length <= 3 && it.startsWith(weekday, ignoreCase = true)) }) {
                return null
            }
            val month = months.indexOfFirst { it.equals(monthName, ignoreCase = true) || it.take(3).equals(monthName, ignoreCase = true) }
            if (month < 0) return null
            val offsetSeconds = namedZones[zone.uppercase()]?.let { it * 3_600 } ?: run {
                val (prefix, sign, hours, colon, minutes) = offsetPattern.matchEntire(zone)?.destructured ?: return null
                if (prefix == "GMT" && minutes.isNotEmpty() && colon.isEmpty()) return null
                val h = hours.toInt()
                val m = minutes.ifEmpty { "0" }.toInt()
                if (h > 23 || m > 59) return null
                (if (sign == "-") -1 else 1) * (h * 3_600 + m * 60)
            }
            val numbers = listOf(year, day, hour, minute, second).map { it.toIntOrNull() ?: return null }
            if (numbers[0] < 1) return null
            val local = try {
                LocalDateTime.of(
                    LocalDate.of(numbers[0], month + 1, numbers[1]),
                    LocalTime.of(numbers[2], numbers[3], numbers[4]),
                )
            } catch (_: DateTimeException) {
                return null
            }
            return Instant.ofEpochSecond(local.toEpochSecond(ZoneOffset.UTC) - offsetSeconds)
        }

        /**
         * String(format: "%.5f", value): five decimals of the exact value, rounded to the nearest and to the even
         * digit on a tie, as printf rounds, and "-0.00000" for a negative value that rounds to nothing.
         */
        internal fun fiveDecimals(value: Double): String {
            if (value.isNaN()) return "nan"
            if (value.isInfinite()) return if (value > 0) "inf" else "-inf"
            val text = BigDecimal(value).setScale(5, RoundingMode.HALF_EVEN).toPlainString()
            return if ((value < 0 || 1 / value < 0) && !text.startsWith("-")) "-$text" else text
        }
    }
}

/** Why loading scooters failed. Web and iOS show the same sentence for each reason. */
enum class ScooterLoadFailure(val rawValue: String) {
    Offline("offline"),
    Timeout("timeout"),
    /** HTTP 429. */
    Busy("busy"),
    /** HTTP 5xx. */
    Unavailable("unavailable"),
    Failed("failed"),
    ;

    val message: String
        get() = when (this) {
            Offline -> localized("You’re offline. Check your connection.")
            Timeout -> localized("ScootRadar took too long to respond.")
            Busy -> localized("ScootRadar is busy right now. Try again in a moment.")
            Unavailable -> localized("ScootRadar is having trouble. Try again in a moment.")
            Failed -> localized("Couldn’t load scooters.")
        }

    companion object {
        fun fromRawValue(rawValue: String): ScooterLoadFailure? = entries.firstOrNull { it.rawValue == rawValue }

        operator fun invoke(error: Throwable): ScooterLoadFailure = (error as? ScooterAPIError)?.loadFailure ?: Failed
    }
}

sealed class ScooterAPIError(message: String, cause: Throwable? = null) : Exception(message, cause) {
    class InvalidURL : ScooterAPIError("invalidURL")

    class Offline : ScooterAPIError("offline")

    class TimedOut : ScooterAPIError("timedOut")

    class InvalidResponse : ScooterAPIError("invalidResponse")

    class HttpStatus(val statusCode: Int) : ScooterAPIError("httpStatus($statusCode)")

    class InvalidData(cause: Throwable) : ScooterAPIError("invalidData", cause)

    class Network(cause: Throwable) : ScooterAPIError("network", cause)

    val loadFailure: ScooterLoadFailure
        get() = when {
            this is Offline -> ScooterLoadFailure.Offline
            this is TimedOut -> ScooterLoadFailure.Timeout
            this is HttpStatus && statusCode == 429 -> ScooterLoadFailure.Busy
            this is HttpStatus && statusCode in 500..599 -> ScooterLoadFailure.Unavailable
            else -> ScooterLoadFailure.Failed
        }
}

/** What came back from a server: the status, the headers and the whole body. */
internal class ScooterHTTPResponse(val code: Int, val headers: Headers, val body: ByteArray)

internal val jsonMediaType: MediaType = "application/json".toMediaType()

/**
 * The request, its answer read to the end on OkHttp's threads. Cancelling the coroutine cancels the call and
 * throws the cancellation, never the failure of the call it ended; a call that ran out of time fails.
 */
internal suspend fun OkHttpClient.fetch(request: Request): ScooterHTTPResponse = suspendCancellableCoroutine { continuation ->
    val call = newCall(request)
    continuation.invokeOnCancellation { call.cancel() }
    call.enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
            continuation.resumeWithException(e)
        }

        override fun onResponse(call: Call, response: Response) {
            val read = try {
                response.use { ScooterHTTPResponse(it.code, it.headers, it.body.bytes()) }
            } catch (error: IOException) {
                onFailure(call, error)
                return
            }
            continuation.resume(read)
        }
    })
}
