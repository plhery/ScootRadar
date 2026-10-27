package com.plhery.scootradar.core.model

// ScooterChromeLayout, ScooterFold, ScooterKeyCommand and ScooterMenuBar from
// ios/ScootRadar/Views/ScooterMapScreen.swift; the rest of that file is the screen.

/**
 * How the controls stand over the map: a phone's search bar at the top and dock at the bottom, or, in a window
 * wide and tall enough for both, a panel down the leading side beside the map, as on the website on a computer.
 * Chosen from the room the window has, never from what device it is on. Sizes are in points, which are dp.
 */
enum class ScooterChromeLayout {
    Dock,
    Panel,
    ;

    companion object {
        /** The panel's width; larger text needs more. */
        fun panelWidth(largeText: Boolean): Double = if (largeText) 420.0 else 380.0

        /** The least map worth showing beside the panel. */
        const val minimumMapWidth: Double = 380.0

        /**
         * How much wider than it needs a window must be to open the panel. A window resized across the
         * threshold doesn't flip back and forth, and iPad mini upright, 744 points, keeps the dock.
         */
        const val slack: Double = 20.0

        /**
         * The layout for a window `width` points across inside its safe area. Only a window regular both ways
         * has the panel: a phone's, a folding phone's and a narrow tablet window's are compact one way or the
         * other. The panel opens with `slack` to spare and stays until the map would get less than its
         * minimum.
         */
        fun resolve(
            width: Double,
            regularWidth: Boolean,
            regularHeight: Boolean,
            largeText: Boolean,
            current: ScooterChromeLayout,
        ): ScooterChromeLayout {
            if (!regularWidth || !regularHeight) return Dock
            val both = panelWidth(largeText) + minimumMapWidth
            return if (width >= (if (current == Panel) both else both + slack)) Panel else Dock
        }
    }
}

/**
 * The fold of a partly open folding phone, which the system reserves as a division of the window: there
 * while the phone is partly open, of no width flat. Open like a book and held sideways, it runs down the
 * middle of the window: the panel keeps to the leading half and the map centres what it shows in the
 * trailing one. Standing like a laptop, upright, it runs across: the map takes the upright half, and the
 * search bar, the notices and the dock go down to the half lying flat, within reach. The map stays whole
 * under both, and only what has to moves.
 */
object ScooterFold {
    /**
     * The fold among the `among` regions read in `container`, the frame of the screen in window
     * coordinates, in window coordinates too.
     */
    fun frame(among: List<ScreenRect>, container: ScreenRect): ScreenRect? =
        among.firstOrNull { !it.isEmpty }?.offsetBy(dx = container.minX, dy = container.minY)

    /** Whether the fold runs across the window, standing like a laptop, rather than down it, open like a book. */
    fun isAcross(fold: ScreenRect): Boolean = fold.standardized.width > fold.standardized.height

    /**
     * How far below the top of `container`, the screen in window coordinates, the search bar starts: under
     * a fold across it, and at its top otherwise.
     */
    fun chromeTop(below: ScreenRect?, container: ScreenRect): Double {
        val fold = below
        if (fold == null || !isAcross(fold) || !(fold.maxY > container.minY) || !(fold.maxY < container.maxY)) return 0.0
        return fold.maxY - container.minY
    }

    /** The narrowest the panel gets to keep clear of a fold. */
    const val minimumPanelWidth: Double = 320.0

    /**
     * The panel's `width` `beside` a fold down `container`, `inset` from its leading edge: as wide as it is,
     * unless that would reach the fold.
     */
    fun panelWidth(width: Double, beside: ScreenRect?, container: ScreenRect, inset: Double, rightToLeft: Boolean): Double {
        val fold = beside
        if (fold == null || isAcross(fold)) return width
        val room = if (rightToLeft) container.maxX - inset - fold.maxX else fold.minX - container.minX - inset
        if (!(room > 0 && room < width)) return width
        return swiftMax(minimumPanelWidth, room)
    }
}

/**
 * The keys of a hardware keyboard on the map screen, as in Maps: ⌘F or / opens the search, ⌘L locates, ⌘+ and
 * ⌘− zoom, ⌥⌘F opens the filters, ⌘1 to ⌘3 choose the map's look, ⌘, opens Settings, Esc closes the search and
 * then the card, and ⌘\ folds or opens the panel of a large window. Each is a key and its modifiers, as the
 * iPhone names them; the app turns them into its keyboard's own.
 */
enum class ScooterKeyCommand {
    Search,
    SearchWithSlash,
    NearMe,
    ZoomIn,

    /** ⌘= is ⌘+ on a keyboard where + takes Shift. */
    ZoomInWithoutShift,
    ZoomOut,
    Filters,
    StandardMap,
    QuietMap,
    SatelliteMap,
    Settings,
    Close,
    Fold,
    ;

    /** The screen as the keyboard finds it. */
    data class Situation(
        val layout: ScooterChromeLayout,
        val isSearching: Boolean = false,
        /** The filters or Settings are open, in a sheet or a popover. */
        val isPresenting: Boolean = false,
        /** The card of a scooter or a bay. */
        val hasCard: Boolean = false,
        val isFolded: Boolean = false,
        val isLocating: Boolean = false,
    )

    /** What Esc closes. */
    enum class Closing {
        Card,
        Search,
    }

    /** A key as SwiftUI's KeyEquivalent has it: the character it types, Esc's being U+001B. */
    data class Key(val character: Char) {
        companion object {
            val escape: Key = Key('\u001B')
        }
    }

    /** The keys held with it. */
    enum class Modifier {
        Command,
        Option,
    }

    val key: Key
        get() = when (this) {
            Search, Filters -> Key('f')
            SearchWithSlash -> Key('/')
            NearMe -> Key('l')
            ZoomIn -> Key('+')
            ZoomInWithoutShift -> Key('=')
            ZoomOut -> Key('-')
            StandardMap -> Key('1')
            QuietMap -> Key('2')
            SatelliteMap -> Key('3')
            Settings -> Key(',')
            Close -> Key.escape
            Fold -> Key('\\')
        }

    val modifiers: Set<Modifier>
        get() = when (this) {
            SearchWithSlash, Close -> emptySet()
            Filters -> setOf(Modifier.Command, Modifier.Option)
            else -> setOf(Modifier.Command)
        }

    /** The look of the map it chooses, for ⌘1 to ⌘3. */
    val mapStyle: AppleMapStyle?
        get() = when (this) {
            StandardMap -> AppleMapStyle.Standard
            QuietMap -> AppleMapStyle.Quiet
            SatelliteMap -> AppleMapStyle.Satellite
            else -> null
        }

    /** What the keyboard's list of shortcuts calls it. */
    fun title(situation: Situation): String = when (this) {
        Search, SearchWithSlash -> localized("Search")
        NearMe -> localized("Near me")
        ZoomIn, ZoomInWithoutShift -> localized("Zoom in")
        ZoomOut -> localized("Zoom out")
        Filters -> localized("Filters")
        StandardMap -> AppleMapStyle.Standard.label
        QuietMap -> AppleMapStyle.Quiet.label
        SatelliteMap -> AppleMapStyle.Satellite.label
        Settings -> localized("Settings")
        Close -> localized("Close")
        Fold -> if (situation.isFolded) localized("Expand panel") else localized("Collapse panel")
    }

    companion object {
        /**
         * The shortcuts that stand. Only these are made, so that the others take no key from anything. None
         * while the filters or Settings are open: the keys a sheet or a popover doesn't take go on to the
         * screen that presented it, and a "/" typed in it, or an Esc meant for it, would act on the map under
         * it. "/" stands only while the search's field isn't there to take it, Esc only while there is
         * something to close, ⌘L not while locating, as the locate button, and ⌘\ only beside a panel,
         * since a phone's dock doesn't fold.
         */
        fun available(situation: Situation): List<ScooterKeyCommand> {
            if (situation.isPresenting) return emptyList()
            return entries.filter { command ->
                when (command) {
                    SearchWithSlash -> !situation.isSearching
                    Close -> closing(situation) != null
                    NearMe -> !situation.isLocating
                    Fold -> situation.layout == ScooterChromeLayout.Panel
                    else -> true
                }
            }
        }

        /** Esc closes what is in front first: the search, which covers the card, then the card of a scooter or a bay. */
        fun closing(situation: Situation): Closing? {
            if (situation.isSearching) return Closing.Search
            if (situation.hasCard) return Closing.Card
            return null
        }
    }
}

/**
 * The menu bar of an iPad, and of a Mac running the iPad app, as in Maps: Settings in the app's menu, a Map
 * menu, and the map's looks and the panel in View. The screen says what stands now, so an item is dimmed where
 * its key would do nothing. The screen keeps its own key buttons as well, and where both answer a key they do
 * the same thing. "/", ⌘= and Esc stay off the menus.
 */
object ScooterMenuBar {
    /** The Map menu, in groups between dividers. */
    val map: List<List<ScooterKeyCommand>> = listOf(
        listOf(ScooterKeyCommand.Search, ScooterKeyCommand.NearMe),
        listOf(ScooterKeyCommand.ZoomIn, ScooterKeyCommand.ZoomOut),
        listOf(ScooterKeyCommand.Filters),
    )

    /** What View lists before its own items: the map's looks, then the panel. */
    val view: List<List<ScooterKeyCommand>> = listOf(
        listOf(ScooterKeyCommand.StandardMap, ScooterKeyCommand.QuietMap, ScooterKeyCommand.SatelliteMap),
        listOf(ScooterKeyCommand.Fold),
    )
}
