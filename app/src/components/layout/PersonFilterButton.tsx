import { useRef, useState } from 'react';
import { useForecastStore } from '../../store';
import type { PersonFilterMode } from '../../types';
import { cx } from '../../utils/cx';
import { useClickOutside } from '../../utils/useClickOutside';
import { AddPersonRow } from '../shared/AddPersonRow';
import { Avatar } from '../shared/Avatar';

export function PersonFilterButton() {
  const people = useForecastStore((s) => s.people);
  const personFilter = useForecastStore((s) => s.personFilter);
  const personFilterMode = useForecastStore((s) => s.personFilterMode);
  const togglePersonFilter = useForecastStore((s) => s.togglePersonFilter);
  const setPersonFilterMode = useForecastStore((s) => s.setPersonFilterMode);
  const clearPersonFilter = useForecastStore((s) => s.clearPersonFilter);
  const addPerson = useForecastStore((s) => s.addPerson);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useClickOutside(rootRef, open, () => setOpen(false));

  const active = personFilter.length > 0;

  return (
    <div className="person-filter" ref={rootRef}>
      <button
        type="button"
        className={cx('btn btn-secondary', active && 'is-active')}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <i className="ph ph-users cd-i" />
        Person
        {active && <span className="person-filter-count">{personFilter.length}</span>}
      </button>

      {open && (
        <div className="person-filter-panel">
          <div className="person-filter-list">
            {people.map((p) => {
              const checked = personFilter.includes(p.id);
              return (
                <label className="person-filter-row" key={p.id}>
                  <input type="checkbox" checked={checked} onChange={() => togglePersonFilter(p.id)} />
                  <span className="person-filter-check" aria-hidden="true">
                    {checked && <i className="ph ph-check" />}
                  </span>
                  <Avatar initials={p.initials} tone={p.tone} size={22} />
                  <span>{p.name}</span>
                </label>
              );
            })}
          </div>

          <div className="context-menu-divider" />
          <AddPersonRow onAdd={addPerson} />

          {personFilter.length >= 2 && (
            <div className="person-filter-mode">
              <div className="person-filter-mode-label">Match</div>
              <div className="seg">
                {(['any', 'all'] as PersonFilterMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={cx('seg-opt', personFilterMode === mode && 'is-active')}
                    onClick={() => setPersonFilterMode(mode)}
                  >
                    {mode === 'any' ? 'Any of them' : 'Both / all of them'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="person-filter-footer">
            <button type="button" className="btn btn-ghost" disabled={!active} onClick={clearPersonFilter}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
