const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Full-Time', 'Part-Time', 'Contract', 'Internship', 'Remote'],
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  salary: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true
  },
  fullDescription: {
    type: String
  },
  requirements: [String],
  responsibilities: [String],
  benefits: [String],
  skills: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  applicationEmail: {
    type: String,
    default: ''
  },
  applicationDeadline: {
    type: Date,
    default: null
  },
  applicants: [
    {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' },
      coverLetter: { type: String, default: '' },
      resumeUrl: { type: String, default: '' },
      status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Shortlisted', 'Rejected', 'Hired'],
        default: 'Pending'
      },
      appliedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', JobSchema);