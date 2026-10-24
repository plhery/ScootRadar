# Adding a country

1. Write its catalog, `data/<adjective>-scooter-feeds.json` (`canadian`,
   `mexican`, `american`), and its guide, `docs/<adjective>-scooter-feeds.md`,
   with the evidence for each feed. A service area with no scooters part of
   the year, as Montréal each winter, says so with `seasonal`: `{ "from":
   "11-16", "until": "04-15", "timeZone": "America/Toronto" }`, its first day
   without scooters and the first day they are back, local dates (on a
   system, for each of its areas that sets none); `"until": "clear"` where
   they come back once the streets are clear, on no set day, as in Skien.
   Outside Europe each service area gives its `timeZone`, `"America/Chicago"`, by its name today:
   the feeds' own are older names (`US/Central`, `Asia/Tel_Aviv`) or wrong
   (`Etc/UTC`), and are never read.
   A seasonal pause is in its town's zone, and so is a night ban. Inside the window the map
   says "back in April" rather than that the operator is not sharing data,
   and the feed's alerts are muted; `src/lib/seasonalPauses.ts` explains.
   A feed whose plain stations are all where rides must end, as Lime's in
   Vancouver, says so with `"stationParking": true`, and the map shows them
   as required bays. A feed whose stations hold scooters its vehicle status
   does not list, as Divvy's in Chicago, says so with `"stationScooters":
   true`, and each scooter its station status counts is shown at its station.
2. Add one entry to `data/countries.json`:
   - `code`, `continent` (`europe`, `north-america`, Central America and the
     Caribbean included, `asia`, the Middle East included, `oceania`, or
     `south-america`),
     `catalog` and `source`, the key of its feeds in the API's `meta.sources`;
   - `names` in the nine languages of the apps, and the `searchWords` that,
     typed after a city, say which country is meant: written as the search
     reads them (`src/lib/searchText.ts`), lower case, without accents and
     with one space between two words, in any script: `united kingdom`,
     `ελλαδα`, `ישראל`, `الامارات` (not `الإمارات`). No word that is also a
     common word of names: `ksa` for Saudi Arabia, never `sa`;
   - `anchor`, where its total stands zoomed out, with an `anchorNote` saying
     why there;
   - `featuredCities`, the city ids the landing page names;
   - `credits`: its `attribution` in the `X-Mobility-Data-Source` header, the
     providers its GBFS feeds are credited for (`gbfs`, one line per
     continent), and the `links` a licence asks for;
   - `pricesBeforeTax: true` where ride prices are given before sales tax,
     as in the US and Canada: there a plan's `is_taxable` shows "+ tax".
     Leave it out where prices include VAT or GST, which is all `is_taxable`
     means elsewhere;
   - `regions`, for a country whose towns share names across states or
     provinces, as in North America: their `list` (`code`, `name`, and
     `names` where a language of the apps writes one otherwise), whether
     `showInCityNames`, and whether its `totals`, zoomed out, are its
     regions' rather than one for the country; each region then has an
     `anchor` (and an `anchorNote`). Every service area of its catalog has a
     `region` (or its system has one for all its areas), and its cities' ids
     include it: `us:or:Portland`, shown as "Portland, OR".

   A country outside Europe also says how it writes an address, in
   `ADDRESS_FORMATS` of `src/app/api/geocode/addressFormats.ts`: whether the
   house number comes first, its town line ("Sydney NSW 2000"), and its
   postcode as riders type it after the town; `addressFormats.test.ts` fails
   until it does. The search looks for places within its continent's boxes,
   `CONTINENT_BOXES` in `src/app/api/geocode/route.ts`, once a country's
   `anchor` is in one. Where the nearest box would take in countries the map
   doesn't cover, give the country a box of its own, as Central America's and
   Bonaire's keep Colombia and Venezuela out.

   Where towns touch, as in Gush Dan around Tel Aviv, around Lille or in west
   Los Angeles, a rectangle per town can't tell a scooter's town: each box
   takes in parts of its neighbours. So too where one town's feed reaches into
   another, as Flamingo's Porirua feed does into Tawa, which is in Wellington.
   List each town's municipal boundary in `data/town-outlines.json` (its city
   id and where to read it: an OpenStreetMap relation, a Norwegian kommune at
   Kartverket, a British district at the ONS or an American place's GEOID at
   the Census Bureau) and run `node scripts/update-town-outlines.mjs`, which
   fetches and simplifies it. A scooter inside a town's outline then counts
   under that town, under the smaller where two nest, as Roubaix's inside
   Lille Métropole's; and a feed keeps no scooter inside the outline of a town
   of its country where its operator runs no service. The generator checks
   that the smallest outline holding each covered town's centre is that
   town's own. If a feed reaches into a town where its operator has no area,
   give the feed an area there, as Ryde Stavanger's in Sandnes, or its
   scooters there are dropped.

   The generator fails when a city's merged bounds are wider than 150 km, as
   two towns of one name merged into one would be; a city that really is wider
   is listed in `WIDE_CITIES` in `scripts/country-catalog.mjs`, with the reason.

   Countries are listed in the order they were added; `landingFirst` keeps
   Switzerland and its neighbours first on the landing page.
3. Run `npm run generate:providers`. It checks the entry and writes
   `src/generated/countries.ts`, `src/generated/countryCatalogs.ts` and the
   iOS `ProviderCatalog.generated.swift`. `node scripts/check-french-feeds.mjs
   --countries=<code>` checks the feeds live; `npm run check:catalogs` checks
   every country.

A new provider still needs its entry in `data/providers.json` and its link
policy in `src/lib/rentalLinks.ts` and the iOS `ScooterRentalLinkPolicy`; a
night ban goes in `data/rental-curfews.json`.

Lime rider-map catalogs are generated from reviewed publisher service polygons
in `data/lime-app-regions.json`. Add markets there and retain their source
documents; `npm run generate:providers` creates the complete local tile groups
and preserves any public GBFS systems in those catalogs. See
[Lime collection](lime-app-map.md) before registering new groups.
