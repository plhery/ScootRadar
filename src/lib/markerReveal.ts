/** A rectangle on screen, as getBoundingClientRect() gives it. */
export interface ScreenBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** How far the map moves a marker, in pixels: x to the right, y up. */
export interface RevealShift {
  x: number;
  y: number;
}

/** The room kept between a marker and what it has to stay clear of. */
export const REVEAL_GAP = 8;

/** Whether a marker is on a box, or less than the gap above it. */
function covers(box: ScreenBox, marker: ScreenBox, gap: number): boolean {
  const beside = marker.right <= box.left || marker.left >= box.right;
  return !beside && marker.bottom + gap > box.top && marker.top < box.bottom;
}

/**
 * How far the map has to move so that a marker is not hidden by what floats
 * over the lower part of the map: the dock, and the controls that sit on it.
 * The marker goes up, and only goes sideways where the room above is too short
 * to clear them: then it goes as far up as it can, and to the side of a control
 * it would still be on. Nothing moves when the marker is in the clear or was not
 * on screen to begin with.
 */
export function revealShift({ marker, obstacles, ceiling, floor, sides, gap = REVEAL_GAP }: {
  marker: ScreenBox;
  /** The dock and the controls just above it. */
  obstacles: readonly ScreenBox[];
  /** The bottom of what lies over the top of the map; the marker is not pushed under it. */
  ceiling: number;
  /** The bottom of the map. */
  floor: number;
  /** The left and right edges of the map; without them the marker only goes up. */
  sides?: { left: number; right: number };
  gap?: number;
}): RevealShift {
  if (marker.top >= floor || marker.bottom <= ceiling) return { x: 0, y: 0 };
  // A DOMRect keeps its sides on its prototype, where a spread does not reach them.
  const { left, right } = marker;
  let shift = 0;
  // From the lowest up: getting clear of one may put the marker under the next.
  for (const box of [...obstacles].sort((a, b) => b.top - a.top)) {
    const lifted = { left, right, top: marker.top - shift, bottom: marker.bottom - shift };
    if (covers(box, lifted, gap)) shift += lifted.bottom + gap - box.top;
  }
  const y = Math.round(Math.max(0, Math.min(shift, marker.top - gap - ceiling)));
  const lifted = { left, right, top: marker.top - y, bottom: marker.bottom - y };
  const under = obstacles.filter(box => covers(box, lifted, gap));
  if (under.length === 0 || !sides) return { x: 0, y };
  // To just beside one of the controls it is on, the shorter way that leaves it on none.
  const clear = under
    .flatMap(box => [box.right + gap - left, box.left - gap - right])
    .filter(x => left + x >= sides.left + gap && right + x <= sides.right - gap)
    .filter(x => !obstacles.some(box => covers(box, { ...lifted, left: left + x, right: right + x }, gap)))
    .sort((a, b) => Math.abs(a) - Math.abs(b));
  return { x: clear.length > 0 ? Math.round(clear[0]) : 0, y };
}
