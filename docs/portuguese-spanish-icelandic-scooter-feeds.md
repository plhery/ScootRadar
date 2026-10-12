# Portuguese, Spanish and Icelandic scooter feeds

Verified 12 October 2026. The audit started from the
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
then probed the URL patterns of Bird, Hopp, Lime, Bolt, Cooltra and BORA for
other towns. Each enabled feed was polled nine times, five minutes apart, on a
weekday afternoon: counts changed between polls, every feed was under a minute
old, and every feed URL is https, on the discovery's origin and under its
directory. No account credentials or private rider APIs are used.

| Country | Operator | Enabled feeds | Coverage | Available scooters |
| --- | --- | ---: | --- | ---: |
| Portugal | Bird | 10 | Lisboa, Porto, Cascais, Oeiras, Almada (with Costa da Caparica), Coimbra, Maia, Matosinhos, Portimão, Olhão | 4,350 |
| Portugal | Lime | 2 | Lisboa, Almada (with Costa da Caparica) | 2,300 |
| Spain | Bird | 5 | Gijón, Getafe, Playa de las Américas (Tenerife), Caleta de Fuste and Pájara (Fuerteventura) | 1,250 |
| Spain | Hopp | 3 | Torrevieja and Pilar de la Horadada, Jávea, Playa de las Américas and Golf del Sur (Tenerife) | 550 |
| Iceland | Hopp | 14 | Reykjavík and its capital area, Reykjanesbær (with Sandgerði, Garður and Vogar), Akureyri, Selfoss, Akranes, Vestmannaeyjar and eight smaller towns | 2,700 |

Portugal has 11 cities, Spain 10 and Iceland 18, once multi-town feeds are
routed per town. The bounds, discovery URLs and aliases are in
[`portuguese-scooter-feeds.json`](../data/portuguese-scooter-feeds.json),
[`spanish-scooter-feeds.json`](../data/spanish-scooter-feeds.json) and
[`icelandic-scooter-feeds.json`](../data/icelandic-scooter-feeds.json).

## Data handling

- **Bird's "madrid" feed is Getafe.** Its scooters stand in Getafe's
  industrial estates, where Bird has run with the council since June 2025, so
  the catalog names it Getafe. Its "adeje" feed also covers Arona, and is named
  Playa de las Américas, where Hopp's Tenerife feed overlaps it.
- **Reykjavík's capital area** is one city, with Kópavogur, Hafnarfjörður,
  Garðabær, Mosfellsbær and Seltjarnarnes as aliases: their boxes would
  overlap.
- **Vehicle types:** Hopp Reykjavík also lists electric cars, and Bird and Lime
  mix in e-bikes. The app keeps electric scooters only. Bird Barcelona files
  552 e-bikes under its scooter type in its station feed; it is left out.
- **Prices** show for Hopp only: ISK 115 to unlock and ISK 45 a minute in
  Iceland, EUR 0.95–0.99 and EUR 0.25–0.33 a minute in Spain. The króna has no
  minor unit, so web and iOS show it without decimals. Bird publishes an empty
  plan list and Lime no pricing feed.
- **Battery:** Lime gives range only, as elsewhere, so Lime scooters show no
  battery level. Hopp's comes from its `hopp_battery_level` field.
- **Rental links:** Hopp links each scooter; Bird and Lime fall back to their
  app.
- **IDs:** Bird and Lime rotate every vehicle id on every poll.

## Night bans

**Matosinhos** bans renting every night, 22:00–06:00, under Art. 20.º of its
[municipal regulation](https://www.cm-matosinhos.pt/cmmatosinhos2020/uploads/writer_file/document/33006/regulamento_municipal_de_servicos_de_partilha_em_modos_suaves_de_transporte.pdf)
(Edital n.º 1608/2022). Its boundary is the municipality from the Direção-Geral
do Território's [CAOP](https://www.dgterritorio.gov.pt/cartografia/cartografia-tematica/caop),
under CC BY 4.0: *Informação geográfica cedida pela Direção-Geral do
Território*. Bird keeps listing its scooters as available during the ban. On
12 October 2026 it listed 228 scooters at 17:05, 225 of them available. Polled
at 22:16, 22:21 and 22:26 Lisbon time, it listed 223, 232 and 233, with 219,
228 and 228 available; none was reserved. So the map keeps showing them, and
the dock and each scooter's card state the ban and when renting resumes.

- Porto lifted its 06:00–22:00 rule in November 2025
  ([Regulamento n.º 1222/2025](https://mobilidade.cm-porto.pt/files/uploads/cms/CRMP_vers%C3%A3o_atualizada_20251127.pdf)).
- Reykjavík's
  [2026 rules](https://reykjavik.is/sites/default/files/2026-02/Verklagsreglur_um_stöðvalausar_hjólaleigur_2026.pdf)
  (§5.5.1) let the city limit rental hours, but it has not.
- No other covered town was found to ban renting at night. The small Spanish
  and Portuguese towns had only a quick search.

## Licences

- **Bird:** the `license_url` in its feeds answers 404, and Bird's agreement
  page now redirects to its rider terms. The
  [last archived copy](https://web.archive.org/web/20260516143232/https://www.bird.co/gbfs-data-license-agreement/)
  allows showing Bird's vehicles, identified as Bird's, with data no older than
  fifteen minutes. Worth confirming with Bird that it still applies.
- **Lime:** its [GBFS terms](https://www.li.me/legal/public-gbfs-terms) allow
  internal use, and public display only where local law requires Lime to grant
  it, with data no older than ten minutes. No Portuguese rule was found that
  does; this is the same open question as for Lime in France and Germany.
- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  data licence, as in Germany.
- The credits name Bird, Lime and Hopp for these countries, and the DGT for
  Matosinhos's boundary.

## Known gaps

- **Portugal:**
  - Bolt runs in Lisboa, Porto, Faro, Coimbra and elsewhere, with no public
    feed. Lime has no feed for Porto or Faro.
  - Braga banned shared scooters in September 2026; Espinho, Vila Real and
    Figueira da Foz ended or suspended them. Bird's Braga and Faro feeds are
    dead, and seven smaller Bird towns are empty.
  - Bird Vila Nova de Gaia held 7 scooters that did not move; the city
    cancelled its tender in April 2026.
- **Spain:**
  - Madrid, Barcelona, Valencia, Sevilla, Málaga, Zaragoza and the Basque
    Country have no shared scooters: banned, revoked or never licensed.
  - Dott (Santa Cruz de Tenerife, Ibiza, Lanzarote and other resorts) and Bolt
    (Oviedo) have no public feed.
  - Hopp's Benidorm, Cartagena, Dénia, Fuengirola and Marbella feeds are empty.
- **Iceland:**
  - Bolt has run in the capital area since 2024, with no public feed.
  - Hopp's Hveragerði and Hella / Hvolsvöllur feeds held under ten available
    scooters, and Grindavík, Höfn, Seyðisfjörður, Blönduós, Ólafsfjörður and
    Þorlákshöfn none.

## Recheck

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=PT,ES,IS --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
