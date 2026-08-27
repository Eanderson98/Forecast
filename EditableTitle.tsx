import { useState, type ReactNode } from 'react';

/** Double-click to edit inline text — Enter commits, Escape cancels, blur commits. */
export function EditableTitle({
  value,
  onSave,
  className,
  inputClassName,
  renderView,
}: {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  inputClassName?: string;
  /** Customizes the non-editing display, e.g. to add an edit button next to the text. */
  renderView?: (value: string, startEditing: () => void) => ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        className={inputClassName}
        value={draft}
        autoFocus
        onFocus={(e) => e.target.select()}
        onChange={(e) => setDraft(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }

  if (renderView) return <>{renderView(value, startEditing)}</>;

  return (
    <span
      className={className}
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
    >
      {value}
    </span>
  );
}
