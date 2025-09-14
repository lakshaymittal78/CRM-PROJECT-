// Backend/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  orderAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'completed',
  },
  products: [{
    name: String,
    quantity: Number,
    price: Number,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for better query performance
orderSchema.index({ customerId: 1 });
orderSchema.index({ customerEmail: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ orderAmount: -1 });

module.exports = mongoose.model('Order', orderSchema);