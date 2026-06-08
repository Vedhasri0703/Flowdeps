import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';
import { RiAddLine, RiSearchLine, RiTaskLine, RiGlobalLine } from 'react-icons/ri';
import KanbanBoard from './KanbanBoard';

const TaskList = () => {
  const [myTasks, setMyTasks]     = useState([]);
  const [allTasks, setAllTasks]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('my');   // 'my' | 'all'
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [view, setView]           = useState('list'); // 'list' | 'board'
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      // My Tasks: tasks created by or assigned to current user
      const myRes = await axios.get('/tasks/all');
      setMyTasks(myRes.data.tasks || []);

      // All Tasks tab in TaskList shows the role-filtered global list
      const allRes = await axios.get('/tasks');
      setAllTasks(allRes.data.tasks || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const sourceTasks = tab === 'my' ? myTasks : allTasks;

  const filtered = sourceTasks.filter(t => {
    const matchSearch   = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus   = filterStatus === 'all' || t.status === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="fade-in">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>Tasks</h1>
        {user?.role === 'creator' && (
          <button className="btn btn-primary" onClick={() => navigate('/tasks/create')}>
            <RiAddLine size={16} /> New
          </button>
        )}
      </div>

      {/* ── Tabs: My Tasks / All Tasks ── */}
      <div style={{
        display: 'flex',
        gap: '2px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '3px',
        width: 'fit-content',
        marginBottom: '16px',
      }}>
        {[
          { key: 'my',  label: 'My Tasks',  icon: <RiTaskLine size={14} /> },
          { key: 'all', label: 'All Tasks',  icon: <RiGlobalLine size={14} /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', border: 'none', cursor: 'pointer',
              borderRadius: '6px', fontSize: '13px', fontWeight: tab === key ? '600' : '400',
              fontFamily: 'inherit', transition: 'all 0.15s',
              background: tab === key ? '#3b82f6' : 'transparent',
              color:      tab === key ? '#ffffff'  : 'var(--text-secondary)',
            }}
          >
            {icon} {label}
            <span style={{
              minWidth: '18px', height: '18px', padding: '0 5px',
              borderRadius: '10px', fontSize: '11px', fontWeight: '600',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: tab === key ? 'rgba(255,255,255,0.25)' : 'var(--border)',
              color:      tab === key ? '#fff' : 'var(--text-secondary)',
            }}>
              {key === 'my' ? myTasks.length : allTasks.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="input-with-icon" style={{ flex: 1, minWidth: '180px', maxWidth: '380px' }}>
          <RiSearchLine className="icon" size={14} />
          <input
            className="form-control"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="form-select" style={{ width: 'auto', minWidth: '100px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="pending">pending</option>
          <option value="in-progress">in-progress</option>
          <option value="completed">completed</option>
          <option value="blocked">blocked</option>
        </select>

        <select className="form-select" style={{ width: 'auto', minWidth: '100px' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="all">All priority</option>
          <option value="critical">critical</option>
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>

        <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
          {['List', 'Board'].map(v => (
            <button
              key={v}
              onClick={() => setView(v.toLowerCase())}
              style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer',
                background: view === v.toLowerCase() ? 'var(--primary)' : 'transparent',
                color: view === v.toLowerCase() ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '13px', fontWeight: view === v.toLowerCase() ? '500' : '400',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {view === 'board' ? (
        <KanbanBoard tasks={filtered} />
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                {tab === 'my' ? '📋' : '🔍'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
                {tab === 'my' ? 'No tasks yet' : 'No tasks found'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {tab === 'my'
                  ? user?.role === 'creator'
                    ? 'Create your first task to get started.'
                    : 'No tasks have been assigned to you yet.'
                  : 'No tasks match your current filters.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(task => (
                <TaskRow key={task._id} task={task} onClick={() => navigate(`/tasks/${task._id}`)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ── Task row card ── */
const TaskRow = ({ task, onClick }) => (
  <div
    className="card"
    onClick={onClick}
    style={{ padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(59,130,246,0.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '3px' }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '6px' }}>
            {task.description}
          </div>
        )}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className={`badge badge-${task.status}`}>{task.status}</span>
          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
          {task.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="tag" style={{ fontSize: '10px', padding: '1px 6px' }}>{tag}</span>
          ))}
          {task.createdBy?.name && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
              by {task.createdBy.name}
            </span>
          )}
        </div>
      </div>
      {task.riskScore > 0 && (
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
          background: task.riskScore < 30 ? 'rgba(16,185,129,0.15)' : task.riskScore < 70 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: '700',
          color: task.riskScore < 30 ? '#10b981' : task.riskScore < 70 ? '#f59e0b' : '#ef4444',
        }}>
          {task.riskScore}
        </div>
      )}
    </div>
  </div>
);

export default TaskList;
