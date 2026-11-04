import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'nl',
  slug: 'deelstep-huren',
  topic: 'how-to-rent',
  name: 'Een deelstep huren: zo werkt het',
  title: 'Deelstep huren: zo huur je een elektrische step in België',
  description: 'Deelstep huren in België, stap voor stap: de app, leeftijd en id-scan, wat een rit kost, reserveren, parkeren met foto, ongevallen en huren in het buitenland.',
  headline: 'Deelstep huren in België: van de app tot het einde van je rit',
  lede: 'Een deelstep huren gaat zo: je installeert de app van de aanbieder, maakt een account aan met je gsm-nummer en een betaalkaart, scant de QR-code op het stuur en rijdt weg. Op het einde zet je de step op een toegelaten plek, in Brussel en binnen de Antwerpse Leien in een dropzone, en neem je een foto. Bolt en Dott vragen 18 jaar, Hoppy in Kortrijk 16, en in Brussel scan je één keer je identiteitsbewijs. Je betaalt om te ontgrendelen en per minuut: in november 2026 kost een Voi in Antwerpen € 0,99 plus € 0,25 per minuut, dus € 3,49 voor tien minuten.',
  published: '2026-10-12',
  updated: '2026-10-26',
  sections: [
    {
      heading: 'Deelstep huren: hoe werkt het, stap voor stap?',
      blocks: [
        'Elke aanbieder heeft een eigen app, en je hebt een account nodig bij de aanbieder van je step. In Brussel kan je nog huren tot en met 31 december 2026: de Brusselse regering heeft beslist dat de deelsteps er vanaf 1 januari 2027 verdwijnen. Bij de meeste aanbieders gaat het zo:',
        {
          steps: [
            '**Installeer de app en maak een account** met je gsm-nummer of je e-mailadres.',
            '**Bewijs je leeftijd als de app erom vraagt.** In Brussel scan je bij Bolt en Dott je identiteitsbewijs voor je eerste rit.',
            '**Voeg een betaalmiddel toe** (zie de tabel hieronder).',
            '**Bekijk de prijs:** tik op de step op de kaart of scan hem. Neem ook de korte uitleg in de app door.',
            '**Scan de QR-code** op het stuur. Lukt dat niet, typ dan het nummer dat eronder staat.',
            '**Controleer remmen, banden, licht en batterij.** Werkt de step niet nadat je hem ontgrendeld hebt, meld het dan in de app.',
            '**Rij alleen**, op het fietspad of de rijbaan, en binnen de bebouwde kom nooit op het voetpad. Nieuwe rijders starten trager: bij Bolt rij je maximaal 15 km/u tot je vijf ritten hebt voltooid.',
            '**Parkeer waar de app het toelaat, beëindig je rit en neem de foto.** Je betaalt tot de app bevestigt dat je rit voorbij is.',
            '**Kijk je ontvangstbewijs na:** het geblokkeerde bedrag komt vrij.',
          ],
        },
        'Op piekmomenten laat Bolt je eerst een korte reactietest in de app doen voor je kan ontgrendelen.',
      ],
    },
    {
      heading: 'Wat heb je nodig? Leeftijd, identiteitsbewijs en betaalmiddel',
      blocks: [
        'Een smartphone met mobiele data, een account en een betaalmiddel. Een rijbewijs heb je in België niet nodig. De wet laat je vanaf 16 jaar steppen, maar elke aanbieder kiest zijn eigen grens:',
        {
          table: {
            caption: 'Wat de aanbieders in België vragen (november 2026)',
            head: ['Aanbieder', 'Minimumleeftijd', 'Identiteit', 'Betalen'],
            rows: [
              ['Bolt (onder meer Brussel en Antwerpen)', '18 jaar', 'Kan een foto van je rijbewijs of van een identiteitsbewijs van de overheid vragen; in Brussel verplicht', 'Krediet- of debetkaart, of een ander betaalmiddel dat de app ondersteunt'],
              ['Dott (onder meer Brussel en Charleroi)', '18 jaar', 'In Brussel: identiteitskaart, rijbewijs, paspoort of verblijfsvergunning', 'Kaart, PayPal, Apple Pay, Revolut Pay; afhankelijk van het land ook Bancontact'],
              ['Hoppy (Kortrijk)', '16 jaar, 18 voor een abonnement', 'Je verklaart zelf dat je oud genoeg bent', 'Krediet- of debetkaart; je Hoppy-wallet vult zich automatisch bij'],
            ],
          },
        },
        'In Brussel scan je sinds december 2025 je identiteitsbewijs voor je eerste rit, meldden Bolt en Dott volgens The Brussels Times. Bij Voi en Lime in Antwerpen toont de app de minimumleeftijd en de betaalmiddelen.',
        'Wat de wet zegt over leeftijd, helm, voetpad en alcohol, lees je in [de regels voor de elektrische step in België](guide:belgian-rules).',
      ],
    },
    {
      heading: 'Hoeveel kost een deelstep?',
      blocks: [
        'Je betaalt een ontgrendelprijs plus een prijs per minuut, ook als je stilstaat. De prijs verschilt per stad, en Dott rondt naar boven af naar de volgende volle minuut.',
        {
          table: {
            caption: 'Tarieven in november 2026, en wat een rit kost',
            head: ['Aanbieder en stad', 'Ontgrendelen', 'Per minuut', '10 minuten', '20 minuten'],
            rows: [
              ['Bolt, Brussel', '€ 0,99', '€ 0,31', '€ 4,09', '€ 7,19'],
              ['Dott, Brussel', '€ 1,00', '€ 0,37', '€ 4,70', '€ 8,40'],
              ['Voi, Antwerpen', '€ 0,99', '€ 0,25', '€ 3,49', '€ 5,99'],
              ['Hoppy, Kortrijk', '€ 0,95', '€ 0,18 tot € 0,30', '€ 2,75 tot € 3,95', '€ 4,55 tot € 6,95'],
            ],
          },
        },
        '**Een rekenvoorbeeld.** Je rijdt met een Dott in [Brussel](map:be:Bruxelles) 12 minuten en 20 seconden. Dat wordt 13 minuten: € 1 + 13 × € 0,37 = € 5,81. Zoek je daarna nog drie minuten naar een dropzone, dan betaal je € 6,92.',
        'De eindprijs zie je in de app voor je ontgrendelt.',
        '**Passen** lonen als je vaak rijdt. Dott verkoopt dag-, week- en maandpassen en een pas zonder ontgrendelprijs, Bolt week- en maandpassen; de prijzen staan in de apps.',
        '**Geblokkeerd bedrag.** Bij de start van je rit houdt Dott in België € 3 vast op je rekening, en ook Bolt reserveert vooraf een bedrag op je kaart. Het komt vrij na je rit, maar je bank kan er enkele dagen over doen.',
      ],
    },
    {
      heading: 'Kan je een deelstep reserveren of pauzeren?',
      blocks: [
        'Reserveren kan bij Bolt, Dott en Hoppy. Pauzeren kan bij Dott, maar de minuten lopen door:',
        {
          list: [
            '**Dott:** 10 minuten gratis reserveren. Pauzeren tot 30 minuten, aan hetzelfde minuuttarief; in een groepsrit kan het niet.',
            '**Bolt:** in de app reserveer je een step vooraf, zodat hij er nog staat als je aankomt.',
            '**Hoppy:** in de app reserveer je een step voor 30 minuten.',
          ],
        },
      ],
    },
    {
      heading: 'Je rit beëindigen: dropzone, foto en wat fout parkeren kost',
      blocks: [
        'De app toont zones. In een **no-go zone**, meestal rood, remt de step af tot hij stilstaat: duw hem eruit. In een **trage zone**, meestal geel, rijdt hij trager. In een **parkeerverbod** kan je je rit niet beëindigen.',
        'In België eindig je vaak in een **dropzone**: in het hele Brussels Gewest sinds 1 februari 2024, binnen de Antwerpse Leien sinds 1 juli 2025, met 129 dropzones. In Kortrijk heeft Hoppy ongeveer 200 parkeerzones. Hoe het in de hoofdstad werkt tot eind 2026, lees je in [een deelstep huren in Brussel](guide:brussels).',
        { note: 'Zolang de app je rit niet beëindigt, betaal je. Sta je in een parkeerverbod of buiten het werkgebied, dan lopen de minuten door tot je de step naar een toegelaten plek brengt.' },
        'Zet de step rechtop op zijn standaard, zonder een voetpad, ingang of oprit te blokkeren, en neem de foto.',
        {
          table: {
            caption: 'Wat aanbieders in België aanrekenen voor fout parkeren (voorwaarden, november 2026)',
            head: ['Aanbieder', 'Fout geparkeerd', 'Andere kosten'],
            rows: [
              ['Bolt (vanaf 1 december 2026)', '€ 20 automatisch buiten een toegelaten parkeerplaats', 'Tot € 100 om de step op te halen; boetes doorgerekend, plus tot € 30 kosten'],
              ['Dott (voorwaarden van 23 september 2025)', 'Tot € 300 om de step op te halen', '€ 50 per inbreuk op de voorwaarden; boetes doorgerekend, plus € 50 kosten'],
              ['Hoppy (voorwaarden van 27 juli 2026)', '€ 100 als je de step buiten het toegelaten gebied achterlaat; tot € 100 als Hoppy er niet bij kan', 'Tot € 50 als je in een verboden gebied rijdt; tot € 100 om hem van een privéterrein op te halen; € 150 als je hem zonder melding achterlaat'],
            ],
          },
        },
        'Bovenop die kosten kan de politie of de gemeente je nog een boete geven.',
      ],
    },
    {
      heading: 'Ongeval of kapotte deelstep: wat doe je?',
      blocks: [
        {
          steps: [
            'Zorg dat iedereen veilig is, en bel **112** als er iemand gewond is.',
            'Wissel gegevens uit, en fotografeer de plek, het nummer van de step en de schade.',
            'Meld het in de app, met de datum, de plek, het nummer van je rit en eventueel het nummer van het proces-verbaal.',
            'Verwittig de politie als er iemand gewond is of als er iets beschadigd of gestolen is. Bolt en Hoppy vragen dat binnen 24 uur.',
          ],
        },
        'Bij Dott zit de verzekering zonder extra kosten in de prijs: in België dekt ze je aansprakelijkheid tegenover anderen, en een ongevallenverzekering dekt blijvende invaliditeit of overlijden. Voor hoofdletsel dat een helm had kunnen voorkomen, is Dott volgens zijn voorwaarden niet aansprakelijk.',
        'Schade die je zelf aan de step toebrengt, betaal je: bij Hoppy tot € 1290 voor een vernielde step. Is de step kapot voor je vertrekt, meld het in de app en neem een andere.',
      ],
    },
    {
      heading: 'Een elektrische step huren in het buitenland',
      blocks: [
        'Je account reist mee, je passen en je tegoed meestal niet:',
        {
          list: [
            '**Passen blijven in één land.** Een Dott-pas werkt in elke Dott-stad van het land waar je hem kocht; daarbuiten koop je een nieuwe.',
            '**Tegoed blijft in één munt.** Rij je in een land met een andere munt, zoals Zweden, dan open je bij Dott een nieuwe wallet in die munt.',
            '**Ben je 16 of 17?** Ryde laat je in Noorwegen vanaf 16 rijden, en Bolt volgens zijn Noorse voorwaarden van 1 december 2026 ook.',
            '**De regels veranderen aan de grens.** In het VK heb je een rijbewijs nodig. In Italië breng je verplicht je eigen helm mee en is de parkeerfoto wettelijk verplicht. In Oslo kan je tussen 23 en 5 uur niet huren, en in Parijs zijn er sinds 1 september 2023 geen deelsteps meer.',
            '**Betalen:** Dott biedt afhankelijk van het land ook TWINT, Blik, Swish of iDEAL aan.',
          ],
        },
        'Maak je account aan en voeg een betaalmiddel toe voor je vertrekt, niet op het voetpad naast de step.',
      ],
    },
    {
      heading: 'De dichtstbijzijnde deelstep vinden, van welke aanbieder ook',
      blocks: [
        'Elke app toont alleen zijn eigen steps. [ScootRadar](/map) zet de steps van veel aanbieders op één kaart, met de tijd te voet; een knop opent de app van de aanbieder, waar je ontgrendelt en betaalt.',
        'Deelsteps rijden onder meer in [Brussel](map:be:Bruxelles), [Antwerpen](map:be:Antwerpen), [Charleroi](map:be:Charleroi) en [Kortrijk](map:be:Kortrijk).',
      ],
    },
  ],
  faq: [
    {
      question: 'Hoe oud moet je zijn om een deelstep te huren?',
      answer: 'Bij Bolt en Dott 18 jaar, ook al laat de wet je vanaf 16 steppen. Hoppy laat je in Kortrijk vanaf 16 rijden, en rekent € 50 aan als iemand die te jong is met je account rijdt.',
    },
    {
      question: 'Mag je met twee op een deelstep?',
      answer: 'Nee: een step is voor één persoon, en met twee rijden is in België verboden. Wil je samen rijden, start dan een groepsrit: bij Dott ontgrendel je met één account meestal tot drie steps, en ook Bolt kan groepsritten aanbieden. Jij betaalt voor elke step, en bij Bolt en Dott moet elke rijder 18 jaar zijn.',
    },
    {
      question: 'Kan je een deelstep huren zonder kredietkaart?',
      answer: 'Meestal wel. Bolt, Dott en Hoppy nemen ook debetkaarten, en Dott aanvaardt PayPal, Apple Pay, Revolut Pay en, afhankelijk van het land, Bancontact. Welke betaalmiddelen werken, zie je in de app wanneer je er een toevoegt.',
    },
    {
      question: 'Is een helm verplicht op een deelstep?',
      answer: 'Sinds 1 september 2026 is een helm verplicht op steps die sneller kunnen dan 20 km/u. Deelsteps zijn in Brussel en Antwerpen op 20 km/u begrensd, dus daar is hij niet verplicht. Draag er toch een: Dott is volgens zijn voorwaarden niet aansprakelijk voor hoofdletsel dat een helm had kunnen voorkomen, en Hoppy eist in zijn voorwaarden altijd een helm met CE-markering.',
    },
    {
      question: 'Wat als je gsm leeg is tijdens de rit?',
      answer: 'Zonder app kan je je rit niet beëindigen, dus de minuten kunnen doorlopen. Dott beëindigt je rit vanzelf als de step meer dan 10 minuten stilstaat zonder pauze, maar sta je dan op een plek waar je niet mag parkeren, dan volgt een boete. Parkeer correct, en beëindig de rit of contacteer de klantendienst zodra je gsm weer aan staat.',
    },
  ],
  sources: [
    { title: 'Bolt: Voorwaarden voor e-voertuigen in België (vanaf 1 december 2026)', url: 'https://bolt.eu/nl-be/legal/micromobility/new-terms-for-e-vehicles/' },
    { title: 'Bolt: e-steps huren in België', url: 'https://bolt.eu/nl-be/scooters/' },
    { title: 'Bolt: tarieven in Brussel (GBFS)', url: 'https://mds.bolt.eu/gbfs/3/336/system_pricing_plans' },
    { title: 'Dott: Algemene voorwaarden België (23 september 2025)', url: 'https://ridedott.com/nl/algemene-voorwaarden/belgie/' },
    { title: 'Dott: verzekering in België', url: 'https://ridedott.com/nl/verzekering/belgie/' },
    { title: 'Dott: tarieven in Brussel (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/brussels/system_pricing_plans.json' },
    { title: 'Dott: gratis reserveren (Engels)', url: 'https://ridedott.com/reservations/' },
    { title: 'Dott Help: betaalmethoden (Engels)', url: 'https://help.ridedott.com/en/articles/209' },
    { title: 'Dott Help: id-verificatie (Engels)', url: 'https://help.ridedott.com/en/articles/187' },
    { title: 'Dott Help: tijdelijk geblokkeerd bedrag (Engels)', url: 'https://help.ridedott.com/en/articles/197' },
    { title: 'Dott Help: een rit pauzeren (Engels)', url: 'https://help.ridedott.com/en/articles/181' },
    { title: 'Dott Help: groepsritten (Engels)', url: 'https://help.ridedott.com/en/articles/282' },
    { title: 'Dott Help: passen (Engels)', url: 'https://help.ridedott.com/en/articles/216' },
    { title: 'Dott Help: de Dott-wallet (Engels)', url: 'https://help.ridedott.com/en/articles/213' },
    { title: 'Voi: tarieven in Antwerpen (NeTEx)', url: 'https://api.voiapp.io/gbfs/open/v1/335/netex.xml' },
    { title: 'Hoppy: Algemene voorwaarden (27 juli 2026)', url: 'https://behoppy.eu/nl/algemene-voorwaarden/' },
    { title: 'Hoppy: reserveer je Hoppy', url: 'https://behoppy.eu/nl/gebruikers/reserveer-je-hoppy/' },
    { title: 'Hoppy: Kortrijk', url: 'https://behoppy.eu/nl/partners/steden/kortrijk/' },
    { title: 'Hoppy: tarieven in Kortrijk (GBFS)', url: 'https://hoppy.rideatom.com/gbfs/1542/v3.0/gbfs' },
    { title: 'Slim naar Antwerpen: Deelsteps', url: 'https://www.slimnaarantwerpen.be/nl/deelmobiliteit/deelsteps' },
    { title: 'The Brussels Times: id-controle voor deelsteps in Brussel (4 december 2025, Engels)', url: 'https://www.brusselstimes.com/brussels/1865985/mandatory-id-checks-for-e-scooter-users-in-brussels-from-now-on' },
    { title: 'Ryde: voorwaarden voor Noorwegen (Engels en Noors)', url: 'https://www.ryde-technology.com/terms-conditions-norway' },
    { title: 'Bolt: voorwaarden voor Noorwegen (vanaf 1 december 2026, Engels)', url: 'https://bolt.eu/en-no/legal/micromobility/tnc-e-vehicles/' },
  ],
};

export default guide;
