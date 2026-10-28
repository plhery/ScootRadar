package com.plhery.scootradar

import com.plhery.scootradar.core.api.ScooterAnalytics
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonObject
import okhttp3.Dispatcher
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import java.util.concurrent.AbstractExecutorService
import java.util.concurrent.TimeUnit

/** An event as Umami got it: its name, none for a page view, its data but the platform, and the screen it was on. */
data class TrackedEvent(
    val name: String?,
    val provider: String? = null,
    val value: Int? = null,
    val result: String? = null,
    val target: String? = null,
    val url: String = "/",
)

/**
 * The app's analytics as :core's tests have them (ScooterMapControllerFakes.kt): a ScooterAnalytics that sends
 * each event as it is tracked, on the caller's thread, to a client that keeps it and answers it itself. Nothing
 * reaches the network.
 */
class RecordingAnalytics {
    private val bodies = mutableListOf<JsonObject>()

    val events: List<TrackedEvent>
        get() = bodies.map { body ->
            val payload = body.getValue("payload").jsonObject
            val data = payload["data"]?.jsonObject
            fun string(key: String): String? = (data?.get(key) as? JsonPrimitive)?.takeIf { it.isString }?.content
            TrackedEvent(
                name = (payload["name"] as? JsonPrimitive)?.content,
                provider = string("provider"),
                value = (data?.get("value") as? JsonPrimitive)?.int,
                result = string("result"),
                target = string("target"),
                url = (payload["url"] as? JsonPrimitive)?.content ?: "/",
            )
        }

    /** The names of the events, in order. */
    val names: List<String?> get() = events.map { it.name }

    val analytics = ScooterAnalytics(
        website = "test-website",
        sends = true,
        userAgent = ScooterAnalytics.userAgent(androidVersion = "16", chromeMajor = 141),
        defaults = InMemoryScooterDefaults(),
        scope = CoroutineScope(Dispatchers.Unconfined),
        client = OkHttpClient.Builder()
            // A call runs on the thread that makes it, so an event is sent before track returns.
            .dispatcher(Dispatcher(DirectExecutorService()))
            .addInterceptor { chain ->
                val request = chain.request()
                val body = Buffer().also { request.body?.writeTo(it) }.readUtf8()
                bodies += Json.parseToJsonElement(body).jsonObject
                Response.Builder()
                    .request(request)
                    .protocol(Protocol.HTTP_1_1)
                    .code(200)
                    .message("")
                    .body("{}".toResponseBody("application/json".toMediaType()))
                    .build()
            }
            .build(),
    )

    private class DirectExecutorService : AbstractExecutorService() {
        override fun execute(command: Runnable) = command.run()

        override fun shutdown() = Unit

        override fun shutdownNow(): List<Runnable> = emptyList()

        override fun isShutdown(): Boolean = false

        override fun isTerminated(): Boolean = false

        override fun awaitTermination(timeout: Long, unit: TimeUnit): Boolean = true
    }
}
