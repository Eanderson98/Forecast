export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type Status = 'Approved' | 'Done' | 'In review' | 'Working' | 'Blocked' | 'Not started';

export type Grouping = 'Campaign' | 'Client' | 'Status';

export type AvatarTone = 'accent' | 'accent-2' | 'neutral';

export interface Person {
  id: string;
  name: string;
  initials: string;
  tone: AvatarTone;
  /** Set when the person was added via an email invite rather than typed in by name. */
  email?: string;
}

/** The largest organizational parent — an agency account. Each one owns its own set of workspaces. */
export interface Client {
  id: string;
  name: string;
}

export interface Workspace {
  id: string;
  name: string;
  /** Breadcrumb suffix, e.g. "Campaigns" in "Creative Studio / Campaigns". */
  category: string;
  /** The Client (account) this workspace belongs to. */
  clientId: string;
}

export interface Task {
  id: string;
  title: string;
  campaign: string;
  client: string;
  board: string;
  start: string; // ISO date, yyyy-mm-dd — Timeline range start
  end: string; // ISO date, yyyy-mm-dd — Timeline range end
  dueDate: string; // ISO date, yyyy-mm-dd — separate hard deadline, shown in its own column
  priority: Priority;
  status: Status;
  category: string;
  stage: string;
  assigneeIds: string[];
  filesCount: number;
  notesCount: number;
  flag?: 'Critical' | 'Guest' | 'Blocked';
  done: boolean;
  description?: string;
  estimatedHours?: number;
  /** Set when this task is a subtask nested under another task in the Table view. */
  parentId?: string;
  /** Values for user-created Table columns, keyed by CustomColumnDef.id. */
  customFields?: Record<string, string>;
}

export interface UpdateMessage {
  id: string;
  taskId: string;
  authorName: string;
  authorInitials: string;
  guest?: boolean;
  createdAt: string; // ISO datetime
  body: string;
}

export type View = 'boards' | 'mywork' | 'people';
export type BoardTab = 'Table' | 'Kanban' | 'Calendar' | 'Timeline';
export type WorkBucket = 'Today' | 'This week' | 'Later';
export type NavKey = 'boards' | 'mywork' | 'calendar' | 'updates' | 'dashboard' | 'people';
export type PersonFilterMode = 'any' | 'all';

export type FilterDimension = 'priority' | 'status' | 'category' | 'client';
export interface TaskFilters {
  priority: string[];
  status: string[];
  category: string[];
  client: string[];
}

/** The Table view's built-in resizable columns; "task" (the title column) always fills remaining space and isn't included. */
export type TableColumnKey = 'timeline' | 'dueDate' | 'priority' | 'label' | 'category' | 'stage' | 'assigned' | 'notes';

export type CustomColumnType = 'text' | 'label';

/** A user-created Table column. Its values live on each Task's customFields, keyed by id. */
export interface CustomColumnDef {
  id: string;
  name: string;
  type: CustomColumnType;
  /** Selectable tag values for a 'label' column; unused for 'text'. Extended inline as people pick "add new". */
  options: string[];
}
