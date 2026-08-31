import { useRef, useState } from 'react';
import { useForecastStore } from '../../store';
import type { CustomColumnType } from '../../types';
import { cx } from '../../utils/cx';
import { AnchoredPopover } from '../shared/AnchoredPopover';

/** The "+" at the end of the Table's column headers — lets you add a Text or Label column. */
export function NewColumnButton({ gridColumn }: { gridColumn: number }) {
  const addCustomColumn = useForecastStore((s) => s.addCustomColumn);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomColumnType>('text');
  const anchorRef = useRef<HTMLDivElement>(null);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addCustomColumn(trimmed, type);
    setName('');
    setType('text');
    setIsOpen(false);
  };

  return (
    <div className="popover-anchor" ref={anchorRef} style={{ gridColumn }}>
      <button
        type="button"
        className={cx('board-add-column', isOpen && 'is-open')}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Add column"
        title="Add column"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <i className="ph ph-plus" />
      </button>

      <AnchoredPopover anchorRef={anchorRef} open={isOpen} onClose={() => setIsOpen(false)} align="right">
        <form
          className="new-column-panel"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="new-column-title">New column</div>
          <input
            className="input"
            autoFocus
            placeholder="Column name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="seg">
            <button type="button" className={cx('seg-opt', type === 'text' && 'is-active')} onClick={() => setType('text')}>
              <i className="ph ph-text-aa" />Text
            </button>
            <button type="button" className={cx('seg-opt', type === 'label' && 'is-active')} onClick={() => setType('label')}>
              <i className="ph ph-tag" />Label
            </button>
          </div>
          <p className="new-column-hint">
            {type === 'text' ? 'A free-text field on each task.' : 'A tag field, like Priority — pick from a list you build as you go.'}
          </p>
          <button type="submit" className="btn btn-primary new-column-submit" disabled={!name.trim()}>
            Add column
          </button>
        </form>
      </AnchoredPopover>
    </div>
  );
}
