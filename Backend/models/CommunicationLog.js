// Backend/models/CommunicationLog.js
const mongoose = require('mongoose');

const communicationLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  personalizedMessage: {
    type: String, // The actual message sent with customer name
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED'],
    default: 'PENDING',
  },
  deliveryAttempts: {
    type: Number,
    default: 0,
  },
  sentAt: {
    type: Date,
  },
  failedAt: {
    type: Date,
  },
  vendorResponse: {
    type: String, // Store vendor API response
  },
  errorMessage: {
    type: String, // Store error details if failed
  },
  deliveryId: {
    type: String, // Vendor's delivery ID
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for performance
communicationLogSchema.index({ campaignId: 1 });
communicationLogSchema.index({ customerId: 1 });
communicationLogSchema.index({ status: 1 });
communicationLogSchema.index({ createdAt: -1 });
communicationLogSchema.index({ campaignId: 1, status: 1 }); // Compound index for campaign stats

// Static method to get campaign stats
communicationLogSchema.statics.getCampaignStats = async function(campaignId) {
  const stats = await this.aggregate([
    { $match: { campaignId: mongoose.Types.ObjectId(campaignId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    sent: 0,
    failed: 0,
    pending: 0
  };
  
  stats.forEach(stat => {
    result[stat._id.toLowerCase()] = stat.count;
  });
  
  return result;
};

// Static method to update campaign delivery stats
communicationLogSchema.statics.updateCampaignStats = async function(campaignId) {
  const Campaign = mongoose.model('Campaign');
  const stats = await this.getCampaignStats(campaignId);
  
  await Campaign.findByIdAndUpdate(campaignId, {
    'deliveryStats.sent': stats.sent,
    'deliveryStats.failed': stats.failed,
    'deliveryStats.pending': stats.pending,
    sentCount: stats.sent,
    failedCount: stats.failed,
  });
  
  return stats;
};

module.exports = mongoose.model('CommunicationLog', communicationLogSchema);