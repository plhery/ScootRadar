package com.plhery.scootradar.ui.settings

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/** The open-source notices: a text for each, the projects' own, and shown as prose. */
@RunWith(AndroidJUnit4::class)
class OpenSourceNoticesTest {
    private fun text(file: String): String =
        ApplicationProvider.getApplicationContext<Context>().assets.open("licences/$file").bufferedReader().use { it.readText() }

    @Test
    fun eachNoticeHasItsText() {
        for (notice in openSourceNotices) assertTrue(notice.file, text(notice.file).isNotBlank())
    }

    /** Lines of the upstream files that the notices once left out, or wrote otherwise. */
    @Test
    fun theTextsAreTheProjectsOwn() {
        assertTrue(text("MapLibre.txt").contains("Copyright (c) 2018-2021 MapTiler.com"))
        assertTrue(text("MapLibre-Java.txt").startsWith("The MIT License (MIT)\n\nCopyright (c) 2018 Mapbox\n"))
        assertTrue(text("JTS.txt").contains("Copyright (c) 2007, Eclipse Foundation, Inc. and its licensors."))
        assertTrue(text("MapLibre-core.md").contains("### [kdbush.hpp](https://github.com/mourner/kdbush.hpp) by Vladimir Agafonkin"))
    }

    @Test
    fun aLicenceInMarkdownReadsAsProse() {
        val shown = reflowedLicence(text("MapLibre-core.md"))
        assertTrue(shown.startsWith("Maplibre Native (https://github.com/maplibre/maplibre-native/)\n\nBSD 2-Clause License\n\n"))
        assertFalse(shown.contains("```"))
        // A list's items each on a line, their own lines joined.
        assertTrue(shown.contains("the following disclaimer.\n* Redistributions in binary form must reproduce the above copyright notice,"))
    }
}
