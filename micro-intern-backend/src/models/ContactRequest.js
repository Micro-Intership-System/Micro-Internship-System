const mongoose = require('mongoose');

const contactRequestSchema = new mongoose.Schema({
  studentId: String,       // which student is being contacted
  firstName: String,
  lastName: String,
  email: String,
  jobDescription: String,  // message / position description
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ContactRequest = mongoose.model('ContactRequest', contactRequestSchema);

module.exports = ContactRequest;

