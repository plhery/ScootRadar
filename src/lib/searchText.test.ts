import { describe, expect, it } from 'vitest';
import { COUNTRY_SEARCH_WORDS } from '@/generated/countries';
import { searchText, searchWords, TYPED_WORD, westernDigits } from '@/lib/searchText';

describe('searchWords', () => {
  it('reads Latin text as before: without accents, with the letters no accent can be taken from spelled out', () => {
    expect(searchWords('Zürich HB')).toEqual(['zurich', 'hb']);
    expect(searchWords('Bahnhofstraße 10')).toEqual(['bahnhofstrasse', '10']);
    expect(searchText('Tromsø')).toBe('tromso');
    expect(searchText('Bærum')).toBe('baerum');
    expect(searchText('Ísafjörður')).toBe('isafjordur');
    expect(searchText('Wołomin')).toBe('wolomin');
    expect(searchText('Kıbrıs')).toBe('kibris');
    expect(searchText('Œuvre')).toBe('oeuvre');
    // An apostrophe between Latin letters still parts them.
    expect(searchWords("Rue de l'Église")).toEqual(['rue', 'de', 'l', 'eglise']);
    expect(searchWords("Be'er Sheva")).toEqual(['be', 'er', 'sheva']);
  });

  it('reads Greek and Cyrillic without their marks, and a final sigma as a sigma', () => {
    expect(searchText('Ρόδος')).toBe(searchText('ΡΟΔΟΣ'));
    expect(searchText('Ρόδος')).toBe('ροδοσ');
    expect(searchText('Θεσσαλονίκη')).toBe('θεσσαλονικη');
    expect(searchText('Київ')).toBe(searchText('Киів'));
  });

  it('reads Hebrew without its vowel points, and its final letters as the letters themselves', () => {
    expect(searchText('שְׂדֵרוֹת רוֹטְשִׁילְד')).toBe('שדרות רוטשילד');
    expect(searchText('תֵּל אָבִיב')).toBe(searchText('תל אביב'));
    // ם, ן and ך are written at the end of a word only.
    expect(searchText('ירושלים')).toBe('ירושלימ');
    expect(searchText('ראשון לציון')).toBe('ראשונ לציונ');
  });

  it('keeps a Hebrew geresh or gershayim, or what is typed for one, inside its word', () => {
    expect(searchWords('ז׳בוטינסקי')).toEqual(['זבוטינסקי']);
    expect(searchWords("ז'בוטינסקי")).toEqual(['זבוטינסקי']);
    expect(searchWords('ז’בוטינסקי')).toEqual(['זבוטינסקי']);
    expect(searchWords('ת״א')).toEqual(['תא']);
    expect(searchWords('ת"א')).toEqual(['תא']);
    // A maqaf parts two words, as a hyphen does.
    expect(searchWords('תל אביב־יפו')).toEqual(['תל', 'אביב', 'יפו']);
    expect(searchWords('תל-אביב-יפו')).toEqual(['תל', 'אביב', 'יפו']);
  });

  it('reads Arabic without its vowel marks, hamzas, maddas and tatweels, and a few letters as most riders type them', () => {
    expect(searchText('الإمارات')).toBe('الامارات');
    expect(searchText('أبو ظبي')).toBe('ابو ظبي');
    expect(searchText('آل')).toBe('ال');
    expect(searchText('مؤتمر')).toBe('موتمر');
    expect(searchText('هيئة')).toBe('هييه');
    expect(searchText('دُبَيّ')).toBe('دبي');
    expect(searchText('دبـــي')).toBe('دبي');
    expect(searchText('ٱلرياض')).toBe('الرياض');
    expect(searchText('مستشفى')).toBe('مستشفي');
    expect(searchText('جدة')).toBe('جده');
    expect(searchText('السعودية')).toBe('السعوديه');
    expect(searchWords('دبي مول')).toEqual(['دبي', 'مول']);
  });

  it('reads Arabic-Indic digits as 0-9, and the full- and half-width forms of East Asian text as their usual forms', () => {
    expect(searchWords('شارع ١٠')).toEqual(['شارع', '10']);
    expect(searchWords('خیابان ۲۴')).toEqual(['خیابان', '24']);
    expect(searchWords('ｶﾞｯｺｳ')).toEqual(['ガッコウ']);
    expect(searchWords('ＡＢＣ　１２')).toEqual(['abc', '12']);
    // The voicing marks of kana stay: が is not か.
    expect(searchText('がっこう')).not.toBe(searchText('かっこう'));
  });

  it('gives no words for text without letters or digits', () => {
    expect(searchWords(' - , ')).toEqual([]);
    expect(searchText('')).toBe('');
  });
});

describe('westernDigits', () => {
  it('writes Arabic and Persian digits as 0-9 and leaves the rest as it is', () => {
    expect(westernDigits('شارع الملك فهد ٢٢، الرياض ١٢٢٧١')).toBe('شارع الملك فهد 22، الرياض 12271');
    expect(westernDigits('۱۲۳۴')).toBe('1234');
    expect(westernDigits('Langstrasse 120')).toBe('Langstrasse 120');
  });
});

describe('TYPED_WORD', () => {
  it('takes a Hebrew word with its geresh as one word, and Latin words around an apostrophe as two', () => {
    const words = (text: string) => [...text.matchAll(TYPED_WORD)].map(([word]) => word);
    expect(words("רחוב ז'בוטינסקי 5")).toEqual(['רחוב', "ז'בוטינסקי", '5']);
    expect(words('ת״א-יפו')).toEqual(['ת״א', 'יפו']);
    expect(words("l'Église")).toEqual(['l', 'Église']);
  });
});

describe('the search words of data/countries.json', () => {
  it('are written as the search reads them: lower case, without accents, one space between two words', () => {
    for (const [country, words] of Object.entries(COUNTRY_SEARCH_WORDS)) {
      for (const word of words) expect(searchText(word), `${country}: ${word}`).toBe(word);
    }
  });
});
