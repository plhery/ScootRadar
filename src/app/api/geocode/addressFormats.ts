import { RIGHT_TO_LEFT } from '@/lib/bidi';

/** How a country writes an address, where it does not write it as most of Europe does: "Langstrasse 120", "8004 Zürich". */
export interface AddressFormat {
  /** The house number before the street: "10 Rue de Rivoli". */
  numberFirst?: true;
  /** The line of the town, its postcode and its state or province, "{postcode} {town}" where not given: "Austin, TX 78701". */
  townLine?: string;
  /** A postcode as riders type it after the town: "Auckland 1010", "Austin, TX 78701". */
  postcode?: RegExp;
}

/**
 * By country code: those of data/countries.json, and the neighbours whose places the search
 * finds too. Every country outside Europe gives its own, even an empty one, so that each new
 * one is looked at (addressFormats.test.ts).
 */
export const ADDRESS_FORMATS: Readonly<Record<string, AddressFormat>> = {
  FR: { numberFirst: true },
  GB: { numberFirst: true },
  IE: { numberFirst: true },
  LU: { numberFirst: true },
  MC: { numberFirst: true },
  US: { numberFirst: true, townLine: '{town}, {region} {postcode}', postcode: /\d{5}(?:-\d{4})?/ },
  CA: { numberFirst: true, townLine: '{town}, {region} {postcode}', postcode: /[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d/ },
  AU: { numberFirst: true, townLine: '{town} {region} {postcode}', postcode: /\d{4}/ },
  NZ: { numberFirst: true, townLine: '{town} {postcode}', postcode: /\d{4}/ },
  // Israel Post writes the postcode before the town, "6688218 Tel Aviv-Yafo"; riders type it after it too.
  IL: { numberFirst: true, postcode: /\d{7}/ },
  // Without postcodes: what OpenStreetMap tags as one there is a Makani number ("26661 88056"), a P.O. box or "00000".
  AE: { numberFirst: true, townLine: '{town}' },
  SA: { numberFirst: true, townLine: '{town} {postcode}', postcode: /\d{5}/ },
  // Costa Rica's five-digit postcode comes after the town: "Tamarindo 50309".
  CR: { townLine: '{town} {postcode}', postcode: /\d{5}/ },
  // Bonaire and Curaçao have no postcodes; their addresses are written the Dutch way: "Kaya Grandi 22".
  BQ: { townLine: '{town}' },
  CW: { townLine: '{town}' },
};

/** A street with its house number, as the country writes it. A street named in Hebrew or Arabic keeps its number after it, as it is written there: "שדרות רוטשילד 22". */
export function streetAddress(country: string, street: string, number: string): string {
  if (!street || !number) return street;
  return ADDRESS_FORMATS[country]?.numberFirst && !RIGHT_TO_LEFT.test(street) ? `${number} ${street}` : `${street} ${number}`;
}

/** The line of the town, as the country writes it; the parts it lacks left out with their commas: "Austin, TX 78701", "Sydney NSW 2000", "8004 Zürich". */
export function townLine(country: string, parts: { town: string; postcode: string; region: () => string }): string {
  return (ADDRESS_FORMATS[country]?.townLine ?? '{postcode} {town}')
    .replace(/\{(town|postcode|region)\}/g, (_, part: 'town' | 'postcode' | 'region') => part === 'region' ? parts.region() : parts[part])
    .replace(/\s+/g, ' ').replace(/ ,/g, ',').replace(/,+/g, ',').replace(/^[\s,]+|[\s,]+$/g, '');
}

/** A postcode typed at the end of an address, after its town and any state or province: "TX 78701", "ON M5V 2T6", "Auckland 1010". */
export const POSTCODE_AFTER_TOWN = new RegExp(`[\\s,]+(?:${[...new Set(Object.values(ADDRESS_FORMATS)
  .flatMap(({ postcode }) => postcode ? [postcode.source] : []))].join('|')})\\s*$`);
