// Backend/routes/campaigns.js - Fixed delivery simulation
const express = require('express');
const Customer = require('../models/Customer');
const Campaign = require('../models/Campaign');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Helper function to build MongoDB query from rules (keeping the existing one)
const buildQueryFromRules = (rules) => {
  if (!rules || rules.length === 0) return {};

  const conditions = [];
  
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const { field, operator, value } = rule;
    
    let condition = {};
    
    switch (field) {
      case 'totalSpends':
        condition.totalSpends = buildOperatorCondition(operator, parseFloat(value) || 0);
        break;
      case 'visits':
        condition.visits = buildOperatorCondition(operator, parseInt(value) || 0);
        break;
      case 'lastVisit':
        const daysAgo = parseInt(value) || 0;
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
        condition.lastVisit = buildDateOperatorCondition(operator, dateThreshold);
        break;
      case 'createdAt':
        const customerAgeDays = parseInt(value) || 0;
        const customerAgeThreshold = new Date();
        customerAgeThreshold.setDate(customerAgeThreshold.getDate() - customerAgeDays);
        condition.createdAt = buildDateOperatorCondition(operator, customerAgeThreshold);
        break;
      case 'email':
        condition.email = buildTextOperatorCondition(operator, value);
        break;
      case 'name':
        condition.name = buildTextOperatorCondition(operator, value);
        break;
      default:
        continue;
    }
    
    conditions.push(condition);
  }
  
  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  
  const query = { $and: [] };
  let currentGroup = [conditions[0]];
  
  for (let i = 1; i < conditions.length; i++) {
    const rule = rules[i];
    if (rule.logicalOperator === 'OR') {
      if (currentGroup.length === 1) {
        query.$and.push(currentGroup[0]);
      } else {
        query.$and.push({ $and: currentGroup });
      }
      currentGroup = [conditions[i]];
    } else {
      currentGroup.push(conditions[i]);
    }
  }
  
  if (currentGroup.length === 1) {
    query.$and.push(currentGroup[0]);
  } else {
    query.$and.push({ $and: currentGroup });
  }
  
  return query;
};

const buildOperatorCondition = (operator, value) => {
  switch (operator) {
    case '>': return { $gt: value };
    case '<': return { $lt: value };
    case '>=': return { $gte: value };
    case '<=': return { $lte: value };
    case '=': return { $eq: value };
    case '!=': return { $ne: value };
    default: return { $eq: value };
  }
};

const buildDateOperatorCondition = (operator, date) => {
  switch (operator) {
    case '>': return { $lt: date };
    case '<': return { $gt: date };
    case '>=': return { $lte: date };
    case '<=': return { $gte: date };
    case '=': return { 
      $gte: new Date(date.getTime() - 24*60*60*1000),
      $lte: new Date(date.getTime() + 24*60*60*1000)
    };
    default: return { $lte: date };
  }
};

const buildTextOperatorCondition = (operator, value) => {
  switch (operator) {
    case 'contains': return { $regex: value, $options: 'i' };
    case 'equals': return { $eq: value };
    case 'startsWith': return { $regex: `^${value}`, $options: 'i' };
    case 'endsWith': return { $regex: `${value}$`, $options: 'i' };
    case 'notContains': return { $not: { $regex: value, $options: 'i' } };
    default: return { $regex: value, $options: 'i' };
  }
};

// POST /api/campaigns/preview - Preview audience for rules
router.post('/preview', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Preview request for rules:', req.body.rules);
    
    const { rules } = req.body;
    const query = buildQueryFromRules(rules);
    
    const count = await Customer.countDocuments(query);
    const preview = await Customer.find(query).limit(5).select('name email totalSpends visits lastVisit createdAt');
    
    console.log(`✅ Found ${count} matching customers`);
    
    res.json({
      count,
      preview: preview.map(customer => ({
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        totalSpends: customer.totalSpends,
        visits: customer.visits,
        lastVisit: customer.lastVisit,
        createdAt: customer.createdAt,
      }))
    });
  } catch (error) {
    console.error('❌ Preview error:', error);
    res.status(500).json({ 
      message: 'Failed to preview audience',
      error: error.message 
    });
  }
});

// POST /api/campaigns - Create new campaign
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('🚀 Creating campaign:', req.body);
    
    const { name, rules, message, audienceSize } = req.body;
    
    if (!name || !rules || !message) {
      return res.status(400).json({ message: 'Name, rules, and message are required' });
    }
    
    // Create campaign
    const campaign = new Campaign({
      name,
      userId: req.user.userId,
      rules,
      message,
      audienceSize: audienceSize || 0,
      status: 'ACTIVE',
      sentCount: 0,
      failedCount: 0,
      deliveryStats: {
        sent: 0,
        failed: 0,
        pending: audienceSize || 0
      }
    });
    
    await campaign.save();
    
    console.log('✅ Campaign created:', campaign._id);
    console.log('📤 Starting delivery simulation...');
    
    // Start delivery simulation immediately (don't wait for setTimeout)
    simulateCampaignDelivery(campaign._id);
    
    res.json({
      success: true,
      campaign: {
        id: campaign._id,
        name: campaign.name,
        audienceSize: campaign.audienceSize,
        status: campaign.status,
        createdAt: campaign.createdAt,
      }
    });
  } catch (error) {
    console.error('❌ Campaign creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create campaign',
      error: error.message 
    });
  }
});

// GET /api/campaigns - Get user's campaigns
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    
    const campaigns = await Campaign.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    res.json(campaigns.map(campaign => ({
      _id: campaign._id,
      name: campaign.name,
      audienceSize: campaign.audienceSize,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      status: campaign.status,
      message: campaign.message,
      createdAt: campaign.createdAt,
      rules: campaign.rules,
    })));
  } catch (error) {
    console.error('❌ Campaigns fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch campaigns',
      error: error.message 
    });
  }
});

// GET /api/campaigns/:id - Get single campaign
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('❌ Campaign fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch campaign',
      error: error.message 
    });
  }
});

// POST /api/campaigns/:id/trigger-delivery - Manual trigger for testing
router.post('/:id/trigger-delivery', authenticateToken, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    console.log('🔄 Manually triggering delivery for campaign:', campaign._id);
    simulateCampaignDelivery(campaign._id);
    
    res.json({ message: 'Delivery simulation triggered', campaignId: campaign._id });
  } catch (error) {
    console.error('❌ Manual trigger error:', error);
    res.status(500).json({ message: 'Failed to trigger delivery' });
  }
});

// Improved campaign delivery simulation
const simulateCampaignDelivery = async (campaignId) => {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      console.error('❌ Campaign not found for delivery:', campaignId);
      return;
    }
    
    console.log(`📤 Starting delivery simulation for campaign ${campaignId}`);
    console.log(`👥 Audience size: ${campaign.audienceSize}`);
    
    const audienceSize = campaign.audienceSize;
    if (audienceSize === 0) {
      console.log('⚠️ No audience to deliver to');
      return;
    }
    
    const successRate = 0.9; // 90% success rate
    const totalSent = Math.floor(audienceSize * successRate);
    const totalFailed = audienceSize - totalSent;
    
    console.log(`📊 Planned delivery: ${totalSent} sent, ${totalFailed} failed`);
    
    // Simulate gradual delivery over 8 steps (8 seconds)
    const steps = 8;
    const sentPerStep = Math.ceil(totalSent / steps);
    
    for (let step = 1; step <= steps; step++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const currentSent = Math.min(totalSent, step * sentPerStep);
      const currentFailed = step === steps ? totalFailed : 0;
      const pending = audienceSize - currentSent - currentFailed;
      
      console.log(`📈 Step ${step}/${steps}: Sent: ${currentSent}, Failed: ${currentFailed}, Pending: ${pending}`);
      
      await Campaign.findByIdAndUpdate(campaignId, {
        sentCount: currentSent,
        failedCount: currentFailed,
        status: step === steps ? 'COMPLETED' : 'ACTIVE',
        'deliveryStats.sent': currentSent,
        'deliveryStats.failed': currentFailed,
        'deliveryStats.pending': pending,
      });
    }
    
    console.log(`✅ Campaign ${campaignId} delivery completed: ${totalSent} sent, ${totalFailed} failed`);
    
  } catch (error) {
    console.error('❌ Delivery simulation error for campaign', campaignId, ':', error);
    try {
      // Mark campaign as failed
      await Campaign.findByIdAndUpdate(campaignId, {
        status: 'FAILED',
        failedCount: campaign?.audienceSize || 0,
      });
      console.log(`❌ Marked campaign ${campaignId} as FAILED`);
    } catch (updateError) {
      console.error('❌ Failed to update campaign status:', updateError);
    }
  }
};

module.exports = router;