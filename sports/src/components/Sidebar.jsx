import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, ShoppingCart, Package, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'POS', icon: <ShoppingCart size={20} />, path: '/pos' },
    { name: 'Inventory', icon: <Package size={20} />, path: '/inventory' },
    { name: 'Staff', icon: <Users size={20} />, path: '/staff' },
  ];

  return (
    <motion.div 
      animate={{ width: collapsed ? 80 : 250 }}
      className="h-screen bg-brand-panel border-r border-slate-700 flex flex-col text-slate-300 transition-all duration-300"
    >
      <div className="p-4 flex items-center justify-between border-b border-slate-700">
        {!collapsed && <span className="font-bold text-brand-lime text-xl tracking-wider">APEX SPORTS</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-slate-700 rounded text-brand-cyan">
          {collapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path}
            className={({isActive}) => `flex items-center gap-4 p-3 rounded-lg transition-colors ${isActive ? 'bg-slate-700 text-brand-cyan' : 'hover:bg-slate-700 hover:text-white'}`}
          >
            {item.icon}
            {!collapsed && <span className="font-medium">{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </motion.div>
  );
}