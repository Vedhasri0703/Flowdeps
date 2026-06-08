import axios from '../api/axios';

const userService = {
  getAllUsers: async () => {
    const response = await axios.get('/users');
    return response.data;
  },

  getUserById: async (id) => {
    const response = await axios.get(`/users/${id}`);
    return response.data.user;
  },

  getExecutors: async () => {
    const response = await axios.get('/users/executors');
    return response.data.executors;
  },

  updateUserRole: async (id, role) => {
    const response = await axios.put(`/users/${id}/role`, { role });
    return response.data.user;
  },
};

export default userService;