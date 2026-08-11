import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Loader2, Package, X, SlidersHorizontal, ArrowUpRight, 
  Box, Tag, Ruler, Palette, QrCode, DollarSign, Layers 
} from 'lucide-react';
import api from '../utils/api';

// Backend URL resolution
const BACKEND_URL = 'http://localhost:5000';
const spring = { type: 'spring', stiffness: 350, damping: 30 };

// Helper to safely format image paths
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? `${BACKEND_URL}${url}` : `${BACKEND_URL}/${url}`;
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeProduct, setActiveProduct] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data || []);
      } catch (err) {
        console.error('Inventory fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Dynamic Category Extraction
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.mainCategory || 'Uncategorized'));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Unified Search and Filter (flattening single & multi-select values for full search coverage)
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.mainCategory === selectedCategory;
      const q = search.toLowerCase();

      // Extract dynamic attributes and flatten arrays/objects for deep text search
      const attrs = item.attributes || item.customFields || {};
      const attrsValues = Object.values(attrs).flatMap(val => Array.isArray(val) ? val : [val]);
      const attrsStr = attrsValues.join(' ').toLowerCase();

      const matchSearch =
        item.name?.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q) ||
        item.productType?.toLowerCase().includes(q) ||
        item.gameType?.toLowerCase().includes(q) ||
        item.tags?.toLowerCase().includes(q) ||
        attrsStr.includes(q);

      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, search]);

  // Safe field extraction helper
  const getProductDetails = (product) => {
    const stock = product.quantity ?? product.stock ?? product.stockQuantity ?? 0;
    const sellingPrice = product.price ?? product.sellingPrice ?? 0;
    const costPrice = product.costPrice ?? 0;
    const sku = product.sku ?? product.barcode ?? 'N/A';

    const attrs = product.attributes || product.customFields || {};

    const brand = attrs.Brand || product.brand || null;
    const color = attrs.Color || attrs['Color / Finish'] || product.color || null;
    const size = attrs.Size || attrs['Shoe Size (US)'] || product.size || null;

    return { stock, sellingPrice, costPrice, sku, attrs, brand, color, size };
  };

  // Helper to render single or array-based attribute chips cleanly
  const renderAttributeValue = (value) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-neutral-400">—</span>;
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {value.map((val, idx) => (
            <span
              key={idx}
              className="bg-neutral-100 border border-black/5 text-neutral-800 text-xs px-2.5 py-1 rounded-full font-medium"
            >
              {val}
            </span>
          ))}
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return value ? String(value) : '—';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-neutral-900 font-sans p-6 md:p-12 selection:bg-neutral-900 selection:text-white">
      
      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-xs font-semibold tracking-widest uppercase text-neutral-400 block mb-1">
            Catalog & Stock
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">Inventory</h1>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search products, SKUs, options..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white/80 backdrop-blur-xl border border-black/5 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-900"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR CATEGORY FILTER */}
        <aside className="lg:w-60 shrink-0">
          <div className="sticky top-8 bg-white/60 backdrop-blur-xl border border-black/5 p-3 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal size={13} /> Categories
            </div>
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 flex items-center justify-between relative ${
                    active ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-900 hover:bg-black/5'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeCategoryPill"
                      className="absolute inset-0 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-black/5"
                      transition={spring}
                    />
                  )}
                  <span className="relative z-10 truncate">{cat}</span>
                  <span
                    className={`relative z-10 text-xs px-2 py-0.5 rounded-full font-semibold ml-2 ${
                      active ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400'
                    }`}
                  >
                    {cat === 'All' ? products.length : products.filter((p) => p.mainCategory === cat).length}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* MAIN CATALOG GRID */}
        <main className="flex-1">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center text-neutral-400 gap-3">
              <Loader2 className="animate-spin text-neutral-900" size={28} strokeWidth={1.5} />
              <span className="text-sm font-medium">Syncing inventory...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-96 bg-white/50 backdrop-blur-md rounded-3xl border border-black/5 flex flex-col items-center justify-center text-center p-8">
              <Box className="text-neutral-300 mb-3" size={40} strokeWidth={1} />
              <h3 className="text-base font-semibold text-neutral-900">No items found</h3>
              <p className="text-xs text-neutral-400 max-w-xs mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((item) => {
                  const { stock, sellingPrice, sku, brand, color, size } = getProductDetails(item);
                  const isLow = stock > 0 && stock <= 5;
                  const isOut = stock <= 0;
                  const imageSrc = getImageUrl(item.imageUrl);

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.96, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 15 }}
                      transition={spring}
                      key={item._id}
                      onClick={() => setActiveProduct(item)}
                      className="group bg-white/80 hover:bg-white backdrop-blur-xl border border-black/5 hover:border-black/10 rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 ease-out cursor-pointer flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* SKU Badge & Stock Status Indicator */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase bg-neutral-100/80 px-2.5 py-1 rounded-full truncate max-w-[120px]">
                          {sku}
                        </span>

                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-50 border border-black/5 text-[11px] font-semibold">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                          <span className={isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-neutral-700'}>
                            {isOut ? 'Out of Stock' : `${stock} in stock`}
                          </span>
                        </div>
                      </div>

                      {/* Image Canvas */}
                      <div className="w-full h-40 bg-gradient-to-b from-neutral-50 to-neutral-100/60 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-2xl"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ display: imageSrc ? 'none' : 'flex' }}
                        >
                          <Package size={36} strokeWidth={1} className="text-neutral-300 group-hover:text-neutral-400 transition-colors" />
                        </div>
                      </div>

                      {/* Product Title & Attribute Badges */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-neutral-900 text-base tracking-tight leading-snug line-clamp-1">{item.name}</h3>
                          <ArrowUpRight
                            size={18}
                            className="text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0"
                          />
                        </div>

                        {/* Highlight Key Badges */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {brand && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md border border-black/5">
                              <Tag size={10} /> {Array.isArray(brand) ? brand.join(', ') : brand}
                            </span>
                          )}
                          {color && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md border border-black/5">
                              <Palette size={10} /> {Array.isArray(color) ? color.join(', ') : color}
                            </span>
                          )}
                          {size && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md border border-black/5">
                              <Ruler size={10} /> {Array.isArray(size) ? size.join(', ') : size}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                          <span className="text-lg font-bold text-neutral-900">
                            ₹{Number(sellingPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>

      {/* DETAILED INSPECTION MODAL */}
      <AnimatePresence>
        {activeProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveProduct(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={spring}
              className="relative w-full max-w-3xl bg-white/95 backdrop-blur-3xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/40 overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-black/5 pb-5 shrink-0">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                    <span>{activeProduct.mainCategory}</span>
                    {activeProduct.gameType && <span>› {activeProduct.gameType}</span>}
                    {activeProduct.productType && <span>› {activeProduct.productType}</span>}
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">{activeProduct.name}</h2>
                </div>
                <button
                  onClick={() => setActiveProduct(null)}
                  className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto py-6 space-y-8 flex-1 pr-1 custom-scrollbar">
                
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Product Image */}
                  <div className="w-full md:w-1/3 aspect-square bg-neutral-50 rounded-2xl overflow-hidden border border-black/5 shrink-0 flex items-center justify-center">
                    {getImageUrl(activeProduct.imageUrl) ? (
                      <img
                        src={getImageUrl(activeProduct.imageUrl)}
                        alt={activeProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={48} className="text-neutral-200" />
                    )}
                  </div>

                  {/* Stock & Pricing */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 border-b border-black/5 pb-2 mb-3">Identifiers & Pricing</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-50 p-3 rounded-xl border border-black/5">
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">
                            <QrCode size={12} /> SKU / Barcode
                          </span>
                          <span className="text-sm font-bold text-neutral-900 font-mono">
                            {getProductDetails(activeProduct).sku}
                          </span>
                        </div>
                        <div className="bg-neutral-50 p-3 rounded-xl border border-black/5">
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">
                            <Box size={12} /> Stock Quantity
                          </span>
                          <span className={`text-sm font-bold ${getProductDetails(activeProduct).stock <= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {getProductDetails(activeProduct).stock} Units
                          </span>
                        </div>
                        <div className="bg-neutral-50 p-3 rounded-xl border border-black/5">
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">
                            <DollarSign size={12} /> Cost Price
                          </span>
                          <span className="text-sm font-semibold text-neutral-500">
                            ₹{Number(getProductDetails(activeProduct).costPrice).toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-neutral-50 p-3 rounded-xl border border-black/5 ring-1 ring-black/5 shadow-sm">
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">
                            <DollarSign size={12} /> Selling Price
                          </span>
                          <span className="text-sm font-bold text-neutral-900">
                            ₹{Number(getProductDetails(activeProduct).sellingPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Attributes Grid */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 border-b border-black/5 pb-2 mb-4 flex items-center gap-1.5">
                    <Layers size={13} /> Detailed Attributes
                  </h4>
                  
                  {Object.keys(getProductDetails(activeProduct).attrs).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(getProductDetails(activeProduct).attrs).map(([key, val]) => (
                        <div key={key} className="p-3.5 bg-white border border-black/5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                            {key}
                          </span>
                          <div className="text-sm font-semibold text-neutral-900">
                            {renderAttributeValue(val)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 bg-neutral-50 rounded-2xl border border-black/5 text-center text-sm font-medium text-neutral-400">
                      No additional dynamic attributes provided for this item.
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="border-t border-black/5 pt-5 flex items-center justify-between shrink-0">
                <span className="text-[10px] text-neutral-400 font-mono">Product ID: {activeProduct._id}</span>
                <button
                  onClick={() => setActiveProduct(null)}
                  className="px-6 py-2.5 bg-neutral-900 text-white font-medium text-sm rounded-full hover:bg-black transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}