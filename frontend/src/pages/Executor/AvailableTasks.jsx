import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import toast from 'react-hot-toast';
import { RiCheckLine, RiPlayLine, RiProhibitedLine, RiArrowDownSLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

const AvailableTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [statusOpen, setStatusOpen] = useState(null); /* which task has dropdown open */
  const [submitting, setSubmitting] = useState(null); /* which task is being updated */
  const navigate = useNavigate();
  const { darkMode } = useAuth();

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/tasks/available');
      setTasks(res.data.tasks || []);
    } catch (e) {
      toast.error('Failed to load available tasks');
    } finally {
      setLoading(false);
    }
  };

  const claimTask = async (taskId, e) => {
    e.stopPropagation();
    setClaiming(taskId);
    try {
      await axios.put(`/tasks/execute/${taskId}`, { status: 'in-progress' });
      toast.success('Task claimed! You can now work on it.');
      fetchTasks();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to claim task');
    } finally {
      setClaiming(null);
    }
  };

  /* Status update dropdown */
  const updateTaskStatus = async (taskId, newStatus, e) => {
    e?.stopPropagation?.();
    setSubmitting(taskId);
    try {
      await axios.put(`/tasks/execute/${taskId}`, { status: newStatus });
      toast.success(`Task moved to ${newStatus}`);
      setStatusOpen(null);
      fetchTasks();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update task');
    } finally {
      setSubmitting(null);
    }
  };

  const getStatusTransitions = (currentStatus) => {
    const transitions = {
      pending:      ['in-progress'],
      'in-progress':['completed', 'blocked'],
      blocked:      ['pending', 'in-progress'],
      completed:    [],
    };
    return transitions[currentStatus] || [];
  };

  const statusColors = {
    pending:       { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)',   icon: '⏳' },
    'in-progress': { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',    icon: '▶' },
    completed:     { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',    icon: '✓' },
    blocked:       { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',     icon: '⚠' },
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div className="spinner" />
    </div>
  );

  const dropdownBg    = darkMode ? '#1c2128' : '#ffffff';
  const dropdownBorder= darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(99,120,160,0.15)';
  const dropdownHover = darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5fb';
  const dropdownText  = darkMode ? '#e6edf3' : '#0f172a';

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>Available tasks</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Tasks with all dependencies completed and ready to claim.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.3 }}>📭</div>
          <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>No available tasks</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            All tasks are either claimed or waiting for dependencies.
          </div>
          <button className="btn btn-secondary" onClick={fetchTasks}>Refresh</button>
        </div>
      ) : (
        /* Card grid matching reference screenshot */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 320px))', gap: '12px' }}>
          {tasks.map(task => {
            const currentStatus = task.status;
            const transitions = getStatusTransitions(currentStatus);
            const canUpdateStatus = transitions.length > 0;

            return (
              <div
                key={task._id}
                className="card"
                style={{ 
                  padding: '16px', 
                  cursor: 'pointer', 
                  transition: 'border-color 0.15s, transform 0.15s',
                  position: 'relative',
                }}
                onClick={() => navigate(`/tasks/${task._id}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Title row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', flex: 1, marginRight: '8px' }}>
                    {task.title}
                  </h3>
                  {task.riskScore > 0 && (
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                      background: task.riskScore < 30 ? 'rgba(16,185,129,0.15)' : task.riskScore < 70 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: '700',
                      color: task.riskScore < 30 ? '#34d399' : task.riskScore < 70 ? '#fbbf24' : '#f87171',
                    }}>
                      {task.riskScore}
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span className={`badge badge-${task.status}`}>{task.status}</span>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                </div>

                {/* Status not claimed yet — show Claim button */}
                {task.status === 'pending' && (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '9px' }}
                    disabled={claiming === task._id}
                    onClick={(e) => claimTask(task._id, e)}
                  >
                    {claiming === task._id ? 'Claiming...' : 'Claim'}
                  </button>
                )}

                {/* Status claimed — show status update dropdown */}
                {task.status !== 'pending' && canUpdateStatus && (
                  <div style={{ position: 'relative' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ 
                        width: '100%', 
                        justifyContent: 'space-between', 
                        padding: '9px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        gap: '6px',
                      }}
                      onClick={(e) => { e.stopPropagation(); setStatusOpen(statusOpen === task._id ? null : task._id); }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {statusColors[task.status]?.icon}
                        Update status
                      </span>
                      <RiArrowDownSLine size={14} style={{ transform: statusOpen === task._id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                    </button>

                    {/* Dropdown menu */}
                    {statusOpen === task._id && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                        background: dropdownBg,
                        border: `1px solid ${dropdownBorder}`,
                        borderRadius: '8px',
                        zIndex: 50,
                        boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 4px 12px rgba(15,23,42,0.1)',
                        overflow: 'hidden',
                      }}>
                        {transitions.map(status => {
                          const meta = statusColors[status];
                          return (
                            <button
                              key={status}
                              onClick={(e) => updateTaskStatus(task._id, status, e)}
                              disabled={submitting === task._id}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: dropdownText,
                                fontFamily: 'inherit',
                                textAlign: 'left',
                                borderBottom: `1px solid ${dropdownBorder}`,
                                transition: 'background 0.1s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = dropdownHover}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{
                                width: '24px', height: '24px', borderRadius: '4px',
                                background: meta.bg, border: `1px solid ${meta.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: meta.color, fontSize: '11px', flexShrink: 0,
                              }}>
                                {meta.icon}
                              </span>
                              <div>
                                <div style={{ color: meta.color, fontWeight: '600' }}>{status}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                                  {status === 'in-progress' && 'Resume working'}
                                  {status === 'completed' && 'Mark as done'}
                                  {status === 'blocked' && 'Blocked by issue'}
                                </div>
                              </div>
                              {submitting === task._id && (
                                <div style={{ marginLeft: 'auto', width: '12px', height: '12px', border: '2px solid transparent', borderTopColor: meta.color, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Status completed — no more actions */}
                {task.status === 'completed' && (
                  <div style={{
                    padding: '9px 12px',
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#10b981',
                  }}>
                    <RiCheckLine size={14} />
                    Task completed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvailableTasks;
