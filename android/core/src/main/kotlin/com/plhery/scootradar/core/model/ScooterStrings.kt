package com.plhery.scootradar.core.model

import java.io.InputStream
import java.io.StringReader
import java.math.BigDecimal
import java.math.RoundingMode
import java.text.DecimalFormat
import java.text.NumberFormat
import java.util.Currency
import java.util.Locale
import javax.xml.parsers.DocumentBuilderFactory
import org.w3c.dom.Element
import org.xml.sax.InputSource

// The strings of a language as the iPhone app has them in its .lproj folder: Localizable.strings, and
// Localizable.stringsdict for sentences about counts. The files are the iPhone app's own, copied into
// the resources by the build (android/core/build.gradle.kts), and read here as Foundation reads them.

/** The strings of one language, as a Bundle of an .lproj folder holds them. */
class ScooterStrings internal constructor(
    private val sentences: Map<String, String>,
    private val counting: Map<String, ScooterCountingFormat>,
) {
    /**
     * The string for the key, as Bundle.localizedString(forKey:value:table:) gives it, unformatted; null
     * where the language has none. A sentence about counts gives its format, with its %#@variables@.
     */
    operator fun get(key: String): String? = sentences[key] ?: counting[key]?.format

    /** The keys of Localizable.strings. */
    val keys: Set<String> get() = sentences.keys

    /** The keys of Localizable.stringsdict. */
    val countingKeys: Set<String> get() = counting.keys

    /**
     * The sentence for the key with its arguments, as String(localized:bundle:locale:) makes it: the key
     * itself where the language has no sentence for it, as English is written in the keys. The locale
     * writes the numbers, and picks the form a count takes in a sentence about counts. Without
     * arguments the sentence is as it is written, with its %@ and %%, as String(format:) is then
     * given it.
     */
    fun format(key: String, arguments: List<Any?>, locale: Locale): String {
        counting[key]?.let { return it.format(arguments, locale) }
        val sentence = sentences[key] ?: key
        return if (arguments.isEmpty()) sentence else AppleFormat.format(sentence, arguments, locale)
    }

    companion object {
        /** The strings of the language's .lproj folder in the resources; none if it has none. */
        internal fun load(language: String): ScooterStrings {
            val folder = "/com/plhery/scootradar/core/strings/$language.lproj"
            val sentences = resource("$folder/Localizable.strings")
                ?.use { AppleStringsFile.parse(it.readBytes().decodeToString()) }
                .orEmpty()
            val counting = resource("$folder/Localizable.stringsdict")
                ?.use(AppleStringsdictFile::parse)
                .orEmpty()
            return ScooterStrings(sentences, counting)
        }

        private fun resource(path: String): InputStream? = ScooterStrings::class.java.getResourceAsStream(path)
    }
}

/**
 * Writes numbers as the locale does, with its grouping: 1,005 in English, 1’005 in Swiss German.
 * Foundation does so for a %lld of a sentence and for `.formatted(.number)`, and for decimals and
 * amounts of money. The app sets ones that follow Android's own number data, as Foundation follows the
 * iPhone's.
 */
object ScooterNumberFormat {
    @Volatile
    var integer: (Long, Locale) -> String = { number, locale -> NumberFormat.getIntegerInstance(locale).format(number) }

    /**
     * A decimal with that many digits after its point, as `.formatted(.number.precision(.fractionLength(digits)))`
     * writes it in the locale: "1,032", "5.20", "5,20". Halves go to the even neighbour.
     */
    @Volatile
    var decimal: (number: BigDecimal, fractionDigits: Int, locale: Locale) -> String = { number, digits, locale ->
        NumberFormat.getNumberInstance(locale).apply {
            minimumFractionDigits = digits
            maximumFractionDigits = digits
            roundingMode = RoundingMode.HALF_EVEN
        }.format(number)
    }

    /**
     * An amount of the currency of that ISO code, as NumberFormatter's currency style writes it in the locale
     * with that many digits after its point, halves going to the even neighbour: "CHF 1.00", "$0.42",
     * "1,00 €". As Foundation does, a code of three capital letters that names no currency is written as
     * itself ("XYZ 1.00"), and any other code gives the locale's own currency ("$1.00" in American English);
     * null only where the platform cannot write the amount at all, which Foundation never does. The JVM's
     * writes no space between a code and its number ("CHF1.00" in American English), where Foundation and
     * Android do.
     */
    @Volatile
    var currency: (amount: BigDecimal, code: String, fractionDigits: Int, locale: Locale) -> String? = { amount, code, digits, locale ->
        val format = NumberFormat.getCurrencyInstance(locale)
        if (Regex("[A-Z]{3}").matches(code)) {
            val known = runCatching { Currency.getInstance(code) }.getOrNull()
            if (known != null) {
                format.currency = known
            } else if (format is DecimalFormat) {
                format.decimalFormatSymbols = format.decimalFormatSymbols.apply {
                    currencySymbol = code
                    internationalCurrencySymbol = code
                }
            }
        }
        format.apply {
            minimumFractionDigits = digits
            maximumFractionDigits = digits
            roundingMode = RoundingMode.HALF_EVEN
        }.format(amount)
    }
}

/**
 * String(format:) and, with a locale, String(format:locale:): %@ and %lld, numbered or not, and %%. A
 * whole number takes the locale's grouping, and none without a locale: 12345, 12,345, 12’345.
 */
fun stringFormat(format: String, vararg arguments: Any?, locale: Locale? = null): String =
    AppleFormat.format(format, arguments.asList(), locale)

/** Int.formatted(.number.locale(locale)) */
fun Int.formatted(locale: Locale): String = ScooterNumberFormat.integer(toLong(), locale)

/** Int64.formatted(.number.locale(locale)) */
fun Long.formatted(locale: Locale): String = ScooterNumberFormat.integer(this, locale)

/**
 * A sentence of Localizable.stringsdict: its format, whose %#@variables@ each take the words the count
 * they are given takes in the language ("1 city", "2 cities").
 */
internal class ScooterCountingFormat(
    val format: String,
    /** By variable, its forms by plural category: "one", "other"… */
    val variables: Map<String, Map<String, String>>,
) {
    fun format(arguments: List<Any?>, locale: Locale): String = AppleFormat.format(format, arguments, locale) { name, argument ->
        val forms = variables[name] ?: throw IllegalArgumentException("No variable $name in $format")
        val count = AppleFormat.integer(argument, format)
        // Foundation takes "zero" for none whenever the sentence has it, in every language.
        val form = forms["zero"]?.takeIf { count == 0L }
            ?: forms[ScooterPluralRules.category(count, locale)]
            ?: forms["other"]
            ?: throw IllegalArgumentException("No other form of $name in $format")
        AppleFormat.format(form, listOf(argument), locale)
    }
}

/**
 * The plural categories of the languages the app speaks, by CLDR's rules for whole numbers, as
 * Foundation picks a form of Localizable.stringsdict.
 */
internal object ScooterPluralRules {
    fun category(count: Long, locale: Locale): String {
        val n = if (count == Long.MIN_VALUE) Long.MAX_VALUE else kotlin.math.abs(count)
        val millions = n != 0L && n % 1_000_000 == 0L
        return when (locale.language) {
            // Zero is singular in French, and in Portuguese as Brazil writes it, but not as Portugal does.
            "fr" -> if (n <= 1) "one" else if (millions) "many" else "other"
            "pt" -> if (n == 1L || (n == 0L && locale.country != "PT")) "one" else if (millions) "many" else "other"
            "es", "it" -> if (n == 1L) "one" else if (millions) "many" else "other"
            // Any count ending in 1 but not in 11: "21 stað".
            "is" -> if (n % 10 == 1L && n % 100 != 11L) "one" else "other"
            else -> if (n == 1L) "one" else "other"
        }
    }
}

/**
 * The format specifiers the app's sentences use, as String(format:locale:) reads them: %@ and %lld,
 * each also numbered as %1$@, %2$lld, and %% for a percent sign. A whole number takes the grouping
 * of the locale, if there is one. Any other specifier is refused, so a sentence that needs one fails
 * its tests.
 */
internal object AppleFormat {
    private val integerLengths = listOf("ll", "l", "q", "z", "t", "j", "hh", "h", "")

    fun format(
        format: String,
        arguments: List<Any?>,
        locale: Locale?,
        variable: ((name: String, argument: Any?) -> String)? = null,
    ): String {
        val text = StringBuilder()
        var next = 0
        var index = 0
        while (index < format.length) {
            val character = format[index]
            if (character != '%') {
                text.append(character)
                index++
                continue
            }
            index++
            if (format.startsWith("%", index)) {
                text.append('%')
                index++
                continue
            }
            // %2$lld: the argument by its number, from 1.
            var position: Int? = null
            val digits = format.drop(index).takeWhile(Char::isDigit)
            if (digits.isNotEmpty() && format.startsWith("$", index + digits.length)) {
                position = digits.toInt() - 1
                index += digits.length + 1
            }
            fun argument(): Any? {
                val at = position ?: next++
                require(at in arguments.indices) { "No argument ${at + 1} for $format" }
                return arguments[at]
            }
            when {
                format.startsWith("@", index) -> {
                    text.append(argument().toString())
                    index++
                }
                format.startsWith("#@", index) && variable != null -> {
                    val end = format.indexOf('@', index + 2)
                    require(end > index + 2) { "Unfinished variable in $format" }
                    text.append(variable(format.substring(index + 2, end), argument()))
                    index = end + 1
                }
                else -> {
                    val length = integerLengths.first { format.startsWith(it, index) }
                    val conversion = format.getOrNull(index + length.length)
                    require(conversion == 'd' || conversion == 'i' || conversion == 'u') {
                        "Unsupported specifier at ${index - 1} of $format"
                    }
                    val number = integer(argument(), format)
                    text.append(if (locale == null) number.toString() else ScooterNumberFormat.integer(number, locale))
                    index += length.length + 1
                }
            }
        }
        return text.toString()
    }

    fun integer(argument: Any?, format: String): Long = when (argument) {
        is Long -> argument
        is Int -> argument.toLong()
        is Short -> argument.toLong()
        is Byte -> argument.toLong()
        else -> throw IllegalArgumentException("$argument is not a whole number, for $format")
    }
}

/**
 * Localizable.strings: `"key" = "value";` lines, with /* */ and // comments, as Foundation reads the
 * text format of a strings file. A key alone, `"key";`, is its own value.
 */
internal object AppleStringsFile {
    fun parse(text: String): Map<String, String> {
        val reader = Reader(text.removePrefix("\uFEFF"))
        val strings = LinkedHashMap<String, String>()
        while (true) {
            reader.skipSpaceAndComments()
            if (reader.atEnd) return strings
            val key = reader.string()
            reader.skipSpaceAndComments()
            val value = if (reader.take(';')) {
                key
            } else {
                reader.expect('=')
                reader.skipSpaceAndComments()
                reader.string().also {
                    reader.skipSpaceAndComments()
                    reader.expect(';')
                }
            }
            strings[key] = value
        }
    }

    private class Reader(private val text: String) {
        private var index = 0
        val atEnd: Boolean get() = index >= text.length

        fun skipSpaceAndComments() {
            while (!atEnd) {
                when {
                    text[index].isWhitespace() -> index++
                    text.startsWith("/*", index) -> {
                        val end = text.indexOf("*/", index + 2)
                        check(end >= 0) { "Unfinished comment at $index" }
                        index = end + 2
                    }
                    text.startsWith("//", index) -> {
                        val end = text.indexOf('\n', index)
                        index = if (end < 0) text.length else end + 1
                    }
                    else -> return
                }
            }
        }

        fun take(character: Char): Boolean = (!atEnd && text[index] == character).also { if (it) index++ }

        fun expect(character: Char) = check(take(character)) { "Expected $character at $index" }

        fun string(): String = if (take('"')) quoted() else unquoted()

        private fun unquoted(): String {
            val start = index
            while (!atEnd && (text[index].isLetterOrDigit() || text[index] in "_$+/:.-")) index++
            check(index > start) { "Expected a string at $index" }
            return text.substring(start, index)
        }

        private fun quoted(): String {
            val string = StringBuilder()
            while (true) {
                check(!atEnd) { "Unfinished string" }
                val character = text[index++]
                when (character) {
                    '"' -> return string.toString()
                    '\\' -> string.append(escaped())
                    else -> string.append(character)
                }
            }
        }

        private fun escaped(): String {
            check(!atEnd) { "Unfinished string" }
            return when (val character = text[index++]) {
                'n' -> "\n"
                't' -> "\t"
                'r' -> "\r"
                'a' -> "\u0007"
                'b' -> "\b"
                'f' -> "\u000C"
                'v' -> "\u000B"
                'U', 'u' -> {
                    val hex = text.drop(index).take(4).takeWhile { it.isDigit() || it.lowercaseChar() in 'a'..'f' }
                    check(hex.isNotEmpty()) { "Expected a code after \\U at $index" }
                    index += hex.length
                    hex.toInt(16).toChar().toString()
                }
                in '0'..'7' -> {
                    val octal = character + text.drop(index).take(2).takeWhile { it in '0'..'7' }
                    index += octal.length - 1
                    octal.toInt(8).toChar().toString()
                }
                else -> character.toString()
            }
        }
    }
}

/** Localizable.stringsdict: a property list of the sentences about counts, by key. */
internal object AppleStringsdictFile {
    fun parse(stream: InputStream): Map<String, ScooterCountingFormat> {
        val factory = DocumentBuilderFactory.newInstance().apply {
            isNamespaceAware = false
            isValidating = false
            isCoalescing = true
            isIgnoringComments = true
        }
        val builder = factory.newDocumentBuilder()
        // The file names Apple's DTD, which is not fetched.
        builder.setEntityResolver { _, _ -> InputSource(StringReader("")) }
        val plist = builder.parse(stream).documentElement
        val root = plist.elements().single()
        return dictionary(root).mapValues { (key, value) ->
            val entry = value as? Map<*, *> ?: throw IllegalArgumentException("$key is not a dictionary")
            val format = entry["NSStringLocalizedFormatKey"] as? String
                ?: throw IllegalArgumentException("$key has no NSStringLocalizedFormatKey")
            val variables = entry.filterKeys { it != "NSStringLocalizedFormatKey" }.map { (name, rule) ->
                val forms = rule as? Map<*, *> ?: throw IllegalArgumentException("$key: $name is not a dictionary")
                require(forms["NSStringFormatSpecTypeKey"] == "NSStringPluralRuleType") { "$key: $name is not a plural rule" }
                name as String to forms
                    .filterKeys { it != "NSStringFormatSpecTypeKey" && it != "NSStringFormatValueTypeKey" }
                    .map { (category, form) -> category as String to form as String }
                    .toMap()
            }.toMap()
            ScooterCountingFormat(format, variables)
        }
    }

    private fun Element.elements(): List<Element> =
        (0 until childNodes.length).map(childNodes::item).filterIsInstance<Element>()

    private fun dictionary(element: Element): Map<String, Any> {
        require(element.tagName == "dict") { "Expected a dict, found ${element.tagName}" }
        return element.elements().chunked(2).associate { (key, value) ->
            require(key.tagName == "key") { "Expected a key, found ${key.tagName}" }
            key.textContent to value(value)
        }
    }

    private fun value(element: Element): Any = when (element.tagName) {
        "dict" -> dictionary(element)
        "string" -> element.textContent
        else -> throw IllegalArgumentException("Unexpected ${element.tagName}")
    }
}
