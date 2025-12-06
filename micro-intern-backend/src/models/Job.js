// models/Job.js

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  skills: [
    {
      type: String, // e.g. "React", "Python"
    },
  ],
  duration: {
    type: String, // e.g. "1-2 weeks"
  },
  budget: {
    type: Number, // e.g. 500
  },
  location: {
    type: String, // e.g. "Remote", "Onsite"
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
  },
}, {
  timestamps: true,
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
