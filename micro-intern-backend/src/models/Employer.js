// models/Employer.js

const mongoose = require('mongoose');

const employerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  organizationEmail: {
    type: String,
    required: true,
  },
  industryType: {
    type: String,
  },
  contacts: {
    type: String,
  },
  email: {
    type: String,
  },
  bio: {
    type: String,
  },
  verificationStatus: {
    type: String,
    default: 'pending', // 'pending' | 'verified'
  },
  documents: [
    {
      name: String,
      url: String,
    },
  ],
}, {
  timestamps: true,
});

const Employer = mongoose.model('Employer', employerSchema);

module.exports = Employer;
