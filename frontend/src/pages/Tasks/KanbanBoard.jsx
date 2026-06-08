import React from 'react';
import { useNavigate } from 'react-router-dom';

const COLUMNS = [
  { id: 'pending',     label: 'Pending',     color: '#94a3b8' },
  { id: 'in-progress', label: 'In Progress',  color: '#3b82f6' },
  { id: 'completed',   label: 'Completed',    color: '#10b981' },
  { id: 'blocked',     label: 'Blocked',      color: '#ef4444' },
];

const KanbanBoard = ({ tasks = [] }) => {
  const navigate = useNavigate();
  const getByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', overflowX: 'auto' }}>
      {COLUMNS.map(col => {
        const colTasks = getByStatus(col.id);
        return (
          <div key={col.id} style={{ minWidth: '200px' }}>

            {/* Column header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              marginBottom: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderTop: `3px solid ${col.color}`,
              borderRadius: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                  {col.label}
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border)',
                padding: '1px 7px',
                borderRadius: '10px',
              }}>
                {colTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '120px' }}>
              {colTasks.map(task => (
                <div
                  key={task._id}
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  className="card"
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = col.color;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${col.color}20`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {/* Task title — uses CSS variable, visible in both modes */}
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text)',
                    marginBottom: '8px',
                    lineHeight: '1.45',
                  }}>
                    {task.title}
                  </div>

                  {/* Tags row */}
                  {task.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '7px' }}>
                      {task.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="tag" style={{ fontSize: '10px', padding: '1px 5px' }}>{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Footer: priority badge + deps count */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`badge badge-${task.priority}`} style={{ fontSize: '10px' }}>
                      {task.priority}
                    </span>
                    {task.dependencies?.length > 0 && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {task.dependencies.length} dep{task.dependencies.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Due date */}
                  {task.dueDate && (
                    <div style={{
                      marginTop: '7px',
                      fontSize: '10px',
                      color: new Date(task.dueDate) < new Date() && task.status !== 'completed'
                        ? '#ef4444'
                        : 'var(--text-muted)',
                    }}>
                      Due {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                </div>
              ))}

              {/* Empty column placeholder */}
              {colTasks.length === 0 && (
                <div style={{
                  border: '1px dashed var(--border)',
                  borderRadius: '6px',
                  padding: '24px 12px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                }}>
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
