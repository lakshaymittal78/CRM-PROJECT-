// Backend/models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  totalSpends: {
    type: Number,
    default: 0,
    min: 0,
  },
  visits: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastVisit: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for better query performance
customerSchema.index({ email: 1 });
customerSchema.index({ totalSpends: -1 });
customerSchema.index({ visits: -1 });
customerSchema.index({ lastVisit: -1 });

// Virtual for days since last visit
customerSchema.virtual('daysSinceLastVisit').get(function() {
  if (!this.lastVisit) return null;
  return Math.floor((Date.now() - this.lastVisit.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for customer age in days
customerSchema.virtual('customerAge').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Customer', customerSchema);