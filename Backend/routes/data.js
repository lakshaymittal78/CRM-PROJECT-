// Backend/routes/data.js
const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { authenticateToken } = require('./auth');
const router = express.Router();

// POST /api/data/customers - Add customers
router.post('/customers', authenticateToken, async (req, res) => {
  try {
    const customers = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    for (const customerData of customers) {
      try {
        // Check if customer already exists
        let customer = await Customer.findOne({ email: customerData.email });
        
        if (customer) {
          // Update existing customer
          customer.name = customerData.name || customer.name;
          customer.phone = customerData.phone || customer.phone;
          customer.totalSpends = customerData.totalSpends || customer.totalSpends;
          customer.visits = customerData.visits || customer.visits;
          customer.lastVisit = customerData.lastVisit || customer.lastVisit;
          customer.updatedAt = new Date();
          
          await customer.save();
          results.push({ status: 'updated', customer });
        } else {
          // Create new customer
          customer = new Customer({
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            totalSpends: customerData.totalSpends || 0,
            visits: customerData.visits || 0,
            lastVisit: customerData.lastVisit || new Date(),
          });
          
          await customer.save();
          results.push({ status: 'created', customer });
        }
      } catch (error) {
        results.push({ 
          status: 'error', 
          email: customerData.email, 
          error: error.message 
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${customers.length} customer(s)`,
      results,
      summary: {
        total: customers.length,
        created: results.filter(r => r.status === 'created').length,
        updated: results.filter(r => r.status === 'updated').length,
        errors: results.filter(r => r.status === 'error').length,
      }
    });
  } catch (error) {
    console.error('Customer ingestion error:', error);
    res.status(500).json({ message: 'Failed to process customers', error: error.message });
  }
});

// POST /api/data/orders - Add orders
router.post('/orders', authenticateToken, async (req, res) => {
  try {
    const orders = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    for (const orderData of orders) {
      try {
        // Find customer by email
        const customer = await Customer.findOne({ email: orderData.customerEmail });
        
        if (!customer) {
          results.push({ 
            status: 'error', 
            customerEmail: orderData.customerEmail, 
            error: 'Customer not found' 
          });
          continue;
        }

        // Create new order
        const order = new Order({
          customerId: customer._id,
          customerEmail: orderData.customerEmail,
          orderAmount: orderData.orderAmount,
          orderDate: orderData.orderDate || new Date(),
          status: orderData.status || 'completed',
          products: orderData.products || [],
        });

        await order.save();

        // Update customer stats
        customer.totalSpends += orderData.orderAmount;
        customer.visits += 1;
        customer.lastVisit = order.orderDate;
        customer.updatedAt = new Date();
        await customer.save();

        results.push({ status: 'created', order });
      } catch (error) {
        results.push({ 
          status: 'error', 
          customerEmail: orderData.customerEmail, 
          error: error.message 
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${orders.length} order(s)`,
      results,
      summary: {
        total: orders.length,
        created: results.filter(r => r.status === 'created').length,
        errors: results.filter(r => r.status === 'error').length,
      }
    });
  } catch (error) {
    console.error('Order ingestion error:', error);
    res.status(500).json({ message: 'Failed to process orders', error: error.message });
  }
});

// GET /api/data/customers - Get customers with filtering
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, minSpend, maxSpend } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (minSpend) query.totalSpends = { ...query.totalSpends, $gte: parseFloat(minSpend) };
    if (maxSpend) query.totalSpends = { ...query.totalSpends, $lte: parseFloat(maxSpend) };

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// GET /api/data/orders - Get orders
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, customerEmail } = req.query;
    
    let query = {};
    if (customerEmail) query.customerEmail = customerEmail;

    const orders = await Order.find(query)
      .populate('customerId', 'name email')
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// GET /api/data/stats - Get basic statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$orderAmount' },
          averageOrderValue: { $avg: '$orderAmount' },
        }
      }
    ]);

    const customerStats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalSpends: { $sum: '$totalSpends' },
          averageSpends: { $avg: '$totalSpends' },
          totalVisits: { $sum: '$visits' },
        }
      }
    ]);

    res.json({
      customers: {
        total: totalCustomers,
        totalSpends: customerStats[0]?.totalSpends || 0,
        averageSpends: customerStats[0]?.averageSpends || 0,
        totalVisits: customerStats[0]?.totalVisits || 0,
      },
      orders: {
        total: totalOrders,
        totalRevenue: orderStats[0]?.totalRevenue || 0,
        averageOrderValue: orderStats[0]?.averageOrderValue || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

module.exports = router;