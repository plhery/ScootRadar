package com.plhery.scootradar.app

import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.testController
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import java.util.Locale

// The platform's side of ios/ScootRadarTests/ScooterModelsTests.swift's language tests (T318); :core's
// ScooterModelsTest keeps the controller's.

/** On Android 12, where AppCompat keeps the app's language, and on the latest Android Robolectric runs. */
@RunWith(AndroidJUnit4::class)
@Config(sdk = [31, Config.NEWEST_SDK], qualifiers = "en-rGB")
class AppLanguagesTest {
    private val locale = Locale.getDefault()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    @After
    fun tearDown() {
        scope.cancel()
        AppCompatDelegate.setApplicationLocales(LocaleListCompat.getEmptyLocaleList())
        shadowOf(Looper.getMainLooper()).idle()
        Locale.setDefault(locale)
        ScooterLanguage.atLaunch = ScooterLanguage.En
        ScooterLanguage.current = ScooterLanguage.En
    }

    @Test
    fun theIPhonesLanguagesStayTheIPhonesOnceTheAppHasOneOfItsOwn() {
        // Automatic says "English, the language of your phone" after Icelandic was chosen for the app, not
        // "Íslenska": Locale.getDefault() would give the app's. The phone's languages are the system's, which
        // a language kept for the app, in its own locales, leaves as they are.
        Robolectric.buildActivity(AppCompatActivity::class.java).setup().use {
            val languages = AppLanguages(ApplicationProvider.getApplicationContext())
            val phoneLanguages = languages.phoneLanguages()
            assertEquals("en-GB", phoneLanguages.first())
            val model = testController(scope, phoneLanguages = languages::phoneLanguages, keepAppLanguages = languages::keep)
            val phone = model.phoneLanguage
            val chosen = if (phoneLanguages.first().startsWith("is")) ScooterLanguage.Nl else ScooterLanguage.Is
            model.setLanguageChoice(ScooterLanguageChoice.Language(chosen))
            shadowOf(Looper.getMainLooper()).idle()

            assertEquals(chosen.rawValue, languages.appLanguages().first())
            assertEquals(phoneLanguages, languages.phoneLanguages())
            assertEquals(phone, model.phoneLanguage)
        }
    }
}
