import { PROVIDERS, PROVIDER_KEYS } from '@/generated/providers';
import { COVERED_CITY_TOTAL, COVERED_COUNTRY_TOTAL, type NearbyCoveredCity } from '@/lib/coveredCities';
import { deviceTime } from '@/lib/dataExpiry';
import { providerHealth, providersDownNotice, type ProviderHealth } from '@/lib/dataHealth';
import { viewportContainsPoint, type MapViewport } from '@/lib/geo';
import { failureReasonKey, type LoadFailure } from '@/lib/loadFailure';
import {
  nothingToShow,
  type FilterSummaryPart,
} from '@/lib/nothingToShow';
import { activeCurfew } from '@/lib/rentalCurfews';
import { activeSeasonalPause } from '@/lib/seasonalPauses';
import type { LastSeenStatus, ScooterLoading } from '@/lib/scooterDataState';
import type { ScooterResponseMeta } from '@/lib/types';
import type { UiText, UiTextFormatter } from '@/lib/uiText';
import { formatCityDistance, walkingMinutes } from '@/lib/walking';

const LIVE_MAX_AGE_MS = 90_000;
/** Data the server could not renew is called delayed from this age (ScooterDockStatus.delayedAfter on iOS). */
const DELAYED_MIN_AGE_MS = 5 * 60_000;
const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;

export function originInViewport(origin: [number, number] | null, viewport: MapViewport | null): boolean {
  return origin !== null && viewport !== null && viewportContainsPoint(viewport, origin[0], origin[1]);
}

export interface DockChip {
  provider: string;
  name: string;
  /** Scooters of this provider in the viewport, whether or not it is switched on. */
  count: number;
  /** Switched on in the filters (aria-pressed). */
  enabled: boolean;
  /** Drawn as selected: switched on while at least one other provider here is off. */
  selected: boolean;
  /** Not sharing data, so nothing in view: dashed, never selected, with a warning icon. */
  down: boolean;
  /**
   * Its scooters drawn faded in the viewport where they were last seen, counted apart: how many, when,
   * and whether new positions are on their way (a spinner). Null without any.
   */
  faded: { count: number; seenAt: number; updating: boolean } | null;
}

export interface DockChips {
  allCount: number;
  /** The "All" chip is selected while every provider here is switched on. */
  allSelected: boolean;
  /** In display order, after "All". */
  providers: DockChip[];
}

function catalogueIndex(provider: string): number {
  const index = (PROVIDER_KEYS as string[]).indexOf(provider);
  return index < 0 ? PROVIDER_KEYS.length : index;
}

export function dockChips({ viewportProviders, providerCounts, enabledProviders, down, fadedCounts = {}, lastSeenProviders = {} }: {
  viewportProviders: readonly string[];
  providerCounts: Readonly<Record<string, number>>;
  enabledProviders: ReadonlySet<string>;
  /** Providers that are not sharing data, from providerHealth(). */
  down: readonly string[];
  fadedCounts?: Readonly<Record<string, number>>;
  lastSeenProviders?: Readonly<Record<string, LastSeenStatus>>;
}): DockChips {
  const keys = [...new Set(viewportProviders)]
    .filter(key => PROVIDERS[key])
    .sort((a, b) => catalogueIndex(a) - catalogueIndex(b));
  const allSelected = keys.every(key => enabledProviders.has(key));
  const chips = keys.map((provider): DockChip => {
    const count = providerCounts[provider] ?? 0;
    const enabled = enabledProviders.has(provider);
    const isDown = down.includes(provider);
    const fadedCount = fadedCounts[provider] ?? 0;
    const status = lastSeenProviders[provider];
    return {
      provider,
      name: PROVIDERS[provider].name,
      count,
      enabled,
      selected: enabled && !allSelected && !isDown,
      down: isDown,
      faded: fadedCount > 0 && status ? { count: fadedCount, ...status } : null,
    };
  });
  return {
    allCount: chips.reduce((total, chip) => total + chip.count, 0),
    allSelected,
    // The sort is stable, so equal counts stay in catalogue order.
    providers: [
      ...chips.filter(chip => chip.down),
      ...chips.filter(chip => !chip.down).sort((a, b) => b.count - a.count),
    ],
  };
}

export type DockStatus =
  /** Warning style; the header also carries a "Try again" pill. */
  | { kind: 'failure'; text: UiText }
  | { kind: 'overview'; text: UiText }
  | { kind: 'delayed'; text: UiText }
  /** With the green dot. */
  | { kind: 'live'; text: UiText }
  /** With a spinner: scooters stand faded where they were last seen while they are collected again. */
  | { kind: 'updating'; text: UiText }
  /** With a hollow dot: scooters stand faded where they were last seen, and nothing is on its way for them. */
  | { kind: 'lastSeen'; text: UiText }
  | { kind: 'updated'; text: UiText };

export interface DockNotice {
  /**
   * A curfew is the city's night ban on renting, shown with a moon rather than a warning; a
   * season, the part of the year the city has no scooters, with a calendar.
   */
  kind: 'curfew' | 'season' | 'providers' | 'truncated' | 'parking';
  text: UiText;
}

export interface DockCoverageCity {
  /** The chip flies to city.center; city.distanceM is from the centre of the viewport. */
  city: NearbyCoveredCity;
}

/**
 * "ScootRadar covers 186 cities in 17 countries.", each count with the form of
 * its noun the language gives it: "21 stað í 21 landi" in Icelandic.
 */
export function coverageBody(cities: number, countries: number): UiText {
  const counted = (noun: 'cities' | 'countries', count: number): UiText => ({
    key: `coverage.${noun}.other`, numbers: { count }, one: { key: `coverage.${noun}.one`, count },
  });
  return { key: 'coverage.body', parts: { cities: counted('cities', cities), countries: counted('countries', countries) } };
}

/** "Bern · 61 km", or "Bern · 38 mi" where the region measures in miles. */
export function formatCoverageCity({ city }: DockCoverageCity, formatter: UiTextFormatter): string {
  return formatter.t('coverage.city', { city: city.city, distance: formatCityDistance(city.distanceM, formatter) });
}

/** The nearest scooter, as the first line of the dock: how far, whose, and how long on foot. */
export interface DockLead {
  provider: string;
  name: string;
  distanceM: number;
  minutes: number;
  /** The searched place the walk starts from; null when it starts from your location. */
  place: string | null;
}

export type DockModel =
  /** The scooters were removed. A card with one button, no count and no chips. */
  | { kind: 'outOfDate'; title: UiText; body: UiText[]; action: UiText; busy: boolean }
  /** No provider operates in the viewport. A card with the closest cities, no count and no chips. */
  | { kind: 'outsideCoverage'; title: UiText; body: UiText; label: UiText; cities: DockCoverageCity[] }
  /** A card with "Show all" (resets the filters) and "Edit filters". */
  | {
      kind: 'filtersHideAll';
      title: UiText;
      /** For formatFilterSummary(). */
      summary: FilterSummaryPart[];
      showAll: UiText;
      edit: UiText;
      hiddenCount: number | null;
    }
  | {
      kind: 'summary';
      /**
       * 'waiting': nothing has loaded and the load failed (the banner says why).
       * 'finding': the answer for this view is on its way. 'ready': the count is real.
       */
      phase: 'waiting' | 'finding' | 'ready';
      /** value is null while there is no count to show; then the label is the whole line. */
      count: { value: number | null; label: UiText };
      /**
       * The nearest scooter, shown in place of the count while the walk starts
       * inside the viewport: a tap opens its card. The count is then on "All".
       */
      lead: DockLead | null;
      status: DockStatus | null;
      /** Show the "Try again" pill at the right of the header. */
      retry: boolean;
      /** A request is running; a retry or refresh button can show progress. */
      busy: boolean;
      notices: DockNotice[];
      chips: DockChips | null;
      /** A row under the chips. */
      hint: { kind: 'cityHint' | 'empty'; text: UiText } | null;
    };

export interface DockInput {
  /** Scooters shown in the viewport with the current filters, markers and cluster totals together. */
  count: number;
  /** Scooters drawn faded in the viewport where they were last seen, counted apart (response.lastSeen). */
  lastSeenCount?: number;
  /** Of those, per provider, before the provider filter. */
  fadedCounts?: Readonly<Record<string, number>>;
  /** Of each app among them (useScooterData): when its were seen, and whether new positions are on their way. */
  lastSeenProviders?: Readonly<Record<string, LastSeenStatus>>;
  /** The origin for walking times (your location or the chosen place) lies inside the viewport. */
  originInViewport: boolean;
  /**
   * The scooter shown nearest to that origin, while single scooters are shown;
   * null further out, where they are counted in groups, and without an origin.
   */
  nearest: { provider: string; distanceM: number; place: string | null } | null;
  loading: ScooterLoading | null;
  failure: LoadFailure | null;
  outOfDate: boolean;
  hasData: boolean;
  meta: ScooterResponseMeta | null;
  lastUpdated: number | null;
  now: number;
  /** How far this device's clock is ahead of the server's, for the times of that answer (useScooterData); 0 or absent for none. */
  clockOffsetMs?: number;
  /** Scooters the whole response stands for (vehicles plus cluster totals), for the truncation notice. */
  representedCount: number;
  /** Providers that operate in the viewport. */
  viewportProviders: readonly string[];
  viewportCenter: [number, number] | null;
  /** Scooters per provider in the viewport, before the provider filter. */
  providerCounts: Readonly<Record<string, number>>;
  /**
   * Providers with a scooter in the viewport before any filter, from
   * providersInView(). Null while what is on screen cannot tell.
   */
  providersInView: ReadonlySet<string> | null;
  enabledProviders: ReadonlySet<string>;
  /** In metres, as FilterState has it; 0 or absent for none. */
  minRange?: number;
  /** From unfilteredCountInView(). */
  unfilteredCount: number | null;
}

type StatusInput = Pick<DockInput, 'failure' | 'meta' | 'lastUpdated' | 'now' | 'clockOffsetMs' | 'lastSeenCount' |
  'fadedCounts' | 'lastSeenProviders' | 'enabledProviders'>;

/** The apps whose scooters are drawn faded on the map now, in catalogue order. */
function fadedShown(input: Partial<StatusInput>): { provider: string; status: LastSeenStatus }[] {
  if ((input.lastSeenCount ?? 0) === 0) return [];
  return Object.entries(input.lastSeenProviders ?? {})
    .filter(([provider]) => (input.fadedCounts?.[provider] ?? 0) > 0 && (input.enabledProviders?.has(provider) ?? true))
    .sort(([a], [b]) => catalogueIndex(a) - catalogueIndex(b))
    .map(([provider, status]) => ({ provider, status }));
}

/** Scooters stand faded where they were last seen while the server collects them again. */
const filling = (input: StatusInput) => !input.failure && fadedShown(input).some(({ status }) => status.updating);

/**
 * "Ryde updating · faded ones seen at 02:46", or of apps not updating, "Ryde: faded ones last seen at
 * 02:46": the oldest time of those named, with the day of the week when it is not today.
 */
function lastSeenText(apps: readonly { provider: string; status: LastSeenStatus }[], updating: boolean, now: number): UiText {
  const time = Math.min(...apps.map(({ status }) => status.seenAt));
  const names = apps.map(({ provider }) => PROVIDERS[provider]?.name ?? provider);
  const base = updating ? 'dock.lastSeen' : 'dock.lastSeen.idle';
  const weekday = new Date(time).toDateString() !== new Date(now).toDateString();
  const when = { time, ...(weekday ? { weekday } : {}) };
  if (names.length === 1) return { key: base, values: { name: names[0] }, ...when };
  if (names.length === 2) return { key: `${base}.two`, values: { first: names[0], second: names[1] }, ...when };
  return { key: `${base}.many`, ...when };
}

/**
 * The apps late in an answer of scooters, of those switched on: each the server is collecting again
 * or could not renew, whose oldest positions shown are DELAYED_MIN_AGE_MS old or more, oldest first,
 * each on this device's clock, as the answer's own time is.
 * Null when the answer does not name them (city totals, an answer kept from before, a server before
 * staleProviders): its data is then delayed or not as a whole.
 */
function delayedApps(input: StatusInput): { provider: string; at: number }[] | null {
  const named = input.meta?.staleProviders;
  if (!input.meta?.stale || !named) return null;
  return Object.entries(named)
    .filter(([provider]) => input.enabledProviders?.has(provider) ?? true)
    .map(([provider, at]) => ({ provider, at: Math.min(deviceTime(at, input.clockOffsetMs ?? 0), input.now) }))
    .filter(({ at }) => Number.isFinite(at) && input.now - at >= DELAYED_MIN_AGE_MS)
    .sort((a, b) => a.at - b.at || catalogueIndex(a.provider) - catalogueIndex(b.provider));
}

function dockStatus(input: StatusInput): { status: DockStatus | null; retry: boolean } {
  const { failure, meta, lastUpdated, now } = input;
  if (lastUpdated === null) return { status: null, retry: false };
  if (failure) {
    return {
      status: { kind: 'failure', text: { key: failure === 'offline' ? 'dock.offline' : 'dock.refreshFailed', time: lastUpdated } },
      retry: true,
    };
  }
  // Rather than delayed: the faded scooters are the old positions, and the others are coming in.
  const faded = fadedShown(input);
  const updating = faded.filter(({ status }) => status.updating);
  if (updating.length > 0) return { status: { kind: 'updating', text: lastSeenText(updating, true, now) }, retry: false };
  const age = Math.max(0, now - lastUpdated);
  // Delayed data says so at every zoom, city totals included, once it is late:
  // before that its age or its time says enough. One app late is named.
  const late = delayedApps(input);
  if (late?.length === 1) {
    const [{ provider, at }] = late;
    return { status: { kind: 'delayed', text: { key: 'dock.delayed.one',
      values: { name: PROVIDERS[provider]?.name ?? provider }, time: at } }, retry: false };
  }
  if (late ? late.length > 1 : meta?.stale && age >= DELAYED_MIN_AGE_MS) {
    return { status: { kind: 'delayed', text: { key: 'dock.delayed', time: late?.[0].at ?? lastUpdated } }, retry: false };
  }
  if (meta?.overview) return { status: { kind: 'overview', text: { key: 'dock.cityTotals' } }, retry: false };
  // Faded scooters nothing is collecting stand as they were last seen, perhaps days ago, as Lime's
  // groups a wide view leaves idle: the line says so rather than "Live" over them.
  if (faded.length > 0) return { status: { kind: 'lastSeen', text: lastSeenText(faded, false, now) }, retry: false };
  if (age < LIVE_MAX_AGE_MS) return { status: { kind: 'live', text: { key: 'dock.live' } }, retry: false };
  return {
    status: {
      kind: 'updated',
      text: age < HOUR_MS
        ? { key: 'dock.updatedMinutes', numbers: { count: Math.floor(age / MINUTE_MS) } }
        : { key: 'dock.updatedAt', time: lastUpdated },
    },
    retry: false,
  };
}

export interface DockIssue {
  /** The failure or delayed status, with the same text as the dock's status line. */
  status: DockStatus;
  /** Show "Try again" beside it. */
  retry: boolean;
  busy: boolean;
}

/**
 * The card of a selected scooter or parking bay hides the count and the status
 * line. Trouble with the data then moves to one line above the card; healthy
 * data shows nothing there.
 */
export function dockIssue(input: StatusInput & Pick<DockInput, 'loading' | 'outOfDate'>): DockIssue | null {
  if (input.outOfDate) return null;
  const { status, retry } = dockStatus(input);
  if (status?.kind !== 'failure' && status?.kind !== 'delayed') return null;
  return { status, retry, busy: input.loading !== null };
}

function dockNotices(input: DockInput, health: ProviderHealth): DockNotice[] {
  const { meta } = input;
  const notices: DockNotice[] = [];
  // Some operators keep listing their scooters through the ban, so it comes first.
  const curfew = activeCurfew(input.viewportCenter, input.now);
  if (curfew) {
    notices.push({ kind: 'curfew', text: { key: 'dock.curfew', values: { city: curfew.city }, time: curfew.until, timeZone: curfew.timeZone } });
  }
  // Its operators may list nothing or stop answering: they are not named as down (scooterSnapshots.ts).
  // A pause until the streets are clear has no end to wait for: it gives way once scooters are in view.
  // So does a town whose operators have closed its season: they say when it opens again.
  const season = activeSeasonalPause(input.viewportCenter, input.now, undefined, new Set(meta?.seasonOver));
  if (season && 'month' in season) {
    notices.push({ kind: 'season', text: { key: 'dock.season', values: { city: season.city }, month: season.month } });
  } else if (season && (input.unfilteredCount ?? input.count) === 0) {
    notices.push({ kind: 'season', text: 'from' in season
      ? { key: 'dock.seasonUntilClear', values: { city: season.city }, date: season.from }
      : { key: 'dock.seasonOver', values: { city: season.city } } });
  }
  const providers = providersDownNotice(health);
  if (providers) notices.push({ kind: 'providers', text: providers });
  if (meta?.truncated) {
    notices.push({
      kind: 'truncated',
      text: { key: 'dock.truncated', numbers: { shown: input.representedCount, total: meta.totalVehicles } },
    });
  }
  if (meta?.parkingStatus === 'failed' || meta?.parkingStatus === 'partial') {
    notices.push({ kind: 'parking', text: { key: 'dock.parkingUnavailable' } });
  } else if (meta?.parkingStatus === 'stale') {
    notices.push({ kind: 'parking', text: { key: 'dock.parkingStale' } });
  }
  return notices;
}

/**
 * Everything the dock shows while no scooter or parking bay is selected. The
 * caller renders it as it is; the texts go through formatUiText().
 */
export function dockModel(input: DockInput): DockModel {
  const busy = input.loading !== null;

  if (input.outOfDate) {
    return {
      kind: 'outOfDate',
      title: { key: 'fail.outOfDate.title' },
      body: [
        ...(input.lastUpdated === null ? [] : [{ key: 'fail.outOfDate.body', time: input.lastUpdated } satisfies UiText]),
        { key: failureReasonKey(input.failure ?? 'failed') },
      ],
      action: { key: 'fail.refresh' },
      busy,
    };
  }

  // No count yet: one line, without a status or a hint, and without notices unless it lasts.
  const pending = (phase: 'waiting' | 'finding', chips: DockChips | null, notices: DockNotice[] = []): Extract<DockModel, { kind: 'summary' }> => ({
    kind: 'summary',
    phase,
    count: { value: null, label: { key: phase === 'waiting' ? 'dock.waiting' : 'dock.finding' } },
    lead: null,
    status: null,
    retry: false,
    busy,
    notices,
    chips,
    hint: null,
  });
  if (!input.hasData) return pending(input.failure ? 'waiting' : 'finding', null);

  const nothing = nothingToShow(input);
  if (nothing?.kind === 'outsideCoverage') {
    return {
      kind: 'outsideCoverage',
      title: { key: 'coverage.title' },
      body: coverageBody(COVERED_CITY_TOTAL, COVERED_COUNTRY_TOTAL),
      label: { key: 'coverage.closest' },
      cities: nothing.cities.map(city => ({ city })),
    };
  }
  if (nothing?.kind === 'filtersHideAll') {
    const { hiddenCount } = nothing;
    return {
      kind: 'filtersHideAll',
      title: hiddenCount === null
        ? { key: 'hidden.title.unknown' }
        : hiddenCount === 1
          ? { key: 'hidden.title.one' }
          : { key: 'hidden.title.other', numbers: { count: hiddenCount } },
      summary: nothing.summary,
      showAll: hiddenCount === null
        ? { key: 'hidden.showAll' }
        : { key: 'hidden.showAll.count', numbers: { count: hiddenCount } },
      edit: { key: 'hidden.edit' },
      hiddenCount,
    };
  }

  const health = providerHealth({
    meta: input.meta,
    viewportProviders: input.viewportProviders,
    inView: input.providersInView,
  });
  const providerChips = dockChips({ ...input, down: health.down });
  // "All" on its own filters nothing, so there are chips only where providers operate.
  const chips = providerChips.providers.length > 0 ? providerChips : null;
  // A failure already explains an empty view, so it never reads "Finding scooters…".
  if (input.loading === 'load' && input.count === 0 && !input.failure) return pending('finding', chips);
  // None counted yet, only faded ones: the server's sweep is finding them, which may take a minute or two.
  // The line under says whose and since when.
  if (filling(input) && input.count === 0) {
    return { ...pending('finding', chips, dockNotices(input, health)), status: dockStatus(input).status };
  }

  const scope = input.originInViewport ? 'nearby' : 'onMap';
  // Every provider here is down: the notice explains the empty map, which is then
  // neither live, of no scooters at all, nor empty for the want of any.
  const allDown = health.down.length > 0 && input.viewportProviders.every(provider => health.down.some(key => key === provider));
  const { status, retry } = dockStatus(input);
  return {
    kind: 'summary',
    phase: 'ready',
    count: {
      value: input.count,
      // Which counts take the singular depends on the language: French says "0 trottinette".
      label: { key: `dock.${scope}.other`, one: { key: `dock.${scope}.one`, count: input.count } },
    },
    lead: input.originInViewport && input.nearest && input.count > 0
      ? {
          provider: input.nearest.provider,
          name: PROVIDERS[input.nearest.provider]?.name ?? input.nearest.provider,
          distanceM: input.nearest.distanceM,
          minutes: walkingMinutes(input.nearest.distanceM),
          place: input.nearest.place,
        }
      : null,
    status: allDown && (status?.kind === 'live' || status?.kind === 'updated') ? null : status,
    retry,
    busy,
    notices: dockNotices(input, health),
    chips,
    hint: nothing?.kind === 'empty' && !allDown
      ? { kind: 'empty', text: { key: 'dock.empty' } }
      : input.meta?.overview && input.count > 0
        ? { kind: 'cityHint', text: { key: 'dock.cityHint' } }
        : null,
  };
}
