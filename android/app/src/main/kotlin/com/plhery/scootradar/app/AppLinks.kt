package com.plhery.scootradar.app

import android.content.Intent
import android.net.Uri
import androidx.core.net.toUri
import com.plhery.scootradar.core.model.ScooterMapLink

// The universal links of ios/ScootRadar/Views/ScooterMapScreen.swift's onOpenURL (ui.md UI-377, X-AD08), as App
// Links: the manifest's filter takes scootradar.com's /map, and its "/" for the links of before the landing page.

/** What a link the phone opened in the app is: one to the map, or a page of the site that is the browser's. */
sealed interface AppLink {
    data class Map(val link: ScooterMapLink) : AppLink

    /** "/" without an origin: the landing page, which the filter can't tell from a link to the map. */
    data class Page(val uri: Uri) : AppLink

    companion object {
        /** Null for an intent that opens no link: the launcher's. */
        fun of(intent: Intent): AppLink? {
            if (intent.action != Intent.ACTION_VIEW) return null
            val uri = intent.data ?: return null
            val link = ScooterMapLink(uri.toString()) ?: return Page(uri)
            // The site's apple-app-site-association sends the iPhone "/" only with an origin; the map's other
            // parameters alone stay on the web.
            val root = uri.path.isNullOrEmpty() || uri.path == "/"
            return if (root && uri.getQueryParameter("origin").isNullOrEmpty()) Page(uri) else Map(link)
        }

        /**
         * The page in the browser, and not in this app again, whose filter would take it back: the activity is
         * the one any web address opens, which no app with its own site's filter is.
         */
        fun browser(uri: Uri): Intent = Intent(Intent.ACTION_VIEW, uri)
            .addCategory(Intent.CATEGORY_BROWSABLE)
            .apply { selector = Intent(Intent.ACTION_VIEW, "https:".toUri()).addCategory(Intent.CATEGORY_BROWSABLE) }
    }
}
