import { useForecastStore } from '../../store';
import type { BoardTab, Grouping } from '../../types';
import { monthLabel } from '../../utils/dates';
import { exportTableToXlsx } from '../../utils/exportTable';
import { Avatar } from '../shared/Avatar';
import { SelectMenu } from '../shared/SelectMenu';
import { FilterButton } from './FilterButton';
import { InvitePanel } from './InvitePanel';
import { PersonFilterButton } from './PersonFilterButton';
import { TimelineGroupSwitcher } from './TimelineGroupSwitcher';
import { cx } from '../../utils/cx';

const GROUPINGS: Grouping[] = ['Campaign', 'Client', 'Status'];

const TABS: BoardTab[] = ['Table', 'Kanban', 'Calendar', 'Timeline'];

export function BoardHeader() {
  const boardTab = useForecastStore((s) => s.boardTab);
  const setBoardTab = useForecastStore((s) => s.setBoardTab);
  const grouping = useForecastStore((s) => s.grouping);
  const setGrouping = useForecastStore((s) => s.setGrouping);
  const openNewTask = useForecastStore((s) => s.openNewTask);
  const openNewGroup = useForecastStore((s) => s.openNewGroup);
  const stageGroups = useForecastStore((s) => s.stageGroups);
  const addStage = useForecastStore((s) => s.addStage);
  const calendarMonth = useForecastStore((s) => s.calendarMonth);
  const calendarPrev = useForecastStore((s) => s.calendarPrev);
  const calendarNext = useForecastStore((s) => s.calendarNext);
  const calendarToday = useForecastStore((s) => s.calendarToday);
  const isCalendarTab = boardTab === 'Calendar' || boardTab === 'Timeline';
  const searchQuery = useForecastStore((s) => s.searchQuery);
  const setSearchQuery = useForecastStore((s) => s.setSearchQuery);
  const workspace = useForecastStore((s) => s.workspaces.find((w) => w.id === s.activeWorkspaceId));
  const breadcrumb = workspace ? `${workspace.name} / ${workspace.category}` : '';
  const people = useForecastStore((s) => s.people);

  return (
    <>
      <header className="topbar">
        <div className="topbar-titles">
          <div className="topbar-eyebrow">{breadcrumb}</div>
          {boardTab === 'Timeline' ? (
            <TimelineGroupSwitcher />
          ) : (
            <div className="topbar-title">
              {workspace?.name}
              <i className="ph ph-star cd-i" style={{ color: 'color-mix(in srgb, var(--color-text) 40%, transparent)' }} />
            </div>
          )}
        </div>
        <div className="search-box">
          <i className="ph ph-magnifying-glass cd-i" />
          <input
            className="search-box-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
          />
          {searchQuery && (
            <button type="button" className="search-box-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
              <i className="ph ph-x" />
            </button>
          )}
        </div>
        <InvitePanel
          trigger={(onClick, isOpen) => (
            <button
              type="button"
              className={cx('avatar-stack-trigger', isOpen && 'is-open')}
              onClick={onClick}
              aria-haspopup="true"
              aria-expanded={isOpen}
              aria-label="People with access"
            >
              <div className="avatar-stack">
                {people.slice(0, 3).map((p) => (
                  <Avatar key={p.id} initials={p.initials} tone={p.tone} size={28} ringed />
                ))}
                {people.length > 3 && <span className="avatar-stack-overflow">+{people.length - 3}</span>}
              </div>
            </button>
          )}
        />
        <button className="btn btn-secondary" type="button" aria-label="Notifications">
          <i className="ph ph-bell cd-i" />
        </button>
        <InvitePanel
          trigger={(onClick, isOpen) => (
            <button type="button" className={cx('btn btn-primary', isOpen && 'is-active')} onClick={onClick} aria-haspopup="true" aria-expanded={isOpen}>
              <i className="ph ph-user-plus cd-i" />Invite
            </button>
          )}
        />
      </header>

      <div className="toolbar-row">
        <div className="view-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={cx('view-tab', boardTab === tab && 'is-active')}
              onClick={() => setBoardTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {isCalendarTab && (
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 70%, transparent)' }}>
            {monthLabel(calendarMonth)}
          </span>
        )}

        <div className="toolbar-actions">
          {boardTab === 'Table' && (
            <>
              <FilterButton />
              <PersonFilterButton />
              <SelectMenu
                value={grouping}
                options={GROUPINGS}
                onChange={(g) => setGrouping(g as Grouping)}
                align="right"
                trigger={(onClick, isOpen) => (
                  <button className={cx('btn btn-secondary', isOpen && 'is-active')} type="button" onClick={onClick}>
                    <i className="ph ph-stack cd-i" />Group: {grouping}
                  </button>
                )}
              />
              <button
                className="btn btn-secondary"
                type="button"
                onClick={openNewGroup}
                disabled={grouping === 'Status'}
                title={grouping === 'Status' ? 'Switch to Campaign or Client grouping to add a new group' : undefined}
              >
                <i className="ph ph-folder-plus cd-i" />New group
              </button>
              <button className="btn btn-secondary" type="button" onClick={exportTableToXlsx} title="Export the current table view to an Excel file">
                <i className="ph ph-download-simple cd-i" />Export
              </button>
            </>
          )}

          {boardTab === 'Kanban' && (
            <>
              <FilterButton />
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  let name = 'New stage';
                  let n = 1;
                  while (stageGroups.some((s) => s.toLowerCase() === name.toLowerCase())) {
                    n += 1;
                    name = `New stage ${n}`;
                  }
                  addStage(name);
                }}
              >
                <i className="ph ph-columns cd-i" />New stage
              </button>
            </>
          )}

          {isCalendarTab && (
            <>
              <button className="btn btn-secondary" type="button" onClick={calendarPrev} aria-label="Previous month">
                <i className="ph ph-caret-left cd-i" />
              </button>
              <button className="btn btn-secondary" type="button" onClick={calendarToday}>
                Today
              </button>
              <button className="btn btn-secondary" type="button" onClick={calendarNext} aria-label="Next month">
                <i className="ph ph-caret-right cd-i" />
              </button>
            </>
          )}

          <button className="btn btn-primary" type="button" onClick={() => openNewTask()}>
            <i className="ph ph-plus cd-i" />New task
          </button>
        </div>
      </div>
      <div className="hr" />
    </>
  );
}
