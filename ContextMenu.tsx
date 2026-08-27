import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useClickOutside } from '../../utils/useClickOutside';

export function ContextMenu({ x, y, onClose, children }: { x: number; y: number; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y, visible: false });
  useClickOutside(ref, true, onClose);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const margin = 8;
    const left = Math.min(x, window.innerWidth - width - margin);
    const top = Math.min(y, window.innerHeight - height - margin);
    setPos({ left: Math.max(margin, left), top: Math.max(margin, top), visible: true });
  }, [x, y]);

  useLayoutEffect(() => {
    window.addEventListener('resize', onClose);
    return () => window.removeEventListener('resize', onClose);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{ left: pos.left, top: pos.top, opacity: pos.visible ? 1 : 0 }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
