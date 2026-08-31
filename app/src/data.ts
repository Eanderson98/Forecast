import type { Client, Person, Task, UpdateMessage, Workspace } from './types';

export const CURRENT_USER_ID = 'me';

export const PEOPLE: Person[] = [
  { id: 'me', name: 'You', initials: 'Y', tone: 'accent' },
];

export const CLIENTS: Client[] = [
  { id: 'my-client', name: 'My Client' },
];

export const DEFAULT_CLIENT_ID = CLIENTS[0].id;

export const WORKSPACES: Workspace[] = [
  { id: 'my-workspace', name: 'My Workspace', category: 'Boards', clientId: DEFAULT_CLIENT_ID },
];

export const DEFAULT_WORKSPACE_ID = WORKSPACES[0].id;

export interface WorkspaceSeed {
  /** Seed order for the Table view's Campaign/Client groups. Kept as plain
   * arrays (not derived from tasks) so a newly created empty group can show
   * up before any task is assigned to it. */
  campaignGroups: string[];
  clientGroups: string[];
  tasks: Task[];
  updates: UpdateMessage[];
}

const myWorkspaceSeed: WorkspaceSeed = {
  campaignGroups: [],
  clientGroups: [],
  tasks: [],
  updates: [],
};

export const WORKSPACE_SEEDS: Record<string, WorkspaceSeed> = {
  'my-workspace': myWorkspaceSeed,
};
