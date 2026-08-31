import { useRef, useState } from 'react';
import { useForecastStore } from '../../store';
import type { FilterDimension, Priority, Status } from '../../types';
import { cx } from '../../utils/cx';
import { AnchoredPopover } from '../shared/AnchoredPopover';
import { AddPersonRow } from '../shared/AddPersonRow';
import { EditableTitle } from '../shared/EditableTitle';

const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: Status[] = ['Not started', 'Working', 'In review', 'Approved', 'Blocked', 'Done'];

/** One panel combining every common filter dimension, instead of a separate control per field. */
export function FilterButton() {
  const filters = useForecastStore((s) => s.filters);
  const toggleFilterValue = useForecastStore((s) => s.toggleFilterValue);
  const clearFilters = useForecastStore((s) => s.clearFilters);
  const clientGroups = useForecastStore((s) => s.clientGroups);
  const categoryGroups = useForecastStore((s) => s.categoryGroups);
  const addCategory = useForecastStore((s) => s.addCategory);
  const renameCategory = useForecastStore((s) => s.renameCategory);
  const deleteCategory = useForecastStore((s) => s.deleteCategory);
  const [isOpen, setIsOpen] = useState(false);
  const [managingCategories, setManagingCategories] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const count = filters.priority.length + filters.status.length + filters.category.length + filters.client.length;
  const active = count > 0;

  const sections: { key: FilterDimension; title: string; options: string[] }[] = [
    { key: 'priority', title: 'Priority', options: PRIORITIES },
    { key: 'status', title: 'Status', options: STATUSES },
    { key: 'category', title: 'Category', options: categoryGroups },
    { key: 'client', title: 'Client', options: clientGroups },
  ];

  return (
    <div className="popover-anchor" ref={anchorRef}>
      <button
        type="button"
        className={cx('btn btn-secondary', active && 'is-active')}
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <i className="ph ph-funnel cd-i" />Filter
        {active && <span className="person-filter-count">{count}</span>}
      </button>

      <AnchoredPopover anchorRef={anchorRef} open={isOpen} onClose={() => setIsOpen(false)}>
        <div className="filter-panel">
          {sections.map((section, i) => (
            <div key={section.key}>
              {i > 0 && <div className="context-menu-divider" />}
              <div className="filter-section-head">
                <div className="context-menu-section-label">{section.title}</div>
                {section.key === 'category' && (
                  <button
                    type="button"
                    className={cx('filter-section-manage', managingCategories && 'is-active')}
                    onClick={() => setManagingCategories((v) => !v)}
                    aria-label={managingCategories ? 'Done editing categories' : 'Edit categories'}
                    title={managingCategories ? 'Done editing categories' : 'Edit categories'}
                  >
                    <i className={managingCategories ? 'ph ph-check' : 'ph ph-pencil-simple'} />
                  </button>
                )}
              </div>
              {section.key === 'category' && managingCategories ? (
                <div className="person-filter-list">
                  {section.options.map((opt) => (
                    <div className="taxonomy-manage-row" key={opt}>
                      <EditableTitle
                        value={opt}
                        onSave={(newName) => renameCategory(opt, newName)}
                        className="taxonomy-manage-name"
                        inputClassName="taxonomy-manage-input"
                      />
                      <button
                        type="button"
                        className="taxonomy-manage-delete"
                        onClick={() => deleteCategory(opt)}
                        disabled={categoryGroups.length <= 1}
                        aria-label={`Delete ${opt}`}
                        title={categoryGroups.length <= 1 ? 'At least one category is required' : `Delete ${opt}`}
                      >
                        <i className="ph ph-trash" />
                      </button>
                    </div>
                  ))}
                  <AddPersonRow onAdd={addCategory} label="Add category" />
                </div>
              ) : (
                <div className="person-filter-list">
                  {section.options.map((opt) => {
                    const checked = filters[section.key].includes(opt);
                    return (
                      <label className="person-filter-row" key={opt}>
                        <input type="checkbox" checked={checked} onChange={() => toggleFilterValue(section.key, opt)} />
                        <span className="person-filter-check" aria-hidden="true">
                          {checked && <i className="ph ph-check" />}
                        </span>
                        {opt}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className="person-filter-footer">
            <button type="button" className="btn btn-ghost" disabled={!active} onClick={clearFilters}>
              Clear
            </button>
          </div>
        </div>
      </AnchoredPopover>
    </div>
  );
}
