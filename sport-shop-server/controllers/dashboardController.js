const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Revenue
    const revenueStats = await Invoice.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$finalTotal" } } }
    ]);

    // 2. Low Stock Warnings (< 10)
    const lowStock = await Product.find({ quantity: { $lt: 10 } })
                                  .select('name sku quantity category');

    // 3. Sales by Category
    const categorySales = await Invoice.aggregate([
      { $unwind: "$items" },
      { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'productDetails' } },
      { $unwind: "$productDetails" },
      { $group: { _id: "$productDetails.category", sales: { $sum: "$items.subtotal" } } }
    ]);

    res.json({
      totalRevenue: revenueStats[0]?.totalRevenue || 0,
      lowStockWarnings: lowStock,
      salesByCategory: categorySales
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};