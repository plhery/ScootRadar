package com.plhery.scootradar.app

import android.app.Activity
import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.google.android.gms.tasks.Task
import com.google.android.gms.tasks.TaskCompletionSource
import com.google.android.gms.tasks.Tasks
import com.google.android.play.core.integrity.IntegrityDialogRequest
import com.google.android.play.core.integrity.IntegrityManager
import com.google.android.play.core.integrity.IntegrityTokenRequest
import com.google.android.play.core.integrity.IntegrityTokenResponse
import com.plhery.scootradar.core.api.ScooterAPI
import com.plhery.scootradar.core.api.ScooterPasses
import com.plhery.scootradar.core.model.GeoBounds
import java.io.IOException
import java.util.Collections
import kotlin.concurrent.thread
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.joinAll
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test
import org.junit.runner.RunWith

/**
 * The play build's pass for the server (StorePass): Play Integrity's classic token, asked with the server's challenge
 * as its nonce, unchanged and with no Cloud project number, as Play links the app to the project in the Play Console;
 * and whatever Play fails with leaves the app without a pass and the scooters as ever. A fake IntegrityManager stands
 * in for Play, and an interceptor for the server.
 */
@RunWith(AndroidJUnit4::class)
class PlayIntegrityTest {
    private val context: Context = ApplicationProvider.getApplicationContext()
    private val job = SupervisorJob()
    private val escaped: MutableList<Throwable> = Collections.synchronizedList(mutableListOf())
    private val scope = CoroutineScope(job + Dispatchers.IO + CoroutineExceptionHandler { _, error -> escaped += error })

    /** Play's manager, its requests kept, answering each with [answer]. */
    private class FakeIntegrityManager(private val answer: () -> Task<IntegrityTokenResponse>) : IntegrityManager {
        val requests: MutableList<IntegrityTokenRequest> = Collections.synchronizedList(mutableListOf())

        override fun requestIntegrityToken(request: IntegrityTokenRequest): Task<IntegrityTokenResponse> {
            requests += request
            return answer()
        }

        override fun showDialog(request: IntegrityDialogRequest): Task<Int> = Tasks.forException(UnsupportedOperationException())
    }

    private class Token(private val value: String) : IntegrityTokenResponse() {
        override fun token(): String = value

        override fun showDialog(activity: Activity, requestCode: Int): Task<Int> = Tasks.forException(UnsupportedOperationException())
    }

    @After
    fun tearDown() {
        job.cancel()
    }

    /** The app's server, made as the app starts, has the play build's source. */
    @Test
    fun theAppsServerHasThePlaySource() {
        assertTrue(ApplicationProvider.getApplicationContext<ScooterApplication>().container.api.pass is ScooterPasses)
    }

    @Test
    fun theChallengeIsTheNonceUnchangedWithNoCloudProject() = runBlocking<Unit> {
        val manager = FakeIntegrityManager { Tasks.forResult(Token("play-token")) }
        var made = 0
        val integrity = PlayIntegrity { made += 1; manager }
        // Play's manager is made at the first ask, not as the app starts.
        assertEquals(0, made)
        assertEquals("play-token", integrity.token(CHALLENGE))
        assertEquals("play-token", integrity.token(CHALLENGE))
        assertEquals(1, made)
        assertEquals(listOf(CHALLENGE, CHALLENGE), manager.requests.map { it.nonce() })
        assertNull(manager.requests.first().cloudProjectNumber())
    }

    /** Play answers later, on a thread of its own, as it does on a phone. */
    @Test
    fun aLateAnswerIsWaitedFor() = runBlocking<Unit> {
        val answer = TaskCompletionSource<IntegrityTokenResponse>()
        val integrity = PlayIntegrity { FakeIntegrityManager { answer.task } }
        thread { Thread.sleep(50); answer.setResult(Token("late-token")) }
        assertEquals("late-token", integrity.token(CHALLENGE))
    }

    @Test
    fun playsFailureIsThrown() = runBlocking<Unit> {
        val failure = IllegalStateException("Play Store not found")
        val integrity = PlayIntegrity { FakeIntegrityManager { Tasks.forException(failure) } }
        try {
            integrity.token(CHALLENGE)
            fail("Play's failure gave a token")
        } catch (error: IllegalStateException) {
            // Coroutines' debug mode, on in the tests, throws a copy that names the original as its cause.
            assertTrue(error === failure || error.cause === failure)
        }
    }

    /**
     * The play build's source, from an answer saying the server saw no pass to the next request carrying one: Play
     * was given the challenge and the server Play's token, and the pass is kept in ScooterPass.xml.
     */
    @Test
    fun theStoresSourceAsksPlayAndKeepsThePass() = runBlocking<Unit> {
        val manager = FakeIntegrityManager { Tasks.forResult(Token("play-token")) }
        val server = Server()
        val api = ScooterAPI(baseURL = BASE, client = server.client, pass = storePassSource(context, scope) { manager })
        api.scooters(bounds = bounds, zoom = 16)
        job.children.toList().joinAll()
        api.scooters(bounds = bounds, zoom = 16)

        assertEquals(
            listOf("GET /api/scooters", "GET /api/pass/challenge", "POST /api/pass", "GET /api/scooters"),
            server.requests.map { "${it.method} ${it.url.encodedPath}" },
        )
        assertEquals(listOf(CHALLENGE), manager.requests.map { it.nonce() })
        assertEquals(
            Json.parseToJsonElement("""{"platform":"android","challenge":"$CHALLENGE","integrityToken":"play-token"}"""),
            Json.parseToJsonElement(server.bodies.single()),
        )
        assertNull(server.requests[0].header("X-Scooter-Pass"))
        assertEquals("pass.signature", server.requests[3].header("X-Scooter-Pass"))
        val kept = context.getSharedPreferences("ScooterPass", Context.MODE_PRIVATE)
        assertEquals("pass.signature", SharedPreferencesScooterDefaults(kept).string(ScooterPasses.PASS))
        assertTrue(escaped.isEmpty())
    }

    /** No Play Store, or the server refusing a debug build's token, or the network: no pass, and the scooters load. */
    @Test
    fun aFailingAskLeavesTheScootersAsEver() = runBlocking<Unit> {
        val failures = listOf(
            Server() to FakeIntegrityManager { Tasks.forException(IllegalStateException("Play Store not found")) },
            Server(passStatus = 403) to FakeIntegrityManager { Tasks.forResult(Token("debug-token")) },
            Server(lost = true) to FakeIntegrityManager { Tasks.forResult(Token("play-token")) },
        )
        for ((index, failure) in failures.withIndex()) {
            val (server, manager) = failure
            context.getSharedPreferences("ScooterPass", Context.MODE_PRIVATE).edit().clear().commit()
            val api = ScooterAPI(baseURL = BASE, client = server.client, pass = storePassSource(context, scope) { manager })
            assertTrue("$index", api.scooters(bounds = bounds, zoom = 16).vehicles.isEmpty())
            job.children.toList().joinAll()
            assertTrue("$index", api.scooters(bounds = bounds, zoom = 16).vehicles.isEmpty())
            assertNull("$index", server.requests.last().header("X-Scooter-Pass"))
        }
        assertTrue(escaped.toString(), escaped.isEmpty())
    }

    /** The server's contract, answered in the client: the scooters say no pass was seen. */
    private class Server(private val passStatus: Int = 200, private val lost: Boolean = false) {
        val requests: MutableList<Request> = Collections.synchronizedList(mutableListOf())
        val bodies: MutableList<String> = Collections.synchronizedList(mutableListOf())

        val client: OkHttpClient = OkHttpClient.Builder().addInterceptor { chain ->
            val request = chain.request()
            requests += request
            request.body?.let { body -> bodies += Buffer().also(body::writeTo).readUtf8() }
            val path = request.url.encodedPath
            if (lost && path.startsWith("/api/pass")) throw IOException("no network")
            val (code, text) = when (path) {
                "/api/scooters" -> 200 to EMPTY_SCOOTERS
                "/api/pass/challenge" -> 200 to """{"challenge":"$CHALLENGE"}"""
                "/api/pass" -> passStatus to """{"pass":"pass.signature","expiresAt":${System.currentTimeMillis() / 1_000 + 86_400}}"""
                else -> 404 to ""
            }
            Response.Builder().request(request).protocol(Protocol.HTTP_1_1).code(code).message("")
                .apply { if (path == "/api/scooters") header("X-Scooter-Pass", "none") }
                .body(text.toResponseBody()).build()
        }.build()
    }

    private companion object {
        val BASE = "https://scootradar.test/".toHttpUrl()
        val bounds = GeoBounds(south = 47.36, west = 8.5, north = 47.4, east = 8.6)

        /** 48 bytes as URL-safe base64 without padding, as the server gives them. */
        const val CHALLENGE = "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4v"

        const val EMPTY_SCOOTERS =
            """{"vehicles":[],"clusters":[],"providers":{},"meta":{"partial":false,"stale":false,"failedSources":[],"sources":{},"generatedAt":"2026-11-18T12:00:00.000Z","truncated":false,"totalVehicles":0,"mode":"vehicles","zoom":null}}"""
    }
}
