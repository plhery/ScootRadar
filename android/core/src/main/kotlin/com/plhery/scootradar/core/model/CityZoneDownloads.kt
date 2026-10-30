package com.plhery.scootradar.core.model

// ios/ScootRadar/Models/CityZoneDownloads.swift.

/**
 * A city whose zones the app downloads rather than has built in (docs/city-zone-downloads.md): as the index at
 * /zones/v1/index.json lists it, or as data/city-zones.json had it when the app was built.
 */
data class CityZoneDownload(
    val id: String,
    /** "Berlin", as the legend names it while its zones are not drawn. */
    val place: String,
    /** Who sets its zones, as the legend names them. */
    val authority: String,
    val timeZone: String,
    /** Where they say so, an https address. */
    val source: String,
    /** Around all its zones. */
    val bounds: GeoBounds,
    /** The SHA-256 of its file, in hex: null in the list built into the app, which vouches for no file. */
    val sha256: String? = null,
) {
    /** The name of its file under /zones/v1/. */
    val fileName: String get() = "$id.json"
}
