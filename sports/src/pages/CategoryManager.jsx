import { useState, useEffect } from 'react';
import { 
  Tag, Layers, X, Loader2, Trash2, Plus, ChevronRight, Home, Shirt, 
  Footprints, Dumbbell, Trophy, Sparkles, Settings2, BriefcaseMedical, 
  ToolCase, Backpack, Users, Shield, Box, Pencil 
} from 'lucide-react';

import { 
  MdSportsBasketball, MdSportsSoccer, MdSportsCricket, MdSportsTennis, 
  MdSportsVolleyball, MdSportsBaseball, MdSportsMartialArts, MdPool, 
  MdDirectionsBike, MdDirectionsRun, MdSportsGolf, MdSportsFootball, 
  MdSportsRugby, MdSportsHockey, MdSportsGymnastics, MdSportsEsports, 
  MdSnowboarding, MdSurfing, MdSkateboarding, MdRowing 
} from 'react-icons/md';
import { FaTableTennis, FaBowlingBall, FaChess } from 'react-icons/fa';
import { PiPants } from 'react-icons/pi';
import { GiBoxingGlove, GiArcheryTarget, GiShuttlecock, GiEightBall, GiHelmet, GiSocks } from 'react-icons/gi';

import api from '../utils/api';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drill-down Navigation State
  const [selectedMainId, setSelectedMainId] = useState('');
  const [selectedGameName, setSelectedGameName] = useState('');
  const [selectedTypeName, setSelectedTypeName] = useState('');

  // Modals / Inline Creation Toggles
  const [showAddMain, setShowAddMain] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);
  const [showAddType, setShowAddType] = useState(false);

  // Creation Inputs
  const [newMainCategory, setNewMainCategory] = useState('');
  const [fields1, setFields1] = useState([]);
  const [input1, setInput1] = useState('');

  const [newGameName, setNewGameName] = useState('');
  const [fields2, setFields2] = useState([]);
  const [input2, setInput2] = useState('');

  const [newProductType, setNewProductType] = useState('');
  const [fields3, setFields3] = useState([]);
  const [input3, setInput3] = useState('');

  // Field option inputs state
  const [optionInputs, setOptionInputs] = useState({});
  
  // New Field creation state
  const [newFieldState, setNewFieldState] = useState({ isAdding: false, value: '' });

  // Universal Edit State
  const [editState, setEditState] = useState({
    isOpen: false,
    entityType: '', 
    data: null,
    newValue: ''
  });

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const activeMain = categories.find(c => c._id === selectedMainId);
  const activeGame = activeMain?.games?.find(g => g.gameName === selectedGameName);
  const activeType = activeGame?.productTypes?.find(p => p.typeName === selectedTypeName);

  const handleAddTag = (val, list, setList, setInput) => {
    if (val && !list.includes(val)) {
      setList([...list, val]);
      setInput('');
    }
  };

  // --- CREATION HANDLERS ---
  const handleAddMainCategory = async (e) => {
    e.preventDefault();
    if (!newMainCategory) return;
    try {
      await api.post('/categories/main', { mainCategory: newMainCategory, customFields: fields1 });
      setNewMainCategory(''); setFields1([]); setShowAddMain(false);
      fetchCategories();
    } catch (err) { alert(err.response?.data?.message || 'Error creating category'); }
  };

  const handleAddGame = async (e) => {
    e.preventDefault();
    if (!selectedMainId || !newGameName) return;
    try {
      await api.post('/categories/game', { mainCategoryId: selectedMainId, gameName: newGameName, customFields: fields2 });
      setNewGameName(''); setFields2([]); setShowAddGame(false);
      fetchCategories();
    } catch (err) { alert('Error adding sport'); }
  };

  const handleAddProductType = async (e) => {
    e.preventDefault();
    if (!selectedMainId || !selectedGameName || !newProductType) return;
    try {
      await api.post('/categories/product-type', { mainCategoryId: selectedMainId, gameName: selectedGameName, productType: newProductType, customFields: fields3 });
      setNewProductType(''); setFields3([]); setShowAddType(false);
      fetchCategories();
    } catch (err) { alert('Error adding product type'); }
  };

  const handleAddOption = async (level, fieldName) => {
    const key = `${level}_${fieldName}`;
    const optionValue = optionInputs[key];
    if (!optionValue || !selectedMainId) return;
    try {
      await api.post('/categories/field-option', { mainCategoryId: selectedMainId, gameName: selectedGameName, productTypeName: selectedTypeName, level, fieldName, optionValue });
      setOptionInputs({ ...optionInputs, [key]: '' });
      fetchCategories();
    } catch (err) { alert('Error adding option choice'); }
  };

  const handleAddDynamicField = async (level, fieldName) => {
    if (!fieldName.trim() || !selectedMainId) return;
    try {
      await api.post('/categories/field', { 
        mainCategoryId: selectedMainId, 
        gameName: selectedGameName, 
        productTypeName: selectedTypeName, 
        level, 
        fieldName 
      });
      setNewFieldState({ isAdding: false, value: '' });
      fetchCategories();
    } catch (err) { 
      alert(err.response?.data?.message || 'Error adding new field'); 
    }
  };

  // --- MULTI-SELECT TOGGLE HANDLER ---
  const handleToggleMultiSelect = async (level, fieldName, allowMultiple) => {
    if (!selectedMainId) return;
    try {
      // Calling a dedicated endpoint to update the `allowMultiple` flag
      await api.patch('/categories/field-multi-select', { 
        mainCategoryId: selectedMainId, 
        gameName: selectedGameName, 
        productTypeName: selectedTypeName, 
        level, 
        fieldName,
        allowMultiple 
      });
      fetchCategories();
    } catch (err) { 
      alert(err.response?.data?.message || 'Error updating multi-select preference'); 
    }
  };

  // --- EDIT / UPDATE HANDLER ---
  const handleSaveEdit = async () => {
    const { entityType, data, newValue } = editState;
    if (!newValue.trim() || newValue === data.currentValue) {
      setEditState({ isOpen: false, entityType: '', data: null, newValue: '' });
      return;
    }

    try {
      if (entityType === 'main') {
        await api.put(`/categories/main/${data.id}`, { mainCategory: newValue });
        if (selectedMainId === data.id && activeMain) activeMain.mainCategory = newValue; 
      } 
      else if (entityType === 'game') {
        await api.put('/categories/game', { mainCategoryId: selectedMainId, oldGameName: data.currentValue, newGameName: newValue });
        if (selectedGameName === data.currentValue) setSelectedGameName(newValue);
      } 
      else if (entityType === 'type') {
        await api.put('/categories/product-type', { mainCategoryId: selectedMainId, gameName: selectedGameName, oldTypeName: data.currentValue, newTypeName: newValue });
        if (selectedTypeName === data.currentValue) setSelectedTypeName(newValue);
      } 
      else if (entityType === 'field') {
        await api.put('/categories/field', { 
          mainCategoryId: selectedMainId, 
          gameName: selectedGameName, 
          productTypeName: selectedTypeName, 
          level: data.level, 
          oldFieldName: data.currentValue, 
          newFieldName: newValue 
        });
      }
      else if (entityType === 'option') {
        await api.put('/categories/field-option', { 
          mainCategoryId: selectedMainId, 
          gameName: selectedGameName, 
          productTypeName: selectedTypeName, 
          level: data.level, 
          fieldName: data.fieldName, 
          oldOptionValue: data.currentValue, 
          newOptionValue: newValue 
        });
      }

      fetchCategories();
      setEditState({ isOpen: false, entityType: '', data: null, newValue: '' });
    } catch (err) {
      alert(err.response?.data?.message || `Error updating ${entityType}`);
    }
  };

  // --- DELETION HANDLERS ---
  const handleDeleteMainCategory = async (id, name) => {
    if (!confirm(`Delete category "${name}" and all contents?`)) return;
    try {
      await api.delete(`/categories/main/${id}`);
      setSelectedMainId(''); setSelectedGameName(''); setSelectedTypeName('');
      fetchCategories();
    } catch (err) { alert('Error deleting category'); }
  };

  const handleDeleteGame = async (gameName) => {
    if (!confirm(`Delete sport/game "${gameName}"?`)) return;
    try {
      await api.delete('/categories/game', { data: { mainCategoryId: selectedMainId, gameName } });
      setSelectedGameName(''); setSelectedTypeName('');
      fetchCategories();
    } catch (err) { alert('Error deleting game'); }
  };

  const handleDeleteProductType = async (typeName) => {
    if (!confirm(`Delete product type "${typeName}"?`)) return;
    try {
      await api.delete('/categories/product-type', { data: { mainCategoryId: selectedMainId, gameName: selectedGameName, productTypeName: typeName } });
      setSelectedTypeName('');
      fetchCategories();
    } catch (err) { alert('Error deleting product type'); }
  };

  const handleDeleteOption = async (level, fieldName, optionValue) => {
    try {
      await api.delete('/categories/field-option', { data: { mainCategoryId: selectedMainId, gameName: selectedGameName, productTypeName: selectedTypeName, level, fieldName, optionValue } });
      fetchCategories();
    } catch (err) { alert('Error removing option'); }
  };

  const handleDeleteField = async (level, fieldName) => {
    if (!confirm(`Delete dynamic field "${fieldName}"?`)) return;
    try {
      await api.delete('/categories/field', { data: { mainCategoryId: selectedMainId, gameName: selectedGameName, productTypeName: selectedTypeName, level, fieldName } });
      fetchCategories();
    } catch (err) { alert('Error deleting field'); }
  };

  // --- MASTER ICON RENDERERS ---
  const getCategoryIcon = (name = '', defaultIcon = <Tag size={24} strokeWidth={1.2} />) => {
    const lower = name.toLowerCase();
    if (lower.includes('apparel') || lower.includes('wear') || lower.includes('cloth')) return <Shirt size={24} strokeWidth={1.2} />;
    if (lower.includes('shoe') || lower.includes('footwear')) return <Footprints size={24} strokeWidth={1.2} />;
    if (lower.includes('fitness') || lower.includes('gym')) return <Dumbbell size={24} strokeWidth={1.2} />;
    if (lower.includes('trophy') || lower.includes('award')) return <Trophy size={24} strokeWidth={1.2} />;
    if (lower.includes('medical') || lower.includes('kit')) return <BriefcaseMedical size={24} strokeWidth={1.2} />;
    if (lower.includes('tool') || lower.includes('equipment')) return <ToolCase size={24} strokeWidth={1.2} />;
    return defaultIcon;
  };

  const getGameIcon = (gameName = '', size = 24) => {
    const lower = gameName.toLowerCase();
    if (lower.includes('basketball') || lower.includes('netball')) return <MdSportsBasketball size={size} />;
    if (lower.includes('football') || lower.includes('soccer') || lower.includes('futsal')) return <MdSportsSoccer size={size} />;
    if (lower.includes('american football') || lower.includes('nfl')) return <MdSportsFootball size={size} />;
    if (lower.includes('rugby')) return <MdSportsRugby size={size} />;
    if (lower.includes('cricket')) return <MdSportsCricket size={size} />;
    if (lower.includes('baseball') || lower.includes('softball')) return <MdSportsBaseball size={size} />;
    if (lower.includes('volleyball')) return <MdSportsVolleyball size={size} />;
    if (lower.includes('golf')) return <MdSportsGolf size={size} />;
    if (lower.includes('tennis') || lower.includes('squash')) return <MdSportsTennis size={size} />;
    if (lower.includes('badminton')) return <GiShuttlecock size={size} />;
    if (lower.includes('table tennis') || lower.includes('ping pong')) return <FaTableTennis size={size} />;
    if (lower.includes('hockey')) return <MdSportsHockey size={size} />;
    if (lower.includes('bowling')) return <FaBowlingBall size={size} />;
    if (lower.includes('archery') || lower.includes('darts')) return <GiArcheryTarget size={size} />;
    if (lower.includes('billiards') || lower.includes('snooker') || lower.includes('pool game')) return <GiEightBall size={size} />;
    if (lower.includes('martial') || lower.includes('karate') || lower.includes('judo') || lower.includes('mma') || lower.includes('wrestling')) return <MdSportsMartialArts size={size} />;
    if (lower.includes('boxing')) return <GiBoxingGlove size={size} />;
    if (lower.includes('run') || lower.includes('track') || lower.includes('marathon') || lower.includes('athletics')) return <MdDirectionsRun size={size} />;
    if (lower.includes('gymnastics') || lower.includes('dance')) return <MdSportsGymnastics size={size} />;
    if (lower.includes('cycle') || lower.includes('bike') || lower.includes('bmx')) return <MdDirectionsBike size={size} />;
    if (lower.includes('gym') || lower.includes('fitness') || lower.includes('weight')) return <Dumbbell size={size} strokeWidth={1.2} />;
    if (lower.includes('swim') || lower.includes('water polo') || lower.includes('diving') || lower.includes('pool')) return <MdPool size={size} />;
    if (lower.includes('surf')) return <MdSurfing size={size} />;
    if (lower.includes('rowing') || lower.includes('kayak') || lower.includes('canoe')) return <MdRowing size={size} />;
    if (lower.includes('snowboard') || lower.includes('ski') || lower.includes('winter')) return <MdSnowboarding size={size} />;
    if (lower.includes('skate')) return <MdSkateboarding size={size} />;
    if (lower.includes('esport') || lower.includes('gaming') || lower.includes('video game')) return <MdSportsEsports size={size} />;
    if (lower.includes('chess') || lower.includes('board game') || lower.includes('carrom')) return <FaChess size={size} />;
    return <Trophy size={size} strokeWidth={1.2} />;
  };

  const getTypeIcon = (typeName = '', size = 24, strokeWidth = 1.2) => {
    const lower = typeName.toLowerCase();
    if (lower.includes('gender') || lower.includes('men') || lower.includes('women') || lower.includes('unisex') || lower.includes('kid') || lower.includes('boy') || lower.includes('girl')) return <Users size={size} strokeWidth={strokeWidth} />;
    if (lower.includes('apparel') || lower.includes('wear') || lower.includes('cloth') || lower.includes('jersey') || lower.includes('shirt') || lower.includes('t-shirt') || lower.includes('uniform') || lower.includes('jacket') || lower.includes('hoodie')) return <Shirt size={size} strokeWidth={strokeWidth} />;
    if (lower.includes('pant') || lower.includes('trouser') || lower.includes('short') || lower.includes('track') || lower.includes('bottom') || lower.includes('legging')) return <PiPants size={size} />;
    if (lower.includes('shoe') || lower.includes('footwear') || lower.includes('boot') || lower.includes('spike') || lower.includes('sneaker') || lower.includes('cleat')) return <Footprints size={size} strokeWidth={strokeWidth} />;
    if (lower.includes('sock')) return <GiSocks size={size} />;
    if (lower.includes('cap') || lower.includes('hat') || lower.includes('visor') || lower.includes('beanie')) return <GiHelmet size={size} />;
    if (lower.includes('pad') || lower.includes('guard') || lower.includes('protect') || lower.includes('shield') || lower.includes('armor')) return <Shield size={size} strokeWidth={strokeWidth} />;
    if (lower.includes('helmet') || lower.includes('headguard')) return <GiHelmet size={size} />;
    if (lower.includes('glove') || lower.includes('gauntlet')) return <GiBoxingGlove size={size} />;
    if (lower.includes('bag') || lower.includes('backpack') || lower.includes('pack') || lower.includes('duffel') || lower.includes('sack')) return <Backpack size={size} strokeWidth={strokeWidth} />;
    if (lower.includes('kit') || lower.includes('set') || lower.includes('bundle') || lower.includes('equipment')) return <Box size={size} strokeWidth={strokeWidth} />;
    return <Layers size={size} strokeWidth={strokeWidth} />;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-neutral-400" size={32} strokeWidth={1.5} /></div>;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-10 min-h-screen font-sans selection:bg-neutral-200">
      
      {/* LUXURY BREADCRUMB NAVIGATION */}
      <div className="sticky top-6 z-20 flex items-center flex-wrap gap-1.5 mb-12 bg-white/70 backdrop-blur-xl p-2.5 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/40 text-sm font-medium transition-all duration-500 ease-out">
        <button 
          onClick={() => { setSelectedMainId(''); setSelectedGameName(''); setSelectedTypeName(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ease-out ${!selectedMainId ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}`}
        >
          <Home size={16} strokeWidth={1.5} /> Directory
        </button>
        
        {selectedMainId && activeMain && (
          <>
            <ChevronRight size={16} className="text-neutral-300" strokeWidth={1.5} />
            <button 
              onClick={() => { setSelectedGameName(''); setSelectedTypeName(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ease-out ${!selectedGameName ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}`}
            >
              {getCategoryIcon(activeMain.mainCategory, <Layers size={16} strokeWidth={1.5} />)} <span className="ml-1">{activeMain.mainCategory}</span>
            </button>
          </>
        )}

        {selectedGameName && activeGame && (
          <>
            <ChevronRight size={16} className="text-neutral-300" strokeWidth={1.5} />
            <button 
              onClick={() => { setSelectedTypeName(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ease-out ${!selectedTypeName ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}`}
            >
              {getGameIcon(activeGame.gameName, 16)} <span className="ml-1">{activeGame.gameName}</span>
            </button>
          </>
        )}

        {selectedTypeName && activeType && (
          <>
            <ChevronRight size={16} className="text-neutral-300" strokeWidth={1.5} />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white shadow-md transition-all duration-300 ease-out cursor-default`}>
              {getTypeIcon(activeType.typeName, 16, 1.5)} <span className="ml-1">{activeType.typeName}</span>
            </div>
          </>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        
        {/* LEVEL 1: MAIN CATEGORIES */}
        {!selectedMainId && (
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Master Categories</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  onClick={() => setSelectedMainId(cat._id)}
                  className="group flex flex-col justify-between p-6 bg-white rounded-[2rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 ease-out cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neutral-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="flex items-center justify-between mb-8">
                    <div className="p-4 bg-neutral-50 text-neutral-600 rounded-2xl group-hover:bg-neutral-900 group-hover:text-white transition-all duration-500 ease-out shadow-sm">
                      {getCategoryIcon(cat.mainCategory)}
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditState({ isOpen: true, entityType: 'main', data: { id: cat._id, currentValue: cat.mainCategory }, newValue: cat.mainCategory }); }}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-neutral-400 hover:text-blue-500 hover:bg-blue-50 shadow-sm"
                        title="Edit Category"
                      >
                        <Pencil size={18} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteMainCategory(cat._id, cat.mainCategory); }}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-neutral-400 hover:text-red-500 hover:bg-red-50 shadow-sm"
                        title="Delete Category"
                      >
                        <Trash2 size={18} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-1 block">Category</span>
                    <h3 className="font-semibold text-neutral-900 text-xl tracking-tight">{cat.mainCategory}</h3>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setShowAddMain(!showAddMain)}
                className="group flex flex-col items-center justify-center p-6 bg-transparent rounded-[2rem] border-[1.5px] border-dashed border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all duration-500 ease-out min-h-[200px]"
              >
                <div className="w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-neutral-400 group-hover:text-neutral-900 group-hover:scale-110 transition-all duration-500 ease-out mb-4">
                  <Plus size={24} strokeWidth={1.5} />
                </div>
                <span className="font-medium text-neutral-500 group-hover:text-neutral-900 transition-colors duration-300">Add New Category</span>
              </button>
            </div>

            {/* ADD CATEGORY INLINE FORM */}
            <div className={`overflow-hidden transition-all duration-500 ease-out ${showAddMain ? 'max-h-[800px] opacity-100 mt-8' : 'max-h-0 opacity-0'}`}>
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-3xl border border-neutral-100">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3 text-neutral-900">
                    <div className="p-2.5 bg-neutral-100 rounded-xl"><Settings2 size={20} strokeWidth={1.5} /></div>
                    <h3 className="text-xl font-semibold tracking-tight">Configure New Category</h3>
                  </div>
                  <button onClick={() => setShowAddMain(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"><X size={20} strokeWidth={1.5}/></button>
                </div>
                
                <form onSubmit={handleAddMainCategory} className="space-y-8">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1">Category Name</label>
                    <input required type="text" value={newMainCategory} onChange={(e) => setNewMainCategory(e.target.value)} placeholder="e.g. Apparel" className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-4 text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300 ease-out" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1">Shared Dynamic Fields (Optional)</label>
                    <div className="flex gap-3 mb-4">
                      <input type="text" value={input1} onChange={(e) => setInput1(e.target.value)} placeholder="e.g. Brand, Gender" className="flex-1 bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(input1, fields1, setFields1, setInput1))} />
                      <button type="button" onClick={() => handleAddTag(input1, fields1, setFields1, setInput1)} className="px-6 py-3.5 bg-neutral-100 text-neutral-900 font-medium rounded-2xl hover:bg-neutral-200 active:scale-95 transition-all duration-300">Add Field</button>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {fields1.map((f, i) => (
                        <span key={i} className="bg-neutral-900 text-white text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-sm animate-in zoom-in duration-300">
                          {f} <button type="button" className="text-neutral-400 hover:text-white transition-colors" onClick={() => setFields1(fields1.filter(x => x !== f))}><X size={14} strokeWidth={2} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full sm:w-auto bg-neutral-900 text-white px-8 py-4 rounded-full font-medium hover:bg-black hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 ease-out">
                      Save Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* LEVEL 2: SPORTS INSIDE CATEGORY */}
        {selectedMainId && !selectedGameName && activeMain && (
          <div className="space-y-12">
            {renderDynamicFieldsManager(activeMain.fields, 'main', handleAddOption, handleDeleteOption, handleDeleteField, optionInputs, setOptionInputs, setEditState, handleAddDynamicField, newFieldState, setNewFieldState, handleToggleMultiSelect)}

            <div>
              <div className="flex items-center justify-between px-2 mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Sports in {activeMain.mainCategory}</h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeMain.games?.map((game, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedGameName(game.gameName)}
                    className="group flex flex-col justify-between p-6 bg-white rounded-[2rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 ease-out cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="p-4 bg-neutral-50 text-neutral-600 rounded-2xl group-hover:bg-neutral-900 group-hover:text-white transition-all duration-500 ease-out shadow-sm">
                        {getGameIcon(game.gameName, 24)}
                      </div>
                      
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEditState({ isOpen: true, entityType: 'game', data: { currentValue: game.gameName }, newValue: game.gameName }); }}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-neutral-400 hover:text-blue-500 hover:bg-blue-50 shadow-sm"
                          title="Edit Sport"
                        >
                          <Pencil size={18} strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteGame(game.gameName); }}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-neutral-400 hover:text-red-500 hover:bg-red-50 shadow-sm"
                          title="Delete Sport"
                        >
                          <Trash2 size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-1 block">Sport</span>
                      <h3 className="font-semibold text-neutral-900 text-xl tracking-tight">{game.gameName}</h3>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setShowAddGame(!showAddGame)}
                  className="group flex flex-col items-center justify-center p-6 bg-transparent rounded-[2rem] border-[1.5px] border-dashed border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all duration-500 ease-out min-h-[200px]"
                >
                  <div className="w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-neutral-400 group-hover:text-neutral-900 group-hover:scale-110 transition-all duration-500 ease-out mb-4">
                    <Plus size={24} strokeWidth={1.5} />
                  </div>
                  <span className="font-medium text-neutral-500 group-hover:text-neutral-900 transition-colors duration-300">Add New Sport</span>
                </button>
              </div>
            </div>

            {/* ADD SPORT INLINE FORM */}
            <div className={`overflow-hidden transition-all duration-500 ease-out ${showAddGame ? 'max-h-[800px] opacity-100 mt-8' : 'max-h-0 opacity-0'}`}>
               <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-3xl border border-neutral-100">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3 text-neutral-900">
                    <div className="p-2.5 bg-neutral-100 rounded-xl"><Settings2 size={20} strokeWidth={1.5} /></div>
                    <h3 className="text-xl font-semibold tracking-tight">Configure Sport</h3>
                  </div>
                  <button onClick={() => setShowAddGame(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"><X size={20} strokeWidth={1.5}/></button>
                </div>
                
                <form onSubmit={handleAddGame} className="space-y-8">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1">Sport Name</label>
                    <input required type="text" value={newGameName} onChange={(e) => setNewGameName(e.target.value)} placeholder="e.g. Cricket" className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-4 text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300 ease-out" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1">Sport-Specific Fields (Optional)</label>
                    <div className="flex gap-3 mb-4">
                      <input type="text" value={input2} onChange={(e) => setInput2(e.target.value)} placeholder="e.g. Ball Type" className="flex-1 bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(input2, fields2, setFields2, setInput2))} />
                      <button type="button" onClick={() => handleAddTag(input2, fields2, setFields2, setInput2)} className="px-6 py-3.5 bg-neutral-100 text-neutral-900 font-medium rounded-2xl hover:bg-neutral-200 active:scale-95 transition-all duration-300">Add Field</button>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {fields2.map((f, i) => (
                        <span key={i} className="bg-neutral-900 text-white text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-sm animate-in zoom-in duration-300">
                          {f} <button type="button" className="text-neutral-400 hover:text-white transition-colors" onClick={() => setFields2(fields2.filter(x => x !== f))}><X size={14} strokeWidth={2} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full sm:w-auto bg-neutral-900 text-white px-8 py-4 rounded-full font-medium hover:bg-black hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 ease-out">
                      Save Sport
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* LEVEL 3: PRODUCT TYPES INSIDE SPORT */}
        {selectedMainId && selectedGameName && !selectedTypeName && activeGame && (
          <div className="space-y-12">
            {renderDynamicFieldsManager(activeGame.fields, 'game', handleAddOption, handleDeleteOption, handleDeleteField, optionInputs, setOptionInputs, setEditState, handleAddDynamicField, newFieldState, setNewFieldState, handleToggleMultiSelect)}

            <div>
              <div className="flex items-center justify-between px-2 mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Types in {activeGame.gameName}</h1>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeGame.productTypes?.map((type, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedTypeName(type.typeName)}
                    className="group flex flex-col justify-between p-6 bg-white rounded-[2rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 ease-out cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="p-4 bg-neutral-50 text-neutral-600 rounded-2xl group-hover:bg-neutral-900 group-hover:text-white transition-all duration-500 ease-out shadow-sm">
                        {getTypeIcon(type.typeName, 24, 1.2)}
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEditState({ isOpen: true, entityType: 'type', data: { currentValue: type.typeName }, newValue: type.typeName }); }}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-neutral-400 hover:text-blue-500 hover:bg-blue-50 shadow-sm"
                          title="Edit Type"
                        >
                          <Pencil size={18} strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteProductType(type.typeName); }}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-neutral-400 hover:text-red-500 hover:bg-red-50 shadow-sm"
                          title="Delete Type"
                        >
                          <Trash2 size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-1 block">Sub-Type</span>
                      <h3 className="font-semibold text-neutral-900 text-xl tracking-tight">{type.typeName}</h3>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setShowAddType(!showAddType)}
                  className="group flex flex-col items-center justify-center p-6 bg-transparent rounded-[2rem] border-[1.5px] border-dashed border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all duration-500 ease-out min-h-[200px]"
                >
                  <div className="w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-neutral-400 group-hover:text-neutral-900 group-hover:scale-110 transition-all duration-500 ease-out mb-4">
                    <Plus size={24} strokeWidth={1.5} />
                  </div>
                  <span className="font-medium text-neutral-500 group-hover:text-neutral-900 transition-colors duration-300">Add New Type</span>
                </button>
              </div>
            </div>

            {/* ADD TYPE INLINE FORM */}
            <div className={`overflow-hidden transition-all duration-500 ease-out ${showAddType ? 'max-h-[800px] opacity-100 mt-8' : 'max-h-0 opacity-0'}`}>
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-3xl border border-neutral-100">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3 text-neutral-900">
                    <div className="p-2.5 bg-neutral-100 rounded-xl"><Settings2 size={20} strokeWidth={1.5} /></div>
                    <h3 className="text-xl font-semibold tracking-tight">Configure Product Type</h3>
                  </div>
                  <button onClick={() => setShowAddType(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"><X size={20} strokeWidth={1.5}/></button>
                </div>
                
                <form onSubmit={handleAddProductType} className="space-y-8">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1">Type Name</label>
                    <input required type="text" value={newProductType} onChange={(e) => setNewProductType(e.target.value)} placeholder="e.g. T-Shirt" className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-4 text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300 ease-out" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1">Type-Specific Fields (Optional)</label>
                    <div className="flex gap-3 mb-4">
                      <input type="text" value={input3} onChange={(e) => setInput3(e.target.value)} placeholder="e.g. Size, Color" className="flex-1 bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(input3, fields3, setFields3, setInput3))} />
                      <button type="button" onClick={() => handleAddTag(input3, fields3, setFields3, setInput3)} className="px-6 py-3.5 bg-neutral-100 text-neutral-900 font-medium rounded-2xl hover:bg-neutral-200 active:scale-95 transition-all duration-300">Add Field</button>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {fields3.map((f, i) => (
                        <span key={i} className="bg-neutral-900 text-white text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-sm animate-in zoom-in duration-300">
                          {f} <button type="button" className="text-neutral-400 hover:text-white transition-colors" onClick={() => setFields3(fields3.filter(x => x !== f))}><X size={14} strokeWidth={2} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full sm:w-auto bg-neutral-900 text-white px-8 py-4 rounded-full font-medium hover:bg-black hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 ease-out">
                      Save Type
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* LEVEL 4: PRODUCT TYPE SPECIFIC FIELDS */}
        {selectedMainId && selectedGameName && selectedTypeName && activeType && (
          <div className="space-y-12">
            {renderDynamicFieldsManager(activeType.fields, 'productType', handleAddOption, handleDeleteOption, handleDeleteField, optionInputs, setOptionInputs, setEditState, handleAddDynamicField, newFieldState, setNewFieldState, handleToggleMultiSelect)}
          </div>
        )}
      </div>

      {/* --- UNIVERSAL EDIT MODAL --- */}
      {editState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 ease-out">
            <h3 className="text-xl font-semibold tracking-tight text-neutral-900 mb-2 capitalize">
              Edit {editState.entityType === 'main' ? 'Category' : editState.entityType}
            </h3>
            <p className="text-sm text-neutral-500 mb-6">Enter a new name for <span className="font-semibold text-neutral-700">"{editState.data.currentValue}"</span>.</p>
            
            <input 
               type="text"
               autoFocus
               value={editState.newValue}
               onChange={(e) => setEditState({...editState, newValue: e.target.value})}
               className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/10 transition-all duration-300 mb-8 font-medium text-neutral-900"
               onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
            />
            
            <div className="flex gap-3 justify-end">
               <button 
                  onClick={() => setEditState({ isOpen: false, entityType: '', data: null, newValue: '' })} 
                  className="px-6 py-3 rounded-full font-medium text-neutral-600 hover:bg-neutral-100 transition-colors duration-300"
               >
                 Cancel
               </button>
               <button 
                  onClick={handleSaveEdit} 
                  disabled={!editState.newValue.trim() || editState.newValue === editState.data.currentValue}
                  className="px-6 py-3 rounded-full font-medium bg-neutral-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95 shadow-lg shadow-neutral-900/20"
               >
                 Save Changes
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// PREMIUM DIRECTORY-STYLE FIELD MANAGER WITH MULTI-SELECT TOGGLE INTEGRATION
function renderDynamicFieldsManager(fields, level, onAddOpt, onDeleteOpt, onDeleteField, optionInputs, setOptionInputs, setEditState, onAddField, newFieldState, setNewFieldState, onToggleMultiSelect) {
  const safeFields = fields || [];

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100">
      <div className="flex items-center gap-3 text-neutral-900 mb-8">
        <div className="p-2.5 bg-neutral-100 rounded-xl">
          <Sparkles size={20} strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Dynamic Fields</h2>
          <p className="text-xs text-neutral-400 font-medium mt-0.5">Configure dropdown options and field properties</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {safeFields.map((f, idx) => {
          const inputKey = `${level}_${f.fieldName}`;
          return (
            <div key={idx} className="bg-neutral-50/50 rounded-3xl border border-neutral-100 overflow-hidden relative flex flex-col transition-all duration-300 hover:shadow-md hover:bg-white">
              <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center bg-white/50 backdrop-blur-md">
                <h5 className="font-semibold text-[15px] tracking-tight text-neutral-900">{f.fieldName}</h5>
                
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditState({ isOpen: true, entityType: 'field', data: { level, currentValue: f.fieldName }, newValue: f.fieldName })}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    title="Edit Field Name"
                  >
                    <Pencil size={15} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteField(level, f.fieldName)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete Field"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 min-h-[100px] flex flex-col justify-between">
                <div className="flex flex-wrap gap-2.5 mb-4">
                  {(f.options || []).length > 0 ? (
                    f.options.map((opt, oIdx) => (
                      <div key={oIdx} className="group/opt bg-white border border-neutral-200 text-neutral-700 text-sm pl-3.5 pr-1.5 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] animate-in zoom-in duration-300 hover:border-neutral-300">
                        <span>{opt}</span>
                        <div className="flex items-center ml-1 border-l border-neutral-100 pl-1.5">
                          <button 
                            type="button" 
                            className="p-1 text-neutral-300 hover:text-blue-500 transition-colors" 
                            title="Edit Option"
                            onClick={() => setEditState({ isOpen: true, entityType: 'option', data: { level, fieldName: f.fieldName, currentValue: opt }, newValue: opt })}
                          >
                            <Pencil size={12} strokeWidth={2} />
                          </button>
                          <button 
                            type="button" 
                            className="p-1 text-neutral-300 hover:text-red-500 transition-colors" 
                            title="Delete Option"
                            onClick={() => onDeleteOpt(level, f.fieldName, opt)}
                          >
                            <X size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-neutral-400/80 font-medium">No options configured yet.</span>
                  )}
                </div>

                {/* --- MULTI-SELECT TOGGLE SECTION --- */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-200/60">
                  <span className="text-xs text-neutral-500 font-medium">Allow Multiple (Multi-size/Variant)</span>
                  <button
                    type="button"
                    onClick={() => onToggleMultiSelect(level, f.fieldName, !f.allowMultiple)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      f.allowMultiple ? 'bg-neutral-900 text-white shadow-sm' : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                    }`}
                  >
                    {f.allowMultiple ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white border-t border-neutral-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Type new option..."
                  value={optionInputs[inputKey] || ''}
                  onChange={(e) => setOptionInputs({ ...optionInputs, [inputKey]: e.target.value })}
                  className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 transition-all duration-300"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddOpt(level, f.fieldName))}
                />
                <button type="button" onClick={() => onAddOpt(level, f.fieldName)} className="px-4 py-2.5 bg-neutral-900 text-white font-medium rounded-xl text-sm hover:bg-black active:scale-95 transition-all duration-300">
                  Add
                </button>
              </div>
            </div>
          );
        })}

        {/* --- ADD NEW FIELD TILE --- */}
        <div className="bg-transparent rounded-3xl border-[1.5px] border-dashed border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all duration-500 ease-out min-h-[200px] flex flex-col items-center justify-center p-6 relative overflow-hidden group/add">
          {!newFieldState.isAdding ? (
            <button 
              onClick={() => setNewFieldState({ isAdding: true, value: '' })} 
              className="flex flex-col items-center justify-center w-full h-full"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-neutral-400 group-hover/add:text-neutral-900 group-hover/add:scale-110 transition-all duration-500 ease-out mb-3">
                <Plus size={20} strokeWidth={1.5} />
              </div>
              <span className="font-medium text-sm text-neutral-500 group-hover/add:text-neutral-900 transition-colors duration-300">
                Add New Field
              </span>
            </button>
          ) : (
            <div className="w-full flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-300 ease-out">
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest ml-1 text-center">New Field Name</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Material, Size"
                value={newFieldState.value}
                onChange={(e) => setNewFieldState({ ...newFieldState, value: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && onAddField(level, newFieldState.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 transition-all text-center font-medium"
              />
              <div className="flex gap-2 mt-1">
                <button 
                  onClick={() => setNewFieldState({ isAdding: false, value: '' })} 
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium text-neutral-500 hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => onAddField(level, newFieldState.value)} 
                  disabled={!newFieldState.value.trim()}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-neutral-900 text-white hover:bg-black disabled:opacity-50 transition-colors"
                >
                  Save Field
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}