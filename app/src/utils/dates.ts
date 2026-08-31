export const NOW = new Date();

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatShort(iso: string): string {
  const d = parseISODate(iso);
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function formatRange(startIso: string, endIso: string): string {
  return `${formatShort(startIso)} → ${formatShort(endIso)}`;
}

export function formatRangeDash(startIso: string, endIso: string): string {
  return `${formatShort(startIso)} – ${formatShort(endIso)}`;
}

/** 0-100, how far "now" sits between start and end (clamped). */
export function progressPct(startIso: string, endIso: string): number {
  const start = parseISODate(startIso).getTime();
  const end = parseISODate(endIso).getTime();
  if (end <= start) return NOW.getTime() >= end ? 100 : 0;
  const pct = ((NOW.getTime() - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** Monday=0 .. Sunday=6 */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function isWeekday(d: Date): boolean {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

/** Inclusive count of Mon–Fri days between two dates (0 if end is before start). */
export function countBusinessDays(start: Date, end: Date): number {
  if (end < start) return 0;
  let count = 0;
  for (let cur = new Date(start); cur <= end; cur = addDays(cur, 1)) {
    if (isWeekday(cur)) count++;
  }
  return count;
}

/** The Monday–Friday range of the work-week containing "now". */
export function currentWeekRange(): { start: Date; end: Date } {
  const today = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  const start = addDays(today, -mondayIndex(today));
  return { start, end: addDays(start, 4) };
}

export function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export interface CalendarCell {
  date: Date;
  iso: string;
  dayNum: number;
  inMonth: boolean;
}

/** Monday-start weeks covering the given month, sized to the month (5 or 6 rows). */
export function buildMonthGrid(viewDate: Date): CalendarCell[] {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const gridStart = addDays(firstOfMonth, -mondayIndex(firstOfMonth));
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const rows = Math.ceil((mondayIndex(firstOfMonth) + daysInMonth) / 7);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < rows * 7; i++) {
    const date = addDays(gridStart, i);
    cells.push({
      date,
      iso: toISODate(date),
      dayNum: date.getDate(),
      inMonth: date.getMonth() === viewDate.getMonth(),
    });
  }
  return cells;
}

/** The Monday that starts each week-row of the month grid — reused as the timeline's week columns. */
export function weekStarts(viewDate: Date): Date[] {
  const cells = buildMonthGrid(viewDate);
  const starts: Date[] = [];
  for (let i = 0; i < cells.length; i += 7) starts.push(cells[i].date);
  return starts;
}

export function monthLabel(viewDate: Date): string {
  return `${MONTH_LONG[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
}

/** e.g. "Monday, 24 August" */
export function formatFullDate(d: Date): string {
  return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} ${MONTH_LONG[d.getMonth()]}`;
}

/** A time-of-day-aware greeting ("Good morning" / "Good afternoon" / "Good evening"). */
export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatRelative(iso: string): string {
  const then = new Date(iso);
  const diffMs = NOW.getTime() - then.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.round(diffMin / 60);
  if (isSameDay(then, NOW) && diffH < 24) return `${diffH}h`;
  const yesterday = addDays(NOW, -1);
  if (isSameDay(then, yesterday)) return 'Yesterday';
  return formatShort(toISODate(then));
}

/** Due label + bucket for the "My work" list, relative to NOW. */
export function dueInfo(endIso: string): { label: string; bucket: 'Today' | 'This week' | 'Later'; overdue: boolean } {
  const end = parseISODate(endIso);
  const today = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  const diffDays = Math.round((end.getTime() - today.getTime()) / 86400000);
  const overdue = diffDays < 0;
  if (diffDays === 0) return { label: 'Today', bucket: 'Today', overdue };
  if (diffDays === 1) return { label: 'Tomorrow', bucket: 'This week', overdue };
  if (diffDays > 1 && diffDays <= 6 - mondayIndex(today)) {
    return { label: WEEKDAY_SHORT[end.getDay()], bucket: 'This week', overdue };
  }
  if (overdue) return { label: `${formatShort(endIso)} (late)`, bucket: 'Today', overdue };
  return { label: formatShort(endIso), bucket: 'Later', overdue };
}
