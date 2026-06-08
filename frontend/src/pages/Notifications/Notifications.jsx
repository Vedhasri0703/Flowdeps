import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { RiInboxLine } from 'react-icons/ri';

const Notifications = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('readNotifs') || '[]'); } catch { return []; }
  });
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/tasks');
      setTasks(res.data.tasks || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  /* Build notifications from task data */
  const notifications = [];
  tasks.forEach(task => {
    if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') {
      const days = Math.ceil((new Date() - new Date(task.dueDate)) / 86400000);
      notifications.push({ id: `overdue-${task._id}`, type: 'warning', title: 'Task overdue', message: `"${task.title}" is ${days} day(s) overdue`, taskId: task._id, time: task.dueDate });
    }
    if (task.status === 'blocked') {
      notifications.push({ id: `blocked-${task._id}`, type: 'error', title: 'Task blocked', message: `"${task.title}" is currently blocked`, taskId: task._id, time: task.updatedAt });
    }
    if (task.riskScore >= 70 && task.status !== 'completed') {
      notifications.push({ id: `risk-${task._id}`, type: 'warning', title: 'High risk task', message: `"${task.title}" has a risk score of ${task.riskScore}`, taskId: task._id, time: task.updatedAt });
    }
    if (task.status === 'completed') {
      const daysSince = (new Date() - new Date(task.updatedAt)) / 86400000;
      if (daysSince < 3) {
        notifications.push({ id: `done-${task._id}`, type: 'success', title: 'Task completed', message: `"${task.title}" was marked as completed`, taskId: task._id, time: task.updatedAt });
      }
    }
    if (task.status === 'in-progress' && task.executedBy) {
      const daysSince = (new Date() - new Date(task.updatedAt)) / 86400000;
      if (daysSince < 2) {
        notifications.push({ id: `claimed-${task._id}`, type: 'info', title: 'Task claimed', message: `"${task.title}" was claimed by ${task.executedBy?.name || 'an executor'}`, taskId: task._id, time: task.updatedAt });
      }
    }
  });
  notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem('readNotifs', JSON.stringify(allIds));
  };

  const markRead = (id) => {
    const updated = [...new Set([...readIds, id])];
    setReadIds(updated);
    localStorage.setItem('readNotifs', JSON.stringify(updated));
  };

  const typeStyles = {
    success: { dot: '#10b981', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)' },
    warning: { dot: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)' },
    error: { dot: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)' },
    info: { dot: '#3b82f6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)' },
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Notifications</h1>
        {notifications.length > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead} style={{ fontSize: '13px' }}>
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <RiInboxLine size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No notifications.</div>
        </div>
      ) : (
        <div className="card">
          {notifications.map((n, idx) => {
            const s = typeStyles[n.type] || typeStyles.info;
            const isRead = readIds.includes(n.id);
            return (
              <div
                key={n.id}
                onClick={() => { markRead(n.id); if (n.taskId) navigate(`/tasks/${n.taskId}`); }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px 16px',
                  borderBottom: idx < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: n.taskId ? 'pointer' : 'default',
                  background: isRead ? 'transparent' : s.bg,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (n.taskId) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isRead ? 'transparent' : s.bg; }}
              >
                {/* Dot */}
                <div style={{ marginTop: '4px', flexShrink: 0 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isRead ? 'var(--text-muted)' : s.dot }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: isRead ? '400' : '500', color: 'var(--text)', marginBottom: '2px' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{n.message}</div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {new Date(n.time).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
