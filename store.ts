import { create } from 'zustand';
import { CLIENTS, CURRENT_USER_ID, DEFAULT_WORKSPACE_ID, PEOPLE, WORKSPACES, WORKSPACE_SEEDS } from './data';
import type { AvatarTone, BoardTab, Client, CustomColumnDef, CustomColumnType, FilterDimension, Grouping, NavKey, Person, PersonFilterMode, Priority, Status, TableColumnKey, Task, TaskFilters, UpdateMessage, View, WorkBucket, Workspace } from './types';
import { NOW, toISODate } from './utils/dates';

interface FileTile {
  id: string;
  icon: string;
}

/** The per-workspace slice of state that gets swapped out wholesale when switching workspaces. */
interface WorkspaceSnapshot {
  tasks: Task[];
  updates: UpdateMessage[];
  filesByTask: Record<string, FileTile[]>;
  campaignGroups: string[];
  clientGroups: string[];
  timelineGroupId: string | null;
  /** undefined = no default has ever been saved for this workspace. */
  savedDefaultTimelineGroup: string | null | undefined;
}

/** The snapshot a freshly created workspace starts from — no tasks, no groups yet. */
function blankWorkspaceSnapshot(): WorkspaceSnapshot {
  return {
    tasks: [],
    updates: [],
    filesByTask: {},
    campaignGroups: [],
    clientGroups: [],
    timelineGroupId: null,
    savedDefaultTimelineGroup: undefined,
  };
}

interface NewTaskDraft {
  title: string;
  campaign: string;
  client: string;
  start: string;
  end: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  category: string;
  stage: string;
  assigneeIds: string[];
}

type GroupableGrouping = 'Campaign' | 'Client';

interface ForecastState {
  clients: Client[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  workspaceSnapshots: Record<string, WorkspaceSnapshot>;
  /** The last workspace visited under each client, so switching clients returns you where you left off. */
  lastWorkspaceByClient: Record<string, string>;

  tasks: Task[];
  updates: UpdateMessage[];
  filesByTask: Record<string, FileTile[]>;
  campaignGroups: string[];
  clientGroups: string[];
  people: Person[];
  categoryGroups: string[];
  stageGroups: string[];

  grouping: Grouping;
  view: View;
  boardTab: BoardTab;
  activeNav: NavKey;
  selectedTaskId: string | null;
  calendarMonth: Date;
  workBucket: WorkBucket;
  newTaskOpen: boolean;
  newTaskDraft: NewTaskDraft | null;
  newGroupOpen: boolean;
  newGroupDraft: string;
  composerDraft: string;
  searchQuery: string;
  personFilter: string[];
  personFilterMode: PersonFilterMode;
  filters: TaskFilters;
  timelineGroupId: string | null;
  /** undefined = no default has ever been saved. */
  savedDefaultTimelineGroup: string | null | undefined;
  columnWidths: Record<string, number>;
  columnOrder: string[];
  customColumns: CustomColumnDef[];
  /** Display-name overrides for the built-in columns (Timeline, Due date, etc). Custom columns keep their own name on CustomColumnDef instead. */
  columnLabelOverrides: Record<string, string>;

  setWorkspace: (id: string) => void;
  renameWorkspace: (id: string, name: string) => void;
  addWorkspace: (name: string) => void;
  setActiveClient: (clientId: string) => void;
  /** Creates a new Client with a first empty workspace and switches into it. */
  addClient: (name: string) => string;
  renameClient: (id: string, name: string) => void;
  addPerson: (name: string, email?: string) => string;
  invitePerson: (email: string) => string;
  renamePerson: (id: string, name: string) => void;
  setPersonEmail: (id: string, email: string) => void;
  /** Removes the person and unassigns them from any tasks that had them assigned. No-ops for the current user. */
  deletePerson: (id: string) => void;
  setGrouping: (g: Grouping) => void;
  setView: (v: View) => void;
  setBoardTab: (t: BoardTab) => void;
  setNav: (key: NavKey) => void;
  setWorkBucket: (b: WorkBucket) => void;
  setSearchQuery: (q: string) => void;
  togglePersonFilter: (personId: string) => void;
  setPersonFilterMode: (mode: PersonFilterMode) => void;
  clearPersonFilter: () => void;
  toggleFilterValue: (dimension: FilterDimension, value: string) => void;
  clearFilters: () => void;
  addGroup: (grouping: GroupableGrouping, name: string) => void;
  renameGroup: (grouping: GroupableGrouping, oldName: string, newName: string) => void;
  addCategory: (name: string) => void;
  renameCategory: (oldName: string, newName: string) => void;
  deleteCategory: (name: string) => void;
  addStage: (name: string) => void;
  renameStage: (oldName: string, newName: string) => void;
  deleteStage: (name: string) => void;
  openNewGroup: () => void;
  closeNewGroup: () => void;
  setNewGroupDraft: (v: string) => void;
  submitNewGroup: () => void;
  setTimelineGroup: (id: string | null) => void;
  saveTimelineGroupAsDefault: () => void;
  selectTask: (id: string | null) => void;
  toggleDone: (id: string) => void;
  setTitle: (id: string, title: string) => void;
  setPriority: (id: string, p: Priority) => void;
  setStatus: (id: string, s: Status) => void;
  toggleAssignee: (id: string, personId: string) => void;
  setCampaign: (id: string, campaign: string) => void;
  setClient: (id: string, client: string) => void;
  setCategory: (id: string, category: string) => void;
  /** Reorders a task within its siblings by moving it to sit immediately before `beforeId` (same list of siblings this task is already part of). */
  moveTask: (id: string, beforeId: string) => void;
  setDueDate: (id: string, dueDate: string) => void;
  setDescription: (id: string, description: string) => void;
  setEstimatedHours: (id: string, hours: number | undefined) => void;
  setTaskDates: (id: string, start: string, end: string) => void;
  moveTaskStage: (id: string, stage: string) => void;
  addFileToTask: (id: string) => void;
  setComposerDraft: (v: string) => void;
  postUpdate: (taskId: string, body: string) => void;
  openNewTask: (prefill?: Partial<NewTaskDraft>) => void;
  closeNewTask: () => void;
  updateNewTaskDraft: (patch: Partial<NewTaskDraft>) => void;
  submitNewTask: () => void;
  addSubtask: (parentId: string) => string;
  /** Deletes a task along with all of its subtasks at every nesting depth. */
  deleteTask: (id: string) => void;
  calendarPrev: () => void;
  calendarNext: () => void;
  calendarToday: () => void;
  /** Sets one or more column widths atomically (e.g. a Monday-style resize that grows one column and shrinks its neighbor together). */
  setColumnWidths: (patch: Record<string, number>) => void;
  setColumnOrder: (order: string[]) => void;
  addCustomColumn: (name: string, type: CustomColumnType) => string;
  renameCustomColumn: (id: string, name: string) => void;
  deleteCustomColumn: (id: string) => void;
  setCustomFieldValue: (taskId: string, columnId: string, value: string) => void;
  addCustomColumnOption: (columnId: string, option: string) => void;
  /** Renames any column's header — a built-in (Timeline, Priority, ...) or a custom one, whichever `key` is. */
  renameColumn: (key: string, name: string) => void;
}

// A saved default of "the whole board" is stored as this sentinel, since
// localStorage can't distinguish an empty string from "not set".
const WHOLE_BOARD_SENTINEL = '__ALL__';

function defaultTimelineGroupKey(workspaceId: string) {
  return `forecast.defaultTimelineGroup.${workspaceId}`;
}

/** undefined = nothing ever saved; null = "whole board" was explicitly saved as default. */
function readDefaultTimelineGroup(workspaceId: string): string | null | undefined {
  try {
    const raw = window.localStorage.getItem(defaultTimelineGroupKey(workspaceId));
    if (raw === null) return undefined;
    return raw === WHOLE_BOARD_SENTINEL ? null : raw;
  } catch {
    return undefined;
  }
}

function writeDefaultTimelineGroup(workspaceId: string, id: string | null) {
  try {
    window.localStorage.setItem(defaultTimelineGroupKey(workspaceId), id ?? WHOLE_BOARD_SENTINEL);
  } catch {
    // localStorage unavailable (private mode, etc.) — the choice just won't survive a refresh.
  }
}

const FILE_ICONS: Record<string, string> = {};

const INITIAL_FILES: Record<string, FileTile[]> = {};

function blankDraft(campaignGroups: string[], clientGroups: string[], categoryGroups: string[], stageGroups: string[]): NewTaskDraft {
  const start = toISODate(NOW);
  return {
    title: '',
    campaign: campaignGroups[0] ?? '',
    client: clientGroups[0] ?? '',
    start,
    end: start,
    dueDate: start,
    priority: 'Medium',
    status: 'Not started',
    category: categoryGroups[0] ?? '',
    stage: stageGroups[0] ?? '',
    assigneeIds: [CURRENT_USER_ID],
  };
}

const DEFAULT_COLUMN_WIDTHS: Record<TableColumnKey, number> = {
  timeline: 172,
  dueDate: 96,
  priority: 104,
  label: 128,
  category: 116,
  stage: 128,
  assigned: 132,
  notes: 76,
};
const DEFAULT_CUSTOM_COLUMN_WIDTH = 140;
const COLUMN_WIDTHS_KEY = 'forecast.columnWidths.v2';
export const MIN_COLUMN_WIDTH = 56;
export const MAX_COLUMN_WIDTH = 360;

function readColumnWidths(customColumns: CustomColumnDef[]): Record<string, number> {
  const base: Record<string, number> = { ...DEFAULT_COLUMN_WIDTHS };
  for (const c of customColumns) base[c.id] = DEFAULT_CUSTOM_COLUMN_WIDTH;
  try {
    const raw = window.localStorage.getItem(COLUMN_WIDTHS_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Record<string, number>;
    return { ...base, ...parsed };
  } catch {
    return base;
  }
}

function writeColumnWidths(widths: Record<string, number>) {
  try {
    window.localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(widths));
  } catch {
    // localStorage unavailable (private mode, etc.) — widths just won't survive a refresh.
  }
}

const DEFAULT_COLUMN_ORDER: TableColumnKey[] = ['timeline', 'dueDate', 'priority', 'label', 'category', 'stage', 'assigned', 'notes'];
const COLUMN_ORDER_KEY = 'forecast.columnOrder.v2';

/** Valid keys = the fixed built-ins plus whatever custom columns currently exist; a stored
 * order is filtered down to those (dropping ids for since-deleted columns) and any valid key
 * missing from it (a freshly added column, or the built-ins on first run) is appended. */
function readColumnOrder(customColumns: CustomColumnDef[]): string[] {
  const validKeys = [...DEFAULT_COLUMN_ORDER, ...customColumns.map((c) => c.id)];
  try {
    const raw = window.localStorage.getItem(COLUMN_ORDER_KEY);
    if (!raw) return validKeys;
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return validKeys;
    const filtered = parsed.filter((k) => validKeys.includes(k));
    const missing = validKeys.filter((k) => !filtered.includes(k));
    return [...filtered, ...missing];
  } catch {
    return validKeys;
  }
}

const CUSTOM_COLUMNS_KEY = 'forecast.customColumns.v2';

function readCustomColumns(): CustomColumnDef[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_COLUMNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustomColumns(columns: CustomColumnDef[]) {
  try {
    window.localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(columns));
  } catch {
    // localStorage unavailable (private mode, etc.) — columns just won't survive a refresh.
  }
}

let nextCustomColumnNum = 1;

const COLUMN_LABELS_KEY = 'forecast.columnLabelOverrides.v2';

function readColumnLabelOverrides(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(COLUMN_LABELS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeColumnLabelOverrides(overrides: Record<string, string>) {
  try {
    window.localStorage.setItem(COLUMN_LABELS_KEY, JSON.stringify(overrides));
  } catch {
    // localStorage unavailable (private mode, etc.) — overrides just won't survive a refresh.
  }
}

function writeColumnOrder(order: string[]) {
  try {
    window.localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(order));
  } catch {
    // localStorage unavailable (private mode, etc.) — order just won't survive a refresh.
  }
}

// Category and Stage are shared taxonomies (every workspace draws from the same lists,
// unlike per-workspace Campaign/Client groups), so they're stored globally and persisted
// the same way column order/widths are.
const DEFAULT_CATEGORIES = ['General'];
const DEFAULT_STAGES = ['To do', 'In progress', 'In review', 'Done'];
const CATEGORY_GROUPS_KEY = 'forecast.categoryGroups.v2';
const STAGE_GROUPS_KEY = 'forecast.stageGroups.v2';

function readStringList(key: string, fallback: string[]): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [...fallback];
    const parsed = JSON.parse(raw);
    const isValid = Array.isArray(parsed) && parsed.length > 0 && parsed.every((v) => typeof v === 'string');
    return isValid ? parsed : [...fallback];
  } catch {
    return [...fallback];
  }
}

function writeStringList(key: string, list: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // localStorage unavailable (private mode, etc.) — list just won't survive a refresh.
  }
}

let nextTaskNum = 100;
let nextUpdateNum = 100;
let nextFileNum = 1;
let nextWorkspaceNum = 1;
let nextPersonNum = 1;
let nextClientNum = 1;

const PERSON_TONES: AvatarTone[] = ['accent', 'accent-2', 'neutral'];

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** "jane.doe@acme.com" -> "Jane Doe" — a friendly display name until the invitee sets their own. */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email;
  const words = local.split(/[.\-_]+/).filter(Boolean);
  if (words.length === 0) return email;
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

/** Builds every workspace's starting snapshot from its seed data. */
function buildInitialSnapshots(): Record<string, WorkspaceSnapshot> {
  const snapshots: Record<string, WorkspaceSnapshot> = {};
  for (const ws of WORKSPACES) {
    const seed = WORKSPACE_SEEDS[ws.id];
    const savedDefault = readDefaultTimelineGroup(ws.id);
    snapshots[ws.id] = {
      tasks: seed.tasks,
      updates: seed.updates,
      filesByTask: ws.id === DEFAULT_WORKSPACE_ID ? INITIAL_FILES : {},
      campaignGroups: seed.campaignGroups,
      clientGroups: seed.clientGroups,
      timelineGroupId: savedDefault ?? null,
      savedDefaultTimelineGroup: savedDefault,
    };
  }
  return snapshots;
}

const initialSnapshots = buildInitialSnapshots();
const initialActive = initialSnapshots[DEFAULT_WORKSPACE_ID];
const initialCustomColumns = readCustomColumns();

export const useForecastStore = create<ForecastState>((set, get) => ({
  clients: CLIENTS.map((c) => ({ ...c })),
  workspaces: WORKSPACES.map((w) => ({ ...w })),
  activeWorkspaceId: DEFAULT_WORKSPACE_ID,
  workspaceSnapshots: initialSnapshots,
  lastWorkspaceByClient: { [WORKSPACES.find((w) => w.id === DEFAULT_WORKSPACE_ID)!.clientId]: DEFAULT_WORKSPACE_ID },

  tasks: initialActive.tasks,
  updates: initialActive.updates,
  filesByTask: initialActive.filesByTask,
  campaignGroups: initialActive.campaignGroups,
  clientGroups: initialActive.clientGroups,
  people: PEOPLE.map((p) => ({ ...p })),
  categoryGroups: readStringList(CATEGORY_GROUPS_KEY, DEFAULT_CATEGORIES),
  stageGroups: readStringList(STAGE_GROUPS_KEY, DEFAULT_STAGES),

  grouping: 'Campaign',
  view: 'boards',
  boardTab: 'Table',
  activeNav: 'boards',
  selectedTaskId: null,
  calendarMonth: new Date(NOW.getFullYear(), NOW.getMonth(), 1),
  workBucket: 'Today',
  newTaskOpen: false,
  newTaskDraft: null,
  newGroupOpen: false,
  newGroupDraft: '',
  composerDraft: '',
  searchQuery: '',
  personFilter: [],
  personFilterMode: 'any',
  filters: { priority: [], status: [], category: [], client: [] },
  timelineGroupId: initialActive.timelineGroupId,
  savedDefaultTimelineGroup: initialActive.savedDefaultTimelineGroup,
  columnWidths: readColumnWidths(initialCustomColumns),
  columnOrder: readColumnOrder(initialCustomColumns),
  customColumns: initialCustomColumns,
  columnLabelOverrides: readColumnLabelOverrides(),

  setColumnWidths: (patch) =>
    set((s) => {
      const columnWidths = { ...s.columnWidths };
      for (const key of Object.keys(patch)) {
        const raw = patch[key];
        if (raw === undefined) continue;
        columnWidths[key] = Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, Math.round(raw)));
      }
      writeColumnWidths(columnWidths);
      return { columnWidths };
    }),
  setColumnOrder: (order) => {
    writeColumnOrder(order);
    set({ columnOrder: order });
  },

  addCustomColumn: (name, type) => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const id = `col${nextCustomColumnNum++}`;
    const def: CustomColumnDef = { id, name: trimmed, type, options: [] };
    set((s) => {
      const customColumns = [...s.customColumns, def];
      const columnOrder = [...s.columnOrder, id];
      const columnWidths = { ...s.columnWidths, [id]: DEFAULT_CUSTOM_COLUMN_WIDTH };
      writeCustomColumns(customColumns);
      writeColumnOrder(columnOrder);
      writeColumnWidths(columnWidths);
      return { customColumns, columnOrder, columnWidths };
    });
    return id;
  },
  renameCustomColumn: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => {
      const customColumns = s.customColumns.map((c) => (c.id === id ? { ...c, name: trimmed } : c));
      writeCustomColumns(customColumns);
      return { customColumns };
    });
  },
  deleteCustomColumn: (id) => {
    set((s) => {
      const customColumns = s.customColumns.filter((c) => c.id !== id);
      const columnOrder = s.columnOrder.filter((k) => k !== id);
      const columnWidths = { ...s.columnWidths };
      delete columnWidths[id];
      writeCustomColumns(customColumns);
      writeColumnOrder(columnOrder);
      writeColumnWidths(columnWidths);
      return {
        customColumns,
        columnOrder,
        columnWidths,
        tasks: s.tasks.map((t) => {
          if (!t.customFields || !(id in t.customFields)) return t;
          const nextFields = { ...t.customFields };
          delete nextFields[id];
          return { ...t, customFields: nextFields };
        }),
      };
    });
  },
  setCustomFieldValue: (taskId, columnId, value) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, customFields: { ...t.customFields, [columnId]: value } } : t)),
    })),
  addCustomColumnOption: (columnId, option) => {
    const trimmed = option.trim();
    if (!trimmed) return;
    set((s) => {
      const customColumns = s.customColumns.map((c) => {
        if (c.id !== columnId) return c;
        if (c.options.some((o) => o.toLowerCase() === trimmed.toLowerCase())) return c;
        return { ...c, options: [...c.options, trimmed] };
      });
      writeCustomColumns(customColumns);
      return { customColumns };
    });
  },

  renameColumn: (key, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { customColumns, renameCustomColumn } = get();
    if (customColumns.some((c) => c.id === key)) {
      renameCustomColumn(key, trimmed);
      return;
    }
    set((s) => {
      const columnLabelOverrides = { ...s.columnLabelOverrides, [key]: trimmed };
      writeColumnLabelOverrides(columnLabelOverrides);
      return { columnLabelOverrides };
    });
  },

  setWorkspace: (id) => {
    const s = get();
    if (id === s.activeWorkspaceId || !s.workspaceSnapshots[id]) return;
    const currentSnapshot: WorkspaceSnapshot = {
      tasks: s.tasks,
      updates: s.updates,
      filesByTask: s.filesByTask,
      campaignGroups: s.campaignGroups,
      clientGroups: s.clientGroups,
      timelineGroupId: s.timelineGroupId,
      savedDefaultTimelineGroup: s.savedDefaultTimelineGroup,
    };
    const next = s.workspaceSnapshots[id];
    const nextClientId = s.workspaces.find((w) => w.id === id)?.clientId;
    set({
      workspaceSnapshots: { ...s.workspaceSnapshots, [s.activeWorkspaceId]: currentSnapshot },
      activeWorkspaceId: id,
      lastWorkspaceByClient: nextClientId ? { ...s.lastWorkspaceByClient, [nextClientId]: id } : s.lastWorkspaceByClient,
      tasks: next.tasks,
      updates: next.updates,
      filesByTask: next.filesByTask,
      campaignGroups: next.campaignGroups,
      clientGroups: next.clientGroups,
      timelineGroupId: next.timelineGroupId,
      savedDefaultTimelineGroup: next.savedDefaultTimelineGroup,
      // Reset transient UI/selection state — it belonged to the previous workspace's content.
      // boardTab (and boardTab-derived activeNav) intentionally carries over so
      // switching workspaces keeps you on the tab you were viewing (e.g. Calendar).
      selectedTaskId: null,
      searchQuery: '',
      personFilter: [],
      personFilterMode: 'any',
      filters: { priority: [], status: [], category: [], client: [] },
      grouping: 'Campaign',
      composerDraft: '',
    });
  },
  renameWorkspace: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => ({ workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, name: trimmed } : w)) }));
  },
  addWorkspace: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const s = get();
    const clientId = s.workspaces.find((w) => w.id === s.activeWorkspaceId)?.clientId;
    if (!clientId) return;
    const id = `workspace-${nextWorkspaceNum++}`;
    const newWorkspace: Workspace = { id, name: trimmed, category: 'General', clientId };
    set({
      workspaces: [...s.workspaces, newWorkspace],
      workspaceSnapshots: { ...s.workspaceSnapshots, [id]: blankWorkspaceSnapshot() },
    });
    get().setWorkspace(id);
  },
  setActiveClient: (clientId) => {
    const { workspaces, activeWorkspaceId, lastWorkspaceByClient, setWorkspace } = get();
    const activeBelongsToClient = workspaces.find((w) => w.id === activeWorkspaceId)?.clientId === clientId;
    if (activeBelongsToClient) return;
    const targetId = lastWorkspaceByClient[clientId] ?? workspaces.find((w) => w.clientId === clientId)?.id;
    if (targetId) setWorkspace(targetId);
  },
  addClient: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const clientId = `client-${nextClientNum++}`;
    const client: Client = { id: clientId, name: trimmed };
    const workspaceId = `workspace-${nextWorkspaceNum++}`;
    const newWorkspace: Workspace = { id: workspaceId, name: 'My Workspace', category: 'Boards', clientId };
    set((s) => ({
      clients: [...s.clients, client],
      workspaces: [...s.workspaces, newWorkspace],
      workspaceSnapshots: { ...s.workspaceSnapshots, [workspaceId]: blankWorkspaceSnapshot() },
    }));
    get().setWorkspace(workspaceId);
    return clientId;
  },
  renameClient: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, name: trimmed } : c)) }));
  },
  addPerson: (name, email) => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const id = `p${nextPersonNum++}`;
    const person: Person = {
      id,
      name: trimmed,
      initials: initialsFor(trimmed),
      tone: PERSON_TONES[get().people.length % PERSON_TONES.length],
      email: email?.trim() || undefined,
    };
    set((s) => ({ people: [...s.people, person] }));
    return id;
  },
  invitePerson: (email) => {
    const trimmed = email.trim();
    if (!trimmed) return '';
    return get().addPerson(nameFromEmail(trimmed), trimmed);
  },
  renamePerson: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => ({
      people: s.people.map((p) => (p.id === id ? { ...p, name: trimmed, initials: initialsFor(trimmed) } : p)),
    }));
  },
  setPersonEmail: (id, email) => {
    const trimmed = email.trim();
    set((s) => ({ people: s.people.map((p) => (p.id === id ? { ...p, email: trimmed || undefined } : p)) }));
  },
  deletePerson: (id) => {
    if (id === CURRENT_USER_ID) return;
    set((s) => ({
      people: s.people.filter((p) => p.id !== id),
      tasks: s.tasks.map((t) => (t.assigneeIds.includes(id) ? { ...t, assigneeIds: t.assigneeIds.filter((a) => a !== id) } : t)),
      personFilter: s.personFilter.filter((pid) => pid !== id),
    }));
  },

  setGrouping: (grouping) => set({ grouping }),
  setView: (view) => set({ view }),
  setBoardTab: (boardTab) => set({ boardTab, activeNav: boardTab === 'Calendar' ? 'calendar' : 'boards' }),
  setNav: (key) => {
    switch (key) {
      case 'boards':
        set({ activeNav: key, view: 'boards', boardTab: 'Table' });
        break;
      case 'calendar':
        set({ activeNav: key, view: 'boards', boardTab: 'Calendar' });
        break;
      case 'people':
        set({ activeNav: key, view: 'people' });
        break;
      default:
        set({ activeNav: key, view: 'mywork' });
    }
  },
  setWorkBucket: (workBucket) => set({ workBucket }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  togglePersonFilter: (personId) =>
    set((s) => ({
      personFilter: s.personFilter.includes(personId)
        ? s.personFilter.filter((id) => id !== personId)
        : [...s.personFilter, personId],
    })),
  setPersonFilterMode: (personFilterMode) => set({ personFilterMode }),
  clearPersonFilter: () => set({ personFilter: [], personFilterMode: 'any' }),

  toggleFilterValue: (dimension, value) =>
    set((s) => {
      const current = s.filters[dimension];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { filters: { ...s.filters, [dimension]: next } };
    }),
  clearFilters: () => set({ filters: { priority: [], status: [], category: [], client: [] } }),

  addGroup: (grouping, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => {
      const key = grouping === 'Campaign' ? 'campaignGroups' : 'clientGroups';
      const existing = s[key];
      if (existing.some((g) => g.toLowerCase() === trimmed.toLowerCase())) return {};
      return { [key]: [...existing, trimmed] } as Partial<ForecastState>;
    });
  },
  renameGroup: (grouping, oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    set((s) => {
      const key = grouping === 'Campaign' ? 'campaignGroups' : 'clientGroups';
      const taskField = grouping === 'Campaign' ? 'campaign' : 'client';
      const existing = s[key];
      if (existing.some((g) => g.toLowerCase() === trimmed.toLowerCase() && g !== oldName)) return {};
      return {
        [key]: existing.map((g) => (g === oldName ? trimmed : g)),
        tasks: s.tasks.map((t) => (t[taskField] === oldName ? { ...t, [taskField]: trimmed } : t)),
      } as Partial<ForecastState>;
    });
  },
  openNewGroup: () => set({ newGroupOpen: true, newGroupDraft: '' }),
  closeNewGroup: () => set({ newGroupOpen: false, newGroupDraft: '' }),
  setNewGroupDraft: (newGroupDraft) => set({ newGroupDraft }),
  submitNewGroup: () => {
    const { grouping, newGroupDraft, addGroup } = get();
    if (grouping !== 'Campaign' && grouping !== 'Client') return;
    addGroup(grouping, newGroupDraft);
    set({ newGroupOpen: false, newGroupDraft: '' });
  },

  addCategory: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => {
      if (s.categoryGroups.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return {};
      const next = [...s.categoryGroups, trimmed];
      writeStringList(CATEGORY_GROUPS_KEY, next);
      return { categoryGroups: next };
    });
  },
  renameCategory: (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    set((s) => {
      if (s.categoryGroups.some((c) => c.toLowerCase() === trimmed.toLowerCase() && c !== oldName)) return {};
      const next = s.categoryGroups.map((c) => (c === oldName ? trimmed : c));
      writeStringList(CATEGORY_GROUPS_KEY, next);
      return { categoryGroups: next, tasks: s.tasks.map((t) => (t.category === oldName ? { ...t, category: trimmed } : t)) };
    });
  },
  deleteCategory: (name) => {
    set((s) => {
      if (s.categoryGroups.length <= 1) return {};
      const next = s.categoryGroups.filter((c) => c !== name);
      const fallback = next[0];
      writeStringList(CATEGORY_GROUPS_KEY, next);
      return { categoryGroups: next, tasks: s.tasks.map((t) => (t.category === name ? { ...t, category: fallback } : t)) };
    });
  },

  addStage: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => {
      if (s.stageGroups.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return {};
      const next = [...s.stageGroups, trimmed];
      writeStringList(STAGE_GROUPS_KEY, next);
      return { stageGroups: next };
    });
  },
  renameStage: (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    set((s) => {
      if (s.stageGroups.some((c) => c.toLowerCase() === trimmed.toLowerCase() && c !== oldName)) return {};
      const next = s.stageGroups.map((c) => (c === oldName ? trimmed : c));
      writeStringList(STAGE_GROUPS_KEY, next);
      return { stageGroups: next, tasks: s.tasks.map((t) => (t.stage === oldName ? { ...t, stage: trimmed } : t)) };
    });
  },
  deleteStage: (name) => {
    set((s) => {
      if (s.stageGroups.length <= 1) return {};
      const next = s.stageGroups.filter((c) => c !== name);
      const fallback = next[0];
      writeStringList(STAGE_GROUPS_KEY, next);
      return { stageGroups: next, tasks: s.tasks.map((t) => (t.stage === name ? { ...t, stage: fallback } : t)) };
    });
  },

  setTimelineGroup: (timelineGroupId) => set({ timelineGroupId }),
  saveTimelineGroupAsDefault: () => {
    const { timelineGroupId, activeWorkspaceId } = get();
    writeDefaultTimelineGroup(activeWorkspaceId, timelineGroupId);
    set({ savedDefaultTimelineGroup: timelineGroupId });
  },

  selectTask: (selectedTaskId) => set({ selectedTaskId, composerDraft: '' }),

  toggleDone: (id) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),

  setTitle: (id, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, title: trimmed } : t)) }));
  },

  setPriority: (id, priority) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, priority } : t)) })),

  setStatus: (id, status) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) })),

  toggleAssignee: (id, personId) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? { ...t, assigneeIds: t.assigneeIds.includes(personId) ? t.assigneeIds.filter((a) => a !== personId) : [...t.assigneeIds, personId] }
          : t,
      ),
    })),

  setCampaign: (id, campaign) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, campaign } : t)) })),

  setClient: (id, client) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, client } : t)) })),

  setCategory: (id, category) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, category } : t)) })),

  moveTask: (id, beforeId) => {
    if (id === beforeId) return;
    set((s) => {
      const from = s.tasks.findIndex((t) => t.id === id);
      const to = s.tasks.findIndex((t) => t.id === beforeId);
      if (from === -1 || to === -1) return {};
      const tasks = [...s.tasks];
      const [moved] = tasks.splice(from, 1);
      tasks.splice(tasks.findIndex((t) => t.id === beforeId), 0, moved);
      return { tasks };
    });
  },

  setDueDate: (id, dueDate) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, dueDate } : t)) })),

  setDescription: (id, description) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, description } : t)) })),

  setEstimatedHours: (id, hours) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, estimatedHours: hours } : t)) })),

  setTaskDates: (id, start, end) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, start, end: end < start ? start : end } : t)),
    })),

  moveTaskStage: (id, stage) =>
    set((s) => {
      const isFinalStage = s.stageGroups[s.stageGroups.length - 1] === stage;
      return {
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, stage, done: isFinalStage ? true : t.done } : t)),
      };
    }),

  addFileToTask: (id) =>
    set((s) => {
      const icon = FILE_ICONS[id] ?? (nextFileNum++ % 2 === 0 ? 'ph-image' : 'ph-file');
      const tile: FileTile = { id: `f-${id}-${Date.now()}`, icon };
      return {
        filesByTask: { ...s.filesByTask, [id]: [...(s.filesByTask[id] ?? []), tile] },
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, filesCount: t.filesCount + 1 } : t)),
      };
    }),

  setComposerDraft: (composerDraft) => set({ composerDraft }),

  postUpdate: (taskId, body) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const me = get().people.find((p) => p.id === CURRENT_USER_ID);
    const update: UpdateMessage = {
      id: `u${nextUpdateNum++}`,
      taskId,
      authorName: me?.name ?? 'You',
      authorInitials: me?.initials ?? 'Y',
      createdAt: NOW.toISOString(),
      body: trimmed,
    };
    set((s) => ({
      updates: [...s.updates, update],
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, notesCount: t.notesCount + 1 } : t)),
      composerDraft: '',
    }));
  },

  openNewTask: (prefill) =>
    set((s) => ({
      newTaskOpen: true,
      newTaskDraft: { ...blankDraft(s.campaignGroups, s.clientGroups, s.categoryGroups, s.stageGroups), ...prefill },
    })),
  closeNewTask: () => set({ newTaskOpen: false, newTaskDraft: null }),
  updateNewTaskDraft: (patch) =>
    set((s) => ({ newTaskDraft: s.newTaskDraft ? { ...s.newTaskDraft, ...patch } : s.newTaskDraft })),

  submitNewTask: () => {
    const { newTaskDraft: draft, workspaces, activeWorkspaceId } = get();
    if (!draft || !draft.title.trim()) return;
    const boardName = workspaces.find((w) => w.id === activeWorkspaceId)?.name ?? '';
    const task: Task = {
      id: `t${nextTaskNum++}`,
      title: draft.title.trim(),
      campaign: draft.campaign,
      client: draft.client,
      board: boardName,
      start: draft.start,
      end: draft.end < draft.start ? draft.start : draft.end,
      dueDate: draft.dueDate,
      priority: draft.priority,
      status: draft.status,
      category: draft.category,
      stage: draft.stage,
      assigneeIds: draft.assigneeIds,
      filesCount: 0,
      notesCount: 0,
      done: false,
    };
    set((s) => ({ tasks: [...s.tasks, task], newTaskOpen: false, newTaskDraft: null }));
  },

  addSubtask: (parentId) => {
    const { tasks, workspaces, activeWorkspaceId } = get();
    const parent = tasks.find((t) => t.id === parentId);
    if (!parent) return '';
    const boardName = workspaces.find((w) => w.id === activeWorkspaceId)?.name ?? '';
    const id = `t${nextTaskNum++}`;
    const task: Task = {
      id,
      title: 'New subtask',
      campaign: parent.campaign,
      client: parent.client,
      board: boardName,
      start: parent.start,
      end: parent.end,
      dueDate: parent.dueDate,
      priority: parent.priority,
      status: parent.status,
      category: parent.category,
      stage: parent.stage,
      assigneeIds: [],
      filesCount: 0,
      notesCount: 0,
      done: false,
      parentId,
    };
    set((s) => ({ tasks: [...s.tasks, task] }));
    return id;
  },

  deleteTask: (id) => {
    const { tasks, updates, filesByTask, selectedTaskId } = get();
    const toDelete = new Set<string>();
    const collect = (taskId: string) => {
      toDelete.add(taskId);
      for (const t of tasks) if (t.parentId === taskId) collect(t.id);
    };
    collect(id);
    const nextFiles = { ...filesByTask };
    for (const tid of toDelete) delete nextFiles[tid];
    set({
      tasks: tasks.filter((t) => !toDelete.has(t.id)),
      updates: updates.filter((u) => !toDelete.has(u.taskId)),
      filesByTask: nextFiles,
      selectedTaskId: selectedTaskId && toDelete.has(selectedTaskId) ? null : selectedTaskId,
    });
  },

  calendarPrev: () =>
    set((s) => ({ calendarMonth: new Date(s.calendarMonth.getFullYear(), s.calendarMonth.getMonth() - 1, 1) })),
  calendarNext: () =>
    set((s) => ({ calendarMonth: new Date(s.calendarMonth.getFullYear(), s.calendarMonth.getMonth() + 1, 1) })),
  calendarToday: () => set({ calendarMonth: new Date(NOW.getFullYear(), NOW.getMonth(), 1) }),
}));
