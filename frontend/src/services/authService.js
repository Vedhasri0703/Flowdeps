import axios from '../api/axios';

const authService = {
  login: async (email, password) => {
    const response = await axios.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await axios.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  forgotPassword: async (email) => {
    const response = await axios.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (email, password, confirmPassword) => {
    const response = await axios.post('/auth/reset-password/direct', { email, password, confirmPassword });
    return response.data;
  },

  changePassword: async (currentPassword, newPassword, confirmNewPassword) => {
    const response = await axios.post('/auth/change-password', { currentPassword, newPassword, confirmNewPassword });
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await axios.put('/auth/profile', profileData);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
};

export default authService;