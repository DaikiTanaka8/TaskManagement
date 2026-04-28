import { Draggable } from '@hello-pangea/dnd';

function TaskCard({ task, index, onToggleComplete }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dueDateLabel = null;
  let dueDateClass = '';
  if (task.dueDate) {
    const due = new Date(task.dueDate);
    dueDateLabel = task.dueDate;
    if (due < today) {
      dueDateClass = 'overdue';
    } else if (due.getTime() === today.getTime()) {
      dueDateClass = 'today';
    }
  }

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          className={`task-card${task.completed ? ' completed' : ''}${snapshot.isDragging ? ' dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="task-card-header">
            <button
              className={`complete-btn${task.completed ? ' active' : ''}`}
              onClick={() => onToggleComplete(task.id)}
              title={task.completed ? '未完了に戻す' : '完了にする'}
            >
              {task.completed ? '✓' : '○'}
            </button>
            <p className="task-title">{task.title}</p>
          </div>
          {task.memo && <p className="task-memo">{task.memo}</p>}
          {dueDateLabel && (
            <p className={`task-due ${dueDateClass}`}>期限: {dueDateLabel}</p>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default TaskCard;
