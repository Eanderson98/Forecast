import { BoardHeader } from './components/layout/BoardHeader';
import { MyWorkHeader } from './components/layout/MyWorkHeader';
import { Sidebar } from './components/layout/Sidebar';
import { BoardView } from './components/board/BoardView';
import { KanbanView } from './components/kanban/KanbanView';
import { CalendarView } from './components/calendar/CalendarView';
import { TimelineView } from './components/calendar/TimelineView';
import { MyWorkView } from './components/mywork/MyWorkView';
import { PeopleView } from './components/people/PeopleView';
import { NewGroupModal } from './components/shared/NewGroupModal';
import { NewTaskModal } from './components/shared/NewTaskModal';
import { useForecastStore } from './store';

function BoardsBody() {
  const boardTab = useForecastStore((s) => s.boardTab);
  if (boardTab === 'Table') return <BoardView />;
  if (boardTab === 'Kanban') return <KanbanView />;
  if (boardTab === 'Timeline') return <TimelineView />;
  return <CalendarView />;
}

export default function App() {
  const view = useForecastStore((s) => s.view);
  const hydrated = useForecastStore((s) => s.hydrated);

  if (!hydrated) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-col">
        {view === 'boards' && <BoardHeader />}
        {view === 'mywork' && <MyWorkHeader />}
        <div className="view-body">
          {view === 'boards' && <BoardsBody />}
          {view === 'mywork' && <MyWorkView />}
          {view === 'people' && <PeopleView />}
        </div>
      </div>
      <NewTaskModal />
      <NewGroupModal />
    </div>
  );
}
