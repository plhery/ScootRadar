# ScootRadar on the App Store

Everything App Store Connect asks for the iOS app, ready to paste or to push
with the API. The listing text for each language is in `metadata/<locale>/`
(one file per field, in the layout `fastlane deliver` reads), the screenshots
in `screenshots/<locale>/`.

## The app record

| Field | Value |
| --- | --- |
| Name | per language, `metadata/<locale>/name.txt` (English: ScootRadar: E-Scooter Map) |
| Bundle ID | `com.plhery.scootradar` (team `HGC93X794T`) |
| SKU | `scootradar-ios` |
| Primary language | English (U.S.) |
| Primary category | Navigation |
| Secondary category | Travel |
| Price | Free, no in-app purchases |
| Support URL | https://scootradar.com/privacy#contact |
| Marketing URL | https://scootradar.com |
| Privacy policy URL | https://scootradar.com/privacy |
| Copyright | 2026 Paul-Louis Hery |
| Version | 1.0 |
| Devices | iPhone only (`TARGETED_DEVICE_FAMILY = 1`), iOS 26 or newer |
| Export compliance | `ITSAppUsesNonExemptEncryption = NO` in the build: the app only uses HTTPS through Apple's APIs |
| Sign-in for review | none: the app has no accounts |
| Content rights | The app shows third-party content: public vehicle feeds (GBFS) published by operators and public authorities under open licences, credited in Settings › About |

## Age rating

Every question of the current questionnaire is answered **None** or **No**:

- In-app controls: parental controls No, age assurance No.
- Capabilities: unrestricted web access **No** (the app has no browser; its few
  links open fixed pages in Safari), user-generated content No (passes stay on
  the iPhone), social media No, messaging and chat No, advertising No
  (operators' names and prices are not paid placements).
- Mature themes, medical or wellness, sexuality or nudity, violence,
  chance-based activities: None.

The result is **4+**.

## App Privacy

Data is collected; none of it is linked to the user or used for tracking. The
code and the backends say why each type is there:

| Data type | Purposes | Linked | Tracking | Where it comes from |
| --- | --- | --- | --- | --- |
| Location › Precise Location | App Functionality | No | No | The scooter API receives the bounds of the map on screen; when the map follows the rider their midpoint is the rider's position. They are kept only in a Sentry error report when the server fails (90 days). |
| Location › Coarse Location | Analytics, App Functionality | No | No | Umami derives an approximate place from the IP address (the IP itself is not stored); the address search sends the map centre rounded to about a kilometre to Geoapify. |
| Search History | App Functionality | No | No | Address text goes through the server to Geoapify (and Photon as a fallback), which keep it up to 24 hours. |
| Usage Data › Product Interaction | Analytics | No | No | Screen views and named actions to the self-hosted Umami (`docs/analytics.md`); off under Settings › About › Privacy. |
| Diagnostics › Other Diagnostic Data | Analytics, App Functionality | No | No | Generic failure events in Umami, and the server's own error reports in Sentry. |

Not collected: contact info, health, financial info, contacts, user content,
browsing history, identifiers (no IDFA, no persistent user ID), purchases,
sensitive info. `ios/ScootRadar/PrivacyInfo.xcprivacy` declares the same, with
no tracking domains, and the required-reason APIs the app calls: UserDefaults
(`CA92.1`) and the system uptime (`35F9.1`, for time between events). The app
links no third-party SDK.

## Screenshots

iPhone only, portrait, PNG without alpha, from the simulator with live data:

- `screenshots/<locale>/6.3/`: 1206×2622 (iPhone 17 Pro), the size App Store
  Connect requires (`APP_IPHONE_61` in the API);
- `screenshots/<locale>/6.9/`: 1320×2868 (iPhone 17 Pro Max), for the large
  iPhones (`APP_IPHONE_67`).

## Review notes

Paste into App Review Information › Notes:

```
ScootRadar shows the live positions of shared e-scooters and bikes from many
operators on one map. It has no accounts, no purchases and no ads, so no demo
account is needed.

To try it:
1. On launch the map shows the covered city nearest the device's time zone,
   with city totals. Tap "Near me" and allow location access to see the
   scooters around you. Where no operator publishes data (Cupertino, for
   instance), the bottom card says so and lists the closest covered cities,
   such as San Jose; tap one to go there.
2. Or tap the search bar and type a city, e.g. "Zürich" or "Lyon". Zoom in to
   street level to see one dot per scooter.
3. Tap a scooter: the card shows the walking time, battery or range, and a
   price estimate. "Directions" draws the walking route with Apple Maps'
   directions. "Open in <operator>" opens that operator's own app (or its
   website if the app isn't installed), where riders unlock and pay; ScootRadar
   itself rents nothing.
4. Filters (battery, operators) and Settings (appearance, map style, language,
   ride passes, privacy switch for anonymous usage statistics) open from the
   search bar.
5. Links to the map on scootradar.com open in the app, e.g.
   https://scootradar.com/map?origin=47.3769,8.5417 opens it on Zürich.

The positions come from public GBFS data feeds published by the operators and
public authorities (for example opentransportdata.swiss and
transport.data.gouv.fr) under open-data licences; Settings › About lists the
sources. ScootRadar is independent of the operators and says so in its
description. Location is used only while the app is open, to centre the map
and compute walking times; the app works fully without it (search a place).
```

Contact for review: the account holder's name, phone and email, entered by the
user in App Store Connect.

## Availability

Proposed from the market readiness summary of 16 October 2026 (the markets
lane's notes, outside this public repository):

- **At launch:** Switzerland, France and Iceland (ready), and Germany, Norway,
  Belgium, Portugal and Spain (almost ready: the map is useful in their main
  cities, with gaps a local rider would notice).
- **About a week later, once their feeds have a week of monitoring:** the
  United States, Canada, Israel and New Zealand.
- **Not yet:** the rest, where the main city is not on the map (United
  Kingdom without London, Italy, Sweden, Poland and others).

Whatever the storefronts, the map covers every country in the catalogue: a
rider from a launch country sees scooters abroad too.

## Build and upload

```sh
ASC_KEY_ID=<key id> ASC_ISSUER_ID=<issuer id> scripts/upload-ios-app.sh
```

It archives a Release build with automatic signing through the API key
(`~/.appstoreconnect/private_keys/AuthKey_<key id>.p8`), numbers it with the
commit count of HEAD and uploads it with `ios/ExportOptions.plist`. The build
then appears in TestFlight once Apple has processed it. It never submits for
review.

## Push the listing

```sh
export ASC_KEY_ID=<key id> ASC_ISSUER_ID=<issuer id>
node scripts/app-store-connect.mjs check
node scripts/app-store-connect.mjs listing --apply
node scripts/app-store-connect.mjs screenshots --apply
node scripts/app-store-connect.mjs availability --territories CHE,FRA,ISL,DEU,NOR,BEL,PRT,ESP --apply
node scripts/app-store-connect.mjs testflight --apply
```

Without `--apply` each command only prints what it would send; `check` also
measures every field against App Store Connect's limits. `listing` sends the
categories, the texts of each language, the URLs, the copyright, the age
rating answers and the review notes above. The app record itself, the App
Privacy answers, the EU trader status and the review contact are entered on
the web. Nothing here submits the version for review.

## Universal links

`public/.well-known/apple-app-site-association` gives
`HGC93X794T.com.plhery.scootradar` the map's links: `/map` with or without its
query, and the old links to the map at `/` that carry `origin`. The app claims
`applinks:scootradar.com` (`ios/ScootRadar/ScootRadar.entitlements`) and reads
the link in `ScooterMapLink`: a city's centre opens like the city chosen in the
search, any other point moves the map there, and `minBattery` sets the battery
filter. `src/lib/appSiteAssociation.test.ts` keeps the file, the entitlement
and the Xcode project in step.

Test in the simulator:

```sh
xcrun simctl openurl booted "https://scootradar.com/map?origin=47.3769,8.5417"
```
