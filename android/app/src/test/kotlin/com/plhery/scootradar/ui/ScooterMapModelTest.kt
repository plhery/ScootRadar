package com.plhery.scootradar.ui

import android.app.UiModeManager
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.testController
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Shadows.shadowOf
import java.time.Instant

// The screen's tests of ios/ScootRadarTests/ScooterMapModelTests.swift, with the map left out.

@RunWith(AndroidJUnit4::class)
class ScooterMapModelTest {
    @get:Rule
    val compose = createComposeRule()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    @After
    fun tearDown() {
        scope.cancel()
    }

    /** The appearance is the window's, so a sheet over the screen has it too. */
    @Test
    fun chosenAppearanceIsThatOfTheWholeWindow() {
        // Night in Switzerland, where the map opens.
        val night = Instant.parse("2026-10-24T23:00:00+02:00")
        val model = testController(scope, now = { night })
        compose.setContent { ScooterMapScreen(controller = model, map = {}) }
        val window = shadowOf(ApplicationProvider.getApplicationContext<android.content.Context>().getSystemService(UiModeManager::class.java))
        compose.waitUntil { window.applicationNightMode == UiModeManager.MODE_NIGHT_YES }

        model.setAppearance(ScooterAppearance.Light)
        compose.waitUntil { window.applicationNightMode == UiModeManager.MODE_NIGHT_NO }

        model.setAppearance(ScooterAppearance.Dark)
        compose.waitUntil { window.applicationNightMode == UiModeManager.MODE_NIGHT_YES }

        // System gives the choice back to the phone.
        model.setAppearance(ScooterAppearance.System)
        compose.waitUntil { window.applicationNightMode == UiModeManager.MODE_NIGHT_AUTO }
    }
}
