import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  RiDashboardLine, RiTaskLine, RiBellLine,
  RiBarChartLine, RiUserLine, RiLogoutBoxLine,
  RiPlayCircleLine, RiGlobalLine,
} from 'react-icons/ri';
import { TbGitBranch } from 'react-icons/tb';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  /* nav items differ by role */
  const navItems = [
    { path: '/dashboard', icon: <RiDashboardLine size={17} />, label: 'Dashboard' },
    { path: '/tasks',     icon: <RiTaskLine size={17} />,      label: 'Tasks' },
  ];

  if (user?.role === 'executor') {
    navItems.push({ path: '/available-tasks', icon: <RiPlayCircleLine size={17} />, label: 'Available' });
  }

  navItems.push({ path: '/notifications', icon: <RiBellLine size={17} />, label: 'Notifications' });

  if (user?.role === 'creator') {
    navItems.push({ path: '/reports', icon: <RiBarChartLine size={17} />, label: 'Reports' });
  }

  // "All Tasks" tab — visible to both roles, sits just before Profile
  navItems.push({ path: '/all-tasks', icon: <RiGlobalLine size={17} />, label: 'All Tasks' });
  navItems.push({ path: '/profile',   icon: <RiUserLine size={17} />,   label: 'Profile' });

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--sidebar-border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0,
      height: '100vh',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: '14px 14px 12px',
        borderBottom: '1px solid var(--sidebar-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
      }}>
        <div style={{
          width: '30px', height: '30px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
        }}>
          <TbGitBranch size={17} color="white" strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', lineHeight: 1.2 }}>FlowDeps</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.2, textTransform: 'capitalize' }}>
            {user?.role || 'User'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '8px 10px',
              borderRadius: '6px',
              color: isActive ? '#3b82f6' : 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: isActive ? '600' : '400',
              background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
              marginBottom: '2px',
              transition: 'all 0.15s',
            })}
            onMouseEnter={e => {
              // only tint if not active
              if (!e.currentTarget.style.background.includes('0.12')) {
                e.currentTarget.style.background = 'rgba(59,130,246,0.06)';
                e.currentTarget.style.color = 'var(--text)';
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.style.background.includes('0.12')) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--sidebar-border)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '9px',
            padding: '8px 10px', borderRadius: '6px',
            color: 'var(--text-secondary)', background: 'transparent',
            border: 'none', cursor: 'pointer', fontSize: '13px', width: '100%',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <RiLogoutBoxLine size={17} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
