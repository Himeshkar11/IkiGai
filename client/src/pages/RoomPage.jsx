import React, { useEffect, useState } from 'react';
import { useDate } from '../context/DateContext';
import { useAuth } from '../context/AuthContext';
import * as roomService from '../services/roomService';
import { CheckIcon, EditIcon, PlusIcon, TrashIcon } from '../components/Icons';

function RoomPage() {
  const { selectedDate, setSelectedDate } = useDate();
  const { user } = useAuth();

  const [roomStatus, setRoomStatus] = useState({
    waterAvailable: null,
    roomClean: null,
    clothesReady: null,
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [taskError, setTaskError] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // Add task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    recurring: 'none',
  });

  // Load room status & tasks whenever selected date changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStatusFeedback(null);
    setTaskError(null);

    Promise.all([
      roomService.getRoomStatusByDate(selectedDate).catch(() => ({
        waterAvailable: null,
        roomClean: null,
        clothesReady: null,
      })),
      roomService.getRoomTasksByDate(selectedDate).catch(() => []),
    ])
      .then(([statusRes, tasksRes]) => {
        if (!cancelled) {
          setRoomStatus(statusRes || {
            waterAvailable: null,
            roomClean: null,
            clothesReady: null,
          });
          setTasks(Array.isArray(tasksRes) ? tasksRes : []);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  // Save room status
  const saveRoomStatus = async () => {
    setSavingStatus(true);
    setStatusFeedback(null);
    try {
      const data = await roomService.updateRoomStatus(selectedDate, roomStatus);
      setRoomStatus(data);
      setStatusFeedback({ type: 'success', text: 'Room check-in saved successfully.' });
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch {
      setStatusFeedback({ type: 'error', text: 'Failed to save room status. Please try again.' });
    } finally {
      setSavingStatus(false);
    }
  };

  // Add room task
  const addTask = async (e) => {
    e?.preventDefault();
    if (!newTask.title.trim()) {
      setTaskError('Task title is required.');
      return;
    }

    setTaskError(null);
    try {
      const created = await roomService.createRoomTask({
        userId: user?._id || user?.id,
        title: newTask.title.trim(),
        description: newTask.description?.trim() || '',
        dueDate: newTask.dueDate || selectedDate,
        recurring: newTask.recurring || 'none',
      });

      setTasks((prev) => [...prev, created]);
      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        recurring: 'none',
      });
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to create room task.');
    }
  };

  // Complete room task
  const completeTask = async (task) => {
    try {
      const updated = await roomService.completeRoomTask(task._id, selectedDate);
      setTasks((prev) =>
        prev.map((existing) => (existing._id === updated._id ? updated : existing))
      );
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to complete task.');
    }
  };

  // Update room task
  const updateTask = async () => {
    if (!editingTask?.title?.trim()) {
      setTaskError('Task title is required.');
      return;
    }

    setTaskError(null);
    try {
      const updated = await roomService.updateRoomTask(editingTask._id, {
        title: editingTask.title.trim(),
        description: editingTask.description?.trim() || '',
        dueDate: editingTask.dueDate,
        recurring: editingTask.recurring,
      });

      setTasks((prev) =>
        prev.map((task) => (task._id === updated._id ? updated : task))
      );
      setEditingTask(null);
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to update task.');
    }
  };

  // Delete room task
  const deleteTask = async (task) => {
    try {
      await roomService.deleteRoomTask(task._id);
      setTasks((prev) => prev.filter((existing) => existing._id !== task._id));
      if (editingTask && editingTask._id === task._id) {
        setEditingTask(null);
      }
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  // Calculate completed questions
  const answeredCount =
    Number(roomStatus.waterAvailable !== null && roomStatus.waterAvailable !== undefined) +
    Number(roomStatus.roomClean !== null && roomStatus.roomClean !== undefined) +
    Number(roomStatus.clothesReady !== null && roomStatus.clothesReady !== undefined);

  return (
    <div className="page-card room-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Environment & Habits</p>
          <h1>Room & Living Space</h1>
          <p className="muted">Track physical environment habits and recurring space maintenance.</p>
        </div>
        <label className="field room-date">
          <span className="field-label">Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            aria-label="Select date"
          />
        </label>
      </div>

      <section className="food-section" aria-labelledby="room-status-heading">
        <div className="home-module-head">
          <div>
            <p className="section-title">Daily Check-in</p>
            <h2 id="room-status-heading" style={{ margin: 0, fontSize: '18px' }}>Essential routines</h2>
          </div>
          <span className="room-progress">{answeredCount} of 3 recorded</span>
        </div>

        {statusFeedback && (
          <div
            className={`feedback-banner ${statusFeedback.type === 'error' ? 'error' : 'feedback-success'}`}
            role="status"
          >
            {statusFeedback.text}
          </div>
        )}

        <div className="room-status-grid">
          {[
            ['waterAvailable', 'Hydration', 'Is clean drinking water stocked?'],
            ['roomClean', 'Workspace & Space', 'Is the room tidy and desk clear?'],
            ['clothesReady', 'Wardrobe & Laundry', 'Are clothes organized and ready?'],
          ].map(([key, title, question]) => (
            <div className="room-status-card" key={key}>
              <h3>{title}</h3>
              <p>{question}</p>
              <div className="status-choice">
                <button
                  type="button"
                  className={`btn ${roomStatus[key] === true ? 'selected-yes' : ''}`}
                  onClick={() => setRoomStatus((prev) => ({ ...prev, [key]: true }))}
                  aria-pressed={roomStatus[key] === true}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`btn ${roomStatus[key] === false ? 'selected-no' : ''}`}
                  onClick={() => setRoomStatus((prev) => ({ ...prev, [key]: false }))}
                  aria-pressed={roomStatus[key] === false}
                >
                  No
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="room-status-footer">
          <div className="room-overview">
            <div className="room-overview-item">
              <span>Water</span>
              <strong>
                {roomStatus.waterAvailable === true
                  ? 'Available'
                  : roomStatus.waterAvailable === false
                  ? 'Unavailable'
                  : 'Not set'}
              </strong>
            </div>
            <div className="room-overview-item">
              <span>Room</span>
              <strong>
                {roomStatus.roomClean === true
                  ? 'Clean'
                  : roomStatus.roomClean === false
                  ? 'Needs work'
                  : 'Not set'}
              </strong>
            </div>
            <div className="room-overview-item">
              <span>Clothes</span>
              <strong>
                {roomStatus.clothesReady === true
                  ? 'Ready'
                  : roomStatus.clothesReady === false
                  ? 'Not ready'
                  : 'Not set'}
              </strong>
            </div>
          </div>
          <button
            type="button"
            className="btn primary"
            onClick={saveRoomStatus}
            disabled={savingStatus}
          >
            {savingStatus ? 'Saving…' : 'Save Status'}
          </button>
        </div>
      </section>

      <section className="room-tasks" aria-labelledby="room-tasks-heading">
        <div className="home-module-head">
          <div>
            <p className="section-title">Chore Management</p>
            <h2 id="room-tasks-heading" style={{ margin: 0, fontSize: '18px' }}>Room tasks</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
              Schedule maintenance chores with optional daily, weekly, or monthly repetition.
            </p>
          </div>
        </div>

        {taskError && <div className="card error" style={{ margin: '12px 0' }} role="alert">{taskError}</div>}

        <form className="room-task-form" onSubmit={addTask}>
          <label className="field">
            <span className="field-label">Task</span>
            <input
              type="text"
              placeholder="e.g. Vacuum rug, change bedding"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Details (optional)</span>
            <input
              type="text"
              placeholder="Additional notes"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Due Date</span>
            <input
              type="date"
              value={newTask.dueDate || selectedDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Recurrence</span>
            <select
              value={newTask.recurring}
              onChange={(e) => setNewTask({ ...newTask, recurring: e.target.value })}
            >
              <option value="none">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <button type="submit" className="btn primary">
            <PlusIcon size={14} /> Add Task
          </button>
        </form>

        {editingTask && (
          <div className="room-edit-form" role="region" aria-label="Edit room task">
            <label className="field">
              <span className="field-label">Task</span>
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Details</span>
              <input
                type="text"
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Due Date</span>
              <input
                type="date"
                value={editingTask.dueDate}
                onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Recurrence</span>
              <select
                value={editingTask.recurring}
                onChange={(e) => setEditingTask({ ...editingTask, recurring: e.target.value })}
              >
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <button type="button" className="btn primary" onClick={updateTask}>
              Save
            </button>
            <button type="button" className="btn" onClick={() => setEditingTask(null)}>
              Cancel
            </button>
          </div>
        )}

        <div className="room-tasks-list" style={{ marginTop: '14px' }}>
          {loading ? (
            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <span className="muted">Loading room tasks…</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <strong>No room tasks</strong>
              <p className="muted">No chores scheduled for this date. Add one above.</p>
            </div>
          ) : (
            tasks.map((task) => {
              const isCompleted =
                task.recurring === 'none'
                  ? task.completed
                  : Array.isArray(task.completedDates) && task.completedDates.includes(selectedDate);

              return (
                <div key={task._id} className="room-task-item">
                  <div>
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    <p className="muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                      Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {task.recurring === 'none' ? 'One-time' : task.recurring}
                    </p>
                    <div className={isCompleted ? 'room-task-complete' : 'room-task-incomplete'}>
                      {isCompleted ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckIcon size={13} /> Completed
                        </span>
                      ) : (
                        'Incomplete'
                      )}
                    </div>
                  </div>
                  <div className="room-task-actions">
                    {!isCompleted && (
                      <button
                        type="button"
                        className="btn primary"
                        onClick={() => completeTask(task)}
                      >
                        Mark Done
                      </button>
                    )}
                    <button
                      type="button"
                      className="link"
                      onClick={() =>
                        setEditingTask({
                          ...task,
                          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
                        })
                      }
                      title="Edit task"
                    >
                      <EditIcon size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      className="link danger"
                      onClick={() => deleteTask(task)}
                      title="Delete task"
                    >
                      <TrashIcon size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

export default RoomPage;