import { useRef, useState } from 'react';
import { useForecastStore } from '../../store';
import type { Priority, Status } from '../../types';
import { dueInfo, formatRange, formatRelative, formatShort } from '../../utils/dates';
import { cx } from '../../utils/cx';
import { priorityClass, statusClass } from '../../utils/style';
import { peopleFor } from '../../utils/people';
import { deleteUploadedFile, fileDownloadUrl, formatFileSize, iconForMime, uploadFile } from '../../utils/files';
import { AssigneeMultiSelect } from './AssigneeMultiSelect';
import { Avatar } from './Avatar';
import { DatePicker } from './DatePicker';
import { DateRangePicker } from './DateRangePicker';
import { EditableTitle } from './EditableTitle';
import { SelectMenu } from './SelectMenu';

const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: Status[] = ['Not started', 'Working', 'In review', 'Approved', 'Blocked', 'Done'];

export function TaskDetailPanel({
  variant = 'docked',
  taskId,
  onClose,
}: {
  variant?: 'docked' | 'drawer';
  /** Overrides the globally-selected task (used when the panel is opened locally, e.g. from Kanban). */
  taskId?: string | null;
  onClose?: () => void;
}) {
  const storeSelectedId = useForecastStore((s) => s.selectedTaskId);
  const selectedTaskId = taskId !== undefined ? taskId : storeSelectedId;
  const task = useForecastStore((s) => s.tasks.find((t) => t.id === selectedTaskId));
  const updates = useForecastStore((s) => s.updates);
  const filesByTask = useForecastStore((s) => s.filesByTask);
  const composerDraft = useForecastStore((s) => s.composerDraft);
  const setComposerDraft = useForecastStore((s) => s.setComposerDraft);
  const postUpdate = useForecastStore((s) => s.postUpdate);
  const addFileToTask = useForecastStore((s) => s.addFileToTask);
  const removeFileFromTask = useForecastStore((s) => s.removeFileFromTask);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setTitle = useForecastStore((s) => s.setTitle);
  const setPriority = useForecastStore((s) => s.setPriority);
  const setStatus = useForecastStore((s) => s.setStatus);
  const toggleAssignee = useForecastStore((s) => s.toggleAssignee);
  const setTaskDates = useForecastStore((s) => s.setTaskDates);
  const setDueDate = useForecastStore((s) => s.setDueDate);
  const setDescription = useForecastStore((s) => s.setDescription);
  const setEstimatedHours = useForecastStore((s) => s.setEstimatedHours);
  const selectTask = useForecastStore((s) => s.selectTask);
  const deleteTask = useForecastStore((s) => s.deleteTask);
  const close = onClose ?? (() => selectTask(null));

  if (!task || !selectedTaskId) {
    return (
      <aside className={cx('task-panel', variant === 'drawer' && 'is-drawer', variant === 'docked' && 'is-empty')}>
        <div className="task-panel-empty">Select a task to see its files, updates, and details.</div>
      </aside>
    );
  }

  const files = filesByTask[task.id] ?? [];
  const thread = updates.filter((u) => u.taskId === task.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const submit = () => postUpdate(task.id, composerDraft);

  const uploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    // Snapshot into a plain array before anything else: FileList stays live off the input
    // element, and the caller resets input.value right after this is invoked (so the same
    // file can be re-selected later) — which clears that live list mid-upload and silently
    // drops every file after the first if we iterate the FileList itself.
    const files = Array.from(fileList);
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of files) {
        const tile = await uploadFile(file);
        addFileToTask(task.id, tile);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (fileId: string) => {
    setUploadError(null);
    try {
      await deleteUploadedFile(fileId);
      removeFileFromTask(task.id, fileId);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  return (
    <aside className={cx('task-panel', variant === 'drawer' && 'is-drawer')}>
      <div className="task-panel-head">
        <div style={{ flex: 1 }}>
          <div className="task-panel-kicker">Task</div>
          <EditableTitle
            value={task.title}
            onSave={(title) => setTitle(task.id, title)}
            inputClassName="task-panel-title-input"
            renderView={(title, startEditing) => (
              <div className="task-panel-title-wrap" onDoubleClick={startEditing}>
                <span className="task-panel-title">{title}</span>
                <button
                  type="button"
                  className="task-panel-title-edit"
                  onClick={startEditing}
                  aria-label="Edit task name"
                  title="Edit task name"
                >
                  <i className="ph ph-pencil-simple" />
                </button>
              </div>
            )}
          />
        </div>
        <button
          type="button"
          className="task-panel-delete"
          onClick={() => {
            deleteTask(task.id);
            close();
          }}
          aria-label={task.parentId ? 'Delete subtask' : 'Delete task'}
          title={task.parentId ? 'Delete subtask' : 'Delete task'}
        >
          <i className="ph ph-trash cd-i" />
        </button>
        <button type="button" className="task-panel-close" onClick={close} aria-label="Close">
          <i className="ph ph-x cd-i" />
        </button>
      </div>

      <div className="task-panel-grid">
        <span className="task-panel-label">Timeline</span>
        <DateRangePicker
          start={task.start}
          end={task.end}
          onChange={(start, end) => setTaskDates(task.id, start, end)}
          trigger={(onClick, isOpen) => (
            <button type="button" className={cx('task-panel-date-trigger', isOpen && 'is-open')} onClick={onClick}>
              {formatRange(task.start, task.end)}
            </button>
          )}
        />

        <span className="task-panel-label">Due date</span>
        <DatePicker
          value={task.dueDate}
          onChange={(date) => setDueDate(task.id, date)}
          trigger={(onClick, isOpen) => (
            <button
              type="button"
              className={cx('task-panel-date-trigger', isOpen && 'is-open', dueInfo(task.dueDate).overdue && !task.done && 'is-overdue')}
              onClick={onClick}
            >
              {formatShort(task.dueDate)}
            </button>
          )}
        />

        <span className="task-panel-label">Priority</span>
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

        <span className="task-panel-label">Status</span>
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

        <span className="task-panel-label is-top">Assigned</span>
        <div className="task-panel-assignee-list">
          {peopleFor(task.assigneeIds).map((p) => (
            <div className="task-panel-assignee-row" key={p.id}>
              <Avatar initials={p.initials} tone={p.tone} size={22} />
              <span>{p.name}</span>
              <button
                type="button"
                className="task-panel-assignee-remove"
                onClick={() => toggleAssignee(task.id, p.id)}
                aria-label={`Remove ${p.name}`}
                title={`Remove ${p.name}`}
              >
                <i className="ph ph-x" />
              </button>
            </div>
          ))}
          <AssigneeMultiSelect
            value={task.assigneeIds}
            onToggle={(id) => toggleAssignee(task.id, id)}
            trigger={(onClick, isOpen) => (
              <button type="button" className={cx('task-panel-assignee-trigger', isOpen && 'is-open')} onClick={onClick}>
                <i className="ph ph-plus" style={{ fontSize: 12 }} />Add person
              </button>
            )}
          />
        </div>

        <span className="task-panel-label">Est. hours</span>
        <input
          type="number"
          className="task-panel-hours-input"
          min={0}
          step={0.5}
          value={task.estimatedHours ?? ''}
          onChange={(e) => setEstimatedHours(task.id, e.target.value === '' ? undefined : Number(e.target.value))}
          placeholder="—"
        />
      </div>

      <div className="hr" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="task-panel-section-label">Files</div>
        <div className="task-panel-files">
          {files.map((f) => (
            <a
              key={f.id}
              className="task-panel-file"
              href={fileDownloadUrl(f.id)}
              title={`${f.name} (${formatFileSize(f.size)})`}
            >
              <i className={cx('ph', iconForMime(f.mimeType))} style={{ fontSize: 20 }} />
              <button
                type="button"
                className="task-panel-file-remove"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFile(f.id);
                }}
                aria-label={`Remove ${f.name}`}
                title={`Remove ${f.name}`}
              >
                <i className="ph ph-x" />
              </button>
            </a>
          ))}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              uploadFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className={cx('task-panel-file-drop', uploading && 'is-uploading')}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              uploadFiles(e.dataTransfer.files);
            }}
            disabled={uploading}
          >
            {uploading ? '…' : 'Drop'}
          </button>
        </div>
        {uploadError && <div className="task-panel-file-error">{uploadError}</div>}
      </div>

      <div className="hr" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="task-panel-section-label">Description</div>
        <textarea
          key={task.id}
          className="task-panel-description"
          defaultValue={task.description ?? ''}
          onBlur={(e) => setDescription(task.id, e.target.value)}
          placeholder="Add a description…"
          rows={3}
        />
      </div>

      <div className="hr" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0 }}>
        <div className="task-panel-section-label">Updates</div>
        <div className="task-panel-thread">
          {thread.length === 0 && <div className="task-panel-thread-empty">No updates yet — be the first to post one.</div>}
          {thread.map((t) => (
            <div key={t.id} className="thread-msg">
              <Avatar initials={t.authorInitials} tone="neutral" size={26} />
              <div className="thread-msg-body">
                <div className="thread-msg-meta">{t.authorName} · {formatRelative(t.createdAt)}</div>
                <div className="thread-msg-text">{t.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="composer">
        <input
          value={composerDraft}
          onChange={(e) => setComposerDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Write an update — @ to mention"
        />
        <button type="button" className="composer-send" disabled={!composerDraft.trim()} onClick={submit} aria-label="Post update">
          <i className="ph ph-paper-plane-tilt cd-i" />
        </button>
      </div>
    </aside>
  );
}
