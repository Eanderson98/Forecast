import { useState } from 'react';
import { useForecastStore } from '../../store';
import type { Priority, Status, Task } from '../../types';
import { colIndex } from '../../utils/columns';
import { cx } from '../../utils/cx';
import { dueInfo, formatRangeDash, formatShort, progressPct } from '../../utils/dates';
import { priorityClass, statusClass, tagPaletteClass } from '../../utils/style';
import { assigneeSummary } from '../../utils/people';
import { AddPersonRow } from '../shared/AddPersonRow';
import { AssigneeMultiSelect, AvatarStack } from '../shared/AssigneeMultiSelect';
import { DatePicker } from '../shared/DatePicker';
import { DateRangePicker } from '../shared/DateRangePicker';
import { EditableTitle } from '../shared/EditableTitle';
import { SelectMenu } from '../shared/SelectMenu';

const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: Status[] = ['Not started', 'Working', 'In review', 'Approved', 'Blocked', 'Done'];

/** Horizontal indent added per nesting level below the top level. */
const INDENT_STEP = 20;

/** A custom text column's cell — double-click to edit, unlike EditableTitle this allows saving back to empty. */
function CustomTextCell({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
  };

  const commit = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        className="board-custom-text-input"
        value={draft}
        autoFocus
        onFocus={(e) => e.target.select()}
        onChange={(e) => setDraft(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }

  return (
    <span className={cx('board-custom-text', !value && 'is-empty')} onDoubleClick={startEditing}>
      {value || 'Empty'}
    </span>
  );
}

export function TaskRow({
  task,
  columns,
  onContextMenu,
  depth = 0,
  hasChildren = false,
  isCollapsed = false,
  onToggleCollapse,
  draggable = false,
  isDragging = false,
  onDragStartRow,
  onDragEndRow,
  onDragOverRow,
}: {
  task: Task;
  columns: string;
  onContextMenu: (task: Task, x: number, y: number) => void;
  /** 0 = a normal top-level task; 1 = a subtask nested (and indented) under one. */
  depth?: number;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Whether this row can be dragged to reorder it among its siblings (top-level rows only). */
  draggable?: boolean;
  isDragging?: boolean;
  onDragStartRow?: () => void;
  onDragEndRow?: () => void;
  onDragOverRow?: () => void;
}) {
  const selectedTaskId = useForecastStore((s) => s.selectedTaskId);
  const selectTask = useForecastStore((s) => s.selectTask);
  const toggleDone = useForecastStore((s) => s.toggleDone);
  const setTitle = useForecastStore((s) => s.setTitle);
  const setPriority = useForecastStore((s) => s.setPriority);
  const setStatus = useForecastStore((s) => s.setStatus);
  const toggleAssignee = useForecastStore((s) => s.toggleAssignee);
  const setTaskDates = useForecastStore((s) => s.setTaskDates);
  const setDueDate = useForecastStore((s) => s.setDueDate);
  const setCategory = useForecastStore((s) => s.setCategory);
  const addCategory = useForecastStore((s) => s.addCategory);
  const deleteCategory = useForecastStore((s) => s.deleteCategory);
  const moveTaskStage = useForecastStore((s) => s.moveTaskStage);
  const categoryGroups = useForecastStore((s) => s.categoryGroups);
  const stageGroups = useForecastStore((s) => s.stageGroups);
  const columnOrder = useForecastStore((s) => s.columnOrder);
  const customColumns = useForecastStore((s) => s.customColumns);
  const setCustomFieldValue = useForecastStore((s) => s.setCustomFieldValue);
  const addCustomColumnOption = useForecastStore((s) => s.addCustomColumnOption);
  const due = dueInfo(task.dueDate);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cx(
        'board-row',
        task.done && 'is-done',
        depth > 0 && 'is-subtask',
        task.id === selectedTaskId && 'is-selected',
        isDragging && 'is-row-dragging',
      )}
      style={{ gridTemplateColumns: columns }}
      onClick={() => selectTask(task.id)}
      onKeyDown={(e) => {
        // Only react when the row itself is focused — otherwise a Space/Enter typed into a
        // nested input (title edit, add-option field, etc.) gets swallowed here too, since
        // React bubbles portal-rendered popover events through the component tree.
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectTask(task.id);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        onContextMenu(task, e.clientX, rect.bottom + 4);
      }}
      onDragOver={
        onDragOverRow &&
        ((e) => {
          e.preventDefault();
          onDragOverRow();
        })
      }
      onDrop={onDragOverRow && ((e) => e.preventDefault())}
    >
      {draggable && (
        <span
          className="board-row-grip"
          draggable
          onClick={(e) => e.stopPropagation()}
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
            onDragStartRow?.();
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
            onDragEndRow?.();
          }}
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <i className="ph ph-dots-six-vertical" />
        </span>
      )}
      <div className="board-row-task" style={{ gridColumn: 1, paddingLeft: depth * INDENT_STEP }}>
        {depth === 0 ? (
          hasChildren && (
            <button
              type="button"
              className={cx('board-row-caret', isCollapsed && 'is-collapsed')}
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse?.();
              }}
              aria-label={isCollapsed ? 'Expand subtasks' : 'Collapse subtasks'}
            >
              <i className="ph ph-caret-down cd-i" />
            </button>
          )
        ) : (
          <span className="board-row-caret-slot">
            {hasChildren && (
              <button
                type="button"
                className={cx('board-row-caret', isCollapsed && 'is-collapsed')}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse?.();
                }}
                aria-label={isCollapsed ? 'Expand subtasks' : 'Collapse subtasks'}
              >
                <i className="ph ph-caret-down cd-i" />
              </button>
            )}
          </span>
        )}
        <button
          type="button"
          className={cx('board-checkbox', task.done && 'is-checked')}
          onClick={(e) => {
            e.stopPropagation();
            toggleDone(task.id);
          }}
          aria-label={task.done ? 'Mark not done' : 'Mark done'}
        >
          {task.done && <i className="ph ph-check" />}
        </button>
        <EditableTitle
          value={task.title}
          onSave={(title) => setTitle(task.id, title)}
          className={cx('board-row-title', task.done && 'is-done')}
          inputClassName="board-row-title-input"
        />
        {task.filesCount > 0 && (
          <span className="board-row-files">
            <i className="ph ph-paperclip cd-i" style={{ fontSize: 12 }} />{task.filesCount}
          </span>
        )}
      </div>

      <div className="board-cell" onClick={(e) => e.stopPropagation()} style={{ gridColumn: colIndex(columnOrder, 'timeline') }}>
        <DateRangePicker
          start={task.start}
          end={task.end}
          onChange={(start, end) => setTaskDates(task.id, start, end)}
          trigger={(onClick, isOpen) => (
            <button type="button" className={cx('board-row-timeline', isOpen && 'is-open')} onClick={onClick}>
              <span className="board-progress"><span style={{ width: `${progressPct(task.start, task.end)}%` }} /></span>
              {formatRangeDash(task.start, task.end)}
            </button>
          )}
        />
      </div>

      <div className="board-cell" onClick={(e) => e.stopPropagation()} style={{ gridColumn: colIndex(columnOrder, 'dueDate') }}>
        <DatePicker
          value={task.dueDate}
          onChange={(date) => setDueDate(task.id, date)}
          trigger={(onClick, isOpen) => (
            <button
              type="button"
              className={cx('board-due-trigger', isOpen && 'is-open', due.overdue && !task.done && 'is-overdue')}
              onClick={onClick}
            >
              {formatShort(task.dueDate)}
            </button>
          )}
        />
      </div>

      <div className="board-cell" onClick={(e) => e.stopPropagation()} style={{ gridColumn: colIndex(columnOrder, 'priority') }}>
        <SelectMenu
          value={task.priority}
          options={PRIORITIES}
          onChange={(p) => setPriority(task.id, p as Priority)}
          trigger={(onClick, isOpen) => (
            <button type="button" className={cx('tag tag-btn', priorityClass(task.priority), isOpen && 'is-open')} onClick={onClick}>
              {task.priority}
            </button>
          )}
        />
      </div>

      <div className="board-cell" onClick={(e) => e.stopPropagation()} style={{ gridColumn: colIndex(columnOrder, 'label') }}>
        <SelectMenu
          value={task.status}
          options={STATUSES}
          onChange={(s) => setStatus(task.id, s as Status)}
          trigger={(onClick, isOpen) => (
            <button type="button" className={cx('tag tag-btn', statusClass(task.status), isOpen && 'is-open')} onClick={onClick}>
              {task.status}
            </button>
          )}
        />
      </div>

      <div className="board-cell" onClick={(e) => e.stopPropagation()} style={{ gridColumn: colIndex(columnOrder, 'category') }}>
        <SelectMenu
          value={task.category}
          options={categoryGroups}
          onChange={(c) => setCategory(task.id, c)}
          onDeleteOption={deleteCategory}
          deleteDisabled={categoryGroups.length <= 1}
          trigger={(onClick, isOpen) => (
            <button type="button" className={cx('tag tag-btn', tagPaletteClass(task.category, categoryGroups), isOpen && 'is-open')} onClick={onClick}>
              {task.category}
            </button>
          )}
          footer={<AddPersonRow label="Add category" onAdd={addCategory} />}
        />
      </div>

      <div className="board-cell" onClick={(e) => e.stopPropagation()} style={{ gridColumn: colIndex(columnOrder, 'stage') }}>
        <SelectMenu
          value={task.stage}
          options={stageGroups}
          onChange={(s) => moveTaskStage(task.id, s)}
          trigger={(onClick, isOpen) => (
            <button type="button" className={cx('tag tag-btn', tagPaletteClass(task.stage, stageGroups), isOpen && 'is-open')} onClick={onClick}>
              {task.stage}
            </button>
          )}
        />
      </div>

      <div className="board-cell board-row-assigned" onClick={(e) => e.stopPropagation()} style={{ gridColumn: colIndex(columnOrder, 'assigned') }}>
        <AssigneeMultiSelect
          value={task.assigneeIds}
          onToggle={(id) => toggleAssignee(task.id, id)}
          trigger={(onClick, isOpen) => (
            <button type="button" className={cx('assignee-trigger', isOpen && 'is-open')} onClick={onClick}>
              <AvatarStack ids={task.assigneeIds} size={24} />
              <span className="board-row-who">{assigneeSummary(task.assigneeIds)}</span>
            </button>
          )}
        />
      </div>

      <div className="board-cell board-row-notes" style={{ gridColumn: colIndex(columnOrder, 'notes') }}>
        <i className="ph ph-chat-circle cd-i" style={{ fontSize: 14 }} />{task.notesCount}
      </div>

      {customColumns.map((col) => {
        const value = task.customFields?.[col.id] ?? '';
        return (
          <div key={col.id} className="board-cell" onClick={(e) => e.stopPropagation()} style={{ gridColumn: colIndex(columnOrder, col.id) }}>
            {col.type === 'text' ? (
              <CustomTextCell value={value} onSave={(v) => setCustomFieldValue(task.id, col.id, v)} />
            ) : (
              <SelectMenu
                value={value}
                options={col.options}
                onChange={(v) => setCustomFieldValue(task.id, col.id, v)}
                trigger={(onClick, isOpen) => (
                  <button
                    type="button"
                    className={cx('tag tag-btn', value ? tagPaletteClass(value, col.options) : 'tag-outline', isOpen && 'is-open')}
                    onClick={onClick}
                  >
                    {value || 'Empty'}
                  </button>
                )}
                footer={
                  <AddPersonRow
                    label="Add option"
                    onAdd={(v) => {
                      addCustomColumnOption(col.id, v);
                      setCustomFieldValue(task.id, col.id, v);
                    }}
                  />
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
