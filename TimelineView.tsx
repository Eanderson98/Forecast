import { useMemo } from 'react';
import { timelineRows } from '../../selectors';
import { useForecastStore } from '../../store';
import { getISOWeek, weekStarts } from '../../utils/dates';

/** Cycled by a stage's position in the (user-editable) stage list, rather than by name, so renaming/adding/deleting stages never leaves one unstyled. */
const STAGE_BAR_PALETTE: React.CSSProperties[] = [
  { background: 'var(--color-accent-700)' },
  { background: 'var(--color-accent-500)' },
  { background: 'var(--color-neutral-700)' },
  { background: 'var(--color-accent-2-600)' },
  { background: 'transparent', border: '1px solid var(--color-accent)' },
];

function stageBarStyle(stage: string, stages: string[]): React.CSSProperties {
  const i = stages.indexOf(stage);
  return STAGE_BAR_PALETTE[(i < 0 ? 0 : i) % STAGE_BAR_PALETTE.length];
}

export function TimelineView() {
  const tasks = useForecastStore((s) => s.tasks);
  const calendarMonth = useForecastStore((s) => s.calendarMonth);
  const timelineGroupId = useForecastStore((s) => s.timelineGroupId);
  const stageGroups = useForecastStore((s) => s.stageGroups);

  const scopedTasks = useMemo(
    () => (timelineGroupId ? tasks.filter((t) => t.campaign === timelineGroupId) : tasks),
    [tasks, timelineGroupId],
  );
  const weeks = useMemo(() => weekStarts(calendarMonth), [calendarMonth]);
  const rows = useMemo(() => timelineRows(scopedTasks, calendarMonth, stageGroups), [scopedTasks, calendarMonth, stageGroups]);
  const weekCols = `190px repeat(${weeks.length}, minmax(0,1fr))`;

  return (
    <div className="calendar-scroll">
      <div className="timeline-scope">
        <i className="ph ph-funnel-simple cd-i" />
        Showing: <strong>{timelineGroupId ?? 'Whole board'}</strong>
        <span className="timeline-scope-count">{scopedTasks.length} task{scopedTasks.length === 1 ? '' : 's'}</span>
      </div>

      <div className="timeline-head">
        <span className="timeline-head-label">Timeline</span>
        <span className="timeline-head-note">{weeks.length} weeks · by pipeline stage</span>
      </div>
      <div className="timeline-body">
        <div className="timeline-weeks" style={{ gridTemplateColumns: weekCols }}>
          <span></span>
          {weeks.map((w) => <span key={w.toISOString()}>W{getISOWeek(w)}</span>)}
        </div>
        {rows.length === 0 && (
          <div className="timeline-empty">
            {timelineGroupId ? `No tasks in “${timelineGroupId}” fall within this six-week window.` : 'No tasks fall within this six-week window.'}
          </div>
        )}
        {rows.map((r) => (
          <div className="timeline-row" key={r.stage} style={{ gridTemplateColumns: weekCols }}>
            <span className="timeline-row-label">{r.stage}</span>
            <span
              className="timeline-bar"
              style={{ gridColumn: `${r.startCol + 1} / span ${r.span}`, ...stageBarStyle(r.stage, stageGroups) }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
