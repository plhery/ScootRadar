package com.plhery.scootradar.core.model

/** Which form of a counted word a number takes. */
object ScooterPlural {
    /** The language the app's strings are in: "en", "de", "fr", "it", "nl", "nb", "pt", "es" or "is". */
    val language: String get() = ScooterLanguage.current.rawValue

    /**
     * One takes the singular. In French nothing does as well: "0 trottinette"; in Icelandic, any count
     * ending in 1 but not in 11: "21 rafskúta".
     */
    fun isSingular(count: Int, language: String = ScooterPlural.language): Boolean = when (language) {
        "fr" -> count in 0..1
        "is" -> count % 10 == 1 && count % 100 != 11
        else -> count == 1
    }
}

/**
 * What the card shown where there is no scooter data says the app covers, as the web app does:
 * "ScootRadar covers 186 cities in 17 countries."
 */
object ScooterCoverageSummary {
    /**
     * Each noun takes the form Localizable.stringsdict gives its count in the language shown: "21 stað í
     * 21 landi" but "22 staði í 22 löndum" in Icelandic.
     */
    fun text(
        cities: Int = ScooterCityCatalog.cityCount,
        countries: Int = ScooterCityCatalog.countryCount,
    ): String = localizedCounting("ScootRadar covers %lld cities in %lld countries.", cities, countries)
}

enum class ScooterCountContext {
    /** Your location or the chosen place is on screen. */
    Nearby,
    OnThisMap,
    ;

    fun label(count: Int, language: String = ScooterPlural.language): String =
        when (this) {
            Nearby -> if (ScooterPlural.isSingular(count, language)) localized("scooter nearby") else localized("scooters nearby")
            OnThisMap -> if (ScooterPlural.isSingular(count, language)) localized("scooter on this map") else localized("scooters on this map")
        }
}
