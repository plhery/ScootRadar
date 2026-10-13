import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooter-rules-switzerland',
  topic: 'swiss-rules',
  name: 'E-scooter rules in Switzerland',
  title: 'E-scooter rules in Switzerland 2026: age, helmet, fines',
  description: 'E-scooter rules in Switzerland as of October 2026: age and licence, where to ride and park, helmet, the 0.5‰ limit, fines in CHF, SBB trains and rentals.',
  headline: 'E-scooter rules in Switzerland: who may ride, where, and what gets you fined',
  lede: 'Under the e-scooter rules in Switzerland, an e-scooter is a light moped ridden by the rules for cyclists: its motor may assist up to 20 km/h, and it needs no plate or compulsory insurance. You may ride from 16 without a licence, or from 14 with a category M licence, on bike lanes or the road, never the pavement; rental operators require 18. As of October 2026 a helmet is optional, lights stay on day and night, passengers are banned and the alcohol limit is 0.5‰.',
  published: '2026-10-12',
  updated: '2026-10-13',
  sections: [
    {
      heading: 'Are e-scooters legal in Switzerland? The rules at a glance',
      blocks: [
        'Yes. In Swiss law a stand-up e-scooter, the E-Trottinett, is a **light moped** (Leicht-Motorfahrrad): a motor vehicle whose rider follows the rules for cyclists. What that means for you:',
        {
          table: {
            caption: 'E-scooter rules in Switzerland at a glance, as of October 2026',
            head: ['Topic', 'The rule'],
            rows: [
              ['Minimum age', '16 without a licence, 14 with a category M or G licence; 18 to rent'],
              ['Helmet', 'Not required, but strongly recommended'],
              ['Lights', 'On day and night, front and rear, plus a bell and a rear reflector'],
              ['Where to ride', 'The bike lane or bike path where there is one, otherwise the road'],
              ['Pavement', 'No riding unless a sign allows bicycles (CHF 40)'],
              ['Parking', 'On the pavement only if 1.50 m stays free (CHF 20)'],
              ['Alcohol', 'Under 0.5‰ for everyone, new drivers on probation included; from 0.5‰, criminal proceedings'],
              ['Passengers', 'Never'],
              ['Speed and power', 'The motor assists up to 20 km/h, with at most 0.5 kW'],
              ['Common fines', 'CHF 40 for the pavement or a phone, CHF 60 for a red light, CHF 20 for no lights by day'],
            ],
          },
        },
        'To count as a light moped, the scooter also needs a motor protected against tampering, a handlebar, no seat, no place for a passenger and two independent brakes. It needs **no registration, number plate, vignette or compulsory insurance**, but you are liable for any damage you cause: check that your private liability insurance covers e-scooters.',
        'There is no type approval for light mopeds, so not every scooter in the shops is road-legal. A **tuned** scooter is no longer a light moped, and riding it is a criminal matter, not a fine; in April 2026 Fribourg police seized one that could reach 127 km/h.',
      ],
    },
    {
      heading: 'E-scooter age limit and licence',
      blocks: [
        {
          table: {
            caption: 'Who may ride an e-scooter in Switzerland, as of October 2026',
            head: ['Age', 'Your own e-scooter', 'A shared e-scooter'],
            rows: [
              ['Under 14', 'No', 'No'],
              ['14 and 15', 'Only with a category M (moped) or G (tractor) licence', 'No, operators require 18'],
              ['16 and 17', 'Yes, no licence needed', 'No, operators require 18'],
              ['18 and over', 'Yes, no licence needed', 'Yes'],
            ],
          },
        },
        'Car, motorcycle, lorry and bus licences all include category M.',
        'Riding under age, or without the licence you need, is a criminal offence rather than a fixed fine, handled under juvenile criminal law for minors. Children under 15 are never fined on the spot; the police report them. Letting someone without the licence ride your scooter is an offence too, which is worth knowing for parents.',
      ],
    },
    {
      heading: 'Do you need a helmet? Lights, bell and reflector',
      blocks: [
        '**A helmet is not compulsory.** The helmet rule for mopeds exempts electric ones whose motor assists up to 25 km/h, so its CHF 30 fine doesn’t apply to you. The BFU, the Swiss council for accident prevention, strongly recommends a helmet all the same, and Dott warns that head injuries may not be covered if you ride without one.',
        'On 30 April 2026 the National Council rejected a motion for a helmet and licence requirement on e-mopeds (“E-Roller”) and similar vehicles, by 122 votes to 33 with 33 abstentions. On 19 August the Federal Council said it is ready to put a helmet requirement for e-scooters to consultation at the next revision of the ordinance; as of 12 October 2026 there is no draft and no date.',
        'What the law does require:',
        {
          list: [
            '**Lights, day and night:** white in front, red behind, steady rather than flashing. Since 1 April 2022 they must be on in daylight too. Riding without them costs CHF 20 by day and CHF 40 to 60 at night.',
            '**A fixed rear reflector** (CHF 40 without) and **a bell** (CHF 20 without).',
          ],
        },
      ],
    },
    {
      heading: 'Where can you ride an e-scooter, and where can you park it?',
      blocks: [
        'You ride where a cyclist rides: on the bike lane or bike path where there is one (CHF 30 if you don’t), otherwise on the road.',
        {
          list: [
            '**Pavement:** never, unless a sign allows bicycles, and then pedestrians go first. Riding on it costs CHF 40.',
            '**Footpaths and pedestrian zones:** only where a plate allows bicycles, at walking pace in pedestrian zones. Otherwise push (CHF 30).',
            '**Shared-space zones (Begegnungszonen):** allowed, at up to 20 km/h, with pedestrians first.',
            '**Bus lanes:** only where signed (CHF 30). **Motorways and expressways:** never.',
            '**Stations:** SBB bans riding anywhere in the station, platforms, ramps and underpasses included: push your scooter.',
          ],
        },
        'Since 1 July 2025 an “except bicycles” plate under a one-way or no-entry sign lets e-scooters through too, and the “no mopeds” sign no longer applies to them; the sign banning bicycles and mopeds still does. You may turn right on red only where a small yellow plate with a bicycle and an arrow says so.',
        '**Parking:** on the pavement only if at least **1.50 m** stays free for pedestrians, and never across entrances, pedestrian crossings or tactile guide lines (CHF 20). Since 1 July 2025 you may also park in shared-space and pedestrian zones under the general rules.',
      ],
    },
    {
      heading: 'Passengers, phones and the alcohol limit',
      blocks: [
        '**One person per scooter, always.** Since 1 July 2025 the law says so in plain words, whatever the manufacturer allows: no friend on the deck, no child in front.',
        '**No phone in your hand:** CHF 40 without a hands-free system. Letting go of the handlebar costs CHF 20, and a forgotten hand signal CHF 20, or CHF 30 when turning left.',
        {
          note: 'An e-scooter is a motor vehicle in law. Riding it with 0.5‰ or more is drink-driving: a case for the prosecutor, not an on-the-spot fine.',
        },
        'The limit is **0.5‰** (0.25 mg/l in a breath test), as in a car. Switzerland has **no under-21 zero-alcohol rule**, and the 0.1‰ limit for new drivers on probation doesn’t apply on an e-scooter either, because category M vehicles are exempt from it.',
        {
          list: [
            '**0.5 to 0.79‰:** a fine in criminal proceedings, with no fixed amount, and possibly a formal warning.',
            '**0.8‰ or more:** up to three years in custody or a monetary penalty, plus at least a month’s ban from licence-free motor vehicles, e-scooters included.',
            '**Drugs:** zero tolerance for THC, cocaine, amphetamines, MDMA and morphine, unless prescribed.',
          ],
        },
        'Your car licence may be at risk too: the withdrawal rules speak of anyone driving a motor vehicle drunk, and the cantonal authority decides case by case. The city of Zürich reported in 2025 that at least half of its e-scooter accidents are falls with nobody else involved, usually after drinking.',
      ],
    },
    {
      heading: 'E-scooter fines in Switzerland',
      blocks: [
        'Most offences end with a fixed on-the-spot fine (Ordnungsbusse) from the federal list, the same in every canton. The amounts for e-scooter riders have not changed since 2024.',
        {
          table: {
            caption: 'Common fines for e-scooter riders, as of October 2026',
            head: ['What you do', 'Fine', 'Item (OBV)'],
            rows: [
              ['Riding on the pavement', 'CHF 40', '605.1'],
              ['Using a phone without hands-free', 'CHF 40', '624'],
              ['Not giving way at a zebra crossing', 'CHF 40', '623'],
              ['Running a red light', 'CHF 60', '615.1'],
              ['No lights: by day / at night', 'CHF 20 / CHF 40 to 60', '604.4 / 604.1–2'],
              ['Not using the bike lane or bike path', 'CHF 30', '621.1–2'],
              ['Riding into a pedestrian zone or past a no-entry sign', 'CHF 30', '611.18 / 611.2'],
              ['No hand signal when turning left', 'CHF 30', '617.2'],
              ['Going over the speed limit', 'CHF 30', '625'],
              ['Parking with less than 1.50 m of pavement free', 'CHF 20', '622.1'],
              ['No bell / no rear reflector', 'CHF 20 / CHF 40', '703.1 / 703.2'],
            ],
          },
        },
        'Fines add up. Pay on the spot or within 30 days, at no extra cost; if you don’t live in Switzerland, you pay at once or leave a deposit. You may refuse a fixed fine and go to ordinary proceedings instead.',
        'Riding drunk, riding without the licence you need, riding a tuned scooter and endangering or hurting someone have no fixed fine: they go to criminal proceedings, as do fines adding up to more than CHF 600.',
      ],
    },
    {
      heading: 'Can you take an e-scooter on the train?',
      blocks: [
        'Your own e-scooter travels **free on SBB trains if its largest wheel is under 12 inches (30.5 cm)**; fold it when space is tight. From 12 inches it counts as a bicycle and needs a bike ticket and, where required, a bike reservation. Staff may refuse it on a full train.',
        'A shared e-scooter stays behind. Rides must end inside the operator’s zone, Voi caps a rental at one hour, and a scooter not returned within 48 hours costs up to CHF 500 at Bolt or CHF 1,540 at Lime. End the ride at the station, in its sharing zone if it has one, and rent again when you arrive.',
      ],
    },
    {
      heading: 'Renting a shared e-scooter, and riding as a visitor',
      blocks: [
        'Lime, Bolt, Voi, Dott, Bird and PubliBike agree on the basics in their Swiss terms:',
        {
          list: [
            '**18 or older**, though the law lets 16-year-olds ride their own.',
            '**One rider.** The insurance that comes with the ride never covers a passenger.',
            '**Zones in the app** show where you may end a ride and where you may not ride. In Zürich’s no-ride zones, such as the old town, the scooter slows to walking pace and the ride can’t end there.',
          ],
        },
        'That insurance is thinner than it looks. At Lime, Bolt and Voi the liability cover is **secondary**: it pays only after your own private liability insurance. Dott’s last published cover paid only above your other insurance; PubliBike includes none. On top of police fines, Voi may charge CHF 25 for bad parking after warnings, and Bolt up to CHF 100 to fetch a scooter left outside its area.',
        'To see who has scooters near you, open the map in [Zürich](map:ch:zurich) or [Basel](map:ch:basel): ScootRadar shows the providers that publish their positions, with battery and walking time, and opens the operator’s app to unlock and pay. For prices, see [e-scooter prices in Switzerland](guide:swiss-prices); for zones and providers city by city, our guides to [Zürich](guide:zurich), [Bern](guide:bern) and [Basel](guide:basel).',
        '**Visiting?** From 16 you may ride without a licence, whatever your nationality, and the operators’ Swiss terms ask for no Swiss residence. Expect 20 km/h, no plate or sticker, no helmet requirement and one alcohol limit for all ages. At 14 or 15, don’t count on riding: we could not confirm that a foreign moped licence replaces category M. From the UK? Compare [the rules at home](guide:uk-law).',
      ],
    },
    {
      heading: 'New e-scooter rules in Switzerland: July 2025 and 2026',
      blocks: [
        'The last big change came on **1 July 2025**: the passenger ban, the new sign rules and parking in shared-space and pedestrian zones described above. The definition now says 20 km/h without a seat and 25 km/h with one, so stand-up scooters stayed at 20 km/h.',
        '**What changes in 2026?** As of 12 October 2026, no new federal e-scooter rule has come into force this year; most “new rules for 2026” headlines are about Germany, Austria, Italy or France. Under discussion in Switzerland:',
        {
          list: [
            '**Helmet:** a consultation is promised, with no draft or date yet (see above).',
            '**Plate and insurance:** a motion of 15 June 2026 asks for both. The Federal Council proposed rejecting it on 19 August; parliament has not voted yet.',
            '**Tuning:** the Federal Council intends to make the rules on tuned scooters more specific; no draft yet.',
            '**Trains:** the transport staff union SEV wants a ticket for scooters; SBB’s rule is unchanged.',
            '**Zürich:** the city plans to cut shared vehicles from 7,350 to 3,000, with three operators chosen by tender and fixed stations in the centre, from a date not yet set. See [e-scooters in Zürich](guide:zurich).',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Do I need a licence to ride an e-scooter in Switzerland?',
      answer: 'Not from 16: an e-scooter is a licence-free light moped. At 14 and 15 you need a category M moped licence, which every car or motorcycle licence includes. Rental operators require 18 whatever the law allows.',
    },
    {
      question: 'What is the e-scooter speed limit in Switzerland?',
      answer: 'The motor may assist up to 20 km/h, with at most 0.5 kW. Going faster downhill is not an offence in itself, but speed limits apply and speeding costs CHF 30. A scooter tuned to go faster is no longer a light moped: without approval, a plate, insurance and a licence, it may not be ridden on public roads.',
    },
    {
      question: 'Do e-scooters need insurance or a number plate in Switzerland?',
      answer: 'No: no plate, no vignette and no compulsory insurance. You are personally liable for damage you cause, so check your private liability insurance. A motion to require both is pending, and the Federal Council has proposed rejecting it.',
    },
    {
      question: 'Can two people ride one e-scooter?',
      answer: 'No. Since 1 July 2025 the law bans passengers on any bicycle or moped without a seat, e-scooters included, even one with a second handlebar. Rental operators forbid it too, and their insurance excludes passengers.',
    },
    {
      question: 'Can tourists ride e-scooters in Switzerland?',
      answer: 'Yes. From 16 no licence is needed, whatever your nationality, and rental operators require 18 but no Swiss residence. If you are fined and don’t live in Switzerland, you pay on the spot or leave a deposit.',
    },
  ],
  sources: [
    { title: 'Fedlex: Traffic Regulations Ordinance (VRV), SR 741.11, in German', url: 'https://www.fedlex.admin.ch/eli/cc/1962/1364_1409_1420/de' },
    { title: 'Fedlex: Technical Requirements for Road Vehicles (VTS), SR 741.41, in German', url: 'https://www.fedlex.admin.ch/eli/cc/1995/4425_4425_4425/de' },
    { title: 'Fedlex: Road Traffic Licensing Ordinance (VZV), SR 741.51, in German', url: 'https://www.fedlex.admin.ch/eli/cc/1976/2423_2423_2423/de' },
    { title: 'Fedlex: Fixed Penalties Ordinance (OBV) and its list of fines, SR 314.11, in German', url: 'https://www.fedlex.admin.ch/eli/cc/2019/93/de' },
    { title: 'Fedlex: Ordinance on Alcohol Limits in Road Traffic, SR 741.13, in German', url: 'https://www.fedlex.admin.ch/eli/cc/2015/493/de' },
    { title: 'ASTRA (Federal Roads Office): Cycle traffic signs from 1 July 2025 (PDF, in German)', url: 'https://www.astra.admin.ch/dam/de/sd-web/3LsKt7R6x8DU/bedeutung-radverkehr-signalisation.pdf' },
    { title: 'BFU: Rules for e-scooters and other electric light vehicles (fact sheet, PDF)', url: 'https://www.bfu.ch/media/fffpzk2f/bfu_factsheet_e-langsamverkehr_regeln.pdf' },
    { title: 'Swiss Parliament: Motion 26.3637, registration and liability insurance for e-scooters', url: 'https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=20263637' },
    { title: 'Swiss Parliament: Motion 26.3010, helmet and licence for e-mopeds and similar vehicles', url: 'https://www.parlament.ch/de/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=20263010' },
    { title: 'SBB: Bikes and scooters as hand luggage (in German)', url: 'https://www.sbb.ch/de/reiseinformationen/individuelle-beduerfnisse/reisen-mit-velos/velo-als-handgepaeck.html' },
  ],
};

export default guide;
