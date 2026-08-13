import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, LogIn, Heart, ShoppingCart, 
  User, LogOut, UserPlus, MapPin, ChevronDown, ShieldCheck,
  Package, LayoutGrid, PlusCircle, Monitor, Users
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

export default function TopNav({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
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
    if (onLogout) onLogout();
    setIsProfileOpen(false);
  };

  // Dynamic Navigation based on actual User Role
  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutGrid },
    { name: 'Inventory', path: '/inventory', icon: Package },
    ...(user?.role === 'admin' 
      ? [{ name: 'Categories', path: '/categories', icon: LayoutGrid }] 
      : []
    ),
    { name: 'Add Product', path: '/form', icon: PlusCircle },
    { name: 'POS', path: '/pos', icon: Monitor },
    ...(user?.role === 'admin' 
      ? [{ name: 'Staff', path: '/staff', icon: Users }] 
      : []
    ),
  ];

  return (
    <header className="w-full sticky top-0 z-50 font-sans antialiased tracking-tight select-none">
      
      {/* 1. TOP UTILITY BAR - Unified & Centered */}
      <div className="relative z-30 flex items-center justify-between gap-4 px-6 lg:px-10 py-2.5 text-[12px] font-medium text-neutral-500 bg-[#F5F5F7] border-b border-black/[0.05]">
        
        {/* Left: Window Controls */}
        <div className="flex items-center gap-2 flex-1">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        
        {/* Center: Search Bar (Lengthened) */}
        <div className="flex-[2] flex justify-center max-w-3xl">
          <div className="w-full bg-white rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm border border-black/5">
            <Search size={15} className="text-neutral-400" />
            <input
              type="text"
              placeholder="Search inventory, categories, or staff..."
              className="w-full bg-transparent text-[13px] outline-none text-neutral-800 placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Right: Utilities & Profile */}
        <div className="flex items-center justify-end gap-5 flex-1">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-neutral-800 font-semibold hover:opacity-75 transition-opacity py-0.5 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#007AFF] text-white flex items-center justify-center shadow-sm">
                  {user.role === 'admin' ? <ShieldCheck size={12} /> : <User size={12} />}
                </div>
                <span>{user.name}</span>
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
                      <p className="text-xs font-bold text-neutral-900 truncate">{user.name}</p>
                      <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        user.role === 'admin' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {user.role.toUpperCase()}
                      </span>
                    </motion.div>

                    {/* Admin Actions */}
                    {user.role === 'admin' && (
                      <div className="py-1">
                        <motion.div variants={itemVariants}>
                          <Link 
                            to="/staff"
                            onClick={() => setIsProfileOpen(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100/80 rounded-lg transition-colors cursor-pointer"
                          >
                            <UserPlus size={14} className="text-[#007AFF]" />
                            Manage Worker IDs
                          </Link>
                        </motion.div>
                        <motion.button variants={itemVariants} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100/80 rounded-lg transition-colors cursor-pointer">
                          <MapPin size={14} className="text-emerald-600" />
                          Configure Shop Address
                        </motion.button>
                      </div>
                    )}

                    <div className="pt-1 mt-1 border-t border-black/[0.06]">
                      <motion.button 
                        variants={itemVariants}
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 transition-colors font-semibold cursor-pointer"
            >
              <LogIn size={13} /> Login or create an account
            </button>
          )}

          <div className="w-px h-3 bg-black/[0.1]"></div>

          <button className="flex items-center gap-1.5 text-neutral-600 hover:text-rose-500 transition-colors font-semibold cursor-pointer">
            <Heart size={13} className="text-rose-500" /> Favorites
          </button>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION */}
      <div className="relative z-10 flex justify-between items-center px-6 lg:px-10 py-4 bg-white/95 backdrop-blur-xl border-b border-black/6 shadow-sm">
        
        {/* Logo */}
        <Link to="/" className="text-3xl font-extralight tracking-tight text-neutral-900 cursor-pointer">
          Sport<span className="text-[#007AFF]">Store</span>
        </Link>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-neutral-100/60 rounded-full border border-black/3">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            
            return (
              <NavLink 
                key={link.name} 
                to={link.path} 
                className="relative px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
                style={{ color: isActive ? '#FFF' : '#6E6E73' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-black rounded-full shadow-sm border border-black/3 -z-10"
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                  />
                )}
                <span className="flex items-center gap-1.5">
                  <Icon size={14} className={isActive ? 'text-white' : ''} />
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
          onClick={() => navigate('/pos')}
          className="flex items-center gap-3 bg-neutral-100/80 px-5 py-2 rounded-full text-neutral-900 border border-black/3 hover:bg-neutral-200/50 transition-colors cursor-pointer"
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