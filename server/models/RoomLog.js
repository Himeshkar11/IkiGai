const mongoose = require('mongoose');

const roomLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'UserId is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    waterAvailable: {
      type: Boolean,
      default: false,
    },
    roomClean: {
      type: Boolean,
      default: false,
    },
    clothesReady: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

roomLogSchema.index({ userId: 1, date: -1 });
roomLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('RoomLog', roomLogSchema);
