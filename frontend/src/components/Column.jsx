import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

const GENRE_COLORS = {
  '仕事': '#2563eb',
  '家庭': '#16a34a',
  '趣味': '#ea580c',
  '買い物': '#dc2626',
};

function Column({ genre, tasks, onToggleComplete, onCardClick, draggable = true }) {
  const genreColor = GENRE_COLORS[genre] || '#6b7280';
  const bodyContent = (provided, snapshot) => (
    <div
      className={`column-body${snapshot?.isDraggingOver ? ' drag-over' : ''}`}
      ref={provided?.innerRef}
      {...(provided?.droppableProps || {})}
    >
      {tasks.map((task, index) => (
        <TaskCard
          key={task.id}
          task={task}
          index={index}
          onToggleComplete={onToggleComplete}
          onCardClick={onCardClick}
          draggable={draggable}
        />
      ))}
      {provided?.placeholder}
      {tasks.length === 0 && !snapshot?.isDraggingOver && (
        <p className="column-empty">タスクがありません</p>
      )}
    </div>
  );

  return (
    <div className="column" style={{ borderTop: `4px solid ${genreColor}` }}>
      <div className="column-header">
        <span className="column-title" style={{ color: genreColor }}>{genre}</span>
        <span className="column-count">{tasks.length}</span>
      </div>
      {draggable ? (
        <Droppable droppableId={genre}>{bodyContent}</Droppable>
      ) : (
        bodyContent(null, {})
      )}
    </div>
  );
}

export default Column;
