'use client';

import { track } from '@/lib/analytics';

import { useId, useRef, useState, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import { BATTERY_PRESETS, batteryPresetLabel, snapBatteryPreset } from '@/lib/battery';
import type { MapStyleName, ThemeName } from '@/lib/clientParams';
import { SUPPORTED_LOCALES, useI18n, type AppLocale, type LocaleChoice, type TranslationKey } from '@/lib/i18n';
import { isSingular } from '@/lib/uiText';
import { PROVIDERS, PROVIDER_KEYS } from '@/lib/types';
import { providerSurfaceColor } from '@/lib/providerColor';
import { selectionFeedback } from '@/lib/feedback';
import Icon from './Icon';
import { CreditsList } from './MapCredits';
import ModalSheet from './ModalSheet';

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

/** The views the settings lead to, each from its row, by their headings. */
type SettingsView = 'language' | 'credits';
const SETTINGS_VIEWS: Record<SettingsView, TranslationKey> = { language: 'set.language', credits: 'set.credits' };

const THEMES: { name: ThemeName; label: TranslationKey }[] = [
  { name: 'auto', label: 'set.auto' },
  { name: 'light', label: 'set.light' },
  { name: 'dark', label: 'set.dark' },
];

const MAP_STYLES: { name: MapStyleName; label: TranslationKey }[] = [
  { name: 'calm', label: 'set.calm' },
  { name: 'detailed', label: 'set.detailed' },
];

const SOURCE_CODE_URL = 'https://github.com/plhery/ScootRadar';

interface ControlSheetProps {
  open: boolean;
  panel: 'filters' | 'settings';
  minBattery: number;
  enabledProviders: Set<string>;
  /** Providers that operate in the viewport. */
  availableProviders: string[];
  /** Scooters per provider in the viewport with the battery choice, whether or not the provider is switched on. */
  providerCounts: Readonly<Record<string, number>>;
  /** Providers that are not sharing data right now and so have nothing in view, from providerHealth(). */
  downProviders: readonly string[];
  hasActiveFilters: boolean;
  /** What the map shows with the current choices; null while the answer is on its way. */
  showCount: number | null;
  /** Automatic follows the system. */
  theme: ThemeName;
  mapStyle: MapStyleName;
  onClose: () => void;
  onMinBatteryChange: (value: number) => void;
  onProviderToggle: (provider: string) => void;
  onResetFilters: () => void;
  onThemeChange: (theme: ThemeName) => void;
  onMapStyleChange: (style: MapStyleName) => void;
}

export default function ControlSheet({
  open,
  panel,
  minBattery,
  enabledProviders,
  availableProviders,
  providerCounts,
  downProviders,
  hasActiveFilters,
  showCount,
  theme,
  mapStyle,
  onClose,
  onMinBatteryChange,
  onProviderToggle,
  onResetFilters,
  onThemeChange,
  onMapStyleChange,
}: ControlSheetProps) {
  const { t, locale, localeChoice, formatNumber } = useI18n();
  const batteryHelpId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const languageRowRef = useRef<HTMLButtonElement>(null);
  const creditsRowRef = useRef<HTMLButtonElement>(null);
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
    const row = view === 'language' ? languageRowRef : creditsRowRef;
    selectionFeedback();
    flushSync(() => setViewShown(null));
    row.current?.focus();
  };

  const batteryPreset = snapBatteryPreset(minBattery);
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
      title={t(filters ? 'filter.title' : view ? SETTINGS_VIEWS[view] : 'set.title')}
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
            <h3>{t('filter.battery')}</h3>
            <div
              className="seg"
              role="group"
              aria-label={t('filter.battery')}
              aria-describedby={batteryPreset > 0 ? batteryHelpId : undefined}
              style={
                {
                  '--segment-index': BATTERY_PRESETS.indexOf(batteryPreset),
                  '--segment-count': BATTERY_PRESETS.length,
                } as CSSProperties
              }
            >
              <span className="seg-indicator" aria-hidden="true" />
              {BATTERY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={batteryPreset === preset}
                  onClick={() => {
                    if (batteryPreset === preset) return;
                    selectionFeedback();
                    onMinBatteryChange(preset);
                  }}
                >
                  {batteryPresetLabel(preset) ?? t('filter.any')}
                </button>
              ))}
            </div>
            {batteryPreset > 0 && (
              <p id={batteryHelpId} className="filter-help">{t('filter.batteryHelp')}</p>
            )}
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
            <h3>{t('set.about')}</h3>
            <div className="settings-group about-rows">
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
