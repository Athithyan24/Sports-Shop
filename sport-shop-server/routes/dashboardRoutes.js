const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');

// 1. Fetch Dashboard Telemetry & Chart Data
router.get('/stats', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'weekly';
    const now = new Date();

    const invoices = await Invoice.find().sort({ date: -1, createdAt: -1 });
    const products = await Product.find();
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });

    // Summary Metrics
    let grossSales = 0;
    invoices.forEach((inv) => {
      grossSales += inv.finalTotal || inv.subtotal || inv.total || 0;
    });

    let totalExpenses = 0;
    let totalCashIn = 0;
    expenses.forEach((e) => {
      if (e.type === 'expense') totalExpenses += e.amount || 0;
      if (e.type === 'cash_in') totalCashIn += e.amount || 0;
    });

    const netRevenue = grossSales + totalCashIn - totalExpenses;

    const activeCategoriesCount = new Set(
      products.map((p) => p.mainCategory || p.category).filter(Boolean)
    ).size;

    const lowStockWarnings = await Product.find({
      $or: [{ quantity: { $lt: 10 } }, { stock: { $lt: 10 } }]
    });

    // Chart Time Series Calculation (Net Revenue per bucket)
    let chartData = [];

    const getBucketLabel = (d, currentPeriod) => {
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return '';

      if (currentPeriod === 'weekly') {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayIndex = dateObj.getDay();
        return days[dayIndex === 0 ? 6 : dayIndex - 1];
      }
      if (currentPeriod === 'monthly') {
        return `Day ${dateObj.getDate()}`;
      }
      if (currentPeriod === 'yearly') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[dateObj.getMonth()];
      }
      return '';
    };

    if (timeframe === 'weekly') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekBuckets = {};
      days.forEach((day) => (weekBuckets[day] = 0));

      invoices.forEach((inv) => {
        const lbl = getBucketLabel(inv.date || inv.createdAt, 'weekly');
        if (weekBuckets[lbl] !== undefined) weekBuckets[lbl] += inv.finalTotal || inv.subtotal || 0;
      });

      expenses.forEach((e) => {
        const lbl = getBucketLabel(e.date || e.createdAt, 'weekly');
        if (weekBuckets[lbl] !== undefined) {
          if (e.type === 'cash_in') weekBuckets[lbl] += e.amount;
          if (e.type === 'expense') weekBuckets[lbl] -= e.amount;
        }
      });

      chartData = days.map((day) => ({
        label: day,
        revenue: Math.max(0, weekBuckets[day])
      }));

    } else if (timeframe === 'monthly') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const monthBuckets = {};
      for (let i = 1; i <= daysInMonth; i++) {
        monthBuckets[`Day ${i}`] = 0;
      }

      invoices.forEach((inv) => {
        const d = new Date(inv.date || inv.createdAt);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const lbl = `Day ${d.getDate()}`;
          if (monthBuckets[lbl] !== undefined) monthBuckets[lbl] += inv.finalTotal || inv.subtotal || 0;
        }
      });

      expenses.forEach((e) => {
        const d = new Date(e.date || e.createdAt);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const lbl = `Day ${d.getDate()}`;
          if (monthBuckets[lbl] !== undefined) {
            if (e.type === 'cash_in') monthBuckets[lbl] += e.amount;
            if (e.type === 'expense') monthBuckets[lbl] -= e.amount;
          }
        }
      });

      chartData = Object.keys(monthBuckets).map((lbl) => ({
        label: lbl,
        revenue: Math.max(0, monthBuckets[lbl])
      }));

    } else if (timeframe === 'yearly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const yearBuckets = {};
      months.forEach((m) => (yearBuckets[m] = 0));

      invoices.forEach((inv) => {
        const lbl = getBucketLabel(inv.date || inv.createdAt, 'yearly');
        if (yearBuckets[lbl] !== undefined) yearBuckets[lbl] += inv.finalTotal || inv.subtotal || 0;
      });

      expenses.forEach((e) => {
        const lbl = getBucketLabel(e.date || e.createdAt, 'yearly');
        if (yearBuckets[lbl] !== undefined) {
          if (e.type === 'cash_in') yearBuckets[lbl] += e.amount;
          if (e.type === 'expense') yearBuckets[lbl] -= e.amount;
        }
      });

      chartData = months.map((m) => ({
        label: m,
        revenue: Math.max(0, yearBuckets[m])
      }));
    }

    // Transactions Mapping
    const formattedTransactions = invoices.map((inv) => ({
      _id: inv._id,
      invoiceNo: `INV-${inv._id.toString().slice(-6).toUpperCase()}`,
      date: inv.date || inv.createdAt || new Date(),
      customerName: inv.customer?.name || inv.customerName || 'Walk-in Customer',
      customerPhone: inv.customer?.phone || inv.customerPhone || 'N/A',
      paymentMethod: inv.paymentMethod || 'Cash',
      subtotal: inv.subtotal || 0,
      total: inv.finalTotal || inv.subtotal || inv.total || 0,
      items: (inv.items || []).map((item) => ({
        _id: item._id,
        name: item.name || 'Product',
        qty: item.quantity || item.qty || 1,
        price: item.price || 0,
        subtotal: item.subtotal || ((item.price || 0) * (item.quantity || item.qty || 1))
      }))
    }));

    // Cash Flows Mapping
    const formattedExpenses = expenses.map((e) => ({
      _id: e._id,
      type: e.type,
      reason: e.reason,
      amount: e.amount,
      date: e.date || e.createdAt || new Date()
    }));

    res.json({
      grossSales,
      totalExpenses,
      totalCashIn,
      netRevenue,
      activeCategories: activeCategoriesCount,
      lowStockCount: lowStockWarnings.length,
      lowStockWarnings,
      chartData,
      transactions: formattedTransactions,
      expenses: formattedExpenses
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 2. Post Expense or Cash In Entry
router.post('/expense', async (req, res) => {
  try {
    const { type, reason, amount, date } = req.body;
    if (!type || !reason || !amount) {
      return res.status(400).json({ message: 'Type, reason, and amount are required.' });
    }

    const newExpense = new Expense({
      type,
      reason,
      amount: Number(amount),
      date: date ? new Date(date) : new Date()
    });

    await newExpense.save();
    res.status(201).json({ message: 'Cash flow record created successfully', data: newExpense });
  } catch (error) {
    console.error('Create Expense Error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;