import { countDescendants } from '../../selectors';
import { useForecastStore } from '../../store';
import type { Status, Task } from '../../types';
import { cx } from '../../utils/cx';

const STATUSES: Status[] = ['Not started', 'Working', 'In review', 'Approved', 'Blocked', 'Done'];

export type MoveDimension = 'Campaign' | 'Client' | 'Stage' | 'Status';

interface Section {
  title: string;
  options: string[];
  current: string;
  onSelect: (value: string) => void;
}

export function TaskContextMenu({
  task,
  primaryMove,
  onClose,
}: {
  task: Task;
  primaryMove: MoveDimension;
  onClose: () => void;
}) {
  const campaignGroups = useForecastStore((s) => s.campaignGroups);
  const clientGroups = useForecastStore((s) => s.clientGroups);
  const stageGroups = useForecastStore((s) => s.stageGroups);
  const setCampaign = useForecastStore((s) => s.setCampaign);
  const setClient = useForecastStore((s) => s.setClient);
  const setStatus = useForecastStore((s) => s.setStatus);
  const moveTaskStage = useForecastStore((s) => s.moveTaskStage);
  const addSubtask = useForecastStore((s) => s.addSubtask);
  const deleteTask = useForecastStore((s) => s.deleteTask);
  const tasks = useForecastStore((s) => s.tasks);
  const descendantCount = countDescendants(tasks, task.id);

  const moveSection: Section | null =
    primaryMove === 'Campaign'
      ? { title: 'Move to campaign', options: campaignGroups, current: task.campaign, onSelect: (v) => setCampaign(task.id, v) }
      : primaryMove === 'Client'
        ? { title: 'Move to client', options: clientGroups, current: task.client, onSelect: (v) => setClient(task.id, v) }
        : primaryMove === 'Stage'
          ? { title: 'Move to stage', options: stageGroups, current: task.stage, onSelect: (v) => moveTaskStage(task.id, v) }
          : null;

  const statusSection: Section = {
    title: 'Change status',
    options: STATUSES,
    current: task.status,
    onSelect: (v) => setStatus(task.id, v as Status),
  };

  const sections = moveSection ? [moveSection, statusSection] : [statusSection];

  return (
    <>
      <div className="context-menu-title">{task.title}</div>
      <button
        type="button"
        className="context-menu-item"
        onClick={() => {
          addSubtask(task.id);
          onClose();
        }}
      >
        <span className="context-menu-check"><i className="ph ph-plus" /></span>
        Add subtask
      </button>
      <div className="context-menu-divider" />
      {sections.map((section, i) => (
        <div key={section.title}>
          {i > 0 && <div className="context-menu-divider" />}
          <div className="context-menu-section-label">{section.title}</div>
          {section.options.map((opt) => (
            <button
              key={opt}
              type="button"
              className="context-menu-item"
              onClick={() => {
                section.onSelect(opt);
                onClose();
              }}
            >
              <span className={cx('context-menu-check', opt === section.current && 'is-current')}>
                {opt === section.current && <i className="ph ph-check" />}
              </span>
              {opt}
            </button>
          ))}
        </div>
      ))}
      <div className="context-menu-divider" />
      <button
        type="button"
        className="context-menu-item is-danger"
        onClick={() => {
          deleteTask(task.id);
          onClose();
        }}
      >
        <span className="context-menu-check"><i className="ph ph-trash" /></span>
        {task.parentId ? 'Delete subtask' : 'Delete task'}
        {descendantCount > 0 && ` (+${descendantCount} subtask${descendantCount === 1 ? '' : 's'})`}
      </button>
    </>
  );
}
