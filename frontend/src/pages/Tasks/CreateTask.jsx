import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import toast from 'react-hot-toast';
import { RiCloseLine, RiSparklingLine, RiCheckLine, RiInformationLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

/* ─── priority colour map ─── */
const PRIORITY_COLORS = {
  low:      { bg: '#dcfce7', border: '#86efac', text: '#15803d' },
  medium:   { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' },
  high:     { bg: '#fef3c7', border: '#fcd34d', text: '#b45309' },
  critical: { bg: '#fee2e2', border: '#fca5a5', text: '#b91c1c' },
};

const CreateTask = () => {
  const navigate = useNavigate();
  const { darkMode } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    estimatedTime: '',
    dueDate: '',
    dependencies: [],
    tags: [],
  });

  const [allTasks, setAllTasks]               = useState([]);
  const [tagInput, setTagInput]               = useState('');
  const [loading, setLoading]                 = useState(false);

  /* AI priority */
  const [aiPriority, setAiPriority]           = useState(null);   // tooltip data
  const [aiLoading, setAiLoading]             = useState(false);

  /* AI dependency suggestions */
  const [depSuggestions, setDepSuggestions]   = useState([]);     // [{taskId,title,status,reason,score}]
  const [depSugLoading, setDepSugLoading]     = useState(false);
  const [showSugPanel, setShowSugPanel]       = useState(false);

  /* dep search dropdown */
  const [depSearch, setDepSearch]             = useState('');
  const [showDepDropdown, setShowDepDropdown] = useState(false);
  const depRef                                = useRef(null);

  useEffect(() => {
    axios.get('/tasks').then(r => setAllTasks(r.data.tasks || [])).catch(() => {});
  }, []);

  /* close dropdown on outside click */
  useEffect(() => {
    const h = (e) => {
      if (depRef.current && !depRef.current.contains(e.target)) setShowDepDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  /* ── tags ── */
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };
  const removeTag = (tag) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  /* ── deps ── */
  const toggleDep = (taskId) => {
    setForm(f => ({
      ...f,
      dependencies: f.dependencies.includes(taskId)
        ? f.dependencies.filter(d => d !== taskId)
        : [...f.dependencies, taskId],
    }));
  };

  /* ── AI: priority suggest ── */
  const getAIPriority = async () => {
    if (!form.title) { toast.error('Enter a title first'); return; }
    setAiLoading(true);
    try {
      const res = await axios.post('/ai/priority/recommend', {
        title: form.title,
        description: form.description,
        dueDate: form.dueDate,
        taskDependencies: form.dependencies,
      });
      setAiPriority(res.data);
    } catch {
      toast.error('AI suggestion failed');
    } finally {
      setAiLoading(false);
    }
  };

  /* ── AI: dependency suggest ── */
  const getAIDepSuggestions = async () => {
    if (!form.title) { toast.error('Enter a title first'); return; }
    setDepSugLoading(true);
    setShowSugPanel(false);
    try {
      const res = await axios.post('/ai/dependencies/suggest', {
        title: form.title,
        description: form.description,
        tags: form.tags,
        existingDependencies: form.dependencies,
      });
      const suggestions = res.data.suggestions || [];
      setDepSuggestions(suggestions);
      setShowSugPanel(true);
      if (suggestions.length === 0) toast('No matching dependencies found');
    } catch {
      toast.error('AI suggest failed');
    } finally {
      setDepSugLoading(false);
    }
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.dueDate)       { toast.error('Due date is required'); return; }
    setLoading(true);
    try {
      await axios.post('/tasks/create', form);
      toast.success('Task created successfully');
      navigate('/tasks');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const availableDeps = allTasks.filter(t =>
    !form.dependencies.includes(t._id) &&
    (depSearch === '' || t.title.toLowerCase().includes(depSearch.toLowerCase()))
  );
  const selectedDeps = allTasks.filter(t => form.dependencies.includes(t._id));

  /* ── shared tooltip card style (theme-aware) ── */
  const tooltipCard = {
    position: 'fixed',
    top: '72px',
    right: '24px',
    width: '300px',
    background: darkMode ? '#1c2128' : '#ffffff',
    border: `1px solid ${darkMode ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.4)'}`,
    borderRadius: '10px',
    padding: '16px',
    zIndex: 200,
    boxShadow: darkMode
      ? '0 8px 32px rgba(0,0,0,0.5)'
      : '0 8px 32px rgba(15,23,42,0.12)',
  };

  const sugPanel = {
    position: 'fixed',
    top: '72px',
    right: '24px',
    width: '320px',
    background: darkMode ? '#1c2128' : '#ffffff',
    border: `1px solid ${darkMode ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.25)'}`,
    borderRadius: '10px',
    zIndex: 200,
    boxShadow: darkMode
      ? '0 8px 32px rgba(0,0,0,0.5)'
      : '0 8px 32px rgba(15,23,42,0.12)',
    overflow: 'hidden',
  };

  const tooltipText   = darkMode ? '#e6edf3' : '#0f172a';
  const tooltipMuted  = darkMode ? '#8b949e' : '#64748b';
  const suggestionReasonText = darkMode ? '#8b949e' : '#475569'; /* darker for reason text */
  const dropdownBg    = darkMode ? '#1c2128' : '#ffffff';
  const dropdownBorder= darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(99,120,160,0.18)';
  const dropdownHover = darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5fb';
  const dropdownText  = darkMode ? '#e6edf3' : '#0f172a';
  const tagColor      = darkMode ? '#60a5fa' : '#0d47a1'; /* darker blue for contrast */
  const tagBg         = darkMode ? 'rgba(59,130,246,0.1)' : '#e3f2fd'; /* lighter blue bg */
  const tagBorder     = darkMode ? 'rgba(59,130,246,0.25)' : '#2196f3'; /* solid border */
  const depRowBg      = darkMode ? 'rgba(59,130,246,0.06)' : '#f3f4f6'; /* lighter gray bg */
  const depRowBorder  = darkMode ? 'rgba(59,130,246,0.18)' : '#e5e7eb'; /* solid gray border */
  const depRowText    = darkMode ? '#e6edf3' : '#111827'; /* darker text */
  const emptyText     = darkMode ? '#6e7681' : '#6b7280'; /* slightly darker */
  const headingText   = darkMode ? '#e6edf3' : '#111827'; /* dark */
  const subText       = darkMode ? '#6e7681' : '#4b5563'; /* darker */

  return (
    <div className="fade-in" style={{ maxWidth: '680px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '24px' }}>
        Create task
      </h1>

      {/* ══ AI PRIORITY TOOLTIP ══ */}
      {aiPriority && (
        <div style={tooltipCard}>
          {/* header strip */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            margin: '-16px -16px 14px',
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <RiCheckLine size={13} color="white" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>
              AI Priority Suggestion
            </span>
            <button
              onClick={() => setAiPriority(null)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 0 }}
            >
              <RiCloseLine size={16} />
            </button>
          </div>

          {/* recommended badge */}
          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', color: tooltipMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recommended
            </span>
            <div style={{ marginTop: '4px' }}>
              {(() => {
                const p = aiPriority.recommendedPriority;
                const c = PRIORITY_COLORS[p] || PRIORITY_COLORS.medium;
                return (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '4px 12px', borderRadius: '20px',
                    background: c.bg, border: `1px solid ${c.border}`,
                    fontSize: '13px', fontWeight: '700', color: c.text,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {p}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* message */}
          <p style={{ fontSize: '12px', color: tooltipText, lineHeight: 1.6, marginBottom: '10px' }}>
            {aiPriority.message}
          </p>

          {/* factors */}
          {aiPriority.factors?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              {aiPriority.factors.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                  <RiInformationLine size={12} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: suggestionReasonText, lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* actions */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px', flex: 1 }}
              onClick={() => {
                setForm(f => ({ ...f, priority: aiPriority.recommendedPriority }));
                setAiPriority(null);
                toast.success(`Priority set to ${aiPriority.recommendedPriority}`);
              }}
            >
              Apply {aiPriority.recommendedPriority}
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => setAiPriority(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ══ AI DEP SUGGESTION PANEL ══ */}
      {showSugPanel && (
        <div style={sugPanel}>
          {/* header */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <RiSparklingLine size={14} color="white" />
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'white', flex: 1 }}>
              AI Dependency Suggestions
            </span>
            {/* badge: count */}
            <span style={{
              background: 'rgba(255,255,255,0.25)',
              color: 'white',
              borderRadius: '10px',
              padding: '1px 8px',
              fontSize: '11px',
              fontWeight: '700',
            }}>
              {depSuggestions.length}
            </span>
            <button
              onClick={() => setShowSugPanel(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', padding: 0, marginLeft: '4px' }}
            >
              <RiCloseLine size={16} />
            </button>
          </div>

          {/* suggestion rows */}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {depSuggestions.map((s, i) => {
              const alreadyAdded = form.dependencies.includes(s.taskId?.toString?.() || s.taskId);
              return (
                <div key={i} style={{
                  padding: '12px 14px',
                  borderBottom: `1px solid ${dropdownBorder}`,
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  background: alreadyAdded
                    ? (darkMode ? 'rgba(16,185,129,0.07)' : 'rgba(16,185,129,0.05)')
                    : 'transparent',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: tooltipText }}>{s.title}</span>
                      <span className={`badge badge-${s.status}`} style={{ fontSize: '10px' }}>{s.status}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: suggestionReasonText, lineHeight: 1.5 }}>{s.reason}</div>
                    {/* match score bar */}
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ flex: 1, height: '3px', background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', borderRadius: '2px' }}>
                        <div style={{ width: `${s.score}%`, height: '100%', background: '#3b82f6', borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '10px', color: tooltipMuted, flexShrink: 0 }}>{s.score}%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const id = s.taskId?.toString?.() || s.taskId;
                      if (!alreadyAdded) toggleDep(id);
                      else toggleDep(id); // deselect
                    }}
                    style={{
                      flexShrink: 0,
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: alreadyAdded ? '1px solid #10b981' : '1px solid #3b82f6',
                      background: alreadyAdded
                        ? (darkMode ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)')
                        : (darkMode ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)'),
                      color: alreadyAdded ? '#10b981' : '#3b82f6',
                      fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                  >
                    {alreadyAdded ? '✓ Added' : '+ Add'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ FORM ══ */}
      <form onSubmit={handleSubmit}>
        {/* ── Main card ── */}
        <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>

          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="form-control"
              placeholder="Task title"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Describe the task..."
              rows={4}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>

            {/* Priority + AI button */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Priority</label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <select name="priority" value={form.priority} onChange={handleChange} className="form-select" style={{ flex: 1 }}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
                <button
                  type="button"
                  onClick={getAIPriority}
                  disabled={aiLoading}
                  className="btn-icon"
                  title="AI suggest priority"
                  style={{ flexShrink: 0 }}
                >
                  <RiSparklingLine size={14} color={aiLoading ? 'var(--text-muted)' : '#8b5cf6'} />
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estimated hours</label>
              <input
                name="estimatedTime"
                type="number"
                min="0"
                step="0.5"
                value={form.estimatedTime}
                onChange={handleChange}
                className="form-control"
                placeholder="e.g. 4"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Due date</label>
              <input
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          {/* Tags */}
          <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
            <label className="form-label">Tags</label>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {form.tags.map(tag => (
                  <span key={tag} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '2px 8px',
                    background: tagBg, border: `1px solid ${tagBorder}`,
                    borderRadius: '4px', fontSize: '12px', color: tagColor,
                  }}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: tagColor, padding: 0, lineHeight: 1, display: 'flex' }}
                    >
                      <RiCloseLine size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                className="form-control"
                placeholder="Add tag and press Enter"
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-secondary" onClick={addTag}>Add</button>
            </div>
          </div>
        </div>

        {/* ── Dependencies card ── */}
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '500', color: headingText }}>Dependencies</h3>
              <p style={{ fontSize: '12px', color: subText, marginTop: '2px' }}>
                task must wait for these to complete
              </p>
            </div>

            {/* AI suggest button — with suggestion count badge */}
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '5px 10px', gap: '5px' }}
                disabled={depSugLoading}
                onClick={getAIDepSuggestions}
              >
                <RiSparklingLine size={12} color="#8b5cf6" />
                {depSugLoading ? 'Thinking...' : 'AI suggest'}
              </button>
              {/* badge: number of suggestions found */}
              {depSuggestions.length > 0 && !showSugPanel && (
                <span style={{
                  position: 'absolute',
                  top: '-7px', right: '-7px',
                  width: '18px', height: '18px',
                  borderRadius: '50%',
                  background: '#8b5cf6',
                  color: 'white',
                  fontSize: '10px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${darkMode ? '#1c2128' : '#ffffff'}`,
                  cursor: 'pointer',
                }}
                  onClick={() => setShowSugPanel(true)}
                >
                  {depSuggestions.length}
                </span>
              )}
            </div>
          </div>

          {/* Selected deps */}
          {selectedDeps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
              {selectedDeps.map(dep => (
                <div key={dep._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: depRowBg, border: `1px solid ${depRowBorder}`,
                  borderRadius: '6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge badge-${dep.status}`} style={{ fontSize: '10px' }}>{dep.status}</span>
                    <span style={{ fontSize: '13px', color: depRowText }}>{dep.title}</span>
                  </div>
                  <button type="button" className="btn-icon" onClick={() => toggleDep(dep._id)}>
                    <RiCloseLine size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: emptyText, marginBottom: '10px' }}>No dependencies added yet.</p>
          )}

          {/* Dep search dropdown */}
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
                background: dropdownBg,
                border: `1px solid ${dropdownBorder}`,
                borderRadius: '6px', marginTop: '4px',
                zIndex: 50, maxHeight: '200px', overflowY: 'auto',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              }}>
                {availableDeps.slice(0, 8).map(t => (
                  <div
                    key={t._id}
                    onClick={() => { toggleDep(t._id); setDepSearch(''); setShowDepDropdown(false); }}
                    style={{
                      padding: '8px 12px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      fontSize: '13px', color: dropdownText,
                      transition: 'background 0.1s',
                      borderBottom: `1px solid ${dropdownBorder}`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = dropdownHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className={`badge badge-${t.status}`} style={{ fontSize: '10px' }}>{t.status}</span>
                    <span style={{ flex: 1 }}>{t.title}</span>
                    {t.tags?.length > 0 && (
                      <span style={{ fontSize: '10px', color: darkMode ? '#6e7681' : '#94a3b8' }}>
                        {t.tags.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create task'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/tasks')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTask;
