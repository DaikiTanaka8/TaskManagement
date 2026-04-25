import TaskCard from './TaskCard';

function Column({ genre, tasks }) {
  return (
    <div className="column">
      <div className="column-header">
        <span className="column-title">{genre}</span>
        <span className="column-count">{tasks.length}</span>
      </div>
      <div className="column-body">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className="column-empty">タスクがありません</p>
        )}
      </div>
    </div>
  );
}

export default Column;
