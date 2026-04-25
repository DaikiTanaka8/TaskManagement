function TaskCard({ task }) {
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
    <div className={`task-card${task.completed ? ' completed' : ''}`}>
      <p className="task-title">{task.title}</p>
      {task.memo && <p className="task-memo">{task.memo}</p>}
      {dueDateLabel && (
        <p className={`task-due ${dueDateClass}`}>期限: {dueDateLabel}</p>
      )}
    </div>
  );
}

export default TaskCard;
