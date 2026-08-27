import { useRef, useState, type ReactNode } from 'react';
import { formatShort, parseISODate } from '../../utils/dates';
import { cx } from '../../utils/cx';
import { AnchoredPopover } from './AnchoredPopover';
import { CalendarGrid } from './CalendarGrid';

export function DatePicker({
  value,
  onChange,
  trigger,
  className,
}: {
  value: string;
  onChange: (date: string) => void;
  /** Renders the clickable trigger element; receives a click handler to open the picker. */
  trigger: (onClick: () => void, isOpen: boolean) => ReactNode;
  /** Extra class on the wrapper div, e.g. to stretch it to full width in a form. */
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseISODate(value);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const anchorRef = useRef<HTMLDivElement>(null);

  const close = () => setIsOpen(false);
  const openPicker = () => {
    const d = parseISODate(value);
    setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setIsOpen((v) => !v);
  };

  return (
    <div className={cx('popover-anchor', className)} ref={anchorRef}>
      {trigger(openPicker, isOpen)}
      <AnchoredPopover anchorRef={anchorRef} open={isOpen} onClose={close}>
        <div className="range-cal">
          <div className="range-cal-current">{formatShort(value)}</div>
          <CalendarGrid
            viewMonth={viewMonth}
            onViewMonthChange={setViewMonth}
            onDayClick={(iso) => {
              onChange(iso);
              close();
            }}
            cellClassName={(iso) => iso === value && 'is-endpoint'}
          />
        </div>
      </AnchoredPopover>
    </div>
  );
}
