// Backend/models/Campaign.js
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: String,
    required: true,
  },
  rules: [{
    id: Number,
    field: String,
    operator: String,
    value: mongoose.Schema.Types.Mixed,
    logicalOperator: String,
  }],
  message: {
    type: String,
    required: true,
  },
  audienceSize: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  },
  sentCount: {
    type: Number,
    default: 0,
  },
  failedCount: {
    type: Number,
    default: 0,
  },
  deliveryStats: {
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

campaignSchema.index({ userId: 1, createdAt: -1 });
campaignSchema.index({ status: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);