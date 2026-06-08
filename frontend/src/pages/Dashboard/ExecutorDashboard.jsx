import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import {
  RiListCheck2, RiTimeLine, RiCheckboxCircleLine, RiProhibitedLine,
} from 'react-icons/ri';

const ExecutorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const totalTasks = (stats?.myInProgressCount || 0) + (stats?.totalCompleted || 0);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Executor View</p>
      </div>

      {/* Stat cards — matching reference */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Total" value={totalTasks} icon={<RiListCheck2 size={22} color="var(--text-secondary)" />} />
        <StatCard label="In progress" value={stats?.myInProgressCount || 0} icon={<RiTimeLine size={22} color="#3b82f6" />} valueColor="#3b82f6" />
        <StatCard label="Completed" value={stats?.totalCompleted || 0} icon={<RiCheckboxCircleLine size={22} color="#10b981" />} valueColor="#10b981" />
        <StatCard label="Blocked" value={0} icon={<RiProhibitedLine size={22} color="#ef4444" />} valueColor="#ef4444" />
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {/* My in-progress tasks */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '4px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>My in-progress tasks</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {stats?.myInProgressCount || 0} assigned
            </p>
          </div>
          <div style={{ marginTop: '16px' }}>
            {stats?.myTasks?.length > 0 ? (
              stats.myTasks.map(task => (
                <TaskRow key={task._id} task={task} onClick={() => navigate(`/tasks/${task._id}`)} />
              ))
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>No tasks claimed.</p>
            )}
          </div>
        </div>

        {/* Performance */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>Performance</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Last 7 days</p>
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '40px', fontWeight: '700', color: '#10b981', lineHeight: 1 }}>
              {stats?.completedThisWeek || 0}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              tasks completed this week
            </div>
          </div>
        </div>
      </div>

      {/* Recently completed */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '12px' }}>Recently completed</h3>
        {stats?.recentCompleted?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {stats.recentCompleted.slice(0, 5).map(task => (
              <TaskRow key={task._id} task={task} onClick={() => navigate(`/tasks/${task._id}`)} />
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>None yet.</p>
        )}
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

const TaskRow = ({ task, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 10px', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <span style={{ fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
      {task.title}
    </span>
    <span className={`badge badge-${task.priority}`} style={{ marginLeft: '8px', flexShrink: 0 }}>{task.priority}</span>
  </div>
);

export default ExecutorDashboard;
