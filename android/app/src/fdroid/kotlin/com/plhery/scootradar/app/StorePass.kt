package com.plhery.scootradar.app

import android.content.Context
import com.plhery.scootradar.core.api.ScooterPassSource
import kotlinx.coroutines.CoroutineScope

/**
 * None in the build for F-Droid's catalog, which takes no library that isn't free software, as Google Play's Integrity
 * library isn't: the requests for scooters carry no pass, and an answer saying the server saw none asks for nothing.
 * The play flavor's StorePass asks Play Integrity.
 */
@Suppress("UNUSED_PARAMETER")
internal fun storePassSource(context: Context, scope: CoroutineScope): ScooterPassSource? = null
