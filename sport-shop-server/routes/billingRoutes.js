const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

// POST process checkout
router.post('/checkout', async (req, res) => {
  const { cart, paymentMethod, taxRate = 0.08 } = req.body;

  try {
    let subtotal = 0;
    const processedItems = [];

    // Loop through cart and verify stock
    for (const item of cart) {
      const product = await Product.findById(item._id);
      
      if (!product || product.quantity < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
      }

      // Deduct inventory
      product.quantity -= item.qty;
      await product.save();

      const itemSubtotal = product.price * item.qty;
      subtotal += itemSubtotal;

      processedItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.qty,
        price: product.price,
        subtotal: itemSubtotal
      });
    }

    const tax = subtotal * taxRate;
    const finalTotal = subtotal + tax;

    // Create Invoice
    const invoice = new Invoice({
      items: processedItems,
      subtotal,
      tax,
      finalTotal,
      paymentMethod
    });

    await invoice.save();
    res.status(201).json({ success: true, invoice });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;