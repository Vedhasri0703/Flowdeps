import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';

import Login from '../pages/Auth/Login';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import Landing from '../pages/Landing/Landing';
import CreatorDashboard from '../pages/Dashboard/CreatorDashboard';
import ExecutorDashboard from '../pages/Dashboard/ExecutorDashboard';
import TaskList from '../pages/Tasks/TaskList';
import AllTasks from '../pages/Tasks/AllTasks';
import TaskDetail from '../pages/Tasks/TaskDetail';
import CreateTask from '../pages/Tasks/CreateTask';
import EditTask from '../pages/Tasks/EditTask';
import AvailableTasks from '../pages/Executor/AvailableTasks';
import Reports from '../pages/Reports/Reports';
import Profile from '../pages/Profile/Profile';
import Notifications from '../pages/Notifications/Notifications';

const AppRouter = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div className="spinner" />
    </div>
  );

  if (!user) return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Navigate to="/login?tab=signup" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={user.role === 'creator' ? <CreatorDashboard /> : <ExecutorDashboard />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/all-tasks" element={<AllTasks />} />
        {/* Specific routes BEFORE :id */}
        <Route path="/tasks/create" element={user.role === 'creator' ? <CreateTask /> : <Navigate to="/tasks" replace />} />
        <Route path="/tasks/edit/:id" element={user.role === 'creator' ? <EditTask /> : <Navigate to="/tasks" replace />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/available-tasks" element={user.role === 'executor' ? <AvailableTasks /> : <Navigate to="/tasks" replace />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reports" element={user.role === 'creator' ? <Reports /> : <Navigate to="/dashboard" replace />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default AppRouter;
