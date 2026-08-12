import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Loader2, Package, X, SlidersHorizontal, ArrowUpRight, 
  Box, Tag, Ruler, Palette, QrCode, DollarSign, Layers, 
  Grid, Plus, Minus, Save, Check, Lock, Trash2
} from 'lucide-react';
import api from '../utils/api';

const BACKEND_URL = 'http://localhost:5000';
const spring = { type: 'spring', stiffness: 350, damping: 30 };

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? `${BACKEND_URL}${url}` : `${BACKEND_URL}/${url}`;
};

// Navigates schema tree: Main Category -> Games -> Product Types
const getCategoryFieldsForProduct = (product, categoriesData) => {
  if (!product || !categoriesData || !categoriesData.length) return [];

  let collectedFields = [];

  const mainCatDoc = categoriesData.find(
    (cat) =>
      cat._id === product.mainCategory ||
      cat.mainCategory === product.mainCategory ||
      cat.name === product.mainCategory
  );

  if (mainCatDoc) {
    if (Array.isArray(mainCatDoc.fields)) {
      collectedFields.push(...mainCatDoc.fields);
    }

    if (product.gameType && Array.isArray(mainCatDoc.games)) {
      const gameObj = mainCatDoc.games.find(
        (g) => g.gameName === product.gameType || g._id === product.gameType
      );

      if (gameObj) {
        if (Array.isArray(gameObj.fields)) {
          collectedFields.push(...gameObj.fields);
        }

        if (product.productType && Array.isArray(gameObj.productTypes)) {
          const typeObj = gameObj.productTypes.find(
            (t) => t.typeName === product.productType || t._id === product.productType
          );

          if (typeObj && Array.isArray(typeObj.fields)) {
            collectedFields.push(...typeObj.fields);
          }
        }
      }
    }
  }

  const fieldMap = new Map();
  collectedFields.forEach((f) => {
    if (f && f.fieldName) {
      fieldMap.set(f.fieldName, f);
    }
  });

  return Array.from(fieldMap.values());
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeProduct, setActiveProduct] = useState(null);

  // Editable modal state
  const [editedStock, setEditedStock] = useState(0);
  const [editedVariants, setEditedVariants] = useState([]);
  const [editedAttributes, setEditedAttributes] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // State for building specific variant combinations manually
  const [variantDraft, setVariantDraft] = useState({ attributes: {}, quantity: 0 });

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories').catch(() => api.get('/category')).catch(() => ({ data: [] })),
        ]);
        setProducts(prodRes.data || []);
        setCategoriesData(catRes.data || []);
      } catch (err) {
        console.error('Inventory fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const getProductDetails = (product) => {
    if (!product) return {};
    
    let stock = product.quantity ?? product.stock ?? product.stockQuantity ?? 0;
    if (product.variants && product.variants.length > 0) {
      const variantTotal = product.variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
      if (variantTotal > 0 || stock === 0) {
        stock = variantTotal;
      }
    }

    const sellingPrice = product.price ?? product.sellingPrice ?? 0;
    const compareAtPrice = product.compareAtPrice ?? 0;
    const costPrice = product.costPrice ?? 0;
    const sku = product.sku ?? product.barcode ?? 'N/A';

    const attrs = product.attributes || product.customFields || {};
    const brand = attrs.Brand || product.brand || null;
    const color = attrs.Color || attrs['Color / Finish'] || product.color || null;
    const size = attrs.Size || attrs['Shoe Size (US)'] || product.size || null;

    return { stock, sellingPrice, compareAtPrice, costPrice, sku, attrs, brand, color, size };
  };

  // Sync state when modal opens
  useEffect(() => {
    if (activeProduct) {
      const { stock, attrs } = getProductDetails(activeProduct);
      
      const initialAttrs = attrs || {};
      const initialVariants = activeProduct.variants
        ? activeProduct.variants.map((v) => ({
            ...v,
            size: v.size || v.attributes?.Size || v.attributes?.size || '',
            color: v.color || v.attributes?.Color || v.attributes?.color || '',
            attributes: { ...(v.attributes || {}) },
            quantity: Number(v.quantity) || 0,
          }))
        : [];

      setEditedAttributes(initialAttrs);
      setEditedVariants(initialVariants);
      setVariantDraft({ attributes: {}, quantity: 0 }); 

      if (initialVariants.length > 0) {
        const total = initialVariants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
        setEditedStock(total);
      } else {
        setEditedStock(stock);
      }

      setSaveSuccess(false);
    }
  }, [activeProduct, categoriesData]);

  const categoriesList = useMemo(() => {
    const set = new Set(products.map((p) => p.mainCategory || 'Uncategorized'));
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.mainCategory === selectedCategory;
      const q = search.toLowerCase();

      const attrs = item.attributes || item.customFields || {};
      // Ensure values are converted to string to avoid `.toLowerCase()` crashing on numbers
      const attrsValues = Object.values(attrs).flatMap((val) => (Array.isArray(val) ? val : [val]));
      const attrsStr = attrsValues.map(String).join(' ').toLowerCase();

      const variantStr = (item.variants || [])
        .flatMap((v) => Object.values(v.attributes || {}))
        .map(String)
        .join(' ')
        .toLowerCase();

      const matchSearch =
        item.name?.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q) ||
        item.productType?.toLowerCase().includes(q) ||
        item.gameType?.toLowerCase().includes(q) ||
        item.tags?.toLowerCase().includes(q) ||
        attrsStr.includes(q) ||
        variantStr.includes(q);

      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, search]);

  const handleDraftAttributeChange = (key, value) => {
    setVariantDraft((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value },
    }));
  };

  const handleAddDraftToVariants = () => {
    let sizeVal = '';
    let colorVal = '';
    Object.entries(variantDraft.attributes).forEach(([k, v]) => {
      const lowerKey = String(k).toLowerCase();
      if (lowerKey.includes('size')) sizeVal = String(v);
      if (lowerKey.includes('color')) colorVal = String(v);
    });

    const newVariant = {
      size: sizeVal,
      color: colorVal,
      attributes: { ...variantDraft.attributes },
      quantity: Number(variantDraft.quantity) || 0,
      sku: '',
    };

    const updatedVariants = [...editedVariants, newVariant];
    setEditedVariants(updatedVariants);

    const newTotal = updatedVariants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
    setEditedStock(newTotal);

    const updatedAttrs = { ...editedAttributes };
    Object.entries(variantDraft.attributes).forEach(([key, val]) => {
      const existing = Array.isArray(updatedAttrs[key]) ? updatedAttrs[key] : updatedAttrs[key] ? [updatedAttrs[key]] : [];
      if (!existing.includes(val)) {
        updatedAttrs[key] = [...existing, val];
      }
    });
    setEditedAttributes(updatedAttrs);
    setVariantDraft({ attributes: {}, quantity: 0 });
  };

  const handleVariantQtyChange = (index, newQty) => {
    const qty = Math.max(0, Number(newQty) || 0);
    const updatedVariants = [...editedVariants];
    updatedVariants[index] = { ...updatedVariants[index], quantity: qty };
    setEditedVariants(updatedVariants);

    const newTotal = updatedVariants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
    setEditedStock(newTotal);
  };

  const handleRemoveVariant = (index) => {
    const updatedVariants = editedVariants.filter((_, i) => i !== index);
    setEditedVariants(updatedVariants);
    const newTotal = updatedVariants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
    setEditedStock(newTotal);
  };

  const handleTopStockChange = (delta) => {
    setEditedStock((prev) => Math.max(0, prev + delta));
  };

  const handleSaveInventory = async () => {
    if (!activeProduct) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { _id, __v, createdAt, updatedAt, ...cleanProduct } = activeProduct;

      const formattedVariants = editedVariants.map((v) => {
        const { _id: variantId, ...cleanVariant } = v;
        const attrs = cleanVariant.attributes || {};

        let sizeVal = cleanVariant.size || '';
        let colorVal = cleanVariant.color || '';

        Object.entries(attrs).forEach(([k, val]) => {
          const lowerKey = String(k).toLowerCase();
          if (lowerKey.includes('size')) sizeVal = String(val);
          if (lowerKey.includes('color')) colorVal = String(val);
        });

        return {
          ...cleanVariant,
          size: sizeVal,
          color: colorVal,
          quantity: Number(cleanVariant.quantity) || 0,
          attributes: attrs,
        };
      });

      const updatedPayload = {
        ...cleanProduct,
        quantity: Number(editedStock),
        stock: Number(editedStock),
        stockQuantity: Number(editedStock),
        attributes: editedAttributes,
        variants: formattedVariants,
      };

      const res = await api.put(`/products/${activeProduct._id}`, updatedPayload);
      const savedProduct = res.data?.product || res.data || { ...activeProduct, ...updatedPayload };

      setProducts((prev) => prev.map((p) => (p._id === activeProduct._id ? savedProduct : p)));
      setActiveProduct(savedProduct);
      setSaveSuccess(true);

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const serverMessage = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Unknown error occurred';
      console.error('Failed to update inventory details:', serverMessage, err?.response?.data);
      alert(`Failed to save changes: ${serverMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-neutral-900 font-sans p-6 md:p-12 selection:bg-neutral-900 selection:text-white">
      
      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-xs font-semibold tracking-widest uppercase text-neutral-400 block mb-1">
            Catalog & Stock Management
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">Inventory</h1>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} strokeWidth={2}/>
          <input
            type="text"
            placeholder="Search products, SKUs, sizes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white/80 backdrop-blur-xl border border-black/5 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-900"
            >
              <X size={14}/>
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR CATEGORY FILTER */}
        <aside className="lg:w-60 shrink-0">
          <div className="sticky top-8 bg-white/60 backdrop-blur-xl border border-black/5 p-3 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal size={13}/> Categories
            </div>
            {categoriesList.map((cat) => {
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

        {/* MAIN PRODUCT CATALOG GRID */}
        <main className="flex-1">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center text-neutral-400 gap-3">
              <Loader2 className="animate-spin text-neutral-900" size={28} strokeWidth={1.5}/>
              <span className="text-sm font-medium">Syncing inventory...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-96 bg-white/50 backdrop-blur-md rounded-3xl border border-black/5 flex flex-col items-center justify-center text-center p-8">
              <Box className="text-neutral-300 mb-3" size={40} strokeWidth={1}/>
              <h3 className="text-base font-semibold text-neutral-900">No items found</h3>
              <p className="text-xs text-neutral-400 max-w-xs mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((item) => {
                  const { stock, sellingPrice, compareAtPrice, sku, brand, color, size } = getProductDetails(item);
                  const isLow = stock > 0 && stock <= 5;
                  const isOut = stock <= 0;
                  const imageSrc = getImageUrl(item.imageUrl);
                  const hasVariants = item.variants && item.variants.length > 0;

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
                          <Package className="text-neutral-300 group-hover:text-neutral-400 transition-colors" size={36} strokeWidth={1}/>
                        </div>

                        {hasVariants && (
                          <span className="absolute bottom-2 right-2 bg-neutral-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Grid size={10}/> {item.variants.length} Variants
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-neutral-900 text-base tracking-tight leading-snug line-clamp-1">{item.name}</h3>
                          <ArrowUpRight className="text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" size={18}/>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {brand && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md border border-black/5">
                              <Tag size={10}/> {Array.isArray(brand) ? brand.join(', ') : brand}
                            </span>
                          )}
                          {color && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md border border-black/5">
                              <Palette size={10}/> {Array.isArray(color) ? color.join(', ') : color}
                            </span>
                          )}
                          {size && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md border border-black/5">
                              <Ruler size={10}/> {Array.isArray(size) ? size.join(', ') : size}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-neutral-900">
                              ₹{Number(sellingPrice).toFixed(2)}
                            </span>
                            {compareAtPrice > sellingPrice && (
                              <span className="text-xs font-semibold text-neutral-400 line-through">
                                ₹{Number(compareAtPrice).toFixed(2)}
                              </span>
                            )}
                          </div>
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

      {/* INSPECTION & EDITING MODAL */}
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
              className="relative w-full max-w-4xl bg-white/95 backdrop-blur-3xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/40 overflow-hidden z-10 max-h-[90vh] flex flex-col"
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
                  className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 transition-colors cursor-pointer"
                >
                  <X size={18}/>
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto py-6 space-y-8 flex-1 pr-1 custom-scrollbar">
                
                {saveSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <Check className="text-emerald-600" size={16}/> Stock quantities and variants saved successfully!
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3 aspect-square bg-neutral-50 rounded-2xl overflow-hidden border border-black/5 shrink-0 flex items-center justify-center">
                    {getImageUrl(activeProduct.imageUrl) ? (
                      <img
                        src={getImageUrl(activeProduct.imageUrl)}
                        alt={activeProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="text-neutral-200" size={48}/>
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 border-b border-black/5 pb-2">
                      Identifiers & Pricing
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-neutral-50 p-3 rounded-xl border border-black/5">
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">
                          <QrCode size={12}/> SKU / Barcode
                        </span>
                        <span className="text-sm font-bold text-neutral-900 font-mono">
                          {getProductDetails(activeProduct).sku}
                        </span>
                      </div>

                      <div className="bg-neutral-50 p-3 rounded-xl border border-black/5">
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">
                          <DollarSign size={12}/> Cost Price
                        </span>
                        <span className="text-sm font-semibold text-neutral-500">
                          ₹{Number(getProductDetails(activeProduct).costPrice).toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-neutral-50 p-3 rounded-xl border border-black/5 ring-1 ring-black/5 shadow-sm col-span-2">
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1">
                          <DollarSign size={12}/> Selling Price
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-neutral-900">
                            ₹{Number(getProductDetails(activeProduct).sellingPrice).toFixed(2)}
                          </span>
                          {getProductDetails(activeProduct).compareAtPrice > getProductDetails(activeProduct).sellingPrice && (
                            <span className="text-xs text-neutral-400 line-through">
                              ₹{Number(getProductDetails(activeProduct).compareAtPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MANUAL VARIANT & QUANTITY BUILDER SECTION */}
                <div className="bg-neutral-50 p-5 rounded-3xl border border-black/5 space-y-5">
                  <div className="flex items-center justify-between border-b border-black/5 pb-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-2">
                      <Box className="text-neutral-900" size={14}/> Variant Stock Builder
                    </h4>
                    <span className="text-xs font-bold bg-white px-3 py-1 rounded-full border border-black/5 shadow-xs">
                      Total Stock: <strong className="text-neutral-900">{editedStock} Units</strong>
                    </span>
                  </div>

                  {(() => {
                    const categoryFields = getCategoryFieldsForProduct(activeProduct, categoriesData);
                    const multiFields = categoryFields.filter(f => f.allowMultiple === true);

                    if (multiFields.length > 0) {
                      return (
                        <div className="space-y-4">
                          
                          {/* VARIANT BUILDER FORM */}
                          <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
                            <p className="text-xs font-semibold text-neutral-800">Add New Stock Combination</p>
                            <div className="flex flex-wrap items-end gap-3">
                              
                              {multiFields.map(field => (
                                <div key={field.fieldName} className="flex-1 min-w-[120px]">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                                    {field.fieldName}
                                  </label>
                                  <select
                                    value={variantDraft.attributes[field.fieldName] || ''}
                                    onChange={(e) => handleDraftAttributeChange(field.fieldName, e.target.value)}
                                    className="w-full text-xs font-semibold text-neutral-900 bg-neutral-50 border border-black/10 rounded-xl py-2 px-3 outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
                                  >
                                    <option value="">Select...</option>
                                    {field.options?.map((opt, i) => (
                                      <option key={i} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                </div>
                              ))}

                              <div className="w-24 shrink-0">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={variantDraft.quantity}
                                  onChange={(e) => setVariantDraft(prev => ({ ...prev, quantity: Math.max(0, e.target.value) }))}
                                  className="w-full text-center text-xs font-bold text-neutral-900 bg-neutral-50 border border-black/10 rounded-xl py-2 px-3 outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={handleAddDraftToVariants}
                                disabled={multiFields.some(f => !variantDraft.attributes[f.fieldName])}
                                className="h-[34px] px-4 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                              >
                                <Plus size={14}/> Add
                              </button>
                            </div>
                          </div>

                          {/* EXISTING VARIANTS LIST */}
                          <div className="space-y-2.5">
                            {editedVariants.length === 0 ? (
                              <div className="text-center py-4 text-xs font-medium text-neutral-400">
                                No variants added yet. Use the builder above to assign stock.
                              </div>
                            ) : (
                              editedVariants.map((v, idx) => {
                                const attrEntries = Object.entries(v.attributes || {});
                                const labelStr = attrEntries.map(([k, val]) => `${k}: ${val}`).join(' | ');

                                return (
                                  <div key={idx} className="bg-white p-3.5 rounded-2xl border border-black/5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                        {idx + 1}
                                      </span>
                                      <span className="text-xs font-bold text-neutral-900 block">
                                        {labelStr || `Variant #${idx + 1}`}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-1">
                                        Stock:
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleVariantQtyChange(idx, (Number(v.quantity) || 0) - 1)}
                                        className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                                      >
                                        <Minus size={12}/>
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        value={v.quantity ?? 0}
                                        onChange={(e) => handleVariantQtyChange(idx, e.target.value)}
                                        className="w-16 text-center py-1 bg-neutral-50 border border-black/10 rounded-lg text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleVariantQtyChange(idx, (Number(v.quantity) || 0) + 1)}
                                        className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                                      >
                                        <Plus size={12}/>
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVariant(idx)}
                                        className="ml-2 w-7 h-7 rounded-lg text-rose-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                                      >
                                        <Trash2 size={14}/>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-black/5">
                          <div>
                            <span className="text-xs font-bold text-neutral-800 block">Single Item Total Quantity</span>
                            <span className="text-[11px] text-neutral-400">Directly modify total stock quantity</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleTopStockChange(-1)}
                                className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold transition-colors cursor-pointer"
                              >
                                <Minus size={14}/>
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={editedStock}
                                onChange={(e) => setEditedStock(Math.max(0, Number(e.target.value) || 0))}
                                className="w-20 text-center py-2 bg-neutral-50 border border-black/10 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-black/10"
                              />
                              <button
                                type="button"
                                onClick={() => handleTopStockChange(1)}
                                className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold transition-colors cursor-pointer"
                              >
                                <Plus size={14}/>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* FIXED ATTRIBUTES SECTION (Non-variants) */}
                {(() => {
                  const categoryFields = getCategoryFieldsForProduct(activeProduct, categoriesData);
                  const fixedFields = categoryFields.filter(f => f.allowMultiple !== true);
                  
                  if (fixedFields.length > 0) {
                    return (
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 border-b border-black/5 pb-2 mb-4 flex items-center gap-1.5">
                          <Layers size={13}/> Fixed Attributes (Non-Variant Data)
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {fixedFields.map((field) => {
                            const key = field.fieldName;
                            const rawVal = editedAttributes[key] ?? activeProduct[key] ?? activeProduct.attributes?.[key];

                            return (
                              <div key={key} className="p-3.5 bg-white border border-black/5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                    {key}
                                  </label>
                                  <span className="text-[9px] font-semibold text-neutral-400 flex items-center gap-1">
                                    <Lock size={9}/> Fixed Attribute
                                  </span>
                                </div>
                                <div className="w-full text-xs font-semibold text-neutral-800 bg-neutral-50 border border-black/5 rounded-xl py-2.5 px-3 min-h-[38px] flex items-center">
                                  {Array.isArray(rawVal) ? rawVal.join(', ') : rawVal || 'N/A'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

              </div>

              {/* Modal Footer */}
              <div className="border-t border-black/5 pt-5 flex items-center justify-between shrink-0 gap-3">
                <span className="text-[10px] text-neutral-400 font-mono truncate hidden sm:inline">
                  ID: {activeProduct._id}
                </span>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setActiveProduct(null)}
                    className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-sm rounded-full transition-all cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    onClick={handleSaveInventory}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-neutral-900 hover:bg-black text-white font-semibold text-sm rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={16}/>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16}/>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}