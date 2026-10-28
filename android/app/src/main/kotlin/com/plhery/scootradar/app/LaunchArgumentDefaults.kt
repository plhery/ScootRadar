package com.plhery.scootradar.app

import android.os.Bundle
import com.plhery.scootradar.core.model.ScooterDefaults

/**
 * The defaults with what the app was launched with in front, as UserDefaults reads `-ScreenshotCamera …` from
 * the iPhone app's launch arguments before its own domain: in debug builds only, from the launching intent's
 * extras (`am start -e ScreenshotCamera "47.37,8.54,900,20,0" --ez ReviewPromptDue true`). What the app sets
 * is kept in `stored`, but the launch's value is read while the app runs.
 */
class LaunchArgumentDefaults(
    private val arguments: Map<String, Any>,
    private val stored: ScooterDefaults,
) : ScooterDefaults by stored {
    override fun bool(forKey: String): Boolean = when (val value = arguments[forKey]) {
        is Boolean -> value
        // As UserDefaults reads `-ReviewPromptDue YES`.
        is String -> value.equals("YES", ignoreCase = true) || value.equals("true", ignoreCase = true) ||
            (value.toIntOrNull() ?: 0) != 0
        else -> stored.bool(forKey)
    }

    override fun string(forKey: String): String? = when (val value = arguments[forKey]) {
        is String -> value
        null -> stored.string(forKey)
        else -> null
    }

    companion object {
        /**
         * Whether events go to Umami from this debug build (`--ez analytics-smoke-test true`), for an intentional
         * check that they reach ScootRadar Android (docs/analytics.md).
         */
        const val ANALYTICS_SMOKE_TEST = "analytics-smoke-test"

        /** The launch arguments the debug build reads (ScooterScreenshotCamera, the review prompt, the smoke test). */
        val keys: List<String> = listOf("ScreenshotCamera", "ScreenshotTerrain", "ReviewPromptDue", ANALYTICS_SMOKE_TEST)

        /** Those of [keys] among an intent's extras. */
        fun arguments(extras: Bundle?): Map<String, Any> {
            if (extras == null) return emptyMap()
            return keys.mapNotNull { key ->
                val value: Any? = extras.getString(key)
                    ?: if (extras.containsKey(key)) extras.getBoolean(key) else null
                value?.let { key to it }
            }.toMap()
        }
    }
}
