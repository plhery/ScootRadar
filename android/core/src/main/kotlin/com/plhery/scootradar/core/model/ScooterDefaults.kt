package com.plhery.scootradar.core.model

import java.time.Instant

// The calls the iPhone app makes on UserDefaults (ScooterReviewPrompt.swift, ScooterMapModel.swift,
// ScooterAnalytics.swift), one for one, so that the code that makes them reads as it does in Swift.

/**
 * The app's small store of settings and counts, as UserDefaults is on the iPhone. Reading a key returns
 * what was last set under it, or null (false, 0) when nothing was or something of another kind was. The
 * app keeps it in SharedPreferences; [InMemoryScooterDefaults] keeps it for tests and previews.
 */
interface ScooterDefaults {
    /** `bool(forKey:)`: false when nothing is set. */
    fun bool(forKey: String): Boolean

    /** `integer(forKey:)`: 0 when nothing is set. */
    fun integer(forKey: String): Int = int(forKey) ?: 0

    /** `object(forKey:) as? Int` */
    fun int(forKey: String): Int?

    /** `string(forKey:)` */
    fun string(forKey: String): String?

    /** `array(forKey:) as? [String]` */
    fun stringArray(forKey: String): List<String>?

    /** `data(forKey:)` */
    fun data(forKey: String): ByteArray?

    /** `object(forKey:) as? Date` */
    fun date(forKey: String): Instant?

    /** `set(_:forKey:)` with a Bool. */
    fun set(value: Boolean, forKey: String)

    /** `set(_:forKey:)` with an Int. */
    fun set(value: Int, forKey: String)

    /** `set(_:forKey:)` with a String. */
    fun set(value: String, forKey: String)

    /** `set(_:forKey:)` with a [String]. */
    fun set(value: List<String>, forKey: String)

    /** `set(_:forKey:)` with Data. */
    fun set(value: ByteArray, forKey: String)

    /** `set(_:forKey:)` with a Date. */
    fun set(value: Instant, forKey: String)

    /** `removeObject(forKey:)` */
    fun removeObject(forKey: String)
}

/** A store that lives as long as the object: for tests, previews, and a store reopened on the same one. */
class InMemoryScooterDefaults : ScooterDefaults {
    private val values = mutableMapOf<String, Any>()

    @Synchronized override fun bool(forKey: String): Boolean = values[forKey] as? Boolean ?: false

    @Synchronized override fun int(forKey: String): Int? = values[forKey] as? Int

    @Synchronized override fun string(forKey: String): String? = values[forKey] as? String

    @Synchronized override fun stringArray(forKey: String): List<String>? =
        (values[forKey] as? List<*>)?.map { it as? String ?: return null }

    @Synchronized override fun data(forKey: String): ByteArray? = (values[forKey] as? ByteArray)?.copyOf()

    @Synchronized override fun date(forKey: String): Instant? = values[forKey] as? Instant

    @Synchronized override fun set(value: Boolean, forKey: String) {
        values[forKey] = value
    }

    @Synchronized override fun set(value: Int, forKey: String) {
        values[forKey] = value
    }

    @Synchronized override fun set(value: String, forKey: String) {
        values[forKey] = value
    }

    @Synchronized override fun set(value: List<String>, forKey: String) {
        values[forKey] = value.toList()
    }

    @Synchronized override fun set(value: ByteArray, forKey: String) {
        values[forKey] = value.copyOf()
    }

    @Synchronized override fun set(value: Instant, forKey: String) {
        values[forKey] = value
    }

    @Synchronized override fun removeObject(forKey: String) {
        values.remove(forKey)
    }
}
