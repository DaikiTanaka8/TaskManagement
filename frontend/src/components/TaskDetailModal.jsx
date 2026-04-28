import { useState } from 'react';
import { updateTask } from '../api/taskApi';

const GENRES = ['仕事', '家庭', '趣味', '買い物', '未設定'];

function TaskDetailModal({ task, onClose, onUpdated }) {
  const [title, setTitle] = useState(task.title);
  const [memo, setMemo] = useState(task.memo || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [genre, setGenre] = useState(task.genre || '未設定');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = () => {
    if (!title.trim()) {
      setError('タイトルは必須です');
      return;
    }
    setSaving(true);
    setError(null);
    updateTask(task.id, {
      title: title.trim(),
      memo: memo || null,
      dueDate: dueDate || null,
      genre: genre === '未設定' ? null : genre,
      sortOrder: task.sortOrder,
    })
      .then((updated) => {
        onUpdated(updated);
        onClose();
      })
      .catch(() => setError('保存に失敗しました。'))
      .finally(() => setSaving(false));
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">タスク詳細</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="task-form-field">
            <label>タイトル <span className="required">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="task-form-field">
            <label>メモ</label>
            <textarea
              rows={3}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          <div className="task-form-row">
            <div className="task-form-field">
              <label>期限</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="task-form-field">
              <label>ジャンル</label>
              <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="task-form-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>キャンセル</button>
          <button className="modal-save" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailModal;
