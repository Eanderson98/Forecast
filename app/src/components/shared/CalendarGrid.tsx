import { buildMonthGrid, monthLabel } from '../../utils/dates';
import { cx } from '../../utils/cx';

const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** The month header/nav + weekday row + day grid shared by DatePicker and DateRangePicker. */
export function CalendarGrid({
  viewMonth,
  onViewMonthChange,
  cellClassName,
  onDayClick,
}: {
  viewMonth: Date;
  onViewMonthChange: (next: Date) => void;
  cellClassName: (iso: string, inMonth: boolean) => string | false | undefined;
  onDayClick: (iso: string) => void;
}) {
  const cells = buildMonthGrid(viewMonth);

  return (
    <>
      <div className="range-cal-header">
        <button
          type="button"
          className="range-cal-nav"
          onClick={() => onViewMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          aria-label="Previous month"
        >
          <i className="ph ph-caret-left" />
        </button>
        <span className="range-cal-month">{monthLabel(viewMonth)}</span>
        <button
          type="button"
          className="range-cal-nav"
          onClick={() => onViewMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          aria-label="Next month"
        >
          <i className="ph ph-caret-right" />
        </button>
      </div>
      <div className="range-cal-weekdays">
        {WEEKDAY_INITIALS.map((w, i) => <span key={i}>{w}</span>)}
      </div>
      <div className="range-cal-grid">
        {cells.map((cell) => (
          <button
            key={cell.iso}
            type="button"
            className={cx('range-cal-cell', !cell.inMonth && 'is-out', cellClassName(cell.iso, cell.inMonth))}
            onClick={() => onDayClick(cell.iso)}
          >
            {cell.dayNum}
          </button>
        ))}
      </div>
    </>
  );
}
