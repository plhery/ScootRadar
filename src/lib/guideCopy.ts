// The words around a guide, src/lib/guides.ts: its list, the way back to it,
// the box that leads to the map. The words of the guides themselves are in
// src/guides. They follow the rules of src/lib/landingCopy.ts.

import type { LandingLocale } from '@/lib/landingCopy';

export interface GuideCopy {
  /** The list of a language's guides. */
  index: { title: string; description: string; lede: string };
  /** The name of the trail above a headline: the site, the guides, the guide. */
  trail: string;
  /** The date is written out in the language. */
  updated: (date: string) => string;
  reading: (minutes: number) => string;
  contents: string;
  faq: string;
  sources: string;
  /** The other guides of the language, at the end of one. */
  more: string;
  /** The last entry of the footer's list: all the guides of the language. */
  all: string;
  /** The box after the sections, with the button to the map. */
  map: { title: string; text: string };
  /** Under the sources: the guide is a summary, as of its date. */
  disclaimer: string;
}

export const GUIDE_COPY: Record<LandingLocale, GuideCopy> = {
  en: {
    index: {
      title: 'E-scooter guides: rules, prices and cities | ScootRadar',
      description: 'Plain guides to shared e-scooters: the rules in Switzerland, the UK and across Europe, what a ride costs, and how it works in your city.',
      lede: 'What to know before you ride a shared e-scooter: the rules of the road, what a ride costs, and how it works in your city.',
    },
    trail: 'You are here',
    updated: date => `Updated ${date}`,
    reading: minutes => `${minutes} min read`,
    contents: 'In this guide',
    faq: 'Questions',
    sources: 'Sources',
    more: 'More guides',
    all: 'All guides',
    map: {
      title: 'Find the nearest scooter.',
      text: 'Every provider on one live map, with the battery, the walk and an estimate of the price. Free, no account.',
    },
    disclaimer: 'This guide sums up what we found on the date above. It is not legal advice: the law, and the provider’s terms and app, have the last word.',
  },

  de: {
    index: {
      title: 'Ratgeber zu E-Trottinett und E-Scooter | ScootRadar',
      description: 'Ratgeber zu geteilten E-Trottinetten und E-Scootern: die Regeln in der Schweiz und in Deutschland, was eine Fahrt kostet und wie es in deiner Stadt läuft.',
      lede: 'Was du wissen solltest, bevor du auf ein geteiltes E-Trottinett steigst: die Verkehrsregeln, was eine Fahrt kostet und wie es in deiner Stadt läuft.',
    },
    trail: 'Du bist hier',
    updated: date => `Aktualisiert am ${date}`,
    reading: minutes => `${minutes} Min. Lesezeit`,
    contents: 'In diesem Ratgeber',
    faq: 'Häufige Fragen',
    sources: 'Quellen',
    more: 'Weitere Ratgeber',
    all: 'Alle Ratgeber',
    map: {
      title: 'Finde den nächsten Scooter.',
      text: 'Alle Anbieter auf einer Live-Karte, mit Akku, Gehzeit und geschätztem Preis. Gratis, ohne Konto.',
    },
    disclaimer: 'Dieser Ratgeber gibt den Stand vom oben genannten Datum wieder. Er ist keine Rechtsberatung: Massgebend sind das Gesetz sowie die Bedingungen und die App des Anbieters.',
  },

  fr: {
    index: {
      title: 'Guides de la trottinette électrique | ScootRadar',
      description: 'Des guides clairs sur la trottinette électrique en libre-service : les règles en Suisse et en France, le prix d’un trajet, le fonctionnement en ville.',
      lede: 'Ce qu’il faut savoir avant de monter sur une trottinette électrique en libre-service : les règles de circulation, le prix d’un trajet et le fonctionnement dans votre ville.',
    },
    trail: 'Vous êtes ici',
    updated: date => `Mis à jour le ${date}`,
    reading: minutes => `${minutes} min de lecture`,
    contents: 'Dans ce guide',
    faq: 'Questions fréquentes',
    sources: 'Sources',
    more: 'Autres guides',
    all: 'Tous les guides',
    map: {
      title: 'Trouvez la trottinette la plus proche.',
      text: 'Tous les opérateurs sur une seule carte en temps réel, avec la batterie, la marche et une estimation du prix. Gratuit, sans compte.',
    },
    disclaimer: 'Ce guide reflète ce que nous savions à la date indiquée plus haut. Ce n’est pas un conseil juridique : la loi, ainsi que les conditions et l’app de l’opérateur, font foi.',
  },

  it: {
    index: {
      title: 'Guide al monopattino elettrico in sharing | ScootRadar',
      description: 'Guide semplici ai monopattini elettrici in sharing: le regole in Svizzera e in Italia, quanto costa una corsa e come funziona nella tua città.',
      lede: 'Cosa sapere prima di salire su un monopattino elettrico in sharing: le regole della strada, quanto costa una corsa e come funziona nella tua città.',
    },
    trail: 'Sei qui',
    updated: date => `Aggiornato il ${date}`,
    reading: minutes => `${minutes} min di lettura`,
    contents: 'In questa guida',
    faq: 'Domande frequenti',
    sources: 'Fonti',
    more: 'Altre guide',
    all: 'Tutte le guide',
    map: {
      title: 'Trova il monopattino più vicino.',
      text: 'Tutti gli operatori su una sola mappa in tempo reale, con la batteria, il tragitto a piedi e una stima del prezzo. Gratis, senza account.',
    },
    disclaimer: 'Questa guida riflette ciò che sapevamo alla data indicata sopra. Non è una consulenza legale: fanno fede la legge, le condizioni e l’app dell’operatore.',
  },

  nl: {
    index: {
      title: 'Gidsen over deelsteps en elektrische steps | ScootRadar',
      description: 'Heldere gidsen over elektrische deelsteps: de regels in België, wat een rit kost en hoe het werkt in Brussel, Antwerpen en andere steden.',
      lede: 'Wat je moet weten voor je op een elektrische deelstep stapt: de verkeersregels, wat een rit kost en hoe het werkt in jouw stad.',
    },
    trail: 'Je bent hier',
    updated: date => `Bijgewerkt op ${date}`,
    reading: minutes => `${minutes} min leestijd`,
    contents: 'In deze gids',
    faq: 'Veelgestelde vragen',
    sources: 'Bronnen',
    more: 'Meer gidsen',
    all: 'Alle gidsen',
    map: {
      title: 'Vind de dichtstbijzijnde step.',
      text: 'Alle aanbieders op één live kaart, met de batterij, de wandeltijd en een schatting van de prijs. Gratis, zonder account.',
    },
    disclaimer: 'Deze gids geeft weer wat we wisten op de datum hierboven. Het is geen juridisch advies: de wet en de voorwaarden en app van de aanbieder gaan voor.',
  },

  nb: {
    index: {
      title: 'Guider om elsparkesykler: regler og priser | ScootRadar',
      description: 'Enkle guider om elsparkesykler til leie: reglene i Norge, hva en tur koster og hvordan det fungerer i Oslo, Trondheim og andre byer.',
      lede: 'Det du bør vite før du leier en elsparkesykkel: trafikkreglene, hva en tur koster og hvordan det fungerer i byen din.',
    },
    trail: 'Du er her',
    updated: date => `Oppdatert ${date}`,
    reading: minutes => `${minutes} min lesetid`,
    contents: 'I denne guiden',
    faq: 'Vanlige spørsmål',
    sources: 'Kilder',
    more: 'Flere guider',
    all: 'Alle guider',
    map: {
      title: 'Finn den nærmeste sparkesykkelen.',
      text: 'Alle operatørene på ett kart i sanntid, med batteri, gangtid og et prisanslag. Gratis, uten konto.',
    },
    disclaimer: 'Denne guiden gjengir det vi visste på datoen over. Den er ikke juridisk rådgivning: loven og operatørens vilkår og app gjelder.',
  },

  pt: {
    index: {
      title: 'Guias da trotinete elétrica partilhada | ScootRadar',
      description: 'Guias simples sobre trotinetes elétricas partilhadas: as regras em Portugal, quanto custa uma viagem e como funciona na sua cidade.',
      lede: 'O que saber antes de andar numa trotinete elétrica partilhada: as regras de trânsito, quanto custa uma viagem e como funciona na sua cidade.',
    },
    trail: 'Está aqui',
    updated: date => `Atualizado a ${date}`,
    reading: minutes => `${minutes} min de leitura`,
    contents: 'Neste guia',
    faq: 'Perguntas frequentes',
    sources: 'Fontes',
    more: 'Mais guias',
    all: 'Todos os guias',
    map: {
      title: 'Encontre a trotinete mais próxima.',
      text: 'Todos os operadores num só mapa em tempo real, com a bateria, o caminho a pé e uma estimativa do preço. Grátis, sem conta.',
    },
    disclaimer: 'Este guia resume o que sabíamos na data acima. Não é aconselhamento jurídico: prevalecem a lei e os termos e a app do operador.',
  },

  es: {
    index: {
      title: 'Guías del patinete eléctrico compartido | ScootRadar',
      description: 'Guías claras sobre patinetes eléctricos compartidos: las normas en España, cuánto cuesta un trayecto y cómo funciona en tu ciudad.',
      lede: 'Lo que conviene saber antes de subirte a un patinete eléctrico compartido: las normas de circulación, cuánto cuesta un trayecto y cómo funciona en tu ciudad.',
    },
    trail: 'Estás aquí',
    updated: date => `Actualizado el ${date}`,
    reading: minutes => `${minutes} min de lectura`,
    contents: 'En esta guía',
    faq: 'Preguntas frecuentes',
    sources: 'Fuentes',
    more: 'Más guías',
    all: 'Todas las guías',
    map: {
      title: 'Encuentra el patinete más cercano.',
      text: 'Todos los operadores en un solo mapa en tiempo real, con la batería, el trayecto a pie y una estimación del precio. Gratis, sin registro.',
    },
    disclaimer: 'Esta guía resume lo que sabíamos en la fecha indicada arriba. No es asesoramiento jurídico: prevalecen la ley y las condiciones y la app del operador.',
  },

  is: {
    index: {
      title: 'Leiðarvísar um rafskútur: reglur og verð | ScootRadar',
      description: 'Einfaldir leiðarvísar um rafskútur til leigu: reglurnar á Íslandi, hvað ferð kostar og hvernig þetta virkar í þínum bæ.',
      lede: 'Það sem gott er að vita áður en þú leigir rafskútu: umferðarreglurnar, hvað ferð kostar og hvernig þetta virkar í þínum bæ.',
    },
    trail: 'Þú ert hér',
    updated: date => `Uppfært ${date}`,
    reading: minutes => `${minutes} mín. lestur`,
    contents: 'Í þessum leiðarvísi',
    faq: 'Algengar spurningar',
    sources: 'Heimildir',
    more: 'Fleiri leiðarvísar',
    all: 'Allir leiðarvísar',
    map: {
      title: 'Finndu næstu rafskútu.',
      text: 'Öll fyrirtækin á einu korti í rauntíma, með rafhlöðu, göngutíma og áætluðu verði. Ókeypis og án skráningar.',
    },
    disclaimer: 'Þessi leiðarvísir lýsir því sem við vissum á dagsetningunni hér að ofan. Hann er ekki lögfræðiráðgjöf: lögin, skilmálar fyrirtækisins og app þess gilda.',
  },
};
