import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle color="#10b981" size={20} />;
      case 'error':
        return <FaTimesCircle color="#ef4444" size={20} />;
      case 'warning':
        return <FaExclamationCircle color="#f59e0b" size={20} />;
      default:
        return <FaInfoCircle color="#3b82f6" size={20} />;
    }
  };

  const getBackground = () => {
    switch (type) {
      case 'success':
        return 'linear-gradient(135deg, #10b981, #059669)';
      case 'error':
        return 'linear-gradient(135deg, #ef4444, #dc2626)';
      case 'warning':
        return 'linear-gradient(135deg, #f59e0b, #d97706)';
      default:
        return 'linear-gradient(135deg, #3b82f6, #2563eb)';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 24px',
        background: getBackground(),
        borderRadius: '12px',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '300px',
      }}>
        {getIcon()}
        <span style={{ flex: 1 }}>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >
          ×
        </button>
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;