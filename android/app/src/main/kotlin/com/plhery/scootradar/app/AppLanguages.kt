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
     * region and settings. Set as the app starts; the phone's new region, or its new language, changes it as it
     * changes the iPhone's (phoneLocalesChanged).
     */
    @Volatile
    var launchLocale: Locale = Locale.getDefault()
        private set

    private var hasLaunched = false

    /** The language the phone's languages gave the app when Locale.current was last made. */
    private var phoneLanguage: ScooterLanguage? = null

    /**
     * Reads the language Android chose for this run, from the `configuration` of the first activity, where
     * AppCompat has put a language chosen for the app on Android 12: the first of its languages the app
     * speaks. A later activity of the same run, such as one made again, takes what changed of the phone's
     * languages meanwhile.
     */
    fun launched(configuration: Configuration) {
        if (hasLaunched) return phoneLocalesChanged(configuration)
        hasLaunched = true
        val phone = LocaleManagerCompat.getSystemLocales(context)
        phoneLanguage = ScooterLanguage.fromPreferences(phone.tags)
        val language = ScooterLanguage.fromPreferences(LocaleListCompat.wrap(configuration.locales).tags)
        ScooterLanguage.atLaunch = language
        launchLocale = locale(language, region = phone[0])
    }

    /**
     * The phone's languages or region changed while the app runs, `configuration` the activity's new one. An
     * iPhone ends its apps as its language changes, and the app opens again in the language iOS then chooses, in
     * the phone's region; a new region alone reaches Locale.current as the app runs, and what is drawn after reads
     * it. So Locale.current takes the phone's region, and after a new language the language Android now chooses
     * for the app: one chosen for it, or the first of the phone's it speaks. A language chosen in the app's
     * Settings leaves it as it is, as the iPhone's until the next launch.
     */
    fun phoneLocalesChanged(configuration: Configuration) {
        if (!hasLaunched) return
        val phone = LocaleManagerCompat.getSystemLocales(context)
        val language = ScooterLanguage.fromPreferences(phone.tags)
        if (language != phoneLanguage) {
            phoneLanguage = language
            ScooterLanguage.atLaunch = ScooterLanguage.fromPreferences(LocaleListCompat.wrap(configuration.locales).tags)
        }
        launchLocale = locale(ScooterLanguage.atLaunch, region = phone[0])
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
