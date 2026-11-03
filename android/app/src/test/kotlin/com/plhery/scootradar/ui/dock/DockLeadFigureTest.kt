package com.plhery.scootradar.ui.dock

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.app.AndroidFormats
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterDockLead
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterMeasureFormat
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.util.Locale

/**
 * The dock's lead draws the nearest scooter's distance large, its number and unit apart at a no-break space in French as
 * in English: ICU's narrow one, U+202F, read "24m" at the lead's size. The distance itself, which TalkBack reads, stays
 * as the locale writes it.
 */
@RunWith(AndroidJUnit4::class)
class DockLeadFigureTest {
    private val length = ScooterMeasureFormat.length
    private val language = ScooterLanguage.current
    private val launchLocale = ScooterLanguage.launchLocale

    @Before
    fun setUp() {
        // Android's ICU, as the app sets it at launch.
        ScooterMeasureFormat.length = AndroidFormats(ApplicationProvider.getApplicationContext())::length
    }

    @After
    fun tearDown() {
        ScooterMeasureFormat.length = length
        ScooterLanguage.current = language
        ScooterLanguage.launchLocale = launchLocale
    }

    private fun lead(metres: Double) = ScooterDockLead(Scooter(provider = "hopp", latitude = 47.37, longitude = 8.54), metres)

    @Test
    fun theLeadsUnitIsApartFromItsNumberAtANoBreakSpaceInFrenchAsInEnglish() {
        val frCH = Locale.forLanguageTag("fr-CH")
        val enUS = Locale.forLanguageTag("en-US")
        // ICU writes French apart at the narrow space, English at a plain one the app makes no-break.
        assertEquals("24\u202Fm", lead(24.0).distance(frCH))
        assertEquals("80\u00A0ft", lead(24.0).distance(enUS))
        // Drawn, both at the no-break space.
        assertEquals("24\u00A0m", leadFigure(lead(24.0), frCH))
        assertEquals("80\u00A0ft", leadFigure(lead(24.0), enUS))
        assertEquals("1,2\u00A0km", leadFigure(lead(1_234.0), frCH))
        assertEquals("0.77\u00A0mi", leadFigure(lead(1_234.0), enUS))
        // The digits' grouping keeps its narrow space: only the unit's gap widens.
        assertEquals("1\u202F234\u00A0km", leadFigure(lead(1_234_000.0), Locale.forLanguageTag("fr-FR")))
    }

    @Test
    fun whatTalkBackReadsKeepsTheSpaceTheLocaleWrites() {
        // The app in French, on a phone set to Swiss French.
        ScooterLanguage.launchLocale = { Locale.forLanguageTag("fr-CH") }
        ScooterLanguage.current = ScooterLanguage.Fr
        val lead = lead(24.0)
        assertEquals("24\u00A0m", leadFigure(lead))
        assertEquals("24\u202Fm", lead.distance)
        assertTrue(lead.accessibilityLabel, lead.accessibilityLabel.contains("24\u202Fm"))
    }
}
