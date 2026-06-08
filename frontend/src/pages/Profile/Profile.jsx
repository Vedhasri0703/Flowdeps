import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, fetchUserProfile } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ created: 0, claimed: 0, completed: 0 });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/tasks/dashboard');
      const s = res.data.stats;
      if (user?.role === 'creator') {
        setStats({ created: s.totalTasks || 0, claimed: s.inProgressTasks || 0, completed: s.completedTasks || 0 });
      } else {
        setStats({ created: 0, claimed: s.myInProgressCount || 0, completed: s.totalCompleted || 0 });
      }
    } catch { /* silent */ }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/auth/profile', { name });
      await fetchUserProfile();
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '24px' }}>Profile</h1>

      {/* Profile card — glassmorphic */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
        {/* Avatar + email + role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: '700', color: 'white', flexShrink: 0,
          }}>
            {getInitials()}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)' }}>{user?.email}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Role: {user?.role === 'creator' ? 'Creator' : 'Executor'}
            </div>
          </div>
        </div>

        {/* Name field */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '8px' }}>
            Name
          </label>
          <input
            className="form-control"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ maxWidth: '400px' }}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '8px 20px' }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Stats card */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '20px' }}>Stats</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text)' }}>{stats.created}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Created</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>{stats.claimed}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Claimed</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>{stats.completed}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
