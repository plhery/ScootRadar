// The words of the landing page, src/app/(site)/[[...path]]/page.tsx. It is
// rendered on the server only, so none of this reaches the browser as script.
//
// The labels of the app the page redraws (the walk, the price, the two buttons,
// the battery filter) are worded as src/lib/i18n.tsx words them. German is
// written the Swiss way, as the app is: "ss", never "ß". French has a no-break
// space before a colon, a semicolon and a percent sign. Portuguese is written
// the European way, with the 1990 spelling, and speaks to the reader in the
// third person, never with "você". Spanish is written as in Spain, with « »
// and a no-break space before a percent sign. Icelandic calls a shared
// e-scooter a "rafskúta", as Hopp does, and keeps a name it cannot decline out
// of a preposition's reach: "frá: {place}", "{name}-appið".

import { COUNTRY_CODES, COUNTRY_NAMES, type CountryCode, type CountryNameLanguage } from '@/generated/countries';
import { formatLocale } from '@/lib/formatLocale';
import { DEFAULT_LANDING_LOCALE, type LandingLocale } from '@/lib/landingAddress';
import { isSingular } from '@/lib/uiText';

export {
  DEFAULT_LANDING_LOCALE,
  LANDING_LOCALES,
  isLandingLocale,
  landingLocaleOf,
  landingPath,
  type LandingLocale,
} from '@/lib/landingAddress';

export const LANGUAGE_NAMES: Record<LandingLocale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  nl: 'Nederlands',
  nb: 'Norsk',
  pt: 'Português',
  es: 'Español',
  is: 'Íslenska',
};

export const SOURCE_URL = 'https://github.com/plhery/ScootRadar';

/**
 * Where the last line of the page leads: the other sites of the person who
 * makes ScootRadar, and that person on X. Each of those sites links to the
 * others the same way, with plain links a search engine follows, to the address
 * the site names as canonical for the language (read on 2026-10-14). A plain
 * link keeps the referrer, so each site sees a visit came from another: no
 * "noreferrer", no "nofollow", no campaign tags. All three are in English,
 * German, French, Italian, Portuguese and Spanish, Unfollow Monkey in Dutch as
 * well; a language a site lacks leads to its English page.
 */
export function makerLinks(locale: LandingLocale): Readonly<Record<string, string>> {
  const shared: LandingLocale[] = ['en', 'de', 'fr', 'it', 'pt', 'es'];
  const within = (languages: LandingLocale[]) => (languages.includes(locale) ? locale : DEFAULT_LANDING_LOCALE);
  const peek = within(shared);
  return {
    maker: 'https://x.com/plhery',
    horoscope: `https://x-horoscope.com/${within(shared)}/x`,
    monkey: `https://unfollow-monkey.com/${within([...shared, 'nl'])}`,
    // Peek's English page is the domain itself.
    peek: peek === DEFAULT_LANDING_LOCALE ? 'https://peektracker.com' : `https://peektracker.com/${peek}`,
  };
}

/**
 * A count and its noun, in the form the language gives that count by its
 * plural rules: "17 countries", "1 country", and in Icelandic "21 landi" but
 * "22 löndum", since a count ending in 1, except 11, takes the singular. A
 * no-break space keeps the count on the line of its noun.
 */
function counted(locale: LandingLocale, count: number, one: string, other: string): string {
  return `${new Intl.NumberFormat(formatLocale(locale)).format(count)}\u00a0${isSingular(count, locale) ? one : other}`;
}

/** A sentence cut at its links: what it writes as "<name>words</name>" is the words of the link of that name. */
export function linkedParts(sentence: string): { text: string; link?: string }[] {
  const parts: { text: string; link?: string }[] = [];
  let read = 0;
  for (const tag of sentence.matchAll(/<(\w+)>(.*?)<\/\1>/g)) {
    parts.push({ text: sentence.slice(read, tag.index) }, { text: tag[2], link: tag[1] });
    read = tag.index + tag[0].length;
  }
  return [...parts, { text: sentence.slice(read) }].filter(part => part.text);
}

export type LandingCountry = CountryCode;

// The countries' names in one language, from data/countries.json.
function countryNames(language: CountryNameLanguage): Record<LandingCountry, string> {
  return Object.fromEntries(COUNTRY_CODES.map(code => [code, COUNTRY_NAMES[code][language]])) as Record<LandingCountry, string>;
}

export interface LandingCopy {
  meta: {
    title: string;
    description: (cities: number) => string;
    /** The picture a shared link shows, public/share/<locale>.png: scripts/generate-share-images.mjs draws it. */
    share: { title: string; alt: string };
  };
  nav: {
    main: string;
    shows: string;
    cities: string;
    languages: string;
    /** The third seat of the languages, which opens the list of all of them. */
    others: string;
  };
  openMap: string;
  /** The button to the App Store, under "Open the map" at the top of the page and at its end. */
  iphoneApp: string;
  /** Beside the QR code of the App Store link, on a wide screen. */
  scanQr: string;
  hero: {
    /** The number is the one on the capture beside the headline: the scooters in view there. */
    title: (scooters: number) => string;
    lede: string;
    /** The share picture prints the note; the page ends it with the link to the code, worded here. */
    note: string;
    openSource: string;
    stage: string;
    alt: (scooters: number) => string;
  };
  /** What a card beside the phone says under the name of its provider. */
  card: {
    walk: (minutes: number) => string;
    range: (distance: string) => string;
    price: (price: string, minutes: number) => string;
    bike: string;
  };
  know: {
    title: string;
    /** The text names the providers of src/lib/landingSnapshot.ts, by Zürich main station. */
    all: {
      title: string;
      text: string;
      close: (first: string, firstDistance: string, second: string, secondDistance: string) => string;
      providers: string;
      alt: string;
    };
    walk: { title: string; text: string };
    charge: { title: string; text: string; any: string; control: string };
    /** "Ten minutes" is the ride the app estimates first, DEFAULT_RIDE_DURATION. */
    price: {
      title: string;
      text: string;
      ride: (name: string) => string;
      duration: (minutes: number) => string;
      control: string;
    };
    unlock: {
      title: string;
      text: string;
      directions: string;
      openIn: (name: string) => string;
      /** The two labels above, for the drawing of the buttons. */
      control: (directions: string, openIn: string) => string;
    };
    looks: { title: string; text: string; light: string; dark: string };
  };
  cities: {
    title: (cities: number) => string;
    /** Opens with the number of providers and countries; the title above gives the cities'. */
    lede: (providers: number, countries: number) => string;
    countries: Record<LandingCountry, string>;
    more: (count: number) => string;
    alt: string;
  };
  /** What people ask a search engine before they find the map, answered. */
  faq: { title: string; items: readonly { question: string; answer: string }[] };
  /** The note links what it calls "source" to the code. */
  closing: { title: string; note: string };
  footer: {
    text: string;
    links: string;
    privacy: string;
    source: string;
    /** The heading of the guides, src/lib/guides.ts, and their name in the trail above a guide. */
    guides: string;
    /** The last line, with a link for each name of makerLinks. Peek is called what its own page calls it. */
    maker: string;
  };
}

export const LANDING_COPY: Record<LandingLocale, LandingCopy> = {
  en: {
    meta: {
      title: 'E-scooter map: Lime, Bolt, Bird, Voi, Dott and more | ScootRadar',
      description: cities =>
        `Every shared e-scooter near you on one live map: Lime, Bolt, Bird, Voi, Dott, Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT and Qick. Free, no account, in ${cities} cities.`,
      share: {
        title: 'Every e-scooter on one map.',
        alt: 'Every e-scooter on one map: the app at night by Zürich main station, beside the initials of twelve providers.',
      },
    },
    nav: {
      main: 'Main',
      shows: 'What it shows',
      cities: 'Cities',
      languages: 'Language',
      others: 'Others',
    },
    openMap: 'Open the map',
    iphoneApp: 'Get the iPhone app',
    scanQr: 'Scan with your iPhone’s camera',
    hero: {
      title: scooters => `There are ${scooters} scooters around you.`,
      lede: 'ScootRadar puts every shared e-scooter around you on one map, whoever runs it, so the closest way home is the first thing you see.',
      note: 'Free. No account, no ads.',
      openSource: 'Open source',
      stage: 'ScootRadar by Zürich main station',
      alt: scooters =>
        `The iPhone app at night: the dark streets by Zürich main station, each scooter a dot of light in its provider’s colour, the nearest of each provider named with its walking time, and ${scooters} scooters in view.`,
    },
    card: {
      walk: minutes => `≈${minutes} min walk`,
      range: distance => `${distance} of range`,
      price: (price, minutes) => `≈ ${price} for ${minutes} min`,
      bike: 'A bike, for a change',
    },
    know: {
      title: 'Everything you want to know before you start walking.',
      all: {
        title: 'Every provider. One map.',
        text: 'In a city like Zürich, Bird, Bolt, Dott, Hopp, Lime, Voi and PubliBike each have an app that shows only their own fleet. ScootRadar shows the lot, so the nearest one is simply the nearest one.',
        close: (first, firstDistance, second, secondDistance) =>
          `By Zürich main station, a ${first} is ${firstDistance} away and a ${second} is ${secondDistance}. It takes two apps to learn that, or one map.`,
        providers: 'Providers in Zürich',
        alt: 'The app by day beside the Fraumünster in Zürich, the nearest scooter of each provider named with its walking time.',
      },
      walk: {
        title: 'Know the walk.',
        text: 'Distance and walking time from where you stand, or from an address you look up.',
      },
      charge: {
        title: 'Skip the flat ones.',
        text: 'A scooter shows its battery and remaining range when its provider publishes them. Set a minimum and the map keeps only the scooters that reach it; those with no battery info are hidden.',
        any: 'Any',
        control: 'The battery filter, set to 60% or more',
      },
      price: {
        title: 'Price, before you commit.',
        text: 'An estimate from the provider’s published rates, for the ride you have in mind: 5 to 30 minutes. The provider’s app shows the final price.',
        ride: name => `${name}, for a ten-minute ride`,
        duration: minutes => `${minutes} min`,
        control: 'The length of the ride, set to 10 minutes',
      },
      unlock: {
        title: 'One tap to the right app.',
        text: 'It opens the provider’s own app, where you unlock and pay as usual. Opening it doesn’t reserve the scooter.',
        directions: 'Directions',
        openIn: name => `Open in ${name}`,
        control: (directions, openIn) => `The two buttons shown for a scooter: ${directions} and ${openIn}`,
      },
      looks: {
        title: 'Light by day. Dark by night.',
        text: 'The map follows your device’s appearance, or you pick one and keep it. In English, German, French, Italian, Dutch, Norwegian, Portuguese, Spanish or Icelandic.',
        light: 'Santa Monica Pier by day, in the map’s light appearance.',
        dark: 'The same pier at night, in its dark appearance.',
      },
    },
    cities: {
      title: cities => `${counted('en', cities, 'city', 'cities')}.`,
      lede: (providers, countries) =>
        `Shared e-scooters from ${counted('en', providers, 'provider', 'providers')} in ${counted('en', countries, 'country', 'countries')}. Where no provider publishes its data, the map says so and points you to the closest cities that have it. Pick a city to open the map there.`,
      countries: countryNames('en'),
      more: count => `and ${count} more`,
      alt: 'The map at night, zoomed out over Europe, with the number of scooters on each city.',
    },
    faq: {
      title: 'Before you ask.',
      items: [
        {
          question: 'Is there one app for Lime, Bolt, Bird, Voi and Dott?',
          answer: 'ScootRadar is one map for all of them, and for Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT and Qick too. It shows every shared e-scooter whose provider publishes where it is, so you no longer open one app after another to find the nearest.',
        },
        {
          question: 'How do I find the nearest e-scooter?',
          answer: 'Open the map and tap Near me, or search an address or a city. Each scooter shows its distance and walking time, its battery and range where the provider publishes them, and an estimate of what the ride costs.',
        },
        {
          question: 'Is it free? Do I need an account?',
          answer: 'It is free, with no account and no ads. You pay only for the ride, to the provider, in its own app.',
        },
        {
          question: 'Can I unlock or book a scooter with ScootRadar?',
          answer: 'No. Tap a scooter, then “Open in …”: the provider’s app opens, and you unlock and pay there as usual. ScootRadar does not reserve the scooter, so someone may get to it before you.',
        },
        {
          question: 'Where do the positions come from, and how fresh are they?',
          answer: 'From the public data feeds (GBFS) that the providers and public authorities publish. They can be a few minutes old: the map says how old, and tells you when a provider stops sharing its data.',
        },
        {
          question: 'Do I need to install anything?',
          answer: 'No. The map works in the browser of any phone or computer. On a phone you can add it to your home screen, and it opens like an app.',
        },
        {
          question: 'Does ScootRadar know where I am?',
          answer: 'Your location is used on your device, to centre the map and work out walking times. The server only receives the part of the map you are looking at, and does not store it.',
        },
      ],
    },
    closing: {
      title: 'Go and find yours.',
      note: 'Your location is used on your device and is not stored. The code is <source>open source</source>.',
    },
    footer: {
      text: 'ScootRadar is independent and not affiliated with the providers; their names are trademarks of their owners. Positions come from the providers’ public data feeds and can be a few minutes old. Prices are estimates; the provider’s app shows the final price.',
      links: 'More links',
      privacy: 'Privacy',
      source: 'Source on GitHub',
      guides: 'Guides',
      maker: 'By the <maker>maker</maker> of <horoscope>X Horoscope</horoscope>, <monkey>UnfollowMonkey</monkey> and the <peek>Peek parcel tracker</peek>.',
    },
  },

  de: {
    meta: {
      title: 'E-Scooter-Karte: Lime, Bolt, Bird, Voi, Dott und mehr | ScootRadar',
      description: cities =>
        `Alle E-Scooter und E-Trottinette in deiner Nähe auf einer Live-Karte: Lime, Bolt, Bird, Voi, Dott, Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT und Qick. Gratis, ohne Konto, in ${cities} Städten.`,
      share: {
        title: 'Alle E-Scooter auf einer Karte.',
        alt: 'Alle E-Scooter auf einer Karte: die App bei Nacht am Zürcher Hauptbahnhof, daneben die Initialen von zwölf Anbietern.',
      },
    },
    nav: {
      main: 'Hauptnavigation',
      shows: 'Was die Karte zeigt',
      cities: 'Städte',
      languages: 'Sprache',
      others: 'Weitere',
    },
    openMap: 'Karte öffnen',
    iphoneApp: 'iPhone-App laden',
    scanQr: 'Mit der Kamera deines iPhone scannen',
    hero: {
      title: scooters => `Um dich herum stehen ${scooters} E-Scooter.`,
      lede: 'ScootRadar zeigt alle E-Scooter in deiner Nähe auf einer Karte, egal von welchem Sharing-Anbieter. So ist der schnellste Weg nach Hause das Erste, was du siehst.',
      note: 'Gratis. Kein Konto, keine Werbung.',
      openSource: 'Open Source',
      stage: 'Scooter beim Zürcher Hauptbahnhof',
      alt: scooters =>
        `Die iPhone-App bei Nacht: die dunklen Strassen beim Zürcher Hauptbahnhof, jeder Scooter ein Lichtpunkt in der Farbe seines Anbieters, der nächste jedes Anbieters mit Namen und Gehzeit, ${scooters} Scooter im Bild.`,
    },
    card: {
      walk: minutes => `≈${minutes} Min. zu Fuss`,
      range: distance => `${distance} Reichweite`,
      price: (price, minutes) => `≈ ${price} für ${minutes} Min.`,
      bike: 'Zur Abwechslung ein Velo',
    },
    know: {
      title: 'Alles, was du wissen willst, bevor du losläufst.',
      all: {
        title: 'Alle Anbieter. Eine Karte.',
        text: 'In einer Stadt wie Zürich haben Bird, Bolt, Dott, Hopp, Lime, Voi und PubliBike je eine eigene App, und jede zeigt nur die eigene Flotte. ScootRadar zeigt alle. Dann ist der nächste Scooter auch wirklich der nächste.',
        close: (first, firstDistance, second, secondDistance) =>
          `Am Zürcher Hauptbahnhof steht ein ${first} in ${firstDistance} Entfernung und ein ${second} in ${secondDistance}. Dafür brauchst du zwei Apps. Oder eine Karte.`,
        providers: 'Anbieter in Zürich',
        alt: 'Die App bei Tag am Fraumünster in Zürich, der nächste Scooter jedes Anbieters mit Namen und Gehzeit.',
      },
      walk: {
        title: 'Wissen, wie weit es ist.',
        text: 'Distanz und Gehzeit von deinem Standort oder einer gesuchten Adresse aus.',
      },
      charge: {
        title: 'Leere Akkus ausblenden.',
        text: 'Akkustand und Reichweite stehen bei jedem Scooter, dessen Anbieter sie veröffentlicht. Lege einen Mindestladestand fest, und die Karte zeigt nur noch Scooter, die ihn erreichen; solche ohne Akkuangabe blendet sie aus.',
        any: 'Beliebig',
        control: 'Der Akkufilter, auf 60 Prozent oder mehr gestellt',
      },
      price: {
        title: 'Den Preis kennen, bevor du fährst.',
        text: 'Eine Schätzung nach den veröffentlichten Tarifen des Anbieters, für die Fahrt, die du vorhast: 5 bis 30 Minuten. Den Endpreis zeigt die App des Anbieters.',
        ride: name => `${name}, für eine Fahrt von zehn Minuten`,
        duration: minutes => `${minutes} Min.`,
        control: 'Die Fahrtdauer, auf 10 Minuten gestellt',
      },
      unlock: {
        title: 'Ein Fingertipp zur richtigen App.',
        text: 'Ein Button öffnet die App des Anbieters. Entsperrt und bezahlt wird dort wie gewohnt. Das Öffnen der App reserviert den Scooter nicht.',
        directions: 'Route',
        openIn: name => `In ${name} öffnen`,
        control: (directions, openIn) => `Die zwei Buttons zu einem Scooter: ${directions} und ${openIn}`,
      },
      looks: {
        title: 'Hell bei Tag. Dunkel bei Nacht.',
        text: 'Die Karte folgt dem Erscheinungsbild deines Geräts, oder du wählst eines und bleibst dabei. Auf Deutsch, Englisch, Französisch, Italienisch, Niederländisch, Norwegisch, Portugiesisch, Spanisch oder Isländisch.',
        light: 'Der Santa Monica Pier bei Tag, im hellen Erscheinungsbild der Karte.',
        dark: 'Derselbe Pier bei Nacht, im dunklen Erscheinungsbild.',
      },
    },
    cities: {
      title: cities => `${counted('de', cities, 'Stadt', 'Städte')}.`,
      lede: (providers, countries) =>
        `E-Scooter von ${counted('de', providers, 'Anbieter', 'Anbietern')} in ${counted('de', countries, 'Land', 'Ländern')}. Wo kein Anbieter Daten veröffentlicht, sagt die Karte das und nennt die nächsten Städte mit Daten. Wähle eine Stadt, um die Karte dort zu öffnen.`,
      countries: countryNames('de'),
      more: count => `und ${count} weitere`,
      alt: 'Die Karte bei Nacht, herausgezoomt über Europa, mit der Zahl der Scooter in jeder Stadt.',
    },
    faq: {
      title: 'Bevor du fragst.',
      items: [
        {
          question: 'Gibt es eine einzige App für Lime, Bolt, Bird, Voi und Dott?',
          answer: 'ScootRadar ist eine Karte für alle fünf und auch für Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT und Qick. Sie zeigt jeden Sharing-E-Scooter, dessen Anbieter den Standort veröffentlicht. So musst du nicht mehr eine App nach der anderen öffnen, um den nächsten zu finden.',
        },
        {
          question: 'Wie finde ich den nächsten E-Scooter oder das nächste E-Trottinett?',
          answer: 'Öffne die Karte und tippe auf «In meiner Nähe», oder suche nach einer Adresse oder Stadt. Zu jedem Scooter siehst du Distanz und Gehzeit, Akkustand und Reichweite (sofern der Anbieter sie veröffentlicht) und eine Schätzung, was die Fahrt kostet.',
        },
        {
          question: 'Ist es gratis? Brauche ich ein Konto?',
          answer: 'ScootRadar ist gratis, ohne Konto und ohne Werbung. Du bezahlst nur die Fahrt, direkt beim Anbieter in seiner App.',
        },
        {
          question: 'Kann ich mit ScootRadar einen Scooter entsperren oder reservieren?',
          answer: 'Nein. Tippe auf einen Scooter, dann auf «In … öffnen»: Die App des Anbieters öffnet sich, und dort entsperrst und bezahlst du wie gewohnt. ScootRadar reserviert den Scooter nicht, jemand anderes kann also schneller sein.',
        },
        {
          question: 'Woher stammen die Positionen, und wie aktuell sind sie?',
          answer: 'Aus den öffentlichen Datenfeeds (GBFS) der Anbieter und Behörden. Die Positionen können einige Minuten alt sein: Die Karte zeigt, wie alt sie sind, und meldet, wenn ein Anbieter keine Daten mehr liefert.',
        },
        {
          question: 'Muss ich etwas installieren?',
          answer: 'Nein. Die Karte läuft im Browser, auf jedem Handy und jedem Computer. Auf dem Handy kannst du sie zum Home-Bildschirm hinzufügen, dann öffnet sie sich wie eine App.',
        },
        {
          question: 'Weiss ScootRadar, wo ich bin?',
          answer: 'Dein Standort wird auf deinem Gerät genutzt, um die Karte zu zentrieren und die Gehzeiten zu berechnen. Der Server erhält nur den Kartenausschnitt, den du gerade ansiehst, und speichert ihn nicht.',
        },
      ],
    },
    closing: {
      title: 'Finde deinen Scooter.',
      note: 'Dein Standort wird auf deinem Gerät genutzt und nicht gespeichert. Der Code ist <source>Open Source</source>.',
    },
    footer: {
      text: 'ScootRadar ist unabhängig und steht in keiner Verbindung zu den Anbietern; deren Namen sind Marken ihrer jeweiligen Inhaber. Die Positionen stammen aus den öffentlichen Datenfeeds der Anbieter und können einige Minuten alt sein. Preise sind Schätzungen; den Endpreis zeigt die App des Anbieters.',
      links: 'Weitere Links',
      privacy: 'Datenschutz',
      source: 'Quellcode auf GitHub',
      guides: 'Ratgeber',
      maker: 'Vom <maker>Macher</maker> von <horoscope>X Horoscope</horoscope>, <monkey>UnfollowMonkey</monkey> und der <peek>Paketverfolgung Peek</peek>.',
    },
  },

  fr: {
    meta: {
      title: 'Carte des trottinettes électriques en libre-service | ScootRadar',
      description: cities =>
        `Toutes les trottinettes électriques en libre-service autour de vous sur une carte en direct : Lime, Dott, Bolt, Voi, Bird, Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT et Qick. Gratuit, sans compte, dans ${cities} villes.`,
      share: {
        title: 'Toutes les trottinettes sur une seule carte.',
        alt: 'Toutes les trottinettes sur une seule carte : l’app, de nuit, près de la gare centrale de Zurich, à côté des initiales de douze opérateurs.',
      },
    },
    nav: {
      main: 'Navigation principale',
      shows: 'Ce que montre la carte',
      cities: 'Villes',
      languages: 'Langue',
      others: 'Autres',
    },
    openMap: 'Ouvrir la carte',
    iphoneApp: 'Télécharger l’app iPhone',
    scanQr: 'Scannez avec l’appareil photo de votre iPhone',
    hero: {
      title: scooters => `Il y a ${scooters} trottinettes autour de vous.`,
      lede: 'ScootRadar réunit sur une seule carte toutes les trottinettes électriques en libre-service autour de vous, quel que soit l’opérateur. Le plus court chemin pour rentrer est ainsi la première chose que vous voyez.',
      note: 'Gratuit. Sans compte, sans pub.',
      openSource: 'Open source',
      stage: 'Trottinettes près de la gare centrale de Zurich',
      alt: scooters =>
        `L’app iPhone, de nuit : les rues sombres près de la gare centrale de Zurich, chaque trottinette en point lumineux à la couleur de son opérateur, la plus proche de chaque opérateur avec son nom et le temps de marche, et ${scooters} trottinettes à l’écran.`,
    },
    card: {
      walk: minutes => `≈${minutes} min à pied`,
      range: distance => `${distance} d’autonomie`,
      price: (price, minutes) => `≈ ${price} pour ${minutes} min`,
      bike: 'Un vélo, pour changer',
    },
    know: {
      title: 'Tout ce que vous voulez savoir avant de vous mettre en route.',
      all: {
        title: 'Tous les opérateurs. Une seule carte.',
        text: 'Dans une ville comme Zurich, Bird, Bolt, Dott, Hopp, Lime, Voi et PubliBike ont chacun leur app, qui ne montre que leur propre flotte. ScootRadar montre toutes les flottes : la trottinette la plus proche est donc simplement la plus proche.',
        close: (first, firstDistance, second, secondDistance) =>
          `Près de la gare centrale de Zurich, une ${first} est à ${firstDistance} et une ${second} à ${secondDistance}. Pour le savoir, il faut deux apps, ou une seule carte.`,
        providers: 'Opérateurs à Zurich',
        alt: 'L’app, de jour, près du Fraumünster à Zurich, la trottinette la plus proche de chaque opérateur avec son nom et le temps de marche.',
      },
      walk: {
        title: 'Sachez jusqu’où marcher.',
        text: 'La distance et le temps de marche depuis votre position, ou depuis une adresse que vous avez cherchée.',
      },
      charge: {
        title: 'Écartez les batteries à plat.',
        text: 'La batterie et l’autonomie sont indiquées pour chaque trottinette dont l’opérateur les publie. Fixez un minimum et la carte ne garde que les trottinettes qui l’atteignent ; celles sans niveau de batterie sont masquées.',
        any: 'Indifférent',
        control: 'Le filtre de batterie, réglé sur 60 % ou plus',
      },
      price: {
        title: 'Le prix, avant de vous décider.',
        text: 'Une estimation d’après les tarifs publiés par l’opérateur, pour le trajet que vous prévoyez : de 5 à 30 minutes. Le prix final est celui qu’affiche l’app de l’opérateur.',
        ride: name => `${name}, pour un trajet de dix minutes`,
        duration: minutes => `${minutes} min`,
        control: 'La durée du trajet, réglée sur 10 minutes',
      },
      unlock: {
        title: 'La bonne app, en un geste.',
        text: 'Un bouton ouvre l’app de l’opérateur. Vous y déverrouillez la trottinette et payez comme d’habitude. Ouvrir l’app ne la réserve pas.',
        directions: 'Itinéraire',
        openIn: name => `Ouvrir dans ${name}`,
        control: (directions, openIn) => `Les deux boutons affichés pour une trottinette : ${directions} et ${openIn}`,
      },
      looks: {
        title: 'Claire le jour. Sombre la nuit.',
        text: 'La carte suit l’apparence de votre appareil, ou vous en choisissez une et vous la gardez. En français, allemand, italien, anglais, néerlandais, norvégien, portugais, espagnol ou islandais.',
        light: 'La jetée de Santa Monica de jour, la carte en mode clair.',
        dark: 'La même jetée de nuit, en mode sombre.',
      },
    },
    cities: {
      title: cities => `${counted('fr', cities, 'ville', 'villes')}.`,
      lede: (providers, countries) =>
        `Des trottinettes en libre-service de ${counted('fr', providers, 'opérateur', 'opérateurs')} dans ${counted('fr', countries, 'pays', 'pays')}. Là où aucun opérateur ne publie de données, la carte le dit et indique les villes les plus proches qui en ont. Choisissez une ville pour y ouvrir la carte.`,
      countries: countryNames('fr'),
      more: count => (count === 1 ? 'et une autre' : `et ${count} autres`),
      alt: 'La carte de nuit à l’échelle de l’Europe, avec le nombre de trottinettes dans chaque ville.',
    },
    faq: {
      title: 'Vos questions.',
      items: [
        {
          question: 'Existe-t-il une app qui regroupe Lime, Bolt, Bird, Voi et Dott ?',
          answer: 'ScootRadar les réunit tous sur une seule carte, avec en plus Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT et Qick. Elle montre chaque trottinette électrique en libre-service dont l’opérateur publie la position : plus besoin d’ouvrir les apps une à une pour trouver la plus proche.',
        },
        {
          question: 'Comment trouver la trottinette électrique la plus proche ?',
          answer: 'Ouvrez la carte et touchez « Près de moi », ou cherchez une adresse ou une ville. Pour chaque trottinette, vous voyez la distance et le temps de marche, la batterie et l’autonomie quand l’opérateur les publie, et une estimation du prix du trajet.',
        },
        {
          question: 'Est-ce gratuit ? Faut-il un compte ?',
          answer: 'C’est gratuit, sans compte et sans pub. Vous ne payez que le trajet, à l’opérateur, dans sa propre app.',
        },
        {
          question: 'Peut-on déverrouiller ou réserver une trottinette avec ScootRadar ?',
          answer: 'Non. Touchez une trottinette, puis « Ouvrir dans … » : l’app de l’opérateur s’ouvre, et vous y déverrouillez la trottinette et payez comme d’habitude. ScootRadar ne la réserve pas ; quelqu’un peut donc la prendre avant vous.',
        },
        {
          question: 'D’où viennent les positions, et sont-elles à jour ?',
          answer: 'Des flux de données publics (GBFS) diffusés par les opérateurs et les autorités. Les positions peuvent dater de quelques minutes : la carte indique quand elles ont été actualisées et signale si un opérateur ne partage plus ses données.',
        },
        {
          question: 'Faut-il installer quelque chose ?',
          answer: 'Non. La carte fonctionne dans le navigateur de n’importe quel téléphone ou ordinateur. Sur un téléphone, vous pouvez l’ajouter à l’écran d’accueil : elle s’ouvre alors comme une app.',
        },
        {
          question: 'ScootRadar sait-il où je suis ?',
          answer: 'Votre position est utilisée sur votre appareil, pour centrer la carte et calculer les temps de marche. Le serveur ne reçoit que la partie de la carte que vous regardez, et ne la conserve pas.',
        },
      ],
    },
    closing: {
      title: 'Trouvez votre trottinette.',
      note: 'Votre position est utilisée sur votre appareil et n’est pas enregistrée. Le code est <source>open source</source>.',
    },
    footer: {
      text: 'ScootRadar est indépendant et n’est pas affilié aux opérateurs ; leurs noms sont des marques de leurs propriétaires respectifs. Les positions proviennent des flux de données publics des opérateurs et peuvent dater de quelques minutes. Les prix sont des estimations ; le prix final est celui qu’affiche l’app de l’opérateur.',
      links: 'Autres liens',
      privacy: 'Confidentialité',
      source: 'Code source sur GitHub',
      guides: 'Guides',
      maker: 'Par le <maker>créateur</maker> de <horoscope>X Horoscope</horoscope>, d’<monkey>UnfollowMonkey</monkey> et du <peek>suivi de colis Peek</peek>.',
    },
  },

  it: {
    meta: {
      title: 'Monopattini elettrici in sharing su una sola mappa | ScootRadar',
      description: cities =>
        `Tutti i monopattini elettrici in sharing intorno a te su una mappa in tempo reale: Lime, Bolt, Dott, Voi, Bird, Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT e Qick. Gratis, senza account, in ${cities} città.`,
      share: {
        title: 'Tutti i monopattini su una sola mappa.',
        alt: 'Tutti i monopattini su una sola mappa: l’app di notte vicino alla stazione centrale di Zurigo, accanto alle iniziali di dodici operatori.',
      },
    },
    nav: {
      main: 'Navigazione principale',
      shows: 'Cosa mostra la mappa',
      cities: 'Città',
      languages: 'Lingua',
      others: 'Altre',
    },
    openMap: 'Apri la mappa',
    iphoneApp: 'Scarica l’app per iPhone',
    scanQr: 'Inquadra il codice con la fotocamera dell’iPhone',
    hero: {
      title: scooters => `Ci sono ${scooters} monopattini intorno a te.`,
      lede: 'ScootRadar mette su una sola mappa tutti i monopattini elettrici in sharing intorno a te, di qualunque operatore. Così la strada più breve per tornare a casa è la prima cosa che vedi.',
      note: 'Gratis. Niente account, niente pubblicità.',
      openSource: 'Open source',
      stage: 'Monopattini vicino alla stazione centrale di Zurigo',
      alt: scooters =>
        `L’app per iPhone di notte: le strade scure vicino alla stazione centrale di Zurigo, ogni monopattino un punto di luce nel colore del suo operatore, il più vicino di ogni operatore con il nome e i minuti a piedi, e ${scooters} monopattini sullo schermo.`,
    },
    card: {
      walk: minutes => `≈${minutes} min a piedi`,
      range: distance => `${distance} di autonomia`,
      price: (price, minutes) => `≈ ${price} per ${minutes} min`,
      bike: 'Una bici, per cambiare',
    },
    know: {
      title: 'Tutto quello che vuoi sapere prima di metterti in cammino.',
      all: {
        title: 'Tutti gli operatori. Una sola mappa.',
        text: 'In una città come Zurigo, Bird, Bolt, Dott, Hopp, Lime, Voi e PubliBike hanno ciascuno la sua app, che mostra solo la propria flotta. ScootRadar li mostra tutti: il mezzo più vicino è semplicemente il più vicino.',
        close: (first, firstDistance, second, secondDistance) =>
          `Vicino alla stazione centrale di Zurigo, un ${first} è a ${firstDistance} e un ${second} a ${secondDistance}. Per saperlo servono due app, oppure una sola mappa.`,
        providers: 'Operatori a Zurigo',
        alt: 'L’app di giorno vicino al Fraumünster di Zurigo, il monopattino più vicino di ogni operatore con il nome e i minuti a piedi.',
      },
      walk: {
        title: 'Sai quanto c’è da camminare.',
        text: 'La distanza e il tempo a piedi da dove ti trovi, o da un indirizzo che hai cercato.',
      },
      charge: {
        title: 'Salta quelli scarichi.',
        text: 'Batteria e autonomia compaiono per ogni monopattino il cui operatore le pubblica. Imposta un minimo e la mappa mostra solo i monopattini che lo raggiungono; quelli senza dati sulla batteria vengono nascosti.',
        any: 'Qualsiasi',
        control: 'Il filtro della batteria, impostato sul 60% o più',
      },
      price: {
        title: 'Il prezzo, prima di decidere.',
        text: 'Una stima calcolata sulle tariffe pubblicate dall’operatore, per la corsa che hai in mente: da 5 a 30 minuti. Il prezzo finale è quello dell’app dell’operatore.',
        ride: name => `${name}, per una corsa di dieci minuti`,
        duration: minutes => `${minutes} min`,
        control: 'La durata della corsa, impostata su 10 minuti',
      },
      unlock: {
        title: 'L’app giusta, con un tocco.',
        text: 'Un pulsante apre l’app dell’operatore. Lì sblocchi e paghi come sempre. Aprirla non prenota il monopattino.',
        directions: 'Indicazioni',
        openIn: name => `Apri in ${name}`,
        control: (directions, openIn) => `I due pulsanti mostrati per un monopattino: ${directions} e ${openIn}`,
      },
      looks: {
        title: 'Chiara di giorno. Scura di notte.',
        text: 'La mappa segue l’aspetto del tuo dispositivo, oppure ne scegli uno e lo tieni. In italiano, tedesco, francese, inglese, olandese, norvegese, portoghese, spagnolo o islandese.',
        light: 'Il molo di Santa Monica di giorno, con l’aspetto chiaro della mappa.',
        dark: 'Lo stesso molo di notte, con l’aspetto scuro.',
      },
    },
    cities: {
      title: cities => `${counted('it', cities, 'città', 'città')}.`,
      lede: (providers, countries) =>
        `Monopattini in sharing di ${counted('it', providers, 'operatore', 'operatori')} in ${counted('it', countries, 'paese', 'paesi')}. Dove nessun operatore pubblica dati, la mappa lo dice e indica le città più vicine che ne hanno. Scegli una città per aprire lì la mappa.`,
      countries: countryNames('it'),
      more: count => (count === 1 ? 'e un’altra' : `e altre ${count}`),
      alt: 'La mappa dell’Europa vista da lontano, di notte, con il numero di monopattini in ogni città.',
    },
    faq: {
      title: 'Prima che tu lo chieda.',
      items: [
        {
          question: 'Esiste un’unica app per Lime, Bolt, Bird, Voi e Dott?',
          answer: 'ScootRadar li mette tutti su una sola mappa, insieme a Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT e Qick. Mostra ogni monopattino elettrico in sharing il cui operatore pubblica la posizione: non serve più aprire un’app dopo l’altra per trovare quello più vicino.',
        },
        {
          question: 'Come trovo il monopattino elettrico più vicino?',
          answer: 'Apri la mappa e tocca «Vicino a me», oppure cerca un indirizzo o una città. Per ogni monopattino vedi la distanza e il tempo a piedi, la batteria e l’autonomia quando l’operatore le pubblica, e una stima del prezzo della corsa.',
        },
        {
          question: 'È gratis? Serve un account?',
          answer: 'È gratis, senza account e senza pubblicità. Paghi solo la corsa, direttamente all’operatore nella sua app.',
        },
        {
          question: 'Posso sbloccare o prenotare un monopattino con ScootRadar?',
          answer: 'No. Tocca un monopattino, poi «Apri in …»: si apre l’app dell’operatore, dove sblocchi e paghi come sempre. ScootRadar non prenota il monopattino, quindi qualcuno potrebbe prenderlo prima di te.',
        },
        {
          question: 'Da dove vengono le posizioni e quanto sono aggiornate?',
          answer: 'Dai feed di dati pubblici (GBFS) diffusi dagli operatori e dalle autorità. Le posizioni possono risalire a qualche minuto fa: la mappa mostra quando sono state aggiornate e avvisa se un operatore smette di condividere i suoi dati.',
        },
        {
          question: 'Devo installare qualcosa?',
          answer: 'No. La mappa funziona nel browser di qualsiasi telefono o computer. Sul telefono puoi aggiungerla alla schermata Home: da lì si apre come un’app.',
        },
        {
          question: 'ScootRadar sa dove mi trovo?',
          answer: 'La tua posizione viene usata sul tuo dispositivo, per centrare la mappa e calcolare i tempi a piedi. Il server riceve solo la parte di mappa che stai guardando, e non la salva.',
        },
      ],
    },
    closing: {
      title: 'Trova il tuo.',
      note: 'La tua posizione viene usata sul tuo dispositivo e non viene salvata. Il codice è <source>open source</source>.',
    },
    footer: {
      text: 'ScootRadar è un’app indipendente, non affiliata agli operatori; i loro nomi sono marchi dei rispettivi titolari. Le posizioni provengono dai feed di dati pubblici degli operatori e possono risalire a qualche minuto fa. I prezzi sono stime; il prezzo finale è quello dell’app dell’operatore.',
      links: 'Altri link',
      privacy: 'Privacy',
      source: 'Codice sorgente su GitHub',
      guides: 'Guide',
      maker: 'Dal <maker>creatore</maker> di <horoscope>X Horoscope</horoscope>, di <monkey>UnfollowMonkey</monkey> e di <peek>Peek, l’app per tracciare i pacchi</peek>.',
    },
  },

  nb: {
    meta: {
      title: 'Kart over elsparkesykler: Lime, Bolt, Bird, Voi, Dott og flere | ScootRadar',
      description: cities =>
        `Alle elsparkesykler til leie nær deg på ett kart i sanntid: Lime, Bolt, Bird, Voi, Dott, Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT og Qick. Gratis, uten konto, i ${cities} byer.`,
      share: {
        title: 'Alle elsparkesykler på ett kart.',
        alt: 'Alle elsparkesykler på ett kart: appen om natten ved Zürich hovedstasjon, ved siden av initialene til tolv operatører.',
      },
    },
    nav: {
      main: 'Hovedmeny',
      shows: 'Hva kartet viser',
      cities: 'Byer',
      languages: 'Språk',
      others: 'Andre',
    },
    openMap: 'Åpne kartet',
    iphoneApp: 'Last ned iPhone-appen',
    scanQr: 'Skann med kameraet på iPhonen din',
    hero: {
      title: scooters => `Det står ${scooters} elsparkesykler rundt deg.`,
      lede: 'ScootRadar samler alle elsparkesykler til leie rundt deg på ett kart, uansett hvem som leier dem ut, så den korteste veien hjem er det første du ser.',
      note: 'Gratis. Ingen konto, ingen reklame.',
      openSource: 'Åpen kildekode',
      stage: 'ScootRadar ved Zürich hovedstasjon',
      alt: scooters =>
        `iPhone-appen om natten: de mørke gatene ved Zürich hovedstasjon, hver elsparkesykkel et lyspunkt i operatørens farge, den nærmeste fra hver operatør med navn og gangtid, og ${scooters} elsparkesykler i bildet.`,
    },
    card: {
      walk: minutes => `≈${minutes} min gange`,
      range: distance => `${distance} rekkevidde`,
      price: (price, minutes) => `≈ ${price} for ${minutes} min`,
      bike: 'En sykkel, til en forandring',
    },
    know: {
      title: 'Alt du vil vite før du begynner å gå.',
      all: {
        title: 'Alle operatørene. Ett kart.',
        text: 'I en by som Zürich har Bird, Bolt, Dott, Hopp, Lime, Voi og PubliBike hver sin app, og hver app viser bare sin egen flåte. ScootRadar viser alle sammen, så den nærmeste er rett og slett den nærmeste.',
        close: (first, firstDistance, second, secondDistance) =>
          `Ved Zürich hovedstasjon står en ${first} ${firstDistance} unna, og en ${second} ${secondDistance} unna. For å vite det trenger du to apper, eller ett kart.`,
        providers: 'Operatører i Zürich',
        alt: 'Appen om dagen ved Fraumünster i Zürich, den nærmeste elsparkesykkelen fra hver operatør med navn og gangtid.',
      },
      walk: {
        title: 'Vit hvor langt det er.',
        text: 'Avstand og gangtid fra der du står, eller fra en adresse du søker opp.',
      },
      charge: {
        title: 'Styr unna tomme batterier.',
        text: 'En elsparkesykkel viser batteri og gjenværende rekkevidde når operatøren publiserer dem. Velg et minimum, så viser kartet bare elsparkesyklene som når det; de uten batteriinfo skjules.',
        any: 'Alle',
        control: 'Batterifilteret, satt til minst 60%',
      },
      price: {
        title: 'Prisen, før du bestemmer deg.',
        text: 'Et anslag ut fra operatørens publiserte priser, for turen du har i tankene: 5 til 30 minutter. Operatørens app viser endelig pris.',
        ride: name => `${name}, for en tur på ti minutter`,
        duration: minutes => `${minutes} min`,
        control: 'Turens lengde, satt til 10 minutter',
      },
      unlock: {
        title: 'Ett trykk til riktig app.',
        text: 'Den åpner operatørens egen app, der du låser opp og betaler som vanlig. Å åpne den reserverer ikke elsparkesykkelen.',
        directions: 'Veibeskrivelse',
        openIn: name => `Åpne i ${name}`,
        control: (directions, openIn) => `De to knappene for en elsparkesykkel: ${directions} og ${openIn}`,
      },
      looks: {
        title: 'Lyst om dagen. Mørkt om natten.',
        text: 'Kartet følger utseendet på enheten din, eller du velger ett og beholder det. På norsk, engelsk, tysk, fransk, italiensk, nederlandsk, portugisisk, spansk eller islandsk.',
        light: 'Santa Monica Pier om dagen, med kartets lyse utseende.',
        dark: 'Den samme piren om natten, med mørkt utseende.',
      },
    },
    cities: {
      title: cities => `${counted('nb', cities, 'by', 'byer')}.`,
      lede: (providers, countries) =>
        `Elsparkesykler til leie fra ${counted('nb', providers, 'operatør', 'operatører')} i ${counted('nb', countries, 'land', 'land')}. Der ingen operatør publiserer data, sier kartet ifra og peker deg til de nærmeste byene som har det. Velg en by for å åpne kartet der.`,
      countries: countryNames('nb'),
      more: count => (count === 1 ? 'og én til' : `og ${count} til`),
      alt: 'Kartet om natten, zoomet ut over Europa, med antall elsparkesykler i hver by.',
    },
    faq: {
      title: 'Før du spør.',
      items: [
        {
          question: 'Finnes det én app for Lime, Bolt, Bird, Voi og Dott?',
          answer: 'ScootRadar er ett kart for alle sammen, og for Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT og Qick også. Det viser alle elsparkesykler til leie der operatøren publiserer hvor de står, så du slipper å åpne den ene appen etter den andre for å finne den nærmeste.',
        },
        {
          question: 'Hvordan finner jeg nærmeste elsparkesykkel?',
          answer: 'Åpne kartet og trykk på «Nær meg», eller søk etter en adresse eller en by. Hver elsparkesykkel viser avstand og gangtid, batteri og rekkevidde der operatøren publiserer dem, og et anslag over hva turen koster.',
        },
        {
          question: 'Er det gratis? Trenger jeg en konto?',
          answer: 'Det er gratis, uten konto og uten reklame. Du betaler bare for turen, til operatøren, i operatørens egen app.',
        },
        {
          question: 'Kan jeg låse opp eller reservere en elsparkesykkel med ScootRadar?',
          answer: 'Nei. Trykk på en elsparkesykkel og så på «Åpne i …»: Operatørens app åpnes, og der låser du opp og betaler som vanlig. ScootRadar reserverer ikke elsparkesykkelen, så noen kan komme før deg.',
        },
        {
          question: 'Hvor kommer posisjonene fra, og hvor ferske er de?',
          answer: 'Fra de offentlige datastrømmene (GBFS) som operatørene og myndighetene publiserer. Posisjonene kan være noen minutter gamle: Kartet viser hvor gamle de er, og sier ifra når en operatør slutter å dele dataene sine.',
        },
        {
          question: 'Må jeg installere noe?',
          answer: 'Nei. Kartet fungerer i nettleseren på alle telefoner og datamaskiner. På telefonen kan du legge det til på startskjermen, og da åpnes det som en app.',
        },
        {
          question: 'Vet ScootRadar hvor jeg er?',
          answer: 'Posisjonen din brukes på enheten din, for å sentrere kartet og regne ut gangtider. Serveren får bare den delen av kartet du ser på, og lagrer den ikke.',
        },
      ],
    },
    closing: {
      title: 'Gå og finn din.',
      note: 'Posisjonen din brukes på enheten din og lagres ikke. Kildekoden er <source>åpen</source>.',
    },
    footer: {
      text: 'ScootRadar er uavhengig og ikke tilknyttet operatørene; navnene deres er varemerker som tilhører eierne. Posisjonene kommer fra operatørenes offentlige datastrømmer og kan være noen minutter gamle. Prisene er anslag; operatørens app viser endelig pris.',
      links: 'Flere lenker',
      privacy: 'Personvern',
      source: 'Kildekode på GitHub',
      guides: 'Guider',
      maker: 'Fra <maker>skaperen</maker> av <horoscope>X Horoscope</horoscope>, <monkey>UnfollowMonkey</monkey> og <peek>pakkesporingen Peek</peek>.',
    },
  },

  nl: {
    meta: {
      title: 'Deelsteps op één kaart: Lime, Bolt, Bird, Voi, Dott en meer | ScootRadar',
      description: cities =>
        `Alle elektrische deelsteps bij jou in de buurt, live op één kaart: Lime, Bolt, Bird, Voi, Dott, Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT en Qick. Gratis, zonder account, in ${cities} steden.`,
      share: {
        title: 'Alle deelsteps op één kaart.',
        alt: 'Alle deelsteps op één kaart: de app ’s nachts bij het centraal station van Zürich, naast de initialen van twaalf aanbieders.',
      },
    },
    nav: {
      main: 'Hoofdnavigatie',
      shows: 'Wat de kaart toont',
      cities: 'Steden',
      languages: 'Taal',
      others: 'Andere',
    },
    openMap: 'Open de kaart',
    iphoneApp: 'Download de iPhone-app',
    scanQr: 'Scan met de camera van je iPhone',
    hero: {
      title: scooters => `Er staan ${scooters} deelsteps om je heen.`,
      lede: 'ScootRadar zet alle deelsteps om je heen op één kaart, van welke aanbieder ook. Zo is de snelste weg naar huis het eerste wat je ziet.',
      note: 'Gratis. Geen account, geen reclame.',
      openSource: 'Open source',
      stage: 'ScootRadar bij het centraal station van Zürich',
      alt: scooters =>
        `De iPhone-app ’s nachts: de donkere straten bij het centraal station van Zürich, elke deelstep een lichtpuntje in de kleur van zijn aanbieder, de dichtstbijzijnde van elke aanbieder met naam en minuten te voet, en ${scooters} deelsteps in beeld.`,
    },
    card: {
      walk: minutes => `≈${minutes} min te voet`,
      range: distance => `${distance} bereik`,
      price: (price, minutes) => `≈ ${price} voor ${minutes} min`,
      bike: 'Een fiets, voor de afwisseling',
    },
    know: {
      title: 'Alles wat je wilt weten voor je op pad gaat.',
      all: {
        title: 'Alle aanbieders. Eén kaart.',
        text: 'In een stad als Zürich hebben Bird, Bolt, Dott, Hopp, Lime, Voi en PubliBike elk een eigen app die alleen hun eigen vloot toont. ScootRadar toont ze allemaal, dus de dichtstbijzijnde is gewoon de dichtstbijzijnde.',
        close: (first, firstDistance, second, secondDistance) =>
          `Bij het centraal station van Zürich staat een ${first} op ${firstDistance} en een ${second} op ${secondDistance}. Daarvoor heb je twee apps nodig, of één kaart.`,
        providers: 'Aanbieders in Zürich',
        alt: 'De app overdag bij het Fraumünster in Zürich, de dichtstbijzijnde deelstep van elke aanbieder met naam en minuten te voet.',
      },
      walk: {
        title: 'Weet hoe ver het is.',
        text: 'De afstand en hoeveel minuten het te voet is, vanaf waar je staat of vanaf een adres dat je opzoekt.',
      },
      charge: {
        title: 'Sla de lege over.',
        text: 'Een deelstep toont zijn batterijniveau en het resterende bereik als de aanbieder die publiceert. Stel een minimum in en de kaart houdt alleen de deelsteps over die het halen; deelsteps zonder bekend batterijniveau worden verborgen.',
        any: 'Alle',
        control: 'De batterijfilter, ingesteld op 60% of meer',
      },
      price: {
        title: 'De prijs, voor je opstapt.',
        text: 'Een schatting op basis van de gepubliceerde tarieven van de aanbieder, voor de rit die je in gedachten hebt: 5 tot 30 minuten. De eindprijs zie je in de app van de aanbieder.',
        ride: name => `${name}, voor een rit van tien minuten`,
        duration: minutes => `${minutes} min`,
        control: 'De duur van de rit, ingesteld op 10 minuten',
      },
      unlock: {
        title: 'Eén tik naar de juiste app.',
        text: 'Je komt in de eigen app van de aanbieder, waar je zoals gewoonlijk ontgrendelt en betaalt. Daarmee is de deelstep nog niet gereserveerd.',
        directions: 'Route',
        openIn: name => `Openen in ${name}`,
        control: (directions, openIn) => `De twee knoppen bij een deelstep: ${directions} en ${openIn}`,
      },
      looks: {
        title: 'Licht overdag. Donker ’s nachts.',
        text: 'De kaart volgt de weergave van je apparaat, of je kiest er zelf een en houdt die. In het Nederlands, Engels, Duits, Frans, Italiaans, Noors, Portugees, Spaans of IJslands.',
        light: 'Santa Monica Pier overdag, in de lichte weergave van de kaart.',
        dark: 'Dezelfde pier ’s nachts, in donkere weergave.',
      },
    },
    cities: {
      title: cities => `${counted('nl', cities, 'stad', 'steden')}.`,
      lede: (providers, countries) =>
        `Deelsteps van ${counted('nl', providers, 'aanbieder', 'aanbieders')} in ${counted('nl', countries, 'land', 'landen')}. Waar geen enkele aanbieder zijn data publiceert, zegt de kaart dat en krijg je de dichtstbijzijnde steden die wel data hebben. Kies een stad om de kaart daar te openen.`,
      countries: countryNames('nl'),
      more: count => (count === 1 ? 'en nog één' : `en nog ${count}`),
      alt: 'De kaart ’s nachts, uitgezoomd over Europa, met het aantal deelsteps op elke stad.',
    },
    faq: {
      title: 'Voor je het vraagt.',
      items: [
        {
          question: 'Is er één app voor Lime, Bolt, Bird, Voi en Dott?',
          answer: 'ScootRadar is één kaart voor ze allemaal, en ook voor Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT en Qick. De kaart toont elke deelstep waarvan de aanbieder publiceert waar hij staat, zodat je niet meer de ene app na de andere hoeft te openen om de dichtstbijzijnde te vinden.',
        },
        {
          question: 'Hoe vind ik de dichtstbijzijnde elektrische step?',
          answer: 'Open de kaart en tik op ‘In mijn buurt’, of zoek een adres of een stad. Bij elke deelstep zie je de afstand en hoeveel minuten het te voet is, de batterij en het bereik als de aanbieder die publiceert, en een schatting van wat de rit kost.',
        },
        {
          question: 'Is het gratis? Heb ik een account nodig?',
          answer: 'Het is gratis, zonder account en zonder reclame. Je betaalt alleen de rit, aan de aanbieder, in zijn eigen app.',
        },
        {
          question: 'Kan ik met ScootRadar een deelstep ontgrendelen of reserveren?',
          answer: 'Nee. Tik op een deelstep en dan op ‘Openen in …’: de app van de aanbieder gaat open, en daar ontgrendel en betaal je zoals gewoonlijk. ScootRadar reserveert de deelstep niet, dus iemand anders kan je voor zijn.',
        },
        {
          question: 'Waar komen de posities vandaan, en hoe actueel zijn ze?',
          answer: 'Uit de openbare datafeeds (GBFS) die de aanbieders en overheden publiceren. Ze kunnen een paar minuten oud zijn: de kaart zegt hoe oud, en laat je weten wanneer een aanbieder stopt met het delen van zijn data.',
        },
        {
          question: 'Moet ik iets installeren?',
          answer: 'Nee. De kaart werkt in de browser van elke telefoon of computer. Op een telefoon kun je de kaart aan je beginscherm toevoegen, en dan opent die als een app.',
        },
        {
          question: 'Weet ScootRadar waar ik ben?',
          answer: 'Je locatie wordt op je apparaat gebruikt, om de kaart te centreren en de tijd te voet te berekenen. De server krijgt alleen het deel van de kaart waar je naar kijkt, en bewaart dat niet.',
        },
      ],
    },
    closing: {
      title: 'Ga de jouwe zoeken.',
      note: 'Je locatie wordt op je apparaat gebruikt en niet bewaard. De code is <source>open source</source>.',
    },
    footer: {
      text: 'ScootRadar is onafhankelijk en niet verbonden aan de aanbieders; hun namen zijn handelsmerken van hun eigenaars. De posities komen uit de openbare datafeeds van de aanbieders en kunnen een paar minuten oud zijn. Prijzen zijn schattingen; de eindprijs zie je in de app van de aanbieder.',
      links: 'Meer links',
      privacy: 'Privacy',
      source: 'Broncode op GitHub',
      guides: 'Gidsen',
      maker: 'Door de <maker>maker</maker> van <horoscope>X Horoscope</horoscope>, <monkey>UnfollowMonkey</monkey> en de <peek>pakkettracker Peek</peek>.',
    },
  },
  pt: {
    meta: {
      title: 'Mapa de trotinetes elétricas: Lime, Bolt, Bird, Voi, Dott e mais | ScootRadar',
      description: cities =>
        `Todas as trotinetes elétricas partilhadas perto de si num mapa em tempo real: Lime, Bolt, Bird, Voi, Dott, Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT e Qick. Grátis, sem conta, em ${cities} cidades.`,
      share: {
        title: 'Todas as trotinetes num só mapa.',
        alt: 'Todas as trotinetes num só mapa: a app à noite junto à estação central de Zurique, ao lado das iniciais de doze operadores.',
      },
    },
    nav: {
      main: 'Navegação principal',
      shows: 'O que o mapa mostra',
      cities: 'Cidades',
      languages: 'Idioma',
      others: 'Outros',
    },
    openMap: 'Abrir o mapa',
    iphoneApp: 'Descarregar a app para iPhone',
    scanQr: 'Aponte a câmara do seu iPhone',
    hero: {
      title: scooters => (scooters === 1 ? 'Há uma trotinete à sua volta.' : `Há ${scooters} trotinetes à sua volta.`),
      lede: 'O ScootRadar reúne num só mapa todas as trotinetes elétricas partilhadas à sua volta, seja qual for o operador. Assim, o caminho mais curto para casa é a primeira coisa que vê.',
      note: 'Grátis. Sem conta, sem anúncios.',
      openSource: 'Código aberto',
      stage: 'O ScootRadar junto à estação central de Zurique',
      alt: scooters =>
        `A app para iPhone à noite: as ruas escuras junto à estação central de Zurique, cada trotinete um ponto de luz na cor do seu operador, a mais próxima de cada operador com o nome e o tempo a pé, e ${scooters} trotinetes à vista.`,
    },
    card: {
      walk: minutes => `≈${minutes} min a pé`,
      range: distance => `${distance} de autonomia`,
      price: (price, minutes) => `≈ ${price} por ${minutes} min`,
      bike: 'Uma bicicleta, para variar',
    },
    know: {
      title: 'Tudo o que quer saber antes de se pôr a caminho.',
      all: {
        title: 'Todos os operadores. Um só mapa.',
        text: 'Numa cidade como Zurique, Bird, Bolt, Dott, Hopp, Lime, Voi e PubliBike têm cada um a sua app, que só mostra a própria frota. O ScootRadar mostra as frotas todas juntas: a trotinete mais próxima é mesmo a mais próxima.',
        close: (first, firstDistance, second, secondDistance) =>
          `Junto à estação central de Zurique, há uma ${first} a ${firstDistance} e uma ${second} a ${secondDistance}. Para saber isto, são precisas duas apps. Ou um mapa.`,
        providers: 'Operadores em Zurique',
        alt: 'A app de dia junto ao Fraumünster, em Zurique, a trotinete mais próxima de cada operador com o nome e o tempo a pé.',
      },
      walk: {
        title: 'Saiba quanto tem de andar.',
        text: 'A distância e o tempo a pé a partir de onde está, ou de uma morada que pesquise.',
      },
      charge: {
        title: 'Esqueça as descarregadas.',
        text: 'Cada trotinete mostra a bateria e a autonomia restante quando o operador as publica. Defina um mínimo e o mapa só mostra as trotinetes que o atingem; as que não têm informação de bateria ficam ocultas.',
        any: 'Qualquer',
        control: 'O filtro de bateria, definido para 60% ou mais',
      },
      price: {
        title: 'O preço, antes de se decidir.',
        text: 'Uma estimativa com base nas tarifas publicadas pelo operador, para a viagem que tem em mente: de 5 a 30 minutos. O preço final é o que aparece na app do operador.',
        ride: name => `${name}, para uma viagem de dez minutos`,
        duration: minutes => `${minutes} min`,
        control: 'A duração da viagem, definida para 10 minutos',
      },
      unlock: {
        title: 'Um toque até à app certa.',
        text: 'Um botão abre a app do próprio operador, onde desbloqueia e paga como sempre. Abrir a app não reserva a trotinete.',
        directions: 'Itinerário',
        openIn: name => `Abrir em ${name}`,
        control: (directions, openIn) => `Os dois botões de uma trotinete: ${directions} e ${openIn}`,
      },
      looks: {
        title: 'Claro de dia. Escuro à noite.',
        text: 'O mapa segue o aspeto do seu dispositivo, ou fica com o que escolher. Em português, inglês, alemão, francês, italiano, neerlandês, norueguês, espanhol ou islandês.',
        light: 'O pontão de Santa Monica de dia, com o aspeto claro do mapa.',
        dark: 'O mesmo pontão à noite, com o aspeto escuro.',
      },
    },
    cities: {
      title: cities => `${counted('pt', cities, 'cidade', 'cidades')}.`,
      lede: (providers, countries) =>
        `Trotinetes elétricas partilhadas de ${counted('pt', providers, 'operador', 'operadores')} em ${counted('pt', countries, 'país', 'países')}. Onde nenhum operador publica os dados, o mapa avisa e indica-lhe as cidades mais próximas que os têm. Escolha uma cidade para abrir lá o mapa.`,
      countries: countryNames('pt'),
      more: count => (count === 1 ? 'e mais uma' : `e mais ${count}`),
      alt: 'O mapa à noite, a mostrar toda a Europa, com o número de trotinetes de cada cidade.',
    },
    faq: {
      title: 'Antes que pergunte.',
      items: [
        {
          question: 'Existe uma app que junte Lime, Bolt, Bird, Voi e Dott?',
          answer: 'O ScootRadar reúne-as todas num só mapa, e ainda Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT e Qick. Mostra todas as trotinetes elétricas partilhadas cujo operador publica a localização, para que deixe de abrir uma app atrás da outra à procura da mais próxima.',
        },
        {
          question: 'Como encontro a trotinete elétrica mais próxima?',
          answer: 'Abra o mapa e toque em “Perto de mim”, ou pesquise uma morada ou uma cidade. Cada trotinete mostra a distância e o tempo a pé, a bateria e a autonomia quando o operador as publica, e uma estimativa do preço da viagem.',
        },
        {
          question: 'É grátis? Preciso de uma conta?',
          answer: 'É grátis, sem conta e sem anúncios. Só paga a viagem, diretamente ao operador, na app dele.',
        },
        {
          question: 'Posso desbloquear ou reservar uma trotinete com o ScootRadar?',
          answer: 'Não. Toque numa trotinete e depois em “Abrir em …”: abre-se a app do operador, onde desbloqueia e paga como sempre. O ScootRadar não reserva a trotinete, por isso alguém pode chegar lá antes de si.',
        },
        {
          question: 'De onde vêm as posições, e quão recentes são?',
          answer: 'Dos dados abertos (GBFS) que os operadores e as autoridades publicam. As posições podem ter alguns minutos de atraso: o mapa indica a hora da última atualização e avisa quando um operador deixa de partilhar os dados.',
        },
        {
          question: 'Preciso de instalar alguma coisa?',
          answer: 'Não. O mapa funciona no navegador de qualquer telemóvel ou computador. No telemóvel, pode adicioná-lo ao ecrã principal, e passa a abrir como uma app.',
        },
        {
          question: 'O ScootRadar sabe onde estou?',
          answer: 'A sua localização é usada no seu dispositivo, para centrar o mapa e calcular os tempos a pé. O servidor só recebe a parte do mapa que está a ver, e não a guarda.',
        },
      ],
    },
    closing: {
      title: 'Encontre a sua.',
      note: 'A sua localização é usada no seu dispositivo e não é guardada. O ScootRadar é de <source>código aberto</source>.',
    },
    footer: {
      text: 'O ScootRadar é independente e não tem qualquer ligação aos operadores; os nomes destes são marcas dos respetivos titulares. As posições vêm dos dados abertos dos operadores e podem ter alguns minutos de atraso. Os preços são estimativas; o preço final é o que aparece na app do operador.',
      links: 'Mais ligações',
      privacy: 'Privacidade',
      source: 'Código-fonte no GitHub',
      guides: 'Guias',
      maker: 'Do <maker>criador</maker> do <horoscope>X Horoscope</horoscope>, do <monkey>UnfollowMonkey</monkey> e do <peek>Peek, para seguir encomendas</peek>.',
    },
  },
  es: {
    meta: {
      title: 'Mapa de patinetes eléctricos: Lime, Bolt, Bird, Voi, Dott y más | ScootRadar',
      description: cities =>
        `Todos los patinetes eléctricos de alquiler cerca de ti, en tiempo real y en un solo mapa: Lime, Bolt, Bird, Voi, Dott, Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT y Qick. Gratis, sin registro, en ${cities} ciudades.`,
      share: {
        title: 'Todos los patinetes en un solo mapa.',
        alt: 'Todos los patinetes en un solo mapa: la app de noche junto a la estación central de Zúrich, con las iniciales de doce operadores al lado.',
      },
    },
    nav: {
      main: 'Navegación principal',
      shows: 'Qué muestra el mapa',
      cities: 'Ciudades',
      languages: 'Idioma',
      others: 'Otros',
    },
    openMap: 'Abrir el mapa',
    iphoneApp: 'Descargar la app para iPhone',
    scanQr: 'Escanéalo con la cámara del iPhone',
    hero: {
      title: scooters => (scooters === 1 ? 'Hay un patinete a tu alrededor.' : `Hay ${scooters} patinetes a tu alrededor.`),
      lede: 'ScootRadar reúne en un solo mapa todos los patinetes eléctricos compartidos que tienes alrededor, sea cual sea el operador. Así, el camino más rápido a casa es lo primero que ves.',
      note: 'Gratis. Sin registro, sin anuncios.',
      openSource: 'Código abierto',
      stage: 'Patinetes junto a la estación central de Zúrich',
      alt: scooters =>
        `La app para iPhone de noche: las calles oscuras junto a la estación central de Zúrich, cada patinete un punto de luz del color de su operador, el más cercano de cada operador con su nombre y el tiempo a pie, y ${scooters === 1 ? 'un patinete' : `${scooters} patinetes`} en pantalla.`,
    },
    card: {
      walk: minutes => `≈${minutes} min a pie`,
      range: distance => `${distance} de autonomía`,
      price: (price, minutes) => `≈ ${price} por ${minutes} min`,
      bike: 'Una bici, para variar',
    },
    know: {
      title: 'Todo lo que quieres saber antes de echar a andar.',
      all: {
        title: 'Todos los operadores. Un solo mapa.',
        text: 'En una ciudad como Zúrich, Bird, Bolt, Dott, Hopp, Lime, Voi y PubliBike tienen cada uno su app, y cada app solo muestra su propia flota. ScootRadar las muestra todas, así que el más cercano es, sin más, el más cercano.',
        close: (first, firstDistance, second, secondDistance) =>
          `Junto a la estación central de Zúrich, un ${first} está a ${firstDistance} y un ${second}, a ${secondDistance}. Para saberlo hacen falta dos apps, o un solo mapa.`,
        providers: 'Operadores en Zúrich',
        alt: 'La app de día junto al Fraumünster de Zúrich, el patinete más cercano de cada operador con su nombre y el tiempo a pie.',
      },
      walk: {
        title: 'Cuánto hay que andar.',
        text: 'La distancia y el tiempo a pie desde donde estás, o desde una dirección que busques.',
      },
      charge: {
        title: 'Sáltate los descargados.',
        text: 'Cada patinete muestra su batería y la autonomía que le queda cuando su operador las publica. Fija un mínimo y el mapa solo deja los patinetes que llegan a él; los que no tienen datos de batería se ocultan.',
        any: 'Todas',
        control: 'El filtro de batería, fijado en el 60 % o más',
      },
      price: {
        title: 'El precio, antes de decidirte.',
        text: 'Una estimación según las tarifas que publica el operador, para el trayecto que tienes en mente: de 5 a 30 minutos. El precio final lo muestra la app del operador.',
        ride: name => `${name}, para un trayecto de diez minutos`,
        duration: minutes => `${minutes} min`,
        control: 'La duración del trayecto, fijada en 10 minutos',
      },
      unlock: {
        title: 'La app correcta, con un toque.',
        text: 'Se abre la app del propio operador, donde desbloqueas y pagas como siempre. Abrirla no reserva el patinete.',
        directions: 'Cómo llegar',
        openIn: name => `Abrir en ${name}`,
        control: (directions, openIn) => `Los dos botones que aparecen con cada patinete: ${directions} y ${openIn}`,
      },
      looks: {
        title: 'Claro de día. Oscuro de noche.',
        text: 'El mapa sigue el aspecto de tu dispositivo, o eliges uno y te quedas con él. En español, inglés, alemán, francés, italiano, neerlandés, noruego, portugués o islandés.',
        light: 'El muelle de Santa Mónica de día, con el mapa en modo claro.',
        dark: 'El mismo muelle de noche, en modo oscuro.',
      },
    },
    cities: {
      title: cities => `${counted('es', cities, 'ciudad', 'ciudades')}.`,
      lede: (providers, countries) =>
        `Patinetes eléctricos compartidos de ${counted('es', providers, 'operador', 'operadores')} en ${counted('es', countries, 'país', 'países')}. Donde ningún operador publica sus datos, el mapa te lo dice y te indica las ciudades más cercanas que sí los tienen. Elige una ciudad para abrir allí el mapa.`,
      countries: countryNames('es'),
      more: count => (count === 1 ? 'y otra más' : `y ${count} más`),
      alt: 'El mapa de noche, alejado sobre Europa, con el número de patinetes de cada ciudad.',
    },
    faq: {
      title: 'Antes de que lo preguntes.',
      items: [
        {
          question: '¿Hay una sola app para Lime, Bolt, Bird, Voi y Dott?',
          answer: 'ScootRadar es un único mapa para todos ellos, y también para Hopp, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT y Qick. Muestra cada patinete eléctrico compartido cuyo operador publica dónde está, para que no tengas que abrir una app tras otra hasta dar con el más cercano.',
        },
        {
          question: '¿Cómo encuentro un patinete eléctrico de alquiler cerca de mí?',
          answer: 'Abre el mapa y toca «Cerca de mí», o busca una dirección o una ciudad. Cada patinete muestra la distancia y el tiempo a pie, la batería y la autonomía si el operador las publica, y una estimación de lo que cuesta el trayecto.',
        },
        {
          question: '¿Es gratis? ¿Hay que registrarse?',
          answer: 'Es gratis, sin registro y sin anuncios. Solo pagas el trayecto, al operador y en su propia app.',
        },
        {
          question: '¿Puedo desbloquear o reservar un patinete con ScootRadar?',
          answer: 'No. Toca un patinete y luego «Abrir en …»: se abre la app del operador, donde desbloqueas y pagas como siempre. ScootRadar no reserva el patinete, así que alguien podría cogerlo antes que tú.',
        },
        {
          question: '¿De dónde salen las posiciones de los patinetes? ¿Están actualizadas?',
          answer: 'De los datos abiertos (GBFS) que publican los operadores y las administraciones. Pueden tener unos minutos de retraso: el mapa indica de cuándo son y te avisa si un operador deja de compartir sus datos.',
        },
        {
          question: '¿Tengo que instalar algo?',
          answer: 'No. El mapa funciona en el navegador de cualquier móvil u ordenador. En el móvil puedes añadirlo a la pantalla de inicio y se abre como una app.',
        },
        {
          question: '¿Sabe ScootRadar dónde estoy?',
          answer: 'Tu ubicación se usa en tu dispositivo, para centrar el mapa y calcular los tiempos a pie. El servidor solo recibe la parte del mapa que estás mirando, y no la guarda.',
        },
      ],
    },
    closing: {
      title: 'Ve a por el tuyo.',
      note: 'Tu ubicación se usa en tu dispositivo y no se guarda. Es <source>código abierto</source>.',
    },
    footer: {
      text: 'ScootRadar es independiente y no está vinculado a los operadores; sus nombres son marcas de sus respectivos titulares. Las posiciones proceden de los datos abiertos de los operadores y pueden tener unos minutos de retraso. Los precios son estimaciones; el precio final lo muestra la app del operador.',
      links: 'Más enlaces',
      privacy: 'Privacidad',
      source: 'Código fuente en GitHub',
      guides: 'Guías',
      maker: 'Del <maker>creador</maker> de <horoscope>X Horoscope</horoscope>, <monkey>UnfollowMonkey</monkey> y <peek>Peek, la app de seguimiento de paquetes</peek>.',
    },
  },
  is: {
    meta: {
      title: 'Rafskútur á einu korti: Hopp, Lime, Bolt, Voi, Dott og fleiri | ScootRadar',
      description: cities =>
        `Allar rafskútur (rafhlaupahjól) til leigu nálægt þér, á einu korti í rauntíma: Hopp, Lime, Bolt, Bird, Voi, Dott, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT og Qick. Ókeypis og án skráningar, á ${cities} ${cities % 10 === 1 && cities % 100 !== 11 ? 'stað' : 'stöðum'}.`,
      share: {
        title: 'Allar rafskútur á einu korti.',
        alt: 'Allar rafskútur á einu korti: appið að nóttu til við aðallestarstöðina í Zürich, við hlið upphafsstafa tólf fyrirtækja.',
      },
    },
    nav: {
      main: 'Aðalvalmynd',
      shows: 'Hvað kortið sýnir',
      cities: 'Staðir',
      languages: 'Tungumál',
      others: 'Önnur',
    },
    openMap: 'Opna kortið',
    iphoneApp: 'Sækja iPhone-appið',
    scanQr: 'Skannaðu með myndavélinni í iPhone-símanum',
    hero: {
      title: scooters =>
        scooters % 10 === 1 && scooters % 100 !== 11
          ? `Í kringum þig er ${scooters} rafskúta.`
          : `Í kringum þig eru ${scooters} rafskútur.`,
      lede: 'ScootRadar sýnir allar rafskútur til leigu í kringum þig á einu korti, sama frá hvaða fyrirtæki þær eru. Þannig er stysta leiðin heim það fyrsta sem þú sérð.',
      note: 'Ókeypis. Engin skráning, engar auglýsingar.',
      openSource: 'Opinn hugbúnaður',
      stage: 'ScootRadar við aðallestarstöðina í Zürich',
      alt: scooters =>
        `iPhone-appið að nóttu til: dimmar götur við aðallestarstöðina í Zürich, hver rafskúta ljósdepill í lit fyrirtækis síns, sú næsta frá hverju fyrirtæki merkt með nafni og göngutíma, og ${scooters} ${scooters % 10 === 1 && scooters % 100 !== 11 ? 'rafskúta' : 'rafskútur'} á skjánum.`,
    },
    card: {
      walk: minutes => `≈${minutes} mín. gangur`,
      range: distance => `${distance} drægni`,
      price: (price, minutes) => `≈ ${price} fyrir ${minutes} mín.`,
      bike: 'Hjól, til tilbreytingar',
    },
    know: {
      title: 'Allt sem þú vilt vita áður en þú leggur af stað.',
      all: {
        title: 'Öll fyrirtækin. Eitt kort.',
        text: 'Í borg eins og Zürich hafa Bird, Bolt, Dott, Hopp, Lime, Voi og PubliBike hvert sitt app, sem sýnir aðeins eigin flota. ScootRadar sýnir þá alla, svo næsta rafskúta er einfaldlega sú næsta.',
        close: (first, firstDistance, second, secondDistance) =>
          `Við aðallestarstöðina í Zürich er ${first}-rafskúta í ${firstDistance} fjarlægð og ${second}-rafskúta í ${secondDistance}. Það þarf tvö öpp til að komast að því, eða eitt kort.`,
        providers: 'Fyrirtæki í Zürich',
        alt: 'Appið að degi til við Fraumünster í Zürich, næsta rafskúta frá hverju fyrirtæki merkt með nafni og göngutíma.',
      },
      walk: {
        title: 'Gangan á hreinu.',
        text: 'Fjarlægð og göngutími þaðan sem þú ert, eða frá heimilisfangi sem þú leitar að.',
      },
      charge: {
        title: 'Slepptu þeim rafmagnslausu.',
        text: 'Rafskúta sýnir hleðslu og drægni sem eftir er þegar fyrirtækið birtir þær upplýsingar. Veldu lágmark og kortið sýnir aðeins þær rafskútur sem ná því; þær sem vantar upplýsingar um hleðslu eru faldar.',
        any: 'Allar',
        control: 'Hleðslusían, stillt á 60% eða meira',
      },
      price: {
        title: 'Verðið, áður en þú ákveður þig.',
        text: 'Áætlun út frá birtri verðskrá fyrirtækisins, fyrir ferðina sem þú hefur í huga: 5 til 30 mínútur. Endanlegt verð sérðu í appi fyrirtækisins.',
        ride: name => `${name}, fyrir tíu mínútna ferð`,
        duration: minutes => `${minutes} mín.`,
        control: 'Lengd ferðar, stillt á 10 mínútur',
      },
      unlock: {
        title: 'Beint í rétta appið.',
        text: 'Hnappurinn opnar app fyrirtækisins, þar sem þú aflæsir rafskútunni og borgar eins og venjulega. Hún er ekki tekin frá þótt appið sé opnað.',
        directions: 'Leiðarlýsing',
        openIn: name => `Opna ${name}-appið`,
        control: (directions, openIn) => `Hnapparnir tveir fyrir hverja rafskútu: ${directions} og ${openIn}`,
      },
      looks: {
        title: 'Ljóst á daginn. Dökkt á nóttunni.',
        text: 'Kortið fylgir útliti tækisins, eða þú velur ljóst eða dökkt og heldur þig við það. Á íslensku, ensku, þýsku, frönsku, ítölsku, hollensku, norsku, portúgölsku eða spænsku.',
        light: 'Santa Monica-bryggjan að degi til, með ljósu útliti kortsins.',
        dark: 'Sama bryggjan að nóttu til, með dökku útliti.',
      },
    },
    cities: {
      title: cities => `${counted('is', cities, 'staður', 'staðir')}.`,
      lede: (providers, countries) =>
        `Rafskútur til leigu frá ${counted('is', providers, 'fyrirtæki', 'fyrirtækjum')} í ${counted('is', countries, 'landi', 'löndum')}. Þar sem ekkert fyrirtæki birtir gögn segir kortið frá því og bendir þér á næstu staði sem hafa þau. Veldu stað til að opna kortið þar.`,
      countries: countryNames('is'),
      more: count => `og ${count} til viðbótar`,
      alt: 'Kortið að nóttu til, yfir allri Evrópu, með tölu sem sýnir hve margar rafskútur eru á hverjum stað.',
    },
    faq: {
      title: 'Áður en þú spyrð.',
      items: [
        {
          question: 'Er til eitt app fyrir Hopp, Lime, Bolt, Voi og Dott?',
          answer: 'ScootRadar er eitt kort fyrir þau öll, og líka fyrir Bird, Pony, PubliBike, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob’, Elerent, 3electra, Spin, Veo, Lyft, SAHAM, Flamingo, JOLT og Qick. Það sýnir allar rafskútur til leigu sem fyrirtækin birta staðsetningu á, svo þú þarft ekki lengur að opna eitt appið á fætur öðru til að finna þá næstu.',
        },
        {
          question: 'Hvernig finn ég næstu rafskútu eða næsta rafhlaupahjól?',
          answer: 'Opnaðu kortið og ýttu á „Nálægt mér“, eða leitaðu að heimilisfangi eða bæ. Við hverja rafskútu sérðu fjarlægð og göngutíma, hleðslu og drægni ef fyrirtækið birtir þær upplýsingar, og áætlun um hvað ferðin kostar.',
        },
        {
          question: 'Er þetta ókeypis? Þarf ég að skrá mig?',
          answer: 'Það er ókeypis, án skráningar og án auglýsinga. Þú borgar aðeins fyrir ferðina, og það gerirðu í appi fyrirtækisins.',
        },
        {
          question: 'Get ég aflæst eða tekið frá rafskútu með ScootRadar?',
          answer: 'Nei. Ýttu á rafskútu og svo á hnappinn sem opnar app fyrirtækisins: þar aflæsir þú henni og borgar eins og venjulega. ScootRadar tekur rafskútuna ekki frá, svo einhver annar gæti orðið á undan þér.',
        },
        {
          question: 'Hvaðan koma staðsetningarnar og hversu nýjar eru þær?',
          answer: 'Úr opnum gagnastraumum (GBFS) sem fyrirtækin og opinberir aðilar birta. Þær geta verið nokkurra mínútna gamlar: kortið segir hversu gamlar þær eru og lætur þig vita þegar fyrirtæki hættir að deila gögnum sínum.',
        },
        {
          question: 'Þarf ég að setja eitthvað upp?',
          answer: 'Nei. Kortið virkar í vafra í hvaða síma eða tölvu sem er. Í síma geturðu sett það á heimaskjáinn og þá opnast það eins og app.',
        },
        {
          question: 'Veit ScootRadar hvar ég er?',
          answer: 'Staðsetningin þín er notuð í tækinu þínu, til að miðja kortið og reikna út göngutíma. Netþjónninn fær aðeins þann hluta kortsins sem þú ert að skoða og geymir hann ekki.',
        },
      ],
    },
    closing: {
      title: 'Farðu og finndu þína.',
      note: 'Staðsetningin þín er notuð í tækinu þínu og er ekki geymd. Kóðinn er <source>opinn</source>.',
    },
    footer: {
      text: 'ScootRadar er óháð þjónusta, ótengd fyrirtækjunum; nöfn þeirra eru vörumerki eigenda sinna. Staðsetningar koma úr opnum gagnastraumum fyrirtækjanna og geta verið nokkurra mínútna gamlar. Verð eru áætluð; endanlegt verð sérðu í appi fyrirtækisins.',
      links: 'Fleiri tenglar',
      privacy: 'Persónuvernd',
      source: 'Frumkóði á GitHub',
      guides: 'Leiðarvísar',
      maker: 'Frá <maker>höfundi</maker> <horoscope>X Horoscope</horoscope>, <monkey>UnfollowMonkey</monkey> og <peek>pakkarakningarappsins Peek</peek>.',
    },
  },
};
