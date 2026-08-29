import { useRef, useState, type ReactNode } from 'react';
import { useForecastStore } from '../../store';
import { peopleFor } from '../../utils/people';
import { AddPersonRow } from './AddPersonRow';
import { AnchoredPopover } from './AnchoredPopover';
import { Avatar } from './Avatar';

/** Overlapping avatar stack, reusing the same visual as the topbar's avatar-stack. */
export function AvatarStack({ ids, size = 24 }: { ids: string[]; size?: number }) {
  const people = peopleFor(ids).slice(0, 3);
  if (people.length === 0) return null;
  return (
    <div className="avatar-stack">
      {people.map((p) => (
        <Avatar key={p.id} initials={p.initials} tone={p.tone} size={size} ringed />
      ))}
    </div>
  );
}

/**
 * Standardized multi-choice dropdown for assigning several people to one task —
 * a checkbox list of everyone, like the header's Person filter, but writing
 * back into a single task's assignees instead of filtering the board. Also lets
 * you add someone new to the roster right from the list.
 *
 * Assigned people are split into their own labeled group at the top (full name
 * and avatar, one row each) so clicking the trigger always shows exactly who's
 * on the task at a glance, rather than that being buried in the full roster.
 */
export function AssigneeMultiSelect({
  value,
  onToggle,
  trigger,
  align = 'left',
}: {
  value: string[];
  onToggle: (personId: string) => void;
  trigger: (onClick: () => void, isOpen: boolean) => ReactNode;
  align?: 'left' | 'right';
}) {
  const people = useForecastStore((s) => s.people);
  const addPerson = useForecastStore((s) => s.addPerson);
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const assigned = people.filter((p) => value.includes(p.id));
  const rest = people.filter((p) => !value.includes(p.id));

  return (
    <div className="popover-anchor" ref={anchorRef}>
      {trigger(() => setIsOpen((v) => !v), isOpen)}
      <AnchoredPopover anchorRef={anchorRef} open={isOpen} onClose={() => setIsOpen(false)} align={align}>
        <div className="assignee-picker-panel">
          {assigned.length > 0 && (
            <>
              <div className="person-filter-mode-label">Assigned ({assigned.length})</div>
              {assigned.map((p) => (
                <label className="person-filter-row" key={p.id}>
                  <input type="checkbox" checked onChange={() => onToggle(p.id)} />
                  <span className="person-filter-check" aria-hidden="true">
                    <i className="ph ph-check" />
                  </span>
                  <Avatar initials={p.initials} tone={p.tone} size={22} />
                  <span>{p.name}</span>
                </label>
              ))}
              <div className="context-menu-divider" />
              <div className="person-filter-mode-label">Add someone</div>
            </>
          )}
          {rest.map((p) => (
            <label className="person-filter-row" key={p.id}>
              <input type="checkbox" checked={false} onChange={() => onToggle(p.id)} />
              <span className="person-filter-check" aria-hidden="true" />
              <Avatar initials={p.initials} tone={p.tone} size={22} />
              <span>{p.name}</span>
            </label>
          ))}
          <div className="context-menu-divider" />
          <AddPersonRow onAdd={(name) => onToggle(addPerson(name))} />
        </div>
      </AnchoredPopover>
    </div>
  );
}
