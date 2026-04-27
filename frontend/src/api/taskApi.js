import axios from 'axios';

export const fetchTasks = () => axios.get('/api/tasks').then((r) => r.data);

export const createTask = (data) => axios.post('/api/tasks', data).then((r) => r.data);
