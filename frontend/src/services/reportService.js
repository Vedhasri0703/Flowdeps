import axios from '../api/axios';

const reportService = {
  exportTasksCSV: async () => {
    const response = await axios.get('/reports/tasks/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  getDependencyHealth: async () => {
    const response = await axios.get('/reports/dependency-health');
    return response.data.health;
  },

  getTeamPerformance: async () => {
    const response = await axios.get('/reports/team-performance');
    return response.data;
  },

  getTaskAnalytics: async () => {
    const response = await axios.get('/reports/analytics');
    return response.data.analytics;
  },
};

export default reportService;