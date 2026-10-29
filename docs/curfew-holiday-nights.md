# Holiday nights in the night bans

Since 29 October 2026 the map and the cache close the nights 9 of
`data/rental-curfews.json`'s 45 towns close around public holidays, besides
their weekday nights. The iOS and Android apps don't yet (below). Holiday
hours elsewhere, such as LUUP's in Japan, have no calendar (`server/luupApp.ts`).

## The nights

A night belongs to the evening it starts on, as elsewhere in the catalog, and
a night's `dates` are the holiday evenings it starts on besides its `days`: a
fixed `"MM-DD"`, days from Easter Sunday (`"easter-4"`), or days from
Finland's Midsummer Eve (`"midsummerEve-1"`), the Friday from 19 to 25 June.
E is Easter Sunday below. Evenings that fall on a Friday or Saturday are
closed already, so they aren't listed.

| Town | Rule | Dates | Hours |
| --- | --- | --- | --- |
| Stavanger | § 10: "natt til lørdag, natt søndag og natt helligdager" | 24 Dec, 25 Dec, 31 Dec, E−4, E−3, E, E+38, E+49 | 00:00–05:00 |
| Tromsø | § 12: "natt til lørdager, søndager og helligdager" | the same | 23:00–06:00 |
| Tønsberg | § 6 d: 23:00 "natt til lørdag og natt til søndag, samt bevegelige helligdager", 01:00 on others | E−4, E−3, E, E+38, E+49 | 23:00–05:00 |
| Helsinki | Vappu night | 30 Apr | 23:00–05:00 |
| Espoo, Vantaa | Vappu night | 30 Apr | 00:00–05:00 |
| Lahti | § 7: weekday holidays "kuten" (such as) the nights that start on Maundy Thursday, 30 April and the day before Midsummer Eve | E−3, 30 Apr, Midsummer Eve −1 | 00:00–05:00 |
| Porvoo | Vappu, Midsummer and New Year's Eve | 30 Apr, 31 Dec (Midsummer night is a Friday's) | 00:00–05:00 |
| Turku | 2.5: weekday holidays "kuten" (such as) Vappu Eve, May Day, Midsummer Eve, Midsummer Day and New Year's Eve | 30 Apr, 1 May, 31 Dec (the two Midsummer nights are a Friday's and a Saturday's) | 00:00–05:00 |

- Norway's helligdager are those of the helligdagsloven: Sundays, New Year's
  Day, Maundy Thursday, Good Friday, Easter Sunday and Monday, Ascension Day,
  Whit Sunday and Monday, Christmas Day and Boxing Day. 1 and 17 May are
  "høytidsdager" under another law, so they stay out.
- Tønsberg's "bevegelige helligdager" are read as the nights into the movable
  holidays, as its Saturday and Sunday nights are.
- Turku's list is open ("such as"), and its nights are read as Friday's to
  Saturday's is ("pe–la"): Vappu Eve's night runs into May Day. Only the five
  named holidays are closed.
- Lahti's list is open too ("arkipyhinä kuten", on weekday holidays such as):
  only its three named nights are closed.
- Bergen's next rule ([FOR-2026-06-17-1345](https://lovdata.no/dokument/LF/forskrift/2026-06-17-1345))
  closes holiday eves too, from its next permits (by 31 March 2028 at the
  latest).

`src/lib/rentalCurfews.ts` reads them (`holidayEvening`, with Easter from the
Gregorian computus), and the cache follows through `activeCurfew`
(`feedCurfewed`, `feedCurfewEnds`). Its tests hold Easter in 2026–2028, every
date in the catalog, and the nights above on dated cases: Ascension Day 2027
in Stavanger, Christmas Eve 2026 in Tromsø, the eve of Maundy Thursday 2027 in
Tønsberg, Vappu 2026 in Helsinki and Espoo, Midsummer 2026 in Lahti and New
Year's Eve 2026 in Turku, each against the same night a week earlier.

## Follow-ups

- **Android** (row LOG-420 of the Android lane): `RentalCurfew.Night` in
  `ScooterCatalog.kt` takes the dates, which the generator (`--android`) adds
  to catalog.json's curfews, and holds on those evenings with the same
  calendar, under the same dated tests. The first night it misses is Christmas
  Eve 2026 in Stavanger and Tromsø.
- **iOS**, once ScootRadar 1.2.1 is off hold: the same in `RentalCurfew`
  (`Models/ScooterModels.swift`), with `swiftCurfews` in
  `scripts/generate-provider-catalog.mjs` emitting the dates.
