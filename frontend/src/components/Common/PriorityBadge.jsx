import React from 'react';

const PriorityBadge = ({ priority }) => {
  const getPriorityConfig = () => {
    const configs = {
      critical: { label: 'Critical', color: '#ef4444', icon: '🔴' },
      high: { label: 'High', color: '#f59e0b', icon: '🟠' },
      medium: { label: 'Medium', color: '#3b82f6', icon: '🔵' },
      low: { label: 'Low', color: '#10b981', icon: '🟢' },
    };
    return configs[priority] || configs.medium;
  };

  const config = getPriorityConfig();

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      background: config.color,
      color: 'white',
    }}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

export default PriorityBadge;