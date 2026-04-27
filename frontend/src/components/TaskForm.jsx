import { useState } from 'react';
import { createTask } from '../api/taskApi';

const GENRES = ['仕事', '家庭', '趣味', '買い物'];

function TaskForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [genre, setGenre] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const newTask = await createTask({
        title: title.trim(),
        memo: memo.trim() || null,
        dueDate: dueDate || null,
        genre: genre || null,
      });
      setTitle('');
      setMemo('');
      setDueDate('');
      setGenre('');
      onCreated(newTask);
    } catch {
      setError('登録に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2 className="task-form-title">タスクを追加</h2>

      <div className="task-form-field">
        <label htmlFor="title">タイトル <span className="required">*</span></label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タスクのタイトルを入力"
        />
      </div>

      <div className="task-form-field">
        <label htmlFor="memo">メモ</label>
        <textarea
          id="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="メモ（任意）"
          rows={3}
        />
      </div>

      <div className="task-form-row">
        <div className="task-form-field">
          <label htmlFor="dueDate">期限</label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="task-form-field">
          <label htmlFor="genre">ジャンル</label>
          <select id="genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">未設定</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="task-form-error">{error}</p>}

      <button type="submit" className="task-form-submit" disabled={submitting}>
        {submitting ? '登録中...' : '登録する'}
      </button>
    </form>
  );
}

export default TaskForm;
