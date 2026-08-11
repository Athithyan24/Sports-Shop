import { NavLink } from 'react-router-dom';
import { Mail, Phone, Truck, LogIn, Heart, ShoppingCart } from 'lucide-react';

export default function TopNav() {
  return (
    <header className="w-full bg-brand-white border-b border-brand-border">
      
      {/* GREEN AREA: Top Utility Bar */}
      <div className="flex justify-between items-center px-12 py-3 text-[13px] text-brand-textMuted border-b border-brand-border bg-brand-light">
        
        {/* Left Utilities */}
        <div className="flex gap-8">
          <span className="flex items-center gap-2">
            <Mail size={14} /> info@sportstore.com
          </span>
          <span className="flex items-center gap-2">
            <Phone size={14} /> +0 123-456-789
          </span>
          <span className="flex items-center gap-2">
            <Truck size={14} /> Free shipping
          </span>
        </div>
        
        {/* Right Utilities */}
        <div className="flex gap-8 items-center">
          <button className="flex items-center gap-2 hover:text-brand-textMain transition-colors">
            <LogIn size={14} /> Login or create an account
          </button>
          <button className="flex items-center gap-2 hover:text-brand-textMain transition-colors font-medium">
            {/* Styled Heart Icon mimicking the image */}
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-500">
              <Heart size={12} fill="currentColor" strokeWidth={0} />
            </div>
            Favorites
          </button>
        </div>
      </div>

      {/* BLUE AREA: Main Navigation & Cart */}
      <div className="flex justify-between items-center px-12 py-6">
        
        {/* Logo */}
        <div className="text-4xl font-bold tracking-tighter text-brand-textMain">
          SportStore
        </div>
        
        {/* Navigation Links */}
        <nav className="flex gap-10 text-brand-textMuted font-medium text-[15px]">
          <NavLink to="/" className="hover:text-brand-textMain transition-colors">Dashboard</NavLink>
          <NavLink to="/inventory" className="hover:text-brand-textMain transition-colors">Inventory</NavLink>
          <NavLink to="/categories" className="hover:text-brand-textMain transition-colors">Categories</NavLink>
          <NavLink to="/trophies" className="hover:text-brand-textMain transition-colors">Trophies</NavLink>
          <NavLink to="/form" className="hover:text-brand-textMain transition-colors">Form</NavLink>
          <NavLink to="/pos" className="hover:text-brand-textMain transition-colors">POS</NavLink>
        </nav>

        {/* Stacked Text Cart Button */}
        <button className="flex items-center gap-3 bg-brand-card px-6 py-2.5 rounded-full hover:bg-gray-200 transition-colors text-brand-textMain border border-transparent hover:border-gray-300 shadow-sm">
          <ShoppingCart size={20} className="text-brand-textMain" />
          <div className="text-left leading-[1.1] text-[12px]">
            <span className="block font-medium">Your cart</span>
            <span className="block text-brand-textMuted">is empty</span>
          </div>
        </button>
        
      </div>
    </header>
  );
}