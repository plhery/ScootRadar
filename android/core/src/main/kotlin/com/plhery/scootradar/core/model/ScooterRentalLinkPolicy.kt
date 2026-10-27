package com.plhery.scootradar.core.model

import java.net.IDN
import java.net.URI
import java.net.URISyntaxException

// ScooterRentalLinkPolicy from ios/ScootRadar/Models/ScooterModels.swift.

object ScooterRentalLinkPolicy {
    private class ProviderPolicy(val schemes: Set<String>, val httpsHosts: Set<String>)

    private val policies: Map<String, ProviderPolicy> = mapOf(
        "bolt" to ProviderPolicy(
            schemes = setOf("bolt"),
            httpsHosts = setOf("bolt.eu", "bolt.com"),
        ),
        "bird" to ProviderPolicy(
            schemes = setOf("bird"),
            httpsHosts = setOf("bird.co", "birdapp.com", "birdapp.app.link"),
        ),
        "dott" to ProviderPolicy(
            schemes = setOf("dott", "ridedott"),
            httpsHosts = setOf("ridedott.com"),
        ),
        "hopp" to ProviderPolicy(
            schemes = setOf("hopp"),
            httpsHosts = setOf("hopp.bike"),
        ),
        "lime" to ProviderPolicy(
            schemes = setOf("lime", "limebike"),
            httpsHosts = setOf("li.me", "lime.bike", "limebike.com"),
        ),
        "voi" to ProviderPolicy(
            schemes = setOf("voiapp"),
            httpsHosts = setOf("voi.com", "voiscooters.com", "lqfa.adj.st"),
        ),
        "pony" to ProviderPolicy(
            schemes = setOf("co.ponybikes.mercury", "co.ponybikes.venus"),
            httpsHosts = setOf("getapony.com"),
        ),
        "zeus" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("zeus.city", "ridezeus.app.link"),
        ),
        "beryl" to ProviderPolicy(
            schemes = setOf("beryl-basis"),
            httpsHosts = setOf("beryl.app", "beryl.cc"),
        ),
        "ryde" to ProviderPolicy(
            schemes = setOf("rydelink", "ryde-linking"),
            httpsHosts = setOf("ryde.vip"),
        ),
        "hoppy" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("ride-hoppy.app.link", "behoppy.eu"),
        ),
        "qick" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("qickscooters.app.link", "qickscooters.com"),
        ),
        "ride_mobility" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("ridemobility.app.link", "ridemobility.eu"),
        ),
        "yoio" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("rideyoio.app.link", "yoio.app"),
        ),
        "elerent" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("elerent.app.link", "elerent.com"),
        ),
        "zelectra" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("zelectra.app.link", "3electra.com.ua"),
        ),
        "spin" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("spin.app", "spin.pm"),
        ),
        "veo" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("gmjc.adj.st", "veoride.com"),
        ),
        "lyft" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("lft.to", "lyft.com", "biketownpdx.com"),
        ),
        // Bolt runs its scooters in Washington, DC as Hopp, in an app of that name.
        "bolt_hopp" to ProviderPolicy(
            schemes = setOf("bolt-hopp"),
            httpsHosts = setOf("gethopp.com"),
        ),
        // SAHAM, in Riyadh, is on ATOM Mobility: its links end in the number on the scooter.
        "saham" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("ride-saham.app.link", "sahamofficial.com"),
        ),
        // Flamingo, in New Zealand, links each scooter on ride.flamingoscooters.com.
        "flamingo" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("flamingoscooters.com"),
        ),
        // JOLT, in New Plymouth and Rolleston, links each scooter by a uuid on its own site.
        "jolt" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("joltscooters.co.nz"),
        ),
        // Beam's map provides no reviewed rental URI.
        "beam" to ProviderPolicy(schemes = emptySet(), httpsHosts = emptySet()),
        // BinBin's map links no scooter; its app claims binbin.tech.
        "binbin" to ProviderPolicy(
            schemes = emptySet(),
            httpsHosts = setOf("binbin.tech"),
        ),
        // Alpaca's map links no scooter, and its app claims no https host, only its alpaca:// and sbike://.
        "alpaca" to ProviderPolicy(schemes = emptySet(), httpsHosts = emptySet()),
        // DART's map links no scooter, and its app claims no link at all, neither a scheme nor an https host.
        "dart" to ProviderPolicy(schemes = emptySet(), httpsHosts = emptySet()),
        "publibike" to ProviderPolicy(
            schemes = setOf("publibike", "velospot"),
            httpsHosts = setOf("publibike.ch", "velospot.info"),
        ),
    )

    /** Links that open an operator's app elsewhere than on a scooter, as rentalLinks.ts has them. */
    private val notRentalLinks: List<Pair<String, String>> = listOf("bird" to "charger-onboarding")

    fun rentalURL(provider: String, rentalURIs: ScooterRentalURIs?, legacyLink: String?): URI? =
        rentalURLs(provider, rentalURIs, legacyLink).firstOrNull()

    /**
     * The Android link, the web link and the legacy one, without the unsafe ones and without repeats. The
     * iPhone's link is never used, as the web uses the Android one for Android's browsers.
     */
    fun rentalURLs(provider: String, rentalURIs: ScooterRentalURIs?, legacyLink: String?): List<URI> {
        val urls = mutableListOf<URI>()
        for (candidate in listOf(rentalURIs?.android, rentalURIs?.web, legacyLink)) {
            val url = safeURL(provider, candidate) ?: continue
            // URL's == compares the strings, where URI's ignores the case of the scheme and host.
            if (urls.none { it.toString() == url.toString() }) urls += url
        }
        return urls
    }

    fun safeURL(provider: String, value: String?): URI? {
        if (value == null) return null
        val candidate = value.trim(::isWhitespaceOrNewline)
        if (candidate.isEmpty() || candidate.encodeToByteArray().size > 2_048) return null
        if (candidate.codePoints().anyMatch(::isControlCharacter)) return null
        val policy = policies[provider] ?: return null
        val components = AppleURLComponents.parse(candidate) ?: return null
        if (components.user != null || components.password != null) return null
        val scheme = components.scheme?.lowercase() ?: return null

        // Bird's and Spin's feeds give bird://charger-onboarding as their app's address: the sign-up for
        // people who charge scooters, never a rental, whatever the country.
        if (notRentalLinks.any { it.first == scheme && it.second == components.host?.lowercase() }) return null
        if (scheme == "https") {
            if (components.port != null) return null
            val hostname = components.host?.lowercase() ?: return null
            if (policy.httpsHosts.none { hostname == it || hostname.endsWith(".$it") }) return null
        } else if (scheme !in policy.schemes) {
            return null
        }
        return components.url
    }

    /** CharacterSet.whitespacesAndNewlines: Unicode's White_Space. */
    private fun isWhitespaceOrNewline(character: Char): Boolean =
        character in "\t\n\u000B\u000C\r \u0085      　" || character in ' '..' '

    /** CharacterSet.controlCharacters: the control and format characters, Cc and Cf. */
    private fun isControlCharacter(codePoint: Int): Boolean {
        val type = Character.getType(codePoint)
        return type == Character.CONTROL.toInt() || type == Character.FORMAT.toInt()
    }
}

/**
 * URLComponents(string:) as Foundation reads a link, for the parts the policy checks: the scheme, user,
 * password, host (percent-decoded) and port. As Foundation does, it refuses a link whose scheme, host or
 * port cannot be read, and percent-encodes the characters a URL may not hold elsewhere ("a b" is "a%20b",
 * a "%" that starts no escape "%25"), a host in other letters in Punycode: `url` is URLComponents.url.
 */
internal class AppleURLComponents private constructor(
    val scheme: String?,
    val user: String?,
    val password: String?,
    val host: String?,
    val port: Int?,
    val url: URI?,
) {
    companion object {
        // RFC 3986, appendix B.
        private val parts = Regex("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?$", RegexOption.DOT_MATCHES_ALL)
        private val schemeCharacters = Regex("[A-Za-z][A-Za-z0-9+.-]*")
        private const val UNRESERVED = "-._~"
        private const val SUB_DELIMITERS = "!$&'()*+,;="

        fun parse(string: String): AppleURLComponents? {
            val groups = parts.matchEntire(string)?.groups ?: return null
            val scheme = groups[2]?.value
            if (scheme != null && !schemeCharacters.matches(scheme)) return null
            var user: String? = null
            var password: String? = null
            var host: String? = null
            var port: Int? = null
            val authority = groups[4]?.value?.let { whole ->
                val at = whole.lastIndexOf('@')
                val userInfo = if (at >= 0) whole.substring(0, at) else null
                var hostname = whole.substring(at + 1)
                if (userInfo != null) {
                    val colon = userInfo.indexOf(':')
                    user = decoded(if (colon >= 0) userInfo.substring(0, colon) else userInfo)
                    if (colon >= 0) password = decoded(userInfo.substring(colon + 1))
                }
                // The port follows the last colon, past the brackets of an IP address.
                val colon = hostname.lastIndexOf(':').takeIf { it > hostname.lastIndexOf(']') } ?: -1
                val portText = if (colon >= 0) hostname.substring(colon + 1) else null
                if (colon >= 0) hostname = hostname.substring(0, colon)
                if (portText != null && portText.isNotEmpty()) {
                    if (!portText.all { it in '0'..'9' }) return null
                    port = portText.toIntOrNull() ?: return null
                }
                if (hostname.startsWith("[") != hostname.endsWith("]")) return null
                val invalid = hostname.any { it.code < 0x80 && !it.isLetterOrDigit() && it !in "$UNRESERVED$SUB_DELIMITERS%[]:" }
                if (invalid) return null
                host = decoded(hostname)
                val asciiHost = if (hostname.all { it.code < 0x80 }) {
                    hostname
                } else {
                    runCatching { IDN.toASCII(hostname, IDN.ALLOW_UNASSIGNED) }.getOrNull() ?: return null
                }
                userInfo?.let { encoded(it, ":") + "@" }.orEmpty() + asciiHost + portText?.let { ":$it" }.orEmpty()
            }
            val path = encoded(groups[5]?.value.orEmpty(), ":@/")
            val query = groups[7]?.value?.let { encoded(it, ":@/?") }
            val fragment = groups[9]?.value?.let { encoded(it, ":@/?") }
            val text = buildString {
                if (scheme != null) append(scheme).append(':')
                if (authority != null) append("//").append(authority)
                append(path)
                if (query != null) append('?').append(query)
                if (fragment != null) append('#').append(fragment)
            }
            val url = try {
                URI(text)
            } catch (_: URISyntaxException) {
                null
            }
            return AppleURLComponents(scheme, user, password, host, port, url)
        }

        /** The part with each character a URL may not hold there percent-encoded, as UTF-8. */
        private fun encoded(part: String, allowed: String): String = buildString {
            var index = 0
            while (index < part.length) {
                val character = part[index]
                when {
                    isEscape(part, index) -> append(character)
                    character.code < 0x80 && (character.isLetterOrDigit() || character in UNRESERVED + SUB_DELIMITERS + allowed) ->
                        append(character)
                    else -> {
                        val codePoint = part.codePointAt(index)
                        for (byte in String(Character.toChars(codePoint)).encodeToByteArray()) {
                            append('%').append("%02X".format(byte.toInt() and 0xFF))
                        }
                        index += Character.charCount(codePoint)
                        continue
                    }
                }
                index++
            }
        }

        /** A "%" followed by two hexadecimal digits. */
        private fun isEscape(part: String, index: Int): Boolean =
            part[index] == '%' && index + 2 < part.length && part[index + 1].isHexDigit() && part[index + 2].isHexDigit()

        private fun Char.isHexDigit(): Boolean = this in '0'..'9' || this in 'a'..'f' || this in 'A'..'F'

        /** The part with its escapes decoded as UTF-8, as URLComponents gives its host and user. */
        private fun decoded(part: String): String {
            if ('%' !in part) return part
            val bytes = java.io.ByteArrayOutputStream()
            var index = 0
            while (index < part.length) {
                if (isEscape(part, index)) {
                    bytes.write(part.substring(index + 1, index + 3).toInt(16))
                    index += 3
                } else {
                    bytes.write(part[index].toString().encodeToByteArray())
                    index++
                }
            }
            return bytes.toByteArray().decodeToString()
        }
    }
}
