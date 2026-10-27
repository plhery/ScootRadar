package com.plhery.scootradar.core

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * The Android sources write invisible characters as escapes (a backslash, u and the code point): written as
 * themselves they cannot be seen in a review, and a line or paragraph separator breaks the line in some
 * editors and diffs. Lint flags only the bidirectional ones.
 */
class SourceCharactersTest {
    private val android = File(System.getProperty("scootradar.repo"), "android")

    private fun isInvisible(codePoint: Int): Boolean = when (Character.getType(codePoint).toByte()) {
        Character.FORMAT, Character.LINE_SEPARATOR, Character.PARAGRAPH_SEPARATOR -> true
        Character.SPACE_SEPARATOR -> codePoint != ' '.code
        Character.CONTROL -> codePoint != '\n'.code && codePoint != '\t'.code
        else -> false
    }

    @Test
    fun sourcesWriteInvisibleCharactersAsEscapes() {
        val found = android.walk()
            .onEnter { it.name != "build" && !it.name.startsWith(".") }
            .filter { it.isFile && it.extension in setOf("kt", "kts", "toml", "xml", "pro") }
            .flatMap { file ->
                val text = file.readText()
                text.codePoints().toArray().withIndex().filter { isInvisible(it.value) }.map { (index, codePoint) ->
                    val line = text.codePoints().limit(index.toLong()).filter { it == '\n'.code }.count() + 1
                    "${file.relativeTo(android)}:$line U+%04X".format(codePoint)
                }
            }
            .toList()

        assertEquals(emptyList<String>(), found)
    }
}
