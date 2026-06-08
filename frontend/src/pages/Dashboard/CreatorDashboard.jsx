import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { RiAddLine, RiListCheck2, RiTimeLine, RiCheckboxCircleLine, RiProhibitedLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

const CreatorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { darkMode } = useAuth();

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/tasks/dashboard');
      setStats(res.data.stats);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div className="spinner" />
    </div>
  );

  const axisColor = darkMode ? '#6e7681' : '#94a3b8';
  const gridColor = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tooltipBg = darkMode ? '#1c2128' : '#ffffff';
  const tooltipBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const tooltipText = darkMode ? '#e6edf3' : '#1e293b';

  const statusData = [
    { name: 'Pending', value: stats?.pendingTasks || 0 },
    { name: 'In progress', value: stats?.inProgressTasks || 0 },
    { name: 'Completed', value: stats?.completedTasks || 0 },
    { name: 'Blocked', value: stats?.blockedTasks || 0 },
  ];

  const pieData = [
    { name: 'Pending',     value: stats?.pendingTasks    || 0, color: '#94a3b8' },
    { name: 'In Progress', value: stats?.inProgressTasks || 0, color: '#3b82f6' },
    { name: 'Completed',   value: stats?.completedTasks  || 0, color: '#10b981' },
    { name: 'Blocked',     value: stats?.blockedTasks    || 0, color: '#ef4444' },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Creator View</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tasks/create')}>
          <RiAddLine size={16} /> New task
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Total" value={stats?.totalTasks || 0} icon={<RiListCheck2 size={22} color="var(--text-secondary)" />} />
        <StatCard label="In progress" value={stats?.inProgressTasks || 0} icon={<RiTimeLine size={22} color="#3b82f6" />} valueColor="#3b82f6" />
        <StatCard label="Completed" value={stats?.completedTasks || 0} icon={<RiCheckboxCircleLine size={22} color="#10b981" />} valueColor="#10b981" />
        <StatCard label="Blocked" value={stats?.blockedTasks || 0} icon={<RiProhibitedLine size={22} color="#ef4444" />} valueColor="#ef4444" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '12px', marginBottom: '12px' }}>
        {/* Bar chart */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '16px' }}>Tasks by status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '6px', fontSize: '12px' }}
                labelStyle={{ color: tooltipText }}
                itemStyle={{ color: axisColor }}
                cursor={{ fill: 'rgba(128,128,128,0.05)' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '16px' }}>Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value" paddingAngle={2}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '6px', fontSize: '12px' }}
                itemStyle={{ color: tooltipText }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: d.color, flexShrink: 0 }} />
                <span>{d.name}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text)', fontWeight: '500' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '12px' }}>
        {/* Recently created */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '16px' }}>Recently created</h3>
          {stats?.recentTasks?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {stats.recentTasks.slice(0, 6).map(task => (
                <div
                  key={task._id}
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                    transition: 'background 0.15s',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span className={`badge badge-${task.status}`} style={{ fontSize: '11px' }}>{task.status}</span>
                      <span className={`badge badge-${task.priority}`} style={{ fontSize: '11px' }}>{task.priority}</span>
                    </div>
                  </div>
                  {task.riskScore > 0 && (
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: task.riskScore < 30 ? 'rgba(16,185,129,0.15)' : task.riskScore < 70 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: '700', flexShrink: 0, marginLeft: '8px',
                      color: task.riskScore < 30 ? '#34d399' : task.riskScore < 70 ? '#fbbf24' : '#f87171',
                    }}>
                      {task.riskScore}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              No tasks yet.{' '}
              <span onClick={() => navigate('/tasks/create')} style={{ color: '#3b82f6', cursor: 'pointer' }}>Create one.</span>
            </div>
          )}
        </div>

        {/* Executors */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '16px' }}>
            Executors ({stats?.executors?.length || 0})
          </h3>
          {stats?.executors?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.executors.slice(0, 6).map(ex => (
                <div key={ex._id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                    {ex.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ex.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ex.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No executors yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, valueColor = 'var(--text)' }) => (
  <div className="card" style={{ padding: '16px 20px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
      {icon}
    </div>
    <div style={{ fontSize: '28px', fontWeight: '700', color: valueColor }}>{value}</div>
  </div>
);

export default CreatorDashboard;
