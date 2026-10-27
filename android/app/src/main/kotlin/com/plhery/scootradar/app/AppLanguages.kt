package com.plhery.scootradar.app

import android.content.Context
import android.content.res.Configuration
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.app.LocaleManagerCompat
import androidx.core.os.LocaleListCompat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import java.util.Locale

/**
 * The phone's languages and the app's own, where Android keeps them: the system's locales, which a language
 * chosen for the app leaves as they are, and the app's locales, which AppCompat keeps itself on Android 12 and
 * LocaleManager from Android 13 on (X-AD14).
 */
class AppLanguages(private val context: Context) {
    /**
     * The phone's languages, most preferred first, as BCP 47 tags: the system's, as the iPhone's are, not the
     * app's. Locale.getDefault() and LocaleList.getDefault() turn to a language chosen for the app.
     */
    fun phoneLanguages(): List<String> = LocaleManagerCompat.getSystemLocales(context).tags

    /** The languages chosen for the app, in its Settings or Android's: none when it follows the phone. */
    fun appLanguages(): List<String> = AppCompatDelegate.getApplicationLocales().tags

    /**
     * Keeps a language chosen in the app's Settings where Android reads the app's language at launch: one tag,
     * or none for Automatic. Android's own text follows it at once; the app's follows the choice itself.
     */
    fun keep(tags: List<String>) {
        AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tags.joinToString(",")))
    }

    /**
     * Locale.current: the locale of this run of the app, in the language it was launched in and the phone's
     * region and settings. Set as the app starts, it stays so until the next launch, as the iPhone's does.
     */
    @Volatile
    var launchLocale: Locale = Locale.getDefault()
        private set

    private var hasLaunched = false

    /**
     * Reads the language Android chose for this run, from the `configuration` of the first activity, where
     * AppCompat has put a language chosen for the app on Android 12: the first of its languages the app
     * speaks. Later activities of the same run, such as one recreated, leave it as it was.
     */
    fun launched(configuration: Configuration) {
        if (hasLaunched) return
        hasLaunched = true
        val language = ScooterLanguage.fromPreferences(LocaleListCompat.wrap(configuration.locales).tags)
        ScooterLanguage.atLaunch = language
        launchLocale = locale(language, region = LocaleManagerCompat.getSystemLocales(context)[0])
    }

    /** What the app's language followed as it started: a language chosen for the app, or the phone's. */
    fun choiceAtLaunch(): ScooterLanguageChoice = ScooterLanguageChoice.of(appLanguages(), ScooterLanguage.atLaunch)

    companion object {
        /** The phone's `region` and settings, in the app's `language`. */
        fun locale(language: ScooterLanguage, region: Locale?): Locale =
            Locale.Builder()
                .apply { if (region != null) setLocale(region) }
                .setLanguage(language.rawValue)
                .setScript("")
                .build()
    }
}

private val LocaleListCompat.tags: List<String>
    get() = (0 until size()).mapNotNull { get(it)?.toLanguageTag() }
