import { useEffect, useState } from 'react';
import { fetchTasks } from '../api/taskApi';
import Column from './Column';

const GENRES = ['仕事', '家庭', '趣味', '買い物', '未設定'];

function Board() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch(() => setError('タスクの取得に失敗しました。'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="board-message">読み込み中...</p>;
  if (error) return <p className="board-message error">{error}</p>;

  const tasksByGenre = GENRES.reduce((acc, genre) => {
    acc[genre] = tasks.filter((t) =>
      genre === '未設定' ? !t.genre || t.genre === '未設定' : t.genre === genre
    );
    return acc;
  }, {});

  return (
    <div className="board">
      {GENRES.map((genre) => (
        <Column key={genre} genre={genre} tasks={tasksByGenre[genre]} />
      ))}
    </div>
  );
}

export default Board;
