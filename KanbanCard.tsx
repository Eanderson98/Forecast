import { useDraggable } from '@dnd-kit/core';
import { useForecastStore } from '../../store';
import type { Task } from '../../types';
import { cx } from '../../utils/cx';
import { formatShort } from '../../utils/dates';
import { tagPaletteClass } from '../../utils/style';
import { AvatarStack } from '../shared/AssigneeMultiSelect';

export function KanbanCard({
  task,
  onOpen,
  onContextMenu,
}: {
  task: Task;
  onOpen: (id: string) => void;
  onContextMenu: (task: Task, x: number, y: number) => void;
}) {
  const categoryGroups = useForecastStore((s) => s.categoryGroups);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cx('card elev-sm kanban-card', isDragging && 'is-dragging')}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      onClick={() => !isDragging && onOpen(task.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(task, e.clientX, e.clientY);
      }}
    >
      <div className="kanban-card-tags">
        <span className={cx('tag', tagPaletteClass(task.category, categoryGroups))}>{task.category}</span>
        {task.flag && <span className="tag tag-outline">{task.flag}</span>}
      </div>
      <div className="kanban-card-title">{task.title}</div>
      <div className="kanban-card-meta">
        <span className="kanban-card-meta-item"><i className="ph ph-calendar-blank cd-i" style={{ fontSize: 13 }} />{formatShort(task.dueDate)}</span>
        <span className="kanban-card-meta-item"><i className="ph ph-chat-circle cd-i" style={{ fontSize: 13 }} />{task.notesCount}</span>
        <span className="kanban-card-meta-item"><i className="ph ph-paperclip cd-i" style={{ fontSize: 13 }} />{task.filesCount}</span>
        {task.assigneeIds.length > 0 && <span style={{ marginLeft: 'auto' }}><AvatarStack ids={task.assigneeIds} size={22} /></span>}
      </div>
    </div>
  );
}
