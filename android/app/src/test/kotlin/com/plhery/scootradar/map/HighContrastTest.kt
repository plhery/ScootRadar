package com.plhery.scootradar.map

import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.lifecycle.Lifecycle
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

// MAP-192: the beam's strength and the dot's blue follow Increase Contrast as Settings changes it.

@RunWith(AndroidJUnit4::class)
class HighContrastTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    @After
    fun tearDown() {
        Settings.Secure.putInt(compose.activity.contentResolver, "high_text_contrast_enabled", 0)
    }

    @Test
    fun increaseContrastIsReadAgainAsTheAppComesBack() {
        val settings = compose.activity.contentResolver
        var highContrast: Boolean? = null
        compose.setContent { highContrast = rememberHighContrast() }
        compose.waitForIdle()
        assertEquals(false, highContrast)

        // High contrast text turned on in Settings, the app away: no new configuration comes with it.
        compose.activityRule.scenario.moveToState(Lifecycle.State.CREATED)
        Settings.Secure.putInt(settings, "high_text_contrast_enabled", 1)
        compose.activityRule.scenario.moveToState(Lifecycle.State.RESUMED)
        compose.waitForIdle()
        assertEquals(true, highContrast)
    }
}
