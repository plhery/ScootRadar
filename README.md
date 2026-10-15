<p align="center">
  <img src="public/icon.svg" width="92" alt="ScootRadar logo">
</p>

<h1 align="center">ScootRadar</h1>

<p align="center">
  A friendly map for finding shared e-scooters in 371 cities in 24 countries.
</p>

<p align="center">
  <a href="https://github.com/plhery/ScootRadar/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/plhery/ScootRadar/ci.yml?branch=main&style=flat-square&label=CI" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2ea44f?style=flat-square" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/Cloudflare-Workers-f38020?style=flat-square&logo=cloudflare" alt="Cloudflare Workers">
</p>

<p align="center">
  <a href="https://scootradar.com/map"><strong>Open the live map →</strong></a>
</p>

<p align="center">
  <img src="docs/scootradar-map.png" width="390" alt="ScootRadar showing fictional demo scooters around Zürich on a phone">
</p>

ScootRadar puts the shared scooters of 21 providers on one map, in an
installable web app. It speaks German, French, Italian, Dutch, Norwegian,
Portuguese, Spanish, Icelandic and English. There is also a native SwiftUI app
for iPhone.

- **Near you.** Tap *Near me*, or search a city, a street or an address, and
  the dock at the bottom of the map counts the scooters nearby and says how
  fresh the data is. Search finds streets and addresses in every country the
  app covers, typed in the country's own script too.
- **One scooter.** Tap a marker for its battery and range, the walking time, an
  estimate of what a ride costs, directions, and a button that opens the
  provider's app. Opening the app does not reserve the scooter.
- **Your choices.** Filter by provider and by battery. In Settings, pick the
  language, an appearance that follows the system or stays light or dark, and a
  calm or a detailed map.
- **When something is off.** The app says so in plain words: a provider that is
  not sharing data, positions that are out of date, an area without scooter
  data and the closest cities that have it, location that is switched off and
  how to turn it back on.
- **On a desktop.** The providers form a legend, a scooter's card opens beside
  its marker, hovering a marker shows a short tip, and `/`, `L`, `+`, `−` and
  `Esc` work from the keyboard.

**Supported providers:** Bolt, Bird, Dott, Hopp, Lime, Voi, Pony, PubliBike / Velospot, Zeus, Beryl, Ryde, Hoppy, Ride Mobility, Yoio, Naolib Micromob', Elerent, 3electra, Spin, Veo, Lyft and SAHAM.

Switzerland's scooters come from its national open-data platform, the other
countries' from the feeds their operators and national platforms publish.
[DATA_SOURCES.md](DATA_SOURCES.md) lists each country's feeds and links its
audit; what is not covered yet, and why, is listed in
[Coverage gaps](docs/coverage-gaps.md).

## Run it locally

You need Node.js 26+ and npm.

```bash
git clone https://github.com/plhery/ScootRadar.git
cd ScootRadar
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). That is it—there are no required
environment variables, API keys, databases, or accounts.

To run the checks:

```bash
npm run check:dependencies
npm run check:providers
npm run check:api-contract
npm run lint
npm test
npm run test:e2e
npm run build
```

The dependency check fails on moderate or higher npm advisories. Its only
exception is [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
in the development-only `eslint-config-next → @next/eslint-plugin-next →
fast-glob → micromatch → braces@3.0.3` chain: upstream has no patched release,
and these tools read repository-controlled glob patterns during linting. The
exception also covers npm's inherited findings along that chain, but rejects
other advisories and any production dependency affected by this advisory.
Remove the exception when a patched upstream release is available.

Provider metadata shared by the web and iPhone apps is generated from
`data/providers.json`; the same generator includes the service areas of every covered country
coverage for native provider filters. Run `npm run generate:providers` after
changing the provider or service-area catalogs.
The scooter API wire types are generated for both clients from
`data/scooter-api.schema.json`; run `npm run generate:api-contract` after
changing the response contract.

### Adding a country

1. Write its catalog, `data/<adjective>-scooter-feeds.json` (`canadian`,
   `mexican`, `american`), and its guide, `docs/<adjective>-scooter-feeds.md`,
   with the evidence for each feed. A service area with no scooters part of
   the year, as Montréal each winter, says so with `seasonal`: `{ "from":
   "11-16", "until": "04-15", "timeZone": "America/Toronto" }`, its first day
   without scooters and the first day they are back, local dates (on a
   system, for each of its areas that sets none). Outside Europe each
   service area gives its `timeZone`, `"America/Chicago"`, by its name today:
   the feeds' own are older names (`US/Central`, `Asia/Tel_Aviv`) or wrong
   (`Etc/UTC`), and are never read.
   A seasonal pause is in its town's zone, and so is a night ban. Inside the window the map
   says "back in April" rather than that the operator is not sharing data,
   and the feed's alerts are muted; `src/lib/seasonalPauses.ts` explains.
   A feed whose plain stations are all where rides must end, as Lime's in
   Vancouver, says so with `"stationParking": true`, and the map shows them
   as required bays.
2. Add one entry to `data/countries.json`:
   - `code`, `continent` (`europe`, `north-america`, `asia`, the Middle East
     included, or `oceania`), `catalog` and `source`, the key of its feeds in
     the API's `meta.sources`;
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
   `anchor` is in one.

   Where towns touch, as in Gush Dan around Tel Aviv, a rectangle per town
   can't tell a scooter's town: each box takes in parts of its neighbours.
   List each town's municipal boundary in `data/town-outlines.json` (its
   city id and its OpenStreetMap relation) and run
   `node scripts/update-town-outlines.mjs`, which fetches and simplifies it.
   A scooter inside a town's outline then counts under that town, and a feed
   keeps no scooter inside the outline of a town of its country it doesn't
   serve; the generator checks that each outline holds its own town's centre
   and no other's.

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

## Deploy your own

The included configuration targets Cloudflare Workers through OpenNext. Give
your fork a Worker name and hostname in `wrangler.jsonc`. Deploy the persistent
cache with `server/Dockerfile` and a `/data` volume, and set
`SCOOTER_SNAPSHOT_API_URL` to that origin. Configure the same
`SCOOTER_SNAPSHOT_API_TOKEN` secret on the cache and Worker (see the initial
rollout order in [DEPLOY.md](DEPLOY.md)). Then:

```bash
npx wrangler login
npm run deploy
```

See [DEPLOY.md](DEPLOY.md) for rate limits, previews, production checks, and
rollback notes.

## iPhone app

Open `ios/ScootRadar.xcodeproj` in Xcode 26+, choose a development team, and
run the `ScootRadar` scheme. More details are in [ios/README.md](ios/README.md).

## Data, privacy, and contributing

Scooter locations come from the
[Open data platform mobility Switzerland](https://data.opentransportdata.swiss/en/dataset/sharedmobility),
address search comes from Geoapify (OpenStreetMap and other open data), with komoot's Photon (OpenStreetMap) standing in, and the web map is drawn from OpenFreeMap tiles of OpenStreetMap data.
The app stores no account or location history.

- [Data sources and attribution](DATA_SOURCES.md)
- [Privacy](PRIVACY.md)
- [Web and iOS analytics](docs/analytics.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

ScootRadar is open source under the [MIT License](LICENSE). Come build with us.

Published operator parking bays appear as **P** markers at street zoom. Tap a bay
for the provider, published parking requirement and directions. Closed return
locations are removed when the operator publishes that status. Coverage depends
on the operator's public feed; check its app before ending a ride.
