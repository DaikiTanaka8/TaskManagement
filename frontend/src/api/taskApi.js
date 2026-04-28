import axios from 'axios';

export const fetchTasks = () => axios.get('/api/tasks').then((r) => r.data);

export const createTask = (data) => axios.post('/api/tasks', data).then((r) => r.data);

export const toggleComplete = (id) => axios.patch(`/api/tasks/${id}/complete`).then((r) => r.data);

export const reorderTasks = (items) => axios.put('/api/tasks/reorder', { items });
