import axios from '../api/axios';
import toast from 'react-hot-toast';

const taskService = {
  getAllTasks: async () => {
    const res = await axios.get('/tasks');
    return res.data.tasks;
  },

  getTaskById: async (id) => {
    const res = await axios.get(`/tasks/${id}`);
    return res.data.task;
  },

  createTask: async (taskData) => {
    const res = await axios.post('/tasks/create', taskData);
    // In-app notification (backend also sends email)
    toast.success(`Task "${res.data.task?.title}" created! Email notification sent.`, { duration: 4000 });
    return res.data.task;
  },

  updateTask: async (id, taskData) => {
    const res = await axios.put(`/tasks/${id}`, taskData);
    return res.data.task;
  },

  deleteTask: async (id) => {
    const res = await axios.delete(`/tasks/${id}`);
    return res.data;
  },

  executeTask: async (id, status, actualTime) => {
    const res = await axios.put(`/tasks/execute/${id}`, { status, actualTime });
    return res.data.task;
  },

  addComment: async (id, text) => {
    const res = await axios.post(`/tasks/${id}/comments`, { text });
    return res.data;
  },

  getAvailableTasks: async () => {
    const res = await axios.get('/tasks/available');
    return res.data.tasks;
  },

  getCreatorTasks: async () => {
    const res = await axios.get('/tasks/creator');
    return res.data.tasks;
  },

  getExecutorTasks: async () => {
    const res = await axios.get('/tasks/executor');
    return res.data.tasks;
  },

  getDashboardStats: async () => {
    const res = await axios.get('/tasks/dashboard');
    return res.data.stats;
  },

  getTaskDependencyGraph: async (id) => {
    const res = await axios.get(`/tasks/dependency/${id}`);
    return res.data;
  },
};

export default taskService;
