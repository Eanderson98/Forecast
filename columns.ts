import type { CustomColumnDef, TableColumnKey } from '../types';

/**
 * 1-based CSS grid column index for a key, given the live column order.
 * Column 1 is always the Task title, so every reorderable column starts at 2.
 */
export function colIndex(order: string[], key: string): number {
  const i = order.indexOf(key);
  return i === -1 ? 1 : i + 2;
}

export const COLUMN_META: Record<TableColumnKey, { label: string; align?: 'right' }> = {
  timeline: { label: 'Timeline' },
  dueDate: { label: 'Due date' },
  priority: { label: 'Priority' },
  label: { label: 'Status' },
  category: { label: 'Category' },
  stage: { label: 'Stage' },
  assigned: { label: 'Assigned' },
  notes: { label: 'Notes', align: 'right' },
};

/** A built-in or custom column's current display label and alignment, honoring any rename. */
export function columnMeta(
  key: string,
  customColumns: CustomColumnDef[],
  labelOverrides: Record<string, string>,
): { label: string; align?: 'right' } {
  const builtIn = (COLUMN_META as Record<string, { label: string; align?: 'right' } | undefined>)[key];
  if (builtIn) return { ...builtIn, label: labelOverrides[key] ?? builtIn.label };
  const custom = customColumns.find((c) => c.id === key);
  return { label: custom?.name ?? key };
}
