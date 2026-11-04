package com.plhery.scootradar.core.model

// MapDestination, ScooterLocationIssue, ScooterSearchBarState and AppleMapStyle from
// ios/ScootRadar/Models/ScooterModels.swift.

data class MapDestination(
    val title: String,
    /** The second line of a recent place; may be empty. */
    val subtitle: String,
    val point: GeoPoint,
    val kind: Kind,
    /** False when no operator serves the place: nothing may promise scooters there. */
    val isCovered: Boolean,
) {
    enum class Kind {
        Address,

        /** A covered city: the map shows the whole city rather than one street. */
        City,
    }

    val id: String get() = "$title|${point.latitude.swiftDescription}|${point.longitude.swiftDescription}"

    companion object {
        operator fun invoke(
            title: String,
            subtitle: String = "",
            point: GeoPoint,
            kind: Kind = Kind.Address,
            isCovered: Boolean? = null,
        ): MapDestination = MapDestination(
            title = title,
            subtitle = subtitle,
            point = point,
            kind = kind,
            // Without the search's own answer the bundled service areas decide.
            isCovered = isCovered ?: ScooterCityCatalog.contains(point),
        )
    }
}

/** The dismissible card under the search bar when locating did not work. */
enum class ScooterLocationIssue {
    /** Refused: "Location is off", with Open Settings and Search a place. */
    Denied,

    /** Restricted on this device: Search a place only. */
    Restricted,

    /** No position in time: Try again. */
    NotFound,
    ;

    val title: String? get() = if (this == Denied) localized("Location is off") else null

    val message: String
        get() = when (this) {
            Denied -> localized("Turn it on in Settings, or search a place instead.")
            Restricted -> localized("Location is restricted on this device. Search a place instead.")
            NotFound -> localized("Couldn’t find your location.")
        }

    val canOpenSettings: Boolean get() = this == Denied
    val canSearchPlace: Boolean get() = this != NotFound
    val canRetry: Boolean get() = this == NotFound
}

/** What the collapsed search bar shows. */
sealed interface ScooterSearchBarState {
    /**
     * No place chosen: search icon and "Search city or address". Also once you are located: the dot on the
     * map says where you are.
     */
    data object Empty : ScooterSearchBarState

    /**
     * A searched place: its title / "Scooters near this place", with a clear button. A place no operator
     * serves gets the neutral second line instead.
     */
    data class Place(val destination: MapDestination) : ScooterSearchBarState

    /** A spinner and "Finding your location…". */
    data object Locating : ScooterSearchBarState

    val title: String
        get() = when (this) {
            Empty -> localized("Search city or address")
            is Place -> destination.title
            Locating -> localized("Finding your location…")
        }

    /** The second line; null when there is only one. */
    val subtitle: String?
        get() = when (this) {
            // "Scooters near this place" would be untrue where there is no scooter data.
            is Place -> if (destination.isCovered) {
                localized("Scooters near this place")
            } else {
                localized("Tap to search a city or address")
            }
            Empty, Locating -> null
        }

    val accessibilityLabel: String
        get() = when (this) {
            is Place -> if (destination.isCovered) {
                stringFormat(localized("Showing scooters near %@"), destination.title.isolated)
            } else {
                // Where no operator shares data, the place alone: no scooters to announce.
                title
            }
            Empty, Locating -> title
        }

    /**
     * What tapping the bar does, for TalkBack to say after its label; null where the label says it, as "Search city or
     * address" does. The iPhone's hint, "Searches for another place", in the words TalkBack puts after its own for a
     * double tap, "Double-tap to search for another place" (ui.md UI-327).
     */
    val accessibilityHint: String?
        get() = when (this) {
            is Place -> localized("search for another place")
            Empty, Locating -> null
        }
}

/**
 * The ground under the dots. Quiet is flat and muted, without points of interest or traffic, so nothing on
 * it competes with the scooters. The map's own configuration of each is the app's.
 */
enum class AppleMapStyle(val rawValue: String) {
    Standard("standard"),
    Quiet("quiet"),
    Satellite("satellite"),
    ;

    val id: String get() = rawValue

    val label: String
        get() = when (this) {
            Standard -> localized("Standard")
            Quiet -> localized("Quiet")
            Satellite -> localized("Satellite")
        }

    companion object {
        fun fromRawValue(rawValue: String): AppleMapStyle? = entries.firstOrNull { it.rawValue == rawValue }
    }
}
