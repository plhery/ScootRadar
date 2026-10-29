# Coverage gaps

What the map doesn't cover yet, why, and when to check again. Each covered
country's guide has the evidence and the details; this page lists every gap in
one place. Started 12 October 2026. Add to it when an audit leaves something
out, and remove an entry once it's added or settled for good.

## Lime operating areas added since 24 October 2026

The authenticated Lime adapter covers the complete published operating
polygons in Deva, České Budějovice, Querétaro, Naha, Doha, Santiago and Brisbane,
including their disconnected service areas, and since 25 October 2026 in
London, Birmingham, Coventry, Milton Keynes and Salford, in 39 German
markets, from Berlin and Munich to Waiblingen, in ten Italian ones, from
Roma and Milano to Rimini, in six Polish ones, from Warszawa to Wrocław, and
in five Austrian ones, from Wien to Wels, in Göteborg and Malmö, in
København and Odense, in Brno and Ostrava, in 15 Hungarian markets, from
Budapest to Szigetszentmiklós, in seven Romanian ones, from București to
Târgoviște, in Athens, Kifisia, Thessaloniki and Heraklion, in Antwerpen,
in Porto, Faro and Oeiras, and since 26 October 2026 in Tokyo and Yokohama,
in Port Phillip and, since 27 October, Canberra, in Auckland, Christchurch,
Hamilton, Wellington and Palmerston North, in Monterrey and Guadalupe, in
Ajax, Coquitlam, Laval, Montréal's Parc Jean-Drapeau, Port Moody, Richmond
and Vaughan, in 58 American towns, from Los Angeles and Austin to Milwaukee
and Tampa, in Ashdod and Eilat, in Dubai, Abu Dhabi and Al Ain, and since
27 October in Bergen, Viña del Mar, Saskatoon, Regina, Red Deer, Lacombe,
Blackfalds and Waterloo Region, and since 28 October in Feldkirchen bei Graz,
Klosterneuburg, Korneuburg, Chania, Érd, Százhalombatta, Diósd, Ragusa,
Marina di Ragusa, Ishigaki, North Ishigaki, San Marcos, UNC Charlotte,
Kloten, the first Swiss town read from it, and Sion, which no feed covers.
Kortrijk, Mechelen, Lucca, Volos and Keszthely held no Lime scooter near their
centres at midnight on 28 October, nor anywhere in their zones at midday:
dormant regions.
One other market its rider map lists, Farmington, Utah, showed 2 scooters in
each of three audits and none to check them against, so it remains a gap. See
[the collection and validation evidence](lime-app-map.md#every-market-the-map-lists-october-2026).

## Found, not added yet

These feeds are public and were live when checked. Nothing blocks them except
the work.

None on 25 October 2026, since BinBin's areas in Skopje, Sarajevo and Pristina
were added.

## Waiting on a decision

| What | Blocked on |
| --- | --- |
| **Dott official partner access** | The anonymous app map was authorized on 24 October 2026 and now covers 157 additional regions. Official GBFS credentials and redistribution permission can be requested through the [published GBFS contact](https://transportdata.be/fr/dataset/dott), dunya@ridedott.com (listing updated December 2024); support@ridedott.com can route a request to Partner Integrations. See [adapter evidence](dott-app-map.md) |
| **Voi official GBFS access** | The user authorized an authenticated rider-map adapter on 24 October 2026; it adds 72 regions, including 17 in the UK ([evidence](voi-app-map.md)). Official access is asked from nap@voiapp.io, under a [licence](https://www.voi.com/voi-licencing-agreement) that forbids storing the data, which the scooter cache does |
| **Rider sign-in for JET** | JET's separate Central Asian app needs a rider account, with phone and SMS verification, for Almaty, Ulaanbaatar, Tashkent and Tbilisi. No guest session was found (24 October 2026). Beam's Google sign-in is complete, with a [54-region collector](beam-app-map.md) across Australia, Malaysia, South Korea and Türkiye. LUUP's [19-city collector](luup-app-map.md) and Whoosh's [25-region collector](whoosh-app-map.md) are integrated too. Go Jet's [signed-out adapter](gojet-app-map.md) supplies 54 regions in six countries without a rider sign-in. See [the evidence](jet-whoosh-beam-luup-app-maps.md) |
| **Rider sign-ins for six ATOM apps** | IslaRide (Tenerife), wer2 (Doha), Reby (Dakar), IZZY (Tashkent), Silk Road Samarkand and e-moob (Tamarindo) answer their map only to a signed-in rider, and each needs its own phone and SMS sign-in, as MoVe's did. On 25 October 2026 the user chose to leave them for another day. Reby also refused a sign-in from a Swiss IP (error `11-6`), and e-moob's Aruba fleet stays out, since Aruba banned e-scooters from public roads in July 2026. See [the apps](atom-operator-apps.md) |
| **Bird's rider app** | Since 28 October 2026 it supplies 21 towns where Bird publishes no feed, signed in, each area swept whole, at one request every 30 seconds for all of them: eight American ones, from Austin to Yonkers, and thirteen Canadian ones, from Lethbridge to Mississauga. Its map made up scooters twice on 27 October 2026, both times after about 200 requests, so the request limit, not published, is the constraint: the cache stays near half of it. Beyond the 33 largest US and Canadian towns, only the 25 where Bird was said to run were searched, and each area was read only near its centre: Pickering's, Oklahoma City's, Washington's, Chula Vista's, San Jose's, Vancouver's and Houston's, which held no scooter there, are still to be swept whole. See [requests, limits and evidence](bird-app-map.md) |
| **NRW.Mobidrom** in North Rhine-Westphalia | Voi's 12 systems are on the map since 24 October 2026, read with the shared client login the datasets publish (see [the audit](german-italian-scooter-feeds.md#voi-in-north-rhine-westphalia-october-2026)). Lime's two systems (Essen, Dortmund; dl-de/by-2-0) answer, but NRW.Mobidrom updates them, with Bolt's four (Köln-Bonn, Düsseldorf-Mönchengladbach, Essen-Duisburg, Dortmund-Bochum; CC BY 4.0), about once an hour: at 13:52, 13:55, 14:12, 14:54 and 15:54 that day, while the map shows no position older than 15 minutes. Both operators' scooters there come from their rider maps since 25 October 2026, [Bolt's](bolt-app-map.md) and [Lime's](lime-app-map.md), so their NRW.Mobidrom feeds are not needed |

It was decided on 13 October 2026 not to ask Lime, Bird or Hopp for a written
licence, so their terms block nothing and their feeds stay on the map. For the
record:

- **Lime:** its [GBFS terms](https://www.li.me/legal/public-gbfs-terms) allow
  public display only where local law requires it.
- **Bird:** its licence page answers 404; the
  [archived copy](https://web.archive.org/web/20260516143232/https://www.bird.co/gbfs-data-license-agreement/)
  allows display.
- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  licence.

## No public data, in covered countries

Dott's anonymous app map supplements GBFS in eight countries since 24 October
2026 ([evidence and limitations](dott-app-map.md)). Austria now covers 11 Dott
regions. The [Voi rider map](voi-app-map.md) now supplies Vienna and Innsbruck without a public feed,
and Lime's [rider map](lime-app-map.md) Vienna, Linz, Innsbruck, Klagenfurt and Wels
since 25 October 2026, and Feldkirchen bei Graz, Klosterneuburg and Korneuburg
since 28 October; Lime's Salzburg region held no scooter on 25 October.

Operators that run there but publish nothing the map can read, cities that
banned shared scooters, and feeds that were empty when checked.

- **Switzerland:** everything comes from sharedmobility.ch, apart from Hopp
  (Zürich, Basel and Kloten) and PubliBike, read from their own feeds, and
  Lime in Kloten and Sion, from its rider map. Hopp
  stamps each response with the time it was asked for, so the fifteen-minute
  age limit can't tell how old its positions are.
  - Lime Winterthur, Zug and Wetzikon list no vehicles, with fresh
    timestamps, as they have since at least 11 October 2026, and are left
    out of collection since 15 October 2026 (`LEFT_OUT_SWISS_SYSTEMS` in
    `src/lib/feedCoverage.ts`). Winterthur licenses Voi alone until the end
    of 2027, and Voi keeps it on the map; Zug has had no rental e-scooters
    since November 2023 and Wetzikon since its pilot ended in February 2023,
    so both left the map's towns
    ([Data sources](../DATA_SOURCES.md#mobility-data)).
  - Bulle, Grenchen and Nyon left the map's towns on 15 October 2026, with no
    scooter from any source in them. Bird Grenchen has sent no position since
    8 August 2026, though Zisch's site still names Grenchen; JM Fleets rents
    its Bulle scooters in its own app, Trott', which publishes no feed, and
    Bird's Bulle system lists none; Nyon's shared vehicles are Voi's e-bikes.
    Bird Grenchen and Bird Bulle are in `LEFT_OUT_SWISS_SYSTEMS`
    ([Data sources](../DATA_SOURCES.md#mobility-data)).
  - Lichtensteig left the map's towns on 18 October 2026. Dott St. Gallen
    draws a zone there and lists 13 scooters, but from Friday 16 October at
    18:10 to Sunday 18 October at 03:30 twelve of them stayed at the same
    spots, by the station and on the road to Wattwil, their batteries only
    draining; one scooter left and another arrived, at most one ride in 33
    hours. They still show when the view reaches Dott St. Gallen's area,
    about a kilometre east, since a feed's scooters aren't clipped to its
    towns' areas ([Data sources](../DATA_SOURCES.md#mobility-data)).
- **France** ([guide](french-scooter-feeds.md#feeds-not-enabled)):
  - Central Paris has no shared scooters (banned in 2023).
  - Dott GPSEO answers 404; Dott OL Vallée was empty.
  - Lime Nice and Sophia Antipolis, Pony Nice, Limoges and Pays Basque, and Voi
    V'Lônes held no scooters. Lime Nice still listed e-bikes only on 25 October
    2026 (1,050), though Lime publishes it under the Licence Ouverte.
  - West of Paris, Lime's scooters run in eight towns of Saint Germain Boucles
    de Seine, now on the map; Bezons, Carrières-sur-Seine, Chambourcy, Chatou,
    L'Étang-la-Ville, Louveciennes and Mareil-Marly have its e-bikes only
    ([French guide](french-scooter-feeds.md#lime-west-of-paris-and-bird-agen-october-2026)).
  - Pony's other regions, read on 13 October 2026 with the key published for
    La Roche-sur-Yon: Tours, Orléans, Limoges, Nice and Marseille listed
    e-bikes only, Pays Basque e-bikes and one disabled scooter, and Paris 9
    scooters, all disabled. Caen, Olivet and Sète, which Pony's site lists,
    answered `UNKNOWN_REGION`.
  - Thirteen old Bird towns are empty (Bordeaux, Marseille and others).
  - Bird Bastia and Bird Gap, on the access point since November 2025, were
    fresh but listed no vehicle on 16 and 18 October 2026, while Bird
    Ajaccio listed about 200 scooters.
  - Lime Paris-Saclay, Nogent-sur-Marne and Les Lilas list e-bikes only, and
    YEGO's Paris, Bordeaux, Toulouse and Nice feeds list e-mopeds.
  - Dott Bourgoin-Jallieu has been offline (403 `ERR_REGION_OFFLINE`) since
    early October 2026, after 143 scooters on 7 September, and left the
    catalog on 15 October 2026. Neither the city nor Dott has published a
    closure ([French guide](french-scooter-feeds.md#dott-tignes-and-bourgoin-jallieu-october-2026)).
  - Lime Le Havre needs partner credentials.
- **Germany** ([guide](german-italian-scooter-feeds.md#known-gaps)):
  - Dott closed most of its public regions in September 2026. Since 24 October,
    63 regions use its anonymous app map, including Hamburg, Bremen, Nürnberg,
    Dortmund and Karlsruhe; Bochum uses its public GBFS feed again. Regions
    absent from the app map, such as Mannheim, remain gaps.
  - Bird München and Ulm list no vehicle; Bird left Ulm around 2022.
  - North Rhine-Westphalia's mobility data hub holds Bolt, Voi, Lime and Dott
    feeds for Köln, Düsseldorf, Essen, Dortmund and other towns, but only
    transport bodies and municipalities may use it. The state's other
    platform, NRW.Mobidrom, offers Voi's, Bolt's and Lime's feeds after a
    free registration: Voi's are on the map since 24 October 2026, and Bolt's
    and Lime's scooters come from their rider maps since 25 October.
  - Lime's public Hamburg feed answers 404, and its Oberhausen and Solingen
    feeds were too small or empty. Hamburg's and Oberhausen's Lime scooters
    come from Lime's rider map since 25 October 2026; there its Solingen
    region has no scooter zone.
  - Dresden shows Bolt only. The city lists RideMovi (since August 2025),
    Bolt (since March 2026) and Voi ("from autumn 2026") for e-scooters, and
    Lime and Voi for e-bikes only. Checked again on 28 October 2026, after an
    app user missed the other three:
    - Lime's public Dresden feed lists 1,288 e-bikes and no scooter, and its
      rider map's Dresden region has no scooter zone (25 October).
    - RideMovi publishes no feed: it is in neither MobilityData's list nor
      Transitous's, and the operators send their MDS data to the city only.
    - Voi has no public Dresden feed either. Its rider map would carry
      Dresden's scooters, but a region's zone id comes only from the app's
      zone list, behind the session the cache keeps, so its owner looks it
      up once Voi's scooters are out. Voi announced scooters and e-bikes from
      1 April 2026; the city still dates its scooters "from autumn 2026".
  - Duisburg: Bolt's scooters there are on the map since 25 October 2026,
    from its rider map. Ryde's and Lime's Duisburg feeds are only on the
    closed NRW hub (Ryde's answers 401), and Lime's own `duisburg` answers
    404; Lime's scooters there come from its rider map since 25 October 2026.
  - Zeus is moving its towns to ATOM Mobility. Rüsselsheim, Straubing,
    Kempten, Pforzheim, Göppingen, Schwäbisch Gmünd, Tübingen, Hagen,
    Hattingen and Heilbronn list only disabled scooters on `zeus.city`, and
    no ATOM feed lists them: Kempten's (187), Pforzheim's (191) and
    Heilbronn's (186) are empty, and 26 Zeus ids have GBFS disabled.
    Haßloch, Iserlohn, Falkensee, Dessau-Roßlau, Korntal-Münchingen,
    Eisenach, Gotha, Jülich, Wangen, Schwieberdingen, Sonthofen, Soest and
    Rottweil have no feed at all. Castrop-Rauxel, Duisburg, Friedberg, Gera,
    Herne, Jena, Marburg and Reutlingen list no available scooter.
  - Voi publishes eight Baden-Württemberg cities only, through MobiData BW.
  - Operators the city guides name that publish no feed, checked on 23
    October 2026: Lime in Regensburg (404), Voi in Regensburg and Bolt in
    Potsdam (neither publishes outside Baden-Württemberg). Lime's Regensburg
    scooters come from its rider map since 25 October 2026. Dott in Erfurt and
    Regensburg now comes from its app map; Erfurt also shows Yoio and Regensburg
    Zeus. Potsdam shows Dott, and Bolt's from its rider map since 25 October
    2026. Zeus Heilbronn still lists
    15 scooters, all disabled. Neither Erfurt nor Regensburg publishes its
    no-parking zones or parking spots as data, and the map draws only the
    operators' zones: Zeus's Regensburg feed lacks the Altstadt no-parking zone
    and the city's spots, and Yoio's Erfurt zones cover only part of the city's
    list (Anger, Krämerbrücke, Venedig, Fischmarkt, Domplatz, Wenigemarkt,
    Benediktsplatz).
  - Hopp Augsburg listed 42 scooters, all disabled and unchanged, on the
    evening of 13 October 2026; check it in spring.
- **Italy** ([guide](german-italian-scooter-feeds.md#known-gaps)): Bird in
  Roma, Palermo and Napoli and Elerent in Catania are covered.
  - Dott now covers 16 Italian regions through its anonymous app map, including
    Roma, Milano, Palermo and Torino. Genoa, Porto Torres, Viadanica and
    Vigliatore had no available scooter in the app sweep. Lime (Roma, Milano,
    Palermo) answers 404 everywhere; its scooters in ten Italian towns, from
    Roma and Milano to Rimini, come from its [rider map](lime-app-map.md) since
    25 October 2026. BIT Mobility (Napoli, Bari and others) is behind a login, and
    RideMovi answers 401. Bolt and Lime, which hold Catania's other permits,
    publish no feed.
  - Elerent Bologna listed one scooter on 13 October 2026. Elerent's Ragusa
    and Siracusa fleets have no public feed.
  - Bird Milano, Firenze, Torino, Moncalieri, Collegno, Rivoli, Nichelino and
    Sesto Fiorentino are empty, with a timestamp of 0. Milano revoked Bird's
    permit in July 2026, over scooters without plates. Torino and its four
    neighbours were still empty on 25 October 2026, while Bird Roma listed
    about 4,500.
  - Torino: Voi publishes no feed for Italy, and Lime's `torino` and `turin`
    answer 404 (25 October 2026); Lime's Torino scooters come from its rider
    map since that day. Torino's rules send operators' feeds only to
    the Comune and 5T. The Città metropolitana's new service, from about
    5 November 2026 at the latest, authorises only Dott (EM Transit) and Voi
    for scooters ([DD 3782, 7 August 2026](https://www.cittametropolitana.torino.it/sites/default/files/pagina/allegati/trasporti/SHARING/DD%20n.3782%20del%2007.08.2026_Autorizzazione%20al%20servizio%20in%20sharing.pdf));
    Bird and Lime run only until it starts.
  - Firenze banned shared scooters from 1 April 2026, and BIT's service in
    Prato ended on 31 December 2025. Lime's Firenze region held no scooter in
    its scooter zones on 25 October 2026, nor did its regions of Bergamo,
    Brescia, Lago di Garda, Parma and Livorno, which serves Pisa.
  - Zeus's Italian feeds are stale or empty (Anzio, Augusta, Mazara, Teramo,
    Modena, Reggio Emilia). Hopp Como held no scooters at night on 13 October
    2026 or that evening; check it in spring, and add it if it has some.
  - Helbiz and Link no longer resolve. Cooltra lists mopeds and e-bikes only.
    Pony's site lists Turin, but its server answered `UNKNOWN_REGION` for
    Turin and Torino.
- **Belgium** ([guide](belgian-norwegian-british-scooter-feeds.md#known-gaps)):
  - Brussels bans shared scooters from 1 January 2027, so Bolt's and Dott's
    feeds there should empty.
  - Pony publishes nothing for Brussels; its Brussels region, read with the
    key published for La Roche-sur-Yon, listed 4 scooters, all disabled.
  - Lime Brussels and Kortrijk, Dott Ghent and Mons and Bolt Ghent list
    e-bikes only, as do Hoppy's Vervoerregio West-Vlaanderen, Kempen, Dender
    and Genk systems. Bolt's scooters in Antwerpen, Liège, Charleroi, Namur
    and Dinant come from its [rider map](bolt-app-map.md) since 25 October
    2026.
  - Lime Antwerp and Dott Kortrijk answer 404. Bird Antwerp is empty. Lime's
    scooters in Antwerpen come from its rider map since 25 October 2026; the
    map's Brussels market held no scooter that day.
- **Norway** ([guide](belgian-norwegian-british-scooter-feeds.md#known-gaps)):
  - RideMovi in Bergen and Ryde in Drammen and Larvik still have no working
    source. RideMovi rechecked on 28 October 2026: it isn't in Entur's GBFS
    manifest (81 systems) or MobilityData's list, and Entur's mobility API
    holds no scooter within 8 km of central Bergen. Lime's Bergen scooters, about 2,100, come from its rider map
    since 27 October 2026, and Ryde's, about 4,700, from
    [Skyss's guest map](ryde-app-map.md#the-production-reader) since 28
    October.
  - Bergen kommune's 772 e-scooter zones (parking places, no-parking, slow
    and no-riding zones) are drawn since 29 October 2026, from the public
    layers of the city's map, which state no licence: since 28 October 2026
    such city layers are drawn, credited to the city (DATA_SOURCES.md).
  - Ryde's fleet in Kristiansand is missing from Entur. Its fleets in Asker,
    Bærum, Bodø, Lillestrøm and Lørenskog are on the map since 22 October
    2026. Dott publishes nothing for Bodø.
  - Lime Oslo is empty, and seven Bolt systems in Entur are empty.
  - Bolt Oslo's 2 scooters in Lørenskog and 1 in Bærum, which didn't move in
    ten minutes on 15 October 2026, are left out since that evening: Bolt has
    no area in either town, whose outlines now decide.
  - Dott Malvik held 15 to 17 available scooters on 13 and 14 October 2026,
    and 17 on Sunday 18 October, but none was ridden while it was polled:
    none moved in 16 polls from 12:07 to 13:23 that Sunday. Check it again
    in April 2027. Dott Melhus (7 to 11 available, a few of them ridden) and
    Skaun (6 or 7) are too small.
- **United Kingdom** ([guide](belgian-norwegian-british-scooter-feeds.md#known-gaps)):
  - Voi (London, Oxford, Cambridge, Essex, Northamptonshire and more) and Lime
    (London, the West Midlands, Salford and more) publish no public feed; both
    are on the map from their rider maps, Voi since 24 October 2026 and Lime
    since 25 October. TfL publishes no scooter positions.
  - Lime's Derby, Sheffield, Stoke-on-Trent and York regions have scooter
    zones but held no scooter near their centres on 25 October 2026, and none
    is a trial area. Check them again in April 2027. Its Nottingham and Oxford
    regions held no scooter in their whole scooter zones that day: Lime rents
    e-bikes there, and Dott and Voi run the two e-scooter schemes.
  - Zeus's UK feeds are stale; several Beryl and Dott schemes list bikes only.
- **Portugal** ([guide](portuguese-spanish-icelandic-scooter-feeds.md#known-gaps)):
  - Bolt (Lisboa, Porto, Faro, Coimbra) offers its GBFS only on request, on
    Portugal's access point; its scooters there and in Matosinhos and
    Santarém come from its [rider map](bolt-app-map.md) since 25 October
    2026. Lime has no public feed for Porto or Faro; its scooters there and
    in Oeiras come from its rider map since the same day.
  - Porto's FIWARE broker, which states no licence, still holds its shared
    scooters as they were on 8 October 2026 (checked 29 October), so they stay
    off the map. The city's 230 sharing points on it, last updated on 28
    October, are drawn as parking places since 29 October 2026
    (DATA_SOURCES.md). Porto's own
    mobility map server (`servergeo.cm-porto.pt`, `Portal_da_Mobilidade_ext`)
    answered "Serviço indisponível" (HTTP 500) that night.
  - Lisboa is ending shared scooters: its council approved on 21 October 2026
    ending its agreement with the operators and banning their scooters from
    the municipality, with 60 days to remove them, by the end of 2026. Bird and
    Lime Lisboa will then empty (January 2027 below).
  - Braga banned shared scooters in September 2026. Bird Braga and Faro are
    dead, and Bird Vila Nova de Gaia's 7 scooters never moved.
- **Spain** ([guide](portuguese-spanish-icelandic-scooter-feeds.md#known-gaps)):
  - Madrid, Barcelona, Valencia, Sevilla, Málaga, Zaragoza and the Basque
    Country have no shared scooters.
  - Lime's rider map still lists Madrid, Alcorcón, Málaga and Sevilla; none
    held a scooter in its full-area audit on the night of 25 October 2026.
  - Dott now covers Marbella, Playa de las Américas and Santa Cruz de Tenerife
    through its app map. Its other discovered Spanish regions had no available
    scooter. Bird in Oviedo and Las Palmas's public Sítyneta scooters have no
    public feed. Neither has Islaride (Grupo Tambor, "more than 500"
    scooters on several Canary Islands): it runs on ATOM Mobility, whose
    system id for it isn't public (18 October 2026).
  - Hopp Benidorm, Cartagena, Dénia, Fuengirola and Marbella are empty.
    Hoppy's Almería, Cartagena and Mojácar & Vera systems list e-bikes only,
    and its Roquetas de Mar, Magic World Resort and Cabo de Gata - Níjar
    systems are empty.
  - Benidorm's centre has no Hoppy zone: Hoppy's "Benidorm (Marina Baixa)"
    system serves Altea, L'Alfàs del Pi and La Nucía. Its zones in El Campello
    and the Torrevieja system's in Orihuela Costa held no scooters.
- **Iceland** ([guide](portuguese-spanish-icelandic-scooter-feeds.md#known-gaps)):
  - Bolt has run in the capital area since 2024, with no public feed; its
    Reykjavík market comes from its [rider map](bolt-app-map.md) since 25
    October 2026.
  - Hopp Hella / Hvolsvöllur (5 available of 17 on 13 October 2026) and
    Ísafjörður (3 of 16) held fewer than ten available scooters, and six
    other small Hopp towns none.
  - Hopp Siglufjörður has listed no scooters since the evening of 13
    October 2026, after about 20 the day before. Neither Hopp nor
    Fjallabyggð publishes a season, so it left the catalog on 15 October
    2026; its feed and zone remain.
- **Sweden** ([guide](swedish-scooter-feeds.md#known-gaps)): Lime in Uppsala
  and Hopp in Kiruna are covered by public feeds, and Voi (15 towns), Qick
  (7), Bolt (3) and Lime in Göteborg and Malmö by app maps.
  - Voi and Bolt publish no public feed.
    Voi's scooters in 15 towns come from its rider map since 24 October
    2026, and Bolt's in Stockholm, Malmö and Lund from its
    [rider map](bolt-app-map.md) since 25 October; Bolt's Göteborg market was
    empty that day. Dott names no Swedish town (29 October 2026); Göteborg's
    list no longer has it.
  - Ryde runs in 25 Swedish towns and publishes no feed, so none of its
    scooters there is on the map: Göteborg, Malmö, Uppsala, Helsingborg,
    Västerås, Jönköping, Linköping, Norrköping, Örebro, Borås, Karlstad,
    Lund, Umeå, Halmstad, Växjö, Eskilstuna, Östersund, Sundsvall, Luleå,
    Varberg, Falun, Borlänge, Höganäs, Kristianstad and Åhus
    ([locations page](https://www.ryde-technology.com/Locations), 29 October
    2026). Malmö gave it the largest share of its cap, 1,000 of 2,800
    scooters from 1 October 2026, and Göteborg lists it beside Voi and Lime
    (October 2026). In Norway its scooters come from Entur and, in Bergen,
    Skyss's guest map; no such source covers Sweden, and Ryde's own rider
    app isn't read ([investigation](ryde-app-map.md)).
  - Dott's 12 Swedish regions in the registry (Göteborg, Eskilstuna,
    Helsingborg and others) answer 404, and its Swedish listing is empty.
  - Lime Stockholm, Göteborg and Malmö answer 404. Lime's Göteborg and
    Malmö scooters come from its [rider map](lime-app-map.md) since
    25 October 2026; its Stockholm region held none that day, as Stockholm's
    permits went to Voi and Bolt alone from 1 July 2026.
  - Zeus Borlänge, Falun, Halmstad, Karlstad and Gävle list only disabled
    scooters, last reported in 2022 and 2023.
  - Qick's GBFS systems 5, 10, 53 and 104 answer "GBFS disabled", but its
    [authenticated ATOM map](atom-app-map.md) now supplies Örebro,
    Linköping, Norrköping, Jönköping, Eskilstuna, Falun and Borlänge.
    Västerås, Stockholm and Trollhättan were empty on 24 October 2026.
  - Sweden's national access point (trafficdata.se) has no shared-mobility
    data, and Stockholm's open data has scooter parking bays only, behind a
    key.
  - Göteborgs Stad publishes none of its e-scooter zones, so the map draws
    none (checked 29 October 2026). None of these is published: the pavement-parking
    ban inside Vallgraven and on Drottningtorget; the marked parking places it has
    built since May 2024; and the digital zones it passes to the operators through
    Vianova's Cityscope. Its map viewer (karta.goteborg.se, 133 WMS and 15
    WFS layers), its open GeoServer (open.geodata.tkgbg.se, 102 feature
    types, whose `cykel:cykelparkeringar` is a bicycle-rack survey of
    2013–2016) and its open-data catalogue hold none, and data.goteborg.se
    needs a key.
  - Donkey Republic, Styr & Ställ and Lundahoj are bikes only.
- **Latvia** ([guide](latvian-scooter-feeds.md#known-gaps)): Ride Mobility
  in Rīga is covered.
  - Bolt publishes no feed; its scooters in 12 Latvian towns, Rīga among
    them, come from its [rider map](bolt-app-map.md) since 25 October 2026,
    and its Saulkrasti and Lielvārde markets were empty that day. Skok (SIA
    Eterna Elect) publishes no feed either.
  - Ride's operating zones in Jūrmala and Jelgava held no scooter when
    checked. Jūrmala's held a few of Ride's Yadea Q20s, which its feed types
    as bicycles; the map leaves all of them out.
  - Ride's ids 1 to 400 on its ATOM host answer for Riga only, so no feed was
    found for Jūrmala, or for Ride in Estonia and Lithuania.
  - nextbike Latvia is empty, and the national access point
    (transportdata.gov.lv) has no shared-mobility data.
- **Poland** ([guide](polish-scooter-feeds.md#known-gaps)): Dott in
  Oświęcim, and Wołomin with Kobyłka and Radzymin, and Hopp in Knurów, Złotów
  and Września are covered. Dott left Sosnowiec on 27 October 2026: its region
  answers 404, and the feed is retired.
  - Dott's Polish site lists 85 places, but its public listing names those
    three regions only. Of its other 74 Polish entries in the registry, 73
    answer 404 (Warsaw, Kraków, Wrocław, Gdańsk, Poznań, Katowice and others)
    and Brzeg Dolny 403, still on the evening of 13 October 2026. The anonymous
    app map now supplies 37 more Polish regions, including those large fleets;
    Brzeg Dolny was empty on 24 October.
  - Lime (14 places, Warsaw and Kraków among them), Bolt and blinkee publish
    no public feed. Lime's scooters in Warsaw, Kraków, Łódź, Poznań, Wrocław
    and the Tricity come from its [rider map](lime-app-map.md) since
    25 October 2026; its 15 other Polish markets held none that day. Bolt's scooters in 25 towns come from its
    [rider map](bolt-app-map.md) since 25 October 2026; its Radom market was
    empty that day, and its Słupsk and Suwałki markets held no scooter. Dott now puts Warsaw, Kraków and the other
    large cities on the map. Voi doesn't run in Poland.
  - Hopp Wałcz listed 13 available scooters, but none moved between 23:41
    and 09:15 on a Tuesday, nor in 22 polls from 18:26 to 19:50 that
    evening; one was ridden in between. On Saturday 24 October it listed 4
    of 22, and none moved from 08:36 to 16:47. Check it again in April 2027.
    Środa Wielkopolska held 1 to 7, under
    ten. Lublin, Piła, Wągrowiec and Szamotuły listed disabled scooters only,
    and Oborniki, Słupca, Zgorzelec, Murowana Goślina and Trzcianka were
    empty. No Hopp feed was found for Gliwice.
  - The national access point register (dane.gov.pl dataset 1739) links
    Bolt's and blinkee's websites, with no API; its only GBFS feed is MEVO's
    bikes.
- **Hungary** ([guide](hungarian-scooter-feeds.md#known-gaps)): Hopp in Pécs
  and Békéscsaba is covered.
  - Dott now covers Budapest, Győr, Hatvan, Pápa and Dunaújváros through its
    anonymous app map, and Lime 15 markets, Budapest, Szeged and
    Székesfehérvár the largest, through its authenticated rider map since 25
    October 2026. Lime's Balaton region, on the lake's south shore, and Fót,
    Göd and Zalaegerszeg held no scooter that day. Lime and Dott (Budapest,
    Győr, Miskolc, Siófok and four other towns) publish no public feed: Dott's 8
    Hungarian regions in the registry answer 404, its Hungarian listing names
    none, and Lime's address answers 404 for each town tried. blinkee (2
    towns) publishes nothing either, and Bolt runs taxis only in Hungary.
  - Hopp Gyula's feed answers but held no scooter at night or by day, and
    Hopp's site doesn't list it. Of 57 other Hungarian towns tried at
    Hopp's address, none answered.
  - Budapest's 7th district (Erzsébetváros) voted in April 2025 that rental
    e-devices may not be used from 22:00 to 06:00 inside Károly körút, Király
    utca, Erzsébet körút and Rákóczi út
    ([resolution 149/2025](https://www.erzsebetvaros.hu/uploads/files/php2YGu2i-1746011602-2025_04_29_KT_kivonat_ny%C3%ADlt.pdf);
    [Infostart](https://infostart.hu/belfold/2025/05/16/sebessegsapka-uj-tilalmak-es-egyeb-szabalyok-erzsebetvarosban),
    16 May 2025, press). It sets terms for the district's future contracts;
    no report says it is enforced, and none was found on 25 October 2026
    either. At 22:08 that evening the apps still offered 48 Dott and 60 Lime
    scooters inside the ring. The Dott and Lime apps supply the currently
    available vehicles.
  - MOL Bubi and Donkey Republic are bikes only. The national access point
    (napportal.kozut.hu) lists timetables and road data, no shared mobility,
    and BKK's FUTÁR API needs a key and carries bike stations, not scooters.
- **Greece** ([guide](greek-scooter-feeds.md#known-gaps)): Hopp in Faliraki,
  Piraeus, Argostoli and Ioannina, and Hoppy on Rhodes, on Kos, in Rethymno
  and on Zakynthos, are covered.
  - Dott now covers Thessaloniki and Piraeus through its anonymous app map.
    Its Voula region was empty. Lime's public address answers 404 for Athens
    and Thessaloniki, but its rider map covers Athens, Kifisia, Thessaloniki
    and Heraklion since 25 October 2026. Bolt has no scooter area in Athens
    or Thessaloniki (25 October 2026).
  - Hopp Nafplio listed 17 or 18 available scooters, but none moved, left or
    came back in 35 polls from 12:03 to 16:47 Athens time on a Tuesday, while
    Faliraki, Piraeus, Argostoli and Ioannina had rides, nor in 22 polls from
    19:26 to 20:50, when Hopp took six in to charge. Its other scooters kept
    their ids from 02:10 that night to 20:50. Check it in the tourist
    season or on a weekend, and add it if its scooters are ridden. Nafplio's
    council discussed rental scooters on 8 May 2026; check for a decision
    first.
  - Hopp Athens (Kifisia), Voula, Zakynthos and Lefkada listed only disabled
    scooters, 1 to 7 each; Chania, Rethymno, Kos, Kardamena, Kalymnos,
    Trikala, Katerini, Preveza and Corinth listed none. Kos, Rethymno and
    Zakynthos have scooters on the map all the same, from Hoppy, whose
    Zakynthos scooters were ridden only once in 13 hours on 13 and 14 October;
    check them again in spring.
  - nextbike's four Athens suburbs have e-bikes only. The national access
    point (nap.gov.gr) is a landing page, and its catalogue timed out.
- **Cyprus** ([guide](cypriot-scooter-feeds.md#known-gaps)): Hopp in Paphos
  and Limassol is covered.
  - Bolt runs e-scooters in Nicosia, parked at fixed stations, with no
    public feed; they come from its [rider map](bolt-app-map.md) since 25
    October 2026. The national access point (traffic4cyprus.org.cy) offers
    Bolt's 255 Nicosia stations under CC BY 4.0, in DATEX II, with no
    vehicles or availability. Scroll ran in Nicosia in 2024; whether it still does is
    unverified.
  - Hopp Larnaca's feed answers but held no scooter, by night or by day, and
    Hopp's site doesn't list the town. Hopp Paphos's area around Polis and
    Latchi, 29 km north of Paphos, held no scooter either.
  - Bird, Lime, Dott and Zeus have nothing in Cyprus: Dott's Cypriot listing
    names no region, and the others' addresses answer 404 or 400 for each
    town tried. nextbike Cyprus is bikes and e-bikes only.
- **Finland** ([guide](finnish-scooter-feeds.md#known-gaps)): Hopp in
  Mariehamn, on Åland, is covered.
  - No mainland operator publishes a feed. Since 24 October 2026 the map
    shows Dott's scooters from its anonymous app map, in 20 regions including
    Helsinki, Espoo, Vantaa and Tampere, and Voi's from its rider map, in
    Helsinki, Turku, Tampere and Jyväskylä ([Dott](dott-app-map.md),
    [Voi](voi-app-map.md)). Ryde, which also runs in Helsinki, Espoo, Vantaa,
    Tampere and Turku, has no feed and isn't on the map. Bolt publishes none,
    and its Helsinki market had no scooter on 25 October 2026. Dott's 40 Finnish regions in the registry don't answer: 34
    answer 404, and 6 (Ekenäs, Hamina, Hanko, Imatra, Kalajoki, Kotka) are
    paused, probably for the winter. Bird Helsinki's feed is empty and stamped
    `last_updated` 0.
  - Fintraffic's separate national feed
    (`mobility-api.mobility-database.fintraffic.fi/gbfs`) is left out: the
    user dropped it on 27 October 2026. It needs a key, ordered with an
    account on the Mobility Database site; the two keys ordered on 23 and
    25 October 2026 were never activated, so it answered 403 to the end. Seen
    through Transitous on 18 October 2026, it listed 10,570 Dott scooters in
    27 towns that didn't move from 04:55 to 09:00 that Sunday, some in towns
    Dott reported as paused, so the data looked frozen. Finland stays on
    Dott's and Voi's rider maps and Hopp's feed.
  - Joe Scooter's Rauma feed (ATOM Mobility) answers but listed no scooter at
    night or in 21 polls from 17:00 to 18:01 on a Tuesday. Its other towns'
    feeds answer "GBFS disabled". Check Rauma in spring, and add it as a new
    provider if its scooters are ridden.
  - The national access point (finap.fi) lists Voi's static NeTEx for Helsinki,
    Turku, Tampere and Jyväskylä: zones, prices and hours, no vehicles.
    Digitransit needs a key and carries city bikes only. Donkey Republic and
    Helsinki's city bikes are bikes only.
  - Helsinki, Espoo, Vantaa, Turku and Oulu ban renting or riding on weekend
    nights. Helsinki, Espoo and Vantaa now have curfew entries; Turku and Oulu
    are still absent from the map.
- **Croatia** ([guide](croatian-scooter-feeds.md#known-gaps)): Hoppy in
  Rijeka is covered.
  - Hopp Omiš held 11 scooters, all disabled, at night and on the evening of
    13 October 2026, and again near midnight.
  - Hoppy Crikvenica (ATOM id 2302) answers, with three scooter types, but
    listed no scooter at 18:50 or near midnight on 13 October 2026. Hoppy
    started there this season, from Dramalj to Selce; check it in spring.
  - nextbike Croatia's country feed holds 2 docked scooters, one each at
    Vodnjan and Svetvinčenat, in Istria.
  - The national access point (promet-info.hr) carries road and traffic data,
    not shared vehicles.
- **Ukraine** ([guide](ukrainian-scooter-feeds.md#known-gaps)): 3electra in
  Kyiv is covered.
  - E-wings runs scooters in Kyiv with no public feed. Bolt publishes none
    either; its scooters in 13 towns, Kyiv among them, come from its
    [rider map](bolt-app-map.md) since 25 October 2026, and its Dnipro,
    Poltava, Kharkiv, Chernihiv and Mukachevo markets were empty that day.
  - 3electra's feed puts scooters it doesn't show in Lima, Peru, by the
    hundred in the evening. The map keeps each at its last place in Kyiv
    for ten minutes, then drops it with the city's bounds.
    Why, and when, isn't published; only 3electra can say.
  - Systems 65, 67 and 68 on 3electra's host answer 400.

- **United States** ([guide](american-scooter-feeds.md)): Hopp (Bolt) and Veo
  in Washington, DC, Bird in 28 towns (4 from its rider map since 28 October
  2026), Lime in 75 (58 of them from its rider map since 26 October 2026), Veo in 39 more, Spin in 29 and Lyft in Chicago
  and Portland are covered.
  - **No public feed:** a survey on 16 October 2026 found no unread US feed.
    Fleet sizes are from [Ride Report](https://public.ridereport.com/)'s
    public dashboards and the Bureau of Transportation Statistics'
    [2026 list](https://data.bts.gov/d/cqdc-cm7d).
    - **Lime** publishes nothing for most of its American towns. Its rider
      map has supplied 58 of them since 26 October 2026, about 48,500
      scooters: Los Angeles, Austin, Milwaukee, Portland, OR (beside Lyft),
      Salt Lake City (beside Spin and Veo), Spokane, Dallas (beside Bird), Long
      Beach, Minneapolis (beside Spin), Boise, Tampa, Sacramento, Phoenix
      (beside Spin), Indianapolis, Albuquerque, St. Paul (beside Spin),
      Boulder, Charlotte, Orlando, Nashville (beside Bird and Spin), Omaha,
      Tucson, Tulsa, St. Petersburg, Oklahoma City, Raleigh, Bellevue, Mobile,
      Corpus Christi, Lubbock, Little Rock, Redmond, Everett, Alexandria
      (beside GCOO), Rochester, MN, Grand Junction, Winston-Salem, Cincinnati,
      South Lake Tahoe, Montgomery County, MD, Jacksonville, Knoxville, Isla
      Vista, Bothell, Lansing, Scottsdale, Berkeley (beside Veo), Arvada,
      Spokane Valley, West Sacramento, Richmond (beside Bird and Spin), Edmond,
      Clearfield, Fairfax, St. Louis Park, Jenks, North Salt Lake and Tualatin
      ([guide](american-scooter-feeds.md#lime-supplement--26-october-2026)).
      Still without one: Farmington, Utah, where three audits found 2
      scooters and none to check them against, and smaller towns.
    - **Bird** in Oklahoma City, whose operating area held no scooter within
      3 km of its centre on 27 October 2026; the area is 26 km across, so it
      is still to be swept whole. Its rider map has supplied
      Austin, Bloomington, IN, Charlotte, Jacksonville, Mankato, Sacramento,
      Wilmington, NC, and Yonkers since 28 October 2026
      ([Bird's rider app](bird-app-map.md)).
    - **GCOO** in Memphis, 10 scooters in four areas on 24 October 2026. Its
      Los Angeles, Alexandria and Arlington fleets are on the map since that
      day, read from its app's signed-out map
      ([South Korea's guide](south-korean-scooter-feeds.md)).
    - Lime's partner feed is for transit agencies, and the cities' MDS data
      is the city's own.
    - Houston licenses no shared scooters.
  - **No ride seen:** Bird Miami (33 to 39 available scooters), Bird
    University of Central Florida (286 to 299) and Bird Orlando (451 to 467)
    were live but showed no ride, or one at most, in 59 polls from 16:34 to
    21:24 EDT on 14 October 2026. So was Spin East Lansing, the city's feed
    (10 to 12, a few last reported days before), in 69 polls to 22:14 EDT.
    A recheck in 24 polls from 17:47 to 19:44 EDT on 15 October found the
    same: Bird Orlando's 468 to 474 scooters made one new position, the
    University of Central Florida's none, Miami's 35 to 41 two, and Spin
    East Lansing none. Another, from 12:00 to 14:00 EDT on 16 October, found Bird
    Orlando and UCF still unridden, and Bird Miami with three rides at most
    ([guide](american-scooter-feeds.md#bird-and-lime)). On the
    evening of 21 October, from 17:32 to 19:34 EDT, Bird Miami's 16 to 18
    scooters, half last week's, lost none from their places and gained two
    elsewhere, while Bird Indianapolis lost about 120 an hour. Miami, Orlando
    and UCF are checked on 15 January 2027, and East Lansing on 15 April 2027.
  - **Outside their operator's towns:** since 15 October 2026 a feed keeps no
    scooter inside the outline of a town where its operator has no area, so
    Veo Santa Monica's 1 or 2 in Culver City, Lime Oakland's 1 in Emeryville
    and Veo Berkeley's 1 in Oakland are left out. Bird Cleveland's in
    Cleveland Heights, University Heights, South Euclid and East Cleveland
    count there since 26 October 2026, where its zones let rides end.
  - **Lime Grand Rapids** lists no scooter. The city now names Veo its
    exclusive operator ([Mobile GR](https://www.grandrapidsmi.gov/departments/mobile-gr/mobility/shared-micromobility/)),
    and Lime's rider map held none there in a full-area audit on the evening
    of 25 October 2026. Nor did it in Charleston, where Lime runs e-bikes
    with MUSC Health, or on 26 October in Carthage, Missouri, whose city
    council voted on 26 May 2026 not to bring Lime's scooters back for the
    summer, and Norman, Oklahoma, where the city lists only Veo among the
    companies licensed to rent e-scooters
    ([e-scooters](https://www.normanok.gov/residents-visitors/transit-parking/e-scooters)).
  - **Washington, DC:** Bird's feed lists no available scooter in the
    District, Spin's and Lyft's none at all. Veo's `arl` feed is the same fleet
    as `xdc`, which is covered. Lime's, which answered 404 in mid-October, has
    been covered since 25 October 2026.
  - **Dormant Bird feeds:** 51 of Bird's American feeds list no available
    scooter, most with a `last_updated` of 0: Akron, Albuquerque, Alexandria,
    Ann Arbor, Athens (GA), Baltimore, Beaumont, Champaign, Charlottesville,
    Cheyenne, Columbus and Ohio State, Davis, Dayton, Denver, Detroit,
    Durham, East Lansing, Fayetteville (AR), Fort Collins, Fort Myers, Green
    Bay, Lansing, Louisville, Mayagüez, Milwaukee, Minneapolis, Montgomery
    County (MD), Pawtucket, Ponce, Portland (OR), Providence, Provo, Raleigh,
    Redding, Roanoke, Saint Paul, San Francisco, San Juan, San Marcos, Santa
    Clara, South San Francisco, St. George, St. Petersburg, Stillwater,
    Tallahassee, Tampa, Thornton, Tucson, the University of Akron and the
    University of Utah. Bird Phoenix lists 8 scooters in town.
  - **Stale:** Bird Chicago's feed was 4 days old, Bird Seattle's 7 days, and
    Bird Salt Lake City's scooters last reported 15 days before; Lyft Denver's
    feed was 667 days old.
  - **Empty or gone:** Lime's Denver and Portland (OR) feeds answer 404, and
    Lime Cleveland and Bolt Austin list no scooter. Lime Santa Monica and Spin
    Salt Lake City hold 1 and 2 scooters. Spin lists none in Tempe, Tucson, Los
    Angeles, Santa Monica, Chicago, Lansing, Dayton, Dallas, San Marcos,
    Alexandria, Arlington (VA), Milwaukee or Cheyenne, and only e-bikes at Penn
    State; its UCF feed answers 404. Veo lists no scooter in Colorado Springs,
    Pensacola, Indianapolis, Memphis, Austin or Seattle, at College Station
    one, and only its seated or pedal vehicles at the University of Alabama,
    Orlando, Urbana-Champaign, Bend and Oregon State; its `lac`, `san` and `spe`
    feeds, for towns it doesn't name, are empty. Veo Tampa holds 1 scooter.
  - **Duplicates:** Bird's University of Kentucky feed is its Lexington feed,
    Spin's `ohio_state` and `osu` its Columbus feed, Spin's `richmond` its
    `richmond_va`, and Veo's `oak` and `smo` its `xeb` and `xla`.

- **Canada** ([guide](canadian-scooter-feeds.md#known-gaps)): Bird and Lime
  in 14 towns of Alberta, British Columbia, Ontario and Nova Scotia are
  covered, and Lime from its rider map since 26 October 2026 in Ajax,
  Coquitlam, Laval, Montréal's Parc Jean-Drapeau, Port Moody, Richmond and
  Vaughan, and since 27 October in its former Neuron towns: Saskatoon,
  Regina, Red Deer, Lacombe, Blackfalds and Waterloo Region (Kitchener,
  Waterloo and Cambridge).
  - **Banned or not allowed:** Toronto bans shared scooters, apart from
    private sites such as the Distillery District; Montréal doesn't allow
    them in its streets, only on Parc Jean-Drapeau's islands; London, ON did
    not join the provincial pilot's scooter sharing. Lime rents only e-bikes
    in New Westminster, which isn't in British Columbia's e-scooter pilot,
    and in Victoria.
  - **Bird:** its Saskatoon, Ajax and Surrey feeds listed no vehicle on 14
    October 2026, and its Kelowna feed none either, as Lime is the town's
    operator; Lime's Ajax scooters are covered. Bird's other 2026 towns
    publish no feed: Lethbridge, Medicine Hat, Red Deer, Chestermere,
    Okotoks, Cochrane, Spruce Grove, Stony Plain, Penticton, Vernon,
    Kamloops, Cranbrook, Regina, Mississauga, Brampton, Oshawa, Pickering and
    Laval answer 404 "Invalid organization slug" for 14 forms of each name,
    and its Airdrie and St. Albert scooters had no feed either. Since 28
    October 2026 Bird's rider map supplies thirteen of these towns ([Canada's guide](canadian-scooter-feeds.md#bird-supplement--28-october-2026)).
    On 27 October its areas in Airdrie and Chestermere held no scooter near
    their centres, and it showed no area in Red Deer, Regina or Laval; Lime's
    Airdrie, Red Deer, Regina and Laval scooters are covered. Bird Canada
    lists Pickering among its towns, and its area there, 29 km across, was
    read only near its centre: still to be swept whole.
  - **Neuron:** its 12 Canadian feeds answer 404 since Lime bought it on 3
    July 2026. Lime's feeds already hold Airdrie, St. Albert and Beaumont,
    and its rider map the other towns since 27 October 2026, but for Sylvan
    Lake, where its Red Deer region has no zone.
  - **MoVe:** its [authorized app map](move-app-map.md) now supplies
    Fredericton, Moncton and Saint John in New Brunswick. No MoVe scooters
    in Halifax or Dartmouth were observed, despite the store listing.
  - **Gone:** Spin's feed host answers with Bird's API, Roll's doesn't answer
    (Calgary, Kelowna, Ottawa), Link closed at the end of 2023, Hopr's
    certificate has expired (and its systems are e-bikes), and Zip's
    (Joyride's) host no longer resolves.
  - **Bikes only:** BIXI, Bike Share Toronto and the other PBSC systems, Mobi
    in Vancouver, Hamilton's SoBi, Locomotion and Lime Victoria.
  - **No bays:** Lime publishes no parking in Ottawa or Mississauga, where
    rides must end in designated spots, and Bird and Lime none in Edmonton's
    Mill Woods (see the guide's [parking](canadian-scooter-feeds.md#parking)).
- **United Arab Emirates** ([guide](emirati-scooter-feeds.md#known-gaps)):
  Dott in Dubai, with its Dubai Hills fleet, and in Abu Dhabi, and Lime in
  Dubai, Abu Dhabi and Al Ain, from its rider map since 26 October 2026, are
  covered.
  - **Too few rides yet:** Dott's Dubai feed holds 12 or 13 scooters in Hatta,
    which none rode in 10.5 hours on Thursday 15 October 2026; Hatta is a
    weekend and cool-season place. Dott Sharjah (93 to 96 scooters at
    University City, about 7 rides in 11 hours), Dott Ras Al Khaimah (32 to
    34, about 2 rides) and Al Ain, in Dott's Abu Dhabi feed (16 to 18, about
    2 rides), are left out until they are ridden more. See
    [Dates to check again](#dates-to-check-again).
  - **No public feed:** Skurtt and Arnab, which the RTA also licenses in
    Dubai. Lime publishes none either: about 40 of its slugs (`dubai`,
    `dubai_uae`, `uae` and the districts) answer 404, so its scooters come
    from its rider map. Bird's `abu-dhabi` feed answers with no vehicle and a
    time of 0.
  - **Lime's Al Mirfa and Madinat Zayed zones,** in Al Dhafra, held no
    scooter in their full-area audits on 26 October 2026.
  - **Gone:** Yaldi's ATOM host (`yaldi.rideatom.com`, system 511) no longer
    resolves, and yaldi.ae now rents cars.
  - **Bikes only:** Careem BIKE, docked bikes in Dubai and Abu Dhabi.
  - **Dubai Pulse,** the emirate's data portal, has no scooter feed, and its
    datasets need a key.
- **Saudi Arabia** ([guide](saudi-scooter-feeds.md#known-gaps)): SAHAM in
  Riyadh and Dott in Jeddah are covered.
  - **Dott Riyadh:** 93 to 99 scooters, all in Boulevard City, about 10 rides
    in 12.5 hours on 15 October 2026. Riyadh Season opens there on 21 October;
    check from 23 October, in the evening.
  - **Dott Sports Boulevard** (`sbf`): 44 or 45 scooters, all at one depot,
    which never moved. **Dott STC City:** empty, with a free plan, on the stc
    headquarters campus, not a public service.
  - **Dott Makkah:** empty, with a free plan; it may run in the Hajj.
  - **No public feed:** Wing, Barqscoot, SPIDERS and Rabbit; BSKL, whose App
    Store listing has five times SAHAM's ratings, runs on Joyride, whose
    three feed hosts no longer resolve (18 October 2026); Green Arrows, on
    ATOM Mobility, has no host that answers.
  - **open.data.gov.sa** did not answer.
- **Israel** ([guide](israeli-scooter-feeds.md#known-gaps)): Bird, Dott and
  Lime in 13 towns of Gush Dan, Bird and Lime in Ashdod, and Lime in Eilat,
  Lime's two from its rider map since 26 October 2026, are covered.
  - **Left out:** Bird in Caesarea, 49 to 52 scooters with only 5 new
    positions in 9 hours on 15 October 2026, and 41, 40 then 37 on the
    morning of Sunday 18 October, three leaving and none arriving in 20
    minutes; Dott in Givat Shmuel (6 to 11
    scooters, one arrival in the day), Kiryat Ono (2 or 3) and Ramat
    HaSharon; Lime in Bat Yam and Ramat HaSharon; Bird in Petah Tikva and
    Pardes Hanna-Karkur, about one scooter a poll each. The map drops their
    scooters rather than count them under a neighbour.
  - **Bird's zones** outline service areas in Hadera, Afula, Beit She'an,
    Rosh HaAyin, Eilat and Jerusalem's Har Hotzvim, none of which held a
    scooter on 18 October 2026.
  - **Bird `tel-aviv`:** a duplicate of Bird `israel`: 1,502 of its 1,517
    positions are also in `israel`, under other ids, so reading both would
    count about 1,550 scooters twice.
  - **Holon** decided to ban shared scooters from 17 September 2026; the
    court froze the ban until the city decides again, after a review due by
    15 October. Its scooters still ride, so Holon is covered.
  - **Open data:** data.gov.il has cycle networks only; tel-aviv.gov.il
    answers HTTP 571 outside Israel, and gov.il 403 to scripts.
  - **No shared scooters found** in Jerusalem, Haifa or Be'er Sheva on 16
    October 2026. Jerusalem's only service was a 2019 pilot in Har Hotzvim,
    and Bird's nationwide `israel` feed has no scooter in any of the three.
- **New Zealand** ([guide](new-zealand-scooter-feeds.md#known-gaps)):
  Flamingo in Auckland, Christchurch, Wellington, Dunedin, Tauranga,
  Palmerston North, Porirua, Rangiora and Kaiapoi, JOLT in New Plymouth
  and Rolleston, and Lime in Auckland, Christchurch, Hamilton, Wellington and
  Palmerston North, from its rider map since 26 October 2026, are covered.
  - **JOLT `hutt_valley`:** 30 scooters in Lower Hutt and 14 in Upper Hutt
    in the median poll, none ridden in polls on the evening of Thursday 15
    October and the morning of Friday 16 October 2026, the commute included.
    On Sunday 18 October, from 14:28 to 15:18 New Zealand time, it held no
    scooter at all. See [Dates to check again](#dates-to-check-again).
  - **JOLT `napier`:** 53 zones and no scooter; not in the registry.
  - **Too few rides:** Lincoln, in JOLT's `selwyn` feed (about 9 scooters),
    and Woodend and Pegasus, in Flamingo's `waimakariri` feed (about 5),
    none ridden. The map drops their scooters rather than count them under
    Rolleston or Rangiora.
  - **No public feed:** Beam, in Queenstown, Taupō and Whangārei, whose feed
    host answers 401 and whose signed-in map samples returned no scooters on
    24 October 2026 (see [the Beam integration](beam-app-map.md)). Neuron has
    left New Zealand.
  - **Zone curfews:** Wellington bans hiring in the Courtenay precinct from
    21:00 to 06:00 on Thursday, Friday and Saturday nights and public-holiday
    eves (its code of practice v9.0, §7.4), and Flamingo says hiring stops
    from 22:00 on Friday and Saturday in curfew areas of Auckland and
    Tauranga, and every night in Auckland's Wynyard Quarter. None of these
    zones has an official boundary to fetch, so `rental-curfews.json` holds
    none (see the guide's [Rules](new-zealand-scooter-feeds.md#rules)).
  - **Auckland's licences** for Flamingo and Lime expire in November 2026,
    with no new round.
- **Costa Rica** ([guide](costa-rican-scooter-feeds.md#known-gaps)): Hopp in
  Tamarindo is covered.
  - **e-moob,** on ATOM Mobility, runs a smaller fleet in Tamarindo, but its
    systems 1688 and 2319 answer "GBFS disabled". e-moob, or ATOM, would have
    to switch the feed on; no one has asked.
  - **The law:** Ley 9078, art. 124, bars from public roads the devices the
    law doesn't authorise, e-scooters among them by a traffic officer's
    reading (Teletica, 23 July 2026); its text on SCIJ couldn't be read. Ley
    10834 adds "movilidad activa", by non-motorised means, from about 20
    December 2026. Neither stops a rental (see the guide's
    [Rules](costa-rican-scooter-feeds.md#rules) and
    [Dates to check again](#dates-to-check-again)).
  - **Nothing else found** in Costa Rica, San José included.
- **Caribbean Netherlands**
  ([guide](caribbean-netherlands-scooter-feeds.md#known-gaps)): Hopp on
  Bonaire, in Kralendijk, is covered. Nothing was found on Sint Eustatius or
  Saba.
- **Turkey** ([guide](turkish-scooter-feeds.md#known-gaps)): BinBin's 13
  service areas in 12 cities are covered by its guest app map since 24
  October 2026 ([the collector](binbin-app-map.md)). No public GBFS was found,
  and İstanbul's, İzmir's and Konya's open-data portals hold parking and
  routes only; U-NET is not public, and AAR Bike Konya is bicycles.
  - **Martı** runs scooters across Turkey. Its map needs a stored rider
    token, and its map and public configuration requests got HTML 403 from
    the Mac and Netcup.
  - **Hop**'s app host is `api.hoplagit.com`: its configuration answers, but
    its nearby-scooters route answers JSON 403 without a rider session, and
    no guest flow was found. `gbfs.heyhop.app` is not that app's endpoint.
    See [the app investigation](turkish-app-maps.md).
  - **BinBin at İstanbul Airport** (İGA) is not swept: two scooters on 24
    October 2026, 15 km north of İstanbul Avrupa.
- **South Korea** ([guide](south-korean-scooter-feeds.md#known-gaps)): GCOO in
  76 towns, Swing in 66, Xingxing in 32, Deer in 31, Alpaca in 29, Kickgoing
  in 9 and DART in 6 are covered, read from their apps' signed-out maps,
  Swing's and Deer's, from Swing's map, with its app's one-time code, DART's without the phone sign-in its app asks for
  (the user's choice, 25 October 2026), and Beam's 28 regions, in 36 towns,
  from its rider map.
  None of the operators publishes a feed, and Seoul, Busan and Daejeon
  publish only parking, towing and statistics. Seoul had 18,548 shared
  scooters in December 2025, down from 43,417 in October 2023.
  - **Deer** is read from Swing's map, as Swing bought Deer's business in
    July 2024 and its map gives Deer's scooters `vendor: "DEER"`. Its link
    opens Deer's app, but a phone's browser without the app lands on its
    host's "page not found", and iPhone builds before 1.2.0 leave its
    scooters out of the totals.
  - **DART** answers its map request as user 0, with an empty token or
    ours, though its app shows the map only after a phone sign-in: it could
    close that at any time by checking the token. Its 34 scooters in Anseong, Pyeongtaek
    and Hwaseong on 26 October, under 30 a town, are not shown.
  - **TAGO:** the government's API (data.go.kr dataset 15117668) lists
    scooters with their battery, but not as GBFS, and only in Sejong: GCOO's
    2,800 or so, and Alpaca's 1,368, frozen. It needs a personal key, which
    only Korean nationals and businesses registered in Korea can get. See
    [Dates to check again](#dates-to-check-again).
  - **Bikes:** GCOO's and Swing's maps hold bicycles and e-bikes too, Swing's
    mopeds as well, which the map leaves out. In Seoul they are most of both
    fleets: GCOO has no scooter system there, and Swing 545 scooters.
- **Estonia** ([guide](bolt-country-scooter-feeds.md#estonia)): Bolt in ten
  towns is covered, from its [rider map](bolt-app-map.md) since 25 October
  2026.
  - Ride Mobility publishes no feed, and its ATOM ids answer for Riga only.
- **Lithuania** ([guide](bolt-country-scooter-feeds.md#lithuania)): Bolt in
  eight towns is covered, from its rider map since 25 October 2026.
  - Ride Mobility publishes no feed. Bolt's Marijampolė market was empty that
    day.
- **Slovakia, Bulgaria and Moldova**
  ([guide](bolt-country-scooter-feeds.md#slovakia)): Bolt in Bratislava,
  Nitra, Sofia, Varna, Burgas and Chișinău is covered, from its rider map
  since 25 October 2026.
  - Dott publishes no feed in any of the three. Bolt's Trenčín market was
    empty that day, and its Košice, Žilina, Banská Bystrica and Martin
    markets have no scooters.
  - Lime's rider map lists six Bulgarian markets, Sofia, Plovdiv, Varna,
    Burgas, Ruse and Stara Zagora; none held a scooter in its full-area audit
    that day, while Bolt's map showed about 620 in Sofia.
- **Slovenia** ([guide](bolt-country-scooter-feeds.md#slovenia)): Bolt in
  Ljubljana is covered, from its rider map since 25 October 2026.
  - Kvik's feed exists only as a relay scraping its app (see
    [Skipped](#countries-not-covered-yet) below). Bolt's Koper and Maribor
    markets were empty that day.
- **Ireland** ([guide](bolt-country-scooter-feeds.md#ireland)): Bolt in
  Wexford is covered, from its rider map since 25 October 2026.
  - Moby and Bleeper are bikes. Public funding for scooter schemes was paused
    in July 2026. The registry files Beryl Belfast under Ireland; it is in
    the United Kingdom and lists no scooter.
- **North Macedonia, Bosnia and Herzegovina and Kosovo**
  ([guide](north-macedonian-bosnian-kosovar-scooter-feeds.md#known-gaps)):
  BinBin in Skopje, Sarajevo and Pristina is covered, from its guest app map
  since 25 October 2026.
  - BinBin's Mostar area held no scooter that day, and BinBin left Banja
    Luka on 17 August 2026. E-Enjoy, in Skopje, runs on Joyride, whose feed
    hosts no longer resolve.

## Countries not covered yet

Surveyed on the night of 12–13 October 2026: MobilityData's GBFS registry, the
national access points, Dott's country listings, a scan of Bolt's and ATOM
Mobility's feed ids, Hopp's town list, and guessed Bird, Lime and Hopp
addresses for each country's towns. Survey files were not kept; rerun the
checks before relying on a count.

Surveyed again on 14 October 2026, from 12:27 to 13:00 CEST, with the
countries further east: the registry, the national open-data portals, the
operators' sites and a new scan of 250 Bolt ids. Nothing had changed in the
countries already listed, apart from Slovenia's relayed feeds below. Of the
Bolt ids, the same 9 public ones answer 200, and id 355 now answers 400
instead of 401.

Surveyed a third time on 18 October 2026: the national access points,
Transitous's provider list, MobilityData's registry, Dott's country listings
and name-based Lime and Bird addresses, with daytime polls of the leads.
Nothing new, apart from Hopp's empty Bucharest feed (Romania, below) and
Fintraffic's in Finland, since dropped (see Finland, above).
No access point held vehicle positions; see 1 December 2026 under
[Dates to check again](#dates-to-check-again).

**Not covered, by decision:** Russia (the user's decision of 14 October 2026).

**Mexico,** surveyed on 14 October 2026 with Canada, and again on 15
October with Latin America, now has JET, Whoosh and Lime app-map coverage.
Its public GBFS gaps remain below. Check again on 1 March 2027.

- **Ciudad de México** has no rental scooters. SEMOVI's pilot ended on 31
  August 2026, when the temporary permits of Lime, JET and Whoosh lapsed, and
  SEMOVI has not decided whether they return
  ([Publimetro, 2 September 2026](https://www.publimetro.com.mx/noticias/2026/09/02/semovi-frena-scooters-en-cdmx-termina-piloto-y-evaluara-si-regresan/),
  [Xataka](https://www.xataka.com.mx/automovil/cdmx-retira-scooters-renta-registrar-117-000-viajes-semovi-evalua-su-regreso-definitivo-nuevas-reglas)).
  Lime's feed (`data.lime.bike/api/partners/v2/gbfs/mexico_city`) answers
  but has listed no vehicle since, nor at 15:11, 15:50 and 16:04 Mexico City
  time on 15 October 2026. Whoosh's Mexico City region (`MMMX`), added with
  its rider map, reports its season over: it was removed on 24 October 2026,
  with the city, which has no season to come back in.
- **Lime** runs scooters in Querétaro (since January 2025) and in Monterrey
  and Guadalupe (since September 2025), with no public feed: about 40 slugs
  tried (`queretaro`, `monterrey`, `guadalupe`, `san_pedro_garza_garcia`,
  `nuevo_leon` and others) answer 404. Querétaro is covered through Lime's
  [rider app map](lime-app-map.md) since 24 October 2026 (56f6ec6), and
  Monterrey and Guadalupe, one zone, since 26 October 2026. Its rider map
  also lists Ciudad de México and León; neither held a scooter on the
  evening of 25 October 2026, Mexico City time.
- **Whoosh** is integrated through its [authenticated rider map](whoosh-app-map.md):
  Monterrey/San Pedro, plus Zapopan, whose region reported its season over
  on 24 October 2026: the map shows Zapopan paused for the season until
  Whoosh opens it again. Its GBFS remains private. The [Go Jet adapter](gojet-app-map.md)
  supplies Monterrey–San Pedro signed out (491 available scooters in the
  complete sweep). Go Jet listed Mexico City but returned no scooter there.
  **Movo** has left Mexico.
- **Bikes only:** Ecobici in Mexico City, whose feed lists no vehicle, and
  MiBici in Guadalajara.
- **Benji,** in Mérida, runs on OTORide, whose `/gbfs` paths answer 404.

**Skipped:** Slovenia's relayed feeds; Bolt's Ljubljana scooters come from its
[rider map](bolt-app-map.md) since 25 October 2026. Two live feeds were found
on 14 October 2026, both served by a community relay, gbfs.derp.si. MobilityData added 15 of its feeds
to the registry on 22 September 2026 and removed them the next day, for lacking
a licence. Neither is published by its operator:

- **Bolt Ljubljana** (`https://gbfs.derp.si/bolt_proxy/2/359/gbfs`): 413 to
  420 available scooters, ridden while polled from 12:44 to 13:00. Bolt's own
  feed 359 answers 401, and the relay passes it on with login details Bolt
  issued to someone else. Bolt's
  [GBFS licence](https://bolt.eu/en/legal/security-gbfs-license/?category=micromobility),
  clause 2.g, forbids access other than through Bolt's authorised interface.
  The rider map shows the same fleet.
- **Kvik** (`https://gbfs.derp.si/gbfs/kvik/gbfs.json`): 45 available
  scooters in Ljubljana, 39 in Koper, about 30 in Piran–Portorož and 3 in
  Izola. The relay builds it by scraping Kvik's app API
  (api.kvik.ezlines.com), a private rider API the audit standard excludes, and
  its liveness is weak: 4 scooters moved in 15 minutes, and the feed stamps
  each response with the time it was asked for. Add it if Kvik publishes an
  official feed.

**Nothing public:**

| Country | Why |
| --- | --- |

| Netherlands | No shared standing scooters: the national data hub (CROW) lists 27,000 shared vehicles and no scooter. They need type approval and, since July 2025, a plate. Check and Felyx run mopeds, and 7 Felyx feeds answer 410 |
| Denmark | Voi’s authenticated map now supplies Aarhus, Odense and Aalborg, and Lime's authenticated rider map København and Odense since 25 October 2026. Lime's Aarhus market held no scooter in its full-area audit that day; Hopp Roskilde held 1 disabled scooter on 13 October 2026 |
| Czechia | Lime České Budějovice is now mapped through its full operating polygons, and Brno and Ostrava since 25 October 2026. Lime's Praha, Liberec and Olomouc markets held no scooter in their full-area audits that day. Prague banned shared scooters from 1 January 2026; Golemio's feed needs a token. Bolt's rider map still has a Prague market, with no scooter on 25 October 2026, and none for Brno, Ostrava, Olomouc or České Budějovice |
| Romania | Lime Deva is now covered, and București, Cluj-Napoca, Iași, Alba Iulia, Sibiu, Târgu Mureș and Târgoviște, like Bolt's eight markets from its [rider map](bolt-app-map.md), since 25 October 2026. Lime's Arad, Brașov, Constanța and Galați markets held no scooter in their full-area audits that day, and Oradea's a single one. Its PBSC bike-share feeds list a scooter type with no scooters. Hopp's `ro-bucharest` feed answers but held no scooter at night or in 7 polls from 08:30 to 09:30 on Sunday 18 October 2026, and Hopp's site no longer lists Bucharest; check it again in April 2027 |
| Serbia | Belgrade suspended its call for 2,000 scooters on 15 July 2026, a day after opening it; check again in January 2027 |
| Malta | Rental scooters banned since March 2024 |
| Luxembourg, Monaco, Liechtenstein | Bikes and e-bikes only; MonaBike lists a scooter type with no scooters |
| Belarus, Georgia, Armenia, Azerbaijan, Kazakhstan | Bolt's GBFS answers 401, and so does Whoosh (`api.whoosh.bike/gbfs`). Bolt's [rider map](bolt-app-map.md) supplies Almaty since 25 October 2026 (1,222 scooters); its Tbilisi, Batumi, Kutaisi and Baku markets were empty that day, and Astana's held no scooter. Eleven, Yandex Go, Urent, JET, Mimo, BusyFly, YerevanRide, Ozim and Scroll publish nothing, and Kolobike has closed; the [signed-out Go Jet map](gojet-app-map.md) now supplies Almaty (4,552 available scooters), Baku (3,004) and Batumi (1,422). JET's separate Central Asian app still needs a rider sign-in; Go Jet does not establish Tbilisi, Armenia or the rest of Kazakhstan. Whoosh's [authenticated collector](whoosh-app-map.md) covers Minsk, Borisov, Soligorsk, Almaty and Astana, with Kazakhstan's two regions currently season-closed. No registry rows, no ATOM Mobility systems, nothing on the national open-data portals. Almaty is the biggest fleet: about 22,500 scooters in April 2026, with JET holding over 70% of the market. Yerevan has about 1,500 (JET and YerevanRide) |
| Vatican City | No operator. Bird Rome's geofence forbids riding over St Peter's, the Gardens and the Museums, and none of its 4,454 vehicles stood inside at 12:37 on 14 October 2026 |
| Qatar | wer2, in Doha, is on ATOM Mobility, but its 11 systems (1824, 1836, 1837, 1838, 1840, 1841, 2050, 2109, 2110, 2132, 2143) answer "GBFS disabled". Loop, Dart, OWLO, Fenix and Falcon Ride publish no feed; OTORide, which runs OWLO, answers 404 on every `/gbfs` path. data.gov.qa has no scooter data. Dott's Qatari terms (changed 23 September 2025) name TIER Mobility Doha, but Dott lists no Qatari region and its Qatari slugs answer 404 (18 October 2026). Loop had over 500 scooters in 2020 and wer2 over 700 in 2022. wer2, or ATOM, would have to switch the feed on; no one has asked |
| Kuwait | eFly is on ATOM Mobility, but its systems 2253 and 2340 answer "GBFS disabled". BSKL, Rabbit, Rent it (on OTORide) and e-Fly Scooters and More (on Joyride) publish no feed. E-scooters have been banned on Kuwait's public roads since 31 October 2020. eFly, or ATOM, would have to switch the feed on; no one has asked |
| Oman | Biko, in Muscat, is on ATOM Mobility, but its 7 systems (1445, 1532, 1533, 1534, 1535, 1593, 1869) answer "GBFS disabled", and `biko.rideatom.com` no longer resolves. Salik, which ran the transport ministry's trial at Knowledge Oasis Muscat, is ATOM system 1118 and answers "GBFS disabled" too. Biko, Salik or ATOM would have to switch the feed on; no one has asked |
| Bahrain | Hopp's `bh-bahrain` feed holds 13 or 14 scooters on three sites (Zallaq, Manama, Amwaj), about 2 rides in 10.4 hours on 15 October 2026, and still 14 on 18 October: too few. Spiders, Fenix and BSKL publish no feed; data.gov.bh has no scooter data. Since Resolution 58 of 2026, scooters may ride only in designated zones |
| Egypt | Rabbit, in Cairo, Giza and Alexandria (about 700 scooters in 2024, the last count), publishes no feed, and Cairo's governor ordered e-scooters seized |
| South Africa | Zippy's [authorized rider map](south-african-scooter-feeds.md) now supplies Langebaan's Club Mykonos area. Its systems 2028, 2075 and 2318 still do not provide public GBFS. Cape Town has app polygons but no available scooters were observed |
| Senegal | Reby Mobility runs e-scooters in Dakar (Mermoz, Ouakam, Almadies, Ngor) on ATOM Mobility (`reby-mobility.rideatom.com`). Its system id isn't public, so no feed was found (18 October 2026) |
| Ghana | Hopp's `gh-accra` feed holds 13 scooters, all disabled with no range, at a depot, by night and by day (02:40 and 12:48 UTC on 18 October 2026) |
| Jordan | Sky Scooters (on OTORide) and E-Ride publish no feed; Dott's listing names no region |
| Lebanon | No scooter feed found, and Loop's 2017 service is gone; Dott's listing names no region |
| Morocco | No scooter feed found; Dott's listing names no region |
| Tunisia | No scooter feed found |
| Kenya | No scooter feed found; Little's pilot at the University of Nairobi (about 200) publishes none, and Dott's listing names no region |
| Nigeria | No scooter feed found; Dott's listing names no region |
| Rwanda | Guraride is docked bikes; eWaka's planned scooters (500, then 1,000, announced in 2023) aren't confirmed running. No scooter feed found |
| Mauritius | No scooter feed found |
| Namibia | No scooter feed found |
| Australia | Beam is integrated in [11 collection regions](beam-app-map.md). Lime is covered in Brisbane, since 26 October 2026 in Port Phillip and since 27 October in Canberra, from its rider map; its Gold Coast region, where it rents e-bikes, and its Sydney region, a single small zone in St Peters, held no scooter on 26 October, nor did its Perth region, where the city suspended e-scooter hire in June 2025, on 27 October. About 8,000 scooters in about 20 towns: Brisbane (Lime 1,700 and Beam), Canberra (Lime, about 1,200), Adelaide (Neuron and Beam, about 940), Darwin (Beam, up to 750), Port Phillip (Lime and Neuron, about 460), Townsville, Cairns, Perth's Stirling and Beam's regional towns. Neuron's and Beam's feeds (one company since September 2025) answer 401, Beam's signed-in collector is integrated (see [coverage and verification](beam-app-map.md)), and Lime answers 404 for about 80 town names; no state's or city's open-data portal has positions (Brisbane publishes monthly trip counts). New South Wales's trials (Forster-Tuncurry and Wollongong, to 22 January 2027) send their data to a closed government platform. Flamingo's `sydney` feed is still a static test on 18 October 2026: 2,331 scooters that never move, with new ids at every poll, at Transport for NSW's Crash Lab test site. Check again on 1 March 2027 |
| Japan | LUUP is now covered through its authenticated rider map in 19 cities, using standing-scooter counts at ports (see [coverage and verification](luup-app-map.md)). Lime is covered in Naha, Tokyo and Yokohama from its rider map; its Tokyo region's Chiba and Kawasaki (Takatsu) zones held no scooter on the morning of 26 October 2026. Private campuses and resorts, and Saitama's sampled ports with no standing scooters, remain outside the reviewed catalog. JOJO and TOCKLE run on Joyride, whose three feed hosts no longer resolve. Beam still lists Osaka City on its page for partner cities, but its rider page no longer lists Japan (both read on 29 October 2026), and the catalog holds no Japanese Beam region. The national open-data hub (ODPT) has bike-share feeds only (docomo bike share, HELLO CYCLING) |
| Malaysia | Zeus's Kuala Lumpur feed holds 47 scooters, all disabled, last reported two to five years ago. Beam's [authenticated collector](beam-app-map.md) supplies ten collection regions, including campus networks in Johor and Sarawak; Neuron publishes no feed |
| Taiwan, Hong Kong, Singapore, Thailand, Indonesia, the Philippines, Vietnam, India | No registry row, and no guessed address answers. Beam, in Indonesia and Thailand (Bangkok's at Chulalongkorn University's Samyan campus), answers 401, and its signed-in map samples returned no scooters on 24 October 2026 (see [the Beam integration](beam-app-map.md)); Moovr, in Manila's BGC and Makati, runs on Joyride, whose feed hosts no longer resolve. Taiwan's shared fleets are seated mopeds, with stand-up scooters only in local pilots; Hong Kong bans e-scooters and Singapore shared ones; India's Yulu runs seated vehicles |
| Uzbekistan, Mongolia, Kyrgyzstan | JET, which runs in Uzbekistan and Mongolia and in Kazakhstan, Georgia, Armenia and Azerbaijan, publishes no feed, and its app map needs a rider sign-in (see [the app investigation](jet-whoosh-beam-luup-app-maps.md)), nor do Whoosh, Urent, SunRent and E-motion in Bishkek. Ulaanbaatar is the biggest: JET put 3,000 scooters there in 2023 and planned 6,000 more. Silk Road Sharing, in Samarkand (ATOM Mobility system 1976), and IZZY, in Tashkent (1918), still answer "GBFS disabled" on 18 October 2026. Check again on 1 April 2027 |
| Pacific islands | Pineapple, in Samoa (ATOM Mobility system 1359), answers "GBFS disabled" and its site is down; Kai Ride (2118), whose place is unknown, too. France's access point (transport.data.gouv.fr) has nothing for Nouméa or Papeete |
| Montenegro, Albania, Andorra, San Marino, Gibraltar, Faroe Islands | No scooter feed found (Hopp Tórshavn held 13, all disabled, at night and on the evening of 13 October 2026). Albania has banned e-scooters from urban roads and pavements since 13 October 2025 (Instruction 169, upheld when the Constitutional Court refused a challenge on 4 June 2026). BinBin's guest app map still held 14 scooters in Tirana on 25 October 2026, seven of them flat, and none was ridden in 17 minutes that Sunday afternoon (see [the Balkan guide](north-macedonian-bosnian-kosovar-scooter-feeds.md#known-gaps)). Check again in April 2027 |
| Colombia | Lime `bogota` answers but lists no vehicle (16:11 to 17:04 Bogotá time, 15 October 2026, and again at 15:51 on Saturday 24 October). Whoosh's [authenticated Medellín map](whoosh-app-map.md) is integrated; its GBFS feeds remain private. Yango, in Valledupar (400+) and licensed in Medellín, publishes no feed; its Bogotá launch waits for the city's rules. datos.gov.co has nothing. Check again on 1 March 2027 |
| Brazil, Chile | The [signed-out Go Jet adapter](gojet-app-map.md) now supplies 48 Brazilian collection regions (32,263 available scooters) and Santiago and Temuco in Chile (3,713 combined). Brazil has about 45,000 to 55,000 scooters in 50 or more towns, most of them JET's (it claims 40,000 to 50,000 vehicles in 53 cities), with Whoosh in São Paulo, Curitiba and Florianópolis. Chile has about 14,000 in about 20 towns: Whoosh 8,000+, Lime 3,500, JET 2,000+. Whoosh's [authenticated collector](whoosh-app-map.md) now lists nine Brazilian and seven Chilean regions; its GBFS feeds remain private; Go Jet's app signing is reproduced by the Node collector, without a rider account; Lime Chile answers 404 for about 75 slugs. Lime has left Brazil. São Paulo and Rio receive live data for the city's use only, and datos.gob.cl and dados.gov.br have no scooter data. Check again on 1 April 2027 |
| Peru | No fleet. The scooters 3electra's feed places in Lima at night are Kyiv's, moved there by its mask, with the same codes (see the [Ukrainian guide](ukrainian-scooter-feeds.md)). Whoosh's Lima feed is private, like its others, and on 24 October 2026 its app had no active region there |
| Puerto Rico, US Virgin Islands | Bird's four Puerto Rico feeds (`san-juan-puerto-rico`, `guaynabo-puerto-rico`, `mayaguez-puerto-rico`, `ponce-puerto-rico`) publish their zones but no vehicle, with a timestamp of 0. Skootel, on OTORide, and KICK RIDE PR publish no feed; VIBES has left the US Virgin Islands. Check again on 1 April 2027. A feed there would need a decision: under the United States as a region (`PR`, `VI`), which needs `timeZoneProblem()` in `scripts/country-catalog.mjs` to accept America/Puerto_Rico and America/St_Thomas there, and gives prices before tax (Puerto Rico's IVU is 11.5%), or as a country of its own |
| Aruba, Curaçao | e-moob, in Aruba (150+ scooters), is on ATOM Mobility, but its systems 1688 and 2319 answer "GBFS disabled", and so does Smart Wheels's 1875, in Curaçao. Aruba banned e-scooters from public roads in July 2026, and the courts upheld it. Check again on 1 April 2027. Each would be a country of its own (AW, CW), as Bonaire is |
| Dominican Republic | Hopp `do-punta-cana` held 24 available scooters of 26, in Cap Cana, but none was ridden on the evening of 15 October 2026, nor on Sunday 18 October from 08:47 to 12:57 Dominican time (27 polls, 10 minutes apart: the same 23 of 25 available, none moved more than 6 m). Check again on 19 December 2026. Hopp `do-las-terrenas` held 2 scooters, none available: check again on 15 January 2027. HappyVolts, in Santo Domingo, is a company's staff fleet |
| Argentina, Uruguay and the rest of Latin America and the Caribbean | No scooter feed found: also Paraguay, Bolivia, Ecuador, Venezuela, Central America outside Costa Rica, Jamaica, Cuba, Haiti, Trinidad and Tobago, Barbados, the Cayman Islands, the Turks and Caicos Islands, Sint Maarten and the French Antilles. Lime has left Argentina, Uruguay's last operator left by December 2025, and Guayaquil's transit agency seizes scooters. Breeze, in the Bahamas, runs on OTORide and publishes no feed |

Bolt publishes only two public scooter feeds in Europe, Brussels and Liverpool;
its other systems answer 401. Its [rider map](bolt-app-map.md) supplies its
other markets in the covered countries since 25 October 2026. Dott made most regions private in September 2026.

The Middle East and Africa were surveyed on 15 October 2026, from 06:27 to
17:37 UTC: MobilityData's GBFS registry, Dott's country listings and about 110
guessed Dott and Bird slugs each, Lime's, Spin's, Lyft's, Veo's and Zeus's
addresses, a scan of ATOM Mobility's systems, Hopp's town list, the app stores
and the national open-data portals. ATOM's "GBFS disabled" answers mean the
operator has a system but hasn't made its feed public. Survey files are in
`/tmp/scoot-providers/middle-east-africa/`, which isn't kept.

Asia and the Pacific were surveyed on 15 October 2026, with polls from 06:33
to 08:53 and from 19:00 to 20:50 UTC: MobilityData's GBFS registry, the
national open-data portals, guessed Bird, Dott, Hopp, Lime, Neuron, Beam,
Spin and Zeus addresses for each country's towns, a scan of ATOM Mobility's
systems and the operators' sites. Only New Zealand had feeds to add. Survey
files are in `/tmp/scoot-providers/asia-pacific/`, which isn't kept.

Asia and the Middle East were surveyed again on 18 October 2026, with polls
at 10:39, 10:49 and 10:59 UTC: Dott's index
(`gbfs.api.ridedott.com/public/v2/gbfs.json`, 435 feeds of 62 regions, not
all of its European ones), whose 11 Middle Eastern regions are all known, 79 more name-based Dott slugs from Qatar to Japan (all 404), Bird's,
Lime's and Hopp's addresses, ODPT, BODIK and e-Gov in Japan, 175 datasets
of data.go.kr in Korea and the portals of ten Turkish cities. Nothing new
to add. Dott's GBFS 3 feeds answer 401 without a key. Survey files are in
`/tmp/scoot-providers/asia-zones-pass/`, which isn't kept.

Latin America and the Caribbean were surveyed on 15 and 16 October 2026,
with polls from 21:11 UTC on the 15th to 02:11 UTC on the 16th: MobilityData's
GBFS registry, about 860 guessed Hopp slugs, 190 Lime and 185 Bird ones,
Spin's, Lyft's and Veo's addresses, Dott's country listings, a scan of ATOM
Mobility's systems, about 85 OTORide operator hosts, the app stores of 20
countries, the operators' sites and 12 open-data portals. Only Costa Rica and
Bonaire had feeds to add. Survey files are in
`/tmp/scoot-providers/latin-america/`, which isn't kept.

## Dates to check again

- **After 26 October 2026:** applications to Rome's new operator selection
  close. Rome's scooter permits ran from 1 September 2023 to 31 August 2026 and
  are extended (D.D. QG 1649/2026) for the time the selection needs; the press
  gives 31 October 2026, the day the bike-sharing permits end. The selection
  picks up to three scooter operators, who then have 150 days to start
  ([Roma Servizi per la Mobilità](https://romamobilita.it/eventi-e-news/selezione-operatori-servizi-di-micromobilita-sharing/)).
  Check that Bird Roma still publishes after both dates, and whether the
  winners do.
- **Tuesday 10 November 2026:** Zeus's move to ATOM Mobility. Nothing had
  changed on 20 October 2026: the 26 ids still answered "GBFS disabled", the
  empty ones still listed no vehicle, MobiData BW still had the same 11 Zeus
  feeds, and the four `zeus.city` towns were still live. Probe the ids that
  answer "GBFS disabled" and the empty ones (82, 183, 184, 186, 187, 191, 192,
  193) for the ten moved towns, and MobiData BW's listing for new Zeus feeds.
  Check that `zeus.city` still lists available scooters in Bamberg,
  Ludwigsburg, Regensburg and Schweinfurt; a feed that lists only disabled
  scooters has frozen, so read that town from its ATOM id. Check again every
  few weeks until the move is done, at one request a second on
  `zeus.rideatom.com`; id 189 is a warehouse.
- **Friday 23 October 2026, 18:00 to 22:00 Riyadh time:** Dott Riyadh, in
  Boulevard City (`riyadh`): 93 to 99 scooters and about 10 rides on 15
  October 2026, before Riyadh Season opened there on 21 October. Poll it every
  five minutes; Dott renews ids after each trip, so count rides as the
  [Saudi guide](saudi-scooter-feeds.md#rides) does, and add it to
  `data/saudi-scooter-feeds.json` if it is ridden. Poll Dott Jeddah too, in
  the catalog on about 23 rides that evening: if it shows none, take it out.
- **29 October 2026, in the afternoon:** Bird in Caesarea, Israel: 49 to 52
  scooters in Bird's `israel` feed on 15 October 2026, but only 5 new
  positions in 9 hours. Add an area for Caesarea if they are ridden.
- **After 4 November 2026:** Auckland's two-year e-scooter licences, for
  Flamingo and Lime, expire in November 2026, and the council holds no new
  round
  ([Auckland Council](https://www.aucklandcouncil.govt.nz/en/licences-regulations/e-scooter-licences-regulations-auckland.html)).
  Check that Flamingo's `auckland` feed still lists scooters that are
  ridden; if it empties, take it out of `data/new-zealand-scooter-feeds.json`.
- **Early November 2026:** Beam Geraldton (`beam_au_geraldton`). Beam's
  agreement with the City of Greater Geraldton runs to the end of October 2026,
  and on 28 July 2026 the council voted for a new two-year deed with Beam,
  whose terms the chief executive settles (item CEO152,
  [minutes](https://www.cgg.wa.gov.au/council-meetings/ordinary-council-meeting/28-july-2026-ordinary-meeting-of-council/243/documents/confirmed-minutes-ordinary-meeting-of-council-28-july-2026-public.pdf)).
  The council's draft safety terms of January 2026 turn hired scooters off from
  midnight to 5:30; whether the deed keeps them isn't public. On 25 October
  2026 Beam's map listed 221 to 225 scooters there from 00:50 to 05:30 Perth
  time, as by day. Compare the first November nights with the day, and add a
  night ban to `data/rental-curfews.json` if the scooters go. Beam's map gives
  no availability, so a ban might leave the count alone: look for rides after
  midnight too.
- **November 2026:** Beaumont's pilot runs "until the end of October 2026",
  and Lime's licence there to the end of 2026. Check that Lime's Edmonton feed
  still holds scooters in Beaumont, and whether the town goes on in 2027;
  remove its area from `lime_ca_edmonton` if it doesn't. Check again in April
  2027.
- **November 2026:** Lime's Regina, Waterloo Region, Lacombe and Blackfalds
  markets, from its rider map since 27 October 2026. None of the four
  publishes a season ([Canada's winter section](canadian-scooter-feeds.md#winter)):
  if Lime takes its scooters in, pause each from the day it empties until
  spring, as Leduc.
- **November 2026:** Bird's rider-map towns, from its map since 28 October
  2026. Only Penticton announced its end (below); Kamloops's agreement with
  Bird runs to 1 November, Cranbrook's last two seasons ended that day,
  Okotoks's scooters "will soon be removed", and Medicine Hat, Brampton,
  Oshawa, Cochrane, Vernon, Mankato and Bloomington have emptied for the
  winter before, by Bird's or the town's choice ([Canada's winter section](canadian-scooter-feeds.md#winter)). Pause
  each from the day its area empties until spring, as Leduc.
- **November 2026:** Holon, Israel. The city decided to ban shared scooters
  from 17 September 2026
  ([ice, 9 August 2026](https://www.ice.co.il/local-news/news/article/1124736));
  the court froze the ban until the city decides again, after a review due by
  15 October
  ([ice, 10 September 2026](https://www.ice.co.il/law/news/article/1129448)).
  If the ban goes ahead and the feeds empty there, remove Holon's areas from
  the three Israeli feeds and its outline from `data/town-outlines.json`.
- **Saturday 21 November 2026, or a Saturday after:** Hatta, in Dott's Dubai
  feed, by day: 12 or 13 scooters, which none rode on 15 October 2026. If they
  are ridden, add Hatta as an area of `dott_ae_dubai`, with bounds of Dott's
  Hatta zone plus 1 km.
- **Late November 2026:** Dott Sharjah, at University City: 93 to 96
  scooters and about 7 rides in 11 hours on 15 October 2026. Add it if it is
  ridden more as the weather cools.
- **December 2026:** Halifax's pilot runs to 30 November 2026 by the council
  report of 9 July 2024, with a possible extension into 2027, or for two years
  from 15 May 2025 by the project page. Check whether Bird's Halifax feed and
  the pilot go on; last winter Halifax paused from 15 December to 16 March.
- **December 2026:** Al Ain, in Dott's Abu Dhabi feed (16 to 18 scooters), and
  Dott Ras Al Khaimah (32 to 34): about 2 rides each on 15 October 2026. Add
  each if it holds about ten scooters that are ridden.
- **December 2026:** London's trial, in its third phase since September 2026
  under two contracts, one of them Lime's: see who holds the other, and
  whether Transport for London publishes the scooters' data.
- **1 December 2026:** the EU's rule on multimodal travel information
  (Delegated Regulation (EU) 2024/490) requires shared-scooter availability on
  each country's national access point for the cities on the main EU transport
  network, among them Vienna and Warsaw, and in Spain Santa Cruz de Tenerife,
  Oviedo, Murcia and Las Palmas. Austria, Spain, Portugal, Poland and the
  Netherlands may publish feeds then. Portugal's access point already lists
  Bolt's GBFS, on request; look there for Lime and Bird too. Look on
  Germany's Mobilithek for Bolt, Voi and Lime outside Baden-Württemberg. So may Slovenia, for Ljubljana: look
  for Bolt's feed 359 there, or at `mds.bolt.eu`, and for an official Kvik
  feed. On 18 October 2026 none of these access points held vehicle
  positions: Austria, Bulgaria, Czechia, Denmark, Estonia, Finland, Greece,
  Ireland, Italy, Lithuania, Luxembourg, the Netherlands, Poland, Romania,
  Slovakia and Slovenia. Check them all between 2 and 15 December.
- **1 December 2026:** JOLT in New Zealand: `hutt_valley` again, which held
  no scooter on the afternoon of Sunday 18 October; `napier`, which had no
  scooter; and Lincoln, in
  `selwyn`, with about 9 scooters none rode. Poll each on a weekday morning
  and a weekend afternoon, New Zealand time.
- **19 December 2026:** Hopp Punta Cana (`do-punta-cana`), unridden on the
  evening of 15 October and on the morning of Sunday 18 October 2026: poll
  it by day. If its scooters are ridden, add the Dominican Republic, naming
  the town for Cap Cana, where the scooters stand, or for Punta Cana, with
  the other as an alias.
- **20 December 2026:** Costa Rica's Ley 10834, which adds "movilidad
  activa" to the traffic law twelve months after it was published (Alcance
  164 to La Gaceta 239, 19 December 2025). Read its official text, and
  art. 124 of Ley 9078 on SCIJ, and update the
  [Costa Rican guide's rules](costa-rican-scooter-feeds.md#rules) if either
  says anything of e-scooters.
- **Mid-November 2026:** Bærum's and Asker's winter dates. Both towns close
  renting in winter on dates each year's announcement sets (Bærum's season
  ended on 10 December in 2025), and none was published by 22 October 2026.
  Once they are, give Voi's Bærum / Asker feed and Ryde's Asker and Bærum
  feeds a `seasonal` window, as Lillestrøm's.
- **Early December 2026:** Ryde Bodø, paused from 1 December to 1 April by
  the season Bodø kommune gave for 2025. If its scooters are still ridden
  after 1 December, the 2026 terms changed: drop the pause.
- **Late November 2026:** Lime's and Spin's St. Paul season is "typically"
  mid-April to mid-November (the 2026 agreements estimate "on or around November
  15th", and the City may extend it to 31 December), Veo Cedar Rapids' may run through November, the University of
  Toledo's Veo fleet goes from mid-November, and Veo Rochester's in
  mid-December. None has a fixed date, so the catalog pauses none. Check that
  the feeds empty when the fleets go; if one keeps listing available scooters
  through the winter, look for the city's dates and add a `seasonal` window.
- **1 January 2027:** Brussels's ban starts; Bolt and Dott Bruxelles should
  empty.
- **Early January 2027:** Bird and Lime Lisboa. Lisboa's council approved on
  21 October 2026 ending its agreement with the operators and banning shared
  scooters from the municipality: after 10 days for the operators to answer
  in writing, they have 60 days from formal notice to remove them, by the end
  of the year by Lusa's account, or the council removes them at their cost.
  The vice-mayor, Gonçalo Reis, expected none left by the end of January
  ([RTP](https://www.rtp.pt/noticias/pais/nao-prevemos-regresso-camara-espera-ja-nao-ter-trotinetas-em-lisboa-em-janeiro-de-2027_n1772050)):
  if the feeds still list scooters, look again in February. "Feed empty"
  reports each feed 3 days after it empties: that is the ban, not an outage.
  Then take both out of the catalog and Lisboa out of the map's towns, and
  update the Lisbon guides (`src/guides/pt/trotinetes-lisboa.ts`,
  `src/guides/en/e-scooters-lisbon.ts`) and the Portuguese guide. If a feed
  still lists scooters just outside the municipality, narrow its bounds
  instead.
- **January 2027:** Spin Pawtucket. The pilot was extended to the end of
  2025 "with the potential for a one-year renewal through 2026", and its
  2023 rules ban renting from 23:00 to 05:00, but its scooters were ridden
  after 23:00 on 14 and 21 October 2026 and no newer rule is published (see
  the guide's [Night bans](american-scooter-feeds.md#night-bans)). Check
  that the city publishes terms for 2027, add their hours if they set any,
  and take the feed out if the program ends. UC San Diego's fleet, ridden
  after midnight on 21 October despite the city code's ban from midnight to
  02:30, needs no recheck.
- **15 January 2027:** Bird Orlando and Bird University of Central Florida,
  live but unridden on 14 and 16 October 2026, and Bird Miami, unridden on
  the evening of 21 October. Poll each on a weekday
  afternoon beside a Bird feed on the map, matching scooters by place, and
  add it if its scooters leave their spots about as often.
- **15 January 2027:** Hopp Las Terrenas (`do-las-terrenas`), in the
  Dominican Republic: 2 scooters, none available, on 15 October 2026. Add it
  if it holds about ten available scooters that are ridden. Hopp Accra
  (`gh-accra`) too, whose 13 scooters were all disabled on 18 October.
- **January 2027:** Ballarat, whose Neuron scheme ended on 31 March 2026,
  chooses a new operator, and Rio de Janeiro accredits its operators under
  edital CCPAR 01/2026: see whether either publishes a feed.
- **January 2027:** Belgrade's call for 2,000 scooters, suspended in July
  2026, and Vienna's scooter concessions, whose 2023 licences were for three
  years: see whether either asks operators for a public feed.
- **February 2027:** Helsinki drafts its 2027 permit terms from this
  season's data: see whether they ask operators for a public feed.
- **February 2027:** New South Wales's scooter trials (Wollongong and
  Forster-Tuncurry) end on 22 January 2027 and the state decides what
  follows: look for a public feed, and check Flamingo `sydney` sooner than
  March if Sydney is opened to scooters.
- **1 March 2027:** Dott Bourgoin-Jallieu, offline since early October 2026.
  Check `bourgoin-jallieu` and Dott's French listing, and add it again if it
  lists scooters that are ridden.
- **1 March 2027:** Lime Ciudad de México, empty since SEMOVI's pilot ended
  on 31 August 2026, and Lime Bogotá (`bogota`), empty on 15 October 2026.
  Check Lime's Monterrey and Guadalupe slugs, Whoosh (its Mexico City region,
  removed on 24 October 2026, and Zapopan), JET and Yango again too, and
  whether SEMOVI has let scooters back into Ciudad de México.
- **1 March 2027:** Korea's TAGO API (data.go.kr dataset 15117668), from
  its page only, without a key: it listed Sejong alone on 18 October 2026.
  If it adds Seoul or another big city, the key is still the obstacle: only
  Korean nationals and businesses registered in Korea can get one. Beam's,
  GCOO's, Kickgoing's and Swing's own app maps are on the map since 24 October
  2026, Alpaca's and DART's since 25 October ([guide](south-korean-scooter-feeds.md)).
- **1 March 2027:** Flamingo `sydney`
  (`data.rideflamingo.com/gbfs/3/sydney/gbfs.json`), a static test feed on
  15 October 2026, and Neuron's, Beam's and Lime's Australian feeds. Add
  Australia if New South Wales approves operators and Flamingo's feed lists
  scooters that move; Australia then needs a list of its states, so
  addresses read "Sydney NSW 2000".
- **Late March 2027:** Bird Penticton, paused from 1 November until 1
  April by the city's notice that its first season ended on 31 October 2026.
  The scooters came out on 30 March in 2026: if they are back before 1 April,
  move `until` to that day; in October 2027, set `from` by the city's notice.
- **1 April 2027:** Hopp Bucharest (`ro-bucharest`), empty on 18 October
  2026, in case Hopp starts a season there.
- **1 April 2027:** Lichtensteig, out of the map's towns since 18 October
  2026. If Dott St. Gallen's scooters there move on a weekend, put
  `lichtensteig` back in `SYSTEM_EXTRA_AREAS` in `src/lib/feedCoverage.ts`
  and its area in `data/swiss-scooter-areas.json` (as in git history).
- **1 April 2027:** Bird Bastia and Bird Gap
  (`mds.bird.co/gbfs/v2/public/provider/bird/<town>/gbfs.json`), empty on 16
  and 18 October 2026. If either lists about ten scooters that are ridden,
  add it like Bird Ajaccio.
- **1 April 2027:** Bulle, Grenchen and Nyon, out of the map's towns since
  15 October 2026. Check Bird Grenchen (`bird-grenchen`) and Bird Bulle
  (`bird-platform-partner-jmfleets-bulle`) on sharedmobility.ch and at
  `mds.bird.co/gbfs/v2/public/<town>`, whether Zisch still names Grenchen and
  JM Fleets's Trott' app publishes a feed, and Voi's Nyon stations for
  scooters. If one lists about ten available scooters that are ridden, take
  its system out of `LEFT_OUT_SWISS_SYSTEMS` and put the town back in
  `data/swiss-scooter-areas.json` (for Nyon, drop its entry in
  `REGION_ALIASES`).
- **1 April 2027:** Uzbekistan's ATOM Mobility systems, Silk Road Sharing
  in Samarkand (1976) and IZZY in Tashkent (1918), which answered "GBFS
  disabled" on 15 and 18 October 2026. If either answers with scooters,
  Uzbekistan needs its time zones (`Asia/Tashkent`, `Asia/Samarkand`) and
  prices in UZS. The Gulf's ATOM systems too: wer2 (1824 and the rest,
  Qatar), eFly (2253 and 2340, Kuwait), Salik (1118) and Biko (Oman), and
  Hopp `bh-bahrain`, which held 14 scooters on three sites. Sweden's Qick
  (5, 10, 53 and 104) too.
- **1 April 2027:** Latin America and the Caribbean: Bird's four Puerto Rico
  feeds; ATOM Mobility's e-moob (1688 and 2319, Aruba and Tamarindo) and
  Smart Wheels (1875, Curaçao), which answered "GBFS disabled"; Whoosh's feed
  hosts, JET's API and Lime's Chilean slugs. Aruba would need a search box of
  its own that keeps out Venezuela's Paraguaná peninsula, 27 km south.
- **15 April 2027:** Bird Ajax and Bird Surrey, empty on 14 October 2026; the
  Durham Region pilots run from April to October. Lime Grand Rapids too, and
  look for a Veo feed there, and Spin East Lansing (`east_lansing`), the
  city's feed. Laval's season too: the catalog pauses Lime's Laval market
  from 16 November until 15 April, from by-law L-13007; check the 2027
  permit's dates and the amending by-law L-13130
  ([Canada's winter section](canadian-scooter-feeds.md#winter)).
- **20 April 2027:** Bird Saskatoon, empty on 14 October 2026; the city's
  [page](https://www.saskatoon.ca/moving-around/cycling/e-scooters) names
  only Lime. Lime's Saskatoon market, from its rider map, is paused from
  `11-01` until `04-15` in `America/Regina`, from Traffic Bylaw 7200's fee
  season; in 2026 the scooters came back on 5 May, so if the city announces
  a later start, move `until` to it
  ([Canada's winter section](canadian-scooter-feeds.md#winter)).
- **Late April 2027:** Ottawa's 2027 season. The catalog pauses Ottawa from
  16 November until 30 April, from council's "approximately April 30 to
  November 15"; if the city announces another start, change `until` for Bird
  and Lime.
- **Late April 2027:** Hopp Dalvík, Hopp Ólafsvík (with Hellissandur), Hopp
  Stykkishólmur and Bird Leduc. None of these towns publishes a season, so the
  catalog pauses Dalvík from 21 October, Leduc from 22 October, Ólafsvík from
  23 October and Stykkishólmur from 26 October until 1 May, from the days their feeds emptied in 2026. Check each
  from mid-April: if its scooters come back before 1 May, move `until` to that
  day, as the map says they are back in May even while they stand on it; if
  they are not back by 1 May, "feed empty" reports the feed about 4 May. In
  October 2027, move `from` to the day each feed empties, if it differs.
- **April 2027:** the season starts in Belarus, Georgia, Armenia, Azerbaijan and
  Kazakhstan too (Minsk's runs from about 15 March to 15 November): check
  Bolt's ids, Whoosh, the registry, ATOM Mobility and the national portals
  again.
- **April 2027:** Bogotá's rules for shared scooters, which Yango's launch
  there waits for; and new tenders in Hobart, Launceston, Bendigo and the
  Sunshine Coast, whose schemes ended or paused in 2024–26.
- **April 2027:** Dott Malvik, in Norway, from Entur. It listed 15 to 17
  available scooters on 13 and 14 October 2026 and 17 on Sunday 18 October,
  and none was ridden while it was polled. Poll it on a weekend afternoon;
  Entur renews the ids, so match scooters by position, and add it if they
  are ridden.
- **April 2027:** Hopp Wałcz, in Poland. It listed 13 available scooters on
  a Tuesday in October 2026 and 4 on Saturday 24 October, and none was
  ridden while it was polled: none moved from 08:36 to 16:47 that Saturday.
  Poll it on a weekend afternoon, and add it if its scooters are ridden.
- **April 2027:** Albania's ban on e-scooters, Instruction 169 of October
  2025: if it is lifted for rental fleets, sweep BinBin's Tirana area (74)
  twice, a quarter of an hour apart on a weekend afternoon, and add Albania
  if its scooters are ridden. Mostar's area (41) too, which was empty on 25
  October 2026.
- **April 2027:** Turkey's season. Check for public GBFS from Martı and Hop
  and new data on İstanbul's, İzmir's and Konya's open-data portals, and run
  `node scripts/update-binbin-areas.mjs --check` for BinBin's new areas. For
  Martı and Hop, follow [the verified app hosts and access
  blockers](turkish-app-maps.md), rather than treating `gbfs.heyhop.app` as
  the investigated Hop app's endpoint.
- **1 May 2027:** Bird's other Canadian towns (Lethbridge, Red Deer, Kamloops,
  Vernon, Brampton, Oshawa, Laval and the rest listed above) and Lime's
  former Neuron towns (Red Deer, Saskatoon, Regina, Waterloo Region): probe
  the slugs again, as a public feed would replace Lime's rider map there. Windsor's one-year contract with Bird, from May 2026, ends
  then too: check that `windsor-on` still answers.
- **Spring 2027:** Dott's six paused Finnish towns (Ekenäs, Hamina, Hanko,
  Imatra, Kalajoki, Kotka), Joe Scooter in Rauma, Hoppy in Crikvenica and Hopp
  in Omiš, Hopp's Greek island towns (Chania, Kardamena, Kalymnos and others),
  Hopp Como and Hopp Augsburg may open for the season; recheck Hopp Nafplio
  then too. Hopp Siglufjörður, out of the catalog since 15 October 2026: add
  it back if it holds about ten available scooters that are ridden. Lime Zug
  and Lime Wetzikon, left out of the Swiss collection: if either lists
  scooters, check whether the city has let rental scooters back; if so, take
  it out of `LEFT_OUT_SWISS_SYSTEMS` and put its town back in
  `data/swiss-scooter-areas.json`.
- **15 to 30 May 2027:** Dott Makkah, empty with a free plan on 15 October
  2026, during the Hajj. Add it if it lists scooters that are ridden.
- **June 2027:** Dott Tignes's summer season. The catalog pauses Tignes from
  8 September until 22 June, the dates of 2026; check Dott's announcement of
  the 2027 season and change the window if they differ.
- **January 2028:** Lime Winterthur, left out of the Swiss collection since
  15 October 2026. Winterthur's licence for Voi alone ends on 31 December
  2027: check which operators the city licenses next, and take Lime out of
  `LEFT_OUT_SWISS_SYSTEMS` if it lists scooters again.
- Every Monday, the [catalog check workflow](../.github/workflows/catalog-check.yml)
  fails when an entry of a covered country is gone.
