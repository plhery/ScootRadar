package com.plhery.scootradar.app

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.provider.Settings
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.BuildConfig
import com.plhery.scootradar.core.model.RidePriceFormatter
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLengthUnit
import com.plhery.scootradar.core.model.ScooterLinks
import com.plhery.scootradar.core.model.ScooterListFormat
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterMeasureFormat
import com.plhery.scootradar.core.model.ScooterNumberFormat
import com.plhery.scootradar.core.model.ScooterStartPlace
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotSame
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowNetworkCapabilities
import java.math.BigDecimal
import java.time.Instant
import java.time.ZoneId
import java.time.ZoneOffset
import java.util.Locale
import java.util.TimeZone

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
    private val zone = TimeZone.getDefault()

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
        TimeZone.setDefault(zone)
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

    /**
     * LOG-355: the day a price was checked is written at UTC, as the iPhone writes it at GMT (ScooterControls.swift:
     * 1952-1962). The app hands Android's ICU ZoneOffset.UTC, whose id "Z" ICU knows only as an unknown zone at
     * offset 0, and the phone's own zone doesn't come in, east of UTC or west.
     */
    @Test
    fun theHooksWriteAtUTCWhateverThePhonesZone() {
        AppContainer(context).setHooks()
        ScooterLanguage.launchLocale = { Locale.US }
        Settings.System.putString(context.contentResolver, Settings.System.TIME_12_24, "24")
        try {
            for (id in listOf("Pacific/Auckland", "America/Los_Angeles")) {
                TimeZone.setDefault(TimeZone.getTimeZone(id))
                assertEquals(id, "23:00", ScooterDateFormat.skeleton("jm", Instant.ofEpochSecond(23 * 3600L), ZoneOffset.UTC, Locale.US))
                val december = Instant.parse("2026-12-01T00:00:00Z")
                assertEquals(id, "Oct 18", RidePriceFormatter.listedDay("2026-10-18", now = december))
                assertEquals(id, "Dec 31", RidePriceFormatter.listedDay("2026-12-31", now = Instant.parse("2026-12-31T23:30:00Z")))
                assertEquals(id, "Dec 31, 2026", RidePriceFormatter.listedDay("2026-12-31", now = Instant.parse("2027-01-01T00:30:00Z")))
            }
        } finally {
            ScooterLanguage.current = ScooterLanguage.atLaunch
        }
    }

    /**
     * LOG-009: Android's errors don't say "offline" as URLError's codes do, so a failed request is offline when
     * no network Android has validated as reaching the internet is up (ScooterAPI.swift:110-114).
     */
    @Test
    fun onlyANetworkAndroidValidatedIsOnline() {
        val container = AppContainer(context)
        val connectivity = context.getSystemService(ConnectivityManager::class.java)
        val network = checkNotNull(connectivity.activeNetwork)

        shadowOf(connectivity).setNetworkCapabilities(
            network,
            ShadowNetworkCapabilities.newInstance().also { shadowOf(it).addCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) },
        )
        assertFalse(container.isOffline())

        // Connected, as to a hotel's Wi-Fi before its login page: not validated.
        shadowOf(connectivity).setNetworkCapabilities(
            network,
            ShadowNetworkCapabilities.newInstance().also { shadowOf(it).addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) },
        )
        assertTrue(container.isOffline())

        // No network at all.
        shadowOf(connectivity).setDefaultNetworkActive(false)
        assertTrue(container.isOffline())
    }

    /** LOG-345: the zone is read once, as the iPhone's static let is, the first time the start is asked for. */
    @Test
    fun theMapOpensWhereTheZoneSaidWhenTheStartWasFirstAskedFor() {
        val container = AppContainer(context)
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Berlin"))
        val start = container.start
        assertEquals(ScooterStartPlace.start(forTimeZone = "Europe/Berlin"), start)

        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Tokyo"))
        assumeTrue(ScooterStartPlace.start(forTimeZone = "Asia/Tokyo") != start)
        assertEquals(start, container.start)
    }

    /** A phone set to an offset rather than a place has a zone the catalog doesn't know: the map opens on Switzerland. */
    @Test
    fun aZoneThatIsOnlyAnOffsetOpensOnSwitzerland() {
        TimeZone.setDefault(TimeZone.getTimeZone("GMT+01:00"))
        assertEquals("GMT+01:00", TimeZone.getDefault().id)
        assertEquals(ScooterMapStart.switzerland, AppContainer(context).start)
    }
}
