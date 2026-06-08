import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    const configs = {
      pending: { label: 'Pending', color: '#64748b', icon: '⏳' },
      'in-progress': { label: 'In Progress', color: '#3b82f6', icon: '🔄' },
      completed: { label: 'Completed', color: '#10b981', icon: '✅' },
      blocked: { label: 'Blocked', color: '#ef4444', icon: '🚫' },
    };
    return configs[status] || configs.pending;
  };

  const config = getStatusConfig();

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 500,
      background: `${config.color}20`,
      color: config.color,
    }}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

export default StatusBadge;