import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import { countActiveFilters, filterByFilters, filterTasks, kanbanColumns } from '../../selectors';
import { useForecastStore } from '../../store';
import type { Task } from '../../types';
import { tagPaletteClass } from '../../utils/style';
import { cx } from '../../utils/cx';
import { ContextMenu } from '../shared/ContextMenu';
import { TaskContextMenu } from '../shared/TaskContextMenu';
import { TaskDetailPanel } from '../shared/TaskDetailPanel';
import { KanbanColumn } from './KanbanColumn';

export function KanbanView() {
  const tasks = useForecastStore((s) => s.tasks);
  const stageGroups = useForecastStore((s) => s.stageGroups);
  const categoryGroups = useForecastStore((s) => s.categoryGroups);
  const moveTaskStage = useForecastStore((s) => s.moveTaskStage);
  const searchQuery = useForecastStore((s) => s.searchQuery);
  const filters = useForecastStore((s) => s.filters);
  const visibleTasks = useMemo(
    () => filterByFilters(filterTasks(tasks, searchQuery), filters),
    [tasks, searchQuery, filters],
  );
  const columns = useMemo(() => kanbanColumns(visibleTasks, stageGroups), [visibleTasks, stageGroups]);
  const hasActiveFilter = !!searchQuery.trim() || countActiveFilters(filters) > 0;
  const noResults = hasActiveFilter && visibleTasks.length === 0;
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : undefined;
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ task: Task; x: number; y: number } | null>(null);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const overStage = e.over?.id as string | undefined;
    if (!overStage) return;
    const task = tasks.find((t) => t.id === e.active.id);
    if (task && task.stage !== overStage) moveTaskStage(task.id, overStage);
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      {noResults ? (
        <div className="board-no-results">
          No tasks match
          {searchQuery.trim() && <> &ldquo;{searchQuery}&rdquo;</>}
          {searchQuery.trim() && countActiveFilters(filters) > 0 && ' and '}
          {countActiveFilters(filters) > 0 && ' the selected filters'}.
        </div>
      ) : (
        <div className="kanban-body" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(220px, 1fr))` }}>
          {columns.map((c) => (
            <KanbanColumn
              key={c.stage}
              stage={c.stage}
              tasks={c.tasks}
              onOpenTask={setOpenTaskId}
              onContextMenu={(task, x, y) => setMenu({ task, x, y })}
            />
          ))}
        </div>
      )}
      <DragOverlay>
        {activeTask && (
          <div className="card elev-md kanban-card kanban-drag-overlay">
            <div className="kanban-card-tags">
              <span className={cx('tag', tagPaletteClass(activeTask.category, categoryGroups))}>{activeTask.category}</span>
            </div>
            <div className="kanban-card-title">{activeTask.title}</div>
          </div>
        )}
      </DragOverlay>
      {openTaskId && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpenTaskId(null)}
          />
          <TaskDetailPanel variant="drawer" taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
        </>
      )}
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          <TaskContextMenu task={menu.task} primaryMove="Stage" onClose={() => setMenu(null)} />
        </ContextMenu>
      )}
    </DndContext>
  );
}
