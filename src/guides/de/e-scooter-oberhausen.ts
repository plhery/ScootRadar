import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-oberhausen',
  topic: 'oberhausen',
  name: 'E-Scooter Oberhausen: Anbieter, Regeln, Parken',
  title: 'E-Scooter Oberhausen 2026: Anbieter, Regeln, Parken',
  description: 'E-Scooter Oberhausen: Voi, Dott, Bolt und Lime, wo du fährst und parkst, was Verstösse kosten, was bei der STOAG gilt und wie du zur Neuen Mitte kommst.',
  headline: 'E-Scooter Oberhausen: Anbieter, Regeln, Parken und was bei der STOAG gilt',
  lede: 'Einen E-Scooter in Oberhausen leihst du ohne Führerschein bei Voi, Dott, Bolt oder Lime. Was die Fahrt kostet und ab welchem Alter du mieten darfst, zeigt dir die App vor dem Entsperren. Du fährst auf Radweg oder Fahrbahn, nicht auf dem Gehweg und nicht durch die Fussgängerzone der Innenstadt. In Bussen und Bahnen der STOAG sind E-Scooter seit dem 1. März 2024 verboten.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'de:Oberhausen',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Oberhausen?',
      blocks: [
        'Vier Anbieter vermieten im Oktober 2026 E-Scooter in Oberhausen: **Voi**, **Dott** (früher Tier), **Bolt** und **Lime**. Voi kam laut Radio Oberhausen am 1. August 2025 dazu.',
        'Wie das Mieten in der App geht, auch wo du den Preis siehst: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am Montag, 26. Oktober 2026, zeigte die [Karte von Oberhausen](map:de:Oberhausen) kurz nach 7 Uhr rund 240 Dott-, 260 Voi- und 140 Bolt-Scooter, die zu diesem Zeitpunkt frei waren, dazu rund 360 Lime-Scooter nach der letzten Zählung.',
        'Leihräder gibt es beim metropolradruhr. Dessen Betreiber ist seit April 2026 Donkey Republic: Das Unternehmen werde «ab 1. April 2026 den Betrieb aufnehmen», schrieb der Regionalverband Ruhr im Dezember 2025.',
      ],
    },
    {
      heading: 'Wo darf man in Oberhausen mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, auch mit ausgeschaltetem Motor, ausser ein Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es. Diese Regeln setzt der Bund in der Elektrokleinstfahrzeuge-Verordnung (eKFV).',
        'In der Fussgängerzone der Innenstadt steigst du also ab und schiebst.',
        'Wo du mit dem Leih-Scooter fahren und die Fahrt beenden darfst, zeigt die App.',
      ],
    },
    {
      heading: 'E-Scooter in Oberhausen parken',
      blocks: [
        'Es gelten die Regeln für Fahrräder: Auf dem Gehweg darfst du abstellen, solange niemand behindert oder gefährdet wird; ab 1. März 2027 steht das ausdrücklich in der StVO. Wo Leih-Scooter stehen dürfen, regelt jede Stadt selbst, und die Anbieter setzen eigene Regeln, die dir die App zeigt.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Verbotszone, und die Miete läuft weiter. Fahr ein Stück weiter: Die App zeigt, wo du abstellen darfst.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Oberhausen: Bussgelder und Alkohol',
      blocks: [
        'In Oberhausen gelten die deutschen Regeln: ab 14 ohne Führerschein, keine Helmpflicht, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt; länger als 1 Sekunde rot: 100 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'unzulässig auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Wer unsicher fährt, macht sich schon ab 0,3 Promille strafbar, ab 1,1 Promille in jedem Fall, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: Was bei der STOAG gilt',
      blocks: [
        'Seit dem 1. März 2024 dürfen laut STOAG «aus Sicherheitsgründen keine E-Tretroller (sogenannte E-Scooter) mehr in Bussen und Bahnen der STOAG mitgenommen werden». Sie folgt damit einer Empfehlung des Branchenverbands VDV; eine Ausnahme für zusammengeklappte Scooter nennt sie nicht. Elektro-Rollstühle und die für den Nahverkehr zugelassenen Aufsitz-Elektromobile sind nicht betroffen.',
        'Die Strassenbahn 112 fährt laut STOAG-Fahrplan vom Hauptbahnhof über die Neue Mitte und den OLGA-Park nach Sterkrade, in der anderen Richtung nach Mülheim. Willst du so zum Centro, lässt du den Scooter stehen.',
        'Ob ein eigener E-Scooter in S-Bahn, Regional- oder Fernzug mitfahren darf, fragst du vor der Fahrt beim Verkehrsunternehmen der Linie nach.',
        '**Mobilitätsgarantie NRW:** Fährt dein Bus oder Zug mindestens 20 Minuten später ab als geplant, darfst du auf ein Sharing-Angebot umsteigen, auch auf einen E-Scooter. Erstattet werden bis zu 30 € bei geplanter Abfahrt zwischen 5 und 19:59 Uhr, sonst bis zu 60 €, gegen dein Ticket und den Beleg des Anbieters. Den Antrag stellst du binnen 14 Tagen beim Verkehrsunternehmen der Linie, online über mobil.nrw.',
      ],
    },
    {
      heading: 'Gasometer und Neue Mitte: Tipps für Oberhausen',
      blocks: [
        {
          list: [
            '**Gasometer:** Die Ausstellung «Mythos Wald» läuft bis zum 28. November 2027, und am 28. und 29. November 2026 gibt es rund um den Gasometer zum ersten Mal einen Weihnachtsmarkt.',
            '**Neue Mitte:** Laut STOAG planen Oberhausen und Essen, die Strassenbahn 105 um rund 3,5 km von Essen Unterstrasse bis zur Neuen Mitte zu verlängern. Dann gäbe es erstmals seit den 1970er Jahren wieder eine umsteigefreie Strassenbahn zwischen beiden Städten (Stand Mai 2026).',
          ],
        },
      ],
    },
    {
      heading: 'Duisburg, Mülheim, Essen: E-Scooter in den Nachbarstädten',
      blocks: [
        {
          list: [
            '**Duisburg:** Was dort gilt, steht in [E-Scooter in Duisburg](guide:duisburg); die freien Scooter zeigt die [Karte von Duisburg](map:de:Duisburg).',
            '**Mülheim an der Ruhr:** Die Strassenbahn 112 fährt hinüber. Im Zentrum dort mietest und parkst du laut Stadt Mülheim nur an Stationen: [E-Scooter in Mülheim an der Ruhr](guide:muelheim).',
            '**Essen:** In der Innenstadt beendest du die Fahrt nur auf einer markierten Parkfläche: [E-Scooter in Essen](guide:essen).',
          ],
        },
        'Ob du in der Nachbarstadt die Fahrt beenden darfst, zeigt die App.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Oberhausen nutzen?',
      answer: 'Die von Voi, Dott, Bolt und Lime (Stand Oktober 2026). Einen Führerschein brauchst du nicht; ab welchem Alter du mieten darfst und was die Fahrt kostet, zeigt dir die App. Freie Scooter zeigt die [Live-Karte von Oberhausen](map:de:Oberhausen).',
    },
    {
      question: 'Wie komme ich ohne Scooter vom Hauptbahnhof zum Centro?',
      answer: 'Mit der Strassenbahn 112 über die Neue Mitte. Den Scooter lässt du vorher stehen: In Bussen und Bahnen der STOAG darf er seit dem 1. März 2024 nicht mit.',
    },
    {
      question: 'Darf ich einen E-Scooter in Bus oder Bahn der STOAG mitnehmen?',
      answer: 'Nein, seit dem 1. März 2024 nicht, laut STOAG aus Sicherheitsgründen; eine Ausnahme für zusammengeklappte nennt sie nicht. Ob ein eigener Scooter in S-Bahn oder Zug mitfahren darf, fragst du vor der Fahrt beim Verkehrsunternehmen der Linie nach.',
    },
    {
      question: 'Darf ich in der Oberhausener Innenstadt mit dem E-Scooter fahren?',
      answer: 'Auf Radwegen und Fahrbahnen ja, durch die Fussgängerzone nicht; das verbietet die eKFV des Bundes. Das kostet heute 15 €, ab 1. März 2027 25 €.',
    },
    {
      question: 'Kann ich mit dem Leih-Scooter nach Duisburg oder Mülheim fahren?',
      answer: 'Fahren schon, aber wo du die Fahrt beenden darfst, zeigt die App des Anbieters. In Mülheims Zentrum gibst du den Scooter laut Stadt nur an einer Station zurück.',
    },
  ],
  sources: [
    { title: 'Radio Oberhausen: Weiterer E-Scooter-Anbieter startet heute (1. August 2025)', url: 'https://www.radiooberhausen.de/artikel/weiterer-e-scooter-anbieter-startet-heute-2398396' },
    { title: 'Regionalverband Ruhr: Neuer Betriebspartner für das Metropolradruhr (18. Dezember 2025)', url: 'https://www.rvr.ruhr/news/startseite-news/news/metropolradruhr-neuer-betriebspartner-des-fahrradverleihsystems-steht-fest/' },
    { title: 'STOAG: Keine E-Tretroller mehr bei der STOAG (27. Februar 2024)', url: 'https://www.stoag.de/presse/keine-e-tretroller-mehr-bei-der-stoag.html' },
    { title: 'STOAG: Fahrräder, Tretroller und Co', url: 'https://www.stoag.de/service/fahrraeder-tretroller-und-co.html' },
    { title: 'STOAG: Fahrplan der Strassenbahnlinie 112 (PDF)', url: 'https://www.stoag.de/fileadmin/dokumente/fahrplaene/HP_FP/112.pdf' },
    { title: 'STOAG: Direkte Strassenbahnverbindung zwischen Oberhausen und Essen (15. Mai 2026)', url: 'https://www.stoag.de/dialog/neuigkeiten/detail/direkte-strassenbahnverbindung-zwischen-oberhausen-und-essen-1.html' },
    { title: 'mobil.nrw: Mobilitätsgarantie NRW', url: 'https://www.mobil.nrw/fahren/mobigarantie.html' },
    { title: 'Stadt Mülheim an der Ruhr: E-Scooter-Sharing (9. September 2025)', url: 'https://cms.muelheim-ruhr.de/rathaus/aemter-und-einrichtungen/ordnungsamt/strassenverkehrsbehoerde/sondernutzung-oeffentlicher/e' },
    { title: 'Gasometer Oberhausen: Mythos Wald und Weihnachtsmarkt', url: 'https://www.gasometer.de/de' },
  ],
};

export default guide;
