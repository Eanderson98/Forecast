import type { WorkspaceSnapshot } from './store';
import type { Client, CustomColumnDef, Person, Workspace } from './types';

/**
 * Everything Forecast persists to the shared database — deliberately excludes
 * per-tab UI state (open modals, filters, search, which tab you're on, etc.)
 * so different devices/browsers don't fight over each other's view.
 */
export interface PersistedState {
  clients: Client[];
  workspaces: Workspace[];
  workspaceSnapshots: Record<string, WorkspaceSnapshot>;
  activeWorkspaceId: string;
  lastWorkspaceByClient: Record<string, string>;
  people: Person[];
  categoryGroups: string[];
  stageGroups: string[];
  customColumns: CustomColumnDef[];
  columnOrder: string[];
  columnWidths: Record<string, number>;
  columnLabelOverrides: Record<string, string>;
}

/** Returns null when nothing has ever been saved (a brand-new database). */
export async function fetchPersistedState(): Promise<PersistedState | null> {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error(`Failed to load state (${res.status})`);
  return res.json();
}

export async function savePersistedState(data: PersistedState): Promise<void> {
  const res = await fetch('/api/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to save state (${res.status})`);
}
