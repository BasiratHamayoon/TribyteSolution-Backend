const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  tag: { 
    type: String 
  },
  description: { 
    type: String, 
    required: true 
  },
  fullDescription: { 
    type: String 
  },
  techStack: [String],
  image: { 
    type: String 
  },
  liveLink: { 
    type: String 
  },
  githubLink: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Project', ProjectSchema);