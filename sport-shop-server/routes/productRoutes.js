const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import the Product model exactly as structured in your models folder
const Product = require('../models/Product'); 

// ------------------------------------------------------------------
// 1. MULTER CONFIGURATION FOR IMAGE UPLOADS
// ------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Saves files to the existing 'uploads' directory shown in your file tree
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    // Generates a unique filename to prevent overwriting
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Initialize multer (expects the field name 'image' as sent by AddProduct.jsx)
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit matching your frontend UI
});

// ------------------------------------------------------------------
// 2. CREATE PRODUCT ROUTE (POST /)
// ------------------------------------------------------------------
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const {
      name, 
      sku, 
      unit, 
      price, 
      costPrice, 
      quantity,
      supplier, 
      mainCategory, 
      gameType, 
      productType, 
      attributes
    } = req.body;

    // The frontend sends `attributes` as a JSON string via FormData.
    // We must parse it back into an object for the Mongoose Map[cite: 12].
    let parsedAttributes = {};
    if (attributes) {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch (parseError) {
        console.error("Failed to parse dynamic attributes:", parseError);
        return res.status(400).json({ message: "Invalid attributes format" });
      }
    }

    // Construct the image URL based on whether a file was uploaded
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    // Instantiate the new Product adhering to Product.js schema[cite: 12]
    const newProduct = new Product({
      name,
      sku,
      unit: unit || 'Count',
      price: Number(price),
      costPrice: Number(costPrice),
      quantity: Number(quantity), // Handles both quantity definitions in the schema[cite: 12]
      supplier,
      mainCategory,
      gameType,
      productType,
      attributes: parsedAttributes, // Saved as Map of Mixed Types[cite: 12]
      imageUrl,
      variants: [] // Initialized empty; can be updated later if multi-size/color is needed[cite: 12]
    });

    // Save to MongoDB
    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: savedProduct
    });

  } catch (error) {
    console.error('Error creating product:', error);
    
    // Handle specific MongoDB errors (e.g., Duplicate SKU)[cite: 12]
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A product with this SKU already exists.' });
    }

    res.status(500).json({ 
      message: 'Server error while saving product', 
      error: error.message 
    });
  }
});

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = { ...req.body };

    // Only attempt JSON.parse if attributes is passed as a String (e.g. via FormData)
    if (updateData.attributes && typeof updateData.attributes === 'string') {
      try {
        updateData.attributes = JSON.parse(updateData.attributes);
      } catch (parseError) {
        return res.status(400).json({ message: "Invalid attributes format" });
      }
    }

    // If a new image is uploaded, update the URL
    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    // Convert numeric fields safely
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.costPrice) updateData.costPrice = Number(updateData.costPrice);
    if (updateData.quantity) updateData.quantity = Number(updateData.quantity);

    const updatedProduct = await Product.findByIdAndUpdate(
      productId, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error while updating product', error: error.message });
  }
});

// ------------------------------------------------------------------
// 4. DELETE PRODUCT ROUTE (DELETE /:id)
// ------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error while deleting product', error: error.message });
  }
});

// ------------------------------------------------------------------
// 5. GET ALL PRODUCTS (GET /)
// ------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    // Fetch all products from the database and sort by newest first
    const products = await Product.find().sort({ createdAt: -1 });
    
    // Send the array of products back to Inventory.jsx
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch inventory', error: error.message });
  }
});

module.exports = router;