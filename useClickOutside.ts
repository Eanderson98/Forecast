import { useEffect, type RefObject } from 'react';

/**
 * Calls `onOutside` on a click outside every given ref (or Escape), while `active` is true.
 * Accepts one ref or several — several matters when the popover is portaled away from its
 * trigger, since a click on the trigger is then "outside" the popover's own DOM subtree.
 */
export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  active: boolean,
  onOutside: () => void,
) {
  useEffect(() => {
    if (!active) return;
    const list = Array.isArray(refs) ? refs : [refs];
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const inside = list.some((r) => r.current && r.current.contains(target));
      if (!inside) onOutside();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOutside();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, onOutside, ...(Array.isArray(refs) ? refs : [refs])]);
}
