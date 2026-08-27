import { CURRENT_USER_ID } from '../../data';
import { useForecastStore } from '../../store';
import { formatFullDate, greetingForHour, NOW } from '../../utils/dates';

export function MyWorkHeader() {
  const openNewTask = useForecastStore((s) => s.openNewTask);
  const me = useForecastStore((s) => s.people.find((p) => p.id === CURRENT_USER_ID));
  const firstName = me && me.name !== 'You' ? me.name.split(' ')[0] : null;

  return (
    <>
      <header className="topbar">
        <div className="topbar-titles">
          <div className="topbar-eyebrow">{formatFullDate(NOW)}</div>
          <div className="topbar-title">{greetingForHour(NOW.getHours())}{firstName ? `, ${firstName}` : ''}</div>
        </div>
        <div className="search-box">
          <i className="ph ph-magnifying-glass cd-i" />
          Search everything
        </div>
        <button className="btn btn-secondary" type="button">
          <i className="ph ph-bell cd-i" />
        </button>
        <button className="btn btn-primary" type="button" onClick={() => openNewTask()}>
          <i className="ph ph-plus cd-i" />New task
        </button>
      </header>
      <div className="hr" />
    </>
  );
}
