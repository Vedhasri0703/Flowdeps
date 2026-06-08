import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{
        flex: 1,
        marginLeft: 'var(--sidebar-width)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Header />
        <main style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          background: 'var(--bg)',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
