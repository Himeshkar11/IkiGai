const express = require('express');
const router = express.Router();

const RoomStatus = require('../models/RoomStatus');
const RoomTask = require('../models/RoomTask');


// GET room status for selected date
router.get('/status/:date', async (req, res) => {
  try {
    const { date } = req.params;

    let roomStatus = await RoomStatus.findOne({ date });

    if (!roomStatus) {
      return res.json({
        date,
        waterAvailable: null,
        roomClean: null,
        clothesReady: null
      });
    }

    res.json(roomStatus);

  } catch (error) {
    res.status(500).json({
      message: 'Failed to get room status'
    });
  }
});


// SAVE room status
router.put('/status/:date', async (req, res) => {
  try {
    const { date } = req.params;

    const {
      waterAvailable,
      roomClean,
      clothesReady
    } = req.body;

    const roomStatus = await RoomStatus.findOneAndUpdate(
      { date },
      {
        date,
        waterAvailable,
        roomClean,
        clothesReady
      },
      {
        new: true,
        upsert: true
      }
    );

    res.json(roomStatus);

  } catch (error) {
    res.status(500).json({
      message: 'Failed to save room status'
    });
  }
});


// ADD ROOM TASK
router.post('/tasks', async (req, res) => {
  try {
    const {
      userId,
      title,
      description,
      dueDate,
      recurring
    } = req.body;

    const task = await RoomTask.create({
      userId,
      title,
      description,
      dueDate,
      recurring
    });

    res.status(201).json(task);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to create room task'
    });
  }
});


// GET ROOM TASKS FOR SELECTED DATE
router.get('/tasks/:date', async (req, res) => {
  try {
    const { date } = req.params;

    const selectedDate = new Date(`${date}T00:00:00.000Z`);

    // Get tasks whose original due date is on or before selected date
    const allTasks = await RoomTask.find({
      dueDate: {
        $lte: new Date(`${date}T23:59:59.999Z`)
      }
    }).sort({
      dueDate: 1,
      createdAt: 1
    });

    const tasks = allTasks.filter(task => {

      // Normal task:
      // Only show it on its exact due date
      if (task.recurring === 'none') {
        const taskDate = new Date(task.dueDate);

        return (
          taskDate.getUTCFullYear() === selectedDate.getUTCFullYear() &&
          taskDate.getUTCMonth() === selectedDate.getUTCMonth() &&
          taskDate.getUTCDate() === selectedDate.getUTCDate()
        );
      }

      // Daily recurring task:
      // Show every day after its starting date
      if (task.recurring === 'daily') {
        return true;
      }

      // Weekly recurring task
      if (task.recurring === 'weekly') {
        const taskDate = new Date(task.dueDate);

        const difference =
          Math.floor(
            (selectedDate.getTime() - taskDate.getTime()) /
            (1000 * 60 * 60 * 24)
          );

        return difference >= 0 && difference % 7 === 0;
      }

      // Monthly recurring task
      if (task.recurring === 'monthly') {
        const taskDate = new Date(task.dueDate);

        return (
          selectedDate.getUTCDate() === taskDate.getUTCDate() &&
          selectedDate >= taskDate
        );
      }

      return false;
    });

    res.json(tasks);

  } catch (error) {
    console.error('GET ROOM TASKS ERROR:', error);

    res.status(500).json({
      message: 'Failed to get room tasks',
      error: error.message
    });
  }
});
// EDIT ROOM TASK
router.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      dueDate,
      recurring
    } = req.body;

    const task = await RoomTask.findByIdAndUpdate(
      id,
      {
        title,
        description,
        dueDate,
        recurring,
        updatedAt: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!task) {
      return res.status(404).json({
        message: 'Room task not found'
      });
    }

    res.json(task);

  } catch (error) {
    console.error('EDIT ROOM TASK ERROR:', error);

    res.status(500).json({
      message: 'Failed to edit room task',
      error: error.message
    });
  }
});
// DELETE ROOM TASK
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await RoomTask.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({
        message: 'Room task not found'
      });
    }

    res.json({
      message: 'Room task deleted successfully',
      task
    });

  } catch (error) {
    console.error('DELETE ROOM TASK ERROR:', error);

    res.status(500).json({
      message: 'Failed to delete room task',
      error: error.message
    });
  }
});
// COMPLETE ROOM TASK
router.put('/tasks/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const date = req.body?.date;

    const task = await RoomTask.findById(id);

    if (!task) {
      return res.status(404).json({
        message: 'Room task not found'
      });
    }

    // Normal task
    if (task.recurring === 'none') {
      task.completed = true;
      await task.save();

      return res.json(task);
    }

    // Recurring task
    if (!date) {
      return res.status(400).json({
        message: 'Date is required for recurring tasks'
      });
    }

    if (!task.completedDates.includes(date)) {
      task.completedDates.push(date);
    }

    await task.save();

    res.json(task);

  } catch (error) {
    console.error('COMPLETE ROOM TASK ERROR:', error);

    res.status(500).json({
      message: 'Failed to complete room task',
      error: error.message
    });
  }
});


module.exports = router;