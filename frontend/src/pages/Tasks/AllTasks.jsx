import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';
import { RiSearchLine, RiGlobalLine } from 'react-icons/ri';

const AllTasks = () => {
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const { user } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      /* /tasks returns role-filtered list for executors (only unblocked pending),
         but creators get everything. We want ALL tasks regardless — use /tasks/all
         which returns tasks created by OR assigned to anyone.
         For a "global view" we re-use the same /tasks endpoint which returns
         all tasks for creator role, and for executor we do the same call. */
      const res = await axios.get('/tasks');
      setTasks(res.data.tasks || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = tasks.filter(t => {
    const ms = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const mst = filterStatus === 'all' || t.status === filterStatus;
    const mp  = filterPriority === 'all' || t.priority === filterPriority;
    return ms && mst && mp;
  });

  /* group by creator */
  const grouped = filtered.reduce((acc, t) => {
    const key   = t.createdBy?._id || 'unknown';
    const label = t.createdBy?.name || 'Unknown creator';
    if (!acc[key]) acc[key] = { label, tasks: [] };
    acc[key].tasks.push(t);
    return acc;
  }, {});

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <RiGlobalLine size={20} color="#3b82f6" />
            <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)' }}>All Tasks</h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            All tasks across every creator — {tasks.length} total
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="input-with-icon" style={{ flex: 1, minWidth: '200px', maxWidth: '400px' }}>
          <RiSearchLine className="icon" size={14} />
          <input
            className="form-control"
            placeholder="Search all tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: '110px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="pending">pending</option>
          <option value="in-progress">in-progress</option>
          <option value="completed">completed</option>
          <option value="blocked">blocked</option>
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: '110px' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="all">All priority</option>
          <option value="critical">critical</option>
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>
        {/* result count */}
        <span style={{
          fontSize: '12px', color: 'var(--text-muted)',
          padding: '6px 10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
        }}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
            No tasks found
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Try adjusting your search or filters.
          </div>
        </div>
      )}

      {/* Grouped by creator */}
      {Object.values(grouped).map(({ label, tasks: groupTasks }) => (
        <div key={label} style={{ marginBottom: '28px' }}>
          {/* Creator heading */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '10px',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', color: 'white',
            }}>
              {label.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{label}</span>
            <span style={{
              fontSize: '11px', color: 'var(--text-muted)',
              padding: '1px 8px', borderRadius: '10px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
            }}>
              {groupTasks.length} task{groupTasks.length !== 1 ? 's' : ''}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Task rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {groupTasks.map(task => (
              <div
                key={task._id}
                className="card"
                onClick={() => navigate(`/tasks/${task._id}`)}
                style={{ padding: '12px 16px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(59,130,246,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>
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
                      {task.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="tag" style={{ fontSize: '10px', padding: '1px 6px' }}>{tag}</span>
                      ))}
                      {task.dueDate && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                          Due {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                    {/* Executor chip */}
                    {task.executedBy?.name && (
                      <span style={{
                        fontSize: '11px', color: 'var(--text-secondary)',
                        padding: '2px 8px', borderRadius: '10px',
                        background: 'var(--bg-card-hover)',
                        border: '1px solid var(--border)',
                        whiteSpace: 'nowrap',
                      }}>
                        👤 {task.executedBy.name}
                      </span>
                    )}
                    {/* Risk score */}
                    {task.riskScore > 0 && (
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: task.riskScore < 30
                          ? 'rgba(16,185,129,0.15)' : task.riskScore < 70
                          ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: '700',
                        color: task.riskScore < 30 ? '#10b981' : task.riskScore < 70 ? '#f59e0b' : '#ef4444',
                      }}>
                        {task.riskScore}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AllTasks;
