package com.plhery.scootradar.core.api

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterCityCatalog
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterStartPlace
import com.plhery.scootradar.core.model.swiftDescription
import java.util.concurrent.TimeUnit
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

// From ios/ScootRadar/Services/AddressSearchAPI.swift.

@Serializable(with = AddressSearchResult.Serializer::class)
@ConsistentCopyVisibility
data class AddressSearchResult private constructor(
    val latitude: Double,
    val longitude: Double,
    val displayName: String,
    val title: String,
    /** May be empty; hide the second line when it is. */
    val subtitle: String,
    /** False when no operator serves this place: show the "No data" tag. */
    val isCovered: Boolean,
) {
    val id: String get() = "${latitude.swiftDescription}:${longitude.swiftDescription}:$displayName"

    val destination: MapDestination
        get() {
            val point = GeoPoint(latitude = latitude, longitude = longitude)
            return MapDestination(
                title = title,
                subtitle = subtitle,
                point = point,
                // A typed city with scooter data shows the whole city, like its chip.
                kind = if (ScooterCityCatalog.city(centredAt = point) == null) MapDestination.Kind.Address else MapDestination.Kind.City,
                isCovered = isCovered,
            )
        }

    data class Lines(val title: String, val subtitle: String)

    companion object {
        /**
         * Responses without `title` or `covered` fall back to splitting `displayName` and to the bundled service
         * areas.
         */
        operator fun invoke(
            latitude: Double,
            longitude: Double,
            displayName: String,
            title: String? = null,
            subtitle: String? = null,
            isCovered: Boolean? = null,
        ): AddressSearchResult {
            val trimmedTitle = title?.trim(::isWhitespaceOrNewline) ?: ""
            val lines = if (trimmedTitle.isEmpty()) {
                lines(fromDisplayName = displayName)
            } else {
                Lines(title = trimmedTitle, subtitle = subtitle?.trim(::isWhitespaceOrNewline) ?: "")
            }
            return AddressSearchResult(
                latitude = latitude,
                longitude = longitude,
                displayName = displayName,
                title = lines.title,
                subtitle = lines.subtitle,
                isCovered = isCovered ?: ScooterCityCatalog.contains(latitude = latitude, longitude = longitude),
            )
        }

        private val houseNumber = Regex("""\p{Nd}+[a-zA-Z]?(?:[-/]\p{Nd}+[a-zA-Z]?)?""")
        private val postalCode = Regex("""[\t\n\f\r\p{Z}]+(?:CH-)?\p{Nd}{4}[\t\n\f\r\p{Z}]+\p{L}""")

        /** Splits a plain label such as "Bahnhofstrasse 1 8001 Zürich" into two lines. */
        fun lines(fromDisplayName: String): Lines {
            val name = fromDisplayName.trim(::isWhitespaceOrNewline)
            val components = name.split(",")
                .map { it.trim(::isWhitespace) }
                .filter { it.isNotEmpty() }

            if (components.size > 1) {
                if (houseNumber.matches(components[0])) {
                    return Lines("${components[1]} ${components[0]}", components.drop(2).joinToString(", "))
                }
                return Lines(components[0], components.drop(1).joinToString(", "))
            }

            // Without commas, the postal code starts the second line: "Bahnhofstrasse 1 8001 Zürich".
            val postalCode = postalCode.find(name)
            if (postalCode != null) {
                return Lines(
                    name.substring(0, postalCode.range.first),
                    name.substring(postalCode.range.first).trim(::isWhitespace),
                )
            }
            return Lines(name, "")
        }

        /** CharacterSet.whitespaces: the space separators and the tab. */
        private fun isWhitespace(character: Char): Boolean =
            character == '\t' || character.category == CharCategory.SPACE_SEPARATOR

        /** CharacterSet.whitespacesAndNewlines: those and the line and paragraph breaks. */
        private fun isWhitespaceOrNewline(character: Char): Boolean =
            isWhitespace(character) || character in '\n'..'\r' || character == '\u0085' ||
                character == '\u2028' || character == '\u2029'
    }

    /**
     * Reads a result as the iPhone does: the place and its label must be there, while a title, subtitle or
     * coverage of the wrong type counts as missing.
     */
    internal object Serializer : KSerializer<AddressSearchResult> {
        override val descriptor: SerialDescriptor = JsonObject.serializer().descriptor

        override fun deserialize(decoder: Decoder): AddressSearchResult {
            val json = decoder.decodeSerializableValue(JsonObject.serializer())
            fun number(key: String): Double =
                (json[key] as? JsonPrimitive)?.takeUnless { it.isString }?.doubleOrNull
                    ?: throw SerializationException("$key is not a number")
            fun string(key: String): String? = (json[key] as? JsonPrimitive)?.takeIf { it.isString }?.content
            return AddressSearchResult(
                latitude = number("lat"),
                longitude = number("lng"),
                displayName = string("display_name") ?: throw SerializationException("display_name is not a string"),
                title = string("title"),
                subtitle = string("subtitle"),
                isCovered = (json["covered"] as? JsonPrimitive)?.takeUnless { it.isString }?.booleanOrNull,
            )
        }

        override fun serialize(encoder: Encoder, value: AddressSearchResult): Unit =
            throw SerializationException("Search results are only read")
    }
}

interface AddressSearchAPIClient {
    /**
     * `near` is the map centre, rounded, when the map shows a city or less: places near it come first. Null
     * leaves the order to the server.
     */
    suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult>
}

class AddressSearchAPI(
    private val baseURL: HttpUrl = ScooterAPI.productionBaseURL,
    val client: OkHttpClient = ScooterAPI.privateClient,
    /**
     * The country of the phone's time zone, whose places come first without a map centre; null where the
     * zone says none, and Switzerland's then do.
     */
    private val homeCountry: String? = ScooterStartPlace.country(forTimeZone = ScooterDateFormat.timeZone().id),
) : AddressSearchAPIClient {
    @Serializable
    private class SearchRequest(
        val q: String,
        val lang: String,
        /** Latitude and longitude, left out when there is no centre to send. */
        val near: List<Double>? = null,
        /** The country of the phone's time zone, sent only without a centre. */
        val country: String? = null,
    )

    // A search waits 12 seconds at most for the server: to connect, and between bytes. Nothing is kept, and a
    // search is not sent again on a dropped connection: URLSession replays no POST, and each counts against the
    // server's limit.
    internal val http: OkHttpClient = client.newBuilder()
        .cache(null)
        .cookieJar(CookieJar.NO_COOKIES)
        .retryOnConnectionFailure(false)
        .connectTimeout(12, TimeUnit.SECONDS)
        .readTimeout(12, TimeUnit.SECONDS)
        .writeTimeout(12, TimeUnit.SECONDS)
        .build()

    override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> {
        val body = ScooterAPIJson.encodeToString(
            SearchRequest.serializer(),
            SearchRequest(
                q = query,
                lang = language,
                near = near?.let { listOf(it.latitude, it.longitude) },
                country = if (near == null) homeCountry else null,
            ),
        )
        val request = Request.Builder()
            .url(baseURL.newBuilder().addPathSegments("api/geocode").build())
            .post(body.encodeToByteArray().toRequestBody(jsonMediaType))
            .header("Accept", "application/json")
            .build()

        val response = http.fetch(request)
        if (response.code == 429) {
            val seconds = response.headers["Retry-After"]?.let(::swiftDouble)
            throw AddressSearchAPIError.RateLimited(
                // Swift's Duration.seconds traps on an infinite wait ("1e400"); here it is no wait.
                retryAfter = seconds?.let { if (it >= 0 && it.isFinite()) it.seconds else null },
            )
        }
        if (response.code !in 200..299) throw AddressSearchAPIError.InvalidResponse()

        return try {
            withContext(Dispatchers.Default) {
                ScooterAPIJson.decodeFromString(ListSerializer(AddressSearchResult.serializer()), response.body.decodeToString())
            }
        } catch (error: CancellationException) {
            throw error
        } catch (error: IllegalArgumentException) {
            throw AddressSearchAPIError.InvalidResponse()
        }
    }

    private companion object {
        private val decimal = Regex("""[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?""")

        /** Double(String) for a number written in decimals; null for anything else. */
        fun swiftDouble(text: String): Double? = if (decimal.matches(text)) text.toDouble() else null
    }
}

sealed class AddressSearchAPIError(message: String) : Exception(message) {
    class InvalidResponse : AddressSearchAPIError("invalidResponse") {
        override fun equals(other: Any?): Boolean = other is InvalidResponse

        override fun hashCode(): Int = 1
    }

    /**
     * HTTP 429: too many searches in a minute, which typing alone can reach. `retryAfter` is the server's
     * Retry-After, when it names seconds.
     */
    class RateLimited(val retryAfter: Duration?) : AddressSearchAPIError("rateLimited(retryAfter: $retryAfter)") {
        override fun equals(other: Any?): Boolean = other is RateLimited && other.retryAfter == retryAfter

        override fun hashCode(): Int = retryAfter.hashCode()
    }
}
