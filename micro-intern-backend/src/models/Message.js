const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: String,      // later could be a user ID
  receiverId: String,    // later could be employer/student ID
  taskId: String,        // which micro-internship / task this chat belongs to
  text: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
