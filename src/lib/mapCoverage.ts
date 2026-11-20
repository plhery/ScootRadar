export const CITY_OVERVIEW_MAX_ZOOM = 10;

export function mapRepresentationsMatch(a: number, b: number): boolean {
  return (a <= CITY_OVERVIEW_MAX_ZOOM && b <= CITY_OVERVIEW_MAX_ZOOM) ||
    (a > 15 && b > 15) || a === b;
}
