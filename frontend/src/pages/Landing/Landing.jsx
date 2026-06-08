import React from 'react';
import { Link } from 'react-router-dom';
import { TbGitBranch } from 'react-icons/tb';
import {
  RiNodeTree, RiShieldCheckLine, RiRouteLine,
  RiSparklingLine, RiCheckboxCircleLine, RiRefreshLine,
} from 'react-icons/ri';

const features = [
  {
    icon: <RiNodeTree size={20} color="#3b82f6" />,
    title: 'Dependency graph',
    desc: 'Visualize incoming and outgoing dependencies for every task with React Flow.',
  },
  {
    icon: <RiShieldCheckLine size={20} color="#3b82f6" />,
    title: 'Role-aware access',
    desc: "Executors literally cannot see tasks whose dependencies aren't done. Enforced at the database.",
  },
  {
    icon: <RiRouteLine size={20} color="#3b82f6" />,
    title: 'Critical path',
    desc: 'We compute the longest dependency chain so you know which slips actually hurt.',
  },
  {
    icon: <RiSparklingLine size={20} color="#3b82f6" />,
    title: 'AI suggestions',
    desc: 'Smart dependency picking, priority recommendation, and executor matching.',
  },
  {
    icon: <RiCheckboxCircleLine size={20} color="#3b82f6" />,
    title: 'Atomic claim',
    desc: "Two executors can't claim the same task. The database enforces single-claim.",
  },
  {
    icon: <RiRefreshLine size={20} color="#3b82f6" />,
    title: 'Cycle prevention',
    desc: 'Tries to create A→B→A? The server rejects it before it lands.',
  },
];

const Landing = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 48px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TbGitBranch size={16} color="white" />
          </div>
          <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>FlowDeps</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            Sign in
          </Link>
          <Link to="/register">
            <button style={{
              padding: '8px 16px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}>
              Get started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '80px 24px 60px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '20px',
          fontSize: '12px',
          color: '#60a5fa',
          marginBottom: '24px',
        }}>
          <TbGitBranch size={12} /> AI-assisted dependency planning
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.1,
          marginBottom: '20px',
        }}>
          Ship work in the right order.
        </h1>

        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 36px', lineHeight: '1.6' }}>
          A dependency-aware task execution system. Creators define the graph, executors
          only see what's actually unblocked, and AI suggests dependencies, priorities, and the best owner.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register">
            <button style={{
              padding: '12px 24px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
            onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
            >
              Create account
            </button>
          </Link>
          <Link to="/login">
            <button style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '1px solid var(--border-hover)',
              borderRadius: '8px',
              color: 'var(--text)',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            >
              Sign in
            </button>
          </Link>
        </div>
      </div>

      {/* Features grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1px',
        background: 'var(--border)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        maxWidth: '960px',
        margin: '0 auto 80px',
        padding: '0',
      }}>
        {features.map((f, i) => (
          <div key={i} style={{
            padding: '28px',
            background: 'var(--bg)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
          >
            <div style={{ marginBottom: '12px' }}>{f.icon}</div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>{f.title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Landing;
