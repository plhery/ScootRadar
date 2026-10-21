import Foundation
import Synchronization

/// The languages the app is translated into.
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

    /// The languages as Settings lists them, by their own names: Deutsch,
    /// English, Español… A letter with an accent sorts with the letter.
    static let byName = allCases.sorted { $0.sortingName < $1.sortingName }

    private var sortingName: String {
        name.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: nil)
    }

    /// Its name in another language, as a line of a list starts: "Allemand"
    /// for German in French. Nil where it is its own name, as English is in
    /// English.
    func name(in language: ScooterLanguage) -> String? {
        let locale = Locale(identifier: language.rawValue)
        // Norwegian, as its own name Norsk says, not "Norwegian Bokmål".
        guard let name = locale.localizedString(forLanguageCode: self == .nb ? "no" : rawValue),
              let first = name.first
        else { return nil }
        let capitalised = String(first).uppercased(with: locale) + name.dropFirst()
        return capitalised == self.name ? nil : capitalised
    }

    /// The language of the first localization, as a bundle lists the ones it
    /// prefers; English when the app is not translated into it.
    init(localizations: [String]) {
        self = localizations.first
            .flatMap { Locale(identifier: $0).language.languageCode?.identifier }
            .flatMap(ScooterLanguage.init(rawValue:)) ?? .en
    }

    /// The language iOS picks for the app from a list of languages in order,
    /// such as the iPhone's: the first the app is translated into, or else
    /// English.
    init(preferences: [String], localizations: [String] = Bundle.main.localizations) {
        self.init(localizations: Bundle.preferredLocalizations(from: localizations, forPreferences: preferences))
    }

    /// The iPhone's languages in its order, whichever was chosen for the app.
    /// They are read from the iPhone's own preferences: once the app has a
    /// language of its own, Locale.preferredLanguages gives that one instead,
    /// and the app cannot read the global domain through UserDefaults.
    static var iPhoneLanguages: [String] {
        CFPreferencesCopyAppValue(ScooterLanguageChoice.key as CFString, kCFPreferencesAnyApplication) as? [String]
            ?? Locale.preferredLanguages
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

    /// Spanish as Mexico, the US and the rest of Latin America write it:
    /// "scooter" where Spain's copy says "patinete" ("Scooter de Lime"). Both
    /// words are masculine, so the sentence around the word stays as it is.
    /// The region of the iPhone picks it; it is not a language of its own.
    /// The regions are those CLDR gives es-419 as parent; the web does the
    /// same in src/lib/i18n.tsx.
    static let latinAmericanSpanishRegions: Set<String> = [
        "419", "AR", "BO", "BR", "BZ", "CL", "CO", "CR", "CU", "DO", "EC", "GT",
        "HN", "MX", "NI", "PA", "PE", "PR", "PY", "SV", "US", "UY", "VE",
    ]

    /// Whether the language says "scooter" for Spain's "patinete" in the region.
    func saysScooter(in region: @autoclosure () -> Locale.Region?) -> Bool {
        self == .es && region().map { Self.latinAmericanSpanishRegions.contains($0.identifier) } == true
    }

    /// A sentence of the app in the language as the region writes it.
    /// The region is only read for Spanish.
    func written(_ sentence: String, in region: @autoclosure () -> Locale.Region?) -> String {
        guard saysScooter(in: region()) else { return sentence }
        return sentence
            .replacingOccurrences(of: "Patinete", with: "Scooter")
            .replacingOccurrences(of: "patinete", with: "scooter")
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

/// What the language of the app follows: the iPhone's languages, or one
/// chosen for the app, in its Settings or in the iPhone's.
enum ScooterLanguageChoice: Hashable, Sendable {
    case automatic
    case language(ScooterLanguage)

    /// Where iOS reads, at launch, the language chosen for the app: in the
    /// app's own defaults, where the Settings of the iPhone keep theirs too.
    /// Without it, iOS follows the iPhone's languages.
    static let key = "AppleLanguages"

    /// The choice this run of the app was launched with.
    static let atLaunch = ScooterLanguageChoice(
        appDefaults: Bundle.main.bundleIdentifier.flatMap(UserDefaults.standard.persistentDomain(forName:)) ?? [:],
        shown: .atLaunch
    )

    /// A language when the app's own defaults name one, the one shown;
    /// else Automatic.
    init(appDefaults: [String: Any], shown: ScooterLanguage) {
        self = appDefaults[Self.key] == nil ? .automatic : .language(shown)
    }
}

extension String {
    /// A string of the app in the language it is shown in. Every
    /// `String(localized:)` of the app is this initialiser: Foundation's own,
    /// which it stands in front of, keeps to the language of the launch.
    init(localized key: String.LocalizationValue) {
        let language = ScooterLanguage.current
        self = language.written(String(localized: key, bundle: language.strings), in: language.locale.region)
    }

    /// The same, for a sentence about counts whose words Localizable.stringsdict
    /// puts in the form each count takes. Foundation picks that form by the
    /// rules of the locale, so the locale is the language shown, not the one of
    /// the launch: "21 stað" in Icelandic, where English rules give "21 staði".
    init(localizedCounting key: String.LocalizationValue) {
        let language = ScooterLanguage.current
        let locale = language.locale
        self = language.written(String(localized: key, bundle: language.strings, locale: locale), in: locale.region)
    }
}

extension String {
    /// The string set apart from the sentence it is put in, where it has letters written right to
    /// left: a Hebrew name followed by " · 4 min walk" would otherwise draw the dot and the number
    /// into its own run. Its direction is that of its first letter. A string written left to right
    /// is left as it is; the app is, in every language it has.
    var isolated: String {
        unicodeScalars.contains(where: Self.isRightToLeft) ? "\u{2068}\(self)\u{2069}" : self
    }

    /// A letter of Hebrew, Arabic, Syriac, Thaana or N'Ko, or one of their presentation forms.
    private static func isRightToLeft(_ scalar: Unicode.Scalar) -> Bool {
        switch scalar.value {
        case 0x0590...0x08FF, 0xFB1D...0xFDFF, 0xFE70...0xFEFC: true
        default: false
        }
    }
}
