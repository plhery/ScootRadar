package com.plhery.scootradar

import androidx.lifecycle.ViewModelProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.app.ScooterMapViewModel
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.localized
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

// X.md X-M23: the phone's language changed while the map is open. An iPhone ends its apps as its language changes,
// so ScootRadar opens again in the new one; Android keeps the app running (locale is among MainActivity's
// configChanges), so the app follows the phone's new language itself.

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
        val controller = ViewModelProvider(activity.get())[ScooterMapViewModel::class.java].controller
        assertEquals(ScooterLanguageChoice.Automatic, controller.languageChoice.value)
        assertEquals(ScooterLanguage.En, controller.language.value)

        // Only the language changes, which the activity takes itself: a new size or density would make it again.
        RuntimeEnvironment.setQualifiers("de-rCH-w412dp-h915dp-xxhdpi")
        val shown = activity.get()
        activity.configurationChange(RuntimeEnvironment.getApplication().resources.configuration)
        assertSame("the activity kept", shown, activity.get())

        assertEquals("the app's language once the phone's is Swiss German", ScooterLanguage.De, controller.language.value)
        assertEquals("In meiner Nähe", localized("Near me"))
    }
}
