# Coverage gaps

What the map doesn't cover yet, why, and when to check again. Each covered
country's guide has the evidence and the details; this page lists every gap in
one place. Started 12 October 2026. Add to it when an audit leaves something
out, and remove an entry once it's added or settled for good.

## Found, not added yet

These feeds are public and were live when checked. Nothing blocks them except
the work.

| Where | Provider | Scooters | Checked | Notes |
| --- | --- | ---: | --- | --- |
| Basel, Switzerland | Hopp | ~217 | 11 Oct 2026 | sharedmobility.ch has no Hopp. The app reads Hopp for Zürich only (`HOPP_COVERAGE` in `src/lib/feedCoverage.ts`), so this needs a small change |
| Kloten, Switzerland | Hopp | ~28 | 11 Oct 2026 | Same as above |
| La Roche-sur-Yon, France | Pony | ~82 | 11 Oct 2026 | Licence Ouverte, through transport.data.gouv.fr. A new city |
| Nantes, France | Pony, through the city's Naolib feed | ~57 | 11 Oct 2026 | Licence Ouverte. Station counts, not single scooters ([French guide](french-scooter-feeds.md#feeds-not-enabled)) |

Hopp stamps each response with the time it was asked for, so the fifteen-minute
age limit can't tell how old its positions are. Hopp Zürich has the same
problem.

## Waiting on a decision

| What | Blocked on |
| --- | --- |
| **Yoio** in Göttingen (~265), Freiburg (~222) and Erfurt (~189), Germany | A new provider. Freiburg comes through MobiData BW; Göttingen and Erfurt publish no licence, and Yoio's server blocks bursts of requests. Like Hopp, it stamps responses with the request time |
| **Pony** in other cities, with the key published for La Roche-sur-Yon | transport.data.gouv.fr published the key for that city only. Whether it may be used elsewhere is a licence question |
| **Lime** everywhere | Its [GBFS terms](https://www.li.me/legal/public-gbfs-terms) allow public display only where local law requires it. Needs a written answer from Lime |
| **Bird** everywhere | Its licence page now answers 404; the [archived copy](https://web.archive.org/web/20260516143232/https://www.bird.co/gbfs-data-license-agreement/) allows display. Worth confirming with Bird |
| **Dott** everywhere | Its [API licence](https://ridedott.com/api-licence/) restricts distribution. Since September 2026 most regions need a partner key, which Dott grants through its partner integrations team |
| **Voi** in the United Kingdom | Access is asked from nap@voiapp.io, under a [licence](https://www.voi.com/voi-licencing-agreement) that forbids storing the data, which the scooter cache does |

## No public data, in covered countries

Operators that run there but publish nothing the map can read, cities that
banned shared scooters, and feeds that were empty when checked.

- **Switzerland:** everything comes from sharedmobility.ch, apart from Hopp in
  Zürich. See [Found, not added yet](#found-not-added-yet) for Hopp's other
  towns.
- **France** ([guide](french-scooter-feeds.md#feeds-not-enabled)):
  - Central Paris has no shared scooters (banned in 2023).
  - Dott GPSEO answers 404; Dott OL Vallée was empty.
  - Lime Nice and Sophia Antipolis, Pony Nice, Limoges and Pays Basque, and Voi
    V'Lônes held no scooters.
  - Thirteen old Bird towns are empty (Bordeaux, Marseille and others).
  - Lime Le Havre needs partner credentials.
- **Germany** ([guide](german-italian-scooter-feeds.md#known-gaps)):
  - Dott closed most of its public regions in September 2026, among them
    Hamburg, Bremen, Nürnberg, Dortmund, Karlsruhe and Mannheim.
  - Bird München and Ulm stopped updating.
  - Lime Hamburg answers 404; Lime Dresden, Oberhausen and Solingen (6
    scooters) were too small or empty.
  - Seventeen Zeus towns were empty.
  - Voi publishes six Baden-Württemberg cities only, through MobiData BW.
- **Italy** ([guide](german-italian-scooter-feeds.md#known-gaps)): Bird in
  Roma, Palermo and Napoli is covered.
  - Dott (Roma, Milano, Palermo and others) and Lime (Roma, Milano, Palermo)
    publish no public feed: Dott's 21 Italian regions answer 404, Catania and
    Alghero 403, and its API now needs authentication. Lime answers 404
    everywhere. BIT Mobility (Napoli, Bari and others) is behind a login, and
    RideMovi answers 401.
  - Bird Milano, Firenze, Torino, Moncalieri, Collegno, Rivoli, Nichelino and
    Sesto Fiorentino are empty, with a timestamp of 0. Milano revoked Bird's
    permit in July 2026, over scooters without plates.
  - Firenze banned shared scooters from 1 April 2026, and BIT's service in
    Prato ended on 31 December 2025.
  - Zeus's Italian feeds are stale or empty (Anzio, Augusta, Mazara, Teramo,
    Modena, Reggio Emilia). Hopp Como held no scooters at night on 13 October
    2026; check it by day, and add it if it has some.
  - Helbiz and Link no longer resolve. Cooltra lists mopeds and e-bikes only.
- **Belgium** ([guide](belgian-norwegian-british-scooter-feeds.md#known-gaps)):
  - Brussels bans shared scooters from 1 January 2027, so Bolt's and Dott's
    feeds there should empty.
  - Pony Liège held 2 scooters; Pony publishes nothing for Brussels.
  - Lime Brussels and Kortrijk, Dott Ghent and Mons and Bolt Ghent list
    e-bikes only.
  - Lime Antwerp answers 404, Dott Liège 403 and Dott Kortrijk 404. Bird
    Antwerp is empty.
- **Norway** ([guide](belgian-norwegian-british-scooter-feeds.md#known-gaps)):
  - Bergen (~9,000 scooters: Ryde, Lime, RideMovi), Drammen, Larvik and Bodø
    have no public source.
  - Ryde's fleets in Bærum, Lillestrøm, Lørenskog and Kristiansand are missing
    from Entur.
  - Lime Oslo is empty, and seven Bolt systems in Entur are empty.
- **United Kingdom** ([guide](belgian-norwegian-british-scooter-feeds.md#known-gaps)):
  - Voi (London, Oxford, Cambridge, Essex, Northamptonshire and more) and Lime
    (London, West Midlands, Salford) publish no public feed. TfL publishes no
    scooter positions.
  - Zeus's UK feeds are stale; several Beryl and Dott schemes list bikes only.
- **Portugal** ([guide](portuguese-spanish-icelandic-scooter-feeds.md#known-gaps)):
  - Bolt (Lisboa, Porto, Faro, Coimbra) has no public feed, and Lime none for
    Porto or Faro.
  - Braga banned shared scooters in September 2026. Bird Braga and Faro are
    dead, and Bird Vila Nova de Gaia's 7 scooters never moved.
- **Spain** ([guide](portuguese-spanish-icelandic-scooter-feeds.md#known-gaps)):
  - Madrid, Barcelona, Valencia, Sevilla, Málaga, Zaragoza and the Basque
    Country have no shared scooters.
  - Dott (Santa Cruz de Tenerife, Ibiza, Lanzarote) and Bolt (Oviedo) have no
    public feed.
  - Hopp Benidorm, Cartagena, Dénia, Fuengirola and Marbella are empty.
- **Iceland** ([guide](portuguese-spanish-icelandic-scooter-feeds.md#known-gaps)):
  - Bolt has run in the capital area since 2024, with no public feed.
  - Nine small Hopp towns held fewer than ten scooters.

## Countries not covered yet

| Country | Status |
| --- | --- |
| Austria | Nothing public on 11 October 2026: Dott's Austrian regions are private, and Vienna's operators publish no feed |
| Poland | Dott in three small towns, about 540 scooters, on 11 October 2026; other operators not checked |
| Netherlands, Ireland, Denmark, Sweden, Finland | Dott listed nothing public on 11 October 2026; other operators not checked |
| Every other European country | Not checked yet |

## Dates to check again

- **After 26 October 2026:** applications to Rome's new operator selection
  close. Rome's scooter permits ran from 1 September 2023 to 31 August 2026 and
  are extended (D.D. QG 1649/2026) for the time the selection needs; the press
  gives 31 October 2026, the day the bike-sharing permits end. The selection
  picks up to three scooter operators, who then have 150 days to start
  ([Roma Servizi per la Mobilità](https://romamobilita.it/eventi-e-news/selezione-operatori-servizi-di-micromobilita-sharing/)).
  Check that Bird Roma still publishes after both dates, and whether the
  winners do.
- **1 December 2026:** the EU's rule on multimodal travel information
  (Delegated Regulation (EU) 2024/490) requires shared-scooter availability on
  each country's national access point for the cities on the main EU transport
  network, among them Vienna, Madrid and Warsaw. Austria, Spain, Poland and the
  Netherlands may publish feeds then.
- **1 January 2027:** Brussels's ban starts; Bolt and Dott Bruxelles should
  empty.
- Every Monday, the [catalog check workflow](../.github/workflows/catalog-check.yml)
  fails when an entry of a covered country is gone.
