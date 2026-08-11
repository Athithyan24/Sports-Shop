const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  color: { type: String, required: true }, // e.g., "Golden"
  size: { type: String, required: true },  // e.g., "L"
  sku: { type: String },                   // e.g., "CRIC-TSHIRT-GOLD-L"
  stock: { type: Number, default: 0 },     // e.g., 30
  price: { type: Number },                 // Optional variant price override
  sizeChartUrl: { type: String }           // Optional custom size chart image for this specific variant/color
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  sizeChartUrl: { type: String, default: '' },
  imageUrl: { type: String, default: '' }, 
  unit: { type: String, required: true, default: 'Count' },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 0 },
  supplier: { type: String },
  
  // Dynamic Taxonomy
  mainCategory: { type: String, required: true },
  gameType: { type: String },
  productType: { type: String },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // This Map will store all custom inputs (e.g., { "Height": "15in", "Weight": "2kg" })
  attributes: { type: Map, of: mongoose.Schema.Types.Mixed },
  variants: [variantSchema] 

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);