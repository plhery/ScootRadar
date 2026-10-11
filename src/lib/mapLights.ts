// The scooters as lights on the map: how large and how bright each one is, which
// ones are named, how scooters parked on one spot are told apart, and where a
// name goes so that it hides as little as it can.

/** From this zoom on a scooter is large enough to carry the initials of its app. */
export const CLOSE_UP_ZOOM = 18;

/** A plain scooter, the nearest one of its app, or the one whose card is open. */
export type LightKind = 'dot' | 'head' | 'selected';

/** Diameter in pixels: larger within a short walk, and all alike with no place to walk from. */
export function lightDiameter(distanceM: number | null, kind: LightKind, closeUp: boolean): number {
  if (closeUp) return kind === 'selected' ? 28 : kind === 'head' ? 24 : 20;
  if (kind === 'selected') return 16;
  if (kind === 'head') return 14;
  if (distanceM === null) return 10;
  if (distanceM <= 80) return 12;
  return distanceM <= 240 ? 10 : 8;
}

/** How strongly a scooter shows, from 1 next to the visitor down to 0.42 far away. */
export function lightStrength(distanceM: number | null, kind: LightKind): number {
  if (kind !== 'dot' || distanceM === null) return 1;
  return Math.round(Math.max(0.42, 1 - distanceM / 620) * 100) / 100;
}

interface Placed {
  key: string;
  provider: string;
  distanceM: number | null;
}

/** The nearest scooter of each app, by key. None without a place to measure from. */
export function nearestOfEachProvider(scooters: readonly Placed[]): Set<string> {
  const nearest = new Map<string, Placed & { distanceM: number }>();
  for (const scooter of scooters) {
    if (scooter.distanceM === null) continue;
    const best = nearest.get(scooter.provider);
    if (!best || scooter.distanceM < best.distanceM) nearest.set(scooter.provider, { ...scooter, distanceM: scooter.distanceM });
  }
  return new Set([...nearest.values()].map(scooter => scooter.key));
}

export interface DrawnLight {
  key: string;
  /** Where the scooter is, in pixels of the screen. */
  x: number;
  y: number;
  diameter: number;
}

export interface Offset {
  dx: number;
  dy: number;
}

/** Closer than this share of a diameter, one scooter hides the other. */
const HIDING = 0.7;
/** Up to this many share a ring; more are packed as the seeds of a sunflower are. */
const RING_LIMIT = 8;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function spread(count: number, spacing: number): Offset[] {
  if (count === 2) return [{ dx: -spacing / 2, dy: 0 }, { dx: spacing / 2, dy: 0 }];
  if (count <= RING_LIMIT) {
    const radius = spacing / (2 * Math.sin(Math.PI / count));
    // The first one at twelve o'clock, the others clockwise.
    return Array.from({ length: count }, (_, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
      return { dx: radius * Math.cos(angle), dy: radius * Math.sin(angle) };
    });
  }
  return Array.from({ length: count }, (_, index) => {
    const radius = 0.58 * spacing * Math.sqrt(index + 0.5);
    const angle = -Math.PI / 2 + index * GOLDEN_ANGLE;
    return { dx: radius * Math.cos(angle), dy: radius * Math.sin(angle) };
  });
}

/**
 * Scooters parked on one spot would be drawn on top of each other. They are
 * moved apart just enough to be counted and pressed one by one: two side by
 * side, a few on a ring around the spot, many packed around it. The same
 * scooters always end up in the same order. Scooters with room of their own
 * are not in the answer.
 */
export function fanOut(lights: readonly DrawnLight[]): Map<string, Offset> {
  const offsets = new Map<string, Offset>();
  if (lights.length < 2) return offsets;
  const ordered = [...lights].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const reach = Math.max(...ordered.map(light => light.diameter)) * HIDING;
  // Only neighbours can hide each other: scooters are looked up by the square they are in.
  const squares = new Map<string, DrawnLight[]>();
  const square = (x: number, y: number) => `${Math.floor(x / reach)}:${Math.floor(y / reach)}`;
  for (const light of ordered) {
    const name = square(light.x, light.y);
    const list = squares.get(name);
    if (list) list.push(light);
    else squares.set(name, [light]);
  }

  const taken = new Set<string>();
  for (const seed of ordered) {
    if (taken.has(seed.key)) continue;
    taken.add(seed.key);
    const group = [seed];
    for (let column = -1; column <= 1; column += 1) {
      for (let row = -1; row <= 1; row += 1) {
        for (const other of squares.get(square(seed.x + column * reach, seed.y + row * reach)) ?? []) {
          if (taken.has(other.key)) continue;
          const limit = Math.max(seed.diameter, other.diameter) * HIDING;
          if (Math.hypot(other.x - seed.x, other.y - seed.y) >= limit) continue;
          taken.add(other.key);
          group.push(other);
        }
      }
    }
    if (group.length === 1) continue;
    group.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    const centreX = group.reduce((sum, light) => sum + light.x, 0) / group.length;
    const centreY = group.reduce((sum, light) => sum + light.y, 0) / group.length;
    const spacing = Math.max(...group.map(light => light.diameter)) + 1;
    spread(group.length, spacing).forEach((place, index) => {
      const light = group[index];
      offsets.set(light.key, { dx: centreX + place.dx - light.x, dy: centreY + place.dy - light.y });
    });
  }
  return offsets;
}

export const NAME_HEIGHT = 26;

export interface NameToPlace {
  key: string;
  /** The centre of the scooter the name belongs to, as it is drawn. */
  x: number;
  y: number;
  /** Half the diameter of that scooter. */
  radius: number;
  /** How wide the name is once written. */
  width: number;
}

/** Something a name should stay off: `weight` says how much it matters, per pixel covered. */
export interface Obstacle {
  x: number;
  y: number;
  half: number;
  weight: number;
}

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const NAME_MARGIN = 3;
/** A name on another name, on a named scooter or on the visitor's own dot is what counts most. */
export const NAME_WEIGHT = 1000;

function covered(a: Box, b: Box): number {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return width > 0 && height > 0 ? width * height : 0;
}

/**
 * The eight places of a name around its scooter, the preferred one first:
 * beside it, above, below, then the corners. Above and below, a name near the
 * edge of the map slides along to stay on it, as far as its own end.
 */
function sides({ x, radius, width }: NameToPlace, within: Box | null): Offset[] {
  const beside = radius + 6;
  const corner = radius + 2;
  const least = within ? within.left + NAME_MARGIN - x : -Infinity;
  const most = within ? within.right - NAME_MARGIN - width - x : Infinity;
  const centred = Math.min(0, Math.max(-width, Math.min(Math.max(-width / 2, least), most)));
  return [
    { dx: beside, dy: -NAME_HEIGHT / 2 },
    { dx: -beside - width, dy: -NAME_HEIGHT / 2 },
    { dx: centred, dy: -radius - 9 - NAME_HEIGHT },
    { dx: centred, dy: radius + 9 },
    { dx: corner, dy: -radius - 5 - NAME_HEIGHT },
    { dx: -corner - width, dy: -radius - 5 - NAME_HEIGHT },
    { dx: corner, dy: radius + 5 },
    { dx: -corner - width, dy: radius + 5 },
  ];
}

/**
 * Where each name goes, as the offset of its top left corner from the centre of
 * its scooter. Names are placed in the order given, the nearest scooter first:
 * each takes the first of its eight places that covers nothing, or else the one
 * that covers the least. The other named scooters count as obstacles by
 * themselves, and so does whatever of a name would fall outside `within`, the
 * part of the map that can be seen.
 */
export function placeNames(
  names: readonly NameToPlace[],
  obstacles: readonly Obstacle[] = [],
  within: Box | null = null,
): Map<string, Offset> {
  const placed: Box[] = [];
  const result = new Map<string, Offset>();
  for (const name of names) {
    const avoid: Obstacle[] = [
      ...obstacles,
      ...names.filter(other => other.key !== name.key)
        .map(other => ({ x: other.x, y: other.y, half: other.radius + 3, weight: NAME_WEIGHT })),
    ];
    let best: { offset: Offset; box: Box; cost: number } | null = null;
    for (const offset of sides(name, within)) {
      const box: Box = {
        left: name.x + offset.dx - NAME_MARGIN,
        top: name.y + offset.dy - NAME_MARGIN,
        right: name.x + offset.dx + name.width + NAME_MARGIN,
        bottom: name.y + offset.dy + NAME_HEIGHT + NAME_MARGIN,
      };
      let cost = 0;
      if (within) cost += ((box.right - box.left) * (box.bottom - box.top) - covered(box, within)) * NAME_WEIGHT;
      for (const other of placed) cost += covered(box, other) * NAME_WEIGHT;
      for (const obstacle of avoid) {
        cost += covered(box, {
          left: obstacle.x - obstacle.half,
          top: obstacle.y - obstacle.half,
          right: obstacle.x + obstacle.half,
          bottom: obstacle.y + obstacle.half,
        }) * obstacle.weight;
      }
      if (!best || cost < best.cost) best = { offset, box, cost };
      if (cost === 0) break;
    }
    if (!best) continue;
    placed.push(best.box);
    result.set(name.key, best.offset);
  }
  return result;
}

/** The scooter drawn nearest to a point, within `reach` pixels of it; null when there is none. */
export function lightAt(lights: readonly DrawnLight[], x: number, y: number, reach: number): string | null {
  let nearest: string | null = null;
  let nearestDistance = Infinity;
  for (const light of lights) {
    const distance = Math.hypot(light.x - x, light.y - y);
    if (distance <= Math.max(reach, light.diameter / 2) && distance < nearestDistance) {
      nearest = light.key;
      nearestDistance = distance;
    }
  }
  return nearest;
}
