package com.plhery.scootradar.app

import android.app.Application
import android.content.Intent
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.ScooterLanguage
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RuntimeEnvironment

// The app's name in */InfoPlist.strings (ui.md UI-325): "ScootRadar" in every language.

@RunWith(AndroidJUnit4::class)
class AppIdentityTest {
    /** The launcher writes "ScootRadar" under the icon, whichever of the app's nine languages the phone is in. */
    @Test
    fun theLauncherLabelIsScootRadarInEveryLanguage() {
        val application: Application = ApplicationProvider.getApplicationContext()
        val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER).setPackage(application.packageName)
        assertEquals(9, ScooterLanguage.entries.size)
        for (language in ScooterLanguage.entries) {
            // The phone's language, as the launcher reads the label in it: Robolectric's qualifiers last the test.
            RuntimeEnvironment.setQualifiers("+b+${language.rawValue}")
            val packages = application.packageManager
            assertEquals(language.rawValue, language.rawValue, application.resources.configuration.locales[0].language)
            val activity = packages.queryIntentActivities(launcher, 0).single()
            assertEquals(language.rawValue, "ScootRadar", activity.loadLabel(packages).toString())
            assertEquals(language.rawValue, "ScootRadar", application.applicationInfo.loadLabel(packages).toString())
        }
    }
}
