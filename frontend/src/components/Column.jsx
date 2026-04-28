import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

function Column({ genre, tasks, onToggleComplete, onCardClick }) {
  return (
    <div className="column">
      <div className="column-header">
        <span className="column-title">{genre}</span>
        <span className="column-count">{tasks.length}</span>
      </div>
      <Droppable droppableId={genre}>
        {(provided, snapshot) => (
          <div
            className={`column-body${snapshot.isDraggingOver ? ' drag-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onToggleComplete={onToggleComplete}
                onCardClick={onCardClick}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="column-empty">タスクがありません</p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default Column;
