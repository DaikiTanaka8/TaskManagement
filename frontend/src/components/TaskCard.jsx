import { Draggable } from '@hello-pangea/dnd';

function TaskCard({ task, index, onToggleComplete, onCardClick, draggable = true }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dueDateLabel = null;
  let dueDateClass = '';
  if (task.dueDate) {
    const due = new Date(task.dueDate + 'T00:00:00');
    if (due < today) {
      dueDateClass = 'overdue';
      dueDateLabel = task.dueDate;
    } else if (due.getTime() === today.getTime()) {
      dueDateClass = 'today';
      dueDateLabel = '今日';
    } else {
      dueDateClass = 'future';
      dueDateLabel = task.dueDate;
    }
  }

  const cardContent = (provided, snapshot) => (
    <div
      className={`task-card${task.completed ? ' completed' : ''}${snapshot?.isDragging ? ' dragging' : ''}`}
      ref={provided?.innerRef}
      {...(provided?.draggableProps || {})}
      {...(provided?.dragHandleProps || {})}
      onClick={() => onCardClick(task)}
    >
      <div className="task-card-header">
        <button
          className={`complete-btn${task.completed ? ' active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id); }}
          title={task.completed ? '未完了に戻す' : '完了にする'}
        >
          {task.completed ? '✓' : '○'}
        </button>
        <p className="task-title">{task.title}</p>
      </div>
      {task.memo && <p className="task-memo">{task.memo}</p>}
      {dueDateLabel && (
        <span className={`task-due-badge ${dueDateClass}`}>{dueDateLabel}</span>
      )}
    </div>
  );

  if (!draggable) return cardContent(null, {});

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {cardContent}
    </Draggable>
  );
}

export default TaskCard;
