# Holiday nights in the night bans: plan

Not built yet (29 October 2026). `data/rental-curfews.json` names a ban's
nights by weekday, so the extra nights 9 of its 45 towns close around
public holidays are left out: the map and the cache count them as open.
Each of those towns' `rule` says so. Holiday hours elsewhere, such as
LUUP's in Japan, have no calendar either (`server/luupApp.ts`).

## The nights left out

A night belongs to the evening it starts on, as elsewhere in the catalog.
E is Easter Sunday; Finland's Midsummer Eve is the Friday between 19 and 25
June. Evenings that fall on a Friday or Saturday are already covered.

| Town | Rule | Evenings to add | Hours |
| --- | --- | --- | --- |
| Stavanger | § 10: "natt til lørdag, natt søndag og natt helligdager" | 31 Dec, E−4, E−3, E, E+38, E+49, 24 Dec, 25 Dec | 00:00–05:00 |
| Tromsø | § 12: "natt til lørdager, søndager og helligdager" | the same | 23:00–06:00 |
| Tønsberg | § 6 d: 23:00 "natt til lørdag og natt til søndag, samt bevegelige helligdager", 01:00 on others | E−4, E−3, E, E+38, E+49 | 23:00–05:00 (01:00 already) |
| Helsinki | Vappu night | 30 Apr | 23:00–05:00 |
| Espoo, Vantaa | Vappu night | 30 Apr | 00:00–05:00 |
| Lahti | § 7: the nights that start on Maundy Thursday, 30 April and the day before Midsummer Eve | E−3, 30 Apr, Midsummer Eve −1 | 00:00–05:00 |
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
  named holidays are added.
- Bergen's next rule ([FOR-2026-06-17-1345](https://lovdata.no/dokument/LF/forskrift/2026-06-17-1345))
  closes holiday eves too, from its next permits (by 31 March 2028 at the
  latest).

## The change

1. **Data.** A night may list `"evenings"`, on which it holds besides its
   `days`: a fixed `"MM-DD"`, `"easter±N"`, or `"midsummerEve±N"` (Finland's).
   A night with other hours gets an entry of its own, with `"days": []`.
   Each of the nine towns gets its evenings, and the rule notes, the
   catalog's `about` and the docs that say holiday eves are left out change.
2. **Web and cache.** In `src/lib/rentalCurfews.ts`, `localClock` also gives
   the local date. `nightHolds` takes the evening's date, the day before when
   it takes the weekday before, and checks it against the year's evenings.
   Easter comes from the Gregorian computus, kept a year at a time. The cache
   follows through `activeCurfew` (`feedCurfewed`, `feedCurfewEnds`).
3. **Catalog.** `scripts/generate-provider-catalog.mjs` validates the tokens
   and emits them for iOS (`RentalCurfew` in `ScooterModels.swift`) and
   Android (`ScooterCatalog.kt`). Each gets the same calendar. Android gets
   PARITY rows for its lane.
4. **Tests**, on each platform:
   - Easter on 5 April 2026, 28 March 2027 and 16 April 2028.
   - Stavanger at 00:30 on Thursday 6 May 2027, Ascension Day, ends at 05:00.
   - Tromsø at 23:30 on Thursday 24 December 2026 ends at 06:00.
   - Tønsberg at 23:30 on Wednesday 24 March 2027, the eve of Maundy
     Thursday, ends at 05:00, but not at 23:30 a week earlier.
   - Helsinki at 23:30 on Thursday 30 April 2026.
   - Lahti at 00:30 on Friday 19 June 2026, Midsummer Eve.
   - The weekday before each stays open.

About half a day over the three platforms.
