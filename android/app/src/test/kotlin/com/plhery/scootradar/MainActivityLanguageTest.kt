package com.plhery.scootradar

import android.content.res.Configuration
import android.os.LocaleList
import androidx.lifecycle.ViewModelProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.app.ScooterMapViewModel
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.formatted
import com.plhery.scootradar.core.model.localized
import java.util.Locale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertSame
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RuntimeEnvironment
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config

// X.md X-M23: the phone's language changed while the map is open. An iPhone ends its apps as its language changes,
// so ScootRadar opens again in the new one, in the phone's region (Locale.current); a new region alone reaches
// Locale.current without ending the app. Android keeps the app running (locale is among MainActivity's
// configChanges), so the app follows the phone's new language and region itself.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "en-rUS-w412dp-h915dp-xxhdpi")
class MainActivityLanguageTest {
    private val atLaunch = ScooterLanguage.atLaunch
    private val launchLocale = ScooterLanguage.launchLocale

    @After
    fun tearDown() {
        ScooterLanguage.atLaunch = atLaunch
        ScooterLanguage.current = atLaunch
        ScooterLanguage.launchLocale = launchLocale
    }

    @Test
    fun onAutomaticThePhonesNewLanguageIsTheAppsAtOnce() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).create()
        val controller = controller(activity)
        assertEquals(ScooterLanguageChoice.Automatic, controller.languageChoice.value)
        assertEquals(ScooterLanguage.En, controller.language.value)

        phoneChanged(activity, "de-rCH")

        assertEquals("the app's language once the phone's is Swiss German", ScooterLanguage.De, controller.language.value)
        assertEquals("In meiner Nähe", localized("Near me"))
    }

    @Test
    fun thePhonesNewLanguageBringsItsRegionAsTheAppOpenedAgainIn() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).create()
        assertEquals("1,500 free min", localized("%lld free min", 1_500L))
        assertEquals("ft", unit(Scooter.formattedLength(100.0)))

        phoneChanged(activity, "de-rCH")

        // An iPhone opens the app again in German, with Locale.current de_CH: metres, and Swiss numbers.
        assertEquals("de-CH", ScooterLanguage.launchLocale().toLanguageTag())
        assertEquals(ScooterLanguage.De, ScooterLanguage.atLaunch)
        assertEquals("de-CH", ScooterLanguage.current.locale.toLanguageTag())
        // Swiss grouping, by Android's own data (PLAN §10, numbers).
        val swiss = 1_500.formatted(Locale.forLanguageTag("de-CH"))
        assertNotEquals("1,500", swiss)
        assertEquals("$swiss Freimin.", localized("%lld free min", 1_500L))
        assertEquals("m", unit(Scooter.formattedLength(100.0)))
    }

    @Test
    fun aNewRegionAloneKeepsTheLanguageAndBringsItsUnits() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).create()
        val controller = controller(activity)

        phoneChanged(activity, "en-rGB")

        assertEquals(ScooterLanguage.En, controller.language.value)
        assertEquals(ScooterLanguage.En, ScooterLanguage.atLaunch)
        assertEquals("en-GB", ScooterLanguage.launchLocale().toLanguageTag())
        assertEquals("yards, as the UK writes a walk", "yd", unit(Scooter.formattedLength(100.0)))
    }

    @Test
    fun aLanguageChosenInTheAppLeavesTheRegionsLocaleAsTheLaunchMadeIt() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).create()
        val controller = controller(activity)

        // Deutsch chosen in the app's Settings: Android hands the activity the app's language, the phone's unchanged.
        controller.setLanguageChoice(ScooterLanguageChoice.Language(ScooterLanguage.De))
        val config = Configuration(activity.get().resources.configuration).apply { setLocales(LocaleList.forLanguageTags("de")) }
        activity.get().onConfigurationChanged(config)

        // As the iPhone's Locale.current until the next launch: the language of the launch in the phone's region.
        assertEquals(ScooterLanguage.En, ScooterLanguage.atLaunch)
        assertEquals("en-US", ScooterLanguage.launchLocale().toLanguageTag())
        assertEquals("de-US", ScooterLanguage.current.locale.toLanguageTag())
        assertEquals("ft", unit(Scooter.formattedLength(100.0)))
    }

    private fun controller(activity: ActivityController<MainActivity>): ScooterMapController =
        ViewModelProvider(activity.get())[ScooterMapViewModel::class.java].controller

    /** Only the phone's language changes, which the activity takes itself: a new size or density would make it again. */
    private fun phoneChanged(activity: ActivityController<MainActivity>, language: String) {
        RuntimeEnvironment.setQualifiers("$language-w412dp-h915dp-xxhdpi")
        val shown = activity.get()
        activity.configurationChange(RuntimeEnvironment.getApplication().resources.configuration)
        assertSame("the activity kept", shown, activity.get())
    }

    /** A length's unit: "ft" for "350 ft". */
    private fun unit(length: String): String = length.takeLastWhile { it.isLetter() }
}
