package com.plhery.scootradar.app

import com.plhery.scootradar.core.model.ScooterLanguage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

// Every sentence :core and the app ask for by its English key is in each language's strings. A key written
// differently from the iPhone's would show as the key itself, in English, in every language, and nothing else
// would see it (logic.md LOG-334). A key built at run time (localized(key)) is not read here.
class LocalizedKeysTest {
    @Test
    fun everyKeyAskedForIsInEachLanguagesStrings() {
        // Unit tests run in the app module's folder.
        val sources = listOf(File("src/main/kotlin"), File("../core/src/main/kotlin"))
        val keys = sources.flatMap { folder -> folder.walk().filter { it.extension == "kt" }.toList() }
            .flatMap { file -> literal.findAll(file.readText()).map { unescaped(it.groupValues[1]) to file.name } }
            .toMap()
        assertTrue("keys found: ${keys.size}", keys.size > 150)

        val missing = ScooterLanguage.entries.flatMap { language ->
            keys.filter { (key, _) -> language.strings[key] == null }.map { (key, file) -> "${language.rawValue}: \"$key\" ($file)" }
        }
        assertEquals("", missing.joinToString("\n"))
    }

    /** `localized("…"` and `localizedCounting("…"`, with the string literal's content. */
    private val literal = Regex("""\blocalized(?:Counting)?\(\s*"((?:[^"\\]|\\.)*)"""")

    /** The string a Kotlin literal holds: its escapes undone. */
    private fun unescaped(literal: String): String = Regex("""\\(u[0-9a-fA-F]{4}|.)""").replace(literal) {
        val escape = it.groupValues[1]
        when {
            escape.length == 5 -> escape.drop(1).toInt(16).toChar().toString()
            escape == "n" -> "\n"
            escape == "t" -> "\t"
            else -> escape
        }
    }
}
