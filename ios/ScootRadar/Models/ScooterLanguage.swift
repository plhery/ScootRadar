import Foundation
import Synchronization

/// The languages the app is translated into, in the order Settings lists them.
enum ScooterLanguage: String, CaseIterable, Identifiable, Sendable {
    case de
    case fr
    case it
    case nl
    case nb
    case pt
    case es
    case `is`
    case en

    var id: String { rawValue }

    /// Its name in the language itself, which is not translated.
    var name: String {
        switch self {
        case .de: "Deutsch"
        case .fr: "Français"
        case .it: "Italiano"
        case .nl: "Nederlands"
        case .nb: "Norsk"
        case .pt: "Português"
        case .es: "Español"
        case .is: "Íslenska"
        case .en: "English"
        }
    }

    /// The language of the first localization, as a bundle lists the ones it
    /// prefers; English when the app is not translated into it.
    init(localizations: [String]) {
        self = localizations.first
            .flatMap { Locale(identifier: $0).language.languageCode?.identifier }
            .flatMap(ScooterLanguage.init(rawValue:)) ?? .en
    }

    /// The language iOS chose for this run of the app: the one chosen in
    /// Settings, or else the first of the iPhone's languages the app speaks.
    static let atLaunch = ScooterLanguage(localizations: Bundle.main.preferredLocalizations)

    private static let shown = Mutex(atLaunch)

    /// The language the app is shown in. Choosing another in Settings changes
    /// it at once; what iOS itself draws follows at the next launch.
    static var current: ScooterLanguage {
        get { shown.withLock { $0 } }
        set { shown.withLock { $0 = newValue } }
    }

    /// The language in the region of the iPhone, as iOS makes it at launch:
    /// "fr_CH" writes 1 288 where "de_CH" writes 1’288.
    var locale: Locale {
        guard self != Self.atLaunch else { return .current }
        var components = Locale.Components(locale: .current)
        components.languageComponents = Locale.Language.Components(
            languageCode: Locale.LanguageCode(rawValue),
            script: nil,
            region: Locale.current.region
        )
        return Locale(components: components)
    }

    private static let strings = Dictionary(uniqueKeysWithValues: allCases.compactMap { language in
        Bundle.main.path(forResource: language.rawValue, ofType: "lproj")
            .flatMap(Bundle.init(path:))
            .map { (language, $0) }
    })

    /// Where the strings of the language are.
    fileprivate var strings: Bundle {
        Self.strings[self] ?? .main
    }
}

extension String {
    /// A string of the app in the language it is shown in. Every
    /// `String(localized:)` of the app is this initialiser: Foundation's own,
    /// which it stands in front of, keeps to the language of the launch.
    init(localized key: String.LocalizationValue) {
        self.init(localized: key, bundle: ScooterLanguage.current.strings)
    }

    /// The same, for a sentence about counts whose words Localizable.stringsdict
    /// puts in the form each count takes. Foundation picks that form by the
    /// rules of the locale, so the locale is the language shown, not the one of
    /// the launch: "21 stað" in Icelandic, where English rules give "21 staði".
    init(localizedCounting key: String.LocalizationValue) {
        let language = ScooterLanguage.current
        self.init(localized: key, bundle: language.strings, locale: language.locale)
    }
}
