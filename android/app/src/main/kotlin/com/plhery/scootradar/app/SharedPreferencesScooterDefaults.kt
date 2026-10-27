package com.plhery.scootradar.app

import android.content.SharedPreferences
import androidx.core.content.edit
import com.plhery.scootradar.core.model.ScooterDefaults
import org.json.JSONArray
import org.json.JSONException
import java.time.Instant
import java.time.format.DateTimeParseException
import java.util.Base64

/**
 * The app's defaults in SharedPreferences, as UserDefaults keeps the iPhone's. Truth values and whole numbers
 * are kept as SharedPreferences' own; a string, a list of strings, data and a date as text marked with their
 * kind, so that reading one kind where another was set gives nothing, as UserDefaults does.
 */
class SharedPreferencesScooterDefaults(private val preferences: SharedPreferences) : ScooterDefaults {
    override fun bool(forKey: String): Boolean = read(forKey) { getBoolean(it, false) } ?: false

    override fun int(forKey: String): Int? = read(forKey) { getInt(it, 0) }

    override fun string(forKey: String): String? = text(forKey, STRING)

    override fun stringArray(forKey: String): List<String>? = text(forKey, ARRAY)?.let { text ->
        try {
            val array = JSONArray(text)
            (0 until array.length()).map { array.get(it) as? String ?: return null }
        } catch (_: JSONException) {
            null
        }
    }

    override fun data(forKey: String): ByteArray? = text(forKey, DATA)?.let { text ->
        try {
            Base64.getDecoder().decode(text)
        } catch (_: IllegalArgumentException) {
            null
        }
    }

    override fun date(forKey: String): Instant? = text(forKey, DATE)?.let { text ->
        try {
            Instant.parse(text)
        } catch (_: DateTimeParseException) {
            null
        }
    }

    override fun set(value: Boolean, forKey: String) = preferences.edit { putBoolean(forKey, value) }

    override fun set(value: Int, forKey: String) = preferences.edit { putInt(forKey, value) }

    override fun set(value: String, forKey: String) = preferences.edit { putString(forKey, STRING + value) }

    override fun set(value: List<String>, forKey: String) =
        preferences.edit { putString(forKey, ARRAY + JSONArray(value).toString()) }

    override fun set(value: ByteArray, forKey: String) =
        preferences.edit { putString(forKey, DATA + Base64.getEncoder().encodeToString(value)) }

    override fun set(value: Instant, forKey: String) = preferences.edit { putString(forKey, DATE + value.toString()) }

    override fun removeObject(forKey: String) = preferences.edit { remove(forKey) }

    /** What is set under the key, if it is of the kind `get` reads. */
    private inline fun <T> read(key: String, get: SharedPreferences.(String) -> T): T? {
        if (!preferences.contains(key)) return null
        return try {
            preferences.get(key)
        } catch (_: ClassCastException) {
            null
        }
    }

    /** The text set under the key as that kind. */
    private fun text(key: String, kind: String): String? =
        read(key) { getString(it, null) }?.takeIf { it.startsWith(kind) }?.substring(kind.length)

    private companion object {
        const val STRING = "s:"
        const val ARRAY = "a:"
        const val DATA = "d:"
        const val DATE = "t:"
    }
}
