import { useForecastStore } from '../../store';
import type { Priority, Status } from '../../types';
import { formatRange, formatShort } from '../../utils/dates';
import { cx } from '../../utils/cx';
import { assigneeSummary } from '../../utils/people';
import { AssigneeMultiSelect } from './AssigneeMultiSelect';
import { DatePicker } from './DatePicker';
import { DateRangePicker } from './DateRangePicker';
import { SelectMenu, type SelectMenuOption } from './SelectMenu';

const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: Status[] = ['Not started', 'Working', 'In review', 'Approved', 'Blocked', 'Done'];

function optionLabel(options: Array<string | SelectMenuOption>, value: string) {
  const found = options.find((o) => (typeof o === 'string' ? o === value : o.value === value));
  if (!found) return value;
  return typeof found === 'string' ? found : (found.label ?? found.value);
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<string | SelectMenuOption>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <SelectMenu
        value={value}
        options={options}
        onChange={onChange}
        trigger={(onClick, isOpen) => (
          <button type="button" className={cx('input input-date-trigger', isOpen && 'is-open')} onClick={onClick}>
            {optionLabel(options, value)}
            <i className="ph ph-caret-down cd-i" />
          </button>
        )}
      />
    </div>
  );
}

export function NewTaskModal() {
  const open = useForecastStore((s) => s.newTaskOpen);
  const draft = useForecastStore((s) => s.newTaskDraft);
  const update = useForecastStore((s) => s.updateNewTaskDraft);
  const close = useForecastStore((s) => s.closeNewTask);
  const submit = useForecastStore((s) => s.submitNewTask);
  const campaigns = useForecastStore((s) => s.campaignGroups);
  const clients = useForecastStore((s) => s.clientGroups);
  const categories = useForecastStore((s) => s.categoryGroups);
  const stages = useForecastStore((s) => s.stageGroups);

  if (!open || !draft) return null;

  return (
    <div className="dialog-backdrop" onClick={close}>
      <form
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="dialog-title">New task</div>

        <div className="field">
          <label htmlFor="nt-title">Task name</label>
          <input
            id="nt-title"
            className="input"
            autoFocus
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="e.g. Landing page copy"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="field">
            <label>Timeline</label>
            <DateRangePicker
              start={draft.start}
              end={draft.end}
              onChange={(start, end) => update({ start, end })}
              trigger={(onClick, isOpen) => (
                <button type="button" className={cx('input input-date-trigger', isOpen && 'is-open')} onClick={onClick}>
                  {formatRange(draft.start, draft.end)}
                  <i className="ph ph-calendar-blank cd-i" />
                </button>
              )}
            />
          </div>
          <div className="field">
            <label>Due date</label>
            <DatePicker
              value={draft.dueDate}
              onChange={(dueDate) => update({ dueDate })}
              trigger={(onClick, isOpen) => (
                <button type="button" className={cx('input input-date-trigger', isOpen && 'is-open')} onClick={onClick}>
                  {formatShort(draft.dueDate)}
                  <i className="ph ph-calendar-blank cd-i" />
                </button>
              )}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <SelectField label="Campaign" value={draft.campaign} options={campaigns} onChange={(campaign) => update({ campaign })} />
          <SelectField label="Client" value={draft.client} options={clients} onChange={(client) => update({ client })} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <SelectField label="Priority" value={draft.priority} options={PRIORITIES} onChange={(priority) => update({ priority: priority as Priority })} />
          <SelectField label="Status" value={draft.status} options={STATUSES} onChange={(status) => update({ status: status as Status })} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <SelectField label="Category" value={draft.category} options={categories} onChange={(category) => update({ category })} />
          <SelectField label="Stage" value={draft.stage} options={stages} onChange={(stage) => update({ stage })} />
        </div>

        <div className="field">
          <label>Assigned to</label>
          <AssigneeMultiSelect
            value={draft.assigneeIds}
            onToggle={(id) =>
              update({
                assigneeIds: draft.assigneeIds.includes(id)
                  ? draft.assigneeIds.filter((a) => a !== id)
                  : [...draft.assigneeIds, id],
              })
            }
            trigger={(onClick, isOpen) => (
              <button type="button" className={cx('input input-date-trigger', isOpen && 'is-open')} onClick={onClick}>
                {assigneeSummary(draft.assigneeIds)}
                <i className="ph ph-caret-down cd-i" />
              </button>
            )}
          />
        </div>

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!draft.title.trim()}>
            <i className="ph ph-plus cd-i" />Create task
          </button>
        </div>
      </form>
    </div>
  );
}
