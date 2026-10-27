package com.plhery.scootradar.app

import android.content.Context
import android.provider.Settings
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.BuildConfig
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLengthUnit
import com.plhery.scootradar.core.model.ScooterLinks
import com.plhery.scootradar.core.model.ScooterListFormat
import com.plhery.scootradar.core.model.ScooterMeasureFormat
import com.plhery.scootradar.core.model.ScooterNumberFormat
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotSame
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.math.BigDecimal
import java.time.Instant
import java.time.ZoneId
import java.util.Locale

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "en-rUS")
class AppContainerTest {
    private val context: Context = ApplicationProvider.getApplicationContext()

    private val integer = ScooterNumberFormat.integer
    private val decimal = ScooterNumberFormat.decimal
    private val currency = ScooterNumberFormat.currency
    private val length = ScooterMeasureFormat.length
    private val skeleton = ScooterDateFormat.skeleton
    private val timeZone = ScooterDateFormat.timeZone
    private val and = ScooterListFormat.and
    private val launchLocale = ScooterLanguage.launchLocale
    private val appVersion = ScooterLinks.appVersion

    // Hooks that are not the container's, which it must replace.
    private val noInteger: (Long, Locale) -> String = { _, _ -> "" }
    private val noDecimal: (BigDecimal, Int, Locale) -> String = { _, _, _ -> "" }
    private val noCurrency: (BigDecimal, String, Int, Locale) -> String? = { _, _, _, _ -> null }
    private val noLength: (BigDecimal, ScooterLengthUnit, Locale) -> String = { _, _, _ -> "" }
    private val noSkeleton: (String, Instant, ZoneId, Locale) -> String = { _, _, _, _ -> "" }
    private val noTimeZone: () -> ZoneId = { ZoneId.of("UTC") }
    private val noAnd: (List<String>, Locale) -> String = { _, _ -> "" }
    private val noLaunchLocale: () -> Locale = { Locale.ROOT }

    @Before
    fun setUp() {
        ScooterNumberFormat.integer = noInteger
        ScooterNumberFormat.decimal = noDecimal
        ScooterNumberFormat.currency = noCurrency
        ScooterMeasureFormat.length = noLength
        ScooterDateFormat.skeleton = noSkeleton
        ScooterDateFormat.timeZone = noTimeZone
        ScooterListFormat.and = noAnd
        ScooterLanguage.launchLocale = noLaunchLocale
        ScooterLinks.appVersion = ""
    }

    @After
    fun tearDown() {
        ScooterNumberFormat.integer = integer
        ScooterNumberFormat.decimal = decimal
        ScooterNumberFormat.currency = currency
        ScooterMeasureFormat.length = length
        ScooterDateFormat.skeleton = skeleton
        ScooterDateFormat.timeZone = timeZone
        ScooterListFormat.and = and
        ScooterLanguage.launchLocale = launchLocale
        ScooterLinks.appVersion = appVersion
        Settings.System.putString(context.contentResolver, Settings.System.TIME_12_24, null)
    }

    @Test
    fun theContainerSetsEveryHookAsTheAppStarts() {
        AppContainer(context).setHooks()

        assertNotSame(noInteger, ScooterNumberFormat.integer)
        assertNotSame(noDecimal, ScooterNumberFormat.decimal)
        assertNotSame(noCurrency, ScooterNumberFormat.currency)
        assertNotSame(noLength, ScooterMeasureFormat.length)
        assertNotSame(noSkeleton, ScooterDateFormat.skeleton)
        assertNotSame(noTimeZone, ScooterDateFormat.timeZone)
        assertNotSame(noAnd, ScooterListFormat.and)
        assertNotSame(noLaunchLocale, ScooterLanguage.launchLocale)
        assertEquals(BuildConfig.VERSION_NAME, ScooterLinks.appVersion)
    }

    @Test
    fun theHooksWriteAsAndroidsICUDoes() {
        AppContainer(context).setHooks()
        val spain = Locale.forLanguageTag("es-ES")
        val us = Locale.US

        // Spanish groups from five digits on, as CLDR has it and Foundation writes it.
        assertEquals("1005", ScooterNumberFormat.integer(1005, spain))
        assertEquals("12.345", ScooterNumberFormat.integer(12_345, spain))
        assertEquals("5,20", ScooterNumberFormat.decimal(BigDecimal("5.2"), 2, spain))
        assertEquals("0.12", ScooterNumberFormat.decimal(BigDecimal("0.125"), 2, us))
        assertEquals("$0.42", ScooterNumberFormat.currency(BigDecimal("0.42"), "USD", 2, us))
        // A code that names no currency is written as itself; another gives the locale's.
        assertTrue(ScooterNumberFormat.currency(BigDecimal("1"), "XYZ", 2, us)!!.startsWith("XYZ"))
        assertEquals("$1.00", ScooterNumberFormat.currency(BigDecimal("1"), "usd", 2, us))
        assertEquals("1.3 km", ScooterMeasureFormat.length(BigDecimal("1.3"), ScooterLengthUnit.Kilometers, us))
        assertEquals("320 m", ScooterMeasureFormat.length(BigDecimal("320"), ScooterLengthUnit.Meters, us))
        assertEquals("Bird, Voi, and Lime", ScooterListFormat.and(listOf("Bird", "Voi", "Lime"), us))

        // The phone's 12- or 24-hour setting.
        val time = Instant.parse("2026-10-18T14:13:00Z")
        val zurich = ZoneId.of("Europe/Zurich")
        Settings.System.putString(context.contentResolver, Settings.System.TIME_12_24, "12")
        assertEquals("4:13\u202FPM", ScooterDateFormat.skeleton("jm", time, zurich, us))
        Settings.System.putString(context.contentResolver, Settings.System.TIME_12_24, "24")
        assertEquals("16:13", ScooterDateFormat.skeleton("jm", time, zurich, us))
        // Left to the locale, the hour is the launch locale's, which carries the phone's region, and not the
        // app's own "en": English in Switzerland writes 24-hour times.
        Settings.System.putString(context.contentResolver, Settings.System.TIME_12_24, null)
        assertEquals("16:13", ScooterDateFormat.skeleton("jm", time, zurich, Locale.forLanguageTag("en-CH")))
        assertEquals("4:13\u202FPM", ScooterDateFormat.skeleton("jm", time, zurich, us))
    }
}
