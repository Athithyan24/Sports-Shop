require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const seedProducts = [
  {
    name: 'Leather ball',
    sku: 'BL-001',
    category: 'Equipment',
    price: 299.99,
    costPrice: 120.00,
    quantity: 45,
    supplier: 'Apex Sports Mfg'
  },
  {
    name: 'Bicycle',
    sku: 'BC-012',
    category: 'Cycling',
    price: 399.99,
    costPrice: 210.00,
    quantity: 8, // Will trigger a low stock alert
    supplier: 'Trek Co.'
  },
  {
    name: 'Glass trophy',
    sku: 'TR-001',
    category: 'Trophies',
    price: 299.99,
    costPrice: 90.00,
    quantity: 20,
    supplier: 'Awards Inc.'
  },
  {
    name: 'Baseball cap',
    sku: 'CP-003',
    category: 'Apparel',
    price: 19.99,
    costPrice: 5.00,
    quantity: 12,
    supplier: 'Headwear Ltd'
  }
];

const seedDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sport-shop');
    console.log('MongoDB Connected.');

    // Clear existing products to prevent duplicates
    await Product.deleteMany({});
    console.log('Cleared old inventory data.');

    // Insert new seed data
    await Product.insertMany(seedProducts);
    console.log('Successfully seeded database with dummy products!');

    // Close the connection
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();