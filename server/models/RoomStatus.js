const mongoose = require('mongoose');

const roomStatusSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true
  },

  waterAvailable: {
    type: Boolean,
    default: null
  },

  roomClean: {
    type: Boolean,
    default: null
  },

  clothesReady: {
    type: Boolean,
    default: null
  }
});

module.exports = mongoose.model('RoomStatus', roomStatusSchema);