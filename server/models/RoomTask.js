const mongoose = require('mongoose');

const roomTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'UserId is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
    },
completed: {
  type: Boolean,
  default: false,
},

completedDates: {
  type: [String],
  default: [],
},

recurring: {
  type: String,
  enum: ['none', 'daily', 'weekly', 'monthly'],
  default: 'none',
},
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

roomTaskSchema.index({ userId: 1, createdAt: -1 });
roomTaskSchema.index({ userId: 1, completed: 1 });
roomTaskSchema.index({ userId: 1, dueDate: 1 });
roomTaskSchema.index({ userId: 1, recurring: 1 });

module.exports = mongoose.model('RoomTask', roomTaskSchema);
