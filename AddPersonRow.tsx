import { useState } from 'react';

/** Inline "+ Add person" control — click reveals a name field, Enter commits, Escape cancels. */
export function AddPersonRow({ onAdd, label = 'Add person' }: { onAdd: (name: string) => void; label?: string }) {
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
      <div className="add-person-row is-editing">
        <input
          className="add-person-input"
          value={draft}
          autoFocus
          placeholder="Full name"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            e.stopPropagation();
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
    <button type="button" className="add-person-row" onClick={() => setEditing(true)}>
      <span className="add-person-icon"><i className="ph ph-plus" /></span>
      {label}
    </button>
  );
}
