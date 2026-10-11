// The words of the landing page, src/app/(site)/[locale]/page.tsx. It is
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
  meta: { title: string; description: (cities: number) => string };
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
  closing: { title: string; note: string };
  footer: { text: string; links: string; privacy: string; source: string };
}

export const LANDING_COPY: Record<LandingLocale, LandingCopy> = {
  en: {
    meta: {
      title: 'Scooters — Shared e-scooters on one map',
      description: cities =>
        `See the shared e-scooters around you on one map, whichever company runs them: Bolt, Bird, Dott, Hopp, Lime, Voi, Pony and PubliBike. Free, no account, in ${cities} cities.`,
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
      lede: 'In Switzerland, Germany and France, plus Rome. Where no provider publishes its data, the map says so and points you to the closest cities that have it. Pick a city to open the map there.',
      countries: { CH: 'Switzerland', DE: 'Germany', FR: 'France', IT: 'Italy' },
      more: count => `and ${count} more`,
      alt: 'The map zoomed out over Europe, with the number of scooters on each city.',
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
      title: 'Scooters – Alle Sharing-Scooter auf einer Karte',
      description: cities =>
        `Alle Sharing-Scooter in deiner Nähe auf einer Karte, egal von welchem Anbieter: Bolt, Bird, Dott, Hopp, Lime, Voi, Pony und PubliBike. Gratis, ohne Konto, in ${cities} Städten.`,
    },
    nav: { main: 'Hauptnavigation', shows: 'Was die Karte zeigt', cities: 'Städte', languages: 'Sprache' },
    openMap: 'Karte öffnen',
    iphoneApp: 'iPhone-App laden',
    hero: {
      title: scooters => `Um dich herum stehen ${scooters} Scooter.`,
      lede: 'Scooters zeigt alle Sharing-Scooter in deiner Nähe auf einer Karte, egal von welchem Anbieter. So ist der schnellste Weg nach Hause das Erste, was du siehst.',
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
      lede: 'In der Schweiz, in Deutschland und Frankreich sowie in Rom. Wo kein Anbieter Daten veröffentlicht, sagt die Karte das und nennt die nächsten Städte mit Daten. Wähle eine Stadt, um die Karte dort zu öffnen.',
      countries: { CH: 'Schweiz', DE: 'Deutschland', FR: 'Frankreich', IT: 'Italien' },
      more: count => `und ${count} weitere`,
      alt: 'Die Karte, herausgezoomt über Europa, mit der Zahl der Scooter in jeder Stadt.',
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
      title: 'Scooters — Les trottinettes en libre-service sur une seule carte',
      description: cities =>
        `Toutes les trottinettes en libre-service autour de vous sur une seule carte, quel que soit l’opérateur : Bolt, Bird, Dott, Hopp, Lime, Voi, Pony et PubliBike. Gratuit, sans compte, dans ${cities} villes.`,
    },
    nav: { main: 'Navigation principale', shows: 'Ce que montre la carte', cities: 'Villes', languages: 'Langue' },
    openMap: 'Ouvrir la carte',
    iphoneApp: 'Télécharger l’app iPhone',
    hero: {
      title: scooters => `Il y a ${scooters} trottinettes autour de vous.`,
      lede: 'Scooters réunit sur une seule carte toutes les trottinettes en libre-service autour de vous, quel que soit l’opérateur. Le plus court chemin pour rentrer est ainsi la première chose que vous voyez.',
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
      lede: 'En Suisse, en Allemagne et en France, ainsi qu’à Rome. Là où aucun opérateur ne publie de données, la carte le dit et indique les villes les plus proches qui en ont. Choisissez une ville pour y ouvrir la carte.',
      countries: { CH: 'Suisse', DE: 'Allemagne', FR: 'France', IT: 'Italie' },
      more: count => (count === 1 ? 'et une autre' : `et ${count} autres`),
      alt: 'La carte à l’échelle de l’Europe, avec le nombre de trottinettes dans chaque ville.',
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
      title: 'Scooters — Tutti i monopattini in sharing su una sola mappa',
      description: cities =>
        `Tutti i monopattini in sharing intorno a te su una sola mappa, di qualunque operatore: Bolt, Bird, Dott, Hopp, Lime, Voi, Pony e PubliBike. Gratis, senza account, in ${cities} città.`,
    },
    nav: { main: 'Navigazione principale', shows: 'Cosa mostra la mappa', cities: 'Città', languages: 'Lingua' },
    openMap: 'Apri la mappa',
    iphoneApp: 'Scarica l’app per iPhone',
    hero: {
      title: scooters => `Ci sono ${scooters} monopattini intorno a te.`,
      lede: 'Scooters mette su una sola mappa tutti i monopattini in sharing intorno a te, di qualunque operatore. Così la strada più breve per tornare a casa è la prima cosa che vedi.',
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
      lede: 'In Svizzera, Germania e Francia, più Roma. Dove nessun operatore pubblica dati, la mappa lo dice e indica le città più vicine che ne hanno. Scegli una città per aprire lì la mappa.',
      countries: { CH: 'Svizzera', DE: 'Germania', FR: 'Francia', IT: 'Italia' },
      more: count => (count === 1 ? 'e un’altra' : `e altre ${count}`),
      alt: 'La mappa dell’Europa vista da lontano, con il numero di monopattini in ogni città.',
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
