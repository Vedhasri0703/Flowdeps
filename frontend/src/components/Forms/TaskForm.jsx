import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { FaMagic, FaSave, FaTimes } from 'react-icons/fa';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

const TaskForm = ({ initialData, onSubmit, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    estimatedTime: '',
    dueDate: '',
    dependencies: [],
    tags: [],
  });
  const [allTasks, setAllTasks] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  useEffect(() => {
    fetchAllTasks();
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        priority: initialData.priority || 'medium',
        estimatedTime: initialData.estimatedTime || '',
        dueDate: initialData.dueDate?.split('T')[0] || '',
        dependencies: initialData.dependencies?.map(d => d._id) || [],
        tags: initialData.tags || [],
      });
    }
  }, [initialData]);

  const fetchAllTasks = async () => {
    try {
      const response = await axios.get('/tasks');
      setAllTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleDependencyChange = (selectedOptions) => {
    setFormData(prev => ({
      ...prev,
      dependencies: selectedOptions.map(opt => opt.value),
    }));
  };

  const getAISuggestions = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/ai/priority/recommend', {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        taskDependencies: formData.dependencies,
      });
      setAiSuggestions(response.data);
      toast.success('AI recommendations ready!');
    } catch (error) {
      toast.error('Failed to get AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  const applyAIPriority = () => {
    if (aiSuggestions?.recommendedPriority) {
      setFormData(prev => ({ ...prev, priority: aiSuggestions.recommendedPriority }));
      toast.success(`Priority set to ${aiSuggestions.recommendedPriority}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) {
      toast.error('Title and due date are required');
      return;
    }
    onSubmit(formData);
  };

  const dependencyOptions = allTasks
    .filter(task => task._id !== initialData?._id && task.status !== 'completed')
    .map(task => ({
      value: task._id,
      label: `${task.title} (${task.status})`,
    }));

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#3b82f6' },
    { value: 'high', label: 'High', color: '#f59e0b' },
    { value: 'critical', label: 'Critical', color: '#ef4444' },
  ];

  return (
    <form onSubmit={handleSubmit}>
      {/* AI Assistant Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setShowAIPanel(!showAIPanel)}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          <FaMagic /> AI Assistant
        </button>
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '24px',
        }}>
          <h4 style={{ color: 'var(--text)', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>AI Task Assistant</h4>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Task title for AI analysis"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="form-control"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={getAISuggestions}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
          
          {aiSuggestions && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ color: 'var(--text)', marginBottom: '8px' }}>
                <strong>Recommended Priority:</strong> {aiSuggestions.recommendedPriority}
                <button
                  type="button"
                  onClick={applyAIPriority}
                  style={{
                    marginLeft: '12px', padding: '4px 12px',
                    background: '#10b981', border: 'none', borderRadius: '6px',
                    color: 'white', cursor: 'pointer', fontSize: '12px',
                  }}
                >
                  Apply
                </button>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                <strong>Factors:</strong> {aiSuggestions.factors?.join(', ')}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                Confidence: {aiSuggestions.confidence} | Score: {aiSuggestions.score}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Fields */}
      <div className="form-group">
        <label className="form-label">Task Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="form-control"
          required
          placeholder="Enter task title"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-textarea"
          rows="4"
          placeholder="Describe the task in detail..."
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="form-select"
          >
            {priorityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Estimated Time (hours)</label>
          <input
            type="number"
            name="estimatedTime"
            value={formData.estimatedTime}
            onChange={handleChange}
            className="form-control"
            placeholder="e.g., 8"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="form-group">
          <label className="form-label">Due Date *</label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tags (comma separated)</label>
          <input
            type="text"
            value={formData.tags.join(', ')}
            onChange={handleTagsChange}
            className="form-control"
            placeholder="e.g., backend, api, urgent"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Dependencies</label>
        <Select
          isMulti
          options={dependencyOptions}
          value={dependencyOptions.filter(opt => formData.dependencies.includes(opt.value))}
          onChange={handleDependencyChange}
          placeholder="Select tasks that must be completed first..."
          styles={{
            control: (base) => ({
              ...base,
              background: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
              boxShadow: 'none',
              '&:hover': { borderColor: 'var(--border-hover)' },
            }),
            menu: (base) => ({
              ...base,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              zIndex: 100,
            }),
            option: (base, { isFocused }) => ({
              ...base,
              background: isFocused ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
            }),
            multiValue: (base) => ({
              ...base,
              background: 'rgba(59,130,246,0.15)',
              borderRadius: '4px',
            }),
            multiValueLabel: (base) => ({
              ...base,
              color: '#3b82f6',
              fontSize: '12px',
            }),
            multiValueRemove: (base) => ({
              ...base,
              color: '#3b82f6',
              '&:hover': { background: 'rgba(239,68,68,0.15)', color: '#ef4444' },
            }),
            input: (base) => ({
              ...base,
              color: 'var(--text)',
            }),
            placeholder: (base) => ({
              ...base,
              color: 'var(--text-muted)',
            }),
            singleValue: (base) => ({
              ...base,
              color: 'var(--text)',
            }),
          }}
        />
      </div>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
        <button
          type="submit"
          className="btn-primary"
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FaSave /> {isEditing ? 'Update Task' : 'Create Task'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FaTimes /> Cancel
        </button>
      </div>
    </form>
  );
};

export default TaskForm;