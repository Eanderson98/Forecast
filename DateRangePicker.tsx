import { useRef, useState, type ReactNode } from 'react';
import { formatRange, parseISODate } from '../../utils/dates';
import { cx } from '../../utils/cx';
import { AnchoredPopover } from './AnchoredPopover';
import { CalendarGrid } from './CalendarGrid';

export function DateRangePicker({
  start,
  end,
  onChange,
  trigger,
  className,
}: {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  /** Renders the clickable trigger element; receives a click handler to open the picker. */
  trigger: (onClick: () => void, isOpen: boolean) => ReactNode;
  /** Extra class on the wrapper div, e.g. to stretch it to full width in a form. */
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseISODate(start);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setIsOpen(false);
    setPendingStart(null);
  };

  const openPicker = () => {
    const d = parseISODate(start);
    setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setPendingStart(null);
    setIsOpen((v) => !v);
  };

  const handleDayClick = (iso: string) => {
    if (!pendingStart) {
      setPendingStart(iso);
      return;
    }
    const [newStart, newEnd] = pendingStart <= iso ? [pendingStart, iso] : [iso, pendingStart];
    onChange(newStart, newEnd);
    close();
  };

  return (
    <div className={cx('popover-anchor', className)} ref={anchorRef}>
      {trigger(openPicker, isOpen)}
      <AnchoredPopover anchorRef={anchorRef} open={isOpen} onClose={close}>
        <div className="range-cal">
          <div className="range-cal-current">{formatRange(start, end)}</div>
          <CalendarGrid
            viewMonth={viewMonth}
            onViewMonthChange={setViewMonth}
            onDayClick={handleDayClick}
            cellClassName={(iso) => {
              if (pendingStart) return pendingStart === iso && 'is-pending';
              const inRange = iso >= start && iso <= end;
              const isEndpoint = iso === start || iso === end;
              return cx(inRange && 'is-in-range', isEndpoint && 'is-endpoint');
            }}
          />
          <div className="range-cal-hint">{pendingStart ? 'Pick the end date' : 'Pick a start date, then an end date'}</div>
        </div>
      </AnchoredPopover>
    </div>
  );
}
