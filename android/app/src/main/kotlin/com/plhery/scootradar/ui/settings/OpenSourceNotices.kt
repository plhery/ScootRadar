package com.plhery.scootradar.ui.settings

// Android's own: the open-source notices beside the map and data credits, which the iPhone app needs none of
// (STATE, "open-source notices"). Kept up to date with gradle/libs.versions.toml and the fonts in assets/. The texts
// in assets/licences are the projects' own files at the versions the app ships: MapLibre Native's LICENSE.md and
// LICENSES.core.md at android-v13.7.1, MapLibre Gestures' LICENSE.md at 0.0.4, MapLibre Java's LICENSE at 6.0.1
// (MIT, though its POM says Apache 2.0), and JTS's LICENSE_EDLv1.txt at 1.20.0.

/** A library or font the app ships, its licence, and the licence's text in assets/licences. */
data class OpenSourceNotice(val name: String, val licence: String, val file: String)

/** What the app ships that asks to be credited, by name. Names and licences are not translated. */
val openSourceNotices: List<OpenSourceNotice> = listOf(
    OpenSourceNotice("AndroidX and Jetpack Compose", APACHE, "Apache-2.0.txt"),
    OpenSourceNotice("Gson", APACHE, "Apache-2.0.txt"),
    OpenSourceNotice("Inter", "SIL Open Font License 1.1", "Inter.txt"),
    OpenSourceNotice("JTS Topology Suite", "Eclipse Distribution License 1.0", "JTS.txt"),
    OpenSourceNotice("Kotlin, kotlinx.coroutines and kotlinx.serialization", APACHE, "Apache-2.0.txt"),
    OpenSourceNotice("MapLibre Gestures", "BSD 2-Clause License", "MapLibre-Gestures.txt"),
    OpenSourceNotice("MapLibre Java: GeoJSON and Turf", "MIT License", "MapLibre-Java.txt"),
    OpenSourceNotice("MapLibre Native", "BSD 2-Clause License", "MapLibre.txt"),
    OpenSourceNotice("MapLibre Native's libraries", "ISC, MIT, BSD, Boost, Apache 2.0, FreeType and curl licences", "MapLibre-core.md"),
    OpenSourceNotice("Material Symbols", APACHE, "Apache-2.0.txt"),
    OpenSourceNotice("OkHttp and Okio", APACHE, "Apache-2.0.txt"),
    OpenSourceNotice("Timber", APACHE, "Apache-2.0.txt"),
)

private const val APACHE = "Apache License 2.0"

/**
 * A licence's text as a phone shows it: each paragraph on its own, its lines joined where the file wraps them, and
 * each item of a list on a line of its own. Of the Markdown LICENSES.core.md is written in, the fences and rules are
 * left out, and a heading's link reads as its name and address.
 */
fun reflowedLicence(text: String): String =
    text.lines()
        .filterNot { it.trim() == "```" || it.trim() == "---" }
        .joinToString("\n") { it.replace(HEADING, "").replace(LINK, "$1 ($2)") }
        .trim()
        .split(Regex("\\n\\s*\\n"))
        .joinToString("\n\n") { paragraph ->
            paragraph.lines().map { it.trim() }.reduce { joined, line -> if (LIST_ITEM.matches(line)) "$joined\n$line" else "$joined $line" }
        }

private val HEADING = Regex("^#+ ")
private val LINK = Regex("\\[([^]]+)]\\(([^)]+)\\)")
private val LIST_ITEM = Regex("([*-]|\\d+\\.) .*")
