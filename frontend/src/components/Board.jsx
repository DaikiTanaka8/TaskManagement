import { useEffect, useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { fetchTasks, toggleComplete, reorderTasks } from '../api/taskApi';
import Column from './Column';
import TaskForm from './TaskForm';
import TaskDetailModal from './TaskDetailModal';

const GENRES = ['仕事', '家庭', '趣味', '買い物', '未設定'];

function Board() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks()
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
        setTasks(sorted);
      })
      .catch(() => setError('タスクの取得に失敗しました。'))
      .finally(() => setLoading(false));
  }, []);

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [...prev, newTask]);
  };

  const handleCardClick = (task) => setSelectedTask(task);

  const handleModalClose = () => setSelectedTask(null);

  const handleTaskUpdated = (updated) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleToggleComplete = (id) => {
    toggleComplete(id)
      .then((updated) => {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      })
      .catch(() => alert('完了状態の更新に失敗しました。'));
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceGenre = source.droppableId;
    const destGenre = destination.droppableId;

    setTasks((prev) => {
      const matchesGenre = (task, genre) =>
        genre === '未設定' ? !task.genre || task.genre === '未設定' : task.genre === genre;

      const sourceTasks = prev.filter((t) => matchesGenre(t, sourceGenre)).map((t) => ({ ...t }));
      const destTasks =
        sourceGenre === destGenre
          ? sourceTasks
          : prev.filter((t) => matchesGenre(t, destGenre)).map((t) => ({ ...t }));

      const [moved] = sourceTasks.splice(source.index, 1);
      moved.genre = destGenre === '未設定' ? null : destGenre;
      destTasks.splice(destination.index, 0, moved);

      sourceTasks.forEach((t, i) => { t.sortOrder = i; });
      if (sourceGenre !== destGenre) {
        destTasks.forEach((t, i) => { t.sortOrder = i; });
      }

      const changedTasks = sourceGenre === destGenre ? sourceTasks : [...sourceTasks, ...destTasks];
      reorderTasks(changedTasks.map((t) => ({ id: t.id, sortOrder: t.sortOrder, genre: t.genre })))
        .catch(() => alert('並び替えの保存に失敗しました。'));

      const changedIds = new Set(changedTasks.map((t) => t.id));
      const unchanged = prev.filter((t) => !changedIds.has(t.id));
      return [...unchanged, ...changedTasks].sort((a, b) => a.sortOrder - b.sortOrder);
    });
  };

  if (loading) return <p className="board-message">読み込み中...</p>;
  if (error) return <p className="board-message error">{error}</p>;

  const tasksByGenre = GENRES.reduce((acc, genre) => {
    acc[genre] = tasks.filter((t) =>
      genre === '未設定' ? !t.genre || t.genre === '未設定' : t.genre === genre
    );
    return acc;
  }, {});

  return (
    <div className="board-container">
      <TaskForm onCreated={handleTaskCreated} />
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board">
          {GENRES.map((genre) => (
            <Column
              key={genre}
              genre={genre}
              tasks={tasksByGenre[genre]}
              onToggleComplete={handleToggleComplete}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </DragDropContext>
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={handleModalClose}
          onUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
}

export default Board;
