import { useMemo, useState } from 'react';
import { inbox, metrics, myWork, workload } from '../../selectors';
import { useForecastStore } from '../../store';
import type { WorkBucket } from '../../types';
import { cx } from '../../utils/cx';
import { formatRelative } from '../../utils/dates';
import { statusClass } from '../../utils/style';
import { Avatar } from '../shared/Avatar';
import { TaskDetailPanel } from '../shared/TaskDetailPanel';

const BUCKETS: WorkBucket[] = ['Today', 'This week', 'Later'];

export function MyWorkView() {
  const tasks = useForecastStore((s) => s.tasks);
  const updates = useForecastStore((s) => s.updates);
  const people = useForecastStore((s) => s.people);
  const workBucket = useForecastStore((s) => s.workBucket);
  const setWorkBucket = useForecastStore((s) => s.setWorkBucket);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const metricCards = useMemo(() => metrics(tasks), [tasks]);
  const myTasks = useMemo(() => myWork(tasks, workBucket), [tasks, workBucket]);
  const load = useMemo(() => workload(tasks, people), [tasks, people]);
  const feed = useMemo(() => inbox(updates, tasks), [updates, tasks]);

  return (
    <div className="mywork-body">
      <div className="mywork-main">
        <div className="mywork-metrics">
          {metricCards.map((m) => (
            <div className="card elev-sm" key={m.k} style={{ gap: 4, padding: 14 }}>
              <span className="card-kicker">{m.k}</span>
              <span className="mywork-metric-value">{m.v}</span>
              <span className="mywork-metric-sub">{m.sub}</span>
            </div>
          ))}
        </div>

        <div className="mywork-section">
          <div className="mywork-section-head">
            <span className="mywork-section-title">My work</span>
            <div className="seg" style={{ marginLeft: 'auto' }}>
              {BUCKETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  className={cx('seg-opt', workBucket === b && 'is-active')}
                  onClick={() => setWorkBucket(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div className="mywork-list">
            {myTasks.length === 0 && <div className="mywork-empty">Nothing assigned to you in this window.</div>}
            {myTasks.map((t) => (
              <button key={t.id} type="button" className="mywork-row" onClick={() => setOpenTaskId(t.id)}>
                <div className="mywork-row-task">
                  <span style={{ width: 14, height: 14, borderRadius: 4, border: '1px solid var(--color-divider)', flex: 'none' }} />
                  <span className="mywork-row-title">{t.title}</span>
                </div>
                <span className="mywork-row-board">{t.board}</span>
                <span><span className={cx('tag', statusClass(t.status))}>{t.status}</span></span>
                <span className={cx('mywork-row-due', t.due.overdue && 'is-overdue')}>{t.due.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mywork-section">
          <span className="mywork-section-title">Workload this week</span>
          <div className="workload-list">
            {load.map((w) => (
              <div className="workload-row" key={w.id}>
                <div className="workload-who">
                  <Avatar initials={w.initials} tone={w.tone} size={24} />
                  <span className="workload-name">{w.name}</span>
                </div>
                <div className="workload-track">
                  <span className={cx('workload-fill', w.pct > 100 && 'is-over')} style={{ width: `${Math.min(100, w.pct)}%` }} />
                </div>
                <span className="workload-hours">{w.hours} / 40h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="updates-aside">
        <div className="updates-head">
          <span className="mywork-section-title">Updates</span>
          <span className="tag tag-accent">{feed.length} recent</span>
          <i className="ph ph-sliders-horizontal cd-i" style={{ marginLeft: 'auto', color: 'color-mix(in srgb, var(--color-text) 45%, transparent)' }} />
        </div>
        <div className="updates-list">
          {feed.map((u) => (
            <button key={u.id} type="button" className="updates-item" onClick={() => setOpenTaskId(u.taskId)}>
              <Avatar initials={u.authorInitials} tone="accent" size={28} />
              <div className="updates-item-body">
                <div className="updates-item-meta">{u.authorName} · {formatRelative(u.createdAt)}</div>
                <div className="updates-item-text">{u.body}</div>
                <div className="updates-item-where">{u.where}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {openTaskId && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpenTaskId(null)} />
          <TaskDetailPanel variant="drawer" taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
        </>
      )}
    </div>
  );
}
