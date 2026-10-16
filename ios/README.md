# ScootRadar — iOS app

The SwiftUI and MapKit app for ScootRadar, for iOS 26 or newer. It shows the same
live data as [scootradar.com](https://scootradar.com) and is meant to
behave and read like the website, with iOS controls and Liquid Glass. It uses the
bundle identifier `com.plhery.scootradar` and appears as **ScootRadar** when
installed.

## Run it on your iPhone

1. Install Xcode 26 or newer and open `ScootRadar.xcodeproj`.
2. Select the **ScootRadar** target, open **Signing & Capabilities**, and
   choose your team. Change the bundle identifier if Xcode asks for a unique
   one. A free Personal Team cannot sign the **Associated Domains** capability
   (links from scootradar.com); remove it there for such a build.
3. Connect the iPhone, enable Developer Mode if prompted, select it as the run
   destination, and press **Run**.
4. The app opens on a map of Switzerland with city totals. Tap **Near me** and
   allow location access to see the scooters around you, or search for a city or
   an address instead.

No API keys or third-party packages are required.

To rebuild and reinstall the app on a phone while renewing its development
provisioning profile (a year with the paid team `HGC93X794T`, seven days with a
free Personal Team), set `SCOOTRADAR_DEVICE_NAME` to the iPhone's name and run
the repository-level `scripts/refresh-ios-app.sh`.

## What the app shows

One screen: a full-screen Apple map, a search bar at the top, a dock at the
bottom and a locate button above the dock. Filters and Settings open as sheets
from the search bar.

**Map.** Zoomed out, each city shows its total; closer, clusters; from street
level, one dot per scooter in its provider's colour, at its exact place, larger
and brighter the shorter the walk to it. Scooters parked on one spot stand side
by side. The nearest scooter of each provider carries its name and the walking
time, and close up a dot is large enough for the provider's initials. Parking
bays appear as `P` from street level. Tapping a city or a cluster zooms in. The
map opens tilted by 20°, so the buildings stand up a little; two fingers tilt it
further or lay it flat. It is the least MapKit keeps: a smaller tilt is flat
again at the first zoom. A new install opens on the **Quiet** map style; a style
chosen in Settings is kept.

**Locate button.** Until the phone has been located once it is a blue **Near me**
pill; after that, a round button. Locating zooms the map to about 350 m across.
When location access was granted earlier, the app locates by itself on launch.

**Search bar.** It reads as a search field until you search a place, also once
you are located: the dot on the map says where you are. A searched place shows
in the bar with a button to clear it, and a place where no operator shares data
does not promise scooters.

**Search.** It opens on the field. Before you type: **Use my location**, the
places chosen in this session and the six nearest cities with scooters. Typing
two characters or more lists places with a second line and a **No data** tag
where no operator shares data; Return chooses the first. Streets and addresses
are found in every country the app covers, typed in the country's own script
too. A chosen place becomes the point walking times are measured from, until it
is cleared.

**Dock.** At street level, while you or the searched place are on the map, the
nearest of the scooters in view: how far, whose, and how long on foot. Tapping
that line opens its card. Otherwise the number of scooters nearby or on this
map. Under it, how fresh the data is (**Live**, **Updated 3 min ago**, **City
totals · refreshed hourly**; beside the nearest scooter **Live** is left out),
and one chip per provider, largest first. The chips remember each rider's own
combination between launches. When there is nothing to show, the dock says why:

- no operator shares data here: the three closest cities, with their distance;
- the filters hide everything: how many scooters, and buttons to show them all
  or edit the filters;
- the area is covered but empty: zoom out or move the map.

A provider is named as not sharing data only when one of its feeds failed, it
operates in the area on screen and none of its scooters is in view. City totals
name no one.

**Scooter card.** Selecting a dot or its name replaces the dock with the scooter:
the provider and three figures. They are the walking time and the distance from
you or from the searched place, then the price estimate for a ride of 5 to 30
minutes, or the battery or the range where there is no price; without a place
to walk from, the battery, the range and the price. What is not among the
figures is the line under the name. Under them, **Open in** the provider's app
and **Directions**. Opening the provider's app does not reserve the scooter.
Tapping the header centres the scooter in the part of the map the card leaves
visible.

**Parking bay card.** Selecting a `P` shows the bay, whether parking there is
required in this zone, and **Directions**.

**Walking route.** **Directions** on either card draws the way on foot in the
app, from the searched place or else from you. MapKit's walking directions find
it, with no other service asked. The map fits the whole route between the search
bar and the card, and a trail of blue dots draws itself from the start to the
scooter. The button becomes **Hide route**, and the card and the map's label
count the minutes along the route. As you walk, the part behind you disappears.
Leave the route, or have the scooter move, and a new one is found, at most every
15 seconds; the camera never follows you. Within 20 m the trail fades and the
card says **You’re there.** A walk of more than 10 km opens Apple Maps as before.
When no route or no location is found, the card says so and offers **Open in
Maps**. Closing the card or choosing another scooter or bay ends the walk; until
then the scooter stays selected wherever the map goes. When fresh data no longer
lists it, the card stays open with no actions and says someone may have taken it.

**Location problems.** A card under the search bar: **Location is off** with
**Open Settings** and **Search a place**; restricted on this device; or not
found, with **Try again**. It stays dismissed until the next attempt.

**Links from the website.** A link to the map on scootradar.com, such as a
city's **Open the map** in a guide, opens in the app when it is installed
(universal links: `public/.well-known/apple-app-site-association` and
`ScootRadar.entitlements`). `Models/ScooterMapLink.swift` reads it as the web
map does: a city's centre opens like the city chosen in the search, any other
point moves the map there, and `minBattery` sets the battery filter. The first
location fix after a link leaves the map where the link put it. Try it with
`xcrun simctl openurl booted "https://scootradar.com/map?origin=47.3769,8.5417"`.

**Filters.** One battery choice (Any, 30%+, 60%+, 80%+) and one provider list
with the count in view, or a note when a provider is not sharing data. **Reset**
is in the header and the button at the bottom says how many scooters the map
will show.

**Settings.** Three choices as tiles, the first two each under a small picture of
what it gives: the appearance (Automatic, Light, Dark; Automatic follows the
iPhone), the map style (Standard, Quiet, Satellite) and the language. Then the
passes per provider (free unlock, free minutes, optional expiry date), listed
for the providers that operate where the map is or that already have a pass;
and About: map and data credits, Privacy with the usage switch and the privacy
notice, and the source code on GitHub.

The app is translated into English, German, French, Italian, Dutch, Norwegian,
Portuguese, Spanish and Icelandic, and starts in the first of the iPhone's
languages it speaks. A language chosen in Settings changes the app's own text at
once; what iOS draws, such as the names on the map, follows the next time the
app opens. The app follows Dynamic Type up to
the accessibility sizes, labels map markers and search results for VoiceOver,
and respects Reduce Motion.

## Data and freshness

The app reads `https://scootradar.com/api/scooters` for the area on screen
and `https://scootradar.com/api/geocode` for search, to which it sends the
language it is shown in. An area across the 180° line, east of New Zealand, is
asked for in one request whose west is greater than its east, as the web map
does (`GeoBounds`). The endpoint is set in `Services/ScooterAPI.swift` if a
local or preview backend is needed.

The API covers Switzerland and the towns of the catalogs of the other countries
of `data/countries.json`, which `ScooterCityCatalog` lists and counts for the card
shown where there is no scooter data.
Prices are in the currency of the feed's tariff, where it supplies one. The backend loads
feeds for the visible map area only.

Refreshing is automatic while the app is in front: at the interval the server
names (a minute, an hour for city totals) or shortly before the data expires,
and at once when the app returns to the foreground with data that is due.
Individual scooter positions have a fifteen-minute maximum age, measured from the
source timestamp. Parking availability has its own five-minute expiry.
There is no refresh button. **Try again** appears only when something failed:

- a refresh failed and the data is still valid: the dock says so and keeps the
  markers;
- nothing has loaded yet: a banner under the search bar gives the reason;
- the data expired and the refresh after that failed: the map is cleared and the
  dock says the positions are out of date.

## What stays on the phone

The filters, the appearance, the map style, the language, the passes, the ride
length used for price estimates, the usage choice and whether the phone was
ever located are kept in the app's settings. Your location, the places you
searched and the text you typed are never stored; recent places live in memory
until the app closes.

## Usage analytics

Screen views and action events go to the same self-hosted Umami dashboard as the
website, with the `ios` tag. Settings › About › Privacy lets riders turn this
off. No address text, precise locations, vehicle IDs or advertising IDs are
sent. Simulators, previews and tests are excluded by default. See
[the analytics event catalog](../docs/analytics.md). An installed app only
changes when it is rebuilt and reinstalled; a web deployment does not update it.

## Code

- `Models/` — `ScooterModels.swift` holds the data types and the rules the dock,
  cards and status lines are built from; `ScooterFiltering.swift` the filters and
  counts; `ScooterMapLook.swift` the look of the map as plain rules: the size of
  a dot, the names and where they stand, scooters on one spot, the nearest
  scooter of the dock and the figures of the card. `WalkRoute.swift` holds the
  walking route: how far is left, where the rider is along it, when they left it
  or arrived, and the walk's states.
  `ProviderCatalog.generated.swift` (providers, service areas, covered
  cities) and `ScooterAPIContract.generated.swift` (the API's shape) are written
  by `npm run generate:providers` and `npm run generate:api-contract` from the
  repository's shared data; do not edit them by hand.
- `Services/` — the scooter API, the address search, MapKit's walking directions
  and analytics.
- `ViewModels/ScooterMapModel.swift` — the state of the screen: loading and
  refreshing, location, the selection, filters, passes, and what the dock shows.
- `Views/` — `ScooterMapScreen.swift` lays the screen out; `ScooterMapView.swift`
  is the MapKit map and its markers, `ScooterMarkerArt.swift` their pictures,
  `WalkTrailOverlay.swift` the dotted walking trail;
  `ScooterControls.swift` the dock, cards,
  sheets and notices; `SwissAddressSearch.swift` the search bar and panel.
- `en.lproj`, `de.lproj`, `fr.lproj`, `it.lproj`, `nl.lproj`, `nb.lproj`,
  `pt.lproj`, `es.lproj`, `is.lproj` — every string, keyed by its English text.
  A new string needs an entry in all nine.

The Xcode project lists its files one by one, so a new Swift file has to be added
to `ScootRadar.xcodeproj` as well.

## Tests

`ScootRadarTests` covers the models, the filters, both API clients, the screen
model and that the main states render. Run them in Xcode with **Product › Test**,
or from the repository root:

```sh
xcodebuild test -project ios/ScootRadar.xcodeproj -scheme ScootRadar \
  -destination 'platform=iOS Simulator,name=iPhone 17' CODE_SIGNING_ALLOWED=NO
```
