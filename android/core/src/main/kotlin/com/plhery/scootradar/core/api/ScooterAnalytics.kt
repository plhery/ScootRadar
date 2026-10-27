package com.plhery.scootradar.core.api

import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterLanguage
import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.put
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

// From ios/ScootRadar/Services/ScooterAnalytics.swift.

/** First-party Umami events. No advertising IDs, coordinates, addresses, or vehicle IDs. */
class ScooterAnalytics(
    /** The Umami website the events go to; without one nothing is sent. */
    private val website: String? = Companion.website,
    /** Whether this build sends at all: a release does, a debug build only when started for the smoke test. */
    private val sends: Boolean,
    /** A phone browser's user agent, from userAgent(androidVersion, chromeMajor). */
    private val userAgent: String,
    private val defaults: ScooterDefaults,
    /** Where events are sent from, one after another; the app's own, which outlives every screen. */
    private val scope: CoroutineScope,
    private val endpoint: HttpUrl = Companion.endpoint,
    client: OkHttpClient = ScooterAPI.privateClient,
) {
    private val lock = Any()
    @Volatile private var cache: String? = null
    @Volatile private var disabledByServer = false
    private var pending = 0
    private var previous: Job? = null

    // No cookies, no cache, and five seconds for the whole of each event.
    private val http: OkHttpClient = client.newBuilder()
        .cache(null)
        .cookieJar(CookieJar.NO_COOKIES)
        .callTimeout(5, TimeUnit.SECONDS)
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
        .writeTimeout(5, TimeUnit.SECONDS)
        .build()

    private val enabled: Boolean
        get() = website != null && sends && !defaults.bool(forKey = disabledKey) && !disabledByServer

    fun track(
        name: String? = null,
        provider: String? = null,
        value: Int? = null,
        result: String? = null,
        target: String? = null,
        screen: String = "/",
    ) {
        val website = website
        if (website == null || !enabled) return
        val payload = payload(name, provider = provider, value = value, result = result, target = target, screen = screen, website = website)
        val body = buildJsonObject {
            put("type", "event")
            put("payload", payload)
        }.toString().encodeToByteArray()
        synchronized(lock) {
            if (pending >= 30) return
            pending += 1
            val predecessor = previous
            previous = scope.launch {
                try {
                    predecessor?.join()
                    if (enabled) send(body)
                } finally {
                    synchronized(lock) { pending -= 1 }
                }
            }
        }
    }

    private suspend fun send(body: ByteArray) {
        val request = Request.Builder()
            .url(endpoint)
            .post(body.toRequestBody(jsonMediaType))
            .header("User-Agent", userAgent)
            .apply { cache?.let { header("x-umami-cache", it) } }
            .build()
        val response = try {
            http.fetch(request)
        } catch (_: IOException) {
            // Best effort: never block a rider or retain an offline history.
            return
        }
        if (response.code !in 200..299) return
        val result = try {
            ScooterAPIJson.parseToJsonElement(response.body.decodeToString()) as? JsonObject
        } catch (_: SerializationException) {
            null
        } ?: return
        cache = (result["cache"] as? JsonPrimitive)?.takeIf { it.isString }?.content
        // A JSON true, or a 1, as NSNumber reads it.
        val disabled = (result["disabled"] as? JsonPrimitive)?.takeUnless { it.isString }
        disabledByServer = disabled?.booleanOrNull == true || disabled?.doubleOrNull == 1.0
    }

    companion object {
        const val disabledKey = "analytics-disabled"

        /** "ScootRadar Android" in Umami, apart from the iPhone's and the website's: none yet, so nothing is sent. */
        val website: String? = null
        val endpoint: HttpUrl = "https://u.plhery.com/api/send".toHttpUrl()

        private val allowedValue = Regex("[a-zA-Z0-9_-]{1,40}")

        fun payload(
            name: String?,
            provider: String? = null,
            value: Int? = null,
            result: String? = null,
            target: String? = null,
            screen: String = "/",
            website: String,
        ): JsonObject = buildJsonObject {
            put("website", website)
            put("hostname", "scootradar.com")
            put("url", if (screen in listOf("/", "/filters", "/settings")) screen else "/")
            put("title", "ScootRadar")
            put("referrer", "")
            put("tag", "android")
            put("language", ScooterLanguage.current.locale.toLanguageTag())
            if (name != null) {
                put("name", name)
                put(
                    "data",
                    buildJsonObject {
                        put("platform", "android")
                        for ((key, entry) in listOf("provider" to provider, "result" to result, "target" to target)) {
                            if (entry != null && allowedValue.matches(entry)) put(key, entry)
                        }
                        if (value != null) put("value", value)
                    },
                )
            }
        }

        /**
         * A phone browser's own user agent, Chrome's on Android as it reduces it, without the app's name: Umami
         * drops a bare app's as a bot, and from isbot 5.2 (Umami 3.4) any with "radar" in it, so
         * "ScootRadar/1.0" lost every event.
         */
        fun userAgent(androidVersion: String, chromeMajor: Int): String =
            "Mozilla/5.0 (Linux; Android $androidVersion; K) AppleWebKit/537.36 (KHTML, like Gecko) " +
                "Chrome/$chromeMajor.0.0.0 Mobile Safari/537.36"
    }
}
