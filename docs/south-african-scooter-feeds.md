# South African scooter feeds

Verified 24 October 2026. Zippy's authenticated ATOM rider map supplies
Langebaan's Club Mykonos area. The first read returned 82 available
electric standing scooters; a later check returned 84, with battery charge.
Availability changed between minute-separated reads, and one scooter
offered during the checks changed position by 24 metres. This establishes
fresh telemetry, without treating every availability change as a ride.

The app publishes other parking and restriction polygons near Cape Town,
but its account-wide vehicle map returned no available scooters there.
Those polygons alone do not justify Cape Town coverage. The catalog is
[south-african-scooter-feeds.json](../data/south-african-scooter-feeds.json),
with one reviewed resort-area envelope and the search alias `Club Mykonos`.
It does not claim coverage across Langebaan or South Africa as a whole.

## App and collection

Android `zippy.app` 10.80 has a valid signature matching
[Zippy's Android association](https://zippyride.app.link/.well-known/assetlinks.json).
The [Google Play listing](https://play.google.com/store/apps/details?id=zippy.app)
names Zippy Langebaan (Pty) Ltd; its associated iPhone app is
[Zippy Rides](https://apps.apple.com/us/app/zippy-rides/id6752651073), bundle
`zippy.rideatom.live`. See the [artifact investigation](atom-operator-apps.md)
for the signer fingerprint.

The user authorized a rider account with the supplied name and email.
The German SMS request returned success without confirmed delivery.
A South African number passed a human-completed CAPTCHA and SMS
verification, and `user/register` issued a rider session. Credentials and
phone details remain private, under `zippy-za` in the shared ATOM bundle.

The [ATOM collector](atom-app-map.md) uses `atomAppFullMap` to read this
verified account-wide response once. Requests centred at both Langebaan
and Cape Town returned the resort fleet. Only electric standing scooters
inside the reviewed envelope are published; hidden vehicles and active
rides are excluded. Battery is retained and range remains unknown. Zone
and parking guidance are not published by this adapter.

The source is verified from the production cache container on Netcup using
Node 26.12.1. Its private session was added without restarting the service,
preserving Qick and MoVe's sessions. Deployment follows passing CI.

## Country and search

South Africa is the first `africa` country catalog. Its time zone is
`Africa/Johannesburg`. Names and search aliases cover the apps' nine
languages, and both web and iOS catalogs are generated from the same data.
Address search has a Southern Africa envelope, restricted to served
countries. Physical-address formatting follows the
[UPU South Africa guide](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/zafEn.pdf):
house number before street, then locality and the four-digit postcode.
