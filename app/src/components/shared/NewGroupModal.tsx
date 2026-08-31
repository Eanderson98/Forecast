import { useForecastStore } from '../../store';

export function NewGroupModal() {
  const open = useForecastStore((s) => s.newGroupOpen);
  const grouping = useForecastStore((s) => s.grouping);
  const draft = useForecastStore((s) => s.newGroupDraft);
  const setDraft = useForecastStore((s) => s.setNewGroupDraft);
  const close = useForecastStore((s) => s.closeNewGroup);
  const submit = useForecastStore((s) => s.submitNewGroup);

  if (!open || (grouping !== 'Campaign' && grouping !== 'Client')) return null;
  const noun = grouping === 'Campaign' ? 'campaign' : 'client';

  return (
    <div className="dialog-backdrop" onClick={close}>
      <form
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="dialog-title">New {noun} group</div>
        <div className="field">
          <label htmlFor="ng-name">{noun === 'campaign' ? 'Campaign' : 'Client'} name</label>
          <input
            id="ng-name"
            className="input"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={noun === 'campaign' ? 'e.g. Q1 launch' : 'e.g. Acme Inc.'}
          />
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
            <i className="ph ph-plus cd-i" />Create group
          </button>
        </div>
      </form>
    </div>
  );
}
