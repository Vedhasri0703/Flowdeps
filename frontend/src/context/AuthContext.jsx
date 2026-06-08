import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    // default is dark
    return saved ? saved === 'dark' : true;
  });

  /* ── apply theme class to body ── */
  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  /* ── restore session ── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        fetchUserProfile();
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get('/auth/me');
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (e) {
      console.error('Profile fetch error:', e);
    }
  };

  /* ── LOGIN ── */
  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { token, user: u } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      toast.success(`Welcome back, ${u.name}!`);
      return { success: true };
    } catch (e) {
      const msg = e.response?.data?.message || 'Login failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  /* ── REGISTER ── */
  const register = async (userData) => {
    try {
      const res = await axios.post('/auth/register', userData);
      const { token, user: u } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      toast.success(`Account created! Welcome, ${u.name}!`);
      return { success: true };
    } catch (e) {
      const msg = e.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  /* ── LOGOUT ── */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const toggleDarkMode = () => setDarkMode(d => !d);

  return (
    <AuthContext.Provider value={{
      user, loading, darkMode,
      login, register, logout,
      toggleDarkMode, fetchUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
