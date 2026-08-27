import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useClickOutside } from '../../utils/useClickOutside';

/**
 * Portals its content to document.body and positions it (fixed, viewport-clamped)
 * against `anchorRef`'s real bounding rect — so it can't be clipped by an
 * `overflow: hidden` ancestor of the trigger (a scrollable row list, a card, etc.)
 * the way a plain CSS `position: absolute` popover would be.
 */
export function AnchoredPopover({
  anchorRef,
  open,
  onClose,
  align = 'left',
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  align?: 'left' | 'right';
  children: ReactNode;
}) {
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0, visible: false });
  useClickOutside([anchorRef, popRef], open, onClose);

  useLayoutEffect(() => {
    if (!open) {
      setPos((p) => ({ ...p, visible: false }));
      return;
    }

    const reposition = () => {
      const anchor = anchorRef.current;
      const pop = popRef.current;
      if (!anchor || !pop) return;
      const a = anchor.getBoundingClientRect();
      const { width, height } = pop.getBoundingClientRect();
      const margin = 8;
      let left = align === 'right' ? a.right - width : a.left;
      left = Math.min(Math.max(margin, left), window.innerWidth - width - margin);
      let top = a.bottom + 6;
      if (top + height > window.innerHeight - margin) top = Math.max(margin, a.top - height - 6);
      setPos({ left, top, visible: true });
    };
    reposition();

    // Capture-phase so a scroll on any ancestor list (which might clip/move the
    // anchor) keeps the popover tracking it. Scrolling inside the popover's own
    // content (e.g. a long options list) must NOT reposition or close it.
    const onScroll = (e: Event) => {
      if (popRef.current && e.target instanceof Node && popRef.current.contains(e.target)) return;
      reposition();
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, anchorRef, align]);

  if (!open) return null;

  return createPortal(
    <div
      ref={popRef}
      className="anchored-popover"
      style={{ position: 'fixed', left: pos.left, top: pos.top, opacity: pos.visible ? 1 : 0 }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>,
    document.body,
  );
}
