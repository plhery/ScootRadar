package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.api.ScooterAPIJson
import kotlinx.serialization.Serializable

// The iPhone's RecentPlaceStore, which keeps the place in recent-place-v1.json in Application Support, left out of the
// iPhone's backups, with the same fields and the build that wrote them.

/**
 * Where the last place chosen in the search is kept between launches: on the device only, never sent anywhere, and
 * outside its backups. The app gives it a SharedPreferences file of its own, RecentPlace.xml, which backup_rules.xml
 * and data_extraction_rules.xml leave out, as they take only ScooterDefaults.xml; tests and previews keep it in
 * memory. The place is kept as JSON under one key; what cannot be read back as a place is removed.
 */
class RecentPlaceStore(
    private val defaults: ScooterDefaults = InMemoryScooterDefaults(),
    /** The app's version code, written beside the place: a "No data" it wrote itself, it reads as it wrote it. */
    private val build: String = "",
) {
    /** The place kept, or null when none is or what is kept is not a place. */
    fun load(): MapDestination? {
        val text = defaults.string(forKey = KEY) ?: return null
        val place = try {
            ScooterAPIJson.decodeFromString(StoredPlace.serializer(), text).destination(readBy = build)
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
            defaults.set(ScooterAPIJson.encodeToString(StoredPlace.serializer(), StoredPlace(place, build)), forKey = KEY)
        }
    }

    /** The place as it is written: the iPhone's fields, with the kind as a word, and the build that wrote it. */
    @Serializable
    private data class StoredPlace(
        val title: String,
        val subtitle: String,
        val latitude: Double,
        val longitude: Double,
        val kind: String,
        /**
         * Whether it had data when it was chosen: the search's answer, from the service areas of that day, or the
         * bundled ones where it gave none.
         */
        val isCovered: Boolean,
        /** The build that wrote it, its version code; none from the builds before it was written (to 10). */
        val build: String? = null,
    ) {
        constructor(place: MapDestination, build: String) : this(
            title = place.title,
            subtitle = place.subtitle,
            latitude = place.point.latitude,
            longitude = place.point.longitude,
            kind = if (place.kind == MapDestination.Kind.City) CITY else ADDRESS,
            isCovered = place.isCovered,
            build = build,
        )

        /**
         * The place, or null for a kind this version doesn't know, an empty title or a point off the globe. A place
         * kept as having data has it, whichever build kept it: a town the search knew from that day's service areas
         * still has data, where the bundled ones, older than the town's feed, would say "No data" (Desk [372], and
         * [373] S-5 for every build, as the iPhone's f589bebb). One kept as having none has none where the build
         * reading it kept it; read by another build, or kept by one before the field, it is worked out again from the
         * bundled service areas, as for a place the search answers without saying (the iPhone's 9fb2c282): a feed may
         * have been added there since, as Hopp's in Manama. A feed taken away still shows as having data, as the user
         * chose.
         */
        fun destination(readBy: String): MapDestination? {
            val kind = when (kind) {
                ADDRESS -> MapDestination.Kind.Address
                CITY -> MapDestination.Kind.City
                else -> return null
            }
            if (title.isBlank() || latitude !in -90.0..90.0 || longitude !in -180.0..180.0) return null
            return MapDestination(
                title = title,
                subtitle = subtitle,
                point = GeoPoint(latitude, longitude),
                kind = kind,
                isCovered = isCovered.takeIf { it == true || build == readBy },
            )
        }
    }

    private companion object {
        const val KEY = "recent-place-v1"
        const val ADDRESS = "address"
        const val CITY = "city"
    }
}
