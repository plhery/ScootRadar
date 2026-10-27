package com.plhery.scootradar.ui.dock

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.net.URI

// LOG-276 to LOG-278: a web link tries the operator's app before the browser; its own scheme opens its app or nothing.

@RunWith(AndroidJUnit4::class)
class RentalLinksTest {
    @Test
    fun aWebLinkOpensTheOperatorsAppWhenOneTakesIt() {
        val phone = Phone { it.isForAnApp }
        assertTrue(phone.openRentalLink(URI("https://li.me/ride")))
        assertEquals(listOf(true), phone.started.map { it.isForAnApp })
        assertEquals("https://li.me/ride", phone.started.single().dataString)
        assertTrue(phone.started.single().hasCategory(Intent.CATEGORY_BROWSABLE))
        // The application's context has no task of its own.
        assertTrue(phone.started.single().flags and Intent.FLAG_ACTIVITY_NEW_TASK != 0)
    }

    @Test
    fun aWebLinkGoesToTheBrowserWithoutTheOperatorsApp() {
        val phone = Phone { !it.isForAnApp }
        assertTrue(phone.openRentalLink(URI("https://li.me/ride")))
        assertEquals(listOf(true, false), phone.started.map { it.isForAnApp })
    }

    @Test
    fun anOperatorsSchemeOpensItsAppOrNothing() {
        val phone = Phone { false }
        assertFalse(phone.openRentalLink(URI("lime://ride")))
        assertEquals(listOf(false), phone.started.map { it.isForAnApp })
        assertFalse(phone.openLink(URI("https://li.me/ride"), appOnly = true))
    }

    /** A phone whose apps take the links that `takes` says, and that keeps what was asked of it. */
    private class Phone(private val takes: (Intent) -> Boolean) :
        ContextWrapper(ApplicationProvider.getApplicationContext<Context>()) {
        val started = mutableListOf<Intent>()

        override fun startActivity(intent: Intent) {
            started += intent
            if (!takes(intent)) throw ActivityNotFoundException()
        }
    }

    private val Intent.isForAnApp: Boolean get() = flags and Intent.FLAG_ACTIVITY_REQUIRE_NON_BROWSER != 0
}
