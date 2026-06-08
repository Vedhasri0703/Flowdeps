import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TbGitBranch } from 'react-icons/tb';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'signin');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  /* ── Sign In state ── */
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [showSignInPwd, setShowSignInPwd] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);

  /* ── Sign Up state ── */
  const [signUpForm, setSignUpForm] = useState({ name: '', email: '', password: '', role: 'executor' });
  const [showSignUpPwd, setShowSignUpPwd] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInLoading(true);
    const result = await login(signInForm.email, signInForm.password);
    setSignInLoading(false);
    if (result.success) navigate('/dashboard');
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignUpLoading(true);
    const result = await register(signUpForm);
    setSignUpLoading(false);
    if (result.success) navigate('/dashboard');
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text)',
    fontSize: '14px', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.15s',
  };

  const labelStyle = {
    display: 'block', fontSize: '13px',
    fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg)',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '32px 40px',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '300px', height: '300px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '240px', height: '240px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '50%',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TbGitBranch size={19} color="white" strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>FlowDeps</span>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: 'clamp(28px, 3.5vw, 42px)',
            fontWeight: '800',
            color: 'white',
            lineHeight: 1.15,
            marginBottom: '16px',
          }}>
            Ship work in the<br />right order.
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, maxWidth: '340px' }}>
            Dependency-aware task execution with AI-assisted planning,
            role-based access, and a real-time dependency graph.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '32px' }}>
            {[
              '🔗 Visual dependency graph with React Flow',
              '🤖 AI-powered priority & executor suggestions',
              '🔒 Role-based access — executors see only unblocked tasks',
              '⚡ Critical path detection & delay prediction',
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                borderRadius: '8px',
                fontSize: '13px', color: 'rgba(255,255,255,0.9)',
              }}>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', position: 'relative', zIndex: 1 }}>
          © FlowDeps
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        width: '460px',
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 40px',
        minHeight: '100vh',
      }}>
        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--border)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '32px',
          width: '100%',
          maxWidth: '340px',
        }}>
          {['signin', 'signup'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '9px',
                borderRadius: '7px',
                border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: '500',
                fontFamily: 'inherit',
                background: tab === t ? '#3b82f6' : 'transparent',
                color: tab === t ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              {t === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* ── SIGN IN FORM ── */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} style={{ width: '100%', maxWidth: '340px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={signInForm.email}
                onChange={e => setSignInForm(f => ({ ...f, email: e.target.value }))}
                style={inputStyle}
                placeholder="you@example.com"
                required
                autoFocus
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showSignInPwd ? 'text' : 'password'}
                  value={signInForm.password}
                  onChange={e => setSignInForm(f => ({ ...f, password: e.target.value }))}
                  style={{ ...inputStyle, paddingRight: '40px' }}
                  placeholder="••••••••"
                  required
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPwd(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showSignInPwd ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={signInLoading}
              style={{
                width: '100%', padding: '11px',
                background: '#3b82f6', border: 'none', borderRadius: '8px',
                color: 'white', fontSize: '14px', fontWeight: '600',
                cursor: signInLoading ? 'not-allowed' : 'pointer',
                opacity: signInLoading ? 0.7 : 1,
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!signInLoading) e.currentTarget.style.background = '#2563eb'; }}
              onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
            >
              {signInLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <a
                href="/forgot-password"
                style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = '#3b82f6'}
                onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
              >
                Forgot password?
              </a>
            </div>
          </form>
        )}

        {/* ── SIGN UP FORM ── */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} style={{ width: '100%', maxWidth: '340px' }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                value={signUpForm.name}
                onChange={e => setSignUpForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle}
                placeholder="Your full name"
                required
                autoFocus
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={signUpForm.email}
                onChange={e => setSignUpForm(f => ({ ...f, email: e.target.value }))}
                style={inputStyle}
                placeholder="you@example.com"
                required
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showSignUpPwd ? 'text' : 'password'}
                  value={signUpForm.password}
                  onChange={e => setSignUpForm(f => ({ ...f, password: e.target.value }))}
                  style={{ ...inputStyle, paddingRight: '40px' }}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPwd(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showSignUpPwd ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['executor', 'creator'].map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSignUpForm(f => ({ ...f, role }))}
                    style={{
                      padding: '9px',
                      background: signUpForm.role === role ? 'rgba(59,130,246,0.15)' : 'var(--bg-card-hover)',
                      border: `1px solid ${signUpForm.role === role ? '#3b82f6' : 'var(--border)'}`,
                      borderRadius: '7px',
                      color: signUpForm.role === role ? '#3b82f6' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                      textTransform: 'capitalize', transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                {signUpForm.role === 'creator' ? 'Create & manage tasks, view reports' : 'Execute tasks assigned to you'}
              </div>
            </div>

            <button
              type="submit"
              disabled={signUpLoading}
              style={{
                width: '100%', padding: '11px',
                background: '#3b82f6', border: 'none', borderRadius: '8px',
                color: 'white', fontSize: '14px', fontWeight: '600',
                cursor: signUpLoading ? 'not-allowed' : 'pointer',
                opacity: signUpLoading ? 0.7 : 1,
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!signUpLoading) e.currentTarget.style.background = '#2563eb'; }}
              onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
            >
              {signUpLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
