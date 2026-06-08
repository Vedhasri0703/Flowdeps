import axios from '../api/axios';

const aiService = {
  getDependencySuggestions: async (title, description, taskId = null) => {
    const res = await axios.post('/ai/dependencies/suggest', { title, description, taskId });
    return res.data;
  },

  getRiskScore: async (taskId) => {
    const res = await axios.get(`/ai/risk/${taskId}`);
    return res.data;
  },

  recommendPriority: async (title, description, dueDate, taskDependencies = []) => {
    const res = await axios.post('/ai/priority/recommend', { title, description, dueDate, taskDependencies });
    return res.data;
  },

  predictDelay: async (taskId) => {
    const res = await axios.get(`/ai/delay/${taskId}`);
    return res.data;
  },

  recommendExecutor: async (taskId) => {
    const res = await axios.get(`/ai/executor/recommend/${taskId}`);
    return res.data;
  },

  getCriticalPath: async () => {
    const res = await axios.get('/ai/critical-path');
    return res.data;
  },
};

export default aiService;
