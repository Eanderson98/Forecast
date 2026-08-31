import { useRef, useState } from 'react';
import { useForecastStore } from '../../store';
import type { NavKey } from '../../types';
import { cx } from '../../utils/cx';
import { AnchoredPopover } from '../shared/AnchoredPopover';

const NAV_ITEMS: { key: NavKey; icon: string; label: string }[] = [
  { key: 'boards', icon: 'ph-rows', label: 'Boards' },
  { key: 'mywork', icon: 'ph-user-focus', label: 'My work' },
  { key: 'calendar', icon: 'ph-calendar-blank', label: 'Calendar' },
  { key: 'updates', icon: 'ph-tray', label: 'Updates' },
  { key: 'dashboard', icon: 'ph-chart-bar', label: 'Dashboard' },
  { key: 'people', icon: 'ph-users', label: 'People' },
];

/** A named, selectable row with a hover-to-reveal rename pencil — shared by the Workspaces list and the Client switcher. */
function SidebarListRow({
  name,
  isActive,
  onSelect,
  onRename,
}: {
  name: string;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

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
      <div className="sidebar-workspace is-editing">
        <span className="sidebar-workspace-dot" />
        <input
          ref={inputRef}
          className="sidebar-workspace-input"
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
      </div>
    );
  }

  return (
    <div className={cx('sidebar-workspace', isActive && 'is-active')}>
      <button type="button" className="sidebar-workspace-select" onClick={onSelect}>
        <span className="sidebar-workspace-dot" />
        <span className="sidebar-workspace-name">{name}</span>
      </button>
      <button
        type="button"
        className="sidebar-workspace-edit"
        onClick={startEditing}
        aria-label={`Rename ${name}`}
        title={`Rename ${name}`}
      >
        <i className="ph ph-pencil-simple" />
      </button>
    </div>
  );
}

/** The trailing "+ Add" row for a SidebarListRow list. */
function AddSidebarListRow({ onAdd, placeholder, label }: { onAdd: (name: string) => void; placeholder: string; label: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onAdd(trimmed);
    setDraft('');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="sidebar-workspace is-editing">
        <span className="sidebar-workspace-dot" />
        <input
          className="sidebar-workspace-input"
          value={draft}
          autoFocus
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft('');
              setEditing(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <button type="button" className="sidebar-workspace-add" onClick={() => setEditing(true)}>
      <span className="sidebar-workspace-add-icon"><i className="ph ph-plus" /></span>
      {label}
    </button>
  );
}

export function Sidebar() {
  const activeNav = useForecastStore((s) => s.activeNav);
  const setNav = useForecastStore((s) => s.setNav);
  const workspaces = useForecastStore((s) => s.workspaces);
  const activeWorkspaceId = useForecastStore((s) => s.activeWorkspaceId);
  const setWorkspace = useForecastStore((s) => s.setWorkspace);
  const renameWorkspace = useForecastStore((s) => s.renameWorkspace);
  const addWorkspace = useForecastStore((s) => s.addWorkspace);
  const clients = useForecastStore((s) => s.clients);
  const setActiveClient = useForecastStore((s) => s.setActiveClient);
  const addClient = useForecastStore((s) => s.addClient);
  const renameClient = useForecastStore((s) => s.renameClient);
  const updatesCount = useForecastStore((s) => s.updates.length);
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const clientAnchorRef = useRef<HTMLDivElement>(null);

  const activeClientId = workspaces.find((w) => w.id === activeWorkspaceId)?.clientId ?? clients[0]?.id;
  const activeClient = clients.find((c) => c.id === activeClientId);
  const clientWorkspaces = workspaces.filter((w) => w.clientId === activeClientId);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">F</span>
        <span className="sidebar-brand-name">Forecast</span>
      </div>

      <div className="popover-anchor sidebar-client" ref={clientAnchorRef}>
        <button
          type="button"
          className={cx('sidebar-client-trigger', clientMenuOpen && 'is-open')}
          onClick={() => setClientMenuOpen((v) => !v)}
        >
          <i className="ph ph-buildings cd-i" />
          <span className="sidebar-client-name">{activeClient?.name}</span>
          <i className="ph ph-caret-down cd-i sidebar-client-caret" />
        </button>
        <AnchoredPopover anchorRef={clientAnchorRef} open={clientMenuOpen} onClose={() => setClientMenuOpen(false)}>
          <div className="select-menu-panel">
            {clients.map((c) => (
              <SidebarListRow
                key={c.id}
                name={c.name}
                isActive={c.id === activeClientId}
                onSelect={() => {
                  setActiveClient(c.id);
                  setClientMenuOpen(false);
                }}
                onRename={(name) => renameClient(c.id, name)}
              />
            ))}
            <AddSidebarListRow
              onAdd={(name) => {
                addClient(name);
                setClientMenuOpen(false);
              }}
              placeholder="Client name"
              label="New client"
            />
          </div>
        </AnchoredPopover>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={cx('sidebar-nav-item', activeNav === item.key && 'is-active')}
            onClick={() => setNav(item.key)}
          >
            <i className={cx('ph', item.icon, 'cd-i')} />
            {item.label}
            {item.key === 'updates' && updatesCount > 0 && <span className="sidebar-nav-badge">{updatesCount}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Workspaces</div>
        {clientWorkspaces.map((ws) => (
          <SidebarListRow
            key={ws.id}
            name={ws.name}
            isActive={ws.id === activeWorkspaceId}
            onSelect={() => setWorkspace(ws.id)}
            onRename={(name) => renameWorkspace(ws.id, name)}
          />
        ))}
        <AddSidebarListRow onAdd={addWorkspace} placeholder="Workspace name" label="New workspace" />
      </div>
    </aside>
  );
}
