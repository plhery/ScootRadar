'use client';

import { useEffect, useRef, type ComponentProps } from 'react';

/**
 * The stage of the landing page, which leans a little after the pointer. It
 * only says where the pointer is, in two custom properties from -1 to 1; the
 * stylesheet decides what moves. Without a mouse, or with reduced motion,
 * nothing does.
 */
export default function StageDepth({ children, ...props }: ComponentProps<'section'>) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;

    const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const lean = (event: PointerEvent) => {
      if (!mouse.matches || still.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = stage.getBoundingClientRect();
        stage.style.setProperty('--px', (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
        stage.style.setProperty('--py', (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
      });
    };
    const rest = () => {
      cancelAnimationFrame(frame);
      stage.style.removeProperty('--px');
      stage.style.removeProperty('--py');
    };

    stage.addEventListener('pointermove', lean);
    stage.addEventListener('pointerleave', rest);
    return () => {
      stage.removeEventListener('pointermove', lean);
      stage.removeEventListener('pointerleave', rest);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <section ref={ref} {...props}>{children}</section>;
}
