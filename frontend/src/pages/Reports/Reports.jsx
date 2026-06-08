import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import toast from 'react-hot-toast';
import { RiDownloadLine, RiTimeLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const Reports = () => {
  const { darkMode } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [teamPerf, setTeamPerf] = useState(null);
  const [depHealth, setDepHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [a, t, d] = await Promise.all([
        axios.get('/reports/analytics'),
        axios.get('/reports/team-performance'),
        axios.get('/reports/dependency-health'),
      ]);
      setAnalytics(a.data.analytics);
      setTeamPerf(t.data);
      setDepHealth(d.data);
    } catch (e) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await axios.get('/reports/tasks/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Exported successfully');
    } catch (e) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div className="spinner" />
    </div>
  );

  const overview = analytics?.overview || {};
  const overdueTasks = 0; // Would need a dedicated endpoint
  const blockedCount = overview.blockedTasks || 0;
  const avgTime = analytics?.averageCompletionTimeHours || 0;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Reports</h1>
        <button className="btn btn-primary" onClick={exportCSV} disabled={exporting}>
          <RiDownloadLine size={14} /> {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Top metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <MetricCard label="Overdue tasks" value={overdueTasks} valueColor="#f59e0b" />
        <MetricCard label="Currently blocked" value={blockedCount} valueColor="#f59e0b" />
        <MetricCard label="Avg completion time" value={`${avgTime}h`} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {/* Status distribution */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '16px' }}>Task status distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Pending',     value: overview.pendingTasks    || 0, color: '#94a3b8' },
                  { name: 'In Progress', value: overview.inProgressTasks || 0, color: '#3b82f6' },
                  { name: 'Completed',   value: overview.completedTasks  || 0, color: '#10b981' },
                  { name: 'Blocked',     value: overview.blockedTasks    || 0, color: '#ef4444' },
                ]}
                cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}
              >
                {['#94a3b8','#3b82f6','#10b981','#ef4444'].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: darkMode ? '#1c2128' : '#ffffff',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(99,120,160,0.2)'}`,
                  borderRadius: '6px', fontSize: '12px',
                  color: darkMode ? '#e6edf3' : '#0f172a',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority breakdown */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '16px' }}>Tasks by priority</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={Object.entries(analytics?.priorityStats || {}).map(([name, value]) => ({ name, value }))}
              barSize={28}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: darkMode ? '#6e7681' : '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: darkMode ? '#6e7681' : '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: darkMode ? '#1c2128' : '#ffffff',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(99,120,160,0.2)'}`,
                  borderRadius: '6px', fontSize: '12px',
                  color: darkMode ? '#e6edf3' : '#0f172a',
                }}
                cursor={{ fill: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {Object.keys(analytics?.priorityStats || {}).map((key, i) => (
                  <Cell key={i} fill={key === 'critical' ? '#ef4444' : key === 'high' ? '#f59e0b' : key === 'medium' ? '#3b82f6' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tasks over time */}
      {analytics?.tasksCreatedLast30Days?.length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '16px' }}>Tasks created (last 30 days)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={analytics.tasksCreatedLast30Days}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} vertical={false} />
              <XAxis dataKey="_id" tick={{ fill: darkMode ? '#6e7681' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: darkMode ? '#6e7681' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: darkMode ? '#1c2128' : '#ffffff',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(99,120,160,0.2)'}`,
                  borderRadius: '6px', fontSize: '12px',
                  color: darkMode ? '#e6edf3' : '#0f172a',
                }}
                cursor={{ fill: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
              />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="rgba(59,130,246,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Team performance */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '16px' }}>Team performance</h3>
        {teamPerf?.teamPerformance?.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Executor</th>
                <th>Total</th>
                <th>This week</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {teamPerf.teamPerformance.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                        {m.name?.charAt(0)}
                      </div>
                      <span style={{ color: 'var(--text)' }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text)' }}>{m.totalCompleted + (m.tasksThisWeek || 0)}</td>
                  <td style={{ color: '#3b82f6', fontWeight: '500' }}>{m.tasksThisWeek || 0}</td>
                  <td style={{ color: '#10b981', fontWeight: '500' }}>{m.totalCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }}>No executors yet.</div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, valueColor }) => (
  <div className="card" style={{ padding: '20px' }}>
    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '32px', fontWeight: '700', color: valueColor || 'var(--text)' }}>{value}</div>
  </div>
);

export default Reports;
