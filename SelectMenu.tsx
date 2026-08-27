import { useRef, useState, type ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { AnchoredPopover } from './AnchoredPopover';

export interface SelectMenuOption {
  value: string;
  label?: ReactNode;
}

/**
 * Standardized single-choice dropdown: a trigger you render, and a popover list
 * of options with a checkmark on the current value — the same visual language
 * as the right-click context menu, so every "pick one of these" control in the
 * app looks and behaves the same way instead of falling back to a native <select>.
 */
export function SelectMenu({
  value,
  options,
  onChange,
  trigger,
  align = 'left',
  className,
  footer,
  onDeleteOption,
  deleteDisabled,
}: {
  value: string;
  options: Array<string | SelectMenuOption>;
  onChange: (value: string) => void;
  trigger: (onClick: () => void, isOpen: boolean) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
  /** Extra content below the option list, e.g. an "Add option" control. */
  footer?: ReactNode;
  /** When set, each option row gets a trash icon that removes it from the list instead of selecting it. */
  onDeleteOption?: (value: string) => void;
  /** Disables every delete button, e.g. because this is the last remaining option. */
  deleteDisabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const close = () => setIsOpen(false);

  const normalized: SelectMenuOption[] = options.map((o) => (typeof o === 'string' ? { value: o } : o));

  return (
    <div className={cx('popover-anchor', className)} ref={anchorRef}>
      {trigger(() => setIsOpen((v) => !v), isOpen)}
      <AnchoredPopover anchorRef={anchorRef} open={isOpen} onClose={close} align={align}>
        <div className="select-menu-panel">
          {normalized.map((opt) => (
            <div key={opt.value} className={cx('select-menu-row', onDeleteOption && 'has-delete')}>
              <button
                type="button"
                className="context-menu-item"
                onClick={() => {
                  onChange(opt.value);
                  close();
                }}
              >
                <span className={cx('context-menu-check', opt.value === value && 'is-current')}>
                  {opt.value === value && <i className="ph ph-check" />}
                </span>
                {opt.label ?? opt.value}
              </button>
              {onDeleteOption && (
                <button
                  type="button"
                  className="select-menu-row-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteOption(opt.value);
                  }}
                  disabled={deleteDisabled}
                  aria-label={`Delete ${opt.label ?? opt.value}`}
                  title={deleteDisabled ? 'At least one option is required' : `Delete ${opt.label ?? opt.value}`}
                >
                  <i className="ph ph-trash" />
                </button>
              )}
            </div>
          ))}
          {footer}
        </div>
      </AnchoredPopover>
    </div>
  );
}
