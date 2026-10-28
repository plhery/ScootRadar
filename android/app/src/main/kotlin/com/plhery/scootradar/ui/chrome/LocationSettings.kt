package com.plhery.scootradar.ui.chrome

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings

// The location card's Open Settings and Try again (ios/ScootRadar/Views/ScooterControls.swift's LocationIssueCard,
// ui.md UI-162 and UI-164), where Android's settings differ from the iPhone's (X-AD11, X-AD12).

/** What the location card asks of the phone besides the controller: where its Settings go, and how it tries again. */
interface LocationSettings {
    /**
     * Open Settings: the phone's own location switch while it is off, else the app's page with its permission.
     * The iPhone has one page for both.
     */
    fun settingsIntent(context: Context): Intent

    /** Try again: [locate] the rider, after asking for whatever would let a fix be found. */
    fun retry(locate: () -> Unit)

    companion object {
        /** The app's page in Settings, and Try again as it is: for a phone with no location service of its own, as in tests. */
        val appPage: LocationSettings = object : LocationSettings {
            override fun settingsIntent(context: Context): Intent = appSettings(context.packageName)

            override fun retry(locate: () -> Unit) = locate()
        }

        /** The app's page in Android's Settings, where its location permission is. */
        fun appSettings(packageName: String): Intent = Intent(
            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.fromParts("package", packageName, null),
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

        /** The phone's location switch, for a phone with location turned off. */
        fun locationSwitch(): Intent =
            Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
}
