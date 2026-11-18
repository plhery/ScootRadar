package com.plhery.scootradar.core.api

import com.plhery.scootradar.core.model.ScooterDefaults
import java.time.Duration
import java.time.Instant
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

/**
 * Where [ScooterAPI] finds the pass its requests for scooters carry (`X-Scooter-Pass`), which tells the server the
 * genuine app asks, as the website's Turnstile pass tells it a browser does: the scooter cache collects only for those,
 * so a script asking collects nothing. Nothing is enforced yet, and a request without a pass loads as it did. The
 * fdroid build has none (ScooterAPI.pass is null): it carries no Google library to prove itself with.
 */
interface ScooterPassSource {
    /** The pass to send, or null without one that is still good. */
    fun current(): String?

    /**
     * An answer for scooters said the server saw no valid pass (`X-Scooter-Pass: none`): [api] asks it for one, in the
     * background. The request for scooters waits for none of it, and nothing that fails reaches it.
     */
    fun noPass(api: ScooterAPI)
}

/** The server's pass, and when it ends by this device's clock. */
data class ScooterPass(val value: String, val expiresAt: Instant)

/**
 * The play build's pass: a challenge from the server, Play Integrity's token with the challenge as its nonce
 * ([integrityToken]), and the pass the server gives for the token, good for a day from the network it was asked from.
 * Play gives the app 10,000 tokens a day across all its users, so a pass is asked for only when an answer says the
 * server saw none, once in 10 minutes at most from the last ask that began, across launches too, and one at a time.
 * The pass and its expiry are kept in [store], so the app relaunched on the same network asks for none: they are only
 * an expiry and the server's signature, nothing of the rider or the phone. Whatever fails leaves the app without a
 * pass, and says nothing.
 */
class ScooterPasses(
    private val integrityToken: suspend (nonce: String) -> String,
    private val store: ScooterDefaults,
    /** Where the asks run: the app's own scope, which outlives every screen. */
    private val scope: CoroutineScope,
    private val now: () -> Instant = Instant::now,
) : ScooterPassSource {
    private val lock = Any()
    private var asking: Job? = null

    override fun current(): String? {
        synchronized(lock) {
            val pass = store.string(PASS) ?: return null
            val expiresAt = store.date(EXPIRES_AT)
            if (expiresAt != null && now() < expiresAt) return pass
            store.removeObject(PASS)
            store.removeObject(EXPIRES_AT)
            return null
        }
    }

    override fun noPass(api: ScooterAPI) {
        synchronized(lock) {
            if (asking?.isActive == true) return
            val at = now()
            val asked = store.date(ASKED_AT)
            // A clock put back since lets the next ask go, rather than wait for it to catch up.
            if (asked != null && at >= asked && at < asked + INTERVAL) return
            store.set(at, ASKED_AT)
            asking = scope.launch { ask(api) }
        }
    }

    private suspend fun ask(api: ScooterAPI) {
        val pass = try {
            val challenge = api.passChallenge()
            api.passFor(challenge = challenge, integrityToken = integrityToken(challenge))
        } catch (error: CancellationException) {
            throw error
        } catch (_: Exception) {
            // No Play Store or Play services, a build Play doesn't know (a debug one, which the server refuses), the
            // server busy or offline: the app stays without a pass until the next answer that says so.
            return
        }
        synchronized(lock) {
            store.set(pass.value, PASS)
            store.set(pass.expiresAt, EXPIRES_AT)
        }
    }

    companion object {
        /** The least time between two asks. */
        val INTERVAL: Duration = Duration.ofMinutes(10)

        const val PASS = "pass"
        const val EXPIRES_AT = "passExpiresAt"
        const val ASKED_AT = "passAskedAt"
    }
}
