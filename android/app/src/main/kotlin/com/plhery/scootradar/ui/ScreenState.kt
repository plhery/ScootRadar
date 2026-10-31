package com.plhery.scootradar.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.SnapshotStateList
import androidx.compose.runtime.staticCompositionLocalOf
import com.plhery.scootradar.core.search.SwissAddressSearchModel
import com.plhery.scootradar.ui.settings.SettingsPage
import kotlinx.coroutines.CoroutineScope

/**
 * What the screen has open: the search, with what is typed in it and what it found, Filters, and Settings on its
 * page, as ScooterMapScreen.swift's @State has them. The activity's ViewModel keeps it, so that the activity Android
 * makes again for a new text size, Display size or Bold Text shows them as they were, as the iPhone's screen, never
 * made again, does; and the chrome made again in the phone's new language keeps the search as typed (X-M23). The
 * camera, the card and the walk are the controller's (X-AD17); the process's end takes it all, as the iPhone
 * app's does (X-AD18).
 */
@Stable
class ScreenState(
    /** Where the search's work runs: the ViewModel's, which outlives the screen that shows it. */
    private val scope: CoroutineScope,
) {
    private var searchOpen by mutableStateOf(false)
    private var settingsOpen by mutableStateOf(false)
    private var search: SwissAddressSearchModel? = null

    /** The search is open. Closing it ends it: the iPhone's panel starts a new search each time it opens. */
    var searchIsExpanded: Boolean
        get() = searchOpen
        set(value) {
            if (!value) {
                search?.cancel()
                search = null
            }
            searchOpen = value
        }

    var filtersPresented by mutableStateOf(false)

    /** Settings is open. It opens on its first page. */
    var settingsPresented: Boolean
        get() = settingsOpen
        set(value) {
            if (value && !settingsOpen) {
                settingsPages.clear()
                settingsPages.add(SettingsPage.Root)
            }
            settingsOpen = value
        }

    /** Settings' pages, the first at the bottom. */
    val settingsPages: SnapshotStateList<SettingsPage> = mutableStateListOf(SettingsPage.Root)

    /** The open search's model, made by [make], with the scope it runs in, the first time it is asked for. */
    fun search(make: (CoroutineScope) -> SwissAddressSearchModel): SwissAddressSearchModel =
        search ?: make(scope).also { search = it }
}

/** A [ScreenState] of the screen's own, for a screen no ViewModel keeps one for: the tests'. */
@Composable
fun rememberScreenState(): ScreenState {
    val scope = rememberCoroutineScope()
    return remember { ScreenState(scope) }
}

/** The screen's [ScreenState], for its search island; none for an island shown alone. */
internal val LocalScreenState = staticCompositionLocalOf<ScreenState?> { null }
