import { describe, expect, it } from 'vitest';
import {
  NAME_HEIGHT,
  NAME_WEIGHT,
  fanOut,
  lightAt,
  lightDiameter,
  lightStrength,
  nearestOfEachProvider,
  placeNames,
  type DrawnLight,
} from '@/lib/mapLights';

describe('lightDiameter and lightStrength', () => {
  it('draws a scooter larger and brighter the shorter the walk to it', () => {
    expect([40, 80, 81, 240, 241, 900].map(distance => lightDiameter(distance, 'dot', false))).toEqual([12, 12, 10, 10, 8, 8]);
    expect(lightStrength(0, 'dot')).toBe(1);
    expect(lightStrength(155, 'dot')).toBe(0.75);
    // Far away a scooter is still plainly there.
    expect(lightStrength(5000, 'dot')).toBe(0.42);
  });

  it('draws them all alike with no place to walk from', () => {
    expect(lightDiameter(null, 'dot', false)).toBe(10);
    expect(lightStrength(null, 'dot')).toBe(1);
  });

  it('sets the nearest of an app and the selected scooter apart, however far they are', () => {
    expect(lightDiameter(900, 'head', false)).toBe(14);
    expect(lightDiameter(900, 'selected', false)).toBe(16);
    expect(lightStrength(900, 'head')).toBe(1);
    expect(lightStrength(900, 'selected')).toBe(1);
  });

  it('makes room for the initials of the app close up', () => {
    expect(lightDiameter(900, 'dot', true)).toBe(20);
    expect(lightDiameter(900, 'head', true)).toBe(24);
    expect(lightDiameter(null, 'selected', true)).toBe(28);
  });
});

describe('nearestOfEachProvider', () => {
  it('names the nearest scooter of each app, and the first of two as near', () => {
    const heads = nearestOfEachProvider([
      { key: 'voi:1', provider: 'voi', distanceM: 120 },
      { key: 'voi:2', provider: 'voi', distanceM: 60 },
      { key: 'lime:1', provider: 'lime', distanceM: 300 },
      { key: 'lime:2', provider: 'lime', distanceM: 300 },
      { key: 'bolt:1', provider: 'bolt', distanceM: 0 },
    ]);
    expect([...heads].sort()).toEqual(['bolt:1', 'lime:1', 'voi:2']);
  });

  it('names none without distances', () => {
    expect(nearestOfEachProvider([{ key: 'voi:1', provider: 'voi', distanceM: null }]).size).toBe(0);
  });
});

const dot = (key: string, x: number, y: number, diameter = 10): DrawnLight => ({ key, x, y, diameter });
const drawn = (lights: DrawnLight[]) => {
  const offsets = fanOut(lights);
  return lights.map(light => {
    const offset = offsets.get(light.key) ?? { dx: 0, dy: 0 };
    return { ...light, x: light.x + offset.dx, y: light.y + offset.dy };
  });
};
const closestPair = (lights: DrawnLight[]) => {
  let closest = Infinity;
  lights.forEach((a, index) => lights.slice(index + 1).forEach(b => {
    closest = Math.min(closest, Math.hypot(a.x - b.x, a.y - b.y));
  }));
  return closest;
};

describe('fanOut', () => {
  it('leaves scooters with room of their own where they are', () => {
    expect(fanOut([dot('a', 0, 0), dot('b', 7, 0), dot('c', 0, 30)]).size).toBe(0);
    expect(fanOut([dot('a', 0, 0)]).size).toBe(0);
  });

  it('sets two scooters on one spot side by side, around the spot', () => {
    const [a, b] = drawn([dot('bird:1', 100, 50), dot('lime:1', 101, 50)]);
    expect(a).toMatchObject({ x: 95, y: 50 });
    expect(b).toMatchObject({ x: 106, y: 50 });
  });

  it('sets three on a ring, the first at the top, each a diameter and a pixel from the next', () => {
    const lights = drawn([dot('bolt:1', 200, 200), dot('bird:1', 201, 201), dot('lime:1', 202, 202)]);
    // In the order of their keys: Bird, Bolt, Lime.
    const [bolt, bird, lime] = lights;
    expect(bird.x).toBeCloseTo(201);
    expect(bird.y).toBeLessThan(bolt.y);
    expect(bolt.x).toBeGreaterThan(lime.x);
    expect(closestPair(lights)).toBeCloseTo(11);
  });

  it('gives the same scooters the same places whatever order they come in', () => {
    const lights = [dot('a', 10, 10), dot('b', 11, 10), dot('c', 10, 11), dot('d', 11, 11)];
    expect(fanOut([...lights].reverse())).toEqual(fanOut(lights));
  });

  it('makes room for the largest of a group', () => {
    const lights = drawn([dot('a', 0, 0, 16), dot('b', 8, 0, 8)]);
    expect(closestPair(lights)).toBeCloseTo(17);
  });

  it('packs a whole station of them without any hiding another', () => {
    const lights = drawn(Array.from({ length: 20 }, (_, index) => dot(`pb:${String(index).padStart(2, '0')}`, 300, 300)));
    expect(closestPair(lights)).toBeGreaterThan(10 * 0.9);
    // All of them stay close to the station.
    expect(Math.max(...lights.map(light => Math.hypot(light.x - 300, light.y - 300)))).toBeLessThan(32);
  });

  it('keeps two groups apart', () => {
    const offsets = fanOut([dot('a', 0, 0), dot('b', 1, 0), dot('c', 200, 0), dot('d', 201, 0), dot('e', 100, 0)]);
    expect([...offsets.keys()].sort()).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('placeNames', () => {
  const head = (key: string, x: number, y: number, width = 80) => ({ key, x, y, radius: 7, width });

  it('puts a name beside its scooter when nothing is in the way', () => {
    expect(placeNames([head('voi', 100, 100)]).get('voi')).toEqual({ dx: 13, dy: -NAME_HEIGHT / 2 });
  });

  it('moves a name to the other side of its scooter off another named scooter', () => {
    // Lime is where the name of Voi would be.
    const places = placeNames([head('voi', 100, 100), head('lime', 140, 100)]);
    expect(places.get('voi')).toEqual({ dx: -13 - 80, dy: -NAME_HEIGHT / 2 });
    expect(places.get('lime')).toEqual({ dx: 13, dy: -NAME_HEIGHT / 2 });
  });

  it('keeps a name off a name already placed', () => {
    // Two scooters above each other: the second name would run into the first.
    const places = placeNames([head('voi', 100, 100), head('bolt', 100, 120)]);
    expect(places.get('voi')).toEqual({ dx: 13, dy: -NAME_HEIGHT / 2 });
    const bolt = places.get('bolt')!;
    expect(bolt).not.toEqual({ dx: 13, dy: -NAME_HEIGHT / 2 });
  });

  it('keeps a name off the visitor', () => {
    const places = placeNames([head('voi', 100, 100)], [{ x: 130, y: 100, half: 15, weight: NAME_WEIGHT }]);
    expect(places.get('voi')).toEqual({ dx: -13 - 80, dy: -NAME_HEIGHT / 2 });
  });

  it('keeps a name off something wider than it is high, such as the credits', () => {
    const credits = { x: 70, y: 100, half: 65, halfHeight: 13, weight: NAME_WEIGHT };
    // Beside the scooter the name would lie on the credits: above them it is clear.
    expect(placeNames([head('voi', 130, 100)], [credits]).get('voi')).toEqual({ dx: 13, dy: -NAME_HEIGHT / 2 });
    expect(placeNames([head('voi', 100, 100)], [credits]).get('voi')).toEqual({ dx: -40, dy: -7 - 9 - NAME_HEIGHT });
  });

  it('prefers the side that covers the fewest scooters', () => {
    const others = [{ x: 140, y: 100, half: 5, weight: 1 }, { x: 60, y: 100, half: 5, weight: 1 }];
    // Scooters on both sides: above is free.
    expect(placeNames([head('voi', 100, 100)], others).get('voi')).toEqual({ dx: -40, dy: -7 - 9 - NAME_HEIGHT });
  });

  it('places a name even when every side covers something', () => {
    const wall = Array.from({ length: 49 }, (_, index) => (
      { x: 40 + (index % 7) * 20, y: 40 + Math.floor(index / 7) * 20, half: 10, weight: 1 }
    ));
    expect(placeNames([head('voi', 100, 100)], wall).get('voi')).toBeDefined();
  });

  it('keeps a name on the part of the map that can be seen', () => {
    const screen = { left: 0, top: 0, right: 390, bottom: 844 };
    // At the right edge the name goes to the left of its scooter, at the left edge it stays right.
    expect(placeNames([head('voi', 370, 400)], [], screen).get('voi')).toEqual({ dx: -13 - 80, dy: -NAME_HEIGHT / 2 });
    expect(placeNames([head('voi', 20, 400)], [], screen).get('voi')).toEqual({ dx: 13, dy: -NAME_HEIGHT / 2 });
    // In a corner, where neither side has room, it goes where most of it shows.
    const corner = placeNames([head('voi', 385, 8, 120)], [], screen).get('voi')!;
    expect(385 + corner.dx).toBeLessThan(385 - 100);
    expect(8 + corner.dy).toBeGreaterThanOrEqual(-NAME_HEIGHT / 2);
  });

  it('slides a name above its scooter along the edge of the map rather than off it', () => {
    const screen = { left: 6, top: 6, right: 314, bottom: 600 };
    // Named scooters on both sides, and no room on the left: the name goes above, moved in from the edge.
    const places = placeNames([head('hopp', 30, 300, 110), head('voi', 60, 300, 80)], [], screen);
    const hopp = places.get('hopp')!;
    expect(hopp.dy).toBe(-7 - 9 - NAME_HEIGHT);
    expect(30 + hopp.dx).toBe(9);
    // It still stands over its scooter.
    expect(hopp.dx).toBeLessThanOrEqual(0);
    expect(hopp.dx + 110).toBeGreaterThanOrEqual(0);
  });

  it('gives a larger scooter more room', () => {
    expect(placeNames([{ key: 'voi', x: 0, y: 0, radius: 12, width: 60 }]).get('voi')).toEqual({ dx: 18, dy: -NAME_HEIGHT / 2 });
  });
});

describe('lightAt', () => {
  const lights = [dot('a', 100, 100), dot('b', 111, 100), dot('c', 300, 300, 28)];

  it('answers with the scooter drawn nearest to the point', () => {
    expect(lightAt(lights, 104, 100, 22)).toBe('a');
    expect(lightAt(lights, 107, 100, 22)).toBe('b');
  });

  it('answers with none further away than the reach', () => {
    expect(lightAt(lights, 150, 100, 22)).toBeNull();
    expect(lightAt(lights, 124, 100, 14)).toBe('b');
  });

  it('counts the whole of a large scooter whatever the reach', () => {
    expect(lightAt(lights, 312, 300, 4)).toBe('c');
  });
});
