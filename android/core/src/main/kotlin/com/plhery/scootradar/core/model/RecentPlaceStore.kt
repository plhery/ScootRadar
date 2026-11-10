package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.api.ScooterAPIJson
import kotlinx.serialization.Serializable

// The iPhone's RecentPlaceStore, which keeps the place in recent-place-v1.json in Application Support, left out of the
// iPhone's backups, with the same fields.

/**
 * Where the last place chosen in the search is kept between launches: on the device only, never sent anywhere, and
 * outside its backups. The app gives it a SharedPreferences file of its own, RecentPlace.xml, which backup_rules.xml
 * and data_extraction_rules.xml leave out, as they take only ScooterDefaults.xml; tests and previews keep it in
 * memory. The place is kept as JSON under one key; what cannot be read back as a place is removed.
 */
class RecentPlaceStore(private val defaults: ScooterDefaults = InMemoryScooterDefaults()) {
    /** The place kept, or null when none is or what is kept is not a place. */
    fun load(): MapDestination? {
        val text = defaults.string(forKey = KEY) ?: return null
        val place = try {
            ScooterAPIJson.decodeFromString(StoredPlace.serializer(), text).destination
        } catch (_: Exception) {
            null
        }
        if (place == null) defaults.removeObject(forKey = KEY)
        return place
    }

    /** Keeps [place] in place of the one kept before; null forgets it. */
    fun save(place: MapDestination?) {
        if (place == null) {
            defaults.removeObject(forKey = KEY)
        } else {
            defaults.set(ScooterAPIJson.encodeToString(StoredPlace.serializer(), StoredPlace(place)), forKey = KEY)
        }
    }

    /** The place as it is written: the iPhone's fields, with the kind as a word. */
    @Serializable
    private data class StoredPlace(
        val title: String,
        val subtitle: String,
        val latitude: Double,
        val longitude: Double,
        val kind: String,
        /**
         * Whether it had data when it was chosen, written for the iPhone's file and older versions. A feed may have
         * been added there since, or taken away: whether it has data is worked out again when the place is read, from
         * the bundled service areas, as for a place the search answers without saying (the iPhone's 9fb2c282).
         */
        val isCovered: Boolean,
    ) {
        constructor(place: MapDestination) : this(
            title = place.title,
            subtitle = place.subtitle,
            latitude = place.point.latitude,
            longitude = place.point.longitude,
            kind = if (place.kind == MapDestination.Kind.City) CITY else ADDRESS,
            isCovered = place.isCovered,
        )

        /**
         * The place, with whether it has data today, or null for a kind this version doesn't know, an empty title or a
         * point off the globe.
         */
        val destination: MapDestination?
            get() {
                val kind = when (kind) {
                    ADDRESS -> MapDestination.Kind.Address
                    CITY -> MapDestination.Kind.City
                    else -> return null
                }
                if (title.isBlank() || latitude !in -90.0..90.0 || longitude !in -180.0..180.0) return null
                return MapDestination(title = title, subtitle = subtitle, point = GeoPoint(latitude, longitude), kind = kind)
            }
    }

    private companion object {
        const val KEY = "recent-place-v1"
        const val ADDRESS = "address"
        const val CITY = "city"
    }
}
