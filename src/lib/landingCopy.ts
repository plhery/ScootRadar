// The words of the landing page, src/app/(site)/[[...locale]]/page.tsx. It is
// rendered on the server only, so none of this reaches the browser as script.
//
// The labels of the app the page redraws (the walk, the price, the two buttons,
// the battery filter) are worded as src/lib/i18n.tsx words them. German is
// written the Swiss way, as the app is: "ss", never "ß". French has a no-break
// space before a colon, a semicolon and a percent sign.

export const LANDING_LOCALES = ['en', 'de', 'fr', 'it'] as const;
export type LandingLocale = (typeof LANDING_LOCALES)[number];

export function isLandingLocale(value: string): value is LandingLocale {
  return (LANDING_LOCALES as readonly string[]).includes(value);
}

/** The language of the page at "/". The others are under their code. */
export const DEFAULT_LANDING_LOCALE: LandingLocale = 'en';

export function landingPath(locale: LandingLocale): string {
  return locale === DEFAULT_LANDING_LOCALE ? '/' : `/${locale}`;
}

/** The language a path of the site is in, from its segments, if it is the landing page. */
export function landingLocaleOf(segments: string[] | undefined): LandingLocale | null {
  if (!segments?.length) return DEFAULT_LANDING_LOCALE;

  const [code, ...rest] = segments;
  // English has one address, not two.
  return rest.length === 0 && isLandingLocale(code) && code !== DEFAULT_LANDING_LOCALE ? code : null;
}

export const LANGUAGE_NAMES: Record<LandingLocale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
};

export const SOURCE_URL = 'https://github.com/plhery/swiss-scooters';

// The App Store page of the iPhone app, once it has one. The buttons that lead
// to it are left out until then.
export const APP_STORE_URL = null as string | null;

export type LandingCountry = 'CH' | 'DE' | 'FR' | 'IT';

export interface LandingCopy {
  meta: {
    title: string;
    description: (cities: number) => string;
    /** The picture a shared link shows, public/share/<locale>.png: scripts/generate-share-images.mjs draws it. */
    share: { title: string; alt: string };
  };
  nav: { main: string; shows: string; cities: string; languages: string };
  openMap: string;
  iphoneApp: string;
  hero: {
    /** The number is the one on the capture of this language, beside the headline. */
    title: (scooters: number) => string;
    lede: string;
    note: string;
    stage: string;
    alt: (scooters: number) => string;
    caption: (date: string) => string;
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
    /** "Seven" is the number of providers in src/lib/landingSnapshot.ts, which the text names. */
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
    lede: string;
    countries: Record<LandingCountry, string>;
    more: (count: number) => string;
    alt: string;
  };
  /** What people ask a search engine before they find the map, answered. */
  faq: { title: string; items: readonly { question: string; answer: string }[] };
  closing: { title: string; note: string };
  footer: { text: string; links: string; privacy: string; source: string };
}

export const LANDING_COPY: Record<LandingLocale, LandingCopy> = {
  en: {
    meta: {
      title: 'E-scooter map: Lime, Bolt, Bird, Voi, Dott and more | Scooters',
      description: cities =>
        `Every shared e-scooter near you on one live map: Lime, Bolt, Bird, Voi, Dott, Hopp, Pony and PubliBike. Battery, walking time and price. Free, in ${cities} cities.`,
      share: {
        title: 'Every e-scooter on one map.',
        alt: 'Every e-scooter on one map: the app at night by Zürich main station, beside the initials of eight providers.',
      },
    },
    nav: { main: 'Main', shows: 'What it shows', cities: 'Cities', languages: 'Language' },
    openMap: 'Open the map',
    iphoneApp: 'Get the iPhone app',
    hero: {
      title: scooters => `There are ${scooters} scooters around you.`,
      lede: 'Scooters puts every shared e-scooter around you on one map, whoever runs it, so the closest way home is the first thing you see.',
      note: 'Free. No account, no ads.',
      stage: 'Scooters by Zürich main station',
      alt: scooters =>
        `The iPhone app at night: a dark map of the streets by Zürich main station, covered in pins with each provider’s initials and colour, and ${scooters} scooters nearby.`,
      caption: date =>
        `Zürich main station, ${date}: the nearest ride from each of the seven providers there.`,
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
        title: 'All seven. One map.',
        text: 'Bird, Bolt, Dott, Hopp, Lime, Voi and PubliBike each have an app that shows only their own fleet. Scooters shows the lot, so the nearest one is simply the nearest one.',
        close: (first, firstDistance, second, secondDistance) =>
          `Here, a ${first} is ${firstDistance} away and a ${second} is ${secondDistance}. It takes two apps to learn that, or one map.`,
        providers: 'Providers in Zürich',
        alt: 'The same streets by day, with the pins of every provider on one map.',
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
        text: 'The map follows your device’s appearance, or you pick one and keep it. In English, German, French or Italian.',
        light: 'The map in its light appearance.',
        dark: 'The same map in its dark appearance.',
      },
    },
    cities: {
      title: cities => `${cities} cities.`,
      lede: 'Shared e-scooters in Switzerland, Germany and France, plus Rome. Where no provider publishes its data, the map says so and points you to the closest cities that have it. Pick a city to open the map there.',
      countries: { CH: 'Switzerland', DE: 'Germany', FR: 'France', IT: 'Italy' },
      more: count => `and ${count} more`,
      alt: 'The map zoomed out over Europe, with the number of scooters on each city.',
    },
    faq: {
      title: 'Before you ask.',
      items: [
        {
          question: 'Is there one app for Lime, Bolt, Bird, Voi and Dott?',
          answer: 'Scooters is one map for all of them, and for Hopp, Pony and PubliBike too. It shows every shared e-scooter whose provider publishes where it is, so you no longer open one app after another to find the nearest.',
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
          question: 'Can I unlock or book a scooter with Scooters?',
          answer: 'No. Tap a scooter, then “Open in …”: the provider’s app opens, and you unlock and pay there as usual. Scooters does not reserve the scooter, so someone may get to it before you.',
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
          question: 'Does Scooters know where I am?',
          answer: 'Your location is used on your device, to centre the map and work out walking times. The server only receives the part of the map you are looking at, and does not store it.',
        },
      ],
    },
    closing: {
      title: 'Go and find yours.',
      note: 'Your location is used on your device and is not stored. The code is open source.',
    },
    footer: {
      text: 'Scooters is independent and not affiliated with the providers; their names are trademarks of their owners. Positions come from the providers’ public data feeds and can be a few minutes old. Prices are estimates; the provider’s app shows the final price.',
      links: 'More links',
      privacy: 'Privacy',
      source: 'Source on GitHub',
    },
  },

  de: {
    meta: {
      title: 'E-Scooter-Karte: Lime, Bolt, Bird, Voi, Dott und mehr | Scooters',
      description: cities =>
        `Alle E-Scooter und E-Trottinette in deiner Nähe auf einer Live-Karte: Lime, Bolt, Bird, Voi, Dott, Hopp, Pony und PubliBike. Gratis, ohne Konto, in ${cities} Städten.`,
      share: {
        title: 'Alle E-Scooter auf einer Karte.',
        alt: 'Alle E-Scooter auf einer Karte: die App bei Nacht am Zürcher Hauptbahnhof, daneben die Initialen von acht Anbietern.',
      },
    },
    nav: { main: 'Hauptnavigation', shows: 'Was die Karte zeigt', cities: 'Städte', languages: 'Sprache' },
    openMap: 'Karte öffnen',
    iphoneApp: 'iPhone-App laden',
    hero: {
      title: scooters => `Um dich herum stehen ${scooters} E-Scooter.`,
      lede: 'Scooters zeigt alle E-Scooter in deiner Nähe auf einer Karte, egal von welchem Sharing-Anbieter. So ist der schnellste Weg nach Hause das Erste, was du siehst.',
      note: 'Gratis. Kein Konto, keine Werbung.',
      stage: 'Scooter beim Zürcher Hauptbahnhof',
      alt: scooters =>
        `Die iPhone-App bei Nacht: eine dunkle Karte der Strassen beim Zürcher Hauptbahnhof, voller Markierungen mit den Initialen und der Farbe jedes Anbieters, ${scooters} Scooter in der Nähe.`,
      caption: date =>
        `Zürich Hauptbahnhof, ${date}: das jeweils nächste Fahrzeug der sieben Anbieter dort.`,
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
        title: 'Alle sieben. Eine Karte.',
        text: 'Bird, Bolt, Dott, Hopp, Lime, Voi und PubliBike haben je eine eigene App, und jede zeigt nur die eigene Flotte. Scooters zeigt alle. Dann ist der nächste Scooter auch wirklich der nächste.',
        close: (first, firstDistance, second, secondDistance) =>
          `Hier steht ein ${first} in ${firstDistance} Entfernung und ein ${second} in ${secondDistance}. Dafür brauchst du zwei Apps. Oder eine Karte.`,
        providers: 'Anbieter in Zürich',
        alt: 'Dieselben Strassen bei Tag, mit den Markierungen aller Anbieter auf einer Karte.',
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
        text: 'Die Karte folgt dem Erscheinungsbild deines Geräts, oder du wählst eines und bleibst dabei. Auf Deutsch, Englisch, Französisch oder Italienisch.',
        light: 'Die Karte im hellen Erscheinungsbild.',
        dark: 'Dieselbe Karte im dunklen Erscheinungsbild.',
      },
    },
    cities: {
      title: cities => `${cities} Städte.`,
      lede: 'E-Scooter in der Schweiz, in Deutschland und Frankreich sowie in Rom. Wo kein Anbieter Daten veröffentlicht, sagt die Karte das und nennt die nächsten Städte mit Daten. Wähle eine Stadt, um die Karte dort zu öffnen.',
      countries: { CH: 'Schweiz', DE: 'Deutschland', FR: 'Frankreich', IT: 'Italien' },
      more: count => `und ${count} weitere`,
      alt: 'Die Karte, herausgezoomt über Europa, mit der Zahl der Scooter in jeder Stadt.',
    },
    faq: {
      title: 'Bevor du fragst.',
      items: [
        {
          question: 'Gibt es eine einzige App für Lime, Bolt, Bird, Voi und Dott?',
          answer: 'Scooters ist eine Karte für alle fünf und auch für Hopp, Pony und PubliBike. Sie zeigt jeden Sharing-E-Scooter, dessen Anbieter den Standort veröffentlicht. So musst du nicht mehr eine App nach der anderen öffnen, um den nächsten zu finden.',
        },
        {
          question: 'Wie finde ich den nächsten E-Scooter oder das nächste E-Trottinett?',
          answer: 'Öffne die Karte und tippe auf «In meiner Nähe», oder suche nach einer Adresse oder Stadt. Zu jedem Scooter siehst du Distanz und Gehzeit, Akkustand und Reichweite (sofern der Anbieter sie veröffentlicht) und eine Schätzung, was die Fahrt kostet.',
        },
        {
          question: 'Ist es gratis? Brauche ich ein Konto?',
          answer: 'Scooters ist gratis, ohne Konto und ohne Werbung. Du bezahlst nur die Fahrt, direkt beim Anbieter in seiner App.',
        },
        {
          question: 'Kann ich mit Scooters einen Scooter entsperren oder reservieren?',
          answer: 'Nein. Tippe auf einen Scooter, dann auf «In … öffnen»: Die App des Anbieters öffnet sich, und dort entsperrst und bezahlst du wie gewohnt. Scooters reserviert den Scooter nicht, jemand anderes kann also schneller sein.',
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
          question: 'Weiss Scooters, wo ich bin?',
          answer: 'Dein Standort wird auf deinem Gerät genutzt, um die Karte zu zentrieren und die Gehzeiten zu berechnen. Der Server erhält nur den Kartenausschnitt, den du gerade ansiehst, und speichert ihn nicht.',
        },
      ],
    },
    closing: {
      title: 'Finde deinen Scooter.',
      note: 'Dein Standort wird auf deinem Gerät genutzt und nicht gespeichert. Der Code ist Open Source.',
    },
    footer: {
      text: 'Scooters ist unabhängig und steht in keiner Verbindung zu den Anbietern; deren Namen sind Marken ihrer jeweiligen Inhaber. Die Positionen stammen aus den öffentlichen Datenfeeds der Anbieter und können einige Minuten alt sein. Preise sind Schätzungen; den Endpreis zeigt die App des Anbieters.',
      links: 'Weitere Links',
      privacy: 'Datenschutz',
      source: 'Quellcode auf GitHub',
    },
  },

  fr: {
    meta: {
      title: 'Carte des trottinettes électriques en libre-service | Scooters',
      description: cities =>
        `Toutes les trottinettes électriques en libre-service autour de vous sur une carte en direct : Lime, Dott, Bolt, Voi, Bird, Hopp, Pony et PubliBike. Gratuit, sans compte, dans ${cities} villes.`,
      share: {
        title: 'Toutes les trottinettes sur une seule carte.',
        alt: 'Toutes les trottinettes sur une seule carte : l’app, de nuit, près de la gare centrale de Zurich, à côté des initiales de huit opérateurs.',
      },
    },
    nav: { main: 'Navigation principale', shows: 'Ce que montre la carte', cities: 'Villes', languages: 'Langue' },
    openMap: 'Ouvrir la carte',
    iphoneApp: 'Télécharger l’app iPhone',
    hero: {
      title: scooters => `Il y a ${scooters} trottinettes autour de vous.`,
      lede: 'Scooters réunit sur une seule carte toutes les trottinettes électriques en libre-service autour de vous, quel que soit l’opérateur. Le plus court chemin pour rentrer est ainsi la première chose que vous voyez.',
      note: 'Gratuit. Sans compte, sans pub.',
      stage: 'Trottinettes près de la gare centrale de Zurich',
      alt: scooters =>
        `L’app iPhone, de nuit : une carte sombre des rues près de la gare centrale de Zurich, couverte de repères aux initiales et à la couleur de chaque opérateur, et ${scooters} trottinettes à proximité.`,
      caption: date =>
        `Gare centrale de Zurich, ${date} : le véhicule le plus proche chez chacun des sept opérateurs présents.`,
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
        title: 'Les sept. Une seule carte.',
        text: 'Bird, Bolt, Dott, Hopp, Lime, Voi et PubliBike ont chacun leur app, qui ne montre que leur propre flotte. Scooters montre toutes les flottes : la trottinette la plus proche est donc simplement la plus proche.',
        close: (first, firstDistance, second, secondDistance) =>
          `Ici, une ${first} est à ${firstDistance} et une ${second} à ${secondDistance}. Pour le savoir, il faut deux apps, ou une seule carte.`,
        providers: 'Opérateurs à Zurich',
        alt: 'Les mêmes rues de jour, avec les repères de tous les opérateurs sur une seule carte.',
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
        text: 'La carte suit l’apparence de votre appareil, ou vous en choisissez une et vous la gardez. En français, allemand, italien ou anglais.',
        light: 'La carte en mode clair.',
        dark: 'La même carte en mode sombre.',
      },
    },
    cities: {
      title: cities => `${cities} villes.`,
      lede: 'Des trottinettes en libre-service en Suisse, en Allemagne et en France, ainsi qu’à Rome. Là où aucun opérateur ne publie de données, la carte le dit et indique les villes les plus proches qui en ont. Choisissez une ville pour y ouvrir la carte.',
      countries: { CH: 'Suisse', DE: 'Allemagne', FR: 'France', IT: 'Italie' },
      more: count => (count === 1 ? 'et une autre' : `et ${count} autres`),
      alt: 'La carte à l’échelle de l’Europe, avec le nombre de trottinettes dans chaque ville.',
    },
    faq: {
      title: 'Vos questions.',
      items: [
        {
          question: 'Existe-t-il une app qui regroupe Lime, Bolt, Bird, Voi et Dott ?',
          answer: 'Scooters les réunit tous sur une seule carte, avec en plus Hopp, Pony et PubliBike. Elle montre chaque trottinette électrique en libre-service dont l’opérateur publie la position : plus besoin d’ouvrir les apps une à une pour trouver la plus proche.',
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
          question: 'Peut-on déverrouiller ou réserver une trottinette avec Scooters ?',
          answer: 'Non. Touchez une trottinette, puis « Ouvrir dans … » : l’app de l’opérateur s’ouvre, et vous y déverrouillez la trottinette et payez comme d’habitude. Scooters ne la réserve pas ; quelqu’un peut donc la prendre avant vous.',
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
          question: 'Scooters sait-il où je suis ?',
          answer: 'Votre position est utilisée sur votre appareil, pour centrer la carte et calculer les temps de marche. Le serveur ne reçoit que la partie de la carte que vous regardez, et ne la conserve pas.',
        },
      ],
    },
    closing: {
      title: 'Trouvez votre trottinette.',
      note: 'Votre position est utilisée sur votre appareil et n’est pas enregistrée. Le code est open source.',
    },
    footer: {
      text: 'Scooters est indépendant et n’est pas affilié aux opérateurs ; leurs noms sont des marques de leurs propriétaires respectifs. Les positions proviennent des flux de données publics des opérateurs et peuvent dater de quelques minutes. Les prix sont des estimations ; le prix final est celui qu’affiche l’app de l’opérateur.',
      links: 'Autres liens',
      privacy: 'Confidentialité',
      source: 'Code source sur GitHub',
    },
  },

  it: {
    meta: {
      title: 'Monopattini elettrici in sharing su una sola mappa | Scooters',
      description: cities =>
        `Tutti i monopattini elettrici in sharing intorno a te su una mappa in tempo reale: Lime, Bolt, Dott, Voi, Bird, Hopp, Pony e PubliBike. Gratis, senza account, in ${cities} città.`,
      share: {
        title: 'Tutti i monopattini su una sola mappa.',
        alt: 'Tutti i monopattini su una sola mappa: l’app di notte vicino alla stazione centrale di Zurigo, accanto alle iniziali di otto operatori.',
      },
    },
    nav: { main: 'Navigazione principale', shows: 'Cosa mostra la mappa', cities: 'Città', languages: 'Lingua' },
    openMap: 'Apri la mappa',
    iphoneApp: 'Scarica l’app per iPhone',
    hero: {
      title: scooters => `Ci sono ${scooters} monopattini intorno a te.`,
      lede: 'Scooters mette su una sola mappa tutti i monopattini elettrici in sharing intorno a te, di qualunque operatore. Così la strada più breve per tornare a casa è la prima cosa che vedi.',
      note: 'Gratis. Niente account, niente pubblicità.',
      stage: 'Monopattini vicino alla stazione centrale di Zurigo',
      alt: scooters =>
        `L’app per iPhone di notte: una mappa scura delle strade vicino alla stazione centrale di Zurigo, coperta di segnaposto con le iniziali e il colore di ogni operatore, e ${scooters} monopattini nelle vicinanze.`,
      caption: date =>
        `Stazione centrale di Zurigo, ${date}: per ciascuno dei sette operatori presenti, il mezzo più vicino.`,
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
        title: 'Tutti e sette. Una sola mappa.',
        text: 'Bird, Bolt, Dott, Hopp, Lime, Voi e PubliBike hanno ciascuno la sua app, che mostra solo la propria flotta. Scooters li mostra tutti: il mezzo più vicino è semplicemente il più vicino.',
        close: (first, firstDistance, second, secondDistance) =>
          `Qui un ${first} è a ${firstDistance} e un ${second} a ${secondDistance}. Per saperlo servono due app, oppure una sola mappa.`,
        providers: 'Operatori a Zurigo',
        alt: 'Le stesse strade di giorno, con i segnaposto di tutti gli operatori su una sola mappa.',
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
        text: 'La mappa segue l’aspetto del tuo dispositivo, oppure ne scegli uno e lo tieni. In italiano, tedesco, francese o inglese.',
        light: 'La mappa con l’aspetto chiaro.',
        dark: 'La stessa mappa con l’aspetto scuro.',
      },
    },
    cities: {
      title: cities => `${cities} città.`,
      lede: 'Monopattini in sharing in Svizzera, Germania e Francia, più Roma. Dove nessun operatore pubblica dati, la mappa lo dice e indica le città più vicine che ne hanno. Scegli una città per aprire lì la mappa.',
      countries: { CH: 'Svizzera', DE: 'Germania', FR: 'Francia', IT: 'Italia' },
      more: count => (count === 1 ? 'e un’altra' : `e altre ${count}`),
      alt: 'La mappa dell’Europa vista da lontano, con il numero di monopattini in ogni città.',
    },
    faq: {
      title: 'Prima che tu lo chieda.',
      items: [
        {
          question: 'Esiste un’unica app per Lime, Bolt, Bird, Voi e Dott?',
          answer: 'Scooters li mette tutti su una sola mappa, insieme a Hopp, Pony e PubliBike. Mostra ogni monopattino elettrico in sharing il cui operatore pubblica la posizione: non serve più aprire un’app dopo l’altra per trovare quello più vicino.',
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
          question: 'Posso sbloccare o prenotare un monopattino con Scooters?',
          answer: 'No. Tocca un monopattino, poi «Apri in …»: si apre l’app dell’operatore, dove sblocchi e paghi come sempre. Scooters non prenota il monopattino, quindi qualcuno potrebbe prenderlo prima di te.',
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
          question: 'Scooters sa dove mi trovo?',
          answer: 'La tua posizione viene usata sul tuo dispositivo, per centrare la mappa e calcolare i tempi a piedi. Il server riceve solo la parte di mappa che stai guardando, e non la salva.',
        },
      ],
    },
    closing: {
      title: 'Trova il tuo.',
      note: 'La tua posizione viene usata sul tuo dispositivo e non viene salvata. Il codice è open source.',
    },
    footer: {
      text: 'Scooters è un’app indipendente, non affiliata agli operatori; i loro nomi sono marchi dei rispettivi titolari. Le posizioni provengono dai feed di dati pubblici degli operatori e possono risalire a qualche minuto fa. I prezzi sono stime; il prezzo finale è quello dell’app dell’operatore.',
      links: 'Altri link',
      privacy: 'Privacy',
      source: 'Codice sorgente su GitHub',
    },
  },
};
