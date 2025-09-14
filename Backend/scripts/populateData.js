// Backend/scripts/populateData.js
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
require('dotenv').config();

// Sample data
const sampleCustomers = [
  { name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91-9876543210', totalSpends: 15000, visits: 8 },
  { name: 'Priya Singh', email: 'priya@example.com', phone: '+91-9876543211', totalSpends: 8500, visits: 5 },
  { name: 'Arjun Patel', email: 'arjun@example.com', phone: '+91-9876543212', totalSpends: 25000, visits: 12 },
  { name: 'Sneha Kumar', email: 'sneha@example.com', phone: '+91-9876543213', totalSpends: 3200, visits: 2 },
  { name: 'Vikash Gupta', email: 'vikash@example.com', phone: '+91-9876543214', totalSpends: 12000, visits: 7 },
  { name: 'Anjali Mehta', email: 'anjali@example.com', phone: '+91-9876543215', totalSpends: 18500, visits: 10 },
  { name: 'Rohit Verma', email: 'rohit@example.com', phone: '+91-9876543216', totalSpends: 5600, visits: 3 },
  { name: 'Kavya Nair', email: 'kavya@example.com', phone: '+91-9876543217', totalSpends: 9800, visits: 6 },
  { name: 'Aditya Jain', email: 'aditya@example.com', phone: '+91-9876543218', totalSpends: 22000, visits: 15 },
  { name: 'Meera Reddy', email: 'meera@example.com', phone: '+91-9876543219', totalSpends: 7300, visits: 4 },
];

const populateData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Customer.deleteMany({});
    await Order.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create customers
    const createdCustomers = await Customer.insertMany(sampleCustomers);
    console.log(`✅ Created ${createdCustomers.length} customers`);

    // Create sample orders
    const sampleOrders = [];
    createdCustomers.forEach((customer, index) => {
      // Create 2-5 orders per customer
      const orderCount = Math.floor(Math.random() * 4) + 2;
      for (let i = 0; i < orderCount; i++) {
        const orderAmount = Math.floor(Math.random() * 5000) + 500; // 500-5500
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 90)); // Last 90 days

        sampleOrders.push({
          customerId: customer._id,
          customerEmail: customer.email,
          orderAmount,
          orderDate,
          status: 'completed',
          products: [
            {
              name: `Product ${i + 1}`,
              quantity: Math.floor(Math.random() * 3) + 1,
              price: orderAmount / (Math.floor(Math.random() * 3) + 1)
            }
          ]
        });
      }
    });

    const createdOrders = await Order.insertMany(sampleOrders);
    console.log(`✅ Created ${createdOrders.length} orders`);

    // Update customer stats based on actual orders
    for (const customer of createdCustomers) {
      const customerOrders = await Order.find({ customerId: customer._id });
      const totalSpends = customerOrders.reduce((sum, order) => sum + order.orderAmount, 0);
      const visits = customerOrders.length;
      const lastVisit = customerOrders.length > 0 ? 
        customerOrders.sort((a, b) => b.orderDate - a.orderDate)[0].orderDate : 
        customer.lastVisit;

      await Customer.findByIdAndUpdate(customer._id, {
        totalSpends,
        visits,
        lastVisit
      });
    }

    console.log('✅ Updated customer statistics');
    console.log('🎉 Sample data population completed!');

    // Show summary
    const totalCustomers = await Customer.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$orderAmount' } } }]);

    console.log('\n📊 Database Summary:');
    console.log(`👥 Total Customers: ${totalCustomers}`);
    console.log(`🛒 Total Orders: ${totalOrders}`);
    console.log(`💰 Total Revenue: ₹${totalRevenue[0]?.total || 0}`);

  } catch (error) {
    console.error('❌ Error populating data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
populateData();