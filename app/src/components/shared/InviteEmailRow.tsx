import { useState } from 'react';

/** Inline "+ Invite by email" control — click reveals an email field, Enter commits, Escape cancels. */
export function InviteEmailRow({ onInvite }: { onInvite: (email: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onInvite(trimmed);
    setDraft('');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="add-person-row is-editing">
        <input
          type="email"
          className="add-person-input"
          value={draft}
          autoFocus
          placeholder="name@company.com"
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
      Invite by email
    </button>
  );
}
