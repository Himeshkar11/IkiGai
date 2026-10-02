import React, { useState, useEffect, useRef } from 'react';
import * as todoService from '../services/todoService';
import { LockIcon, PlusIcon, CheckIcon } from './Icons';

const priorityLabel = (p) => {
  if (p === 'low') return 'Low';
  if (p === 'high') return 'High';
  return 'Normal';
};

/**
 * TodoList component with keyboard shortcuts (N to focus), skeleton loading,
 * and satisfying task-completion micro-interactions.
 */
const TodoList = ({
  selectedDate,
  todos = [],
  loading,
  error,
  onChanged,
  datePermission = 'today',
}) => {
  const [editing, setEditing] = useState(null);
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const inputRef = useRef(null);

  // Derived permission flags
  const canEdit = datePermission === 'today';
  const canAdd = datePermission === 'today' || datePermission === 'future';

  // Keyboard shortcut: Press 'N' to focus the task input
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable);

      if (e.key.toLowerCase() === 'n' && !isInput && !e.metaKey && !e.ctrlKey && canAdd) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canAdd]);

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
      <section className="card todo-card" aria-label="Loading tasks">
        <div className="skeleton-todo-header">
          <div className="skeleton-line" style={{ width: '140px', height: '18px' }} />
          <div className="skeleton-line" style={{ width: '80px', height: '14px' }} />
        </div>
        <div className="skeleton-todo-list">
          <div className="skeleton-line" style={{ height: '42px', margin: '8px 0' }} />
          <div className="skeleton-line" style={{ height: '42px', margin: '8px 0' }} />
          <div className="skeleton-line" style={{ height: '42px', margin: '8px 0' }} />
        </div>
      </section>
    );
  }

  if (error) {
    return <div className="card error">{error}</div>;
  }

  return (
    <section className="card todo-card" aria-labelledby="todo-card-title">
      <div className="todo-header">
        <div>
          <div className="todo-header-top">
            <h3 id="todo-card-title">{datePermission === 'today' ? "Today's Focus" : 'Tasks'}</h3>
            <span className="todo-count-badge">
              {completedCount} / {todos.length}
            </span>
          </div>
          <div className="todo-sub">
            {datePermission === 'today'
              ? `${todos.length - completedCount} pending · ${completedCount} completed`
              : `${completedCount} completed · ${todos.length - completedCount} pending`}
          </div>
        </div>

        <div className="todo-meta">
          <div className="progress-text">{progress}% complete</div>
          <div
            className="progress-bar"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {formError && (
        <div className="card error" style={{ margin: '10px 0' }} role="alert">
          {formError}
        </div>
      )}

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

      {/* Add/Edit form */}
      {(canAdd || (editing && canEdit)) && (
        <form
          className="todo-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (editing) updateTask(editing);
            else addTask();
          }}
        >
          <div className="task-input-wrapper">
            <input
              ref={inputRef}
              className="task-input"
              placeholder={
                editing
                  ? 'Update task title…'
                  : 'Add a task to focus list… (Press N to focus)'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Task title"
            />
            {!editing && (
              <kbd className="input-shortcut-hint" onClick={() => inputRef.current?.focus()}>
                N
              </kbd>
            )}
          </div>

          <div className="form-controls">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              aria-label="Task priority"
              className="priority-select"
            >
              <option value="">Priority: Normal</option>
              <option value="low">Priority: Low</option>
              <option value="medium">Priority: Normal</option>
              <option value="high">Priority: High</option>
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
          <div className="empty-state-editorial">
            <svg
              className="empty-state-icon"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div className="empty-state-content">
              <span className="empty-state-headline">
                {datePermission === 'today' ? 'Your focus list is clear' : 'No tasks recorded'}
              </span>
              <p className="empty-state-hint">
                {datePermission === 'today' ? (
                  <>
                    Capture what matters for today. Press <kbd className="hint-kbd">N</kbd> or click the input above to begin.
                  </>
                ) : (
                  'No tasks were scheduled on this calendar day.'
                )}
              </p>
            </div>
          </div>
        ) : (
          <ul className="todo-list" aria-label="Task list">
            {todos.map((t) => (
              <li
                key={t._id}
                className={`todo-item ${t.completed ? 'completed' : ''} ${
                  !canEdit ? 'read-only' : ''
                } priority-${t.priority || 'medium'}`}
              >
                <label className={`checkbox ${!canEdit ? 'checkbox-disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={Boolean(t.completed)}
                    onChange={() => toggleComplete(t)}
                    disabled={!canEdit}
                    aria-label={`Mark "${t.title}" as ${t.completed ? 'incomplete' : 'complete'}`}
                  />
                  <span className="checkmark">
                    {t.completed && <CheckIcon size={11} />}
                  </span>
                </label>

                <div className="todo-content">
                  <span className="todo-title">{t.title}</span>
                  <div className="todo-meta-row">
                    <span className={`priority-tag priority-tag-${t.priority || 'medium'}`}>
                      {priorityLabel(t.priority)}
                    </span>
                    {t.completed && <span className="completed-tag">Done</span>}
                  </div>
                </div>

                {canEdit && (
                  <div className="actions">
                    <button
                      type="button"
                      className="link-subtle"
                      onClick={() => {
                        setEditing(t._id);
                        setInput(t.title);
                        setPriority(t.priority || '');
                        inputRef.current?.focus();
                      }}
                      title="Edit task"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-subtle danger"
                      onClick={() => remove(t._id)}
                      title="Delete task"
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
