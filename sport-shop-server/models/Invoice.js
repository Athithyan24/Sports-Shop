// 1. You must import mongoose at the top!
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      quantity: Number,
      price: Number,
      subtotal: Number
    }
  ],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  finalTotal: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);