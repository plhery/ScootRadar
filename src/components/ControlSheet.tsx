'use client';

import { track } from '@/lib/analytics';

import { useCallback, useId, useRef, useState, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import type { MapStyleName, ThemeName } from '@/lib/clientParams';
import { SUPPORTED_LOCALES, useI18n, type AppLocale, type LocaleChoice, type TranslationKey } from '@/lib/i18n';
import { formatMinimumRange, rangeFilterHelp, rangeScale, rangeSteps, rangeStepsMeters } from '@/lib/rangeSlider';
import { isSingular } from '@/lib/uiText';
import { measurementSystem, type UnitsChoice } from '@/lib/walking';
import { PROVIDERS, PROVIDER_KEYS } from '@/lib/types';
import { providerSurfaceColor } from '@/lib/providerColor';
import { selectionFeedback } from '@/lib/feedback';
import { appStoreUrl } from '@/lib/appStore';
import { useIPhone } from '@/lib/useIPhone';
import { PLAY_TEST_COPY } from '@/lib/playTestCopy';
import { playTest, usePlayTestAudience } from '@/lib/usePlayTest';
import Icon from './Icon';
import { CreditsList } from './MapCredits';
import ModalSheet from './ModalSheet';
import PlayTestSteps from './PlayTestSteps';

const LOCALE_LABELS: Record<AppLocale, string> = {
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  nl: 'Nederlands',
  nb: 'Norsk',
  pt: 'Português',
  es: 'Español',
  is: 'Íslenska',
  en: 'English',
};

// In the same order whatever the language on screen, so that a row stays where it was tapped.
const LANGUAGES = [...SUPPORTED_LOCALES].sort((a, b) => LOCALE_LABELS[a].localeCompare(LOCALE_LABELS[b], 'en'));

/** The views the settings lead to, each from its row, by their headings; the Android app's is in its own copy. */
type SettingsView = 'language' | 'credits' | 'android';
const SETTINGS_VIEWS: Record<Exclude<SettingsView, 'android'>, TranslationKey> = { language: 'set.language', credits: 'set.credits' };

const THEMES: { name: ThemeName; label: TranslationKey }[] = [
  { name: 'auto', label: 'set.auto' },
  { name: 'light', label: 'set.light' },
  { name: 'dark', label: 'set.dark' },
];

// "km" and "mi" are written the same in every language, and spoken in full by their labels.
const UNITS: { name: UnitsChoice; label: TranslationKey; symbol?: string }[] = [
  { name: 'auto', label: 'set.auto' },
  { name: 'metric', label: 'set.kilometres', symbol: 'km' },
  { name: 'imperial', label: 'set.miles', symbol: 'mi' },
];

const MAP_STYLES: { name: MapStyleName; label: TranslationKey }[] = [
  { name: 'calm', label: 'set.calm' },
  { name: 'detailed', label: 'set.detailed' },
];

const SOURCE_CODE_URL = 'https://github.com/plhery/ScootRadar';

interface ControlSheetProps {
  open: boolean;
  panel: 'filters' | 'settings';
  /** The range minimum in metres, 0 for none; the slider shows it on a step of the units in use. */
  minRange: number;
  /**
   * How far a full battery takes each app's scooters in view that say only their battery, in metres
   * (response.batteryRanges): the line under the slider says what battery they need.
   */
  batteryRanges: Readonly<Record<string, number>>;
  enabledProviders: Set<string>;
  /** Providers that operate in the viewport. */
  availableProviders: string[];
  /** Scooters per provider in the viewport with the range minimum, whether or not the provider is switched on. */
  providerCounts: Readonly<Record<string, number>>;
  /** Providers that are not sharing data right now and so have nothing in view, from providerHealth(). */
  downProviders: readonly string[];
  hasActiveFilters: boolean;
  /** What the map shows with the current choices; null while the answer is on its way. */
  showCount: number | null;
  /** Automatic follows the system. */
  theme: ThemeName;
  mapStyle: MapStyleName;
  /** The operators' zones over the map, a preview. */
  zones: boolean;
  onClose: () => void;
  /** In metres, a whole step of the units in use, as the slider moves. */
  onMinRangeChange: (meters: number) => void;
  onProviderToggle: (provider: string) => void;
  onResetFilters: () => void;
  onThemeChange: (theme: ThemeName) => void;
  onMapStyleChange: (style: MapStyleName) => void;
  onZonesChange: (zones: boolean) => void;
}

export default function ControlSheet({
  open,
  panel,
  minRange,
  batteryRanges,
  enabledProviders,
  availableProviders,
  providerCounts,
  downProviders,
  hasActiveFilters,
  showCount,
  theme,
  mapStyle,
  zones,
  onClose,
  onMinRangeChange,
  onProviderToggle,
  onResetFilters,
  onThemeChange,
  onMapStyleChange,
  onZonesChange,
}: ControlSheetProps) {
  const i18n = useI18n();
  const { t, locale, localeChoice, region, units, setUnits, formatNumber } = i18n;
  const rangeTitleId = useId();
  const rangeHelpId = useId();
  const zonesHelpId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const languageRowRef = useRef<HTMLButtonElement>(null);
  const creditsRowRef = useRef<HTMLButtonElement>(null);
  const androidRowRef = useRef<HTMLButtonElement>(null);
  const iPhone = useIPhone();
  // The Android app's test, for whom it is (src/lib/playTest.ts).
  const android = usePlayTestAudience() === true;
  const playCopy = PLAY_TEST_COPY[locale];
  const [viewShown, setViewShown] = useState<SettingsView | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  // The settings open on their first view, whatever they showed when they were closed.
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setViewShown(null);
  }
  const filters = panel === 'filters';
  const view = filters ? null : viewShown;
  const tap = (action: () => void) => () => { selectionFeedback(); action(); };

  // Committed within the tap, so that the focus can follow to where the view changed.
  const showView = (next: SettingsView) => () => {
    selectionFeedback();
    flushSync(() => setViewShown(next));
    titleRef.current?.focus();
  };
  // Back on the first view, the focus is on the row that led away from it.
  const hideView = () => {
    const row = view === 'language' ? languageRowRef : view === 'android' ? androidRowRef : creditsRowRef;
    selectionFeedback();
    flushSync(() => setViewShown(null));
    row.current?.focus();
  };

  // Whole kilometres, or whole miles where lengths are in miles; "5 km+", spoken "5 km or more".
  const rangeSystem = measurementSystem(region, units);
  const rangeMax = rangeScale(rangeSystem).max;
  const rangeStep = rangeSteps(minRange, rangeSystem);
  const rangeLabel = formatMinimumRange(minRange, i18n);
  // What battery the scooters that say only their battery need, of each app switched on, and that those saying
  // neither are hidden: the slider's description while a minimum is set.
  const rangeHelp = rangeStep > 0
    ? rangeFilterHelp(minRange, batteryRanges, provider => enabledProviders.has(provider), i18n)
    : null;
  // Counted once a minimum is let go of, not at each step on the way: what the slider gave last.
  const rangeMoved = useRef<number | null>(null);
  const rangeSlider = useCallback((slider: HTMLInputElement | null) => {
    if (!slider) return;
    const chosen = () => {
      if (rangeMoved.current !== null) track('range_filter', { value: rangeMoved.current });
      rangeMoved.current = null;
    };
    slider.addEventListener('change', chosen);
    return () => slider.removeEventListener('change', chosen);
  }, []);
  // In catalogue order, as the iOS filters list them.
  const providers = PROVIDER_KEYS.filter(key => availableProviders.includes(key)).map(key => {
    const count = providerCounts[key] ?? 0;
    return {
      key,
      ...PROVIDERS[key],
      count,
      enabled: enabledProviders.has(key),
      // Like the dashed chip in the dock.
      down: downProviders.includes(key),
    };
  });

  return (
    <ModalSheet
      open={open}
      title={view === 'android' ? playCopy.app : t(filters ? 'filter.title' : view ? SETTINGS_VIEWS[view] : 'set.title')}
      titleRef={titleRef}
      back={view ? { label: t('set.title'), onClick: hideView } : undefined}
      action={filters ? (
        <button type="button" className="sheet-reset" disabled={!hasActiveFilters} onClick={tap(onResetFilters)}>
          {t('filter.reset')}
        </button>
      ) : undefined}
      footer={filters ? (
        // Filters apply as they are chosen, so this is the count on the map.
        <button type="button" className="sheet-primary" aria-live="polite" onClick={tap(onClose)}>
          {showCount === null
            ? t('dock.finding')
            : t(isSingular(showCount, locale) ? 'filter.show.one' : 'filter.show.other', { count: formatNumber(showCount) })}
        </button>
      ) : undefined}
      onClose={onClose}
    >
      {filters ? (
        <>
          <section className="settings-section">
            {/* The slider says its value itself. */}
            <div className="filter-heading">
              <h3 id={rangeTitleId}>{t('filter.range')}</h3>
              <span className="filter-value" aria-hidden="true">{rangeLabel ? `${rangeLabel}+` : t('filter.any')}</span>
            </div>
            <input
              ref={rangeSlider}
              type="range"
              className="range-slider"
              min={0}
              max={rangeMax}
              step={1}
              value={rangeStep}
              aria-labelledby={rangeTitleId}
              aria-valuetext={rangeLabel ? t('filter.rangeValue', { distance: rangeLabel }) : t('filter.any')}
              aria-describedby={rangeHelp ? rangeHelpId : undefined}
              style={{ '--range-ratio': rangeStep / rangeMax } as CSSProperties}
              onChange={event => {
                const step = Number(event.currentTarget.value);
                if (step === rangeStep) return;
                const meters = rangeStepsMeters(step, rangeSystem);
                selectionFeedback();
                rangeMoved.current = meters;
                onMinRangeChange(meters);
              }}
            />
            {rangeHelp && <p id={rangeHelpId} className="filter-help">{rangeHelp}</p>}
          </section>
          <section className="settings-section">
            <h3>{t('filter.providers')}</h3>
            <div className="settings-group provider-options" role="group" aria-label={t('filter.providers')}>
              {/* No provider operates in this part of the map. */}
              {providers.length === 0 && <p className="provider-none">{t('coverage.title')}</p>}
              {providers.map((provider) => (
                <button
                  key={provider.key}
                  type="button"
                  className={provider.down ? 'provider-down' : undefined}
                  aria-pressed={provider.enabled}
                  aria-label={provider.down
                    ? t('dock.down.chip', { name: provider.name })
                    : t('providers.toggleLabel', {
                        name: provider.name,
                        count: formatNumber(provider.count),
                        state: t(provider.enabled ? 'providers.selected' : 'providers.notSelected'),
                      })}
                  onClick={tap(() => onProviderToggle(provider.key))}
                >
                  <span
                    className="provider-symbol"
                    style={{ '--provider-color': providerSurfaceColor(provider.key, provider.color) } as CSSProperties}
                  >
                    {provider.initial}
                  </span>
                  <span className="provider-copy">
                    <span>{provider.name}</span>
                    {provider.down && <span className="provider-note">{t('filter.down')}</span>}
                  </span>
                  {!provider.down && <span className="provider-count">{formatNumber(provider.count)}</span>}
                  {/* A check when shown, an empty circle when hidden, a dashed one when chosen but without data. */}
                  <span className="provider-check">
                    {provider.enabled && !provider.down && <Icon name="check" size={14} />}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : view === 'credits' ? (
        <div className="settings-group credits-rows">
          <CreditsList />
        </div>
      ) : view === 'language' ? (
        <LanguageList />
      ) : view === 'android' ? (
        <div className="settings-section">
          <div className="play-intro">
            {/* eslint-disable-next-line @next/next/no-img-element -- The app's own icon, kept offline with the map. */}
            <img src="/icon-180.png" alt="" width={56} height={56} />
            <p>{playCopy.sheetPitch}</p>
          </div>
          <PlayTestSteps copy={playCopy} place="settings" />
        </div>
      ) : (
        <>
          <section className="settings-section">
            <h3>{t('set.appearance')}</h3>
            <div
              className="seg"
              role="group"
              aria-label={t('set.appearance')}
              style={
                {
                  '--segment-index': THEMES.findIndex(({ name }) => name === theme),
                  '--segment-count': THEMES.length,
                } as CSSProperties
              }
            >
              <span className="seg-indicator" aria-hidden="true" />
              {THEMES.map(({ name, label }) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={theme === name}
                  onClick={() => {
                    if (theme === name) return;
                    selectionFeedback();
                    onThemeChange(name);
                  }}
                >
                  {t(label)}
                </button>
              ))}
            </div>
          </section>
          <section className="settings-section">
            <h3>{t('set.map')}</h3>
            <div className="map-style-options" role="group" aria-label={t('set.map')}>
              {MAP_STYLES.map(({ name, label }) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={mapStyle === name}
                  onClick={() => {
                    if (mapStyle === name) return;
                    selectionFeedback();
                    onMapStyleChange(name);
                  }}
                >
                  <span className={`map-style-preview map-style-${name}`} aria-hidden="true">
                    <span />
                  </span>
                  {t(label)}
                </button>
              ))}
            </div>
            <label className="zone-toggle">
              {t('set.zones')}
              <input
                type="checkbox"
                role="switch"
                checked={zones}
                aria-describedby={zonesHelpId}
                onChange={event => { selectionFeedback(); onZonesChange(event.currentTarget.checked); }}
              />
            </label>
            <p id={zonesHelpId} className="settings-help">{t('set.zonesHelp')}</p>
          </section>
          <section className="settings-section">
            <h3>{t('set.language')}</h3>
            {/* The language on screen, with Automatic beside it while it is the browser's. */}
            <div className="settings-group about-rows">
              <button ref={languageRowRef} type="button" onClick={showView('language')}>
                <span lang={locale}>{LOCALE_LABELS[locale]}</span>
                <span className="row-value">
                  {localeChoice === 'auto' && t('set.languageAuto')}
                  <Icon name="chevron" size={16} strokeWidth={2.2} />
                </span>
              </button>
            </div>
          </section>
          <section className="settings-section">
            <h3>{t('set.units')}</h3>
            {/* Automatic writes lengths and speeds as the region does (walking.ts). */}
            <div
              className="seg"
              role="group"
              aria-label={t('set.units')}
              style={
                {
                  '--segment-index': UNITS.findIndex(({ name }) => name === units),
                  '--segment-count': UNITS.length,
                } as CSSProperties
              }
            >
              <span className="seg-indicator" aria-hidden="true" />
              {UNITS.map(({ name, label, symbol }) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={units === name}
                  aria-label={symbol && t(label)}
                  onClick={() => {
                    if (units === name) return;
                    selectionFeedback();
                    track('units_change', { result: name });
                    setUnits(name);
                  }}
                >
                  {symbol ?? t(label)}
                </button>
              ))}
            </div>
          </section>
          <section className="settings-section">
            <h3>{t('set.about')}</h3>
            <div className="settings-group about-rows">
              {iPhone && (
                <a href={appStoreUrl('web-map-settings')}>
                  <span className="app-row-name">
                    {/* eslint-disable-next-line @next/next/no-img-element -- The app's own icon, kept offline with the map. */}
                    <img className="app-row-icon" src="/icon-180.png" alt="" width={30} height={30} />
                    {t('set.iphoneApp')}
                  </span>
                  <span className="row-value">
                    App Store
                    <Icon name="chevron" size={16} strokeWidth={2.2} />
                  </span>
                </a>
              )}
              {android && (
                <button
                  ref={androidRowRef}
                  type="button"
                  onClick={() => { playTest.opened('settings'); showView('android')(); }}
                >
                  <span className="app-row-name">
                    {/* eslint-disable-next-line @next/next/no-img-element -- The app's own icon, kept offline with the map. */}
                    <img className="app-row-icon" src="/icon-180.png" alt="" width={30} height={30} />
                    {playCopy.app}
                  </span>
                  <span className="row-value">
                    Google Play
                    <Icon name="chevron" size={16} strokeWidth={2.2} />
                  </span>
                </button>
              )}
              <button ref={creditsRowRef} type="button" onClick={showView('credits')}>
                {t('set.credits')}
                <Icon name="chevron" size={16} strokeWidth={2.2} />
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- The notice is loaded as a page of its own, as it always was. */}
              <a href="/privacy">
                {t('set.privacy')}
                <Icon name="chevron" size={16} strokeWidth={2.2} />
              </a>
              <a href={SOURCE_CODE_URL} target="_blank" rel="noreferrer">
                {t('set.source')}
                <Icon name="chevron" size={16} strokeWidth={2.2} />
              </a>
            </div>
          </section>
        </>
      )}
    </ModalSheet>
  );
}

/** Automatic, which follows the browser, then every language by its own name. A tap switches at once and stays on the list. */
function LanguageList() {
  const { t, locale, localeChoice, browserLocale, setLocale } = useI18n();
  const helpId = useId();
  const names = new Intl.DisplayNames([locale], { type: 'language' });
  // "German" beside "Deutsch", as the language on screen calls it, unless that is the same name.
  // Norwegian is "Norwegian" beside "Norsk", not "Norwegian Bokmål".
  const nameOnScreen = (language: AppLocale) => {
    const name = names.of(language === 'nb' ? 'no' : language) ?? '';
    const capitalised = name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
    return capitalised === LOCALE_LABELS[language] ? null : capitalised;
  };
  const choose = (choice: LocaleChoice) => () => {
    if (choice === localeChoice) return;
    selectionFeedback();
    track('language_change', { language: choice });
    setLocale(choice);
  };

  return (
    <>
      <div className="settings-section">
        <div className="settings-group language-rows">
          <button type="button" aria-pressed={localeChoice === 'auto'} aria-describedby={helpId} onClick={choose('auto')}>
            <span className="language-copy">
              <span>{t('set.languageAuto')}</span>
              <span className="language-note">{t('set.languageBrowser', { language: LOCALE_LABELS[browserLocale] })}</span>
            </span>
            {localeChoice === 'auto' && <Icon name="check" size={20} strokeWidth={2.4} />}
          </button>
        </div>
        <p id={helpId} className="settings-help">{t('set.languageHelp')}</p>
      </div>
      <div className="settings-section">
        <div className="settings-group language-rows">
          {LANGUAGES.map((language) => {
            const other = nameOnScreen(language);
            return (
              <button key={language} type="button" aria-pressed={localeChoice === language} onClick={choose(language)}>
                <span className="language-copy language-copy-inline">
                  <span lang={language}>{LOCALE_LABELS[language]}</span>
                  {other && <span className="language-note">{other}</span>}
                </span>
                {localeChoice === language && <Icon name="check" size={20} strokeWidth={2.4} />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
