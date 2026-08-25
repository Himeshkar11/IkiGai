import React, { useEffect, useState } from 'react';
import { useDate } from '../context/DateContext';

const STORAGE_KEY = 'iki_todos_v1';

const loadTodos = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveTodos = (todos) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const priorityLabel = (p) => (p ? p : 'Normal');

const TodoList = () => {
  const { selectedDate } = useDate();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [input, setInput] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState('');

  useEffect(() => {
    setLoading(true);
    try {
      const data = loadTodos();
      setTodos(data);
    } catch (e) {
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => saveTodos(todos), [todos]);

  const addTask = () => {
    if (!input.trim()) return;
    const task = {
      id: newId(),
      title: input.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: due || selectedDate,
      priority: priority || 'normal',
    };
    setTodos((s) => [task, ...s]);
    setInput('');
    setDue('');
    setPriority('');
  };

  const updateTask = (id) => {
    setTodos((s) =>
      s.map((t) => (t.id === id ? { ...t, title: input, dueDate: due || t.dueDate, priority: priority || t.priority } : t))
    );
    setEditing(null);
    setInput('');
    setDue('');
    setPriority('');
  };

  const remove = (id) => setTodos((s) => s.filter((t) => t.id !== id));

  const toggleComplete = (id) =>
    setTodos((s) => s.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  const todays = todos.filter((t) => t.dueDate === selectedDate).sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'high' ? -1 : 1));
  const overdue = todos.filter((t) => !t.completed && t.dueDate < selectedDate);
  const completedCount = todays.filter((t) => t.completed).length;
  const progress = todays.length ? Math.round((completedCount / todays.length) * 100) : 0;

  if (loading) return <div className="card">Loading todos...</div>;
  if (error) return <div className="card error">{error}</div>;

  return (
    <div className="card todo-card">
      <div className="todo-header">
        <div>
          <h3>Today's Tasks</h3>
          <div className="todo-sub">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
        <div className="todo-meta">
          <div className="progress-text">{completedCount} / {todays.length} completed</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>

      <div className="todo-form">
        <input className="task-input" placeholder="Add task" value={input} onChange={(e) => setInput(e.target.value)} />
        <div className="form-controls">
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Priority</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
          {editing ? (
            <button className="btn primary" onClick={() => updateTask(editing)}>Save</button>
          ) : (
            <button className="btn primary" onClick={addTask}>+ Add</button>
          )}
        </div>
      </div>

      <div className="todo-section">
        {todays.length === 0 ? (
          <div className="empty-state">
            <strong>No tasks yet</strong>
            <p className="muted">Your day is clear. Add something you want to accomplish.</p>
            <button className="btn primary" onClick={addTask}>+ Add task</button>
          </div>
        ) : (
          <ul className="todo-list">
            {todays.map((t) => (
              <li key={t.id} className={`todo-item ${t.completed ? 'completed' : ''}`}>
                <label className="checkbox">
                  <input type="checkbox" checked={t.completed} onChange={() => toggleComplete(t.id)} />
                  <span className="checkmark" />
                </label>
                <div className="todo-content">
                  <div className="todo-title">{t.title}</div>
                  <div className="todo-meta-small">{t.dueDate} • {priorityLabel(t.priority)}</div>
                </div>
                <div className="actions">
                  <button className="link" onClick={() => { setEditing(t.id); setInput(t.title); setDue(t.dueDate); setPriority(t.priority); }}>Edit</button>
                  <button className="link danger" onClick={() => remove(t.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="todo-overdue">
        <h4>Overdue</h4>
        {overdue.length === 0 ? (
          <p className="muted">No overdue tasks.</p>
        ) : (
          <ul className="todo-list small">
            {overdue.map((t) => (
              <li key={t.id} className={`todo-item ${t.completed ? 'completed' : ''}`}>
                <label className="checkbox">
                  <input type="checkbox" checked={t.completed} onChange={() => toggleComplete(t.id)} />
                  <span className="checkmark" />
                </label>
                <div className="todo-content">
                  <div className="todo-title">{t.title}</div>
                  <div className="todo-meta-small">Due {t.dueDate}</div>
                </div>
                <div className="actions">
                  <button className="link" onClick={() => { setEditing(t.id); setInput(t.title); setDue(t.dueDate); setPriority(t.priority); }}>Edit</button>
                  <button className="link danger" onClick={() => remove(t.id)}>Delete</button>
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
