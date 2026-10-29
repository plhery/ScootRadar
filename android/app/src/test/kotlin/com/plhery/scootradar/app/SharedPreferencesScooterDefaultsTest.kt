package com.plhery.scootradar.app

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.time.Instant

@RunWith(AndroidJUnit4::class)
class SharedPreferencesScooterDefaultsTest {
    private val defaults = SharedPreferencesScooterDefaults(
        ApplicationProvider.getApplicationContext<Context>().getSharedPreferences("test", Context.MODE_PRIVATE),
    )

    @Test
    fun eachKindReadsBackAsItWasSet() {
        defaults.set(true, forKey = "bool")
        defaults.set(false, forKey = "false")
        defaults.set(42, forKey = "int")
        defaults.set("quiet", forKey = "string")
        defaults.set(listOf("lime", "", "a:b"), forKey = "array")
        defaults.set(byteArrayOf(0, 1, -1), forKey = "data")
        val date = Instant.parse("2026-10-27T10:15:30.123456789Z")
        defaults.set(date, forKey = "date")

        assertTrue(defaults.bool(forKey = "bool"))
        assertEquals(false, defaults.boolean(forKey = "false"))
        assertEquals(42, defaults.int(forKey = "int"))
        assertEquals(42, defaults.integer(forKey = "int"))
        assertEquals("quiet", defaults.string(forKey = "string"))
        assertEquals(listOf("lime", "", "a:b"), defaults.stringArray(forKey = "array"))
        assertArrayEquals(byteArrayOf(0, 1, -1), defaults.data(forKey = "data"))
        assertEquals(date, defaults.date(forKey = "date"))
    }

    @Test
    fun anotherKindReadsAsNothing() {
        defaults.set("true", forKey = "string")
        defaults.set(listOf("a"), forKey = "array")
        defaults.set(1, forKey = "int")

        assertFalse(defaults.bool(forKey = "string"))
        assertNull(defaults.int(forKey = "string"))
        assertNull(defaults.stringArray(forKey = "string"))
        assertNull(defaults.date(forKey = "string"))
        assertNull(defaults.string(forKey = "array"))
        assertNull(defaults.string(forKey = "int"))
        assertFalse(defaults.bool(forKey = "int"))
        assertNull(defaults.boolean(forKey = "int"))
        assertNull(defaults.boolean(forKey = "missing"))
        assertEquals(0, defaults.integer(forKey = "missing"))
        assertNull(defaults.string(forKey = "missing"))

        defaults.removeObject(forKey = "int")
        assertNull(defaults.int(forKey = "int"))
    }
}
