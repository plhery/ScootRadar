package com.plhery.scootradar.core.search

import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.api.AddressSearchAPIError
import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.search.SwissAddressSearchStatus.Failed
import com.plhery.scootradar.core.search.SwissAddressSearchStatus.Idle
import com.plhery.scootradar.core.search.SwissAddressSearchStatus.NoResults
import com.plhery.scootradar.core.search.SwissAddressSearchStatus.Results
import com.plhery.scootradar.core.search.SwissAddressSearchStatus.Searching
import java.io.IOException
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.seconds
import kotlin.time.TimeSource
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

// The AddressSearchModelTests of ios/ScootRadarTests/ScooterAPITests.swift. The searches run in the test's
// virtual time, which stands for their TestSearchClock: a wait ends only when the test moves the time to it.
class AddressSearchModelTest {
    private val zurich = AddressSearchResult(
        latitude = 47.3690, longitude = 8.5390, displayName = "Paradeplatz (ZH) - Zürich",
        title = "Paradeplatz", subtitle = "Zürich ZH", isCovered = true,
    )
    private val lungern = AddressSearchResult(
        latitude = 46.7741, longitude = 8.1558, displayName = "Paradeplatz (OW) - Lungern",
        title = "Paradeplatz", subtitle = "Lungern OW", isCovered = false,
    )

    @After
    fun showTheLaunchLanguage() {
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    @Test
    fun searchStartsAtTwoCharactersAndReturnChoosesTheFirstPlace() = runTest {
        val api = StubAddressSearchClient(answers = listOf(Answer.Places(listOf(zurich, lungern))))
        val model = SwissAddressSearchModel(scope = backgroundScope, api = api, debounce = Duration.ZERO)
        assertEquals(Idle, model.status.value)
        assertNull(model.firstResult)

        // One character keeps the suggestions on screen and asks nothing.
        model.query = "P"
        assertEquals(Idle, model.status.value)

        model.query = " Paradeplatz "
        assertEquals(Searching, model.status.value)
        val found = waitUntil { model.status.value != Searching }
        assertTrue(found)
        assertEquals(Results(listOf(zurich, lungern)), model.status.value)
        assertEquals(zurich, model.firstResult)
        assertEquals(listOf("Paradeplatz"), api.queries)

        // The chosen place carries its two lines and whether it has scooter data.
        val unserved = model.select(lungern)
        assertEquals("Paradeplatz", unserved.title)
        assertEquals("Lungern OW", unserved.subtitle)
        assertFalse(unserved.isCovered)
        assertTrue(model.select(zurich).isCovered)
    }

    @Test
    fun nothingFoundAndAFailedSearchAreToldApartAndTryAgainSearchesAgain() = runTest {
        val api = StubAddressSearchClient(answers = listOf(Answer.Places(emptyList()), Answer.Failure, Answer.Places(listOf(zurich))))
        val model = SwissAddressSearchModel(scope = backgroundScope, api = api, debounce = Duration.ZERO)

        model.query = "Xyzzy"
        var settled = waitUntil { model.status.value != Searching }
        assertTrue(settled)
        assertEquals(NoResults, model.status.value)
        assertNull(model.firstResult)

        model.query = "Zürich"
        settled = waitUntil { model.status.value != Searching }
        assertTrue(settled)
        assertEquals(Failed, model.status.value)

        // Try again repeats the search for the text in the field.
        model.retry()
        assertEquals(Searching, model.status.value)
        settled = waitUntil { model.status.value != Searching }
        assertTrue(settled)
        assertEquals(Results(listOf(zurich)), model.status.value)
        assertEquals(listOf("Xyzzy", "Zürich", "Zürich"), api.queries)
    }

    @Test
    fun aSearchRefusedAsOneTooManyWaitsAsLongAsTheServerAsks() = runTest {
        // The server asks for three seconds; the pause for a refusal that names none is far shorter.
        val clock = testScheduler.timeSource
        val api = RateLimitedAddressSearchClient(retryAfter = 3.seconds, places = listOf(zurich), clock = clock)
        val model = SwissAddressSearchModel(
            scope = backgroundScope, api = api, debounce = Duration.ZERO, rateLimitPause = 20.milliseconds, clock = clock,
        )

        // Refused, the search waits.
        model.query = "Paradeplatz"
        runCurrent()

        // "Searching…" stays up through the wait; "Try again" never shows.
        assertEquals(Searching, model.status.value)
        advanceTimeBy(3.seconds - 1.milliseconds)
        runCurrent()
        assertEquals(Searching, model.status.value)
        assertEquals(listOf("Paradeplatz"), api.queries)

        advanceTimeBy(1.milliseconds)
        runCurrent()
        val settled = waitUntil { model.status.value != Searching }
        assertTrue(settled)
        assertEquals(Results(listOf(zurich)), model.status.value)
        // Asked once, then again once the server allowed it, and not before.
        assertEquals(listOf("Paradeplatz", "Paradeplatz"), api.queries)
        assertEquals(listOf(Duration.ZERO, 3.seconds), api.times)
        assertEquals(1, api.refusals)
    }

    @Test
    fun textTypedDuringTheWaitIsAskedForOnlyOnceTheServerAllowsIt() = runTest {
        val clock = testScheduler.timeSource
        val api = RateLimitedAddressSearchClient(retryAfter = 1.seconds, places = listOf(zurich), clock = clock)
        val model = SwissAddressSearchModel(
            scope = backgroundScope, api = api, debounce = Duration.ZERO, rateLimitPause = 20.milliseconds, clock = clock,
        )

        // Refused, the search waits for the moment the server named.
        model.query = "Par"
        runCurrent()

        // Typing on asks nothing while the server refuses searches, and "Searching…" stays up.
        // Each text cancels the previous one's wait and starts its own.
        model.query = "Para"
        runCurrent()
        model.query = "Parade"
        runCurrent()
        assertEquals(listOf("Par"), api.queries)
        assertEquals(Searching, model.status.value)

        // Once it allows them again, only the latest text is asked for.
        advanceTimeBy(1.seconds)
        runCurrent()
        val settled = waitUntil { model.status.value != Searching }
        assertTrue(settled)
        assertEquals(Results(listOf(zurich)), model.status.value)
        assertEquals(listOf("Par", "Parade"), api.queries)
        assertEquals(listOf(Duration.ZERO, 1.seconds), api.times)
        assertEquals(1, api.refusals)
    }

    @Test
    fun clearingTheFieldBringsTheSuggestionsBackAndDropsALateAnswer() = runTest {
        val api = StubAddressSearchClient(answers = listOf(Answer.Places(listOf(zurich))), delay = 60.milliseconds)
        val model = SwissAddressSearchModel(scope = backgroundScope, api = api, debounce = Duration.ZERO)

        model.query = "Paradeplatz"
        assertEquals(Searching, model.status.value)
        model.clear()
        assertEquals("", model.query)
        assertEquals("", model.queryState.value)
        assertEquals(Idle, model.status.value)

        // The answer to the cleared text arrives later and changes nothing.
        advanceTimeBy(150.milliseconds)
        assertEquals(Idle, model.status.value)
    }

    @Test
    fun everySearchAsksForPlacesInTheLanguageOnScreen() = runTest {
        val api = StubAddressSearchClient(answers = listOf(Answer.Failure, Answer.Places(listOf(zurich)), Answer.Places(listOf(lungern))))
        val model = SwissAddressSearchModel(scope = backgroundScope, api = api, debounce = Duration.ZERO, language = "fr")

        model.query = "Paradeplatz"
        var settled = waitUntil { model.status.value != Searching }
        assertTrue(settled)
        model.retry()
        settled = waitUntil { model.status.value != Searching }
        assertTrue(settled)
        model.query = "Lungern"
        settled = waitUntil { model.status.value != Searching }
        assertTrue(settled)

        // The first search, the one after "Try again" and the next text all carry it.
        assertEquals(listOf("fr", "fr", "fr"), api.languages)
    }

    @Test
    fun everySearchSendsTheMapCentreItIsGiven() = runTest {
        val api = StubAddressSearchClient(answers = listOf(Answer.Places(listOf(zurich)), Answer.Places(listOf(zurich))))
        val model = SwissAddressSearchModel(scope = backgroundScope, api = api, debounce = Duration.ZERO)

        model.query = "Paradeplatz"
        var settled = waitUntil { model.status.value != Searching }
        assertTrue(settled)

        model.near = GeoPoint(latitude = 47.37, longitude = 8.54)
        model.query = "Bahnhofstrasse 1"
        settled = waitUntil { model.status.value != Searching }
        assertTrue(settled)

        assertEquals(listOf(null, GeoPoint(latitude = 47.37, longitude = 8.54)), api.nears)
    }

    @Test
    fun searchLanguageIsTheOneTheAppIsShownIn() = runTest {
        assertEquals(ScooterLanguage.De, ScooterLanguage.fromLocalizations(listOf("de")))
        assertEquals(ScooterLanguage.Fr, ScooterLanguage.fromLocalizations(listOf("fr", "en")))
        assertEquals(ScooterLanguage.It, ScooterLanguage.fromLocalizations(listOf("it-CH")))
        assertEquals(ScooterLanguage.En, ScooterLanguage.fromLocalizations(listOf("en-GB")))
        assertEquals(ScooterLanguage.Nl, ScooterLanguage.fromLocalizations(listOf("nl-BE")))
        assertEquals(ScooterLanguage.Nb, ScooterLanguage.fromLocalizations(listOf("nb")))
        assertEquals(ScooterLanguage.Pt, ScooterLanguage.fromLocalizations(listOf("pt-PT")))
        assertEquals(ScooterLanguage.Es, ScooterLanguage.fromLocalizations(listOf("es")))
        assertEquals(ScooterLanguage.Is, ScooterLanguage.fromLocalizations(listOf("is")))
        // Anything the app is not translated into is shown, and searched, in English.
        assertEquals(ScooterLanguage.En, ScooterLanguage.fromLocalizations(listOf("sv")))
        assertEquals(ScooterLanguage.En, ScooterLanguage.fromLocalizations(listOf("Base")))
        assertEquals(ScooterLanguage.En, ScooterLanguage.fromLocalizations(emptyList()))

        // Left to itself, the model sends the language this run of the app is shown in: the one Android
        // chose at launch, which the app sets as it starts.
        val shownIn = ScooterLanguage.atLaunch.rawValue
        assertTrue(shownIn, shownIn in listOf("en", "de", "fr", "it", "nl", "nb", "pt", "es", "is"))
        val api = StubAddressSearchClient(answers = listOf(Answer.Places(listOf(zurich)), Answer.Places(listOf(zurich))))
        val model = SwissAddressSearchModel(scope = backgroundScope, api = api, debounce = Duration.ZERO)
        model.query = "Paradeplatz"
        var settled = waitUntil { model.status.value != Searching }
        assertTrue(settled)

        // And the one chosen in Settings from then on.
        val other = if (shownIn == "it") ScooterLanguage.Fr else ScooterLanguage.It
        ScooterLanguage.current = other
        model.query = "Bellevue"
        settled = waitUntil { model.status.value != Searching }
        assertTrue(settled)
        assertEquals(listOf(shownIn, other.rawValue), api.languages)
    }

    /**
     * Up to ten seconds, as on the iPhone, of the test's virtual time, which costs nothing. The searches run in
     * the background scope, which advanceUntilIdle leaves alone.
     */
    private fun TestScope.waitUntil(condition: () -> Boolean): Boolean {
        repeat(1000) {
            runCurrent()
            if (condition()) return true
            advanceTimeBy(10.milliseconds)
        }
        runCurrent()
        return condition()
    }

    private sealed interface Answer {
        data class Places(val places: List<AddressSearchResult>) : Answer

        data object Failure : Answer
    }

    private class StubAddressSearchClient(answers: List<Answer>, private val delay: Duration = Duration.ZERO) : AddressSearchAPIClient {
        private val answers = answers.toMutableList()
        val queries = mutableListOf<String>()
        val languages = mutableListOf<String>()
        val nears = mutableListOf<GeoPoint?>()

        override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> {
            queries += query
            languages += language
            nears += near
            val answer = answers.removeFirstOrNull() ?: Answer.Places(emptyList())
            delay(delay)
            return when (answer) {
                is Answer.Places -> answer.places
                Answer.Failure -> throw IOException("notConnectedToInternet")
            }
        }
    }

    /**
     * Refuses searches as too many, as the server does, until the time its first refusal named has passed,
     * and answers every search from then on.
     */
    private class RateLimitedAddressSearchClient(
        private val retryAfter: Duration,
        private val places: List<AddressSearchResult>,
        private val clock: TimeSource.WithComparableMarks,
    ) : AddressSearchAPIClient {
        private val start = clock.markNow()
        private var allowedFrom: Duration? = null
        val queries = mutableListOf<String>()

        /** When each search was asked for, from the start of the test. */
        val times = mutableListOf<Duration>()
        var refusals = 0

        override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> {
            queries += query
            val now = start.elapsedNow()
            times += now
            val allowedFrom = allowedFrom ?: (now + retryAfter)
            this.allowedFrom = allowedFrom
            if (now < allowedFrom) {
                refusals += 1
                throw AddressSearchAPIError.RateLimited(retryAfter = retryAfter)
            }
            return places
        }
    }
}
