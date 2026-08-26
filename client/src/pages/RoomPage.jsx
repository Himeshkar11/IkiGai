import React, { useEffect, useState } from "react";

function RoomPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

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

  // Get room status whenever selected date changes
  useEffect(() => {
    fetch(`http://localhost:5000/api/room/status/${selectedDate}`)
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
    fetch(`http://localhost:5000/api/room/tasks/${selectedDate}`)
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
        `http://localhost:5000/api/room/status/${selectedDate}`,
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

      const response = await fetch("http://localhost:5000/api/room/tasks", {
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
        `http://localhost:5000/api/room/tasks/${task._id}/complete`,
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
        `http://localhost:5000/api/room/tasks/${editingTask._id}`,
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
        `http://localhost:5000/api/room/tasks/${task._id}`,
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
    <div>
      <h1>Room</h1>

      {/* Date */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />

      <h2>Room Status</h2>

      {/* Water */}
      <div>
        <p>Is water available?</p>

        <button
          onClick={() =>
            setRoomStatus({
              ...roomStatus,
              waterAvailable: true,
            })
          }
        >
          Yes
        </button>

        <button
          onClick={() =>
            setRoomStatus({
              ...roomStatus,
              waterAvailable: false,
            })
          }
        >
          No
        </button>
      </div>

      {/* Room Clean */}
      <div>
        <p>Is the room clean?</p>

        <button
          onClick={() =>
            setRoomStatus({
              ...roomStatus,
              roomClean: true,
            })
          }
        >
          Yes
        </button>

        <button
          onClick={() =>
            setRoomStatus({
              ...roomStatus,
              roomClean: false,
            })
          }
        >
          No
        </button>
      </div>

      {/* Clothes */}
      <div>
        <p>Are clothes ready?</p>

        <button
          onClick={() =>
            setRoomStatus({
              ...roomStatus,
              clothesReady: true,
            })
          }
        >
          Yes
        </button>

        <button
          onClick={() =>
            setRoomStatus({
              ...roomStatus,
              clothesReady: false,
            })
          }
        >
          No
        </button>
      </div>

      {/* Save */}
      <button onClick={saveRoomStatus}>Save</button>

      {/* Completion */}
      <h3>{completed}/3 completed</h3>

      {/* Status display */}
      <h2>Room Status</h2>

      <p>
        Water:{" "}
        {roomStatus.waterAvailable === true
          ? "✓"
          : roomStatus.waterAvailable === false
            ? "✗"
            : "-"}
      </p>

      <p>
        Room Clean:{" "}
        {roomStatus.roomClean === true
          ? "✓"
          : roomStatus.roomClean === false
            ? "✗"
            : "-"}
      </p>

      <p>
        Clothes:{" "}
        {roomStatus.clothesReady === true
          ? "✓"
          : roomStatus.clothesReady === false
            ? "✗"
            : "-"}
      </p>

      {/* Add Room Task */}
      <h2>Add Room Task</h2>

      <div>
        <input
          type="text"
          placeholder="Task title"
          value={newTask.title}
          onChange={(e) =>
            setNewTask({
              ...newTask,
              title: e.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="Description"
          value={newTask.description}
          onChange={(e) =>
            setNewTask({
              ...newTask,
              description: e.target.value,
            })
          }
        />

        <input
          type="date"
          value={newTask.dueDate}
          onChange={(e) =>
            setNewTask({
              ...newTask,
              dueDate: e.target.value,
            })
          }
        />

        <select
          value={newTask.recurring}
          onChange={(e) =>
            setNewTask({
              ...newTask,
              recurring: e.target.value,
            })
          }
        >
          <option value="none">No Recurrence</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        <button onClick={addTask}>Add Task</button>
      </div>

      {/* Edit Room Task */}
      {editingTask && (
        <div>
          <h2>Edit Room Task</h2>

          <input
            type="text"
            value={editingTask.title}
            onChange={(e) =>
              setEditingTask({
                ...editingTask,
                title: e.target.value,
              })
            }
          />

          <input
            type="text"
            value={editingTask.description || ""}
            onChange={(e) =>
              setEditingTask({
                ...editingTask,
                description: e.target.value,
              })
            }
          />

          <input
            type="date"
            value={editingTask.dueDate}
            onChange={(e) =>
              setEditingTask({
                ...editingTask,
                dueDate: e.target.value,
              })
            }
          />

          <select
            value={editingTask.recurring}
            onChange={(e) =>
              setEditingTask({
                ...editingTask,
                recurring: e.target.value,
              })
            }
          >
            <option value="none">No Recurrence</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <button onClick={updateTask}>Save Changes</button>

          <button onClick={() => setEditingTask(null)}>
            Cancel
          </button>
        </div>
      )}

      {/* Room Tasks */}
      <h2>Room Tasks</h2>

      {tasks.length === 0 ? (
        <p>No tasks for this date.</p>
      ) : (
        tasks.map((task) => {
          const isCompleted =
            task.recurring === "none"
              ? task.completed
              : task.completedDates.includes(selectedDate);

          return (
            <div key={task._id}>
              <h3>{task.title}</h3>

              {task.description && <p>{task.description}</p>}

              <p>
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </p>

              <p>Recurring: {task.recurring}</p>

              <p>
                {isCompleted ? (
                  "✓ Completed"
                ) : (
                  <>
                    ○ Not completed
                    <button onClick={() => completeTask(task)}>
                      Complete
                    </button>
                  </>
                )}
              </p>

              <button
                onClick={() =>
                  setEditingTask({
                    ...task,
                    dueDate: task.dueDate
                      ? task.dueDate.split("T")[0]
                      : "",
                  })
                }
              >
                Edit
              </button>

              <button onClick={() => deleteTask(task)}>
                Delete
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

export default RoomPage;