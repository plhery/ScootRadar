package com.plhery.scootradar.ui.dock

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import androidx.core.net.toUri
import java.net.URI

// UIApplication.open in openRental and openOperatorApp, ios/ScootRadar/Models/ScooterModels.swift (LOG-276 to
// LOG-278).

/**
 * Opens one of a scooter's links, true if an app took it. A link in the operator's own scheme opens its app or
 * nothing. A web link goes to the operator's app first, which takes it as an App Link where it is installed, and
 * to the browser otherwise. Nothing asks Android which apps are installed (LOG-277).
 */
internal fun Context.openRentalLink(url: URI): Boolean =
    if (url.scheme == "https") openLink(url, appOnly = true) || openLink(url, appOnly = false) else openLink(url, appOnly = false)

/**
 * Opens [url] in whatever takes it; with [appOnly], only in an app other than a browser, as `.universalLinksOnly`
 * opens only an installed app. False when nothing takes it.
 */
internal fun Context.openLink(url: URI, appOnly: Boolean): Boolean {
    val intent = Intent(Intent.ACTION_VIEW, url.toString().toUri()).addCategory(Intent.CATEGORY_BROWSABLE)
    if (appOnly) intent.addFlags(Intent.FLAG_ACTIVITY_REQUIRE_NON_BROWSER)
    if (this !is Activity) intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return try {
        startActivity(intent)
        true
    } catch (_: ActivityNotFoundException) {
        false
    }
}
