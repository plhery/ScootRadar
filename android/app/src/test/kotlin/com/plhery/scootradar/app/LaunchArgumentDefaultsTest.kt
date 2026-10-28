package com.plhery.scootradar.app

import android.os.Bundle
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

// LOG-296: a debug launch's arguments, read in front of the app's own defaults as UserDefaults reads the iPhone
// app's (ScooterMapModel.swift:405-411, ScooterAnalytics.swift:29-31).

@RunWith(AndroidJUnit4::class)
class LaunchArgumentDefaultsTest {
    @Test
    fun onlyTheArgumentsTheAppReadsAreTakenFromTheLaunch() {
        // am start -e ScreenshotCamera "47.37,8.54,900,20,0" -e ScreenshotTerrain realistic --ez ReviewPromptDue true
        // --ez analytics-smoke-test true
        val extras = Bundle().apply {
            putString("ScreenshotCamera", "47.37,8.54,900,20,0")
            putString("ScreenshotTerrain", "realistic")
            putBoolean("ReviewPromptDue", true)
            putBoolean(LaunchArgumentDefaults.ANALYTICS_SMOKE_TEST, true)
            putString("Other", "x")
        }
        assertEquals(
            mapOf(
                "ScreenshotCamera" to "47.37,8.54,900,20,0",
                "ScreenshotTerrain" to "realistic",
                "ReviewPromptDue" to true,
                LaunchArgumentDefaults.ANALYTICS_SMOKE_TEST to true,
            ),
            LaunchArgumentDefaults.arguments(extras),
        )
        assertEquals("analytics-smoke-test", LaunchArgumentDefaults.ANALYTICS_SMOKE_TEST)
        assertEquals(emptyMap<String, Any>(), LaunchArgumentDefaults.arguments(null))
        assertEquals(emptyMap<String, Any>(), LaunchArgumentDefaults.arguments(Bundle()))
    }

    @Test
    fun theLaunchsValueIsReadWhileTheAppKeepsItsOwn() {
        val stored = InMemoryScooterDefaults()
        stored.set("1,2,3,4,5", forKey = "ScreenshotCamera")
        stored.set("dark", forKey = "appearance")
        val defaults = LaunchArgumentDefaults(mapOf("ScreenshotCamera" to "47.37,8.54,900,20,0", "ReviewPromptDue" to true), stored)

        assertEquals("47.37,8.54,900,20,0", defaults.string("ScreenshotCamera"))
        assertTrue(defaults.bool("ReviewPromptDue"))
        // What the launch does not name is the app's.
        assertEquals("dark", defaults.string("appearance"))
        assertNull(defaults.string("ScreenshotTerrain"))
        assertFalse(defaults.bool("other"))

        defaults.set(false, forKey = "ReviewPromptDue")
        defaults.set("light", forKey = "appearance")
        assertTrue(defaults.bool("ReviewPromptDue"))
        assertFalse(stored.bool("ReviewPromptDue"))
        assertEquals("light", defaults.string("appearance"))
    }

    /** As UserDefaults reads `-ReviewPromptDue YES`: YES, true or 1 is true; NO, false or 0 is false. */
    @Test
    fun aWrittenArgumentIsReadAsUserDefaultsReadsIt() {
        val stored = InMemoryScooterDefaults()
        fun due(value: String) = LaunchArgumentDefaults(mapOf("ReviewPromptDue" to value), stored).bool("ReviewPromptDue")

        for (value in listOf("YES", "yes", "true", "TRUE", "1")) assertTrue(value, due(value))
        for (value in listOf("NO", "no", "false", "0", "")) assertFalse(value, due(value))
    }
}
