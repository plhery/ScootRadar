import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'nl',
  slug: 'deelstep-huren',
  topic: 'how-to-rent',
  name: 'Een deelstep huren: zo werkt het',
  title: 'Deelstep huren: zo huur je een elektrische step in België',
  description: 'Deelstep huren in België, stap voor stap: de app, leeftijd en id-scan, wat een rit kost, reserveren, parkeren met foto, ongevallen en huren in het buitenland.',
  headline: 'Deelstep huren in België: van de app tot het einde van je rit',
  lede: 'Een deelstep huren gaat zo: je installeert de app van de aanbieder, maakt een account aan met je gsm-nummer en een betaalkaart, scant de QR-code op het stuur en rijdt weg. Op het einde zet je de step op een toegelaten plek, in Brussel en binnen de Antwerpse Leien in een dropzone, en neem je een foto. Bolt, Dott en Lime vragen 18 jaar, Voi in Antwerpen en Hoppy in Kortrijk 16, en in Brussel scan je één keer je identiteitsbewijs. Je betaalt om te ontgrendelen en per minuut: Voi publiceerde in Antwerpen op 12 oktober 2026 € 0,99 plus € 0,25 per minuut, dus € 3,49 voor tien minuten.',
  published: '2026-10-12',
  updated: '2026-10-25',
  sections: [
    {
      heading: 'Deelstep huren: hoe werkt het, stap voor stap?',
      blocks: [
        'Elke aanbieder heeft een eigen app, en je hebt een account nodig bij de aanbieder van je step. In Brussel kan je nog huren tot en met 31 december 2026: de Brusselse regering heeft beslist dat de deelsteps er vanaf 1 januari 2027 verdwijnen. Bij Bolt, Dott, Voi, Lime en Hoppy gaat het zo:',
        {
          steps: [
            '**Installeer de app en maak een account** met je gsm-nummer of je e-mailadres. Bij Lime en Voi kan het ook met Apple of Google.',
            '**Bewijs je leeftijd als de app erom vraagt.** In Brussel scan je bij Bolt en Dott je identiteitsbewijs voor je eerste rit.',
            '**Voeg een betaalmiddel toe** (zie de tabel hieronder).',
            '**Bekijk de prijs:** tik op de step op de kaart of scan hem. Neem ook de korte uitleg in de app door.',
            '**Scan de QR-code** op het stuur. Lukt dat niet, typ dan het nummer dat eronder staat.',
            '**Controleer remmen, banden, licht en batterij.** Werkt de step niet nadat je hem ontgrendeld hebt, meld het dan: Voi en Dott rekenen daar niets voor aan.',
            '**Rij alleen**, op het fietspad of de rijbaan, en binnen de bebouwde kom nooit op het voetpad. Nieuwe rijders starten trager: Bolt houdt je de eerste vijf ritten op 15 km/u, en ook Voi kan je rond 15 km/u laten starten.',
            '**Parkeer waar de app het toelaat, beëindig je rit en neem de foto.** Je betaalt tot de app bevestigt dat je rit voorbij is.',
            '**Kijk je ontvangstbewijs na:** het geblokkeerde bedrag komt vrij.',
          ],
        },
        'Bolt kan je op piekmomenten eerst een korte reactietest laten doen. Volgens Bolts algemene hulppagina krijg je vijf pogingen; lukt het niet, dan kan je drie uur geen step huren.',
      ],
    },
    {
      heading: 'Wat heb je nodig? Leeftijd, identiteitsbewijs en betaalmiddel',
      blocks: [
        'Een smartphone met mobiele data, een account en een betaalmiddel. Een rijbewijs heb je in België niet nodig. De wet laat je vanaf 16 jaar steppen, maar elke aanbieder kiest zijn eigen grens:',
        {
          table: {
            caption: 'Wat de aanbieders in België vragen (oktober 2026)',
            head: ['Aanbieder', 'Minimumleeftijd', 'Identiteit', 'Betalen'],
            rows: [
              ['Bolt (Brussel, Antwerpen)', '18 jaar', 'Kan een foto van je rijbewijs of een officieel identiteitsbewijs vragen; in Brussel verplicht', 'Visa of Mastercard; American Express in de eurozone'],
              ['Dott (Brussel, Charleroi)', '18 jaar', 'In Brussel: identiteitskaart, rijbewijs, paspoort of verblijfsvergunning', 'Kaart, Bancontact, PayPal, Apple Pay, Revolut Pay'],
              ['Voi (Antwerpen)', '16 jaar', 'Niet vermeld', 'Kaart, Apple Pay, Google Pay, PayPal, Klarna'],
              ['Lime (Antwerpen)', '18 jaar', 'In sommige steden een id-scan', 'Kaart of prepaidkaart; op sommige plaatsen ook Apple Pay, Google Pay, PayPal of Klarna'],
              ['Hoppy (Kortrijk)', '16 jaar, 18 voor een abonnement', 'Niet vermeld', 'Kaart, of een Hoppy-portefeuille die automatisch oplaadt'],
            ],
          },
        },
        'Ook **Pony** verhuurt volgens zijn Belgische voorwaarden vanaf 16 jaar. Charleroi noemt Pony als aanbieder, maar of er nu Pony-steps rijden, konden we niet bevestigen.',
        'Bancontact vonden we alleen bij Dott; de app toont welke betaalmiddelen werken.',
        'Wat de wet zegt over leeftijd, helm, voetpad en alcohol, lees je in [de regels voor de elektrische step in België](guide:belgian-rules).',
      ],
    },
    {
      heading: 'Hoeveel kost een deelstep?',
      blocks: [
        'Je betaalt een ontgrendelprijs plus een prijs per minuut, ook als je stilstaat. Lime, Voi en Dott ronden af naar de volgende volle minuut, en de prijs verschilt per stad.',
        {
          table: {
            caption: 'Gepubliceerde tarieven op 12 oktober 2026, en wat een rit kost',
            head: ['Aanbieder en stad', 'Ontgrendelen', 'Per minuut', '10 minuten', '20 minuten'],
            rows: [
              ['Bolt, Brussel', '€ 0,99', '€ 0,31', '€ 4,09', '€ 7,19'],
              ['Dott, Brussel', '€ 1,00', '€ 0,37', '€ 4,70', '€ 8,40'],
              ['Voi, Antwerpen', '€ 0,99', '€ 0,25', '€ 3,49', '€ 5,99'],
              ['Hoppy, Kortrijk', '€ 0,95', '€ 0,18 tot € 0,25', '€ 2,75 tot € 3,45', '€ 4,55 tot € 5,95'],
            ],
          },
        },
        '**Een rekenvoorbeeld.** Je rijdt met een Voi in [Antwerpen](map:be:Antwerpen) 12 minuten en 20 seconden. Dat wordt 13 minuten: € 0,99 + 13 × € 0,25 = € 4,24. Zoek je daarna nog drie minuten naar een dropzone, dan betaal je € 4,99.',
        'Lime publiceert geen tarieven in open data, maar elke app toont de prijs voor je ontgrendelt.',
        '**Passen** lonen als je vaak rijdt. Minutenbundels (Voi, Dott, LimePass) en dag-, week- of maandpassen (Voi Pass, LimePrime, Bolt, Dott) maken het ontgrendelen goedkoper of gratis; de prijzen staan in de apps.',
        '**Geblokkeerd bedrag.** Bij de start van je rit houdt de app een klein bedrag vast op je kaart: € 3 bij Dott in België, € 4, € 5 of € 7,50 bij Voi. Bolt en Lime noemen geen bedrag. Het komt vrij na je rit, maar je bank kan er enkele dagen over doen.',
      ],
    },
    {
      heading: 'Kan je een deelstep reserveren of pauzeren?',
      blocks: [
        'Reserveren is soms gratis, pauzeren bijna nooit: de minuten blijven lopen.',
        {
          list: [
            '**Dott:** 10 minuten gratis reserveren. Pauzeren tot 30 minuten, aan hetzelfde minuuttarief.',
            '**Lime:** tot 10 minuten gratis reserveren (30 met LimePrime of een LimePass); pauzeren tot 15 minuten, en je betaalt door.',
            '**Voi:** pauzeren houdt de step tot twee uur voor jou vast. Je betaalt door, soms aan een lager tarief, en na twee uur stopt de rit vanzelf.',
            '**Bolt:** reserveren kan, voor de duur en de prijs die de app toont. Pauzeren alleen op een blauwe parkeerplek, ook per minuut betaald.',
            '**Hoppy:** reserveren kan tot 30 minuten op voorhand.',
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
        'Zet de step rechtop op zijn standaard, zonder een voetpad, ingang of oprit te blokkeren, en neem de foto. Die kan nagekeken worden: bij Dott herkent software omgevallen steps, versperde voetpaden en steps buiten een vak, en bij Voi kijkt een ‘Parking Assistant’ mee.',
        {
          table: {
            caption: 'Wat aanbieders in België aanrekenen voor fout parkeren (voorwaarden, oktober 2026)',
            head: ['Aanbieder', 'Fout geparkeerd', 'Andere kosten'],
            rows: [
              ['Bolt (vanaf 1 december 2026)', '€ 20 automatisch buiten een toegelaten zone', 'Tot € 100 om de step op te halen; boetes doorgerekend, plus tot € 30 kosten'],
              ['Dott (voorwaarden van 23 september 2025)', 'Tot € 300 om de step op te halen', '€ 50 per inbreuk op de voorwaarden; boetes doorgerekend, plus € 50 kosten'],
              ['Hoppy (voorwaarden van 27 juli 2026)', '€ 100 als je de step buiten het toegelaten gebied achterlaat; tot € 100 als Hoppy er niet bij kan', 'Tot € 100 om hem op te halen; € 150 als je hem zonder melding achterlaat'],
            ],
          },
        },
        'Voi rekent voor fout parkeren pas iets aan na meerdere waarschuwingen, maar laat je volgens zijn Belgische voorwaarden € 25 betalen als hij de step als achtergelaten beschouwt. Lime rekent in België tot € 50 aan als je de step in een verboden zone gebruikt, en € 100 om hem buiten het toegelaten gebied op te halen. Bovenop die kosten kan de politie of de gemeente je nog een boete geven.',
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
            'Verwittig de politie als er iemand gewond is of als er iets beschadigd of gestolen is. Hoppy vraagt dat binnen 24 uur.',
            'Erken ter plaatse geen aansprakelijkheid, zoals Dott uitdrukkelijk aanraadt.',
          ],
        },
        'De verzekering zit bij de grote aanbieders in de prijs. Dott dekt in België je aansprakelijkheid én je eigen letsels, maar niet als je met twee rijdt, en geen hoofdletsel als je geen helm droeg.',
        'Schade die je zelf aan de step toebrengt, betaal je: bij Hoppy tot € 1290 voor een vernielde step. Is de step kapot voor je vertrekt, meld het in de app en neem een andere.',
      ],
    },
    {
      heading: 'Een elektrische step huren in het buitenland',
      blocks: [
        'Je account reist mee, je passen en je tegoed meestal niet:',
        {
          list: [
            '**Passen blijven in één land.** LimePass, LimePrime en de passen van Voi en Dott werken alleen in het land waar je ze kocht, een pas van Bolt zelfs alleen in de stad.',
            '**Tegoed blijft in één munt.** In Zwitserland, het VK of Noorwegen open je bij Dott en Bird een nieuwe portefeuille, en Bolt Balance werkt alleen in de munt waarin je het kocht.',
            '**Ben je 16 of 17?** In het buitenland is de grens bijna overal 18 jaar. Uitzonderingen zijn onder meer Ryde in Noorwegen, Bolt en Voi in Oslo en Pony in Frankrijk (vanaf 16).',
            '**De regels veranderen aan de grens.** In het VK heb je een rijbewijs nodig. In Italië breng je verplicht je eigen helm mee en is de parkeerfoto wettelijk verplicht. In Oslo kan je tussen 23 en 5 uur niet huren, en in Parijs zijn er sinds 1 september 2023 geen deelsteps meer.',
            '**Betalen:** TWINT vonden we in Zwitserland alleen bij Dott, Vipps in Noorwegen alleen bij Ryde.',
          ],
        },
        'Maak je account aan en voeg een betaalmiddel toe voor je vertrekt, niet op het voetpad naast de step.',
      ],
    },
    {
      heading: 'De dichtstbijzijnde deelstep vinden, van welke aanbieder ook',
      blocks: [
        'Elke app toont alleen zijn eigen steps. Twee soorten apps tonen er meer:',
        {
          list: [
            '**Kaarten die je doorsturen.** [ScootRadar](/map) zet de steps van veel aanbieders op één kaart, met batterij en bereik als de aanbieder die deelt, de tijd te voet en een geschatte prijs volgens de gepubliceerde tarieven. Gratis, zonder account en zonder reclame, in je browser of als iPhone-app. Reserveren of ontgrendelen kan het niet: een knop opent de app van de aanbieder, en de posities kunnen een paar minuten oud zijn. Google Maps toont in de steden die het dekt ook de dichtstbijzijnde step met zijn prijs, en opent dan de app van de aanbieder.',
            '**Apps waarin je huurt.** In de Uber-app kan je in sommige steden een Lime huren; welke steden, vermeldt Lime niet.',
          ],
        },
        'Op 12 oktober 2026 stonden op de kaart Bolt en Dott in [Brussel](map:be:Bruxelles), Dott in [Charleroi](map:be:Charleroi), Voi in Antwerpen en Hoppy in [Kortrijk](map:be:Kortrijk); sinds 25 oktober ook Bolt in Antwerpen, Lime niet. [Open de kaart](/map) en kijk wie er een step bij jou in de buurt heeft.',
      ],
    },
  ],
  faq: [
    {
      question: 'Hoe oud moet je zijn om een deelstep te huren?',
      answer: 'Bij Bolt, Dott en Lime 18 jaar, ook al laat de wet je vanaf 16 steppen. Voi in Antwerpen, Hoppy in Kortrijk en Pony laten je vanaf 16 rijden. Hoppy rekent € 50 aan als iemand jonger met je account rijdt.',
    },
    {
      question: 'Mag je met twee op een deelstep?',
      answer: 'Nee: een step is voor één persoon, en met twee rijden is in België verboden. Wil je samen rijden, start dan een groepsrit: met één account ontgrendel je tot vijf steps bij Lime en Voi, en meestal drie bij Dott. Jij betaalt voor elke step, en elke rijder moet oud genoeg zijn: bij Bolt en Dott 18 jaar.',
    },
    {
      question: 'Kan je een deelstep huren zonder kredietkaart?',
      answer: 'Meestal wel. Lime, Dott en Hoppy nemen ook debetkaarten, Dott aanvaardt Bancontact, PayPal en Apple Pay, en Voi onder meer PayPal en Klarna. Welke betaalmiddelen werken, zie je in de app wanneer je er een toevoegt.',
    },
    {
      question: 'Is een helm verplicht op een deelstep?',
      answer: 'Sinds 1 september 2026 is een helm verplicht op steps die sneller kunnen dan 20 km/u. Deelsteps zijn in Brussel en Antwerpen op 20 km/u begrensd, dus daar is hij niet verplicht. Draag er toch een: Dott dekt hoofdletsel niet als je zonder helm rijdt.',
    },
    {
      question: 'Wat als je gsm leeg is tijdens de rit?',
      answer: 'Zonder app kan je je rit niet beëindigen, dus de minuten kunnen doorlopen. Voi beëindigt een rit vanzelf als de step 10 minuten stilstaat, Dott na 10 tot 30 minuten zonder gebruik. Parkeer correct, en beëindig de rit of contacteer de klantendienst zodra je gsm weer aan staat.',
    },
  ],
  sources: [
    { title: 'Bolt: Voorwaarden voor e-voertuigen in België (vanaf 1 december 2026)', url: 'https://bolt.eu/nl-be/legal/micromobility/new-terms-for-e-vehicles/' },
    { title: 'Dott: Algemene voorwaarden België (23 september 2025)', url: 'https://ridedott.com/nl/algemene-voorwaarden/belgie/' },
    { title: 'Dott Help: betaalmethoden (Engels)', url: 'https://help.ridedott.com/en/articles/209' },
    { title: 'Dott: gratis reserveren (Engels)', url: 'https://ridedott.com/reservations/' },
    { title: 'Voi: Antwerpen, prijzen en leeftijd (Engels)', url: 'https://www.voi.com/city/antwerp' },
    { title: 'Voi: Algemene voorwaarden voor het gebruik, België', url: 'https://www.voi.com/nl/juridisch/algemene-voorwaarden-voor-het-gebruik/belgie' },
    { title: 'Lime: Gebruikersovereenkomst België', url: 'https://www.li.me/nl-be/user-agreement' },
    { title: 'Voi Help: gereserveerde bedragen (Engels)', url: 'https://www.voi.com/help/accounts-and-payments/why-do-i-see-a-reserved-or-pending-payment-from-voi' },
    { title: 'Lime Help: ritkosten en tarieven (Engels)', url: 'https://help.li.me/hc/en-us/articles/115004914208' },
    { title: 'Hoppy: Algemene voorwaarden', url: 'https://behoppy.eu/nl/algemene-voorwaarden/' },
    { title: 'Slim naar Antwerpen: Deelsteps', url: 'https://www.slimnaarantwerpen.be/nl/deelmobiliteit/deelsteps' },
    { title: 'The Brussels Times: id-controle voor deelsteps in Brussel (4 december 2025, Engels)', url: 'https://www.brusselstimes.com/brussels/1865985/mandatory-id-checks-for-e-scooter-users-in-brussels-from-now-on' },
    { title: 'Ryde: voorwaarden voor Noorwegen (Engels en Noors)', url: 'https://www.ryde-technology.com/terms-conditions-norway' },
  ],
};

export default guide;
