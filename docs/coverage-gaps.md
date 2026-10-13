# Coverage gaps

What the map doesn't cover yet, why, and when to check again. Each covered
country's guide has the evidence and the details; this page lists every gap in
one place. Started 12 October 2026. Add to it when an audit leaves something
out, and remove an entry once it's added or settled for good.

## Found, not added yet

These feeds are public and were live when checked. Nothing blocks them except
the work.

None at the moment.

## Waiting on a decision

| What | Blocked on |
| --- | --- |
| **Dott** everywhere | Its [API licence](https://ridedott.com/api-licence/) restricts distribution. Since September 2026 most regions need a partner key, which Dott grants through its partner integrations team |
| **Voi** in the United Kingdom | Access is asked from nap@voiapp.io, under a [licence](https://www.voi.com/voi-licencing-agreement) that forbids storing the data, which the scooter cache does |

It was decided on 13 October 2026 not to ask Lime, Bird or Hopp for a written
licence, so their terms block nothing and their feeds stay on the map. For the
record:

- **Lime:** its [GBFS terms](https://www.li.me/legal/public-gbfs-terms) allow
  public display only where local law requires it.
- **Bird:** its licence page answers 404; the
  [archived copy](https://web.archive.org/web/20260516143232/https://www.bird.co/gbfs-data-license-agreement/)
  allows display.
- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  licence.

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
  - West of Paris, Lime's scooters run in eight towns of Saint Germain Boucles
    de Seine, now on the map; Bezons, Carrières-sur-Seine, Chambourcy, Chatou,
    L'Étang-la-Ville, Louveciennes and Mareil-Marly have its e-bikes only
    ([French guide](french-scooter-feeds.md#lime-west-of-paris-and-bird-agen-october-2026)).
  - Nantes: Pony's feed lists the scooters of Naolib Micromob' (about 50
    available, at Chantrerie and Saint-Herblain, and ridden), but with Pony's
    price and app, while riders rent them in Naolib's app at Naolib's price.
    The city's own Naolib feed lists its feeds on another host, which the
    same-origin rule refuses
    ([French guide](french-scooter-feeds.md#pony-october-2026)).
  - Pony's other regions, read on 13 October 2026 with the key published for
    La Roche-sur-Yon: Tours, Orléans, Limoges, Nice and Marseille listed
    e-bikes only, Pays Basque e-bikes and one disabled scooter, and Paris 9
    scooters, all disabled. Caen, Olivet and Sète, which Pony's site lists,
    answered `UNKNOWN_REGION`.
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
  - Hopp Augsburg listed 42 scooters, all disabled and unchanged, on the
    evening of 13 October 2026; check it in spring.
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
    2026 or that evening; check it in spring, and add it if it has some.
  - Helbiz and Link no longer resolve. Cooltra lists mopeds and e-bikes only.
    Pony's site lists Turin, but its server answered `UNKNOWN_REGION` for
    Turin and Torino.
- **Belgium** ([guide](belgian-norwegian-british-scooter-feeds.md#known-gaps)):
  - Brussels bans shared scooters from 1 January 2027, so Bolt's and Dott's
    feeds there should empty.
  - Pony Liège held 8 or 9 available scooters on 13 October 2026, under ten,
    and most never moved; check it again in April 2027.
    Pony publishes nothing for Brussels; its Brussels region, read with the
    key published for La Roche-sur-Yon, listed 4 scooters, all disabled.
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
    and Brzeg Dolny 403, still on the evening of 13 October 2026.
  - Lime (14 places, Warsaw and Kraków among them), Bolt (about 20 towns) and
    blinkee publish no public feed, so Warsaw, Kraków and the other large
    cities have no scooter on the map. Voi doesn't run in Poland.
  - Hopp Wałcz listed 13 available scooters, but none moved between 23:41
    and 09:15 on a Tuesday, nor in 22 polls from 18:26 to 19:50 that
    evening; one was ridden in between. Hopp Września listed 13 or 14
    available that evening, after a recharging round, but none was ridden
    while it was polled. Check both on a weekend afternoon, and add them if
    their scooters are ridden. Środa Wielkopolska held 1 to 7, under ten.
    Lublin, Piła, Wągrowiec and Szamotuły listed disabled scooters only, and
    Oborniki, Słupca, Zgorzelec, Murowana Goślina and Trzcianka were empty. No
    Hopp feed was found for Gliwice.
  - The national access point register (dane.gov.pl dataset 1739) links
    Bolt's and blinkee's websites, with no API; its only GBFS feed is MEVO's
    bikes.
- **Hungary** ([guide](hungarian-scooter-feeds.md#known-gaps)): Hopp in Pécs
  and Békéscsaba is covered.
  - Budapest has no scooter on the map. Lime (Budapest and 16 other places,
    Szeged, Eger, Sopron and Veszprém among them) and Dott (Budapest, Győr,
    Miskolc, Siófok and four other towns) publish no public feed: Dott's 8
    Hungarian regions in the registry answer 404, its Hungarian listing names
    none, and Lime's address answers 404 for each town tried. blinkee (2
    towns) publishes nothing either, and Bolt runs taxis only in Hungary.
  - Hopp Gyula's feed answers but held no scooter at night or by day, and
    Hopp's site doesn't list it. Of 57 other Hungarian towns tried at
    Hopp's address, none answered.
  - Budapest's 7th district (Erzsébetváros) voted in April 2025 that rental
    e-devices may not be used from 22:00 to 06:00 inside Károly körút, Király
    utca, Erzsébet körút and Rákóczi út
    ([resolution 149/2025](https://www.erzsebetvaros.hu/uploads/files/php2YGu2i-1746011602-2025_04_29_KT_kivonat_ny%C3%ADlt.pdf);
    [Infostart](https://infostart.hu/belfold/2025/05/16/sebessegsapka-uj-tilalmak-es-egyeb-szabalyok-erzsebetvarosban),
    16 May 2025, press). It sets terms for the district's future contracts;
    no report says it is enforced. Check it before adding Budapest.
  - MOL Bubi and Donkey Republic are bikes only. The national access point
    (napportal.kozut.hu) lists timetables and road data, no shared mobility,
    and BKK's FUTÁR API needs a key and carries bike stations, not scooters.
- **Greece** ([guide](greek-scooter-feeds.md#known-gaps)): Hopp in Faliraki,
  Piraeus, Argostoli and Ioannina is covered.
  - Athens has no scooter on the map. Dott's Athens and Thessaloniki regions
    in the registry answer 404, Lime's address answers 404 for both cities,
    and Bolt publishes no feed.
  - Hopp Nafplio listed 17 or 18 available scooters, but none moved, left or
    came back in 35 polls from 12:03 to 16:47 Athens time on a Tuesday, while
    Faliraki, Piraeus, Argostoli and Ioannina had rides, nor in 22 polls from
    19:26 to 20:50, when Hopp took six in to charge. Its other scooters kept
    their ids from 02:10 that night to 20:50. Check it in the tourist
    season or on a weekend, and add it if its scooters are ridden. Nafplio's
    council discussed rental scooters on 8 May 2026; check for a decision
    first.
  - Hopp Athens (Kifisia), Voula, Zakynthos and Lefkada listed only disabled
    scooters, 1 to 7 each; Chania, Rethymno, Kos, Kardamena, Kalymnos,
    Trikala, Katerini, Preveza and Corinth listed none.
  - nextbike's four Athens suburbs have e-bikes only. The national access
    point (nap.gov.gr) is a landing page, and its catalogue timed out.
- **Cyprus** ([guide](cypriot-scooter-feeds.md#known-gaps)): Hopp in Paphos
  and Limassol is covered.
  - Nicosia has no scooter on the map. Bolt runs e-scooters there, parked at
    fixed stations, with no public feed. The national access point
    (traffic4cyprus.org.cy) offers Bolt's 255 Nicosia stations under CC BY
    4.0, in DATEX II, with no vehicles or availability, so there is nothing
    to show. Scroll ran in Nicosia in 2024; whether it still does is
    unverified.
  - Hopp Larnaca's feed answers but held no scooter, by night or by day, and
    Hopp's site doesn't list the town. Hopp Paphos's area around Polis and
    Latchi, 29 km north of Paphos, held no scooter either.
  - Bird, Lime, Dott and Zeus have nothing in Cyprus: Dott's Cypriot listing
    names no region, and the others' addresses answer 404 or 400 for each
    town tried. nextbike Cyprus is bikes and e-bikes only.
- **Finland** ([guide](finnish-scooter-feeds.md#known-gaps)): Hopp in
  Mariehamn, on Åland, is covered.
  - The mainland has no scooter on the map. Voi, Ryde and Dott run in
    Helsinki, Espoo, Vantaa, Tampere and Turku with no public feed, and Bolt
    publishes none. Dott's 40 Finnish regions in the registry don't answer: 34
    answer 404, and 6 (Ekenäs, Hamina, Hanko, Imatra, Kalajoki, Kotka) are
    paused, probably for the winter. Bird Helsinki's feed is empty and stamped
    `last_updated` 0.
  - Joe Scooter's Rauma feed (ATOM Mobility) answers but listed no scooter at
    night or in 21 polls from 17:00 to 18:01 on a Tuesday. Its other towns'
    feeds answer "GBFS disabled". Check Rauma in spring, and add it as a new
    provider if its scooters are ridden.
  - The national access point (finap.fi) lists Voi's static NeTEx for Helsinki,
    Turku, Tampere and Jyväskylä: zones, prices and hours, no vehicles.
    Digitransit needs a key and carries city bikes only. Donkey Republic and
    Helsinki's city bikes are bikes only.
  - Helsinki, Espoo, Vantaa, Turku and Oulu ban renting or riding on weekend
    nights; add a curfew with any of them.

## Countries not covered yet

Surveyed on the night of 12–13 October 2026: MobilityData's GBFS registry, the
national access points, Dott's country listings, a scan of Bolt's and ATOM
Mobility's feed ids, Hopp's town list, and guessed Bird, Lime and Hopp
addresses for each country's towns. Survey files were not kept; rerun the
checks before relying on a count.

**On hold:** Ukraine. 3electra's Kyiv feed (ATOM Mobility, system 66) lists
about 800 scooters. From 19:26 to 20:38 Kyiv time on 13 October 2026, 698 to
718 available standing scooters stood in central Kyiv, and 53 rides showed as
a scooter leaving the feed and coming back 0.2 to 3.2 km away under a new id,
47 of them with less range. But 80 to 99 more stood in Lima, Peru, hopping
about 1.7 km between polls with the same range, and from 20:42 scooters moved
to Lima by the hundred (364 by 20:50; 714 at 00:40 the night before, most back
in Kyiv by 02:10). Three that came back from Lima stood 5 to 17 m from where
they had left Kyiv, so Lima looks like a mask over hidden scooters, not a
position. Bounds would drop Lima, but the map would lose most of Kyiv each
evening for reasons unknown. Systems 65, 67 and 68 answer 400, and the feed
gives no licence. Ask the operator what Lima means before adding it; Kyiv's
martial-law curfew, 01:00 to 05:00, would also need a curfew entry from a
primary source.

**Nothing public:**

| Country | Why |
| --- | --- |
| Austria | Dott's regions are private. Vienna's operators (Bird, Lime, Link, Voi) and Voi Innsbruck publish no feed; the access point has Voi's static zones only, behind a registration |
| Netherlands | No shared standing scooters: the national data hub (CROW) lists 27,000 shared vehicles and no scooter. They need type approval and, since July 2025, a plate |
| Denmark | Lime (Copenhagen, Odense) and Voi publish no feed; Dott lists e-bikes only. Hopp Roskilde held 1 disabled scooter on 13 October 2026 |
| Czechia | Prague banned shared scooters from 1 January 2026; Golemio's feed needs a token. Bolt reportedly left the other towns |
| Ireland | Bolt's Wexford trial (2024) publishes nothing; Moby and Bleeper are bikes. Public funding for scooter schemes was paused in July 2026 |
| Estonia, Lithuania | Bolt and Ride Mobility publish no feed |
| Slovakia, Slovenia, Bulgaria, Romania, Moldova | Dott and Bolt publish no feed; nothing else found |
| Croatia | 2 docked nextbike scooters in Istria; Hopp Omiš held 11, all disabled, at night and on the evening of 13 October 2026. Rijeka is tendering 300 scooters from late 2026 |
| Serbia | Belgrade cancelled its scooter tender in July 2026 |
| Turkey | Martı, BinBin and Hop publish no feed |
| Malta | Rental scooters banned since March 2024 |
| Luxembourg, Monaco, Liechtenstein | Bikes and e-bikes only |
| Bosnia and Herzegovina, Montenegro, North Macedonia, Albania, Kosovo, Andorra, San Marino, Gibraltar, Faroe Islands | No scooter feed found (Hopp Tórshavn held 13, all disabled, at night and on the evening of 13 October 2026) |

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
- **Saturday 17 or Sunday 18 October 2026, in the afternoon:** Hopp Wałcz and
  Września, which had no ride while polled on a Tuesday evening.
- **1 December 2026:** the EU's rule on multimodal travel information
  (Delegated Regulation (EU) 2024/490) requires shared-scooter availability on
  each country's national access point for the cities on the main EU transport
  network, among them Vienna, Madrid and Warsaw. Austria, Spain, Poland and the
  Netherlands may publish feeds then.
- **1 January 2027:** Brussels's ban starts; Bolt and Dott Bruxelles should
  empty.
- **April 2027:** Pony Liège held 8 or 9 available scooters on 13 October
  2026, most of which never moved; add it if it holds ten or more and they
  are ridden.
- **Spring 2027:** Dott's six paused Finnish towns (Ekenäs, Hamina, Hanko,
  Imatra, Kalajoki, Kotka), Joe Scooter in Rauma, Hopp's Greek island towns
  (Chania, Rethymno, Kos, Zakynthos and others), Hopp Como and Hopp Augsburg
  may open for the season; recheck Hopp Nafplio then too.
- Every Monday, the [catalog check workflow](../.github/workflows/catalog-check.yml)
  fails when an entry of a covered country is gone.
