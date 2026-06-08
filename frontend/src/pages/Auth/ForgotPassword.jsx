import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import toast from 'react-hot-toast';
import { TbGitBranch } from 'react-icons/tb';
import { RiEyeLine, RiEyeOffLine, RiLockPasswordLine, RiArrowLeftLine } from 'react-icons/ri';

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Step 1: verify email — Step 2: set new password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  /* ── Step 1: verify email exists ── */
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setVerifyLoading(true);
    try {
      await axios.post('/auth/forgot-password', { email });
      setStep(2);
      toast.success('Email verified. Set your new password below.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No account found with that email');
    } finally {
      setVerifyLoading(false);
    }
  };

  /* ── Step 2: reset password directly ── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setResetLoading(true);
    try {
      await axios.post('/auth/reset-password/direct', {
        email,
        password: newPassword,
        confirmPassword,
      });
      toast.success('Password updated! Please sign in with your new password.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  /* ── shared styles ── */
  const cardStyle = {
    width: '100%',
    maxWidth: '380px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: 'var(--shadow)',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text)',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
        }}>
          <TbGitBranch size={20} color="white" strokeWidth={2.2} />
        </div>
        <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)' }}>FlowDeps</span>
      </div>

      {/* ── STEP 1: Enter email ── */}
      {step === 1 && (
        <div style={cardStyle}>
          {/* Icon */}
          <div style={{
            width: '52px', height: '52px',
            background: 'rgba(59,130,246,0.1)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
          }}>
            <RiLockPasswordLine size={26} color="#3b82f6" />
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
            Reset password
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: 1.5 }}>
            Enter your account email address and we'll verify it so you can set a new password.
          </p>

          <form onSubmit={handleVerifyEmail}>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
                required
                autoFocus
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <button
              type="submit"
              disabled={verifyLoading}
              style={{
                width: '100%', padding: '11px',
                background: '#3b82f6', border: 'none', borderRadius: '8px',
                color: 'white', fontSize: '14px', fontWeight: '600',
                cursor: verifyLoading ? 'not-allowed' : 'pointer',
                opacity: verifyLoading ? 0.7 : 1,
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!verifyLoading) e.currentTarget.style.background = '#2563eb'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6'; }}
            >
              {verifyLoading ? 'Verifying...' : 'Verify email →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/login" style={{
              fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '4px',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <RiArrowLeftLine size={13} /> Back to sign in
            </Link>
          </div>
        </div>
      )}

      {/* ── STEP 2: Set new password ── */}
      {step === 2 && (
        <div style={cardStyle}>
          {/* Icon */}
          <div style={{
            width: '52px', height: '52px',
            background: 'rgba(16,185,129,0.1)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
          }}>
            <RiLockPasswordLine size={26} color="#10b981" />
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
            Set new password
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: 1.5 }}>
            Creating a new password for
          </p>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#3b82f6',
            fontWeight: '500',
            marginBottom: '24px',
          }}>
            {email}
          </div>

          <form onSubmit={handleResetPassword}>
            {/* New password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>New password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: '40px' }}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  autoFocus
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showNew ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Confirm new password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{
                    ...inputStyle,
                    paddingRight: '40px',
                    borderColor: confirmPassword && confirmPassword !== newPassword
                      ? '#ef4444'
                      : confirmPassword && confirmPassword === newPassword
                      ? '#10b981'
                      : 'var(--border)',
                  }}
                  placeholder="Re-enter new password"
                  required
                  onFocus={e => {
                    if (!confirmPassword || confirmPassword === newPassword)
                      e.target.style.borderColor = '#3b82f6';
                  }}
                  onBlur={e => {
                    if (confirmPassword && confirmPassword !== newPassword)
                      e.target.style.borderColor = '#ef4444';
                    else if (confirmPassword && confirmPassword === newPassword)
                      e.target.style.borderColor = '#10b981';
                    else
                      e.target.style.borderColor = 'var(--border)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showConfirm ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                </button>
              </div>
              {/* Password match indicator */}
              {confirmPassword && (
                <div style={{
                  fontSize: '12px',
                  marginTop: '5px',
                  color: confirmPassword === newPassword ? '#10b981' : '#ef4444',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  {confirmPassword === newPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={resetLoading || (confirmPassword && confirmPassword !== newPassword)}
              style={{
                width: '100%', padding: '11px',
                background: '#10b981', border: 'none', borderRadius: '8px',
                color: 'white', fontSize: '14px', fontWeight: '600',
                cursor: (resetLoading || (confirmPassword && confirmPassword !== newPassword))
                  ? 'not-allowed' : 'pointer',
                opacity: (resetLoading || (confirmPassword && confirmPassword !== newPassword)) ? 0.6 : 1,
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                if (!resetLoading && (!confirmPassword || confirmPassword === newPassword))
                  e.currentTarget.style.background = '#059669';
              }}
              onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; }}
            >
              {resetLoading ? 'Updating password...' : 'Set new password'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={() => { setStep(1); setNewPassword(''); setConfirmPassword(''); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: 'var(--text-secondary)',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <RiArrowLeftLine size={13} /> Use a different email
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
