/**
 * Exports the Table view's currently visible rows (respecting active search, person filter, and
 * filters — everything except collapsed-group/collapsed-task display state, which doesn't hide
 * data) to an .xlsx file, one column per configured table column in its current order and label.
 *
 * Write-only use of the `xlsx` package: only `utils.aoa_to_sheet` / `writeFile` are ever called
 * here, never `read`/`readFile`. That matters because the npm-published `xlsx` build has known
 * ReDoS/prototype-pollution advisories in its *parsing* path — since this app never parses a
 * spreadsheet (no "import" feature), that path is never reached. Keep it that way: if an import
 * feature is ever added, address those advisories first (e.g. move to SheetJS's own CDN build).
 */
import {
  countActiveFilters,
  filterByAssignees,
  filterByFilters,
  filterTasks,
  groupsWithEveryAssignee,
  groupTasks,
  subtasksByParent,
  topLevelTasks,
} from '../selectors';
import { useForecastStore } from '../store';
import type { Task } from '../types';
import { columnMeta } from './columns';
import { peopleFor } from './people';

const NO_KNOWN_GROUPS: string[] = [];

function cellValue(key: string, task: Task, customColumns: { id: string }[]): string | number {
  switch (key) {
    case 'timeline':
      return `${task.start} – ${task.end}`;
    case 'dueDate':
      return task.dueDate;
    case 'priority':
      return task.priority;
    case 'label':
      return task.status;
    case 'category':
      return task.category;
    case 'stage':
      return task.stage;
    case 'assigned': {
      const names = peopleFor(task.assigneeIds).map((p) => p.name);
      return names.length ? names.join(', ') : 'Unassigned';
    }
    case 'notes':
      return task.notesCount;
    default:
      return customColumns.some((c) => c.id === key) ? (task.customFields?.[key] ?? '') : '';
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\- ]+/g, '').trim() || 'table';
}

/** Builds the workbook and triggers a browser download — no server round-trip needed.
 * `xlsx` is dynamically imported so its ~280kB doesn't load until someone actually exports. */
export async function exportTableToXlsx() {
  const XLSX = await import('xlsx');
  const s = useForecastStore.getState();
  const workspace = s.workspaces.find((w) => w.id === s.activeWorkspaceId);

  const knownGroups = s.grouping === 'Campaign' ? s.campaignGroups : s.grouping === 'Client' ? s.clientGroups : NO_KNOWN_GROUPS;
  const searched = filterTasks(s.tasks, s.searchQuery);
  const byAssignee = filterByAssignees(searched, s.personFilter);
  const visible = filterByFilters(byAssignee, s.filters);
  const topLevel = topLevelTasks(visible);
  const subtaskMap = subtasksByParent(visible);
  const allGroups = groupTasks(topLevel, s.grouping, knownGroups);

  const hasActiveFilter = !!s.searchQuery.trim() || s.personFilter.length > 0 || countActiveFilters(s.filters) > 0;
  const groups =
    s.personFilterMode === 'all' && s.personFilter.length >= 2
      ? groupsWithEveryAssignee(allGroups, s.personFilter)
      : hasActiveFilter
        ? allGroups.filter((g) => g.tasks.length > 0)
        : allGroups;

  const header = [s.grouping, 'Task', ...s.columnOrder.map((k) => columnMeta(k, s.customColumns, s.columnLabelOverrides).label)];
  const rows: (string | number)[][] = [header];

  const walk = (t: Task, depth: number, groupName: string) => {
    const title = depth > 0 ? `${'    '.repeat(depth)}↳ ${t.title}` : t.title;
    rows.push([groupName, title, ...s.columnOrder.map((k) => cellValue(k, t, s.customColumns))]);
    for (const child of subtaskMap.get(t.id) ?? []) walk(child, depth + 1, groupName);
  };
  for (const g of groups) {
    for (const t of g.tasks) walk(t, 0, g.name);
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Table');

  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `${sanitizeFilename(workspace?.name ?? 'table')}-${dateStamp}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
