package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterAPIResponsePayload
import com.plhery.scootradar.core.generated.ScooterClusterPayload
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.generated.ScooterResponseMetadataPayload
import com.plhery.scootradar.core.generated.ScooterVehiclePayload

// ScooterParking, ScooterResponse, ScooterResponseMetadata and the models of the server's answer, from
// ios/ScootRadar/Models/ScooterModels.swift.

data class ScooterParking(
    val id: String,
    val provider: String,
    val name: String,
    val latitude: Double,
    val longitude: Double,
    val mandatory: Boolean,
) {
    val coordinate: GeoPoint get() = GeoPoint(latitude, longitude)

    val providerInfo: ScooterProvider? get() = ScooterProvider.fromRawValue(provider)

    val providerName: String get() = providerInfo?.displayName ?: provider.capitalized

    /** "Dott parking bay", the title of the bay card in the dock. */
    val bayTitle: String get() = stringFormat(localized("%@ parking bay"), providerName)

    /** The card's notice: a warning when parking in a bay is mandatory, neutral otherwise. */
    val notice: String
        get() = if (mandatory) localized("You must park in a bay in this zone.") else localized("Designated scooter parking.")

    /** "Check the Dott app before you end your ride." */
    val footnote: String get() = stringFormat(localized("Check the %@ app before you end your ride."), providerName)
}

data class ScooterResponse(
    val vehicles: List<Scooter>,
    val clusters: List<ScooterCluster> = emptyList(),
    /**
     * While the server collects an app's map of this area again, the scooters and groups it saw there last
     * time, which its sweep has not reached yet. Drawn faded and counted nowhere.
     */
    val lastSeenVehicles: List<Scooter> = emptyList(),
    val lastSeenClusters: List<ScooterCluster> = emptyList(),
    val providers: Map<String, Int> = emptyMap(),
    val meta: ScooterResponseMetadata? = null,
    val parking: List<ScooterParking> = emptyList(),
    /**
     * How far the clock of this device is ahead of the server's (negative when it is behind), in seconds,
     * from the response's Date header. 0 without the header.
     */
    val clockOffset: Double = 0.0,
)

data class ScooterResponseMetadata(
    val partial: Boolean,
    val stale: Boolean = false,
    val failedSources: List<String>,
    val sources: Map<String, String> = emptyMap(),
    val generatedAt: String? = null,
    val truncated: Boolean = false,
    val totalVehicles: Int? = null,
    val mode: String? = null,
    val zoom: Int? = null,
    val overview: Boolean = false,
    val refreshAfterSeconds: Int? = null,
    /** The server is collecting feeds of this answer again: ask once more after `refreshAfterSeconds`. */
    val refreshing: Boolean = false,
    /**
     * While refreshing, when to ask again, in milliseconds: 0 while a feed quick to collect is on its way,
     * which the next request waits for. Null from a server that does not say.
     */
    val followUpMs: Int? = null,
    /** When the oldest of the last-seen scooters were seen, while there are any. */
    val lastSeenAt: String? = null,
    val parkingStatus: String? = null,
    val expiresAt: String? = null,
    val parkingExpiresAt: String? = null,
    /**
     * The feeds in view whose operator says their season is over, as Whoosh for Astana each winter:
     * "kazakhstan:whoosh_kz_nqz".
     */
    val seasonOver: Set<String> = emptySet(),
)

/** A day as the price lists give it, "2026-10-18", in digits of any script, as Swift's \d reads them. */
private val listedDay = Regex("\\p{Nd}{4}-\\p{Nd}{2}-\\p{Nd}{2}")

val ScooterVehiclePayload.model: Scooter
    get() = Scooter(
        provider = provider,
        latitude = latitude,
        longitude = longitude,
        battery = battery,
        rangeMeters = rangeMeters,
        vehicleID = vehicleID,
        deepLink = deepLink,
        rentalURIs = rentalURIs?.let { ScooterRentalURIs(ios = it.ios, android = it.android, web = it.web) },
        distanceMeters = distanceMeters,
        pricing = pricing?.let { payload ->
            val currency = payload.currency.uppercase()
            if (currency.length != 3 || currency.any { it !in 'A'..'Z' } ||
                payload.unlockFeeMinorUnits < 0 || payload.minuteFeeMinorUnits < 0
            ) {
                null
            } else {
                ScooterRidePricing(
                    currency = currency,
                    unlockFeeMinorUnits = payload.unlockFeeMinorUnits,
                    minuteFeeMinorUnits = payload.minuteFeeMinorUnits,
                    minuteFeeFrom = payload.minuteFeeFrom == true,
                    plusTax = payload.plusTax == true,
                    listedOn = payload.listedOn?.takeIf { listedDay.matches(it) },
                )
            }
        },
    )

val ScooterClusterPayload.model: ScooterCluster
    get() = ScooterCluster(id = id, latitude = latitude, longitude = longitude, count = count, providers = providers, city = city)

val ScooterResponseMetadataPayload.model: ScooterResponseMetadata
    get() = ScooterResponseMetadata(
        partial = partial,
        stale = stale,
        failedSources = failedSources,
        sources = sources.mapValues { it.value.rawValue },
        generatedAt = generatedAt,
        truncated = truncated,
        totalVehicles = totalVehicles,
        mode = mode.rawValue,
        zoom = zoom,
        overview = overview ?: false,
        refreshAfterSeconds = refreshAfterSeconds,
        refreshing = refreshing ?: false,
        followUpMs = followUpMs,
        lastSeenAt = lastSeenAt,
        parkingStatus = parkingStatus?.rawValue,
        expiresAt = expiresAt,
        parkingExpiresAt = parkingExpiresAt,
        seasonOver = seasonOver.orEmpty().toSet(),
    )

val ScooterAPIResponsePayload.model: ScooterResponse
    get() = ScooterResponse(
        vehicles = vehicles.map { it.model },
        clusters = clusters.map { it.model },
        lastSeenVehicles = lastSeen?.vehicles.orEmpty().map { it.model },
        lastSeenClusters = lastSeen?.clusters.orEmpty().map { it.model },
        providers = providers,
        meta = meta.model,
        parking = parking.orEmpty().map {
            ScooterParking(id = it.id, provider = it.provider, name = it.name, latitude = it.lat, longitude = it.lng, mandatory = it.mandatory)
        },
    )

/**
 * String.capitalized: each word with its first letter in upper case and the rest in lower case, a word
 * starting after anything but a letter or an apostrophe: "Ride_Mobility", "O'neil".
 */
internal val String.capitalized: String
    get() = buildString {
        var startsWord = true
        var index = 0
        while (index < this@capitalized.length) {
            val codePoint = this@capitalized.codePointAt(index)
            val character = String(Character.toChars(codePoint))
            if (Character.isLetter(codePoint)) {
                append(if (startsWord) character.uppercase() else character.lowercase())
                startsWord = false
            } else {
                append(character)
                startsWord = character != "'" && character != "’"
            }
            index += Character.charCount(codePoint)
        }
    }
