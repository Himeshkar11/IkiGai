import React, { useState } from 'react';
import * as todoService from '../services/todoService';

const priorityLabel = (p) => {
  if (p === 'low') return 'Low';
  if (p === 'high') return 'High';
  return 'Medium';
};

/**
 * TodoList component.
 *
 * Props:
 *   selectedDate    – YYYY-MM-DD string for the displayed day
 *   todos           – array of todo objects
 *   loading         – boolean
 *   error           – string or null
 *   onChanged       – callback called after any mutation
 *   datePermission  – 'past' | 'today' | 'future'
 *                     Controls whether mutation controls are shown.
 *                     If omitted, defaults to 'today' to avoid accidental lockout.
 */
const TodoList = ({ selectedDate, todos, loading, error, onChanged, datePermission = 'today' }) => {
  const [editing, setEditing] = useState(null);
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState('');
  const [saving, setSaving] = useState(false);

  // Derived permission flags — single place to check mutability.
  const canEdit = datePermission === 'today';

  const addTask = async () => {
    if (!input.trim() || !canEdit) return;
    setSaving(true);
    try {
      await todoService.createTodo({
        title: input.trim(),
        priority: priority || 'medium',
        dueDate: selectedDate,
        date: selectedDate,
      });
      setInput('');
      setPriority('');
      await onChanged?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (id) => {
    if (!canEdit) return;
    setSaving(true);
    try {
      await todoService.updateTodo(id, {
        title: input.trim(),
        priority: priority || 'medium',
      });
      setEditing(null);
      setInput('');
      setPriority('');
      await onChanged?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!canEdit) return;
    try {
      await todoService.deleteTodo(id);
      await onChanged?.();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleComplete = async (todo) => {
    if (!canEdit) return;
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
          <h3>{datePermission === 'today' ? "Today's Tasks" : 'Tasks'}</h3>
          <div className="todo-sub">
            {datePermission === 'today'
              ? 'Auto-assigned to today'
              : `${completedCount} completed · ${todos.length - completedCount} remaining`}
          </div>
        </div>
        <div className="todo-meta">
          <div className="progress-text">{completedCount} / {todos.length} completed</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>

      {/* Read-only / locked banner for non-today dates */}
      {datePermission === 'past' && (
        <div className="date-lock-banner date-lock-past">
          🔒 Historical · Read Only — Tasks from this day cannot be modified.
        </div>
      )}
      {datePermission === 'future' && (
        <div className="date-lock-banner date-lock-future">
          🔒 Future date — Tasks cannot be created or modified yet.
        </div>
      )}

      {/* Add/Edit form — only rendered for today */}
      {canEdit && (
        <div className="todo-form">
          <input
            className="task-input"
            placeholder="Add task"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Task title"
          />
          <div className="form-controls">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Task priority">
              <option value="">Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {editing ? (
              <button className="btn primary" disabled={saving} onClick={() => updateTask(editing)}>Save</button>
            ) : (
              <button className="btn primary" disabled={saving} onClick={addTask}>+ Add Task</button>
            )}
          </div>
        </div>
      )}

      <div className="todo-section">
        {todos.length === 0 ? (
          <div className="empty-state">
            <strong>No tasks yet</strong>
            <p className="muted">
              {datePermission === 'today'
                ? 'Nothing planned for this day. Add something you want to finish.'
                : 'No tasks were recorded for this day.'}
            </p>
          </div>
        ) : (
          <ul className="todo-list">
            {todos.map((t) => (
              <li key={t._id} className={`todo-item ${t.completed ? 'completed' : ''} ${!canEdit ? 'read-only' : ''}`}>
                <label className={`checkbox ${!canEdit ? 'checkbox-disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleComplete(t)}
                    disabled={!canEdit}
                  />
                  <span className="checkmark" />
                </label>
                <div className="todo-content">
                  <div className="todo-title">{t.title}</div>
                  <div className="todo-meta-small">{priorityLabel(t.priority)}</div>
                </div>
                {/* Edit/Delete actions only shown for today */}
                {canEdit && (
                  <div className="actions">
                    <button
                      className="link"
                      onClick={() => {
                        setEditing(t._id);
                        setInput(t.title);
                        setPriority(t.priority);
                      }}
                    >
                      Edit
                    </button>
                    <button className="link danger" onClick={() => remove(t._id)}>Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TodoList;
