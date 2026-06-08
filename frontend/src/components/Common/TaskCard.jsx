import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiCalendarLine, RiTimeLine, RiGitBranchLine } from 'react-icons/ri';

const PRIORITY_STYLES = {
  critical: { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   text: '#ef4444',  lightText: '#dc2626' },
  high:     { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  text: '#f59e0b',  lightText: '#d97706' },
  medium:   { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)', text: '#3b82f6',  lightText: '#2563eb' },
  low:      { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)', text: '#10b981',  lightText: '#059669' },
};

const STATUS_STYLES = {
  pending:     { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', lightText: '#64748b' },
  'in-progress': { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', lightText: '#2563eb' },
  completed:   { bg: 'rgba(16,185,129,0.12)',  text: '#10b981', lightText: '#059669' },
  blocked:     { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444', lightText: '#dc2626' },
};

const TaskCard = ({ task, onClick }) => {
  const navigate = useNavigate();
  const handleClick = () => onClick ? onClick(task) : navigate(`/tasks/${task._id}`);

  const p = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const s = STATUS_STYLES[task.status]     || STATUS_STYLES.pending;

  return (
    <div
      onClick={handleClick}
      className="card"
      style={{ padding: '16px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s' }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
        <h3 style={{
          color: 'var(--text)',
          fontSize: '14px',
          fontWeight: '600',
          margin: 0,
          lineHeight: 1.4,
          flex: 1,
        }}>
          {task.title}
        </h3>
        {/* Priority badge */}
        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600',
          background: p.bg,
          border: `1px solid ${p.border}`,
          color: p.text,
          flexShrink: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}>
          {task.priority}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '12px',
          marginBottom: '10px',
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {task.description}
        </p>
      )}

      {/* Meta row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {task.dueDate && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <RiCalendarLine size={11} />
            {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        )}
        {task.estimatedTime > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <RiTimeLine size={11} /> {task.estimatedTime}h
          </span>
        )}
        {task.dependencies?.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <RiGitBranchLine size={11} /> {task.dependencies.length} deps
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '500',
          background: s.bg,
          color: s.text,
        }}>
          {task.status}
        </span>
        {task.riskScore > 0 && (
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: task.riskScore < 30 ? '#10b981' : task.riskScore < 70 ? '#f59e0b' : '#ef4444',
          }}>
            Risk {task.riskScore}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
