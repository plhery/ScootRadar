'use client';

import Icon from './Icon';
import { COUNTRY_CREDIT_LINKS } from '@/generated/countries';
import { useI18n } from '@/lib/i18n';
import { selectionFeedback } from '@/lib/feedback';

const SOURCES = [
  { href: 'https://www.openstreetmap.org/copyright', label: '© OpenStreetMap contributors' },
  { href: 'https://openfreemap.org/', label: 'OpenFreeMap © OpenMapTiles' },
  { href: 'https://routing.openstreetmap.de/about.html', label: 'Walking routes · Valhalla, FOSSGIS' },
  { href: 'https://www.openstreetmap.org/fixthemap', label: 'Fix the map · OpenStreetMap' },
  { href: 'https://opentransportdata.swiss/en/cookbook/shared-mobility/', label: 'Mobility data CH' },
  { href: 'https://transport.data.gouv.fr/datasets?type=vehicles-sharing', label: 'France: Dott, Bird, Lime, Voi, Pony, Naolib Micromob’' },
  // Each country's own, from data/countries.json.
  ...COUNTRY_CREDIT_LINKS,
  { href: 'https://www.geoapify.com/', label: 'Search · Geoapify' },
  { href: 'https://photon.komoot.io/', label: 'Search · Photon, komoot' },
  { href: 'https://data.lillemetropole.fr/', label: 'Parking · Métropole Européenne de Lille' },
];

/** Where the map and the data come from: listed over the map and in the settings. */
export function CreditsList() {
  return (
    <ul className="credits-list">
      {SOURCES.map(source => (
        <li key={source.label}>
          <a href={source.href} target="_blank" rel="noreferrer">{source.label}</a>
        </li>
      ))}
    </ul>
  );
}

export default function MapCredits() {
  const { t } = useI18n();

  return (
    <div className="map-attribution glass">
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
        © OpenStreetMap
      </a>
      <button
        type="button"
        popoverTarget="map-credits"
        aria-label={t('map.credits')}
        onClick={event => {
          event.currentTarget.focus({ preventScroll: true });
          selectionFeedback();
        }}
      >
        <Icon name="info" size={17} />
      </button>
      <section id="map-credits" popover="auto" className="map-credits glass" aria-labelledby="map-credits-title">
        <header>
          <h2 id="map-credits-title">{t('map.credits')}</h2>
          <button type="button" className="text-button" popoverTarget="map-credits" popoverTargetAction="hide" onClick={selectionFeedback}>
            {t('common.done')}
          </button>
        </header>
        <CreditsList />
      </section>
    </div>
  );
}
