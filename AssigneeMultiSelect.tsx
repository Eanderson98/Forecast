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

  return (
    <div className="popover-anchor" ref={anchorRef}>
      {trigger(() => setIsOpen((v) => !v), isOpen)}
      <AnchoredPopover anchorRef={anchorRef} open={isOpen} onClose={() => setIsOpen(false)} align={align}>
        <div className="assignee-picker-panel">
          {people.map((p) => {
            const checked = value.includes(p.id);
            return (
              <label className="person-filter-row" key={p.id}>
                <input type="checkbox" checked={checked} onChange={() => onToggle(p.id)} />
                <span className="person-filter-check" aria-hidden="true">
                  {checked && <i className="ph ph-check" />}
                </span>
                <Avatar initials={p.initials} tone={p.tone} size={22} />
                <span>{p.name}</span>
              </label>
            );
          })}
          <div className="context-menu-divider" />
          <AddPersonRow onAdd={(name) => onToggle(addPerson(name))} />
        </div>
      </AnchoredPopover>
    </div>
  );
}
