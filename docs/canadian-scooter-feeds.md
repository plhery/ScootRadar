# Canadian scooter feeds

Verified 14 October 2026. Canada's feeds are Bird's (`mds.bird.co`) and
Lime's (`data.lime.bike`): 14 feeds in 14 towns of four provinces, three of
them, Calgary, Edmonton and Ottawa, with both. Thirteen of the feeds are
in [MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv);
Bird Windsor is not, and answers at the address Bird uses for its other towns,
with the slug `windsor-on`. Every feed was polled 52 times on 14 October,
Eastern time: from 11:00 to 11:15 every five minutes and on to 13:02 every
quarter of an hour, from 16:16 to 19:33 every five minutes, with two breaks
of 11 and 16 minutes, and three more times from 21:23 to 21:33, five minutes
apart, before the commit. Alberta is two hours behind, British Columbia
three. Every feed URL is https, on the discovery's origin and under its
directory. No account credentials or private
rider APIs are used by those GBFS feeds. The later MoVe and Lime supplements
below use their authorized rider maps. The catalog is
[`canadian-scooter-feeds.json`](../data/canadian-scooter-feeds.json); what is
left out, and when to look again, is in [Coverage gaps](coverage-gaps.md).

## MoVe supplement — 24 October 2026

MoVe's authenticated ATOM map adds Fredericton, Moncton and Saint John,
New Brunswick. One complete collector read returned 337 available scooters
(73, 146 and 118 respectively), all with battery charge. Ten scooters
changed position by at least 20 metres across thirteen map checks, with
movement in every city. One shared account-wide read supplies three
reviewed city areas. No MoVe scooters in Halifax or Dartmouth were observed;
its store listing is not the live fleet's location. Credentials stay in
the cache's private ATOM volume. See the
[protocol and live evidence](move-app-map.md).

## Lime supplement — 26 October 2026

Lime publishes no feed for seven of its Canadian markets, so its
authenticated rider map supplies them, each market whole after a clean
full-area audit on the evening of 25 October 2026, local time: Laval (502
scooters), Vaughan (415, beside Bird's), Ajax (322), Richmond (191),
Coquitlam (181), Montréal's Parc Jean-Drapeau (147) and Port Moody (118),
every stationary reference found. Montréal doesn't allow shared scooters in
its streets; Lime's ride on Île Sainte-Hélène and Île Notre-Dame, under the
[agreement the Société du parc Jean-Drapeau signed in 2024](https://www.newswire.ca/news-releases/media-advisory-sustainable-mobility-jean-drapeau-park-signs-agreement-with-lime-and-unveils-an-enhanced-electric-scooter-offer-for-summer-2024-877224244.html),
and the map lists them under Montréal, which search also finds as Parc
Jean-Drapeau. Lime's New Westminster and Victoria regions held no scooter:
it rents only e-bikes in both. See
[the Lime guide](lime-app-map.md#every-market-the-map-lists-october-2026).

Its former Neuron towns followed on 27 October 2026, each after a clean
full-area audit that afternoon, local time: Waterloo Region (461 scooters),
Red Deer (246), Saskatoon (199), Regina (177), Blackfalds (12) and Lacombe
(10). Lime's locations page names none of them: reading its map at each
town's centre found their regions. Waterloo Region's one zone covers
Kitchener, Waterloo and Cambridge, so the map lists it once, under the
region's name, and search finds it by each city's. Red Deer's and
Saskatoon's by-laws set their winters ([below](#winter)); no town sets
hours. Lime's Toronto region holds only a dogfooding zone and a feature
test, as Toronto bans shared scooters, and its Oshawa zone held no scooter
near its centre.

The original GBFS audit follows.

| Operator | Town | Province | Available scooters, last poll (lowest–highest) |
| --- | --- | --- | ---: |
| Bird | Calgary | AB | 947 (909–992) |
| Bird | Edmonton | AB | 809 (787–827) |
| Bird | Leduc | AB | 34 (32–45) |
| Bird | Halifax | NS | 484 (475–492) |
| Bird | Hamilton | ON | 515 (515–557) |
| Bird | Ottawa | ON | 464 (456–495) |
| Bird | Vaughan | ON | 70 (67–74) |
| Bird | Windsor | ON | 218 (177–230) |
| Lime | Calgary | AB | 845 (839–870) |
| Lime | Airdrie | AB | 195 (195–210) |
| Lime | Edmonton | AB | 1,494 (1,447–1,498) |
| Lime | St. Albert | AB | 172 (170–174) |
| Lime | Beaumont | AB | 79 (77–80) |
| Lime | Kelowna | BC | 723 (706–743) |
| Lime | Vancouver | BC | 1,004 (1,004–1,212) |
| Lime | Mississauga | ON | 461 (449–466) |
| Lime | Ottawa | ON | 424 (420–449) |

In the last poll, Bird had 3,541 available scooters and Lime 5,397. Both
renew their ids (Bird at every request, Lime every 10 to 15 minutes), so rides
were counted by position: a scooter with no other within 100 m in the next
poll left; one with none in the previous poll arrived. Every town had rides.
Lime's Edmonton had the most, 462 scooters leaving and 475 arriving; Calgary's
Bird 260 and 317. The four smallest towns were followed one scooter at a
time. Leduc had about 20 departures and as many arrivals, two scooters often
riding together, and St. Albert about ten, among them a scooter that left
with 8,304 m of range and stood 1.5 km away with 5,681 m. Beaumont had two
rides, each a scooter gone and one with 1.3 to 2.6 km less range turning up
0.7 to 1.2 km away, and two charged scooters put out. Vaughan was the
quietest: two departures and three arrivals in the day, one of them a charged
scooter put out. Each of the four has more than 30 available scooters and
riders on them, so all four stay.

## Towns and provinces

Each town is named with its province, "Ottawa, ON", as in the United States,
and its id has it too: `ca:on:Ottawa`. Zoomed out, the map shows a total per
province with scooters, and further out one for Canada, inland in Manitoba's
Interlake near Fisher Branch, about the middle of the band of cities from
Vancouver to Halifax and north of the United States' total. All thirteen
provinces and territories are listed in
[`countries.json`](../data/countries.json), with their names in the app's nine
languages where they differ, from Wikipedia's article titles: Colombie-Britannique,
Nouvelle-Écosse, Terre-Neuve-et-Labrador, Neufundland und Labrador. The German
Wikipedia keeps British Columbia, Nova Scotia and Prince Edward Island in
English, and so does the map. Each province's total stands where its scooters
are, or, with none yet, where its people live: Alberta's near Red Deer,
between Calgary and Edmonton, British Columbia's near Merritt, between
Vancouver and Kelowna, Ontario's at Peterborough, between Hamilton and Ottawa,
Nova Scotia's between Halifax and Truro.

**One feed, several towns.** Lime bought Neuron on 3 July 2026 and took over
its towns into its own feeds: Lime's Calgary feed holds Airdrie's scooters, and
its Edmonton feed those of St. Albert and Beaumont. Each is an area of its own
in the catalog, so it is searched, counted and named apart. Every scooter of
the polls stood inside the municipal boundary of the town it counts under
(OpenStreetMap, read through Nominatim). Bird's Halifax feed covers the whole
regional municipality's pilot, Dartmouth included, and Bird's Windsor feed
reaches Tecumseh: none of the polls had a scooter east of Windsor's boundary,
but the zone covers Tecumseh, and Bird names it as one of its towns.

**Search** finds Halifax as Dartmouth, Halifax Regional Municipality and HRM,
Windsor as Tecumseh, and St. Albert as Saint-Albert or St Albert. A province's
code or name typed after a town, in any of the app's languages, says which one
is meant: "Ottawa ON", "Vancouver Colombie-Britannique", "Halifax
Nouvelle-Écosse". Canada is found as Canada and Kanada.

## Data handling

- **Bounds.** Bird publishes its zones. Each Bird town's bounds are its main
  zone, the one where rides may start and end (Calgary 163 km², Edmonton 274,
  Halifax 110, Hamilton 92, Leduc 34, Ottawa 32, Vaughan 106, Windsor 114),
  plus 1 km on every side. Its smaller zones inside it are parking spots and
  no-ride areas. Outside it are only Bird's two small Ottawa zones at
  45.26° N 75.70° W and 45.35° N 75.83° W, and two zones at York University,
  in Toronto, which Vaughan's bounds mostly take in; no scooter of the polls
  stood in any of them. Lime publishes no zones, so each Lime town's bounds
  are where its scooters stood over every poll, plus 1 km. Of the 486,000
  scooter positions in the 52 polls, available or not, none stood outside its
  town's bounds.
- **Freshness.** Bird's feeds were 4 to 64 seconds old when polled, and
  Lime's were made at the request. Bird stamps each scooter with
  `last_reported`: the median scooter had reported 1 to 3 minutes before the
  feed, and one to two in Hamilton, Ottawa and Windsor more than 15 minutes
  before. Lime's `last_reported` is the same for every scooter of a feed,
  within a minute of the feed's own time, so it says nothing about the
  scooter.
- **Vehicle types.** Every Bird feed declares one electric scooter type and
  one e-bike type, and e-bikes stood in Calgary, Edmonton, Halifax, Vaughan
  and Windsor. Lime declares two scooter types, with 24,140 m and 40,233 m of
  range (15 and 25 miles), and two bicycle types; e-bikes stood in Calgary,
  Edmonton, Kelowna and Mississauga. The map shows the scooters only.
- **Prices:** none. Bird's pricing feed lists no plan, and Lime publishes no
  pricing feed, so the card shows no price; nothing is invented.
- **Battery and range.** Bird gives the charge (`current_fuel_percent`) and a
  range; about a third of its ranges are above the 24,000 m its vehicle type
  says is the most, up to 43,803 m, and are shown as given. Lime gives range
  only, so its scooters show their range and no battery level.
- **Rental links.** Neither publishes a link per scooter, so the card opens
  the operator's app. Bird's `system_information` gives
  `bird://charger-onboarding`, Bird's sign-up for chargers, as its Android
  app's address; the map never opens it, in any country.
- **Time zones.** The app never reads a feed's `timezone`. Bird gives
  `Canada/Central` for Calgary, which is on Mountain time, `Canada/Eastern`
  for Halifax, on Atlantic time, `America/Detroit` for Windsor, and older names
  elsewhere (`Canada/Mountain` for Leduc, `Canada/Eastern` for Vaughan). Each
  town in the catalog says its own: `America/Edmonton`, `America/Vancouver`,
  `America/Toronto` or `America/Halifax`.

## Empty feeds

When Bird has no scooter out in a town, out of season or on a snow day, its
feed lists no vehicle and gives a time of 0 (`"last_updated": 0`), as
Saskatoon, Ajax and Surrey did on 14 October. Such a feed is read as an empty
town: the map shows no scooter there and doesn't say that Bird has stopped
sharing data, and the scooter cache leaves the feed out of its feed states, so
the feed-stopped alert stays quiet. A Bird feed with a time of 0 that lists
any vehicle, or an empty one that is out of date, still fails. The recheck
command below lists an empty Bird feed as failed, its time being out of date;
the weekly catalog check fails only on feeds that are gone. Lime's feeds
keep their time when empty, so an empty Lime town is simply empty. In
Mississauga, Lime keeps e-bikes out over the winter and takes the scooters in,
so its feed then lists e-bikes only and the map shows no scooter there, with
no alert either.

## Winter

Ottawa, Moncton, Laval, Red Deer and Saskatoon set their seasons by a standing rule. Ottawa's seasonal window in the
catalog runs from 16 November until 30 April, Toronto time, for both Bird and
Lime. Council's report ACS2025-PDB-TP-0002 of 16 April 2025
([eScribe](https://pub-ottawa.escribemeetings.com/filestream.ashx?DocumentId=232935))
set the seasons of 2026 to 2029 at "approximately April 30 to November 15,
weather permitting", and the city's
[reports page](https://ottawa.ca/en/parking-roads-and-travel/e-scooters/e-scooter-pilot-program-reports)
says "The 2026 shared e-scooter season is set to launch in late April and will
run until November 15 (weather permitting)". In that window the map says the
scooters are back in April, in the app's language, and the feeds' alerts are
muted.

Moncton's by-law L-926 on shared micromobility, passed on 17 August 2026
([PDF](https://www.moncton.ca/sites/default/files/document/l-926_shared_micromobility_licencing.pdf)),
says in 7(2) that operators start on a date the chief administrative officer
sets, "not later than April 16", and "shall cease their operations on
November 15". The catalog pauses the Moncton area of MoVe's New Brunswick feed
from 15 November until 16 April, Moncton time, so the map says the scooters
are back in April. The feed also covers Fredericton and Saint John, which set
no season, so it is not paused and its alerts stay on. The by-law sets no
hours.

Laval's by-law L-13007 defines the season as "la période qui s'étend du 15
avril au 15 novembre d'une année"; the city's link to it
([PDF](https://www.laval.ca/wp-content/uploads/2024/12/reglement-l-13007.pdf))
answered 404 on 26 October 2026, and the by-law was read from a search
engine's copy. The catalog pauses Lime's Laval market from 16 November until
15 April, Toronto time, so the map says the scooters are back in April. The
city's 2026 permit form allows scooters "uniquement du 15 avril 2026 au 14
novembre 2026"
([PDF](https://www.laval.ca/wp-content/uploads/2026/04/permis-exploitation-trottinettes-formulaire-2026.pdf)),
a day short of the by-law, and an amending by-law of 2025, L-13130, wasn't
read: check both when the scooters come back in April 2027.

Leduc publishes no season, but Bird took its scooters in on 20 and 21 October
2026: the feed held 26 to 28 available scooters until the afternoon of the
20th, Edmonton time, 17 to 19 from then through the 21st, and none from 20:30
that evening (02:30 UTC on the 22nd, the scooter cache's counts). From then it lists no
vehicle, with `last_updated` 0. So that "feed empty" doesn't report it, the
catalog pauses Leduc from 22 October until 1 May, Edmonton time: the map says
the scooters are back in May, the alerts are muted, and the recheck command
below, as the weekly catalog check, lists the feed as paused. Bird's
[release of 4 May 2022](https://www.businesswire.com/news/home/20220504005452/en/More-Cities-in-Alberta-Adopt-Micromobility-Leduc-Medicine-Hat-and-St.-Albert-Welcome-Bird-Canada-e-Scooters)
had Leduc "kicking off the scooting season in the coming weeks"; the window's
dates are 2026's, so check in late April 2027 when the scooters come back
([coverage gaps](coverage-gaps.md)).

Red Deer's Business Licence Bylaw 3609/2018 has operators "Remove E-scooters
from the City between November 1 and March 15 each year" (Schedule J, 2(f),
[consolidated 5 September 2025](https://www.reddeer.ca/media/reddeerca/city-government/bylaws/Business-Licence-Bylaw-3609-2018.pdf)),
and the city's 2026
[licence agreement](https://www.reddeer.ca/media/reddeerca/city-government/plans-and-projects/E-scooter-Licensing-Agreement.pdf)
sets the season "from March 16 to October 31". The catalog pauses Lime's Red
Deer market from 1 November until 16 March, Edmonton time, so the map says
the scooters are back in March. Lime only took over in October 2026: the
city's [program page](https://www.reddeer.ca/escooter), changed 21 October,
says it "has finalized an agreement with Lime e-mobility". Lacombe and
Blackfalds, in the same Lime region, publish no season, so their markets are
not paused.

Saskatoon's Traffic Bylaw 7200 sets each permit's fee by the scooters "able
to operate within the City between April 15 and October 31" (Schedule 19,
[consolidated to 17 December 2025](https://www.saskatoon.ca/sites/default/files/media/documents/7200.pdf)),
and leaves the season to the permit, which isn't published. The catalog
pauses Lime's Saskatoon market from 1 November until 15 April, Regina time,
which keeps standard time all year. In 2026 the scooters came back on 5 May
([city news](https://www.saskatoon.ca/news-releases/shared-e-scooters-return-2026-season)),
so "feed empty" may report the market in late April 2027: move `until` then
if the city announces a later start.

Elsewhere the winter stop is announced each year, or is the operator's own,
so the catalog sets no window, and an empty feed shows as an empty town (see
above):

- **Mississauga:** "e-scooters retire for the winter months and return in the
  spring", with no dates; they returned on 22 April 2026
  ([city news, 22 April 2026](https://www.mississauga.ca/city-of-mississauga-news/news/city-e-scooters-program-relaunch-for-the-2026-season/)).
- **Halifax:** paused on 15 December 2025, "weather dependent"
  ([city news, 5 December 2025](https://www.halifax.ca/home/news/winter-pause-shared-micromobility-e-scooter-e-bike-pilot-program)),
  back on 16 March 2026. The pilot runs to 30 November 2026 by the council
  report of 9 July 2024, or two years from 15 May 2025 by the
  [project page](https://www.halifax.ca/transportation/cycling-walking/shared-micromobility-project-bike-e-scooter-share).
- **Vaughan:** rentals paused from 1 November 2025 "until Spring 2026" and
  were back on 1 May 2026, by the city's pilot page; the pilot runs from June
  2025 to June 2027, with Bird and Lime.
- **Parc Jean-Drapeau:** the park sets each season on its page. It ended on
  15 November in 2023, 2024 and 2025, and the 2026 calendar runs from 15
  April to 15 November.
- **Ajax:** Lime's contract runs to 31 December 2027 and the by-law, 87-2024,
  sets no season.
- **Regina:** the city's
  [page](https://regina.ca/transportation-roads-parking/walking-cycling/e-scooters)
  says the program "runs seasonally, usually between May and October, weather
  permitting".
- **Waterloo Region:** the Region's
  [program page](https://www.engagewr.ca/shared-micromobility-program) says
  "between April and October" each year, with no dates. Lime took over
  Neuron's agreement, which ran "through to October 2026"
  ([Region and cities, 3 July 2026](https://www.waterloo.ca/news/posts/region-and-cities-will-work-with-lime-on-deployment-of-lime-vehicles/)),
  and the program renews each year until November 2029.
- **Lacombe** and **Blackfalds** publish no season.
- **Windsor:** the city's page says "between April and October"; its 2023
  report says Bird doesn't run in winter by its own choice, and the 2026
  contract reportedly runs from February to November.
- **Beaumont:** the scooters were removed on 15 November 2025; the pilot runs
  "until the end of October 2026", and Lime's licence to the end of 2026
  ([town page](https://www.beaumont.ab.ca/recreation-activities/outdoor-spaces/e-scooters/)).
- **Calgary** offers scooters "year-round"
  ([info sheet](https://www.calgary.ca/content/dam/www/uep/esm/publishingimages/electric-mobility/electric-micromobility-info-sheet.pdf));
  **Edmonton**, **Hamilton**, **St. Albert**, **Airdrie**, **Kelowna**,
  **Vancouver**, **Richmond**, **Coquitlam** and **Port Moody** publish no
  season.

## Night bans

No covered Canadian town bans renting at night. Parc Jean-Drapeau, whose
rule is the park's own, is the one Canadian entry in
[`rental-curfews.json`](../data/rental-curfews.json).

- **Parc Jean-Drapeau:** "Les trottinettes électriques peuvent être utilisées
  entre 6 h et 23 h, tous les jours", and not outside the park
  ([park page](https://www.parcjeandrapeau.com/fr/trottinettes-electriques-au-parc-jean-drapeau-montreal/),
  read on 26 October 2026, with the same hours in 2024 and 2025). The ban
  covers both islands, from OpenStreetMap's outline of the park, each piece
  under the square kilometre other towns' outlines keep, so the map says
  renting there is closed from 23:00 until 06:00, Montréal time.

- **Ottawa** rents scooters 24 hours a day since 2025. The 2025 season page
  said: "Making shared e-scooters available to rent 24 hours per day
  throughout the deployment area, with some exceptions such as the ByWard
  Market which will maintain no-ride hours between 11 pm and 5 am". The
  council report above recommended "that the operating hours be extended to
  24/7 moving forward". The city's current
  [rules page](https://ottawa.ca/en/parking-roads-and-travel/e-scooters/e-scooter-rules-and-safety-requirements),
  read with headless Chromium on 14 October 2026, gives no hours. The ByWard
  Market's no-ride hours are a zone rule, not a ban on renting. The 05:00 to
  01:00 hours search engines still show were those of the 2022 pilot.
- **Kelowna:** "They also cannot be ridden downtown after 10:30 pm"
  ([city page](https://www.kelowna.ca/roads-transportation/active-transportation/shared-bikes-and-e-scooters)),
  until 04:00 by the 2021 council report: a downtown zone, not a city-wide ban.
- **Windsor:** no city or Bird document sets night hours; Ottawa's report
  lists Windsor among the cities open 24/7. Bird locked its Windsor scooters
  from 23:00 to 05:00 by its own choice in 2021, and nothing says it still
  does.
- **Richmond:** no ban, but Lime planned in 2021 to collect its fleet each
  night between 21:00 and midnight, leaving a tenth out
  ([council report, 27 July 2021](https://www.richmond.ca/__shared/assets/10_E_Scooter_Pilot_Project_CNCL_09272159179.pdf)),
  so its night counts may be lower.
- **Laval** rented scooters "24 heures par jour, 7 jours par semaine" in 2024
  ([Courrier Laval](https://courrierlaval.com/?p=114191)).
- **Calgary, Edmonton, Hamilton, Halifax, Vancouver, Mississauga, Vaughan,
  Ajax, Coquitlam and Port Moody** publish no night hours.

## Parking

- **Vancouver:** "riders must park at these stations to end their trips"
  ([city page](https://vancouver.ca/streets-transportation/shared-e-scooter-system.aspx)).
  Lime lists Vancouver's 245 stations as plain stations, without the marks
  GBFS has for parking, and publishes no zones, so the catalog says so of the
  feed (`"stationParking": true`): the map shows the stations that take
  returns, 235 on 14 October, as bays where a ride must end. Lime's other
  Canadian feeds list one station each, named after the town, which the map
  leaves out.
- **Halifax:** "You must park your Bird e-scooter or e-bike in a designated
  parking zone." Bird lists 707 bays, 696 of them where its zones say a ride
  must end in one.
- **Ottawa:** "You cannot end your trip outside of a designated parking area"
  ([city page](https://ottawa.ca/en/parking-roads-and-travel/e-scooters/parking-shared-e-scooter)).
  Bird lists 567 bays, all required. Lime publishes none, so the map shows no
  bay for Lime's Ottawa scooters; Lime's app shows its own.
- **Vaughan:** at "designated micromobility parking corrals", bike racks or
  spots in the operator's app. Bird lists 496 bays, all required.
- **Mississauga:** "Rental e-bikes or e-scooters must be returned to
  designated parking stations and parking areas" (a "Mandated Parking Only
  model"), but Lime's feed lists no station there, so the map can show none.
- **Edmonton** is free-floating, except in Mill Woods since 5 August 2026,
  where a ride must end in a designated area; Bird and Lime publish none.
  **Calgary**, **Kelowna**, **St. Albert**, **Beaumont**, **Airdrie** and
  **Leduc** are free-floating; in **Hamilton** a scooter is locked to a bike
  rack.

Bays show from zoom 16, as elsewhere.

## Licences

- **Bird:** its feeds' `license_url` is its 2018 GBFS Data License Agreement,
  a PDF that answers 404, as in Europe; the
  [archived copy](https://web.archive.org/web/20260516143232/https://www.bird.co/gbfs-data-license-agreement/)
  of its licence page allows display.
- **Lime:** its feeds' `license_url` is its
  [GBFS terms](https://www.li.me/legal/public-gbfs-terms), which allow public
  display where local law requires Lime to grant it. Whether a Canadian city
  requires it was not checked. It was decided on 13 October 2026 not to ask
  Lime or Bird for a written licence (see [Coverage gaps](coverage-gaps.md)).
- The map's credits name both under the GBFS line, beside the United States.

## Known gaps

- **Toronto** bans shared scooters, and **Montréal** allows them only on
  Parc Jean-Drapeau's islands (Lime's, above); **London, ON** opted out of
  the provincial pilot.
- **Bird** runs in Mississauga, Lethbridge, Red Deer, Kamloops, Vernon,
  Brampton and Oshawa with no feed found; its Kelowna, Saskatoon, Ajax and
  Surrey feeds were empty.
- **Neuron**'s twelve Canadian feeds answer 404 since Lime bought it; Lime has
  no public feed yet for its other former Neuron towns, which its rider map
  supplies since 27 October 2026 (Saskatoon, Regina, Red Deer, Lacombe,
  Blackfalds, Waterloo Region). Its Red Deer region has no zone in Sylvan
  Lake.
- **MoVe** runs scooters in Halifax and Dartmouth (and has announced Moncton)
  on ATOM Mobility, `move-mobility.rideatom.com`, but its system id isn't
  public, so no feed was found (18 October 2026).
- Spin's feed host now answers with Bird's, Roll's doesn't answer, Link closed
  at the end of 2023, Hopr's certificate has expired and Zip's host doesn't
  resolve.
- **Bikes only:** BIXI, Bike Share Toronto, Mobi, Hamilton's SoBi, Locomotion,
  Lime Victoria, and Lime in New Westminster, which isn't in British
  Columbia's e-scooter pilot.

## Recheck

```bash
node scripts/check-french-feeds.mjs --countries=CA
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
