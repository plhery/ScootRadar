package com.plhery.scootradar.core.model

import java.text.BreakIterator
import java.text.Normalizer
import java.util.Locale

/** The languages the app is translated into. */
enum class ScooterLanguage(
    val rawValue: String,
    /** Its name in the language itself, which is not translated. */
    val displayName: String,
) {
    De("de", "Deutsch"),
    Fr("fr", "Français"),
    It("it", "Italiano"),
    Nl("nl", "Nederlands"),
    Nb("nb", "Norsk"),
    Pt("pt", "Português"),
    Es("es", "Español"),
    Is("is", "Íslenska"),
    En("en", "English"),
    ;

    val id: String get() = rawValue

    private val sortingName: String
        get() = Normalizer.normalize(displayName, Normalizer.Form.NFD)
            .replace(Regex("\\p{Mn}+"), "")
            .lowercase(Locale.ROOT)

    /**
     * Its name in another language, as a line of a list starts: "Allemand" for German in French. Null
     * where it is its own name, as English is in English.
     */
    fun nameIn(language: ScooterLanguage): String? {
        val locale = Locale.forLanguageTag(language.rawValue)
        // Norwegian, as its own name Norsk says, not "Norwegian Bokmål".
        val code = if (this == Nb) "no" else rawValue
        val name = Locale.forLanguageTag(code).getDisplayLanguage(locale)
        if (name.isEmpty() || name == code) return null
        val first = BreakIterator.getCharacterInstance(locale).apply { setText(name) }.next()
        val capitalised = name.substring(0, first).uppercase(locale) + name.substring(first)
        return if (capitalised == displayName) null else capitalised
    }

    /**
     * The language in the region of the phone, as Locale.current makes it: "fr_CH" writes 1 288 where
     * "de_CH" writes 1’288. Its lengths and speeds are in the units chosen in Settings (ScooterUnits).
     */
    val locale: Locale get() = locale(ScooterUnits.current)

    /** The same in the units given, as the screen reads it for its own choice. */
    fun locale(units: ScooterUnits): Locale {
        val launch = launchLocale()
        if (this == atLaunch) return units.applied(launch)
        return units.applied(Locale.Builder().setLocale(launch).setLanguage(rawValue).setScript("").build())
    }

    /** Whether the language says "scooter" for Spain's "patinete" in the region. */
    fun saysScooter(region: () -> String?): Boolean =
        this == Es && region()?.let { it in latinAmericanSpanishRegions } == true

    /** Whether the language says "scooter" for Spain's "patinete" in the region. */
    fun saysScooter(region: String?): Boolean = saysScooter { region }

    /** A sentence of the app in the language as the region writes it. The region is only read for Spanish. */
    fun written(sentence: String, region: () -> String?): String {
        if (!saysScooter(region)) return sentence
        return sentence
            .replace("Patinete", "Scooter")
            .replace("patinete", "scooter")
    }

    /** A sentence of the app in the language as the region writes it. The region is only read for Spanish. */
    fun written(sentence: String, region: String?): String = written(sentence) { region }

    /** Where the strings of the language are. */
    val strings: ScooterStrings get() = loadedStrings.getValue(this)

    companion object {
        fun fromRawValue(rawValue: String): ScooterLanguage? = entries.firstOrNull { it.rawValue == rawValue }

        /** The languages as Settings lists them, by their own names: Deutsch, English, Español… */
        val byName: List<ScooterLanguage> = entries.sortedBy { it.sortingName }

        /**
         * The language of the first localization, as Android lists the ones it prefers for the app;
         * English when the app is not translated into it.
         */
        fun fromLocalizations(localizations: List<String>): ScooterLanguage =
            localizations.firstOrNull()?.let(::spoken) ?: En

        /**
         * The language Android picks for the app from a list of languages in order, such as the
         * phone's: the first the app is translated into, or else English.
         */
        fun fromPreferences(preferences: List<String>): ScooterLanguage =
            preferences.firstNotNullOfOrNull(::spoken) ?: En

        /** The language the app speaks for a language tag: "de-CH" is German; Norwegian is Bokmål. */
        private fun spoken(tag: String): ScooterLanguage? =
            when (val code = Locale.forLanguageTag(tag.replace('_', '-')).language) {
                "no", "nn" -> Nb
                else -> fromRawValue(code)
            }

        /**
         * The language Android chose for this run of the app: the one chosen in Settings, or else the
         * first of the phone's languages the app speaks. The app sets it as it starts, and again as the
         * phone's language changes, where an iPhone's app starts again.
         */
        @Volatile
        var atLaunch: ScooterLanguage = En

        /**
         * Locale.current: the locale of this run of the app, in the language it was launched in and the
         * phone's region and settings as they are now. The app sets where it reads it from as it starts.
         */
        @Volatile
        var launchLocale: () -> Locale = { Locale.getDefault() }

        @Volatile
        private var shown: ScooterLanguage? = null

        /**
         * The language the app is shown in. Choosing another in Settings changes it at once; what
         * Android itself draws follows at the next launch.
         */
        var current: ScooterLanguage
            get() = shown ?: atLaunch
            set(value) {
                shown = value
            }

        /**
         * Spanish as Mexico, the US and the rest of Latin America write it: "scooter" where Spain's
         * copy says "patinete" ("Scooter de Lime"). Both words are masculine, so the sentence around
         * the word stays as it is. The region of the phone picks it; it is not a language of its own.
         * The regions are those CLDR gives es-419 as parent; the web does the same in src/lib/i18n.tsx.
         */
        val latinAmericanSpanishRegions: Set<String> = setOf(
            "419", "AR", "BO", "BR", "BZ", "CL", "CO", "CR", "CU", "DO", "EC", "GT",
            "HN", "MX", "NI", "PA", "PE", "PR", "PY", "SV", "US", "UY", "VE",
        )

        private val loadedStrings: Map<ScooterLanguage, ScooterStrings> by lazy {
            entries.associateWith { ScooterStrings.load(it.rawValue) }
        }
    }
}

/**
 * What the language of the app follows: the phone's languages, or one chosen for the app, in its
 * Settings or in Android's.
 */
sealed interface ScooterLanguageChoice {
    data object Automatic : ScooterLanguageChoice

    data class Language(val language: ScooterLanguage) : ScooterLanguageChoice

    companion object {
        /**
         * A language when the app's own languages name one, the one shown; else Automatic. Android
         * keeps the language chosen for the app where its own Settings choose one too (LocaleManager's
         * application locales); without one, the app follows the phone's languages.
         */
        fun of(appLanguages: List<String>, shown: ScooterLanguage): ScooterLanguageChoice =
            if (appLanguages.isEmpty()) Automatic else Language(shown)
    }
}

/**
 * The units the app measures in, chosen in Settings › Units: the phone's on Automatic, as before there was a
 * choice, or kilometres or miles whatever the region and the language. A language chosen for the app keeps the
 * phone's region, so German on a phone set to the US measured in miles until there was a choice (issue #14).
 */
enum class ScooterUnits(val rawValue: String) {
    Automatic("auto"),
    Metric("metric"),
    Imperial("imperial"),
    ;

    val id: String get() = rawValue

    /**
     * The system a locale measures with in these units, where its region's own is [region]: none on Automatic,
     * which keeps the region's. Miles are written in yards under half a mile where the region writes them so, as
     * the UK and Myanmar do, and in feet everywhere else; speeds in mph.
     */
    fun measurementSystem(region: ScooterMeasurementSystem): ScooterMeasurementSystem? = when (this) {
        Automatic -> null
        Metric -> ScooterMeasurementSystem.Metric
        Imperial -> if (region == ScooterMeasurementSystem.Uk) ScooterMeasurementSystem.Uk else ScooterMeasurementSystem.Us
    }

    /**
     * The locale measuring in these units, its language and region kept: "de-CH-u-ms-ussystem" for miles in
     * Switzerland. Locale.measurementSystem reads the keyword, and so does the map's scale.
     */
    fun applied(locale: Locale): Locale {
        val regional = if (locale.getUnicodeLocaleType("ms") == null) {
            locale
        } else {
            Locale.Builder().setLocale(locale).setUnicodeLocaleKeyword("ms", null).build()
        }
        val system = measurementSystem(regional.measurementSystem) ?: return locale
        if (system == locale.measurementSystem) return locale
        return Locale.Builder().setLocale(locale).setUnicodeLocaleKeyword("ms", system.keyword).build()
    }

    /** Its segment in Settings: "Auto", and "km" and "mi" as every language writes them. */
    val label: String
        get() = when (this) {
            Automatic -> localized("Automatic")
            Metric -> "km"
            Imperial -> "mi"
        }

    /** What TalkBack reads for its segment: Auto as the whole word, which "Auto" alone is not in every language. */
    val spokenLabel: String
        get() = when (this) {
            Automatic -> localized("Automatic (spoken)")
            Metric -> localized("Kilometres")
            Imperial -> localized("Miles")
        }

    companion object {
        fun fromRawValue(rawValue: String): ScooterUnits? = entries.firstOrNull { it.rawValue == rawValue }

        /**
         * The units the app measures in now. Choosing others in Settings changes them at once, everywhere a length
         * or a speed is written.
         */
        @Volatile
        var current: ScooterUnits = Automatic
    }
}

/**
 * A string of the app in the language it is shown in, as String(localized:) is on the iPhone: the key
 * is the English sentence, with %@ for each string and %lld for each whole number put in it.
 * `localized("Updated %@", time)` is `String(localized: "Updated \(time)")`. Its numbers are written
 * as the phone's locale writes them.
 */
fun localized(key: String, vararg arguments: Any?): String {
    val language = ScooterLanguage.current
    val text = language.strings.format(key, arguments.asList(), ScooterLanguage.launchLocale())
    return language.written(text) { language.locale.country.ifEmpty { null } }
}

/**
 * The same, for a sentence about counts whose words Localizable.stringsdict puts in the form each
 * count takes. That form follows the rules of the language shown, not the one of the launch: "21 stað"
 * in Icelandic, where English rules give "21 staði".
 */
fun localizedCounting(key: String, vararg arguments: Any?): String {
    val language = ScooterLanguage.current
    val locale = language.locale
    val text = language.strings.format(key, arguments.asList(), locale)
    return language.written(text) { locale.country.ifEmpty { null } }
}

/**
 * The string set apart from the sentence it is put in, where it has letters written right to left: a
 * Hebrew name followed by " · 4 min walk" would otherwise draw the dot and the number into its own
 * run. Its direction is that of its first letter. A string written left to right is left as it is; the
 * app is, in every language it has.
 */
val String.isolated: String
    get() = if (codePoints().anyMatch(::isRightToLeft)) "\u2068$this\u2069" else this

/** A letter of Hebrew, Arabic, Syriac, Thaana or N'Ko, or one of their presentation forms. */
private fun isRightToLeft(codePoint: Int): Boolean =
    codePoint in 0x0590..0x08FF || codePoint in 0xFB1D..0xFDFF || codePoint in 0xFE70..0xFEFC
