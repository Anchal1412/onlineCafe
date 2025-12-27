const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  userId: {
    type : String,
    required: true
  },
  adminId: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    required: true
  },
  message: {
    type: String,
  },
  image: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);