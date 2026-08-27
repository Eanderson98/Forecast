import { CURRENT_USER_ID } from './data';
import type { AvatarTone, Grouping, Person, Task, TaskFilters, UpdateMessage, WorkBucket } from './types';
import { countBusinessDays, currentWeekRange, dueInfo, formatRange, parseISODate, toISODate, weekStarts } from './utils/dates';

const STATUS_ORDER = ['Not started', 'Working', 'In review', 'Blocked', 'Approved', 'Done'];

function orderedKeys(seen: string[], preferred: string[]): string[] {
  const rest = seen.filter((k) => !preferred.includes(k)).sort();
  return [...preferred.filter((k) => seen.includes(k)), ...rest];
}

export function matchesSearch(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return task.title.toLowerCase().includes(q);
}

export function filterTasks(tasks: Task[], query: string): Task[] {
  if (!query.trim()) return tasks;
  return tasks.filter((t) => matchesSearch(t, query));
}

/** Tasks assigned to any of `personIds` (returns all tasks when the list is empty). */
export function filterByAssignees(tasks: Task[], personIds: string[]): Task[] {
  if (personIds.length === 0) return tasks;
  return tasks.filter((t) => t.assigneeIds.some((id) => personIds.includes(id)));
}

export function countActiveFilters(filters: TaskFilters): number {
  return filters.priority.length + filters.status.length + filters.category.length + filters.client.length;
}

/** AND across dimensions, OR within a dimension; an empty dimension list matches everything. */
export function filterByFilters(tasks: Task[], filters: TaskFilters): Task[] {
  if (countActiveFilters(filters) === 0) return tasks;
  return tasks.filter((t) => {
    if (filters.priority.length && !filters.priority.includes(t.priority)) return false;
    if (filters.status.length && !filters.status.includes(t.status)) return false;
    if (filters.category.length && !filters.category.includes(t.category)) return false;
    if (filters.client.length && !filters.client.includes(t.client)) return false;
    return true;
  });
}

/** Tasks with no parent — what the Table groups and groups by; subtasks nest under these instead. */
export function topLevelTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.parentId);
}

/** Maps each parent task id to its (visible) subtasks, in creation order. */
export function subtasksByParent(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.parentId) continue;
    const list = map.get(t.parentId) ?? [];
    list.push(t);
    map.set(t.parentId, list);
  }
  return map;
}

/** Total count of a task's subtasks at every nesting depth (not just direct children). */
export function countDescendants(tasks: Task[], id: string, byParent = subtasksByParent(tasks)): number {
  const direct = byParent.get(id) ?? [];
  return direct.length + direct.reduce((sum, c) => sum + countDescendants(tasks, c.id, byParent), 0);
}

export interface TaskGroup {
  key: string;
  name: string;
  count: number;
  range: string;
  tasks: Task[];
}

/** Keeps only groups where every one of `personIds` has at least one task in that group. */
export function groupsWithEveryAssignee(groups: TaskGroup[], personIds: string[]): TaskGroup[] {
  if (personIds.length < 2) return groups;
  return groups.filter((g) => personIds.every((pid) => g.tasks.some((t) => t.assigneeIds.includes(pid))));
}

/**
 * `knownGroups` seeds groups that should render even with zero tasks (e.g. a
 * freshly created, still-empty campaign or client group) and fixes their
 * display order; ignored for Status, which has its own fixed lifecycle order.
 */
export function groupTasks(tasks: Task[], grouping: Grouping, knownGroups: string[] = []): TaskGroup[] {
  const field = grouping === 'Campaign' ? 'campaign' : grouping === 'Client' ? 'client' : 'status';
  const preferred = grouping === 'Status' ? STATUS_ORDER : knownGroups;
  const seenFromTasks = tasks.map((t) => t[field as 'campaign' | 'client' | 'status']);
  const seen = Array.from(new Set([...knownGroups, ...seenFromTasks]));
  return orderedKeys(seen, preferred).map((key) => {
    const rows = tasks.filter((t) => t[field as 'campaign' | 'client' | 'status'] === key);
    const starts = rows.map((r) => parseISODate(r.start).getTime());
    const ends = rows.map((r) => parseISODate(r.end).getTime());
    const range = rows.length
      ? formatRange(toISODate(new Date(Math.min(...starts))), toISODate(new Date(Math.max(...ends))))
      : '';
    return { key, name: key, count: rows.length, range, tasks: rows };
  });
}

export interface KanbanColumn {
  stage: string;
  tasks: Task[];
}

export function kanbanColumns(tasks: Task[], stages: string[]): KanbanColumn[] {
  return stages.map((stage) => ({ stage, tasks: tasks.filter((t) => t.stage === stage) }));
}

export function calendarEventsByDay(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    const list = map.get(t.start) ?? [];
    list.push(t);
    map.set(t.start, list);
  }
  return map;
}

export interface TimelineRow {
  stage: string;
  startCol: number; // 1-based week column index within the visible window
  span: number;
}

export function timelineRows(tasks: Task[], viewMonth: Date, stages: string[]): TimelineRow[] {
  const weeks = weekStarts(viewMonth);
  const weekRanges = weeks.map((ws) => ({ start: ws.getTime(), end: ws.getTime() + 6 * 86400000 }));
  const rows: TimelineRow[] = [];
  for (const col of kanbanColumns(tasks, stages)) {
    if (!col.tasks.length) continue;
    const start = Math.min(...col.tasks.map((t) => parseISODate(t.start).getTime()));
    const end = Math.max(...col.tasks.map((t) => parseISODate(t.end).getTime()));
    let first = weekRanges.findIndex((w) => end >= w.start && start <= w.end);
    if (first === -1) continue;
    let last = first;
    for (let i = 0; i < weekRanges.length; i++) {
      if (end >= weekRanges[i].start && start <= weekRanges[i].end) last = i;
    }
    rows.push({ stage: col.stage, startCol: first + 1, span: Math.max(1, last - first + 1) });
  }
  return rows;
}

export interface WorkloadEntry {
  id: string;
  name: string;
  initials: string;
  tone: AvatarTone;
  hours: number;
  pct: number;
}

/**
 * Spreads each task's estimated hours evenly across its own business days, then
 * counts only the portion of that average landing inside the current work-week.
 * Est. hours is the sole input — tasks without an estimate contribute nothing.
 */
export function workload(tasks: Task[], people: Person[]): WorkloadEntry[] {
  const { start: weekStart, end: weekEnd } = currentWeekRange();
  return people.map((p) => {
    const hours = tasks.reduce((sum, t) => {
      if (t.done || !t.estimatedHours || !t.assigneeIds.includes(p.id)) return sum;
      const taskStart = parseISODate(t.start);
      const taskEnd = parseISODate(t.end);
      const totalBusinessDays = Math.max(1, countBusinessDays(taskStart, taskEnd));
      const overlapStart = taskStart > weekStart ? taskStart : weekStart;
      const overlapEnd = taskEnd < weekEnd ? taskEnd : weekEnd;
      const overlapDays = countBusinessDays(overlapStart, overlapEnd);
      return sum + (t.estimatedHours / totalBusinessDays) * overlapDays;
    }, 0);
    const rounded = Math.round(hours);
    return { id: p.id, name: p.name, initials: p.initials, tone: p.tone, hours: rounded, pct: Math.round((rounded / 40) * 100) };
  });
}

export interface Metric {
  k: string;
  v: number;
  sub: string;
}

export function metrics(tasks: Task[]): Metric[] {
  const mine = tasks.filter((t) => t.assigneeIds.includes(CURRENT_USER_ID) && !t.done);
  const dueThisWeek = mine.filter((t) => dueInfo(t.dueDate).bucket !== 'Later').length;
  const awaiting = tasks.filter((t) => t.status === 'In review');
  const overdue = awaiting.filter((t) => dueInfo(t.dueDate).overdue).length;
  const blocked = tasks.filter((t) => t.status === 'Blocked');
  const done = tasks.filter((t) => t.done);
  return [
    { k: 'Assigned to me', v: mine.length, sub: `${dueThisWeek} due this week` },
    { k: 'Awaiting client', v: awaiting.length, sub: overdue ? `${overdue} overdue` : 'none overdue' },
    { k: 'Blocked', v: blocked.length, sub: blocked.map((t) => t.title.split(' ')[0].toLowerCase()).join(', ') || 'none' },
    { k: 'Completed this board', v: done.length, sub: `of ${tasks.length} tasks` },
  ];
}

export function myWork(tasks: Task[], bucket: WorkBucket): (Task & { due: ReturnType<typeof dueInfo> })[] {
  return tasks
    .filter((t) => t.assigneeIds.includes(CURRENT_USER_ID) && !t.done)
    .map((t) => ({ ...t, due: dueInfo(t.dueDate) }))
    .filter((t) => t.due.bucket === bucket)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export interface InboxEntry extends UpdateMessage {
  where: string;
}

export function inbox(updates: UpdateMessage[], tasks: Task[], limit = 8): InboxEntry[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return [...updates]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((u) => ({ ...u, where: byId.get(u.taskId)?.title ?? 'Untitled task' }));
}
