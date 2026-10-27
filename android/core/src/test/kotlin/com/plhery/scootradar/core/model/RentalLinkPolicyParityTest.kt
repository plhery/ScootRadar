package com.plhery.scootradar.core.model

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The Android rental link policy trusts the schemes and https hosts the iPhone app's does
 * (ScooterRentalLinkPolicy in ScooterModels.swift), provider for provider: a host added to the Swift table
 * alone would otherwise drop that provider's links on Android without a sound.
 */
class RentalLinkPolicyParityTest {
    private val swift: String =
        File(System.getProperty("scootradar.repo"), "ios/ScootRadar/Models/ScooterModels.swift").readText()

    /** The text of the Swift declaration that starts with [start], without its comments, up to its closing "]". */
    private fun declaration(start: String): String {
        val from = swift.indexOf(start)
        assertTrue("No \"$start\" in ScooterModels.swift", from >= 0)
        val end = swift.indexOf("\n    ]", from).takeIf { it >= 0 } ?: swift.indexOf('\n', from)
        return swift.substring(from, end).lines().filterNot { it.trim().startsWith("//") }.joinToString("\n")
    }

    private fun strings(list: String): Set<String> = Regex("\"([^\"]*)\"").findAll(list).map { it.groupValues[1] }.toSet()

    @Test
    fun everyProviderTrustsTheSchemesAndHostsTheIPhoneTrusts() {
        val table = declaration("private static let policies: [String: ProviderPolicy] = [")
        val entries = Regex("\"([a-z0-9_]+)\": ProviderPolicy\\(\\s*schemes: \\[([^\\]]*)\\],\\s*httpsHosts: \\[([^\\]]*)\\]\\s*\\)")
            .findAll(table).associate { it.groupValues[1] to (strings(it.groupValues[2]) to strings(it.groupValues[3])) }
        assertEquals("entries read from the Swift table", Regex("ProviderPolicy\\(").findAll(table).count(), entries.size)

        assertEquals(entries.keys, ScooterRentalLinkPolicy.policies.keys)
        for ((provider, swiftPolicy) in entries) {
            val policy = ScooterRentalLinkPolicy.policies.getValue(provider)
            assertEquals("$provider's schemes", swiftPolicy.first, policy.schemes)
            assertEquals("$provider's https hosts", swiftPolicy.second, policy.httpsHosts)
        }
    }

    @Test
    fun theLinksThatAreNotRentalsAreTheIPhonesToo() {
        val line = declaration("private static let notRentalLinks")
        val pairs = Regex("\\(\"([^\"]*)\", \"([^\"]*)\"\\)").findAll(line).map { it.groupValues[1] to it.groupValues[2] }.toList()

        assertTrue(pairs.isNotEmpty())
        assertEquals(pairs, ScooterRentalLinkPolicy.notRentalLinks)
    }
}
