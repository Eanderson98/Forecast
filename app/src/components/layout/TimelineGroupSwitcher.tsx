import { useRef, useState } from 'react';
import { useForecastStore } from '../../store';
import { cx } from '../../utils/cx';
import { useClickOutside } from '../../utils/useClickOutside';

/** Replaces the static board title with a clickable board/group switcher — Timeline-tab only. */
export function TimelineGroupSwitcher() {
  const campaignGroups = useForecastStore((s) => s.campaignGroups);
  const boardName = useForecastStore((s) => s.workspaces.find((w) => w.id === s.activeWorkspaceId)?.name ?? '');
  const timelineGroupId = useForecastStore((s) => s.timelineGroupId);
  const setTimelineGroup = useForecastStore((s) => s.setTimelineGroup);
  const savedDefault = useForecastStore((s) => s.savedDefaultTimelineGroup);
  const saveDefault = useForecastStore((s) => s.saveTimelineGroupAsDefault);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useClickOutside(rootRef, open, () => setOpen(false));

  const isDefault = savedDefault !== undefined && savedDefault === timelineGroupId;
  const label = timelineGroupId ?? boardName;

  return (
    <div className="group-switcher" ref={rootRef}>
      <button
        type="button"
        className="group-switcher-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {label}
        <i className="ph ph-caret-down cd-i" style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 45%, transparent)' }} />
      </button>
      <button
        type="button"
        className={cx('group-switcher-star', isDefault && 'is-default')}
        onClick={saveDefault}
        aria-pressed={isDefault}
        title={isDefault ? 'This is your saved default view' : 'Save as the default view for next time'}
      >
        <i className="ph ph-star cd-i" />
      </button>

      {open && (
        <div className="group-switcher-panel">
          <button
            type="button"
            className={cx('group-switcher-option', timelineGroupId === null && 'is-active')}
            onClick={() => {
              setTimelineGroup(null);
              setOpen(false);
            }}
          >
            {boardName}
            <span className="group-switcher-hint">whole board</span>
          </button>
          {campaignGroups.map((g) => (
            <button
              key={g}
              type="button"
              className={cx('group-switcher-option', timelineGroupId === g && 'is-active')}
              onClick={() => {
                setTimelineGroup(g);
                setOpen(false);
              }}
            >
              {g}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
