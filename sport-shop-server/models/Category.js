const mongoose = require('mongoose');

// Schema for dynamic fields and their allowed dropdown options
const optionFieldSchema = new mongoose.Schema({
  fieldName: { type: String, required: true }, // e.g., "Size", "Willow Type", "Color"
  options: [{ type: String }],                // e.g., ["S", "M", "L"]
  allowMultiple: { type: Boolean, default: false }
});

// Level 3: Product Sub-Type (e.g., T-Shirt, Bat)
const productTypeSchema = new mongoose.Schema({
  typeName: { type: String, required: true },
  fields: [optionFieldSchema]
});

// Level 2: Game / Sport (e.g., Cricket, General)
const gameSchema = new mongoose.Schema({
  gameName: { type: String, required: true },
  fields: [optionFieldSchema],
  productTypes: [productTypeSchema]
});

// Level 1: Main Category (e.g., Apparel, Equipment)
const categorySchema = new mongoose.Schema({
  mainCategory: { type: String, required: true, unique: true },
  fields: [optionFieldSchema],
  games: [gameSchema]
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);