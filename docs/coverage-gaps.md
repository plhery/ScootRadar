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
| La Roche-sur-Yon, France | Pony | ~82 | 11 Oct 2026 | Licence Ouverte, through transport.data.gouv.fr. A new city |
| Nantes, France | Pony, through the city's Naolib feed | ~57 | 11 Oct 2026 | Licence Ouverte. Station counts, not single scooters ([French guide](french-scooter-feeds.md#feeds-not-enabled)) |

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

- **Switzerland:** everything comes from sharedmobility.ch, apart from Hopp
  (Zürich, Basel and Kloten) and PubliBike, read from their own feeds. Hopp
  stamps each response with the time it was asked for, so the fifteen-minute
  age limit can't tell how old its positions are.
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
- **Sweden** ([guide](swedish-scooter-feeds.md#known-gaps)): Lime in Uppsala
  and Hopp in Kiruna are covered.
  - Voi (Stockholm, Uppsala, Göteborg, Malmö and others), Bolt (Stockholm),
    Ryde (Uppsala, Göteborg) and Dott (Göteborg) publish no public feed.
    Stockholm, which allows 12,000 scooters, has none on the map, and Uppsala
    shows Lime's only.
  - Dott's 12 Swedish regions in the registry (Göteborg, Eskilstuna,
    Helsingborg and others) answer 404, and its Swedish listing is empty.
  - Lime Stockholm, Göteborg and Malmö answer 404.
  - Zeus Borlänge, Falun, Halmstad, Karlstad and Gävle list only disabled
    scooters, last reported in 2022 and 2023.
  - Sweden's national access point (trafficdata.se) has no shared-mobility
    data, and Stockholm's open data has scooter parking bays only, behind a
    key.
  - Donkey Republic, Styr & Ställ and Lundahoj are bikes only.
- **Latvia** ([guide](latvian-scooter-feeds.md#known-gaps)): Ride Mobility
  in Rīga is covered.
  - Bolt runs scooters in 16 Latvian towns, Riga among them, with no public
    feed, and Skok (SIA Eterna Elect) publishes none either. So the map shows
    Ride's part of Riga's scooters only.
  - Ride's operating zones in Jūrmala and Jelgava held no scooter when
    checked. Jūrmala's held a few of Ride's Yadea Q20s, which its feed types
    as bicycles; the map leaves all of them out.
  - Ride's ids 1 to 400 on its ATOM host answer for Riga only, so no feed was
    found for Jūrmala, or for Ride in Estonia and Lithuania.
  - nextbike Latvia is empty, and the national access point
    (transportdata.gov.lv) has no shared-mobility data.
- **Poland** ([guide](polish-scooter-feeds.md#known-gaps)): Dott in
  Sosnowiec, Oświęcim, and Wołomin with Kobyłka and Radzymin, and Hopp in
  Knurów and Złotów are covered.
  - Dott's Polish site lists 85 places, but its public listing names those
    three regions only. Of its other 74 Polish entries in the registry, 73
    answer 404 (Warsaw, Kraków, Wrocław, Gdańsk, Poznań, Katowice and others)
    and Brzeg Dolny 403.
  - Lime (14 places, Warsaw and Kraków among them), Bolt (about 20 towns) and
    blinkee publish no public feed, so Warsaw, Kraków and the other large
    cities have no scooter on the map. Voi doesn't run in Poland.
  - Hopp Wałcz listed 13 available scooters, but none moved between 23:41
    and 09:15 on a Tuesday; check it on an afternoon or a weekend, and add it
    if its scooters are ridden. Hopp Września (5 available) and Środa
    Wielkopolska (1) held fewer than ten. Lublin, Piła, Wągrowiec and
    Szamotuły listed disabled scooters only, and Oborniki, Słupca, Zgorzelec,
    Murowana Goślina and Trzcianka were empty. No Hopp feed was found for
    Gliwice.
  - The national access point register (dane.gov.pl dataset 1739) links
    Bolt's and blinkee's websites, with no API; its only GBFS feed is MEVO's
    bikes.

## Countries not covered yet

Surveyed on the night of 12–13 October 2026: MobilityData's GBFS registry, the
national access points, Dott's country listings, a scan of Bolt's and ATOM
Mobility's feed ids, Hopp's town list, and guessed Bird, Lime and Hopp
addresses for each country's towns. Survey files were not kept; rerun the
checks before relying on a count.

**Public feeds found, being added one country at a time:**

| Country | Scooters | Feeds |
| --- | ---: | --- |
| Hungary | ~380 | Hopp Pécs and Békéscsaba |
| Greece | ~320 | Hopp Rhodes, Piraeus, Kefalonia, Nafplio and Ioannina |
| Cyprus | ~100 | Hopp Paphos and Limassol |
| Finland | ~40 | Hopp Mariehamn, on Åland |

**On hold:** Ukraine. 3electra's Kyiv feed (ATOM Mobility) lists about 780
scooters, but places most of them in Lima, Peru, and moves the same scooters
between the two cities. Check it by day, and ask the operator, before adding
it.

**Nothing public:**

| Country | Why |
| --- | --- |
| Austria | Dott's regions are private. Vienna's operators (Bird, Lime, Link, Voi) and Voi Innsbruck publish no feed; the access point has Voi's static zones only, behind a registration |
| Netherlands | No shared standing scooters: the national data hub (CROW) lists 27,000 shared vehicles and no scooter. They need type approval and, since July 2025, a plate |
| Denmark | Lime (Copenhagen, Odense) and Voi publish no feed; Dott lists e-bikes only |
| Czechia | Prague banned shared scooters from 1 January 2026; Golemio's feed needs a token. Bolt reportedly left the other towns |
| Ireland | Bolt's Wexford trial (2024) publishes nothing; Moby and Bleeper are bikes. Public funding for scooter schemes was paused in July 2026 |
| Estonia, Lithuania | Bolt and Ride Mobility publish no feed |
| Slovakia, Slovenia, Bulgaria, Romania, Moldova | Dott and Bolt publish no feed; nothing else found |
| Croatia | 2 docked nextbike scooters in Istria; Hopp Omiš held 11, all disabled. Rijeka is tendering 300 scooters from late 2026 |
| Serbia | Belgrade cancelled its scooter tender in July 2026 |
| Turkey | Martı, BinBin and Hop publish no feed |
| Malta | Rental scooters banned since March 2024 |
| Luxembourg, Monaco, Liechtenstein | Bikes and e-bikes only |
| Bosnia and Herzegovina, Montenegro, North Macedonia, Albania, Kosovo, Andorra, San Marino, Gibraltar, Faroe Islands | No scooter feed found (Hopp Tórshavn held 13, all disabled) |

Bolt publishes only two public scooter feeds in Europe, Brussels and Liverpool;
its other systems answer 401. Dott made most regions private in September 2026.

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
- **Spring 2027:** Dott's six paused Finnish towns (Ekenäs, Hamina, Hanko,
  Imatra, Kalajoki, Kotka) and Hopp's Greek island towns (Chania, Rethymno,
  Kos, Zakynthos and others) may open for the season.
- Every Monday, the [catalog check workflow](../.github/workflows/catalog-check.yml)
  fails when an entry of a covered country is gone.
