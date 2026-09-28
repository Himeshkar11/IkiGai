import React, { useState } from 'react';
import * as todoService from '../services/todoService';
import { LockIcon, PlusIcon } from './Icons';

const priorityLabel = (p) => {
  if (p === 'low') return 'Low priority';
  if (p === 'high') return 'High priority';
  return 'Medium priority';
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
 */
const TodoList = ({ selectedDate, todos, loading, error, onChanged, datePermission = 'today' }) => {
  const [editing, setEditing] = useState(null);
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Derived permission flags — single place to check mutability.
  const canEdit = datePermission === 'today';
  const canAdd = datePermission === 'today' || datePermission === 'future';

  const addTask = async () => {
    if (!input.trim() || !canAdd) return;
    setSaving(true);
    setFormError(null);
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
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add task.');
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (id) => {
    if (!canEdit || !input.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      await todoService.updateTodo(id, {
        title: input.trim(),
        priority: priority || 'medium',
      });
      setEditing(null);
      setInput('');
      setPriority('');
      await onChanged?.();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!canEdit) return;
    try {
      await todoService.deleteTodo(id);
      await onChanged?.();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  const toggleComplete = async (todo) => {
    if (!canEdit) return;
    try {
      await todoService.updateTodo(todo._id, { completed: !todo.completed });
      await onChanged?.();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to toggle task.');
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const progress = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

  if (loading) {
    return (
      <div className="card todo-card">
        <p className="muted" style={{ margin: '14px 0', textAlign: 'center' }}>Loading tasks…</p>
      </div>
    );
  }

  if (error) {
    return <div className="card error">{error}</div>;
  }

  return (
    <section className="card todo-card" aria-labelledby="todo-card-title">
      <div className="todo-header">
        <div>
          <h3 id="todo-card-title">{datePermission === 'today' ? "Today's Tasks" : 'Tasks'}</h3>
          <div className="todo-sub">
            {datePermission === 'today'
              ? 'Active tasks assigned to today'
              : `${completedCount} completed · ${todos.length - completedCount} pending`}
          </div>
        </div>
        <div className="todo-meta">
          <div className="progress-text">{completedCount} of {todos.length} completed</div>
          <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {formError && <div className="card error" style={{ margin: '10px 0' }} role="alert">{formError}</div>}

      {/* Read-only / locked banner for non-today dates */}
      {datePermission === 'past' && (
        <div className="date-lock-banner date-lock-past" role="status">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <LockIcon size={14} /> Historical archive · Read-only. Past records cannot be altered.
          </span>
        </div>
      )}
      {datePermission === 'future' && (
        <div className="date-lock-banner date-lock-future" role="status">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <LockIcon size={14} /> Future date · Tasks can be planned ahead. Completion controls activate on that day.
          </span>
        </div>
      )}

      {/* Add/Edit form — rendered for adding (today/future) and editing (today) */}
      {(canAdd || (editing && canEdit)) && (
        <form
          className="todo-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (editing) updateTask(editing);
            else addTask();
          }}
        >
          <input
            className="task-input"
            placeholder={editing ? 'Update task title' : 'Add task to focus list'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Task title"
          />
          <div className="form-controls">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              aria-label="Task priority"
            >
              <option value="">Priority: Normal</option>
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            {editing ? (
              <>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={saving || !input.trim()}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setEditing(null);
                    setInput('');
                    setPriority('');
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="submit"
                className="btn primary"
                disabled={saving || !input.trim()}
              >
                <PlusIcon size={14} /> {saving ? 'Adding…' : 'Add Task'}
              </button>
            )}
          </div>
        </form>
      )}

      <div className="todo-section">
        {todos.length === 0 ? (
          <div className="empty-state">
            <strong>No tasks scheduled</strong>
            <p className="muted">
              {datePermission === 'today'
                ? 'Your list is clear. Add items you need to focus on today.'
                : 'No tasks were logged for this day.'}
            </p>
          </div>
        ) : (
          <ul className="todo-list" aria-label="Task list">
            {todos.map((t) => (
              <li
                key={t._id}
                className={`todo-item ${t.completed ? 'completed' : ''} ${!canEdit ? 'read-only' : ''}`}
              >
                <label className={`checkbox ${!canEdit ? 'checkbox-disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleComplete(t)}
                    disabled={!canEdit}
                    aria-label={`Mark "${t.title}" as ${t.completed ? 'incomplete' : 'complete'}`}
                  />
                  <span className="checkmark" />
                </label>
                <div className="todo-content">
                  <div className="todo-title">{t.title}</div>
                  <div className="todo-meta-small">{priorityLabel(t.priority)}</div>
                </div>
                {canEdit && (
                  <div className="actions">
                    <button
                      type="button"
                      className="link"
                      onClick={() => {
                        setEditing(t._id);
                        setInput(t.title);
                        setPriority(t.priority || '');
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link danger"
                      onClick={() => remove(t._id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default TodoList;
