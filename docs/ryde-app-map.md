# Ryde map readers and rider app investigation

**Ryde's scooters in Bergen are on the map since 28 October 2026**, from
the map Skyss's travel app shows signed out. The scooter cache reads it with
[`server/skyssApp.ts`](../server/skyssApp.ts), as the system
`ryde_no_app_bergen`: a round of the whole city found 4,733 scooters in 30
requests on 27 October, and 4,679 in 27 at midnight. See
[the production reader](#the-production-reader).

Ryde's own authenticated API remains a separate, unfinished path. Its
Mac-compatible iPhone app opens its signed-in map, but exporting the keys
needed for independent proofs and decryption has not succeeded.
On 1 November a separate diagnostic companion on the physical Pixel obtained
a Google Integrity token for a fresh Ryde challenge and subsequently a
reCAPTCHA token with the working RideMovi package-context setup. Normal Google
browser sign-in subsequently returned a verified identity credential without SMS,
but the first Ryde exchange rejected app/device attestation. Its authenticated
session and live map remain unverified; see [the companion test](#physical-pixel-companion-test-1-november-2026).

Checked 24 and 27 October 2026 against the official Android `com.ryde_android`
6.1.0, build 718. APK signatures match the publisher's
[app-link association](https://www.ryde-technology.com/.well-known/assetlinks.json).
The user subsequently signed in with Apple on an iPhone and on this Mac.
The official Mac-compatible iPhone app opens its map and has a successful
authenticated map response in its local HTTP cache. Independent retrieval and
decryption through that direct rider API remain unverified; Skyss's guest
route below needs neither that session nor its keys, and the direct API is
needed only for Ryde's towns Skyss does not show.

## Current status and how to resume

Deferred at the user's request on 24 October 2026 and resumed at their
request on 27 October. The emulator is still rejected before phone
verification. Request signing has been reproduced, but a working rider
session could not be obtained there. The user completed Apple sign-in on a
physical iPhone and reported that its map opens. They then installed the
official app on this Apple silicon Mac and completed Apple sign-in there;
its signed-in map was observed through native UI automation.
No additional SMS was requested during the 27 October recheck.

Bergen is covered through Skyss since 28 October 2026, at the user's request
of 27 October, and Larvik through Entur's `rydelarvik` since 31 October. The
direct rider route, for Drammen, Kristiansand and Göteborg, still requires independent proof generation, response decryption
and session-renewal tests. A successful app login alone does not establish
that its session can be used by a server.

The `ScootRadar_Ryde_Play` AVD is retained for reference. The fresh verified
APK, decompiled sources and private diagnostics are under
`~/.cache/scootradar/rider-auth/ryde/`, outside Git. Bolt's and Bird's saved
rider sessions are separate.

### Physical Pixel root compatibility, 2 November 2026

A read-only check of the connected Pixel 9 (`tokay`) found Android 17 build
`CP3A.261005.005`, security patch `2026-10-05` and kernel
`6.1.162-android14-11-g9dd05ae3a1de-ab16261587`. Its bootloader is locked,
verified boot reports `green`, and the ADB shell has no available `su` command.

[Keystork](https://github.com/DavidBuchanan314/keystork) describes obtaining Play
Integrity tokens in an installed app's identity. It requires unrestricted root;
useful device attestation additionally depends on retaining the locked bootloader
and stock verified boot. This remains an untested Ryde approach, not evidence of
accepted attestation or registration of independent software keys.

The current [Root-My-Pixel profiles](https://github.com/alex193a/Root-My-Pixel/blob/03a6f7642bf0972e36c338829a02ba61d149105b/app/src/main/assets/profiles.json)
include only two Pixel 9 payloads: `CP2A.260705.006` for kernel
`6.1.157-android14-11` and `AD1A.240905.004` for `6.1.75-android14-11`.
Its [profile resolver](https://github.com/alex193a/Root-My-Pixel/blob/03a6f7642bf0972e36c338829a02ba61d149105b/app/src/main/kotlin/com/alex193a/rootmypixel/data/repository/PayloadRepositoryImpl.kt)
matches device codename and kernel-release prefix; neither matches this phone.
Sharing the `android14-6.1` KMI does not satisfy that check. No root payload was
installed or executed, and no official-app Integrity token or Ryde login was
requested during this check.

A subsequent check of the exact `9dd05ae3a1de` kernel source found both
completed public Pixel root chains patched. GhostLock/IonStack's
`CVE-2026-43499` path contains the [`waiter_task` fix](https://android.googlesource.com/kernel/common/+/9dd05ae3a1de/kernel/locking/rtmutex.c#1473),
and FFWheel's `CVE-2026-43049` path contains the [`ret = 0` fix](https://android.googlesource.com/kernel/common/+/9dd05ae3a1de/drivers/hid/hid-logitech-hidpp.c#4274).
Joyride's source fix is absent, but its [public documentation](https://github.com/JingMatrix/pixel-ksu-root/blob/main/cves/cve-2026-93189-joyride/README.md)
reports no controlled read/write or usable capability; it is a research lead,
not a root route. Other published tools do not verify this exact `tokay` kernel,
and generating GhostLock offsets would not make its patched trigger usable.

The Android experiment therefore needs a new completed exploit chain for this
exact kernel or another owned device with a supported profile while retaining
locked, stock verified boot. Unlocking or downgrading this phone is not part of
the test. The existing Ryde session is unchanged.

## Physical Pixel companion test, 1 November 2026

A diagnostic APK, `com.scootradar.rydetest`, was built and installed on the
user-authorized physical Pixel 9 running Android 17. Its source and APK stay
under `~/.local/share/scootradar/ryde-login/`, outside Git. This first stage
has no SMS, login, ride or payment endpoint.

The helper generated two separate software P-256 keypairs in its own private
storage, reloaded their PKCS8/X509 encodings, and passed local ECDSA signing
and ECDH/HKDF/AES-GCM round-trip checks on synthetic data. This establishes
local key usability; server registration of those keys remains unverified.

Its first `POST /appRyde/getAttestChallenge`, with `purpose=login`,
`platform=2`, its own stable device id, `timestamp` and `timeSign`, returned
JSON status 407. Static inspection reconfirmed the signing calculation against
the official APK's native library. A fresh host-side challenge succeeded using
`User-Agent: Ryde/6.1.0 Android`. Adding that header to the helper's otherwise
unchanged request made the physical-phone challenge succeed too.

The helper then called Google's official **classic** Play Integrity API with
Ryde's server nonce and the public project number from the inspected app.
Google issued an opaque verification token. It was saved only in the helper's
private storage, and was neither displayed nor logged. No SMS was requested.

Token issuance does not reveal Google's verdict or establish Ryde's server
acceptance. A fresh authorized login, DPoP key registration, independent map
read, live response decryption and renewal still need testing before a direct
Ryde collector can be enabled. Existing public-feed and Skyss coverage
continues independently.

The user's existing Google login works in the official Android app. A normal
Credential Manager check in the companion failed before returning a Google
credential or making a Ryde login request. Its callback reported
`[16] Account reauth failed`; the Google authentication provider log identified
the cause as an Android application not registered for that OAuth client
(package name and signing-certificate fingerprint). This is a companion
registration requirement controlled by Ryde, not evidence that the user's
Google account or the physical device failed verification. The official
app's signed-in session was preserved.

The user supplied a phone number for the fallback but reported that the
official app's phone path said “too many attempts for this device.” Further
phone attempts are on hold. The message does not establish a 24-hour duration,
and Ryde's [login help](https://www.ryde-technology.com/help/login-issues)
does not specify one. No SMS or Ryde phone-login request has been sent by
the companion.

A separate no-SMS check used Google's reCAPTCHA Android SDK 18.9.3, matching
the inspected official APK, with its public Android site key and `send_sms`
action. The companion used its own package identity. Google returned
`INVALID_PACKAGE_NAME`, “Package name not allowed,” without issuing a token.
No Ryde phone endpoint was called. Google's
[error-code reference](https://docs.cloud.google.com/recaptcha/docs/reference/android/com/google/android/recaptcha/RecaptchaErrorCode)
identifies this as a site key that does not support the calling package.

That initial result did **not** establish that a companion could not obtain
verification. A follow-up reproduced the working RideMovi helper's setup:
an `Application` context reports the installed official package name to the
reCAPTCHA SDK, with a manifest `queries` entry allowing its public package
metadata to be read. Without that entry, Cronet failed locally with
`Cannot determine package version`; after adding it, the physical Pixel
obtained a token for `send_sms`. This is an SDK request-context override;
the companion's installed package, signing certificate and UID are unchanged.
No Google OAuth retry, Ryde phone endpoint or SMS request was made.

The configuration captured on 1 November contains `smsDeviceRequests: 8`
and `smsDeviceMinutes: 1440`. Those settings are consistent with an
eight-request, 24-hour device window, but do not reveal the affected device's
remaining wait or exact reset policy. Keep phone attempts on hold until that
window can be respected; do not change device IDs to evade it.

Private offline protocol helpers now cover the companion key-file format,
phone normalization, native request signing, DPoP JWT encoding, JWK
thumbprints and ECIES decryption. Five offline checks passed, including the
known native signature vector, a verifiable JOSE signature and rejection of
wrong-key or corrupted encrypted envelopes. These are preparation, not live
authentication or map evidence.

### Google browser sign-in and Ryde exchange

A later check on 1 November established that the native Credential Manager
failure does not block every Google login path. A normal OpenID sign-in using
Ryde's public web client and its registered Firebase callback returned a Google
ID token in regular Chrome, using the authorized account's saved passkey and
no SMS. The embedded browser was rejected by Google as an unsupported browser.

The local handoff verified Google's RS256 signature against its published keys,
issuer, audience, original state and nonce, expiration, verified email and the
requested account. The Firebase handler displayed a missing-initial-state error
because it had not started this flow; the returned Google credential passed the
independent checks. The credential stayed in a mode-0600 file outside Git and
was deleted after the blocked exchange. Temporary browser tabs and local transfer servers were
closed afterward.

One fresh companion challenge and classic Integrity token, only five seconds
old when exported, were submitted to `/appRyde/userLoginByGoogle` with that
Google credential, the same companion device id, separate software signing and
encryption keys, an ES256 DPoP proof, raw public `encJwk`, app metadata and native
`timeSign`. The location fields used the official client's unavailable-location
fallback, `1,1`. Ryde returned HTTP/JSON 403, `APP_ATTEST_INVALID`, with a generic
official-app/supported-device message. No rider token was issued. This response
does not expose the individual integrity verdict or establish whether Ryde
validated the Google credential before rejecting attestation.

A single follow-up passed the same installed-official-package context used
successfully for reCAPTCHA to the classic Integrity SDK. Google rejected it
locally with SDK code `-7`, `APP_UID_MISMATCH`: the caller UID does not match
the installed package. This is a different protection from reCAPTCHA's
package-context check; that earlier success does not transfer to Integrity.
No second Ryde login or SMS request followed. See Google's
[Integrity error reference](https://developer.android.com/google/play/integrity/reference/com/google/android/play/core/integrity/model/IntegrityErrorCode#APP_UID_MISMATCH).

Google authentication without SMS is therefore demonstrated. Independent Ryde
login remains blocked at app/device verification, which a phone-code login also
uses. Do not request an SMS merely to retry the same unresolved verification
step. After obtaining an accepted session, validate a nonempty read in a missing
city such as Drammen, independent decryption, identity, coverage limits,
successful renewal and server compatibility before enabling a direct collector.

## Skyss's guest map: Skyss / Tet / Ruter

Skyss's [official travel information](https://www.skyss.no/reise/nyttig-reiseinformasjon/)
and [app FAQ](https://www.skyss.no/en/tickets-and-prices/buying-tickets/appen-skyss/questions-and-answers-about-the-skyss-app/)
describe its Bergen scooter map. Its [Google Play listing](https://play.google.com/store/apps/details?id=no.skyss.planner)
lists finding e-scooters separately from signed-in functions. The inspected
Android package, `no.skyss.planner` 7.102.0 / 40013, contains the current
query and client headers. `apksigner verify` succeeds and reports a Skyss
signer; an independent publisher fingerprint from `skyss.no` could not be
obtained because its app-link association returned 403. The APK was inspected
statically and was not installed or executed.

`POST https://cosmo-router.transhub.io/graphql` accepts these ordinary client
headers without a cookie, API key, rider token, DPoP proof or attestation:

| Header | Inspected value |
| --- | --- |
| `client-platform` | `android` |
| `client-version` | `7.102.0` |
| `client-build-date` | `1790928393` |
| `owner-id` | `SKYSS` |
| `accept-language` | `en` |
| `Content-Type` | `application/json` |

The initial request without client metadata returned HTTP 400 with
`Missing required header: client-platform`. Adding the app's observed
metadata returned real service and map data. No private runtime key from the
app is used or committed.

`mobilityServices_v2` with the Skyss owner confirms `BERGEN`, `RYDE`,
`ESCOOTER`, `NORMAL_SERVICE` and `DEEP_LINK`. The map query is:

```graphql
query nearbyEVehicles(
  $northWest: LocationInput!, $southEast: LocationInput!,
  $vendors: [Vendor_v2!]!, $rentalProductTypes: [RentalProductType!]!
) {
  nearbyVehicles_v4(
    vendors: $vendors, northwest: $northWest, southeast: $southEast,
    rentalProductTypes: $rentalProductTypes
  ) { __typename id vendor lat lon type }
}
```

Inputs use `{ latitude, longitude }`, vendors `["RYDE"]`, and product types
`["ESCOOTER"]`. The result has `VehicleDetailsLite` rows with 15-digit IDs.
Map rows lack battery, range, rentability and a provider position timestamp.
The reader preserves those unknowns; its scan times are observation times.

A separate `vehicleDetails_v2(vehicle: { id, vendor: RYDE })` read matched a
map ID and coordinates exactly, reported the Bergen Ryde service and a
rental link on `new-web-platform.ryde.vip`, and returned `isRentable: true`,
battery and range. A same-shape unknown ID returned null with a
`BAD_USER_INPUT` / `No vehicle found with ID` error. This verifies an actual
overview/detail identity relationship, rather than trusting HTTP 200 alone.

### Limits and the live audit

- One central view, south/west/north/east
  `60.375,5.29,60.405,5.355`, returned exactly 500 scooters. Treat 500 as
  capped even though the reply supplies no truncation flag or total.
- At 23:25 local time on 27 October, the reader confirmed the service, read
  that parent view and four smaller views, and returned 1,055 distinct
  observations in six requests / 10.1 seconds. It retains valid parent
  observations when smaller views omit them.
- A fresh run at 23:32 returned 1,053 observations in six requests / 10.1
  seconds. Its map pages held 500, 292, 324, 155 and 282 rows. Between scans,
  1,046 IDs persisted, nine disappeared and seven appeared; three persistent
  scooters changed position by more than 50 m, one by about 1.05 km. Thus
  the source is updating, although no per-position timestamp or guaranteed
  freshness is available.
- Of 500 earlier parent-view references, 497 appeared in that scan, 494
  within 10 m. All three missing references still had unchanged positions
  and `isRentable: true` in separate detail reads. A tiny local map read
  recovered one; the other two remained absent from map reads. Therefore
  an uncapped reply is **not proof of inventory completeness**, and detail
  rentability is not sufficient to explain current map membership. The
  cause, including possible differing cache ages, remains unverified.
- The radius-based `nearbyVehicles_v3` returned only 150 rows despite a
  requested limit of 1,500. It is not an established completeness shortcut.
- A sweep of the whole municipality, `60.17,5.14,60.54,5.60`, quartering
  each box of 500, found 4,718 scooters in 29 requests just before midnight
  on 27 October, between 60.284 and 60.489 north and 5.177 and 5.395 east.
  The central view had held about a quarter of the fleet.
- A box of fewer than 500 lists the whole box: three of 480, 481 and 495
  rows, and a wide one of 246, were read again with their four quarters,
  which together listed at most one scooter more, one that had moved.
- The router pads a box: 31 of the wide box's 246 rows stood outside it,
  and one of the 480's. The research reader rejected any such reply.
- Of 16 scooters spread over one round, read one by one with
  `vehicleDetails_v2`, all could be rented, with 33 to 93% charge and none
  moved more than 4 m. The map seems to list only scooters that can be
  rented.
- The map's id is the scooter's IMEI: the detail read's rental link carries
  it as `deviceIMEI`, as Ryde's Entur feeds' links do.
- Neither the `RUTER` nor the `SKYSS` owner shows Ryde's Oslo scooters, which
  Entur's feed lists: Skyss's map serves Bergen alone.
- `RUTER` service metadata lists Oslo and its surrounding Ryde areas. The
  gateway rejects `AGDER` as an unsupported owner; it explicitly names only
  `RUTER` and `SKYSS`. Central map probes for Drammen, Larvik, Kristiansand
  and Göteborg returned empty arrays, with no GraphQL errors. Those markets
  remain gaps; nearby Entur data is not evidence of their coverage.

### The production reader

Since 28 October 2026 the scooter cache reads Bergen with
[`server/skyssApp.ts`](../server/skyssApp.ts). Each round asks for the
service list, and fails if Skyss lists no Ryde scooter service in `BERGEN`;
a service it calls `TEMPORARILY_UNAVAILABLE` has no scooter to rent, and is
not swept. It then cuts the system's bounds, `60.275,5.165,60.495,5.405`,
into six boxes, quarters each box of 500 down to about 250 m, and fails past
120 requests or on a reply with an error, another vendor or type, or a
broken row. Rows outside their box are left out, as a neighbouring box
lists them. Requests go one a second, those nearest where people look first,
every two hours while nobody looks and every minute while someone does, as
the other app maps' (`APP_MAP_IDLE_INTERVAL_MS`). A 429 holds the reader off
for at least a minute.

The map gives no battery, range or position time, so the scooters show no
charge, and the observation time is the round's first request. The IMEI is
neither stored nor shown: a scooter's id is a hash of it keyed by the process,
`skyss:` and 16 characters, which changes when the cache restarts. Its card
links to `new-web-platform.ryde.vip/app/ios.html` or `android.html`, Ryde's
link without the IMEI, as its Entur feeds' are once their query is dropped
([rentalLinks.ts](../src/lib/rentalLinks.ts)); both pages answer and open
Ryde's app or its store. It replaces the research reader of 27 October.

Skyss's [terms of use](https://www.skyss.no/en/help-and-contact/terms-and-privacy/terms-of-use-for-services/),
updated 2 December 2024, say that tickets or data Skyss makes available must
not be copied, transferred, traded or distributed in any way, and forbid
reverse engineering its software. They name no scooter or vehicle position.
The map's credits name Skyss.

## Apple sign-in and the Mac-compatible iPhone app

[Ryde's App Store listing](https://apps.apple.com/no/app/ryde-always-nearby/id1495605028)
supports Apple silicon Macs. The installed official app is
`com.ryde.NewRyde` 6.1.0, build 260983. This is the App Store iPhone app
running directly on macOS, rather than an iOS Simulator build.

A private snapshot of the app's HTTP cache contains
`POST https://api.ryde.vip/appRyde/getNearScootersNew`, HTTP 200 and JSON
status 200. The form contains `token`, `cityId`, `iotLa`, `iotLo`,
`nearRadius`, `userDevice`, `timestamp`, `timeSign` and `ekt`. Its headers
include `Authorization: DPoP …`, an ES256 `DPoP` JWT and
`Ryde-API-Security-Version: 2`. The proof carries `ath`, `htm`, `htu`,
`iat` and `jti`. The response's `key` is an ECIES envelope with
`alg: ECDH-ES+A256GCM`, `epk`, `iv`, `data` and `ekt`.
The app log records successful decryption of `key`.

The initial map was around Zürich, outside the investigated Ryde markets;
this cached successful response does not establish a nonempty fleet in a
missing city or a fresh independent retrieval. Replaying its older proof
from this Mac returned HTTP 403 / `DPOP_PROOF_INVALID`; removing the proof
returned HTTP 403 / `DPOP_REQUIRED`. The first test does not isolate proof
expiry from replay rejection. These tests establish live proof enforcement
for this session, rather than merely the presence of client code.

Keychain Access exposes two Ryde application-password entries under the
app's own service: `Ryde.apiSecurity.dpopSigningKey.production.v1` and
`Ryde.apiSecurity.eciesKeyAgreementKey.production.v1`. Their contents and
off-device usability remain unverified. Do not apply the Android
non-exportable-key conclusion to these iOS entries. Key export failed:
macOS logs show `CSSMERR_DL_OPERATION_AUTH_DENIED` during the attempts.
The user reported that Local Items reveals or copies no value despite its
password dialog closing without a visible error. They are using screen
sharing; whether that explains the denial remains unverified. No key was
exported, and no keychain password or security setting was changed.

A follow-up on 1–2 November tested Keychain Access's item-copy operation into
an isolated encrypted file keychain, preserving the original entries. After
the user authenticated, Keychain Access reported that it could not add the item
because one or more parameters were invalid. No item appeared in the destination.
A subsequent **Copy Password to Clipboard** attempt also produced no usable value,
as reported by the user. The temporary keychain and its generated password were
removed, and the original keychain search list was restored. No source item or
system security setting was changed.

### Mac signing-key storage recheck, 2 November

Static tracing of the installed 6.1.0 binary gives a more specific result than
the imported CryptoKit symbols alone. `DPoPKeyStore` has a persistence store,
a persistence key and a cached key. Its key-loading function calls the
`P256.Signing.PrivateKey` raw-data initializer on the persisted value. When it
creates a key, it obtains `rawRepresentation` and passes that data to the
persistence store. The `KeychainAPISecurityPersistenceStore` implementation
calls `KeychainTool`, which reads a generic-password item under the
`com.ryde.ryde` service. Its save path supplies
`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`.

This establishes a software-key serialization path in the installed version;
the specific value of the existing session's item has not been read or matched
to its public DPoP key. Apple's [accessibility documentation](https://developer.apple.com/documentation/security/ksecattraccessibleafterfirstunlockthisdeviceonly)
says an item with that attribute does not migrate in a backup to another
device. It does not, by itself, establish that a private key is in the Secure
Enclave or that its bytes can never be exported through an authorized path.

A separate local helper queried only the signing-key account with interactive
authentication disabled, once using the data-protection keychain and once
using its default query. Both returned `errSecItemNotFound` (`-25300`); no key
data was returned. This status does not isolate the cause. A normal LLDB
attach to the running App Store app also failed with “Not allowed to attach to
process.” The app still displayed its signed-in map after that check. No
Keychain prompt, setting change, rotation or independent map request was made.
The app was closed after the test.

A 2 November signing check explains why the helper result cannot prove absence:
the signed Apple app has application identifier
`ZH9J2JZ9YQ.com.ryde.NewRyde` and declares no explicit Keychain-sharing group.
Apple's default is then the app-identifier group, private to that app. A
separately signed helper cannot query it unless Ryde shares the group with
that helper. Apple's [Keychain sharing documentation](https://developer.apple.com/documentation/Security/sharing-access-to-keychain-items-among-a-collection-of-apps)
describes this default isolation. The same check found Apple's `heap` and
`leaks` tools carry read-only task-port entitlements; `debugserver` does not.
That accounts for the observed read-only object-graph access alongside the
denied debugger attach, without showing the key value.

These failures establish that the tested export paths did not work; they do not
prove the iOS keys are hardware-bound or universally non-exportable. Do not repeat
these prompts without new evidence that addresses the failure. The existing app
session still opens its map, but its cached response remains encrypted and its
local diagnostic log records only decryption success, not the decrypted vehicle
payload. Neither is a demonstrated server bridge. Broader coverage currently
requires another verified data source or read-only feed/API access from Ryde;
Google or SMS authentication alone does not supply the missing signing keys.

Raw cache snapshots, session headers and diagnostics are private under
`~/.cache/scootradar/rider-auth/ryde/mac-session/`, outside Git. No proxy
certificate, network proxy or global security setting was changed.

### Read-only live heap and key-rotation trace, 2 November

The Mac-compatible app was reopened and inspected with Apple's `heap
-noContent` and `leaks -noContent -referenceTree` diagnostics. The heap
listed `APISecurityManager` and `DPoPKeyStore`; the reference tree showed the
manager owning its DPoP store and a cached `SecureBytes.Backing` under
`DPoPKeyStore.cachedKey`. It also showed cached active and secondary
encryption-key backings under `EncryptionKeyStore`. These content-disabled
diagnostics expose object names, sizes and ownership only. They did not read
or export any key bytes. The system tools could inspect these references even
though normal LLDB attach remained denied; the analysis warned that its
WebKit malloc-zone view could be incomplete.

The Android client trace sharpens the API option. `/appRyde/rotateSessionKey`
accepts the session token and a new encryption public JWK. The normal request
interceptor adds the DPoP proof, DPoP authorization and encryption-key
identifier. The app creates the new keypair, calls this endpoint during
session maintenance when needed, then activates the new local private key
after acceptance. This route can replace the response-decryption key without
exporting its old private key, but it still depends on the existing DPoP
signing key for each signed map request. `/appRyde/registerDpopKey` is a
separate path that obtains an attestation challenge. Neither live rotation nor
an independent server map read has been tested.

Static inspection of the installed Apple binary independently confirms both
endpoints are present, along with session-rotation success and
`requires_registration` log paths. This confirms rotation is implemented in
the Apple app too. The strings do not establish when that path sends an App
Attest proof or whether the live session can rotate without fresh registration;
the server-side acceptance conditions remain unverified.

The current Mac observation therefore improves confidence that the signing
key is cached as software-backed key material in the app process, while
leaving its value unavailable through the content-disabled diagnostics.
Rotation reduces the keys a server reader would need, but does not remove the
signing-key access requirement. No fresh login, SMS, request mutation or
security-setting change was made.

An initial content-enabled check ran `heap --addresses` for
`SecureBytes.Backing` and `leaks --hex --fullContent --referenceTree` against
the existing Ryde process. Each reached a 50-second timeout with no output;
both diagnostic processes were stopped. A follow-up replaced live scanning
with `heap --forkCorpse --addresses='SecureBytes.Backing[1-256]'`, which
completed. It found the 64-byte signing-key backing but explicitly reported
that the process was not debuggable and that, due to security restrictions,
`heap` could show only readonly memory contents of restricted processes. No key bytes were
included. Content-enabled variants of `heap`, `leaks` and full-content memory
graphs therefore do not offer a usable extraction path for this target.

A separate raw-memory attempt used `/usr/bin/gcore`, which carries Apple's
`com.apple.security.cs.debugger.read.root` entitlement on this system. Both an
ordinary invocation and a user-authorized administrator invocation returned
“insufficient privilege: Operation not permitted.” No core file was created,
and no security setting or app data was changed. Private results remain outside
Git under `mac-session/content-check-20261102/` and
`mac-session/corpse-check-20261102/`.

### Mac bridge and location simulation check, 2 November

A user-authorized bridge experiment tried to move the signed-in Mac app to
central Drammen and export a fresh decrypted map. **No Drammen map request or
plaintext fleet export was achieved.** Destination searches for Drammen and
its coordinates did not move the map there. Touch Alternatives enabled keyboard
panning, but the available desktop controls could not perform the pinch needed
to navigate from Zürich; the user could not perform it remotely either. The
temporary Touch Alternatives setting was restored to Off after the test.

Finder could copy the app-owned HTTP cache, its SQLite journals and response
files, the current log and diagnostic database, although direct reads by the
agent were denied by macOS container permissions. The copied cache passed
SQLite's `quick_check`. Its map entry's HTTP `Date` and DPoP `iat` were both
`2026-11-02T21:57:20Z`, establishing a fresh official-app response for Zürich
(`cityId=0`). The cache row's `time_stamp` still read `15:03:56`; that field
alone would incorrectly suggest an old response.

The fresh map response had status 200 and an encrypted `key` envelope with
`alg`, `ekt`, `epk`, `iv` and `data`. The current log exposed decryption-success
markers without the resulting fleet JSON, and the diagnostic database had zero
`trace_event` rows. `getCityFences` listed Drammen with `cityId=43`; this is city
metadata, not a verified scooter observation or a way to invoke the map reader.

At the user's suggestion, a small local helper queried Core Location's private
`CLSimulationManager` interface. The status query failed, and `locationd` logged
“unentitled client attempting to simulate location.” A separate ad-hoc-signed
copy declaring `com.apple.locationd.simulation` was killed before executing.
No location simulation was started, and no system protection or Ryde binary was
changed. These tests did not establish a usable location override on this Mac.

The user subsequently authenticated an administrator-level run of the same
read-only status helper. It also returned `querySucceeded=false`; administrator
access did not make this simulation interface usable. The private authentication
file was removed after the command.

The checked disk outputs therefore do not supply a working bridge. Moving the
map remains a prerequisite for the Drammen test; exporting its decrypted result
also requires an app interface or another verified access path. Keeping Ryde
open by itself has not demonstrated either capability. Private snapshots and
helper diagnostics are under `mac-session/drammen-bridge-20261102/` outside Git.

### Prepared local proxy bridge experiment

A different bridge design could let the unmodified app generate fresh DPoP
proofs while a local proxy substitutes a bridge-owned encryption public key
during normal session-key rotation. The proxy would then decrypt the server's
envelopes and re-encrypt them to the app's original public key. This depends on
live acceptance of the substituted key and correct key-id translation; neither
has been tested. DPoP alone does not bind the request body, as described in
[RFC 9449 section 11.7](https://www.rfc-editor.org/rfc/rfc9449.html#section-11.7).
Additional Ryde checks may still prevent this approach.

A first, capture-only test was prepared under
`mac-session/bridge-proxy-20261102/`, outside Git. Its local TLS handshake worked
with an explicitly trusted test client. Offline ECIES translation passed the
existing Ryde decryptor, including wrong-recipient and tampering rejection.
These checks do not establish compatibility with the actual Mac app.

The prepared leaf certificate is not a CA. Proposed trust is restricted to the
signed Ryde executable, TLS server authentication and `api.ryde.vip`; the PAC
routes only that hostname through localhost. The original proxy configuration
is backed up, and an independent guard is prepared to restore it and remove the
certificate after one map capture, a TLS failure or five minutes. The user
approved this scoped capture on 3 November 2026.

An administrator-authenticated activation attempt on 3 November reached
macOS's separate certificate-trust authorization, but that step did not finish
within the controller's original 30-second command timeout. The certificate
had been added to the System keychain; cleanup removed it and verified that
neither the certificate nor its trust entry remained. The PAC was never
enabled, and the original proxy configuration was verified unchanged. No
native-app exchange was intercepted and no session-key rotation was attempted.

The prepared retry allows up to 180 seconds for certificate authorization while
retaining the independent five-minute cleanup limit. The desktop-control tool
does not permit access to macOS SecurityAgent, so the user must complete that
OS dialog. The capture addon now saves at most one map exchange and excludes
the sibling hostname, non-map routes and oversized requests; those boundaries
passed fixture checks. The fresh private administrator request for that retry
timed out, so the retry was not activated. Both listeners were stopped and
cleanup was verified. This remains a prepared experiment, not a working bridge.

## Recheck: model spoofing, attestation and session keys

The 27 October APK download is still 6.1.0 / 718. `apksigner verify`
succeeded; its SHA-256 certificate fingerprint,
`2F:A2:63:91:05:5F:24:B6:0D:94:8A:03:23:A2:93:83:0A:C6:0F:45:38:DE:F1:E8:BC:2B:FA:7E:42:88:13:D9`,
matches the publisher's app-link association. This recheck found additional
requirements in that same build; it does not establish a new server rollout.

A controlled replay of the public time request changed only `MobileType`:

| MobileType | HTTP result |
| --- | --- |
| `Android/Google/sdk_gphone64_arm64/google` | 403, non-JSON |
| `Android/Google/Pixel 7/google` | 200, JSON status 200 |

This reproduces the simple model-header blocker. It was a host-side
diagnostic replay, not a modified emulator, a successful login or a device
integrity verdict. No emulator properties, app signature, Google verdict
or account identity were changed.

The successful time response still advertises `deviceBlacklistMode: 1`,
`playVerdictRequire: "DEVICE"`, `attestFailPolicy: 1`,
`playIntegrityDegraded: 0`, `secUpgradeMode: 2` and a
`dpopMigrationDeadline` of `2026-09-21 00:00:00`.
Changing the model header does not establish that these subsequent checks
will pass. Google's [integrity-verdict documentation](https://developer.android.com/google/play/integrity/verdicts)
describes `MEETS_DEVICE_INTEGRITY` as a certified physical-device verdict,
with hardware-backed boot evidence on Android 13 and newer. Its separate
virtual-device verdict is for Google Play Games on PC. A model string does
not supply that signed evidence.

The app also offers Google sign-in. In the unmodified retained emulator,
tapping it reached the same failed `getTimeService` prerequisite before
the Google credential picker. Static tracing shows that Google login and
SMS both request `/appRyde/getAttestChallenge`. When a nonempty challenge is
returned, the client obtains a Play Integrity token and passes it to the
login request. Google sign-in is therefore not evidence of a route around
the configured device requirement.

There is also a session-portability requirement beyond obtaining an SMS:

- The Android client creates a P-256 signing key in `AndroidKeyStore`, under
  the alias `com.ryde_android.dpop.signing.v1`. It signs an ES256 DPoP proof
  for each token-bearing first-party request. Proof claims bind the HTTP
  method, URL and token hash, with issuance time and a unique request ID.
  Copying the token does not copy that non-exportable signing key.
- Map reads are in the encrypted-response set. They add an encryption-key
  identifier (`ekt`); the parser handles an ECDH/HKDF/AES-GCM envelope and
  the older AES fallback. On Android 12 and newer the key manager prefers
  an AndroidKeyStore decryption key, with a software-key fallback in code.
- Session registration and rotation have their own endpoints,
  `/appRyde/registerDpopKey` and `/appRyde/rotateSessionKey`. Registration
  also obtains an attestation challenge. Successful login does not prove
  registration, rotation or off-device map decryption.

These Android checks establish client paths and server configuration, rather
than authenticated Android enforcement. The subsequent Mac session confirms
live DPoP enforcement for its iOS token, as described above. Access to its
keys, independent decryption and renewal remain unverified; do not promise
that one phone login will produce a portable bearer token.

## Public sources rechecked on 27 October

Entur's GBFS 3 manifest still listed the same sixteen Ryde systems then
(it has listed `rydelarvik` too since 31 October 2026 at the latest). The
discovery URLs for `rydebergen`, `rydedrammen`, `rydelarvik` and
`rydekristiansand` returned 404 on 27 October. A fresh manifest check on
1 November listed seventeen Ryde systems, all already configured in
ScootRadar; Bergen is the eighteenth configured system through Skyss.
Entur GraphQL recognizes
`YRY:Operator:Ryde`: a control in Oslo returned vehicles from `rydeoslo`,
while a 15 km Bergen query returned none. Queries around Drammen and
Larvik returned vehicles from existing Asker and Sandefjord feeds,
respectively, rather than new systems; a nearby result is not evidence of
coverage of the requested town.

The old anonymous route in [WoBike's Ryde notes](https://github.com/ubahnverleih/WoBike/blob/master/Ryde.md),
`qw-test.ryde.vip/appRyde/getNearScooters`, returned JSON status 407 to the
published unsigned request. The current production map route did the same
without signing. This supplies no working anonymous read; it does not
replace the earlier signed-request authentication result below.

Ruter's [published operator coverage](https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/operatorer)
lists Ryde around Oslo and Asker/Bærum/Lillestrøm/Lørenskog/Rælingen, not the
missing Bergen, Drammen, Larvik or Kristiansand markets. This Ruter/Entur
recheck did not reveal them. The separate Skyss owner later supplied the
Bergen guest map described above; no production feed was added.

## Map protocol and the earlier signing blocker

The app defines `POST https://api.ryde.vip/appRyde/getNearScootersNew`, with
form fields `token`, `iotLa`, `iotLo`, `nearRadius` and `cityId`. An interceptor
adds a millisecond `timestamp` and `timeSign`.

The initial incomplete request returned HTTP 200 with JSON status 407 and
an instruction to install the latest app. This was not enough to conclude
that the map could not be automated. The native key/IV decode routines and
the Java request-signing sequence were subsequently reproduced. A signed
Bergen map request with an empty token reached the authentication check and
returned HTTP 200 with JSON status 401, `Token is invalid.` The old production
`getNearScooters` path returned HTTP 404.

In that inspected build, signing substitutes the timestamp into a resource
template, encrypts with AES/CBC/PKCS5 padding, encodes with Android's default
Base64 formatting and trims it, then takes MD5. Decoded constants, APKs and
raw diagnostics stay outside the repository.

The nearby response model carries encrypted `key`/`key2` fields. Its parser
supports an ECIES envelope and an older AES fallback; the actual format
returned after a successful current login remains unverified. The decrypted
static model has separate scooter and e-bike arrays with coordinates and QR
codes. Battery, range and an independent position timestamp are absent from
that nearby model. Availability, identity stability and completeness still
need a live authenticated check.

## Actual sign-in attempts

The unmodified app requires sign-in before showing its map. Its country
selector includes Indonesia, `+62`; a country being listed does not establish
that the backend will send or deliver an SMS to every number there.

The first Indonesian attempt on the existing Google APIs emulator returned
to sign-in without reaching code entry, and the user received no SMS. That
emulator's `com.android.vending` package was a system `LicenseChecker` stub,
version 1.8, rather than the full Play Store. Ryde's Standard Integrity log
reported that it could not bind to the verification service.

A separate AVD was then created from Google's official Android 35
`google_apis_playstore` ARM64 revision 9 image. It has the full Google Play
Store and its Integrity services. Ryde's log confirmed a successful service
connection and warm-up callback. The same publisher-signed app was installed
with its required ABI and density splits. An Indonesian attempt in this
environment still failed before code entry, displaying:

> An error has occurred. Please contact our support.

The German comparison also returned to sign-in without code entry, and the
user received no SMS. Country selection did not explain these failures.

Tracing `LoginMainActivity` identified an earlier prerequisite: phone login
first fetches `/appRyde/getTimeService`. If that returns no usable result,
the app displays its generic error before checking the number. The app's
`MobileType` header is exactly
`Android/<Build.MANUFACTURER>/<Build.MODEL>/<Build.BRAND>`.

A controlled, unauthenticated check of that time endpoint found:

| Request headers | HTTP result |
| --- | --- |
| Android app/version headers, no `MobileType` | 200, JSON status 200 |
| Same, with `X-Frame-Options: DENY` | 200, JSON status 200 |
| Same, with `MobileType: Android/Google/sdk_gphone64_arm64/google` | 403, HTML |
| Same emulator header and `X-Frame-Options: DENY` | 403, HTML |
| Change only the model in that last request to `Pixel 7` | 200, JSON status 200 |

This establishes a request-header blocker independently of phone country.
The reference-model request was a read-only diagnostic comparison, not a
successful login. Neither app/device identity nor an integrity verdict was
modified in the official client. Its public time response also reports
`deviceBlacklistMode: 1`, `playVerdictRequire: "DEVICE"`,
`playIntegrityDegraded: 0` and `attestFailPolicy: 1`. That is further evidence
that a working verification-service connection alone is insufficient;
successful device attestation and an authenticated map remain unverified.
Further country changes should not be treated as a fix for this emulator.
A real-device sign-in is the next useful compatibility test, and would not
by itself establish a portable server session.

Ryde's
[login help](https://www.ryde-technology.com/help/login-issues) asks users to
check SMS reception, the country code and the app version, but supplies no
complete list of countries supported for SMS verification. Do not describe
all country codes as verified or repeat requests indefinitely without new
evidence.

No OTP was accepted during the emulator attempts. Apple sign-in subsequently
established the app session described above. No ride, reservation, payment or
support message was initiated. Request signing and app login are solved
parts of this investigation; independent proofs, response decryption and
renewal remain open work.
