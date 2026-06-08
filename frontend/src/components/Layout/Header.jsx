import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { RiNotification3Line, RiSunLine, RiMoonLine, RiLogoutBoxLine } from 'react-icons/ri';
import { TbGitBranch } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { darkMode, toggleDarkMode, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header style={{
      height: '48px',
      background: 'var(--header-bg)',
      borderBottom: '1px solid var(--header-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      transition: 'background 0.2s',
    }}>
      {/* Left: subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <TbGitBranch size={15} color="#3b82f6" />
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          AI-assisted task orchestration
        </span>
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button className="btn-icon" onClick={() => navigate('/notifications')} title="Notifications">
          <RiNotification3Line size={16} />
        </button>
        <button
          className="btn-icon"
          onClick={toggleDarkMode}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <RiSunLine size={16} /> : <RiMoonLine size={16} />}
        </button>
        <button className="btn-icon" onClick={handleLogout} title="Logout">
          <RiLogoutBoxLine size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
