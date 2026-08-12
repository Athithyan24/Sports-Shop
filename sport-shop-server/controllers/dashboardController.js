const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

router.get('/stats', async (req, res) => {
  try {
    // 1. Total Revenue
    const revenueStats = await Invoice.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$finalTotal" } } }
    ]);

    // 2. Low Stock Warnings (< 10)
    // Matches the Product schema using 'mainCategory'
    const lowStock = await Product.find({ quantity: { $lt: 10 } })
                                  .select('name sku quantity mainCategory');

    // 3. Sales by Category
    const categorySales = await Invoice.aggregate([
      { $unwind: "$items" },
      { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'productDetails' } },
      { $unwind: "$productDetails" },
      // Grouping by 'mainCategory' to match your Product schema
      { $group: { _id: "$productDetails.mainCategory", sales: { $sum: "$items.subtotal" } } }
    ]);

    // Send exact payload expected by Dashboard.jsx
    res.json({
      totalRevenue: revenueStats[0]?.totalRevenue || 0,
      lowStockWarnings: lowStock,
      salesByCategory: categorySales
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;