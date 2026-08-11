import { useState, useCallback, useEffect } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  Layers, 
  Trophy, 
  Tag, 
  Shirt,
  Dumbbell,
  Footprints,
  ChevronRight,
  PackagePlus,
  Box,
  Shield,
  Backpack,
  BriefcaseMedical,
  ToolCase,
  ImagePlus,
  Check,
  Palette,
  Wand2,
  FileText,
  Tags
} from 'lucide-react';

import { 
  MdSportsBasketball, MdSportsSoccer, MdSportsCricket, MdSportsTennis, 
  MdSportsVolleyball, MdSportsBaseball, MdSportsMartialArts, MdPool, 
  MdDirectionsBike, MdDirectionsRun, MdSportsGolf, MdSportsFootball, 
  MdSportsRugby, MdSportsHockey, MdSportsGymnastics, MdSportsEsports, 
  MdSnowboarding, MdSurfing, MdSkateboarding, MdRowing, MdCheckroom 
} from 'react-icons/md';

import { 
  FaTableTennis, FaBowlingBall, FaChess 
} from 'react-icons/fa';

import { PiPants, PiTShirt } from 'react-icons/pi';
import { 
  GiBoxingGlove, 
  GiArcheryTarget, GiShuttlecock, 
  GiEightBall, GiHelmet , GiSocks, GiRunningShoe
} from 'react-icons/gi';

import api from '../utils/api';

// --- VISUAL COLOR MAP ---
const COLOR_MAP = {
  'Red': '#ef4444', 'Blue': '#3b82f6', 'Navy': '#1e3a8a', 'Green': '#22c55e', 
  'Black': '#000000', 'White': '#ffffff', 'Yellow': '#eab308', 'Orange': '#f97316', 
  'Pink': '#ec4899', 'Purple': '#a855f7', 'Grey': '#6b7280', 'Silver': '#9ca3af', 
  'Gold': '#fbbf24', 'Bronze': '#b45309', 'Maroon': '#7f1d1d', 'Cyan': '#06b6d4', 
  'Neon Green': '#39ff14', 'Brown': '#78350f', 'Clear / Transparent': '#f3f4f6'
};

// --- HIGHLY DETAILED FALLBACK CATEGORIES ---
const HARDCODED_CATEGORIES = [
  {
    _id: 'cat_1',
    mainCategory: 'Sports Equipment',
    fields: [{ fieldName: 'Brand', options: ['Nike', 'Adidas', 'Puma', 'Wilson', 'Rawlings', 'Kookaburra', 'Yonex', 'SG', 'SS', 'Generic'] }],
    games: [
      {
        gameName: 'Cricket',
        fields: [{ fieldName: 'Player Level', options: ['Beginner', 'Intermediate', 'Professional'] }],
        productTypes: [
          { typeName: 'Bat', fields: [{ fieldName: 'Willow Type', options: ['English Willow Grade 1', 'English Willow Grade 2', 'English Willow Grade 3', 'Kashmir Willow', 'Alternative Wood'] }, { fieldName: 'Weight Range', options: ['Light (1050-1100g)', 'Medium (1100-1150g)', 'Heavy (1150g+)'] }, { fieldName: 'Size', options: ['Short Handle (SH)', 'Long Handle (LH)', 'Harrow', 'Size 6', 'Size 5', 'Size 4'] }, { fieldName: 'Sweet Spot', options: ['Low', 'Mid', 'High'] }] },
          { typeName: 'Ball', fields: [{ fieldName: 'Core Material', options: ['Cork', 'Rubber', 'Synthetic'] }, { fieldName: 'Outer Material', options: ['Alum Tanned Leather', 'PU', 'Tennis/Felt'] }, { fieldName: 'Color', options: ['Red', 'White', 'Pink', 'Yellow'] }, { fieldName: 'Weight', options: ['156g (Senior)', '142g (Junior)'] }, { fieldName: 'Seam', options: ['Hand Stitched', 'Machine Stitched'] }] },
          { typeName: 'Helmet', fields: [{ fieldName: 'Size', options: ['Small', 'Medium', 'Large', 'Extra Large'] }, { fieldName: 'Grille Material', options: ['Titanium', 'Stainless Steel', 'Mild Steel'] }, { fieldName: 'Color', options: ['Navy', 'Blue', 'Green', 'Maroon', 'Black'] }] },
          { typeName: 'Pads / Guards', fields: [{ fieldName: 'Type', options: ['Batting Pads', 'Wicket Keeping Pads', 'Thigh Guard', 'Arm Guard', 'Chest Guard'] }, { fieldName: 'Size', options: ['Mens', 'Youth', 'Boys'] }, { fieldName: 'Facing Material', options: ['PU', 'PVC', 'Canvas'] }] },
          { typeName: 'Gloves', fields: [{ fieldName: 'Type', options: ['Batting Gloves', 'Wicket Keeping Gloves', 'Inner Gloves'] }, { fieldName: 'Dexterity', options: ['Right Hand', 'Left Hand'] }, { fieldName: 'Protection Profile', options: ['Sausage Fingers', 'Split Fingers'] }] }
        ]
      },
      {
        gameName: 'Football / Soccer',
        fields: [],
        productTypes: [
          { typeName: 'Ball', fields: [{ fieldName: 'Size', options: ['Size 5 (Adult)', 'Size 4 (Youth)', 'Size 3 (Junior)', 'Size 1 (Mini)'] }, { fieldName: 'Type', options: ['Match Pro', 'Training', 'Futsal', 'Street'] }, { fieldName: 'Panel Construction', options: ['Thermo-bonded', 'Hand-stitched', 'Machine-stitched'] }, { fieldName: 'Color', options: ['White', 'Yellow', 'Orange', 'Neon Green'] }] },
          { typeName: 'Shin Guards', fields: [{ fieldName: 'Size', options: ['S', 'M', 'L'] }, { fieldName: 'Style', options: ['Slip-in', 'Ankle Guard Attached'] }, { fieldName: 'Material', options: ['Carbon Fiber', 'Polypropylene', 'Foam'] }] },
          { typeName: 'Goalkeeper Gloves', fields: [{ fieldName: 'Size', options: ['7', '8', '9', '10', '11'] }, { fieldName: 'Cut Type', options: ['Flat Palm', 'Roll Finger', 'Negative Cut'] }, { fieldName: 'Finger Spines', options: ['Removable', 'Fixed', 'None'] }] }
        ]
      },
      {
        gameName: 'Tennis',
        fields: [],
        productTypes: [
          { typeName: 'Racquet', fields: [{ fieldName: 'Grip Size', options: ['4', '4 1/8', '4 1/4', '4 3/8', '4 1/2'] }, { fieldName: 'Head Size', options: ['Midsize (85-95 sq in)', 'Midplus (96-105 sq in)', 'Oversize (106+ sq in)'] }, { fieldName: 'String Tension', options: ['Unstrung', 'Factory Strung', 'Custom Tension'] }] },
          { typeName: 'Ball', fields: [{ fieldName: 'Court Type', options: ['All Court', 'Clay Court', 'Hard Court', 'Grass'] }, { fieldName: 'Pressurization', options: ['Pressurized', 'Pressureless'] }, { fieldName: 'Color', options: ['Neon Green', 'Yellow', 'Pink'] }] },
          { typeName: 'Accessories', fields: [{ fieldName: 'Type', options: ['Overgrip', 'Vibration Dampener', 'Sweatband'] }, { fieldName: 'Color', options: ['White', 'Black', 'Blue', 'Red', 'Neon Green'] }] }
        ]
      }
    ]
  },
  {
    _id: 'cat_2',
    mainCategory: 'Apparel',
    fields: [
      { fieldName: 'Gender', options: ['Men', 'Women', 'Unisex', 'Boys', 'Girls'] },
      { fieldName: 'Age Group', options: ['Adult', 'Youth', 'Toddler'] }
    ],
    games: [
      {
        gameName: 'Activewear / Gym',
        fields: [{ fieldName: 'Fabric Technology', options: ['Moisture Wicking', 'Thermal / Fleece', 'UV Protection', 'Anti-Odor', 'Standard'] }],
        productTypes: [
          { typeName: 'T-Shirt / Top', fields: [{ fieldName: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] }, { fieldName: 'Fit', options: ['Compression', 'Slim', 'Regular', 'Loose/Relaxed'] }, { fieldName: 'Neckline', options: ['Crew Neck', 'V-Neck', 'Henley', 'Polo'] }, { fieldName: 'Color', options: ['Black', 'White', 'Grey', 'Navy', 'Red', 'Blue'] }] },
          { typeName: 'Shorts', fields: [{ fieldName: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] }, { fieldName: 'Inseam', options: ['3 inch', '5 inch', '7 inch', '9 inch'] }, { fieldName: 'Lining', options: ['Built-in Brief', 'Compression Liner', 'Unlined'] }, { fieldName: 'Color', options: ['Black', 'Navy', 'Grey', 'Red'] }] },
          { typeName: 'Leggings / Trackpants', fields: [{ fieldName: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] }, { fieldName: 'Length', options: ['Full Length', '7/8 Length', '3/4 Capris', 'Short'] }, { fieldName: 'Waistband', options: ['High Rise', 'Mid Rise', 'Low Rise'] }, { fieldName: 'Color', options: ['Black', 'Grey', 'Navy', 'Maroon'] }] }
        ]
      },
      {
        gameName: 'Team Jerseys',
        fields: [],
        productTypes: [
          { typeName: 'Jersey', fields: [{ fieldName: 'Sport', options: ['Football', 'Basketball', 'Cricket', 'Rugby', 'Hockey'] }, { fieldName: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] }, { fieldName: 'Sleeve', options: ['Sleeveless', 'Short Sleeve', 'Long Sleeve'] }, { fieldName: 'Authenticity', options: ['Authentic / Match', 'Replica / Fan', 'Training'] }, { fieldName: 'Color', options: ['Red', 'Blue', 'White', 'Black', 'Yellow', 'Green'] }] }
        ]
      }
    ]
  },
  {
    _id: 'cat_3',
    mainCategory: 'Footwear',
    fields: [
      { fieldName: 'Gender', options: ['Men', 'Women', 'Unisex', 'Kids'] },
      { fieldName: 'Shoe Size (US)', options: ['4', '5', '6', '7', '8', '8.5', '9', '9.5', '10', '10.5', '11', '12', '13', '14'] },
      { fieldName: 'Width', options: ['Standard (D)', 'Wide (EE)', 'Extra Wide (4E)', 'Narrow (B)'] }
    ],
    games: [
      {
        gameName: 'Running & Training',
        fields: [],
        productTypes: [
          { typeName: 'Running Shoes', fields: [{ fieldName: 'Cushioning Level', options: ['Maximum', 'Moderate', 'Minimal', 'Barefoot/Zero Drop'] }, { fieldName: 'Pronation Support', options: ['Neutral', 'Stability', 'Motion Control'] }, { fieldName: 'Surface', options: ['Road', 'Trail', 'Track'] }, { fieldName: 'Color', options: ['Black', 'White', 'Grey', 'Neon Green', 'Blue', 'Red'] }] },
          { typeName: 'Weightlifting Shoes', fields: [{ fieldName: 'Heel Height', options: ['0.5 inch', '0.75 inch', '1 inch'] }, { fieldName: 'Closure', options: ['Laces Only', 'Laces + Single Strap', 'Laces + Double Strap', 'BOA System'] }, { fieldName: 'Color', options: ['Black', 'White', 'Red'] }] }
        ]
      },
      {
        gameName: 'Football / Soccer',
        fields: [],
        productTypes: [
          { typeName: 'Cleats / Studs', fields: [{ fieldName: 'Surface Type', options: ['Firm Ground (FG)', 'Soft Ground (SG)', 'Artificial Grass (AG)', 'Turf (TF)', 'Indoor (IN)'] }, { fieldName: 'Ankle Collar', options: ['Low Cut', 'Mid Cut / Sock', 'High Cut'] }, { fieldName: 'Upper Material', options: ['Synthetic', 'K-Leather', 'Calf Leather', 'Knit'] }, { fieldName: 'Color', options: ['Black', 'White', 'Neon Green', 'Pink', 'Cyan'] }] }
        ]
      },
      {
        gameName: 'Court Sports',
        fields: [],
        productTypes: [
          { typeName: 'Court Shoes', fields: [{ fieldName: 'Sport', options: ['Tennis', 'Badminton', 'Squash', 'Volleyball'] }, { fieldName: 'Sole Type', options: ['Non-Marking Gum Rubber', 'All Court', 'Clay Court Herringbone'] }, { fieldName: 'Color', options: ['White', 'Navy', 'Black', 'Red'] }] }
        ]
      }
    ]
  },
  {
    _id: 'cat_4',
    mainCategory: 'Gym & Fitness',
    fields: [],
    games: [
      {
        gameName: 'Strength Training',
        fields: [],
        productTypes: [
          { typeName: 'Dumbbells', fields: [{ fieldName: 'Material', options: ['Cast Iron', 'Rubber Coated Hex', 'Urethane', 'Neoprene / Vinyl'] }, { fieldName: 'Weight', options: ['1kg', '2kg', '5kg', '10kg', '12.5kg', '15kg', '20kg', '25kg', '30kg+'] }, { fieldName: 'Handle Grip', options: ['Ergonomic / Contoured', 'Straight Knurled'] }, { fieldName: 'Color', options: ['Black', 'Silver', 'Blue', 'Pink', 'Red'] }] },
          { typeName: 'Barbells', fields: [{ fieldName: 'Type', options: ['Olympic Bar (2")', 'Standard Bar (1")', 'EZ Curl Bar', 'Trap/Hex Bar', 'Swiss Bar'] }, { fieldName: 'Length', options: ['4ft', '5ft', '6ft', '7ft'] }, { fieldName: 'Coating', options: ['Bare Steel', 'Black Zinc', 'Chrome', 'Cerakote'] }] },
          { typeName: 'Weight Plates', fields: [{ fieldName: 'Type', options: ['Bumper Plate (Rubber)', 'Cast Iron Plate', 'Tri-Grip Rubber Coated', 'Fractional Plate'] }, { fieldName: 'Hole Diameter', options: ['Olympic (2 inch)', 'Standard (1 inch)'] }, { fieldName: 'Weight', options: ['1.25kg', '2.5kg', '5kg', '10kg', '15kg', '20kg', '25kg'] }, { fieldName: 'Color', options: ['Black', 'Red', 'Blue', 'Yellow', 'Green'] }] }
        ]
      },
      {
        gameName: 'Yoga & Pilates',
        fields: [],
        productTypes: [
          { typeName: 'Yoga Mat', fields: [{ fieldName: 'Thickness', options: ['3mm (Travel)', '4-5mm (Standard)', '6mm (Extra Cushion)', '10mm+ (Thick)'] }, { fieldName: 'Material', options: ['PVC', 'TPE (Eco-Friendly)', 'Natural Rubber', 'Cork', 'Cotton/Jute'] }, { fieldName: 'Color', options: ['Purple', 'Blue', 'Pink', 'Green', 'Black', 'Grey'] }] },
          { typeName: 'Accessories', fields: [{ fieldName: 'Type', options: ['Yoga Block', 'Resistance Band', 'Foam Roller', 'Yoga Strap', 'Pilates Ring'] }, { fieldName: 'Color', options: ['Pink', 'Purple', 'Blue', 'Black'] }] }
        ]
      }
    ]
  },
  {
    _id: 'cat_5',
    mainCategory: 'Trophies & Awards',
    fields: [],
    games: [
      {
        gameName: 'Trophies & Cups',
        fields: [],
        productTypes: [
          { typeName: 'Cup Trophy', fields: [{ fieldName: 'Material', options: ['Metal', 'Fibre / Resin', 'Crystal / Glass', 'Wood Base'] }, { fieldName: 'Size Height', options: ['Small (6"-10")', 'Medium (10"-15")', 'Large (15"-24")', 'Championship (24"+)'] }, { fieldName: 'Color', options: ['Gold', 'Silver', 'Bronze'] }] },
          { typeName: 'Figurine Award', fields: [{ fieldName: 'Sport Theme', options: ['Football Player', 'Cricket Batsman', 'Basketball', 'Star / Victory', 'Academic'] }, { fieldName: 'Color', options: ['Gold', 'Silver', 'Bronze'] }] }
        ]
      },
      {
        gameName: 'Medals & Plaques',
        fields: [],
        productTypes: [
          { typeName: 'Medals', fields: [{ fieldName: 'Finish / Color', options: ['Gold', 'Silver', 'Bronze', 'Antique Finish', 'Set of 3 (G/S/B)'] }, { fieldName: 'Diameter', options: ['40mm', '50mm', '60mm', '70mm+'] }, { fieldName: 'Ribbon Type', options: ['Tricolor (National)', 'Solid Red', 'Solid Blue', 'Custom Lanyard'] }] },
          { typeName: 'Plaques / Shields', fields: [{ fieldName: 'Material', options: ['Mahogany Wood', 'Rosewood Finish', 'Glass/Acrylic', 'Metal Frame'] }, { fieldName: 'Orientation', options: ['Portrait', 'Landscape', 'Shield Shape'] }] }
        ]
      }
    ]
  }
];

export default function AddProduct() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Navigation State
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState(HARDCODED_CATEGORIES);
  
  // Selection State
  const [selectedMainId, setSelectedMainId] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [dynamicValues, setDynamicValues] = useState({});

  // Form Data
  const [formData, setFormData] = useState({
    name: '', sku: '', unit: 'Count', price: '', costPrice: '', compareAtPrice: '', 
    quantity: '', supplier: '', description: '', tags: '', imageUrl: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch dynamic categories from Backend (falls back to hardcoded categories on error)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data && res.data.length > 0) {
          setCategories(res.data);
        }
      } catch (err) {
        console.warn('Using default hardcoded categories');
      }
    };
    fetchCategories();
  }, []);

  const activeMain = categories.find(c => c._id === selectedMainId);
  const activeGame = activeMain?.games?.find(g => g.gameName === selectedGame);
  const activeType = activeGame?.productTypes?.find(p => p.typeName === selectedType);

  // Merge dynamic attributes from Main Category, Game, and Product Type levels
  const mergedDynamicFields = [
    ...(activeMain?.fields || []),
    ...(activeGame?.fields || []),
    ...(activeType?.fields || [])
  ];

  const handleResetSelection = () => {
    setStep(1);
    setSelectedMainId('');
    setSelectedGame('');
    setSelectedType('');
    setDynamicValues({});
  };

  const jumpToStep = (targetStep) => {
    if (targetStep === 1) {
      setSelectedMainId(''); setSelectedGame(''); setSelectedType('');
    } else if (targetStep === 2) {
      setSelectedGame(''); setSelectedType('');
    } else if (targetStep === 3) {
      setSelectedType('');
    }
    setStep(targetStep);
  };

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  // Auto SKU Generator
  const generateSKU = () => {
    const prefix = activeType?.typeName?.replace(/\s/g, '').substring(0, 3).toUpperCase() || 'PRD';
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    setFormData(prev => ({ ...prev, sku: `${prefix}-${randomNum}` }));
  };

  // Dynamic Attribute Value Selection Handler (Supports Single & Multi-Select)
  const handleAttributeChange = (fieldName, opt, allowMultiple) => {
    if (allowMultiple) {
      const currentArr = Array.isArray(dynamicValues[fieldName]) ? dynamicValues[fieldName] : [];
      const updatedArr = currentArr.includes(opt)
        ? currentArr.filter(item => item !== opt)
        : [...currentArr, opt];
      setDynamicValues({ ...dynamicValues, [fieldName]: updatedArr });
    } else {
      setDynamicValues({ ...dynamicValues, [fieldName]: opt });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();
      
      payload.append('name', formData.name);
      payload.append('sku', formData.sku);
      payload.append('description', formData.description);
      payload.append('tags', formData.tags);
      payload.append('unit', formData.unit);
      payload.append('price', Number(formData.price));
      payload.append('compareAtPrice', formData.compareAtPrice ? Number(formData.compareAtPrice) : '');
      payload.append('costPrice', Number(formData.costPrice));
      payload.append('quantity', Number(formData.quantity));
      payload.append('supplier', formData.supplier || '');
      
      payload.append('mainCategory', activeMain?.mainCategory || '');
      payload.append('gameType', selectedGame || '');
      payload.append('productType', selectedType || '');
      
      payload.append('attributes', JSON.stringify(dynamicValues));

      if (imageFile) {
        payload.append('image', imageFile);
      }

      await api.post('/products', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      
      // Reset state
      setFormData({ 
        name: '', sku: '', unit: 'Count', price: '', costPrice: '', compareAtPrice: '', 
        quantity: '', supplier: '', description: '', tags: '', imageUrl: '' 
      });
      setDynamicValues({});
      setImageFile(null);
      setImagePreview(null);
      
      setTimeout(() => {
        setSuccess(false);
        handleResetSelection();
      }, 3000);
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  // Icon Helpers
  const getCategoryIcon = (name = '', defaultIcon) => {
    const lower = name.toLowerCase();
    if (lower.includes('apparel') || lower.includes('wear')) return <Shirt size={28} strokeWidth={1.2} />;
    if (lower.includes('shoe') || lower.includes('footwear')) return <Footprints size={28} strokeWidth={1.2} />;
    if (lower.includes('fitness') || lower.includes('gym')) return <Dumbbell size={28} strokeWidth={1.2} />;
    if (lower.includes('trophy') || lower.includes('award') || lower.includes('medal')) return <Trophy size={28} strokeWidth={1.2} />;
    if (lower.includes('kit') || lower.includes('indoor')) return <BriefcaseMedical size={28} strokeWidth={1.2} />;
    if (lower.includes('equipment')) return <ToolCase size={28} strokeWidth={1.2} />;
    return defaultIcon;
  };

  const getGameIcon = (gameName = '', size = 24) => {
    const lower = gameName.toLowerCase();
    if (lower.includes('basketball')) return <MdSportsBasketball size={size} />;
    if (lower.includes('football') || lower.includes('soccer')) return <MdSportsSoccer size={size} />;
    if (lower.includes('cricket')) return <MdSportsCricket size={size} />;
    if (lower.includes('tennis') || lower.includes('court')) return <MdSportsTennis size={size} />;
    if (lower.includes('badminton')) return <GiShuttlecock size={size} />;
    if (lower.includes('martial') || lower.includes('boxing')) return <GiBoxingGlove size={size} />;
    if (lower.includes('run') || lower.includes('track')) return <GiRunningShoe size={size} />;
    if (lower.includes('gym') || lower.includes('fitness') || lower.includes('strength') || lower.includes('weight')) return <Dumbbell size={size} strokeWidth={1.2} />;
    if (lower.includes('yoga') || lower.includes('pilates')) return <MdSportsGymnastics size={size} />;
    if (lower.includes('troph') || lower.includes('medal') || lower.includes('plaque')) return <Trophy size={size} strokeWidth={1.2} />;
    if (lower.includes('table tennis')) return <FaTableTennis size={size} />;
    if (lower.includes('board game') || lower.includes('chess')) return <FaChess size={size} />;
    if (lower.includes('billiard') || lower.includes('snooker')) return <GiEightBall size={size} />;
    return <Layers size={size} strokeWidth={1.2} />;
  };

  const getTypeIcon = (typeName = '', size = 24, strokeWidth = 1.2) => {
    const lower = typeName.toLowerCase();
    if (lower.includes('jersey') || lower.includes('t-shirt') || lower.includes('top')) return <PiTShirt size={size} />;
    if (lower.includes('pant') || lower.includes('short') || lower.includes('legging')) return <PiPants size={size} />;
    if (lower.includes('shoe') || lower.includes('cleat')) return <GiRunningShoe size={size} />;
    if (lower.includes('glove')) return <GiBoxingGlove size={size} />;
    if (lower.includes('helmet') || lower.includes('guard') || lower.includes('pad')) return <Shield size={size} strokeWidth={strokeWidth} />;
    if (lower.includes('bag') || lower.includes('backpack')) return <Backpack size={size} strokeWidth={strokeWidth} />;
    if (lower.includes('bat') || lower.includes('racquet')) return <MdSportsCricket size={size} />;
    if (lower.includes('ball')) return <MdSportsSoccer size={size} />;
    if (lower.includes('dumbbell') || lower.includes('barbell') || lower.includes('plate')) return <Dumbbell size={size} strokeWidth={strokeWidth} />;
    if (lower.includes('mat')) return <Layers size={size} strokeWidth={strokeWidth} />;
    if (lower.includes('trophy') || lower.includes('cup') || lower.includes('figurine')) return <Trophy size={size} strokeWidth={strokeWidth} />;
    return <Box size={size} strokeWidth={strokeWidth} />;
  };

  const getHexForColor = (colorName) => {
    const baseColor = colorName.split(' ')[0];
    return COLOR_MAP[colorName] || COLOR_MAP[baseColor] || colorName; 
  };

  const isLightColor = (hex) => {
    const lightColors = ['#ffffff', '#eab308', '#f3f4f6', '#39ff14', 'White', 'Yellow', 'Neon Green', 'Clear / Transparent'];
    return lightColors.includes(hex) || lightColors.includes(hex.split(' ')[0]);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-10 min-h-screen font-sans selection:bg-neutral-200">
      
      {/* BREADCRUMB NAVIGATION */}
      <div className="sticky top-6 z-20 flex items-center flex-wrap gap-1.5 mb-12 bg-white/70 backdrop-blur-xl p-2.5 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/40 text-sm font-medium transition-all duration-500 ease-out w-fit">
        <button 
          onClick={() => jumpToStep(1)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ease-out ${step === 1 ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}`}
        >
          <Tag size={16} strokeWidth={1.5} /> Master Category
        </button>
        
        {step >= 2 && activeMain && (
          <>
            <ChevronRight className="text-neutral-300" size={16} strokeWidth={1.5} />
            <button 
              onClick={() => jumpToStep(2)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ease-out ${step === 2 ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}`}
            >
              <Trophy size={16} strokeWidth={1.5} /> {activeMain.mainCategory}
            </button>
          </>
        )}

        {step >= 3 && activeGame && (
          <>
            <ChevronRight className="text-neutral-300" size={16} strokeWidth={1.5} />
            <button 
              onClick={() => jumpToStep(3)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ease-out ${step === 3 ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}`}
            >
              <Layers size={16} strokeWidth={1.5} /> {activeGame.gameName}
            </button>
          </>
        )}

        {step === 4 && activeType && (
          <>
            <ChevronRight className="text-neutral-300" size={16} strokeWidth={1.5} />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white shadow-md transition-all duration-300 ease-out cursor-default">
              <PackagePlus size={16} strokeWidth={1.5} /> Details
            </div>
          </>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        
        {/* STEP 1: MAIN CATEGORIES */}
        {step === 1 && (
          <div className="space-y-8">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 px-2">Select a Category</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => { setSelectedMainId(cat._id); setStep(2); }}
                  className="group flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 ease-out cursor-pointer border border-transparent hover:border-neutral-100"
                >
                  <div className="w-16 h-16 mb-6 flex items-center justify-center bg-neutral-50 text-neutral-400 rounded-full group-hover:bg-neutral-900 group-hover:text-white group-hover:scale-110 transition-all duration-500 ease-out shadow-sm">
                    {getCategoryIcon(cat.mainCategory, <Tag size={28} strokeWidth={1.2} />)}
                  </div>
                  <h4 className="font-semibold text-neutral-900 text-lg tracking-tight text-center">{cat.mainCategory}</h4>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: SPORTS / GAMES */}
        {step === 2 && activeMain && (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 ease-out">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 px-2">Select a Sport in {activeMain.mainCategory}</h1>
            {activeMain.games && activeMain.games.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {activeMain.games.map((game, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedGame(game.gameName); setStep(3); }}
                    className="group flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 ease-out cursor-pointer border border-transparent hover:border-neutral-100"
                  >
                    <div className="w-16 h-16 mb-6 flex items-center justify-center bg-neutral-50 text-neutral-400 rounded-full group-hover:bg-neutral-900 group-hover:text-white group-hover:scale-110 transition-all duration-500 ease-out shadow-sm">
                      {getGameIcon(game.gameName, 28)}
                    </div>
                    <h4 className="font-semibold text-neutral-900 text-lg tracking-tight text-center">{game.gameName}</h4>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm">
                <p className="text-neutral-400 font-medium">No sports configured for this category.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PRODUCT TYPES */}
        {step === 3 && activeGame && (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 ease-out">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 px-2">Select Type for {activeGame.gameName}</h1>
            {activeGame.productTypes && activeGame.productTypes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {activeGame.productTypes.map((type, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedType(type.typeName); setStep(4); }}
                    className="group flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 ease-out cursor-pointer border border-transparent hover:border-neutral-100"
                  >
                    <div className="w-16 h-16 mb-6 flex items-center justify-center bg-neutral-50 text-neutral-400 rounded-full group-hover:bg-neutral-900 group-hover:text-white group-hover:scale-110 transition-all duration-500 ease-out shadow-sm">
                      {getTypeIcon(type.typeName, 28, 1.2)}
                    </div>
                    <h4 className="font-semibold text-neutral-900 text-lg tracking-tight text-center">{type.typeName}</h4>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm">
                <p className="text-neutral-400 font-medium">No types configured for this sport.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: PRODUCT FORM */}
        {step === 4 && (
          <div className="max-w-5xl animate-in slide-in-from-bottom-8 duration-700 ease-out">
            
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100">
              <div className="flex items-center gap-4 mb-10 pb-8 border-b border-neutral-100">
                <div className="p-3 bg-neutral-50 text-neutral-900 rounded-2xl">
                  <Box size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">Product Details</h2>
                  <p className="text-sm text-neutral-400 font-medium mt-1">
                    Entering details for <span className="text-neutral-700">{activeType.typeName}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* DYNAMIC ATTRIBUTES */}
                {mergedDynamicFields.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest ml-1">Attributes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {mergedDynamicFields.map((field, idx) => {
                        const isColorField = field.fieldName.toLowerCase().includes('color') || field.fieldName.toLowerCase().includes('finish');
                        const isMultiSelect = field.allowMultiple;
                        
                        return (
                          <div key={idx} className={isColorField ? "col-span-1 md:col-span-2 lg:col-span-3 bg-neutral-50/50 p-5 rounded-2xl border border-neutral-100" : ""}>
                            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                              {isColorField && <Palette size={14} />} {field.fieldName} {isMultiSelect && <span className="text-[10px] text-neutral-400 font-normal">(Multiple Selection)</span>}
                            </label>
                            
                            {isColorField ? (
                              <div className="flex flex-wrap gap-3">
                                {field.options?.map((opt, oIdx) => {
                                  const hex = getHexForColor(opt);
                                  const isSelected = isMultiSelect 
                                    ? (Array.isArray(dynamicValues[field.fieldName]) && dynamicValues[field.fieldName].includes(opt))
                                    : dynamicValues[field.fieldName] === opt;
                                  const isLight = isLightColor(opt);

                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      title={opt}
                                      onClick={() => handleAttributeChange(field.fieldName, opt, isMultiSelect)}
                                      className={`relative w-12 h-12 rounded-full transition-all duration-300 ease-out flex items-center justify-center border-[3px] 
                                        ${isSelected ? 'scale-110 shadow-md ring-4 ring-neutral-900/10' : 'hover:scale-105'}
                                        ${isLight ? 'border-neutral-200' : 'border-transparent'}
                                      `}
                                      style={{ backgroundColor: hex }}
                                    >
                                      {isSelected && (
                                        <Check className={isLight ? 'text-neutral-900' : 'text-white'} size={20} strokeWidth={3} />
                                      )}
                                      <span className="absolute -top-8 bg-neutral-900 text-white text-[10px] font-semibold px-2 py-1 rounded opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                                        {opt}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : isMultiSelect ? (
                              <div className="flex flex-wrap gap-2">
                                {field.options?.map((opt, oIdx) => {
                                  const isSelected = Array.isArray(dynamicValues[field.fieldName]) && dynamicValues[field.fieldName].includes(opt);
                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      onClick={() => handleAttributeChange(field.fieldName, opt, true)}
                                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                                        isSelected 
                                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' 
                                          : 'bg-neutral-50/50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="relative">
                                <select
                                  value={dynamicValues[field.fieldName] || ''}
                                  onChange={(e) => handleAttributeChange(field.fieldName, e.target.value, false)}
                                  className="w-full appearance-none bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-4 text-neutral-900 focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300 ease-out cursor-pointer"
                                >
                                  <option value="" disabled className="text-neutral-400">Select {field.fieldName}...</option>
                                  {field.options?.map((opt, oIdx) => <option key={oIdx} value={opt}>{opt}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-neutral-400">
                                  <ChevronRight className="rotate-90" size={16} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* BASE PRODUCT DETAILS */}
                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest ml-1">Core Information</h3>
                  
                  {/* Row 1: Name & SKU */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1">Product Title *</label>
                      <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-4 text-neutral-900 placeholder:text-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300 ease-out" placeholder="e.g. Pro Cricket Bat" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1">SKU / Barcode *</label>
                      <div className="relative flex items-center">
                        <input required type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl pl-5 pr-14 py-4 text-neutral-900 placeholder:text-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none uppercase transition-all duration-300 ease-out" placeholder="e.g. BAT-001" />
                        <button type="button" onClick={generateSKU} className="absolute right-3 p-2 bg-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-900 hover:text-white transition-colors duration-300" title="Generate SKU">
                          <Wand2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Description & Tags */}
                  <div className="grid grid-cols-1 gap-6 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                         Description
                      </label>
                      <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-4 text-neutral-900 placeholder:text-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300 ease-out resize-none" placeholder="Provide a detailed description of the item..."></textarea>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                         Search Tags (Comma Separated)
                      </label>
                      <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-4 text-neutral-900 placeholder:text-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300 ease-out" placeholder="e.g. lightweight, tournament grade, summer collection" />
                    </div>
                  </div>
                </div>

                {/* PRODUCT MEDIA (WITH DRAG AND DROP) */}
                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest ml-1">Product Media</h3>
                  <div className="flex items-center justify-center w-full">
                    <label 
                      htmlFor="product-image" 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`group flex flex-col items-center justify-center w-full h-56 border-[2px] border-dashed rounded-3xl cursor-pointer transition-all duration-300 ease-out relative overflow-hidden
                        ${isDragging ? 'bg-neutral-100 border-neutral-900 scale-[1.02]' : 'bg-neutral-50/50 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-900'}
                      `}
                    >
                      {imagePreview ? (
                        <div className="relative w-full h-full p-2 group-hover:scale-105 transition-transform duration-500">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-2xl" />
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl">
                            <span className="text-neutral-900 font-semibold text-sm flex items-center gap-2">
                              <ImagePlus size={16} /> Change Image
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 z-10 pointer-events-none">
                          <div className={`w-14 h-14 mb-4 flex items-center justify-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-500 ease-out
                            ${isDragging ? 'text-neutral-900 scale-125' : 'text-neutral-400 group-hover:text-neutral-900 group-hover:scale-110'}
                          `}>
                            <ImagePlus size={24} strokeWidth={1.5} />
                          </div>
                          <p className="mb-2 text-sm text-neutral-500 font-medium group-hover:text-neutral-900 transition-colors duration-300">
                            <span className="font-semibold">{isDragging ? 'Drop Image Here' : 'Click to upload'}</span> { !isDragging && 'or drag and drop'}
                          </p>
                          <p className="text-[11px] text-neutral-400 uppercase tracking-widest font-semibold">
                            PNG, JPG or WEBP (Max 5MB)
                          </p>
                        </div>
                      )}

                      <input 
                        id="product-image" 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }} 
                      />
                    </label>
                  </div>
                </div>

                {/* PRICING & STOCK */}
                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest ml-1">Inventory & Pricing</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1">Stock Quantity *</label>
                      <input required type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-4 text-neutral-900 placeholder:text-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300 ease-out" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1">Cost Price *</label>
                      <input required type="number" step="0.01" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-4 text-neutral-900 placeholder:text-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300 ease-out" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1">Selling Price *</label>
                      <input required type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-4 text-neutral-900 placeholder:text-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300 ease-out" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3 ml-1">Compare At (Optional)</label>
                      <input type="number" step="0.01" value={formData.compareAtPrice} onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })} className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl px-5 py-4 text-neutral-900 placeholder:text-neutral-300 focus:bg-white focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all duration-300 ease-out line-through decoration-neutral-300" placeholder="0.00" />
                    </div>
                  </div>
                </div>

                {/* SUBMIT SECTION */}
                <div className="pt-10 flex flex-col-reverse sm:flex-row justify-between items-center gap-6 border-t border-neutral-100">
                  <div className="w-full sm:w-auto h-6 flex items-center">
                    {success && (
                      <span className="text-neutral-900 flex items-center gap-2 font-medium bg-neutral-100 px-4 py-2 rounded-full animate-in zoom-in duration-300">
                        <CheckCircle2 size={18} strokeWidth={2} /> Product saved successfully
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-neutral-900 text-white px-10 py-4 rounded-full font-medium hover:bg-black hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 ease-out flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><PackagePlus size={18} /> Save Product</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}