import axios from 'axios';

export const fetchTasks = () => axios.get('/api/tasks').then((r) => r.data);
