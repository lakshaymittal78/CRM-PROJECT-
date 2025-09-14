// Backend/routes/dashboard.js - Fixed version with better error handling
const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Campaign = require('../models/Campaign');
const { authenticateToken } = require('./auth');
const router = express.Router();

// GET /api/dashboard/stats - Dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Dashboard stats request from user:', req.user?.email || req.user?.userId);
    console.log('📊 User object:', JSON.stringify(req.user, null, 2));

    // Basic counts with error handling for each query
    let totalCustomers = 0;
    let totalOrders = 0;
    let totalCampaigns = 0;

    try {
      totalCustomers = await Customer.countDocuments();
      console.log('👥 Total customers:', totalCustomers);
    } catch (error) {
      console.error('❌ Error counting customers:', error.message);
    }

    try {
      totalOrders = await Order.countDocuments();
      console.log('🛒 Total orders:', totalOrders);
    } catch (error) {
      console.error('❌ Error counting orders:', error.message);
    }

    try {
      totalCampaigns = await Campaign.countDocuments({ 
        userId: req.user.userId || req.user.id 
      });
      console.log('📧 Total campaigns:', totalCampaigns);
    } catch (error) {
      console.error('❌ Error counting campaigns:', error.message);
    }

    // Campaign stats with better error handling
    let campaignStats = { sent: 0, failed: 0, pending: 0 };
    
    try {
      const campaignStatsResult = await Campaign.aggregate([
        { $match: { userId: req.user.userId || req.user.id } },
        {
          $group: {
            _id: null,
            sent: { $sum: '$sentCount' },
            failed: { $sum: '$failedCount' },
            pending: { 
              $sum: { 
                $cond: [
                  { $eq: ['$status', 'PENDING'] }, 
                  '$audienceSize', 
                  0
                ]
              }
            }
          }
        }
      ]);

      if (campaignStatsResult.length > 0) {
        campaignStats = campaignStatsResult[0];
      }
      console.log('📈 Campaign stats:', campaignStats);
    } catch (error) {
      console.error('❌ Error getting campaign stats:', error.message);
    }

    // Recent activity (optional, with error handling)
    let recentCustomers = [];
    let recentOrders = [];
    
    try {
      recentCustomers = await Customer.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email createdAt totalSpends');
      console.log('📈 Recent customers:', recentCustomers.length);
    } catch (error) {
      console.error('❌ Error getting recent customers:', error.message);
    }

    try {
      recentOrders = await Order.find()
        .sort({ orderDate: -1 })
        .limit(5)
        .select('customerEmail orderAmount orderDate');
      console.log('📈 Recent orders:', recentOrders.length);
    } catch (error) {
      console.error('❌ Error getting recent orders:', error.message);
    }

    const response = {
      totalCustomers,
      totalOrders,
      totalCampaigns,
      campaignStats,
      recentActivity: {
        customers: recentCustomers,
        orders: recentOrders,
      }
    };

    console.log('✅ Sending dashboard response:', JSON.stringify(response, null, 2));
    res.json(response);

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Send a response with zeros if there's an error, but indicate the issue
    res.status(500).json({ 
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
      // Provide default values so frontend doesn't break
      totalCustomers: 0,
      totalOrders: 0,
      totalCampaigns: 0,
      campaignStats: { sent: 0, failed: 0, pending: 0 },
      recentActivity: { customers: [], orders: [] }
    });
  }
});

// Test endpoint to check if route is working
router.get('/test', authenticateToken, (req, res) => {
  res.json({
    message: 'Dashboard route is working!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// GET /api/dashboard/analytics - Advanced analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    console.log('📊 Analytics request for period:', daysAgo, 'days');

    // Customer growth
    const customerGrowth = await Customer.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Revenue trends
    const revenueTrends = await Order.aggregate([
      { $match: { orderDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' },
            day: { $dayOfMonth: '$orderDate' }
          },
          revenue: { $sum: '$orderAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Top customers
    const topCustomers = await Customer.find()
      .sort({ totalSpends: -1 })
      .limit(10)
      .select('name email totalSpends visits');

    // Campaign performance
    const campaignPerformance = await Campaign.find({ 
      userId: req.user.userId || req.user.id 
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name audienceSize sentCount failedCount status createdAt');

    res.json({
      customerGrowth,
      revenueTrends,
      topCustomers,
      campaignPerformance,
      period: daysAgo
    });
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch analytics',
      error: error.message 
    });
  }
});

module.exports = router;