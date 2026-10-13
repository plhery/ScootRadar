import { describe, expect, it } from 'vitest';
import { REVEAL_GAP, revealShift, type ScreenBox } from '@/lib/markerReveal';

// A phone of 390 by 844: the search bar ends at 72, the dock holds a card from 620 down.
const dock: ScreenBox = { left: 10, top: 620, right: 380, bottom: 834 };
const locate: ScreenBox = { left: 328, top: 556, right: 378, bottom: 606 };
const credits: ScreenBox = { left: 12, top: 582, right: 153, bottom: 614 };
const phone = { obstacles: [locate, dock, credits], ceiling: 72, floor: 844 };
const marker = (left: number, top: number): ScreenBox => ({ left, top, right: left + 44, bottom: top + 44 });

/** A box as getBoundingClientRect() gives it: its sides are getters of a DOMRect, not properties of its own. */
class Measured {
  constructor(private readonly box: ScreenBox) {}
  get left() { return this.box.left; }
  get top() { return this.box.top; }
  get right() { return this.box.right; }
  get bottom() { return this.box.bottom; }
}
const measured = (box: ScreenBox): ScreenBox => new Measured(box);

describe('revealShift', () => {
  it('leaves the map alone when the marker is clear of the dock and its controls', () => {
    expect(revealShift({ marker: marker(180, 300), ...phone })).toEqual({ x: 0, y: 0 });
    // Just above the dock, between the credits and the locate button.
    expect(revealShift({ marker: marker(180, 620 - 44 - REVEAL_GAP), ...phone })).toEqual({ x: 0, y: 0 });
  });

  it('moves a marker that the dock has grown over to just above it', () => {
    // Picked at 640, where the dock was not yet: the card now starts at 620.
    expect(revealShift({ marker: marker(180, 640), ...phone })).toEqual({ x: 0, y: 640 + 44 + REVEAL_GAP - 620 });
    // The same for one that is only partly covered.
    expect(revealShift({ marker: marker(180, 600), ...phone })).toEqual({ x: 0, y: 600 + 44 + REVEAL_GAP - 620 });
  });

  it('moves on above a control when getting clear of the dock would put the marker under it', () => {
    // At the right edge, the locate button is what is above the dock.
    expect(revealShift({ marker: marker(330, 640), ...phone })).toEqual({ x: 0, y: 640 + 44 + REVEAL_GAP - 556 });
    // At the left edge, the credits.
    expect(revealShift({ marker: marker(60, 640), ...phone })).toEqual({ x: 0, y: 640 + 44 + REVEAL_GAP - 582 });
    // A marker under a control alone is moved too.
    expect(revealShift({ marker: marker(330, 540), ...phone })).toEqual({ x: 0, y: 540 + 44 + REVEAL_GAP - 556 });
  });

  it('does not count what is beside the marker', () => {
    // A phone on its side: the dock is a column in the middle, the marker is left of it.
    const column: ScreenBox = { left: 142, top: 171, right: 702, bottom: 378 };
    expect(revealShift({ marker: measured(marker(60, 250)), obstacles: [measured(column)], ceiling: 70, floor: 390 })).toEqual({ x: 0, y: 0 });
    expect(revealShift({ marker: marker(60, 250), obstacles: [column], ceiling: 70, floor: 390 })).toEqual({ x: 0, y: 0 });
    expect(revealShift({ marker: marker(300, 250), obstacles: [column], ceiling: 70, floor: 390 })).toEqual({ x: 0, y: 250 + 44 + REVEAL_GAP - 171 });
  });

  it('stops under the search bar where the room above the dock is short', () => {
    // The card leaves 40 px under the bar, less than a marker: it goes as far up as the bar allows.
    const tall: ScreenBox = { left: 10, top: 112, right: 380, bottom: 378 };
    expect(revealShift({ marker: marker(180, 200), obstacles: [tall], ceiling: 72, floor: 390 })).toEqual({ x: 0, y: 200 - REVEAL_GAP - 72 });
    // And stays where it is when it is already as high as it can be.
    expect(revealShift({ marker: marker(180, 76), obstacles: [tall], ceiling: 72, floor: 390 })).toEqual({ x: 0, y: 0 });
  });

  it('goes to the side of a control where the room above is too short to clear it', () => {
    // A phone of 320 by 568 with a tall card: the credits are on top of Near me,
    // and between them and the search bar there is less room than a marker needs.
    const credits: ScreenBox = { left: 12, top: 106, right: 148, bottom: 138 };
    const nearMe: ScreenBox = { left: 138, top: 146, right: 308, bottom: 198 };
    const card: ScreenBox = { left: 10, top: 212, right: 310, bottom: 558 };
    const short = { obstacles: [card, nearMe, credits], ceiling: 68, floor: 568, sides: { left: 0, right: 320 } };
    const pin = (left: number, top: number): ScreenBox => ({ left, top, right: left + 38, bottom: top + 38 });
    // As high as it goes, and right of the credits, where it is on nothing.
    expect(revealShift({ marker: pin(141, 300), ...short })).toEqual({ x: 148 + REVEAL_GAP - 141, y: 300 - REVEAL_GAP - 68 });
    // Already as high as it goes: it only goes sideways.
    expect(revealShift({ marker: pin(141, 76), ...short })).toEqual({ x: 148 + REVEAL_GAP - 141, y: 0 });
    // Nearer the left edge, left of the credits there is no room: it still goes right.
    expect(revealShift({ marker: pin(20, 76), ...short })).toEqual({ x: 148 + REVEAL_GAP - 20, y: 0 });
    // Without the edges of the map it only goes up.
    expect(revealShift({ marker: pin(141, 76), ...short, sides: undefined })).toEqual({ x: 0, y: 0 });
    // The same from the boxes a browser measures, whose sides are getters.
    expect(revealShift({ marker: measured(pin(141, 76)), ...short, obstacles: short.obstacles.map(measured) }))
      .toEqual({ x: 148 + REVEAL_GAP - 141, y: 0 });
  });

  it('does not go sideways where that would put it on something else, or off the map', () => {
    // The card is as wide as the map: no side of it is in the clear.
    const tall: ScreenBox = { left: 10, top: 112, right: 380, bottom: 378 };
    expect(revealShift({ marker: marker(180, 200), obstacles: [tall], ceiling: 72, floor: 390, sides: { left: 0, right: 390 } }))
      .toEqual({ x: 0, y: 200 - REVEAL_GAP - 72 });
    // Right of the credits is Near me, at the same height: the marker stays where it is.
    const credits: ScreenBox = { left: 12, top: 106, right: 148, bottom: 138 };
    const nearMe: ScreenBox = { left: 150, top: 100, right: 308, bottom: 152 };
    expect(revealShift({ marker: { left: 120, top: 76, right: 158, bottom: 114 }, obstacles: [credits, nearMe], ceiling: 68, floor: 568, sides: { left: 0, right: 320 } }))
      .toEqual({ x: 0, y: 0 });
  });

  it('leaves alone a marker that is not on screen', () => {
    expect(revealShift({ marker: marker(180, 900), ...phone })).toEqual({ x: 0, y: 0 });
    expect(revealShift({ marker: marker(180, -60), ...phone })).toEqual({ x: 0, y: 0 });
  });
});
