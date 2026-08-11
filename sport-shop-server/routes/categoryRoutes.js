const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 1. CREATE MAIN CATEGORY
router.post('/main', async (req, res) => {
  const { mainCategory, customFields } = req.body;
  try {
    const fieldsFormatted = (customFields || []).map(name => ({ fieldName: name, options: [] }));
    const newCat = new Category({ mainCategory, fields: fieldsFormatted, games: [] });
    await newCat.save();
    res.status(201).json(newCat);
  } catch (error) {
    res.status(400).json({ message: 'Category name must be unique.' });
  }
});

// 2. CREATE GAME/SPORT
router.post('/game', async (req, res) => {
  const { mainCategoryId, gameName, customFields } = req.body;
  try {
    const cat = await Category.findById(mainCategoryId);
    if (cat) {
      const fieldsFormatted = (customFields || []).map(name => ({ fieldName: name, options: [] }));
      cat.games.push({ gameName, fields: fieldsFormatted, productTypes: [] });
      await cat.save();
    }
    res.json(cat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 3. CREATE PRODUCT TYPE
router.post('/product-type', async (req, res) => {
  const { mainCategoryId, gameName, productType, customFields } = req.body;
  try {
    const cat = await Category.findById(mainCategoryId);
    const game = cat?.games.find(g => g.gameName === gameName);
    if (game) {
      const fieldsFormatted = (customFields || []).map(name => ({ fieldName: name, options: [] }));
      game.productTypes.push({ typeName: productType, fields: fieldsFormatted });
      await cat.save();
    }
    res.json(cat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 4. ADD DROPDOWN OPTION CHOICE
router.post('/field-option', async (req, res) => {
  const { mainCategoryId, gameName, productTypeName, level, fieldName, optionValue } = req.body;
  try {
    const cat = await Category.findById(mainCategoryId);
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    let targetFields = [];
    if (level === 'main') targetFields = cat.fields;
    else if (level === 'game') targetFields = cat.games.find(g => g.gameName === gameName)?.fields || [];
    else if (level === 'productType') {
      const game = cat.games.find(g => g.gameName === gameName);
      targetFields = game?.productTypes.find(p => p.typeName === productTypeName)?.fields || [];
    }

    const targetField = targetFields.find(f => f.fieldName === fieldName);
    if (targetField && !targetField.options.includes(optionValue)) {
      targetField.options.push(optionValue);
      await cat.save();
    }

    res.json(cat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- UPDATION & DELETION ENDPOINTS ---

// DELETE MAIN CATEGORY
router.delete('/main/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Main Category deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE GAME
router.delete('/game', async (req, res) => {
  const { mainCategoryId, gameName } = req.body;
  try {
    const cat = await Category.findById(mainCategoryId);
    if (cat) {
      cat.games = cat.games.filter(g => g.gameName !== gameName);
      await cat.save();
    }
    res.json(cat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE PRODUCT TYPE
router.delete('/product-type', async (req, res) => {
  const { mainCategoryId, gameName, productTypeName } = req.body;
  try {
    const cat = await Category.findById(mainCategoryId);
    const game = cat?.games.find(g => g.gameName === gameName);
    if (game) {
      game.productTypes = game.productTypes.filter(p => p.typeName !== productTypeName);
      await cat.save();
    }
    res.json(cat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE ENTIRE DYNAMIC FIELD
router.delete('/field', async (req, res) => {
  const { mainCategoryId, gameName, productTypeName, level, fieldName } = req.body;
  try {
    const cat = await Category.findById(mainCategoryId);
    if (!cat) return res.status(404).json({ message: 'Not found' });

    if (level === 'main') {
      cat.fields = cat.fields.filter(f => f.fieldName !== fieldName);
    } else if (level === 'game') {
      const game = cat.games.find(g => g.gameName === gameName);
      if (game) game.fields = game.fields.filter(f => f.fieldName !== fieldName);
    } else if (level === 'productType') {
      const game = cat.games.find(g => g.gameName === gameName);
      const pType = game?.productTypes.find(p => p.typeName === productTypeName);
      if (pType) pType.fields = pType.fields.filter(f => f.fieldName !== fieldName);
    }

    await cat.save();
    res.json(cat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE INDIVIDUAL FIELD OPTION CHOICE
router.delete('/field-option', async (req, res) => {
  const { mainCategoryId, gameName, productTypeName, level, fieldName, optionValue } = req.body;
  try {
    const cat = await Category.findById(mainCategoryId);
    if (!cat) return res.status(404).json({ message: 'Not found' });

    let targetFields = [];
    if (level === 'main') targetFields = cat.fields;
    else if (level === 'game') targetFields = cat.games.find(g => g.gameName === gameName)?.fields || [];
    else if (level === 'productType') {
      const game = cat.games.find(g => g.gameName === gameName);
      targetFields = game?.productTypes.find(p => p.typeName === productTypeName)?.fields || [];
    }

    const field = targetFields.find(f => f.fieldName === fieldName);
    if (field) {
      field.options = field.options.filter(opt => opt !== optionValue);
      await cat.save();
    }

    res.json(cat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/field-multi-select', async (req, res) => {
  try {
    const { mainCategoryId, gameName, productTypeName, level, fieldName, allowMultiple } = req.body;

    if (!mainCategoryId || !level || !fieldName) {
      return res.status(400).json({ message: 'Main category ID, level, and field name are required.' });
    }

    const category = await Category.findById(mainCategoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    let targetFields = [];

    // Locate the target field array based on the category hierarchy level
    if (level === 'main') {
      targetFields = category.fields;
    } else if (level === 'game') {
      const game = category.games.find((g) => g.gameName === gameName);
      if (!game) return res.status(404).json({ message: 'Sport/Game not found.' });
      targetFields = game.fields;
    } else if (level === 'productType') {
      const game = category.games.find((g) => g.gameName === gameName);
      if (!game) return res.status(404).json({ message: 'Sport/Game not found.' });
      
      const type = game.productTypes.find((p) => p.typeName === productTypeName);
      if (!type) return res.status(404).json({ message: 'Product type not found.' });
      
      targetFields = type.fields;
    }

    // Find the specific field and update its allowMultiple flag
    const targetField = targetFields.find((f) => f.fieldName === fieldName);
    if (!targetField) {
      return res.status(404).json({ message: 'Dynamic field not found.' });
    }

    targetField.allowMultiple = allowMultiple;

    await category.save();
    return res.status(200).json({ message: 'Multi-select setting updated successfully.', category });
  } catch (error) {
    console.error('Error updating field-multi-select:', error);
    return res.status(500).json({ message: 'Failed to update multi-select preference', error: error.message });
  }
});

// CREATE DYNAMIC FIELD AT SPECIFIC LEVEL
// CREATE DYNAMIC FIELD AT SPECIFIC LEVEL
router.post('/field', async (req, res) => {
  const { mainCategoryId, gameName, productTypeName, level, fieldName } = req.body;

  // 1. Validate required payload parameters
  if (!mainCategoryId || !level || !fieldName) {
    return res.status(400).json({ message: 'Missing required parameters: mainCategoryId, level, or fieldName.' });
  }

  try {
    // 2. Locate the parent category document
    const cat = await Category.findById(mainCategoryId);
    if (!cat) {
      return res.status(404).json({ message: 'Main category not found.' });
    }

    let targetFields = [];

    // 3. Traverse the 3-tier hierarchy based on the requested 'level'
    if (level === 'main') {
      targetFields = cat.fields;
    } else if (level === 'game') {
      const game = cat.games.find(g => g.gameName === gameName);
      if (!game) {
        return res.status(404).json({ message: 'Sport/Game not found.' });
      }
      targetFields = game.fields;
    } else if (level === 'productType') {
      const game = cat.games.find(g => g.gameName === gameName);
      if (!game) {
        return res.status(404).json({ message: 'Sport/Game not found.' });
      }
      const pType = game.productTypes.find(p => p.typeName === productTypeName);
      if (!pType) {
        return res.status(404).json({ message: 'Product type not found.' });
      }
      targetFields = pType.fields;
    } else {
      return res.status(400).json({ message: 'Invalid level specified. Must be main, game, or productType.' });
    }

    // 4. Prevent duplicate field names at the same hierarchy level
    if (targetFields.some(f => f.fieldName.toLowerCase() === fieldName.toLowerCase())) {
      return res.status(400).json({ message: 'A field with this name already exists at this level.' });
    }

    // 5. Push the new field and save the document
    targetFields.push({ 
      fieldName, 
      options: [], 
      allowMultiple: false // Defaults to false as per Category schema
    });
    
    await cat.save();

    // 6. Return the updated category document to refresh the frontend state
    res.status(201).json(cat);
  } catch (error) {
    console.error('Error adding dynamic field:', error);
    res.status(500).json({ message: 'Internal server error while adding dynamic field.', error: error.message });
  }
});

router.put('/field', async (req, res) => {
  try {
    const { 
      mainCategoryId, 
      gameName, 
      productTypeName, 
      level, 
      oldFieldName, 
      newFieldName 
    } = req.body;

    // 1. Find the parent category
    const category = await Category.findById(mainCategoryId);
    if (!category) {
      return res.status(404).json({ message: 'Main category not found' });
    }

    let targetFields = null;

    // 2. Locate the correct fields array based on the level
    if (level === 'main') {
      targetFields = category.fields;
    } 
    else if (level === 'game') {
      const game = category.games.find(g => g.gameName === gameName);
      if (game) targetFields = game.fields;
    } 
    else if (level === 'productType') {
      const game = category.games.find(g => g.gameName === gameName);
      if (game) {
        const type = game.productTypes.find(t => t.typeName === productTypeName);
        if (type) targetFields = type.fields;
      }
    }

    // 3. Ensure we found the correct location
    if (!targetFields) {
      return res.status(404).json({ message: 'Target level not found to update field' });
    }

    // 4. Find the specific field and update its name
    const fieldIndex = targetFields.findIndex(f => f.fieldName === oldFieldName);
    if (fieldIndex === -1) {
      return res.status(404).json({ message: 'Original field name not found' });
    }

    targetFields[fieldIndex].fieldName = newFieldName;

    // 5. Save the updated document
    await category.save();

    res.status(200).json({ 
      message: 'Field updated successfully', 
      category 
    });

  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({ 
      message: 'Internal server error updating field', 
      error: error.message 
    });
  }
});

router.put('/field-option', async (req, res) => {
  const { 
    mainCategoryId, 
    gameName, 
    productTypeName, 
    level, 
    fieldName, 
    oldOptionValue, 
    newOptionValue 
  } = req.body;

  try {
    const cat = await Category.findById(mainCategoryId);
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    let targetFields = [];
    
    // 1. Locate the correct fields array based on the hierarchy level
    if (level === 'main') {
      targetFields = cat.fields;
    } else if (level === 'game') {
      targetFields = cat.games.find(g => g.gameName === gameName)?.fields || [];
    } else if (level === 'productType') {
      const game = cat.games.find(g => g.gameName === gameName);
      targetFields = game?.productTypes.find(p => p.typeName === productTypeName)?.fields || [];
    }

    // 2. Find the specific field containing the option
    const targetField = targetFields.find(f => f.fieldName === fieldName);
    if (!targetField) {
      return res.status(404).json({ message: 'Dynamic field not found' });
    }

    // 3. Find the index of the old option and replace it with the new one
    const optionIndex = targetField.options.indexOf(oldOptionValue);
    if (optionIndex !== -1) {
      targetField.options[optionIndex] = newOptionValue;
      await cat.save();
      res.json(cat);
    } else {
      res.status(404).json({ message: 'Original option value not found' });
    }

  } catch (error) {
    console.error('Error updating field option:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT: Update an existing product type's name
// PUT: Update a product type name
// PUT: Update a product type name
router.put('/product-type', async (req, res) => {
  try {
    // 1. Matched to CategoryManager.jsx payload (mainCategoryId)
    const { mainCategoryId, gameName, oldTypeName, newTypeName } = req.body;

    if (!mainCategoryId || !gameName || !oldTypeName || !newTypeName) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // 2. Find the category using the correct ID variable
    const category = await Category.findById(mainCategoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    // 3. Matched to Category.js schema (g.gameName)
    const game = category.games.find(g => g.gameName === gameName);
    if (!game) {
      return res.status(404).json({ message: "Game not found in this category." });
    }

    // 4. Matched to Category.js schema (pt.typeName)
    const typeIndex = game.productTypes.findIndex(pt => pt.typeName === oldTypeName);
    if (typeIndex === -1) {
      return res.status(404).json({ message: "Product type not found." });
    }

    // 5. Matched to Category.js schema (typeName)
    game.productTypes[typeIndex].typeName = newTypeName;

    // Save the parent document
    await category.save();

    res.status(200).json({ message: "Product type updated successfully", category });

  } catch (error) {
    console.error("Error updating product type:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;