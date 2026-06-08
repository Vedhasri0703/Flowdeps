import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import toast from 'react-hot-toast';
import { RiCloseLine } from 'react-icons/ri';

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [depSearch, setDepSearch] = useState('');
  const [showDepDropdown, setShowDepDropdown] = useState(false);
  const depRef = useRef(null);

  useEffect(() => {
    Promise.all([
      axios.get(`/tasks/${id}`),
      axios.get('/tasks'),
    ]).then(([taskRes, tasksRes]) => {
      const t = taskRes.data.task;
      setForm({
        title: t.title,
        description: t.description || '',
        priority: t.priority,
        estimatedTime: t.estimatedTime || '',
        dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
        dependencies: t.dependencies?.map(d => d._id) || [],
        tags: t.tags || [],
      });
      setAllTasks(tasksRes.data.tasks || []);
    }).catch(() => {
      toast.error('Failed to load task');
      navigate('/tasks');
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const handler = (e) => {
      if (depRef.current && !depRef.current.contains(e.target)) setShowDepDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading || !form) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div className="spinner" />
    </div>
  );

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };

  const removeTag = (tag) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const toggleDep = (taskId) => {
    setForm(f => ({
      ...f,
      dependencies: f.dependencies.includes(taskId)
        ? f.dependencies.filter(d => d !== taskId)
        : [...f.dependencies, taskId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`/tasks/${id}`, form);
      toast.success('Task updated');
      navigate(`/tasks/${id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const availableDeps = allTasks.filter(t =>
    t._id !== id &&
    !form.dependencies.includes(t._id) &&
    (depSearch === '' || t.title.toLowerCase().includes(depSearch.toLowerCase()))
  );

  const selectedDeps = allTasks.filter(t => form.dependencies.includes(t._id));

  return (
    <div className="fade-in" style={{ maxWidth: '680px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '24px' }}>Edit task</h1>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input name="title" value={form.title} onChange={handleChange} className="form-control" required />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="form-textarea" rows={4} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="form-select">
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estimated hours</label>
              <input name="estimatedTime" type="number" min="0" step="0.5" value={form.estimatedTime} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Due date</label>
              <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} className="form-control" required />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
            <label className="form-label">Tags</label>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {form.tags.map(tag => (
                  <span key={tag} className="tag" style={{ fontSize: '12px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}>
                      <RiCloseLine size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} className="form-control" placeholder="Add tag and press enter" style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary" onClick={addTag}>Add</button>
            </div>
          </div>
        </div>

        {/* Dependencies card */}
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>Dependencies</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>task must wait for these to complete</p>

          {selectedDeps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
              {selectedDeps.map(dep => (
                <div key={dep._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'rgba(59,130,246,0.06)',
                  border: '1px solid rgba(59,130,246,0.18)',
                  borderRadius: '6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge badge-${dep.status}`} style={{ fontSize: '10px' }}>{dep.status}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text)' }}>{dep.title}</span>
                  </div>
                  <button type="button" className="btn-icon" onClick={() => toggleDep(dep._id)}>
                    <RiCloseLine size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>No dependencies selected.</div>
          )}

          <div ref={depRef} style={{ position: 'relative' }}>
            <input
              className="form-control"
              placeholder="Search tasks to add as dependency..."
              value={depSearch}
              onChange={e => { setDepSearch(e.target.value); setShowDepDropdown(true); }}
              onFocus={() => setShowDepDropdown(true)}
            />
            {showDepDropdown && availableDeps.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '6px', marginTop: '4px',
                zIndex: 50, maxHeight: '200px', overflowY: 'auto',
                boxShadow: 'var(--shadow)',
              }}>
                {availableDeps.slice(0, 8).map(t => (
                  <div
                    key={t._id}
                    onClick={() => { toggleDep(t._id); setDepSearch(''); setShowDepDropdown(false); }}
                    style={{
                      padding: '8px 12px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      fontSize: '13px', color: 'var(--text)',
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className={`badge badge-${t.status}`} style={{ fontSize: '10px' }}>{t.status}</span>
                    {t.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(`/tasks/${id}`)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTask;
