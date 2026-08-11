import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, 
  Loader2, Printer, CheckCircle2, User, Percent, ShoppingBag, X, Package 
} from 'lucide-react';
import api from '../utils/api';

const BACKEND_URL = 'http://localhost:5000';
const spring = { type: 'spring', stiffness: 350, damping: 30 };

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? `${BACKEND_URL}${url}` : `${BACKEND_URL}/${url}`;
};

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  
  // Checkout & Customer State
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Completed Transaction State for Receipt Modal
  const [completedOrder, setCompletedOrder] = useState(null);

  const searchInputRef = useRef(null);

  // Fetch initial catalog
  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setFetchingProducts(true);
      const res = await api.get('/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load POS catalog:', err);
    } finally {
      setFetchingProducts(false);
    }
  };

  // Extract Categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.mainCategory || 'Uncategorized'));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filter products by category or search term
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.mainCategory === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        p.name?.toLowerCase().includes(q) || 
        p.sku?.toLowerCase().includes(q) || 
        p.brand?.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add Product to Cart
  const addToCart = (product) => {
    const availableStock = product.quantity ?? product.stock ?? 0;
    const existingIndex = cart.findIndex((item) => item._id === product._id);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].qty;
      if (currentQty + 1 > availableStock) {
        alert(`Stock limit reached! Only ${availableStock} units available.`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].qty += 1;
      setCart(updatedCart);
    } else {
      if (availableStock < 1) {
        alert('Item is currently out of stock!');
        return;
      }
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  // Handle Barcode Scan / SKU Enter key
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Search exact SKU match
    const exactMatch = products.find(
      (p) => p.sku?.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (exactMatch) {
      addToCart(exactMatch);
      setSearchQuery('');
    } else if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0]);
      setSearchQuery('');
    }
  };

  // Cart Quantity Controls
  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item._id === id) {
            const availableStock = item.quantity ?? item.stock ?? 999;
            const newQty = item.qty + delta;

            if (newQty > availableStock) {
              alert(`Maximum stock reached (${availableStock})`);
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + ((item.price ?? item.sellingPrice ?? 0) * item.qty), 0);
  const discountAmount = (subtotal * (Number(discountPercent) || 0)) / 100;
  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * 0.08; // 8% Tax
  const grandTotal = taxableAmount + tax;

  // Checkout Handler
  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty!');
    setLoading(true);

    const orderPayload = {
      cart: cart.map((item) => ({
        _id: item._id,
        name: item.name,
        sku: item.sku,
        price: item.price ?? item.sellingPrice,
        qty: item.qty
      })),
      customer: { name: customerName, phone: customerPhone },
      subtotal,
      discount: discountAmount,
      tax,
      total: grandTotal,
      paymentMethod
    };

    try {
      const res = await api.post('/billing/checkout', orderPayload);
      
      // Store returned order for print preview receipt
      setCompletedOrder(res.data.order || { ...orderPayload, invoiceId: `INV-${Date.now().toString().slice(-6)}`, createdAt: new Date() });
      
      // Reset POS state
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountPercent(0);
      fetchCatalog(); // Refresh backend inventory counts
    } catch (error) {
      alert(error.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-neutral-900 font-sans p-4 md:p-8 selection:bg-neutral-900 selection:text-white flex flex-col gap-6">
      
      {/* HEADER BAR */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        <div>
          <span className="text-xs font-semibold tracking-widest uppercase text-neutral-400 block mb-0.5">
            Point of Sale
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Checkout & Billing</h1>
        </div>

        {/* Barcode Search Box */}
        <form onSubmit={handleBarcodeSubmit} className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Scan Barcode / Enter SKU or Name..."
            className="w-full pl-11 pr-10 py-3 bg-white/80 backdrop-blur-xl border border-black/5 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-900"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </header>

      {/* MAIN POS VIEWPORT */}
      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6 flex-1 items-start">
        
        {/* LEFT: PRODUCT CATALOG GRID */}
        <div className="flex-1 w-full space-y-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-300 whitespace-nowrap relative ${
                    active ? 'text-neutral-900 bg-white shadow-sm border border-black/5' : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Catalog Grid */}
          {fetchingProducts ? (
            <div className="h-96 bg-white/40 rounded-3xl border border-black/5 flex items-center justify-center text-neutral-400 gap-2">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-sm">Loading Catalog...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-96 bg-white/40 rounded-3xl border border-black/5 flex flex-col items-center justify-center text-neutral-400 p-6 text-center">
              <Package size={40} className="mb-2 text-neutral-300" />
              <p className="text-sm font-semibold text-neutral-800">No products found</p>
              <p className="text-xs text-neutral-400">Try searching for another SKU or name</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const stock = p.quantity ?? p.stock ?? 0;
                const price = p.price ?? p.sellingPrice ?? 0;
                const imageSrc = getImageUrl(p.imageUrl);

                return (
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    key={p._id}
                    onClick={() => addToCart(p)}
                    className={`bg-white/80 hover:bg-white border border-black/5 rounded-2xl p-3 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden group ${
                      stock <= 0 ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <div className="w-full h-24 bg-neutral-100 rounded-xl mb-2.5 overflow-hidden flex items-center justify-center">
                      {imageSrc ? (
                        <img src={imageSrc} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <Package size={24} className="text-neutral-300" />
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">{p.sku}</span>
                      <h4 className="font-semibold text-neutral-900 text-xs line-clamp-1">{p.name}</h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between">
                      <span className="text-sm font-bold text-neutral-900">₹{price.toFixed(2)}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stock > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {stock} left
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: CART & BILLING PANEL */}
        <div className="w-full lg:w-[420px] bg-white/80 backdrop-blur-2xl rounded-3xl border border-black/5 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col gap-5 sticky top-8">
          
          <div className="flex items-center justify-between border-b border-black/5 pb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-neutral-900" />
              <h2 className="text-lg font-bold text-neutral-900">Current Order</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 space-y-1">
                <ShoppingBag size={32} className="mx-auto text-neutral-300" strokeWidth={1.5} />
                <p className="text-xs font-medium">Cart is empty</p>
                <p className="text-[11px] text-neutral-400">Scan items or click from catalog to start billing</p>
              </div>
            ) : (
              <AnimatePresence>
                {cart.map((item) => {
                  const price = item.price ?? item.sellingPrice ?? 0;
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={item._id}
                      className="p-3 bg-white rounded-2xl border border-black/5 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex-1 pr-2">
                        <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{item.name}</h4>
                        <span className="text-[10px] text-neutral-400 font-mono">{item.sku} • ₹{price.toFixed(2)}</span>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-black/10 rounded-xl bg-neutral-50 px-1 py-0.5">
                          <button
                            onClick={() => updateQuantity(item._id, -1)}
                            className="p-1 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-lg transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-neutral-900">{item.qty}</span>
                          <button
                            onClick={() => updateQuantity(item._id, 1)}
                            className="p-1 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-lg transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Customer Details & Discount Section */}
          <div className="space-y-2 pt-2 border-t border-black/5">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-black/5 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div className="relative">
                <Percent size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="number"
                  placeholder="Discount %"
                  value={discountPercent || ''}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-black/5 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-black/5"
                />
              </div>
            </div>
          </div>

          {/* Price Summary Breakdown */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-black/5 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span className="font-semibold text-neutral-900">₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount ({discountPercent}%)</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-500">
              <span>GST / Tax (8%)</span>
              <span className="font-semibold text-neutral-900">₹{tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-black/5 pt-2 flex justify-between items-center text-sm font-bold text-neutral-900">
              <span>Grand Total</span>
              <span className="text-lg">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('Cash')}
              className={`py-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                paymentMethod === 'Cash'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white border-black/5 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Banknote size={16} />
              <span className="text-[10px] font-bold">Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('Card')}
              className={`py-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                paymentMethod === 'Card'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white border-black/5 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <CreditCard size={16} />
              <span className="text-[10px] font-bold">Card</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('UPI')}
              className={`py-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                paymentMethod === 'UPI'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white border-black/5 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <QrCode size={16} />
              <span className="text-[10px] font-bold">UPI / QR</span>
            </button>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full py-4 bg-neutral-900 text-white font-bold text-sm rounded-2xl hover:bg-black transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Complete Transaction'}
          </button>
        </div>
      </div>

      {/* RECEIPT / INVOICE PRINT MODAL */}
      <AnimatePresence>
        {completedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCompletedOrder(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={spring}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 space-y-6"
            >
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-xl font-bold text-neutral-900">Payment Successful</h3>
                <p className="text-xs text-neutral-400 font-mono">Order ID: {completedOrder.invoiceId || completedOrder._id}</p>
              </div>

              {/* Printable Invoice Slip Container */}
              <div id="printable-receipt" className="bg-neutral-50 p-4 rounded-2xl border border-black/5 space-y-4 font-mono text-xs">
                <div className="text-center border-b border-black/5 pb-2">
                  <h4 className="font-bold text-sm">SPORTS STORE</h4>
                  <p className="text-[10px] text-neutral-400">{new Date(completedOrder.createdAt || Date.now()).toLocaleString()}</p>
                </div>

                {completedOrder.customer?.name && (
                  <div className="text-[11px] border-b border-black/5 pb-2">
                    <p>Customer: {completedOrder.customer.name}</p>
                    <p>Phone: {completedOrder.customer.phone || 'N/A'}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  {completedOrder.cart?.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate max-w-[180px]">{item.qty}x {item.name}</span>
                      <span>₹{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-black/10 pt-2 space-y-1 text-right">
                  <p>Subtotal: ₹{completedOrder.subtotal?.toFixed(2)}</p>
                  <p>Tax (8%): ₹{completedOrder.tax?.toFixed(2)}</p>
                  <p className="font-bold text-sm text-black">Total Paid: ₹{completedOrder.total?.toFixed(2)}</p>
                  <p className="text-[10px] text-neutral-400 uppercase">Paid via {completedOrder.paymentMethod}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-neutral-100 text-neutral-900 font-bold text-xs rounded-2xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={16} /> Print Receipt
                </button>
                <button
                  onClick={() => setCompletedOrder(null)}
                  className="flex-1 py-3 bg-neutral-900 text-white font-bold text-xs rounded-2xl hover:bg-black transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}