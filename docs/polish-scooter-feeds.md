# Polish scooter feeds

Update, 24 October 2026: additional Dott regions now use its anonymous app
map. The audit below records the original GBFS investigation; the current
catalog and [Dott adapter evidence](dott-app-map.md) supersede its Dott gaps.

Update, 25 October 2026: Lime's scooters in Warsaw, Kraków, Łódź, Poznań,
Wrocław and the Tricity, about 14,800, come from its
[authenticated rider map](lime-app-map.md), each market after a clean
full-area audit. Its 15 other Polish markets held no scooter that day.

Update, 27 October 2026: Dott has left Sosnowiec, and its feed is retired.
The cache counted 197 scooters there on 24 October, 77 on the 26th and none
from 03:00 UTC on the 27th. From about 08:05 UTC the region's address answers
404 (`ERR_REGION_NOT_FOUND`), not the 403 (`ERR_REGION_OFFLINE`) of a region
Dott pauses, and
[Dott's Polish listing](https://gbfs.api.ridedott.com/public/v2/countries/pl/gbfs.json)
names Oświęcim and Wołomin only. No other feed covers the town. The weekly
catalog check names a listed region the catalog lacks, so a return would be
reported. The audit below records Sosnowiec as it stood in October.


Verified 13 October 2026. The audit started from the
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
which lists 77 Polish Dott entries, and from
[Dott's Polish listing](https://gbfs.api.ridedott.com/public/v2/countries/pl/gbfs.json),
which names three regions: Sosnowiec, Wołomin and Oświęcim. It also polled
Hopp's Polish towns, at the address Hopp uses for its other towns. Every feed
was polled at 23:41, 23:49 and 01:10 Warsaw time on the night of Monday 12
October, then every five minutes from 03:40 to 09:15 on Tuesday 13 October.
Every feed URL is https, on the discovery's origin and under its directory. No
account credentials or private rider APIs are used. Hopp Września, left out
then, was added on 14 October 2026; see
[Hopp in Września, October 2026](#hopp-in-września-october-2026).

| Operator | City | Available scooters |
| --- | --- | ---: |
| Dott | Sosnowiec | 256 to 260 |
| Dott | Wołomin, Kobyłka and Radzymin | 150 to 154 |
| Dott | Oświęcim | 91 to 94 |
| Hopp | Knurów | 13 to 15 |
| Hopp | Złotów | 10 to 11 |
| Hopp | Września | 12 to 18 |

Between 06:00 and 09:15, 9 Dott scooters left the feed in Sosnowiec, 17 in
the Wołomin region and 15 in Oświęcim, and nearly as many came back under new
ids. Hopp Knurów had 3 rides, of 0.3 to 1.3 km, and Hopp Złotów 2, of 1.1 and
2.6 km. The bounds, discovery URLs and aliases are in
[`polish-scooter-feeds.json`](../data/polish-scooter-feeds.json).

## Hopp in Września, October 2026

Hopp Września was left out on 13 October: it held 5 available scooters at
night, and 13 or 14 that evening, after Hopp had charged and put them out,
but none was ridden while it was polled from 18:26 to 19:50. Polled on, it
was added on 14 October 2026. Its feed,
`https://api.hopp.bike/gbfs/pl-wrzesnia/gbfs.json`, is keyless GBFS 2.2, at
the address Hopp uses for its other towns, and every feed URL is https, on
the discovery's origin and under its directory.

- **Liveness:** polled 27 times from 19:03 on Tuesday 13 October to 00:20,
  five then ten minutes apart, with a gap from 21:07 to 22:37, then 18 times
  from 11:25 to 12:51 on Wednesday 14 October, five minutes apart. It listed
  12 or 13 available scooters out of 14 in the evening and 17 or 18 out of 19
  or 20 at midday. Rides were traced by the code printed on each
  scooter, as in Knurów and Złotów. One scooter was ridden 0.6 km in the
  evening's gap; overnight four came back 0.8 to 2.5 km from where they had
  stood, under new ids, with 4 to 19 points less charge; and at midday one
  was ridden 0.2 km between 11:46 and 12:01, with 7 points less.
- **Bounds:** the hole of Hopp's geofencing plus 0.005° of latitude and
  0.0075° of longitude, as for Knurów and Złotów. Every scooter of every
  poll stood inside them.
- **Prices:** PLN 2.49 to start and PLN 0.79 a minute, a little more than in
  Knurów and Złotów.
- **Vehicle types:** one, `vtp_119`, an electric standing scooter, as in
  Hopp's other Polish towns.

## Data handling

- **Dott's bounds:** each Dott region's geofencing has one operating zone,
  where rides may start and end at up to 21 km/h, and no-parking zones inside
  it: 22 in Sosnowiec, 13 in Oświęcim and 2 in Wołomin. The bounds are the
  operating zone plus 0.005° of latitude and 0.0075° of longitude, about
  550 m. In Sosnowiec one scooter stood about 1 km south of the zone in every
  poll, at 50.2539° N, so the south edge is set from it, with the same
  padding.
- **Wołomin, Kobyłka and Radzymin:** Dott's Wołomin region is one zone
  across three towns north-east of Warsaw, from 52.320° to 52.425° N. The
  catalog splits it into three areas, as it does Bristol and Yate: each part
  of the zone goes to the town whose boundary, from OpenStreetMap, holds it,
  or else to the nearest town centre, plus the padding above. The areas
  overlap at their edges, where the nearest centre gave 5 of Kobyłka's
  scooters a poll to Wołomin on the evening of 15 October 2026. Since then
  the three have their gminas' outlines in
  [`town-outlines.json`](../data/town-outlines.json), OpenStreetMap's,
  simplified to within 20 m, and a scooter inside one counts under that town:
  none was misnamed in two polls. On the morning of the audit, 63 of the
  region's scooters were nearest Wołomin, 51 Radzymin and 37 Kobyłka.
- **Hopp's bounds:** Hopp's geofencing has one no-riding polygon around each
  town, whose holes are the operating area. The bounds are those holes plus
  the same padding; Knurów's include two small holes to the south-west, one
  of which held a scooter. One Knurów scooter, disabled with an empty
  battery, stood in Gliwice, 9 km north, in every poll. The map never shows
  disabled scooters, so the bounds leave it out. Every other scooter of every
  poll stood inside the bounds.
- **Percent-encoded directory:** Dott writes Wołomin's directory
  `wo%C5%82omin`, percent-encoded, in the registry, in its Polish listing, in
  the discovery file and in every feed URL. The catalog keeps that form. A URL
  parser encodes a raw `ł` the same way, so the check that every feed stays
  under the discovery's directory passes either way, and a unit test covers
  both. The recheck script matches Dott's listing on the encoded form too.
- **Freshness:** Dott's feeds were 1 to 108 seconds old at every poll, well
  under the fifteen-minute limit. Hopp stamps each response with the time it
  was asked for (`ttl` 0), as in its other towns, so the age limit can't tell
  how old its positions are; the rides above show the two feeds are live.
- **Vehicle types:** each Dott region lists one type, `dott_scooter`, and each
  Hopp town one, `vtp_119`. Both are electric standing scooters.
- **Prices:** from the pricing feeds, in złoty. Dott charges PLN 3.90 to
  unlock and PLN 0.99 a minute in Sosnowiec and Oświęcim, PLN 2.50 and
  PLN 0.89 in Wołomin. Hopp charges PLN 2.39 to start and PLN 0.69 a minute
  in Knurów and Złotów, and PLN 2.49 and PLN 0.79 in Września.
- **Battery:** Dott gives each scooter's charge; Hopp's comes from its
  `hopp_battery_level` field.
- **Rental links:** each scooter links to its own `go.ridedott.com` or
  `app.hopp.bike` address, as in the operators' other countries.
- **IDs:** both operators give a scooter a new `bike_id` after a ride, so a
  ride shows as one id leaving and another appearing. Hopp also renewed the id
  of one Knurów scooter that hadn't moved. The code printed on a Hopp scooter
  (`hopp_code`) stays the same, which is how the rides above were traced.
- **Parking:** Dott publishes 64 virtual stations in Sosnowiec and 18 in
  Oświęcim, none in Wołomin; Hopp publishes none. No geofencing zone requires
  station parking, so the map shows Dott's stations as suggested places, not
  mandatory ones. In 2020 Sosnowiec marked scooter bays for every operator to
  use
  ([smartride.pl](https://smartride.pl/sosnowiec-porzadkuje-elektryczne-hulajnogi-parkowanie-w-miejscach-wyznaczonych-przez-urzad-miasta/),
  press), and in 2021 Oświęcim agreed eight marked spots with Tier
  ([oswiecim.pl](https://oswiecim.pl/oswiecim-8-miejsc-postojowych-dla-hulajnog/40812/)).
  Tier has since merged into Dott; whether those arrangements bind Dott is
  not known.
- **Time zone:** the six feeds give `Europe/Warsaw`. Of the Hopp towns left
  out, Wałcz and Trzcianka give `Atlantic/Reykjavik` and Szamotuły
  `Europe/Riga`. Neither the app nor the scooter cache reads
  `system_information`, so this changes nothing on the map.

## Night bans

No covered Polish town bans renting at night, so
[`rental-curfews.json`](../data/rental-curfews.json) has no Polish entry.

- **Sosnowiec:** the city's 2022 announcement of Tier's scooters mentions no
  agreement, zones or hours
  ([sosnowiec.pl](https://www.sosnowiec.pl/2022/08/sport-i-rekreacja/neutralnie-klimatycznie-e-hulajnogi-tier-wjechaly-do-sosnowca/)).
  Its BIP could not be searched.
- **Oświęcim:** the 2021 agreement with Tier set parking spots, not hours
  ([oswiecim.pl](https://oswiecim.pl/oswiecim-nowe-ekologiczne-hulajnogi-w-naszym-miescie/40899/)).
- **Wołomin and Kobyłka:** neither BIP has any rule on shared scooters.
  Kobyłka says it can't sanction riders, which is the police's job
  ([kobylka.pl](https://kobylka.pl/strona-3868-pytania_na_sesje_od_mieszkancow_pytania.html)).
- **Radzymin:** nothing found, but its BIP is behind a captcha, so this is the
  least checked town.
- **Knurów:** neither the city's site nor its BIP has a rule. The local press
  reports about 70 Hopp scooters, for adults only and capped at 20 km/h, with
  no hours ([przegladlokalny.eu](https://przegladlokalny.eu/hulaja-z-glowa)).
- **Złotów:** nothing on the BIP or the city's site. Councillors complained
  about scooters ridden fast on pavements in September 2026
  ([zlotowskie.pl](https://zlotowskie.pl/artykul/hulajnogi-na-drzewo-n1854695),
  press); no rule followed.
- **Września:** no rule on renting hours, and no agreement between the town
  and Hopp, was found on the town's site or in the local press.
- **Dott's Polish terms**
  ([ridedott.com](https://ridedott.com/terms-and-conditions/poland/)) set no
  hours. They still name Tier Mobility Poland as the contract partner in
  Oświęcim and Sosnowiec.
- **National rules:** the law of 17 October 2025
  ([Dz.U. 2025 poz. 1676](https://eli.gov.pl/eli/DU/2025/1676/ogl)) sets a
  minimum age of 13 from 3 March 2026 and requires a helmet under 16 from 3
  June 2026. It sets no hours. A draft law (UD402) would let shared scooters
  park only where the road authority allows; it has no night rule either.

## Licences

- **Dott** publishes no `license_url` in its Polish feeds, as in its other
  countries. Its [API licence](https://ridedott.com/api-licence/) restricts
  distribution; see [Coverage gaps](coverage-gaps.md#waiting-on-a-decision).
- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  data licence, as in Germany, Spain, Iceland and Sweden.
- The map's credits name Dott and Hopp under the GBFS line.

## Known gaps

- **Dott, other towns:** Dott's Polish site lists 85 places, and the registry
  77 Polish entries. Besides the three covered regions, 73 answer 404
  (`ERR_REGION_NOT_FOUND`), Warsaw, Kraków, Wrocław, Gdańsk, Poznań and
  Katowice among them, and Brzeg Dolny 403 (`ERR_REGION_OFFLINE`), still so at
  18:27 on 13 October. Dott's Polish listing names the three covered regions
  only.
- **Hopp, other towns:** Hopp's Polish towns are franchises, run by local
  companies.
  - Wałcz listed 13 available scooters out of 22, but not one moved, came or
    went from 23:41 to 09:15, nor in 22 polls four minutes apart from 18:26 to
    19:50 on the Tuesday evening. Between 09:15 and 18:26 one scooter was
    ridden 2.3 km, with 28 points less charge. On Saturday 24 October it
    listed 4 available out of 22, and from 08:36 to 16:47 none moved more
    than 50 metres or lost more than 1 point of charge, polled every few
    minutes from 14:40 to 15:04 and 16:37 to 16:47. It is left out; check it
    again in April 2027.
  - Środa Wielkopolska listed 1 available scooter out of 10 until 19:22, then
    Hopp put out freshly charged ones, 7 by 19:50; none was ridden. Under ten.
  - Lublin (3 scooters), Piła (12), Wągrowiec (6) and Szamotuły (1) listed
    disabled scooters only. Oborniki, Słupca, Zgorzelec, Murowana Goślina and
    Trzcianka were empty.
  - Hopp's site lists Gliwice and "Silesia", both run by Hopp Silesia, but no
    feed address was found for either.
- **Lime** (14 places, Warsaw, Kraków, Łódź, Poznań, Wrocław and the Tricity
  among them), **Bolt** (about 20 towns) and **blinkee** publish no public
  feed. Lime's six markets with scooters come from its rider map since
  25 October 2026 (see the update above). **Voi** doesn't run in Poland.
- **Public data:** Poland's national access point register,
  [dane.gov.pl dataset 1739](https://dane.gov.pl/dataset/1739), links Bolt's
  scooter page and blinkee's site, with no API. Its only GBFS feed is MEVO's,
  the Tricity's bike scheme.
- **Warsaw:** since 22 May 2026, agreements between the city and Bolt, Lime
  and Dott ban riding and parking in Park Sowińskiego and Lasek na Kole, on
  top of the Old Town, Ogród Krasińskich and Łazienki Królewskie, and set
  12 km/h zones. None of the three publishes a Warsaw feed.
- **Kraków:** since August 2023, scooters may be left only at mobility points
  inside the city's agreement area, 323 of them in 2024
  ([ZTP](https://ztp.krakow.pl/miasto-15-minutowe/hulajnogi-elektryczne)).
  None of the operators there publishes a feed.

## Search

Town names are found with and without their Polish letters: Wołomin and
Wolomin, Oświęcim and Oswiecim, Złotów and Zlotow, Września and Wrzesnia. The
app folds `ł` to `l`, which Unicode doesn't decompose. "Auschwitz" is not an
alias of Oświęcim: the
address search already finds the town under that name, and the town asks to
be seen as a living place, not only as the camp
([oswiecim.pl](https://oswiecim.pl/geneza-nazwy-miasta/)). Checked in
production on 13 October at 18:28: a search for "Auschwitz" puts Oświęcim
first, marked as covered, whether the map is centred on Zürich, Warsaw or
Paris or not at all; in German the address search lists it under its German
name, Auschwitz, at the same place. The Memorial bans any vehicle on its
grounds, scooters included
([visitor rules](https://www.auschwitz.org/gfx/auschwitz/userfiles/_public/visit/65_en.pdf)).

## Recheck

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=PL --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
