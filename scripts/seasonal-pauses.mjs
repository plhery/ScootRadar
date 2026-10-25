// As feedPaused in src/lib/seasonalPauses.ts, for the live catalog check, which runs without
// packages: a catalog's `seasonal` window, per service area or for the whole system, in which the
// operator's feed may list nothing or stop answering, as Bird's Leduc feed has since 22 October
// 2026. Its test holds the two to the same answers.

/** As CLEAR_BY there: a pause until the streets are clear holds until 1 May at the latest. */
export const CLEAR_BY = '05-01';

const dates = new Map();

/** The local date in the zone at that instant, "MM-DD". */
function localDate(time, timeZone) {
  let format = dates.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-GB', { timeZone, month: '2-digit', day: '2-digit' });
    dates.set(timeZone, format);
  }
  const parts = format.formatToParts(time);
  const part = type => parts.find(entry => entry.type === type)?.value ?? '';
  return `${part('month')}-${part('day')}`;
}

/** Whether the pause holds at that instant; a window from "11-16" until "04-15" spans the new year. */
export function pauseHolds(pause, now) {
  const today = localDate(now, pause.timeZone);
  const until = pause.until === 'clear' ? CLEAR_BY : pause.until;
  return pause.from < until
    ? today >= pause.from && today < until
    : today >= pause.from || today < until;
}

/** The system's pauses, one per service area, when every one of them holds at that instant; else undefined. */
export function heldPauses(system, now) {
  const pauses = (system.areas ?? [system]).map(area => area.seasonal ?? system.seasonal);
  return pauses.every(pause => pause && pauseHolds(pause, now)) ? pauses : undefined;
}
