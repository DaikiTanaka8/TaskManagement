import { useEffect, useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { fetchTasks, toggleComplete, reorderTasks } from '../api/taskApi';
import Column from './Column';
import TaskCard from './TaskCard';
import TaskDetailModal from './TaskDetailModal';

const GENRES = ['仕事', '家庭', '趣味', '買い物', '未設定'];
const DEADLINE_GROUPS = ['今日やること', '今週やること', 'それ以降', '期限なし'];

function getDeadlineGroup(dueDate) {
  if (!dueDate) return '期限なし';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return '今日やること';
  if (diff <= 6) return '今週やること';
  return 'それ以降';
}

function Board() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('genre');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchTasks()
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
        setTasks(sorted);
      })
      .catch(() => setError('タスクの取得に失敗しました。'))
      .finally(() => setLoading(false));
  }, []);

  const handleCardClick = (task) => setSelectedTask(task);

  const handleModalClose = () => {
    setSelectedTask(null);
    setIsCreating(false);
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [...prev, newTask]);
  };

  const handleTaskUpdated = (updated) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleTaskDeleted = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
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
      const activePrev = prev.filter((t) => !t.completed);
      const completedPrev = prev.filter((t) => t.completed);

      const matchesGenre = (task, genre) =>
        genre === '未設定' ? !task.genre || task.genre === '未設定' : task.genre === genre;

      const sourceTasks = activePrev.filter((t) => matchesGenre(t, sourceGenre)).map((t) => ({ ...t }));
      const destTasks =
        sourceGenre === destGenre
          ? sourceTasks
          : activePrev.filter((t) => matchesGenre(t, destGenre)).map((t) => ({ ...t }));

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
      const unchangedActive = activePrev.filter((t) => !changedIds.has(t.id));
      return [...unchangedActive, ...changedTasks, ...completedPrev].sort((a, b) => a.sortOrder - b.sortOrder);
    });
  };

  if (loading) return <p className="board-message">読み込み中...</p>;
  if (error) return <p className="board-message error">{error}</p>;

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const tasksByGenre = GENRES.reduce((acc, genre) => {
    acc[genre] = activeTasks.filter((t) =>
      genre === '未設定' ? !t.genre || t.genre === '未設定' : t.genre === genre
    );
    return acc;
  }, {});

  const tasksByDeadline = DEADLINE_GROUPS.reduce((acc, group) => {
    acc[group] = activeTasks.filter((t) => getDeadlineGroup(t.dueDate) === group);
    return acc;
  }, {});

  return (
    <div className="board-container">
      <div className="board-toolbar">
        <div className="view-toggle">
          <button
            className={`view-toggle-btn${viewMode === 'genre' ? ' active' : ''}`}
            onClick={() => setViewMode('genre')}
          >
            ジャンル別
          </button>
          <button
            className={`view-toggle-btn${viewMode === 'deadline' ? ' active' : ''}`}
            onClick={() => setViewMode('deadline')}
          >
            期限別
          </button>
        </div>
        <button className="add-task-btn" onClick={() => setIsCreating(true)}>
          ＋ タスクを追加
        </button>
      </div>

      {viewMode === 'genre' ? (
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
      ) : (
        <div className="board">
          {DEADLINE_GROUPS.map((group) => (
            <Column
              key={group}
              genre={group}
              tasks={tasksByDeadline[group]}
              onToggleComplete={handleToggleComplete}
              onCardClick={handleCardClick}
              draggable={false}
            />
          ))}
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="completed-area">
          <h3 className="completed-area-title">完了済み（{completedTasks.length}件）</h3>
          <div className="completed-list">
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                index={0}
                onToggleComplete={handleToggleComplete}
                onCardClick={handleCardClick}
                draggable={false}
              />
            ))}
          </div>
        </div>
      )}

      {(selectedTask !== null || isCreating) && (
        <TaskDetailModal
          task={selectedTask}
          onClose={handleModalClose}
          onCreated={handleTaskCreated}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}

export default Board;
