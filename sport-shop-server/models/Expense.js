const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['expense', 'cash_in'], 
    required: true 
  },
  reason: { 
    type: String, 
    required: true,
    trim: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);