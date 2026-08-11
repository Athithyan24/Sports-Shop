const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

exports.processCheckout = async (req, res) => {
  const { items, paymentMethod, taxRate = 0.08 } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let subtotal = 0;
    let totalDiscount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product || product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product ? product.name : 'Unknown Item'}`);
      }

      // Deduct inventory
      product.quantity -= item.quantity;
      await product.save({ session });

      const itemDiscount = (product.price * (product.discount / 100)) * item.quantity;
      const itemSubtotal = (product.price * item.quantity) - itemDiscount;

      subtotal += (product.price * item.quantity);
      totalDiscount += itemDiscount;

      processedItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemSubtotal
      });
    }

    const tax = (subtotal - totalDiscount) * taxRate;
    const finalTotal = subtotal - totalDiscount + tax;

    const invoice = new Invoice({
      items: processedItems,
      subtotal,
      tax,
      totalDiscount,
      finalTotal,
      paymentMethod
    });

    await invoice.save({ session });
    await session.commitTransaction();
    
    res.status(201).json({ success: true, invoice });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};