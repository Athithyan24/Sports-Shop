import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Mail, Phone, Truck, LogIn, Heart, ShoppingCart, 
  User, LogOut, UserPlus, MapPin, ChevronDown, ShieldCheck,
  Package, LayoutGrid, PlusCircle, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const appleEase = [0.16, 1, 0.3, 1];

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.95, filter: 'blur(4px)' },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: { duration: 0.25, ease: appleEase, staggerChildren: 0.03 } 
  },
  exit: { 
    opacity: 0, 
    y: -6, 
    scale: 0.95, 
    filter: 'blur(4px)',
    transition: { duration: 0.2, ease: appleEase } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: appleEase } }
};

export default function TopNav() {
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Demo user state
  const [currentUser, setCurrentUser] = useState({
    name: 'System Admin',
    role: 'admin', 
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setIsProfileOpen(false);
  };

  // Corrected Navigation matching your actual project files
  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutGrid },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Categories', path: '/categories', icon: LayoutGrid },
    { name: 'Add Product', path: '/form', icon: PlusCircle },
    { name: 'POS', path: '/pos', icon: Monitor },
  ];

  return (
    <header className="w-full sticky top-0 z-50 font-sans antialiased tracking-tight select-none">
      
      {/* 1. TOP UTILITY BAR (Higher Z-Index layer z-30 so dropdown renders over the main navbar) */}
      <div className="relative z-30 flex justify-between items-center px-6 lg:px-10 py-2 text-[12px] font-medium text-neutral-500 bg-[#F5F5F7] border-b border-black/[0.05]">
        
        {/* Left Utilities */}
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors cursor-pointer">
            <Mail size={13} /> info@sportstore.com
          </span>
          <span className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors cursor-pointer">
            <Phone size={13} /> +0 123-456-789
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <Truck size={13} /> Free shipping
          </span>
        </div>
        
        {/* Right Utilities */}
        <div className="flex gap-5 items-center">
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-neutral-800 font-semibold hover:opacity-75 transition-opacity py-0.5"
              >
                <div className="w-5 h-5 rounded-full bg-[#007AFF] text-white flex items-center justify-center shadow-sm">
                  {currentUser.role === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                </div>
                <span>{currentUser.name}</span>
                <motion.div animate={{ rotate: isProfileOpen ? 180 : 0 }} transition={{ duration: 0.2, ease: appleEase }}>
                  <ChevronDown size={13} className="text-neutral-400" />
                </motion.div>
              </button>

              {/* DROPDOWN MENU */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-black/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.18)] p-2 z-50 origin-top-right overflow-hidden"
                  >
                    {/* User Info Header */}
                    <motion.div variants={itemVariants} className="px-3.5 py-2.5 mb-1 bg-neutral-100/70 rounded-xl">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Signed in as</p>
                      <p className="text-xs font-bold text-neutral-900 truncate">{currentUser.name}</p>
                      <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        currentUser.role === 'admin' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {currentUser.role.toUpperCase()}
                      </span>
                    </motion.div>

                    {/* Admin Actions */}
                    {currentUser.role === 'admin' && (
                      <div className="py-1">
                        <motion.button variants={itemVariants} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100/80 rounded-lg transition-colors">
                          <UserPlus size={14} className="text-[#007AFF]" />
                          Manage Worker IDs
                        </motion.button>
                        <motion.button variants={itemVariants} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100/80 rounded-lg transition-colors">
                          <MapPin size={14} className="text-emerald-600" />
                          Configure Shop Address
                        </motion.button>
                      </div>
                    )}

                    <div className="pt-1 mt-1 border-t border-black/[0.06]">
                      <motion.button 
                        variants={itemVariants}
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <LogOut size={14} />
                        Log Out
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 transition-colors font-semibold">
              <LogIn size={13} /> Login or create an account
            </button>
          )}

          <div className="w-px h-3 bg-black/[0.1]"></div>

          <button className="flex items-center gap-1.5 text-neutral-600 hover:text-rose-500 transition-colors font-semibold">
            <Heart size={13} className="text-rose-500" /> Favorites
          </button>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION (Lower Z-Index layer z-10) */}
      <div className="relative z-10 flex justify-between items-center px-6 lg:px-10 py-4 bg-white/95 backdrop-blur-xl border-b border-black/[0.06] shadow-sm">
        
        {/* Logo */}
        <div className="text-3xl font-bold tracking-tight text-neutral-900">
          Sport<span className="text-[#007AFF]">Store</span>
        </div>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-neutral-100/60 rounded-full border border-black/[0.03]">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <NavLink 
                key={link.name} 
                to={link.path} 
                className="relative px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
                style={{ color: isActive ? '#000' : '#6E6E73' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-white rounded-full shadow-sm border border-black/[0.03] -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="flex items-center gap-1.5">
                  <link.icon size={14} className={isActive ? 'text-[#007AFF]' : ''} />
                  {link.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Cart Button */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 bg-neutral-100/80 px-5 py-2 rounded-full text-neutral-900 border border-black/[0.03] hover:bg-neutral-200/50 transition-colors"
        >
          <div className="relative">
            <ShoppingCart size={17} className="text-neutral-800" />
            <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-[#007AFF] text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white">
              0
            </span>
          </div>
          <div className="text-left leading-tight">
            <span className="block text-[11px] font-bold">Your cart</span>
            <span className="block text-[10px] text-neutral-500 font-medium">is empty</span>
          </div>
        </motion.button>
        
      </div>
    </header>
  );
}