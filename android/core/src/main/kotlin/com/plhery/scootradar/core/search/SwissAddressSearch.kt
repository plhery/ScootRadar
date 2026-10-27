package com.plhery.scootradar.core.search

import com.plhery.scootradar.core.api.AddressSearchAPI
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.api.AddressSearchAPIError
import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.api.ScooterAnalytics
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScreenRect
import java.text.BreakIterator
import java.util.Locale
import kotlin.time.ComparableTimeMark
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.seconds
import kotlin.time.TimeSource
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

// KeyboardOverlap, SwissAddressSearchStatus and SwissAddressSearchModel from
// ios/ScootRadar/Views/SwissAddressSearch.swift; the rest of that file is the search field and its panel.

/**
 * Where the keyboard's top is in a window, from its frame in the window's coordinates. A keyboard that covers
 * nothing of the window's bottom leaves the panel free to run down to it: one hidden or below the window, as
 * under a window that ends above it, and a floating one, which comes as an empty frame or one over the middle
 * of the window.
 */
object KeyboardOverlap {
    fun top(of: ScreenRect, windowHeight: Double): Double {
        val keyboard = of
        if (keyboard.isEmpty || !(keyboard.minY < windowHeight) || !(keyboard.maxY >= windowHeight - 1)) {
            return Double.POSITIVE_INFINITY
        }
        return keyboard.minY
    }
}

/** What the open search shows under the field. */
sealed interface SwissAddressSearchStatus {
    /** Fewer than two characters typed: the panel shows its suggestions. */
    data object Idle : SwissAddressSearchStatus

    data object Searching : SwissAddressSearchStatus

    /** Never empty. Return chooses the first place. */
    data class Results(val results: List<AddressSearchResult>) : SwissAddressSearchStatus

    data object NoResults : SwissAddressSearchStatus

    /** The search could not be reached; "Try again" repeats it. */
    data object Failed : SwissAddressSearchStatus
}

/**
 * The search field's model: what is typed, and what the search found for it. It is confined to one thread, as
 * the iPhone's is to the main actor: the app calls it on the main thread, where its `scope` runs; tests call it
 * on the test's dispatcher.
 */
class SwissAddressSearchModel(
    /** Where the searches and their waits run: the screen's, on the main thread. */
    private val scope: CoroutineScope,
    /** Where searches are counted: the app's, as on the iPhone, which always counts them; null in tests. */
    private val analytics: ScooterAnalytics?,
    private val api: AddressSearchAPIClient = AddressSearchAPI(),
    private val debounce: Duration = 350.milliseconds,
    /** The wait after a search refused as one too many, when the server does not say how long. */
    private val rateLimitPause: Duration = 10.seconds,
    /**
     * Sent with every search, so country names come back in the language on screen; null is the language
     * the app is shown in when the search is sent.
     */
    private val language: String? = null,
    /** What the search's waits are timed by: the device's clock in the app, the scope's virtual time in tests. */
    private val clock: TimeSource.WithComparableMarks = TimeSource.Monotonic,
) {
    private val _query = MutableStateFlow("")

    /** The text in the field, the model's own clearing included. */
    val queryState: StateFlow<String> = _query.asStateFlow()

    /** The text in the field. Each change is searched for after a pause. */
    var query: String
        get() = _query.value
        set(value) {
            _query.value = value
            scheduleSearch(after = debounce)
        }

    private val _status = MutableStateFlow<SwissAddressSearchStatus>(SwissAddressSearchStatus.Idle)
    val status: StateFlow<SwissAddressSearchStatus> = _status.asStateFlow()

    /** Sent with every search, so places near the map come first. */
    var near: GeoPoint? = null

    private var searchTask: Job? = null

    /**
     * Until when the server refuses searches as too many. Nothing is sent before then, whatever is typed
     * meanwhile.
     */
    private var rateLimitedUntil: ComparableTimeMark? = null

    /** The place Return chooses. */
    val firstResult: AddressSearchResult?
        get() = (status.value as? SwissAddressSearchStatus.Results)?.results?.firstOrNull()

    /** Empties the field, which brings the suggestions back. */
    fun clear() {
        query = ""
    }

    fun cancel() {
        searchTask?.cancel()
        searchTask = null
        if (_status.value == SwissAddressSearchStatus.Searching) _status.value = SwissAddressSearchStatus.Idle
    }

    /** "Try again" after a failed search: the same text, searched at once. */
    fun retry() {
        scheduleSearch(after = Duration.ZERO)
    }

    fun select(result: AddressSearchResult): MapDestination {
        cancel()
        return result.destination
    }

    private fun scheduleSearch(after: Duration) {
        searchTask?.cancel()
        searchTask = null
        val trimmedQuery = query.trim(::isWhitespaceOrNewline)

        if (!trimmedQuery.hasTwoCharacters()) {
            _status.value = SwissAddressSearchStatus.Idle
            return
        }

        _status.value = SwissAddressSearchStatus.Searching
        searchTask = scope.launch {
            try {
                delay(after)
                search(trimmedQuery)
            } catch (cancellation: CancellationException) {
                throw cancellation
            } catch (error: Exception) {
                if (!isActive) return@launch
                analytics?.track("search_error")
                _status.value = SwissAddressSearchStatus.Failed
                searchTask = null
            }
        }
    }

    /**
     * Asks the server and shows its answer. Typing sends a request at every pause, which can use up the
     * searches allowed in a minute: a refusal for that reason is waited out for as long as the server asks,
     * with "Searching…" still up, instead of offering a "Try again" that would be refused as well. Text typed
     * during the wait waits for the same moment, and only the latest is asked for then.
     */
    private suspend fun search(text: String) {
        rateLimitedUntil?.let { delay(it - clock.markNow()) }
        val results = try {
            api.search(query = text, language = language ?: ScooterLanguage.current.rawValue, near = near)
        } catch (refusal: AddressSearchAPIError.RateLimited) {
            // Between a second and a minute, as on the web.
            val wait = (refusal.retryAfter ?: rateLimitPause).coerceIn(1.seconds, 60.seconds)
            rateLimitedUntil = clock.markNow() + wait
            return search(text)
        }
        currentCoroutineContext().ensureActive()
        if (query.trim(::isWhitespaceOrNewline) != text) return
        analytics?.track("search_results", value = results.size)
        _status.value = if (results.isEmpty()) SwissAddressSearchStatus.NoResults else SwissAddressSearchStatus.Results(results)
        searchTask = null
    }

    private companion object {
        /** Whether the text has two characters or more as Swift counts them, where "é" written as e and an accent is one. */
        fun String.hasTwoCharacters(): Boolean {
            val characters = BreakIterator.getCharacterInstance(Locale.ROOT).also { it.setText(this) }
            return characters.next() != BreakIterator.DONE && characters.next() != BreakIterator.DONE
        }

        /** CharacterSet.whitespacesAndNewlines: the space separators, the tab, and the line and paragraph breaks. */
        fun isWhitespaceOrNewline(character: Char): Boolean =
            character == '\t' || character.category == CharCategory.SPACE_SEPARATOR || character in '\n'..'\r' ||
                character == '\u0085' || character == '\u2028' || character == '\u2029'
    }
}
