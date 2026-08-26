import React, { useEffect, useState } from "react";
import { useDate } from "../context/DateContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function RoomPage() {
  const { selectedDate, setSelectedDate } = useDate();

  const [roomStatus, setRoomStatus] = useState({
    waterAvailable: null,
    roomClean: null,
    clothesReady: null,
  });

  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);

  // Add task form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: selectedDate,
    recurring: "none",
  });

  useEffect(() => {
    setNewTask((prev) => ({ ...prev, dueDate: selectedDate }));
  }, [selectedDate]);

  // Get room status whenever selected date changes
  useEffect(() => {
    fetch(`${API_URL}/room/status/${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        setRoomStatus(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [selectedDate]);

  // Get room tasks whenever selected date changes
  useEffect(() => {
    fetch(`${API_URL}/room/tasks/${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [selectedDate]);

  // Save room status
  const saveRoomStatus = async () => {
    try {
      const response = await fetch(
        `${API_URL}/room/status/${selectedDate}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(roomStatus),
        },
      );

      const data = await response.json();

      setRoomStatus(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Add room task
  const addTask = async () => {
    try {
      if (!newTask.title.trim()) {
        alert("Task title is required");
        return;
      }

      const response = await fetch("${API_URL}/room/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "6a8dc7ec7dfb981ead48654c",
          title: newTask.title,
          description: newTask.description,
          dueDate: newTask.dueDate,
          recurring: newTask.recurring,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        alert(data.message || "Failed to create task");
        return;
      }

      setTasks((prevTasks) => [...prevTasks, data]);

      setNewTask({
        title: "",
        description: "",
        dueDate: selectedDate,
        recurring: "none",
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Complete room task
  const completeTask = async (task) => {
    try {
      const body =
        task.recurring === "none"
          ? {}
          : {
              date: selectedDate,
            };

      const response = await fetch(
        `${API_URL}/room/tasks/${task._id}/complete`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        alert(data.message || "Failed to complete task");
        return;
      }

      // Update the task in the UI
      setTasks((prevTasks) =>
        prevTasks.map((existingTask) =>
          existingTask._id === data._id ? data : existingTask,
        ),
      );
    } catch (error) {
      console.error(error);
    }
  };

  // Update room task
  const updateTask = async () => {
    try {
      if (!editingTask.title.trim()) {
        alert("Task title is required");
        return;
      }

      const response = await fetch(
        `${API_URL}/room/tasks/${editingTask._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editingTask.title,
            description: editingTask.description,
            dueDate: editingTask.dueDate,
            recurring: editingTask.recurring,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        alert(data.message || "Failed to update task");
        return;
      }

      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === data._id ? data : task)),
      );

      setEditingTask(null);
    } catch (error) {
      console.error(error);
    }
  };

  // Delete room task
  const deleteTask = async (task) => {
    try {
      const response = await fetch(
        `${API_URL}/room/tasks/${task._id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        alert(data.message || "Failed to delete task");
        return;
      }

      setTasks((prevTasks) =>
        prevTasks.filter(
          (existingTask) => existingTask._id !== task._id,
        ),
      );

      // Close edit form if the deleted task was being edited
      if (editingTask && editingTask._id === task._id) {
        setEditingTask(null);
      }

    } catch (error) {
      console.error(error);
    }
  };

  // Calculate completed questions
  const completed =
    Number(roomStatus.waterAvailable !== null) +
    Number(roomStatus.roomClean !== null) +
    Number(roomStatus.clothesReady !== null);

  return (
    <div className="page-card room-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Daily environment</p>
          <h1>Room</h1>
          <p className="muted">Keep the basics around you handled.</p>
        </div>
        <label className="field room-date">
          <span className="field-label">Date</span>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </label>
      </div>

      <section className="food-section">
        <div className="home-module-head">
          <div>
            <p className="section-title">Room status</p>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Daily check-in</h2>
          </div>
          <span className="room-progress">{completed}/3 completed</span>
        </div>

        <div className="room-status-grid">
          {[
            ['waterAvailable', 'Water', 'Is water available?'],
            ['roomClean', 'Room', 'Is the room clean?'],
            ['clothesReady', 'Clothes', 'Are clothes ready?'],
          ].map(([key, title, question]) => (
            <div className="room-status-card" key={key}>
              <h3>{title}</h3>
              <p>{question}</p>
              <div className="status-choice">
                <button
                  type="button"
                  className={`btn ${roomStatus[key] === true ? 'selected-yes' : ''}`}
                  onClick={() => setRoomStatus({ ...roomStatus, [key]: true })}
                >Yes</button>
                <button
                  type="button"
                  className={`btn ${roomStatus[key] === false ? 'selected-no' : ''}`}
                  onClick={() => setRoomStatus({ ...roomStatus, [key]: false })}
                >No</button>
              </div>
            </div>
          ))}
        </div>

        <div className="room-status-footer">
          <div className="room-overview">
            <div className="room-overview-item"><span>Water</span><strong>{roomStatus.waterAvailable === true ? 'Available' : roomStatus.waterAvailable === false ? 'Unavailable' : 'Not set'}</strong></div>
            <div className="room-overview-item"><span>Room</span><strong>{roomStatus.roomClean === true ? 'Clean' : roomStatus.roomClean === false ? 'Needs work' : 'Not set'}</strong></div>
            <div className="room-overview-item"><span>Clothes</span><strong>{roomStatus.clothesReady === true ? 'Ready' : roomStatus.clothesReady === false ? 'Not ready' : 'Not set'}</strong></div>
          </div>
          <button type="button" className="btn primary" onClick={saveRoomStatus}>Save status</button>
        </div>
      </section>

      <section className="room-tasks">
        <p className="section-title">Room tasks</p>
        <div className="home-module-head">
          <div>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Keep the space moving</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>Add one-off or recurring room tasks.</p>
          </div>
        </div>

        <div className="room-task-form">
          <label className="field"><span className="field-label">Task</span><input type="text" placeholder="Task title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} /></label>
          <label className="field"><span className="field-label">Description</span><input type="text" placeholder="Optional detail" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} /></label>
          <label className="field"><span className="field-label">Due</span><input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} /></label>
          <label className="field"><span className="field-label">Repeat</span><select value={newTask.recurring} onChange={(e) => setNewTask({ ...newTask, recurring: e.target.value })}><option value="none">No recurrence</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
          <button type="button" className="btn primary" onClick={addTask}>+ Add task</button>
        </div>

        {editingTask && (
          <div className="room-edit-form">
            <label className="field"><span className="field-label">Task</span><input type="text" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} /></label>
            <label className="field"><span className="field-label">Description</span><input type="text" value={editingTask.description || ''} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} /></label>
            <label className="field"><span className="field-label">Due</span><input type="date" value={editingTask.dueDate} onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })} /></label>
            <label className="field"><span className="field-label">Repeat</span><select value={editingTask.recurring} onChange={(e) => setEditingTask({ ...editingTask, recurring: e.target.value })}><option value="none">No recurrence</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
            <button type="button" className="btn primary" onClick={updateTask}>Save</button>
            <button type="button" className="btn" onClick={() => setEditingTask(null)}>Cancel</button>
          </div>
        )}

        <div className="room-tasks-list" style={{ marginTop: '12px' }}>
          {tasks.length === 0 ? (
            <div className="empty-state"><strong>No room tasks</strong><p className="muted">Nothing planned for this date yet.</p></div>
          ) : tasks.map((task) => {
            const isCompleted = task.recurring === 'none' ? task.completed : task.completedDates.includes(selectedDate);
            return (
              <div key={task._id} className="room-task-item">
                <div>
                  <h3>{task.title}</h3>
                  {task.description && <p>{task.description}</p>}
                  <p>Due {new Date(task.dueDate).toLocaleDateString()} · {task.recurring === 'none' ? 'One-off' : task.recurring}</p>
                  <div className={isCompleted ? 'room-task-complete' : 'room-task-incomplete'}>{isCompleted ? '✓ Completed' : '○ Not completed'}</div>
                </div>
                <div className="room-task-actions">
                  {!isCompleted && <button type="button" className="btn primary" onClick={() => completeTask(task)}>Complete</button>}
                  <button type="button" className="link" onClick={() => setEditingTask({ ...task, dueDate: task.dueDate ? task.dueDate.split('T')[0] : '' })}>Edit</button>
                  <button type="button" className="link danger" onClick={() => deleteTask(task)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default RoomPage;