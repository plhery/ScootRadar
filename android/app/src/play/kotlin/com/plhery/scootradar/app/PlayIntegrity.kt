package com.plhery.scootradar.app

import com.google.android.play.core.integrity.IntegrityManager
import com.google.android.play.core.integrity.IntegrityTokenRequest
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine

/**
 * Play Integrity's token for the server's pass (ScooterPasses), from a classic request: the server's challenge is the
 * nonce, unchanged, as it is already URL-safe base64 of 48 bytes. No Cloud project number is set, as Play links an app
 * it distributes to the project named in the Play Console. Play's manager, from [managerOf], is made at the first ask,
 * not as the app starts.
 */
class PlayIntegrity(managerOf: () -> IntegrityManager) {
    private val manager by lazy(managerOf)

    /** The token, or Play's failure: no Play Store or Play services, the API not available, no network. */
    suspend fun token(nonce: String): String {
        val request = IntegrityTokenRequest.builder().setNonce(nonce).build()
        val task = manager.requestIntegrityToken(request)
        return suspendCancellableCoroutine { continuation ->
            // Heard on the thread Play answers on, not the main one the Task API would hand it to: the coroutine
            // goes on in its own dispatcher anyway.
            task.addOnCompleteListener(Runnable::run) { answer ->
                if (answer.isSuccessful) {
                    continuation.resume(answer.result.token())
                } else {
                    continuation.resumeWithException(answer.exception ?: IllegalStateException("Play Integrity gave no token"))
                }
            }
        }
    }
}
