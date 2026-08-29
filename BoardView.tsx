import { useMemo, useRef, useState, type ReactNode } from 'react';
import { countActiveFilters, filterByAssignees, filterByFilters, filterTasks, groupsWithEveryAssignee, groupTasks, subtasksByParent, topLevelTasks } from '../../selectors';
import { MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH, useForecastStore } from '../../store';
import type { Status, Task } from '../../types';
import { columnMeta } from '../../utils/columns';
import { cx } from '../../utils/cx';
import { ContextMenu } from '../shared/ContextMenu';
import { EditableTitle } from '../shared/EditableTitle';
import { TaskContextMenu } from '../shared/TaskContextMenu';
import { TaskDetailPanel } from '../shared/TaskDetailPanel';
import { NewColumnButton } from './NewColumnButton';
import { TaskRow } from './TaskRow';

const NO_KNOWN_GROUPS: string[] = [];

/**
 * Drag handle sitting on the border between two columns — like Monday.com, dragging it
 * slides the border itself: the column on the left grows/shrinks exactly as much as the
 * column on the right shrinks/grows, so the rest of the table doesn't move. The trailing
 * handle (after the last column) has no right neighbor, so it trades with the flexible
 * title column instead, same as before.
 */
function ColumnResizeHandle({ leftKey, rightKey }: { leftKey: string; rightKey?: string }) {
  const columnWidths = useForecastStore((s) => s.columnWidths);
  const setColumnWidths = useForecastStore((s) => s.setColumnWidths);
  const startRef = useRef({ x: 0, left: 0, right: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startRef.current = {
      x: e.clientX,
      left: columnWidths[leftKey],
      right: rightKey ? columnWidths[rightKey] : 0,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMouseMove = (ev: MouseEvent) => {
      const raw = ev.clientX - startRef.current.x;
      if (!rightKey) {
        setColumnWidths({ [leftKey]: startRef.current.left + raw });
        return;
      }
      // Clamp the shared delta so neither side crosses its min/max — the border can only
      // slide as far as both flanking columns allow.
      const minDelta = Math.max(MIN_COLUMN_WIDTH - startRef.current.left, startRef.current.right - MAX_COLUMN_WIDTH);
      const maxDelta = Math.min(MAX_COLUMN_WIDTH - startRef.current.left, startRef.current.right - MIN_COLUMN_WIDTH);
      const delta = Math.min(maxDelta, Math.max(minDelta, raw));
      setColumnWidths({ [leftKey]: startRef.current.left + delta, [rightKey]: startRef.current.right - delta });
    };
    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return <div className="col-resize-handle" onMouseDown={onMouseDown} onClick={(e) => e.stopPropagation()} />;
}

/** The group header's name — editable inline (pencil on hover) for Campaign/Client groups; Status groups are fixed enum values, so not renameable. */
function GroupName({ name, editable, onRename }: { name: string; editable: boolean; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const startEditing = () => {
    setDraft(name);
    setEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onRename(trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        className="board-group-name-input"
        value={draft}
        autoFocus
        onFocus={(e) => e.target.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }

  return (
    <span className="board-group-name-wrap">
      <span className="board-group-name">{name}</span>
      {editable && (
        <button type="button" className="board-group-name-edit" onClick={startEditing} aria-label={`Rename ${name}`} title={`Rename ${name}`}>
          <i className="ph ph-pencil-simple" />
        </button>
      )}
    </span>
  );
}

export function BoardView() {
  const tasks = useForecastStore((s) => s.tasks);
  const grouping = useForecastStore((s) => s.grouping);
  const campaignGroups = useForecastStore((s) => s.campaignGroups);
  const clientGroups = useForecastStore((s) => s.clientGroups);
  const openNewTask = useForecastStore((s) => s.openNewTask);
  const searchQuery = useForecastStore((s) => s.searchQuery);
  const setSearchQuery = useForecastStore((s) => s.setSearchQuery);
  const personFilter = useForecastStore((s) => s.personFilter);
  const personFilterMode = useForecastStore((s) => s.personFilterMode);
  const clearPersonFilter = useForecastStore((s) => s.clearPersonFilter);
  const filters = useForecastStore((s) => s.filters);
  const clearFilters = useForecastStore((s) => s.clearFilters);
  const renameGroup = useForecastStore((s) => s.renameGroup);
  const columnWidths = useForecastStore((s) => s.columnWidths);
  const columnOrder = useForecastStore((s) => s.columnOrder);
  const setColumnOrder = useForecastStore((s) => s.setColumnOrder);
  const customColumns = useForecastStore((s) => s.customColumns);
  const columnLabelOverrides = useForecastStore((s) => s.columnLabelOverrides);
  const renameColumn = useForecastStore((s) => s.renameColumn);
  const deleteCustomColumn = useForecastStore((s) => s.deleteCustomColumn);
  const moveTask = useForecastStore((s) => s.moveTask);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<{ id: string; groupKey: string } | null>(null);
  // Title keeps a 140px floor so adding more columns (or narrowing the window) makes the table
  // scroll horizontally — via .board-table-scroll's overflow-x — instead of crushing titles unreadable.
  const COLUMNS = `minmax(140px,1fr) ${columnOrder.map((k) => `${columnWidths[k]}px`).join(' ')} 36px`;

  const handleColumnDragOver = (overKey: string) => {
    if (!draggedColumn || draggedColumn === overKey) return;
    const from = columnOrder.indexOf(draggedColumn);
    const to = columnOrder.indexOf(overKey);
    if (from === -1 || to === -1) return;
    const next = [...columnOrder];
    next.splice(from, 1);
    next.splice(to, 0, draggedColumn);
    setColumnOrder(next);
  };

  /** Only reorders within the same group's own rows — dragging into a different group wouldn't
   * make sense here (that's a move between campaigns/clients/statuses, a different action). */
  const handleTaskDragOver = (overTaskId: string, overGroupKey: string) => {
    if (!draggedTask || draggedTask.id === overTaskId || draggedTask.groupKey !== overGroupKey) return;
    moveTask(draggedTask.id, overTaskId);
  };

  const knownGroups = grouping === 'Campaign' ? campaignGroups : grouping === 'Client' ? clientGroups : NO_KNOWN_GROUPS;
  const visibleTasks = useMemo(() => {
    const searched = filterTasks(tasks, searchQuery);
    const byAssignee = filterByAssignees(searched, personFilter);
    return filterByFilters(byAssignee, filters);
  }, [tasks, searchQuery, personFilter, filters]);
  const topLevelVisible = useMemo(() => topLevelTasks(visibleTasks), [visibleTasks]);
  const subtaskMap = useMemo(() => subtasksByParent(visibleTasks), [visibleTasks]);
  const allGroups = useMemo(
    () => groupTasks(topLevelVisible, grouping, knownGroups),
    [topLevelVisible, grouping, knownGroups],
  );

  const hasActiveFilter = !!searchQuery.trim() || personFilter.length > 0 || countActiveFilters(filters) > 0;
  const groups =
    personFilterMode === 'all' && personFilter.length >= 2
      ? groupsWithEveryAssignee(allGroups, personFilter)
      : hasActiveFilter
        ? allGroups.filter((g) => g.tasks.length > 0)
        : allGroups;

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<{ task: Task; x: number; y: number } | null>(null);

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleTaskCollapse = (id: string) =>
    setCollapsedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** Renders a task row followed by its (recursively nested, arbitrarily deep) subtasks, skipping any subtree that's collapsed. */
  const renderTaskTree = (t: Task, depth: number, groupKey: string): ReactNode[] => {
    const children = subtaskMap.get(t.id) ?? [];
    const taskCollapsed = collapsedTasks.has(t.id);
    const rows: ReactNode[] = [
      <TaskRow
        key={t.id}
        task={t}
        columns={COLUMNS}
        onContextMenu={(task, x, y) => setMenu({ task, x, y })}
        depth={depth}
        hasChildren={children.length > 0}
        isCollapsed={taskCollapsed}
        onToggleCollapse={() => toggleTaskCollapse(t.id)}
        // Only top-level rows can be drag-reordered — subtasks nest under a fixed parent instead.
        draggable={depth === 0}
        isDragging={draggedTask?.id === t.id}
        onDragStartRow={depth === 0 ? () => setDraggedTask({ id: t.id, groupKey }) : undefined}
        onDragEndRow={() => setDraggedTask(null)}
        onDragOverRow={depth === 0 ? () => handleTaskDragOver(t.id, groupKey) : undefined}
      />,
    ];
    if (!taskCollapsed) {
      for (const c of children) rows.push(...renderTaskTree(c, depth + 1, groupKey));
    }
    return rows;
  };

  const addTaskPrefill = (groupKey: string) => {
    if (grouping === 'Campaign') return { campaign: groupKey };
    if (grouping === 'Client') return { client: groupKey };
    return { status: groupKey as Status };
  };

  return (
    <>
      <div className="board-scroll">
        {hasActiveFilter && groups.length === 0 && (
          <div className="board-no-results">
            <div>
              No tasks match
              {searchQuery.trim() && <> &ldquo;{searchQuery}&rdquo;</>}
              {searchQuery.trim() && personFilter.length > 0 && ' and '}
              {personFilter.length > 0 && (personFilterMode === 'all' ? ' every selected person' : ' the selected people')}
              {(searchQuery.trim() || personFilter.length > 0) && countActiveFilters(filters) > 0 && ' and '}
              {countActiveFilters(filters) > 0 && ' the selected filters'}.
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSearchQuery('');
                clearPersonFilter();
                clearFilters();
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        {groups.map((g) => {
          const isCollapsed = collapsed.has(g.key);
          return (
            <div className="board-group" key={g.key}>
              <div className="board-group-head">
                <button
                  type="button"
                  className={cx('board-group-caret', isCollapsed && 'is-collapsed')}
                  onClick={() => toggle(g.key)}
                  aria-label={isCollapsed ? 'Expand group' : 'Collapse group'}
                >
                  <i className="ph ph-caret-down cd-i" />
                </button>
                <GroupName
                  name={g.name}
                  editable={grouping === 'Campaign' || grouping === 'Client'}
                  onRename={(newName) => {
                    if (grouping === 'Campaign' || grouping === 'Client') renameGroup(grouping, g.name, newName);
                  }}
                />
                <span className="board-group-count">{g.count} tasks</span>
                <span className="board-group-range">{g.range}</span>
              </div>

              {!isCollapsed && (
                <div className="board-table-scroll">
                  <div className="board-colheads" style={{ gridTemplateColumns: COLUMNS }}>
                    <span style={{ gridColumn: 1, paddingRight: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Task</span>
                    {columnOrder.map((key, i) => {
                      const meta = columnMeta(key, customColumns, columnLabelOverrides);
                      const isCustom = customColumns.some((c) => c.id === key);
                      return (
                        <div
                          key={key}
                          className={cx('board-colhead-cell', draggedColumn === key && 'is-dragging')}
                          style={{ gridColumn: i + 2, justifyContent: meta.align === 'right' ? 'flex-end' : undefined }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            handleColumnDragOver(key);
                          }}
                          onDrop={(e) => e.preventDefault()}
                        >
                          <EditableTitle
                            value={meta.label}
                            onSave={(name) => renameColumn(key, name)}
                            inputClassName="board-colhead-input"
                            renderView={(name, startEditing) => (
                              <span
                                className="board-colhead-label"
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.effectAllowed = 'move';
                                  setDraggedColumn(key);
                                }}
                                onDragEnd={() => setDraggedColumn(null)}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  startEditing();
                                }}
                              >
                                <i className="ph ph-dots-six-vertical board-colhead-grip" />
                                {name}
                                <button
                                  type="button"
                                  className="board-colhead-edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing();
                                  }}
                                  aria-label={`Rename ${name}`}
                                  title={`Rename ${name}`}
                                >
                                  <i className="ph ph-pencil-simple" />
                                </button>
                              </span>
                            )}
                          />
                          {isCustom && (
                            <button
                              type="button"
                              className="board-colhead-delete"
                              onClick={() => deleteCustomColumn(key)}
                              aria-label={`Delete ${meta.label} column`}
                              title={`Delete ${meta.label} column`}
                            >
                              <i className="ph ph-trash" />
                            </button>
                          )}
                          <ColumnResizeHandle leftKey={key} rightKey={columnOrder[i + 1]} />
                        </div>
                      );
                    })}
                    <NewColumnButton gridColumn={columnOrder.length + 2} />
                  </div>
                  <div className="board-rows">
                    {g.tasks.flatMap((t) => renderTaskTree(t, 0, g.key))}
                    <button type="button" className="board-add-row" onClick={() => openNewTask(addTaskPrefill(g.key))}>
                      <i className="ph ph-plus cd-i" style={{ fontSize: 13 }} />Add task
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <TaskDetailPanel variant="docked" />

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          <TaskContextMenu task={menu.task} primaryMove={grouping} onClose={() => setMenu(null)} />
        </ContextMenu>
      )}
    </>
  );
}
