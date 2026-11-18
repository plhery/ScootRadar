package com.plhery.scootradar.app

import android.content.Context
import com.google.android.play.core.integrity.IntegrityManager
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.plhery.scootradar.core.api.ScooterPassSource
import com.plhery.scootradar.core.api.ScooterPasses
import kotlinx.coroutines.CoroutineScope

/**
 * The server's pass in the build for Google Play, which the app proves itself genuine for with Play Integrity
 * ([PlayIntegrity]), asked for in [scope]. The pass is kept in ScooterPass.xml, which no backup takes: it is good only
 * from the network it was asked from. The fdroid flavor's StorePass has none.
 */
internal fun storePassSource(
    context: Context,
    scope: CoroutineScope,
    managerOf: () -> IntegrityManager = { IntegrityManagerFactory.create(context.applicationContext) },
): ScooterPassSource? = ScooterPasses(
    integrityToken = PlayIntegrity(managerOf)::token,
    store = SharedPreferencesScooterDefaults(context.getSharedPreferences("ScooterPass", Context.MODE_PRIVATE)),
    scope = scope,
)
