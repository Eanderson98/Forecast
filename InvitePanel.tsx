import { useRef, useState, type ReactNode } from 'react';
import { useForecastStore } from '../../store';
import { AnchoredPopover } from '../shared/AnchoredPopover';
import { Avatar } from '../shared/Avatar';
import { InviteEmailRow } from '../shared/InviteEmailRow';

/** Shows everyone with access to the current workspace, and lets you invite more by email. */
export function InvitePanel({
  trigger,
  align = 'right',
}: {
  trigger: (onClick: () => void, isOpen: boolean) => ReactNode;
  align?: 'left' | 'right';
}) {
  const people = useForecastStore((s) => s.people);
  const invitePerson = useForecastStore((s) => s.invitePerson);
  const workspace = useForecastStore((s) => s.workspaces.find((w) => w.id === s.activeWorkspaceId));
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="popover-anchor" ref={anchorRef}>
      {trigger(() => setIsOpen((v) => !v), isOpen)}
      <AnchoredPopover anchorRef={anchorRef} open={isOpen} onClose={() => setIsOpen(false)} align={align}>
        <div className="invite-panel">
          <div className="invite-panel-title">People with access</div>
          {workspace && <div className="invite-panel-sub">{workspace.name}</div>}
          <div className="invite-panel-list">
            {people.map((p) => (
              <div className="invite-panel-row" key={p.id}>
                <Avatar initials={p.initials} tone={p.tone} size={28} />
                <span className="invite-panel-name">{p.name}</span>
              </div>
            ))}
          </div>
          <div className="context-menu-divider" />
          <InviteEmailRow onInvite={invitePerson} />
        </div>
      </AnchoredPopover>
    </div>
  );
}
