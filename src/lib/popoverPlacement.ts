/** From the centre of a marker to the edge of its card: the marker, its selection ring and the arrow. */
export const POPOVER_GAP = 31;
/** What stays free between the card and the edges of the window. */
export const POPOVER_MARGIN = 16;
/** The arrow sits level with the head of the card when nothing is in the way. */
const ARROW_TOP = 59;
/** The arrow stays on the straight part of the edge, clear of the rounded corners. */
const ARROW_INSET = 32;
/** What stays free between a card that has lost sight of its marker and the controls on the map. */
const CONTROL_GAP = 12;

interface Size {
  width: number;
  height: number;
}

/** A box on the map, from its top left corner. */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface PopoverPlacement {
  /** The side of the marker the card is on; the arrow is on the opposite edge of the card. */
  side: 'right' | 'left';
  left: number;
  top: number;
  /** The centre of the arrow, from the top of the card. */
  arrowTop: number;
  /** The marker is out of view: the card has nothing to point at, and keeps clear of the controls. */
  detached: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** The nearest place for a card that covers none of the controls, or where it is if there is none. */
function clearOfControls(left: number, top: number, size: Size, viewport: Size, controls: Box[]) {
  const covers = (x: number, y: number) => controls.some(box =>
    x < box.right + CONTROL_GAP && x + size.width > box.left - CONTROL_GAP &&
    y < box.bottom + CONTROL_GAP && y + size.height > box.top - CONTROL_GAP);
  const inside = (x: number, y: number) => x >= POPOVER_MARGIN && y >= POPOVER_MARGIN &&
    x + size.width <= viewport.width - POPOVER_MARGIN && y + size.height <= viewport.height - POPOVER_MARGIN;
  if (!covers(left, top)) return { left, top };
  // Beside or above or below one of them, or against an edge of the window.
  const lefts = [left, POPOVER_MARGIN, viewport.width - POPOVER_MARGIN - size.width,
    ...controls.flatMap(box => [box.left - CONTROL_GAP - size.width, box.right + CONTROL_GAP])];
  const tops = [top, POPOVER_MARGIN, viewport.height - POPOVER_MARGIN - size.height,
    ...controls.flatMap(box => [box.top - CONTROL_GAP - size.height, box.bottom + CONTROL_GAP])];
  let best: { left: number; top: number; distance: number } | null = null;
  for (const x of lefts) {
    for (const y of tops) {
      if (!inside(x, y) || covers(x, y)) continue;
      const distance = Math.hypot(x - left, y - top);
      if (!best || distance < best.distance) best = { left: x, top: y, distance };
    }
  }
  return best ?? { left, top };
}

/**
 * Where the card of a selected scooter or parking bay goes on a desktop: to the
 * right of its marker, to the left where the right has no room, and moved up or
 * down to stay inside the window. The arrow keeps pointing at the marker.
 *
 * A marker out of view, as the one walked to can be, keeps its card at the
 * edge it is beyond, clear of the controls: nothing is there to point at.
 */
export function placePopover({ anchor: marker, size, viewport, avoid = null, controls = [] }: {
  /** The centre of the marker. */
  anchor: { x: number; y: number };
  size: Size;
  viewport: Size;
  /** The search bar in the top left corner: a card that reaches under it starts below it. */
  avoid?: { right: number; bottom: number } | null;
  /** What a card out of sight of its marker does not cover: the search bar, the legend, the buttons on the map. */
  controls?: Box[];
}): PopoverPlacement {
  const detached = marker.x < 0 || marker.y < 0 || marker.x > viewport.width || marker.y > viewport.height;
  const anchor = detached
    ? { x: clamp(marker.x, 0, viewport.width), y: clamp(marker.y, 0, viewport.height) }
    : marker;
  const fitsRight = anchor.x + POPOVER_GAP + size.width <= viewport.width - POPOVER_MARGIN;
  const fitsLeft = anchor.x - POPOVER_GAP - size.width >= POPOVER_MARGIN;
  const side = fitsRight || !fitsLeft ? 'right' : 'left';
  const beside = side === 'right' ? anchor.x + POPOVER_GAP : anchor.x - POPOVER_GAP - size.width;
  // A window too narrow for either side keeps the whole card in view, over the marker if it must.
  const left = clamp(beside, POPOVER_MARGIN, Math.max(POPOVER_MARGIN, viewport.width - POPOVER_MARGIN - size.width));

  const minTop = avoid && left < avoid.right ? Math.max(POPOVER_MARGIN, avoid.bottom) : POPOVER_MARGIN;
  const maxTop = Math.max(minTop, viewport.height - POPOVER_MARGIN - size.height);
  const top = clamp(anchor.y - ARROW_TOP, minTop, maxTop);
  const arrowTop = clamp(anchor.y - top, ARROW_INSET, Math.max(ARROW_INSET, size.height - ARROW_INSET));

  if (!detached) return { side, left, top, arrowTop, detached };
  return { side, ...clearOfControls(left, top, size, viewport, controls), arrowTop, detached };
}
