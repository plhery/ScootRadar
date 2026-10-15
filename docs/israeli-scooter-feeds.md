# Israeli scooter feeds

Verified 15 October 2026. Israel's feeds are Bird's `israel` (`mds.bird.co`),
Dott's `tel-aviv` (`gbfs.api.ridedott.com`) and Lime's `tel_aviv`
(`data.lime.bike`): 3 feeds in 14 towns, 13 of them in Gush Dan, around Tel
Aviv, and Ashdod. All three are in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv).
Every feed was polled about every 12 minutes from 09:27 to 18:49 Israel
time on 15 October, then every five minutes from 20:43 to 21:50, just before
the commit: 62 polls of Bird and Dott, 64 of Lime. Every feed URL is https,
on the discovery's origin and under its directory. No account
credentials or private rider APIs are used. The catalog is
[`israeli-scooter-feeds.json`](../data/israeli-scooter-feeds.json); what is
left out, and when to look again, is in [Coverage gaps](coverage-gaps.md).

| Operator | Town | Available scooters, last poll (lowest–highest) |
| --- | --- | ---: |
| Bird | Tel Aviv | 1,886 (1,735–1,905) |
| Bird | Ashdod | 306 (305–358) |
| Bird | Ramat Gan | 197 (190–217) |
| Bird | Bat Yam | 179 (160–191) |
| Bird | Givatayim | 158 (131–163) |
| Bird | Rishon LeZion | 150 (149–198) |
| Bird | Holon | 81 (70–89) |
| Bird | Ramat HaSharon | 34 (31–43) |
| Bird | Herzliya | 22 (20–28) |
| Bird | Bnei Brak | 8 (7–20) |
| Dott | Tel Aviv | 1,099 (1,089–1,272) |
| Dott | Petah Tikva | 438 (434–454) |
| Dott | Ramat Gan | 370 (370–407) |
| Dott | Bat Yam | 330 (327–367) |
| Dott | Givatayim | 111 (92–112) |
| Dott | Holon | 99 (91–102) |
| Dott | Herzliya | 59 (57–61) |
| Dott | Bnei Brak | 21 (20–42) |
| Lime | Tel Aviv | 1,498 (1,391–1,602) |
| Lime | Ramat Gan | 823 (768–870) |
| Lime | Petah Tikva | 588 (574–614) |
| Lime | Holon | 269 (255–285) |
| Lime | Givatayim | 256 (163–267) |
| Lime | Herzliya | 185 (178–192) |
| Lime | Kiryat Ono | 135 (134–148) |
| Lime | Bnei Brak | 57 (53–93) |
| Lime | Givat Shmuel | 17 (13–21) |
| Lime | Or Yehuda | 16 (15–20) |

In the last poll, Bird had 3,021 available scooters, Dott 2,527 and Lime
3,844, counted as the map counts them (see
[Towns](#towns-and-their-outlines)). The evening's counts are the day's
lowest in most towns.

All three renew their ids: Bird at every request, Dott after each ride and
Lime every 10 to 15 minutes. Rides were counted by position: a scooter with
no other of its feed within 60 m in the previous poll arrived, and one with
none in the next poll left; three or more arriving within 30 m of each other
were a staff drop, and one with its feed's full range a charged scooter put
out. Every town had rides. Tel Aviv had the most: Lime 3,372 arrivals and
3,409 departures in the day, Dott 1,259 and Bird 1,061. The smallest had a
few each: Dott's Herzliya 6 arrivals with 57 to 61 scooters standing, Bird's
Herzliya 11, Lime's Givat Shmuel and Or Yehuda 5 each, and Bird's Bnei Brak
13, with 7 to 20 scooters, 11 in the median poll. Each has about 10 or more
available scooters and riders on them, so all stay. What fell short is in
[Known gaps](#known-gaps).

## Towns and their outlines

Each feed covers several towns, and the catalog gives each town its own
area, so it is searched, counted and named apart. The towns of Gush Dan
touch: the box around Givatayim holds a good part of Ramat Gan and of Tel
Aviv, and no set of rectangles tells them apart. Counting each scooter under
the nearest town whose box holds it named about 1,900 scooters a poll after
the wrong town, and even the best boxes found named 368.

So each town's municipal boundary is in
[`town-outlines.json`](../data/town-outlines.json): OpenStreetMap's (relation
ids in the file, read through Nominatim), simplified to within 10 m, 1,443
points for 13 towns. Ashdod stands alone and needs none. A scooter inside a
town's outline counts under that town; one outside every outline, under the
nearest town whose box holds it, its own feed's first. A feed keeps no scooter
inside the outline of a town where its operator runs no service: Dott's
scooters in Givat Shmuel, a town counted for Lime only, never count under
Ramat Gan or Petah Tikva.

Replayed over every poll, against the municipal boundaries:

- **Misnamed:** about 3 scooters a poll of 9,400, where the simplified
  outline and the boundary part: half of them within a metre of the
  boundary, all within 36 m. On the evening of 15 October 2026, 25 and 21
  in two polls, most of them Ramat Gan's under Givatayim, along the line
  between them; 10 of the first poll's stood at one parking spot of Bird's
  and Lime's, 8 to 17 m inside Ramat Gan. So since 16 October 2026 Israel's
  outlines are simplified to within 10 m, not the 20 m of other countries'.
  In four polls that night, the scooters inside a town's boundary but not
  inside its outline, or inside another's, fell from 19 to 22 a poll to 8
  to 11, for 383 more points (12 KB more in a file only the server reads).
- **Dropped:** of the covered towns' scooters, 0.03 a poll (Dott, on Petah
  Tikva's boundary). The scooters of the towns left out are dropped by
  design: Dott's in Givat Shmuel (about 9 a poll), Kiryat Ono (about 3) and
  Ramat HaSharon; Lime's in Bat Yam and Ramat HaSharon (1 to 1.5 each); Bird's
  in Petah Tikva (under 1) and Pardes Hanna-Karkur (about 1), and Caesarea's
  about 50, outside every box.
- **Outside every town:** a few scooters a poll stand in a box but in no
  covered town, and count under the nearest: Bird's in Hof HaSharon's strip
  by Ramat HaSharon (about 2.5) under Ramat HaSharon; Lime's in
  Yehud-Monosson (about 3) and Savyon (1) under Kiryat Ono, and in Drom
  HaSharon (about 2) under Petah Tikva; and those on land in no
  municipality, such as Mikveh Israel by Holon, under the nearest town.

**Bounds.** Bird and Dott publish their zones. Each Bird or Dott town's
bounds are the part of the operator's ride zones inside the town, plus 1 km
on every side. Lime publishes no zones, so each Lime town's bounds are where
its scooters stood in the town over every poll, plus 500 m (Or Yehuda's
widened to take in the town's centre). Every box is inside Israel's pre-1967 lines: the
easternmost edge, Dott's Petah Tikva at 34.9304° E, is about 5 km west of
the nearest point of the West Bank, at Oranit; no feed had a scooter in the
West Bank or in East Jerusalem.

**Search** finds Tel Aviv as Tel Aviv-Yafo, Tel Aviv-Jaffa, Jaffa, Yafo, TLV,
תל אביב, תל אביב-יפו, יפו, تل أبيب and يافا, and every town in Hebrew,
with or without niqqud, and in its other common spellings: Petach Tikva,
Rishon Letzion, Herzlia, Givataim, Ramat Hasharon, Qiryat Ono, Or Yehudah,
פתח תקוה and קרית אונו. Israel is found as Israel, Israele, ישראל and إسرائيل.

**The country's total**, zoomed out, stands in Ramat Gan, east of Tel Aviv,
where nearly all its scooters are. Cyprus's stands 360 km to the
north-west: at zoom 4 the two totals touch, and at zoom 3 Israel's, the
larger, covers half of Cyprus's. No place in Israel avoids that at zoom 3:
even from Eilat the two would overlap.

## Data handling

- **Freshness.** Bird's feed was 5 to 12 seconds old when polled in the
  evening (up to a minute in the morning), Dott's 1 to 113 seconds, and
  Lime's was made at the request.
- **Vehicle types.** Bird declares one electric scooter type and one e-bike
  type, Lime two scooter types, with 24,140 m and 40,233 m of range, and two
  bicycle types, Dott only scooters. The map shows the scooters only. Lime's
  feed lists one station, named Tel Aviv, which the map leaves out.
- **Prices.** Dott's plan is ₪5 to unlock and ₪1.25 a minute, with
  `is_taxable` false: Israel's prices include VAT, so nothing is added. The
  card reads "₪5.00 to unlock, then ₪1.25 a minute" and "17.50 ILS, 10 min",
  in an English browser and in a Hebrew one alike. Bird's pricing feed lists
  no plan and Lime publishes none, so their cards show no price.
- **Battery and range.** Bird and Dott give the charge and a range; Lime
  gives range only, so its scooters show their range and no battery level.
- **Rental links.** Dott links each scooter (`go.ridedott.com/vehicles/…`);
  Bird and Lime don't, so their cards open the operator's app. Bird's
  `system_information` gives `bird://charger-onboarding`, Bird's sign-up for
  chargers, as its Android app's address; the map never opens it.
- **Time zones.** The app never reads a feed's `timezone`. Bird gives
  `Asia/Tel_Aviv`, an old name; Dott and Lime `Asia/Jerusalem`, which every
  area of the catalog says.

## Rules

- **Who may ride.** Tel Aviv-Yafo's page on riding two-wheelers
  ([archived 11 August 2026](https://web.archive.org/web/20260811074255/https://www.tel-aviv.gov.il/Residents/Transportation/Pages/BicycleEnforcement.aspx);
  the city's site answers HTTP 571 outside Israel) says riding e-bikes and
  e-scooters is allowed from 16, by law, and only after a competency test
  (₪750 fine), that a helmet is required on both (₪1,000), and that riding
  on the pavement (₪250) and carrying a passenger on a scooter (₪250) are
  banned. The Ministry of Transport's and the National Road Safety
  Authority's pages on gov.il, among them "Regulations – e-scooter"
  (`gov.il/he/pages/regulations_scooter`) and "Licence grade A3 for mobility
  vehicles" (`gov.il/he/pages/mobility-a3`), answered 403 to scripts and to
  headless Chrome, and their archived copies show no text, so the national
  rule wasn't read first-hand. What could be read doesn't say whether a
  visitor's foreign driving licence counts as the test; the operators' apps
  decide at sign-up. The map says nothing of it, as elsewhere.
- **Night bans:** none found, at the city or the ministry, so
  [`rental-curfews.json`](../data/rental-curfews.json) has no Israeli entry.
- **Holon** decided to ban shared scooters from 17 September 2026
  ([ice, 9 August 2026](https://www.ice.co.il/local-news/news/article/1124736)).
  On the operators' petition, the court froze the ban until the city decides
  again, after a review due by 15 October
  ([ice, 10 September 2026](https://www.ice.co.il/law/news/article/1129448)).
  Holon's scooters still ride (119 Bird arrivals on 15 October, 39 Dott, 162
  Lime), so Holon is covered; it is to be checked again in November 2026.

## Parking

Dott lists 1,684 stations, all virtual, and 28 zones where a ride must end at
one of them (`station_parking`): 8 in Ramat Gan, 7 in Petah Tikva, 5 in Tel
Aviv, one of them most of the city from Jaffa to the Yarkon, 3 in Bat Yam,
2 in Bnei Brak, and one each in Givatayim, Holon and Herzliya. On the map,
from zoom 16, the 1,530 stations inside those zones are bays where a ride must
end, and the other 154 are parking spots, none of them required: 133 in
zones that require no bay, and 21 just inside small zones where Dott forbids
ending a ride, mostly parks (two entrances of Peres Park in Holon, a garden on
Sirani Street in Tel Aviv). Dott lists all 21 as taking returns, so the map
shows them as spots, not bays. Bird lists no station and no bay zone, and Lime
one station named after the city, which the map leaves out; neither shows a
bay, and their apps show their own rules.

## Licences

- **Bird:** its feed's `license_url` is its 2018 GBFS Data License
  Agreement, a PDF that answers 404, as in Europe; the
  [archived copy](https://web.archive.org/web/20260516143232/https://www.bird.co/gbfs-data-license-agreement/)
  of its licence page allows display.
- **Lime:** its feed's `license_url` is its
  [GBFS terms](https://www.li.me/legal/public-gbfs-terms), which allow
  public display where local law requires Lime to grant it.
- **Dott:** no `license_url`; its [API terms](https://ridedott.com/api-licence/)
  restrict distribution, as in Europe.
- **OpenStreetMap:** the town outlines are © OpenStreetMap contributors,
  under the [ODbL](https://opendatacommons.org/licenses/odbl/), and the
  credits link it.
- The map's credits name the three operators on the GBFS line for Asia,
  with the Emirates' and Saudi Arabia's.

## Known gaps

- **Left out:** Bird in Caesarea, about 50 scooters with 5 new positions in
  9 hours; Dott in Givat Shmuel (6 to 11 scooters, one arrival in the day),
  Kiryat Ono (2 or 3) and Ramat HaSharon; Lime in Bat Yam and Ramat HaSharon;
  Bird in Petah Tikva and Pardes Hanna-Karkur, each with about one scooter a
  poll.
- **Bird `tel-aviv`:** a second Bird feed, in the registry, whose scooters
  are nearly all in `israel` under other ids (1,502 of 1,517 positions);
  reading both would count about 1,550 twice.
- **Open data:** data.gov.il has cycle networks only, and tel-aviv.gov.il
  answers HTTP 571 outside Israel.

## Recheck

```bash
node scripts/check-french-feeds.mjs --countries=IL
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone. After adding a
town in Gush Dan, add its outline to `data/town-outlines.json` and run
`node scripts/update-town-outlines.mjs`.
