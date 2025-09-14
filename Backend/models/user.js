// Backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Update lastLogin on each login
userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('googleId')) {
    this.lastLogin = new Date();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);