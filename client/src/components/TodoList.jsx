import React, { useState } from 'react';
import * as todoService from '../services/todoService';

const priorityLabel = (p) => {
  if (p === 'low') return 'Low';
  if (p === 'high') return 'High';
  return 'Medium';
};

const TodoList = ({ selectedDate, todos, loading, error, onChanged }) => {
  const [editing, setEditing] = useState(null);
  const [input, setInput] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState('');
  const [saving, setSaving] = useState(false);

  const addTask = async () => {
    if (!input.trim()) return;
    setSaving(true);
    try {
      await todoService.createTodo({
        title: input.trim(),
        dueDate: due || selectedDate,
        priority: priority || 'medium',
      });
      setInput('');
      setDue('');
      setPriority('');
      await onChanged?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (id) => {
    setSaving(true);
    try {
      await todoService.updateTodo(id, {
        title: input.trim(),
        dueDate: due || selectedDate,
        priority: priority || 'medium',
      });
      setEditing(null);
      setInput('');
      setDue('');
      setPriority('');
      await onChanged?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await todoService.deleteTodo(id);
      await onChanged?.();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleComplete = async (todo) => {
    try {
      await todoService.updateTodo(todo._id, { completed: !todo.completed });
      await onChanged?.();
    } catch (e) {
      console.error(e);
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const progress = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

  if (loading) return <div className="card">Loading tasks…</div>;
  if (error) return <div className="card error">{error}</div>;

  return (
    <div className="card todo-card">
      <div className="todo-header">
        <div>
          <h3>Tasks</h3>
          <div className="todo-sub">
            {completedCount} completed · {todos.length - completedCount} remaining · {todos.length} total
          </div>
        </div>
        <div className="todo-meta">
          <div className="progress-text">{completedCount} / {todos.length} completed</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>

      <div className="todo-form">
        <input
          className="task-input"
          placeholder="Add task"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="form-controls">
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {editing ? (
            <button className="btn primary" disabled={saving} onClick={() => updateTask(editing)}>Save</button>
          ) : (
            <button className="btn primary" disabled={saving} onClick={addTask}>+ Add</button>
          )}
        </div>
      </div>

      <div className="todo-section">
        {todos.length === 0 ? (
          <div className="empty-state">
            <strong>No tasks yet</strong>
            <p className="muted">Nothing planned for this day. Add something you want to finish.</p>
          </div>
        ) : (
          <ul className="todo-list">
            {todos.map((t) => (
              <li key={t._id} className={`todo-item ${t.completed ? 'completed' : ''}`}>
                <label className="checkbox">
                  <input type="checkbox" checked={t.completed} onChange={() => toggleComplete(t)} />
                  <span className="checkmark" />
                </label>
                <div className="todo-content">
                  <div className="todo-title">{t.title}</div>
                  <div className="todo-meta-small">{priorityLabel(t.priority)}</div>
                </div>
                <div className="actions">
                  <button
                    className="link"
                    onClick={() => {
                      setEditing(t._id);
                      setInput(t.title);
                      setDue(selectedDate);
                      setPriority(t.priority);
                    }}
                  >
                    Edit
                  </button>
                  <button className="link danger" onClick={() => remove(t._id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TodoList;
