import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';
import toast from 'react-hot-toast';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import {
  RiArrowLeftLine, RiEditLine, RiDeleteBinLine, RiPlayLine, RiCheckLine,
  RiSendPlaneLine, RiAlertLine, RiShieldLine, RiLockLine,
  RiArrowDownSLine, RiTimeLine, RiProhibitedLine, RiRefreshLine,
} from 'react-icons/ri';

/* ─── Status config ─── */
const STATUS_META = {
  pending:      { label: 'Pending',      color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)',  icon: <RiTimeLine size={13}/> },
  'in-progress':{ label: 'In Progress',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',   icon: <RiPlayLine size={13}/> },
  completed:    { label: 'Completed',    color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',   icon: <RiCheckLine size={13}/> },
  blocked:      { label: 'Blocked',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',    icon: <RiProhibitedLine size={13}/> },
};

/* valid executor transitions */
const TRANSITIONS = {
  pending:      ['in-progress'],
  'in-progress':['completed', 'blocked'],
  blocked:      ['pending', 'in-progress'],
  completed:    [],
};

/* ── Custom ReactFlow node ── */
const TaskNode = ({ data }) => {
  const colors = { pending: '#94a3b8', 'in-progress': '#3b82f6', completed: '#10b981', blocked: '#ef4444' };
  const c = colors[data.status] || '#94a3b8';
  return (
    <div style={{
      padding: '10px 18px', borderRadius: '8px', minWidth: '150px', textAlign: 'center',
      background: data.isMain
        ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
        : `${c}18`,
      border: data.isMain ? 'none' : `1px solid ${c}50`,
      color: data.isMain ? 'white' : c,
      fontSize: '13px', fontWeight: data.isMain ? '600' : '500',
      boxShadow: data.isMain ? '0 4px 20px rgba(59,130,246,0.3)' : 'none',
    }}>
      {data.isMain && <span style={{ marginRight: '5px' }}>★</span>}
      {data.label}
    </div>
  );
};
const nodeTypes = { taskNode: TaskNode };

/* ══════════════════════════════════════════════════════════
   STATUS ACTION PANEL — shown only to the assigned executor
   ══════════════════════════════════════════════════════════ */
const ExecutorActionPanel = ({ task, darkMode, onStatusChange, submitting }) => {
  const [open, setOpen]           = useState(false);
  const [pending, setPending]     = useState(null);   // chosen next status
  const [actualTime, setActualTime] = useState('');
  const [note, setNote]           = useState('');
  const panelRef                  = useRef(null);

  const transitions = TRANSITIONS[task.status] || [];
  const current     = STATUS_META[task.status] || STATUS_META.pending;

  /* close dropdown on outside click */
  useEffect(() => {
    const h = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSelect = (s) => { setPending(s); setOpen(false); };

  const handleConfirm = () => {
    if (!pending) return;
    onStatusChange(pending, actualTime, note);
    setPending(null); setActualTime(''); setNote('');
  };

  const handleCancel = () => { setPending(null); setActualTime(''); setNote(''); };

  /* nothing to do if no transitions available */
  if (transitions.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 16px', borderRadius: '10px',
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.25)',
      }}>
        <RiCheckLine size={16} color="#10b981" />
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>Task completed — no further actions</span>
      </div>
    );
  }

  /* colour palette driven by dark/light */
  const panelBg     = darkMode ? '#1c2128' : '#ffffff';
  const panelBorder = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(99,120,160,0.18)';
  const dropBg      = darkMode ? '#161b22' : '#ffffff';
  const dropBorder  = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(99,120,160,0.15)';
  const dropHover   = darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5fb';
  const labelColor  = darkMode ? '#8b949e' : '#64748b';
  const textColor   = darkMode ? '#e6edf3' : '#0f172a';
  const inputBg     = darkMode ? '#0d1117' : '#f8fafc';
  const inputBorder = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(99,120,160,0.2)';

  const pendingMeta = pending ? STATUS_META[pending] : null;

  return (
    <div style={{
      background: panelBg,
      border: `1px solid ${panelBorder}`,
      borderRadius: '12px',
      padding: '16px 18px',
      boxShadow: darkMode
        ? '0 8px 32px rgba(0,0,0,0.35)'
        : '0 4px 20px rgba(15,23,42,0.08)',
      width: '100%',
      maxWidth: '480px',
    }}>
      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: labelColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Update Progress
        </span>
        {/* Current status pill */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '3px 10px', borderRadius: '20px',
          background: current.bg, border: `1px solid ${current.border}`,
          fontSize: '12px', fontWeight: '600', color: current.color,
        }}>
          {current.icon} {current.label}
        </span>
      </div>

      {/* ── Step 1: choose new status ── */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: labelColor, marginBottom: '6px', fontWeight: '500' }}>
          Change status to
        </label>
        <div ref={panelRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              width: '100%', padding: '9px 14px',
              background: pendingMeta ? pendingMeta.bg : inputBg,
              border: `1px solid ${pendingMeta ? pendingMeta.border : inputBorder}`,
              borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: '13px', fontWeight: '500',
              color: pendingMeta ? pendingMeta.color : labelColor,
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              {pendingMeta ? pendingMeta.icon : <RiRefreshLine size={13} />}
              {pendingMeta ? pendingMeta.label : 'Select new status…'}
            </span>
            <RiArrowDownSLine size={16} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
          </button>

          {/* Dropdown */}
          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              background: dropBg, border: `1px solid ${dropBorder}`,
              borderRadius: '8px', zIndex: 100,
              boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 4px 16px rgba(15,23,42,0.1)',
              overflow: 'hidden',
            }}>
              {transitions.map(s => {
                const m = STATUS_META[s];
                return (
                  <button
                    key={s}
                    onClick={() => handleSelect(s)}
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      fontSize: '13px', fontWeight: '500', color: textColor,
                      fontFamily: 'inherit', textAlign: 'left',
                      borderBottom: `1px solid ${dropBorder}`,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = dropHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Status colour swatch */}
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
                      background: m.bg, border: `1px solid ${m.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: m.color,
                    }}>
                      {m.icon}
                    </span>
                    <div>
                      <div style={{ color: m.color, fontWeight: '600', fontSize: '13px' }}>{m.label}</div>
                      <div style={{ color: labelColor, fontSize: '11px', marginTop: '1px' }}>
                        {s === 'in-progress' && 'Start working on this task'}
                        {s === 'completed'   && 'Mark as done — notifies creator'}
                        {s === 'blocked'     && 'Something is preventing progress'}
                        {s === 'pending'     && 'Reset back to unstarted'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Step 2: actual hours (only for completed) ── */}
      {pending === 'completed' && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: labelColor, marginBottom: '6px', fontWeight: '500' }}>
            Actual hours spent <span style={{ color: labelColor, fontWeight: '400' }}>(optional)</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 3.5"
            value={actualTime}
            onChange={e => setActualTime(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px',
              background: inputBg, border: `1px solid ${inputBorder}`,
              borderRadius: '8px', color: textColor,
              fontSize: '13px', fontFamily: 'inherit', outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = inputBorder}
          />
        </div>
      )}

      {/* ── Step 2b: note (for blocked) ── */}
      {pending === 'blocked' && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: labelColor, marginBottom: '6px', fontWeight: '500' }}>
            Blocking reason <span style={{ color: labelColor, fontWeight: '400' }}>(optional)</span>
          </label>
          <textarea
            placeholder="Describe what is blocking this task…"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            style={{
              width: '100%', padding: '9px 12px',
              background: inputBg, border: `1px solid ${inputBorder}`,
              borderRadius: '8px', color: textColor,
              fontSize: '13px', fontFamily: 'inherit', outline: 'none',
              resize: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = '#ef4444'}
            onBlur={e => e.target.style.borderColor = inputBorder}
          />
        </div>
      )}

      {/* ── Confirm / Cancel ── */}
      {pending && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              flex: 1, padding: '10px',
              background: pendingMeta.color,
              border: 'none', borderRadius: '8px',
              color: 'white', fontSize: '13px', fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.65 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              fontFamily: 'inherit', transition: 'opacity 0.15s',
            }}
          >
            {submitting ? (
              <><span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }} />Updating…</>
            ) : (
              <>{pendingMeta.icon} Confirm — {pendingMeta.label}</>
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={submitting}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: `1px solid ${inputBorder}`,
              borderRadius: '8px', color: labelColor,
              fontSize: '13px', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN TASK DETAIL PAGE
   ══════════════════════════════════════════════════════════ */
const TaskDetail = () => {
  const { id } = useParams();
  const { user, darkMode } = useAuth();
  const navigate  = useNavigate();

  const [task, setTask]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [comment, setComment]   = useState('');
  const [aiData, setAiData]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => { fetchTask(); }, [id]);

  const fetchTask = async () => {
    try {
      const res = await axios.get(`/tasks/${id}`);
      setTask(res.data.task);
      buildGraph(res.data.task);
      fetchAI(id);
    } catch {
      toast.error('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const fetchAI = async (taskId) => {
    try {
      const [r, d] = await Promise.allSettled([
        axios.get(`/ai/risk/${taskId}`),
        axios.get(`/ai/delay/${taskId}`),
      ]);
      setAiData({
        risk:  r.status === 'fulfilled' ? r.value.data  : null,
        delay: d.status === 'fulfilled' ? d.value.data  : null,
      });
    } catch { /* silent */ }
  };

  const buildGraph = (t) => {
    const colors = { pending: '#94a3b8', 'in-progress': '#3b82f6', completed: '#10b981', blocked: '#ef4444' };
    const newNodes = [];
    const newEdges = [];

    newNodes.push({
      id: t._id, type: 'taskNode',
      position: { x: 220, y: 120 },
      data: { label: t.title, status: t.status, isMain: true },
    });

    (t.dependencies || []).forEach((dep, i) => {
      const y = (i - (t.dependencies.length - 1) / 2) * 80 + 120;
      newNodes.push({ id: dep._id, type: 'taskNode', position: { x: 0, y }, data: { label: dep.title, status: dep.status, isMain: false } });
      newEdges.push({ id: `e-${dep._id}-${t._id}`, source: dep._id, target: t._id, animated: dep.status !== 'completed', style: { stroke: dep.status === 'completed' ? '#10b981' : '#3b82f6', strokeWidth: 2 } });
    });

    (t.dependentTasks || []).forEach((dep, i) => {
      const y = (i - (t.dependentTasks.length - 1) / 2) * 80 + 120;
      newNodes.push({ id: dep._id + '_out', type: 'taskNode', position: { x: 440, y }, data: { label: dep.title, status: dep.status, isMain: false } });
      newEdges.push({ id: `e-${t._id}-${dep._id}`, source: t._id, target: dep._id + '_out', animated: t.status !== 'completed', style: { stroke: colors[t.status] || '#94a3b8', strokeWidth: 2 } });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  /* ── Status change handler ── */
  const handleStatusChange = async (newStatus, actualTime, note) => {
    setSubmitting(true);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'completed' && actualTime) payload.actualTime = parseFloat(actualTime);
      if (note) payload.note = note;

      await axios.put(`/tasks/execute/${id}`, payload);

      const messages = {
        'in-progress': '🔄 Task is now in progress!',
        completed:     '✅ Task marked as complete!',
        blocked:       '🚫 Task marked as blocked.',
        pending:       '⏳ Task reset to pending.',
      };
      toast.success(messages[newStatus] || 'Status updated');
      await fetchTask();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      navigate('/tasks');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Cannot delete — other tasks depend on it');
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await axios.post(`/tasks/${id}/comments`, { text: comment });
      setComment('');
      fetchTask();
    } catch { toast.error('Failed to add comment'); }
  };

  /* ── Loading / not-found ── */
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div className="spinner" />
    </div>
  );
  if (!task) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Task not found</div>;

  /* ── Derived flags ── */
  const allDepsCompleted = !task.dependencies?.length || task.dependencies.every(d => d.status === 'completed');
  const isMyTask    = task.executedBy?._id === user?._id || task.executedBy === user?._id;
  const canClaim    = user?.role === 'executor' && task.status === 'pending' && allDepsCompleted && !task.executedBy;
  const canUpdate   = user?.role === 'executor' && isMyTask && task.status !== 'completed';
  const canEdit     = user?.role === 'creator'  && task.status === 'pending';
  const depsBlocking = !allDepsCompleted && task.status === 'pending';

  const flowBg = darkMode ? '#161b22' : '#f8fafc';
  const currentMeta = STATUS_META[task.status] || STATUS_META.pending;

  return (
    <div className="fade-in">
      {/* Back button */}
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '16px', padding: '5px 10px' }}>
        <RiArrowLeftLine size={14} /> Back to tasks
      </button>

      {/* ── Title + top actions ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>{task.title}</h1>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Live status pill */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '20px',
              background: currentMeta.bg, border: `1px solid ${currentMeta.border}`,
              fontSize: '12px', fontWeight: '600', color: currentMeta.color,
            }}>
              {currentMeta.icon} {currentMeta.label}
            </span>
            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
            {aiData?.risk && (
              <span style={{
                fontSize: '12px', fontWeight: '500', padding: '2px 8px', borderRadius: '4px',
                color:       aiData.risk.riskScore < 25 ? '#10b981' : aiData.risk.riskScore < 60 ? '#f59e0b' : '#ef4444',
                background:  aiData.risk.riskScore < 25 ? 'rgba(16,185,129,0.1)'  : aiData.risk.riskScore < 60 ? 'rgba(245,158,11,0.1)'  : 'rgba(239,68,68,0.1)',
                border: `1px solid ${aiData.risk.riskScore < 25 ? 'rgba(16,185,129,0.3)' : aiData.risk.riskScore < 60 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                Risk {aiData.risk.riskScore}
              </span>
            )}
          </div>
        </div>

        {/* Creator edit/delete */}
        {canEdit && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => navigate(`/tasks/edit/${id}`)}>
              <RiEditLine size={14} /> Edit
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <RiDeleteBinLine size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Delay warning ── */}
      {aiData?.delay?.willBeDelayed && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '13px', color: '#ef4444',
        }}>
          <RiAlertLine size={16} />
          <span><strong>Delay predicted:</strong> {aiData.delay.message}</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          EXECUTOR ACTION PANEL — claim or update status
          ════════════════════════════════════════════════ */}
      {user?.role === 'executor' && (
        <div style={{ marginBottom: '20px' }}>

          {/* ── Claim banner (not yet assigned) ── */}
          {canClaim && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderRadius: '12px',
              background: darkMode
                ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.12))'
                : 'linear-gradient(135deg, rgba(59,130,246,0.07), rgba(139,92,246,0.07))',
              border: `1px solid ${darkMode ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.25)'}`,
              boxShadow: '0 2px 12px rgba(59,130,246,0.08)',
              gap: '16px', flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '2px' }}>
                  🎯 This task is ready to claim
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  All dependencies completed — you can start working on it now
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => handleStatusChange('in-progress')}
                disabled={submitting}
                style={{ padding: '10px 24px', fontWeight: '600', fontSize: '14px', flexShrink: 0 }}
              >
                <RiPlayLine size={15} />
                {submitting ? 'Claiming…' : 'Claim task'}
              </button>
            </div>
          )}

          {/* ── Deps blocking banner ── */}
          {depsBlocking && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <RiLockLine size={18} color="#ef4444" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444' }}>Waiting for dependencies</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                  {task.dependencies?.filter(d => d.status !== 'completed').length} dependency task(s) not yet complete
                </div>
              </div>
            </div>
          )}

          {/* ── Status update panel (already claimed) ── */}
          {canUpdate && (
            <ExecutorActionPanel
              task={task}
              darkMode={darkMode}
              onStatusChange={handleStatusChange}
              submitting={submitting}
            />
          )}

          {/* ── Completed notice ── */}
          {isMyTask && task.status === 'completed' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', borderRadius: '10px',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            }}>
              <RiCheckLine size={18} color="#10b981" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>You completed this task</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                  The creator has been notified. Nice work!
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '16px' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Description */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '10px' }}>Description</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {task.description || 'No description provided.'}
            </p>
            {task.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                {task.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
              </div>
            )}
          </div>

          {/* Dependency graph */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '12px' }}>Dependency graph</h3>
            <div style={{ height: '260px', background: flowBg, borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <ReactFlow
                nodes={nodes} edges={edges}
                onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.3 }}
                attributionPosition="bottom-right"
              >
                <Background color={darkMode ? '#30363d' : '#e2e8f0'} gap={20} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Depends on ({task.dependencies?.length || 0})
                </div>
                {task.dependencies?.length > 0 ? task.dependencies.map(dep => (
                  <div key={dep._id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dep.status === 'completed' ? '#10b981' : '#94a3b8', flexShrink: 0 }} />
                    <span onClick={() => navigate(`/tasks/${dep._id}`)} style={{ fontSize: '12px', color: '#3b82f6', cursor: 'pointer' }}>{dep.title}</span>
                    <span className={`badge badge-${dep.status}`} style={{ fontSize: '10px' }}>{dep.status}</span>
                  </div>
                )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No dependencies</div>}
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Blocks ({task.dependentTasks?.length || 0})
                </div>
                {task.dependentTasks?.length > 0 ? task.dependentTasks.map(dep => (
                  <div key={dep._id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} />
                    <span onClick={() => navigate(`/tasks/${dep._id}`)} style={{ fontSize: '12px', color: '#3b82f6', cursor: 'pointer' }}>{dep.title}</span>
                  </div>
                )) : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nothing depends on this</div>}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '12px' }}>Comments</h3>
            {!task.comments?.length && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>No comments yet.</div>
            )}
            {task.comments?.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div className="avatar" style={{ width: '26px', height: '26px', fontSize: '10px', flexShrink: 0 }}>
                  {c.user?.name?.charAt(0) || 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{c.user?.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{c.text}</p>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment… (Ctrl+Enter to post)"
                className="form-textarea"
                style={{ flex: 1, minHeight: '56px' }}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleComment(); }}
              />
              <button className="btn btn-primary" onClick={handleComment} style={{ alignSelf: 'flex-end' }}>
                <RiSendPlaneLine size={14} /> Post
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Details */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '12px' }}>Details</h3>
            <DetailRow label="Created by"  value={task.createdBy?.name || '—'} />
            <DetailRow label="Assigned to" value={task.executedBy?.name || 'Unassigned'} />
            <DetailRow label="Estimated"   value={task.estimatedTime ? `${task.estimatedTime}h` : '—'} />
            <DetailRow label="Actual"      value={task.actualTime    ? `${task.actualTime}h`    : '—'} />
            <DetailRow label="Due date"    value={new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
            <DetailRow label="Created"     value={new Date(task.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
          </div>

          {/* History */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '12px' }}>History</h3>
            {!task.history?.length ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No status changes yet.</div>
            ) : (
              [...task.history].reverse().map((h, i) => {
                const meta = STATUS_META[h.status] || STATUS_META.pending;
                return (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      background: meta.bg, border: `1px solid ${meta.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: meta.color, marginTop: '1px',
                    }}>
                      {meta.icon}
                    </span>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500' }}>{h.comment}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(h.changedAt).toLocaleDateString()} {new Date(h.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* AI Risk */}
          {aiData?.risk && (
            <div className="glass-card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RiShieldLine size={14} color="#8b5cf6" /> AI Risk Analysis
              </h3>

              {/* Score + bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Risk score</span>
                  <span style={{
                    fontSize: '13px', fontWeight: '700',
                    color: aiData.risk.riskScore < 25 ? '#10b981' : aiData.risk.riskScore < 60 ? '#f59e0b' : '#ef4444',
                  }}>
                    {aiData.risk.riskScore}/100 — {aiData.risk.riskLevel?.toUpperCase()}
                  </span>
                </div>
                <div className="progress-bar" style={{ height: '6px' }}>
                  <div className="progress-fill" style={{
                    width: `${aiData.risk.riskScore}%`,
                    background: aiData.risk.riskScore < 25
                      ? 'linear-gradient(90deg,#10b981,#34d399)'
                      : aiData.risk.riskScore < 60
                      ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                      : 'linear-gradient(90deg,#ef4444,#f87171)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>

              {/* Message */}
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                {aiData.risk.message}
              </p>

              {/* Factor breakdown */}
              {aiData.risk.breakdown && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {Object.entries(aiData.risk.breakdown).map(([key, f]) => {
                    const pct  = Math.round((f.score / f.weight) * 100);
                    const barColor = pct < 40 ? '#10b981' : pct < 75 ? '#f59e0b' : '#ef4444';
                    const labels = {
                      dependencyBlockage: 'Dep blockage',
                      timePressure:       'Time pressure',
                      prioritySeverity:   'Priority severity',
                      ambiguity:          'Requirement clarity',
                    };
                    return (
                      <div key={key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                            {labels[key] || key}
                          </span>
                          <span style={{ fontSize: '11px', color: barColor, fontWeight: '600' }}>
                            {f.score}/{f.weight}
                          </span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${pct}%`, height: '100%',
                            background: barColor, borderRadius: '2px',
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                          {f.detail}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Threshold legend */}
              <div style={{
                marginTop: '12px', padding: '8px 10px',
                background: 'var(--bg-card-hover)',
                borderRadius: '6px', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Score thresholds
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    { label: 'Low', range: '< 25',   color: '#10b981' },
                    { label: 'Med', range: '25–59',  color: '#f59e0b' },
                    { label: 'High',range: '≥ 60',   color: '#ef4444' },
                  ].map(t => (
                    <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t.label} {t.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500', textAlign: 'right', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {value}
    </span>
  </div>
);

export default TaskDetail;
