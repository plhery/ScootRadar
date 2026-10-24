import { describe, expect, it } from 'vitest';
import { COUNTRY_CODES, COUNTRY_CONTINENTS } from '@/generated/countries';
import { ADDRESS_FORMATS, POSTCODE_AFTER_TOWN, streetAddress, townLine } from './addressFormats';

const region = (code: string) => () => code;

describe('the address formats', () => {
  it('writes South African physical addresses in UPU order', () => {
    expect(streetAddress('ZA', 'Mykonos Access Road', '1')).toBe('1 Mykonos Access Road');
    expect(townLine('ZA', { town: 'Langebaan', postcode: '7357', region: region('Western Cape') })).toBe('Langebaan 7357');
  });

  it('formats the new Beam countries, retaining Korean road-number order in Hangul', () => {
    expect(streetAddress('MY', 'Jalan Kenari', '66')).toBe('66 Jalan Kenari');
    expect(townLine('MY', { town: 'Kajang', postcode: '43000', region: region('Selangor') })).toBe('43000 Kajang');
    expect(streetAddress('KR', 'Beobwonbuk-ro', '33')).toBe('33 Beobwonbuk-ro');
    expect(streetAddress('KR', '법원북로', '33')).toBe('법원북로 33');
    expect(townLine('KR', { town: 'Busan', postcode: '47502', region: region('') })).toBe('Busan 47502');
    expect(streetAddress('TR', 'İstiklal Caddesi', '48')).toBe('İstiklal Caddesi 48');
  });

  it('are given for every country outside Europe', () => {
    const missing = COUNTRY_CODES.filter(code => COUNTRY_CONTINENTS[code] !== 'europe' && !ADDRESS_FORMATS[code]);
    expect(missing, 'add each to ADDRESS_FORMATS in src/app/api/geocode/addressFormats.ts').toEqual([]);
  });

  it('put the house number before the street where the country does', () => {
    expect(streetAddress('CH', 'Langstrasse', '120')).toBe('Langstrasse 120');
    expect(streetAddress('FR', 'Rue de Rivoli', '10')).toBe('10 Rue de Rivoli');
    expect(streetAddress('NZ', 'Queen Street', '10')).toBe('10 Queen Street');
    expect(streetAddress('AU', 'George Street', '1')).toBe('1 George Street');
    expect(streetAddress('IL', 'Yafo Street', '16')).toBe('16 Yafo Street');
    expect(streetAddress('AE', 'Sheikh Zayed Road', '1')).toBe('1 Sheikh Zayed Road');
    expect(streetAddress('SA', 'King Fahd Road', '2')).toBe('2 King Fahd Road');
    expect(streetAddress('CR', 'Calle Central', '5')).toBe('Calle Central 5');
    expect(streetAddress('BQ', 'Kaya Grandi', '22')).toBe('Kaya Grandi 22');
    expect(streetAddress('JP', 'Kasumigaseki', '1-3-2')).toBe('1-3-2 Kasumigaseki');
    expect(streetAddress('KR', 'Sejong-daero', '209')).toBe('209 Sejong-daero');
    expect(streetAddress('XX', 'Main Street', '3')).toBe('Main Street 3');
    expect(streetAddress('NZ', 'Queen Street', '')).toBe('Queen Street');
  });

  it('keep the number after a street named in Hebrew, Arabic or Hangul, as it is written there', () => {
    expect(streetAddress('IL', 'שדרות רוטשילד', '22')).toBe('שדרות רוטשילד 22');
    expect(streetAddress('SA', 'طريق الملك فهد', '2')).toBe('طريق الملك فهد 2');
    expect(streetAddress('KR', '세종대로', '209')).toBe('세종대로 209');
  });

  it('write the line of the town as the country does', () => {
    expect(townLine('CH', { town: 'Zürich', postcode: '8001', region: region('ZH') })).toBe('8001 Zürich');
    expect(townLine('US', { town: 'Austin', postcode: '78701', region: region('TX') })).toBe('Austin, TX 78701');
    expect(townLine('AU', { town: 'Sydney', postcode: '2000', region: region('NSW') })).toBe('Sydney NSW 2000');
    expect(townLine('NZ', { town: 'Auckland', postcode: '1010', region: region('Auckland') })).toBe('Auckland 1010');
    expect(townLine('IL', { town: 'Tel Aviv', postcode: '6688218', region: region('Tel-Aviv District') })).toBe('6688218 Tel Aviv');
    expect(townLine('SA', { town: 'Riyadh', postcode: '12271', region: region('Riyadh Region') })).toBe('Riyadh 12271');
    expect(townLine('AE', { town: 'Dubai', postcode: '', region: region('Dubai') })).toBe('Dubai');
    expect(townLine('CR', { town: 'Tamarindo', postcode: '50309', region: region('Guanacaste') })).toBe('Tamarindo 50309');
    expect(townLine('BQ', { town: 'Kralendijk', postcode: '', region: region('Nederland') })).toBe('Kralendijk');
    expect(townLine('JP', { town: 'Chiyoda-ku', postcode: '100-8798', region: region('Tokyo') })).toBe('Chiyoda-ku, Tokyo 100-8798');
    expect(townLine('BR', { town: 'São Paulo', postcode: '01310-100', region: region('SP') })).toBe('São Paulo, SP 01310-100');
    expect(townLine('CL', { town: 'Santiago', postcode: '8340457', region: region('') })).toBe('8340457 Santiago');
    expect(townLine('CO', { town: 'Medellín', postcode: '050021', region: region('Antioquia') })).toBe('Medellín, Antioquia, 050021');
    expect(townLine('MX', { town: 'Monterrey', postcode: '64000', region: region('Nuevo León') })).toBe('64000 Monterrey, Nuevo León');
    expect(townLine('KZ', { town: 'Almaty', postcode: '050012', region: region('') })).toBe('050012 Almaty');
    expect(townLine('KR', { town: 'Seoul', postcode: '03154', region: region('Seoul') })).toBe('Seoul 03154');
  });

  it('leave out what OpenStreetMap gives as an Emirati postcode, which the Emirates do not use', () => {
    for (const postcode of ['26661 88056', '00000', 'P. O. Box 31166']) {
      expect(townLine('AE', { town: 'Dubai', postcode, region: region('Dubai Emirate') }), postcode).toBe('Dubai');
    }
  });

  it('leave out the parts a place lacks, with their commas', () => {
    expect(townLine('US', { town: 'Austin', postcode: '', region: region('TX') })).toBe('Austin, TX');
    expect(townLine('US', { town: '', postcode: '78701', region: region('TX') })).toBe('TX 78701');
    expect(townLine('US', { town: 'Austin', postcode: '', region: region('') })).toBe('Austin');
    expect(townLine('AU', { town: '', postcode: '2000', region: region('') })).toBe('2000');
    expect(townLine('CH', { town: 'Zürich', postcode: '', region: region('') })).toBe('Zürich');
  });

  it('read a postcode typed after the town, and no house number', () => {
    for (const typed of ['Austin, TX 78701', 'Austin TX 78701-1234', 'Toronto, ON M5V 2T6', 'Sydney NSW 2000',
      'Auckland 1010', 'Tel Aviv 6688218', 'Riyadh 12271', 'Tamarindo 50309', 'São Paulo 01310-100', 'Seoul 03154']) {
      expect(typed.replace(POSTCODE_AFTER_TOWN, ''), typed).not.toBe(typed);
    }
    // Eight digits are now a valid Brazilian CEP; nine unseparated digits match none of these formats.
    for (const typed of ['8001 Zürich', 'Langstrasse 120', 'Tel Aviv 668821811', 'Riyadh 12271a']) {
      expect(typed.replace(POSTCODE_AFTER_TOWN, ''), typed).toBe(typed);
    }
  });
});
