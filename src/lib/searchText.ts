// Search reads every text in one spelling: what is typed, the names of the places the address
// search finds, and the names of the catalog's cities and countries.

// Letters no accent can be taken from, spelled out: "Tromso", "Baerum", "Isafjordur" and "Wolomin"
// find Tromsø, Bærum, Ísafjörður and Wołomin, and "Kıbrıs" finds Cyprus. Greek and Cyrillic
// letters lose their marks as Latin ones do: "Ροδος" finds Ρόδος, and "Киів" Київ. A final letter is the
// letter itself, as typed in the middle of a word: Greek's ς, Hebrew's ך ם ן ף ץ. An Arabic alef
// wasla is an alef, an alef maksura a yeh and a teh marbuta a heh, as most riders type them.
const SPELLED_OUT: Record<string, string> = {
  ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', đ: 'd', ł: 'l', þ: 'th', ð: 'd', ı: 'i',
  ς: 'σ',
  ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ',
  ٱ: 'ا', ى: 'ي', ة: 'ه',
};
const SPELLED_OUT_LETTERS = new RegExp(`[${Object.keys(SPELLED_OUT).join('')}]`, 'g');

// Every mark that rides on a letter: Latin, Greek and Cyrillic accents, Hebrew vowel points
// and Arabic vowel marks, and the hamza and madda of أ إ آ ؤ ئ, which leave ا و ي behind. Not the
// voicing marks of Japanese kana: が is not か.
const MARKS = /(?![\u3099\u309a])\p{Mn}/gu;
// A Hebrew geresh or gershayim, written as such or typed as an apostrophe or a quotation mark,
// is part of the word it is in: ז׳בוטינסקי is ז'בוטינסקי, and ת״א is ת"א. So is Arabic's tatweel,
// which only stretches a word.
const HEBREW_LETTER = '[\\u05d0-\\u05ea]';
const IN_WORD_MARKS = new RegExp(`[\\u05f3\\u05f4\\u0640]|(?<=${HEBREW_LETTER})['"\\u2018\\u2019](?=${HEBREW_LETTER})`, 'g');

/** Arabic-Indic digits, Arabic's and Persian's, as 0-9: "١٠" is "10". */
export function westernDigits(text: string): string {
  return text.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, digit => String(digit.charCodeAt(0) & 0xf));
}

/**
 * The words of a text in one spelling, in any script: "Zürich" and "Zurich" are both "zurich",
 * "Ρόδος" and "ΡΟΔΟΣ" both "ροδοσ", "שְׂדֵרוֹת רוֹטְשִׁילְד" is "שדרות רוטשילד" and "دبي مول" stays two words.
 */
export function searchWords(text: string): string[] {
  return westernDigits(text).normalize('NFKD').replace(MARKS, '').toLowerCase()
    .replace(IN_WORD_MARKS, '').replace(SPELLED_OUT_LETTERS, letter => SPELLED_OUT[letter])
    .normalize('NFKC').split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
}

/** A text's words in one spelling, joined by single spaces: what a catalog's search words must already be. */
export function searchText(text: string): string {
  return searchWords(text).join(' ');
}

/**
 * A word as typed, with the marks inside it that searchWords keeps in the word: a Hebrew
 * geresh or gershayim, or the apostrophe or quotation mark typed for one, as in ז'בוטינסקי.
 */
export const TYPED_WORD = /(?:[\p{L}\p{M}\p{N}]|(?<=[\u0590-\u05ff])['"\u2018\u2019\u05f3\u05f4](?=[\u05d0-\u05ea]))+/gu;
