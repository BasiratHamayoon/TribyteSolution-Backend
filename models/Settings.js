const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    unique: true
  },
  profile: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    avatar: String,
    bio: String,
    role: {
      type: String,
      default: 'Admin'
    }
  },
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    newMessages: {
      type: Boolean,
      default: true
    },
    newProjects: {
      type: Boolean,
      default: false
    },
    systemAlerts: {
      type: Boolean,
      default: true
    }
  },
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    lastPasswordChange: Date,
    loginHistory: [{
      ip: String,
      userAgent: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);