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
| Version | 1.1.0 |
| Devices | iPhone and iPad (`TARGETED_DEVICE_FAMILY = "1,2"`), iOS 26 or newer. iPhones keep the app upright; iPads turn it every way |
| Export compliance | `ITSAppUsesNonExemptEncryption = NO` in the build: the app only uses HTTPS through Apple's APIs |
| Sign-in for review | none: the app has no accounts |
| Content rights | The app shows third-party content: the operators' public vehicle feeds (GBFS), public authorities' open data and, where an operator publishes no feed, the vehicle map of its own rider app, credited in Settings › About |

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
| Usage Data › Product Interaction | Analytics | No | No | Screen views and named actions to the self-hosted Umami (`docs/analytics.md`); on by default, off under Settings › About › Privacy. |
| Diagnostics › Other Diagnostic Data | Analytics, App Functionality | No | No | Generic failure events in Umami, and the server's own error reports in Sentry. |

Not collected: contact info, health, financial info, contacts, user content,
browsing history, identifiers (no IDFA, no persistent user ID), purchases,
sensitive info. `ios/ScootRadar/PrivacyInfo.xcprivacy` declares the same, with
no tracking domains, and the required-reason APIs the app calls: UserDefaults
(`CA92.1`) and the system uptime (`35F9.1`, for time between events). The app
links no third-party SDK.

## Screenshots

Portrait, PNG without alpha, one set for each listing language:

- `screenshots/<locale>/6.9/`: 1320×2868 (iPhone 17 Pro Max), for the large
  iPhones (`APP_IPHONE_67` in the API);
- `screenshots/<locale>/6.3/`: the same frames scaled to 1206×2622 (iPhone 17
  Pro), the size App Store Connect requires (`APP_IPHONE_61`);
- `screenshots/<locale>/13/`: 2064×2752 (iPad Pro 13-inch), which App Store
  Connect requires since the app runs on iPad (`APP_IPAD_PRO_3GEN_129`): the
  same seven frames, made on 23 October 2026, on a drawn iPad with the panel
  beside the map, the headlines saying "iPad" where the iPhone's say "iPhone".

Each frame, made on 20 October 2026, sets a headline on blue above a drawn
iPhone showing the app with live data, and lifts the part of the screen the
headline is about forward at full size. The headlines are in
`screenshots/captions.json`, written for each language rather than
translated. Every language opens on the providers and shows the pier second:

- every provider around Zürich main station (location 47.3763,8.5395), with
  the providers' row lifted;
- the pier in 3D, from `-ScreenshotCamera "34.00980,-118.49600,700,50,230"`
  with the location at 34.01016,-118.49496 and the flat terrain users get;
- the price on a Voi scooter's card;
- the route to a scooter 3 to 5 minutes' walk away;
- the battery filter at 60%+ (set it back to Any afterwards: the app keeps
  it);
- the same street at night;
- Europe at night, with each city's count.

To take them again, launch the app in each language with a region whose units
and words fit (`-AppleLanguages "(de)" -AppleLocale de_CH`): `en_US` (feet),
`en_GB` (yards), `de_CH`, `fr_CH`, `it_CH`, `es_ES`, `es_MX` (where the app
says "scooter"), `nl_NL`, `nb_NO` and `pt_PT`. Set the simulator's location
(`xcrun simctl location <device> set 47.3763,8.5395`) and the status bar
(`xcrun simctl status_bar <device> override --time 9:41 …`), and save each
capture without alpha (`ffmpeg -i shot.png -pix_fmt rgb24 out.png`).

A Debug build opens on a chosen view, such as a landmark in 3D, with
`xcrun simctl launch <device> com.plhery.scootradar -ScreenshotCamera
"37.79554,-122.39400,650,62,55"`: the point looked at, the camera's distance
from it in metres, the pitch and the heading. `-ScreenshotTerrain realistic`
draws the ground in 3D, which the app itself does not, so the store frames
leave it out. With location allowed, the simulator's location then gives the
walking times and the map stays where the camera put it. Release builds
leave both arguments out.

`-ReviewPromptDue YES` makes a Debug build ask for a rating on its first fresh
feed, as on the return from a ride, so that the simulator shows Apple's rating
prompt over the map (development builds always show it; TestFlight never does).
Release builds leave it out.

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
   directions. Where the operator's feed gives a rental link (Voi in Zürich,
   for instance), "Open in <operator>" opens that operator's own app (or its
   website if the app isn't installed), where riders unlock and pay; ScootRadar
   itself rents nothing.
4. Filters (battery, operators) and Settings (appearance, map style, language,
   ride passes, privacy switch for anonymous usage statistics) open from the
   search bar.
5. Links to the map on scootradar.com open in the app, e.g.
   https://scootradar.com/map?origin=47.3769,8.5417 opens it on Zürich.

The positions come from the operators' public GBFS feeds and public
authorities' open data (for example opentransportdata.swiss and
transport.data.gouv.fr) and, where an operator publishes none, from the
vehicle map its own rider app shows; Settings › About lists the sources.
ScootRadar is independent of the operators and says so in its description.
Location is used only while the app is open, to centre the map and compute
walking times; the app works fully without it (search a place).
```

Contact for review: the account holder's name, phone and email, entered by the
user in App Store Connect.

## Availability

The storefronts are the account holder's choice, set with the `availability`
command below or on the web (Pricing and Availability).

Since 26 October 2026 the app is offered in 126 of Apple's 175 storefronts.
That is every storefront except the 49 where shared scooters or bikes are
known to run but the map shows them poorly or not at all, so a local rider
would find it thin or empty there. Countries with no known shared scooters or bikes
are in, since there is nothing there for the map to miss. "New territories"
stays off, so Apple adds no storefront on its own.

Left out, from the markets lane's readiness summary (in its notes, outside
this public repository), as of 24 October 2026:
- **Europe, thin on the map:** Portugal (Lisboa ends shared scooters by the
  end of 2026, and Bolt publishes no feed), Greece, Latvia, Croatia, Cyprus,
  Ukraine, Denmark (no Copenhagen), Czechia and Romania.
- **Europe, nothing on the map:** the Netherlands, Slovakia, Bulgaria,
  Lithuania, Estonia, Slovenia, Luxembourg, Ireland and Russia.
- **Middle East and Africa:** the United Arab Emirates and Saudi Arabia (one
  or two operators of several on the map), Qatar, Kuwait, Oman, Bahrain,
  Jordan, Egypt, South Africa and Rwanda.
- **Asia:** China, Taiwan, Hong Kong, Singapore, Malaysia, Indonesia,
  Thailand, the Philippines, Vietnam, India, Armenia, Kyrgyzstan, Uzbekistan
  and Mongolia.
- **Oceania and the Americas:** Australia, Mexico, Colombia, Peru,
  Argentina, Costa Rica and the Dominican Republic.

Added on 24 October 2026, once the app maps put them at "Almost": the United
Kingdom, Italy, Sweden, Finland, Austria and Hungary, Japan, Brazil and Chile.

Added on 26 October 2026, once version 1.1.0 knew their operators: South
Korea, Turkey, Poland, Kazakhstan, Azerbaijan, Georgia and Belarus.

A country joins once the map covers it, by adding its code to the list:

```
--territories AFG,AGO,AIA,ALB,ATG,AUT,AZE,BEL,BEN,BFA,BHS,BIH,BLR,BLZ,BMU,BOL,BRA,BRB,BRN,BTN,BWA,CAN,CHE,CHL,CIV,CMR,COD,COG,CPV,CYM,DEU,DMA,DZA,ECU,ESP,FIN,FJI,FRA,FSM,GAB,GBR,GEO,GHA,GMB,GNB,GRD,GTM,GUY,HND,HUN,IRQ,ISL,ISR,ITA,JAM,JPN,KAZ,KEN,KHM,KNA,KOR,LAO,LBN,LBR,LBY,LCA,LKA,MAC,MAR,MDA,MDG,MDV,MKD,MLI,MLT,MMR,MNE,MOZ,MRT,MSR,MUS,MWI,NAM,NER,NGA,NIC,NOR,NPL,NRU,NZL,PAK,PAN,PLW,PNG,POL,PRY,SEN,SLB,SLE,SLV,SRB,STP,SUR,SWE,SWZ,SYC,TCA,TCD,TJK,TKM,TON,TTO,TUN,TUR,TZA,UGA,URY,USA,VCT,VEN,VGB,VUT,XKS,YEM,ZMB,ZWE
```

Apple has no storefront for Bonaire (Caribbean Netherlands), so it cannot be
ticked. Whatever the storefronts, the map covers every country in the
catalogue: a rider from an included country sees scooters abroad too, and so
does anyone in Bonaire who has the app from another store.

## Build and upload

```sh
ASC_KEY_ID=<key id> ASC_ISSUER_ID=<issuer id> scripts/upload-ios-app.sh
```

It archives a Release build with automatic signing through the API key
(`~/.appstoreconnect/private_keys/AuthKey_<key id>.p8`), numbers it with the
commit count of HEAD and uploads it with `ios/ExportOptions.plist`. Without the
two variables it signs and uploads with the Apple account signed in to Xcode.
The app's record must exist in App Store Connect first, or the upload fails
with "App record not found". The build then appears in TestFlight once Apple
has processed it. It never submits for review.

Signing was checked on 16 October 2026 with the Xcode account: the archive and
an App Store export (build 391) came out signed for team `HGC93X794T` with a
cloud-managed Apple Distribution certificate, an App Store profile valid for a
year and the `applinks:scootradar.com` entitlement.

## Push the listing

```sh
export ASC_KEY_ID=<key id> ASC_ISSUER_ID=<issuer id>
node scripts/app-store-connect.mjs check
node scripts/app-store-connect.mjs listing --apply
node scripts/app-store-connect.mjs screenshots --apply --replace
node scripts/app-store-connect.mjs availability --territories <the list under Availability> --apply
node scripts/app-store-connect.mjs testflight --apply
```

Without `--apply` each command only prints what it would send; `check` also
measures every field against App Store Connect's limits. `listing` sends the
categories, the texts of each language, the URLs, the copyright, the age
rating answers and the review notes above, and attaches the newest processed
build of the version when none is. `screenshots --replace` deletes each set's
screenshots before uploading the folder's, so the listing shows only those.
The app record itself, the App
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

## Links from the website

Every link from scootradar.com to the App Store is a campaign link, built by
`appStoreUrl()` in `src/lib/appStore.ts`: the provider token `pt=129628155`
and a campaign `ct` for where it sits, which App Analytics counts under
Sources › Campaigns.

- `web-hero` and `web-closing`: the landing page's two **Get the iPhone app**
  buttons.
- `web-qr`: the QR code beside the first one on a computer, drawn when the site
  is built (`npm run generate:app-store-qr`; `src/lib/appStore.test.ts` reads
  it back).
- `web-map-settings` and `web-map-location`: the map on an iPhone, in
  Settings › About and at the end of the help to turn location back on.
- `web-banner`: Safari's Smart App Banner, the `apple-itunes-app` tag of every
  page. Its `app-argument` is the page's address; the Worker writes in the one
  each page was opened with, and the service worker does the same for the map
  it keeps, so the banner's **Open** lands on the link's place
  (`ScooterMapLink`).
