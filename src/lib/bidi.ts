// The app is written left to right in every language it has; place names may not be.

/** A letter of a script written right to left: Hebrew, Arabic, Syriac, Thaana, N'Ko and their presentation forms. */
export const RIGHT_TO_LEFT = /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufefc]/;

const FIRST_STRONG_ISOLATE = '\u2068';
const POP_DIRECTIONAL_ISOLATE = '\u2069';

/**
 * A text set apart from the sentence around it where it has right-to-left letters, so that
 * neither reorders the other: a Hebrew name followed by ", 4 min" would otherwise draw the
 * comma and the number into its own right-to-left run. Its direction is that of its first
 * letter. Left-to-right text is left as it is.
 */
export function isolated(text: string): string {
  return RIGHT_TO_LEFT.test(text) ? `${FIRST_STRONG_ISOLATE}${text}${POP_DIRECTIONAL_ISOLATE}` : text;
}
