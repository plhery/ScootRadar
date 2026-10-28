package com.plhery.scootradar.ui.settings

// Android's own: the open-source notices beside the map and data credits, which the iPhone app needs none of
// (STATE, "open-source notices"). Kept up to date with gradle/libs.versions.toml and the fonts in assets/.

/** A library or font the app ships, its licence, and the licence's text in assets/licences. */
data class OpenSourceNotice(val name: String, val licence: String, val file: String)

/** What the app ships that asks to be credited, by name. Names and licences are not translated. */
val openSourceNotices: List<OpenSourceNotice> = listOf(
    OpenSourceNotice("AndroidX and Jetpack Compose", APACHE, "Apache-2.0.txt"),
    OpenSourceNotice("Gson", APACHE, "Apache-2.0.txt"),
    OpenSourceNotice("Inter", "SIL Open Font License 1.1", "Inter.txt"),
    OpenSourceNotice("JTS Topology Suite", "Eclipse Distribution License 1.0", "JTS.txt"),
    OpenSourceNotice("Kotlin, kotlinx.coroutines and kotlinx.serialization", APACHE, "Apache-2.0.txt"),
    OpenSourceNotice("MapLibre Native and MapLibre Gestures", "BSD 2-Clause License", "MapLibre.txt"),
    OpenSourceNotice("MapLibre Java: GeoJSON and Turf", APACHE, "Apache-2.0.txt"),
    OpenSourceNotice("Material Symbols", APACHE, "Apache-2.0.txt"),
    OpenSourceNotice("OkHttp and Okio", APACHE, "Apache-2.0.txt"),
    OpenSourceNotice("Timber", APACHE, "Apache-2.0.txt"),
)

private const val APACHE = "Apache License 2.0"

/** A licence's text as a phone shows it: each paragraph on its own, its lines joined where the file wraps them. */
fun reflowedLicence(text: String): String =
    text.trim().split(Regex("\\n\\s*\\n")).joinToString("\n\n") { paragraph ->
        paragraph.lines().joinToString(" ") { it.trim() }
    }
