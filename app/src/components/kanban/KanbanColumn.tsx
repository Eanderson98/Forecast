import { useDroppable } from '@dnd-kit/core';
import { useForecastStore } from '../../store';
import type { Task } from '../../types';
import { cx } from '../../utils/cx';
import { EditableTitle } from '../shared/EditableTitle';
import { KanbanCard } from './KanbanCard';

export function KanbanColumn({
  stage,
  tasks,
  onOpenTask,
  onContextMenu,
}: {
  stage: string;
  tasks: Task[];
  onOpenTask: (id: string) => void;
  onContextMenu: (task: Task, x: number, y: number) => void;
}) {
  const openNewTask = useForecastStore((s) => s.openNewTask);
  const renameStage = useForecastStore((s) => s.renameStage);
  const deleteStage = useForecastStore((s) => s.deleteStage);
  const canDelete = useForecastStore((s) => s.stageGroups.length > 1);
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="kanban-col">
      <div className="kanban-col-head">
        <span className="kanban-col-dot" />
        <EditableTitle
          value={stage}
          onSave={(name) => renameStage(stage, name)}
          inputClassName="kanban-col-name-input"
          renderView={(name, startEditing) => (
            <span className="kanban-col-name-wrap" onDoubleClick={startEditing}>
              <span className="kanban-col-name">{name}</span>
              <button
                type="button"
                className="kanban-col-name-edit"
                onClick={startEditing}
                aria-label={`Rename ${name}`}
                title={`Rename ${name}`}
              >
                <i className="ph ph-pencil-simple" />
              </button>
            </span>
          )}
        />
        <span className="kanban-col-count">{tasks.length}</span>
        <span className="kanban-col-actions">
          {canDelete && (
            <button
              type="button"
              className="kanban-col-delete"
              onClick={() => deleteStage(stage)}
              aria-label={`Delete ${stage} column`}
              title={`Delete ${stage} column (its tasks move to the first remaining stage)`}
            >
              <i className="ph ph-trash" />
            </button>
          )}
          <button
            type="button"
            className="kanban-col-add"
            aria-label={`Add task to ${stage}`}
            onClick={() => openNewTask({ stage })}
          >
            <i className="ph ph-plus cd-i" style={{ fontSize: 13 }} />
          </button>
        </span>
      </div>
      <div ref={setNodeRef} className={cx('kanban-dropzone', isOver && 'is-over')}>
        {tasks.map((t) => (
          <KanbanCard key={t.id} task={t} onOpen={onOpenTask} onContextMenu={onContextMenu} />
        ))}
      </div>
    </div>
  );
}
