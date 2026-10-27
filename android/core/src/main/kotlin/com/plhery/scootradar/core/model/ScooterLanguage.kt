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
     * The language in the region of the phone, as Android makes it at launch: "fr_CH" writes 1 288
     * where "de_CH" writes 1’288.
     */
    val locale: Locale
        get() {
            val launch = launchLocale()
            if (this == atLaunch) return launch
            return Locale.Builder().setLocale(launch).setLanguage(rawValue).setScript("").build()
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
         * first of the phone's languages the app speaks. The app sets it as it starts.
         */
        @Volatile
        var atLaunch: ScooterLanguage = En

        /**
         * Locale.current: the locale of this run of the app, in the language it was launched in and the
         * phone's region and settings. The app sets where it reads it from as it starts.
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
