import { useState } from 'react';
import { CURRENT_USER_ID } from '../../data';
import { useForecastStore } from '../../store';
import { cx } from '../../utils/cx';
import { AddPersonRow } from '../shared/AddPersonRow';
import { Avatar } from '../shared/Avatar';
import { EditableTitle } from '../shared/EditableTitle';

/** Inline-editable email — unlike EditableTitle this allows saving back to empty (no email on file). */
function EditableEmail({ value, onSave }: { value: string; onSave: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
  };

  const commit = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        type="email"
        className="people-row-email-input"
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
    );
  }

  return (
    <span className={cx('people-row-email', !value && 'is-empty')} onDoubleClick={startEditing}>
      {value || 'Add email'}
    </span>
  );
}

export function PeopleView() {
  const people = useForecastStore((s) => s.people);
  const addPerson = useForecastStore((s) => s.addPerson);
  const renamePerson = useForecastStore((s) => s.renamePerson);
  const setPersonEmail = useForecastStore((s) => s.setPersonEmail);
  const deletePerson = useForecastStore((s) => s.deletePerson);

  return (
    <div className="people-body">
      <header className="topbar">
        <div className="topbar-titles">
          <div className="topbar-eyebrow">{people.length} {people.length === 1 ? 'person' : 'people'}</div>
          <div className="topbar-title">People</div>
        </div>
      </header>
      <div className="hr" />
      <div className="people-list">
        <div className="people-row people-row-head">
          <span>Name</span>
          <span>Email</span>
          <span />
        </div>
        {people.map((p) => {
          const isSelf = p.id === CURRENT_USER_ID;
          return (
            <div className="people-row" key={p.id}>
              <div className="people-row-name">
                <Avatar initials={p.initials} tone={p.tone} size={28} />
                <EditableTitle
                  value={p.name}
                  onSave={(name) => renamePerson(p.id, name)}
                  className="people-row-name-text"
                  inputClassName="people-row-name-input"
                />
              </div>
              <EditableEmail value={p.email ?? ''} onSave={(email) => setPersonEmail(p.id, email)} />
              <button
                type="button"
                className="people-row-delete"
                onClick={() => deletePerson(p.id)}
                disabled={isSelf}
                aria-label={`Remove ${p.name}`}
                title={isSelf ? "You can't remove yourself" : `Remove ${p.name}`}
              >
                <i className="ph ph-trash" />
              </button>
            </div>
          );
        })}
        <AddPersonRow onAdd={addPerson} label="Add person" />
      </div>
    </div>
  );
}
