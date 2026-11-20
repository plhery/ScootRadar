'use client';

import { useEffect, useState } from 'react';

/**
 * Whether a control that rides above the sheet may glide: false where it appears, so that it is placed there at
 * once, and true from the next frame. It moves with translate, not by its place, which would be a layout shift each
 * frame of the glide. Hidden, it is placed again where it next appears.
 */
export function usePlaced(shown = true): boolean {
  const [placed, setPlaced] = useState(false);
  useEffect(() => {
    if (!shown) {
      setPlaced(false); // eslint-disable-line react-hooks/set-state-in-effect -- hidden, it is placed again where it next appears
      return;
    }
    const frame = requestAnimationFrame(() => setPlaced(true));
    return () => cancelAnimationFrame(frame);
  }, [shown]);
  return placed;
}
