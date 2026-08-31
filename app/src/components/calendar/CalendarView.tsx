import { useMemo, useState } from 'react';
import { calendarEventsByDay } from '../../selectors';
import { useForecastStore } from '../../store';
import { buildMonthGrid, isSameDay, NOW } from '../../utils/dates';
import { Highlight } from '../../utils/Highlight';
import { textContainsQuery } from '../../utils/search';
import { TaskDetailPanel } from '../shared/TaskDetailPanel';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarView() {
  const tasks = useForecastStore((s) => s.tasks);
  const calendarMonth = useForecastStore((s) => s.calendarMonth);
  const openNewTask = useForecastStore((s) => s.openNewTask);
  const searchQuery = useForecastStore((s) => s.searchQuery);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const cells = useMemo(() => buildMonthGrid(calendarMonth), [calendarMonth]);
  const eventsByDay = useMemo(() => calendarEventsByDay(tasks), [tasks]);
  const searching = !!searchQuery.trim();

  return (
    <div className="calendar-scroll">
      <div className="calendar-weekdays">
        {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => {
          const dayEvents = cell.inMonth ? eventsByDay.get(cell.iso) ?? [] : [];
          const hasMatch = dayEvents.some((t) => textContainsQuery(t.title, searchQuery));
          const cellSearchClass = searching ? (hasMatch ? ' has-match' : ' is-dimmed') : '';
          return (
            <button
              key={cell.iso}
              type="button"
              className={`calendar-cell${cell.inMonth ? '' : ' is-out'}${isSameDay(cell.date, NOW) ? ' is-today' : ''}${cellSearchClass}`}
              disabled={!cell.inMonth}
              onClick={() => cell.inMonth && openNewTask({ start: cell.iso, end: cell.iso })}
            >
              {cell.inMonth && <span className="calendar-cell-num">{cell.dayNum}</span>}
              {dayEvents.map((t) => {
                const isMatch = textContainsQuery(t.title, searchQuery);
                const eventSearchClass = searching ? (isMatch ? ' is-match' : ' is-dimmed') : '';
                return (
                  <span
                    key={t.id}
                    className={`calendar-event${eventSearchClass}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTaskId(t.id);
                    }}
                  >
                    <Highlight text={t.title} query={searchQuery} />
                  </span>
                );
              })}
            </button>
          );
        })}
      </div>

      {openTaskId && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpenTaskId(null)} />
          <TaskDetailPanel variant="drawer" taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
        </>
      )}
    </div>
  );
}
